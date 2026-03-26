import { useState, useEffect } from 'react';
import { UserPlus, Trash2, Edit } from 'lucide-react';
import Table from '../components/Table';
import Modal from '../components/Modal';
import { usersApi } from '../services/api';
import { authStorage } from '../services/authStorage';
import { useAuth } from '../context/AuthContext';
import { STAFF_ROLE, SUPPLIER_ROLE, hasAdminAccess } from '../utils/roles';
import { FormField, FormInput, FormSelect } from '../components/ui/FormField';
import NotificationAlert from '../components/ui/NotificationAlert';
import StatusBadge from '../components/ui/StatusBadge';

const SUPPLIER_CATEGORIES = ['Electronics', 'Office Supplies', 'Furniture', 'Stationery', 'General Goods'];

export default function Users() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: STAFF_ROLE,
        phone: '',
        companyName: '',
        businessAddress: '',
        supplierCategory: 'General Goods',
        gstNumber: ''
    });
    const [notice, setNotice] = useState(null);

    const getTokenOrThrow = () => {
        const token = authStorage.getToken();
        if (!token) {
            throw new Error('Authentication required. Please login again.');
        }
        return token;
    };

    const fetchUsers = async () => {
        try {
            const token = getTokenOrThrow();
            const response = await usersApi.getAll(token);
            setUsers(response.data || []);
        } catch (error) {
            setNotice({ type: 'error', message: error.message || 'Failed to load users' });
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleOpenModal = (user = null) => {
        if (user) {
            setEditingUser(user);
            setFormData({ ...user, password: '' }); // Don't show password
        } else {
            setEditingUser(null);
            setFormData({
                name: '',
                email: '',
                password: '',
                role: STAFF_ROLE,
                phone: '',
                companyName: '',
                businessAddress: '',
                supplierCategory: 'General Goods',
                gstNumber: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (id === currentUser?._id) return alert("Cannot delete yourself");
        if (confirm("Delete this user?")) {
            try {
                const token = getTokenOrThrow();
                await usersApi.remove(id, token);
                fetchUsers();
                setNotice({ type: 'success', message: 'User deactivated successfully.' });
            } catch (error) {
                setNotice({ type: 'error', message: error.message || 'Failed to deactivate user' });
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const email = formData.email.trim();
        const name = formData.name.trim();
        const phone = formData.phone.trim();
        const validPhone = !phone || /^[0-9+()\-\s]{7,15}$/.test(phone);

        if (name.length < 2) {
            alert('Name must be at least 2 characters');
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            alert('Please enter a valid email');
            return;
        }
        if (!validPhone) {
            alert('Please enter a valid phone number');
            return;
        }

        if (formData.role === SUPPLIER_ROLE) {
            if (!formData.companyName?.trim() || !formData.businessAddress?.trim()) {
                alert('Company name and business address are required for supplier');
                return;
            }
            if (!phone) {
                alert('Phone is required for supplier');
                return;
            }
        }

        const payload = { ...formData, name, email, phone };
        if (editingUser) {
            if (!payload.password) delete payload.password; // Don't overwrite if empty
        } else if ((payload.password || '').length < 4) {
            alert('Password must be at least 4 characters');
            return;
        }

        try {
            const token = getTokenOrThrow();
            if (editingUser?._id) {
                await usersApi.update(editingUser._id, payload, token);
            } else {
                await usersApi.create(payload, token);
            }
            await fetchUsers();
            setIsModalOpen(false);
            setNotice({ type: 'success', message: editingUser ? 'User updated.' : 'User created.' });
        } catch (error) {
            setNotice({ type: 'error', message: error.message || 'Failed to save user' });
        }
    };

    const columns = [
        {
            header: 'Name', accessor: 'name', render: (row) => (
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                        {(row.name || '?')[0]}
                    </div>
                    <div>
                        <div className="font-medium text-gray-900 dark:text-white">{row.name}</div>
                        <div className="text-xs text-gray-400">{row.email}</div>
                    </div>
                </div>
            )
        },
        {
            header: 'Role', accessor: 'role', render: (row) => (
                <StatusBadge status={row.role} />
            )
        },
        {
            header: 'Status', accessor: 'isActive', render: (row) => (
                <StatusBadge status={row.isActive === false ? 'Inactive' : 'Active'} />
            )
        },
        { header: 'Phone', accessor: 'phone', render: row => row.phone || '-' }
    ];

    if (!hasAdminAccess(currentUser)) {
        return <div className="p-8 text-center text-red-500 font-bold">Access Denied: You do not have permission to view this page.</div>;
    }

    return (
        <div className="space-y-6">
            {notice ? (
                <div>
                    <NotificationAlert type={notice.type} message={notice.message} onClose={() => setNotice(null)} />
                </div>
            ) : null}

            <div className="rounded-3xl border border-emerald-200/60 bg-gradient-to-r from-emerald-50 via-emerald-50 to-emerald-50 dark:from-slate-900 dark:to-slate-800 dark:border-slate-700 p-5 md:p-6">
                <div className="flex justify-between items-center gap-4 flex-wrap">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                        Users
                    </h1>
                    <p className="text-slate-600 dark:text-slate-300 mt-1">
                        Manage Staff and Supplier accounts.
                    </p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="air-btn-primary"
                >
                    <UserPlus className="w-4 h-4" />
                    Add User
                </button>
                </div>
            </div>

            <Table
                columns={columns}
                data={users}
                searchPlaceholder="Search users by name, email, role, phone..."
                filters={[
                    {
                        key: 'role',
                        label: 'Role',
                        options: [
                            { label: 'Admin', value: 'admin' },
                            { label: 'Staff', value: 'staff' },
                            { label: 'Supplier', value: 'supplier' }
                        ]
                    },
                    {
                        key: 'isActive',
                        label: 'Status',
                        options: [
                            { label: 'Active', value: 'true' },
                            { label: 'Inactive', value: 'false' }
                        ],
                        predicate: (row, value) => String(row.isActive !== false) === value
                    }
                ]}
                actions={(row) => (
                    <div className="flex gap-2 justify-end">
                        {row.role !== 'admin' && (
                            <button
                                onClick={() => handleOpenModal(row)}
                                className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                            >
                                <Edit className="w-4 h-4" />
                            </button>
                        )}
                        {row._id !== currentUser?._id && row.role !== 'admin' && (
                            <button
                                onClick={() => handleDelete(row._id)}
                                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                )}
            />

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingUser ? 'Edit User' : 'Add New User'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <FormField label="Full Name" required>
                        <FormInput
                            required
                            type="text"
                            placeholder="Full Name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </FormField>
                    <FormField label="Email Address" required>
                        <FormInput
                            required
                            type="email"
                            placeholder="Email Address"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </FormField>
                    <FormField label="Phone">
                        <FormInput
                            type="text"
                            placeholder="Phone"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                    </FormField>

                    {formData.role === SUPPLIER_ROLE && (
                        <>
                            <FormField label="Company Name" required>
                                <FormInput
                                    required
                                    type="text"
                                    placeholder="Company Name"
                                    value={formData.companyName || ''}
                                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                />
                            </FormField>

                            <FormField label="Business Address" required>
                                <FormInput
                                    required
                                    type="text"
                                    placeholder="Business Address"
                                    value={formData.businessAddress || ''}
                                    onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
                                />
                            </FormField>

                            <FormField label="Supplier Category" required>
                                <FormSelect
                                    value={formData.supplierCategory || 'General Goods'}
                                    onChange={(e) => setFormData({ ...formData, supplierCategory: e.target.value })}
                                >
                                    {SUPPLIER_CATEGORIES.map((category) => (
                                        <option key={category} value={category}>{category}</option>
                                    ))}
                                </FormSelect>
                            </FormField>

                            <FormField label="GST Number">
                                <FormInput
                                    type="text"
                                    placeholder="GST Number"
                                    value={formData.gstNumber || ''}
                                    onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                                />
                            </FormField>
                        </>
                    )}

                    <FormField label="Role">
                        <FormSelect
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        >
                            <option value={STAFF_ROLE}>Staff</option>
                            <option value={SUPPLIER_ROLE}>Supplier</option>
                        </FormSelect>
                    </FormField>
                    <FormField
                        label="Password"
                        required={!editingUser}
                        hint={editingUser ? 'Leave blank to keep current password.' : null}
                    >
                        <FormInput
                            type="password"
                            placeholder={editingUser ? 'Leave blank to keep current password' : 'Password'}
                            required={!editingUser}
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                    </FormField>

                    <button className="w-full py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
                        {editingUser ? 'Update User' : 'Create User'}
                    </button>
                </form>
            </Modal>
        </div>
    );
}
