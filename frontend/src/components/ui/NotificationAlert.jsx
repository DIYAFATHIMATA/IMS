import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import clsx from 'clsx';

const config = {
  success: {
    icon: CheckCircle2,
    style: 'bg-emerald-50 border-emerald-200 text-emerald-800'
  },
  error: {
    icon: AlertCircle,
    style: 'bg-rose-50 border-rose-200 text-rose-800'
  },
  warning: {
    icon: AlertTriangle,
    style: 'bg-amber-50 border-amber-200 text-amber-800'
  },
  info: {
    icon: Info,
    style: 'bg-emerald-50 border-emerald-200 text-emerald-800'
  }
};

export default function NotificationAlert({
  type = 'info',
  title,
  message,
  onClose,
  className
}) {
  const item = config[type] || config.info;
  const Icon = item.icon;

  return (
    <div className={clsx('rounded-xl border px-4 py-3 flex gap-3', item.style, className)}>
      <Icon className="w-4 h-4 mt-0.5 shrink-0" />
      <div className="min-w-0">
        {title ? <p className="text-sm font-semibold">{title}</p> : null}
        {message ? <p className="text-sm">{message}</p> : null}
      </div>
      {onClose ? (
        <button onClick={onClose} className="ml-auto p-1 rounded hover:bg-black/5" aria-label="Close alert">
          <X className="w-4 h-4" />
        </button>
      ) : null}
    </div>
  );
}
