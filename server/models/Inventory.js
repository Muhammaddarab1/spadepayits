import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema({
  deviceName: { type: String, required: true, unique: true },
  totalQuantity: { type: Number, default: 0 },
  availableQuantity: { type: Number, default: 0 },
  assignedQuantity: { type: Number, default: 0 },
  faultyQuantity: { type: Number, default: 0 },
  underInspectionQuantity: { type: Number, default: 0 },
  lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.model('Inventory', inventorySchema);
