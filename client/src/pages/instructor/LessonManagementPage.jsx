import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, LockKeyhole, Plus, RefreshCw, Video } from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import ContentFilterBar from '../../components/lessons/ContentFilterBar';
import LessonFormModal from '../../components/lessons/LessonFormModal';
import LessonTable from '../../components/lessons/LessonTable';
import Pagination from '../../components/common/Pagination';
import { fetchLessons, createLesson, updateLesson, deleteLesson, moveLessonUp, moveLessonDown } from '../../features/lessons/lessonApi';
import { fetchInstructorCourse } from '../../features/courses/courseApi';
import { canEditCourse, getCourseReadOnlyNotice } from '../../features/courses/courseStatus';
import { clampPage } from '../../utils/pagination';

const PAGE_LIMIT = 10;
const EMPTY_PAGINATION = { page: 1, limit: PAGE_LIMIT, total_items: 0, total_pages: 0 };

function parsePage(value) {
  const page = Number.parseInt(value || '1', 10);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

export default function LessonManagementPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const listRef = useRef(null);

  const searchFilter = searchParams.get('search') || '';
  const typeFilter = searchParams.get('type') || '';
  const quizFilter = searchParams.get('quiz') || '';
  const currentPage = parsePage(searchParams.get('page'));

  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [pagination, setPagination] = useState(EMPTY_PAGINATION);
  const [summary, setSummary] = useState({ total: 0, has_final: false });
  const [searchInput, setSearchInput] = useState(searchFilter);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingLesson, setEditingLesson] = useState(undefined);
  const [modalOpen, setModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [lessonResponse, courseResponse] = await Promise.all([
        fetchLessons(courseId, {
          search: searchFilter || undefined,
          type: typeFilter || undefined,
          quiz: quizFilter || undefined,
          page: currentPage,
          limit: PAGE_LIMIT,
        }),
        fetchInstructorCourse(courseId),
      ]);
      setLessons(lessonResponse.data.lessons || []);
      setPagination(lessonResponse.data.pagination || EMPTY_PAGINATION);
      setSummary(lessonResponse.data.summary || { total: 0, has_final: false });
      setCourse(courseResponse.data.course || null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not load lessons.');
      setLessons([]);
      setPagination(EMPTY_PAGINATION);
    } finally {
      setLoading(false);
    }
  }, [courseId, currentPage, quizFilter, searchFilter, typeFilter]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { setSearchInput(searchFilter); }, [searchFilter]);

  const validPage = clampPage(currentPage, pagination.total_pages);
  const correctingPage = !loading && currentPage !== validPage;

  useEffect(() => {
    if (!correctingPage) return;
    const next = new URLSearchParams(searchParams);
    if (validPage === 1) next.delete('page'); else next.set('page', String(validPage));
    setSearchParams(next, { replace: true });
  }, [correctingPage, searchParams, setSearchParams, validPage]);

  const readOnly = Boolean(course && !canEditCourse(course.status));
  const readOnlyNotice = getCourseReadOnlyNotice(course?.status);
  const hasFilters = Boolean(searchFilter || typeFilter || quizFilter);

  const updateFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
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

  const moveLesson = async (lesson, direction) => {
    try {
      if (direction === 'up') await moveLessonUp(courseId, lesson.id);
      else await moveLessonDown(courseId, lesson.id);
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not move lesson.');
    }
  };

  return (
    <section>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <button type="button" onClick={() => navigate('/instructor/courses')} className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 transition hover:text-primary">
            <ArrowLeft size={16} /> Back to courses
          </button>
          <div className="mb-2 flex items-center gap-2 text-primary"><Video size={20} /><span className="text-sm font-bold uppercase tracking-wider">Lesson Management</span></div>
          <h1 className="text-3xl font-bold text-slate-900">{course?.title || 'Loading...'}</h1>
          <p className="mt-2 text-gray-500">
            {summary.total} lesson{summary.total === 1 ? '' : 's'} · {summary.has_final ? 'Final lesson set' : 'No final lesson yet'}
            {hasFilters && ` · ${pagination.total_items} matching`}
          </p>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={loadData} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 font-semibold text-gray-600 shadow-sm hover:border-primary/30 hover:text-primary disabled:opacity-60"><RefreshCw size={18} /> Refresh</button>
          {!readOnly && <button type="button" onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-secondary px-4 py-2.5 font-semibold text-white shadow-lg shadow-primary/20 hover:opacity-90"><Plus size={18} /> Create lesson</button>}
        </div>
      </div>

      {readOnly && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
          <LockKeyhole className="mt-0.5 shrink-0" size={18} />
          <p className="text-sm"><span className="font-bold">{readOnlyNotice?.title}</span> {readOnlyNotice?.text}</p>
        </div>
      )}

      <div ref={listRef} className="scroll-mt-24">
        <ContentFilterBar
          search={searchInput}
          placeholder="Search lesson title or video URL..."
          disabled={loading}
          hasFilters={Boolean(searchInput.trim() || typeFilter || quizFilter)}
          onSearchChange={setSearchInput}
          onSubmit={(event) => { event.preventDefault(); updateFilter('search', searchInput.trim()); }}
          onReset={() => { setSearchInput(''); setSearchParams({}); }}
        >
          <select value={typeFilter} onChange={(event) => updateFilter('type', event.target.value)} disabled={loading} className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 outline-none focus:border-primary disabled:opacity-60">
            <option value="">All lesson types</option>
            <option value="regular">Regular lessons</option>
            <option value="final">Final lesson</option>
          </select>
          <select value={quizFilter} onChange={(event) => updateFilter('quiz', event.target.value)} disabled={loading} className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 outline-none focus:border-primary disabled:opacity-60">
            <option value="">All quiz states</option>
            <option value="with_quiz">Has quiz</option>
            <option value="without_quiz">No quiz</option>
          </select>
        </ContentFilterBar>

        <LessonTable
          lessons={lessons}
          loading={loading || correctingPage}
          readOnly={readOnly}
          hasFilters={hasFilters}
          onEdit={openEdit}
          onDelete={remove}
          onMoveUp={(lesson) => moveLesson(lesson, 'up')}
          onMoveDown={(lesson) => moveLesson(lesson, 'down')}
          onManageQuiz={(lesson) => navigate(`/instructor/courses/${courseId}/lessons/${lesson.id}/quiz`)}
        />

        <div className="mt-6"><Pagination page={pagination.page} totalPages={pagination.total_pages} onPageChange={changePage} disabled={loading} ariaLabel="Lesson pagination" /></div>
      </div>

      {modalOpen && <LessonFormModal lesson={editingLesson} submitting={submitting} onClose={() => setModalOpen(false)} onSubmit={submit} />}
    </section>
  );
}
