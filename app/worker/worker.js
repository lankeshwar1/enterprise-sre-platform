const amqp = require("amqplib");

const RABBITMQ_USER = process.env.RABBITMQ_USER || "guest";
const RABBITMQ_PASSWORD = process.env.RABBITMQ_PASSWORD || "guest";
const RABBITMQ_HOST =
  process.env.RABBITMQ_HOST || "localhost";

const RABBITMQ_URL =
  `amqp://${encodeURIComponent(RABBITMQ_USER)}:${encodeURIComponent(
    RABBITMQ_PASSWORD
  )}@${RABBITMQ_HOST}:5672`;

const QUEUE_NAME = "sre-jobs";

async function startWorker() {
  const connection = await amqp.connect(RABBITMQ_URL);
  const channel = await connection.createChannel();

  await channel.assertQueue(QUEUE_NAME, {
    durable: true,
  });

  console.log(`Worker listening on queue: ${QUEUE_NAME}`);

  channel.consume(QUEUE_NAME, (message) => {
    if (!message) return;

    const job = JSON.parse(message.content.toString());

    console.log("Processing job:", job);

    channel.ack(message);
  });
}

startWorker().catch((error) => {
  console.error("Worker failed:", error);
  process.exit(1);
});