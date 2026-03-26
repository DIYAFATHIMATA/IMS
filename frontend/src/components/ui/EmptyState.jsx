export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center shadow-sm">
      {Icon ? (
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-zinc-100 text-zinc-500 flex items-center justify-center">
          <Icon className="w-7 h-7" />
        </div>
      ) : null}
      <h3 className="text-base font-semibold text-zinc-900">{title}</h3>
      {description ? <p className="mt-1 text-sm text-zinc-500">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
