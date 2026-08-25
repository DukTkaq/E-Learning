import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
after(() => vite.close());

const { default: ReviewCard } = await vite.ssrLoadModule('/src/components/instructor/ReviewCard.jsx');

const baseReview = {
  id: 'review-1',
  rating: 5,
  comment: 'Very useful course.',
  User: { name: 'Test Student' },
};

test('a saved instructor reply is presented as content instead of an editable textarea', () => {
  const html = renderToStaticMarkup(createElement(ReviewCard, {
    review: {
      ...baseReview,
      instructor_reply: 'Thank you for your feedback.',
      replied_at: '2026-08-25T09:00:00.000Z',
    },
    courseTitle: 'Product Discovery Basics',
    saving: false,
    onReply: async () => true,
  }));

  assert.match(html, /Thank you for your feedback\./);
  assert.match(html, /Edit reply/);
  assert.doesNotMatch(html, /<textarea/);
});

test('a review without a reply opens the reply editor', () => {
  const html = renderToStaticMarkup(createElement(ReviewCard, {
    review: { ...baseReview, instructor_reply: null },
    courseTitle: 'Product Discovery Basics',
    saving: false,
    onReply: async () => true,
  }));

  assert.match(html, /<textarea/);
  assert.match(html, /Save reply/);
  assert.doesNotMatch(html, /Edit reply/);
});
