import { useEffect, useState } from 'react';
import { CheckCircle2, Clock3, Edit3, LoaderCircle, MessageSquareReply, Star } from 'lucide-react';

export default function ReviewCard({ review, courseTitle, saving, onReply }) {
  const savedReply = review.instructor_reply?.trim() || '';
  const [reply, setReply] = useState(savedReply);
  const [editing, setEditing] = useState(!savedReply);

  useEffect(() => {
    const nextReply = review.instructor_reply?.trim() || '';
    setReply(nextReply);
    setEditing(!nextReply);
  }, [review.instructor_reply]);

  const saveReply = async () => {
    const saved = await onReply(review.id, reply);
    if (saved) setEditing(false);
  };

  return (
    <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary font-bold text-white">{(review.User?.name || 'S').charAt(0).toUpperCase()}</div>
          <div>
            <p className="font-semibold text-slate-800">{review.User?.name || 'Student'}</p>
            <p className="text-sm text-gray-500">{courseTitle || review.Course?.title}</p>
            {review.created_at && <p className="mt-0.5 text-xs text-gray-400">Reviewed {new Date(review.created_at).toLocaleDateString('vi-VN')}</p>}
          </div>
        </div>
        <div className="flex flex-row items-center justify-between gap-3 sm:flex-col sm:items-end">
          <div className="flex items-center gap-1 text-accent">{Array.from({ length: 5 }, (_, index) => <Star key={index} size={17} fill={index < review.rating ? 'currentColor' : 'none'} className={index < review.rating ? '' : 'text-gray-300'} />)}</div>
          {savedReply ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600"><CheckCircle2 size={13} /> Replied</span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-600"><Clock3 size={13} /> Awaiting reply</span>
          )}
        </div>
      </div>

      <blockquote className="my-4 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">{review.comment || 'No written comment.'}</blockquote>

      {!editing && savedReply ? (
        <div>
          <p className="text-sm font-semibold text-slate-700">Instructor reply</p>
          <div className="mt-2 rounded-xl border border-primary/15 bg-primary/5 px-4 py-3 text-sm leading-6 text-slate-700">
            {savedReply}
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-xs text-gray-400">
              {review.replied_at ? `Saved ${new Date(review.replied_at).toLocaleString('vi-VN')}` : 'Reply saved'}
            </span>
            <button type="button" onClick={() => setEditing(true)} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/10">
              <Edit3 size={16} /> Edit reply
            </button>
          </div>
        </div>
      ) : (
        <div>
          <label className="block text-sm font-semibold text-slate-700">Instructor reply
            <textarea value={reply} onChange={(event) => setReply(event.target.value)} rows={3} maxLength={2000} className="mt-2 w-full resize-y rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" placeholder="Thank the student or address their feedback..." />
          </label>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-gray-400">{reply.length}/2000</span>
            <div className="flex items-center gap-2">
              {savedReply && (
                <button type="button" onClick={() => { setReply(savedReply); setEditing(false); }} disabled={saving} className="rounded-lg px-3 py-2 text-sm font-semibold text-gray-500 hover:bg-gray-100">
                  Cancel
                </button>
              )}
              <button type="button" onClick={saveReply} disabled={saving || !reply.trim()} className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-secondary px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
                {saving ? <LoaderCircle className="animate-spin" size={16} /> : <MessageSquareReply size={16} />} Save reply
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
