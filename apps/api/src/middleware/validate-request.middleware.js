const { validationResult } = require('express-validator');
const AppError = require('../utils/app-error');

function validateRequest(req, res, next) {
  const result = validationResult(req);

  if (!result.isEmpty()) {
    const errors = result.array();
    const firstError = errors[0];
    const fieldName = firstError?.path || firstError?.param || 'request';

    return next(
      new AppError(422, `Validation failed: ${fieldName} ${firstError?.msg || 'is invalid'}.`, {
        errors
      })
    );
  }

  next();
}

module.exports = validateRequest;
