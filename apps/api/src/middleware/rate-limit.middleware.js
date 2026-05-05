const { RateLimiterRedis, RateLimiterMemory } = require('rate-limiter-flexible');
const env = require('../config/env');
const AppError = require('../utils/app-error');
const { getRedisClient } = require('../utils/redis-client');

const redisClient = getRedisClient();

function getClientIp(req) {
  return (
    req.ip ||
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}

function createRateLimiter({ windowMs, max, keyPrefix }) {
  const duration = Math.ceil(windowMs / 1000);
  const baseOptions = {
    points: max,
    duration,
    keyPrefix: `${env.RATE_LIMITER_PREFIX}:${keyPrefix}`,
  };

  if (redisClient) {
    return new RateLimiterRedis({
      ...baseOptions,
      storeClient: redisClient,
      insuranceLimiter: new RateLimiterMemory(baseOptions),
    });
  }

  return new RateLimiterMemory(baseOptions);
}

function createRateLimit({
  windowMs,
  max,
  message = 'Too many requests. Please try again soon.',
  keyGenerator,
  keyPrefix,
}) {
  const limiter = createRateLimiter({ windowMs, max, keyPrefix });

  return async (req, res, next) => {
    const key = keyGenerator ? keyGenerator(req) : getClientIp(req);
    const bucketKey = `${req.baseUrl || req.path}:${key}`;

    try {
      const rateLimiterRes = await limiter.consume(bucketKey, 1);
      res.setHeader('X-RateLimit-Limit', String(max));
      res.setHeader(
        'X-RateLimit-Remaining',
        String(Math.max(rateLimiterRes.remainingPoints, 0))
      );
      return next();
    } catch (rateLimiterRes) {
      if (rateLimiterRes instanceof Error) {
        return next(rateLimiterRes);
      }

      res.setHeader('X-RateLimit-Limit', String(max));
      res.setHeader('X-RateLimit-Remaining', '0');
      res.setHeader(
        'Retry-After',
        String(Math.ceil(rateLimiterRes.msBeforeNext / 1000) || 1)
      );
      return next(new AppError(429, message));
    }
  };
}

const keyByIp = (req) => getClientIp(req);

const keyByIpAndActor = (field) => (req) => {
  const actor = String(req.body?.[field] || '').trim().toLowerCase();
  return `${getClientIp(req)}:${actor || 'anonymous'}`;
};

const authKeyGenerator = (req) => {
  const actor = String(
    req.body?.email ||
      req.body?.phone ||
      req.body?.credential ||
      req.user?.id ||
      ''
  )
    .trim()
    .toLowerCase();

  return `${getClientIp(req)}:${actor || 'anonymous'}`;
};

const apiLimiter = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  keyPrefix: 'api',
});

const authLimiter = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many authentication attempts. Please try again in a few minutes.',
  keyGenerator: authKeyGenerator,
  keyPrefix: 'auth',
});

const otpLimiter = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many OTP requests. Please wait before trying again.',
  keyGenerator: (req) =>
    `${keyByIp(req)}:${String(req.body?.email || req.body?.phone || '')
      .trim()
      .toLowerCase()}`,
  keyPrefix: 'otp',
});

const uploadLimiter = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Too many uploads. Please wait before uploading again.',
  keyPrefix: 'upload',
});

const orderLimiter = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many checkout attempts. Please wait before trying again.',
  keyGenerator: (req) =>
    `${keyByIp(req)}:${String(req.body?.customer?.email || '').trim().toLowerCase() || 'guest'}`,
  keyPrefix: 'order',
});

const reviewLimiter = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  message: 'Too many review actions. Please wait before trying again.',
  keyGenerator: (req) => `${keyByIp(req)}:${String(req.user?.id || 'anonymous')}`,
  keyPrefix: 'review',
});

const notifyLimiter = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Too many notify requests. Please wait before trying again.',
  keyGenerator: (req) =>
    `${keyByIp(req)}:${String(req.body?.email || req.body?.phone || '').trim().toLowerCase() || 'anonymous'}`,
  keyPrefix: 'notify',
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
