const express = require('express');
const { pool } = require('../../config/db');
const env = require('../../config/env');
const { assertQueue } = require('../../config/rabbitmq');
const { NOTIFICATION_QUEUE_NAME } = require('../../queues/notification.queue');

const router = express.Router();

function withTimeout(promise, timeoutMs) {
  return Promise.race([
    promise,
    new Promise((resolve, reject) => {
      setTimeout(() => reject(new Error('Health check timed out.')), timeoutMs);
    }),
  ]);
}

router.get('/live', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'live',
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

router.get('/ready', async (req, res) => {
  const checks = {
    app: req.app.get('isShuttingDown') ? 'shutting_down' : 'ok',
    mysql: 'unknown',
    rabbitmq: 'unknown',
  };

  let ok = true;

  try {
    await withTimeout(pool.query('SELECT 1'), 2000);
    checks.mysql = 'ok';
  } catch {
    checks.mysql = 'failed';
    ok = false;
  }

  try {
    await withTimeout(assertQueue(NOTIFICATION_QUEUE_NAME), 2000);
    checks.rabbitmq = 'ok';
  } catch {
    checks.rabbitmq = env.NODE_ENV === 'production' ? 'failed' : 'failed_optional';
    if (env.NODE_ENV === 'production') {
      ok = false;
    }
  }

  if (req.app.get('isShuttingDown')) {
    ok = false;
  }

  res.status(ok ? 200 : 503).json({
    success: ok,
    status: ok ? 'ready' : 'not_ready',
    checks,
  });
});

module.exports = router;
