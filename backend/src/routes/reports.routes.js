import { Router } from 'express';
import Invoice from '../models/Invoice.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import Product from '../models/Product.js';
import Customer from '../models/Customer.js';
import SupplyRequest from '../models/SupplyRequest.js';
import User from '../models/User.js';
import { requireAuth, requireRoles, ROLE_ADMIN, ROLE_STAFF } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth, requireRoles(ROLE_ADMIN, ROLE_STAFF));

const formatMonthKey = (date) => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

const formatMonthLabel = (date) =>
  date.toLocaleString('en-IN', {
    month: 'short'
  });

router.get('/summary', async (_req, res) => {
  try {
    const [
      salesAgg,
      purchasesAgg,
      invoiceCount,
      purchaseOrderCount,
      productsCount,
      customersCount,
      staffCount,
      suppliersCount,
      lowStockCount,
      monthlySalesRaw,
      supplyStatusAgg
    ] = await Promise.all([
      Invoice.aggregate([
        {
          $group: {
            _id: null,
            totalSalesRevenue: { $sum: { $ifNull: ['$total', 0] } },
            totalGstCollected: { $sum: { $ifNull: ['$tax', 0] } }
          }
        }
      ]),
      PurchaseOrder.aggregate([
        {
          $group: {
            _id: null,
            totalPurchaseCost: { $sum: { $ifNull: ['$total', 0] } },
            totalGstPaid: { $sum: { $ifNull: ['$tax', 0] } }
          }
        }
      ]),
      Invoice.countDocuments(),
      PurchaseOrder.countDocuments(),
      Product.countDocuments(),
      Customer.countDocuments(),
      User.countDocuments({ role: 'staff', isActive: true }),
      User.countDocuments({ role: 'supplier', isActive: true }),
      Product.countDocuments({
        $expr: {
          $lt: ['$stock', '$minStockLevel']
        }
      }),
      Invoice.aggregate([
        {
          $addFields: {
            effectiveDate: {
              $ifNull: ['$date', '$createdAt']
            }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$effectiveDate' },
              month: { $month: '$effectiveDate' }
            },
            value: { $sum: { $ifNull: ['$total', 0] } }
          }
        }
      ]),
      SupplyRequest.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    const sales = salesAgg[0] || {};
    const purchases = purchasesAgg[0] || {};

    const now = new Date();
    const monthPoints = [];
    for (let offset = 5; offset >= 0; offset -= 1) {
      const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1));
      monthPoints.push({
        key: formatMonthKey(date),
        label: formatMonthLabel(date),
        value: 0
      });
    }

    const monthIndex = new Map(monthPoints.map((point) => [point.key, point]));

    for (const entry of monthlySalesRaw) {
      const month = String(entry?._id?.month || '').padStart(2, '0');
      const year = entry?._id?.year;
      const key = `${year}-${month}`;
      if (monthIndex.has(key)) {
        monthIndex.get(key).value = Number(entry.value || 0);
      }
    }

    const totalSalesRevenue = Number(sales.totalSalesRevenue || 0);
    const totalPurchaseCost = Number(purchases.totalPurchaseCost || 0);
    const totalGstCollected = Number(sales.totalGstCollected || 0);
    const totalGstPaid = Number(purchases.totalGstPaid || 0);
    const supplyStatusMap = (supplyStatusAgg || []).reduce((acc, entry) => {
      acc[String(entry._id || 'Unknown')] = Number(entry.count || 0);
      return acc;
    }, {});

    const pendingSupplyRequests = Number(supplyStatusMap.Pending || 0);
    const approvedSupplyRequests = Number(supplyStatusMap.Approved || 0);
    const deliveredSupplyRequests = Number(supplyStatusMap.Delivered || 0);
    const verifiedSupplyRequests = Number(supplyStatusMap.Verified || 0);
    const openSupplyRequests =
      pendingSupplyRequests +
      approvedSupplyRequests +
      Number(supplyStatusMap.Accepted || 0) +
      Number(supplyStatusMap.Processing || 0) +
      Number(supplyStatusMap.Shipped || 0);

    return res.json({
      success: true,
      data: {
        totalSalesRevenue,
        totalPurchaseCost,
        totalGstCollected,
        totalGstPaid,
        netGst: totalGstCollected - totalGstPaid,
        invoiceCount,
        purchaseOrderCount,
        productsCount,
        customersCount,
        staffCount,
        suppliersCount,
        lowStockCount,
        pendingSupplyRequests,
        approvedSupplyRequests,
        deliveredSupplyRequests,
        verifiedSupplyRequests,
        openSupplyRequests,
        monthlySalesTrend: monthPoints
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/inventory', async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit || 100), 1), 500);
    const skip = Math.max(Number(req.query.skip || 0), 0);
    const products = await Product.find({})
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit)
      .lean();
    return res.json({
      success: true,
      data: products,
      pagination: { limit, skip, count: products.length }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/sales', async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit || 100), 1), 500);
    const skip = Math.max(Number(req.query.skip || 0), 0);
    const invoices = await Invoice.find({})
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    const totalRevenue = invoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0);
    return res.json({
      success: true,
      data: invoices,
      summary: { totalSales: invoices.length, totalRevenue },
      pagination: { limit, skip, count: invoices.length }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/purchases', async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit || 100), 1), 500);
    const skip = Math.max(Number(req.query.skip || 0), 0);
    const orders = await PurchaseOrder.find({})
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    const totalCost = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);
    return res.json({
      success: true,
      data: orders,
      summary: { totalPurchases: orders.length, totalCost },
      pagination: { limit, skip, count: orders.length }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/supplier-performance', async (_req, res) => {
  try {
    const supplierStats = await SupplyRequest.aggregate([
      {
        $match: {
          supplierId: { $ne: null }
        }
      },
      {
        $group: {
          _id: '$supplierId',
          supplierName: { $last: '$supplierName' },
          totalRequests: { $sum: 1 },
          completedDeliveries: {
            $sum: {
              $cond: [{ $eq: ['$status', 'Verified'] }, 1, 0]
            }
          },
          avgDeliveryHours: {
            $avg: {
              $cond: [
                {
                  $and: [
                    { $ifNull: ['$acceptedAt', false] },
                    { $ifNull: ['$deliveredAt', false] }
                  ]
                },
                {
                  $divide: [{ $subtract: ['$deliveredAt', '$acceptedAt'] }, 3600000]
                },
                null
              ]
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          supplierId: '$_id',
          supplierName: {
            $cond: [
              { $eq: ['$supplierName', ''] },
              'Unknown Supplier',
              '$supplierName'
            ]
          },
          totalRequests: 1,
          completedDeliveries: 1,
          completionRate: {
            $cond: [
              { $eq: ['$totalRequests', 0] },
              0,
              {
                $multiply: [
                  { $divide: ['$completedDeliveries', '$totalRequests'] },
                  100
                ]
              }
            ]
          },
          avgDeliveryHours: {
            $round: [{ $ifNull: ['$avgDeliveryHours', 0] }, 2]
          }
        }
      },
      {
        $sort: { completionRate: -1, totalRequests: -1 }
      }
    ]);

    return res.json({ success: true, data: supplierStats });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
