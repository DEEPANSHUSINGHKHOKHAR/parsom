const { notificationQueue } = require('../queues/notification.queue');

async function enqueueEmailJob(payload) {
  return notificationQueue.add('send-email', payload);
}

async function enqueueOrderSheetJob(payload) {
  return notificationQueue.add('append-order-sheet', payload);
}

async function enqueueNotifySheetJob(payload) {
  return notificationQueue.add('append-notify-sheet', payload);
}

module.exports = {
  enqueueEmailJob,
  enqueueOrderSheetJob,
  enqueueNotifySheetJob,
};