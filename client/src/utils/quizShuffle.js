const CHOICES = ['A', 'B', 'C', 'D'];

const seedNumber = (value) => {
  let hash = 2166136261;
  for (const character of String(value)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const shuffle = (items, seed) => {
  const result = [...items];
  let state = seedNumber(seed);
  for (let index = result.length - 1; index > 0; index -= 1) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const swapIndex = state % (index + 1);
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
};

const rotateForAttempt = (items, attemptNumber) => {
  if (items.length < 2) return [...items];
  const offset = Math.max(0, Number(attemptNumber) || 0) % items.length;
  return [...items.slice(offset), ...items.slice(0, offset)];
};

export const buildQuizPresentation = (quiz = {}) => {
  quiz = quiz ?? {};
  const questions = Array.isArray(quiz.questions) ? quiz.questions : [];
  const attemptNumber = Math.max(0, Number(quiz.total_attempts) || 0);
  const baseSeed = String(quiz.id || 'quiz');
  const orderedQuestions = rotateForAttempt(
    shuffle(questions, `${baseSeed}:questions`),
    attemptNumber,
  );

  return orderedQuestions.map((question) => ({
    ...question,
    display_options: rotateForAttempt(
      shuffle(CHOICES.map((value) => ({
        value,
        text: question[`option_${value.toLowerCase()}`],
      })), `${baseSeed}:${question.id}:options`),
      attemptNumber,
    ),
  }));
};

export const getQuizAnswerText = (questions = [], questionId, answerValue) => {
  const question = questions.find((candidate) => String(candidate.id) === String(questionId));
  const normalizedAnswer = String(answerValue || '').trim().toUpperCase();
  return question?.[`option_${normalizedAnswer.toLowerCase()}`] || normalizedAnswer;
};
