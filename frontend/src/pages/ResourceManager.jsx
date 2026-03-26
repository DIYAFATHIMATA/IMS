import React, { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Edit } from 'lucide-react';
import Table from '../components/Table';
import Modal from '../components/Modal';
import { storage } from '../services/storage';
import { resourceApi } from '../services/api';
import { authStorage } from '../services/authStorage';

const API_RESOURCE_KEYS = new Set([
    'ims_customers',
    'ims_returns',
    'ims_categories',
    'ims_suppliers',
    'ims_purchases'
]);

export default function ResourceManager({
    title,
    icon: Icon,
    resourceKey,
    columns,
    fields,
    canCreate = true,
    canDelete = true,
    canEdit = true
}) {
    const [data, setData] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({});
    const usesApi = API_RESOURCE_KEYS.has(resourceKey);

    const fetchData = async () => {
        if (!usesApi) {
            const storedData = storage.get(resourceKey);
            setData(storedData);
            return;
        }

        try {
            const token = authStorage.getToken();
            if (!token) {
                setData([]);
                return;
            }

            const response = await resourceApi.getAll(resourceKey, token);
            setData(response.data || []);
        } catch (error) {
            alert(error.message || `Failed to load ${title}`);
        }
    };

    // Fetch Data
    useEffect(() => {
        fetchData();
    }, [resourceKey]);

    const handleOpenModal = (item = null) => {
        if (item) {
            setEditingItem(item);
            setFormData(item);
        } else {
            setEditingItem(null);
            // Init empty form
            const initialData = {};
            fields.forEach(f => initialData[f.name] = '');
            setFormData(initialData);
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!usesApi) {
            const storedData = storage.get(resourceKey);
            let newData;
            if (editingItem) {
                newData = storedData.map(item => item.id === editingItem.id ? { ...formData, id: item.id } : item);
            } else {
                newData = [...storedData, { ...formData, id: Date.now(), createdAt: new Date().toISOString() }];
            }

            storage.set(resourceKey, newData);
            setData(newData);
            handleCloseModal();
            return;
        }

        try {
            const token = authStorage.getToken();
            if (!token) {
                alert('Authentication required. Please login again.');
                return;
            }

            if (editingItem?._id) {
                await resourceApi.update(resourceKey, editingItem._id, formData, token);
            } else {
                await resourceApi.create(resourceKey, formData, token);
            }

            await fetchData();
            handleCloseModal();
        } catch (error) {
            alert(error.message || `Failed to save ${title.slice(0, -1)}`);
        }
    };

    const handleDelete = async (id) => {
        if (confirm(`Are you sure you want to delete this ${title.slice(0, -1)}?`)) {
            if (!usesApi) {
                const storedData = storage.get(resourceKey);
                const newData = storedData.filter(item => item.id !== id);
                storage.set(resourceKey, newData);
                setData(newData);
                return;
            }

            try {
                const token = authStorage.getToken();
                if (!token) {
                    alert('Authentication required. Please login again.');
                    return;
                }
                await resourceApi.remove(resourceKey, id, token);
                await fetchData();
            } catch (error) {
                alert(error.message || `Failed to delete ${title.slice(0, -1)}`);
            }
        }
    };

    // Filter
    const filteredData = data.filter(item =>
        Object.values(item).some(val =>
            String(val).toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                        {Icon && <Icon className="w-6 h-6 text-airbnb-600" />}
                        {title}
                    </h1>
                    <p className="text-zinc-500 mt-1">Manage your {title.toLowerCase()}</p>
                </div>
                {canCreate && (
                    <button
                        onClick={() => handleOpenModal()}
                        className="air-btn-primary"
                    >
                        <Plus className="w-4 h-4" />
                        New {title.slice(0, -1)}
                    </button>
                )}
            </div>

            {/* Filter Bar */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-zinc-200 dark:border-gray-700 mb-6 flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                        type="text"
                        placeholder={`Search ${title.toLowerCase()}...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="air-input pl-10 py-2.5"
                    />
                </div>
            </div>

            {filteredData.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-zinc-200 dark:border-gray-700 p-12 text-center">
                    <div className="w-16 h-16 bg-airbnb-50 dark:bg-airbnb-700/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        {Icon ? <Icon className="w-8 h-8 text-airbnb-500" /> : <div className="w-8 h-8 bg-airbnb-500 rounded-full"></div>}
                    </div>
                    <h3 className="text-lg font-medium text-zinc-900 dark:text-white">No {title.toLowerCase()} found</h3>
                    <p className="text-zinc-500 mt-1 mb-6">Get started by creating a new {title.slice(0, -1).toLowerCase()}.</p>
                    {canCreate && (
                        <button
                            onClick={() => handleOpenModal()}
                            className="air-btn-secondary"
                        >
                            Create Now
                        </button>
                    )}
                </div>
            ) : (
                <Table
                    columns={columns}
                    data={filteredData}
                    actions={(row) => (
                        <div className="flex gap-2 justify-end">
                            {canEdit && (
                                <button
                                    onClick={() => handleOpenModal(row)}
                                    className="p-2 text-zinc-500 hover:text-airbnb-600 hover:bg-airbnb-50 dark:hover:bg-airbnb-700/20 rounded-lg transition-colors"
                                >
                                    <Edit className="w-4 h-4" />
                                </button>
                            )}
                            {canDelete && (
                                <button
                                    onClick={() => handleDelete(row._id || row.id)}
                                    className="p-2 text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    )}
                />
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={`${editingItem ? 'Edit' : 'New'} ${title.slice(0, -1)}`}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    {fields.map((field) => (
                        <div key={field.name} className="space-y-1">
                            <label className="text-sm font-medium text-zinc-700 dark:text-gray-300">{field.label}</label>
                            {field.type === 'select' ? (
                                <select
                                    required={field.required}
                                    value={formData[field.name] || ''}
                                    onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                                    className="air-input"
                                >
                                    <option value="">Select {field.label}</option>
                                    {field.options.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type={field.type || 'text'}
                                    required={field.required}
                                    value={formData[field.name] || ''}
                                    onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                                    className="air-input"
                                    placeholder={field.placeholder}
                                />
                            )}
                        </div>
                    ))}

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={handleCloseModal}
                            className="px-4 py-2 text-zinc-700 dark:text-gray-300 hover:bg-zinc-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="air-btn-primary"
                        >
                            Save {title.slice(0, -1)}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
