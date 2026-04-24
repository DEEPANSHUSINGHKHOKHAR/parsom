const crypto = require('crypto');
const env = require('../config/env');
const { assertQueue, closeRabbitMq } = require('../config/rabbitmq');

const NOTIFICATION_QUEUE_NAME = env.RABBITMQ_NOTIFICATION_QUEUE;

const notificationQueue = {
  async add(name, data) {
    const channel = await assertQueue(NOTIFICATION_QUEUE_NAME);
    const message = {
      id: crypto.randomUUID(),
      name,
      data,
      attempts: 0,
      maxAttempts: env.RABBITMQ_MAX_ATTEMPTS,
      createdAt: new Date().toISOString(),
    };

    channel.sendToQueue(NOTIFICATION_QUEUE_NAME, Buffer.from(JSON.stringify(message)), {
      contentType: 'application/json',
      deliveryMode: 2,
      persistent: true,
    });

    return message;
  },

  close: closeRabbitMq,
};

module.exports = {
  NOTIFICATION_QUEUE_NAME,
  notificationQueue,
};
