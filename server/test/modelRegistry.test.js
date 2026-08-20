const test = require('node:test');
const assert = require('node:assert/strict');

test('model registry loads without the removed lesson progress and quiz attempt models', () => {
  assert.doesNotThrow(() => require('../src/models'));
});
