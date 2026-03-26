import clsx from 'clsx';

export function FormField({ label, required, hint, error, children }) {
  return (
    <div className="space-y-1">
      {label ? (
        <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
          {label} {required ? <span className="text-rose-500">*</span> : null}
        </label>
      ) : null}
      {children}
      {error ? <p className="text-[11px] text-rose-600">{error}</p> : null}
      {!error && hint ? <p className="text-[11px] text-zinc-500">{hint}</p> : null}
    </div>
  );
}

export function FormInput({ className, ...props }) {
  return <input className={clsx('air-input', className)} {...props} />;
}

export function FormSelect({ className, ...props }) {
  return <select className={clsx('air-input', className)} {...props} />;
}

export function FormTextarea({ className, ...props }) {
  return <textarea className={clsx('air-input', className)} {...props} />;
}
