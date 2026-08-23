const finiteNonNegative = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : fallback;
};

export const isForwardSeekLocked = ({ completedAt, quizLockReason, canSkip = false } = {}) => (
  !canSkip && (!completedAt || quizLockReason === 'REWATCH_REQUIRED')
);

export const createVideoSeekGuard = ({
  unlocked = false,
  initialPositionSeconds = 0,
  seekToleranceSeconds = 0.1,
  jumpToleranceSeconds = 0.35,
  completionToleranceSeconds = 1,
} = {}) => {
  let furthestWatched = finiteNonNegative(initialPositionSeconds);
  let lastObservedAt = null;
  let wasPlaying = false;
  let previousPlaybackRate = 1;

  const result = (blocked) => ({
    blocked,
    targetTime: blocked ? furthestWatched : null,
    furthestWatched,
  });

  return {
    observe({
      currentTime,
      nowMs = Date.now(),
      playbackRate = 1,
      playing = false,
      seeking = false,
    } = {}) {
      const time = finiteNonNegative(currentTime);
      const observedAt = finiteNonNegative(nowMs, Date.now());
      const rate = Math.min(4, Math.max(0.25, finiteNonNegative(playbackRate, 1)));
      const rememberState = () => {
        lastObservedAt = observedAt;
        wasPlaying = Boolean(playing);
        previousPlaybackRate = rate;
      };

      if (unlocked) {
        furthestWatched = Math.max(furthestWatched, time);
        rememberState();
        return result(false);
      }

      if (seeking) {
        const blocked = time > furthestWatched + seekToleranceSeconds;
        rememberState();
        return result(blocked);
      }

      const elapsedSeconds = lastObservedAt === null
        ? 0
        : Math.max(0, (observedAt - lastObservedAt) / 1000);
      const naturalAdvance = (wasPlaying ? elapsedSeconds * previousPlaybackRate : 0) + jumpToleranceSeconds;
      rememberState();

      if (time > furthestWatched + naturalAdvance) return result(true);
      if (time >= furthestWatched - jumpToleranceSeconds) {
        furthestWatched = Math.max(furthestWatched, time);
      }
      return result(false);
    },

    canComplete(duration) {
      if (unlocked) return true;
      const total = finiteNonNegative(duration);
      return total > 0 && furthestWatched >= total - completionToleranceSeconds;
    },

    get furthestWatched() {
      return furthestWatched;
    },
  };
};
