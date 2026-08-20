import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, LockKeyhole, Plus, RefreshCw, Video } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import LessonFormModal from '../../components/lessons/LessonFormModal';
import LessonTable from '../../components/lessons/LessonTable';
import { fetchLessons, createLesson, updateLesson, deleteLesson, moveLessonUp, moveLessonDown } from '../../features/lessons/lessonApi';
import { fetchInstructorCourse } from '../../features/courses/courseApi';
import { canEditCourse, getCourseReadOnlyNotice } from '../../features/courses/courseStatus';

export default function LessonManagementPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingLesson, setEditingLesson] = useState(undefined);
  const [modalOpen, setModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [lessonResponse, courseResponse] = await Promise.all([
        fetchLessons(courseId),
        fetchInstructorCourse(courseId),
      ]);
      setLessons(lessonResponse.data.lessons || []);
      setCourse(courseResponse.data.course || null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not load lessons.');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => { loadData(); }, [loadData]);

  const readOnly = Boolean(course && !canEditCourse(course.status));
  const readOnlyNotice = getCourseReadOnlyNotice(course?.status);

  const openCreate = () => { setEditingLesson(undefined); setModalOpen(true); };
  const openEdit = (lesson) => { setEditingLesson(lesson); setModalOpen(true); };

  const submit = async (payload) => {
    setSubmitting(true);
    try {
      if (editingLesson) {
        await updateLesson(courseId, editingLesson.id, payload);
        toast.success('Lesson updated successfully.');
      } else {
        await createLesson(courseId, payload);
        toast.success('Lesson created successfully.');
      }
      setModalOpen(false);
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not save the lesson.');
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (lesson) => {
    const result = await Swal.fire({
      title: 'Delete this lesson?',
      text: `"${lesson.title}" will be permanently removed.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete lesson',
      confirmButtonColor: '#ef4444',
    });
    if (!result.isConfirmed) return;

    try {
      await deleteLesson(courseId, lesson.id);
      toast.success('Lesson deleted successfully.');
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not delete the lesson.');
    }
  };

  const moveUp = async (lesson) => {
    try {
      await moveLessonUp(courseId, lesson.id);
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not move lesson.');
    }
  };

  const moveDown = async (lesson) => {
    try {
      await moveLessonDown(courseId, lesson.id);
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not move lesson.');
    }
  };

  const manageQuiz = (lesson) => {
    navigate(`/instructor/courses/${courseId}/lessons/${lesson.id}/quiz`);
  };

  return (
    <section>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <button type="button" onClick={() => navigate('/instructor/courses')} className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-primary transition">
            <ArrowLeft size={16} /> Back to courses
          </button>
          <div className="mb-2 flex items-center gap-2 text-primary"><Video size={20} /><span className="text-sm font-bold uppercase tracking-wider">Lesson Management</span></div>
          <h1 className="text-3xl font-bold text-slate-900">{course?.title || 'Loading...'}</h1>
          <p className="mt-2 text-gray-500">{lessons.length} lesson{lessons.length === 1 ? '' : 's'} · {lessons.filter((l) => l.is_final).length > 0 ? 'Final lesson set' : 'No final lesson yet'}</p>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={loadData} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 font-semibold text-gray-600 shadow-sm hover:border-primary/30 hover:text-primary"><RefreshCw size={18} /> Refresh</button>
          {!readOnly && (
            <button type="button" onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-secondary px-4 py-2.5 font-semibold text-white shadow-lg shadow-primary/20 hover:opacity-90"><Plus size={18} /> Create lesson</button>
          )}
        </div>
      </div>

      {readOnly && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
          <LockKeyhole className="mt-0.5 shrink-0" size={18} />
          <p className="text-sm"><span className="font-bold">{readOnlyNotice?.title}</span> {readOnlyNotice?.text}</p>
        </div>
      )}

      <LessonTable lessons={lessons} loading={loading} readOnly={readOnly} onEdit={openEdit} onDelete={remove} onMoveUp={moveUp} onMoveDown={moveDown} onManageQuiz={manageQuiz} />

      {modalOpen && (
        <LessonFormModal lesson={editingLesson} submitting={submitting} onClose={() => setModalOpen(false)} onSubmit={submit} />
      )}
    </section>
  );
}
