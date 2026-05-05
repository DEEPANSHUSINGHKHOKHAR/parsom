const { logger } = require('../config/logger');
const env = require('../config/env');

function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: 'Route not found.',
  });
}

function errorHandler(err, req, res, next) {
  const isMulterError = err.name === 'MulterError';
  const isFileTooLarge = isMulterError && err.code === 'LIMIT_FILE_SIZE';
  const isPayloadTooLarge = !isFileTooLarge && (err.type === 'entity.too.large' || err.status === 413);
  const isBodyParseError = err.type === 'entity.parse.failed';
  const statusCode =
    err.statusCode ||
    (isPayloadTooLarge
      ? 413
      : isBodyParseError
        ? 400
        : isMulterError
          ? 422
          : 500);

  logger.error(
    {
      err,
      statusCode,
      path: req.originalUrl,
      method: req.method,
      requestId: req.id,
    },
    'Request failed'
  );

  const isOperationalError = statusCode < 500;

  res.status(statusCode).json({
    success: false,
    message:
      env.NODE_ENV === 'production' && !isOperationalError
        ? 'Internal server error.'
        : isPayloadTooLarge
          ? 'Request payload is too large.'
          : isBodyParseError
            ? 'Malformed request payload.'
            : isFileTooLarge
              ? 'File is too large.'
              : err.message || 'Internal server error.',
    details:
      env.NODE_ENV === 'production' && !isOperationalError
        ? null
        : err.details || null,
  });
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
