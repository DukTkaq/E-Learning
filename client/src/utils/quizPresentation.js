const failedAttemptsLeft = (quiz) => Math.max(0, Number(quiz?.remaining_failed_attempts) || 0);

const failedAttemptLabel = (count) => `${count} failed attempt${count === 1 ? '' : 's'} left`;

export const getQuizStatusLabel = (quiz = {}) => {
  if (quiz.lock_reason === 'WATCH_REQUIRED') return 'Watch lesson first';
  if (quiz.lock_reason === 'REWATCH_REQUIRED') {
    return quiz.passed ? 'Passed · Rewatch required' : 'Rewatch required';
  }

  const allowance = failedAttemptLabel(failedAttemptsLeft(quiz));
  return quiz.passed ? `Passed · ${allowance}` : allowance;
};

export const getQuizLockMessage = (quiz = {}) => {
  if (quiz.lock_reason === 'WATCH_REQUIRED') {
    return 'Watch this video to the end to unlock the quiz.';
  }
  if (quiz.lock_reason === 'REWATCH_REQUIRED') {
    const bestScore = quiz.best_score == null ? '' : `Best score: ${quiz.best_score}/10. `;
    return `${bestScore}You failed ${quiz.max_attempts} times. Watch this video to the end again to retry the quiz.`;
  }
  return '';
};
