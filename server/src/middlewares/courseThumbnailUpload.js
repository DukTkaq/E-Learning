const multer = require('multer');

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

const fileFilter = (req, file, callback) => {
  if (!allowedMimeTypes.has(file.mimetype)) {
    return callback(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'thumbnail'));
  }
  return callback(null, true);
};

module.exports = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { files: 1, fileSize: 5 * 1024 * 1024 },
});
