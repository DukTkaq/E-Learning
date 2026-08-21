export const getLessonNavigation = ({
  currentLessonId,
  courseLessons = [],
  completedAt,
  quiz,
} = {}) => {
  if (!completedAt || !quiz?.passed || !Array.isArray(courseLessons)) return null;

  const orderedLessons = [...courseLessons].sort((first, second) => (
    Number(first.order_index) - Number(second.order_index)
  ));
  const currentIndex = orderedLessons.findIndex((lesson) => (
    String(lesson.id) === String(currentLessonId)
  ));
  if (currentIndex < 0) return null;

  const nextLesson = orderedLessons[currentIndex + 1];
  return nextLesson
    ? { type: 'next', lessonId: nextLesson.id, label: 'Next lesson' }
    : { type: 'finish', lessonId: null, label: 'Finish' };
};
