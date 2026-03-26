import clsx from 'clsx';

export default function DashboardCard({
  title,
  value,
  subtitle,
  icon: Icon,
  tone = 'default',
  className
}) {
  const toneStyles = {
    default: 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100',
    primary: 'bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-900/60 text-slate-900 dark:text-slate-100',
    success: 'bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-900/60 text-slate-900 dark:text-slate-100',
    warning: 'bg-white dark:bg-slate-900 border-amber-200 dark:border-amber-900/60 text-slate-900 dark:text-slate-100',
    danger: 'bg-white dark:bg-slate-900 border-rose-200 dark:border-rose-900/60 text-slate-900 dark:text-slate-100'
  };

  const iconStyles = {
    default: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
    primary: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300',
    success: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300',
    warning: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-300',
    danger: 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-300'
  };

  return (
    <div className={clsx('rounded-2xl border shadow-sm p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md', toneStyles[tone], className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.12em] font-semibold text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-bold">{value}</p>
          {subtitle ? <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p> : null}
        </div>
        {Icon ? (
          <span className={clsx('w-10 h-10 rounded-xl flex items-center justify-center', iconStyles[tone])}>
            <Icon className="w-5 h-5" />
          </span>
        ) : null}
      </div>
    </div>
  );
}
