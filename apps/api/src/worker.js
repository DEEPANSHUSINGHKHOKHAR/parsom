const env = require('./config/env');
const { assertQueue, closeRabbitMq } = require('./config/rabbitmq');
const { NOTIFICATION_QUEUE_NAME } = require('./queues/notification.queue');
const { sendMail } = require('./utils/mailer');
const {
  appendOrderRow,
  appendNotifyRow,
} = require('./utils/google-sheets-sync');
const { logger } = require('./config/logger');

let channel;
let consumerTag;

async function runJob(job) {
  switch (job.name) {
    case 'send-email':
      await sendMail(job.data);
      return;

    case 'append-order-sheet':
      await appendOrderRow(job.data);
      return;

    case 'append-notify-sheet':
      await appendNotifyRow(job.data);
      return;

    default:
      throw new Error(`Unknown job type: ${job.name}`);
  }
}

function retryJob(job) {
  const nextJob = {
    ...job,
    attempts: (job.attempts || 0) + 1,
    retriedAt: new Date().toISOString(),
  };

  setTimeout(() => {
    if (!channel) return;

    channel.sendToQueue(NOTIFICATION_QUEUE_NAME, Buffer.from(JSON.stringify(nextJob)), {
      contentType: 'application/json',
      deliveryMode: 2,
      persistent: true,
    });
  }, env.RABBITMQ_RETRY_DELAY_MS);
}

async function handleMessage(message) {
  if (!message) return;

  let job;

  try {
    job = JSON.parse(message.content.toString());
    await runJob(job);
    channel.ack(message);
    logger.info({ jobId: job.id, jobName: job.name }, 'Worker job completed');
  } catch (error) {
    const attempts = job?.attempts || 0;
    const maxAttempts = job?.maxAttempts || env.RABBITMQ_MAX_ATTEMPTS;

    channel.ack(message);

    if (job && attempts + 1 < maxAttempts) {
      retryJob(job);
      logger.warn(
        { jobId: job.id, jobName: job.name, attempt: attempts + 1, err: error },
        'Worker job failed; retry scheduled'
      );
      return;
    }

    logger.error(
      { jobId: job?.id, jobName: job?.name, err: error },
      'Worker job failed permanently'
    );
  }
}

async function startWorker() {
  channel = await assertQueue(NOTIFICATION_QUEUE_NAME);
  channel.prefetch(5);

  const consumer = await channel.consume(NOTIFICATION_QUEUE_NAME, handleMessage, {
    noAck: false,
  });

  consumerTag = consumer.consumerTag;
  logger.info('Notification worker started');
}

startWorker().catch((error) => {
  logger.error({ err: error }, 'Notification worker failed to start');
  process.exit(1);
});

let shuttingDown = false;

async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;

  logger.warn({ signal }, 'Worker shutdown started');

  const forceExitTimer = setTimeout(() => {
    logger.error('Worker forced shutdown after timeout');
    process.exit(1);
  }, 30000);

  try {
    if (channel && consumerTag) {
      await channel.cancel(consumerTag);
    }

    await closeRabbitMq();

    clearTimeout(forceExitTimer);
    logger.info('Worker shutdown completed');
    process.exit(0);
  } catch (error) {
    clearTimeout(forceExitTimer);
    logger.error({ err: error }, 'Worker shutdown failed');
    process.exit(1);
  }
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
