import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import CourseCurriculum from '../../components/courses/CourseCurriculum';
import CourseDetailOverview from '../../components/courses/CourseDetailOverview';
import { fetchCourseDetail } from '../../features/catalog/catalogApi';

export default function AdminCoursePreviewPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const loadCourse = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const response = await fetchCourseDetail(courseId);
      setCourse(response.data.course);
    } catch (error) {
      const message = error.response?.data?.message || 'Could not load course details.';
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => { loadCourse(); }, [loadCourse]);

  return (
    <section>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={() => navigate('/admin/approvals')} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 font-semibold text-slate-600 shadow-sm hover:border-primary/30 hover:text-primary">
          <ArrowLeft size={18} /> Back to Approvals
        </button>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={loadCourse} disabled={loading} className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 font-semibold text-slate-500 hover:bg-white hover:text-primary disabled:opacity-50">
            <RefreshCw size={17} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {loading && (
        <div className="rounded-3xl border border-slate-100 bg-white p-16 text-center text-slate-500 shadow-sm">Loading course details...</div>
      )}

      {!loading && errorMessage && (
        <div className="rounded-3xl border border-red-100 bg-white p-12 text-center shadow-sm">
          <h1 className="text-xl font-bold text-slate-900">Course details unavailable</h1>
          <p className="mt-2 text-slate-500">{errorMessage}</p>
          <button type="button" onClick={loadCourse} className="mt-5 rounded-xl bg-primary px-5 py-2.5 font-semibold text-white hover:bg-primary-hover">Try again</button>
        </div>
      )}

      {!loading && course && (
        <>
          <div className="mb-4 rounded-xl bg-blue-50 p-4 text-blue-800 flex items-center justify-between border border-blue-100">
            <div>
              <strong className="block text-sm">Preview Mode</strong>
              <span className="text-sm"> You are viewing this course exactly as the instructor sees it.</span>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${course.status === 'Approved' ? 'bg-success/20 text-success' : course.status === 'Rejected' ? 'bg-error/20 text-error' : 'bg-amber-100 text-amber-700'}`}>{course.status}</span>
          </div>
          <CourseDetailOverview course={course} />
          <CourseCurriculum lessons={course.Lessons || []} />
        </>
      )}
    </section>
  );
}
