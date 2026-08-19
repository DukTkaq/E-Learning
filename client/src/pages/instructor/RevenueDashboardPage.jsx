import { useCallback, useEffect, useState } from 'react';
import { BookOpen, CircleDollarSign, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';
import RevenueChart from '../../components/instructor/RevenueChart';
import { fetchRevenue } from '../../features/instructor/instructorApi';

const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

export default function RevenueDashboardPage() {
  const [data, setData] = useState({ summary: {}, courses: [], trend: [] });
  const [filters, setFilters] = useState({ from: '', to: '' });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchRevenue(filters);
      setData(response.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not load revenue.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const cards = [
    { label: 'Total revenue', value: currency.format(Number(data.summary?.total_revenue || 0)), icon: CircleDollarSign },
    { label: 'Successful sales', value: data.summary?.total_sales || 0, icon: ShoppingBag },
    { label: 'Courses', value: data.summary?.course_count || 0, icon: BookOpen },
  ];

  return (
    <section>
      <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Revenue overview</h1>
          <p className="mt-2 text-gray-500">Only successful payments for your own courses are included.</p>
        </div>
        <div className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
          {['from', 'to'].map((field) => (
            <label key={field} className="text-xs font-semibold uppercase tracking-wide text-gray-500">{field}
              <input type="date" value={filters[field]} onChange={(event) => setFilters((current) => ({ ...current, [field]: event.target.value }))} className="mt-1 block rounded-lg border border-gray-200 px-3 py-2 text-sm font-normal normal-case text-slate-700 outline-none focus:border-primary" />
            </label>
          ))}
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {cards.map(({ label, value, icon: Icon }) => (
          <article key={label} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-secondary/15 text-primary"><Icon size={22} /></div>
            <p className="text-sm text-gray-500">{label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{loading ? '—' : value}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="font-bold text-slate-800">Revenue trend</h2>
          <RevenueChart data={(data.trend || []).map((row) => ({ ...row, revenue: Number(row.revenue) }))} />
        </article>
        <article className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 p-5"><h2 className="font-bold text-slate-800">By course</h2></div>
          <div className="max-h-80 divide-y divide-gray-100 overflow-y-auto">
            {(data.courses || []).map((course) => (
              <div key={course.id} className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0"><p className="truncate font-semibold text-slate-700">{course.title}</p><p className="text-xs text-gray-500">{course.sales} sale(s)</p></div>
                <p className="whitespace-nowrap font-bold text-primary">{currency.format(Number(course.revenue))}</p>
              </div>
            ))}
            {!data.courses?.length && <p className="p-8 text-center text-sm text-gray-400">No courses found.</p>}
          </div>
        </article>
      </div>
    </section>
  );
}
