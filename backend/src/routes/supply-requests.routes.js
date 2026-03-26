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

const normalizeDeliveryProofs = (proofs) => {
  if (!Array.isArray(proofs)) return [];

  return proofs
    .map((item) => {
      const type = String(item?.type || '').trim().toLowerCase();
      const fileName = String(item?.fileName || '').trim();
      const mimeType = String(item?.mimeType || '').trim();
      const dataUrl = String(item?.dataUrl || '').trim();
      if (!PROOF_TYPES.has(type)) return null;
      if (!fileName || !mimeType || !dataUrl.startsWith('data:')) return null;
      if (dataUrl.length > MAX_PROOF_SIZE_CHARS) return null;
      return {
        type,
        fileName,
        mimeType,
        dataUrl,
        uploadedAt: new Date()
      };
    })
    .filter(Boolean);
};

router.use(requireAuth);

router.get('/', requireRoles(ROLE_ADMIN, ROLE_STAFF, ROLE_SUPPLIER), async (req, res) => {
  try {
    const role = req.auth.role;
    const actorId = req.auth.sub;

    let query = {};
    if (role === ROLE_STAFF) {
      query = { staffId: actorId };
    } else if (role === ROLE_SUPPLIER) {
      query = {
        $or: [
          { status: 'Approved', supplierId: null },
          { supplierId: actorId }
        ]
      };
    }

    const requests = await SupplyRequest.find(query).sort({ createdAt: -1 }).lean();
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

    return res.status(200).json({ success: true, data: merged });
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
      deliveryAddress,
      supplierId,
      newProductName,
      newProductCategory,
      unitCost,
      gst
    } = req.body;

    if (!quantity) {
      return res.status(400).json({ success: false, message: 'quantity is required' });
    }

    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty <= 0) {
      return res.status(400).json({ success: false, message: 'quantity must be a positive whole number' });
    }

    const isCustomProduct = !productId;
    let product = null;
    let resolvedProductName = '';
    let resolvedProductCategory = '';
    let resolvedUnitCost = 0;
    let resolvedGst = 0;

    if (isCustomProduct) {
      resolvedProductName = String(newProductName || '').trim();
      resolvedProductCategory = String(newProductCategory || '').trim();
      resolvedUnitCost = Number(unitCost || 0);
      resolvedGst = Number(gst ?? 18);

      if (!resolvedProductName || !resolvedProductCategory) {
        return res.status(400).json({ success: false, message: 'newProductName and newProductCategory are required for new product request' });
      }
      if (!Number.isFinite(resolvedUnitCost) || resolvedUnitCost < 0) {
        return res.status(400).json({ success: false, message: 'unitCost must be a non-negative number' });
      }
      if (!GST_OPTIONS.includes(resolvedGst)) {
        return res.status(400).json({ success: false, message: 'gst must be one of 0, 5, 12, 18, 28' });
      }
    } else {
      product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }
      resolvedProductName = product.name;
      resolvedProductCategory = product.category;
      resolvedUnitCost = Number(product.costPrice || 0);
      resolvedGst = Number(product.gst || 0);
    }

    let selectedSupplier = null;
    if (supplierId) {
      selectedSupplier = await Supplier.findById(supplierId).lean();
      if (!selectedSupplier) {
        return res.status(404).json({ success: false, message: 'Supplier not found' });
      }

      if (!selectedSupplier.userId) {
        return res.status(400).json({ success: false, message: 'Selected supplier is not linked to a supplier account' });
      }

      const productCategory = String(resolvedProductCategory || '').trim().toLowerCase();
      const supplierCategory = String(selectedSupplier.supplierCategory || '').trim().toLowerCase();
      if (productCategory !== supplierCategory) {
        return res.status(400).json({
          success: false,
          message: `Selected supplier category (${selectedSupplier.supplierCategory}) does not match product category (${resolvedProductCategory})`
        });
      }
    }

    const requestId = `SR-${Date.now().toString().slice(-8)}`;
    const totalCost = resolvedUnitCost * qty * (1 + resolvedGst / 100);

    const created = await SupplyRequest.create({
      requestId,
      productId: product?._id || null,
      productName: resolvedProductName,
      productCategory: resolvedProductCategory,
      quantity: qty,
      unitCost: resolvedUnitCost,
      gst: resolvedGst,
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
      supplierId: selectedSupplier?.userId || null,
      supplierName: selectedSupplier?.companyName || ''
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
      title: 'Supply request pending approval',
      message: `${created.requestId} created by staff`,
      metadata: { requestId: created.requestId }
    });

    if (selectedSupplier?.userId) {
      await createNotification({
        role: 'supplier',
        userId: selectedSupplier.userId,
        type: 'info',
        title: 'Supply request assigned',
        message: `${created.requestId} assigned to your company`,
        metadata: { requestId: created.requestId, orderId: created._id }
      });
    }

    return res.status(201).json({ success: true, data: created });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.patch('/:id/approve', requireRoles(ROLE_ADMIN), async (req, res) => {
  try {
    const request = await SupplyRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Supply request not found' });
    }

    if (request.status !== 'Pending') {
      return res.status(400).json({ success: false, message: 'Only Pending requests can be approved' });
    }

    request.status = 'Approved';
    request.approvedBy = req.auth.sub;
    request.approvedByName = req.auth.name || req.auth.email || 'Admin';
    request.approvedAt = new Date();
    if (!Array.isArray(request.statusHistory)) {
      request.statusHistory = [];
    }
    request.statusHistory.push({
      status: 'Approved',
      updatedAt: request.approvedAt,
      updatedBy: req.auth.sub,
      updatedByName: req.auth.name || req.auth.email || 'Admin',
      notes: 'Request approved'
    });
    await request.save();

    await logActivity({
      action: 'SUPPLY_REQUEST_APPROVED',
      details: `${request.requestId} approved by admin`,
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

router.patch('/:id/respond', requireRoles(ROLE_SUPPLIER), async (req, res) => {
  try {
    const { decision } = req.body;
    if (!['Accepted', 'Rejected'].includes(String(decision || ''))) {
      return res.status(400).json({ success: false, message: 'decision must be Accepted or Rejected' });
    }

    const request = await SupplyRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Supply request not found' });
    }

    if (!['Approved', 'Accepted'].includes(request.status)) {
      return res.status(400).json({ success: false, message: `Cannot respond in ${request.status} status` });
    }

    request.status = decision;
    request.supplierId = req.auth.sub;
    request.supplierName = req.auth.name || req.auth.email || 'Supplier';
    if (decision === 'Accepted') {
      request.acceptedAt = new Date();
    }
    if (!Array.isArray(request.statusHistory)) {
      request.statusHistory = [];
    }
    request.statusHistory.push({
      status: decision,
      updatedAt: new Date(),
      updatedBy: req.auth.sub,
      updatedByName: req.auth.name || req.auth.email || 'Supplier',
      notes: 'Supplier response'
    });
    await request.save();

    await logActivity({
      action: 'SUPPLY_REQUEST_RESPONDED',
      details: `${request.requestId} marked ${request.status}`,
      actor: req.auth,
      metadata: { requestId: request.requestId, status: request.status }
    });

    return res.status(200).json({ success: true, data: request });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.patch('/:id/status', requireRoles(ROLE_SUPPLIER), async (req, res) => {
  try {
    const { status } = req.body;
    const deliveryProofs = normalizeDeliveryProofs(req.body?.deliveryProofs);
    if (!['Accepted', 'Processing', 'Shipped', 'Delivered'].includes(String(status || ''))) {
      return res.status(400).json({ success: false, message: 'Invalid status update' });
    }

    const request = await SupplyRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Supply request not found' });
    }

    if (String(request.supplierId || '') && String(request.supplierId) !== String(req.auth.sub)) {
      return res.status(403).json({ success: false, message: 'This request is assigned to another supplier' });
    }

    const allowedTransitions = {
      Pending: [],
      Approved: ['Accepted'],
      Accepted: ['Processing'],
      Processing: ['Shipped'],
      Shipped: ['Delivered'],
      Delivered: [],
      Rejected: [],
      Verified: []
    };

    const current = request.status;
    if (!allowedTransitions[current]?.includes(status)) {
      return res.status(400).json({ success: false, message: `Cannot move from ${current} to ${status}` });
    }

    request.status = status;
    request.supplierId = req.auth.sub;
    request.supplierName = req.auth.name || req.auth.email || 'Supplier';
    if (status === 'Accepted' && !request.acceptedAt) {
      request.acceptedAt = new Date();
    }
    if (status === 'Shipped') {
      request.shippedAt = new Date();
    }
    if (status === 'Delivered') {
      if (deliveryProofs.length === 0) {
        return res.status(400).json({ success: false, message: 'Upload delivery proof files before marking Delivered' });
      }
      const hasChallan = deliveryProofs.some((item) => item.type === 'challan');
      if (!hasChallan) {
        return res.status(400).json({ success: false, message: 'Delivery Challan is required to mark Delivered' });
      }
      request.deliveredAt = new Date();
      request.deliveryProofs = deliveryProofs;
    }
    if (!Array.isArray(request.statusHistory)) {
      request.statusHistory = [];
    }
    request.statusHistory.push({
      status,
      updatedAt: new Date(),
      updatedBy: req.auth.sub,
      updatedByName: req.auth.name || req.auth.email || 'Supplier',
      notes: 'Supplier status update'
    });
    await request.save();

    await logActivity({
      action: 'SUPPLY_REQUEST_STATUS_UPDATED',
      details: `${request.requestId} moved to ${status}`,
      actor: req.auth,
      metadata: { requestId: request.requestId, status }
    });

    if (status === 'Delivered') {
      await createNotification({
        role: 'staff',
        type: 'info',
        title: 'Delivery arrived',
        message: `${request.requestId} marked delivered by supplier`,
        metadata: { requestId: request.requestId }
      });
    }

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

    const verifiedAt = new Date();
    request.inventoryUpdated = true;
    request.inventoryUpdatedAt = verifiedAt;
    request.status = 'Verified';
    request.verifiedBy = req.auth.sub;
    request.verifiedByName = req.auth.name || req.auth.email || 'Staff';
    request.verifiedAt = verifiedAt;
    if (!Array.isArray(request.statusHistory)) {
      request.statusHistory = [];
    }
    request.statusHistory.push({
      status: 'Verified',
      updatedAt: verifiedAt,
      updatedBy: req.auth.sub,
      updatedByName: req.auth.name || req.auth.email || 'Staff',
      notes: 'Delivery verified by staff and inventory updated'
    });
    await request.save();

    await logActivity({
      action: 'SUPPLY_REQUEST_VERIFIED',
      details: `${request.requestId} verified by staff and inventory updated`,
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

router.patch('/:id/verify', requireRoles(ROLE_ADMIN), async (req, res) => {
  try {
    const request = await SupplyRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Supply request not found' });
    }

    if (!request.inventoryUpdated || request.status !== 'Delivered') {
      return res.status(400).json({ success: false, message: 'Request must be delivered and received before verification' });
    }

    request.status = 'Verified';
    request.verifiedBy = req.auth.sub;
    request.verifiedByName = req.auth.name || req.auth.email || 'Admin';
    request.verifiedAt = new Date();
    if (!Array.isArray(request.statusHistory)) {
      request.statusHistory = [];
    }
    request.statusHistory.push({
      status: 'Verified',
      updatedAt: request.verifiedAt,
      updatedBy: req.auth.sub,
      updatedByName: req.auth.name || req.auth.email || 'Admin',
      notes: 'Request verified'
    });
    await request.save();

    await logActivity({
      action: 'SUPPLY_REQUEST_VERIFIED',
      details: `${request.requestId} verified by admin`,
      actor: req.auth,
      metadata: { requestId: request.requestId }
    });

    await createNotification({
      role: 'staff',
      type: 'success',
      title: 'Delivery verified',
      message: `${request.requestId} verified by admin`,
      metadata: { requestId: request.requestId }
    });

    if (request.supplierId) {
      await createNotification({
        role: 'supplier',
        userId: request.supplierId,
        type: 'success',
        title: 'Delivery verified by admin',
        message: `${request.requestId} has been verified by admin`,
        metadata: { requestId: request.requestId, orderId: request._id }
      });
    }

    return res.status(200).json({ success: true, data: request });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
