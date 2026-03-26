import { useState, useEffect } from 'react';
import { Search, ShoppingCart, Trash2, Plus, Minus, Receipt, PackageCheck, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { inventoryApi, salesApi, customersApi } from '../services/api';
import { authStorage } from '../services/authStorage';
import ProductThumbnail from '../components/ui/ProductThumbnail';

export default function Sales() {
    const [products, setProducts] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [cart, setCart] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const token = authStorage.getToken();
                if (!token) {
                    setProducts([]);
                    return;
                }

                const [productsResponse, customersResponse] = await Promise.all([
                    inventoryApi.getItems(token),
                    customersApi.getAll(token)
                ]);
                setProducts(productsResponse.data || []);
                setCustomers(customersResponse.data || []);
            } catch (error) {
                alert(error.message || 'Failed to load products');
            }
        };

        fetchProducts();
    }, []);

    const addToCart = (product) => {
        if (product.stock <= 0) return;

        setCart(prev => {
            const existing = prev.find(item => item._id === product._id);
            if (existing) {
                if (existing.quantity >= product.stock) return prev; // Check stock limit
                return prev.map(item =>
                    item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...prev, { ...product, quantity: 1 }];
        });
    };

    const updateQuantity = (id, delta) => {
        setCart(prev => prev.map(item => {
            if (item._id === id) {
                const newQty = item.quantity + delta;
                if (newQty <= 0) return null;
                // Check stock
                const product = products.find(p => p._id === id);
                if (newQty > product.stock) return item;
                return { ...item, quantity: newQty };
            }
            return item;
        }).filter(Boolean));
    };

    const removeFromCart = (id) => {
        setCart(prev => prev.filter(item => item._id !== id));
    };

    const calculateTotals = () => {
        return cart.reduce((acc, item) => {
            const taxable = item.price * item.quantity; // Assuming price is inclusive, or exclusive? 
            // Let's assume price provided is taxable value to keep it simple, or Selling Price. 
            // If Selling Price (SP) matches requirements, usually GST is on top or included.
            // Requirement: "calculate GST totals". Let's assume Price is base price for simplicity or handle as inclusive.
            // Let's do: Price is Base Price. Tax is extra.

            // Actually usually retail is inclusive. Let's do Price = Base, and Tax is added.
            const gstAmount = (taxable * item.gst) / 100;
            return {
                subtotal: acc.subtotal + taxable,
                tax: acc.tax + gstAmount,
                total: acc.total + taxable + gstAmount
            };
        }, { subtotal: 0, tax: 0, total: 0 });
    };

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        if (!customerName.trim() || customerName.trim().length < 2) {
            alert("Please select a customer");
            return;
        }
        if (cart.some(item => !Number.isInteger(item.quantity) || item.quantity <= 0)) {
            alert("Cart has invalid item quantities");
            return;
        }
        if (cart.some(item => Number(item.quantity) > Number(products.find(p => p._id === item._id)?.stock || 0))) {
            alert("One or more items exceed available stock");
            return;
        }

        setLoading(true);

        try {
            const token = authStorage.getToken();
            if (!token) {
                alert('Authentication required. Please login again.');
                setLoading(false);
                return;
            }

            const result = await salesApi.checkout(
                {
                    customerName: customerName.trim(),
                    items: cart.map((item) => ({
                        _id: item._id,
                        name: item.name,
                        quantity: item.quantity,
                        price: item.price,
                        gst: item.gst
                    }))
                },
                token
            );

            setLoading(false);
            setCart([]);
            setCustomerName('');

            const productsResponse = await inventoryApi.getItems(token);
            setProducts(productsResponse.data || []);

            alert(`Sale successful! Invoice: ${result.data.invoiceId}`);
        } catch (error) {
            setLoading(false);
            alert(error.message || 'Checkout failed');
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) && p.stock > 0
    );

    const totals = calculateTotals();
    const lowStockCount = filteredProducts.filter((item) => Number(item.stock) <= 10).length;

    return (
        <div className="space-y-5">
            <div className="rounded-3xl border border-emerald-200/60 bg-gradient-to-r from-emerald-50 via-emerald-50 to-emerald-50 dark:from-slate-900 dark:to-slate-800 dark:border-slate-700 p-5 md:p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-[22px] font-bold text-slate-900 dark:text-white">Sales Console</h1>
                        <p className="text-[13px] text-slate-600 dark:text-slate-300 mt-1">Create invoices quickly with live stock-aware cart handling</p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full sm:w-auto">
                        <div className="air-subtle px-4 py-2">
                            <p className="text-[10px] uppercase tracking-[0.08em] text-slate-500">Products</p>
                            <p className="text-[13px] font-semibold text-slate-900 dark:text-white">{filteredProducts.length}</p>
                        </div>
                        <div className="air-subtle px-4 py-2">
                            <p className="text-[10px] uppercase tracking-[0.08em] text-slate-500">Customers</p>
                            <p className="text-[13px] font-semibold text-slate-900 dark:text-white">{customers.length}</p>
                        </div>
                        <div className="air-subtle px-4 py-2">
                            <p className="text-[10px] uppercase tracking-[0.08em] text-slate-500">Cart Items</p>
                            <p className="text-[13px] font-semibold text-slate-900 dark:text-white">{cart.length}</p>
                        </div>
                        <div className="rounded-xl border border-amber-200/70 bg-amber-50/70 px-4 py-2">
                            <p className="text-[10px] uppercase tracking-[0.08em] text-amber-700">Low Stock</p>
                            <p className="text-[13px] font-semibold text-amber-900">{lowStockCount}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col h-[calc(100vh-16rem)] lg:flex-row gap-6">
            {/* Product List */}
            <div className="flex-1 overflow-hidden flex flex-col air-surface shadow-sm border border-slate-200/80 dark:border-slate-700/80">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/40">
                    <div className="relative">
                        <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="air-input pl-10"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 content-start">
                    {filteredProducts.map(product => (
                        <div
                            key={product._id}
                            onClick={() => addToCart(product)}
                            className="group p-4 bg-slate-50 dark:bg-slate-800/70 rounded-2xl cursor-pointer hover:ring-2 hover:ring-emerald-500 transition-all duration-200 border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 shadow-sm hover:shadow-md hover:-translate-y-0.5"
                        >
                            <ProductThumbnail
                                name={product.name}
                                category={product.category}
                                imageUrl={product.imageUrl || product.image || product.thumbnail}
                                className="h-24 w-full mb-3"
                            />
                            <h3 className="text-[13px] font-semibold text-slate-900 dark:text-slate-100 truncate">{product.name}</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{product.category || 'General'}</p>
                            <div className="flex justify-between items-center mt-2">
                                <span className="text-emerald-600 dark:text-emerald-300 text-[13px] font-semibold">Rs {product.price}</span>
                                <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full border ${Number(product.stock) <= 10 ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700/40' : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-700/40'}`}>
                                    {Number(product.stock) <= 10 ? <AlertTriangle className="w-3 h-3" /> : <PackageCheck className="w-3 h-3" />}
                                    {product.stock} left
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Cart Side */}
            <div className="w-full lg:w-96 flex flex-col air-surface shadow-sm border border-slate-200/80 dark:border-slate-700/80">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-[18px] font-semibold flex items-center gap-2 text-slate-900 dark:text-white">
                        <ShoppingCart className="w-5 h-5" /> Current Sale
                    </h2>
                    <select
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="mt-4 air-input"
                    >
                        <option value="">Select Customer</option>
                        {customers.map(c => (
                            <option key={c._id} value={c.name}>{c.name}{c.phone ? ` — ${c.phone}` : ''}</option>
                        ))}
                    </select>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {cart.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                            <p>Cart is empty</p>
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item._id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow transition-shadow">
                                <div className="flex-1 min-w-0 mr-4">
                                    <h4 className="text-[13px] font-medium text-slate-900 dark:text-white truncate">{item.name}</h4>
                                    <p className="text-xs text-slate-500">Rs {item.price} x {item.quantity}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                                        <button onClick={() => updateQuantity(item._id, -1)} className="p-1.5 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-md transition-colors"><Minus className="w-4 h-4" /></button>
                                        <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item._id, 1)} className="p-1.5 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-md transition-colors"><Plus className="w-4 h-4" /></button>
                                    </div>
                                    <button onClick={() => removeFromCart(item._id)} className="p-1.5 rounded-md text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-6 bg-slate-50/80 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-700">
                    <div className="space-y-2 text-[13px] mb-4">
                        <div className="flex justify-between text-slate-600 dark:text-slate-400">
                            <span>Subtotal</span>
                            <span>Rs {totals.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-slate-600 dark:text-slate-400">
                            <span>GST (Total)</span>
                            <span>Rs {totals.tax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-base font-bold text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-700">
                            <span>Total</span>
                            <span>Rs {totals.total.toFixed(2)}</span>
                        </div>
                    </div>

                    <button
                        onClick={handleCheckout}
                        disabled={cart.length === 0 || loading}
                        className="w-full py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white rounded-xl font-semibold text-base shadow-lg shadow-emerald-600/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? 'Processing...' : (
                            <>
                                <Receipt className="w-5 h-5" /> Checkout
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
        </div>
    );
}
