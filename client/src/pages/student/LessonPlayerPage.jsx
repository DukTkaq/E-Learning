import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, LockKeyhole, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { completeLesson, fetchLesson, fetchLessonQuiz, submitQuizAttempt } from '../../features/learning/learningApi';
import { resolveAssetUrl } from '../../utils/assets';

const youtubeId = (url = '') => url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{11})/)?.[1];

export default function LessonPlayerPage() {
  const { courseId, lessonId } = useParams();
  const [lesson, setLesson] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const youtubeHost = useRef(null);
  const finishedRef = useRef(null);

  const loadQuiz = useCallback(() => fetchLessonQuiz(lessonId).then((response) => setQuiz(response.data.quiz)).catch((error) => { if (error.response?.status !== 404) toast.error(error.response?.data?.message || 'Could not load quiz.'); }), [lessonId]);
  useEffect(() => {
    setLoading(true);
    setQuiz(null);
    setAnswers({});
    setResult(null);
    setVideoError(false);
    Promise.all([fetchLesson(lessonId).then((response) => setLesson(response.data.lesson)), loadQuiz()])
      .catch((error) => toast.error(error.response?.data?.message || 'Could not load lesson.'))
      .finally(() => setLoading(false));
  }, [lessonId, loadQuiz]);

  const finished = async () => {
    if (completing) return;
    setCompleting(true);
    try { await completeLesson(lessonId); toast.success('Lesson marked as watched.'); await loadQuiz(); }
    catch (error) { toast.error(error.response?.data?.message || 'Could not update lesson progress.'); }
    finally { setCompleting(false); }
  };
  finishedRef.current = finished;

  const videoId = lesson ? youtubeId(lesson.video_url) : null;
  useEffect(() => {
    if (!videoId || !youtubeHost.current) return undefined;
    let player;
    let disposed = false;
    const createPlayer = () => {
      if (disposed || !youtubeHost.current || !window.YT?.Player) return;
      player = new window.YT.Player(youtubeHost.current, {
        videoId,
        events: { onStateChange: (event) => { if (event.data === window.YT.PlayerState.ENDED) finishedRef.current?.(); } },
      });
    };
    if (window.YT?.Player) createPlayer();
    else {
      const previous = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { previous?.(); createPlayer(); };
      if (!document.getElementById('youtube-iframe-api')) {
        const script = document.createElement('script');
        script.id = 'youtube-iframe-api';
        script.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(script);
      }
    }
    return () => { disposed = true; player?.destroy?.(); };
  }, [videoId]);

  const submit = async (event) => {
    event.preventDefault();
    if (Object.keys(answers).length !== quiz.questions.length) return toast.error('Answer every question before submitting.');
    try { const response = await submitQuizAttempt(quiz.id, answers); setResult(response.data.attempt); toast.success(response.data.attempt.passed ? 'You passed the quiz!' : `Score: ${response.data.attempt.score}/10`); await loadQuiz(); }
    catch (error) { toast.error(error.response?.data?.message || 'Could not submit quiz.'); }
  };

  if (loading) return <div className="rounded-2xl bg-white p-14 text-center">Loading lesson...</div>;
  if (!lesson) return null;
  return <section className="space-y-7"><div><Link to={`/my-courses/${courseId}`} className="text-sm font-semibold text-primary">← Back to course</Link><h1 className="mt-2 text-3xl font-bold">{lesson.title}</h1></div>
    <div className="overflow-hidden rounded-2xl bg-black shadow-xl">{videoId ? <div ref={youtubeHost} className="aspect-video w-full" title={lesson.title} /> : <video className="aspect-video w-full" src={resolveAssetUrl(lesson.video_url)} controls onEnded={finished} onError={() => setVideoError(true)}>Your browser cannot play this video.</video>}{videoError && <div className="bg-error/10 p-4 text-center text-error">This lesson video is unavailable. Progress and quiz access were not changed.</div>}</div>

    {quiz && <div className="rounded-2xl bg-white p-6 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-bold uppercase tracking-wider text-primary">UC-20 Quiz</p><h2 className="text-2xl font-bold">{quiz.title}</h2></div><span className={`rounded-full px-3 py-1 text-sm font-bold ${quiz.passed ? 'bg-success/10 text-success' : quiz.locked ? 'bg-amber-100 text-amber-700' : 'bg-primary/10 text-primary'}`}>{quiz.passed ? 'Passed' : quiz.lock_reason === 'WATCH_REQUIRED' ? 'Watch lesson first' : quiz.lock_reason === 'REWATCH_REQUIRED' ? 'Rewatch required' : `${quiz.remaining_attempts} attempts left`}</span></div>
      {quiz.locked ? <div className="mt-5 flex items-center gap-3 rounded-xl bg-slate-50 p-5">{quiz.passed ? <CheckCircle2 className="text-success" /> : quiz.lock_reason === 'REWATCH_REQUIRED' ? <RotateCcw className="text-amber-600" /> : <LockKeyhole className="text-gray-500" />}<p>{quiz.passed ? 'You have completed this quiz.' : quiz.lock_reason === 'REWATCH_REQUIRED' ? 'You failed three times. Watch this video to the end again to receive three new attempts.' : 'Watch this video to the end to unlock the quiz.'}</p></div> : <form onSubmit={submit} className="mt-6 space-y-6">{quiz.questions.map((question, index) => <fieldset key={question.id} className="rounded-xl border border-gray-100 p-4"><legend className="px-2 font-bold">{index + 1}. {question.content}</legend><div className="mt-3 grid gap-2 sm:grid-cols-2">{['A','B','C','D'].map((choice) => <label key={choice} className={`cursor-pointer rounded-lg border p-3 ${answers[question.id] === choice ? 'border-primary bg-primary/5' : 'border-gray-200'}`}><input className="mr-2" type="radio" name={question.id} value={choice} checked={answers[question.id] === choice} onChange={() => setAnswers({ ...answers, [question.id]: choice })} />{choice}. {question[`option_${choice.toLowerCase()}`]}</label>)}</div></fieldset>)}<button className="rounded-xl bg-primary px-6 py-3 font-bold text-white">Submit quiz</button></form>}
      {result && <div className={`mt-5 rounded-xl p-4 ${result.passed ? 'bg-success/10' : 'bg-amber-50'}`}><strong>Score: {result.score}/10 — {result.passed ? 'Pass' : 'Not passed'}</strong><div className="mt-3 space-y-1 text-sm">{result.feedback?.map((item) => <p key={item.question_id} className={item.correct ? 'text-success' : 'text-error'}>{item.correct ? '✓' : '✗'} Your answer: {item.submitted_answer}{!item.correct && `; correct: ${item.correct_answer}`}</p>)}</div></div>}
    </div>}
  </section>;
}
