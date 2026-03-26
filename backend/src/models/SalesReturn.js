import mongoose from 'mongoose';

const salesReturnSchema = new mongoose.Schema(
  {
    returnId: { type: String, required: true, trim: true, unique: true },
    customer: { type: String, required: true, trim: true },
    invoiceId: { type: String, trim: true, default: '' },
    productId: { type: String, trim: true, default: '' },
    productName: { type: String, trim: true, default: '' },
    quantity: { type: Number, default: 1 },
    reason: { type: String, trim: true, default: '' },
    refundAmount: { type: Number, default: 0 },
    purchaseDate: { type: Date },
    returnDate: { type: Date, default: Date.now },
    status: { type: String, default: 'Accepted' }
  },
  { timestamps: true }
);

export default mongoose.model('SalesReturn', salesReturnSchema);
