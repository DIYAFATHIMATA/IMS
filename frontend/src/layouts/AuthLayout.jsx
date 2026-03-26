import { Outlet } from 'react-router-dom';
import { Package } from 'lucide-react';

const AuthLayout = () => {
    return (
        <div className="min-h-screen w-full flex items-center justify-center px-4 py-8 bg-gradient-to-br from-stone-100 via-white to-emerald-50">
            <div className="w-full max-w-md p-6 rounded-3xl border border-stone-200 bg-white shadow-[0_14px_40px_rgba(0,0,0,0.08)]">
                <div className="flex justify-center mb-5">
                    <div className="p-2.5 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl shadow-xl shadow-emerald-600/25">
                        <Package className="w-7 h-7 text-white" />
                    </div>
                </div>
                <div className="text-center mb-6">
                    <h1 className="text-xl font-extrabold text-stone-900">IMS</h1>
                    <p className="text-stone-500 text-sm mt-1">Inventory Management System</p>
                </div>
                <Outlet />
            </div>
        </div>
    );
};

export default AuthLayout;
