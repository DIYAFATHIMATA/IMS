import clsx from 'clsx';

const normalize = (status) => String(status || '').toLowerCase();

export default function StatusBadge({ status, className }) {
  const value = normalize(status);

  const styles = {
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    accepted: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    processing: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
    shipped: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    delivered: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    verified: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
    rejected: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
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
