import { Router } from 'express';
import Supplier, { SUPPLIER_CATEGORIES } from '../models/Supplier.js';
import User from '../models/User.js';
import {
  requireAuth,
  requireRoles,
  ROLE_ADMIN,
  ROLE_STAFF,
  ROLE_SUPPLIER
} from '../middleware/auth.middleware.js';

const router = Router();
const PHONE_REGEX = /^[0-9+()\-\s]{7,15}$/;

const normalizeSupplierCategory = (value) => {
  const category = String(value || '').trim();
  if (!category) return 'General Goods';
  return SUPPLIER_CATEGORIES.includes(category) ? category : null;
};

const ensureSupplierPayload = ({ companyName, phone, businessAddress, supplierCategory }) => {
  if (!companyName || !String(companyName).trim()) {
    return 'companyName is required';
  }
  if (!phone || !PHONE_REGEX.test(String(phone).trim())) {
    return 'Valid phone is required';
  }
  if (!businessAddress || !String(businessAddress).trim()) {
    return 'businessAddress is required';
  }
  const normalizedCategory = normalizeSupplierCategory(supplierCategory);
  if (!normalizedCategory) {
    return 'Invalid supplier category';
  }
  return null;
};

const toSupplierDTO = (supplier, user) => ({
  _id: supplier._id,
  userId: supplier.userId || null,
  userName: user?.name || '',
  userEmail: user?.email || '',
  companyName: supplier.companyName,
  phone: supplier.phone,
  businessAddress: supplier.businessAddress,
  supplierCategory: supplier.supplierCategory,
  gstNumber: supplier.gstNumber || '',
  createdAt: supplier.createdAt,
  updatedAt: supplier.updatedAt,
  // Backward-compatible aliases for existing vendor tables.
  name: supplier.companyName,
  contact: supplier.phone,
  gst: supplier.gstNumber || '',
  address: supplier.businessAddress,
  email: user?.email || ''
});

router.use(requireAuth);

router.post('/', requireRoles(ROLE_ADMIN, ROLE_STAFF), async (req, res) => {
  try {
    const { userId, companyName, phone, businessAddress, supplierCategory, gstNumber } = req.body || {};

    const payloadError = ensureSupplierPayload({ companyName, phone, businessAddress, supplierCategory });
    if (payloadError) {
      return res.status(400).json({ success: false, message: payloadError });
    }

    let linkedUser = null;
    if (userId) {
      linkedUser = await User.findById(userId);
      if (!linkedUser) {
        return res.status(404).json({ success: false, message: 'Linked user not found' });
      }
      if (linkedUser.role !== ROLE_SUPPLIER) {
        return res.status(400).json({ success: false, message: 'Linked user must have supplier role' });
      }

      const existingLink = await Supplier.findOne({ userId: linkedUser._id });
      if (existingLink) {
        return res.status(409).json({ success: false, message: 'Supplier profile already exists for this user' });
      }
    }

    const created = await Supplier.create({
      userId: linkedUser?._id || null,
      companyName: String(companyName).trim(),
      phone: String(phone).trim(),
      businessAddress: String(businessAddress).trim(),
      supplierCategory: normalizeSupplierCategory(supplierCategory),
      gstNumber: String(gstNumber || '').trim()
    });

    return res.status(201).json({ success: true, data: toSupplierDTO(created.toObject(), linkedUser) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/', requireRoles(ROLE_ADMIN, ROLE_STAFF, ROLE_SUPPLIER), async (req, res) => {
  try {
    const { category = '', search = '', userId = '' } = req.query;
    const query = {};

    if (req.auth.role === ROLE_SUPPLIER) {
      query.userId = req.auth.sub;
    } else if (String(userId).trim()) {
      query.userId = String(userId).trim();
    }

    if (String(category).trim()) {
      const normalizedCategory = normalizeSupplierCategory(category);
      if (!normalizedCategory) {
        return res.status(400).json({ success: false, message: 'Invalid supplier category filter' });
      }
      query.supplierCategory = normalizedCategory;
    }

    if (String(search).trim()) {
      const term = String(search).trim();
      query.$or = [
        { companyName: { $regex: term, $options: 'i' } },
        { phone: { $regex: term, $options: 'i' } },
        { businessAddress: { $regex: term, $options: 'i' } },
        { gstNumber: { $regex: term, $options: 'i' } }
      ];
    }

    const suppliers = await Supplier.find(query).sort({ createdAt: -1 }).lean();
    const userIds = suppliers.map((s) => s.userId).filter(Boolean);
    const users = userIds.length
      ? await User.find({ _id: { $in: userIds } }, { name: 1, email: 1 }).lean()
      : [];
    const userMap = new Map(users.map((u) => [String(u._id), u]));

    return res.status(200).json({
      success: true,
      data: suppliers.map((supplier) => toSupplierDTO(supplier, userMap.get(String(supplier.userId))))
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id', requireRoles(ROLE_ADMIN, ROLE_STAFF, ROLE_SUPPLIER), async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id).lean();
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    if (req.auth.role === ROLE_SUPPLIER && String(supplier.userId || '') !== String(req.auth.sub)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const linkedUser = supplier.userId
      ? await User.findById(supplier.userId, { name: 1, email: 1 }).lean()
      : null;

    return res.status(200).json({ success: true, data: toSupplierDTO(supplier, linkedUser) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', requireRoles(ROLE_ADMIN, ROLE_STAFF, ROLE_SUPPLIER), async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    if (req.auth.role === ROLE_SUPPLIER && String(supplier.userId || '') !== String(req.auth.sub)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const nextCompanyName = String(req.body?.companyName ?? supplier.companyName).trim();
    const nextPhone = String(req.body?.phone ?? supplier.phone).trim();
    const nextBusinessAddress = String(req.body?.businessAddress ?? supplier.businessAddress).trim();
    const nextCategory = normalizeSupplierCategory(req.body?.supplierCategory ?? supplier.supplierCategory);

    const payloadError = ensureSupplierPayload({
      companyName: nextCompanyName,
      phone: nextPhone,
      businessAddress: nextBusinessAddress,
      supplierCategory: nextCategory
    });
    if (payloadError) {
      return res.status(400).json({ success: false, message: payloadError });
    }

    supplier.companyName = nextCompanyName;
    supplier.phone = nextPhone;
    supplier.businessAddress = nextBusinessAddress;
    supplier.supplierCategory = nextCategory;
    if (req.body?.gstNumber !== undefined) {
      supplier.gstNumber = String(req.body.gstNumber || '').trim();
    }

    if (req.auth.role !== ROLE_SUPPLIER && req.body?.userId !== undefined) {
      if (req.body.userId) {
        const linkedUser = await User.findById(req.body.userId);
        if (!linkedUser) {
          return res.status(404).json({ success: false, message: 'Linked user not found' });
        }
        if (linkedUser.role !== ROLE_SUPPLIER) {
          return res.status(400).json({ success: false, message: 'Linked user must have supplier role' });
        }
        const duplicate = await Supplier.findOne({ userId: linkedUser._id, _id: { $ne: supplier._id } });
        if (duplicate) {
          return res.status(409).json({ success: false, message: 'Supplier profile already exists for this user' });
        }
        supplier.userId = linkedUser._id;
      } else {
        supplier.userId = null;
      }
    }

    await supplier.save();

    const user = supplier.userId ? await User.findById(supplier.userId, { name: 1, email: 1 }).lean() : null;
    return res.status(200).json({ success: true, data: toSupplierDTO(supplier.toObject(), user) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
