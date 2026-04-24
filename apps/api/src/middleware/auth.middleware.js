const jwt = require('jsonwebtoken');
const env = require('../config/env');
const AppError = require('../utils/app-error');

function extractBearerToken(req) {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) return null;
  return authHeader.replace('Bearer ', '').trim();
}

function requireAuth(req, res, next) {
  try {
    const token = extractBearerToken(req);

    if (!token) {
      return next(new AppError(401, 'Authentication required.'));
    }

    const payload = jwt.verify(token, env.JWT_SECRET);

    req.user = {
      id: payload.sub,
      role: payload.role,
      email: payload.email
    };

    next();
  } catch (error) {
    next(new AppError(401, 'Invalid or expired token.'));
  }
}

function optionalAuth(req, res, next) {
  try {
    const token = extractBearerToken(req);

    if (!token) {
      return next();
    }

    const payload = jwt.verify(token, env.JWT_SECRET);

    req.user = {
      id: payload.sub,
      role: payload.role,
      email: payload.email
    };

    next();
  } catch (error) {
    next();
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError(401, 'Authentication required.'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError(403, 'You do not have access to this resource.'));
    }

    next();
  };
}

module.exports = {
  requireAuth,
  optionalAuth,
  requireRole
};