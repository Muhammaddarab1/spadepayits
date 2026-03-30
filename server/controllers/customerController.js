import Customer from '../models/Customer.js';

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
      success: true, 
      count: createdCount + updatedCount,
      details: { created: createdCount, updated: updatedCount, skipped: skippedCount }
    });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ message: 'Failed to import customers' });
  }
};
