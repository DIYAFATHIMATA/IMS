import React from 'react';
import { Plus, Search, Filter } from 'lucide-react';

export default function SalesGenericPage({ title, description, icon: Icon }) {
    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        {Icon && <Icon className="w-6 h-6 text-emerald-600" />}
                        {title}
                    </h1>
                    <p className="text-gray-500 mt-1">{description || `Manage your ${title.toLowerCase()}`}</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20">
                    <Plus className="w-4 h-4" />
                    New {title.slice(0, -1)} {/* Crude singularization */}
                </button>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder={`Search ${title.toLowerCase()}...`}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                </div>
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">
                    <Filter className="w-4 h-4" />
                    Filter
                </button>
            </div>

            {/* Empty State */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    {Icon ? <Icon className="w-8 h-8 text-emerald-500" /> : <div className="w-8 h-8 bg-emerald-500 rounded-full"></div>}
                </div>
                <h3 className="text-lg font-medium text-gray-900">No {title.toLowerCase()} found</h3>
                <p className="text-gray-500 mt-1 mb-6">Get started by creating a new {title.slice(0, -1).toLowerCase()}.</p>
                <button className="px-4 py-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg font-medium transition-colors">
                    Create Now
                </button>
            </div>
        </div>
    );
}
