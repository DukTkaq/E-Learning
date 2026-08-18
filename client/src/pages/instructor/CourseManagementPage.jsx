import { useCallback, useEffect, useState } from 'react';
import { BookOpen, Plus, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import CourseFormModal from '../../components/courses/CourseFormModal';
import CourseTable from '../../components/courses/CourseTable';
import { createCourse, fetchCategories, fetchInstructorCourses, hideCourse, updateCourse } from '../../features/courses/courseApi';

export default function CourseManagementPage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
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
        toast.success('Course submitted for approval.');
      }
      setModalOpen(false);
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not save the course.');
    } finally {
      setSubmitting(false);
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
          <div className="mb-2 flex items-center gap-2 text-primary"><BookOpen size={20} /><span className="text-sm font-bold uppercase tracking-wider">UC07 Course Management</span></div>
          <h1 className="text-3xl font-bold text-slate-900">Your courses</h1>
          <p className="mt-2 text-gray-500">{visibleCount} active course{visibleCount === 1 ? '' : 's'} · {courses.length} total</p>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={loadData} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 font-semibold text-gray-600 shadow-sm hover:border-primary/30 hover:text-primary"><RefreshCw size={18} /> Refresh</button>
          <button type="button" onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-secondary px-4 py-2.5 font-semibold text-white shadow-lg shadow-primary/20 hover:opacity-90"><Plus size={18} /> Create course</button>
        </div>
      </div>

      <CourseTable courses={courses} loading={loading} onView={openDetail} onEdit={openEdit} onHide={hide} onViewLessons={openLessons} />

      {modalOpen && (
        <CourseFormModal course={editingCourse} categories={categories} submitting={submitting} onClose={() => setModalOpen(false)} onSubmit={submit} />
      )}
    </section>
  );
}
