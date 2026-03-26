import { useState, useEffect } from 'react';
import { FileText, Plus, Search, Trash2, Eye, Printer, X } from 'lucide-react';
import { invoicesApi, inventoryApi, customersApi } from '../../services/api';
import { authStorage } from '../../services/authStorage';

export default function Invoices() {
    const [invoices, setInvoices] = useState([]);
    const [products, setProducts] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [viewInvoice, setViewInvoice] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [form, setForm] = useState({
        customerId: '',
        customerName: '',
        productId: '',
        quantity: '',
        status: 'Paid'
    });

    const token = authStorage.getToken();

    const fetchAll = async () => {
        try {
            const [invoicesRes, productsRes, customersRes] = await Promise.all([
                invoicesApi.getAll(token),
                inventoryApi.getItems(token),
                customersApi.getAll(token)
            ]);
            setInvoices(invoicesRes.data || []);
            setProducts(productsRes.data || []);
            setCustomers(customersRes.data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAll(); }, []);

    const handleOpen = () => {
        setForm({ customerId: '', customerName: '', productId: '', quantity: '', status: 'Paid' });
        setIsModalOpen(true);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'customerId') {
            const customer = customers.find(c => c._id === value);
            setForm(prev => ({ ...prev, customerId: value, customerName: customer?.name || '' }));
        } else {
            setForm(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const qty = Number(form.quantity);
        if (!form.productId || !qty || qty <= 0) {
            alert('Please select a product and enter a valid quantity.');
            return;
        }
        const product = products.find(p => p._id === form.productId);
        if (product && Number(product.stock) < qty) {
            alert('Not enough stock available.');
            return;
        }
        setSubmitting(true);
        try {
            await invoicesApi.create({
                customerName: form.customerName || 'Walk-in Customer',
                productId: form.productId,
                quantity: qty,
                status: form.status
            }, token);
            setIsModalOpen(false);
            await fetchAll();
        } catch (e) {
            alert(e.message || 'Failed to create invoice');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this invoice? Note: inventory stock will not be reversed.')) return;
        try {
            await invoicesApi.remove(id, token);
            await fetchAll();
        } catch (e) {
            alert(e.message || 'Failed to delete invoice');
        }
    };

    const selectedProduct = products.find(p => p._id === form.productId);
    const qty = Number(form.quantity);
    const stockAfter = selectedProduct && qty > 0 ? Number(selectedProduct.stock) - qty : null;
    const insufficient = stockAfter !== null && stockAfter < 0;
    const estimatedAmount = selectedProduct && qty > 0
        ? (Number(selectedProduct.price) * qty).toFixed(2)
        : null;

    const filtered = invoices.filter(inv =>
        Object.values(inv).some(v => String(v).toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const paidCount = filtered.filter((inv) => inv.status === 'Paid').length;
    const pendingCount = filtered.filter((inv) => inv.status !== 'Paid').length;
    const totalValue = filtered.reduce((sum, inv) => sum + Number(inv.total || 0), 0);

    const getInvoiceStatusClass = (status) => {
        if (status === 'Paid') {
            return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700/50';
        }
        if (status === 'Pending') {
            return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700/50';
        }
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700/50';
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-5">
            <div className="air-surface p-5 md:p-6 shadow-sm border border-zinc-200/80 dark:border-slate-700/80">
                <div className="flex justify-between items-start gap-4 flex-wrap">
                    <div>
                        <h1 className="text-[22px] font-bold text-zinc-900 dark:text-white flex items-center gap-2.5">
                            <FileText className="w-5 h-5 text-emerald-600" />
                            Invoices
                        </h1>
                        <p className="text-sm text-zinc-500 mt-1">Sales invoices with stock adjustment on save</p>
                    </div>
                    <button onClick={handleOpen} className="air-btn-primary">
                        <Plus className="w-4 h-4" />
                        New Invoice
                    </button>
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/70 px-3.5 py-2.5">
                        <p className="text-[11px] uppercase tracking-[0.08em] text-emerald-700">Paid</p>
                        <p className="text-sm font-semibold text-emerald-900">{paidCount}</p>
                    </div>
                    <div className="rounded-xl border border-amber-200/70 bg-amber-50/70 px-3.5 py-2.5">
                        <p className="text-[11px] uppercase tracking-[0.08em] text-amber-700">Pending</p>
                        <p className="text-sm font-semibold text-amber-900">{pendingCount}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/60 px-3.5 py-2.5">
                        <p className="text-[11px] uppercase tracking-[0.08em] text-slate-500">Total Value</p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">Rs {totalValue.toFixed(2)}</p>
                    </div>
                </div>
            </div>

            <div className="air-surface p-4 shadow-sm border border-zinc-200/80 dark:border-slate-700/80">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                        type="text"
                        placeholder="Search by invoice number, customer, status, or amount..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="air-input pl-10 py-2.5 text-[13px]"
                    />
                </div>
            </div>

            <div className="air-surface overflow-hidden shadow-sm border border-zinc-200/80 dark:border-slate-700/80">
                {loading ? (
                    <div className="p-12 text-center text-zinc-500">Loading...</div>
                ) : filtered.length === 0 ? (
                    <div className="p-12 text-center">
                        <FileText className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
                        <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">No invoices found</p>
                        <p className="text-xs text-zinc-400 mt-1">Create an invoice to automatically update inventory stock.</p>
                    </div>
                ) : (
                    <table className="w-full text-[13px]">
                        <thead className="bg-zinc-50/80 dark:bg-gray-700/40 border-b border-zinc-200 dark:border-gray-700">
                            <tr>
                                {['Invoice #', 'Customer', 'Product', 'Qty', 'Total', 'Date', 'Status', ''].map(h => (
                                    <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-[0.08em]">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-gray-700/80">
                            {filtered.map(inv => {
                                const item = Array.isArray(inv.items) && inv.items[0];
                                const customerLabel = inv.customerName || 'Walk-in Customer';
                                const customerInitial = customerLabel.charAt(0).toUpperCase();
                                return (
                                    <tr key={inv._id} className="group hover:bg-zinc-50/80 dark:hover:bg-gray-700/20 transition-colors duration-200">
                                        <td className="px-4 py-3.5">
                                            <div className="inline-flex items-center rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-1 border border-slate-200 dark:border-slate-700 shadow-sm">
                                                <span className="font-semibold text-slate-800 dark:text-slate-200 text-[12px] tracking-wide">{inv.invoiceId}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <span className="h-7 w-7 rounded-full bg-emerald-100 text-emerald-700 inline-flex items-center justify-center text-[11px] font-semibold shrink-0">
                                                    {customerInitial}
                                                </span>
                                                <span className="text-[13px] font-medium text-zinc-700 dark:text-zinc-300 truncate">{customerLabel}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5 text-zinc-600 dark:text-gray-400">{item?.name || '-'}</td>
                                        <td className="px-4 py-3.5 text-zinc-600 dark:text-gray-400 font-medium">{item?.quantity || '-'}</td>
                                        <td className="px-4 py-3.5">
                                            <span className="text-sm font-semibold text-zinc-900 dark:text-white">Rs {Number(inv.total || 0).toFixed(2)}</span>
                                        </td>
                                        <td className="px-4 py-3.5 text-zinc-500 dark:text-gray-400 text-[12px]">
                                            {inv.date ? new Date(inv.date).toLocaleDateString('en-IN') : '-'}
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${getInvoiceStatusClass(inv.status)}`}>
                                                {inv.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <div className="flex items-center gap-1.5 justify-end">
                                                <button onClick={() => setViewInvoice(inv)} className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors" title="View Invoice">
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDelete(inv._id)} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Delete">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {viewInvoice && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-[1px]">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-gray-700">
                            <div className="flex items-center gap-2">
                                <FileText className="w-5 h-5 text-emerald-600" />
                                <span className="font-semibold text-zinc-900 dark:text-white">Invoice</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => window.print()}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-zinc-300 dark:border-gray-600 rounded-lg hover:bg-zinc-50 dark:hover:bg-gray-700 transition-colors text-zinc-700 dark:text-gray-300"
                                >
                                    <Printer className="w-4 h-4" /> Print
                                </button>
                                <button onClick={() => setViewInvoice(null)} className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-white rounded-lg transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Invoice document */}
                        <div id="invoice-print" className="p-8">
                            {/* Header */}
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">INVOICE</h2>
                                    <p className="text-zinc-500 text-sm mt-1"># {viewInvoice.invoiceId}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-zinc-500">Date</p>
                                    <p className="font-semibold text-zinc-900 dark:text-white">
                                        {viewInvoice.date ? new Date(viewInvoice.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                                    </p>
                                    <span className={`mt-2 inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getInvoiceStatusClass(viewInvoice.status)}`}>{viewInvoice.status}</span>
                                </div>
                            </div>

                            {/* Bill to */}
                            <div className="mb-6 p-4 bg-zinc-50 dark:bg-gray-800 rounded-xl">
                                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">Bill To</p>
                                <p className="text-base font-semibold text-zinc-900 dark:text-white">{viewInvoice.customerName || 'Walk-in Customer'}</p>
                            </div>

                            {/* Items table */}
                            <table className="w-full mb-6">
                                <thead>
                                    <tr className="border-b-2 border-zinc-200 dark:border-gray-700">
                                        <th className="text-left py-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Product</th>
                                        <th className="text-right py-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Price</th>
                                        <th className="text-right py-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Qty</th>
                                        <th className="text-right py-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(Array.isArray(viewInvoice.items) && viewInvoice.items.length > 0
                                        ? viewInvoice.items
                                        : [{ name: '—', price: 0, quantity: 1, gst: 0 }]
                                    ).map((item, i) => (
                                        <tr key={i} className="border-b border-zinc-100 dark:border-gray-700">
                                            <td className="py-3 text-sm text-zinc-800 dark:text-gray-200">{item.name}</td>
                                            <td className="py-3 text-sm text-right text-zinc-600 dark:text-gray-400">₹{Number(item.price || 0).toFixed(2)}</td>
                                            <td className="py-3 text-sm text-right text-zinc-600 dark:text-gray-400">{item.quantity}</td>
                                            <td className="py-3 text-sm text-right font-medium text-zinc-800 dark:text-gray-200">
                                                ₹{(Number(item.price || 0) * Number(item.quantity || 1)).toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Totals */}
                            <div className="ml-auto w-64 space-y-2">
                                <div className="flex justify-between text-sm text-zinc-600 dark:text-gray-400">
                                    <span>Subtotal</span>
                                    <span>₹{Number(viewInvoice.subtotal || 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-zinc-600 dark:text-gray-400">
                                    <span>Tax (GST)</span>
                                    <span>₹{Number(viewInvoice.tax || 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-base font-bold text-zinc-900 dark:text-white border-t border-zinc-200 dark:border-gray-700 pt-2">
                                    <span>Total</span>
                                    <span>₹{Number(viewInvoice.total || 0).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Invoice Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md mx-4 border border-zinc-200/80 dark:border-gray-700/80">
                        <div className="p-6 border-b border-zinc-200 dark:border-gray-700">
                            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Create Sales Invoice</h2>
                            <p className="text-sm text-zinc-500 mt-1">Inventory stock will decrease automatically on save.</p>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-gray-300 mb-1">Customer</label>
                                <select name="customerId" value={form.customerId} onChange={handleChange} className="air-input">
                                    <option value="">— Select Customer (optional) —</option>
                                    {customers.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-gray-300 mb-1">
                                    Product <span className="text-red-500">*</span>
                                </label>
                                <select name="productId" value={form.productId} onChange={handleChange} required className="air-input">
                                    <option value="">— Select Product —</option>
                                    {products.map(p => (
                                        <option key={p._id} value={p._id}>{p.name} (Stock: {p.stock})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-gray-300 mb-1">
                                    Quantity Sold <span className="text-red-500">*</span>
                                </label>
                                <input
                                    name="quantity"
                                    type="number"
                                    min="1"
                                    step="1"
                                    value={form.quantity}
                                    onChange={handleChange}
                                    required
                                    placeholder="e.g. 2"
                                    className="air-input"
                                />
                                {estimatedAmount && (
                                    <p className="text-xs text-zinc-500 mt-1">
                                        Estimated total: <span className="font-semibold text-zinc-700 dark:text-gray-300">₹{estimatedAmount}</span>
                                        {' '}(selling price × qty)
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-gray-300 mb-1">Status</label>
                                <select name="status" value={form.status} onChange={handleChange} className="air-input">
                                    <option>Paid</option>
                                    <option>Pending</option>
                                </select>
                            </div>

                            {selectedProduct && qty > 0 && (
                                insufficient ? (
                                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-sm">
                                        <p className="text-red-700 dark:text-red-300 font-medium">Not enough stock available.</p>
                                        <p className="text-red-600 dark:text-red-400 mt-1">
                                            Available: <span className="font-bold">{selectedProduct.stock}</span>, requested: <span className="font-bold">{qty}</span>
                                        </p>
                                    </div>
                                ) : (
                                    <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3 text-sm">
                                        <p className="text-emerald-700 dark:text-emerald-300 font-medium">Stock preview</p>
                                        <p className="text-emerald-600 dark:text-emerald-400 mt-1">
                                            {selectedProduct.stock} − {qty} = <span className="font-bold">{stockAfter}</span> units remaining
                                        </p>
                                    </div>
                                )
                            )}

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 air-btn-secondary">
                                    Cancel
                                </button>
                                <button type="submit" disabled={submitting || insufficient} className="flex-1 air-btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
                                    {submitting ? 'Saving...' : 'Save Invoice'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
