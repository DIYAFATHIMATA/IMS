import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    FileBarChart,
    Users,
    Settings,
    LogOut,
    Receipt,
    ChevronDown,
    ChevronRight,
    FileText,
    Undo2,
    UserCircle,
    ClipboardList,
    ShoppingBag,
    AlertTriangle,
    Truck
} from 'lucide-react';
import clsx from 'clsx';
import { ADMIN_ROLE, STAFF_ROLE, SUPPLIER_ROLE } from '../utils/roles';

export default function Sidebar() {
    const { user, logout } = useAuth();
    const location = useLocation();

    // State for expanded nested menus — auto-expand the section matching the current URL
    const [expandedMenus, setExpandedMenus] = useState(() => {
        if (location.pathname.startsWith('/inventory')) return ['Inventory'];
        if (location.pathname.startsWith('/sales')) return ['Sales'];
        if (location.pathname.startsWith('/reports')) return ['Reports'];
        return [];
    });

    const toggleMenu = (name) => {
        setExpandedMenus(prev =>
            prev.includes(name)
                ? prev.filter(item => item !== name)
                : [...prev, name]
        );
    };

    const ALL_ROLES = [ADMIN_ROLE, STAFF_ROLE, SUPPLIER_ROLE];

    const links = [
        { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, roles: ALL_ROLES },

        // Inventory Group
        {
            name: 'Inventory',
            icon: Package,
            roles: [STAFF_ROLE, ADMIN_ROLE],
            children: [
                { name: 'Items', to: '/inventory/items', icon: Package, roles: [STAFF_ROLE] },
                { name: 'Categories', to: '/inventory/categories', icon: LayoutDashboard, roles: [STAFF_ROLE] },
            ]
        },

        // Sales Group (Already implemented)
        {
            name: 'Sales',
            icon: ShoppingCart,
            roles: [STAFF_ROLE],
            children: [
                { name: 'Customers', to: '/sales/customers', icon: UserCircle, roles: [STAFF_ROLE] },
                { name: 'Sales Orders', to: '/sales/orders', icon: ClipboardList, roles: [STAFF_ROLE] },
                { name: 'Invoices', to: '/sales/invoices', icon: FileText, roles: [STAFF_ROLE] },
                { name: 'Sales Returns', to: '/sales/returns', icon: Undo2, roles: [STAFF_ROLE] },
            ]
        },

        { name: 'Supply Requests', to: '/supply-requests', icon: ClipboardList, roles: [ADMIN_ROLE, STAFF_ROLE, SUPPLIER_ROLE] },
        { name: 'Supplier Orders', to: '/supplier/orders', icon: Truck, roles: [SUPPLIER_ROLE] },

        // Reports Group
        {
            name: 'Reports',
            icon: FileBarChart,
            roles: [ADMIN_ROLE],
            children: [
                { name: 'Inventory Report', to: '/reports/inventory', icon: Package, roles: [ADMIN_ROLE] },
                { name: 'Sales Report', to: '/reports/sales', icon: ShoppingCart, roles: [ADMIN_ROLE] },
                { name: 'Purchase Report', to: '/reports/purchases', icon: ShoppingBag, roles: [ADMIN_ROLE] }
            ]
        },

        { name: 'Activity Logs', to: '/audit-log', icon: FileText, roles: [ADMIN_ROLE] },

        { name: 'Users', to: '/users', icon: Users, roles: [ADMIN_ROLE] },
        { name: 'Settings', to: '/profile', icon: Settings, roles: [ADMIN_ROLE, STAFF_ROLE] },
        { name: 'Settings', to: '/supplier/profile', icon: Settings, roles: [SUPPLIER_ROLE] },
    ];

    const filteredLinks = links.filter(link => !link.roles || link.roles.includes(user?.role));

    const renderLink = (link) => {
        // Parent Link with Children
        if (link.children) {
            // Filter children based on roles
            const visibleChildren = link.children.filter(child =>
                !child.roles || child.roles.includes(user?.role)
            );

            if (visibleChildren.length === 0) return null;

            const isExpanded = expandedMenus.includes(link.name);
            const isActiveParent = visibleChildren.some(child => location.pathname === child.to);

            return (
                <div key={link.name} className="space-y-1">
                    <button
                        onClick={() => toggleMenu(link.name)}
                        className={clsx(
                            "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group",
                            isActiveParent || isExpanded
                                ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/70 dark:bg-emerald-900/20 dark:text-emerald-300 dark:ring-emerald-900/30"
                                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/70"
                        )}
                    >
                        <div className="flex items-center gap-3">
                            <link.icon className={clsx("w-5 h-5", isActiveParent ? "text-emerald-600 dark:text-emerald-300" : "text-slate-500")} />
                            <span className="text-sm font-medium">{link.name}</span>
                        </div>
                        {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                    </button>

                    {/* Children Links */}
                    {isExpanded && (
                        <div className="pl-4 space-y-1 nav-children-reveal">
                            {visibleChildren.map(child => (
                                <NavLink
                                    key={child.to}
                                    to={child.to}
                                    className={({ isActive }) => clsx(
                                        "flex items-center gap-3 px-4 py-2 rounded-lg text-[13px] transition-all duration-200 border-l-2 ml-4",
                                        isActive
                                            ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300 font-medium"
                                            : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60"
                                    )}
                                >
                                    {/* <child.icon className="w-4 h-4" /> Optional: Hide child icons for cleaner look if preferred */}
                                    <span>{child.name}</span>
                                </NavLink>
                            ))}
                        </div>
                    )}
                </div>
            );
        }

        // Standard Link
        return (
            <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) => clsx(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                    isActive
                        ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 font-semibold shadow-sm ring-1 ring-emerald-200/70 dark:ring-emerald-900/30"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white"
                )}
            >
                <link.icon className="w-5 h-5" />
                <span className="text-sm">{link.name}</span>
            </NavLink>
        );
    };

    return (
        <aside className="w-72 bg-white/95 dark:bg-slate-900/95 border-r border-slate-200/70 dark:border-slate-700/70 h-screen sticky top-0 flex flex-col transition-colors duration-300 backdrop-blur-xl">
            <div className="p-6 border-b border-slate-200/80 dark:border-slate-700/80">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 shadow-lg shadow-emerald-600/25">
                        <Receipt className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-base font-bold text-slate-900 dark:text-white">IMS</h1>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Inventory Operations</span>
                    </div>
                </div>
            </div>

            <nav className="flex-1 px-4 py-5 space-y-1.5 overflow-y-auto">
                {filteredLinks.map(link => renderLink(link))}
            </nav>

            <div className="p-4 border-t border-slate-200/80 dark:border-slate-700/80">
                <div className="mb-3 px-3 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-sm font-bold text-slate-700 dark:text-slate-300">
                        {user?.name?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{user?.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{user?.role?.replace('_', ' ')}</p>
                    </div>
                </div>
                <button
                    onClick={logout}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-rose-600 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all"
                >
                    <LogOut className="w-5 h-5" />
                    <span className="font-semibold">Logout</span>
                </button>
            </div>
        </aside>
    );
}
