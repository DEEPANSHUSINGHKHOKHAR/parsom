const crypto = require('crypto');
const env = require('../config/env');
const AppError = require('../utils/app-error');

const CSRF_COOKIE = 'parsom_admin_csrf';
const CSRF_HEADER = 'x-csrf-token';

function csrfCookieOptions() {
  const isProduction = env.NODE_ENV === 'production';

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}

function createCsrfToken() {
  return crypto.randomBytes(32).toString('hex');
}

function ensureCsrfCookie(req, res) {
  const existingToken = req.cookies?.[CSRF_COOKIE];
  if (existingToken) {
    res.setHeader(CSRF_HEADER, existingToken);
    return existingToken;
  }

  const token = createCsrfToken();
  res.cookie(CSRF_COOKIE, token, csrfCookieOptions());
  res.setHeader('x-csrf-token', token);
  return token;
}

function isValidToken(headerToken, cookieToken) {
  if (!headerToken || !cookieToken || headerToken.length !== cookieToken.length) {
    return false;
  }

  try {
    return crypto.timingSafeEqual(Buffer.from(headerToken), Buffer.from(cookieToken));
  } catch (error) {
    return false;
  }
}

function requireCsrfToken(req, res, next) {
  const method = req.method.toUpperCase();
  const isSafeMethod = ['GET', 'HEAD', 'OPTIONS'].includes(method);

  const cookieToken = ensureCsrfCookie(req, res);

  if (isSafeMethod) {
    return next();
  }

  const headerToken = String(req.headers[CSRF_HEADER] || '').trim();

  if (!isValidToken(headerToken, cookieToken)) {
    return next(new AppError(403, 'Invalid CSRF token.'));
  }

  return next();
}

module.exports = requireCsrfToken;
