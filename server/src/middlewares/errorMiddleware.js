const { UniqueConstraintError, ValidationError } = require('sequelize');
const multer = require('multer');
const AppError = require('../utils/AppError');

const errorHandler = (error, req, res, next) => {
  if (res.headersSent) return next(error);

  if (error instanceof UniqueConstraintError) {
    return res.status(409).json({ message: 'This record already exists.' });
  }

  if (error instanceof ValidationError) {
    return res.status(400).json({ message: error.errors[0]?.message || 'Invalid data.' });
  }

  if (error instanceof multer.MulterError) {
    const message = error.code === 'LIMIT_FILE_SIZE'
      ? 'Course thumbnail must not exceed 5 MB.'
      : 'Course thumbnail must be a JPEG, PNG or WebP image.';
    return res.status(400).json({ message });
  }

  const statusCode = error.statusCode || 500;
  if (statusCode >= 500) console.error(error);

  return res.status(statusCode).json({
    message: statusCode >= 500 && !(error instanceof AppError) ? 'Internal server error.' : error.message,
  });
};

module.exports = errorHandler;
