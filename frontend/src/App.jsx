import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import Users from './pages/Users';
import Categories from './pages/Categories';
import Profile from './pages/Profile';
import Items from './pages/inventory/Items';
import Customers from './pages/sales/Customers';
import SalesOrders from './pages/sales/SalesOrders';
import Invoices from './pages/sales/Invoices';
import SalesReturns from './pages/sales/SalesReturns';
import InventoryReport from './pages/reports/InventoryReport';
import SalesReport from './pages/reports/SalesReport';
import PurchaseReport from './pages/reports/PurchaseReport';
import SupplyRequests from './pages/SupplyRequests';
import SupplierOrders from './pages/supplier/SupplierOrders';
import SupplierOrderDetails from './pages/supplier/SupplierOrderDetails';
import SupplierProfile from './pages/supplier/SupplierProfile';
import AuditLog from './pages/AuditLog';
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
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
