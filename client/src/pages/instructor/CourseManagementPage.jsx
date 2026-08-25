import { useCallback, useEffect, useRef, useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import CourseFilters from '../../components/courses/CourseFilters';
import CourseFormModal from '../../components/courses/CourseFormModal';
import CourseTable from '../../components/courses/CourseTable';
import CourseWorkflowHint from '../../components/courses/CourseWorkflowHint';
import Pagination from '../../components/common/Pagination';
import {
  createCourse,
  fetchCategories,
  fetchInstructorCourses,
  hideCourse,
  submitCourseForApproval,
  updateCourse,
} from '../../features/courses/courseApi';
import { clampPage } from '../../utils/pagination';

const PAGE_LIMIT = 8;
const EMPTY_PAGINATION = { page: 1, limit: PAGE_LIMIT, total_items: 0, total_pages: 0 };
const EMPTY_SUMMARY = { active: 0, total: 0 };

function parsePage(value) {
  const page = Number.parseInt(value || '1', 10);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

export default function CourseManagementPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const listRef = useRef(null);

  const searchFilter = searchParams.get('search') || '';
  const statusFilter = searchParams.get('status') || '';
  const categoryFilter = searchParams.get('category') || '';
  const currentPage = parsePage(searchParams.get('page'));

  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchInput, setSearchInput] = useState(searchFilter);
  const [pagination, setPagination] = useState(EMPTY_PAGINATION);
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [savingCourse, setSavingCourse] = useState(false);
  const [submittingCourseId, setSubmittingCourseId] = useState(null);
  const [editingCourse, setEditingCourse] = useState(undefined);
  const [modalOpen, setModalOpen] = useState(false);

  const loadCourses = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchInstructorCourses({
        search: searchFilter || undefined,
        status: statusFilter || undefined,
        category_id: categoryFilter || undefined,
        page: currentPage,
        limit: PAGE_LIMIT,
      });
      setCourses(response.data.courses || []);
      setPagination(response.data.pagination || EMPTY_PAGINATION);
      setSummary(response.data.summary || EMPTY_SUMMARY);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not load course management.');
      setCourses([]);
      setPagination(EMPTY_PAGINATION);
      setSummary(EMPTY_SUMMARY);
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, currentPage, searchFilter, statusFilter]);

  useEffect(() => {
    fetchCategories()
      .then((response) => setCategories(response.data.categories || []))
      .catch((error) => toast.error(error.response?.data?.message || 'Could not load categories.'));
  }, []);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  useEffect(() => {
    setSearchInput(searchFilter);
  }, [searchFilter]);

  const validPage = clampPage(currentPage, pagination.total_pages);
  const correctingOutOfRangePage = !loading && currentPage !== validPage;

  useEffect(() => {
    if (!correctingOutOfRangePage) return;

    const nextParams = new URLSearchParams(searchParams);
    if (validPage === 1) nextParams.delete('page');
    else nextParams.set('page', String(validPage));
    setSearchParams(nextParams, { replace: true });
  }, [correctingOutOfRangePage, searchParams, setSearchParams, validPage]);

  const updateFilter = (key, value) => {
    const nextParams = new URLSearchParams(searchParams);
    if (value) nextParams.set(key, value);
    else nextParams.delete(key);
    nextParams.delete('page');
    setSearchParams(nextParams);
  };

  const applySearch = (event) => {
    event.preventDefault();
    updateFilter('search', searchInput.trim());
  };

  const clearFilters = () => {
    setSearchInput('');
    setSearchParams({});
  };

  const changePage = (page) => {
    if (page < 1 || page > pagination.total_pages || page === currentPage) return;

    const nextParams = new URLSearchParams(searchParams);
    if (page === 1) nextParams.delete('page');
    else nextParams.set('page', String(page));
    setSearchParams(nextParams);
    listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const openCreate = () => {
    setEditingCourse(undefined);
    setModalOpen(true);
  };

  const openEdit = (course) => {
    setEditingCourse(course);
    setModalOpen(true);
  };

  const saveCourse = async (payload) => {
    setSavingCourse(true);
    try {
      if (editingCourse) {
        await updateCourse(editingCourse.id, payload);
        toast.success('Course updated successfully.');
      } else {
        await createCourse(payload);
        toast.success('Course draft created. Add lessons and quizzes before submitting it.');
      }
      setModalOpen(false);
      await loadCourses();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not save the course.');
    } finally {
      setSavingCourse(false);
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
      await loadCourses();
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
      text: 'New students will no longer discover or purchase it. Enrolled students keep access.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Hide course',
      confirmButtonColor: '#ef4444',
    });
    if (!result.isConfirmed) return;

    try {
      await hideCourse(course.id);
      toast.success('Course hidden successfully.');
      await loadCourses();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not hide the course.');
    }
  };

  const hasAppliedFilters = Boolean(searchFilter || statusFilter || categoryFilter);

  return (
    <section>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Your courses</h1>
          <p className="mt-2 text-gray-500">
            {summary.active} active course{summary.active === 1 ? '' : 's'} · {summary.total} total
            {hasAppliedFilters ? ` · ${pagination.total_items} matching` : ''}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={loadCourses}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 font-semibold text-gray-600 shadow-sm hover:border-primary/30 hover:text-primary disabled:opacity-60"
          >
            <RefreshCw size={18} /> Refresh
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-secondary px-4 py-2.5 font-semibold text-white shadow-lg shadow-primary/20 hover:opacity-90"
          >
            <Plus size={18} /> Create course
          </button>
        </div>
      </div>

      <CourseWorkflowHint />

      <div ref={listRef} className="scroll-mt-24">
        <CourseFilters
          search={searchInput}
          status={statusFilter}
          categoryId={categoryFilter}
          categories={categories}
          disabled={loading}
          onSearchChange={setSearchInput}
          onSearch={applySearch}
          onStatusChange={(value) => updateFilter('status', value)}
          onCategoryChange={(value) => updateFilter('category', value)}
          onClear={clearFilters}
        />

        <CourseTable
          courses={courses}
          loading={loading || correctingOutOfRangePage}
          submittingCourseId={submittingCourseId}
          emptyTitle={hasAppliedFilters ? 'No matching courses' : 'No courses yet'}
          emptyDescription={
            hasAppliedFilters
              ? 'Try another keyword or clear the current filters.'
              : 'Create your first course to start the approval process.'
          }
          onView={(course) => navigate(`/instructor/courses/${course.id}`)}
          onViewReviews={(course) => navigate(`/instructor/courses/${course.id}/reviews`)}
          onEdit={openEdit}
          onHide={hide}
          onViewLessons={(course) => navigate(`/instructor/courses/${course.id}/lessons`)}
          onSubmitForApproval={submitForApproval}
        />

        <div className="mt-6">
          <Pagination
            page={pagination.page}
            totalPages={pagination.total_pages}
            onPageChange={changePage}
            disabled={loading}
            ariaLabel="Instructor course pagination"
          />
        </div>
      </div>

      {modalOpen && (
        <CourseFormModal
          course={editingCourse}
          categories={categories}
          submitting={savingCourse}
          onClose={() => setModalOpen(false)}
          onSubmit={saveCourse}
        />
      )}
    </section>
  );
}
