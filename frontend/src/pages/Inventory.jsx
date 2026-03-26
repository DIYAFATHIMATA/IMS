import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, AlertTriangle } from 'lucide-react';
import Table from '../components/Table';
import Modal from '../components/Modal';
import { inventoryApi, resourceApi } from '../services/api';
import { authStorage } from '../services/authStorage';
import NotificationAlert from '../components/ui/NotificationAlert';
import { FormField, FormInput, FormSelect } from '../components/ui/FormField';
import ProductThumbnail from '../components/ui/ProductThumbnail';

export default function Inventory() {
    const navigate = useNavigate();
    const location = useLocation();
    const [products, setProducts] = useState([]);
    const [stockHistory, setStockHistory] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [notice, setNotice] = useState(null);
    const [activeTab, setActiveTab] = useState('all');

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        price: '',
        costPrice: '',
        stock: '',
        gst: '18',
        sku: ''
    });

    const fetchCategories = async (token) => {
        const categoriesResponse = await resourceApi.getAll('ims_categories', token);
        setCategories(categoriesResponse.data || []);
    };

    const fetchProducts = async () => {
        try {
            const token = authStorage.getToken();
            if (!token) {
                setProducts([]);
                setStockHistory([]);
                setCategories([]);
                return;
            }

            const [productsResponse, txnsResponse] = await Promise.all([
                inventoryApi.getItems(token),
                inventoryApi.getStockTransactions(token, 8)
            ]);

            setProducts(productsResponse.data || []);
            setStockHistory(txnsResponse.data || []);
            await fetchCategories(token);
        } catch (error) {
            setNotice({ type: 'error', message: error.message || 'Failed to load inventory' });
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    useEffect(() => {
        const tab = new URLSearchParams(location.search).get('tab');
        if (tab === 'low-stock' || tab === 'out-of-stock') {
            setActiveTab(tab);
            return;
        }
        setActiveTab('all');
    }, [location.search]);

    const handleOpenModal = async (product = null) => {
        try {
            const token = authStorage.getToken();
            if (token) {
                await fetchCategories(token);
            }
        } catch {
            setCategories([]);
        }

        if (product) {
            setEditingProduct(product);
            setFormData(product);
        } else {
            setEditingProduct(null);
            setFormData({
                name: '',
                category: '',
                price: '',
                costPrice: '',
                stock: '',
                gst: '18',
                sku: `PROD-${Date.now().toString().slice(-6)}` // Auto-gen SKU
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingProduct(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const name = formData.name.trim();
        const category = formData.category.trim();
        const price = Number(formData.price);
        const costPrice = Number(formData.costPrice);
        const gst = Number(formData.gst);

        if (name.length < 2) return alert('Product name must be at least 2 characters');
        if (!category) return alert('Please select a category');
        if (!Number.isFinite(price) || price <= 0) return alert('Selling price must be greater than 0');
        if (!Number.isFinite(costPrice) || costPrice < 0) return alert('Cost price cannot be negative');
        if (![0, 5, 12, 18, 28].includes(gst)) return alert('GST must be one of 0, 5, 12, 18, 28');

        const payload = {
            name,
            category,
            price,
            costPrice,
            gst,
            sku: formData.sku
        };

        try {
            const token = authStorage.getToken();
            if (!token) {
                setNotice({ type: 'error', message: 'Authentication required. Please login again.' });
                return;
            }

            if (editingProduct?._id) {
                await inventoryApi.updateItem(editingProduct._id, payload, token);
            } else {
                await inventoryApi.createItem(payload, token);
            }

            await fetchProducts();
            handleCloseModal();
            setNotice({ type: 'success', message: editingProduct ? 'Product updated.' : 'Product added.' });
        } catch (error) {
            setNotice({ type: 'error', message: error.message || 'Failed to save product' });
        }
    };

    const handleDelete = async (id) => {
        if (confirm('Are you sure you want to delete this product?')) {
            try {
                const token = authStorage.getToken();
                if (!token) {
                    setNotice({ type: 'error', message: 'Authentication required. Please login again.' });
                    return;
                }
                await inventoryApi.removeItem(id, token);
                await fetchProducts();
                setNotice({ type: 'success', message: 'Product deleted.' });
            } catch (error) {
                setNotice({ type: 'error', message: error.message || 'Failed to delete product' });
            }
        }
    };

    const tabbedProducts = useMemo(() => {
        if (activeTab === 'low-stock') {
            return products.filter((item) => Number(item.stock) > 0 && Number(item.stock) < 10);
        }
        if (activeTab === 'out-of-stock') {
            return products.filter((item) => Number(item.stock) === 0);
        }
        return products;
    }, [activeTab, products]);

    const columns = [
        {
            header: 'Product Name', accessor: 'name', render: (row) => (
                <div className="flex items-center gap-3 min-w-0">
                    <ProductThumbnail
                        name={row.name}
                        category={row.category}
                        imageUrl={row.imageUrl || row.image || row.thumbnail}
                        className="h-10 w-10 shrink-0"
                    />
                    <div className="min-w-0">
                        <div className="font-medium text-gray-900 dark:text-white truncate">{row.name}</div>
                        <div className="text-xs text-gray-400 truncate">SKU: {row.sku}</div>
                    </div>
                </div>
            )
        },
        {
            header: 'Category', accessor: 'category', render: (row) => (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                    {row.category}
                </span>
            )
        },
        { header: 'Price', accessor: 'price', render: (row) => `₹${row.price}` },
        {
            header: 'Stock', accessor: 'stock', render: (row) => (
                <div className={row.stock < 10 ? "text-red-500 font-bold flex items-center gap-1" : "text-gray-700 dark:text-gray-300"}>
                    {row.stock < 10 && <AlertTriangle className="w-4 h-4" />}
                    {row.stock}
                </div>
            )
        },
        { header: 'GST', accessor: 'gst', render: (row) => `${row.gst}%` },
    ];

    const categoryOptions = [...new Set((categories || []).map((category) => category.name).filter(Boolean))];
    const totalStockUnits = products.reduce((sum, item) => sum + Number(item.stock || 0), 0);
    const lowStockCount = products.filter((item) => Number(item.stock) < 10).length;
    const outOfStockCount = products.filter((item) => Number(item.stock) === 0).length;
    const lowStockOnlyCount = products.filter((item) => Number(item.stock) > 0 && Number(item.stock) < 10).length;

    const tabs = [
        { key: 'all', label: 'All Items', count: products.length },
        { key: 'low-stock', label: 'Low Stock', count: lowStockOnlyCount },
        { key: 'out-of-stock', label: 'Out of Stock', count: outOfStockCount }
    ];

    const handleTabChange = (key) => {
        const nextSearch = key === 'all' ? '' : `?tab=${key}`;
        navigate({ pathname: '/inventory/items', search: nextSearch }, { replace: true });
    };

    return (
        <div className="space-y-6">
            {notice ? (
                <div>
                    <NotificationAlert type={notice.type} message={notice.message} onClose={() => setNotice(null)} />
                </div>
            ) : null}

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Inventory</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Manage products, stock levels, and pricing from one place</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="air-btn-primary"
                >
                    <Plus className="w-4 h-4" />
                    Add Product
                </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="air-surface p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Products</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{products.length}</p>
                </div>
                <div className="air-surface p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Categories</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{categoryOptions.length}</p>
                </div>
                <div className="air-surface p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Stock Units</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{totalStockUnits}</p>
                </div>
                <div className="air-surface p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Low Stock</p>
                    <p className="mt-1 text-2xl font-bold text-amber-600">{lowStockCount}</p>
                </div>
            </div>

            <div className="air-surface p-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.key;
                        return (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => handleTabChange(tab.key)}
                                className={`flex items-center justify-between gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                                    isActive
                                        ? 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-900/40'
                                        : 'bg-transparent text-slate-600 hover:bg-stone-50 dark:text-slate-300 dark:hover:bg-slate-800/70'
                                }`}
                            >
                                <span>{tab.label}</span>
                                <span className={`inline-flex min-w-[1.5rem] justify-center rounded-full px-2 py-0.5 text-xs ${
                                    isActive
                                        ? 'bg-white/80 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                                }`}>
                                    {tab.count}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div key={activeTab} className="route-panel">
                <Table
                    columns={columns}
                    data={tabbedProducts}
                    searchPlaceholder="Search product name, category, SKU..."
                    filters={[
                        {
                            key: 'category',
                            label: 'Category',
                            options: categoryOptions.map((name) => ({ label: name, value: name }))
                        }
                    ]}
                    actions={(row) => (
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => handleOpenModal(row)}
                                className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                            >
                                <Edit className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => handleDelete(row._id)}
                                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                />
            </div>

            <div className="air-surface p-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Recent Stock Transactions</h2>
                {stockHistory.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400">No stock transactions yet.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {stockHistory.map((txn) => (
                            <div key={txn._id} className="air-subtle p-3 text-sm">
                                <div className="flex items-center justify-between">
                                    <p className="font-semibold text-slate-800 dark:text-slate-100">{txn.productName}</p>
                                    <span className={txn.type === 'IN' ? 'text-emerald-600 font-semibold' : 'text-rose-600 font-semibold'}>
                                        {txn.type === 'IN' ? '+' : '-'}{txn.quantity}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{new Date(txn.timestamp).toLocaleString()} • {txn.reference}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editingProduct ? 'Edit Product' : 'Add Product'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <FormField label="Product Name" required>
                        <FormInput
                            required
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g. Wireless Mouse"
                        />
                    </FormField>
                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="Category" required>
                            <FormSelect
                                required
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            >
                                <option value="">Select Category</option>
                                {categoryOptions.map((categoryName) => (
                                    <option key={categoryName} value={categoryName}>
                                        {categoryName}
                                    </option>
                                ))}
                            </FormSelect>
                        </FormField>
                        <FormField label="SKU">
                            <FormInput
                                readOnly
                                type="text"
                                value={formData.sku}
                                className="bg-gray-100 dark:bg-gray-600 text-gray-500 cursor-not-allowed"
                            />
                        </FormField>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="Selling Price" required>
                            <FormInput
                                required
                                type="number"
                                min="0"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            />
                        </FormField>
                        <FormField label="Cost Price" required>
                            <FormInput
                                required
                                type="number"
                                min="0"
                                value={formData.costPrice}
                                onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                            />
                        </FormField>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="Stock Quantity" hint="Stock can only be added through Purchase records.">
                            <div className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-600 text-gray-600 dark:text-gray-300 text-sm">
                                {formData.stock ?? 0} units
                            </div>
                        </FormField>
                        <FormField label="GST %" required>
                            <FormSelect
                                required
                                value={formData.gst}
                                onChange={(e) => setFormData({ ...formData, gst: e.target.value })}
                            >
                                <option value="0">0%</option>
                                <option value="5">5%</option>
                                <option value="12">12%</option>
                                <option value="18">18%</option>
                                <option value="28">28%</option>
                            </FormSelect>
                        </FormField>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={handleCloseModal}
                            className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="air-btn-primary"
                        >
                            Update Product
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
