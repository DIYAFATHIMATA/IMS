import { Router } from 'express';
import Customer from '../models/Customer.js';
import Invoice from '../models/Invoice.js';
import {
  requireAuth,
  requireRoles,
  ROLE_ADMIN,
  ROLE_STAFF
} from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.get('/', requireRoles(ROLE_ADMIN, ROLE_STAFF), async (_req, res) => {
  try {
    const customers = await Customer.find({}).sort({ createdAt: -1 }).lean();
    return res.status(200).json({ success: true, data: customers });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', requireRoles(ROLE_STAFF), async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;

    if (!name || String(name).trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Customer name is required' });
    }

    const customer = await Customer.create({
      name: String(name).trim(),
      email: email ? String(email).trim().toLowerCase() : '',
      phone: phone ? String(phone).trim() : '',
      address: address ? String(address).trim() : ''
    });

    return res.status(201).json({ success: true, data: customer });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.patch('/:id', requireRoles(ROLE_STAFF), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address } = req.body;

    const customer = await Customer.findById(id);

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    if (name !== undefined) {
      const normalizedName = String(name).trim();
      if (normalizedName.length < 2) {
        return res.status(400).json({ success: false, message: 'Customer name is required' });
      }
      customer.name = normalizedName;
    }

    if (email !== undefined) {
      customer.email = String(email || '').trim().toLowerCase();
    }

    if (phone !== undefined) {
      customer.phone = String(phone || '').trim();
    }

    if (address !== undefined) {
      customer.address = String(address || '').trim();
    }

    await customer.save();

    return res.status(200).json({ success: true, data: customer });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id/history', requireRoles(ROLE_ADMIN, ROLE_STAFF), async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await Customer.findById(id).lean();

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const invoices = await Invoice.find({ customerName: customer.name })
      .sort({ date: -1 })
      .lean();

    return res.status(200).json({ success: true, data: invoices });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', requireRoles(ROLE_STAFF), async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Customer.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    return res.status(200).json({ success: true, message: 'Customer deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
