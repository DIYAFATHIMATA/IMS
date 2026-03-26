import mongoose from 'mongoose';

const SUPPLIER_CATEGORIES = [
  'Electronics',
  'Office Supplies',
  'Furniture',
  'Stationery',
  'General Goods'
];

const supplierSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      unique: true,
      sparse: true
    },
    companyName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    businessAddress: { type: String, required: true, trim: true },
    supplierCategory: {
      type: String,
      enum: SUPPLIER_CATEGORIES,
      default: 'General Goods',
      required: true
    },
    gstNumber: { type: String, trim: true, default: '' }
  },
  { timestamps: true }
);

supplierSchema.index({ companyName: 1 });
supplierSchema.index({ supplierCategory: 1 });

export default mongoose.model('Supplier', supplierSchema);
export { SUPPLIER_CATEGORIES };
