const pino = require('pino');
const env = require('./env');

const logger = pino({
  level: env.LOG_LEVEL,
  base: {
    service: 'parsom-api',
    env: env.NODE_ENV,
  },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'password',
      'password_hash',
      'otp',
      'otp_hash',
      '*.password',
      '*.password_hash',
      '*.otp',
      '*.otp_hash',
    ],
    censor: '[REDACTED]',
  },
});

module.exports = {
  logger,
};
