import { useEffect, useState } from 'react';
import { Undo2, Plus } from 'lucide-react';
import Table from '../../components/Table';
import Modal from '../../components/Modal';
import { authStorage } from '../../services/authStorage';
import { customersApi, salesReturnsApi } from '../../services/api';

const RETURN_REASONS = ['Damaged', 'Exchange', 'Return & Refund'];

export default function SalesReturns() {
    const [returns, setReturns] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [submitError, setSubmitError] = useState('');

    const [selectedCustomer, setSelectedCustomer] = useState('');
    const [customerHistory, setCustomerHistory] = useState([]);
    const [selectedInvoice, setSelectedInvoice] = useState('');
    const [selectedProduct, setSelectedProduct] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [reason, setReason] = useState('');

    const token = authStorage.getToken();

    const fetchReturns = async () => {
        try {
            const res = await salesReturnsApi.getAll(token);
            setReturns(res.data || []);
        } catch {
            setReturns([]);
        }
    };

    useEffect(() => {
        const load = async () => {
            try {
                const custRes = await customersApi.getAll(token);
                setCustomers(custRes.data || []);
            } catch {}
            await fetchReturns();
        };
        load();
    }, []);

    const handleCustomerChange = async (customerId) => {
        setSelectedCustomer(customerId);
        setSelectedInvoice('');
        setSelectedProduct('');
        setQuantity(1);
        setCustomerHistory([]);
        if (!customerId) return;
        setHistoryLoading(true);
        try {
            const res = await customersApi.getHistory(customerId, token);
            setCustomerHistory(res.data || []);
        } catch {}
        setHistoryLoading(false);
    };

    const selectedInvoiceData = customerHistory.find((inv) => inv.invoiceId === selectedInvoice);
    const invoiceProducts = selectedInvoiceData ? selectedInvoiceData.items || [] : [];
    const selectedProductData = invoiceProducts.find(
        (p) => String(p._id || p.name) === selectedProduct
    );

    const resetForm = () => {
        setSelectedCustomer('');
        setCustomerHistory([]);
        setSelectedInvoice('');
        setSelectedProduct('');
        setQuantity(1);
        setReason('');
        setSubmitError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitError('');

        if (!selectedCustomer || !selectedInvoice || !selectedProduct || !reason) {
            setSubmitError('Please fill in all fields.');
            return;
        }

        const customer = customers.find((c) => c._id === selectedCustomer);
        const product = selectedProductData;

        if (!customer || !product) {
            setSubmitError('Invalid selection.');
            return;
        }

        setLoading(true);
        try {
            await salesReturnsApi.create(
                {
                    customerName: customer.name,
                    invoiceId: selectedInvoice,
                    productId: String(product._id || ''),
                    productName: product.name,
                    quantity: Number(quantity),
                    reason
                },
                token
            );
            await fetchReturns();
            setIsModalOpen(false);
            resetForm();
        } catch (err) {
            setSubmitError(err.message || 'Failed to submit return');
        }
        setLoading(false);
    };

    const columns = [
        {
            header: 'Return ID',
            accessor: 'returnId',
            render: (r) => (
                <span className="inline-flex items-center rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-1 border border-slate-200 dark:border-slate-700 text-[12px] font-semibold text-slate-700 dark:text-slate-300">
                    {r.returnId}
                </span>
            )
        },
        {
            header: 'Customer',
            accessor: 'customer',
            render: (r) => {
                const label = r.customer || '-';
                const initial = label.charAt(0).toUpperCase();
                return (
                    <div className="flex items-center gap-2.5 min-w-0">
                        <span className="h-7 w-7 rounded-full bg-emerald-100 text-emerald-700 inline-flex items-center justify-center text-[11px] font-semibold shrink-0">{initial}</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200 truncate">{label}</span>
                    </div>
                );
            }
        },
        { header: 'Product', accessor: 'productName', render: (r) => r.productName || '—' },
        { header: 'Qty', accessor: 'quantity' },
        { header: 'Reason', accessor: 'reason' },
        {
            header: 'Refund',
            accessor: 'refundAmount',
            render: (r) => (r.refundAmount ? `₹${Number(r.refundAmount).toFixed(2)}` : '—')
        },
        {
            header: 'Status',
            accessor: 'status',
            render: (r) => (
                <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                        r.status === 'Accepted'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700/50'
                            : 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700/50'
                    }`}
                >
                    {r.status}
                </span>
            )
        },
        {
            header: 'Return Date',
            accessor: 'returnDate',
            render: (r) => (r.returnDate ? new Date(r.returnDate).toLocaleDateString() : '—')
        }
    ];

    const acceptedCount = returns.filter((item) => item.status === 'Accepted').length;
    const rejectedCount = returns.filter((item) => item.status === 'Rejected').length;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-5">
            <div className="air-surface p-5 md:p-6 shadow-sm border border-zinc-200/80 dark:border-slate-700/80">
                <div className="flex justify-between items-start gap-4 flex-wrap">
                    <div>
                        <h1 className="text-[22px] font-bold text-zinc-900 dark:text-white flex items-center gap-2.5">
                            <Undo2 className="w-5 h-5 text-emerald-600" />
                        Sales Returns
                        </h1>
                        <p className="text-sm text-zinc-500 mt-1">Track return requests, reasons, and refund outcomes</p>
                    </div>
                    <button
                        onClick={() => {
                            resetForm();
                            setIsModalOpen(true);
                        }}
                        className="air-btn-primary"
                    >
                        <Plus className="w-4 h-4" />
                        New Return
                    </button>
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2.5 max-w-xl">
                    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/60 px-3.5 py-2">
                        <p className="text-[10px] uppercase tracking-[0.08em] text-slate-500">Total Returns</p>
                        <p className="text-[13px] font-semibold text-slate-900 dark:text-white">{returns.length}</p>
                    </div>
                    <div className="rounded-xl border border-emerald-200/80 dark:border-emerald-700/40 bg-emerald-50/70 dark:bg-emerald-900/10 px-3.5 py-2">
                        <p className="text-[10px] uppercase tracking-[0.08em] text-emerald-700 dark:text-emerald-300">Accepted</p>
                        <p className="text-[13px] font-semibold text-emerald-800 dark:text-emerald-200">{acceptedCount}</p>
                    </div>
                    <div className="rounded-xl border border-red-200/80 dark:border-red-700/40 bg-red-50/70 dark:bg-red-900/10 px-3.5 py-2">
                        <p className="text-[10px] uppercase tracking-[0.08em] text-red-700 dark:text-red-300">Rejected</p>
                        <p className="text-[13px] font-semibold text-red-800 dark:text-red-200">{rejectedCount}</p>
                    </div>
                </div>
            </div>

            <Table
                columns={columns}
                data={returns}
                searchPlaceholder="Search by return ID, customer, product, or reason..."
                emptyText="No sales returns recorded yet"
            />

            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    resetForm();
                }}
                title="New Sales Return"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Customer */}
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-zinc-700 dark:text-gray-300">Customer</label>
                        <select
                            required
                            value={selectedCustomer}
                            onChange={(e) => handleCustomerChange(e.target.value)}
                            className="air-input"
                        >
                            <option value="">Select customer</option>
                            {customers.map((c) => (
                                <option key={c._id} value={c._id}>
                                    {c.name}{c.phone ? ` — ${c.phone}` : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Invoice */}
                    {selectedCustomer && (
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-zinc-700 dark:text-gray-300">Invoice</label>
                            {historyLoading ? (
                                <p className="text-sm text-zinc-400">Loading invoices...</p>
                            ) : customerHistory.length === 0 ? (
                                <p className="text-sm text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border border-amber-200/80 dark:border-amber-700/40 rounded-lg px-3 py-2">No purchase history found for this customer.</p>
                            ) : (
                                <select
                                    required
                                    value={selectedInvoice}
                                    onChange={(e) => {
                                        setSelectedInvoice(e.target.value);
                                        setSelectedProduct('');
                                        setQuantity(1);
                                    }}
                                    className="air-input"
                                >
                                    <option value="">Select invoice</option>
                                    {customerHistory.map((inv) => (
                                        <option key={inv.invoiceId} value={inv.invoiceId}>
                                            {inv.invoiceId} — {new Date(inv.date).toLocaleDateString()} — ₹{Number(inv.total).toFixed(2)}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                    )}

                    {/* Product */}
                    {selectedInvoice && invoiceProducts.length > 0 && (
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-zinc-700 dark:text-gray-300">Product to Return</label>
                            <select
                                required
                                value={selectedProduct}
                                onChange={(e) => {
                                    setSelectedProduct(e.target.value);
                                    const p = invoiceProducts.find(
                                        (x) => String(x._id || x.name) === e.target.value
                                    );
                                    if (p) setQuantity(p.quantity);
                                }}
                                className="air-input"
                            >
                                <option value="">Select product</option>
                                {invoiceProducts.map((item, idx) => (
                                    <option key={idx} value={String(item._id || item.name)}>
                                        {item.name} (Qty bought: {item.quantity})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Quantity */}
                    {selectedProductData && (
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-zinc-700 dark:text-gray-300">Return Quantity</label>
                            <input
                                type="number"
                                min={1}
                                max={selectedProductData.quantity}
                                value={quantity}
                                onChange={(e) => setQuantity(Number(e.target.value))}
                                className="air-input"
                            />
                            <p className="text-xs text-zinc-400">Max: {selectedProductData.quantity}</p>
                        </div>
                    )}

                    {/* Reason */}
                    {selectedProduct && (
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-zinc-700 dark:text-gray-300">Return Reason</label>
                            <select
                                required
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="air-input"
                            >
                                <option value="">Select reason</option>
                                {RETURN_REASONS.map((r) => (
                                    <option key={r} value={r}>{r}</option>
                                ))}
                            </select>
                            {reason === 'Damaged' && (
                                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1 bg-amber-50 dark:bg-amber-900/20 border border-amber-200/80 dark:border-amber-700/40 rounded-lg px-3 py-2">
                                    ⚠ Damaged returns only accepted within 7 days of purchase.
                                </p>
                            )}
                            {(reason === 'Exchange' || reason === 'Return & Refund') && (
                                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1 bg-blue-50 dark:bg-blue-900/20 border border-blue-200/80 dark:border-blue-700/40 rounded-lg px-3 py-2">
                                    Returns accepted within 30 days of purchase.
                                </p>
                            )}
                        </div>
                    )}

                    {submitError && (
                        <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
                            {submitError}
                        </p>
                    )}

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => {
                                setIsModalOpen(false);
                                resetForm();
                            }}
                            className="px-4 py-2 text-zinc-700 dark:text-gray-300 hover:bg-zinc-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button type="submit" disabled={loading} className="air-btn-primary disabled:opacity-50">
                            {loading ? 'Processing...' : 'Submit Return'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

