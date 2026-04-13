import Customer from '../models/Customer.js';
import Inventory from '../models/Inventory.js';
import ActivityLog from '../models/ActivityLog.js';

export const listCustomers = async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};
    if (search) {
      query = {
        $or: [
          { merchantId: { $regex: search, $options: 'i' } },
          { dba: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      };
    }
    const customers = await Customer.find(query).sort({ dba: 1 });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: 'Failed to list customers' });
  }
};

export const getCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get customer' });
  }
};

export const createCustomer = async (req, res) => {
  try {
    const customer = await Customer.create({ ...req.body, createdBy: req.user.id });
    res.status(201).json(customer);
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ message: 'Merchant ID already exists' });
    res.status(500).json({ message: 'Failed to create customer' });
  }
};

export const updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update customer' });
  }
};

export const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    res.json({ message: 'Customer deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete customer' });
  }
};

export const importCustomers = async (req, res) => {
  try {
    const { customers } = req.body;
    if (!Array.isArray(customers)) return res.status(400).json({ message: 'Invalid data format' });
    
    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const customerData of customers) {
      const { merchantId, ...rest } = customerData;
      if (!merchantId) {
        skippedCount++;
        continue;
      }

      const existingCustomer = await Customer.findOne({ merchantId });

      if (existingCustomer) {
        // Compare fields to see if update is needed
        let changes = {};
        const existingData = existingCustomer.toObject();

        for (const key in rest) {
          const newVal = rest[key];
          const oldVal = existingData[key];

          // Compare basic values (string, number, dates as strings)
          if (newVal !== undefined && String(newVal) !== String(oldVal || '')) {
            changes[key] = newVal;
          }
        }

        if (Object.keys(changes).length > 0) {
          await Customer.updateOne({ merchantId }, { $set: changes });
          updatedCount++;
        } else {
          skippedCount++;
        }
      } else {
        await Customer.create({ ...customerData, createdBy: req.user.id });
        createdCount++;
      }
    }

    res.json({
      message: `Import complete: ${createdCount} created, ${updatedCount} updated, ${skippedCount} skipped.`
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to import customers' });
  }
};

export const assignDevice = async (req, res) => {
  try {
    const { inventoryId, assignmentType } = req.body;
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    const device = await Inventory.findById(inventoryId);
    if (!device) return res.status(404).json({ message: 'Device not found in inventory' });

    if (device.availableQuantity <= 0) {
      return res.status(400).json({ message: 'No available stock for this device' });
    }

    // Update inventory
    device.availableQuantity -= 1;
    device.assignedQuantity += 1;
    await device.save();

    // Add assignment to customer
    customer.assignedDevices.push({
      inventoryId,
      deviceName: device.deviceName,
      assignmentType,
      assignmentDate: new Date(),
      status: 'Active'
    });
    await customer.save();

    await ActivityLog.create({
      action: 'Device Assigned',
      user: req.user.id,
      details: `Assigned ${device.deviceName} (${assignmentType}) to merchant ${customer.dba}`
    });

    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const returnDevice = async (req, res) => {
  try {
    const { assignmentId, returnReason } = req.body; // returnReason: 'OK', 'Faulty'
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    const assignment = customer.assignedDevices.id(assignmentId);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

    if (assignment.status === 'Returned') {
      return res.status(400).json({ message: 'Device already returned' });
    }

    const device = await Inventory.findById(assignment.inventoryId);
    if (!device) return res.status(404).json({ message: 'Device not found in inventory' });

    // Update assignment status
    assignment.status = 'Returned';
    
    // Update inventory
    device.assignedQuantity -= 1;
    device.underInspectionQuantity += 1;
    await device.save();

    await customer.save();

    await ActivityLog.create({
      action: 'Device Returned',
      user: req.user.id,
      details: `Device ${device.deviceName} returned from merchant ${customer.dba}. Moved to Under Inspection.`
    });

    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const processInspection = async (req, res) => {
  try {
    const { inventoryId, result } = req.body; // result: 'OK', 'Faulty'
    const device = await Inventory.findById(inventoryId);
    if (!device) return res.status(404).json({ message: 'Device not found' });

    if (device.underInspectionQuantity <= 0) {
      return res.status(400).json({ message: 'No devices under inspection' });
    }

    device.underInspectionQuantity -= 1;
    if (result === 'OK') {
      device.availableQuantity += 1;
    } else {
      device.faultyQuantity += 1;
    }
    await device.save();

    await ActivityLog.create({
      action: 'Inspection Complete',
      user: req.user.id,
      details: `Inspection for ${device.deviceName} complete. Result: ${result}`
    });

    res.json(device);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const replaceDevice = async (req, res) => {
  try {
    const { oldAssignmentId, newInventoryId, assignmentType } = req.body;
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    const oldAssignment = customer.assignedDevices.id(oldAssignmentId);
    if (!oldAssignment) return res.status(404).json({ message: 'Old assignment not found' });

    const newDevice = await Inventory.findById(newInventoryId);
    if (!newDevice) return res.status(404).json({ message: 'New device not found' });

    if (newDevice.availableQuantity <= 0) {
      return res.status(400).json({ message: 'No available stock for the new device' });
    }

    // 1. Process the old device return
    const oldDevice = await Inventory.findById(oldAssignment.inventoryId);
    if (oldDevice) {
      oldDevice.assignedQuantity -= 1;
      oldDevice.underInspectionQuantity += 1;
      await oldDevice.save();
    }
    oldAssignment.status = 'Replaced';

    // 2. Assign the new device
    newDevice.availableQuantity -= 1;
    newDevice.assignedQuantity += 1;
    await newDevice.save();

    customer.assignedDevices.push({
      inventoryId: newInventoryId,
      deviceName: newDevice.deviceName,
      assignmentType,
      assignmentDate: new Date(),
      status: 'Active',
      replacementFor: oldAssignmentId
    });

    await customer.save();

    await ActivityLog.create({
      action: 'Device Replaced',
      user: req.user.id,
      details: `Replaced ${oldAssignment.deviceName} with ${newDevice.deviceName} for merchant ${customer.dba}`
    });

    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
