const test = require('node:test');
const assert = require('node:assert/strict');
const { getCourseSubmissionIssues } = require('../src/rules/courseSubmissionRules');

const completeCourse = {
  description: 'Learn the fundamentals.',
  thumbnail: 'https://example.com/course.jpg',
};

const questions = (count) => Array.from({ length: count }, (_, index) => ({
  id: `question-${index + 1}`,
}));

const lesson = (number, options = {}) => ({
  id: `lesson-${number}`,
  title: `Lesson ${number}`,
  order_index: number - 1,
  is_final: options.isFinal || false,
  Quiz: options.withoutQuiz ? null : {
    id: `quiz-${number}`,
    Questions: questions(options.questionCount ?? 3),
  },
});

const completeLessons = () => [
  lesson(1),
  lesson(2),
  lesson(3, { isFinal: true }),
];

test('a complete course can be submitted', () => {
  assert.deepEqual(getCourseSubmissionIssues(completeCourse, completeLessons()), []);
});

test('description, thumbnail, three lessons and a final lesson are required', () => {
  const issues = getCourseSubmissionIssues({ description: '', thumbnail: null }, []);

  assert.deepEqual(issues, [
    'Add a course description.',
    'Upload a course thumbnail.',
    'Add at least 3 lessons. Current: 0.',
    'Set exactly one final lesson.',
  ]);
});

test('the final lesson must be the last lesson', () => {
  const lessons = [lesson(1, { isFinal: true }), lesson(2), lesson(3)];

  assert.deepEqual(getCourseSubmissionIssues(completeCourse, lessons), [
    'The final lesson must be the last lesson.',
  ]);
});

test('exactly one final lesson is required', () => {
  const lessons = [
    lesson(1, { isFinal: true }),
    lesson(2),
    lesson(3, { isFinal: true }),
  ];

  assert.deepEqual(getCourseSubmissionIssues(completeCourse, lessons), [
    'Set exactly one final lesson.',
  ]);
});

test('every lesson needs a quiz', () => {
  const lessons = completeLessons();
  lessons[1] = lesson(2, { withoutQuiz: true });

  assert.deepEqual(getCourseSubmissionIssues(completeCourse, lessons), [
    'Add a quiz to the lesson "Lesson 2".',
  ]);
});

test('every quiz needs at least three questions', () => {
  const lessons = completeLessons();
  lessons[0] = lesson(1, { questionCount: 2 });

  assert.deepEqual(getCourseSubmissionIssues(completeCourse, lessons), [
    'Add at least 3 questions to the quiz for lesson "Lesson 1". Current: 2.',
  ]);
});
