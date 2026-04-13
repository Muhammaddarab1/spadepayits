import Inventory from '../models/Inventory.js';
import ActivityLog from '../models/ActivityLog.js';

export const listInventory = async (req, res) => {
  try {
    const inventory = await Inventory.find().sort({ deviceName: 1 });
    res.json(inventory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createOrUpdateDevice = async (req, res) => {
  try {
    const { deviceName, totalQuantity, availableQuantity, assignedQuantity, faultyQuantity, underInspectionQuantity } = req.body;
    
    let device = await Inventory.findOne({ deviceName });
    
    if (device) {
      device.totalQuantity = totalQuantity ?? device.totalQuantity;
      device.availableQuantity = availableQuantity ?? device.availableQuantity;
      device.assignedQuantity = assignedQuantity ?? device.assignedQuantity;
      device.faultyQuantity = faultyQuantity ?? device.faultyQuantity;
      device.underInspectionQuantity = underInspectionQuantity ?? device.underInspectionQuantity;
      device.lastUpdatedBy = req.user.id;
      await device.save();
    } else {
      device = await Inventory.create({
        deviceName,
        totalQuantity: totalQuantity || 0,
        availableQuantity: availableQuantity || totalQuantity || 0,
        assignedQuantity: assignedQuantity || 0,
        faultyQuantity: faultyQuantity || 0,
        underInspectionQuantity: underInspectionQuantity || 0,
        lastUpdatedBy: req.user.id
      });
    }
    
    await ActivityLog.create({
      action: 'Inventory Update',
      user: req.user.id,
      details: `Updated inventory for ${deviceName}: Total=${device.totalQuantity}, Available=${device.availableQuantity}`
    });

    res.json(device);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteDevice = async (req, res) => {
  try {
    const device = await Inventory.findById(req.params.id);
    if (!device) return res.status(404).json({ message: 'Device not found' });
    
    if (device.assignedQuantity > 0) {
      return res.status(400).json({ message: 'Cannot delete device with active assignments' });
    }
    
    await Inventory.findByIdAndDelete(req.params.id);
    res.json({ message: 'Device deleted from inventory' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
