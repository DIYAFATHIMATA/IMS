import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    TrendingUp, ShoppingCart, Package, Users, AlertTriangle,
    Receipt, FileText, BarChart2, RefreshCw,
    ChevronRight, CheckCircle2
} from 'lucide-react';
import { authStorage } from '../services/authStorage';
import { reportsApi, inventoryApi, invoicesApi, customersApi, supplyRequestsApi } from '../services/api';
import { ADMIN_ROLE, STAFF_ROLE, SUPPLIER_ROLE } from '../utils/roles';
import DashboardCard from '../components/ui/DashboardCard';
import ProductThumbnail from '../components/ui/ProductThumbnail';

function BarChart({ data }) {
    const max = Math.max(...data.map((d) => d.value), 1);
    const barW = 36;
    const gap = 10;
    const chartH = 96;
    const count = data.length;
    const totalW = count * (barW + gap) - gap;
    return (
        <svg viewBox={`0 -8 ${totalW} ${chartH + 32}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
            {data.map((d, i) => {
                const barH = Math.max(4, (d.value / max) * chartH);
                const x = i * (barW + gap);
                const y = chartH - barH;
                const isLast = i === count - 1;
                return (
                    <g key={i}>
                        <rect x={x} y={0} width={barW} height={chartH} rx={6} fill="#f4f4f5" />
                        <rect x={x} y={y} width={barW} height={barH} rx={6} fill={isLast ? '#f43f5e' : '#6366f1'} opacity={isLast ? 1 : 0.7} />
                        {d.value > 0 && (
                            <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize={8} fill="#6b7280">
                                {String.fromCharCode(8377)}{d.value >= 1000 ? `${(d.value / 1000).toFixed(1)}k` : d.value}
                            </text>
                        )}
                        <text x={x + barW / 2} y={chartH + 20} textAnchor="middle" fontSize={10} fill="#9ca3af">{d.label}</text>
                    </g>
                );
            })}
        </svg>
    );
}

function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'morning';
    if (h < 17) return 'afternoon';
    return 'evening';
}

export default function Dashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [summary, setSummary] = useState(null);
    const [recentTx, setRecentTx] = useState([]);
    const [lowItems, setLowItems] = useState([]);
    const [supplierRequests, setSupplierRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(null);
    const token = authStorage.getToken();

    const loadData = async () => {
        if (!token) {
            setLoading(false);
            return;
        }
        try {
            if (user?.role === ADMIN_ROLE || user?.role === STAFF_ROLE) {
                const [summaryRes, txRes, itemsRes] = await Promise.all([
                    reportsApi.getSummary(token),
                    inventoryApi.getStockTransactions(token, 8),
                    inventoryApi.getItems(token, { limit: 50 })
                ]);
                
                const s = summaryRes.data || {};
                setSummary({
                    ...s,
                    // Map legacy property names if they differ
                    pendingSupplyRequests: s.pendingSupplyRequests || 0,
                    completedDeliveries: s.verifiedSupplyRequests || s.completedDeliveries || 0,
                });
                
                setRecentTx(txRes.data || []);
                setLowItems((itemsRes.data || []).filter((i) => Number(i.stock) < 5));
            } else if (user?.role === SUPPLIER_ROLE) {
                const requestsRes = await supplyRequestsApi.getAll(token, { limit: 20 });
                const requests = requestsRes.data || [];
                setSupplierRequests(requests);
                setSummary({
                    pendingRequests: requests.filter((r) => r.status === 'Pending').length,
                    approvedRequests: requests.filter((r) => r.status === 'Approved').length,
                    deliveredRequests: requests.filter((r) => r.status === 'Delivered').length,
                    verifiedRequests: requests.filter((r) => r.status === 'Completed').length
                });
                setRecentTx([]);
                setLowItems([]);
            }

            setLastUpdated(new Date());
        } catch (e) {
            console.error('Dashboard load error:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex items-center gap-3 text-zinc-400">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span className="text-sm">Loading dashboard...</span>
                </div>
            </div>
        );
    }

    if (user?.role === SUPPLIER_ROLE) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Supplier Dashboard</h1>
                        <p className="text-sm text-slate-500 mt-1">Manage and track assigned supply requests</p>
                    </div>
                    <button onClick={() => navigate('/supply-requests')} className="air-btn-primary">Open Supply Requests</button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <DashboardCard title="Pending" value={summary?.pendingRequests || 0} icon={TrendingUp} tone="warning" />
                    <DashboardCard title="Accepted" value={summary?.acceptedRequests || 0} icon={CheckCircle2} tone="primary" />
                    <DashboardCard title="Shipped" value={summary?.shippedRequests || 0} icon={ShoppingCart} tone="primary" />
                    <DashboardCard title="Delivered" value={summary?.deliveredRequests || 0} icon={Package} tone="success" />
                    <DashboardCard title="Verified" value={summary?.verifiedRequests || 0} icon={Receipt} tone="success" />
                </div>

                <div className="air-surface p-6">
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-3">Recent Supply Requests</h3>
                    {supplierRequests.length === 0 ? (
                        <p className="text-sm text-slate-500">No requests assigned yet.</p>
                    ) : (
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {supplierRequests.slice(0, 8).map((request) => (
                                <div key={request._id} className="py-3 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{request.requestId} · {request.productName}</p>
                                        <p className="text-xs text-slate-400 mt-1">Qty: {request.quantity} · Staff: {request.staffName}</p>
                                    </div>
                                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{request.status}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    const s = summary || {};
    const trend = s.monthlySalesTrend || [];
    const hasTrendData = trend.some((t) => t.value > 0);
    const outOfStock = lowItems.filter((i) => Number(i.stock) === 0).length;
    const spotlightProducts = (lowItems.length > 0
        ? lowItems.slice(0, 8).map((item, index) => ({
            key: item._id || index,
            name: item.name,
            category: item.category || 'General',
            price: item.price,
            stock: item.stock,
            imageUrl: item.imageUrl || item.image || item.thumbnail,
            risk: Number(item.stock) === 0 ? 'Out of stock' : 'Low stock'
        }))
        : recentTx.slice(0, 8).map((tx, index) => ({
            key: tx._id || index,
            name: tx.productName || 'Unknown Product',
            category: tx.reference || 'Recent movement',
            price: null,
            stock: tx.quantity,
            imageUrl: tx.imageUrl || tx.image || tx.thumbnail,
            risk: tx.type === 'IN' ? 'Incoming' : 'Outgoing'
        }))
    );

    const quickActions = user?.role === ADMIN_ROLE
        ? [
            { label: 'View Reports', icon: BarChart2, to: '/reports', iconBg: 'bg-rose-50', iconColor: 'text-rose-600' },
            { label: 'View Low Stock', icon: AlertTriangle, to: '/inventory/low-stock', iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
            { label: 'Supply Requests', icon: Receipt, to: '/supply-requests', iconBg: 'bg-orange-50', iconColor: 'text-orange-600' },
            { label: 'Activity Logs', icon: FileText, to: '/audit-log', iconBg: 'bg-slate-50', iconColor: 'text-slate-600' },
            { label: 'Manage Users', icon: Users, to: '/users', iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' }
        ]
        : [
            { label: 'New Sales Invoice', icon: FileText, to: '/sales/invoices', iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
            { label: 'Add Product', icon: Package, to: '/inventory/items', iconBg: 'bg-violet-50', iconColor: 'text-violet-600' },
            { label: 'Manage Customers', icon: Users, to: '/sales/customers', iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
            { label: 'View Low Stock', icon: AlertTriangle, to: '/inventory/low-stock', iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
            { label: 'Supply Requests', icon: Receipt, to: '/supply-requests', iconBg: 'bg-orange-50', iconColor: 'text-orange-600' }
        ];

    return (
        <div className="space-y-6">
            <section className="rounded-3xl border border-emerald-200/60 bg-gradient-to-r from-emerald-50 via-emerald-50 to-emerald-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 dark:border-slate-700 p-5 md:p-7">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white">Good {getGreeting()}, {user?.name || user?.role || 'User'}</h1>
                        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{today}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {lastUpdated && (
                            <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                                Updated {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        )}
                        <button onClick={() => { setLoading(true); loadData(); }} className="air-btn-secondary">
                            <RefreshCw className="w-4 h-4" /> Refresh Data
                        </button>
                    </div>
                </div>
            </section>

            {lowItems.length > 0 && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/80 dark:bg-amber-900/20 dark:border-amber-800 p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                        <div className="min-w-0">
                            <span className="font-semibold text-amber-800 dark:text-amber-200 text-sm">
                                {lowItems.length} product{lowItems.length > 1 ? 's' : ''} need restocking{outOfStock > 0 ? ` · ${outOfStock} out of stock` : ''}
                            </span>
                            <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5 truncate">
                                {lowItems.slice(0, 3).map((i) => i.name).join(', ')}{lowItems.length > 3 ? ` +${lowItems.length - 3} more` : ''}
                            </p>
                        </div>
                    </div>
                    <button onClick={() => navigate('/inventory/low-stock')} className="text-xs font-semibold text-amber-700 dark:text-amber-300 whitespace-nowrap flex items-center gap-1 hover:underline shrink-0">
                        View all <ChevronRight className="w-3 h-3" />
                    </button>
                </div>
            )}

            {user?.role === ADMIN_ROLE ? (
                <div className="grid grid-cols-2 xl:grid-cols-6 gap-4">
                    <DashboardCard title="Total Products" value={s.productsCount || 0} subtitle="In inventory" icon={Package} />
                    <DashboardCard title="Total Suppliers" value={s.suppliersCount || 0} subtitle="Supplier accounts" icon={ShoppingCart} />
                    <DashboardCard title="Total Staff" value={s.staffCount || 0} subtitle="Operational users" icon={Users} />
                    <DashboardCard title="Low Stock" value={s.lowStockCount || 0}
                        subtitle={outOfStock > 0 ? `${outOfStock} out of stock` : 'Below threshold'}
                        icon={AlertTriangle}
                        tone={(s.lowStockCount || 0) > 0 ? 'warning' : 'default'} />
                    <DashboardCard title="Pending Requests" value={s.pendingSupplyRequests || 0} subtitle="Need action" icon={Receipt} tone="warning" />
                    <DashboardCard title="Completed" value={s.verifiedSupplyRequests || 0} subtitle="Verified deliveries" icon={CheckCircle2} tone="success" />
                </div>
            ) : (
                <div className="grid grid-cols-2 xl:grid-cols-6 gap-4">
                    <DashboardCard title="Total Products" value={s.productsCount || 0} subtitle="In inventory" icon={Package} />
                    <DashboardCard title="Customers" value={s.customersCount || 0} subtitle="Registered accounts" icon={Users} />
                    <DashboardCard title="Invoices" value={s.invoiceCount || 0} subtitle="Sales invoices" icon={TrendingUp} tone="primary" />
                    <DashboardCard title="Low Stock" value={s.lowStockCount || 0}
                        subtitle={outOfStock > 0 ? `${outOfStock} out of stock` : 'Below threshold'}
                        icon={AlertTriangle}
                        tone={(s.lowStockCount || 0) > 0 ? 'warning' : 'default'} />
                    <DashboardCard title="Pending Requests" value={s.pendingSupplyRequests || 0} subtitle="Awaiting completion" icon={Receipt} tone="warning" />
                    <DashboardCard title="Deliveries" value={s.completedDeliveries || 0} subtitle="Verified requests" icon={CheckCircle2} tone="success" />
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                <div className="xl:col-span-8 space-y-6">
                    <div className="air-surface p-5 md:p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-base font-semibold text-slate-900 dark:text-white">Product Spotlight</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Card view of products needing attention</p>
                            </div>
                            <button onClick={() => navigate('/inventory/items')} className="text-xs font-semibold text-emerald-600 hover:underline flex items-center gap-1">
                                Open inventory <ChevronRight className="w-3 h-3" />
                            </button>
                        </div>

                        {spotlightProducts.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {spotlightProducts.map((item) => (
                                    <div key={item.key} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/60 p-4 hover:shadow-md transition-shadow">
                                        <ProductThumbnail
                                            name={item.name}
                                            category={item.category}
                                            imageUrl={item.imageUrl}
                                            className="h-24 w-full mb-3"
                                        />
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{item.name}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{item.category}</p>
                                            </div>
                                            <span className="text-[10px] px-2 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 font-semibold">
                                                {item.risk}
                                            </span>
                                        </div>
                                        <div className="mt-4 flex items-end justify-between">
                                            <div>
                                                <p className="text-[11px] uppercase tracking-wide text-slate-400">Stock</p>
                                                <p className="text-lg font-bold text-slate-900 dark:text-white">{item.stock ?? '-'}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[11px] uppercase tracking-wide text-slate-400">Price</p>
                                                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{item.price ? `₹${item.price}` : '-'}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 py-10 text-center text-slate-400">
                                No product data available yet
                            </div>
                        )}
                    </div>

                    <div className="air-surface p-6">
                        <div className="flex items-center justify-between mb-1">
                            <div>
                                <h3 className="text-base font-semibold text-slate-900 dark:text-white">Monthly Sales Revenue</h3>
                                <p className="text-xs text-slate-400 mt-0.5">Last 6 months · all invoices</p>
                            </div>
                            <div className="flex items-center gap-3 text-xs">
                                <span className="flex items-center gap-1.5 text-slate-400">
                                    <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500/70 inline-block"></span> Previous
                                </span>
                                <span className="flex items-center gap-1.5 text-slate-400">
                                    <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block"></span> Current
                                </span>
                            </div>
                        </div>
                        <div className="mt-4 h-40">
                            {hasTrendData ? (
                                <BarChart data={trend} />
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-100 dark:border-slate-700 rounded-xl">
                                    <BarChart2 className="w-8 h-8 mb-2" />
                                    <span className="text-sm">No sales recorded yet</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <aside className="xl:col-span-4 space-y-6">
                    <div className="air-surface p-6">
                        <div className="mb-4">
                            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Quick Actions</h3>
                            <p className="text-xs text-slate-400 mt-0.5">Jump to common tasks</p>
                        </div>
                        <div className="space-y-1">
                            {quickActions.map((action) => (
                                <button key={action.label} onClick={() => navigate(action.to)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors text-left group">
                                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${action.iconBg}`}>
                                        <action.icon className={`w-4 h-4 ${action.iconColor}`} />
                                    </span>
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white flex-1">{action.label}</span>
                                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition-colors" />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="air-surface p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-base font-semibold text-slate-900 dark:text-white">Order / Stock Details</h3>
                                <p className="text-xs text-slate-400 mt-0.5">Recent movement snapshots</p>
                            </div>
                        </div>
                        {recentTx.length > 0 ? (
                            <div className="space-y-3">
                                {recentTx.slice(0, 6).map((tx, i) => {
                                    const isIn = tx.type === 'IN';
                                    return (
                                        <div key={i} className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 bg-slate-50/70 dark:bg-slate-800/70">
                                            <div className="flex items-center justify-between gap-3">
                                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{tx.productName || 'Unknown Product'}</p>
                                                <span className={`text-xs font-bold ${isIn ? 'text-emerald-600' : 'text-rose-500'}`}>{isIn ? '+' : '-'}{tx.quantity}</span>
                                            </div>
                                            <p className="text-[11px] text-slate-500 mt-1 truncate">Ref: {tx.reference || '-'} · {new Date(tx.createdAt || tx.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 py-8 text-center text-slate-400 text-sm">
                                No stock transactions yet
                            </div>
                        )}
                    </div>
                </aside>
            </div>
        </div>
    );
}
