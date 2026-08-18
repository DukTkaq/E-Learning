import { Image, Trash2 } from 'lucide-react';
import { resolveAssetUrl } from '../../utils/assets';

const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

export default function CartItemCard({ item, removing, onRemove }) {
  const course = item.Course;
  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
      <div className="h-28 w-full shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-primary/15 to-secondary/15 sm:h-24 sm:w-36">
        {course?.thumbnail ? <img src={resolveAssetUrl(course.thumbnail)} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-primary"><Image size={26} /></div>}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold uppercase tracking-wide text-secondary">{course?.Category?.name || 'Course'}</p>
        <h2 className="mt-1 truncate text-lg font-bold text-slate-800">{course?.title}</h2>
        <p className="mt-2 font-bold text-primary">{currency.format(Number(course?.price || 0))}</p>
      </div>
      <button type="button" disabled={removing} onClick={() => onRemove(course.id)} className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-semibold text-error transition-colors hover:bg-error/10 disabled:opacity-50"><Trash2 size={18} /> Remove</button>
    </article>
  );
}
