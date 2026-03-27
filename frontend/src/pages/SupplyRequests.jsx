import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Truck, CheckCircle2, XCircle, PackageCheck, ClipboardList, Layers3 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authStorage } from '../services/authStorage';
import { inventoryApi, suppliersApi, supplyRequestsApi } from '../services/api';
import { ADMIN_ROLE, STAFF_ROLE, SUPPLIER_ROLE } from '../utils/roles';
import Table from '../components/Table';
import StatusBadge from '../components/ui/StatusBadge';
import NotificationAlert from '../components/ui/NotificationAlert';

export default function SupplyRequests() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newRequest, setNewRequest] = useState({
    productId: '',
    supplierId: '',
    quantity: '',
    expectedDeliveryDate: '',
    notes: '',
    isNewProduct: false,
    newProductName: '',
    newProductCategory: '',
    unitCost: '',
    gst: 18
  });
  const [notice, setNotice] = useState(null);
  const [activeStatus, setActiveStatus] = useState('all');

  const role = user?.role;
  const token = authStorage.getToken();
  const todayDate = useMemo(() => {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  }, []);

  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const requestPromise = supplyRequestsApi.getAll(token);
      const productPromise = role === STAFF_ROLE ? inventoryApi.getItems(token) : Promise.resolve({ data: [] });
      const supplierPromise = role === STAFF_ROLE ? suppliersApi.getAll(token) : Promise.resolve({ data: [] });
      const [requestRes, productRes, supplierRes] = await Promise.all([requestPromise, productPromise, supplierPromise]);
      setRequests(requestRes.data || []);
      setProducts(productRes.data || []);
      setSuppliers(supplierRes.data || []);
    } catch (error) {
      setNotice({ type: 'error', message: error.message || 'Failed to load supply requests' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [role]);

  const summary = useMemo(() => {
    const count = (status) => requests.filter((request) => request.status === status).length;
    return {
      pending: count('Pending'),
      approved: count('Approved'),
      delivered: count('Delivered'),
      completed: count('Completed') + count('Verified')
    };
  }, [requests]);

  const statusCardMeta = {
    all: {
      label: 'All',
      value: requests.length,
      tone: 'border-slate-200 bg-white dark:bg-slate-800 text-slate-600',
      activeTone: 'border-slate-400 ring-2 ring-slate-100 bg-slate-50'
    },
    Pending: {
      label: 'Pending',
      value: summary.pending,
      tone: 'border-slate-200 bg-white dark:bg-slate-800 text-amber-600',
      activeTone: 'border-amber-400 ring-2 ring-amber-100 bg-amber-50/30'
    },
    Approved: {
      label: 'Approved',
      value: summary.approved,
      tone: 'border-slate-200 bg-white dark:bg-slate-800 text-blue-600',
      activeTone: 'border-blue-400 ring-2 ring-blue-100 bg-blue-50/30'
    },
    Delivered: {
      label: 'Delivered',
      value: summary.delivered,
      tone: 'border-slate-200 bg-white dark:bg-slate-800 text-emerald-600',
      activeTone: 'border-emerald-400 ring-2 ring-emerald-100 bg-emerald-50/30'
    },
    Completed: {
      label: 'Completed',
      value: summary.completed || requests.filter(r => r.status === 'Completed' || r.status === 'Verified').length,
      tone: 'border-slate-200 bg-white dark:bg-slate-800 text-green-600',
      activeTone: 'border-green-400 ring-2 ring-green-100 bg-green-50/30'
    }
  };

  const visibleRequests = useMemo(() => {
    if (activeStatus === 'all') return requests;
    if (activeStatus === 'Completed') {
        return requests.filter(r => r.status === 'Completed' || r.status === 'Verified');
    }
    return requests.filter((request) => request.status === activeStatus);
  }, [requests, activeStatus]);

  const canCreate = role === STAFF_ROLE;
  const isSupplier = role === SUPPLIER_ROLE;
  const isAdmin = role === ADMIN_ROLE;

  const workflowStages = ['Pending', 'Approved', 'Delivered', 'Completed'];

  const normalizeWorkflowStatus = (status) => {
    if (status === 'Verified') return 'Completed';
    return status;
  };

  const createRequest = async (e) => {
    e.preventDefault();
    if (!newRequest.quantity) {
      setNotice({ type: 'warning', message: 'Enter quantity before creating request.' });
      return;
    }

    if (newRequest.isNewProduct) {
      if (!newRequest.newProductName.trim() || !newRequest.newProductCategory.trim()) {
        setNotice({ type: 'warning', message: 'Enter new product name and category.' });
        return;
      }
    } else if (!newRequest.productId) {
      setNotice({ type: 'warning', message: 'Select product before creating request.' });
      return;
    }

    if (!newRequest.supplierId) {
      setNotice({ type: 'warning', message: 'Select a supplier for this request.' });
      return;
    }

    if (newRequest.expectedDeliveryDate && newRequest.expectedDeliveryDate < todayDate) {
      setNotice({ type: 'warning', message: 'Expected delivery date cannot be in the past.' });
      return;
    }

    try {
      const payload = {
        quantity: Number(newRequest.quantity),
        supplierId: newRequest.supplierId,
        expectedDeliveryDate: newRequest.expectedDeliveryDate || undefined,
        notes: newRequest.notes
      };

      if (newRequest.isNewProduct) {
        payload.newProductName = newRequest.newProductName.trim();
        payload.newProductCategory = newRequest.newProductCategory.trim();
        payload.unitCost = Number(newRequest.unitCost || 0);
        payload.gst = Number(newRequest.gst || 18);
      } else {
        payload.productId = newRequest.productId;
      }

      await supplyRequestsApi.create(
        payload,
        token
      );
      setNewRequest({
        productId: '',
        supplierId: '',
        quantity: '',
        expectedDeliveryDate: '',
        notes: '',
        isNewProduct: false,
        newProductName: '',
        newProductCategory: '',
        unitCost: '',
        gst: 18
      });
      await fetchData();
      setNotice({ type: 'success', message: 'Supply request created successfully.' });
    } catch (error) {
      setNotice({ type: 'error', message: error.message || 'Failed to create request' });
    }
  };

  const handleSupplierAction = async (request, type) => {
    try {
      if (type === 'accept') {
        await supplyRequestsApi.respond(request._id, 'Accepted', token);
      } else if (type === 'reject') {
        await supplyRequestsApi.respond(request._id, 'Rejected', token);
      } else {
        await supplyRequestsApi.updateStatus(request._id, type, token);
      }
      await fetchData();
      setNotice({ type: 'success', message: 'Supply request updated.' });
    } catch (error) {
      setNotice({ type: 'error', message: error.message || 'Failed to update request' });
    }
  };

  const markReceived = async (id) => {
    try {
      await supplyRequestsApi.markReceived(id, token);
      await fetchData();
      setNotice({ type: 'success', message: 'Delivery verified and inventory updated.' });
    } catch (error) {
      setNotice({ type: 'error', message: error.message || 'Failed to verify delivery' });
    }
  };

  const approveRequest = async (id, decision = 'Approved') => {
    try {
      if (decision === 'Rejected') {
        await supplyRequestsApi.respond(id, 'Rejected', token);
      } else {
        await supplyRequestsApi.approve(id, token);
      }
      await fetchData();
      setNotice({ type: 'success', message: `Supply request ${decision.toLowerCase()}.` });
    } catch (error) {
      setNotice({ type: 'error', message: error.message || `Failed to ${decision.toLowerCase()} request` });
    }
  };

  const getPrimaryAction = (request) => {
    const status = request.status;

    if (status === 'Pending' && isAdmin) {
      return [
        {
          label: 'Approve',
          icon: <CheckCircle2 className="w-4 h-4" />,
          className: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200/50',
          onClick: () => approveRequest(request._id, 'Approved')
        },
        {
          label: 'Reject',
          icon: <XCircle className="w-4 h-4" />,
          className: 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200',
          onClick: () => approveRequest(request._id, 'Rejected')
        }
      ];
    }

    if (status === 'Approved' && isSupplier) {
      return [
        {
          label: 'Mark Delivered',
          icon: <Truck className="w-4 h-4" />,
          className: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200/50',
          onClick: () => navigate(`/supplier/orders/${request._id}`)
        }
      ];
    }

    if (status === 'Delivered' && canCreate) {
      return [
        {
          label: 'Complete Request',
          icon: <PackageCheck className="w-4 h-4" />,
          className: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200/50',
          onClick: () => markReceived(request._id)
        }
      ];
    }

    return null;
  };

  const columns = [
    {
      header: 'Request#',
      accessor: 'requestId',
      render: (row) => (
        <span className="inline-flex items-center rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-1 border border-slate-200 dark:border-slate-700 text-[12px] font-semibold tracking-wide text-slate-700 dark:text-slate-300">
          {row.requestId}
        </span>
      )
    },
    { header: 'Product', accessor: 'productName' },
    { header: 'Qty', accessor: 'quantity', render: (row) => <span className="font-semibold text-slate-800 dark:text-slate-200">{row.quantity}</span> },
    { header: 'Staff', accessor: 'staffName' },
    { header: 'Supplier', accessor: 'supplierName', render: (row) => row.supplierName || '-' },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Timeline',
      accessor: 'workflowProgress',
      sortable: false,
      render: (row) => {
        const current = normalizeWorkflowStatus(row.status);
        const activeIndex = workflowStages.indexOf(current);
        const isRejected = row.status === 'Rejected';

        return (
          <div className="min-w-[140px]">
            <div className="flex items-center justify-between mb-1.5 px-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {isRejected ? 'Request Rejected' : `${Math.round(((activeIndex + 1) / workflowStages.length) * 100)}% Complete`}
              </span>
            </div>
            <div className="flex items-center gap-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200/50 dark:border-slate-700/50">
              {workflowStages.map((stage, index) => {
                const isDone = activeIndex >= index && activeIndex !== -1;
                const isActive = stage === current;
                
                let colorClass = 'bg-slate-200 dark:bg-slate-700';
                if (isRejected) {
                    colorClass = index <= activeIndex ? 'bg-rose-400' : 'bg-slate-200';
                } else if (isActive) {
                    colorClass = 'bg-emerald-500 animate-pulse';
                } else if (isDone) {
                    colorClass = 'bg-emerald-400';
                }

                return (
                  <div
                    key={`${row._id}-${stage}`}
                    title={stage}
                    className={`h-full flex-1 rounded-full transition-all duration-500 ${colorClass}`}
                  />
                );
              })}
            </div>
          </div>
        );
      }
    },
    {
        header: 'Dates',
        accessor: 'dates',
        render: (row) => (
            <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                    Exp: {row.expectedDeliveryDate ? new Date(row.expectedDeliveryDate).toLocaleDateString() : 'N/A'}
                </div>
                {row.actualDeliveryDate && (
                    <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Del: {new Date(row.actualDeliveryDate).toLocaleDateString()}
                    </div>
                )}
            </div>
        )
    },
    {
      header: 'Inventory',
      accessor: 'inventoryUpdated',
      render: (row) => <StatusBadge status={row.inventoryUpdated ? 'Active' : 'Pending'} />
    }
  ];

  const selectedProduct = useMemo(
    () => products.find((item) => item._id === newRequest.productId) || null,
    [products, newRequest.productId]
  );

  const selectedCategory = useMemo(() => {
    if (newRequest.isNewProduct) {
      return String(newRequest.newProductCategory || '').trim();
    }
    return String(selectedProduct?.category || '').trim();
  }, [newRequest.isNewProduct, newRequest.newProductCategory, selectedProduct]);

  const linkedSuppliers = useMemo(
    () => suppliers.filter((supplier) => supplier.userId),
    [suppliers]
  );

  const matchedSuppliers = useMemo(() => {
    if (!selectedCategory) return linkedSuppliers;
    const normalizedCategory = selectedCategory.toLowerCase();
    return linkedSuppliers.filter(
      (supplier) => String(supplier.supplierCategory || '').trim().toLowerCase() === normalizedCategory
    );
  }, [linkedSuppliers, selectedCategory]);

  const filteredSuppliers = useMemo(() => {
    // Fallback to all linked suppliers so the dropdown never becomes empty.
    const baseList = matchedSuppliers.length > 0 ? matchedSuppliers : linkedSuppliers;

    // Keep currently selected supplier visible even if filters changed.
    if (!newRequest.supplierId) return baseList;
    if (baseList.some((supplier) => supplier._id === newRequest.supplierId)) return baseList;
    const selected = linkedSuppliers.find((supplier) => supplier._id === newRequest.supplierId);
    return selected ? [selected, ...baseList] : baseList;
  }, [linkedSuppliers, matchedSuppliers, newRequest.supplierId]);

  return (
    <div className="space-y-7">
      {notice ? (
        <NotificationAlert
          type={notice.type}
          message={notice.message}
          onClose={() => setNotice(null)}
        />
      ) : null}

      <section className="air-surface rounded-3xl border border-slate-200/80 dark:border-slate-700/80 p-5 md:p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[11px] uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">Workflow Dashboard</p>
            <h1 className="text-[22px] font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-emerald-600" />
              Supply Requests
            </h1>
            <p className="text-[13px] text-slate-600 dark:text-slate-300 mt-1">
              {isSupplier
                ? 'Review requests, accept or reject, and update delivery progress.'
                : isAdmin
                  ? 'Monitor end-to-end supply request lifecycle and outcomes.'
                  : 'Create supply requests quickly and verify delivered stock.'}
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/60 px-3.5 py-2">
            <Layers3 className="w-4 h-4 text-slate-500" />
            <span className="text-[11px] uppercase tracking-[0.08em] text-slate-500">Visible</span>
            <span className="text-[13px] font-semibold text-slate-900 dark:text-white">{visibleRequests.length}</span>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Overview</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Select a status card to filter request workflow stages</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
          {Object.entries(statusCardMeta).map(([value, config]) => (
            <button
              key={value}
              type="button"
              onClick={() => setActiveStatus(String(value))}
              className={`text-left rounded-xl p-3.5 border shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow ${
                activeStatus === value ? config.activeTone : config.tone
              }`}
            >
              <p className="text-[11px] uppercase tracking-[0.08em] opacity-80">{config.label}</p>
              <p className="text-lg font-semibold mt-1 text-slate-900 dark:text-white">{config.value}</p>
            </button>
          ))}
        </div>
      </section>

      {canCreate && (
        <section className="air-surface rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm p-5 md:p-6 space-y-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Create Request</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Fill product, supplier, and delivery details to create a new request</p>
            </div>
          </div>

          <form onSubmit={createRequest} className="space-y-4">
            <label className="inline-flex items-center gap-2 text-[13px] text-slate-700 dark:text-slate-200">
              <input
                type="checkbox"
                checked={newRequest.isNewProduct}
                onChange={(e) => setNewRequest((prev) => ({
                  ...prev,
                  isNewProduct: e.target.checked,
                  productId: e.target.checked ? '' : prev.productId,
                  supplierId: ''
                }))}
              />
              Request a new product not in inventory
            </label>

            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
              {newRequest.isNewProduct ? (
                <>
                  <input
                    type="text"
                    placeholder="New Product Name"
                    value={newRequest.newProductName}
                    onChange={(e) => setNewRequest((prev) => ({ ...prev, newProductName: e.target.value }))}
                    className="air-input"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Category"
                    value={newRequest.newProductCategory}
                    onChange={(e) => setNewRequest((prev) => ({ ...prev, newProductCategory: e.target.value }))}
                    className="air-input"
                    required
                  />
                </>
              ) : (
                <select
                  value={newRequest.productId}
                  onChange={(e) => setNewRequest((prev) => ({ ...prev, productId: e.target.value, supplierId: '' }))}
                  className="air-input"
                  required
                >
                  <option value="">Select Product</option>
                  {products.map((product) => (
                    <option key={product._id} value={product._id}>
                      {product.name} (Stock: {product.stock})
                    </option>
                  ))}
                </select>
              )}

              {newRequest.isNewProduct ? (
                <>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Unit Cost"
                    value={newRequest.unitCost}
                    onChange={(e) => setNewRequest((prev) => ({ ...prev, unitCost: e.target.value }))}
                    className="air-input"
                  />
                  <select
                    className="air-input"
                    value={newRequest.gst}
                    onChange={(e) => setNewRequest((prev) => ({ ...prev, gst: Number(e.target.value) }))}
                  >
                    {[0, 5, 12, 18, 28].map((item) => (
                      <option key={item} value={item}>{item}% GST</option>
                    ))}
                  </select>
                </>
              ) : null}

              <input
                type="number"
                min="1"
                placeholder="Quantity"
                value={newRequest.quantity}
                onChange={(e) => setNewRequest((prev) => ({ ...prev, quantity: e.target.value }))}
                className="air-input"
                required
              />
              <select
                value={newRequest.supplierId}
                onChange={(e) => setNewRequest((prev) => ({ ...prev, supplierId: e.target.value }))}
                className="air-input"
                required
              >
                <option value="">Select Supplier</option>
                {filteredSuppliers.map((supplier) => (
                  <option key={supplier._id} value={supplier._id}>
                    {supplier.companyName} ({supplier.supplierCategory})
                  </option>
                ))}
              </select>

              <input
                type="date"
                value={newRequest.expectedDeliveryDate}
                onChange={(e) => setNewRequest((prev) => ({ ...prev, expectedDeliveryDate: e.target.value }))}
                min={todayDate}
                className="air-input"
                title="Expected Delivery Date"
              />
              <input
                type="text"
                placeholder="Notes (optional)"
                value={newRequest.notes}
                onChange={(e) => setNewRequest((prev) => ({ ...prev, notes: e.target.value }))}
                className="air-input md:col-span-2 xl:col-span-2"
              />
              <button type="submit" className="air-btn-primary w-full md:w-auto justify-center px-5">
                <Plus className="w-4 h-4" /> Create Request
              </button>
            </div>

            {selectedCategory && matchedSuppliers.length === 0 ? (
              <p className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 rounded-lg px-3 py-2">
                No exact category match found. Showing all linked suppliers.
              </p>
            ) : null}
          </form>
        </section>
      )}

      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Request List</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Track, review, and process requests by current status</p>
        </div>

        <Table
          columns={columns}
          data={loading ? [] : visibleRequests}
          searchPlaceholder="Search request ID, product, staff..."
          filters={[
            {
              key: 'status',
              label: 'Status',
              options: [
                { label: 'Pending', value: 'Pending' },
                { label: 'Approved', value: 'Approved' },
                { label: 'Delivered', value: 'Delivered' },
                { label: 'Completed', value: 'Completed' },
                { label: 'Rejected', value: 'Rejected' }
              ]
            }
          ]}
          emptyText={loading ? 'Loading requests...' : activeStatus === 'all' ? 'No supply requests found.' : `No ${activeStatus} requests found.`}
          actions={(request) => {
            const primaryActions = getPrimaryAction(request);

            if (!primaryActions || primaryActions.length === 0) {
              return <span className="text-[11px] text-zinc-400">No action</span>;
            }

            return (
              <div className="flex items-center justify-end gap-2">
                {primaryActions.map((action, idx) => (
                  <button
                    key={idx}
                    onClick={action.onClick}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all duration-200 active:scale-95 ${action.className}`}
                  >
                    {action.icon}
                    <span>{action.label}</span>
                  </button>
                ))}
              </div>
            );
          }}
        />
      </section>
    </div>
  );
}
