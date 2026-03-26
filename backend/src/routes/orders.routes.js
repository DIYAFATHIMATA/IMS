import { Router } from 'express';
import SupplyRequest from '../models/SupplyRequest.js';
import { requireAuth, requireRoles, ROLE_SUPPLIER } from '../middleware/auth.middleware.js';
import { createNotification } from '../utils/notification.js';
import { logActivity } from '../utils/activityLog.js';

const router = Router();

router.use(requireAuth, requireRoles(ROLE_SUPPLIER));

const DELIVERY_FLOW = ['Accepted', 'Processing', 'Shipped', 'Delivered'];
const PROOF_TYPES = new Set(['invoice', 'challan', 'photo']);
const MAX_PROOF_SIZE_CHARS = 4_000_000;

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

const getNextStatus = (currentStatus) => {
  const currentIndex = DELIVERY_FLOW.indexOf(currentStatus);
  if (currentIndex === -1 || currentIndex === DELIVERY_FLOW.length - 1) {
    return null;
  }
  return DELIVERY_FLOW[currentIndex + 1];
};

router.get('/supplier', async (req, res) => {
  try {
    const supplierId = req.auth.sub;
    const { search = '', status = 'all' } = req.query;

    const query = {
      supplierId,
      status: { $in: DELIVERY_FLOW }
    };

    if (status !== 'all' && DELIVERY_FLOW.includes(String(status))) {
      query.status = String(status);
    }

    if (String(search).trim()) {
      const term = String(search).trim();
      query.$or = [
        { requestId: { $regex: term, $options: 'i' } },
        { productName: { $regex: term, $options: 'i' } }
      ];
    }

    const orders = await SupplyRequest.find(query).sort({ updatedAt: -1 }).lean();
    return res.status(200).json({ success: true, data: orders });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:orderId', async (req, res) => {
  try {
    const order = await SupplyRequest.findById(req.params.orderId)
      .populate('productId', 'name category')
      .lean();

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (String(order.supplierId || '') !== String(req.auth.sub)) {
      return res.status(403).json({ success: false, message: 'You are not authorized to view this order' });
    }

    return res.status(200).json({
      success: true,
      data: {
        ...order,
        productCategory: order?.productId?.category || order?.productCategory || '',
        productName: order?.productName || order?.productId?.name || ''
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/update-status/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const requestedStatus = String(req.body?.status || '').trim();
    const deliveryNotes = String(req.body?.notes || '').trim();
    const deliveryProofs = normalizeDeliveryProofs(req.body?.deliveryProofs);

    const order = await SupplyRequest.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (String(order.supplierId || '') !== String(req.auth.sub)) {
      return res.status(403).json({ success: false, message: 'Only assigned supplier can update this order' });
    }

    if (!DELIVERY_FLOW.includes(order.status)) {
      return res.status(400).json({ success: false, message: `Order is in ${order.status} stage and cannot be updated in supplier workflow` });
    }

    const nextStatus = getNextStatus(order.status);
    if (!nextStatus) {
      return res.status(400).json({ success: false, message: 'Order is already at final Delivered stage' });
    }

    const targetStatus = requestedStatus || nextStatus;
    if (targetStatus !== nextStatus) {
      return res.status(400).json({
        success: false,
        message: `Invalid transition. Allowed next status from ${order.status} is ${nextStatus}`
      });
    }

    const now = new Date();
    order.status = targetStatus;
    if (!Array.isArray(order.statusHistory)) {
      order.statusHistory = [];
    }

    order.statusHistory.push({
      status: targetStatus,
      updatedAt: now,
      updatedBy: req.auth.sub,
      updatedByName: req.auth.name || req.auth.email || 'Supplier',
      notes: deliveryNotes || 'Updated from supplier delivery panel'
    });

    if (targetStatus === 'Processing' && !order.acceptedAt) {
      order.acceptedAt = now;
    }
    if (targetStatus === 'Shipped') {
      order.shippedAt = now;
    }
    if (targetStatus === 'Delivered') {
      if (deliveryProofs.length === 0) {
        return res.status(400).json({ success: false, message: 'Upload delivery proof files before marking Delivered' });
      }
      const hasChallan = deliveryProofs.some((item) => item.type === 'challan');
      if (!hasChallan) {
        return res.status(400).json({ success: false, message: 'Delivery Challan is required to mark Delivered' });
      }
      order.deliveredAt = now;
      order.deliveryProofs = deliveryProofs;
      await createNotification({
        role: 'staff',
        type: 'info',
        title: 'Order delivered by supplier',
        message: `${order.requestId} is marked Delivered and waiting for inventory confirmation`,
        metadata: { requestId: order.requestId, orderId: order._id }
      });
    }

    await order.save();

    await createNotification({
      role: 'supplier',
      userId: req.auth.sub,
      type: 'info',
      title: 'Order status updated',
      message: `${order.requestId} moved to ${targetStatus}`,
      metadata: { requestId: order.requestId, orderId: order._id, status: targetStatus }
    });

    await logActivity({
      action: 'SUPPLIER_ORDER_STATUS_UPDATED',
      details: `${order.requestId} moved to ${targetStatus}`,
      actor: req.auth,
      metadata: {
        requestId: order.requestId,
        orderId: order._id,
        status: targetStatus,
        updatedAt: now
      }
    });

    return res.status(200).json({ success: true, data: order });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.patch('/:orderId/delivery-note', async (req, res) => {
  try {
    const note = String(req.body?.note || '').trim();
    if (!note) {
      return res.status(400).json({ success: false, message: 'note is required' });
    }

    const order = await SupplyRequest.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (String(order.supplierId || '') !== String(req.auth.sub)) {
      return res.status(403).json({ success: false, message: 'Only assigned supplier can add notes' });
    }

    if (!Array.isArray(order.statusHistory)) {
      order.statusHistory = [];
    }

    order.statusHistory.push({
      status: order.status,
      updatedAt: new Date(),
      updatedBy: req.auth.sub,
      updatedByName: req.auth.name || req.auth.email || 'Supplier',
      notes: note
    });
    await order.save();

    await logActivity({
      action: 'SUPPLIER_ORDER_NOTE_ADDED',
      details: `Delivery note added to ${order.requestId}`,
      actor: req.auth,
      metadata: { orderId: order._id, requestId: order.requestId }
    });

    return res.status(200).json({ success: true, data: order });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
