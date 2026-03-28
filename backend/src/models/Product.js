import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      required: true,
      trim: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    costPrice: {
      type: Number,
      required: true,
      min: 0
    },
    stock: {
      type: Number,
      required: true,
      min: 0
    },
    minStockLevel: {
      type: Number,
      required: true,
      min: 0,
      default: 5
    },
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      default: null
    },
    companyName: {
      type: String,
      default: ''
    },
    gst: {
      type: Number,
      required: true,
      enum: [0, 5, 12, 18, 28]
    },
    sku: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model('Product', productSchema);
