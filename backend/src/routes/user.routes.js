import { Router } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Supplier, { SUPPLIER_CATEGORIES } from '../models/Supplier.js';
import { requireAdmin, requireAuth, requireRoles, ROLE_SUPPLIER } from '../middleware/auth.middleware.js';
import { toSafeUser } from '../utils/auth.js';
import { logActivity } from '../utils/activityLog.js';

const router = Router();

const PHONE_REGEX = /^[0-9+()\-\s]{7,15}$/;

const normalizeSupplierCategory = (value) => {
  const category = String(value || '').trim();
  if (!category) return 'General Goods';
  return SUPPLIER_CATEGORIES.includes(category) ? category : null;
};

const toUserWithSupplier = (user, supplier) => ({
  ...toSafeUser(user),
  phone: supplier?.phone || '',
  companyName: supplier?.companyName || '',
  businessAddress: supplier?.businessAddress || '',
  supplierCategory: supplier?.supplierCategory || '',
  gstNumber: supplier?.gstNumber || ''
});

router.use(requireAuth);

router.get('/profile', async (req, res) => {
  try {
    const user = await User.findById(req.auth.sub);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.role === ROLE_SUPPLIER) {
      const supplier = await Supplier.findOne({ userId: user._id }).lean();
      return res.status(200).json({ success: true, data: toUserWithSupplier(user, supplier) });
    }

    return res.status(200).json({ success: true, data: toSafeUser(user) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/profile', async (req, res) => {
  try {
    const { name, phone, companyName, businessAddress, supplierCategory, gstNumber } = req.body;
    const user = await User.findById(req.auth.sub);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (typeof name === 'string' && !name.trim()) {
      return res.status(400).json({ success: false, message: 'name is required' });
    }

    if (typeof name === 'string') {
      user.name = name.trim();
    }
    await user.save();

    if (user.role !== ROLE_SUPPLIER) {
      await logActivity({
        action: 'PROFILE_UPDATED',
        details: `Profile updated for ${user.email}`,
        actor: req.auth,
        metadata: { userId: user._id }
      });

      return res.status(200).json({ success: true, data: toSafeUser(user) });
    }

    if (typeof phone === 'string' && phone.trim() && !PHONE_REGEX.test(phone.trim())) {
      return res.status(400).json({ success: false, message: 'Invalid phone number format' });
    }

    const normalizedCategory = normalizeSupplierCategory(supplierCategory);
    if (supplierCategory !== undefined && !normalizedCategory) {
      return res.status(400).json({ success: false, message: 'Invalid supplier category' });
    }

    if (typeof companyName === 'string' && !companyName.trim()) {
      return res.status(400).json({ success: false, message: 'companyName is required' });
    }

    if (typeof businessAddress === 'string' && !businessAddress.trim()) {
      return res.status(400).json({ success: false, message: 'businessAddress is required' });
    }

    const existingSupplier = await Supplier.findOne({ userId: user._id });
    const nextSupplier = existingSupplier || new Supplier({
      userId: user._id,
      companyName: user.name,
      phone: '',
      businessAddress: 'Not provided',
      supplierCategory: 'General Goods'
    });

    if (typeof phone === 'string') {
      nextSupplier.phone = phone.trim();
    }
    if (typeof companyName === 'string') {
      nextSupplier.companyName = companyName.trim();
    }
    if (typeof businessAddress === 'string') {
      nextSupplier.businessAddress = businessAddress.trim();
    }
    if (supplierCategory !== undefined) {
      nextSupplier.supplierCategory = normalizedCategory;
    }
    if (typeof gstNumber === 'string') {
      nextSupplier.gstNumber = gstNumber.trim();
    }

    if (!nextSupplier.companyName || !nextSupplier.businessAddress || !nextSupplier.phone) {
      return res.status(400).json({ success: false, message: 'companyName, phone and businessAddress are required' });
    }

    await nextSupplier.save();

    await logActivity({
      action: 'SUPPLIER_PROFILE_UPDATED',
      details: `Supplier profile updated for ${user.email}`,
      actor: req.auth,
      metadata: { userId: user._id }
    });

    return res.status(200).json({ success: true, data: toUserWithSupplier(user, nextSupplier.toObject()) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'currentPassword and newPassword are required' });
    }

    if (newPassword.length < 8 || !/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters and include letters and numbers' });
    }

    if (typeof confirmPassword === 'string' && newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Password confirmation does not match' });
    }

    const user = await User.findById(req.auth.sub);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isHashedPassword = typeof user.password === 'string' && user.password.startsWith('$2');
    let isValidCurrent = false;
    if (isHashedPassword) {
      isValidCurrent = await bcrypt.compare(currentPassword, user.password);
    } else {
      isValidCurrent = currentPassword === user.password;
    }

    if (!isValidCurrent) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    await logActivity({
      action: user.role === ROLE_SUPPLIER ? 'SUPPLIER_PASSWORD_CHANGED' : 'PASSWORD_CHANGED',
      details: `Password changed for ${user.email}`,
      actor: req.auth,
      metadata: { userId: user._id }
    });

    return res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.use(requireAdmin);

router.get('/', async (_req, res) => {
  try {
    const users = await User.find({}, { password: 0 }).sort({ createdAt: -1 });
    const supplierProfiles = await Supplier.find({ userId: { $ne: null } }).lean();
    const supplierByUserId = new Map(supplierProfiles.map((profile) => [String(profile.userId), profile]));
    const data = users.map((user) => toUserWithSupplier(user, supplierByUserId.get(String(user._id))));
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      phone,
      companyName,
      businessAddress,
      supplierCategory,
      gstNumber
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'name, email and password are required'
      });
    }

    if (role && !['staff', 'supplier'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Only staff or supplier roles can be created' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      return res.status(409).json({ success: false, message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const normalizedRole = role || 'staff';

    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: normalizedRole,
      isActive: true
    });

    let supplierProfile = null;
    if (normalizedRole === 'supplier') {
      const normalizedCategory = normalizeSupplierCategory(supplierCategory);
      if (!normalizedCategory) {
        await User.findByIdAndDelete(newUser._id);
        return res.status(400).json({ success: false, message: 'Invalid supplier category' });
      }
      if (!companyName || !String(companyName).trim()) {
        await User.findByIdAndDelete(newUser._id);
        return res.status(400).json({ success: false, message: 'companyName is required for supplier' });
      }
      if (!phone || !PHONE_REGEX.test(String(phone).trim())) {
        await User.findByIdAndDelete(newUser._id);
        return res.status(400).json({ success: false, message: 'Valid phone is required for supplier' });
      }
      if (!businessAddress || !String(businessAddress).trim()) {
        await User.findByIdAndDelete(newUser._id);
        return res.status(400).json({ success: false, message: 'businessAddress is required for supplier' });
      }

      supplierProfile = await Supplier.create({
        userId: newUser._id,
        companyName: String(companyName).trim(),
        phone: String(phone).trim(),
        businessAddress: String(businessAddress).trim(),
        supplierCategory: normalizedCategory,
        gstNumber: String(gstNumber || '').trim()
      });
    }

    const safeUser = toUserWithSupplier(newUser, supplierProfile?.toObject());

    await logActivity({
      action: 'USER_CREATED',
      details: `Created ${safeUser.role} account ${safeUser.email}`,
      actor: req.auth,
      metadata: { userId: safeUser._id, role: safeUser.role }
    });

    return res.status(201).json({ success: true, data: safeUser });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      phone,
      role,
      password,
      isActive,
      companyName,
      businessAddress,
      supplierCategory,
      gstNumber
    } = req.body;
    const existingUser = await User.findById(id);

    if (!existingUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (existingUser.role === 'admin') {
      return res.status(403).json({ success: false, message: 'Admin accounts cannot be modified here' });
    }

    if (email && email.toLowerCase() !== existingUser.email) {
      const duplicateUser = await User.findOne({ email: email.toLowerCase(), _id: { $ne: id } });
      if (duplicateUser) {
        return res.status(409).json({ success: false, message: 'Email already in use' });
      }
    }

    if (typeof name === 'string') {
      existingUser.name = name;
    }
    if (typeof email === 'string') {
      existingUser.email = email.toLowerCase();
    }
    const nextRole = typeof role === 'string' ? role : existingUser.role;
    if (typeof role === 'string') {
      if (!['staff', 'supplier'].includes(role)) {
        return res.status(400).json({ success: false, message: 'Role must be staff or supplier' });
      }
      existingUser.role = role;
    }
    if (typeof isActive === 'boolean') {
      existingUser.isActive = isActive;
    }
    if (typeof password === 'string' && password.trim().length > 0) {
      existingUser.password = await bcrypt.hash(password, 10);
    }

    await existingUser.save();

    let supplierProfile = await Supplier.findOne({ userId: existingUser._id });
    if (nextRole === 'supplier') {
      const normalizedCategory = normalizeSupplierCategory(supplierCategory ?? supplierProfile?.supplierCategory);
      if (!normalizedCategory) {
        return res.status(400).json({ success: false, message: 'Invalid supplier category' });
      }

      const nextPhone = typeof phone === 'string' ? phone.trim() : (supplierProfile?.phone || '');
      if (!nextPhone || !PHONE_REGEX.test(nextPhone)) {
        return res.status(400).json({ success: false, message: 'Valid phone is required for supplier' });
      }

      const nextCompanyName = typeof companyName === 'string'
        ? companyName.trim()
        : (supplierProfile?.companyName || existingUser.name);
      const nextBusinessAddress = typeof businessAddress === 'string'
        ? businessAddress.trim()
        : (supplierProfile?.businessAddress || 'Not provided');

      if (!nextCompanyName) {
        return res.status(400).json({ success: false, message: 'companyName is required for supplier' });
      }
      if (!nextBusinessAddress) {
        return res.status(400).json({ success: false, message: 'businessAddress is required for supplier' });
      }

      if (!supplierProfile) {
        supplierProfile = new Supplier({
          userId: existingUser._id,
          companyName: nextCompanyName,
          phone: nextPhone,
          businessAddress: nextBusinessAddress,
          supplierCategory: normalizedCategory,
          gstNumber: typeof gstNumber === 'string' ? gstNumber.trim() : ''
        });
      } else {
        supplierProfile.companyName = nextCompanyName;
        supplierProfile.phone = nextPhone;
        supplierProfile.businessAddress = nextBusinessAddress;
        supplierProfile.supplierCategory = normalizedCategory;
        if (typeof gstNumber === 'string') {
          supplierProfile.gstNumber = gstNumber.trim();
        }
      }
      await supplierProfile.save();
    }

    await logActivity({
      action: 'USER_UPDATED',
      details: `Updated ${existingUser.email}`,
      actor: req.auth,
      metadata: { userId: existingUser._id }
    });

    return res.status(200).json({ success: true, data: toUserWithSupplier(existingUser, supplierProfile?.toObject()) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (id === req.auth.sub) {
      return res.status(400).json({ success: false, message: 'Cannot delete current user' });
    }

    const target = await User.findById(id);
    if (!target) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (target.role === 'admin') {
      return res.status(403).json({ success: false, message: 'Admin accounts cannot be deactivated here' });
    }

    target.isActive = false;
    await target.save();

    await logActivity({
      action: 'USER_DEACTIVATED',
      details: `Deactivated ${target.email}`,
      actor: req.auth,
      metadata: { userId: target._id }
    });

    return res.status(200).json({ success: true, message: 'User deactivated' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
