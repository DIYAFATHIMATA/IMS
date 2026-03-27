import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Truck, Loader2, MessageSquarePlus } from 'lucide-react';
import { authStorage } from '../../services/authStorage';
import { ordersApi } from '../../services/api';
import StatusBadge from '../../components/ui/StatusBadge';
import NotificationAlert from '../../components/ui/NotificationAlert';

const FLOW = ['Approved', 'Delivered'];

const getNextStatus = (status) => {
  const index = FLOW.indexOf(String(status || ''));
  if (index === -1 || index >= FLOW.length - 1) return null;
  return FLOW[index + 1];
};

const formatDateTime = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const timelineTitle = (status) => {
  const map = {
    Pending: 'Order Created',
    Approved: 'Order Approved',
    Accepted: 'Supplier Accepted',
    Processing: 'Order Processing',
    Shipped: 'Order Shipped',
    Delivered: 'Order Delivered',
    Completed: 'Order Completed',
    Rejected: 'Order Rejected'
  };
  return map[status] || status;
};

export default function SupplierOrderDetails() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const token = authStorage.getToken();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [addingNote, setAddingNote] = useState(false);
  const [notice, setNotice] = useState(null);
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [noteOnlyText, setNoteOnlyText] = useState('');
  const [proofChallan, setProofChallan] = useState(null);
  const [proofInvoice, setProofInvoice] = useState(null);
  const [proofPhotos, setProofPhotos] = useState([]);

  const fetchOrder = async () => {
    if (!token || !orderId) return;
    setLoading(true);
    try {
      const res = await ordersApi.getById(orderId, token);
      const row = res.data || null;
      setOrder(row);
      setDeliveryNotes('');
    } catch (error) {
      setNotice({ type: 'error', message: error.message || 'Failed to load order details' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const nextStatus = useMemo(() => getNextStatus(order?.status), [order?.status]);
  const isCompleted = !nextStatus;

  const timelineItems = useMemo(() => {
    const history = Array.isArray(order?.statusHistory) ? [...order.statusHistory] : [];
    return history.sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
  }, [order?.statusHistory]);

  const handleUpdateStatus = async () => {
    if (!nextStatus || !order) return;
    setUpdating(true);
    try {
      const toDataUrl = (file) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ''));
          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.readAsDataURL(file);
        });

      const deliveryProofs = [];
      if (nextStatus === 'Delivered') {
        if (!proofChallan) {
          setNotice({ type: 'warning', message: 'Delivery Challan is required to mark Delivered.' });
          setUpdating(false);
          return;
        }

        const challanDataUrl = await toDataUrl(proofChallan);
        deliveryProofs.push({
          type: 'challan',
          fileName: proofChallan.name,
          mimeType: proofChallan.type || 'application/octet-stream',
          dataUrl: challanDataUrl
        });

        if (proofInvoice) {
          const invoiceDataUrl = await toDataUrl(proofInvoice);
          deliveryProofs.push({
            type: 'invoice',
            fileName: proofInvoice.name,
            mimeType: proofInvoice.type || 'application/octet-stream',
            dataUrl: invoiceDataUrl
          });
        }

        for (const photo of proofPhotos) {
          const photoDataUrl = await toDataUrl(photo);
          deliveryProofs.push({
            type: 'photo',
            fileName: photo.name,
            mimeType: photo.type || 'application/octet-stream',
            dataUrl: photoDataUrl
          });
        }
      }

      await ordersApi.updateStatus(order._id, { status: nextStatus, notes: deliveryNotes, deliveryProofs }, token);
      await fetchOrder();
      setProofChallan(null);
      setProofInvoice(null);
      setProofPhotos([]);
      setNotice({ type: 'success', message: `Order moved to ${nextStatus}.` });
    } catch (error) {
      setNotice({ type: 'error', message: error.message || 'Failed to update order status' });
    } finally {
      setUpdating(false);
    }
  };

  const handleAddNote = async () => {
    const note = noteOnlyText.trim();
    if (!note || !order) return;
    setAddingNote(true);
    try {
      await ordersApi.addDeliveryNote(order._id, note, token);
      setNoteOnlyText('');
      await fetchOrder();
      setNotice({ type: 'success', message: 'Delivery note added.' });
    } catch (error) {
      setNotice({ type: 'error', message: error.message || 'Failed to add delivery note' });
    } finally {
      setAddingNote(false);
    }
  };

  if (loading) {
    return (
      <div className="h-52 flex items-center justify-center text-zinc-400">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="ml-2">Loading order details...</span>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-4">
        {notice ? <NotificationAlert type={notice.type} message={notice.message} onClose={() => setNotice(null)} /> : null}
        <button onClick={() => navigate('/supplier/orders')} className="text-sm text-emerald-600 hover:underline inline-flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to orders
        </button>
        <div className="bg-white dark:bg-gray-800 border border-zinc-200 dark:border-gray-700 rounded-2xl p-8 text-sm text-zinc-500">
          Order not found.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {notice ? <NotificationAlert type={notice.type} message={notice.message} onClose={() => setNotice(null)} /> : null}

      <div className="flex items-center justify-between">
        <Link to="/supplier/orders" className="text-sm text-emerald-600 hover:underline inline-flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to orders
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 bg-white dark:bg-gray-800 border border-zinc-200 dark:border-gray-700 rounded-2xl p-5 space-y-5">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Order Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div><p className="text-zinc-500">Order ID</p><p className="font-semibold text-zinc-900 dark:text-white">{order.requestId}</p></div>
            <div><p className="text-zinc-500">Current Order Status</p><p><StatusBadge status={order.status} /></p></div>
            <div><p className="text-zinc-500">Request Date</p><p className="font-medium text-zinc-800 dark:text-zinc-200">{formatDateTime(order.requestDate || order.createdAt)}</p></div>
            <div><p className="text-zinc-500">Expected Delivery Date</p><p className="font-medium text-zinc-800 dark:text-zinc-200">{formatDateTime(order.expectedDeliveryDate)}</p></div>
            <div><p className="text-zinc-500">Requested By (Staff Name)</p><p className="font-medium text-zinc-800 dark:text-zinc-200">{order.staffName || '-'}</p></div>
            <div><p className="text-zinc-500">Supplier Name</p><p className="font-medium text-zinc-800 dark:text-zinc-200">{order.supplierName || '-'}</p></div>
          </div>

          <div className="border-t border-zinc-200 dark:border-gray-700 pt-4">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-white mb-3">Product Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div><p className="text-zinc-500">Product Name</p><p className="font-medium text-zinc-800 dark:text-zinc-200">{order.productName || '-'}</p></div>
              <div><p className="text-zinc-500">Product Category</p><p className="font-medium text-zinc-800 dark:text-zinc-200">{order.productCategory || '-'}</p></div>
              <div><p className="text-zinc-500">Quantity Requested</p><p className="font-medium text-zinc-800 dark:text-zinc-200">{order.quantity}</p></div>
            </div>
          </div>

          <div className="border-t border-zinc-200 dark:border-gray-700 pt-4">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-white mb-3">Delivery Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div><p className="text-zinc-500">Delivery Address</p><p className="font-medium text-zinc-800 dark:text-zinc-200">{order.deliveryAddress || '-'}</p></div>
              <div><p className="text-zinc-500">Order Notes</p><p className="font-medium text-zinc-800 dark:text-zinc-200 whitespace-pre-line">{order.notes || '-'}</p></div>
            </div>
          </div>
        </section>

        <section className="bg-white dark:bg-gray-800 border border-zinc-200 dark:border-gray-700 rounded-2xl p-5">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Actions</h2>

          {isCompleted ? (
            <div className="text-sm text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
              This order is completed.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-sm text-zinc-600 dark:text-zinc-300">
                Next status: <span className="font-semibold">{nextStatus}</span>
              </div>
              {nextStatus === 'Delivered' ? (
                <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/60 p-3">
                  <p className="text-xs font-semibold text-amber-700">Upload delivery proof files before marking Delivered.</p>
                  <div>
                    <label className="text-xs font-medium text-zinc-700">Delivery Challan (Required)</label>
                    <input
                      type="file"
                      className="air-input mt-1"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      onChange={(e) => setProofChallan(e.target.files?.[0] || null)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-zinc-700">Invoice (Optional)</label>
                    <input
                      type="file"
                      className="air-input mt-1"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      onChange={(e) => setProofInvoice(e.target.files?.[0] || null)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-zinc-700">Delivery Photos (Optional)</label>
                    <input
                      type="file"
                      className="air-input mt-1"
                      accept=".jpg,.jpeg,.png,.webp"
                      multiple
                      onChange={(e) => setProofPhotos(Array.from(e.target.files || []))}
                    />
                  </div>
                </div>
              ) : null}
              <textarea
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                className="air-input min-h-[92px]"
                placeholder="Add delivery notes while updating status (optional)"
              />
              <button onClick={handleUpdateStatus} disabled={updating} className="air-btn-primary w-full bg-blue-600 hover:bg-blue-700">
                {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
                Mark as {nextStatus}
              </button>
            </div>
          )}

          <div className="mt-5 pt-4 border-t border-zinc-200 dark:border-gray-700 space-y-3">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Add Delivery Note</h3>
            <textarea
              value={noteOnlyText}
              onChange={(e) => setNoteOnlyText(e.target.value)}
              className="air-input min-h-[84px]"
              placeholder="Add a delivery note without changing status"
            />
            <button onClick={handleAddNote} disabled={addingNote || !noteOnlyText.trim()} className="w-full px-3 py-2 rounded-lg border border-zinc-300 text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2">
              {addingNote ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquarePlus className="w-4 h-4" />}
              Save Note
            </button>
          </div>
        </section>
      </div>

      <section className="bg-white dark:bg-gray-800 border border-zinc-200 dark:border-gray-700 rounded-2xl p-5">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Status Timeline</h2>
        {timelineItems.length === 0 ? (
          <p className="text-sm text-zinc-500">No status history available.</p>
        ) : (
          <ol className="space-y-3">
            {timelineItems.map((item, index) => (
              <li key={`${item.status}-${item.updatedAt}-${index}`} className="flex gap-3">
                <span className="mt-1 w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-white">{timelineTitle(item.status)}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{formatDateTime(item.updatedAt)}</p>
                  {item.notes ? <p className="text-xs text-zinc-600 mt-1">{item.notes}</p> : null}
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="bg-white dark:bg-gray-800 border border-zinc-200 dark:border-gray-700 rounded-2xl p-5">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Delivery Proofs</h2>
        {Array.isArray(order.deliveryProofs) && order.deliveryProofs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {order.deliveryProofs.map((proof, index) => (
              <a
                key={`${proof.fileName}-${index}`}
                href={proof.dataUrl}
                target="_blank"
                rel="noreferrer"
                className="block rounded-xl border border-zinc-200 dark:border-gray-700 p-3 hover:bg-zinc-50 dark:hover:bg-gray-700/40"
              >
                <p className="text-sm font-semibold text-zinc-900 dark:text-white capitalize">{proof.type}</p>
                <p className="text-xs text-zinc-500 mt-1 truncate">{proof.fileName}</p>
              </a>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">No delivery proof uploaded yet.</p>
        )}
      </section>
    </div>
  );
}
