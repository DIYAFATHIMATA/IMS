import ActivityLog from '../models/ActivityLog.js';

export const logActivity = async ({ action, details, actor, metadata = {} }) => {
  try {
    await ActivityLog.create({
      action,
      details,
      actorId: actor?.sub || undefined,
      actorName: actor?.name || actor?.email || '',
      actorRole: actor?.role || '',
      metadata
    });
  } catch (_error) {
    // Logging must never block primary API flow.
  }
};
