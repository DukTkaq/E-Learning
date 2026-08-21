import { useCallback, useEffect, useRef, useState } from 'react';
import { CheckSquare, RefreshCw } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import AdminFilterBar from '../../components/admin/AdminFilterBar';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import CourseApprovalCard from '../../components/admin/CourseApprovalCard';
import Pagination from '../../components/common/Pagination';
import { fetchAdminCourses, hideAdminCourse, reviewCourse } from '../../features/admin/adminCourseApi';
import { fetchCategories } from '../../features/courses/courseApi';
import { clampPage } from '../../utils/pagination';

const PAGE_LIMIT = 6;
const EMPTY_PAGINATION = { page: 1, limit: PAGE_LIMIT, total_items: 0, total_pages: 0 };

function parsePage(value) {
  const page = Number.parseInt(value || '1', 10);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

export default function CourseApprovalsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const listRef = useRef(null);
  const searchFilter = searchParams.get('search') || '';
  const statusFilter = searchParams.get('status') || 'Pending';
  const categoryFilter = searchParams.get('category') || '';
  const currentPage = parsePage(searchParams.get('page'));

  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchInput, setSearchInput] = useState(searchFilter);
  const [pagination, setPagination] = useState(EMPTY_PAGINATION);
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState(null);

  const loadCourses = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchAdminCourses({
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: searchFilter || undefined,
        category_id: categoryFilter || undefined,
        page: currentPage,
        limit: PAGE_LIMIT,
      });
      setCourses(response.data.courses || []);
      setPagination(response.data.pagination || EMPTY_PAGINATION);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not load courses for review.');
      setCourses([]);
      setPagination(EMPTY_PAGINATION);
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, currentPage, searchFilter, statusFilter]);

  useEffect(() => { loadCourses(); }, [loadCourses]);
  useEffect(() => { setSearchInput(searchFilter); }, [searchFilter]);
  useEffect(() => {
    fetchCategories()
      .then((response) => setCategories(response.data.categories || []))
      .catch(() => toast.error('Could not load categories.'));
  }, []);

  const validPage = clampPage(currentPage, pagination.total_pages);
  const correctingPage = !loading && currentPage !== validPage;

  useEffect(() => {
    if (!correctingPage) return;
    const next = new URLSearchParams(searchParams);
    if (validPage === 1) next.delete('page'); else next.set('page', String(validPage));
    setSearchParams(next, { replace: true });
  }, [correctingPage, searchParams, setSearchParams, validPage]);

  const updateFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value && !(key === 'status' && value === 'Pending')) next.set(key, value); else next.delete(key);
    next.delete('page');
    setSearchParams(next);
  };

  const changePage = (page) => {
    if (page < 1 || page > pagination.total_pages || page === currentPage) return;
    const next = new URLSearchParams(searchParams);
    if (page === 1) next.delete('page'); else next.set('page', String(page));
    setSearchParams(next);
    listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleReview = async (course, nextStatus) => {
    const result = await Swal.fire({
      title: `${nextStatus === 'Approved' ? 'Approve' : 'Reject'} this course?`,
      text: nextStatus === 'Approved'
        ? 'Students will be able to discover and purchase it.'
        : 'The instructor can edit and resubmit it for approval.',
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
      await loadCourses();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not review this course.');
    } finally {
      setReviewingId(null);
    }
  };

  const handleHideCourse = async (course) => {
    const result = await Swal.fire({
      title: 'Delete/Hide this course?',
      text: 'This hides the course from the catalog. Existing students keep access.',
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
      await loadCourses();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not hide this course.');
    } finally {
      setReviewingId(null);
    }
  };

  return (
    <section>
      <AdminPageHeader
        icon={CheckSquare}
        eyebrow="Course Approval"
        title="Review Submitted Courses"
        description="Approve courses before they appear in the Student catalog."
        summary={`${pagination.total_items} matching courses`}
        actions={(
          <button type="button" onClick={loadCourses} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 font-semibold text-gray-600 shadow-sm hover:text-primary disabled:opacity-60">
            <RefreshCw size={18} /> Refresh
          </button>
        )}
      />

      <div ref={listRef} className="scroll-mt-24">
        <AdminFilterBar
          search={searchInput}
          searchPlaceholder="Search course, category or instructor..."
          disabled={loading}
          hasFilters={Boolean(searchInput.trim() || categoryFilter || statusFilter !== 'Pending')}
          onSearchChange={setSearchInput}
          onSearch={(event) => { event.preventDefault(); updateFilter('search', searchInput.trim()); }}
          onClear={() => { setSearchInput(''); setSearchParams({}); }}
        >
          <select value={statusFilter} onChange={(event) => updateFilter('status', event.target.value)} disabled={loading} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 outline-none focus:border-primary disabled:opacity-60">
            <option value="all">All reviewable statuses</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Hidden">Hidden</option>
          </select>
          <select value={categoryFilter} onChange={(event) => updateFilter('category', event.target.value)} disabled={loading} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 outline-none focus:border-primary disabled:opacity-60">
            <option value="">All categories</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </AdminFilterBar>

        {loading || correctingPage ? (
          <div className="rounded-2xl bg-white p-14 text-center text-gray-500">Loading courses...</div>
        ) : courses.length ? (
          <div className="space-y-5">
            {courses.map((course) => (
              <CourseApprovalCard key={course.id} course={course} reviewing={reviewingId === course.id} onReview={handleReview} onHide={handleHideCourse} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-primary/25 bg-white p-14 text-center">
            <CheckSquare className="mx-auto text-primary" size={38} />
            <h2 className="mt-4 text-xl font-bold text-slate-800">No courses in this view</h2>
            <p className="mt-1 text-gray-500">Try another status, category or search term.</p>
          </div>
        )}

        <div className="mt-6"><Pagination page={pagination.page} totalPages={pagination.total_pages} onPageChange={changePage} disabled={loading} ariaLabel="Course approval pagination" /></div>
      </div>
    </section>
  );
}
