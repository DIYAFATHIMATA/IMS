import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

const SUPPLIER_CATEGORIES = ['Electronics', 'Office Supplies', 'Furniture', 'Stationery', 'General Goods'];

export default function Register() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        role: 'staff',
        companyName: '',
        businessAddress: '',
        supplierCategory: 'General Goods',
        gstNumber: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (formData.role === 'supplier') {
            if (!formData.companyName.trim() || !formData.businessAddress.trim() || !formData.phone.trim()) {
                setError('Company name, phone and business address are required for supplier registration');
                return;
            }
        }

        setLoading(true);
        setError('');

        try {
            const result = await register({
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                role: formData.role,
                companyName: formData.companyName,
                businessAddress: formData.businessAddress,
                supplierCategory: formData.supplierCategory,
                gstNumber: formData.gstNumber,
                password: formData.password
            });

            if (result.success) {
                navigate('/login', {
                    state: {
                        message: 'Registration successful! Please sign in to continue.',
                        email: formData.email
                    }
                });
            } else {
                setError(result.message);
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <h2 className="text-center text-3xl font-extrabold text-stone-900">Create your account</h2>
            <p className="text-center text-sm text-stone-600">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-emerald-700 hover:text-emerald-800">
                    Sign in
                </Link>
            </p>

            <form className="space-y-4" onSubmit={handleRegister}>
                {error && (
                    <div className="p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200">
                        {error}
                    </div>
                )}

                        <div>
                            <label className="block text-sm font-semibold text-stone-700 mb-1.5">Full Name</label>
                <input
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 text-sm border border-stone-300 bg-stone-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                    placeholder="John Doe"
                />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-stone-700 mb-1.5">Email Address</label>
                <input
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 text-sm border border-stone-300 bg-stone-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                    placeholder="you@example.com"
                />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-stone-700 mb-1.5">Phone</label>
                <input
                    name="phone"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 text-sm border border-stone-300 bg-stone-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                    placeholder="+1 (555) 000-0000"
                />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-stone-700 mb-1.5">Account Type</label>
                <select
                    name="role"
                    required
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 text-sm border border-stone-300 bg-stone-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                >
                    <option value="staff">Staff (Warehouse / Retail)</option>
                    <option value="supplier">Supplier (Business)</option>
                </select>
                        </div>

                        {formData.role === 'supplier' && (
                            <>
                                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-900 mb-3">Supplier Information</p>
                                    
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-stone-700 mb-1.5">Company Name</label>
                                            <input
                                                name="companyName"
                                                type="text"
                                                required
                                                value={formData.companyName}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2.5 text-sm border border-stone-300 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-stone-700 mb-1.5">Category</label>
                                            <select
                                                name="supplierCategory"
                                                value={formData.supplierCategory}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2.5 text-sm border border-stone-300 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                                            >
                                                {SUPPLIER_CATEGORIES.map((category) => (
                                                    <option key={category} value={category}>{category}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-stone-700 mb-1.5">Business Address</label>
                                            <input
                                                name="businessAddress"
                                                type="text"
                                                required
                                                value={formData.businessAddress}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2.5 text-sm border border-stone-300 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-stone-700 mb-1.5">GST Number <span className="text-xs text-stone-500">(optional)</span></label>
                                            <input
                                                name="gstNumber"
                                                type="text"
                                                value={formData.gstNumber}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2.5 text-sm border border-stone-300 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        <div>
                            <label className="block text-sm font-semibold text-stone-700 mb-1.5">Password</label>
                <input
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 text-sm border border-stone-300 bg-stone-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                    placeholder="••••••••"
                />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-stone-700 mb-1.5">Confirm Password</label>
                <input
                    name="confirmPassword"
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 text-sm border border-stone-300 bg-stone-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                    placeholder="••••••••"
                />
                        </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white text-sm font-semibold py-2.5 rounded-xl transition flex items-center justify-center gap-2"
                >
                    {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Create Account'}
                </button>
            </form>
        </div>
    );
}
