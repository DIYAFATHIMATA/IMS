import { Router } from 'express';
import Supplier from '../models/Supplier.js';
import Category from '../models/Category.js';
import {
  requireAuth,
  requireRoles,
  ROLE_ADMIN,
  ROLE_STAFF
} from '../middleware/auth.middleware.js';

const router = Router();

const ALLOWED_KEYS = new Set([
  'ims_categories',
  'ims_suppliers'
]);

router.use(requireAuth);

const DEDICATED_MODEL_BY_KEY = {
  ims_suppliers: Supplier,
  ims_categories: Category
};

const toSupplierClient = (doc) => ({
  _id: doc._id,
  userId: doc.userId || null,
  companyName: doc.companyName || '',
  phone: doc.phone || '',
  businessAddress: doc.businessAddress || '',
  supplierCategory: doc.supplierCategory || 'General Goods',
  gstNumber: doc.gstNumber || '',
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
  // Backward-compatible fields used by existing Suppliers page.
  name: doc.companyName || '',
  contact: doc.phone || '',
  gst: doc.gstNumber || '',
  address: doc.businessAddress || '',
  email: ''
});

const ensureAllowedKey = (resourceKey, res) => {
  if (!ALLOWED_KEYS.has(resourceKey)) {
    res.status(400).json({ success: false, message: 'Unsupported resource key' });
    return false;
  }
  return true;
};

const toClientFromDedicated = (resourceKey, doc) => {
  if (resourceKey === 'ims_suppliers') {
    return toSupplierClient(doc);
  }
  return {
    _id: doc._id,
    ...doc,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  };
};

const normalizeBodyForResource = (resourceKey, body = {}) => {
  if (resourceKey !== 'ims_suppliers') {
    return body;
  }

  return {
    companyName: String(body.companyName || body.name || '').trim(),
    phone: String(body.phone || body.contact || '').trim(),
    businessAddress: String(body.businessAddress || body.address || '').trim(),
    supplierCategory: String(body.supplierCategory || 'General Goods').trim(),
    gstNumber: String(body.gstNumber || body.gst || '').trim()
  };
};

router.get('/:resourceKey', requireRoles(ROLE_ADMIN, ROLE_STAFF), async (req, res) => {
  try {
    const { resourceKey } = req.params;
    if (!ensureAllowedKey(resourceKey, res)) return;

    const DedicatedModel = DEDICATED_MODEL_BY_KEY[resourceKey];
    const entries = await DedicatedModel.find({}).sort({ createdAt: -1 }).lean();
    return res.status(200).json({ success: true, data: entries.map((entry) => toClientFromDedicated(resourceKey, entry)) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/:resourceKey', requireRoles(ROLE_STAFF), async (req, res) => {
  try {
    const { resourceKey } = req.params;
    if (!ensureAllowedKey(resourceKey, res)) return;

    const DedicatedModel = DEDICATED_MODEL_BY_KEY[resourceKey];
    const created = await DedicatedModel.create(normalizeBodyForResource(resourceKey, req.body || {}));
    return res.status(201).json({ success: true, data: toClientFromDedicated(resourceKey, created.toObject()) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.patch('/:resourceKey/:id', requireRoles(ROLE_STAFF), async (req, res) => {
  try {
    const { resourceKey, id } = req.params;
    if (!ensureAllowedKey(resourceKey, res)) return;

    const DedicatedModel = DEDICATED_MODEL_BY_KEY[resourceKey];
    const updated = await DedicatedModel.findByIdAndUpdate(
      id,
      { $set: normalizeBodyForResource(resourceKey, req.body || {}) },
      { new: true, runValidators: true }
    ).lean();

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Record not found' });
    }

    return res.status(200).json({ success: true, data: toClientFromDedicated(resourceKey, updated) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:resourceKey/:id', requireRoles(ROLE_STAFF), async (req, res) => {
  try {
    const { resourceKey, id } = req.params;
    if (!ensureAllowedKey(resourceKey, res)) return;

    const DedicatedModel = DEDICATED_MODEL_BY_KEY[resourceKey];
    const deleted = await DedicatedModel.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Record not found' });
    }

    return res.status(200).json({ success: true, message: 'Record deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
