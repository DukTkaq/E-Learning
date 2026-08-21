import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, HelpCircle, LoaderCircle, LockKeyhole, Plus, RefreshCw, Save, Trash2 } from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import ContentFilterBar from '../../components/lessons/ContentFilterBar';
import QuestionFormModal from '../../components/lessons/QuestionFormModal';
import QuestionTable from '../../components/lessons/QuestionTable';
import Pagination from '../../components/common/Pagination';
import { fetchQuiz, createQuiz, updateQuiz, deleteQuiz, addQuestion, updateQuestion, deleteQuestion } from '../../features/lessons/lessonApi';
import { fetchInstructorCourse } from '../../features/courses/courseApi';
import { canEditCourse, getCourseReadOnlyNotice } from '../../features/courses/courseStatus';
import { clampPage } from '../../utils/pagination';

const PAGE_LIMIT = 10;
const EMPTY_PAGINATION = { page: 1, limit: PAGE_LIMIT, total_items: 0, total_pages: 0 };

function parsePage(value) {
  const page = Number.parseInt(value || '1', 10);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

export default function QuizManagementPage() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const questionListRef = useRef(null);

  const searchFilter = searchParams.get('search') || '';
  const answerFilter = searchParams.get('answer') || '';
  const currentPage = parsePage(searchParams.get('page'));

  const [course, setCourse] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [pagination, setPagination] = useState(EMPTY_PAGINATION);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [searchInput, setSearchInput] = useState(searchFilter);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [quizTitle, setQuizTitle] = useState('');
  const [passingScore, setPassingScore] = useState(40);
  const [maxAttempts, setMaxAttempts] = useState(3);
  const [dirty, setDirty] = useState(false);
  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(undefined);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [quizResponse, courseResponse] = await Promise.all([
        fetchQuiz(courseId, lessonId, {
          search: searchFilter || undefined,
          answer: answerFilter || undefined,
          page: currentPage,
          limit: PAGE_LIMIT,
        }),
        fetchInstructorCourse(courseId),
      ]);

      setCourse(courseResponse.data.course || null);
      const nextQuiz = quizResponse.data.quiz;
      setQuiz(nextQuiz);
      setQuestions(quizResponse.data.questions || []);
      setPagination(quizResponse.data.pagination || EMPTY_PAGINATION);
      setTotalQuestions(quizResponse.data.summary?.total || 0);

      if (nextQuiz) {
        setQuizTitle(nextQuiz.title);
        setPassingScore(nextQuiz.passing_score);
        setMaxAttempts(nextQuiz.max_attempts);
        setDirty(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not load quiz data.');
      setQuestions([]);
      setPagination(EMPTY_PAGINATION);
    } finally {
      setLoading(false);
    }
  }, [answerFilter, courseId, currentPage, lessonId, searchFilter]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { setSearchInput(searchFilter); }, [searchFilter]);

  const validPage = clampPage(currentPage, pagination.total_pages);
  const correctingPage = !loading && quiz && currentPage !== validPage;

  useEffect(() => {
    if (!correctingPage) return;
    const next = new URLSearchParams(searchParams);
    if (validPage === 1) next.delete('page'); else next.set('page', String(validPage));
    setSearchParams(next, { replace: true });
  }, [correctingPage, searchParams, setSearchParams, validPage]);

  const readOnly = Boolean(course && !canEditCourse(course.status));
  const readOnlyNotice = getCourseReadOnlyNotice(course?.status);
  const hasFilters = Boolean(searchFilter || answerFilter);

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
    questionListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const createNewQuiz = async () => {
    if (!quizTitle.trim()) return toast.error('Please enter a quiz title first.');
    setSubmitting(true);
    try {
      await createQuiz(courseId, lessonId, { title: quizTitle.trim(), passing_score: passingScore, max_attempts: maxAttempts });
      toast.success('Quiz created successfully.');
      setDirty(false);
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not create quiz.');
    } finally {
      setSubmitting(false);
    }
  };

  const saveQuizSettings = async () => {
    if (!quizTitle.trim()) return toast.error('Quiz title cannot be empty.');
    setSubmitting(true);
    try {
      await updateQuiz(courseId, lessonId, { title: quizTitle.trim(), passing_score: passingScore, max_attempts: maxAttempts });
      toast.success('Quiz settings saved.');
      setDirty(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not save quiz settings.');
    } finally {
      setSubmitting(false);
    }
  };

  const removeQuiz = async () => {
    const result = await Swal.fire({
      title: 'Delete this quiz?',
      text: 'All questions will be permanently removed.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete quiz',
      confirmButtonColor: '#ef4444',
    });
    if (!result.isConfirmed) return;

    try {
      await deleteQuiz(courseId, lessonId);
      toast.success('Quiz deleted successfully.');
      setSearchParams({});
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not delete quiz.');
    }
  };

  const submitQuestion = async (payload) => {
    setSubmitting(true);
    try {
      if (editingQuestion) {
        await updateQuestion(courseId, lessonId, editingQuestion.id, payload);
        toast.success('Question updated successfully.');
      } else {
        await addQuestion(courseId, lessonId, payload);
        toast.success('Question added successfully.');
      }
      setQuestionModalOpen(false);
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not save question.');
    } finally {
      setSubmitting(false);
    }
  };

  const removeQuestion = async (question) => {
    const result = await Swal.fire({
      title: 'Delete this question?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      confirmButtonColor: '#ef4444',
    });
    if (!result.isConfirmed) return;

    try {
      await deleteQuestion(courseId, lessonId, question.id);
      toast.success('Question deleted.');
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not delete question.');
    }
  };

  if (loading && !course) {
    return <div className="flex items-center justify-center py-20"><LoaderCircle className="animate-spin text-primary" size={32} /></div>;
  }

  return (
    <section>
      <div className="mb-6">
        <button type="button" onClick={() => navigate(`/instructor/courses/${courseId}/lessons`)} className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 transition hover:text-primary"><ArrowLeft size={16} /> Back to lessons</button>
        <div className="mb-2 flex items-center gap-2 text-primary"><HelpCircle size={20} /><span className="text-sm font-bold uppercase tracking-wider">Quiz Management</span></div>
        <h1 className="text-3xl font-bold text-slate-900">{course?.title || 'Loading...'}</h1>
      </div>

      {readOnly && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
          <LockKeyhole className="mt-0.5 shrink-0" size={18} />
          <p className="text-sm"><span className="font-bold">{readOnlyNotice?.title}</span> {readOnlyNotice?.text}</p>
        </div>
      )}

      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Quiz Settings</h2>
          <div className="flex gap-2">
            {quiz && !readOnly && <button type="button" onClick={removeQuiz} className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 font-semibold text-red-600 shadow-sm transition hover:bg-red-50"><Trash2 size={16} /> Delete quiz</button>}
            <button type="button" onClick={loadData} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 font-semibold text-gray-600 shadow-sm transition hover:border-primary/30 hover:text-primary disabled:opacity-60"><RefreshCw size={16} /> Refresh</button>
          </div>
        </div>

        {!quiz && !dirty && (
          <div className="rounded-xl border border-dashed border-primary/25 bg-primary/5 p-6 text-center">
            <HelpCircle className="mx-auto mb-2 text-primary" size={32} />
            <p className="font-semibold text-slate-800">No quiz for this lesson yet</p>
            <p className="mt-1 text-sm text-gray-500">{readOnly ? 'No quiz was added before this course was submitted.' : 'Configure the settings below and create the quiz.'}</p>
          </div>
        )}

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <label className="block text-sm font-semibold text-slate-700">Quiz title <span className="text-error">*</span><input value={quizTitle} onChange={(event) => { setQuizTitle(event.target.value); setDirty(true); }} disabled={readOnly} className="mt-1.5 w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm font-normal outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10" placeholder="e.g. Chapter 1 Quiz" /></label>
          <label className="block text-sm font-semibold text-slate-700">Passing score (%) <span className="text-error">*</span><input type="number" min="1" max="100" value={passingScore} onChange={(event) => { setPassingScore(Number.parseInt(event.target.value, 10) || 70); setDirty(true); }} disabled={readOnly} className="mt-1.5 w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm font-normal outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10" /></label>
          <label className="block text-sm font-semibold text-slate-700">Max attempts <span className="text-error">*</span><input type="number" min="1" max="100" value={maxAttempts} onChange={(event) => { setMaxAttempts(Number.parseInt(event.target.value, 10) || 1); setDirty(true); }} disabled={readOnly} className="mt-1.5 w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm font-normal outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10" /></label>
        </div>

        <div className="mt-4 flex justify-end">
          {!readOnly && (!quiz ? (
            <button type="button" onClick={createNewQuiz} disabled={submitting} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-secondary px-5 py-2.5 font-semibold text-white shadow-lg shadow-primary/20 transition hover:opacity-90 disabled:opacity-60">{submitting && <LoaderCircle className="animate-spin" size={18} />}Create quiz</button>
          ) : dirty && (
            <button type="button" onClick={saveQuizSettings} disabled={submitting} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-secondary px-5 py-2.5 font-semibold text-white shadow-lg shadow-primary/20 transition hover:opacity-90 disabled:opacity-60">{submitting && <LoaderCircle className="animate-spin" size={18} />}<Save size={16} /> Save changes</button>
          ))}
        </div>
      </div>

      {quiz && (
        <div ref={questionListRef} className="mt-6 scroll-mt-24 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-3 border-b border-gray-100 px-6 py-4 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Questions ({totalQuestions})</h3>
              {hasFilters && <p className="mt-1 text-sm text-gray-500">{pagination.total_items} matching questions</p>}
            </div>
            {!readOnly && <button type="button" onClick={() => { setEditingQuestion(undefined); setQuestionModalOpen(true); }} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-secondary px-4 py-2.5 font-semibold text-white shadow-lg shadow-primary/20 transition hover:opacity-90"><Plus size={16} /> Add question</button>}
          </div>

          <div className="p-4 pb-0">
            <ContentFilterBar
              search={searchInput}
              placeholder="Search question or answer option..."
              disabled={loading}
              hasFilters={Boolean(searchInput.trim() || answerFilter)}
              onSearchChange={setSearchInput}
              onSubmit={(event) => { event.preventDefault(); updateFilter('search', searchInput.trim()); }}
              onReset={() => { setSearchInput(''); setSearchParams({}); }}
            >
              <select value={answerFilter} onChange={(event) => updateFilter('answer', event.target.value)} disabled={loading} className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 outline-none focus:border-primary disabled:opacity-60">
                <option value="">All correct answers</option>
                {['A', 'B', 'C', 'D'].map((answer) => <option key={answer} value={answer}>Correct answer {answer}</option>)}
              </select>
            </ContentFilterBar>
          </div>

          <QuestionTable
            questions={questions}
            loading={loading || correctingPage}
            readOnly={readOnly}
            startIndex={(pagination.page - 1) * pagination.limit}
            hasFilters={hasFilters}
            onEdit={(question) => { setEditingQuestion(question); setQuestionModalOpen(true); }}
            onDelete={removeQuestion}
          />
          <div className="border-t border-gray-100 p-5"><Pagination page={pagination.page} totalPages={pagination.total_pages} onPageChange={changePage} disabled={loading} ariaLabel="Question pagination" /></div>
        </div>
      )}

      {questionModalOpen && !readOnly && <QuestionFormModal question={editingQuestion} submitting={submitting} onClose={() => setQuestionModalOpen(false)} onSubmit={submitQuestion} />}
    </section>
  );
}
