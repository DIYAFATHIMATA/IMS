import { Router } from 'express';
import Bill from '../models/Bill.js';
import Product from '../models/Product.js';
import StockTransaction from '../models/StockTransaction.js';
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
    const bills = await Bill.find({}).sort({ createdAt: -1 }).lean();
    return res.status(200).json({ success: true, data: bills });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', requireRoles(ROLE_STAFF), async (req, res) => {
  try {
    const { billId, supplierId, supplierName, productId, quantity, dueDate, status } = req.body;

    if (!billId || !productId || !quantity) {
      return res.status(400).json({ success: false, message: 'billId, productId and quantity are required' });
    }

    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty <= 0) {
      return res.status(400).json({ success: false, message: 'quantity must be a positive integer' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const exists = await Bill.findOne({ billId: String(billId).trim() });
    if (exists) {
      return res.status(409).json({ success: false, message: 'Bill ID already exists' });
    }

    // Update inventory stock
    product.stock = Number(product.stock) + qty;
    await product.save();

    // Record stock transaction
    await StockTransaction.create({
      productId: product._id,
      productName: product.name,
      type: 'IN',
      quantity: qty,
      reference: String(billId).trim()
    });

    const amount = Number(product.costPrice) * qty;

    const bill = await Bill.create({
      billId: String(billId).trim(),
      supplier: String(supplierName || supplierId || 'Unknown').trim(),
      productId: product._id,
      productName: product.name,
      quantity: qty,
      amount,
      dueDate: dueDate || null,
      status: String(status || 'Open').trim()
    });

    return res.status(201).json({ success: true, data: bill });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.patch('/:id', requireRoles(ROLE_STAFF), async (req, res) => {
  try {
    const updated = await Bill.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).lean();
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Bill not found' });
    }
    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', requireRoles(ROLE_STAFF), async (req, res) => {
  try {
    const deleted = await Bill.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Bill not found' });
    }
    return res.status(200).json({ success: true, message: 'Bill deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
