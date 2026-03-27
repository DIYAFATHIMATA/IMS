import { Router } from 'express';
import Product from '../models/Product.js';
import StockTransaction from '../models/StockTransaction.js';
import InventoryTransaction from '../models/InventoryTransaction.js';
import {
  requireAuth,
  requireRoles,
  ROLE_ADMIN,
  ROLE_STAFF
} from '../middleware/auth.middleware.js';
import { logInventoryTransaction } from '../utils/inventoryTransaction.js';
import { createNotification } from '../utils/notification.js';

const router = Router();

router.use(requireAuth);

router.get('/items', requireRoles(ROLE_ADMIN, ROLE_STAFF), async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit || 100), 1), 1000);
    const skip = Math.max(Number(req.query.skip || 0), 0);

    const items = await Product.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    const withFlags = items.map((item) => ({
      ...item,
      minStockLevel: Number(item.minStockLevel ?? 5),
      isLowStock: Number(item.stock) < Number(item.minStockLevel ?? 5)
    }));
    return res.status(200).json({
      success: true,
      data: withFlags,
      pagination: { limit, skip, count: withFlags.length }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/items', requireRoles(ROLE_STAFF), async (req, res) => {
  try {
    const { name, category, price, costPrice, stock, gst, sku, minStockLevel, supplierId } = req.body;

    if (!name || !category || sku === undefined) {
      return res.status(400).json({ success: false, message: 'name, category and sku are required' });
    }

    const existing = await Product.findOne({ sku: String(sku).toUpperCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'SKU already exists' });
    }

    const initialStock = Number(stock ?? 0);
    const minimumLevel = Number.isFinite(Number(minStockLevel)) ? Number(minStockLevel) : 5;

    const item = await Product.create({
      name: String(name).trim(),
      category: String(category).trim(),
      price: Number(price),
      costPrice: Number(costPrice),
      stock: initialStock,
      minStockLevel: minimumLevel,
      supplierId: supplierId || null,
      gst: Number(gst),
      sku: String(sku).trim().toUpperCase()
    });

    if (item.stock > 0) {
      await StockTransaction.create({
        productId: item._id,
        productName: item.name,
        type: 'IN',
        quantity: item.stock,
        reference: 'Opening Stock'
      });
    }

    await logInventoryTransaction({
      productId: item._id,
      action: 'added',
      quantityChange: Number(item.stock),
      performedBy: req.auth.sub,
      performedByName: req.auth.name || req.auth.email,
      reference: 'PRODUCT_CREATE',
      notes: 'Product added to inventory'
    });

    if (Number(item.stock) < Number(item.minStockLevel)) {
      await createNotification({
        role: 'staff',
        type: 'warning',
        title: 'Low stock alert',
        message: `${item.name} is below minimum stock level`,
        metadata: { productId: item._id, stock: item.stock, minStockLevel: item.minStockLevel }
      });
    }

    return res.status(201).json({ success: true, data: item });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.patch('/items/:id', requireRoles(ROLE_STAFF), async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await Product.findById(id);

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    const nextValues = {
      name: req.body.name !== undefined ? String(req.body.name).trim() : existing.name,
      category: req.body.category !== undefined ? String(req.body.category).trim() : existing.category,
      price: req.body.price !== undefined ? Number(req.body.price) : existing.price,
      costPrice: req.body.costPrice !== undefined ? Number(req.body.costPrice) : existing.costPrice,
      stock: req.body.stock !== undefined ? Number(req.body.stock) : existing.stock,
      gst: req.body.gst !== undefined ? Number(req.body.gst) : existing.gst,
      sku: req.body.sku !== undefined ? String(req.body.sku).trim().toUpperCase() : existing.sku,
      minStockLevel: req.body.minStockLevel !== undefined ? Number(req.body.minStockLevel) : Number(existing.minStockLevel ?? 5),
      supplierId: req.body.supplierId !== undefined ? (req.body.supplierId || null) : existing.supplierId
    };

    if (nextValues.sku !== existing.sku) {
      const duplicate = await Product.findOne({ sku: nextValues.sku, _id: { $ne: id } });
      if (duplicate) {
        return res.status(409).json({ success: false, message: 'SKU already exists' });
      }
    }

    const stockDiff = nextValues.stock - existing.stock;

    existing.name = nextValues.name;
    existing.category = nextValues.category;
    existing.price = nextValues.price;
    existing.costPrice = nextValues.costPrice;
    existing.stock = nextValues.stock;
    existing.gst = nextValues.gst;
    existing.sku = nextValues.sku;
    existing.minStockLevel = nextValues.minStockLevel;
    existing.supplierId = nextValues.supplierId;

    await existing.save();

    if (stockDiff !== 0) {
      await StockTransaction.create({
        productId: existing._id,
        productName: existing.name,
        type: stockDiff > 0 ? 'IN' : 'OUT',
        quantity: Math.abs(stockDiff),
        reference: 'Manual Edit'
      });

      await logInventoryTransaction({
        productId: existing._id,
        action: 'adjusted',
        quantityChange: stockDiff,
        performedBy: req.auth.sub,
        performedByName: req.auth.name || req.auth.email,
        reference: 'MANUAL_EDIT',
        notes: 'Manual stock adjustment'
      });

      if (Number(existing.stock) < Number(existing.minStockLevel ?? 5)) {
        await createNotification({
          role: 'staff',
          type: 'warning',
          title: 'Low stock alert',
          message: `${existing.name} is below minimum stock level`,
          metadata: { productId: existing._id, stock: existing.stock, minStockLevel: existing.minStockLevel }
        });
      }
    }

    return res.status(200).json({ success: true, data: existing });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/items/:id', requireRoles(ROLE_STAFF), async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await Product.findById(id);

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    await Product.findByIdAndDelete(id);

    if (existing.stock > 0) {
      await StockTransaction.create({
        productId: existing._id,
        productName: existing.name,
        type: 'OUT',
        quantity: existing.stock,
        reference: 'Deleted Item'
      });
    }

    return res.status(200).json({ success: true, message: 'Item deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/stock-transactions', requireRoles(ROLE_ADMIN, ROLE_STAFF), async (req, res) => {
  try {
    const limit = Number(req.query.limit || 8);
    const txns = await StockTransaction.find({}).sort({ timestamp: -1 }).limit(limit).lean();
    return res.status(200).json({ success: true, data: txns });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/transactions', requireRoles(ROLE_ADMIN, ROLE_STAFF), async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit || 100), 1), 500);
    const txns = await InventoryTransaction.find({}).sort({ timestamp: -1 }).limit(limit).lean();
    return res.status(200).json({ success: true, data: txns });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
