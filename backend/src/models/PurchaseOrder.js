import mongoose from 'mongoose';

const purchaseOrderSchema = new mongoose.Schema(
  {
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
    supplierName: { type: String, trim: true, default: '' },
    items: { type: [mongoose.Schema.Types.Mixed], default: [] },
    subtotal: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    date: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export default mongoose.model('PurchaseOrder', purchaseOrderSchema);
