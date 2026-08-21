import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Flag, LockKeyhole, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { completeLesson, fetchLesson, fetchLessonQuiz, submitQuizAttempt } from '../../features/learning/learningApi';
import { resolveAssetUrl } from '../../utils/assets';
import { createVideoSeekGuard, isForwardSeekLocked } from '../../utils/videoSeekGuard';
import { getLessonNavigation } from '../../utils/lessonNavigation';

const youtubeId = (url = '') => url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{11})/)?.[1];

export default function LessonPlayerPage() {
  const { courseId, lessonId } = useParams();
  const [lesson, setLesson] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const youtubeHost = useRef(null);
  const finishedRef = useRef(null);
  const seekGuardRef = useRef(createVideoSeekGuard());

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

  const quizLockReason = quiz?.lock_reason ?? lesson?.learning_state?.quiz?.lock_reason;
  const forwardSeekLocked = isForwardSeekLocked({
    completedAt: lesson?.learning_state?.completed_at,
    quizLockReason,
  });
  const lessonNavigation = getLessonNavigation({
    currentLessonId: lessonId,
    courseLessons: lesson?.course_lessons,
    completedAt: lesson?.learning_state?.completed_at,
    quiz,
  });

  useEffect(() => {
    seekGuardRef.current = createVideoSeekGuard({ unlocked: !forwardSeekLocked });
  }, [lessonId, forwardSeekLocked]);

  const finished = async (duration) => {
    if (forwardSeekLocked && !seekGuardRef.current.canComplete(duration)) {
      toast.error('Watch the entire video without skipping to unlock the quiz.');
      return;
    }
    if (completing) return;
    setCompleting(true);
    try {
      const response = await completeLesson(lessonId);
      setLesson((current) => current ? {
        ...current,
        learning_state: {
          ...current.learning_state,
          ...response.data.progress,
          quiz: response.data.quiz ? {
            ...response.data.progress?.quiz,
            ...response.data.quiz,
          } : response.data.progress?.quiz,
        },
      } : current);
      toast.success('Lesson marked as watched.');
      await loadQuiz();
    }
    catch (error) { toast.error(error.response?.data?.message || 'Could not update lesson progress.'); }
    finally { setCompleting(false); }
  };
  finishedRef.current = finished;

  const inspectPlayback = (video, { seeking = false, playing = !video.paused && !video.ended } = {}) => {
    const verdict = seekGuardRef.current.observe({
      currentTime: video.currentTime,
      nowMs: Date.now(),
      playbackRate: video.playbackRate,
      playing,
      seeking,
    });
    if (verdict.blocked) video.currentTime = verdict.targetTime;
    return verdict;
  };

  const videoId = lesson ? youtubeId(lesson.video_url) : null;
  useEffect(() => {
    if (loading || !videoId || !youtubeHost.current) return undefined;
    let player;
    let monitor;
    let disposed = false;
    const inspectYoutubePlayback = ({ playing } = {}) => {
      if (!player?.getCurrentTime) return null;
      const verdict = seekGuardRef.current.observe({
        currentTime: player.getCurrentTime(),
        nowMs: Date.now(),
        playbackRate: player.getPlaybackRate?.() || 1,
        playing: playing ?? player.getPlayerState?.() === window.YT.PlayerState.PLAYING,
      });
      if (verdict.blocked) player.seekTo(verdict.targetTime, true);
      return verdict;
    };
    const createPlayer = () => {
      if (disposed || !youtubeHost.current || !window.YT?.Player) return;
      player = new window.YT.Player(youtubeHost.current, {
        videoId,
        events: {
          onReady: () => {
            if (disposed) return;
            inspectYoutubePlayback({ playing: false });
            monitor = window.setInterval(inspectYoutubePlayback, 250);
          },
          onStateChange: (event) => {
            const verdict = inspectYoutubePlayback({
              playing: event.data === window.YT.PlayerState.PLAYING,
            });
            if (event.data !== window.YT.PlayerState.ENDED) return;
            const duration = player.getDuration?.() || 0;
            if (verdict?.blocked || !seekGuardRef.current.canComplete(duration)) {
              player.seekTo(seekGuardRef.current.furthestWatched, true);
              player.pauseVideo?.();
              toast.error('Watch the entire video without skipping to unlock the quiz.');
              return;
            }
            finishedRef.current?.(duration);
          },
          onPlaybackRateChange: () => inspectYoutubePlayback(),
          onError: () => setVideoError(true),
        },
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
    return () => { disposed = true; if (monitor) window.clearInterval(monitor); player?.destroy?.(); };
  }, [videoId, loading]);

  const submit = async (event) => {
    event.preventDefault();
    if (submittingQuiz) return;
    if (Object.keys(answers).length !== quiz.questions.length) return toast.error('Answer every question before submitting.');
    setSubmittingQuiz(true);
    try { const response = await submitQuizAttempt(quiz.id, answers); setResult(response.data.attempt); setAnswers({}); toast.success(response.data.attempt.passed ? 'You passed the quiz!' : `Score: ${response.data.attempt.score}/10`); if (response.data.certificate) toast.success('Course completed! Your certificate is ready.'); await loadQuiz(); }
    catch (error) { toast.error(error.response?.data?.message || 'Could not submit quiz.'); }
    finally { setSubmittingQuiz(false); }
  };

  if (loading) return <div className="rounded-2xl bg-white p-14 text-center">Loading lesson...</div>;
  if (!lesson) return null;
  return <section className="space-y-7"><div><div className="flex items-center justify-between gap-4"><Link to={`/my-courses/${courseId}`} className="text-sm font-semibold text-primary">← Back to course</Link>{lessonNavigation && <Link to={lessonNavigation.type === 'next' ? `/learn/courses/${courseId}/lessons/${lessonNavigation.lessonId}` : `/my-courses/${courseId}`} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-secondary px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-90">{lessonNavigation.type === 'finish' && <Flag size={16} />}{lessonNavigation.label}{lessonNavigation.type === 'next' && <ArrowRight size={16} />}</Link>}</div><h1 className="mt-2 text-3xl font-bold">{lesson.title}</h1></div>
    <div className="overflow-hidden rounded-2xl bg-black shadow-xl">{videoId ? <div ref={youtubeHost} className="aspect-video w-full" title={lesson.title} /> : <video className="aspect-video w-full" src={resolveAssetUrl(lesson.video_url)} controls onLoadedMetadata={(event) => inspectPlayback(event.currentTarget)} onPlay={(event) => inspectPlayback(event.currentTarget, { playing: true })} onPlaying={(event) => inspectPlayback(event.currentTarget, { playing: true })} onPause={(event) => inspectPlayback(event.currentTarget, { playing: false })} onWaiting={(event) => inspectPlayback(event.currentTarget, { playing: false })} onRateChange={(event) => inspectPlayback(event.currentTarget)} onTimeUpdate={(event) => { if (!event.currentTarget.seeking) inspectPlayback(event.currentTarget); }} onSeeking={(event) => inspectPlayback(event.currentTarget, { seeking: true })} onEnded={(event) => { const verdict = inspectPlayback(event.currentTarget, { playing: false }); if (!verdict.blocked) finished(event.currentTarget.duration); }} onError={() => setVideoError(true)}>Your browser cannot play this video.</video>}{forwardSeekLocked && !videoError && <div className="flex items-center justify-center gap-2 bg-slate-900 px-4 py-3 text-sm font-medium text-white"><LockKeyhole size={16} /> {quizLockReason === 'REWATCH_REQUIRED' ? 'Forward seeking is disabled during the required rewatch.' : 'Forward seeking is disabled until you watch the full video.'}</div>}{videoError && <div className="bg-error/10 p-4 text-center text-error">This lesson video is unavailable. Progress and quiz access were not changed.</div>}</div>

    {quiz && <div className="rounded-2xl bg-white p-6 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-2xl font-bold">{quiz.title}</h2><p className="mt-1 text-sm text-slate-500">Pass at {quiz.passing_score}% · Maximum {quiz.max_attempts} attempts per watch</p></div><span className={`rounded-full px-3 py-1 text-sm font-bold ${quiz.passed ? 'bg-success/10 text-success' : quiz.locked ? 'bg-accent/10 text-accent' : 'bg-primary/10 text-primary'}`}>{quiz.passed ? 'Passed' : quiz.lock_reason === 'WATCH_REQUIRED' ? 'Watch lesson first' : quiz.lock_reason === 'REWATCH_REQUIRED' ? 'Rewatch required' : `${quiz.remaining_attempts} attempts left`}</span></div>
      {quiz.locked ? <div className="mt-5 flex items-center gap-3 rounded-xl bg-slate-50 p-5">{quiz.passed ? <CheckCircle2 className="text-success" /> : quiz.lock_reason === 'REWATCH_REQUIRED' ? <RotateCcw className="text-accent" /> : <LockKeyhole className="text-slate-500" />}<p>{quiz.passed ? 'You have completed this quiz.' : quiz.lock_reason === 'REWATCH_REQUIRED' ? `You failed ${quiz.max_attempts} times. Watch this video to the end again to receive new attempts.` : 'Watch this video to the end to unlock the quiz.'}</p></div> : <form onSubmit={submit} className="mt-6 space-y-6">{quiz.questions.map((question, index) => <fieldset key={question.id} className="rounded-xl border border-slate-100 p-4"><legend className="px-2 font-bold">{index + 1}. {question.content}</legend><div className="mt-3 grid gap-2 sm:grid-cols-2">{['A','B','C','D'].map((choice) => <label key={choice} className={`cursor-pointer rounded-lg border p-3 ${answers[question.id] === choice ? 'border-primary bg-primary/5' : 'border-slate-200'}`}><input className="mr-2" type="radio" name={question.id} value={choice} checked={answers[question.id] === choice} onChange={() => setAnswers({ ...answers, [question.id]: choice })} />{choice}. {question[`option_${choice.toLowerCase()}`]}</label>)}</div></fieldset>)}<button disabled={submittingQuiz} className="rounded-xl bg-gradient-to-r from-primary to-secondary px-6 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-60">{submittingQuiz ? 'Submitting...' : 'Submit quiz'}</button></form>}
      {result && <div className={`mt-5 rounded-xl p-4 ${result.passed ? 'bg-success/10' : 'bg-amber-50'}`}><strong>Score: {result.score}/10 — {result.passed ? 'Pass' : 'Not passed'}</strong><div className="mt-3 space-y-1 text-sm">{result.feedback?.map((item) => <p key={item.question_id} className={item.correct ? 'text-success' : 'text-error'}>{item.correct ? '✓' : '✗'} Your answer: {item.submitted_answer}{!item.correct && `; correct: ${item.correct_answer}`}</p>)}</div></div>}
    </div>}
  </section>;
}
