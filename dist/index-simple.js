// server/index-simple.ts
import "dotenv/config";
import express2 from "express";
import { createServer } from "http";

// server/routes/telegramWebhookMinimal.ts
import express from "express";
var router = express.Router();
router.post("/webhook", async (req, res) => {
  try {
    const update = req.body;
    console.log("[Telegram Webhook] Received update:", {
      update_id: update.update_id,
      has_message: !!update.message,
      has_callback: !!update.callback_query,
      message_text: update.message?.text,
      from_id: update.message?.from?.id || update.callback_query?.from?.id
    });
    res.json({ ok: true });
  } catch (error) {
    console.error("[Telegram Webhook] Error:", error);
    res.json({ ok: true });
  }
});
router.post("/payment-webhook", async (req, res) => {
  try {
    const { event, object } = req.body;
    console.log("[Payment Webhook] Received event:", event);
    if (event === "payment.succeeded") {
      const paymentId = object.id;
      const telegramId = object.metadata?.telegramId;
      const tokens = object.metadata?.tokens;
      console.log(`[Payment] Payment ${paymentId} succeeded for user ${telegramId}`);
    }
    res.json({ ok: true });
  } catch (error) {
    console.error("[Payment Webhook] Error:", error);
    res.json({ ok: true });
  }
});
var telegramWebhookMinimal_default = router;

// server/index-simple.ts
async function startServer() {
  console.log("\u{1F527} Environment:");
  console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? "\u2705 Set" : "\u274C Not set"}`);
  console.log(`   TELEGRAM_BOT_TOKEN: ${process.env.TELEGRAM_BOT_TOKEN ? "\u2705 Set" : "\u274C Not set"}`);
  console.log(`   KIE_AI_API_KEY: ${process.env.KIE_AI_API_KEY ? "\u2705 Set" : "\u274C Not set"}`);
  console.log();
  const app = express2();
  const server = createServer(app);
  app.use(express2.json({ limit: "50mb" }));
  app.use(express2.urlencoded({ limit: "50mb", extended: true }));
  app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  });
  app.use("/api/telegram", telegramWebhookMinimal_default);
  app.get("/info", (req, res) => {
    res.json({
      status: "ok",
      environment: process.env.NODE_ENV,
      has_database_url: !!process.env.DATABASE_URL,
      has_telegram_token: !!process.env.TELEGRAM_BOT_TOKEN,
      has_kie_ai_key: !!process.env.KIE_AI_API_KEY,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  app.use("*", (req, res) => {
    res.status(404).json({ error: "Not found" });
  });
  const port = parseInt(process.env.PORT || "3000");
  server.listen(port, () => {
    console.log(`\u2705 Telegram Bot Server running on http://localhost:${port}/`);
    console.log(`\u{1F4E1} Webhook endpoint: POST /api/telegram/webhook`);
    console.log(`\u2764\uFE0F  Health check: GET /health`);
  });
}
startServer().catch((error) => {
  console.error("\u274C Server startup failed:", error);
  process.exit(1);
});
