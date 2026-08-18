const PASSING_SCORE = 4;
const MAX_ATTEMPTS_PER_CYCLE = 3;

const normalizeAnswer = (value) => String(value ?? '').trim().toUpperCase();

const calculateQuizResult = (questions, submittedAnswers) => {
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error('Quiz has no questions to grade.');
  }
  if (!submittedAnswers || typeof submittedAnswers !== 'object' || Array.isArray(submittedAnswers)) {
    throw new Error('You must answer every question.');
  }

  const questionIds = new Set(questions.map((question) => String(question.id)));
  const answerIds = Object.keys(submittedAnswers);
  if (answerIds.some((id) => !questionIds.has(id))) {
    throw new Error('Submission contains an unknown question.');
  }
  if (answerIds.length !== questions.length
    || questions.some((question) => !normalizeAnswer(submittedAnswers[question.id]))) {
    throw new Error('You must answer every question.');
  }
  if (questions.some((question) => !['A', 'B', 'C', 'D'].includes(normalizeAnswer(submittedAnswers[question.id])))) {
    throw new Error('Every answer must be A, B, C, or D.');
  }

  const feedback = questions.map((question) => {
    const submitted = normalizeAnswer(submittedAnswers[question.id]);
    const correctAnswer = normalizeAnswer(question.correct_answer);
    return {
      question_id: String(question.id),
      submitted_answer: submitted,
      correct_answer: correctAnswer,
      correct: submitted === correctAnswer,
    };
  });
  const correctCount = feedback.filter((item) => item.correct).length;
  const score = Number(((correctCount / questions.length) * 10).toFixed(2));

  return {
    correctCount,
    questionCount: questions.length,
    score,
    passed: score >= PASSING_SCORE,
    feedback,
  };
};

const getCurrentAttempts = (watchCycle, attempts) => (attempts || [])
  .filter((attempt) => Number(attempt.watch_cycle) === Number(watchCycle));

const getQuizState = ({ watchCycle = 0, attempts = [] }) => {
  const cycle = Number(watchCycle) || 0;
  const currentAttempts = getCurrentAttempts(cycle, attempts);
  const passed = currentAttempts.some((attempt) => Boolean(attempt.passed));
  const attemptsUsed = currentAttempts.length;

  if (cycle <= 0) {
    return {
      watch_cycle: 0,
      attempts_used: 0,
      remaining_attempts: 0,
      passed: false,
      locked: true,
      lock_reason: 'WATCH_REQUIRED',
    };
  }

  if (passed) {
    return {
      watch_cycle: cycle,
      attempts_used: attemptsUsed,
      remaining_attempts: 0,
      passed: true,
      locked: true,
      lock_reason: 'PASSED',
    };
  }

  const remainingAttempts = Math.max(0, MAX_ATTEMPTS_PER_CYCLE - attemptsUsed);
  return {
    watch_cycle: cycle,
    attempts_used: attemptsUsed,
    remaining_attempts: remainingAttempts,
    passed: false,
    locked: remainingAttempts === 0,
    lock_reason: remainingAttempts === 0 ? 'REWATCH_REQUIRED' : null,
  };
};

const nextWatchCycle = ({ watchCycle = 0, attempts = [] }) => {
  const state = getQuizState({ watchCycle, attempts });
  if (state.watch_cycle === 0) return 1;
  if (state.lock_reason === 'REWATCH_REQUIRED') return state.watch_cycle + 1;
  return state.watch_cycle;
};

const validateReviewInput = ({ rating, comment }) => {
  if (!Number.isInteger(rating)) throw new Error('Rating must be a whole number.');
  if (rating < 1 || rating > 5) throw new Error('Rating must be between 1 and 5.');
  const normalizedComment = String(comment || '').trim();
  if (!normalizedComment) throw new Error('Review comment is required.');
  if (normalizedComment.length > 2000) throw new Error('Review comment cannot exceed 2,000 characters.');
  return { rating, comment: normalizedComment };
};

module.exports = {
  MAX_ATTEMPTS_PER_CYCLE,
  PASSING_SCORE,
  calculateQuizResult,
  getQuizState,
  nextWatchCycle,
  validateReviewInput,
};
