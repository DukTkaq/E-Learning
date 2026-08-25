import { RotateCcw, Search } from 'lucide-react';

export default function CourseReviewFilters({
  search,
  replyStatus,
  rating,
  sort,
  disabled,
  onSearchChange,
  onSearch,
  onReplyStatusChange,
  onRatingChange,
  onSortChange,
  onClear,
}) {
  const hasFilters = Boolean(search.trim() || replyStatus || rating || sort !== 'newest');

  return (
    <form onSubmit={onSearch} className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-3 xl:grid-cols-[minmax(260px,1fr)_170px_150px_180px_auto]">
        <label className="flex min-w-0 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10">
          <Search className="shrink-0 text-slate-400" size={18} />
          <input
            type="search"
            value={search}
            maxLength={100}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search student or review..."
            className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-slate-700 outline-none"
          />
        </label>

        <select aria-label="Filter by reply status" value={replyStatus} disabled={disabled} onChange={(event) => onReplyStatusChange(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-600 outline-none focus:border-primary disabled:opacity-60">
          <option value="">All replies</option>
          <option value="awaiting">Awaiting reply</option>
          <option value="replied">Replied</option>
        </select>

        <select aria-label="Filter by rating" value={rating} disabled={disabled} onChange={(event) => onRatingChange(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-600 outline-none focus:border-primary disabled:opacity-60">
          <option value="">All ratings</option>
          {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} stars</option>)}
        </select>

        <select aria-label="Sort reviews" value={sort} disabled={disabled} onChange={(event) => onSortChange(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-600 outline-none focus:border-primary disabled:opacity-60">
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="rating_desc">Highest rating</option>
          <option value="rating_asc">Lowest rating</option>
        </select>

        <div className="flex gap-2">
          <button type="submit" disabled={disabled} className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60 xl:flex-none">
            Search
          </button>
          {hasFilters && (
            <button type="button" onClick={onClear} disabled={disabled} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-500 hover:border-primary/30 hover:text-primary disabled:opacity-60">
              <RotateCcw size={16} /> Reset
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
