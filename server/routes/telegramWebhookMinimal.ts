import express, { Router, Request, Response } from "express";

const router = express.Router();

/**
 * Minimal Telegram webhook endpoint
 * This version doesn't require Telegram Bot API client to be initialized
 * POST /api/telegram/webhook
 */
router.post("/webhook", async (req: Request, res: Response) => {
  try {
    const update = req.body;
    console.log("[Telegram Webhook] Received update:", {
      update_id: update.update_id,
      has_message: !!update.message,
      has_callback: !!update.callback_query,
      message_text: update.message?.text,
      from_id: update.message?.from?.id || update.callback_query?.from?.id,
    });

    // For now, just acknowledge receipt
    // In production, we would process the message here
    res.json({ ok: true });
  } catch (error) {
    console.error("[Telegram Webhook] Error:", error);
    // Return 200 anyway to prevent Telegram from retrying
    res.json({ ok: true });
  }
});

/**
 * Payment confirmation webhook from Yandex.Kassa
 * POST /api/telegram/payment-webhook
 */
router.post("/payment-webhook", async (req: Request, res: Response) => {
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

export default router;
