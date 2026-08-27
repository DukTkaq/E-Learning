import { useCallback, useEffect, useState } from "react";
import {
  CircleDollarSign,
  ShoppingBag,
  Target,
  TrendingUp,
} from "lucide-react";
import toast from "react-hot-toast";
import RevenueChart from "../../components/instructor/RevenueChart";
import RevenueCourseList from "../../components/instructor/RevenueCourseList";
import { fetchRevenue } from "../../features/instructor/instructorApi";
import { clampPage } from "../../utils/pagination";

const PAGE_LIMIT = 6;
const EMPTY_PAGINATION = {
  page: 1,
  limit: PAGE_LIMIT,
  total_items: 0,
  total_pages: 0,
};
const currency = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
});

export default function RevenueDashboardPage() {
  const [data, setData] = useState({
    summary: {},
    courses: [],
    trend: [],
    pagination: EMPTY_PAGINATION,
  });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchRevenue({
        page,
        limit: PAGE_LIMIT,
      });
      setData(response.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not load revenue.");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  const pagination = data.pagination || EMPTY_PAGINATION;
  const validPage = clampPage(page, pagination.total_pages);
  useEffect(() => {
    if (!loading && page !== validPage) setPage(validPage);
  }, [loading, page, validPage]);

  const cards = [
    {
      label: "Total revenue",
      value: currency.format(Number(data.summary?.total_revenue || 0)),
      icon: CircleDollarSign,
    },
    {
      label: "Successful sales",
      value: data.summary?.total_sales || 0,
      icon: ShoppingBag,
    },
    {
      label: "Average order value",
      value: currency.format(Number(data.summary?.average_order_value || 0)),
      icon: TrendingUp,
    },
    {
      label: "Courses with sales",
      value: `${data.summary?.courses_with_sales || 0}/${data.summary?.course_count || 0}`,
      icon: Target,
    },
  ];

  return (
    <section>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Revenue overview</h1>
        <p className="mt-2 text-gray-500">
          Track all-time successful payments for your courses.
        </p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon }) => (
          <article
            key={label}
            className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
          >
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-secondary/15 text-primary">
              <Icon size={22} />
            </div>
            <p className="text-sm text-gray-500">{label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {loading ? "—" : value}
            </p>
          </article>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-bold text-slate-800">Revenue trend</h2>
              <p className="mt-1 text-sm text-gray-500">
                All-time successful revenue by payment date.
              </p>
            </div>
            {data.summary?.top_course && (
              <div className="max-w-xs rounded-xl bg-primary/5 px-3 py-2 text-right">
                <p className="text-xs font-semibold uppercase text-gray-400">
                  Top course
                </p>
                <p className="truncate text-sm font-bold text-primary">
                  {data.summary.top_course.title}
                </p>
              </div>
            )}
          </div>
          <RevenueChart
            data={(data.trend || []).map((row) => ({
              ...row,
              revenue: Number(row.revenue),
              sales: Number(row.sales),
            }))}
          />
        </article>

        <RevenueCourseList
          courses={data.courses || []}
          pagination={pagination}
          loading={loading}
          onPageChange={setPage}
        />
      </div>
    </section>
  );
}
