import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, ListVideo, RefreshCw } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import CourseCurriculum from '../../components/courses/CourseCurriculum';
import CourseDetailOverview from '../../components/courses/CourseDetailOverview';
import { fetchInstructorCourse } from '../../features/courses/courseApi';

export default function CourseDetailPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const loadCourse = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const response = await fetchInstructorCourse(courseId);
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
        <button type="button" onClick={() => navigate('/instructor/courses')} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 font-semibold text-slate-600 shadow-sm hover:border-primary/30 hover:text-primary">
          <ArrowLeft size={18} /> Back to courses
        </button>
        <div className="flex flex-wrap gap-2">
          {course && (
            <button type="button" onClick={() => navigate(`/instructor/courses/${course.id}/lessons`)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 font-semibold text-slate-600 shadow-sm hover:border-primary/30 hover:text-primary">
              <ListVideo size={18} /> Manage curriculum
            </button>
          )}
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
          <CourseDetailOverview course={course} />
          <CourseCurriculum lessons={course.Lessons || []} />
        </>
      )}
    </section>
  );
}
