import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, LockKeyhole, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { completeLesson, fetchLesson, fetchLessonQuiz, submitQuizAttempt } from '../../features/learning/learningApi';

const youtubeId = (url = '') => url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{11})/)?.[1];

export default function LessonPlayerPage() {
  const { courseId, lessonId } = useParams();
  const [lesson, setLesson] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);

  const loadQuiz = useCallback(() => fetchLessonQuiz(lessonId).then((response) => setQuiz(response.data.quiz)).catch((error) => { if (error.response?.status !== 404) toast.error(error.response?.data?.message || 'Could not load quiz.'); }), [lessonId]);
  useEffect(() => { setLoading(true); Promise.all([fetchLesson(lessonId).then((response) => setLesson(response.data.lesson)), loadQuiz()]).catch((error) => toast.error(error.response?.data?.message || 'Could not load lesson.')).finally(() => setLoading(false)); }, [lessonId, loadQuiz]);

  const finished = async () => {
    if (completing) return;
    setCompleting(true);
    try { await completeLesson(lessonId); toast.success('Lesson marked as watched.'); await loadQuiz(); }
    catch (error) { toast.error(error.response?.data?.message || 'Could not update lesson progress.'); }
    finally { setCompleting(false); }
  };

  const submit = async (event) => {
    event.preventDefault();
    if (Object.keys(answers).length !== quiz.questions.length) return toast.error('Answer every question before submitting.');
    try { const response = await submitQuizAttempt(quiz.id, answers); setResult(response.data.attempt); toast.success(response.data.attempt.passed ? 'You passed the quiz!' : `Score: ${response.data.attempt.score}/10`); await loadQuiz(); }
    catch (error) { toast.error(error.response?.data?.message || 'Could not submit quiz.'); }
  };

  if (loading) return <div className="rounded-2xl bg-white p-14 text-center">Loading lesson...</div>;
  if (!lesson) return null;
  const videoId = youtubeId(lesson.video_url);

  return <section className="space-y-7"><div><Link to={`/my-courses/${courseId}`} className="text-sm font-semibold text-primary">← Back to course</Link><h1 className="mt-2 text-3xl font-bold">{lesson.title}</h1></div>
    <div className="overflow-hidden rounded-2xl bg-black shadow-xl">{videoId ? <><iframe className="aspect-video w-full" src={`https://www.youtube.com/embed/${videoId}`} title={lesson.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /><div className="flex items-center justify-between bg-slate-900 p-4 text-white"><span className="text-sm text-white/70">After watching to the end, confirm to unlock or reset the quiz.</span><button disabled={completing} onClick={finished} className="rounded-lg bg-primary px-4 py-2 font-semibold disabled:opacity-60">I watched to the end</button></div></> : <video className="aspect-video w-full" src={lesson.video_url} controls onEnded={finished}>Your browser cannot play this video.</video>}</div>

    {quiz && <div className="rounded-2xl bg-white p-6 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-bold uppercase tracking-wider text-primary">UC-20 Quiz</p><h2 className="text-2xl font-bold">{quiz.title}</h2></div><span className={`rounded-full px-3 py-1 text-sm font-bold ${quiz.passed ? 'bg-success/10 text-success' : quiz.locked ? 'bg-amber-100 text-amber-700' : 'bg-primary/10 text-primary'}`}>{quiz.passed ? 'Passed' : quiz.lock_reason === 'WATCH_REQUIRED' ? 'Watch lesson first' : quiz.lock_reason === 'REWATCH_REQUIRED' ? 'Rewatch required' : `${quiz.remaining_attempts} attempts left`}</span></div>
      {quiz.locked ? <div className="mt-5 flex items-center gap-3 rounded-xl bg-slate-50 p-5">{quiz.passed ? <CheckCircle2 className="text-success" /> : quiz.lock_reason === 'REWATCH_REQUIRED' ? <RotateCcw className="text-amber-600" /> : <LockKeyhole className="text-gray-500" />}<p>{quiz.passed ? 'You have completed this quiz.' : quiz.lock_reason === 'REWATCH_REQUIRED' ? 'You failed three times. Watch this video to the end again to receive three new attempts.' : 'Watch this video to the end to unlock the quiz.'}</p></div> : <form onSubmit={submit} className="mt-6 space-y-6">{quiz.questions.map((question, index) => <fieldset key={question.id} className="rounded-xl border border-gray-100 p-4"><legend className="px-2 font-bold">{index + 1}. {question.content}</legend><div className="mt-3 grid gap-2 sm:grid-cols-2">{['A','B','C','D'].map((choice) => <label key={choice} className={`cursor-pointer rounded-lg border p-3 ${answers[question.id] === choice ? 'border-primary bg-primary/5' : 'border-gray-200'}`}><input className="mr-2" type="radio" name={question.id} value={choice} checked={answers[question.id] === choice} onChange={() => setAnswers({ ...answers, [question.id]: choice })} />{choice}. {question[`option_${choice.toLowerCase()}`]}</label>)}</div></fieldset>)}<button className="rounded-xl bg-primary px-6 py-3 font-bold text-white">Submit quiz</button></form>}
      {result && <div className={`mt-5 rounded-xl p-4 ${result.passed ? 'bg-success/10' : 'bg-amber-50'}`}><strong>Score: {result.score}/10 — {result.passed ? 'Pass' : 'Not passed'}</strong><div className="mt-3 space-y-1 text-sm">{result.feedback?.map((item) => <p key={item.question_id} className={item.correct ? 'text-success' : 'text-error'}>{item.correct ? '✓' : '✗'} Your answer: {item.submitted_answer}{!item.correct && `; correct: ${item.correct_answer}`}</p>)}</div></div>}
    </div>}
  </section>;
}
