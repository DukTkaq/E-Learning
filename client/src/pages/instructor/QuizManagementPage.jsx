import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Edit3, LoaderCircle, Plus, RefreshCw, Save, Trash2, HelpCircle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import QuestionFormModal from '../../components/lessons/QuestionFormModal';
import { fetchQuiz, createQuiz, updateQuiz, deleteQuiz, addQuestion, updateQuestion, deleteQuestion } from '../../features/lessons/lessonApi';
import { fetchInstructorCourse } from '../../features/courses/courseApi';

export default function QuizManagementPage() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [quizTitle, setQuizTitle] = useState('');
  const [passingScore, setPassingScore] = useState(70);
  const [maxAttempts, setMaxAttempts] = useState(3);
  const [dirty, setDirty] = useState(false);

  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(undefined);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [quizRes, courseRes] = await Promise.all([
        fetchQuiz(courseId, lessonId),
        fetchInstructorCourse(courseId),
      ]);
      setCourse(courseRes.data.course || null);
      const q = quizRes.data.quiz;
      setQuiz(q);
      setQuestions(quizRes.data.questions || []);
      if (q) {
        setQuizTitle(q.title);
        setPassingScore(q.passing_score);
        setMaxAttempts(q.max_attempts);
        setDirty(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not load quiz data.');
    } finally {
      setLoading(false);
    }
  }, [courseId, lessonId]);

  useEffect(() => { loadData(); }, [loadData]);

  const createNewQuiz = async () => {
    if (!quizTitle.trim()) {
      toast.error('Please enter a quiz title first.');
      return;
    }
    setSubmitting(true);
    try {
      await createQuiz(courseId, lessonId, {
        title: quizTitle.trim(),
        passing_score: passingScore,
        max_attempts: maxAttempts,
      });
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
    if (!quizTitle.trim()) {
      toast.error('Quiz title cannot be empty.');
      return;
    }
    setSubmitting(true);
    try {
      await updateQuiz(courseId, lessonId, {
        title: quizTitle.trim(),
        passing_score: passingScore,
        max_attempts: maxAttempts,
      });
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
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not delete quiz.');
    }
  };

  const openAddQuestion = () => { setEditingQuestion(undefined); setQuestionModalOpen(true); };
  const openEditQuestion = (q) => { setEditingQuestion(q); setQuestionModalOpen(true); };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoaderCircle className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <section>
      <div className="mb-6">
        <button type="button" onClick={() => navigate(`/instructor/courses/${courseId}/lessons`)} className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-primary transition">
          <ArrowLeft size={16} /> Back to lessons
        </button>
        <div className="mb-2 flex items-center gap-2 text-primary"><HelpCircle size={20} /><span className="text-sm font-bold uppercase tracking-wider">Quiz Management</span></div>
        <h1 className="text-3xl font-bold text-slate-900">{course?.title || 'Loading...'}</h1>
      </div>

      {/* Quiz Settings Card */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Quiz Settings</h2>
          <div className="flex gap-2">
            {quiz && (
              <button type="button" onClick={removeQuiz} className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 font-semibold text-red-600 shadow-sm transition hover:bg-red-50">
                <Trash2 size={16} /> Delete quiz
              </button>
            )}
            <button type="button" onClick={loadData} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 font-semibold text-gray-600 shadow-sm transition hover:border-primary/30 hover:text-primary">
              <RefreshCw size={16} /> Refresh
            </button>
          </div>
        </div>

        {!quiz && !dirty && (
          <div className="rounded-xl border border-dashed border-primary/25 bg-primary/5 p-6 text-center">
            <HelpCircle className="mx-auto mb-2 text-primary" size={32} />
            <p className="font-semibold text-slate-800">No quiz for this lesson yet</p>
            <p className="mt-1 text-sm text-gray-500">Configure the settings below and click "Create quiz" to get started.</p>
          </div>
        )}

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <label className="block text-sm font-semibold text-slate-700">
            Quiz title <span className="text-error">*</span>
            <input
              value={quizTitle}
              onChange={(e) => { setQuizTitle(e.target.value); setDirty(true); }}
              className="mt-1.5 w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm font-normal outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
              placeholder="e.g. Chapter 1 Quiz"
            />
          </label>

          <label className="block text-sm font-semibold text-slate-700">
            Passing score (%) <span className="text-error">*</span>
            <input
              type="number"
              min={1}
              max={100}
              value={passingScore}
              onChange={(e) => { setPassingScore(parseInt(e.target.value, 10) || 70); setDirty(true); }}
              className="mt-1.5 w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm font-normal outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
            />
          </label>

          <label className="block text-sm font-semibold text-slate-700">
            Max attempts <span className="text-error">*</span>
            <input
              type="number"
              min={1}
              max={100}
              value={maxAttempts}
              onChange={(e) => { setMaxAttempts(parseInt(e.target.value, 10) || 1); setDirty(true); }}
              className="mt-1.5 w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm font-normal outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
            />
          </label>
        </div>

        <div className="mt-4 flex justify-end">
          {!quiz ? (
            <button type="button" onClick={createNewQuiz} disabled={submitting} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-secondary px-5 py-2.5 font-semibold text-white shadow-lg shadow-primary/20 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">
              {submitting && <LoaderCircle className="animate-spin" size={18} />}
              Create quiz
            </button>
          ) : dirty && (
            <button type="button" onClick={saveQuizSettings} disabled={submitting} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-secondary px-5 py-2.5 font-semibold text-white shadow-lg shadow-primary/20 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">
              {submitting && <LoaderCircle className="animate-spin" size={18} />}
              <Save size={16} /> Save changes
            </button>
          )}
        </div>
      </div>

      {/* Questions Table */}
      {quiz && (
        <div className="mt-6 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <h3 className="text-lg font-bold text-slate-900">Questions ({questions.length})</h3>
            <button type="button" onClick={openAddQuestion} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-secondary px-4 py-2.5 font-semibold text-white shadow-lg shadow-primary/20 transition hover:opacity-90">
              <Plus size={16} /> Add question
            </button>
          </div>

          {!questions.length ? (
            <div className="p-12 text-center">
              <HelpCircle className="mx-auto mb-3 text-gray-300" size={40} />
              <p className="font-semibold text-slate-800">No questions yet</p>
              <p className="mt-1 text-sm text-gray-500">Click "Add question" to create your first question.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left">
                <thead className="border-b border-gray-100 bg-slate-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-6 py-3 font-semibold w-10">#</th>
                    <th className="px-6 py-3 font-semibold">Question</th>
                    <th className="px-6 py-3 font-semibold">A</th>
                    <th className="px-6 py-3 font-semibold">B</th>
                    <th className="px-6 py-3 font-semibold">C</th>
                    <th className="px-6 py-3 font-semibold">D</th>
                    <th className="px-6 py-3 font-semibold">Answer</th>
                    <th className="px-6 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {questions.map((q, index) => (
                    <tr key={q.id} className="transition-colors hover:bg-slate-50/70">
                      <td className="px-6 py-4 text-sm font-medium text-gray-500">{index + 1}</td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-800 max-w-[250px]">
                        <p className="line-clamp-2">{q.content}</p>
                      </td>
                      <td className={`px-6 py-4 text-sm ${q.correct_answer === 'A' ? 'font-bold text-green-600 bg-green-50' : 'text-gray-600'}`}>{q.option_a}</td>
                      <td className={`px-6 py-4 text-sm ${q.correct_answer === 'B' ? 'font-bold text-green-600 bg-green-50' : 'text-gray-600'}`}>{q.option_b}</td>
                      <td className={`px-6 py-4 text-sm ${q.correct_answer === 'C' ? 'font-bold text-green-600 bg-green-50' : 'text-gray-600'}`}>{q.option_c}</td>
                      <td className={`px-6 py-4 text-sm ${q.correct_answer === 'D' ? 'font-bold text-green-600 bg-green-50' : 'text-gray-600'}`}>{q.option_d}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-green-100 text-xs font-bold text-green-700">{q.correct_answer}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-1">
                          <button type="button" onClick={() => openEditQuestion(q)} className="rounded-lg p-2 text-gray-400 hover:bg-primary/10 hover:text-primary" title="Edit">
                            <Edit3 size={16} />
                          </button>
                          <button type="button" onClick={() => removeQuestion(q)} className="rounded-lg p-2 text-gray-400 hover:bg-error/10 hover:text-error" title="Delete">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {questionModalOpen && (
        <QuestionFormModal question={editingQuestion} submitting={submitting} onClose={() => setQuestionModalOpen(false)} onSubmit={submitQuestion} />
      )}
    </section>
  );
}
