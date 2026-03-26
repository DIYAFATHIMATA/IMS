import { Router } from 'express';
import ActivityLog from '../models/ActivityLog.js';
import { requireAuth, requireRoles, ROLE_ADMIN } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth, requireRoles(ROLE_ADMIN));

router.get('/', async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit || 100), 1), 500);
    const logs = await ActivityLog.find({}).sort({ createdAt: -1 }).limit(limit).lean();
    return res.status(200).json({ success: true, data: logs });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
