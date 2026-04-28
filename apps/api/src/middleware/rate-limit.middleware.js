const AppError = require('../utils/app-error');

const buckets = new Map();

function getClientIp(req) {
  return (
    req.ip ||
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}

function cleanup(now) {
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.expiresAt <= now) {
      buckets.delete(key);
    }
  }
}

function createRateLimit({
  windowMs,
  max,
  message = 'Too many requests. Please try again soon.',
  keyGenerator,
}) {
  return (req, res, next) => {
    const now = Date.now();
    cleanup(now);

    const key = keyGenerator ? keyGenerator(req) : getClientIp(req);
    const bucketKey = `${req.baseUrl || req.path}:${key}`;
    const bucket = buckets.get(bucketKey);

    if (!bucket || bucket.expiresAt <= now) {
      buckets.set(bucketKey, {
        count: 1,
        expiresAt: now + windowMs,
      });
      res.setHeader('X-RateLimit-Limit', String(max));
      res.setHeader('X-RateLimit-Remaining', String(Math.max(max - 1, 0)));
      return next();
    }

    bucket.count += 1;
    res.setHeader('X-RateLimit-Limit', String(max));
    res.setHeader('X-RateLimit-Remaining', String(Math.max(max - bucket.count, 0)));

    if (bucket.count > max) {
      res.setHeader(
        'Retry-After',
        String(Math.ceil((bucket.expiresAt - now) / 1000))
      );
      return next(new AppError(429, message));
    }

    return next();
  };
}

const keyByIp = (req) => getClientIp(req);

const keyByIpAndActor = (field) => (req) => {
  const actor = String(req.body?.[field] || '').trim().toLowerCase();
  return `${getClientIp(req)}:${actor || 'anonymous'}`;
};

const apiLimiter = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
});

const authLimiter = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 12,
  message: 'Too many sign-in attempts. Please try again in a few minutes.',
  keyGenerator: keyByIpAndActor('email'),
});

const otpLimiter = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many OTP requests. Please wait before trying again.',
  keyGenerator: (req) =>
    `${keyByIp(req)}:${String(req.body?.email || req.body?.phone || '')
      .trim()
      .toLowerCase()}`,
});

const uploadLimiter = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Too many uploads. Please wait before uploading again.',
});

const orderLimiter = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many checkout attempts. Please wait before trying again.',
  keyGenerator: (req) =>
    `${keyByIp(req)}:${String(req.body?.customer?.email || '').trim().toLowerCase() || 'guest'}`,
});

const reviewLimiter = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  message: 'Too many review actions. Please wait before trying again.',
  keyGenerator: (req) => `${keyByIp(req)}:${String(req.user?.id || 'anonymous')}`,
});

const notifyLimiter = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Too many notify requests. Please wait before trying again.',
  keyGenerator: (req) =>
    `${keyByIp(req)}:${String(req.body?.email || req.body?.phone || '').trim().toLowerCase() || 'anonymous'}`,
});

module.exports = {
  apiLimiter,
  authLimiter,
  otpLimiter,
  uploadLimiter,
  orderLimiter,
  reviewLimiter,
  notifyLimiter,
};
