import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  // Unique Identifier
  merchantId: { type: String, required: true, unique: true, index: true }, // MID
  
  // Basic Info
  status: { type: String, default: 'Active' }, // Account Status
  customerId: { type: String, index: true },
  legalName: { type: String }, // Legal Business Name
  dba: { type: String, required: true, index: true }, // DBA Name
  salesCode: { type: String },
  partnerType: { type: String },
  createdDate: { type: Date }, // Created Date from Excel
  backEndPlatform: { type: String },
  mccDescription: { type: String },
  mcc: { type: String },
  transactionMethod: { type: String },
  accountId: { type: String },
  contactName: { type: String },
  phone: { type: String },
  email: { type: String },
  businessAddress: { type: String },
  businessCity: { type: String },
  businessState: { type: String },
  businessZip: { type: String },
  mailingAddress: { type: String },
  ownerName: { type: String },
  accountType: { type: String },
  dateBoarded: { type: Date },
  partnerName: { type: String },
  statusReason: { type: String },
  diligenceDeclineStatus: { type: String },

  // Metadata
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.model('Customer', customerSchema);
