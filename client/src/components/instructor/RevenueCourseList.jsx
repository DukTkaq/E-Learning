import { RotateCcw, Search } from 'lucide-react';
import Pagination from '../common/Pagination';

const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

export default function RevenueCourseList({
  courses,
  pagination,
  searchInput,
  sort,
  activity,
  loading,
  onSearchInput,
  onSearch,
  onSort,
  onActivity,
  onReset,
  onPageChange,
}) {
  const hasFilters = Boolean(searchInput.trim() || sort !== 'revenue_desc' || activity !== 'sold');

  return (
    <article className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="border-b border-gray-100 p-5">
        <h2 className="font-bold text-slate-800">Revenue by course</h2>
        <p className="mt-1 text-sm text-gray-500">Compare course performance within the selected date range.</p>
      </div>

      <form onSubmit={onSearch} className="grid gap-2 border-b border-gray-100 p-4 sm:grid-cols-2 xl:grid-cols-1">
        <label className="flex items-center rounded-xl border border-gray-200 bg-slate-50 px-3 focus-within:border-primary">
          <Search size={17} className="text-gray-400" />
          <input type="search" value={searchInput} onChange={(event) => onSearchInput(event.target.value)} placeholder="Search course..." className="min-w-0 flex-1 bg-transparent px-2 py-2.5 text-sm outline-none" />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <select value={activity} onChange={(event) => onActivity(event.target.value)} className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-600 outline-none focus:border-primary">
            <option value="sold">Has sales</option>
            <option value="no_sales">No sales</option>
            <option value="all">All courses</option>
          </select>
          <select value={sort} onChange={(event) => onSort(event.target.value)} className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-600 outline-none focus:border-primary">
            <option value="revenue_desc">Highest revenue</option>
            <option value="sales_desc">Most sales</option>
            <option value="title_asc">Course name</option>
          </select>
        </div>
        <div className="flex gap-2 sm:col-span-2 xl:col-span-1">
          <button type="submit" disabled={loading} className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">Search</button>
          {hasFilters && <button type="button" onClick={onReset} disabled={loading} className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-semibold text-gray-500 hover:text-primary disabled:opacity-60"><RotateCcw size={15} /> Reset</button>}
        </div>
      </form>

      <div className="divide-y divide-gray-100">
        {loading ? <p className="p-10 text-center text-sm text-gray-400">Loading course revenue...</p> : courses.map((course) => (
          <div key={course.id} className="flex items-center justify-between gap-4 p-4">
            <div className="min-w-0">
              <p className="truncate font-semibold text-slate-700">{course.title}</p>
              <p className="text-xs text-gray-500">{course.sales} successful sale{Number(course.sales) === 1 ? '' : 's'}</p>
            </div>
            <p className="whitespace-nowrap font-bold text-primary">{currency.format(Number(course.revenue))}</p>
          </div>
        ))}
        {!loading && !courses.length && <p className="p-10 text-center text-sm text-gray-400">No matching course revenue.</p>}
      </div>

      <div className="border-t border-gray-100 p-4">
        <Pagination page={pagination.page} totalPages={pagination.total_pages} onPageChange={onPageChange} disabled={loading} ariaLabel="Revenue course pagination" />
      </div>
    </article>
  );
}
