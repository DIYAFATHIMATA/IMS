import { ADMIN_ROLE, MANAGER_ROLE, STAFF_ROLE, ROLE_OPTIONS, hasAdminAccess, normalizeRole } from '../utils/roles';

const STORAGE_KEYS = {
    USERS: 'ims_users',
    PRODUCTS: 'ims_products',
    SALES: 'ims_sales',
    PURCHASES: 'ims_purchases',
    SUPPLIERS: 'ims_suppliers',
    CURRENT_USER: 'ims_current_user',
    AUTH_TOKEN: 'ims_auth_token',
    AUDIT: 'ims_audit',
    STOCK_TXNS: 'ims_stock_transactions'
};

// Initial Data Seeding
// Initial Data Seeding
const seedData = () => {
    // 1. Users
    let users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    let updated = false;

    users = users.map((user) => {
        const normalizedRole = normalizeRole(user.role);
        const { companyId, ...rest } = user;
        if (normalizedRole !== user.role || companyId !== undefined) {
            updated = true;
            return { ...rest, role: normalizedRole };
        }
        return user;
    });

    const defaultUsers = [
        { id: 1, name: 'System Admin', email: 'admin@demo.com', password: 'admin', role: ADMIN_ROLE },
        { id: 2, name: 'Operations Manager', email: 'manager@demo.com', password: 'manager', role: MANAGER_ROLE },
        { id: 3, name: 'Store Staff', email: 'staff@demo.com', password: 'staff', role: STAFF_ROLE },
    ];

    defaultUsers.forEach(defUser => {
        const existingIndex = users.findIndex(u => u.email === defUser.email);
        if (existingIndex === -1) {
            users.push(defUser);
            updated = true;
            return;
        }

        const mergedUser = {
            ...users[existingIndex],
            name: defUser.name,
            password: defUser.password,
            role: defUser.role
        };

        if (
            users[existingIndex].name !== mergedUser.name ||
            users[existingIndex].password !== mergedUser.password ||
            users[existingIndex].role !== mergedUser.role
        ) {
            users[existingIndex] = mergedUser;
            updated = true;
        }
    });

    if (updated) {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    }

    // 2. Generic Mock Data Seeder
    const mockData = {
        [STORAGE_KEYS.PRODUCTS]: [
            { id: 101, name: 'Wireless Ergonomic Mouse', category: 'Electronics', price: 1299, costPrice: 800, stock: 45, gst: 18, sku: 'PROD-00101' },
            { id: 102, name: 'Mechanical Keyboard RGB', category: 'Electronics', price: 4500, costPrice: 3200, stock: 12, gst: 18, sku: 'PROD-00102' },
            { id: 103, name: 'Office Chair - Mesh', category: 'Furniture', price: 8999, costPrice: 6000, stock: 5, gst: 18, sku: 'PROD-00103' },
            { id: 104, name: 'USB-C Hub Multiport', category: 'Electronics', price: 2499, costPrice: 1500, stock: 30, gst: 18, sku: 'PROD-00104' },
            { id: 105, name: 'A4 Paper Ream (500 Sheets)', category: 'Stationery', price: 250, costPrice: 180, stock: 100, gst: 12, sku: 'PROD-00105' },
            { id: 106, name: '27-inch 4K Monitor', category: 'Electronics', price: 28000, costPrice: 22000, stock: 8, gst: 18, sku: 'PROD-00106' },
            { id: 107, name: 'HDMI Cable 2m', category: 'Electronics', price: 450, costPrice: 200, stock: 50, gst: 18, sku: 'PROD-00107' },
            { id: 108, name: 'Desk Organizer Set', category: 'Stationery', price: 899, costPrice: 500, stock: 25, gst: 12, sku: 'PROD-00108' }
        ],
        [STORAGE_KEYS.SUPPLIERS]: [
            { id: 201, name: 'TechDistro India Pvt Ltd', email: 'orders@techdistro.in', phone: '9876543210', address: 'Mumbai, MH' },
            { id: 202, name: 'Office Essentials Corp', email: 'sales@officeessentials.com', phone: '9988776655', address: 'Delhi, DL' },
            { id: 203, name: 'Global Logistix', email: 'support@globallogistix.com', phone: '8877665544', address: 'Chennai, TN' },
            { id: 204, name: 'FastTrack Couriers', email: 'dispatch@fasttrack.in', phone: '7766554433', address: 'Hyderabad, TS' }
        ],
        'ims_adjustments': [
            { id: 301, reference: 'ADJ-001', reason: 'Stock Take Discrepancy', type: 'Quantity', description: 'Found 2 extra mice during audit', status: 'Adjusted' },
            { id: 302, reference: 'ADJ-002', reason: 'Damaged Goods', type: 'Value', description: 'Water damage on Box 4', status: 'Adjusted' },
            { id: 303, reference: 'ADJ-003', reason: 'Expired Stock', type: 'Quantity', description: 'Removed expired sanitizer batches', status: 'Adjusted' },
            { id: 304, reference: 'ADJ-004', reason: 'Data Entry Error', type: 'Value', description: 'Corrected cost price for Keyboard', status: 'Adjusted' }
        ],
        'ims_customers': [
            { id: 601, name: 'Acme Corp', email: 'contact@acme.com', phone: '022-1234567', address: 'Business Bay, Pune' },
            { id: 602, name: 'Rahul Sharma', email: 'rahul.s@gmail.com', phone: '9876500001', address: 'Indiranagar, Bangalore' },
            { id: 603, name: 'Tech Solutions Ltd', email: 'procurement@techsol.com', phone: '080-4567890', address: 'Cyber City, Gurgaon' },
            { id: 604, name: 'Priya Singh', email: 'priya.singh@design.studio', phone: '9900112233', address: 'Bandra, Mumbai' }
        ],
        'ims_sales': [ // Invoices
            { id: 701, invoiceId: 'INV-2023-001', customerName: 'Acme Corp', total: 15450, date: '2023-10-20', status: 'Paid', items: [] },
            { id: 702, invoiceId: 'INV-2023-002', customerName: 'Rahul Sharma', total: 2499, date: '2023-10-22', status: 'Paid', items: [] },
            { id: 703, invoiceId: 'INV-2023-003', customerName: 'Tech Solutions Ltd', total: 125000, date: '2023-10-25', status: 'Paid', items: [] },
            { id: 704, invoiceId: 'INV-2023-004', customerName: 'Priya Singh', total: 8999, date: '2023-10-26', status: 'Paid', items: [] }
        ],
        'ims_returns': [
            { id: 901, returnId: 'RET-001', customer: 'Rahul Sharma', reason: 'Defective loading port', status: 'Received' },
            { id: 902, returnId: 'RET-002', customer: 'Acme Corp', reason: 'Wrong Color Shipped', status: 'Pending' }
        ],
        'ims_purchases': [
            { id: 1701, date: '2023-10-10', supplierId: 201, items: [{ id: 101, name: 'Wireless Ergonomic Mouse', quantity: 50, costPrice: 800 }] },
            { id: 1702, date: '2023-10-15', supplierId: 202, items: [{ id: 105, name: 'A4 Paper Ream', quantity: 200, costPrice: 180 }] },
            { id: 1703, date: '2023-10-25', supplierId: 201, items: [{ id: 104, name: 'USB-C Hub Multiport', quantity: 20, costPrice: 1500 }] }
        ],
    };

    // Seed Mock Data if empty
    Object.entries(mockData).forEach(([key, data]) => {
        if (!localStorage.getItem(key)) {
            localStorage.setItem(key, JSON.stringify(data));
        }
    });

    if (!localStorage.getItem(STORAGE_KEYS.STOCK_TXNS)) {
        localStorage.setItem(STORAGE_KEYS.STOCK_TXNS, JSON.stringify([]));
    }
};

const generateToken = (user) => {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({ sub: user.id, role: normalizeRole(user.role), email: user.email, iat: Date.now() }));
    const signature = btoa(`${user.id}.${user.email}`).slice(0, 16);
    return `${header}.${payload}.${signature}`;
};

const calculateLineTotals = (items, priceKey) => {
    return items.reduce((acc, item) => {
        const quantity = Number(item.quantity) || 0;
        const unitPrice = Number(item[priceKey]) || 0;
        const gstRate = Number(item.gst) || 0;
        const taxable = quantity * unitPrice;
        const tax = (taxable * gstRate) / 100;
        return {
            subtotal: acc.subtotal + taxable,
            tax: acc.tax + tax,
            total: acc.total + taxable + tax
        };
    }, { subtotal: 0, tax: 0, total: 0 });
};

// Auto-run seed on module load to ensure data is present
seedData();

export const storage = {
    // Generic Helpers
    get: (key) => JSON.parse(localStorage.getItem(key) || '[]'),
    set: (key, data) => localStorage.setItem(key, JSON.stringify(data)),

    // Audit
    getAuditLogs: () => JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT) || '[]'),
    logActivity: (action, details, user) => {
        const logs = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT) || '[]');
        logs.unshift({
            id: Date.now(),
            timestamp: new Date().toISOString(),
            action,
            details,
            user: user || 'System'
        });
        if (logs.length > 100) logs.pop();
        localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(logs));
    },

    // User Auth
    login: (email, password) => {
        seedData();
        const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
        const user = users.find(u => u.email === email && u.password === password);
        if (user) {
            const normalizedUser = { ...user, role: normalizeRole(user.role) };
            const token = generateToken(normalizedUser);
            localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(normalizedUser));
            localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
            return { success: true, user: normalizedUser };
        }
        return { success: false, message: 'Invalid credentials' };
    },

    register: (userData) => {
        seedData();
        const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
        if (users.find(u => u.email === userData.email)) {
            return { success: false, message: 'User already exists' };
        }

        // NEW REGISTRATION: Always creates an Admin
        const newUser = {
            ...userData,
            id: Date.now(),
            role: ROLE_OPTIONS.includes(userData.role) ? userData.role : ADMIN_ROLE
        };
        users.push(newUser);
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        storage.logActivity('REGISTER', `New User: ${userData.email}`);
        return { success: true, user: newUser };
    },

    logout: () => {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    },

    getCurrentUser: () => {
        const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        if (!token) return null;
        const currentUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || 'null');
        if (!currentUser) return null;
        const normalizedUser = { ...currentUser, role: normalizeRole(currentUser.role) };
        if (normalizedUser.role !== currentUser.role) {
            localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(normalizedUser));
        }
        return normalizedUser;
    },

    getAuthToken: () => localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN),

    // Users Management
    getUsers: () => {
        const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
        const currentUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER));

        if (!currentUser) return [];

        if (hasAdminAccess(currentUser)) {
            return users.map((user) => ({ ...user, role: normalizeRole(user.role) }));
        }
        return [];
    },

    saveUser: (userData) => {
        const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
        const currentUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER));
        if (!hasAdminAccess(currentUser)) {
            return { success: false, message: 'Access denied' };
        }

        const index = users.findIndex(u => u.id === userData.id);
        const nextRole = ROLE_OPTIONS.includes(userData.role) ? userData.role : STAFF_ROLE;

        if (index >= 0) {
            // Edit existing user
            users[index] = { ...users[index], ...userData, role: nextRole };
        } else {
            // Create New User (Add Staff)
            if (users.find(u => u.email === userData.email)) {
                return { success: false, message: 'User email exists' };
            }

            users.push({
                ...userData,
                id: Date.now(),
                role: nextRole
            });
        }
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        storage.logActivity('USER_UPDATE', `User: ${userData.email}`);
        return { success: true };
    },
    deleteUser: (id) => {
        const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
        const filtered = users.filter(u => u.id !== id);
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(filtered));
        storage.logActivity('USER_DELETE', `User ID: ${id}`);
    },

    // Products
    getProducts: () => JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS) || '[]'),
    saveProduct: (product) => {
        const products = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS) || '[]');
        const index = products.findIndex(p => p.id === product.id);
        if (index >= 0) {
            products[index] = product;
        } else {
            products.push(product);
        }
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
        storage.logActivity(product.id ? 'UPDATE_PRODUCT' : 'CREATE_PRODUCT', `Product: ${product.name}`);
        return product;
    },

    // Sales
    getSales: () => JSON.parse(localStorage.getItem(STORAGE_KEYS.SALES) || '[]'),
    saveSale: (saleData) => {
        const sales = JSON.parse(localStorage.getItem(STORAGE_KEYS.SALES) || '[]');
        const products = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS) || '[]');
        const currentUser = storage.getCurrentUser();
        const totals = calculateLineTotals(saleData.items || [], 'price');

        const newSale = {
            ...saleData,
            ...totals,
            id: Date.now(),
            date: new Date().toISOString()
        };

        // Deduct stock
        saleData.items.forEach(item => {
            const productIndex = products.findIndex(p => p.id === item.id);
            if (productIndex >= 0) {
                products[productIndex].stock -= item.quantity;
                storage.logStockTransaction({
                    type: 'OUT',
                    productId: item.id,
                    productName: item.name,
                    quantity: Number(item.quantity),
                    unitPrice: Number(item.price),
                    gstRate: Number(item.gst) || 0,
                    source: 'sales',
                    reference: newSale.invoiceId,
                    actor: currentUser?.name || 'System'
                });
            }
        });

        sales.push(newSale);
        localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
        storage.logActivity('NEW_SALE', `Invoice: ${newSale.invoiceId}, Total: ${newSale.total}`);
        return newSale;
    },

    // Suppliers
    getSuppliers: () => JSON.parse(localStorage.getItem(STORAGE_KEYS.SUPPLIERS) || '[]'),
    saveSupplier: (supplier) => {
        const suppliers = JSON.parse(localStorage.getItem(STORAGE_KEYS.SUPPLIERS) || '[]');
        const index = suppliers.findIndex(s => s.id === supplier.id);
        if (index >= 0) {
            suppliers[index] = supplier;
        } else {
            suppliers.push({ ...supplier, id: supplier.id || Date.now() });
        }
        localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(suppliers));
        return supplier;
    },

    // Purchases
    getPurchases: () => JSON.parse(localStorage.getItem(STORAGE_KEYS.PURCHASES) || '[]'),
    savePurchase: (purchaseData) => {
        const purchases = JSON.parse(localStorage.getItem(STORAGE_KEYS.PURCHASES) || '[]');
        const products = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS) || '[]');
        const currentUser = storage.getCurrentUser();
        const totals = calculateLineTotals(purchaseData.items || [], 'costPrice');

        const newPurchase = {
            ...purchaseData,
            ...totals,
            id: Date.now(),
            date: new Date().toISOString()
        };

        // Increase stock
        purchaseData.items.forEach(item => {
            const productIndex = products.findIndex(p => p.id === item.id);
            if (productIndex >= 0) {
                products[productIndex].stock = Number(products[productIndex].stock) + Number(item.quantity);
                if (item.costPrice) {
                    products[productIndex].costPrice = Number(item.costPrice);
                }
                storage.logStockTransaction({
                    type: 'IN',
                    productId: item.id,
                    productName: item.name,
                    quantity: Number(item.quantity),
                    unitPrice: Number(item.costPrice),
                    gstRate: Number(item.gst) || 0,
                    source: 'purchases',
                    reference: `PUR-${newPurchase.id}`,
                    actor: currentUser?.name || 'System'
                });
            }
        });

        purchases.push(newPurchase);
        localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(purchases));
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
        storage.logActivity('NEW_PURCHASE', `Supplier: ${purchaseData.supplierId}, Items: ${purchaseData.items.length}`);
        return newPurchase;
    },

    getStockTransactions: () => JSON.parse(localStorage.getItem(STORAGE_KEYS.STOCK_TXNS) || '[]'),
    logStockTransaction: (txn) => {
        const txns = JSON.parse(localStorage.getItem(STORAGE_KEYS.STOCK_TXNS) || '[]');
        txns.unshift({
            id: Date.now() + Math.floor(Math.random() * 1000),
            timestamp: new Date().toISOString(),
            ...txn
        });
        localStorage.setItem(STORAGE_KEYS.STOCK_TXNS, JSON.stringify(txns.slice(0, 300)));
    }
};
