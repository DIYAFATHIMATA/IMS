import { Router } from 'express';
import SupplyRequest from '../models/SupplyRequest.js';
import Product from '../models/Product.js';
import Supplier from '../models/Supplier.js';
import StockTransaction from '../models/StockTransaction.js';
import {
  requireAuth,
  requireRoles,
  ROLE_ADMIN,
  ROLE_STAFF,
  ROLE_SUPPLIER
} from '../middleware/auth.middleware.js';
import { logActivity } from '../utils/activityLog.js';
import { logInventoryTransaction } from '../utils/inventoryTransaction.js';
import { createNotification } from '../utils/notification.js';

const router = Router();
const PROOF_TYPES = new Set(['invoice', 'challan', 'photo']);
const MAX_PROOF_SIZE_CHARS = 4_000_000;
const GST_OPTIONS = [0, 5, 12, 18, 28];


router.use(requireAuth);

router.get('/', requireRoles(ROLE_ADMIN, ROLE_STAFF, ROLE_SUPPLIER), async (req, res) => {
  try {
    const role = req.auth.role;
    const actorId = req.auth.sub;

    let query = {};
    if (role === ROLE_STAFF) {
      query = { staffId: actorId };
    } else if (role === ROLE_SUPPLIER) {
      query = { supplierId: actorId };
    }

    const limit = Math.min(Math.max(Number(req.query.limit || 100), 1), 500);
    const skip = Math.max(Number(req.query.skip || 0), 0);

    const requests = await SupplyRequest.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    const supplierUserIds = requests
      .map((request) => request.supplierId)
      .filter(Boolean);
    const productIds = requests
      .map((request) => request.productId)
      .filter(Boolean);
    const supplierProfiles = supplierUserIds.length
      ? await Supplier.find({ userId: { $in: supplierUserIds } }).lean()
      : [];
    const products = productIds.length
      ? await Product.find({ _id: { $in: productIds } }, { costPrice: 1, gst: 1 }).lean()
      : [];
    const supplierByUserId = new Map(supplierProfiles.map((supplier) => [String(supplier.userId), supplier]));
    const productById = new Map(products.map((product) => [String(product._id), product]));
    const merged = requests.map((request) => {
      const supplier = supplierByUserId.get(String(request.supplierId || ''));
      const product = productById.get(String(request.productId || ''));
      const unitCost = Number(request.unitCost ?? product?.costPrice ?? 0);
      const gst = Number(request.gst ?? product?.gst ?? 0);
      const quantity = Number(request.quantity || 0);
      const totalCost = Number(request.totalCost ?? (unitCost * quantity * (1 + gst / 100)));
      return {
        ...request,
        supplierName: supplier?.companyName || request.supplierName || '',
        supplierCategory: supplier?.supplierCategory || '',
        unitCost,
        gst,
        totalCost
      };
    });

    return res.status(200).json({
      success: true,
      data: merged,
      pagination: {
        limit,
        skip,
        count: merged.length
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', requireRoles(ROLE_STAFF), async (req, res) => {
  try {
    const {
      productId,
      quantity,
      notes,
      expectedDeliveryDate,
      deliveryAddress
    } = req.body;

    if (!productId || !quantity) {
      return res.status(400).json({ success: false, message: 'productId and quantity are required' });
    }

    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty <= 0) {
      return res.status(400).json({ success: false, message: 'quantity must be a positive whole number' });
    }

    // Populate supplierId to get the Supplier record
    const product = await Product.findById(productId).populate('supplierId');
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (!product.supplierId || !product.supplierId.userId) {
      return res.status(400).json({ success: false, message: 'This product is not linked to an active supplier' });
    }

    const supplierRecord = product.supplierId;
    const requestId = `SR-${Date.now().toString().slice(-8)}`;
    const totalCost = product.costPrice * qty * (1 + (product.gst / 100));

    const created = await SupplyRequest.create({
      requestId,
      productId: product._id,
      productName: product.name,
      productCategory: product.category,
      quantity: qty,
      unitCost: product.costPrice,
      gst: product.gst,
      totalCost,
      notes: String(notes || '').trim(),
      deliveryAddress: String(deliveryAddress || '').trim(),
      status: 'Pending',
      requestDate: new Date(),
      expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : undefined,
      statusHistory: [
        {
          status: 'Pending',
          updatedAt: new Date(),
          updatedBy: req.auth.sub,
          updatedByName: req.auth.name || req.auth.email || 'Staff',
          notes: 'Request created'
        }
      ],
      staffId: req.auth.sub,
      staffName: req.auth.name || req.auth.email || 'Staff',
      companyName: product.companyName || supplierRecord.companyName,
      supplierId: supplierRecord.userId,
      supplierName: supplierRecord.companyName
    });

    await logActivity({
      action: 'SUPPLY_REQUEST_CREATED',
      details: `${created.requestId} for ${created.productName} (${created.quantity})`,
      actor: req.auth,
      metadata: { requestId: created.requestId, productId: created.productId }
    });

    await createNotification({
      role: 'admin',
      type: 'info',
      title: 'New supply request',
      message: `${created.requestId} created by staff and requires approval`,
      metadata: { requestId: created.requestId }
    });

    return res.status(201).json({ success: true, data: created });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.patch('/:id/approve', requireRoles(ROLE_ADMIN), async (req, res) => {
  try {
    const { status = 'Approved' } = req.body;
    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status. Must be Approved or Rejected' });
    }

    const request = await SupplyRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Supply request not found' });
    }

    if (request.status !== 'Pending') {
      return res.status(400).json({ success: false, message: 'Only Pending requests can be processed' });
    }

    request.status = status;
    request.approvedBy = req.auth.sub;
    request.approvedByName = req.auth.name || req.auth.email || 'Admin';
    request.approvedAt = new Date();
    if (!Array.isArray(request.statusHistory)) {
      request.statusHistory = [];
    }
    request.statusHistory.push({
      status,
      updatedAt: request.approvedAt,
      updatedBy: req.auth.sub,
      updatedByName: req.auth.name || req.auth.email || 'Admin',
      notes: status === 'Approved' ? 'Request approved' : 'Request rejected by admin'
    });
    await request.save();

    await logActivity({
      action: status === 'Approved' ? 'SUPPLY_REQUEST_APPROVED' : 'SUPPLY_REQUEST_REJECTED',
      details: `${request.requestId} ${status.toLowerCase()} by admin`,
      actor: req.auth,
      metadata: { requestId: request.requestId }
    });

    if (request.supplierId) {
      await createNotification({
        role: 'supplier',
        userId: request.supplierId,
        type: 'info',
        title: 'Request approved by admin',
        message: `${request.requestId} has been approved and is ready for action`,
        metadata: { requestId: request.requestId, orderId: request._id }
      });
    } else {
      await createNotification({
        role: 'supplier',
        type: 'info',
        title: 'New supply request received',
        message: `${request.requestId} is now available for suppliers`,
        metadata: { requestId: request.requestId, orderId: request._id }
      });
    }

    return res.status(200).json({ success: true, data: request });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});


router.patch('/:id/status', requireRoles(ROLE_SUPPLIER), async (req, res) => {
  try {
    const { status } = req.body;
    if (status !== 'Delivered') {
      return res.status(400).json({ success: false, message: 'Suppliers can only mark requests as Delivered' });
    }

    const request = await SupplyRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Supply request not found' });
    }

    if (String(request.supplierId) !== String(req.auth.sub)) {
      return res.status(403).json({ success: false, message: 'This request is assigned to another supplier' });
    }

    if (request.status !== 'Approved') {
      return res.status(400).json({ success: false, message: 'Only Approved requests can be marked as Delivered' });
    }

    request.status = 'Delivered';
    request.deliveredBy = req.auth.sub;
    request.deliveredByName = req.auth.name || req.auth.email || 'Supplier';
    request.deliveredAt = new Date();
    request.actualDeliveryDate = new Date();
    request.deliveryNotes = String(req.body.deliveryNotes || '').trim();

    if (!Array.isArray(request.statusHistory)) {
      request.statusHistory = [];
    }
    request.statusHistory.push({
      status: 'Delivered',
      updatedAt: new Date(),
      updatedBy: req.auth.sub,
      updatedByName: request.deliveredByName,
      notes: 'Marked as delivered by supplier'
    });
    await request.save();

    await logActivity({
      action: 'SUPPLY_REQUEST_DELIVERED',
      details: `${request.requestId} marked delivered by supplier`,
      actor: req.auth,
      metadata: { requestId: request.requestId }
    });

    await createNotification({
      role: 'staff',
      userId: request.staffId,
      type: 'info',
      title: 'Delivery arrived',
      message: `${request.requestId} marked delivered by supplier`,
      metadata: { requestId: request.requestId }
    });

    return res.status(200).json({ success: true, data: request });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.patch('/:id/receive', requireRoles(ROLE_STAFF), async (req, res) => {
  try {
    const request = await SupplyRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Supply request not found' });
    }

    if (String(request.staffId) !== String(req.auth.sub)) {
      return res.status(403).json({ success: false, message: 'You can receive only your own requests' });
    }

    if (request.status !== 'Delivered') {
      return res.status(400).json({ success: false, message: 'Only Delivered requests can be received' });
    }

    if (request.inventoryUpdated) {
      return res.status(400).json({ success: false, message: 'Inventory already updated for this request' });
    }

    let product = request.productId ? await Product.findById(request.productId) : null;
    if (!product) {
      const existingByName = await Product.findOne({
        name: request.productName,
        category: request.productCategory || 'General'
      });

      if (existingByName) {
        product = existingByName;
      } else {
        const category = String(request.productCategory || 'General').trim() || 'General';
        const baseSku = String(request.productName || 'ITEM')
          .toUpperCase()
          .replace(/[^A-Z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
          .slice(0, 8) || 'ITEM';
        const sku = `${baseSku}-${Date.now().toString().slice(-6)}`;

        product = await Product.create({
          name: request.productName,
          category,
          price: Number(request.unitCost || 0),
          costPrice: Number(request.unitCost || 0),
          stock: 0,
          minStockLevel: 5,
          gst: GST_OPTIONS.includes(Number(request.gst)) ? Number(request.gst) : 18,
          sku
        });
      }

      request.productId = product._id;
      if (!request.productCategory) {
        request.productCategory = product.category;
      }
    }

    product.stock = Number(product.stock) + Number(request.quantity);
    await product.save();

    await StockTransaction.create({
      productId: product._id,
      productName: product.name,
      type: 'IN',
      quantity: Number(request.quantity),
      reference: request.requestId
    });

    await logInventoryTransaction({
      productId: product._id,
      action: 'restocked',
      quantityChange: Number(request.quantity),
      performedBy: req.auth.sub,
      performedByName: req.auth.name || req.auth.email,
      reference: request.requestId,
      notes: 'Supply request received'
    });

    const completedAt = new Date();
    request.inventoryUpdated = true;
    request.inventoryUpdatedAt = completedAt;
    request.status = 'Completed';
    request.verifiedBy = req.auth.sub;
    request.verifiedByName = req.auth.name || req.auth.email || 'Staff';
    request.verifiedAt = completedAt;
    if (!Array.isArray(request.statusHistory)) {
      request.statusHistory = [];
    }
    request.statusHistory.push({
      status: 'Completed',
      updatedAt: completedAt,
      updatedBy: req.auth.sub,
      updatedByName: req.auth.name || req.auth.email || 'Staff',
      notes: 'Delivery received by staff and inventory updated'
    });
    await request.save();

    await logActivity({
      action: 'SUPPLY_REQUEST_COMPLETED',
      details: `${request.requestId} marking as completed by staff`,
      actor: req.auth,
      metadata: { requestId: request.requestId, productId: request.productId }
    });

    if (request.supplierId) {
      await createNotification({
        role: 'supplier',
        userId: request.supplierId,
        type: 'success',
        title: 'Delivery verified',
        message: `${request.requestId} has been verified by staff` ,
        metadata: { requestId: request.requestId, orderId: request._id }
      });
    }

    return res.status(200).json({ success: true, data: request });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});


export default router;
