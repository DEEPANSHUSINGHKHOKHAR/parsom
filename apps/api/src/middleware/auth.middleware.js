const jwt = require('jsonwebtoken');
const env = require('../config/env');
const AppError = require('../utils/app-error');

function extractBearerToken(req) {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) return null;
  return authHeader.replace('Bearer ', '').trim();
}

function extractCookieToken(req, cookieName) {
  const cookieHeader = req.headers.cookie || '';
  const cookies = cookieHeader.split(';').map((cookie) => cookie.trim());
  const prefix = `${cookieName}=`;
  const cookie = cookies.find((item) => item.startsWith(prefix));

  if (!cookie) return null;

  return decodeURIComponent(cookie.slice(prefix.length));
}

function extractAuthToken(req) {
  return extractBearerToken(req) || extractCookieToken(req, 'parsom_admin_token');
}

function requireAuth(req, res, next) {
  try {
    const token = extractAuthToken(req);

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
    const token = extractAuthToken(req);

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
