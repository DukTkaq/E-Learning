import { ArrowDown, ArrowUp, Edit3, Trash2, Trophy, Video } from 'lucide-react';

export default function LessonTable({ lessons, loading, onEdit, onDelete, onMoveUp, onMoveDown }) {
  if (loading) {
    return <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center text-gray-500 shadow-sm">Loading lessons...</div>;
  }

  if (!lessons.length) {
    return (
      <div className="rounded-2xl border border-dashed border-primary/25 bg-white p-12 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Video size={26} /></div>
        <h3 className="font-bold text-slate-800">No lessons yet</h3>
        <p className="mt-1 text-sm text-gray-500">Create your first lesson to start building course content.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left">
          <thead className="border-b border-gray-100 bg-slate-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-6 py-4 font-semibold">#</th>
              <th className="px-6 py-4 font-semibold">Lesson</th>
              <th className="px-6 py-4 font-semibold">Video URL</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {lessons.map((lesson, index) => (
              <tr key={lesson.id} className="transition-colors hover:bg-slate-50/70">
                <td className="px-6 py-4 text-sm font-medium text-gray-500">{lesson.order_index + 1}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      {lesson.is_final ? <Trophy size={18} /> : <Video size={18} />}
                    </div>
                    <span className="font-semibold text-slate-800">{lesson.title}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 max-w-[200px] truncate">{lesson.video_url}</td>
                <td className="px-6 py-4">
                  {lesson.is_final ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700">
                      <Trophy size={12} /> Final
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">Regular</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-end gap-1">
                    {!lesson.is_final && (
                      <>
                        <button type="button" onClick={() => onMoveUp(lesson)} disabled={index === 0} className="rounded-lg p-2 text-gray-400 hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-30" title="Move up">
                          <ArrowUp size={16} />
                        </button>
                        <button type="button" onClick={() => onMoveDown(lesson)} disabled={index === lessons.length - 2} className="rounded-lg p-2 text-gray-400 hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-30" title="Move down">
                          <ArrowDown size={16} />
                        </button>
                      </>
                    )}
                    <button type="button" onClick={() => onEdit(lesson)} className="rounded-lg p-2 text-gray-400 hover:bg-primary/10 hover:text-primary" title="Edit">
                      <Edit3 size={16} />
                    </button>
                    <button type="button" onClick={() => onDelete(lesson)} className="rounded-lg p-2 text-gray-400 hover:bg-error/10 hover:text-error" title="Delete">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
