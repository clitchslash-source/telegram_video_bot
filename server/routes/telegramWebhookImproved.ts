import express, { Router, Request, Response } from "express";
import { getTelegramUser, createTelegramUser } from "../db";
import { TOKEN_PRICING } from "../../shared/config";

const router = express.Router();

/**
 * Improved Telegram webhook endpoint
 * This version handles database operations safely
 * POST /api/telegram/webhook
 */
router.post("/webhook", async (req: Request, res: Response) => {
  try {
    const update = req.body;
    console.log("[Telegram Webhook] Received update:", {
      update_id: update.update_id,
      has_message: !!update.message,
      message_text: update.message?.text,
    });

    // Handle message updates
    if (update.message) {
      const message = update.message;
      const chatId = message.chat.id;
      const userId = message.from.id;
      const firstName = message.from.first_name;
      const username = message.from.username;
      const lastName = message.from.last_name;

      try {
        // Handle /start command
        if (message.text === "/start") {
          const telegramId = userId.toString();
          let user = await getTelegramUser(telegramId);

          if (!user) {
            // New user - create with free tokens
            try {
              user = await createTelegramUser({
                telegramId,
                username: username || undefined,
                firstName,
                lastName: lastName || undefined,
                tokenBalance: TOKEN_PRICING.FREE_TOKENS_ON_START,
                totalTokensPurchased: 0,
                totalTokensSpent: 0,
                totalGenerations: 0,
              });
              console.log(`[Telegram] New user created: ${telegramId}`);
            } catch (createError) {
              console.error("[Telegram] Failed to create user:", createError);
            }
          } else {
            console.log(`[Telegram] Returning user: ${telegramId}, balance: ${user.tokenBalance}`);
          }
        }
        // Handle /balance command
        else if (message.text === "/balance") {
          const user = await getTelegramUser(userId.toString());
          if (user) {
            console.log(`[Telegram] Balance check: user ${userId}, balance: ${user.tokenBalance}`);
          } else {
            console.log(`[Telegram] User not found: ${userId}`);
          }
        }
        // Handle other commands
        else if (message.text?.startsWith("/")) {
          console.log(`[Telegram] Command: ${message.text} from user ${userId}`);
        }
        // Handle text messages
        else if (message.text) {
          console.log(`[Telegram] Message from user ${userId}: ${message.text.substring(0, 50)}`);
        }
      } catch (handlerError) {
        console.error("[Telegram Webhook] Handler error:", handlerError);
      }
    }

    // Handle callback queries (button clicks)
    if (update.callback_query) {
      console.log("[Telegram] Callback query from user:", update.callback_query.from.id);
    }

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

      if (telegramId && tokens) {
        try {
          const user = await getTelegramUser(telegramId);
          if (user) {
            console.log(`[Payment] User found: ${telegramId}, current balance: ${user.tokenBalance}`);
          }
        } catch (error) {
          console.error("[Payment] Error updating user:", error);
        }
      }
    }

    res.json({ ok: true });
  } catch (error) {
    console.error("[Payment Webhook] Error:", error);
    res.json({ ok: true });
  }
});

export default router;
