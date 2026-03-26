import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Layers3 } from 'lucide-react';
import Modal from '../components/Modal';
import { inventoryApi, resourceApi } from '../services/api';
import { authStorage } from '../services/authStorage';
import { getSeededProductImage } from '../utils/productImageMap';

export default function Categories() {
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [formData, setFormData] = useState({ name: '', description: '' });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = authStorage.getToken();
            if (!token) {
                setCategories([]);
                setProducts([]);
                return;
            }
            const [categoriesResponse, productsResponse] = await Promise.all([
                resourceApi.getAll('ims_categories', token),
                inventoryApi.getItems(token)
            ]);

            setCategories(categoriesResponse.data || []);
            setProducts(productsResponse.data || []);
        } catch (error) {
            alert(error.message || 'Failed to load categories');
        }
    };

    const handleOpenModal = (category = null) => {
        if (category) {
            setEditingCategory(category);
            setFormData(category);
        } else {
            setEditingCategory(null);
            setFormData({ name: '', description: '' });
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

            if (editingCategory?._id) {
                await resourceApi.update('ims_categories', editingCategory._id, formData, token);
            } else {
                await resourceApi.create('ims_categories', formData, token);
            }

            await fetchData();
            setIsModalOpen(false);
        } catch (error) {
            alert(error.message || 'Failed to save category');
        }
    };

    const handleDelete = async (id) => {
        if (confirm('Delete this category?')) {
            try {
                const token = authStorage.getToken();
                if (!token) {
                    alert('Authentication required. Please login again.');
                    return;
                }
                await resourceApi.remove('ims_categories', id, token);
                await fetchData();
            } catch (error) {
                alert(error.message || 'Failed to delete category');
            }
        }
    };

    const colorAccents = [
        'from-emerald-100 to-emerald-50 text-emerald-700 border-emerald-200',
        'from-teal-100 to-teal-50 text-teal-700 border-teal-200',
        'from-lime-100 to-lime-50 text-lime-700 border-lime-200',
        'from-amber-100 to-amber-50 text-amber-700 border-amber-200'
    ];

    const getItemCount = (category) => {
        const categoryName = String(category?.name || '').trim().toLowerCase();
        if (!categoryName) return 0;

        const computed = products.filter((item) =>
            String(item?.category || '').trim().toLowerCase() === categoryName
        ).length;

        if (computed > 0) return computed;
        return Number(category?.itemCount ?? category?.itemsCount ?? category?.count ?? category?.totalItems ?? 0);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Categories</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Organize product groups with clear, maintainable structure</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="air-btn-primary"
                >
                    <Plus className="w-4 h-4" /> Add Category
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {categories.map((category, index) => {
                    const accent = colorAccents[index % colorAccents.length];
                    const itemCount = getItemCount(category);
                    return (
                        <article
                            key={category._id}
                            className="air-surface p-4 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="relative h-36 w-full mb-3 overflow-hidden rounded-xl border border-slate-200/80 dark:border-slate-700/70 bg-slate-50">
                                        <img
                                            src={getSeededProductImage(category.name, category.name)}
                                            alt={`${category.name} category`}
                                            loading="lazy"
                                            className="h-full w-full object-cover"
                                        />
                                        <div className={`absolute left-2 top-2 inline-flex items-center justify-center rounded-lg border bg-gradient-to-br ${accent} h-8 w-8 shadow-sm`}>
                                            <Layers3 className="w-4 h-4" />
                                        </div>
                                    </div>
                                    <h3 className="text-base font-semibold text-slate-900 dark:text-white truncate">{category.name}</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 min-h-[2.5rem]">
                                        {category.description || 'No description provided.'}
                                    </p>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                    <button
                                        onClick={() => handleOpenModal(category)}
                                        className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                                        title="Edit category"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(category._id)}
                                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                        title="Delete category"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-slate-700/70 flex items-center justify-between">
                                <span className="text-xs uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">Items</span>
                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{itemCount}</span>
                            </div>
                        </article>
                    );
                })}
            </div>

            {categories.length === 0 ? (
                <div className="air-surface p-10 text-center">
                    <p className="text-sm text-slate-500 dark:text-slate-400">No categories yet. Add your first category to get started.</p>
                </div>
            ) : null}

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingCategory ? 'Edit Category' : 'Add Category'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name</label>
                        <input
                            required
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                        <input
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        />
                    </div>
                    <button type="submit" className="air-btn-primary w-full">Save Category</button>
                </form>
            </Modal>
        </div>
    );
}
