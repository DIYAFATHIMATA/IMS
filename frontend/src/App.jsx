import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Loader2 } from 'lucide-react';

const AuthLayout = lazy(() => import('./layouts/AuthLayout'));
const DashboardLayout = lazy(() => import('./layouts/DashboardLayout'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Home = lazy(() => import('./pages/Home'));
const Users = lazy(() => import('./pages/Users'));
const Categories = lazy(() => import('./pages/Categories'));
const Profile = lazy(() => import('./pages/Profile'));
const Items = lazy(() => import('./pages/inventory/Items'));
const Customers = lazy(() => import('./pages/sales/Customers'));
const SalesOrders = lazy(() => import('./pages/sales/SalesOrders'));
const Invoices = lazy(() => import('./pages/sales/Invoices'));
const SalesReturns = lazy(() => import('./pages/sales/SalesReturns'));
const InventoryReport = lazy(() => import('./pages/reports/InventoryReport'));
const SalesReport = lazy(() => import('./pages/reports/SalesReport'));
const PurchaseReport = lazy(() => import('./pages/reports/PurchaseReport'));
const SupplyRequests = lazy(() => import('./pages/SupplyRequests'));
const SupplierOrders = lazy(() => import('./pages/supplier/SupplierOrders'));
const SupplierOrderDetails = lazy(() => import('./pages/supplier/SupplierOrderDetails'));
const SupplierProfile = lazy(() => import('./pages/supplier/SupplierProfile'));
const AuditLog = lazy(() => import('./pages/AuditLog'));

const PageLoader = () => (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
            <p className="text-sm font-medium text-slate-500 animate-pulse">Loading system...</p>
        </div>
    </div>
);
import { ADMIN_ROLE, STAFF_ROLE, SUPPLIER_ROLE, isAllowedRole } from './utils/roles';

// Protected Route Component
const ProtectedRoute = () => {
    const { user } = useAuth();
    if (!user) return <Navigate to="/login" replace />;
    return <Outlet />;
};

const RoleRoute = ({ allowedRoles }) => {
    const { user } = useAuth();
    if (!isAllowedRole(user, allowedRoles)) return <Navigate to="/dashboard" replace />;
    return <Outlet />;
};

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Suspense fallback={<PageLoader />}>
                    <Routes>
                        {/* Public Routes */}
                        <Route path="/" element={<Home />} />

                        <Route element={<AuthLayout />}>
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />
                        </Route>

                        {/* Protected Routes */}
                        <Route element={<ProtectedRoute />}>
                            <Route element={<DashboardLayout />}>
                                {/* Dashboard is no longer the default root, but accessible via /dashboard */}
                                <Route path="/dashboard" element={<Dashboard />} />
                                <Route path="/products" element={<Navigate to="/inventory/items" replace />} />

                                <Route element={<RoleRoute allowedRoles={[STAFF_ROLE]} />}>
                                    <Route path="/inventory/items" element={<Items />} />
                                    <Route path="/sales/orders" element={<SalesOrders />} />
                                    <Route path="/sales/invoices" element={<Invoices />} />
                                    <Route path="/sales/returns" element={<SalesReturns />} />
                                    <Route path="/sales/customers" element={<Customers />} />
                                    <Route path="/inventory/categories" element={<Categories />} />
                                </Route>

                                <Route element={<RoleRoute allowedRoles={[ADMIN_ROLE, STAFF_ROLE]} />}>
                                    <Route path="/inventory/low-stock" element={<Navigate to="/inventory/items?tab=low-stock" replace />} />
                                </Route>

                                <Route element={<RoleRoute allowedRoles={[ADMIN_ROLE, STAFF_ROLE, SUPPLIER_ROLE]} />}>
                                    <Route path="/supply-requests" element={<SupplyRequests />} />
                                </Route>

                                <Route element={<RoleRoute allowedRoles={[ADMIN_ROLE]} />}>
                                    <Route path="/reports" element={<Navigate to="/reports/inventory" replace />} />
                                    <Route path="/reports/inventory" element={<InventoryReport />} />
                                    <Route path="/reports/sales" element={<SalesReport />} />
                                    <Route path="/reports/purchases" element={<PurchaseReport />} />
                                    <Route path="/users" element={<Users />} />
                                    <Route path="/audit-log" element={<AuditLog />} />
                                </Route>

                                <Route element={<RoleRoute allowedRoles={[SUPPLIER_ROLE]} />}>
                                    <Route path="/supplier/requests" element={<Navigate to="/supply-requests" replace />} />
                                    <Route path="/supplier/orders" element={<SupplierOrders />} />
                                    <Route path="/supplier/orders/:orderId" element={<SupplierOrderDetails />} />
                                    <Route path="/supplier/profile" element={<SupplierProfile />} />
                                </Route>

                                <Route element={<RoleRoute allowedRoles={[ADMIN_ROLE, STAFF_ROLE, SUPPLIER_ROLE]} />}>
                                    <Route path="/profile" element={<Profile />} />
                                </Route>

                                {/* Catch all */}
                                <Route path="*" element={<Navigate to="/login" replace />} />
                            </Route>
                        </Route>
                    </Routes>
                </Suspense>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
