import Pagination from '../common/Pagination';

const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

export default function RevenueCourseList({
  courses,
  pagination,
  loading,
  onPageChange,
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="border-b border-gray-100 p-5">
        <h2 className="font-bold text-slate-800">Revenue by course</h2>
        <p className="mt-1 text-sm text-gray-500">All-time courses ranked by successful revenue.</p>
      </div>

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
        {!loading && !courses.length && <p className="p-10 text-center text-sm text-gray-400">No successful course revenue yet.</p>}
      </div>

      <div className="border-t border-gray-100 p-4">
        <Pagination page={pagination.page} totalPages={pagination.total_pages} onPageChange={onPageChange} disabled={loading} ariaLabel="Revenue course pagination" />
      </div>
    </article>
  );
}
