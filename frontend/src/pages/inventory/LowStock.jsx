import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, PackageX, RefreshCw, Search } from 'lucide-react';
import { inventoryApi } from '../../services/api';
import { authStorage } from '../../services/authStorage';

const LOW_STOCK_THRESHOLD = 5;

function StockBadge({ stock }) {
    if (stock === 0) {
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
                Out of Stock
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
            Low Stock
        </span>
    );
}

export default function LowStock() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const token = authStorage.getToken();

    const fetchLowStock = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        else setRefreshing(true);
        try {
            const res = await inventoryApi.getItems(token);
            const all = res.data || [];
            setItems(all.filter(p => Number(p.stock) < LOW_STOCK_THRESHOLD));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [token]);

    useEffect(() => {
        fetchLowStock();
        const interval = setInterval(() => fetchLowStock(true), 30_000);
        return () => clearInterval(interval);
    }, [fetchLowStock]);

    const filtered = items.filter(p =>
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Page header */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                        <AlertTriangle className="w-6 h-6 text-amber-500" />
                        Low Stock
                    </h1>
                    <p className="text-zinc-500 mt-1">
                        Products with stock below {LOW_STOCK_THRESHOLD} units — restock these items soon.
                    </p>
                </div>
                <button
                    onClick={() => fetchLowStock(true)}
                    disabled={refreshing}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-zinc-300 dark:border-gray-600 rounded-xl hover:bg-zinc-50 dark:hover:bg-gray-700 transition-colors text-zinc-700 dark:text-gray-300 disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-zinc-200 dark:border-gray-700 p-5 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">Low Stock Items</p>
                    <p className="text-3xl font-bold text-amber-500">{items.filter(p => p.stock > 0).length}</p>
                    <p className="text-xs text-zinc-400 mt-1">Below {LOW_STOCK_THRESHOLD} units</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-zinc-200 dark:border-gray-700 p-5 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">Out of Stock</p>
                    <p className="text-3xl font-bold text-red-500">{items.filter(p => p.stock === 0).length}</p>
                    <p className="text-xs text-zinc-400 mt-1">Zero units remaining</p>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-zinc-200 dark:border-gray-700 mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                        type="text"
                        placeholder="Search by product name, category or SKU..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="air-input pl-10 py-2.5"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-zinc-200 dark:border-gray-700 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-zinc-500">Loading...</div>
                ) : filtered.length === 0 ? (
                    <div className="p-12 flex flex-col items-center justify-center gap-3">
                        <PackageX className="w-12 h-12 text-zinc-300" />
                        <p className="text-zinc-500 font-medium">
                            {searchTerm ? 'No results match your search.' : 'All stock levels are healthy!'}
                        </p>
                        {!searchTerm && (
                            <p className="text-zinc-400 text-sm">No products are below {LOW_STOCK_THRESHOLD} units.</p>
                        )}
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-zinc-50 dark:bg-gray-700/50 border-b border-zinc-200 dark:border-gray-700">
                            <tr>
                                {['Product Name', 'SKU', 'Category', 'Current Stock', 'Min. Level', 'Status'].map(h => (
                                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-gray-700">
                            {filtered
                                .sort((a, b) => Number(a.stock) - Number(b.stock)) // most critical first
                                .map(product => (
                                    <tr key={product._id} className="hover:bg-zinc-50 dark:hover:bg-gray-700/30 transition-colors">
                                        <td className="px-5 py-3.5 text-sm font-medium text-zinc-900 dark:text-white">
                                            {product.name}
                                        </td>
                                        <td className="px-5 py-3.5 text-sm text-zinc-500 dark:text-gray-400 font-mono">
                                            {product.sku || '—'}
                                        </td>
                                        <td className="px-5 py-3.5 text-sm text-zinc-600 dark:text-gray-400">
                                            {product.category || '—'}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className={`text-sm font-bold ${
                                                product.stock === 0
                                                    ? 'text-red-600 dark:text-red-400'
                                                    : 'text-amber-600 dark:text-amber-400'
                                            }`}>
                                                {product.stock}
                                            </span>
                                            <span className="text-xs text-zinc-400 ml-1">units</span>
                                        </td>
                                        <td className="px-5 py-3.5 text-sm text-zinc-500 dark:text-gray-400">
                                            {LOW_STOCK_THRESHOLD} units
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <StockBadge stock={product.stock} />
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                )}
            </div>

            <p className="text-xs text-zinc-400 mt-4 text-right">
                Auto-refreshes every 30 seconds · Last fetch: {new Date().toLocaleTimeString('en-IN')}
            </p>
        </div>
    );
}
