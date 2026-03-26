import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema(
  {
    action: { type: String, required: true, trim: true },
    details: { type: String, trim: true, default: '' },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    actorName: { type: String, trim: true, default: '' },
    actorRole: { type: String, trim: true, default: '' },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ actorRole: 1, createdAt: -1 });

export default mongoose.model('ActivityLog', activityLogSchema);
