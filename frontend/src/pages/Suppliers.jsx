import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Phone, Mail } from 'lucide-react';
import Table from '../components/Table';
import Modal from '../components/Modal';
import { authStorage } from '../services/authStorage';
import { resourceApi } from '../services/api';
import { FormField, FormInput, FormTextarea } from '../components/ui/FormField';
import NotificationAlert from '../components/ui/NotificationAlert';

export default function Suppliers() {
    const [suppliers, setSuppliers] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState(null);
    const [formData, setFormData] = useState({ name: '', contact: '', gst: '', email: '', address: '', supplierCategory: 'General Goods' });
    const [notice, setNotice] = useState(null);

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const fetchSuppliers = async () => {
        try {
            const token = authStorage.getToken();
            if (!token) {
                setSuppliers([]);
                return;
            }
            const response = await resourceApi.getAll('ims_suppliers', token);
            setSuppliers(response.data || []);
        } catch (error) {
            setNotice({ type: 'error', message: error.message || 'Failed to load suppliers' });
        }
    };

    const handleOpenModal = (supplier = null) => {
        if (supplier) {
            setEditingSupplier(supplier);
            setFormData(supplier);
        } else {
            setEditingSupplier(null);
            setFormData({ name: '', contact: '', gst: '', email: '', address: '', supplierCategory: 'General Goods' });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const token = authStorage.getToken();
            if (!token) {
                alert('Authentication required. Please login again.');
                return;
            }

            if (editingSupplier?._id) {
                await resourceApi.update('ims_suppliers', editingSupplier._id, formData, token);
            } else {
                await resourceApi.create('ims_suppliers', formData, token);
            }

            await fetchSuppliers();
            setIsModalOpen(false);
            setNotice({ type: 'success', message: editingSupplier ? 'Supplier updated.' : 'Supplier added.' });
        } catch (error) {
            setNotice({ type: 'error', message: error.message || 'Failed to save supplier' });
        }
    };

    const handleDelete = async (id) => {
        if (confirm('Delete supplier?')) {
            try {
                const token = authStorage.getToken();
                if (!token) {
                    alert('Authentication required. Please login again.');
                    return;
                }
                await resourceApi.remove('ims_suppliers', id, token);
                await fetchSuppliers();
                setNotice({ type: 'success', message: 'Supplier removed.' });
            } catch (error) {
                setNotice({ type: 'error', message: error.message || 'Failed to delete supplier' });
            }
        }
    };

    const columns = [
        {
            header: 'Supplier Name', accessor: 'name', render: (row) => (
                <div>
                    <div className="font-medium text-gray-900 dark:text-white">{row.name}</div>
                    <div className="text-xs text-gray-500">{row.supplierCategory || 'General Goods'} | {row.gst}</div>
                </div>
            )
        },
        {
            header: 'Contact', accessor: 'contact', render: row => (
                <div className="flex flex-col text-sm gap-1">
                    <div className="flex items-center gap-1"><Phone className="w-3 h-3" /> {row.contact}</div>
                    {row.email && <div className="flex items-center gap-1"><Mail className="w-3 h-3" /> {row.email}</div>}
                </div>
            )
        },
        { header: 'Address', accessor: 'address', render: row => <span className="text-sm text-gray-500 truncate max-w-xs block">{row.address || '-'}</span> },
    ];

    return (
        <div>
            {notice ? (
                <div className="mb-6">
                    <NotificationAlert type={notice.type} message={notice.message} onClose={() => setNotice(null)} />
                </div>
            ) : null}

            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Suppliers</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Manage vendor relationships</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                    <Plus className="w-4 h-4" /> Add Supplier
                </button>
            </div>

            <Table
                columns={columns}
                data={suppliers}
                searchPlaceholder="Search supplier by name, contact, or GST..."
                actions={(row) => (
                    <div className="flex gap-2 justify-end">
                        <button onClick={() => handleOpenModal(row)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg">
                            <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(row._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                )}
            />

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingSupplier ? 'Edit Supplier' : 'Add Supplier'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <FormField label="Name" required>
                        <FormInput
                            required
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </FormField>
                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="Contact" required>
                            <FormInput
                                required
                                value={formData.contact}
                                onChange={e => setFormData({ ...formData, contact: e.target.value })}
                            />
                        </FormField>
                        <FormField label="GSTIN">
                            <FormInput
                                value={formData.gst}
                                onChange={e => setFormData({ ...formData, gst: e.target.value })}
                            />
                        </FormField>
                    </div>
                    <FormField label="Email (Optional)">
                        <FormInput
                            type="email"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                    </FormField>
                    <FormField label="Address" required>
                        <FormTextarea
                            required
                            value={formData.address}
                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                            rows="2"
                        />
                    </FormField>

                    <FormField label="Supplier Category" required>
                        <select
                            className="air-input"
                            required
                            value={formData.supplierCategory || 'General Goods'}
                            onChange={e => setFormData({ ...formData, supplierCategory: e.target.value })}
                        >
                            <option value="Electronics">Electronics</option>
                            <option value="Office Supplies">Office Supplies</option>
                            <option value="Furniture">Furniture</option>
                            <option value="Stationery">Stationery</option>
                            <option value="General Goods">General Goods</option>
                        </select>
                    </FormField>
                    <button className="w-full py-2 bg-emerald-600 text-white rounded-lg">Save Supplier</button>
                </form>
            </Modal>
        </div>
    );
}
