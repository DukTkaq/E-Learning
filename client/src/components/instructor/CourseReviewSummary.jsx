import { CheckCircle2, Clock3, MessageSquareText, Star } from 'lucide-react';

const ITEMS = [
  { key: 'total', label: 'Total reviews', icon: MessageSquareText, color: 'text-primary', background: 'bg-primary/10' },
  { key: 'awaiting_reply', label: 'Awaiting reply', icon: Clock3, color: 'text-amber-600', background: 'bg-amber-50' },
  { key: 'replied', label: 'Replied', icon: CheckCircle2, color: 'text-emerald-600', background: 'bg-emerald-50' },
  { key: 'average_rating', label: 'Average rating', icon: Star, color: 'text-accent', background: 'bg-amber-50' },
];

export default function CourseReviewSummary({ summary }) {
  return (
    <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {ITEMS.map(({ key, label, icon: Icon, color, background }) => (
        <div key={key} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${background} ${color}`}>
            <Icon size={21} fill={key === 'average_rating' ? 'currentColor' : 'none'} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
            <p className="mt-1 text-xl font-bold text-slate-900">
              {key === 'average_rating' ? `${Number(summary[key] || 0).toFixed(1)} / 5` : summary[key] || 0}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
