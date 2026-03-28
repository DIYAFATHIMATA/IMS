import clsx from 'clsx';

const normalize = (status) => String(status || '').toLowerCase();

export default function StatusBadge({ status, className }) {
  const value = normalize(status);

  const styles = {
    pending: 'bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800/40',
    approved: 'bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800/40',
    delivered: 'bg-indigo-100 text-indigo-700 border border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800/40',
    completed: 'bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/40',
    verified: 'bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/40',
    rejected: 'bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800/40',
    paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    open: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    inactive: 'bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200',
    active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize',
        styles[value] || 'bg-zinc-100 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200',
        className
      )}
    >
      {status || 'Unknown'}
    </span>
  );
}
