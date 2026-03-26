import { useState, useEffect } from 'react';
import { BarChart, PieChart } from 'lucide-react';
import { reportsApi } from '../services/api';
import { authStorage } from '../services/authStorage';
import Table from '../components/Table';

export default function Reports() {
    const [summary, setSummary] = useState({
        totalSalesRevenue: 0,
        totalPurchaseCost: 0,
        totalGstCollected: 0,
        totalGstPaid: 0,
        netGst: 0,
        invoiceCount: 0,
        purchaseOrderCount: 0,
        productsCount: 0,
        customersCount: 0,
        lowStockCount: 0,
        pendingSupplyRequests: 0,
        approvedSupplyRequests: 0,
        openSupplyRequests: 0,
        monthlySalesTrend: []
    });
    const [supplierPerformance, setSupplierPerformance] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchReportSummary = async () => {
            try {
                const token = authStorage.getToken();
                if (!token) {
                    setSummary({
                        totalSalesRevenue: 0,
                        totalPurchaseCost: 0,
                        totalGstCollected: 0,
                        totalGstPaid: 0,
                        netGst: 0,
                        invoiceCount: 0,
                        purchaseOrderCount: 0,
                        productsCount: 0,
                        customersCount: 0,
                        lowStockCount: 0,
                        pendingSupplyRequests: 0,
                        approvedSupplyRequests: 0,
                        openSupplyRequests: 0,
                        monthlySalesTrend: []
                    });
                    return;
                }

                const [summaryRes, supplierRes] = await Promise.all([
                    reportsApi.getSummary(token),
                    reportsApi.getSupplierPerformance(token)
                ]);
                setSummary(summaryRes.data || {});
                setSupplierPerformance(supplierRes.data || []);
            } catch (error) {
                alert(error.message || 'Failed to load reports summary');
            } finally {
                setIsLoading(false);
            }
        };

        fetchReportSummary();
    }, []);

    const totalSales = Number(summary.totalSalesRevenue || 0);
    const totalPurchases = Number(summary.totalPurchaseCost || 0);
    const totalTaxCollected = Number(summary.totalGstCollected || 0);
    const totalTaxPaid = Number(summary.totalGstPaid || 0);

    const chartData = summary.monthlySalesTrend || [];

    const maxValue = chartData.length > 0 ? Math.max(...chartData.map(d => Number(d.value || 0)), 1) : 1;
    const supplierColumns = [
        { header: 'Supplier', accessor: 'supplierName' },
        { header: 'Total Requests', accessor: 'totalRequests' },
        { header: 'Completed', accessor: 'completedDeliveries' },
        {
            header: 'Completion Rate',
            accessor: 'completionRate',
            render: (row) => `${Number(row.completionRate || 0).toFixed(1)}%`
        },
        {
            header: 'Avg Delivery (hrs)',
            accessor: 'avgDeliveryHours',
            render: (row) => Number(row.avgDeliveryHours || 0).toFixed(2)
        }
    ];

    return (
        <div className="space-y-6">
            <div className="rounded-3xl border border-emerald-200/60 bg-gradient-to-r from-emerald-50 via-emerald-50 to-emerald-50 dark:from-slate-900 dark:to-slate-800 dark:border-slate-700 p-5 md:p-6">
                <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2">Reports & Analytics</h1>
                <p className="text-slate-600 dark:text-slate-300">Financial overview and tax reports</p>
            </div>

            {isLoading && (
                <div className="mb-6 text-sm text-slate-500 dark:text-slate-400">Loading overall summary...</div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="air-surface p-6">
                    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Sales Revenue</h3>
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">₹{totalSales.toLocaleString()}</p>
                </div>
                <div className="air-surface p-6">
                    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Purchase Cost</h3>
                    <p className="text-2xl font-bold text-violet-600 dark:text-violet-400 mt-2">₹{totalPurchases.toLocaleString()}</p>
                </div>
                <div className="air-surface p-6">
                    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Total GST Collected</h3>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-2">₹{totalTaxCollected.toLocaleString()}</p>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                <div className="air-surface p-4 rounded-xl">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Invoices</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{summary.invoiceCount || 0}</p>
                </div>
                <div className="air-surface p-4 rounded-xl">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Purchase Orders</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{summary.purchaseOrderCount || 0}</p>
                </div>
                <div className="air-surface p-4 rounded-xl">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Products</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{summary.productsCount || 0}</p>
                </div>
                <div className="air-surface p-4 rounded-xl">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Customers</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{summary.customersCount || 0}</p>
                </div>
                <div className="air-surface p-4 rounded-xl">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Low Stock Items</p>
                    <p className="text-xl font-bold text-red-600 dark:text-red-400 mt-1">{summary.lowStockCount || 0}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="air-surface p-4 rounded-xl">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Pending Approval</p>
                    <p className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">{summary.pendingSupplyRequests || 0}</p>
                </div>
                <div className="air-surface p-4 rounded-xl">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Approved Requests</p>
                    <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{summary.approvedSupplyRequests || 0}</p>
                </div>
                <div className="air-surface p-4 rounded-xl">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Open Supply Workflow</p>
                    <p className="text-xl font-bold text-violet-600 dark:text-violet-400 mt-1">{summary.openSupplyRequests || 0}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Sales Chart */}
                <div className="air-surface p-6">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <BarChart className="w-5 h-5 text-slate-400" /> Monthly Sales Trend
                    </h3>
                    <div className="flex items-end justify-between h-48 gap-4">
                        {chartData.map((d, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-t-lg relative overflow-hidden h-full flex items-end">
                                    <div
                                        style={{ height: `${(Number(d.value || 0) / maxValue) * 100}%` }}
                                        className="w-full bg-emerald-500 dark:bg-emerald-600 opacity-80 group-hover:opacity-100 transition-all duration-500 rounded-t-lg"
                                    ></div>
                                </div>
                                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{d.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* GST Summary */}
                <div className="air-surface p-6">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <PieChart className="w-5 h-5 text-slate-400" /> GST Tax Breakdown
                    </h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                            <span className="text-slate-600 dark:text-slate-300">CGST (50%)</span>
                            <span className="font-bold text-slate-900 dark:text-white">₹{(totalTaxCollected / 2).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                            <span className="text-slate-600 dark:text-slate-300">SGST (50%)</span>
                            <span className="font-bold text-slate-900 dark:text-white">₹{(totalTaxCollected / 2).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-100 dark:border-emerald-800">
                            <span className="text-emerald-700 dark:text-emerald-300 font-medium">Net GST (Collected - Paid)</span>
                            <span className="font-bold text-emerald-700 dark:text-emerald-300">₹{Number(summary.netGst || 0).toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="air-surface p-6">
                <h3 className="font-bold text-slate-900 dark:text-white mb-4">Supplier Performance</h3>
                <Table
                    columns={supplierColumns}
                    data={supplierPerformance}
                    searchPlaceholder="Search supplier..."
                    emptyText={isLoading ? 'Loading supplier performance...' : 'No supplier performance data yet.'}
                />
            </div>
        </div>
    );
}
