import { Router } from 'express';
import Product from '../models/Product.js';
import StockTransaction from '../models/StockTransaction.js';
import Invoice from '../models/Invoice.js';
import SalesReturn from '../models/SalesReturn.js';
import Sale from '../models/Sale.js';
import {
  requireAuth,
  requireRoles,
  ROLE_ADMIN,
  ROLE_STAFF
} from '../middleware/auth.middleware.js';
import { logActivity } from '../utils/activityLog.js';
import { logInventoryTransaction } from '../utils/inventoryTransaction.js';
import { createNotification } from '../utils/notification.js';

const router = Router();

router.use(requireAuth);

router.post('/checkout', requireRoles(ROLE_STAFF), async (req, res) => {
  try {
    const { customerName, items, paymentMode } = req.body;

    if (!customerName || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'customerName and items are required' });
    }

    const productIds = items.map((item) => item._id || item.id).filter(Boolean);
    const products = await Product.find({ _id: { $in: productIds } });
    const productMap = new Map(products.map((product) => [product._id.toString(), product]));

    let subtotal = 0;
    let tax = 0;

    for (const item of items) {
      const productId = String(item._id || item.id || '');
      const quantity = Number(item.quantity) || 0;
      const product = productMap.get(productId);

      if (!product) {
        return res.status(400).json({ success: false, message: 'One or more products not found' });
      }

      if (!Number.isInteger(quantity) || quantity <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid item quantity' });
      }

      if (quantity > Number(product.stock)) {
        return res.status(400).json({ success: false, message: `Insufficient stock for ${product.name}` });
      }

      const taxable = Number(product.price) * quantity;
      const itemTax = (taxable * Number(product.gst || 0)) / 100;
      subtotal += taxable;
      tax += itemTax;
    }

    const total = subtotal + tax;
    const invoiceId = `INV-${Date.now().toString().slice(-6)}`;

    for (const item of items) {
      const productId = String(item._id || item.id);
      const quantity = Number(item.quantity);
      const product = productMap.get(productId);

      product.stock = Number(product.stock) - quantity;
      await product.save();

      await StockTransaction.create({
        productId: product._id,
        productName: product.name,
        type: 'OUT',
        quantity,
        reference: invoiceId
      });

      await logInventoryTransaction({
        productId: product._id,
        action: 'sold',
        quantityChange: -quantity,
        performedBy: req.auth.sub,
        performedByName: req.auth.name || req.auth.email,
        reference: invoiceId,
        notes: 'Checkout sale'
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
    }

    const invoiceData = {
      invoiceId,
      customerName: customerName.trim(),
      subtotal,
      tax,
      total,
      status: 'Paid',
      date: new Date().toISOString(),
      items: items.map((item) => ({
        _id: item._id || item.id,
        name: item.name,
        quantity: Number(item.quantity),
        price: Number(item.price),
        gst: Number(item.gst)
      }))
    };

    await Invoice.create(invoiceData);

    await Sale.create({
      saleId: `SAL-${Date.now().toString().slice(-8)}`,
      invoiceId,
      customerName: customerName.trim(),
      subtotal,
      tax,
      total,
      paymentMode: typeof paymentMode === 'string' && paymentMode.trim() ? paymentMode.trim() : 'Cash',
      items: invoiceData.items,
      date: new Date().toISOString()
    });

    await logActivity({
      action: 'SALE_RECORDED',
      details: `${invoiceId} billed for ${total}`,
      actor: req.auth,
      metadata: { invoiceId, total }
    });

    return res.status(201).json({ success: true, data: invoiceData });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /sales/returns - list all returns
router.get('/returns', requireRoles(ROLE_ADMIN, ROLE_STAFF), async (_req, res) => {
  try {
    const returns = await SalesReturn.find({}).sort({ createdAt: -1 }).lean();
    return res.status(200).json({ success: true, data: returns });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /sales/returns - create a return
router.post('/returns', requireRoles(ROLE_STAFF), async (req, res) => {
  try {
    const { customerName, invoiceId, productId, productName, quantity, reason } = req.body;

    if (!customerName || !invoiceId || !productName || !reason) {
      return res.status(400).json({ success: false, message: 'customerName, invoiceId, productName and reason are required' });
    }

    const validReasons = ['Damaged', 'Exchange', 'Return & Refund'];
    if (!validReasons.includes(reason)) {
      return res.status(400).json({ success: false, message: 'Invalid return reason' });
    }

    const invoice = await Invoice.findOne({ invoiceId }).lean();
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    const invoiceItem = (invoice.items || []).find(
      (item) => String(item._id) === String(productId) || item.name === productName
    );
    if (!invoiceItem) {
      return res.status(400).json({ success: false, message: 'Product not found in this invoice' });
    }

    const purchaseDate = new Date(invoice.date);
    const today = new Date();
    const daysDiff = Math.floor((today - purchaseDate) / (1000 * 60 * 60 * 24));

    if (reason === 'Damaged' && daysDiff > 7) {
      return res.status(400).json({
        success: false,
        message: `Damaged item returns are only allowed within 7 days of purchase. This purchase was ${daysDiff} days ago.`
      });
    }

    if (daysDiff > 30) {
      return res.status(400).json({
        success: false,
        message: `Returns are only allowed within 30 days of purchase. This purchase was ${daysDiff} days ago.`
      });
    }

    const qty = Number(quantity) || Number(invoiceItem.quantity) || 1;
    const returnId = `RET-${Date.now().toString().slice(-6)}`;

    // Restore stock
    if (productId) {
      const product = await Product.findById(productId);
      if (product) {
        product.stock = Number(product.stock) + qty;
        await product.save();
      }
    }

    await StockTransaction.create({
      productId: productId || null,
      productName,
      type: 'IN',
      quantity: qty,
      reference: returnId
    });

    const refundAmount = Number(invoiceItem.price) * qty;

    const salesReturn = await SalesReturn.create({
      returnId,
      customer: customerName.trim(),
      invoiceId,
      productId: productId || '',
      productName,
      quantity: qty,
      reason,
      refundAmount,
      purchaseDate: invoice.date,
      returnDate: new Date(),
      status: 'Accepted'
    });

    return res.status(201).json({ success: true, data: salesReturn });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
