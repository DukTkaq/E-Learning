const { execFile: defaultExecFile } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const ffprobe = require('ffprobe-static');

const DEFAULT_PUBLIC_ROOT = path.resolve(__dirname, '../../public');
const YOUTUBE_HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be']);
const durationCache = new Map();

const resolveUploadedVideoPath = (videoUrl, publicRoot = DEFAULT_PUBLIC_ROOT) => {
  const prefix = '/uploads/videos/';
  if (typeof videoUrl !== 'string' || !videoUrl.startsWith(prefix)) {
    throw new Error('Only an uploaded video can be verified by the server.');
  }

  let relativePath;
  try {
    relativePath = decodeURIComponent(videoUrl.slice(1));
  } catch {
    throw new Error('Lesson does not reference a valid uploaded video.');
  }

  const videoRoot = path.resolve(publicRoot, 'uploads/videos');
  const filePath = path.resolve(publicRoot, relativePath);
  if (filePath !== videoRoot && !filePath.startsWith(`${videoRoot}${path.sep}`)) {
    throw new Error('Lesson does not reference a valid uploaded video.');
  }
  return filePath;
};

const getTrustedVideoDurationSeconds = (videoUrl, {
  publicRoot = DEFAULT_PUBLIC_ROOT,
  execFile = defaultExecFile,
  assertFileExists = true,
  fetch = globalThis.fetch,
  cache = durationCache,
  fetchTimeoutMs = 5000,
} = {}) => {
  const cacheKey = String(videoUrl || '');
  if (cache?.has(cacheKey)) return cache.get(cacheKey);

  let probe;
  if (typeof videoUrl === 'string' && !videoUrl.startsWith('/uploads/videos/')) {
    let parsed;
    try { parsed = new URL(videoUrl); } catch { parsed = null; }
    const hostname = parsed?.hostname?.toLowerCase();
    if (!parsed || parsed.protocol !== 'https:' || !YOUTUBE_HOSTS.has(hostname)) {
      return Promise.reject(new Error('Only an uploaded video or YouTube video can be verified by the server.'));
    }

    const videoId = hostname === 'youtu.be'
      ? parsed.pathname.split('/').filter(Boolean)[0]
      : parsed.searchParams.get('v') || parsed.pathname.match(/^\/(?:embed|shorts)\/([\w-]{11})/)?.[1];
    if (!/^[\w-]{11}$/.test(String(videoId || ''))) {
      return Promise.reject(new Error('YouTube video URL is invalid.'));
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), fetchTimeoutMs);
    probe = Promise.resolve(fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: controller.signal,
    })).then(async (response) => {
      if (!response?.ok) throw new Error('YouTube video duration could not be verified.');
      const source = await response.text();
      const duration = Number(source.match(/"lengthSeconds":"([\d.]+)"/)?.[1]);
      if (!Number.isFinite(duration) || duration <= 0) {
        throw new Error('YouTube video duration could not be verified.');
      }
      return duration;
    }).catch(() => {
      throw new Error('YouTube video duration could not be verified.');
    }).finally(() => clearTimeout(timeout));
  } else {
    const filePath = resolveUploadedVideoPath(videoUrl, publicRoot);
    if (assertFileExists && !fs.existsSync(filePath)) {
      return Promise.reject(new Error('Lesson video file could not be found.'));
    }

    probe = new Promise((resolve, reject) => {
      execFile(ffprobe.path, [
        '-v', 'error',
        '-show_entries', 'format=duration',
        '-of', 'json',
        filePath,
      ], (error, stdout) => {
        if (error) return reject(new Error('Lesson video duration could not be verified.'));
        try {
          const duration = Number(JSON.parse(stdout)?.format?.duration);
          if (!Number.isFinite(duration) || duration <= 0) throw new Error();
          return resolve(duration);
        } catch {
          return reject(new Error('Lesson video duration could not be verified.'));
        }
      });
    });
  }

  const cachedProbe = probe.catch((error) => {
    if (cache?.get(cacheKey) === cachedProbe) cache.delete(cacheKey);
    throw error;
  });
  if (cache) cache.set(cacheKey, cachedProbe);
  return cachedProbe;
};

module.exports = { getTrustedVideoDurationSeconds, resolveUploadedVideoPath };
