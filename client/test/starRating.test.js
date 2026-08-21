import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
after(() => vite.close());

let StarRating;
try {
  ({ default: StarRating } = await vite.ssrLoadModule('/src/components/reviews/StarRating.jsx'));
} catch {
  StarRating = undefined;
}

test('rating four renders five stars with the first four highlighted', () => {
  assert.equal(typeof StarRating, 'function');
  const html = renderToStaticMarkup(createElement(StarRating, {
    value: 4,
    onChange: () => {},
  }));

  assert.equal((html.match(/type="radio"/g) || []).length, 5);
  assert.equal((html.match(/data-active="true"/g) || []).length, 4);
  assert.equal((html.match(/checked=""/g) || []).length, 1);
  assert.match(html, /aria-label="4 stars"[^>]*checked=""/);
  assert.match(html, />4 of 5</);
});
