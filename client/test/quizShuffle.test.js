import test from 'node:test';
import assert from 'node:assert/strict';

let buildQuizPresentation;
let getQuizAnswerText;
try {
  ({ buildQuizPresentation, getQuizAnswerText } = await import('../src/utils/quizShuffle.js'));
} catch {
  buildQuizPresentation = undefined;
  getQuizAnswerText = undefined;
}

const quiz = {
  id: 'quiz-1',
  total_attempts: 0,
  questions: [
    { id: 'q1', content: 'Question 1', option_a: 'Q1 A', option_b: 'Q1 B', option_c: 'Q1 C', option_d: 'Q1 D' },
    { id: 'q2', content: 'Question 2', option_a: 'Q2 A', option_b: 'Q2 B', option_c: 'Q2 C', option_d: 'Q2 D' },
    { id: 'q3', content: 'Question 3', option_a: 'Q3 A', option_b: 'Q3 B', option_c: 'Q3 C', option_d: 'Q3 D' },
  ],
};

const presentationSignature = (questions) => questions.map((question) => ({
  id: question.id,
  choices: question.display_options.map((option) => option.value),
}));

test('a lesson without a loaded quiz has an empty presentation', () => {
  assert.equal(typeof buildQuizPresentation, 'function');
  assert.deepEqual(buildQuizPresentation(null), []);
});

test('the same quiz attempt keeps a stable question and answer order', () => {
  assert.equal(typeof buildQuizPresentation, 'function');
  const first = buildQuizPresentation(quiz);
  const refreshed = buildQuizPresentation({ ...quiz, questions: quiz.questions.map((question) => ({ ...question })) });

  assert.deepEqual(presentationSignature(refreshed), presentationSignature(first));
});

test('the next quiz attempt changes question and answer positions without changing answer values', () => {
  assert.equal(typeof buildQuizPresentation, 'function');
  const first = buildQuizPresentation(quiz);
  const next = buildQuizPresentation({ ...quiz, total_attempts: 1 });

  assert.notDeepEqual(next.map((question) => question.id), first.map((question) => question.id));
  for (const question of first) {
    const nextQuestion = next.find((candidate) => candidate.id === question.id);
    assert.notDeepEqual(
      nextQuestion.display_options.map((option) => option.value),
      question.display_options.map((option) => option.value),
    );
    assert.deepEqual(
      new Set(nextQuestion.display_options.map((option) => option.value)),
      new Set(['A', 'B', 'C', 'D']),
    );
  }
});

test('feedback resolves original answer values to their text after shuffling', () => {
  assert.equal(typeof getQuizAnswerText, 'function');
  assert.equal(getQuizAnswerText(quiz.questions, 'q2', 'C'), 'Q2 C');
  assert.equal(getQuizAnswerText(quiz.questions, 'missing', 'A'), 'A');
});
