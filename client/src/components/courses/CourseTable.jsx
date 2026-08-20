import { Image } from 'lucide-react';
import CourseStatusBadge from './CourseStatusBadge';
import CourseActionButtons from './CourseActionButtons';
import { resolveAssetUrl } from '../../utils/assets';

const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

export default function CourseTable({ courses, loading, submittingCourseId, onView, onEdit, onHide, onViewLessons, onSubmitForApproval }) {
  if (loading) {
    return <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center text-gray-500 shadow-sm">Loading courses...</div>;
  }

  if (!courses.length) {
    return (
      <div className="rounded-2xl border border-dashed border-primary/25 bg-white p-12 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Image size={26} /></div>
        <h3 className="font-bold text-slate-800">No courses yet</h3>
        <p className="mt-1 text-sm text-gray-500">Create your first course to start the approval process.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left">
          <thead className="border-b border-gray-100 bg-slate-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-6 py-4 font-semibold">Course</th>
              <th className="px-6 py-4 font-semibold">Category</th>
              <th className="px-6 py-4 font-semibold">Price</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {courses.map((course) => (
              <tr key={course.id} className="transition-colors hover:bg-slate-50/70">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-16 overflow-hidden rounded-lg bg-gradient-to-br from-primary/15 to-secondary/15">
                      {course.thumbnail ? <img src={resolveAssetUrl(course.thumbnail)} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-primary"><Image size={20} /></div>}
                    </div>
                    <div className="max-w-xs">
                      <p className="truncate font-semibold text-slate-800">{course.title}</p>
                      <p className="mt-0.5 truncate text-xs text-gray-500">Updated {new Date(course.updated_at || course.created_at).toLocaleDateString('vi-VN')}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{course.Category?.name || '—'}</td>
                <td className="px-6 py-4 text-sm font-semibold text-slate-700">{currency.format(Number(course.price))}</td>
                <td className="px-6 py-4"><CourseStatusBadge status={course.status} /></td>
                <td className="px-6 py-4">
                  <CourseActionButtons
                    course={course}
                    submitting={submittingCourseId === course.id}
                    onView={onView}
                    onEdit={onEdit}
                    onHide={onHide}
                    onViewLessons={onViewLessons}
                    onSubmitForApproval={onSubmitForApproval}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
