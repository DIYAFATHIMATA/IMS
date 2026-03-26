import Notification from '../models/Notification.js';

export const createNotification = async ({ role, userId = null, type = 'info', title, message, metadata = {} }) => {
  try {
    await Notification.create({ role, userId, type, title, message, metadata });
  } catch (_error) {
    // Notifications are non-blocking.
  }
};

export const createBulkRoleNotifications = async ({ roles = [], type = 'info', title, message, metadata = {} }) => {
  try {
    const docs = roles.map((role) => ({ role, type, title, message, metadata }));
    if (docs.length > 0) {
      await Notification.insertMany(docs);
    }
  } catch (_error) {
    // Non-blocking.
  }
};
