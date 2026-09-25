const express = require("express");
const client = require("prom-client");

const app = express();
const PORT = process.env.PORT || 3000;

client.collectDefaultMetrics();

app.get("/", (req, res) => {
  res.json({
    service: "enterprise-sre-api",
    status: "running"
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy"
  });
});

app.get("/ready", (req, res) => {
  res.status(200).json({
    status: "ready"
  });
});

app.get("/metrics", async (req, res) => {
  res.set("Content-Type", client.register.contentType);
  res.end(await client.register.metrics());
});

app.listen(PORT, () => {
  console.log(`Enterprise SRE API running on port ${PORT}`);
});