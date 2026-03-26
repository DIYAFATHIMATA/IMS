import { useState, useEffect } from 'react';
import { FileText, Search, Trash2, CheckCircle } from 'lucide-react';
import { billsApi } from '../../services/api';
import { authStorage } from '../../services/authStorage';

export default function Bills() {
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const token = authStorage.getToken();

    const fetchAll = async () => {
        try {
            const res = await billsApi.getAll(token);
            setBills(res.data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAll(); }, []);

    const handleMarkPaid = async (bill) => {
        if (bill.status === 'Paid') return;
        if (!confirm(`Mark ${bill.billId} as Paid?`)) return;
        try {
            await billsApi.update(bill._id, { status: 'Paid' }, token);
            await fetchAll();
        } catch (e) {
            alert(e.message || 'Failed to update bill');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this bill?')) return;
        try {
            await billsApi.remove(id, token);
            await fetchAll();
        } catch (e) {
            alert(e.message || 'Failed to delete bill');
        }
    };

    const filtered = bills.filter(b =>
        Object.values(b).some(v => String(v).toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const totalOpen = bills.filter(b => b.status === 'Open').reduce((sum, b) => sum + Number(b.amount || 0), 0);
    const totalPaid = bills.filter(b => b.status === 'Paid').reduce((sum, b) => sum + Number(b.amount || 0), 0);

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                        <FileText className="w-6 h-6 text-airbnb-600" />
                        Bills
                    </h1>
                    <p className="text-zinc-500 mt-1">Bills are automatically generated when a purchase is recorded</p>
                </div>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-zinc-200 dark:border-gray-700 p-4">
                    <p className="text-sm text-zinc-500">Total Outstanding</p>
                    <p className="text-2xl font-bold text-amber-600 mt-1">₹{totalOpen.toFixed(2)}</p>
                    <p className="text-xs text-zinc-400 mt-1">{bills.filter(b => b.status === 'Open').length} open bills</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-zinc-200 dark:border-gray-700 p-4">
                    <p className="text-sm text-zinc-500">Total Paid</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">₹{totalPaid.toFixed(2)}</p>
                    <p className="text-xs text-zinc-400 mt-1">{bills.filter(b => b.status === 'Paid').length} paid bills</p>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-zinc-200 dark:border-gray-700 mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                        type="text"
                        placeholder="Search bills..."
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
                    <div className="p-12 text-center">
                        <FileText className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
                        <p className="text-zinc-500 font-medium">No bills yet</p>
                        <p className="text-zinc-400 text-sm mt-1">Bills appear automatically when you record a purchase.</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-zinc-50 dark:bg-gray-700/50 border-b border-zinc-200 dark:border-gray-700">
                            <tr>
                                {['Bill #', 'Supplier', 'Product', 'Qty', 'Amount', 'Due Date', 'Status', ''].map(h => (
                                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-gray-700">
                            {filtered.map(bill => (
                                <tr key={bill._id} className="hover:bg-zinc-50 dark:hover:bg-gray-700/30 transition-colors">
                                    <td className="px-4 py-3 text-sm font-medium text-zinc-900 dark:text-white">{bill.billId}</td>
                                    <td className="px-4 py-3 text-sm text-zinc-600 dark:text-gray-400">{bill.supplier}</td>
                                    <td className="px-4 py-3 text-sm text-zinc-600 dark:text-gray-400">{bill.productName || '—'}</td>
                                    <td className="px-4 py-3 text-sm text-zinc-600 dark:text-gray-400">{bill.quantity || '—'}</td>
                                    <td className="px-4 py-3 text-sm font-medium text-zinc-800 dark:text-gray-200">₹{Number(bill.amount || 0).toFixed(2)}</td>
                                    <td className="px-4 py-3 text-sm text-zinc-600 dark:text-gray-400">
                                        {bill.dueDate ? new Date(bill.dueDate).toLocaleDateString('en-IN') : '—'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${bill.status === 'Paid' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                                            {bill.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1">
                                            {bill.status !== 'Paid' && (
                                                <button
                                                    onClick={() => handleMarkPaid(bill)}
                                                    title="Mark as Paid"
                                                    className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                </button>
                                            )}
                                            <button onClick={() => handleDelete(bill._id)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

