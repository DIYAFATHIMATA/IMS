import { useState, useEffect, useMemo } from 'react';
import { Search, Download } from 'lucide-react';
import { reportsApi } from '../../services/api';
import { authStorage } from '../../services/authStorage';

export default function SalesReport() {
    const [invoices, setInvoices] = useState([]);
    const [summary, setSummary] = useState({ totalSales: 0, totalRevenue: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterDate, setFilterDate] = useState('');

    useEffect(() => {
        const load = async () => {
            try {
                const token = authStorage.getToken();
                if (!token) return;
                const res = await reportsApi.getSales(token);
                setInvoices(res.data || []);
                setSummary(res.summary || { totalSales: 0, totalRevenue: 0 });
            } catch (e) {
                alert(e.message || 'Failed to load sales report');
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, []);

    // Flatten invoices → one row per item
    const rows = useMemo(() => {
        return invoices.flatMap(inv =>
            (inv.items || []).map(item => ({
                invoiceId: inv.invoiceId,
                customer: inv.customerName,
                date: inv.date,
                productName: item.name,
                quantity: item.quantity,
                price: item.price,
                gst: item.gst,
                total: Number(item.price || 0) * Number(item.quantity || 0) * (1 + Number(item.gst || 0) / 100)
            }))
        );
    }, [invoices]);

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return rows.filter(r => {
            const matchSearch =
                r.invoiceId?.toLowerCase().includes(q) ||
                r.productName?.toLowerCase().includes(q) ||
                r.customer?.toLowerCase().includes(q);
            const matchDate = filterDate
                ? new Date(r.date).toLocaleDateString('en-CA') === filterDate
                : true;
            return matchSearch && matchDate;
        });
    }, [rows, search, filterDate]);

    const filteredRevenue = filtered.reduce((sum, r) => sum + r.total, 0);

    const handleExport = () => {
        const csvRows = [
            ['Invoice ID', 'Product Name', 'Customer', 'Qty Sold', 'Price', 'GST %', 'Total Amount', 'Date'],
            ...filtered.map(r => [
                r.invoiceId, r.productName, r.customer,
                r.quantity,
                Number(r.price || 0).toFixed(2),
                `${r.gst}%`,
                r.total.toFixed(2),
                new Date(r.date).toLocaleDateString('en-IN')
            ])
        ];
        const csv = csvRows.map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'sales-report.csv'; a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            <div className="rounded-3xl border border-emerald-200/60 bg-gradient-to-r from-emerald-50 via-emerald-50 to-emerald-50 dark:from-slate-900 dark:to-slate-800 dark:border-slate-700 p-5 md:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Sales Report</h1>
                    <p className="text-slate-600 dark:text-slate-300 mt-1">All sales transactions and revenue</p>
                </div>
                <button onClick={handleExport} className="air-btn-secondary">
                    <Download className="w-4 h-4" /> Export CSV
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="air-surface rounded-2xl p-5">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Total Sales (Invoices)</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{summary.totalSales}</p>
                </div>
                <div className="air-surface rounded-2xl p-5">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Total Revenue {filterDate ? '(filtered)' : ''}</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                        ₹{((filterDate || search) ? filteredRevenue : summary.totalRevenue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by invoice ID, product, customer..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="air-input pl-10 w-full"
                    />
                </div>
                <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
                    max={new Date().toLocaleDateString('en-CA')}
                    className="air-input text-sm" title="Filter by date" />
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
                                    <th className="text-left px-4 py-3">Invoice ID</th>
                                    <th className="text-left px-4 py-3">Product</th>
                                    <th className="text-left px-4 py-3">Customer</th>
                                    <th className="text-right px-4 py-3">Qty</th>
                                    <th className="text-right px-4 py-3">Price</th>
                                    <th className="text-right px-4 py-3">GST</th>
                                    <th className="text-right px-4 py-3">Total</th>
                                    <th className="text-right px-4 py-3">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {filtered.length === 0 ? (
                                    <tr><td colSpan={8} className="text-center py-10 text-slate-500 dark:text-slate-400">No sales records found</td></tr>
                                ) : filtered.map((r, i) => (
                                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                        <td className="px-4 py-3 font-mono text-xs text-indigo-600 dark:text-indigo-400">{r.invoiceId}</td>
                                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{r.productName}</td>
                                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{r.customer}</td>
                                        <td className="px-4 py-3 text-right">{r.quantity}</td>
                                        <td className="px-4 py-3 text-right">₹{Number(r.price || 0).toFixed(2)}</td>
                                        <td className="px-4 py-3 text-right text-slate-500">{r.gst}%</td>
                                        <td className="px-4 py-3 text-right font-semibold text-green-600 dark:text-green-400">₹{r.total.toFixed(2)}</td>
                                        <td className="px-4 py-3 text-right text-slate-500 text-xs">{new Date(r.date).toLocaleDateString('en-IN')}</td>
                                    </tr>
                                ))}
                            </tbody>
                            {filtered.length > 0 && (
                                <tfoot>
                                    <tr className="bg-slate-50 dark:bg-slate-800 font-semibold text-sm">
                                        <td colSpan={7} className="px-4 py-3 text-right text-slate-700 dark:text-slate-300">Filtered Total Revenue</td>
                                        <td className="px-4 py-3 text-right text-green-600 dark:text-green-400">
                                            ₹{filteredRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
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
