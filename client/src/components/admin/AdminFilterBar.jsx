import { RotateCcw, Search } from 'lucide-react';

export default function AdminFilterBar({
  search,
  searchPlaceholder,
  disabled,
  hasFilters,
  children,
  onSearchChange,
  onSearch,
  onClear,
}) {
  return (
    <form onSubmit={onSearch} className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <label className="flex min-w-0 flex-1 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10">
          <Search className="shrink-0 text-slate-400" size={18} />
          <input
            type="search"
            aria-label={searchPlaceholder}
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-slate-700 outline-none"
          />
        </label>

        {children}

        <button type="submit" disabled={disabled} className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60">
          Search
        </button>
        {hasFilters && (
          <button type="button" onClick={onClear} disabled={disabled} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-500 hover:border-primary/30 hover:text-primary disabled:opacity-60">
            <RotateCcw size={16} /> Reset
          </button>
        )}
      </div>
    </form>
  );
}
