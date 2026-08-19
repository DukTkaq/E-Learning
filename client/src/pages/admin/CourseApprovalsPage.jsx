import { useCallback, useEffect, useState } from 'react';
import { CheckSquare, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import CourseApprovalCard from '../../components/admin/CourseApprovalCard';
import CourseApprovalToolbar from '../../components/admin/CourseApprovalToolbar';
import { fetchAdminCourses, reviewCourse, hideAdminCourse } from '../../features/admin/adminCourseApi';

export default function CourseApprovalsPage() {
  const [courses, setCourses] = useState([]);
  const [status, setStatus] = useState('Pending');
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchAdminCourses({ status: status || undefined, search: appliedSearch || undefined });
      setCourses(response.data.courses || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not load courses for review.');
    } finally {
      setLoading(false);
    }
  }, [appliedSearch, status]);

  useEffect(() => { load(); }, [load]);

  const submitSearch = (event) => { event.preventDefault(); setAppliedSearch(search.trim()); };

  const handleReview = async (course, nextStatus) => {
    const result = await Swal.fire({
      title: `${nextStatus === 'Approved' ? 'Approve' : 'Reject'} this course?`,
      text: nextStatus === 'Approved' ? 'Students will be able to discover and purchase it.' : 'The instructor can edit and resubmit it for approval.',
      icon: nextStatus === 'Approved' ? 'question' : 'warning',
      showCancelButton: true,
      confirmButtonText: nextStatus === 'Approved' ? 'Approve course' : 'Reject course',
      confirmButtonColor: nextStatus === 'Approved' ? '#22c55e' : '#ef4444',
    });
    if (!result.isConfirmed) return;

    setReviewingId(course.id);
    try {
      await reviewCourse(course.id, nextStatus);
      toast.success(`Course ${nextStatus.toLowerCase()} successfully.`);
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not review this course.');
    } finally {
      setReviewingId(null);
    }
  };

  const handleHideCourse = async (course) => {
    const result = await Swal.fire({
      title: 'Delete/Hide this course?',
      text: 'This will hide the course from the catalog due to violations. Existing students will still have access to it.',
      icon: 'error',
      showCancelButton: true,
      confirmButtonText: 'Yes, hide it',
      confirmButtonColor: '#ef4444',
    });
    if (!result.isConfirmed) return;

    setReviewingId(course.id);
    try {
      await hideAdminCourse(course.id);
      toast.success('Course hidden successfully.');
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not hide this course.');
    } finally {
      setReviewingId(null);
    }
  };

  return (
    <section>
      <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end"><div><div className="mb-2 flex items-center gap-2 text-primary"><CheckSquare size={20} /><span className="text-sm font-bold uppercase tracking-wider">Course approval</span></div><h1 className="text-3xl font-bold text-slate-900">Review submitted courses</h1><p className="mt-2 text-gray-500">Approve courses before they appear in the Student catalog.</p></div><button type="button" onClick={load} className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 font-semibold text-gray-600 shadow-sm hover:text-primary"><RefreshCw size={18} /> Refresh</button></div>

      <CourseApprovalToolbar
        status={status}
        search={search}
        onStatusChange={setStatus}
        onSearchChange={setSearch}
        onSearchSubmit={submitSearch}
      />

      {loading ? <div className="rounded-2xl bg-white p-14 text-center text-gray-500">Loading courses...</div> : courses.length ? <div className="space-y-5">{courses.map((course) => <CourseApprovalCard key={course.id} course={course} reviewing={reviewingId === course.id} onReview={handleReview} onHide={handleHideCourse} />)}</div> : <div className="rounded-2xl border border-dashed border-primary/25 bg-white p-14 text-center"><CheckSquare className="mx-auto text-primary" size={38} /><h2 className="mt-4 text-xl font-bold text-slate-800">No courses in this view</h2><p className="mt-1 text-gray-500">Try another status or search term.</p></div>}
    </section>
  );
}
