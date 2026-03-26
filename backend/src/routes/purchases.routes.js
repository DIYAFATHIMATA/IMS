import { Router } from 'express';
import Product from '../models/Product.js';
import Supplier from '../models/Supplier.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import StockTransaction from '../models/StockTransaction.js';
import Bill from '../models/Bill.js';
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

router.get('/', requireRoles(ROLE_ADMIN, ROLE_STAFF), async (req, res) => {
  try {
    const orders = await PurchaseOrder.find().sort({ date: -1 });
    return res.json({ success: true, data: orders });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/record', requireRoles(ROLE_STAFF), async (req, res) => {
  try {
    const { supplierId, supplierName: bodySupplierName, items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'items are required' });
    }

    let supplier = null;
    if (supplierId) {
      supplier = await Supplier.findById(supplierId);
      if (!supplier) {
        return res.status(400).json({ success: false, message: 'Supplier not found' });
      }
    }

    // Create new products for items that don't exist in inventory yet
    for (const item of items) {
      if (item.isNew) {
        const sku = (`PROD-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`).toUpperCase();
        const newProd = await Product.create({
          name: String(item.name).trim(),
          category: String(item.category || 'General').trim(),
          price: Number(item.price) || Number(item.costPrice) || 0,
          costPrice: Number(item.costPrice) || 0,
          gst: [0, 5, 12, 18, 28].includes(Number(item.gst)) ? Number(item.gst) : 18,
          stock: 0,
          minStockLevel: Number(item.minStockLevel) || 5,
          supplierId: supplier?._id || null,
          sku
        });
        item._id = newProd._id.toString();
        item.name = newProd.name;
      }
    }

    const productIds = items.map((item) => item._id || item.id || item.productId).filter(Boolean);
    const products = await Product.find({ _id: { $in: productIds } });
    const productMap = new Map(products.map((product) => [product._id.toString(), product]));

    let subtotal = 0;
    let tax = 0;

    for (const item of items) {
      const productId = String(item._id || item.id || item.productId || '');
      const quantity = Number(item.quantity) || 0;
      const product = productMap.get(productId);

      if (!product) {
        return res.status(400).json({ success: false, message: 'One or more products not found' });
      }

      if (!Number.isInteger(quantity) || quantity <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid quantity in items' });
      }

      const unitCost = Number(item.costPrice) || Number(product.costPrice) || 0;
      const gstRate = Number(item.gst ?? product.gst ?? 0);
      const taxable = unitCost * quantity;
      const itemTax = (taxable * gstRate) / 100;
      subtotal += taxable;
      tax += itemTax;
    }

    const total = subtotal + tax;

    for (const item of items) {
      const productId = String(item._id || item.id || item.productId);
      const quantity = Number(item.quantity);
      const product = productMap.get(productId);
      const unitCost = Number(item.costPrice) || Number(product.costPrice) || 0;

      product.stock = Number(product.stock) + quantity;
      product.costPrice = unitCost;
      if (supplier?._id) {
        product.supplierId = supplier._id;
      }
      await product.save();

      await StockTransaction.create({
        productId: product._id,
        productName: product.name,
        type: 'IN',
        quantity,
        reference: `PUR-${Date.now().toString().slice(-6)}`
      });

      await logInventoryTransaction({
        productId: product._id,
        action: 'restocked',
        quantityChange: quantity,
        performedBy: req.auth.sub,
        performedByName: req.auth.name || req.auth.email,
        reference: 'PURCHASE_RECORD',
        notes: 'Purchase order stock in'
      });
    }

    const resolvedSupplierName = supplier ? supplier.companyName : (bodySupplierName || 'Direct Purchase');

    const purchaseData = {
      supplierId: supplierId || undefined,
      supplierName: resolvedSupplierName,
      items: items.map((item) => ({
        _id: item._id || item.id || item.productId,
        name: item.name,
        quantity: Number(item.quantity),
        costPrice: Number(item.costPrice),
        gst: Number(item.gst || 0)
      })),
      subtotal,
      tax,
      total,
      date: new Date().toISOString()
    };

    const created = await PurchaseOrder.create(purchaseData);

    await createNotification({
      role: 'admin',
      type: 'info',
      title: 'Purchase recorded',
      message: `Purchase ${created._id.toString().slice(-6)} recorded by staff`,
      metadata: { purchaseOrderId: created._id }
    });

    // Auto-generate one bill per item (no stock increment — already done above)
    const billTimestamp = Date.now();
    const createdBills = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const productId = String(item._id || item.id || item.productId);
      const product = productMap.get(productId);
      const qty = Number(item.quantity);
      const unitCost = Number(item.costPrice) || Number(product.costPrice) || 0;
      const gstRate = Number(item.gst ?? product.gst ?? 0);
      const itemAmount = unitCost * qty * (1 + gstRate / 100);
      const bill = await Bill.create({
        billId: `BILL-${(billTimestamp + i).toString().slice(-8)}`,
        supplier: resolvedSupplierName,
        productId: product._id,
        productName: product.name,
        quantity: qty,
        amount: itemAmount,
        status: 'Open'
      });
      createdBills.push(bill.toObject());
    }

    return res.status(201).json({
      success: true,
      data: {
        _id: created._id,
        ...created.toObject(),
        createdAt: created.createdAt,
        updatedAt: created.updatedAt
      },
      bills: createdBills
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
