const lessonIsComplete = (lesson, quiz, learningState = {}) => {
  const state = learningState.lessons?.[String(lesson.id)];
  return Boolean(
    quiz
    && state?.completed_at
    && String(state.quiz?.quiz_id) === String(quiz.id)
    && state.quiz?.passed === true,
  );
};

const completedLessonCount = (lessons = [], quizzes = [], learningState = {}) => {
  const quizByLesson = new Map(quizzes.map((quiz) => [String(quiz.lesson_id), quiz]));
  return lessons.filter((lesson) => (
    lessonIsComplete(lesson, quizByLesson.get(String(lesson.id)), learningState)
  )).length;
};

const getSequentialLessonAccess = (lessons = [], quizzes = [], learningState = {}) => {
  const orderedLessons = [...lessons].sort((left, right) => (
    Number(left.order_index) - Number(right.order_index)
  ));
  const quizByLesson = new Map(quizzes.map((quiz) => [String(quiz.lesson_id), quiz]));
  const accessByLesson = {};
  let prerequisitesComplete = true;

  orderedLessons.forEach((lesson) => {
    accessByLesson[String(lesson.id)] = prerequisitesComplete
      ? { locked: false, lock_reason: null }
      : { locked: true, lock_reason: 'PREVIOUS_LESSON_REQUIRED' };

    if (!lessonIsComplete(lesson, quizByLesson.get(String(lesson.id)), learningState)) {
      prerequisitesComplete = false;
    }
  });

  return accessByLesson;
};

const calculateCourseProgress = (lessons = [], quizzes = [], learningState = {}) => {
  if (!lessons.length) return 0;
  return Math.round((completedLessonCount(lessons, quizzes, learningState) / lessons.length) * 100);
};

const isLearningComplete = (lessons = [], quizzes = [], learningState = {}) => (
  lessons.length > 0 && completedLessonCount(lessons, quizzes, learningState) === lessons.length
);

module.exports = {
  calculateCourseProgress,
  getSequentialLessonAccess,
  isLearningComplete,
  lessonIsComplete,
};
