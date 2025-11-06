import "dotenv/config";
import express from "express";
import { createServer } from "http";
import telegramWebhookRouter from "./routes/telegramWebhook";

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Configure body parser
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Health check endpoint
  app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Telegram webhook routes
  app.use("/api/telegram", telegramWebhookRouter);

  // 404 handler
  app.use("*", (req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  const port = parseInt(process.env.PORT || "3000");

  server.listen(port, () => {
    console.log(`✅ Telegram Bot Server running on http://localhost:${port}/`);
    console.log(`📡 Webhook endpoint: POST /api/telegram/webhook`);
    console.log(`❤️  Health check: GET /health`);
  });
}

startServer().catch((error) => {
  console.error("❌ Server startup failed:", error);
  process.exit(1);
});
