import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Flag, LockKeyhole, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { completeLesson, fetchLesson, fetchLessonQuiz, saveLearningSession, submitQuizAttempt } from '../../features/learning/learningApi';
import { resolveAssetUrl } from '../../utils/assets';
import {
  getLessonPlaybackSession,
  getQuizDraft,
  mergeQuizSubmissionState,
  mergeQuizAnswerDraft,
  shouldAutosavePosition,
} from '../../utils/learningSession';
import { createVideoSeekGuard, isForwardSeekLocked } from '../../utils/videoSeekGuard';
import { getLessonNavigation } from '../../utils/lessonNavigation';
import { getQuizLockMessage, getQuizStatusLabel } from '../../utils/quizPresentation';
import { buildQuizPresentation, getQuizAnswerText } from '../../utils/quizShuffle';

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
  const sessionQueueRef = useRef(Promise.resolve());
  const lastVideoSaveAtRef = useRef(0);
  const latestVideoPositionRef = useRef(0);
  const sessionReadyRef = useRef(false);

  const persistSession = useCallback((payload) => {
    const request = sessionQueueRef.current
      .catch(() => undefined)
      .then(() => saveLearningSession(lessonId, payload));
    sessionQueueRef.current = request;
    return request;
  }, [lessonId]);
  const loadQuiz = useCallback(() => fetchLessonQuiz(lessonId).then((response) => {
    setQuiz(response.data.quiz);
    setAnswers(getQuizDraft(response.data.quiz));
  }).catch((error) => { if (error.response?.status !== 404) toast.error(error.response?.data?.message || 'Could not load quiz.'); }), [lessonId]);
  useEffect(() => {
    sessionReadyRef.current = false;
    setLoading(true);
    setLesson(null);
    setQuiz(null);
    setAnswers({});
    setResult(null);
    setVideoError(false);
    Promise.all([fetchLesson(lessonId).then((response) => setLesson(response.data.lesson)), loadQuiz()])
      .catch((error) => toast.error(error.response?.data?.message || 'Could not load lesson.'))
      .finally(() => setLoading(false));
  }, [lessonId, loadQuiz]);

  const quizLockReason = quiz?.lock_reason ?? lesson?.learning_state?.quiz?.lock_reason;
  const { resumePosition, furthestWatched } = getLessonPlaybackSession(lesson);
  const forwardSeekLocked = isForwardSeekLocked({
    completedAt: lesson?.learning_state?.completed_at,
    quizLockReason,
    canSkip: lesson?.can_skip,
  });
  const lessonNavigation = getLessonNavigation({
    currentLessonId: lessonId,
    courseLessons: lesson?.course_lessons,
    completedAt: lesson?.learning_state?.completed_at,
    quiz,
  });
  const presentedQuestions = buildQuizPresentation(quiz);

  useEffect(() => {
    if (!lesson) return;
    seekGuardRef.current = createVideoSeekGuard({
      unlocked: !forwardSeekLocked,
      initialPositionSeconds: furthestWatched,
    });
    latestVideoPositionRef.current = resumePosition;
    lastVideoSaveAtRef.current = 0;
    sessionReadyRef.current = true;
  }, [lesson, lessonId, forwardSeekLocked, furthestWatched, resumePosition]);

  const persistVideoPosition = useCallback((position, { force = false } = {}) => {
    const numericPosition = Number(position);
    if (!sessionReadyRef.current || !Number.isFinite(numericPosition) || numericPosition < 0) {
      return Promise.resolve();
    }
    latestVideoPositionRef.current = numericPosition;
    const now = Date.now();
    if (!shouldAutosavePosition({ nowMs: now, lastSavedAtMs: lastVideoSaveAtRef.current, force })) {
      return Promise.resolve();
    }
    lastVideoSaveAtRef.current = now;
    return persistSession({
      video_position_seconds: numericPosition,
      furthest_watched_seconds: seekGuardRef.current.furthestWatched,
    }).catch(() => undefined);
  }, [persistSession]);

  useEffect(() => {
    const flushPosition = () => persistVideoPosition(latestVideoPositionRef.current, { force: true });
    window.addEventListener('pagehide', flushPosition);
    return () => {
      window.removeEventListener('pagehide', flushPosition);
      flushPosition();
    };
  }, [persistVideoPosition]);

  const finished = async (duration) => {
    if (forwardSeekLocked && !seekGuardRef.current.canComplete(duration)) {
      toast.error('Watch the entire video without skipping to unlock the quiz.');
      return;
    }
    if (completing) return;
    sessionReadyRef.current = false;
    setCompleting(true);
    try {
      await sessionQueueRef.current.catch(() => undefined);
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
    catch (error) { sessionReadyRef.current = true; toast.error(error.response?.data?.message || 'Could not update lesson progress.'); }
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
    else if (playing) persistVideoPosition(video.currentTime);
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
      else if (playing ?? player.getPlayerState?.() === window.YT.PlayerState.PLAYING) {
        persistVideoPosition(player.getCurrentTime());
      }
      return verdict;
    };
    const createPlayer = () => {
      if (disposed || !youtubeHost.current || !window.YT?.Player) return;
      player = new window.YT.Player(youtubeHost.current, {
        videoId,
        events: {
          onReady: () => {
            if (disposed) return;
            if (resumePosition > 0) player.seekTo(resumePosition, true);
            inspectYoutubePlayback({ playing: false });
            monitor = window.setInterval(inspectYoutubePlayback, 250);
          },
          onStateChange: (event) => {
            const verdict = inspectYoutubePlayback({
              playing: event.data === window.YT.PlayerState.PLAYING,
            });
            if (event.data === window.YT.PlayerState.PAUSED) {
              persistVideoPosition(player.getCurrentTime(), { force: true });
            }
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
    return () => {
      disposed = true;
      if (monitor) window.clearInterval(monitor);
      if (player?.getCurrentTime) persistVideoPosition(player.getCurrentTime(), { force: true });
      player?.destroy?.();
    };
  }, [videoId, loading, persistVideoPosition, resumePosition]);

  const selectAnswer = (questionId, choice) => {
    const updatedAnswers = mergeQuizAnswerDraft(answers, questionId, choice);
    setAnswers(updatedAnswers);
    persistSession({ quiz_answers: updatedAnswers })
      .catch(() => toast.error('Could not save your quiz progress.'));
  };

  const submit = async (event) => {
    event.preventDefault();
    if (submittingQuiz) return;
    if (Object.keys(answers).length !== quiz.questions.length) return toast.error('Answer every question before submitting.');
    sessionReadyRef.current = false;
    setSubmittingQuiz(true);
    try { await sessionQueueRef.current.catch(() => undefined); const response = await submitQuizAttempt(quiz.id, answers); const requiresRewatch = response.data.quiz_state?.lock_reason === 'REWATCH_REQUIRED'; setLesson((current) => mergeQuizSubmissionState(current, response.data.quiz_state)); setResult(response.data.attempt); setAnswers({}); toast.success(response.data.attempt.passed ? 'You passed the quiz!' : `Score: ${response.data.attempt.score}/10`); if (response.data.certificate) toast.success('Course completed! Your certificate is ready.'); await loadQuiz(); if (!requiresRewatch) sessionReadyRef.current = true; }
    catch (error) { sessionReadyRef.current = true; toast.error(error.response?.data?.message || 'Could not submit quiz.'); }
    finally { setSubmittingQuiz(false); }
  };

  if (loading) return <div className="rounded-2xl bg-white p-14 text-center">Loading lesson...</div>;
  if (!lesson) return null;
  return <section className="space-y-7"><div><div className="flex items-center justify-between gap-4"><Link to={`/my-courses/${courseId}`} className="text-sm font-semibold text-primary">← Back to course</Link>{lessonNavigation && <Link to={lessonNavigation.type === 'next' ? `/learn/courses/${courseId}/lessons/${lessonNavigation.lessonId}` : `/my-courses/${courseId}`} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-secondary px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-90">{lessonNavigation.type === 'finish' && <Flag size={16} />}{lessonNavigation.label}{lessonNavigation.type === 'next' && <ArrowRight size={16} />}</Link>}</div><h1 className="mt-2 text-3xl font-bold">{lesson.title}</h1></div>
    <div className="overflow-hidden rounded-2xl bg-black shadow-xl">{videoId ? <div ref={youtubeHost} className="aspect-video w-full" title={lesson.title} /> : <video className="aspect-video w-full" src={resolveAssetUrl(lesson.video_url)} controls onLoadedMetadata={(event) => { const video = event.currentTarget; if (resumePosition > 0) video.currentTime = Math.min(resumePosition, Math.max(0, video.duration - 0.1)); inspectPlayback(video, { seeking: true, playing: false }); }} onPlay={(event) => inspectPlayback(event.currentTarget, { playing: true })} onPlaying={(event) => inspectPlayback(event.currentTarget, { playing: true })} onPause={(event) => { inspectPlayback(event.currentTarget, { playing: false }); persistVideoPosition(event.currentTarget.currentTime, { force: true }); }} onWaiting={(event) => inspectPlayback(event.currentTarget, { playing: false })} onRateChange={(event) => inspectPlayback(event.currentTarget)} onTimeUpdate={(event) => { if (!event.currentTarget.seeking) inspectPlayback(event.currentTarget); }} onSeeking={(event) => inspectPlayback(event.currentTarget, { seeking: true })} onSeeked={(event) => persistVideoPosition(event.currentTarget.currentTime, { force: true })} onEnded={(event) => { const verdict = inspectPlayback(event.currentTarget, { playing: false }); if (!verdict.blocked) finished(event.currentTarget.duration); }} onError={() => setVideoError(true)}>Your browser cannot play this video.</video>}{forwardSeekLocked && !videoError && <div className="flex items-center justify-center gap-2 bg-slate-900 px-4 py-3 text-sm font-medium text-white"><LockKeyhole size={16} /> {quizLockReason === 'REWATCH_REQUIRED' ? 'Forward seeking is disabled during the required rewatch.' : 'Forward seeking is disabled until you watch the full video.'}</div>}{videoError && <div className="bg-error/10 p-4 text-center text-error">This lesson video is unavailable. Progress and quiz access were not changed.</div>}</div>

    {quiz && <div className="rounded-2xl bg-white p-6 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-2xl font-bold">{quiz.title}</h2><p className="mt-1 text-sm text-slate-500">Pass at {quiz.passing_score}% · Maximum {quiz.max_attempts} failed attempts per watch</p>{quiz.best_score != null && <p className="mt-1 text-sm font-semibold text-primary">Best score: {quiz.best_score}/10</p>}</div><span className={`rounded-full px-3 py-1 text-sm font-bold ${quiz.passed ? 'bg-success/10 text-success' : quiz.locked ? 'bg-accent/10 text-accent' : 'bg-primary/10 text-primary'}`}>{getQuizStatusLabel(quiz)}</span></div>
      {quiz.locked ? <div className="mt-5 flex items-center gap-3 rounded-xl bg-slate-50 p-5">{quiz.lock_reason === 'REWATCH_REQUIRED' ? <RotateCcw className="text-accent" /> : quiz.passed ? <CheckCircle2 className="text-success" /> : <LockKeyhole className="text-slate-500" />}<p>{getQuizLockMessage(quiz)}</p></div> : <form onSubmit={submit} className="mt-6 space-y-6">{presentedQuestions.map((question, index) => <fieldset key={question.id} className="rounded-xl border border-slate-100 p-4"><legend className="px-2 font-bold">{index + 1}. {question.content}</legend><div className="mt-3 grid gap-2 sm:grid-cols-2">{question.display_options.map((option, optionIndex) => { const displayChoice = String.fromCharCode(65 + optionIndex); return <label key={option.value} className={`cursor-pointer rounded-lg border p-3 ${answers[question.id] === option.value ? 'border-primary bg-primary/5' : 'border-slate-200'}`}><input className="mr-2" type="radio" name={question.id} value={option.value} checked={answers[question.id] === option.value} disabled={submittingQuiz} onChange={() => selectAnswer(question.id, option.value)} />{displayChoice}. {option.text}</label>; })}</div></fieldset>)}<button disabled={submittingQuiz} className="rounded-xl bg-gradient-to-r from-primary to-secondary px-6 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-60">{submittingQuiz ? 'Submitting...' : quiz.passed ? 'Retake quiz' : 'Submit quiz'}</button></form>}
      {result && <div className={`mt-5 rounded-xl p-4 ${result.passed ? 'bg-success/10' : 'bg-amber-50'}`}><strong>Score: {result.score}/10 — {result.passed ? 'Pass' : 'Not passed'}</strong><div className="mt-3 space-y-1 text-sm">{result.feedback?.map((item) => <p key={item.question_id} className={item.correct ? 'text-success' : 'text-error'}>{item.correct ? '✓' : '✗'} Your answer: {getQuizAnswerText(quiz.questions, item.question_id, item.submitted_answer)}{!item.correct && `; correct: ${getQuizAnswerText(quiz.questions, item.question_id, item.correct_answer)}`}</p>)}</div></div>}
    </div>}
  </section>;
}
