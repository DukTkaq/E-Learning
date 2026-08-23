const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

let getTrustedVideoDurationSeconds;
let resolveUploadedVideoPath;
try {
  ({ getTrustedVideoDurationSeconds, resolveUploadedVideoPath } = require('../src/utils/videoMetadata'));
} catch {
  getTrustedVideoDurationSeconds = undefined;
  resolveUploadedVideoPath = undefined;
}

test('uploaded video paths resolve only inside the server video directory', () => {
  assert.equal(typeof resolveUploadedVideoPath, 'function');
  const publicRoot = path.resolve('D:/safe/public');
  assert.equal(
    resolveUploadedVideoPath('/uploads/videos/lesson.mp4', publicRoot),
    path.resolve(publicRoot, 'uploads/videos/lesson.mp4'),
  );
  assert.throws(
    () => resolveUploadedVideoPath('/uploads/videos/../../secret.txt', publicRoot),
    /valid uploaded video/i,
  );
  assert.throws(
    () => resolveUploadedVideoPath('https://example.com/video.mp4', publicRoot),
    /uploaded video/i,
  );
});

test('trusted duration comes from ffprobe output for the resolved server file', async () => {
  assert.equal(typeof getTrustedVideoDurationSeconds, 'function');
  const publicRoot = path.resolve('D:/safe/public');
  let receivedFile;
  const execFile = (binary, args, callback) => {
    receivedFile = args.at(-1);
    callback(null, JSON.stringify({ format: { duration: '123.45' } }), '');
  };

  const duration = await getTrustedVideoDurationSeconds(
    '/uploads/videos/lesson.mp4',
    { publicRoot, execFile, assertFileExists: false },
  );

  assert.equal(duration, 123.45);
  assert.equal(receivedFile, path.resolve(publicRoot, 'uploads/videos/lesson.mp4'));
});

test('YouTube duration comes from server-fetched metadata and arbitrary remote hosts are rejected', async () => {
  const fetch = async (url, options) => ({
    ok: true,
    text: async () => {
      assert.equal(url, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      assert.ok(options.signal, 'YouTube metadata fetch must have a timeout signal');
      return '<script>var data={"lengthSeconds":"212"};</script>';
    },
  });

  assert.equal(await getTrustedVideoDurationSeconds(
    'https://youtu.be/dQw4w9WgXcQ?t=10',
    { fetch },
  ), 212);
  await assert.rejects(
    () => getTrustedVideoDurationSeconds('https://example.com/video.mp4', { fetch }),
    /uploaded video or YouTube/i,
  );
});

test('trusted video durations are cached to avoid repeated probes', async () => {
  const cache = new Map();
  let fetchCount = 0;
  const fetch = async () => {
    fetchCount += 1;
    return { ok: true, text: async () => '{"lengthSeconds":"212"}' };
  };

  const options = { fetch, cache };
  await getTrustedVideoDurationSeconds('https://youtu.be/dQw4w9WgXcQ', options);
  await getTrustedVideoDurationSeconds('https://youtu.be/dQw4w9WgXcQ', options);

  assert.equal(fetchCount, 1);
});
