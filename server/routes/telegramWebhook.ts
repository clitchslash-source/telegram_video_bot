import express, { Router, Request, Response } from "express";
import { handleStartCommand, handleBalanceCommand, handleBuyCommand, handleHelpCommand, handleTextMessage, handleImageMessage, handleVoiceMessage, handleCallbackQuery } from "../services/botHandlers";
import { getTelegramUser } from "../db";

const router = express.Router();

/**
 * Telegram webhook endpoint
 * POST /api/telegram/webhook
 */
router.post("/webhook", async (req: Request, res: Response) => {
  try {
    const update = req.body;

    // Handle message updates
    if (update.message) {
      const message = update.message;
      const chatId = message.chat.id;
      const userId = message.from.id;
      const firstName = message.from.first_name;
      const username = message.from.username;
      const lastName = message.from.last_name;

      // Handle /start command
      if (message.text === "/start") {
        await handleStartCommand(chatId, userId, firstName, username, lastName);
      }

      // Handle /balance command
      else if (message.text === "/balance") {
        await handleBalanceCommand(chatId, userId);
      }

      // Handle /buy command
      else if (message.text === "/buy") {
        await handleBuyCommand(chatId, userId);
      }

      // Handle /help command
      else if (message.text === "/help") {
        await handleHelpCommand(chatId);
      }

      // Handle text messages (video generation prompts)
      else if (message.text && !message.text.startsWith("/")) {
        await handleTextMessage(chatId, userId, message.text);
      }

      // Handle photo messages
      else if (message.photo) {
        const largestPhoto = message.photo[message.photo.length - 1];
        await handleImageMessage(chatId, userId, largestPhoto.file_id);
      }

      // Handle voice messages
      else if (message.voice) {
        await handleVoiceMessage(chatId, userId, message.voice.file_id);
      }
    }

    // Handle callback queries (button clicks)
    if (update.callback_query) {
      const callbackQuery = update.callback_query;
      const callbackQueryId = callbackQuery.id;
      const chatId = callbackQuery.message.chat.id;
      const userId = callbackQuery.from.id;
      const data = callbackQuery.data;

      await handleCallbackQuery(callbackQueryId, chatId, userId, data);
    }

    res.json({ ok: true });
  } catch (error) {
    console.error("[Telegram Webhook] Error:", error);
    res.status(500).json({ ok: false, error: "Internal server error" });
  }
});

/**
 * Payment confirmation webhook from Yandex.Kassa
 * POST /api/telegram/payment-webhook
 */
router.post("/payment-webhook", async (req: Request, res: Response) => {
  try {
    const { event, object } = req.body;

    if (event === "payment.succeeded") {
      const paymentId = object.id;
      const telegramId = object.metadata?.telegramId;
      const tokens = object.metadata?.tokens;

      if (!telegramId || !tokens) {
        console.error("[Payment Webhook] Missing metadata");
        return res.status(400).json({ ok: false });
      }

      // Update user balance
      const user = await getTelegramUser(telegramId);
      if (user) {
        const newBalance = user.tokenBalance + tokens;
        // Update in database
        console.log(`[Payment] User ${telegramId} received ${tokens} tokens. New balance: ${newBalance}`);

        // TODO: Send confirmation message to user
        // await telegramBotClient.sendMessage(chatId, `✅ Платеж успешно обработан! Вам добавлено ${tokens} токенов.`);
      }
    }

    res.json({ ok: true });
  } catch (error) {
    console.error("[Payment Webhook] Error:", error);
    res.status(500).json({ ok: false, error: "Internal server error" });
  }
});

export default router;
