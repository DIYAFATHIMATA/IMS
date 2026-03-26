import { useState, useEffect } from 'react';
import { Plus, Printer, FileText } from 'lucide-react';
import Table from '../components/Table';
import Modal from '../components/Modal';
import { authStorage } from '../services/authStorage';
import { inventoryApi, purchasesApi, resourceApi } from '../services/api';

export default function Purchases() {
    const [products, setProducts] = useState([]);
    const [purchases, setPurchases] = useState([]);
    const [suppliers, setSuppliers] = useState([]);

    // Modals
    const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
    const [isBillModalOpen, setIsBillModalOpen] = useState(false);
    const [generatedBills, setGeneratedBills] = useState({ bills: [], purchase: null });

    // Forms
    const [purchaseForm, setPurchaseForm] = useState({ supplierId: '', items: [] });
    // Temp item for purchase
    const [tempItem, setTempItem] = useState({ productSearch: '', selectedProductId: '', isNew: false, quantity: '', costPrice: '', category: '', price: '', gst: '18' });
    const [showSuggestions, setShowSuggestions] = useState(false);

    const fetchData = async () => {
        try {
            const token = authStorage.getToken();
            if (!token) {
                setProducts([]);
                setPurchases([]);
                setSuppliers([]);
                return;
            }

            const [productsResponse, purchasesResponse, suppliersResponse] = await Promise.all([
                inventoryApi.getItems(token),
                purchasesApi.getAll(token),
                resourceApi.getAll('ims_suppliers', token)
            ]);

            setProducts(productsResponse.data || []);
            setPurchases(purchasesResponse.data || []);
            setSuppliers(suppliersResponse.data || []);
        } catch (error) {
            alert(error.message || 'Failed to load purchase data');
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const calculatePurchaseTotals = (items) => {
        return items.reduce((acc, item) => {
            const qty = Number(item.quantity) || 0;
            const cost = Number(item.costPrice) || 0;
            const gstRate = Number(item.gst) || 0;
            const taxable = qty * cost;
            const tax = (taxable * gstRate) / 100;
            return {
                subtotal: acc.subtotal + taxable,
                tax: acc.tax + tax,
                total: acc.total + taxable + tax
            };
        }, { subtotal: 0, tax: 0, total: 0 });
    };

    const filteredSuggestions = tempItem.productSearch
        ? products.filter(p => p.name.toLowerCase().includes(tempItem.productSearch.toLowerCase()))
        : [];
    const exactMatch = products.find(p => p.name.toLowerCase() === tempItem.productSearch.toLowerCase().trim());

    const addItemToPurchase = () => {
        const name = tempItem.productSearch.trim();
        if (!name || !tempItem.quantity) return;
        const quantity = Number(tempItem.quantity);
        if (!Number.isFinite(quantity) || quantity <= 0) {
            alert('Quantity must be greater than 0');
            return;
        }
        const costPrice = Number(tempItem.costPrice);
        if (isNaN(costPrice) || costPrice < 0) {
            alert('Cost price cannot be negative');
            return;
        }
        if (tempItem.isNew) {
            setPurchaseForm(prev => ({
                ...prev,
                items: [...prev.items, {
                    name,
                    isNew: true,
                    category: tempItem.category || 'General',
                    price: Number(tempItem.price) || costPrice,
                    gst: Number(tempItem.gst) || 0,
                    quantity,
                    costPrice
                }]
            }));
        } else {
            const product = products.find(p => p._id === tempItem.selectedProductId);
            if (!product) { alert('Please select a product from the list'); return; }
            setPurchaseForm(prev => ({
                ...prev,
                items: [...prev.items, { ...product, quantity, costPrice: costPrice || Number(product.costPrice) || 0, gst: Number(product.gst) || 0 }]
            }));
        }
        setTempItem({ productSearch: '', selectedProductId: '', isNew: false, quantity: '', costPrice: '', category: '', price: '', gst: '18' });
        setShowSuggestions(false);
    };

    const handleSavePurchase = async () => {
        if (purchaseForm.items.length === 0) return;
        const hasInvalid = purchaseForm.items.some((item) => !Number.isFinite(Number(item.quantity)) || Number(item.quantity) <= 0);
        if (hasInvalid) {
            alert('Please fix invalid item quantities');
            return;
        }

        try {
            const token = authStorage.getToken();
            if (!token) {
                alert('Authentication required. Please login again.');
                return;
            }

            const supplier = suppliers.find(s => s._id === purchaseForm.supplierId);
            const response = await purchasesApi.record({
                supplierId: purchaseForm.supplierId || undefined,
                supplierName: supplier ? supplier.name : undefined,
                items: purchaseForm.items.map((item) => ({
                    _id: item._id || undefined,
                    name: item.name,
                    isNew: item.isNew || false,
                    category: item.category,
                    price: item.price,
                    quantity: item.quantity,
                    costPrice: item.costPrice,
                    gst: item.gst
                }))
            }, token);

            await fetchData();
            setIsPurchaseModalOpen(false);
            setPurchaseForm({ supplierId: '', items: [] });

            // Show generated bill
            if (response.bills && response.bills.length > 0) {
                setGeneratedBills({ bills: response.bills, purchase: response.data });
                setIsBillModalOpen(true);
            }
        } catch (error) {
            alert(error.message || 'Failed to record purchase');
        }
    };

    const purchaseColumns = [
        { header: 'Date', accessor: 'date', render: row => new Date(row.date).toLocaleDateString() },
        { header: 'Supplier', accessor: 'supplierName', render: row => row.supplierName || '—' },
        { header: 'Items', accessor: 'items', render: row => row.items.length },
        { header: 'Total Qty', accessor: 'total', render: row => row.items.reduce((acc, item) => acc + item.quantity, 0) },
        { header: 'GST', accessor: 'tax', render: row => `₹${Number(row.tax || 0).toFixed(2)}` },
        { header: 'Total', accessor: 'grandTotal', render: row => `₹${Number(row.total || 0).toFixed(2)}` },
    ];

    const purchaseTotals = calculatePurchaseTotals(purchaseForm.items);

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Procurement</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Manage stock purchases</p>
                </div>
                <button
                    onClick={() => setIsPurchaseModalOpen(true)}
                    className="air-btn-primary"
                >
                    <Plus className="w-4 h-4" /> New Purchase
                </button>
            </div>

            <Table columns={purchaseColumns} data={purchases} />

            {/* Bill Preview Modal */}
            <Modal isOpen={isBillModalOpen} onClose={() => setIsBillModalOpen(false)} title="">
                <div className="space-y-5 print:text-black">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <FileText className="w-5 h-5 text-emerald-600" />
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Purchase Bill</h2>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Date: {generatedBills.purchase ? new Date(generatedBills.purchase.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : ''}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Supplier: <span className="font-medium text-gray-800 dark:text-gray-200">{generatedBills.bills[0]?.supplier || '—'}</span>
                            </p>
                        </div>
                        <div className="text-right">
                            {generatedBills.bills.map((b, i) => (
                                <p key={i} className="text-xs font-mono text-gray-500 dark:text-gray-400">{b.billId}</p>
                            ))}
                            <span className="mt-1 inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Open</span>
                        </div>
                    </div>

                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="bg-gray-100 dark:bg-gray-700">
                                <th className="text-left px-3 py-2 rounded-tl-lg">Product</th>
                                <th className="text-right px-3 py-2">Qty</th>
                                <th className="text-right px-3 py-2">Unit Cost</th>
                                <th className="text-right px-3 py-2 rounded-tr-lg">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {generatedBills.bills.map((b, i) => {
                                const unitCost = b.quantity > 0 ? b.amount / b.quantity : 0;
                                return (
                                    <tr key={i} className="border-b border-gray-100 dark:border-gray-700">
                                        <td className="px-3 py-2">{b.productName}</td>
                                        <td className="px-3 py-2 text-right">{b.quantity}</td>
                                        <td className="px-3 py-2 text-right">₹{unitCost.toFixed(2)}</td>
                                        <td className="px-3 py-2 text-right font-medium">₹{Number(b.amount).toFixed(2)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    <div className="bg-gray-50 dark:bg-gray-700/40 rounded-lg p-3 space-y-1 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                            <span>₹{Number(generatedBills.purchase?.subtotal || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">GST</span>
                            <span>₹{Number(generatedBills.purchase?.tax || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-base border-t border-gray-200 dark:border-gray-600 pt-1 mt-1">
                            <span>Total</span>
                            <span>₹{Number(generatedBills.purchase?.total || 0).toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-1">
                        <button
                            onClick={() => window.print()}
                            className="flex items-center gap-2 air-btn-primary"
                        >
                            <Printer className="w-4 h-4" /> Print Bill
                        </button>
                        <button
                            onClick={() => setIsBillModalOpen(false)}
                            className="flex-1 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Purchase Modal */}
            <Modal isOpen={isPurchaseModalOpen} onClose={() => setIsPurchaseModalOpen(false)} title="Record Purchase">
                <div className="space-y-4">
                    {/* Supplier Dropdown */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Supplier</label>
                        <select
                            value={purchaseForm.supplierId}
                            onChange={e => setPurchaseForm(prev => ({ ...prev, supplierId: e.target.value }))}
                            className="w-full air-input"
                        >
                            <option value="">Select Supplier</option>
                            {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                        </select>
                    </div>

                    <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg space-y-3">
                        <h4 className="text-sm font-semibold">Add Items</h4>
                        <div className="space-y-2">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search or type product name..."
                                    value={tempItem.productSearch}
                                    autoComplete="off"
                                    onChange={e => {
                                        const val = e.target.value;
                                        const match = products.find(p => p.name.toLowerCase() === val.toLowerCase().trim());
                                        setTempItem(prev => ({
                                            ...prev,
                                            productSearch: val,
                                            selectedProductId: match ? match._id : '',
                                            isNew: val.trim().length > 0 && !match,
                                            costPrice: match ? String(match.costPrice || '') : prev.costPrice
                                        }));
                                        setShowSuggestions(true);
                                    }}
                                    onFocus={() => setShowSuggestions(true)}
                                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                    className="w-full air-input"
                                />
                                {showSuggestions && tempItem.productSearch && (
                                    <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-44 overflow-y-auto">
                                        {filteredSuggestions.slice(0, 8).map(p => (
                                            <div
                                                key={p._id}
                                                className="px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 text-sm flex justify-between"
                                                onMouseDown={() => {
                                                    setTempItem(prev => ({
                                                        ...prev,
                                                        productSearch: p.name,
                                                        selectedProductId: p._id,
                                                        isNew: false,
                                                        costPrice: String(p.costPrice || '')
                                                    }));
                                                    setShowSuggestions(false);
                                                }}
                                            >
                                                <span>{p.name}</span>
                                                <span className="text-xs text-gray-400">Stock: {p.stock}</span>
                                            </div>
                                        ))}
                                        {!exactMatch && tempItem.productSearch.trim() && (
                                            <div
                                                className="px-3 py-2 cursor-pointer text-sm text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 border-t border-gray-100 dark:border-gray-700"
                                                onMouseDown={() => {
                                                    setTempItem(prev => ({ ...prev, isNew: true, selectedProductId: '' }));
                                                    setShowSuggestions(false);
                                                }}
                                            >
                                                + Create new product: "{tempItem.productSearch}"
                                            </div>
                                        )}
                                    </div>
                                )}
                                {tempItem.isNew && (
                                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">✦ New product will be created automatically</p>
                                )}
                            </div>
                            {tempItem.isNew && (
                                <div className="grid grid-cols-3 gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                                    <div>
                                        <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Category</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Electronics"
                                            value={tempItem.category}
                                            onChange={e => setTempItem(prev => ({ ...prev, category: e.target.value }))}
                                            className="air-input w-full text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Selling Price</label>
                                        <input
                                            type="number"
                                            placeholder="0"
                                            min="0"
                                            value={tempItem.price}
                                            onChange={e => setTempItem(prev => ({ ...prev, price: e.target.value }))}
                                            className="air-input w-full text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">GST %</label>
                                        <select
                                            value={tempItem.gst}
                                            onChange={e => setTempItem(prev => ({ ...prev, gst: e.target.value }))}
                                            className="air-input w-full text-sm"
                                        >
                                            <option value="0">0%</option>
                                            <option value="5">5%</option>
                                            <option value="12">12%</option>
                                            <option value="18">18%</option>
                                            <option value="28">28%</option>
                                        </select>
                                    </div>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-2">
                                <input
                                    type="number"
                                    placeholder="Qty"
                                    value={tempItem.quantity}
                                    onChange={e => setTempItem({ ...tempItem, quantity: e.target.value })}
                                    className="air-input"
                                />
                                <input
                                    type="number"
                                    placeholder="Cost Price"
                                    value={tempItem.costPrice}
                                    onChange={e => setTempItem({ ...tempItem, costPrice: e.target.value })}
                                    className="air-input"
                                />
                            </div>
                        </div>
                        <button onClick={addItemToPurchase} className="w-full py-1.5 bg-zinc-200 dark:bg-gray-600 text-zinc-800 dark:text-white rounded-lg text-sm hover:bg-zinc-300 dark:hover:bg-gray-500">Add to List</button>
                    </div>

                    {/* List */}
                    <div className="max-h-32 overflow-y-auto space-y-1">
                        {purchaseForm.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                                <span>{item.name}</span>
                                <span>x{item.quantity}</span>
                            </div>
                        ))}
                    </div>

                    <div className="text-sm bg-gray-50 dark:bg-gray-700/40 rounded-lg p-3 space-y-1">
                        <div className="flex justify-between"><span>Subtotal</span><span>₹{purchaseTotals.subtotal.toFixed(2)}</span></div>
                        <div className="flex justify-between"><span>GST</span><span>₹{purchaseTotals.tax.toFixed(2)}</span></div>
                        <div className="flex justify-between font-semibold"><span>Total</span><span>₹{purchaseTotals.total.toFixed(2)}</span></div>
                    </div>

                    <button
                        onClick={handleSavePurchase}
                        disabled={purchaseForm.items.length === 0}
                        className="air-btn-primary w-full disabled:opacity-50"
                    >
                        Complete Purchase
                    </button>
                </div>
            </Modal>
        </div>
    );
}
