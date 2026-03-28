import mongoose from 'mongoose';

const supplyRequestSchema = new mongoose.Schema(
  {
    requestId: { type: String, required: true, unique: true, trim: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
    productName: { type: String, required: true, trim: true },
    productCategory: { type: String, trim: true, default: '' },
    quantity: { type: Number, required: true, min: 1 },
    unitCost: { type: Number, default: 0, min: 0 },
    gst: { type: Number, default: 0, min: 0 },
    totalCost: { type: Number, default: 0, min: 0 },
    notes: { type: String, trim: true, default: '' },
    deliveryAddress: { type: String, trim: true, default: '' },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Delivered', 'Completed', 'Rejected'],
      default: 'Pending'
    },
    requestDate: { type: Date, default: Date.now },
    expectedDeliveryDate: { type: Date },
    actualDeliveryDate: { type: Date },
    deliveryNotes: { type: String, trim: true, default: '' },
    statusHistory: [
      {
        status: {
          type: String,
          enum: ['Pending', 'Approved', 'Delivered', 'Completed', 'Rejected'],
          required: true
        },
        updatedAt: { type: Date, default: Date.now },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        updatedByName: { type: String, trim: true, default: '' },
        notes: { type: String, trim: true, default: '' }
      }
    ],
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    staffName: { type: String, required: true, trim: true },
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    supplierName: { type: String, trim: true, default: '' },
    companyName: { type: String, trim: true, default: '' },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedByName: { type: String, trim: true, default: '' },
    approvedAt: { type: Date },
    acceptedAt: { type: Date },
    shippedAt: { type: Date },
    deliveredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    deliveredByName: { type: String, trim: true, default: '' },
    deliveredAt: { type: Date },
    deliveryProofs: {
      type: [
        {
          type: {
            type: String,
            enum: ['invoice', 'challan', 'photo'],
            required: true
          },
          fileName: { type: String, trim: true, required: true },
          mimeType: { type: String, trim: true, required: true },
          dataUrl: { type: String, required: true },
          uploadedAt: { type: Date, default: Date.now }
        }
      ],
      default: []
    },
    inventoryUpdated: { type: Boolean, default: false },
    inventoryUpdatedAt: { type: Date },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    verifiedByName: { type: String, trim: true, default: '' },
    verifiedAt: { type: Date }
  },
  { timestamps: true }
);

supplyRequestSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model('SupplyRequest', supplyRequestSchema);
