const { logger } = require('../config/logger');

function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: 'Route not found.',
  });
}

function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;

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

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error.',
    details: err.details || null,
  });
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
