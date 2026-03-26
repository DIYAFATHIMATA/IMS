import { useState, useEffect, useMemo } from 'react';
import { Search, Download } from 'lucide-react';
import { reportsApi } from '../../services/api';
import { authStorage } from '../../services/authStorage';

export default function InventoryReport() {
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const load = async () => {
            try {
                const token = authStorage.getToken();
                if (!token) return;
                const res = await reportsApi.getInventory(token);
                setProducts(res.data || []);
            } catch (e) {
                alert(e.message || 'Failed to load inventory report');
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, []);

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return products.filter(p =>
            p.name?.toLowerCase().includes(q) ||
            p.category?.toLowerCase().includes(q)
        );
    }, [products, search]);

    const totalStockValue = filtered.reduce((sum, p) => sum + Number(p.price || 0) * Number(p.stock || 0), 0);
    const totalItems = filtered.reduce((sum, p) => sum + Number(p.stock || 0), 0);

    const handleExport = () => {
        const rows = [
            ['Product Name', 'Category', 'Selling Price', 'Current Stock', 'GST %', 'Stock Value'],
            ...filtered.map(p => [
                p.name, p.category,
                Number(p.price || 0).toFixed(2),
                p.stock,
                `${p.gst}%`,
                (Number(p.price || 0) * Number(p.stock || 0)).toFixed(2)
            ])
        ];
        const csv = rows.map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'inventory-report.csv'; a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            <div className="rounded-3xl border border-emerald-200/60 bg-gradient-to-r from-emerald-50 via-emerald-50 to-emerald-50 dark:from-slate-900 dark:to-slate-800 dark:border-slate-700 p-5 md:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Inventory Report</h1>
                    <p className="text-slate-600 dark:text-slate-300 mt-1">Current stock levels and valuation</p>
                </div>
                <button onClick={handleExport} className="air-btn-secondary">
                    <Download className="w-4 h-4" /> Export CSV
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="air-surface rounded-2xl p-5">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Total Products</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{filtered.length}</p>
                </div>
                <div className="air-surface rounded-2xl p-5">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Total Units in Stock</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{totalItems}</p>
                </div>
                <div className="air-surface rounded-2xl p-5">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Total Stock Value</p>
                    <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">₹{totalStockValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search by product name or category..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="air-input pl-10 w-full"
                />
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
                                    <th className="text-left px-4 py-3">Product Name</th>
                                    <th className="text-left px-4 py-3">Category</th>
                                    <th className="text-right px-4 py-3">Price</th>
                                    <th className="text-right px-4 py-3">Stock</th>
                                    <th className="text-right px-4 py-3">GST</th>
                                    <th className="text-right px-4 py-3">Stock Value</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {filtered.length === 0 ? (
                                    <tr><td colSpan={6} className="text-center py-10 text-slate-500 dark:text-slate-400">No products found</td></tr>
                                ) : filtered.map(p => (
                                    <tr key={p._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                                            {p.name}
                                            <div className="text-xs text-slate-400 font-normal">{p.sku}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">{p.category}</span>
                                        </td>
                                        <td className="px-4 py-3 text-right">₹{Number(p.price || 0).toFixed(2)}</td>
                                        <td className={`px-4 py-3 text-right font-semibold ${Number(p.stock) < 10 ? 'text-red-500' : 'text-slate-700 dark:text-slate-300'}`}>
                                            {p.stock}
                                        </td>
                                        <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400">{p.gst}%</td>
                                        <td className="px-4 py-3 text-right font-semibold text-indigo-600 dark:text-indigo-400">
                                            ₹{(Number(p.price || 0) * Number(p.stock || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            {filtered.length > 0 && (
                                <tfoot>
                                    <tr className="bg-slate-50 dark:bg-slate-800 font-semibold text-sm">
                                        <td colSpan={5} className="px-4 py-3 text-right text-slate-700 dark:text-slate-300">Total Stock Value</td>
                                        <td className="px-4 py-3 text-right text-indigo-600 dark:text-indigo-400">
                                            ₹{totalStockValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
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
