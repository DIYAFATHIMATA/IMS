import { useEffect, useState } from 'react';
import { UserCircle, Plus, Edit, Trash2, History, X } from 'lucide-react';
import Table from '../../components/Table';
import Modal from '../../components/Modal';
import { authStorage } from '../../services/authStorage';
import { customersApi } from '../../services/api';
import NotificationAlert from '../../components/ui/NotificationAlert';
import { FormField, FormInput } from '../../components/ui/FormField';

export default function Customers() {
    const [customers, setCustomers] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', address: '' });
    const [historyCustomer, setHistoryCustomer] = useState(null);
    const [historyData, setHistoryData] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [notice, setNotice] = useState(null);

    const handleViewHistory = async (customer) => {
        setHistoryCustomer(customer);
        setHistoryData([]);
        setHistoryLoading(true);
        try {
            const token = authStorage.getToken();
            const response = await customersApi.getHistory(customer._id, token);
            setHistoryData(response.data || []);
        } catch (error) {
            setNotice({ type: 'error', message: error.message || 'Failed to load history' });
        } finally {
            setHistoryLoading(false);
        }
    };

    const fetchCustomers = async () => {
        try {
            const token = authStorage.getToken();
            if (!token) {
                setCustomers([]);
                return;
            }

            const response = await customersApi.getAll(token);
            setCustomers(response.data || []);
        } catch (error) {
            setNotice({ type: 'error', message: error.message || 'Failed to load customers' });
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    const handleOpenModal = (customer = null) => {
        if (customer) {
            setEditingCustomer(customer);
            setFormData({
                name: customer.name || '',
                email: customer.email || '',
                phone: customer.phone || '',
                address: customer.address || ''
            });
        } else {
            setEditingCustomer(null);
            setFormData({ name: '', email: '', phone: '', address: '' });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const name = formData.name.trim();
        const email = formData.email.trim();
        const phone = formData.phone.trim();
        const address = formData.address.trim();

        if (name.length < 2) {
            alert('Customer name must be at least 2 characters');
            return;
        }

        try {
            const token = authStorage.getToken();
            if (!token) {
                setNotice({ type: 'error', message: 'Authentication required. Please login again.' });
                return;
            }

            const payload = { name, email, phone, address };

            if (editingCustomer?._id) {
                await customersApi.update(editingCustomer._id, payload, token);
            } else {
                await customersApi.create(payload, token);
            }

            await fetchCustomers();
            setIsModalOpen(false);
            setNotice({ type: 'success', message: editingCustomer ? 'Customer updated.' : 'Customer created.' });
        } catch (error) {
            setNotice({ type: 'error', message: error.message || 'Failed to save customer' });
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this customer?')) {
            return;
        }

        try {
            const token = authStorage.getToken();
            if (!token) {
                setNotice({ type: 'error', message: 'Authentication required. Please login again.' });
                return;
            }

            await customersApi.remove(id, token);
            await fetchCustomers();
            setNotice({ type: 'success', message: 'Customer removed.' });
        } catch (error) {
            setNotice({ type: 'error', message: error.message || 'Failed to delete customer' });
        }
    };

    const withEmailCount = customers.filter((customer) => Boolean(customer.email)).length;

    const columns = [
        {
            header: 'Customer',
            accessor: 'name',
            render: (row) => {
                const label = row.name || 'Unknown';
                const initial = label.charAt(0).toUpperCase();
                return (
                    <div className="flex items-center gap-2.5 min-w-0">
                        <span className="h-7 w-7 rounded-full bg-emerald-100 text-emerald-700 inline-flex items-center justify-center text-[11px] font-semibold shrink-0">
                            {initial}
                        </span>
                        <span className="font-medium text-slate-800 dark:text-slate-200 truncate">{label}</span>
                    </div>
                );
            }
        },
        { header: 'Email', accessor: 'email', render: (row) => row.email || '-' },
        { header: 'Phone', accessor: 'phone', render: (row) => row.phone || '-' },
        {
            header: 'Purchase History',
            accessor: '_id',
            render: (row) => (
                <button
                    onClick={() => handleViewHistory(row)}
                    className="inline-flex items-center gap-1.5 text-[12px] px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300 font-medium transition-colors"
                >
                    <History className="w-4 h-4" />
                    View History
                </button>
            )
        }
    ];

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-5">
            {notice ? (
                <div className="mb-6">
                    <NotificationAlert type={notice.type} message={notice.message} onClose={() => setNotice(null)} />
                </div>
            ) : null}

            <div className="air-surface p-5 md:p-6 shadow-sm border border-slate-200/80 dark:border-slate-700/80">
                <div className="flex justify-between items-start gap-4 flex-wrap">
                    <div>
                        <h1 className="text-[22px] font-bold text-zinc-900 dark:text-white flex items-center gap-2.5">
                            <UserCircle className="w-5 h-5 text-emerald-600" />
                        Customers
                        </h1>
                        <p className="text-sm text-zinc-500 mt-1">Customer records, contact info, and purchase history</p>
                    </div>
                    <button onClick={() => handleOpenModal()} className="air-btn-primary">
                        <Plus className="w-4 h-4" />
                        New Customer
                    </button>
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-md">
                    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/60 px-3.5 py-2">
                        <p className="text-[10px] uppercase tracking-[0.08em] text-slate-500">Total Customers</p>
                        <p className="text-[13px] font-semibold text-slate-900 dark:text-white">{customers.length}</p>
                    </div>
                    <div className="rounded-xl border border-blue-200/80 dark:border-blue-700/40 bg-blue-50/70 dark:bg-blue-900/10 px-3.5 py-2">
                        <p className="text-[10px] uppercase tracking-[0.08em] text-blue-600 dark:text-blue-300">With Email</p>
                        <p className="text-[13px] font-semibold text-blue-800 dark:text-blue-200">{withEmailCount}</p>
                    </div>
                </div>
            </div>

            <Table
                columns={columns}
                data={customers}
                searchPlaceholder="Search customers by name, email, phone, or address..."
                actions={(row) => (
                    <div className="flex gap-1.5 justify-end">
                        <button onClick={() => handleOpenModal(row)} className="p-2 text-zinc-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-700/20 rounded-lg transition-colors">
                            <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(row._id)} className="p-2 text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                )}
            />

            {historyCustomer && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-[1px]">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col border border-zinc-200/80 dark:border-gray-700/70">
                        <div className="flex items-center justify-between p-5 border-b border-zinc-200 dark:border-gray-700">
                            <div>
                                <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">{historyCustomer.name}'s Purchase History</h2>
                                <p className="text-sm text-zinc-500">{historyData.length} order{historyData.length !== 1 ? 's' : ''} found</p>
                            </div>
                            <button onClick={() => setHistoryCustomer(null)} className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-gray-700 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="overflow-y-auto flex-1 p-5 space-y-3">
                            {historyLoading ? (
                                <p className="text-center text-zinc-500 py-8">Loading...</p>
                            ) : historyData.length === 0 ? (
                                <p className="text-center text-zinc-500 py-8">No purchase history found for this customer.</p>
                            ) : (
                                historyData.map((invoice) => (
                                    <div key={invoice._id || invoice.invoiceId} className="border border-zinc-200 dark:border-gray-700 rounded-xl p-4 bg-zinc-50/60 dark:bg-gray-800/50 shadow-sm">
                                        <div className="flex justify-between items-start mb-2.5">
                                            <div>
                                                <span className="text-[13px] font-semibold text-zinc-800 dark:text-white">{invoice.invoiceId}</span>
                                                <span className="ml-3 text-[11px] text-zinc-500">{new Date(invoice.date).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${invoice.status === 'Paid' ? 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700/50' : 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700/50'}`}>
                                                    {invoice.status || 'Pending'}
                                                </span>
                                                <span className="text-[13px] font-bold text-emerald-600">Rs {Number(invoice.total || 0).toFixed(2)}</span>
                                            </div>
                                        </div>
                                        <table className="w-full text-[13px]">
                                            <thead>
                                                <tr className="text-left text-[11px] uppercase tracking-[0.08em] text-zinc-400 border-b border-zinc-100 dark:border-gray-700">
                                                    <th className="pb-1">Product</th>
                                                    <th className="pb-1 text-right">Qty</th>
                                                    <th className="pb-1 text-right">Price</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(invoice.items || []).map((item, idx) => (
                                                    <tr key={idx} className="border-b border-zinc-50 dark:border-gray-700/50">
                                                        <td className="py-1.5 text-zinc-700 dark:text-gray-300">{item.name}</td>
                                                        <td className="py-1 text-right text-zinc-600 dark:text-gray-400">{item.quantity}</td>
                                                        <td className="py-1 text-right text-zinc-600 dark:text-gray-400">₹{Number(item.price || 0).toFixed(2)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCustomer ? 'Edit Customer' : 'New Customer'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <FormField label="Customer Name" required>
                        <FormInput required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                    </FormField>
                    <FormField label="Email">
                        <FormInput type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                    </FormField>
                    <FormField label="Phone">
                        <FormInput type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                    </FormField>
                    <FormField label="Billing Address">
                        <FormInput value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
                    </FormField>

                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-zinc-700 dark:text-gray-300 hover:bg-zinc-100 dark:hover:bg-gray-700 rounded-lg transition-colors">Cancel</button>
                        <button type="submit" className="air-btn-primary">Save Customer</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
