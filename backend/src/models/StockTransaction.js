import mongoose from 'mongoose';

const stockTransactionSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    productName: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['IN', 'OUT'],
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 0
    },
    reference: {
      type: String,
      required: true,
      trim: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model('StockTransaction', stockTransactionSchema);
