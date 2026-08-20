import test from 'node:test';
import assert from 'node:assert/strict';

import { clampPage, getPaginationItems } from '../src/utils/pagination.js';

test('clampPage redirects an out-of-range page to the final available page', () => {
  assert.equal(clampPage(999, 2), 2);
  assert.equal(clampPage(0, 2), 1);
  assert.equal(clampPage(4, 0), 1);
});

test('getPaginationItems returns every page for short lists', () => {
  assert.deepEqual(getPaginationItems(2, 5), [1, 2, 3, 4, 5]);
});

test('getPaginationItems keeps boundary and neighboring pages for long lists', () => {
  assert.deepEqual(getPaginationItems(1, 10), [1, 2, 3, 'ellipsis-right', 10]);
  assert.deepEqual(getPaginationItems(5, 10), [1, 'ellipsis-left', 4, 5, 6, 'ellipsis-right', 10]);
  assert.deepEqual(getPaginationItems(10, 10), [1, 'ellipsis-left', 8, 9, 10]);
});

test('getPaginationItems clamps an invalid current page to the available range', () => {
  assert.deepEqual(getPaginationItems(99, 3), [1, 2, 3]);
  assert.deepEqual(getPaginationItems(0, 10), [1, 2, 3, 'ellipsis-right', 10]);
});
