import { Router } from 'express';
import Notification from '../models/Notification.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit || 50), 1), 200);
    const role = req.auth.role;
    const userId = req.auth.sub;

    const notifications = await Notification.find({
      $or: [
        { role, userId: null },
        { role, userId }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.patch('/:id/read', async (req, res) => {
  try {
    const role = req.auth.role;
    const userId = req.auth.sub;

    const updated = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        $or: [
          { role, userId: null },
          { role, userId }
        ]
      },
      { $set: { isRead: true } },
      { new: true }
    ).lean();

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.patch('/read-all', async (req, res) => {
  try {
    const role = req.auth.role;
    const userId = req.auth.sub;

    const result = await Notification.updateMany(
      {
        $or: [
          { role, userId: null },
          { role, userId }
        ],
        isRead: false
      },
      { $set: { isRead: true } }
    );

    return res.status(200).json({
      success: true,
      data: { modifiedCount: Number(result.modifiedCount || 0) }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
