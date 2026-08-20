import { useCallback, useEffect, useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import CourseFormModal from '../../components/courses/CourseFormModal';
import CourseTable from '../../components/courses/CourseTable';
import CourseWorkflowHint from '../../components/courses/CourseWorkflowHint';
import { createCourse, fetchCategories, fetchInstructorCourses, hideCourse, submitCourseForApproval, updateCourse } from '../../features/courses/courseApi';

export default function CourseManagementPage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submittingCourseId, setSubmittingCourseId] = useState(null);
  const [editingCourse, setEditingCourse] = useState(undefined);
  const [modalOpen, setModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [courseResponse, categoryResponse] = await Promise.all([fetchInstructorCourses(), fetchCategories()]);
      setCourses(courseResponse.data.courses || []);
      setCategories(categoryResponse.data.categories || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not load course management.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const openCreate = () => { setEditingCourse(undefined); setModalOpen(true); };
  const openDetail = (course) => navigate(`/instructor/courses/${course.id}`);
  const openEdit = (course) => { setEditingCourse(course); setModalOpen(true); };
  const openLessons = (course) => navigate(`/instructor/courses/${course.id}/lessons`);

  const submit = async (payload) => {
    setSubmitting(true);
    try {
      if (editingCourse) {
        await updateCourse(editingCourse.id, payload);
        toast.success('Course updated successfully.');
      } else {
        await createCourse(payload);
        toast.success('Course draft created. Add lessons and quizzes before submitting it.');
      }
      setModalOpen(false);
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not save the course.');
    } finally {
      setSubmitting(false);
    }
  };

  const submitForApproval = async (course) => {
    const result = await Swal.fire({
      title: 'Submit this course?',
      text: 'Required: description, thumbnail, at least 3 lessons, exactly one final lesson, one quiz per lesson, and at least 3 questions per quiz.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Submit for approval',
      confirmButtonColor: '#4f46e5',
    });
    if (!result.isConfirmed) return;

    setSubmittingCourseId(course.id);
    try {
      await submitCourseForApproval(course.id);
      toast.success('Course submitted for approval.');
      await loadData();
    } catch (error) {
      const message = error.response?.data?.message || 'Could not submit the course.';
      const details = error.response?.data?.details || [];
      await Swal.fire({
        title: 'Course not ready',
        text: [message, ...details.map((detail) => `• ${detail}`)].join('\n'),
        icon: 'warning',
      });
    } finally {
      setSubmittingCourseId(null);
    }
  };

  const hide = async (course) => {
    const result = await Swal.fire({
      title: 'Hide this course?',
      text: 'Students will no longer be able to discover or purchase it.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Hide course',
      confirmButtonColor: '#ef4444',
    });
    if (!result.isConfirmed) return;

    try {
      await hideCourse(course.id);
      toast.success('Course hidden successfully.');
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not hide the course.');
    }
  };

  const visibleCount = courses.filter((course) => course.status !== 'Hidden').length;

  return (
    <section>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Your courses</h1>
          <p className="mt-2 text-gray-500">{visibleCount} active course{visibleCount === 1 ? '' : 's'} · {courses.length} total</p>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={loadData} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 font-semibold text-gray-600 shadow-sm hover:border-primary/30 hover:text-primary"><RefreshCw size={18} /> Refresh</button>
          <button type="button" onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-secondary px-4 py-2.5 font-semibold text-white shadow-lg shadow-primary/20 hover:opacity-90"><Plus size={18} /> Create course</button>
        </div>
      </div>

      <CourseWorkflowHint />

      <CourseTable
        courses={courses}
        loading={loading}
        submittingCourseId={submittingCourseId}
        onView={openDetail}
        onEdit={openEdit}
        onHide={hide}
        onViewLessons={openLessons}
        onSubmitForApproval={submitForApproval}
      />

      {modalOpen && (
        <CourseFormModal course={editingCourse} categories={categories} submitting={submitting} onClose={() => setModalOpen(false)} onSubmit={submit} />
      )}
    </section>
  );
}
