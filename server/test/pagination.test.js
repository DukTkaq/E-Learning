const test = require('node:test');
const assert = require('node:assert/strict');

const { buildPaginationMeta, parsePagination } = require('../src/utils/pagination');

test('parsePagination converts query strings into a database limit and offset', () => {
  assert.deepEqual(parsePagination({ page: '3', limit: '12' }), {
    page: 3,
    limit: 12,
    offset: 24,
  });
});

test('parsePagination applies safe defaults and caps oversized limits', () => {
  assert.deepEqual(parsePagination({ page: '-2', limit: 'invalid' }), {
    page: 1,
    limit: 6,
    offset: 0,
  });
  assert.deepEqual(parsePagination({ page: '2', limit: '999' }), {
    page: 2,
    limit: 50,
    offset: 50,
  });
  assert.deepEqual(parsePagination({ page: '1e308', limit: '6' }), {
    page: 1,
    limit: 6,
    offset: 0,
  });
});

test('buildPaginationMeta reports totals and navigation state', () => {
  assert.deepEqual(buildPaginationMeta({ page: 2, limit: 6, totalItems: 13 }), {
    page: 2,
    limit: 6,
    total_items: 13,
    total_pages: 3,
    has_previous: true,
    has_next: true,
  });
  assert.deepEqual(buildPaginationMeta({ page: 1, limit: 6, totalItems: 0 }), {
    page: 1,
    limit: 6,
    total_items: 0,
    total_pages: 0,
    has_previous: false,
    has_next: false,
  });
});
