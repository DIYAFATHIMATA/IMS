import mongoose from 'mongoose';

const billSchema = new mongoose.Schema(
  {
    billId: { type: String, required: true, trim: true, unique: true },
    supplier: { type: String, required: true, trim: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
    productName: { type: String, trim: true, default: '' },
    quantity: { type: Number, default: 0 },
    amount: { type: Number, required: true, default: 0 },
    dueDate: { type: Date },
    status: { type: String, required: true, trim: true }
  },
  { timestamps: true }
);

export default mongoose.model('Bill', billSchema);
