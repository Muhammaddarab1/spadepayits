import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  merchantId: { type: String, required: true, unique: true, index: true }, // Reporting MID
  customerId: { type: String, index: true },
  dba: { type: String, required: true, index: true }, // DBA Name
  legalName: { type: String }, // Legal Business Name
  status: { type: String, default: 'Active' }, // Account Status
  salesCode: { type: String },
  partnerType: { type: String },
  registrationDate: { type: Date },
  backEndPlatform: { type: String },
  mccDescription: { type: String },
  pricingType: { type: String },
  pciCompliance: { type: String },
  mtdVolume: { type: String },
  pciProgram: { type: String },
  email: { type: String },
  phone: { type: String },
  address: { type: String },
  city: { type: String },
  state: { type: String },
  zipCode: { type: String },
  notes: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.model('Customer', customerSchema);
