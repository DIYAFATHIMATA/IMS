import { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ThemeToggle from '../components/ThemeToggle';
import { Search, Bell, AlertTriangle, Menu, X } from 'lucide-react';
import { inventoryApi, notificationsApi } from '../services/api';
import { authStorage } from '../services/authStorage';
import { useAuth } from '../context/AuthContext';
import { STAFF_ROLE } from '../utils/roles';
function NotificationBell({ isStaff }) {
    const [items, setItems] = useState([]);
    const [lowItems, setLowItems] = useState([]);
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const navigate = useNavigate();
    const token = authStorage.getToken();

    const fetchNotifications = async () => {
        if (!token) return;
        try {
            const res = await notificationsApi.getAll(token, 20);
            setItems(res.data || []);
        } catch {
            // Keep UI resilient if notifications service is unavailable.
        }
    };

    const fetchLowStock = async () => {
        if (!token || !isStaff) return;
        try {
            const res = await inventoryApi.getItems(token);
            const rows = (res.data || []).filter((p) => Number(p.stock) < Number(p.minStockLevel ?? 5));
            setLowItems(rows);
        } catch {
            // Keep UI resilient if inventory service is unavailable.
        }
    };

    useEffect(() => {
        fetchNotifications();
        fetchLowStock();
        const interval = setInterval(() => {
            fetchNotifications();
            fetchLowStock();
        }, 60_000);
        return () => clearInterval(interval);
    }, [token, isStaff]);

    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const unreadCount = items.filter((item) => !item.isRead).length;
    const lowStockCount = isStaff ? lowItems.length : 0;
    const totalAlertCount = unreadCount + lowStockCount;

    const markAsRead = async (id) => {
        try {
            await notificationsApi.markRead(id, token);
            setItems((prev) => prev.map((item) => (item._id === id ? { ...item, isRead: true } : item)));
        } catch {
            // Ignore failures and let next poll reconcile.
        }
    };

    const markAllAsRead = async () => {
        try {
            await notificationsApi.markAllRead(token);
            setItems((prev) => prev.map((item) => ({ ...item, isRead: true })));
        } catch {
            // Ignore failures and let next poll reconcile.
        }
    };

    const handleNotificationClick = async (item) => {
        if (!item.isRead) {
            await markAsRead(item._id);
        }

        const orderId = item?.metadata?.orderId;
        if (orderId) {
            setOpen(false);
            navigate(`/supplier/orders/${orderId}`);
        }
    };

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen((o) => !o)}
                className="p-2 text-zinc-500 dark:text-gray-400 hover:bg-zinc-100 dark:hover:bg-gray-700 rounded-xl relative transition-colors"
                title={totalAlertCount > 0 ? `${totalAlertCount} alert${totalAlertCount > 1 ? 's' : ''}` : 'Notifications'}
            >
                <Bell className={`w-5 h-5 ${totalAlertCount > 0 ? 'text-emerald-700 dark:text-emerald-400' : ''}`} />
                {totalAlertCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-emerald-700 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800">
                        {totalAlertCount > 99 ? '99+' : totalAlertCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 top-12 w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-zinc-200 dark:border-gray-700 z-50 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-gray-700">
                        <span className="text-sm font-semibold text-zinc-900 dark:text-white">Alerts</span>
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-zinc-500 dark:text-gray-400">{unreadCount} unread</span>
                            <button
                                onClick={markAllAsRead}
                                disabled={unreadCount === 0}
                                className="text-xs font-semibold text-emerald-600 disabled:text-zinc-400 disabled:cursor-not-allowed"
                            >
                                Mark all read
                            </button>
                        </div>
                    </div>

                    {isStaff ? (
                        <div className="border-b border-zinc-100 dark:border-gray-700">
                            <div className="px-4 py-2 flex items-center justify-between bg-amber-50/60 dark:bg-amber-900/10">
                                <div className="inline-flex items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-400">
                                    <AlertTriangle className="w-3.5 h-3.5" /> Low Stock
                                </div>
                                <span className="text-xs text-amber-700 dark:text-amber-400">{lowStockCount}</span>
                            </div>
                            <div className="max-h-40 overflow-y-auto">
                                {lowStockCount === 0 ? (
                                    <div className="py-4 text-center text-xs text-zinc-400">All stock levels are healthy</div>
                                ) : (
                                    lowItems.slice(0, 5).map((item) => (
                                        <button
                                            key={item._id}
                                            onClick={() => {
                                                setOpen(false);
                                                navigate('/inventory/low-stock');
                                            }}
                                            className="w-full text-left px-4 py-2 border-b border-zinc-50 dark:border-gray-700/50 last:border-0 hover:bg-zinc-50 dark:hover:bg-gray-700/40"
                                        >
                                            <p className="text-xs font-medium text-zinc-800 dark:text-zinc-100">{item.name}</p>
                                            <p className="text-[11px] text-zinc-500">Stock {item.stock} / Min {Number(item.minStockLevel ?? 5)}</p>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    ) : null}

                    <div className="max-h-80 overflow-y-auto">
                        {items.length === 0 ? (
                            <div className="py-10 text-center text-sm text-zinc-400">No notifications</div>
                        ) : (
                            items.map((item) => (
                                <button
                                    key={item._id}
                                    onClick={() => handleNotificationClick(item)}
                                    className={`w-full text-left px-4 py-3 border-b border-zinc-50 dark:border-gray-700/50 last:border-0 hover:bg-zinc-50 dark:hover:bg-gray-700/40 ${item.isRead ? 'opacity-75' : 'bg-emerald-50/70 dark:bg-emerald-900/10'}`}
                                >
                                    <p className="text-sm font-medium text-zinc-900 dark:text-white">{item.title}</p>
                                    <p className="text-xs text-zinc-500 dark:text-gray-400 mt-0.5">{item.message}</p>
                                    {item?.metadata?.orderId ? (
                                        <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1">Open related order</p>
                                    ) : null}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function DashboardLayout() {
    const { user } = useAuth();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isNavigating, setIsNavigating] = useState(false);

    useEffect(() => {
        setIsNavigating(true);
        const timer = setTimeout(() => setIsNavigating(false), 260);
        return () => clearTimeout(timer);
    }, [location.pathname]);

    const pageTitle =
        location.pathname === '/dashboard'
            ? 'Dashboard'
            : location.pathname
                  .split('/')
                  .filter(Boolean)
                  .slice(-1)[0]
                  ?.replace(/-/g, ' ')
                  .replace(/\b\w/g, (ch) => ch.toUpperCase()) || 'Dashboard';

    const activeSection =
        location.pathname
            .split('/')
            .filter(Boolean)
            .slice(0, 1)[0]
            ?.replace(/-/g, ' ')
            .replace(/\b\w/g, (ch) => ch.toUpperCase()) || 'Dashboard';

    return (
        <div className="dashboard-typography flex min-h-screen bg-transparent transition-colors duration-300">
            <div className="hidden lg:block">
                <Sidebar />
            </div>

            {sidebarOpen ? (
                <div className="lg:hidden fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)}>
                    <div className="w-72 h-full" onClick={(e) => e.stopPropagation()}>
                        <Sidebar />
                    </div>
                </div>
            ) : null}

            <div className="flex-1 flex flex-col min-w-0 lg:pl-0">
                <header className="bg-white/85 dark:bg-slate-900/85 backdrop-blur border-b border-slate-200/80 dark:border-slate-700/80 h-16 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30 transition-colors duration-300">
                    <div className="flex items-center gap-3 min-w-0">
                        <button
                            type="button"
                            onClick={() => setSidebarOpen((prev) => !prev)}
                            className="lg:hidden p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                        >
                            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                        </button>
                        <h2 className="text-sm lg:text-base font-semibold text-slate-900 dark:text-slate-100 truncate">{pageTitle}</h2>
                        <span className="hidden md:inline-flex items-center rounded-full border border-emerald-200/80 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-300">
                            {activeSection}
                        </span>
                    </div>

                    <div className="flex items-center gap-2 lg:gap-4">
                        <div className="relative hidden md:block">
                            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search products, orders, customers..."
                                className="air-input pl-9 py-2.5 w-72 bg-slate-50 dark:bg-slate-800"
                            />
                        </div>
                        <NotificationBell isStaff={user?.role === STAFF_ROLE} />
                        <div className="w-px h-7 bg-slate-200 dark:bg-slate-700 mx-1"></div>
                        <ThemeToggle />
                    </div>
                </header>

                <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto overflow-x-hidden">
                    <div className="mx-auto max-w-[1600px] route-shell">
                        <div className={`route-progress ${isNavigating ? 'is-active' : ''}`} />
                        <div key={location.pathname} className="route-panel">
                            <Outlet />
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

