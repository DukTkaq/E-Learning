import { Loader2, Ticket, Trash2 } from 'lucide-react';

export default function VoucherTable({
  vouchers,
  loading,
  deletingId,
  hasFilters,
  onDelete,
  onCreate,
}) {
  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl bg-white p-14 text-center text-gray-500">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p>Loading vouchers...</p>
      </div>
    );
  }

  if (!vouchers.length) {
    return (
      <div className="rounded-2xl border border-dashed border-primary/25 bg-white p-14 text-center">
        <Ticket className="mx-auto text-primary" size={38} />
        <h2 className="mt-4 text-xl font-bold text-slate-800">
          {hasFilters ? 'No matching vouchers' : 'No vouchers yet'}
        </h2>
        <p className="mb-6 mt-1 text-gray-500">
          {hasFilters
            ? 'Try another keyword or clear the current filters.'
            : 'Create your first voucher to attract more students.'}
        </p>
        {!hasFilters && (
          <button
            type="button"
            onClick={onCreate}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-2.5 font-semibold text-white shadow-sm hover:opacity-90"
          >
            Create Voucher
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
      <table className="w-full min-w-[760px] text-left text-sm text-gray-600">
        <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
          <tr>
            <th className="px-6 py-4 font-semibold">Code</th>
            <th className="px-6 py-4 font-semibold">Discount</th>
            <th className="px-6 py-4 font-semibold">Target Course</th>
            <th className="px-6 py-4 font-semibold">Created At</th>
            <th className="px-6 py-4 text-right font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {vouchers.map((voucher) => (
            <tr key={voucher.id} className="transition-colors hover:bg-gray-50">
              <td className="px-6 py-4 font-bold text-primary">{voucher.code}</td>
              <td className="px-6 py-4">
                <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                  {voucher.discount_percent}% OFF
                </span>
              </td>
              <td className="px-6 py-4 text-slate-700">
                {voucher.Course?.title || <span className="italic text-gray-400">All Courses</span>}
              </td>
              <td className="px-6 py-4">
                {new Date(voucher.created_at).toLocaleDateString('vi-VN')}
              </td>
              <td className="px-6 py-4 text-right">
                <button
                  type="button"
                  onClick={() => onDelete(voucher)}
                  disabled={deletingId === voucher.id}
                  className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-error/10 hover:text-error disabled:opacity-50"
                  title="Delete Voucher"
                >
                  {deletingId === voucher.id
                    ? <Loader2 size={18} className="animate-spin" />
                    : <Trash2 size={18} />}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
