import { Image, PlayCircle } from 'lucide-react';
import { resolveAssetUrl } from '../../utils/assets';

const clampProgress = (value) => Math.min(100, Math.max(0, Number(value) || 0));

export default function EnrolledCourseCard({ enrollment }) {
  const course = enrollment.course;
  const progress = clampProgress(enrollment.progress);

  return (
    <article className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="aspect-video bg-gradient-to-br from-primary/10 to-secondary/10">
        {course?.thumbnail ? (
          <img src={resolveAssetUrl(course.thumbnail)} alt={course.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-primary"><Image size={34} /></div>
        )}
      </div>

      <div className="p-5">
        <p className="text-xs font-bold uppercase tracking-wide text-secondary">{course?.Category?.name || 'Course'}</p>
        <h2 className="mt-1 line-clamp-2 text-lg font-bold text-slate-900">{course?.title}</h2>
        <p className="mt-2 text-sm text-gray-500">Instructor: {course?.Instructor?.name || 'Instructor'}</p>

        <div className="mt-5">
          <div className="mb-1 flex justify-between text-xs font-semibold text-gray-500">
            <span>Progress</span><span>{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-gradient-to-r from-primary to-secondary" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <button type="button" className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-secondary px-4 py-2.5 font-semibold text-white">
          <PlayCircle size={18} /> Continue learning
        </button>
      </div>
    </article>
  );
}
