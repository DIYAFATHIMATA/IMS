import { useEffect, useState } from 'react';
import { ClipboardList, Plus, Search, Edit, Trash2 } from 'lucide-react';
import Table from '../../components/Table';
import Modal from '../../components/Modal';
import { authStorage } from '../../services/authStorage';
import { inventoryAdjustmentsApi } from '../../services/api';

export default function InventoryAdjustments() {
    const [rows, setRows] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRow, setEditingRow] = useState(null);
    const [formData, setFormData] = useState({
        reference: '',
        reason: '',
        type: '',
        description: '',
        status: 'Adjusted'
    });

    const fetchRows = async () => {
        try {
            const token = authStorage.getToken();
            if (!token) {
                setRows([]);
                return;
            }

            const response = await inventoryAdjustmentsApi.getAll(token);
            setRows(response.data || []);
        } catch (error) {
            alert(error.message || 'Failed to load inventory adjustments');
        }
    };

    useEffect(() => {
        fetchRows();
    }, []);

    const handleOpenModal = (row = null) => {
        if (row) {
            setEditingRow(row);
            setFormData({
                reference: row.reference || '',
                reason: row.reason || '',
                type: row.type || '',
                description: row.description || '',
                status: row.status || 'Adjusted'
            });
        } else {
            setEditingRow(null);
            setFormData({
                reference: '',
                reason: '',
                type: '',
                description: '',
                status: 'Adjusted'
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const payload = {
            reference: formData.reference.trim(),
            reason: formData.reason.trim(),
            type: formData.type,
            description: formData.description.trim(),
            status: formData.status || 'Adjusted'
        };

        if (!payload.reference || !payload.reason || !payload.type) {
            alert('Reference, reason and type are required');
            return;
        }

        try {
            const token = authStorage.getToken();
            if (!token) {
                alert('Authentication required. Please login again.');
                return;
            }

            if (editingRow?._id) {
                await inventoryAdjustmentsApi.update(editingRow._id, payload, token);
            } else {
                await inventoryAdjustmentsApi.create(payload, token);
            }

            await fetchRows();
            setIsModalOpen(false);
        } catch (error) {
            alert(error.message || 'Failed to save adjustment');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this inventory adjustment?')) {
            return;
        }

        try {
            const token = authStorage.getToken();
            if (!token) {
                alert('Authentication required. Please login again.');
                return;
            }

            await inventoryAdjustmentsApi.remove(id, token);
            await fetchRows();
        } catch (error) {
            alert(error.message || 'Failed to delete adjustment');
        }
    };

    const filteredRows = rows.filter((row) =>
        [row.reference, row.reason, row.type, row.status, row.description]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const columns = [
        { header: 'Reference', accessor: 'reference' },
        { header: 'Reason', accessor: 'reason' },
        { header: 'Type', accessor: 'type' },
        { header: 'Status', accessor: 'status' }
    ];

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                        <ClipboardList className="w-6 h-6 text-airbnb-600" />
                        Inventory Adjustments
                    </h1>
                    <p className="text-zinc-500 mt-1">Manage your inventory adjustments</p>
                </div>
                <button onClick={() => handleOpenModal()} className="air-btn-primary">
                    <Plus className="w-4 h-4" />
                    New Inventory Adjustment
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-zinc-200 dark:border-gray-700 mb-6 flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                        type="text"
                        placeholder="Search inventory adjustments..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="air-input pl-10 py-2.5"
                    />
                </div>
            </div>

            <Table
                columns={columns}
                data={filteredRows}
                actions={(row) => (
                    <div className="flex gap-2 justify-end">
                        <button onClick={() => handleOpenModal(row)} className="p-2 text-zinc-500 hover:text-airbnb-600 hover:bg-airbnb-50 dark:hover:bg-airbnb-700/20 rounded-lg transition-colors">
                            <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(row._id)} className="p-2 text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                )}
            />

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingRow ? 'Edit Inventory Adjustment' : 'New Inventory Adjustment'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-zinc-700 dark:text-gray-300">Reference#</label>
                        <input
                            required
                            value={formData.reference}
                            onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                            className="air-input"
                            placeholder="ADJ-001"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-zinc-700 dark:text-gray-300">Reason</label>
                        <input
                            required
                            value={formData.reason}
                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                            className="air-input"
                            placeholder="Stock Correction"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-zinc-700 dark:text-gray-300">Adjustment Type</label>
                        <select
                            required
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            className="air-input"
                        >
                            <option value="">Select Adjustment Type</option>
                            <option value="Quantity">Quantity</option>
                            <option value="Value">Value</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-zinc-700 dark:text-gray-300">Description</label>
                        <input
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="air-input"
                            placeholder="Details..."
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-zinc-700 dark:text-gray-300 hover:bg-zinc-100 dark:hover:bg-gray-700 rounded-lg transition-colors">Cancel</button>
                        <button type="submit" className="air-btn-primary">Save Inventory Adjustment</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
