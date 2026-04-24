const amqp = require('amqplib');
const env = require('./env');

let connectionPromise;
let channelPromise;

async function getConnection() {
  if (!connectionPromise) {
    connectionPromise = amqp.connect(env.RABBITMQ_URL);
  }

  return connectionPromise;
}

async function getChannel() {
  if (!channelPromise) {
    channelPromise = getConnection().then((connection) => connection.createChannel());
  }

  return channelPromise;
}

async function assertQueue(queueName) {
  const channel = await getChannel();
  await channel.assertQueue(queueName, {
    durable: true,
  });
  return channel;
}

async function closeRabbitMq() {
  const channel = channelPromise ? await channelPromise.catch(() => null) : null;
  const connection = connectionPromise ? await connectionPromise.catch(() => null) : null;

  channelPromise = null;
  connectionPromise = null;

  if (channel) {
    await channel.close().catch(() => {});
  }

  if (connection) {
    await connection.close().catch(() => {});
  }
}

module.exports = {
  assertQueue,
  closeRabbitMq,
  getChannel,
  getConnection,
};
