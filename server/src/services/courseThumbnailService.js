const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const AppError = require('../utils/AppError');

const BUCKET_NAME = 'course-thumbnails';
const publicObjectMarker = `/storage/v1/object/public/${BUCKET_NAME}/`;
const extensionByMimeType = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

let storageClient;

const getStorageClient = () => {
  if (storageClient) return storageClient;

  const url = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !secretKey) {
    throw new AppError(
      503,
      'Course thumbnail storage is not configured. Add SUPABASE_URL and SUPABASE_SECRET_KEY to server/.env.',
    );
  }

  storageClient = createClient(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return storageClient;
};

const uploadThumbnail = async (file, instructorId) => {
  if (!file) return null;

  const extension = extensionByMimeType[file.mimetype];
  const objectPath = `courses/${instructorId}/${crypto.randomUUID()}${extension}`;
  const client = getStorageClient();
  const { error } = await client.storage.from(BUCKET_NAME).upload(objectPath, file.buffer, {
    cacheControl: '3600',
    contentType: file.mimetype,
    upsert: false,
  });

  if (error) {
    console.error('Supabase course thumbnail upload failed:', error);
    throw new AppError(502, 'Could not upload the course thumbnail.');
  }

  const { data } = client.storage.from(BUCKET_NAME).getPublicUrl(objectPath);
  return { objectPath, publicUrl: data.publicUrl };
};

const getObjectPath = (thumbnail) => {
  if (!thumbnail) return null;

  try {
    const pathname = new URL(thumbnail).pathname;
    const markerIndex = pathname.indexOf(publicObjectMarker);
    if (markerIndex < 0) return null;
    return decodeURIComponent(pathname.slice(markerIndex + publicObjectMarker.length));
  } catch {
    return null;
  }
};

const removeThumbnail = async (thumbnailOrObjectPath) => {
  const objectPath = thumbnailOrObjectPath?.startsWith('courses/')
    ? thumbnailOrObjectPath
    : getObjectPath(thumbnailOrObjectPath);
  if (!objectPath) return;

  const { error } = await getStorageClient().storage.from(BUCKET_NAME).remove([objectPath]);
  if (error) throw error;
};

module.exports = { uploadThumbnail, removeThumbnail };
