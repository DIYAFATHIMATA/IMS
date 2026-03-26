import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema(
  {
    invoiceId: { type: String, required: true, trim: true, unique: true },
    customerName: { type: String, required: true, trim: true },
    subtotal: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true, default: 0 },
    status: { type: String, default: 'Paid' },
    date: { type: Date, default: Date.now },
    items: { type: [mongoose.Schema.Types.Mixed], default: [] }
  },
  { timestamps: true }
);

export default mongoose.model('Invoice', invoiceSchema);
