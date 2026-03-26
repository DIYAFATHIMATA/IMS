import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { ArrowUpDown, ChevronLeft, ChevronRight, Search } from 'lucide-react';

const defaultSortValue = (value) => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'number') return value;
    if (typeof value === 'boolean') return value ? 1 : 0;
    return String(value).toLowerCase();
};

export default function Table({
    columns,
    data,
    actions,
    onRowClick,
    searchable = true,
    searchPlaceholder = 'Search records...',
    filters = [],
    initialPageSize = 10,
    pageSizeOptions = [5, 10, 20, 50],
    emptyText = 'No data available'
}) {
    const [query, setQuery] = useState('');
    const [activeFilters, setActiveFilters] = useState(() =>
        filters.reduce((acc, item) => ({ ...acc, [item.key]: 'all' }), {})
    );
    const [sortConfig, setSortConfig] = useState({ key: '', direction: 'asc' });
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(initialPageSize);

    const filteredRows = useMemo(() => {
        let rows = Array.isArray(data) ? [...data] : [];

        if (query.trim()) {
            const term = query.toLowerCase();
            rows = rows.filter((row) =>
                columns.some((col) => {
                    const value = col.searchAccessor ? col.searchAccessor(row) : row[col.accessor];
                    return String(value ?? '').toLowerCase().includes(term);
                })
            );
        }

        if (filters.length > 0) {
            rows = rows.filter((row) =>
                filters.every((filter) => {
                    const selected = activeFilters[filter.key];
                    if (!selected || selected === 'all') return true;
                    if (typeof filter.predicate === 'function') {
                        return filter.predicate(row, selected);
                    }
                    const value = filter.accessor ? filter.accessor(row) : row[filter.key];
                    return String(value ?? '') === String(selected);
                })
            );
        }

        if (sortConfig.key) {
            const column = columns.find((col) => col.accessor === sortConfig.key);
            if (column) {
                rows.sort((a, b) => {
                    const left = column.sortAccessor ? column.sortAccessor(a) : defaultSortValue(a[column.accessor]);
                    const right = column.sortAccessor ? column.sortAccessor(b) : defaultSortValue(b[column.accessor]);
                    if (left < right) return sortConfig.direction === 'asc' ? -1 : 1;
                    if (left > right) return sortConfig.direction === 'asc' ? 1 : -1;
                    return 0;
                });
            }
        }

        return rows;
    }, [activeFilters, columns, data, filters, query, sortConfig]);

    const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
    const currentPage = Math.min(page, totalPages);

    const paginatedRows = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredRows.slice(start, start + pageSize);
    }, [currentPage, filteredRows, pageSize]);

    const toggleSort = (accessor) => {
        setPage(1);
        setSortConfig((prev) => {
            if (prev.key !== accessor) return { key: accessor, direction: 'asc' };
            if (prev.direction === 'asc') return { key: accessor, direction: 'desc' };
            return { key: '', direction: 'asc' };
        });
    };

    const showingFrom = filteredRows.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const showingTo = Math.min(currentPage * pageSize, filteredRows.length);

    return (
        <div className="air-surface overflow-hidden shadow-sm transition-colors">
            {(searchable || filters.length > 0) && (
            <div className="px-5 py-4 border-b border-stone-200 dark:border-slate-700 bg-stone-50/80 dark:bg-slate-900/40 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
                    {searchable ? (
                        <div className="relative w-full md:max-w-sm">
                            <Search className="absolute left-3 top-3.5 w-4 h-4 text-zinc-400" />
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => {
                                    setQuery(e.target.value);
                                    setPage(1);
                                }}
                                className="air-input pl-9 py-2.5"
                                placeholder={searchPlaceholder}
                            />
                        </div>
                    ) : (
                        <span />
                    )}
                    {filters.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {filters.map((filter) => (
                                <select
                                    key={filter.key}
                                    value={activeFilters[filter.key] || 'all'}
                                    onChange={(e) => {
                                        setActiveFilters((prev) => ({ ...prev, [filter.key]: e.target.value }));
                                        setPage(1);
                                    }}
                                    className="air-input py-2.5 min-w-[140px]"
                                >
                                    <option value="all">All {filter.label}</option>
                                    {filter.options.map((option) => (
                                        <option key={String(option.value)} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px] text-slate-600 dark:text-slate-300">
                    <thead className="bg-stone-50 dark:bg-slate-800/60 text-[11px] uppercase text-slate-500 dark:text-slate-300 font-semibold border-b border-stone-200 dark:border-slate-700">
                        <tr>
                            {columns.map((col, idx) => (
                                <th key={idx} className="px-6 py-3.5">
                                    {col.sortable === false || !col.accessor ? (
                                        col.header
                                    ) : (
                                        <button
                                            type="button"
                                            className="inline-flex items-center gap-2 hover:text-emerald-800 dark:hover:text-emerald-300"
                                            onClick={() => toggleSort(col.accessor)}
                                        >
                                            {col.header}
                                            <ArrowUpDown className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </th>
                            ))}
                            {actions && <th className="px-6 py-3.5 text-right">Actions</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {paginatedRows.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length + (actions ? 1 : 0)} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                                    {emptyText}
                                </td>
                            </tr>
                        ) : (
                            paginatedRows.map((row, idx) => (
                                <tr
                                    key={idx}
                                    onClick={() => onRowClick && onRowClick(row)}
                                    className={clsx(
                                        'hover:bg-emerald-50/60 dark:hover:bg-emerald-900/10 transition-colors',
                                        onRowClick && 'cursor-pointer'
                                    )}
                                >
                                    {columns.map((col, colIdx) => (
                                        <td key={colIdx} className="px-6 py-3.5 whitespace-nowrap">
                                            {col.render ? col.render(row) : row[col.accessor]}
                                        </td>
                                    ))}
                                    {actions && <td className="px-6 py-3.5 text-right whitespace-nowrap">{actions(row)}</td>}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="px-6 py-4 border-t border-stone-200 dark:border-slate-700 flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center bg-stone-50/70 dark:bg-slate-900/40">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                    Showing {showingFrom}-{showingTo} of {filteredRows.length} entries
                </span>
                <div className="flex items-center gap-2 sm:gap-3">
                    <select
                        value={pageSize}
                        onChange={(e) => {
                            setPageSize(Number(e.target.value));
                            setPage(1);
                        }}
                        className="air-input py-2 px-3 w-auto"
                    >
                        {pageSizeOptions.map((option) => (
                            <option key={option} value={option}>
                                {option}/page
                            </option>
                        ))}
                    </select>
                    <button
                        disabled={currentPage <= 1}
                        onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                        className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-50"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs text-slate-500">Page {currentPage}/{totalPages}</span>
                    <button
                        disabled={currentPage >= totalPages}
                        onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                        className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-50"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
