import { useEffect, useMemo, useState } from 'react';
import { PackageCheck, Truck, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { authStorage } from '../../services/authStorage';
import { ordersApi } from '../../services/api';
import Table from '../../components/Table';
import StatusBadge from '../../components/ui/StatusBadge';
import NotificationAlert from '../../components/ui/NotificationAlert';

const FLOW = ['Approved', 'Delivered'];

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const getNextStatus = (status) => {
  const index = FLOW.indexOf(status);
  if (index === -1 || index === FLOW.length - 1) return null;
  return FLOW[index + 1];
};

export default function SupplierOrders() {
  const token = authStorage.getToken();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);
  const [nextSelection, setNextSelection] = useState({});
  const [updatingId, setUpdatingId] = useState('');

  const fetchOrders = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await ordersApi.getSupplierOrders(token, { status: 'all' });
      const rows = res.data || [];
      setOrders(rows);
      setNextSelection(
        rows.reduce((acc, row) => {
          const next = getNextStatus(row.status);
          if (next) acc[row._id] = next;
          return acc;
        }, {})
      );
    } catch (error) {
      setNotice({ type: 'error', message: error.message || 'Failed to load supplier orders' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const statusSummary = useMemo(() => {
    const count = (status) => orders.filter((item) => item.status === status).length;
    return {
      approved: count('Approved'),
      delivered: count('Delivered')
    };
  }, [orders]);

  const handleStatusUpdate = async (order) => {
    const targetStatus = nextSelection[order._id] || getNextStatus(order.status);
    if (!targetStatus) return;

    setUpdatingId(order._id);
    try {
      await ordersApi.updateStatus(order._id, { status: targetStatus }, token);
      await fetchOrders();
      setNotice({
        type: 'success',
        message: `Order ${order.requestId} moved to ${targetStatus}.`
      });
    } catch (error) {
      setNotice({ type: 'error', message: error.message || 'Failed to update order status' });
    } finally {
      setUpdatingId('');
    }
  };

  const columns = [
    { header: 'Order ID', accessor: 'requestId' },
    { header: 'Product Name', accessor: 'productName' },
    { header: 'Quantity', accessor: 'quantity' },
    {
      header: 'Request Date',
      accessor: 'requestDate',
      render: (row) => formatDate(row.requestDate || row.createdAt)
    },
    {
      header: 'Expected Delivery Date',
      accessor: 'expectedDeliveryDate',
      render: (row) => formatDate(row.expectedDeliveryDate)
    },
    {
      header: 'Current Status',
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status} />
    }
  ];

  return (
    <div className="space-y-6">
      {notice && (
        <NotificationAlert
          type={notice.type}
          message={notice.message}
          onClose={() => setNotice(null)}
        />
      )}

      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Supplier Order / Delivery Management</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Manage accepted supply requests and update delivery progress step by step.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">Approved</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{statusSummary.approved}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">Delivered</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{statusSummary.delivered}</p>
        </div>
      </div>

      <Table
        columns={columns}
        data={orders}
        searchPlaceholder="Search by order ID or product name..."
        filters={[
          {
            key: 'status',
            label: 'Status',
            options: [
              { label: 'Approved', value: 'Approved' },
              { label: 'Delivered', value: 'Delivered' }
            ]
          }
        ]}
        emptyText={loading ? 'Loading assigned orders...' : 'No accepted orders assigned yet.'}
        actions={(order) => {
          const nextStatus = getNextStatus(order.status);
          if (!nextStatus) {
            return (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold inline-flex items-center gap-1">
                <PackageCheck className="w-3.5 h-3.5" /> Complete
              </span>
            );
          }

          if (order.status === 'Approved') {
            return (
              <div className="flex items-center justify-end gap-2">
                <Link to={`/supplier/orders/${order._id}`} className="air-btn-primary px-3 py-2 text-xs">
                  Upload Challan & Deliver
                </Link>
              </div>
            );
          }

          return (
            <div className="flex items-center justify-end gap-2">
              <Link to={`/supplier/orders/${order._id}`} className="px-3 py-2 text-xs font-semibold rounded-lg border border-zinc-300 text-zinc-700 hover:bg-zinc-50">
                Details
              </Link>
            </div>
          );
        }}
      />
    </div>
  );
}
