import { Router } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Supplier, { SUPPLIER_CATEGORIES } from '../models/Supplier.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { signAuthToken, toSafeUser } from '../utils/auth.js';

const router = Router();
const PHONE_REGEX = /^[0-9+()\-\s]{7,15}$/;

const normalizeSupplierCategory = (value) => {
  const category = String(value || '').trim();
  if (!category) return 'General Goods';
  return SUPPLIER_CATEGORIES.includes(category) ? category : null;
};

router.post('/register', async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      companyName,
      phone,
      businessAddress,
      supplierCategory,
      gstNumber
    } = req.body;
    const normalizedRole = String(role || 'staff').toLowerCase().trim();
    if (!['staff', 'supplier'].includes(normalizedRole)) {
      return res.status(400).json({ success: false, message: 'role must be staff or supplier' });
    }


    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'name, email and password are required'
      });
    }

    const normalizedEmail = email.toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({ success: false, message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role: normalizedRole
    });

    if (normalizedRole === 'supplier') {
      const normalizedCategory = normalizeSupplierCategory(supplierCategory);
      if (!normalizedCategory) {
        await User.findByIdAndDelete(user._id);
        return res.status(400).json({ success: false, message: 'Invalid supplier category' });
      }

      if (!companyName || !String(companyName).trim()) {
        await User.findByIdAndDelete(user._id);
        return res.status(400).json({ success: false, message: 'companyName is required for supplier registration' });
      }

      if (!phone || !PHONE_REGEX.test(String(phone).trim())) {
        await User.findByIdAndDelete(user._id);
        return res.status(400).json({ success: false, message: 'Valid phone is required for supplier registration' });
      }

      if (!businessAddress || !String(businessAddress).trim()) {
        await User.findByIdAndDelete(user._id);
        return res.status(400).json({ success: false, message: 'businessAddress is required for supplier registration' });
      }

      await Supplier.create({
        userId: user._id,
        companyName: String(companyName).trim(),
        phone: String(phone).trim(),
        businessAddress: String(businessAddress).trim(),
        supplierCategory: normalizedCategory,
        gstNumber: String(gstNumber || '').trim()
      });
    }

    return res.status(201).json({
      success: true,
      data: toSafeUser(user)
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'email and password are required' });
    }

    const normalizedEmail = email.toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.role === 'manager') {
      user.role = 'staff';
      await user.save();
    }

    if (user.isActive === false) {
      return res.status(403).json({ success: false, message: 'Account is deactivated. Contact admin.' });
    }

    const isHashedPassword = typeof user.password === 'string' && user.password.startsWith('$2');
    let isValidPassword = false;

    if (isHashedPassword) {
      isValidPassword = await bcrypt.compare(password, user.password);
    } else {
      isValidPassword = password === user.password;
      if (isValidPassword) {
        user.password = await bcrypt.hash(password, 10);
        await user.save();
      }
    }

    if (!isValidPassword) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = signAuthToken(user);

    return res.status(200).json({
      success: true,
      data: {
        token,
        user: toSafeUser(user)
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.auth.sub);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({ success: true, data: toSafeUser(user) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
