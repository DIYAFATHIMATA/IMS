import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['admin', 'staff', 'supplier'], required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    type: { type: String, trim: true, default: 'info' },
    title: { type: String, trim: true, required: true },
    message: { type: String, trim: true, required: true },
    isRead: { type: Boolean, default: false },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

notificationSchema.index({ role: 1, userId: 1, isRead: 1, createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);
