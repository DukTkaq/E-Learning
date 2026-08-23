const nonNegativeNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : 0;
};

export const getLessonPlaybackSession = (lesson) => {
  const state = lesson?.learning_state || {};
  const resumePosition = nonNegativeNumber(state.resume_position_seconds);
  return {
    resumePosition,
    furthestWatched: Math.max(resumePosition, nonNegativeNumber(state.furthest_watched_seconds)),
  };
};

export const getQuizDraft = (quiz) => {
  const draft = quiz?.draft_answers;
  return draft && typeof draft === 'object' && !Array.isArray(draft) ? { ...draft } : {};
};

export const shouldAutosavePosition = ({
  nowMs,
  lastSavedAtMs,
  force = false,
  intervalMs = 3000,
}) => force || Number(nowMs) - Number(lastSavedAtMs) >= intervalMs;

export const mergeQuizAnswerDraft = (answers, questionId, choice) => ({
  ...(answers && typeof answers === 'object' && !Array.isArray(answers) ? answers : {}),
  [String(questionId)]: choice,
});

export const mergeQuizSubmissionState = (lesson, quizState) => {
  if (!lesson || !quizState) return lesson;
  const requiresRewatch = quizState.lock_reason === 'REWATCH_REQUIRED';
  return {
    ...lesson,
    learning_state: {
      ...lesson.learning_state,
      ...(requiresRewatch ? { resume_position_seconds: 0, furthest_watched_seconds: 0 } : {}),
      quiz: {
        ...lesson.learning_state?.quiz,
        ...quizState,
      },
    },
  };
};
