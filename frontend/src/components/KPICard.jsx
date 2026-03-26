import { ArrowUp, ArrowDown } from 'lucide-react';
import clsx from 'clsx';

export default function KPICard({ title, value, change, trend = 'neutral', icon: Icon, color = 'blue' }) {
    const colorMap = {
        blue: 'bg-airbnb-50 text-airbnb-600 dark:bg-airbnb-700/20 dark:text-airbnb-400',
        green: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400',
        purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
        orange: 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400',
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-gray-700 transition-colors">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-sm font-medium text-zinc-500 dark:text-gray-400">{title}</p>
                    <h3 className="text-3xl font-bold text-zinc-900 dark:text-white mt-1">{value}</h3>
                </div>
                <div className={clsx("p-3 rounded-xl", colorMap[color])}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>

            {change && (
                <div className="flex items-center text-sm font-medium">
                    {trend === 'up' ? (
                        <span className="flex items-center text-green-600 dark:text-green-400">
                            <ArrowUp className="w-4 h-4 mr-1" />
                            {change}
                        </span>
                    ) : trend === 'down' ? (
                        <span className="flex items-center text-red-600 dark:text-red-400">
                            <ArrowDown className="w-4 h-4 mr-1" />
                            {change}
                        </span>
                    ) : (
                        <span className="text-zinc-400">{change}</span>
                    )}
                    <span className="ml-2 text-zinc-400 dark:text-gray-500">vs last month</span>
                </div>
            )}
        </div>
    );
}
