export default function AdminPageHeader({
  icon: Icon,
  eyebrow,
  title,
  description,
  summary,
  actions,
}) {
  return (
    <header className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
      <div>
        <div className="mb-2 flex items-center gap-2 text-primary">
          {Icon && <Icon size={20} />}
          <span className="text-sm font-bold uppercase tracking-wider">
            {eyebrow}
          </span>
        </div>
        <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500">
          <span>{description}</span>
          {summary && (
            <span className="font-semibold text-primary">{summary}</span>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-3">{actions}</div>
      )}
    </header>
  );
}
