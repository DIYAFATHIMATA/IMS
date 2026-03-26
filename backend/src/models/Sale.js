import mongoose from 'mongoose';

const saleSchema = new mongoose.Schema(
  {
    saleId: { type: String, required: true, unique: true, trim: true },
    invoiceId: { type: String, required: true, trim: true },
    customerName: { type: String, required: true, trim: true },
    subtotal: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true, default: 0 },
    paymentMode: { type: String, trim: true, default: 'Cash' },
    items: { type: [mongoose.Schema.Types.Mixed], default: [] },
    date: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

saleSchema.index({ date: -1 });

export default mongoose.model('Sale', saleSchema);
