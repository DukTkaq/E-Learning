import test from 'node:test';
import assert from 'node:assert/strict';

import { createVideoSeekGuard, isForwardSeekLocked } from '../src/utils/videoSeekGuard.js';

const newGuard = (options) => {
  assert.equal(typeof createVideoSeekGuard, 'function');
  return createVideoSeekGuard(options);
};

test('an incomplete lesson blocks forward seeking but permits rewinding', () => {
  const guard = newGuard();

  guard.observe({ currentTime: 0, nowMs: 0, playing: true });
  guard.observe({ currentTime: 1, nowMs: 1000, playing: true });

  assert.deepEqual(
    guard.observe({ currentTime: 30, nowMs: 1100, playing: true, seeking: true }),
    { blocked: true, targetTime: 1, furthestWatched: 1 },
  );
  assert.equal(
    guard.observe({ currentTime: 0.5, nowMs: 1200, playing: true, seeking: true }).blocked,
    false,
  );
});

test('a large YouTube-style time jump is blocked while natural playback advances', () => {
  const guard = newGuard();

  guard.observe({ currentTime: 0, nowMs: 0, playing: true });
  guard.observe({ currentTime: 1, nowMs: 1000, playing: true });
  const jump = guard.observe({ currentTime: 50, nowMs: 1250, playing: true });

  assert.equal(jump.blocked, true);
  assert.equal(jump.targetTime, 1);
  assert.equal(guard.observe({ currentTime: 5, nowMs: 5000, playing: true }).blocked, false);
  assert.equal(guard.furthestWatched, 5);
});

test('paused time never grants permission to seek forward before pressing play', () => {
  const guard = newGuard();

  guard.observe({ currentTime: 0, nowMs: 0, playing: false });
  const seekThenPlay = guard.observe({ currentTime: 50, nowMs: 60000, playing: true });

  assert.deepEqual(seekThenPlay, { blocked: true, targetTime: 0, furthestWatched: 0 });
});

test('a new playback rate is not applied retroactively to elapsed playback time', () => {
  const guard = newGuard();

  guard.observe({ currentTime: 0, nowMs: 0, playing: true, playbackRate: 1 });
  const rateChange = guard.observe({ currentTime: 1.7, nowMs: 1000, playing: true, playbackRate: 2 });

  assert.deepEqual(rateChange, { blocked: true, targetTime: 0, furthestWatched: 0 });
});

test('completion is accepted only after playback reaches the end', () => {
  const guard = newGuard({ completionToleranceSeconds: 1 });

  guard.observe({ currentTime: 0, nowMs: 0, playing: true });
  guard.observe({ currentTime: 4, nowMs: 4000, playing: true });
  assert.equal(guard.canComplete(10), false);

  guard.observe({ currentTime: 10, nowMs: 10000, playing: true });
  assert.equal(guard.canComplete(10), true);
});

test('completed lessons allow seeking unless a full rewatch is required', () => {
  assert.equal(typeof isForwardSeekLocked, 'function');
  assert.equal(isForwardSeekLocked({ completedAt: null, quizLockReason: 'WATCH_REQUIRED' }), true);
  assert.equal(isForwardSeekLocked({ completedAt: '2026-08-21T00:00:00Z', quizLockReason: null }), false);
  assert.equal(isForwardSeekLocked({ completedAt: '2026-08-21T00:00:00Z', quizLockReason: 'PASSED' }), false);
  assert.equal(isForwardSeekLocked({ completedAt: '2026-08-21T00:00:00Z', quizLockReason: 'REWATCH_REQUIRED' }), true);

  const guard = newGuard({ unlocked: true });
  assert.equal(guard.observe({ currentTime: 90, nowMs: 0, seeking: true }).blocked, false);
  assert.equal(guard.canComplete(100), true);
});
