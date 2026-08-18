import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const compactCurrency = (value) => new Intl.NumberFormat('vi-VN', { notation: 'compact', maximumFractionDigits: 1 }).format(value);

export default function RevenueChart({ data }) {
  if (!data.length) return <div className="flex h-72 items-center justify-center text-sm text-gray-400">Revenue trend will appear after the first sale.</div>;

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
          <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} axisLine={false} />
          <YAxis tickFormatter={compactCurrency} tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} axisLine={false} />
          <Tooltip formatter={(value) => [`${Number(value).toLocaleString('vi-VN')} ₫`, 'Revenue']} />
          <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={3} fill="url(#revenueGradient)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
