const Redis = require('ioredis');
const env = require('../config/env');
const { logger } = require('../config/logger');

let redisClient = null;

if (env.REDIS_URL) {
  redisClient = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 1,
    enableReadyCheck: false,
  });

  redisClient.on('error', (err) => {
    logger.error({ err }, 'Redis connection error');
  });
}

function getRedisClient() {
  return redisClient;
}

async function closeRedis() {
  if (!redisClient) return;

  try {
    await redisClient.quit();
  } catch (error) {
    logger.error({ err: error }, 'Redis shutdown failed');
  }
}

module.exports = {
  getRedisClient,
  closeRedis,
};
