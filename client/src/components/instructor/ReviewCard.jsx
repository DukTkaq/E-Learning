import { useEffect, useState } from 'react';
import { LoaderCircle, MessageSquareReply, Star } from 'lucide-react';

export default function ReviewCard({ review, saving, onReply }) {
  const [reply, setReply] = useState(review.instructor_reply || '');
  useEffect(() => setReply(review.instructor_reply || ''), [review]);

  return (
    <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex flex-col justify-between gap-3 sm:flex-row">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary font-bold text-white">{(review.User?.name || 'S').charAt(0).toUpperCase()}</div>
          <div><p className="font-semibold text-slate-800">{review.User?.name || 'Student'}</p><p className="text-sm text-gray-500">{review.Course?.title}</p></div>
        </div>
        <div className="flex items-center gap-1 text-accent">{Array.from({ length: 5 }, (_, index) => <Star key={index} size={17} fill={index < review.rating ? 'currentColor' : 'none'} className={index < review.rating ? '' : 'text-gray-300'} />)}</div>
      </div>

      <blockquote className="my-4 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">{review.comment || 'No written comment.'}</blockquote>

      <label className="block text-sm font-semibold text-slate-700">Instructor reply
        <textarea value={reply} onChange={(event) => setReply(event.target.value)} rows={3} maxLength={2000} className="mt-2 w-full resize-y rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" placeholder="Thank the student or address their feedback..." />
      </label>
      <div className="mt-3 flex items-center justify-between"><span className="text-xs text-gray-400">{reply.length}/2000</span><button type="button" onClick={() => onReply(review.id, reply)} disabled={saving || !reply.trim()} className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-secondary px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{saving ? <LoaderCircle className="animate-spin" size={16} /> : <MessageSquareReply size={16} />} Save reply</button></div>
    </article>
  );
}
