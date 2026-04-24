const app = require('./app');
const env = require('./config/env');
const { logger } = require('./config/logger');
const { pool } = require('./config/db');
const { notificationQueue } = require('./queues/notification.queue');

const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, 'API server started');
});

let shuttingDown = false;

async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;

  app.set('isShuttingDown', true);
  logger.warn({ signal }, 'Shutdown started');

  const forceExitTimer = setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);

  try {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) return reject(error);
        resolve();
      });
    });

    await notificationQueue.close();
    await pool.end();

    clearTimeout(forceExitTimer);
    logger.info('Shutdown completed');
    process.exit(0);
  } catch (error) {
    clearTimeout(forceExitTimer);
    logger.error({ err: error }, 'Shutdown failed');
    process.exit(1);
  }
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
