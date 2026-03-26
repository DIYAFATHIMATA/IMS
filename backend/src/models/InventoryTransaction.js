import mongoose from 'mongoose';

const inventoryTransactionSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    action: {
      type: String,
      enum: ['added', 'sold', 'restocked', 'adjusted'],
      required: true
    },
    quantityChange: { type: Number, required: true },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    performedByName: { type: String, trim: true, default: '' },
    reference: { type: String, trim: true, default: '' },
    notes: { type: String, trim: true, default: '' },
    timestamp: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

inventoryTransactionSchema.index({ productId: 1, timestamp: -1 });
inventoryTransactionSchema.index({ action: 1, timestamp: -1 });

export default mongoose.model('InventoryTransaction', inventoryTransactionSchema);
