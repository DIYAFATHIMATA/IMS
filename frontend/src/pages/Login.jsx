import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, Loader2 } from 'lucide-react';
import { normalizeRole, SUPPLIER_ROLE } from '../utils/roles';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        if (location.state?.email) {
            setEmail(location.state.email);
        }
    }, [location.state]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const result = await login(email, password);
        if (result.success) {
            const role = normalizeRole(result.user?.role);
            const destination = role === SUPPLIER_ROLE ? '/supply-requests' : '/dashboard';
            navigate(destination);
        } else {
            setError(result.message);
        }

        setLoading(false);
    };

    return (
        <div className="space-y-4">
            <h2 className="text-center text-3xl font-extrabold text-stone-900">Sign in to your account</h2>

            {location.state?.message && (
                <div className="p-3 bg-emerald-50 text-emerald-800 text-sm rounded-xl border border-emerald-200">
                    {location.state.message}
                </div>
            )}

            {error && (
                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200">
                    {error}
                </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-1.5">Email Address</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Mail className="h-5 w-5 text-stone-400" />
                        </div>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-12 pr-4 py-2.5 text-sm border border-stone-300 bg-stone-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                            placeholder="user@example.com"
                            required
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-1.5">Password</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Lock className="h-5 w-5 text-stone-400" />
                        </div>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-12 pr-4 py-2.5 text-sm border border-stone-300 bg-stone-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                            placeholder="••••••••"
                            required
                        />
                    </div>
                </div>

                <div className="flex items-center justify-end">
                    <a href="#" className="text-xs font-medium text-emerald-700 hover:text-emerald-800 transition">
                        Forgot your password?
                    </a>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white text-sm font-semibold py-2.5 rounded-xl transition flex items-center justify-center gap-2"
                >
                    {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Sign In'}
                </button>
            </form>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-stone-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                    <span className="px-2 bg-white text-stone-500">New to Inventory?</span>
                </div>
            </div>

            <Link
                to="/register"
                className="w-full border-2 border-emerald-700 text-emerald-700 hover:bg-emerald-50 text-sm font-semibold py-2.5 rounded-xl transition text-center block"
            >
                Create an account
            </Link>
        </div>
    );
}
