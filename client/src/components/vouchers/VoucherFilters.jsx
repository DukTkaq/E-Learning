import { RotateCcw, Search } from 'lucide-react';

export default function VoucherFilters({
  search,
  scope,
  discount,
  disabled,
  onSearchChange,
  onSearch,
  onScopeChange,
  onDiscountChange,
  onClear,
}) {
  const hasFilters = Boolean(search.trim() || scope || discount);

  return (
    <form onSubmit={onSearch} className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_210px_190px_auto]">
        <label className="flex min-w-0 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10">
          <Search className="shrink-0 text-slate-400" size={18} />
          <input
            type="search"
            aria-label="Search vouchers"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search code or course..."
            className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-slate-700 outline-none"
          />
        </label>

        <select
          aria-label="Filter by target"
          value={scope}
          disabled={disabled}
          onChange={(event) => onScopeChange(event.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-600 outline-none focus:border-primary disabled:opacity-60"
        >
          <option value="">All targets</option>
          <option value="all_courses">All-course vouchers</option>
          <option value="specific_course">Course-specific vouchers</option>
        </select>

        <select
          aria-label="Filter by discount"
          value={discount}
          disabled={disabled}
          onChange={(event) => onDiscountChange(event.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-600 outline-none focus:border-primary disabled:opacity-60"
        >
          <option value="">All discounts</option>
          <option value="low">1% - 20%</option>
          <option value="medium">21% - 50%</option>
          <option value="high">51% - 100%</option>
        </select>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={disabled}
            className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60 lg:flex-none"
          >
            Search
          </button>
          {hasFilters && (
            <button
              type="button"
              onClick={onClear}
              disabled={disabled}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-500 hover:border-primary/30 hover:text-primary disabled:opacity-60"
            >
              <RotateCcw size={16} /> Reset
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
