import { useState, useEffect, useMemo } from 'react';
import { Search, Download } from 'lucide-react';
import { reportsApi, supplyRequestsApi } from '../../services/api';
import { authStorage } from '../../services/authStorage';

export default function PurchaseReport() {
    const [orders, setOrders] = useState([]);
    const [supplyRequests, setSupplyRequests] = useState([]);
    const [summary, setSummary] = useState({ totalPurchases: 0, totalCost: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterDate, setFilterDate] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    useEffect(() => {
        const load = async () => {
            try {
                const token = authStorage.getToken();
                if (!token) return;
                const [res, supplyRes] = await Promise.all([
                    reportsApi.getPurchases(token),
                    supplyRequestsApi.getAll(token)
                ]);
                setOrders(res.data || []);
                setSupplyRequests(supplyRes.data || []);
                setSummary(res.summary || { totalPurchases: 0, totalCost: 0 });
            } catch (e) {
                alert(e.message || 'Failed to load purchase report');
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, []);

    // Flatten purchase orders -> one row per item
    const purchaseRows = useMemo(() => {
        return orders.flatMap(order =>
            (order.items || []).map(item => ({
                referenceId: order._id,
                supplier: order.supplierName || '—',
                date: order.date,
                productName: item.name,
                quantity: item.quantity,
                costPrice: item.costPrice,
                gst: item.gst,
                total: Number(item.costPrice || 0) * Number(item.quantity || 0) * (1 + Number(item.gst || 0) / 100),
                status: 'Purchased'
            }))
        );
    }, [orders]);

    const supplierRows = useMemo(() => {
        return (supplyRequests || []).map((request) => ({
            referenceId: request.requestId || request._id,
            supplier: request.supplierName || 'Unassigned',
            productName: request.productName || '-',
            quantity: Number(request.quantity || 0),
            costPrice: Number(request.unitCost || 0),
            gst: Number(request.gst || 0),
            total: Number(request.totalCost || 0),
            status: request.status || 'Pending',
            date: request.updatedAt || request.createdAt || request.requestDate
        }));
    }, [supplyRequests]);

    const combinedRows = useMemo(() => [...purchaseRows, ...supplierRows], [purchaseRows, supplierRows]);

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return combinedRows.filter((r) => {
            const statusMatch =
                statusFilter === 'All'
                    ? true
                    : statusFilter === 'Supplied'
                        ? ['Purchased', 'Delivered', 'Verified'].includes(r.status)
                        : statusFilter === 'Rejected'
                            ? r.status === 'Rejected'
                            : r.status === statusFilter;

            const searchMatch =
                String(r.referenceId || '').toLowerCase().includes(q) ||
                String(r.productName || '').toLowerCase().includes(q) ||
                String(r.supplier || '').toLowerCase().includes(q);

            const dateMatch = filterDate
                ? new Date(r.date).toLocaleDateString('en-CA') === filterDate
                : true;

            return statusMatch && searchMatch && dateMatch;
        });
    }, [combinedRows, search, filterDate, statusFilter]);

    const filteredCost = filtered.reduce((sum, r) => sum + Number(r.total || 0), 0);

    const supplierSummary = useMemo(() => {
        const all = combinedRows.length;
        const supplied = combinedRows.filter((r) => ['Purchased', 'Delivered', 'Verified'].includes(r.status)).length;
        const rejected = combinedRows.filter((r) => r.status === 'Rejected').length;
        return { all, supplied, rejected };
    }, [combinedRows]);

    const handleExport = () => {
        const csvRows = [
            ['Reference ID', 'Supplier', 'Product Name', 'Qty', 'Cost Price', 'GST %', 'Total Cost', 'Status', 'Date'],
            ...filtered.map(r => [
                r.referenceId, r.supplier, r.productName,
                r.quantity,
                r.costPrice == null ? '-' : Number(r.costPrice || 0).toFixed(2),
                r.gst == null ? '-' : `${r.gst}%`,
                r.total == null ? '-' : r.total.toFixed(2),
                r.status,
                new Date(r.date).toLocaleDateString('en-IN')
            ])
        ];
        const csv = csvRows.map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'purchase-report.csv'; a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            <div className="rounded-3xl border border-emerald-200/60 bg-gradient-to-r from-emerald-50 via-emerald-50 to-emerald-50 dark:from-slate-900 dark:to-slate-800 dark:border-slate-700 p-5 md:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Purchase Report</h1>
                    <p className="text-slate-600 dark:text-slate-300 mt-1">Combined supplier purchase transactions and supply request status</p>
                </div>
                <button onClick={handleExport} className="air-btn-secondary">
                    <Download className="w-4 h-4" /> Export CSV
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="air-surface rounded-2xl p-5">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Total Purchase Cost {filterDate ? '(filtered)' : ''}</p>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">
                        ₹{((filterDate || search) ? filteredCost : summary.totalCost).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                </div>
                <div className="air-surface rounded-2xl p-5">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Combined Supplier Records</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{supplierSummary.all}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Supplied: {supplierSummary.supplied} · Rejected: {supplierSummary.rejected}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by reference ID, product, supplier..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="air-input pl-10 w-full"
                    />
                </div>
                <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
                    max={new Date().toLocaleDateString('en-CA')}
                    className="air-input text-sm" title="Filter by date" />
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="air-input text-sm sm:w-56"
                    title="Filter by supplier status"
                >
                    <option value="All">All supplier statuses</option>
                    <option value="Purchased">Purchased entries</option>
                    <option value="Supplied">Supplied by supplier</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Accepted">Accepted</option>
                    <option value="Processing">Processing</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Verified">Verified</option>
                </select>
            </div>

            {/* Table */}
            <div className="air-surface overflow-hidden">
                {isLoading ? (
                    <div className="flex justify-center items-center py-16">
                        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    <th className="text-left px-4 py-3">Purchase ID</th>
                                    <th className="text-left px-4 py-3">Supplier</th>
                                    <th className="text-left px-4 py-3">Product</th>
                                    <th className="text-right px-4 py-3">Qty</th>
                                    <th className="text-right px-4 py-3">Cost Price</th>
                                    <th className="text-right px-4 py-3">GST</th>
                                    <th className="text-right px-4 py-3">Total Cost</th>
                                    <th className="text-left px-4 py-3">Status</th>
                                    <th className="text-right px-4 py-3">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {filtered.length === 0 ? (
                                    <tr><td colSpan={9} className="text-center py-10 text-slate-500 dark:text-slate-400">No supplier purchase records found</td></tr>
                                ) : filtered.map((r, i) => (
                                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                        <td className="px-4 py-3 font-mono text-xs text-orange-600 dark:text-orange-400">{String(r.referenceId || '').slice(-10)}</td>
                                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{r.supplier}</td>
                                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{r.productName}</td>
                                        <td className="px-4 py-3 text-right">{r.quantity}</td>
                                        <td className="px-4 py-3 text-right">{r.costPrice == null ? '-' : `₹${Number(r.costPrice || 0).toFixed(2)}`}</td>
                                        <td className="px-4 py-3 text-right text-slate-500">{r.gst == null ? '-' : `${r.gst}%`}</td>
                                        <td className="px-4 py-3 text-right font-semibold text-orange-600 dark:text-orange-400">{r.total == null ? '-' : `₹${r.total.toFixed(2)}`}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                ['Purchased', 'Delivered', 'Verified'].includes(r.status)
                                                    ? 'bg-green-100 text-green-700'
                                                    : r.status === 'Rejected'
                                                        ? 'bg-rose-100 text-rose-700'
                                                        : 'bg-amber-100 text-amber-700'
                                            }`}>
                                                {r.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right text-slate-500 text-xs">{new Date(r.date).toLocaleDateString('en-IN')}</td>
                                    </tr>
                                ))}
                            </tbody>
                            {filtered.length > 0 && (
                                <tfoot>
                                    <tr className="bg-slate-50 dark:bg-slate-800 font-semibold text-sm">
                                        <td colSpan={8} className="px-4 py-3 text-right text-slate-700 dark:text-slate-300">Filtered Total Cost</td>
                                        <td className="px-4 py-3 text-right text-orange-600 dark:text-orange-400">
                                            ₹{filteredCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
