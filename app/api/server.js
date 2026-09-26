const express = require("express");
const client = require("prom-client");
const amqp = require("amqplib");

const app = express();
const PORT = process.env.PORT || 3000;

const RABBITMQ_USER = process.env.RABBITMQ_USER || "guest";
const RABBITMQ_PASSWORD = process.env.RABBITMQ_PASSWORD || "guest";
const RABBITMQ_HOST =
  process.env.RABBITMQ_HOST || "localhost";

const RABBITMQ_URL =
  process.env.RABBITMQ_URL ||
  `amqp://${encodeURIComponent(RABBITMQ_USER)}:${encodeURIComponent(
    RABBITMQ_PASSWORD
  )}@${RABBITMQ_HOST}:5672`;

client.collectDefaultMetrics();

app.get("/", (req, res) => {
  res.json({
    service: "enterprise-sre-api",
    status: "running",
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy" });
});

app.get("/ready", (req, res) => {
  res.status(200).json({ status: "ready" });
});

app.get("/metrics", async (req, res) => {
  res.set("Content-Type", client.register.contentType);
  res.end(await client.register.metrics());
});

let rabbitChannel;

async function connectRabbitMQ() {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);

    console.log("Connected to RabbitMQ");

    connection.on("error", (error) => {
      console.error("RabbitMQ connection error:", error.message);
    });

    connection.on("close", () => {
      console.log("RabbitMQ connection closed");
    });

    rabbitChannel = await connection.createChannel();

    await rabbitChannel.assertQueue("sre-jobs", {
      durable: true,
    });

    console.log("RabbitMQ queue ready: sre-jobs");

    return connection;
  } catch (error) {
    console.error("RabbitMQ connection failed:", error);
    return null;
  }
}

app.post("/jobs", (req, res) => {
  if (!rabbitChannel) {
    return res.status(503).json({
      status: "unavailable",
      message: "RabbitMQ is not connected",
    });
  }

  const job = {
    id: Date.now(),
    type: "example-job",
    createdAt: new Date().toISOString(),
  };

  rabbitChannel.sendToQueue(
    "sre-jobs",
    Buffer.from(JSON.stringify(job)),
    { persistent: true }
  );

  res.status(202).json({
    status: "queued",
    job,
  });
});

app.listen(PORT, async () => {
  console.log(`Enterprise SRE API running on port ${PORT}`);
  await connectRabbitMQ();
});