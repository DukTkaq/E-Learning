import { CheckCircle2, Image, Mail, UserRound, XCircle, Trash2 } from 'lucide-react';
import CourseStatusBadge from '../courses/CourseStatusBadge';
import { resolveAssetUrl } from '../../utils/assets';

const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

export default function CourseApprovalCard({ course, reviewing, onReview, onHide }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="grid md:grid-cols-[220px_1fr]">
        <div className="aspect-video bg-gradient-to-br from-primary/10 to-secondary/10 md:aspect-auto md:min-h-52">{course.thumbnail ? <img src={resolveAssetUrl(course.thumbnail)} alt={course.title} className="h-full w-full object-cover" /> : <div className="flex h-full min-h-44 items-center justify-center text-primary"><Image size={34} /></div>}</div>
        <div className="flex min-w-0 flex-col p-5">
          <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs font-bold uppercase tracking-wide text-primary">{course.Category?.name || 'Uncategorized'}</p><h2 className="mt-1 text-xl font-bold text-slate-900">{course.title}</h2></div><CourseStatusBadge status={course.status} /></div>
          <p className="mt-3 line-clamp-3 text-sm leading-6 text-gray-500">{course.description || 'No course description provided.'}</p>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-500"><span className="inline-flex items-center gap-1.5"><UserRound size={15} /> {course.Instructor?.name || 'Instructor'}</span><span className="inline-flex items-center gap-1.5"><Mail size={15} /> {course.Instructor?.email || '—'}</span><strong className="text-primary">{currency.format(Number(course.price || 0))}</strong></div>
          <div className="mt-auto flex justify-end gap-3 border-t border-gray-100 pt-4">
            {course.status !== 'Hidden' && (
              <button type="button" disabled={reviewing} onClick={() => onHide(course)} className="inline-flex items-center gap-2 rounded-xl bg-error/10 px-4 py-2.5 font-semibold text-error hover:bg-error/15 disabled:opacity-50">
                <Trash2 size={18} /> Delete (Violation)
              </button>
            )}
            {course.status === 'Pending' && (
              <>
                <button type="button" disabled={reviewing} onClick={() => onReview(course, 'Rejected')} className="inline-flex items-center gap-2 rounded-xl bg-gray-100 px-4 py-2.5 font-semibold text-gray-600 hover:bg-gray-200 disabled:opacity-50"><XCircle size={18} /> Reject</button>
                <button type="button" disabled={reviewing} onClick={() => onReview(course, 'Approved')} className="inline-flex items-center gap-2 rounded-xl bg-success px-4 py-2.5 font-semibold text-white shadow-lg shadow-success/20 hover:opacity-90 disabled:opacity-50"><CheckCircle2 size={18} /> Approve</button>
              </>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
