const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value, key);

const normalizePosition = (value, label) => {
  const position = Number(value);
  if (!Number.isFinite(position) || position < 0) {
    throw new Error(`${label} must be a non-negative number.`);
  }
  return Math.round(position * 10) / 10;
};

const normalizeQuizAnswers = (answers, questionIds = []) => {
  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
    throw new Error('Quiz answers must be an object.');
  }
  const allowedQuestions = new Set(questionIds.map(String));
  return Object.fromEntries(Object.entries(answers).map(([questionId, answer]) => {
    if (!allowedQuestions.has(String(questionId))) throw new Error('Quiz draft contains an unknown question.');
    const choice = String(answer || '').trim().toUpperCase();
    if (!['A', 'B', 'C', 'D'].includes(choice)) throw new Error('Every draft answer must be A, B, C, or D.');
    return [String(questionId), choice];
  }));
};

const mergeLessonSession = (lessonState = {}, payload = {}, {
  quizId,
  questionIds,
  rewatchRequired = false,
  allowSkipping = false,
  savedAt: savedAtValue,
} = {}) => {
  const nextState = { ...lessonState };

  const savedAt = savedAtValue ? new Date(savedAtValue) : new Date();
  if (rewatchRequired && !allowSkipping && (hasOwn(payload, 'furthest_watched_seconds') || hasOwn(payload, 'video_position_seconds'))) {
    const submittedFurthest = hasOwn(payload, 'furthest_watched_seconds')
      ? normalizePosition(payload.furthest_watched_seconds, 'Furthest watched position')
      : 0;
    const submittedPosition = hasOwn(payload, 'video_position_seconds')
      ? normalizePosition(payload.video_position_seconds, 'Video position')
      : 0;
    const submittedCoverage = Math.max(submittedFurthest, submittedPosition);
    const storedRewatchStart = new Date(lessonState.rewatch_started_at);
    const rewatchStartedAt = Number.isFinite(storedRewatchStart.getTime())
      ? storedRewatchStart
      : new Date(savedAt.getTime() - 3000);
    const elapsedSeconds = Math.max(0, (savedAt.getTime() - rewatchStartedAt.getTime()) / 1000);
    const maximumNaturalCoverage = (elapsedSeconds * 2.1) + 1;
    if (submittedCoverage > maximumNaturalCoverage) {
      throw new Error('Saved playback position advances too quickly for a required rewatch.');
    }
    nextState.rewatch_started_at = rewatchStartedAt.toISOString();
    nextState.playback_saved_at = savedAt.toISOString();
  }

  if (hasOwn(payload, 'video_position_seconds')) {
    nextState.resume_position_seconds = normalizePosition(payload.video_position_seconds, 'Video position');
  }
  if (hasOwn(payload, 'furthest_watched_seconds')) {
    const submittedFurthest = normalizePosition(payload.furthest_watched_seconds, 'Furthest watched position');
    nextState.furthest_watched_seconds = Math.max(
      Number(nextState.furthest_watched_seconds) || 0,
      submittedFurthest,
      Number(nextState.resume_position_seconds) || 0,
    );
  }

  if (hasOwn(payload, 'quiz_answers')) {
    if (!quizId) throw new Error('This lesson does not have a quiz.');
    const existingQuiz = String(lessonState.quiz?.quiz_id) === String(quizId)
      ? lessonState.quiz
      : { quiz_id: String(quizId) };
    nextState.quiz = {
      ...existingQuiz,
      quiz_id: String(quizId),
      draft_answers: normalizeQuizAnswers(payload.quiz_answers, questionIds),
    };
  }

  return nextState;
};

module.exports = { mergeLessonSession, normalizeQuizAnswers };
