const MIN_LESSONS = 3;
const MIN_QUESTIONS_PER_QUIZ = 3;

const getCourseSubmissionIssues = (course, lessons) => {
  const issues = [];

  if (!String(course.description || '').trim()) {
    issues.push('Add a course description.');
  }

  if (!String(course.thumbnail || '').trim()) {
    issues.push('Upload a course thumbnail.');
  }

  if (lessons.length < MIN_LESSONS) {
    issues.push(`Add at least ${MIN_LESSONS} lessons. Current: ${lessons.length}.`);
  }

  const finalLessons = lessons.filter((lesson) => lesson.is_final);
  if (finalLessons.length !== 1) {
    issues.push('Set exactly one final lesson.');
  } else if (lessons[lessons.length - 1]?.id !== finalLessons[0].id) {
    issues.push('The final lesson must be the last lesson.');
  }

  lessons.forEach((lesson) => {
    if (!lesson.Quiz) {
      issues.push(`Add a quiz to the lesson "${lesson.title}".`);
      return;
    }

    const questionCount = Array.isArray(lesson.Quiz.Questions)
      ? lesson.Quiz.Questions.length
      : 0;
    if (questionCount < MIN_QUESTIONS_PER_QUIZ) {
      issues.push(
        `Add at least ${MIN_QUESTIONS_PER_QUIZ} questions to the quiz for lesson "${lesson.title}". Current: ${questionCount}.`,
      );
    }
  });

  return issues;
};

module.exports = { getCourseSubmissionIssues, MIN_LESSONS, MIN_QUESTIONS_PER_QUIZ };
