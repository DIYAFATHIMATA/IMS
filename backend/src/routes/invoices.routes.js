import { Router } from 'express';
import Invoice from '../models/Invoice.js';
import Sale from '../models/Sale.js';
import Product from '../models/Product.js';
import StockTransaction from '../models/StockTransaction.js';
import { logInventoryTransaction } from '../utils/inventoryTransaction.js';
import { createNotification } from '../utils/notification.js';
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
    const invoices = await Invoice.find({}).sort({ createdAt: -1 }).lean();
    return res.status(200).json({ success: true, data: invoices });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', requireRoles(ROLE_STAFF), async (req, res) => {
  try {
    const { customerName, productId, quantity, status } = req.body;

    if (!customerName || !productId || !quantity) {
      return res.status(400).json({ success: false, message: 'customerName, productId and quantity are required' });
    }

    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty <= 0) {
      return res.status(400).json({ success: false, message: 'quantity must be a positive integer' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (Number(product.stock) < qty) {
      return res.status(400).json({
        success: false,
        message: 'Not enough stock available.'
      });
    }

    const invoiceId = `INV-${Date.now().toString().slice(-6)}`;
    const subtotal = Number(product.price) * qty;
    const tax = (subtotal * Number(product.gst || 0)) / 100;
    const total = subtotal + tax;

    // Decrease inventory stock
    product.stock = Number(product.stock) - qty;
    await product.save();

    // Record stock transaction
    await StockTransaction.create({
      productId: product._id,
      productName: product.name,
      type: 'OUT',
      quantity: qty,
      reference: invoiceId
    });

    await logInventoryTransaction({
      productId: product._id,
      action: 'sold',
      quantityChange: -qty,
      performedBy: req.auth.sub,
      performedByName: req.auth.name || req.auth.email,
      reference: invoiceId,
      notes: 'Sale invoice'
    });

    if (Number(product.stock) < Number(product.minStockLevel ?? 5)) {
      await createNotification({
        role: 'staff',
        type: 'warning',
        title: 'Low stock alert',
        message: `${product.name} is below minimum stock level`,
        metadata: { productId: product._id, stock: product.stock, minStockLevel: product.minStockLevel }
      });
    }

    const invoice = await Invoice.create({
      invoiceId,
      customerName: String(customerName).trim(),
      subtotal,
      tax,
      total,
      status: String(status || 'Paid').trim(),
      date: new Date(),
      items: [{
        _id: product._id,
        name: product.name,
        quantity: qty,
        price: product.price,
        gst: product.gst
      }]
    });

    await Sale.create({
      saleId: `SAL-${Date.now().toString().slice(-8)}`,
      invoiceId,
      customerName: String(customerName).trim(),
      subtotal,
      tax,
      total,
      paymentMode: 'Cash',
      date: new Date(),
      items: [{
        _id: product._id,
        name: product.name,
        quantity: qty,
        price: product.price,
        gst: product.gst
      }]
    });

    return res.status(201).json({ success: true, data: invoice });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.patch('/:id', requireRoles(ROLE_STAFF), async (req, res) => {
  try {
    const updated = await Invoice.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).lean();
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }
    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', requireRoles(ROLE_STAFF), async (req, res) => {
  try {
    const deleted = await Invoice.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }
    return res.status(200).json({ success: true, message: 'Invoice deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
