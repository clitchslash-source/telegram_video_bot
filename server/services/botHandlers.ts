import {
  getTelegramUser,
  createTelegramUser,
  addTokensToUser,
  deductTokensFromUser,
  createTokenTransaction,
  createVideoGeneration,
  updateTelegramUserBalance,
  createPaymentTransaction,
} from "../db";
import { telegramBotClient } from "./telegramBotClient";
import { kieAiClient } from "./kieAiClient";
import { yandexKassaClient } from "./yandexKassaClient";
import { notionClient } from "./notionClient";
import { TOKEN_PRICING, PAYMENT_PACKAGES } from "../../shared/config";

/**
 * Handle /start command
 */
export async function handleStartCommand(chatId: number | string, userId: number, firstName: string, username?: string, lastName?: string): Promise<void> {
  try {
    const telegramId = userId.toString();
    let user = await getTelegramUser(telegramId);

    if (!user) {
      // New user - create with free tokens
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

      // Send welcome message
      await telegramBotClient.sendWelcomeMessage(chatId, firstName);

      // Sync to Notion
      try {
        await notionClient.syncUserToNotion({
          telegramId,
          username: username || undefined,
          firstName,
          lastName: lastName || undefined,
          currentBalance: TOKEN_PRICING.FREE_TOKENS_ON_START,
          totalTokensPurchased: 0,
          totalTokensSpent: 0,
          totalGenerations: 0,
          lastInteractionAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        });
} catch (notionError) {
    console.error("[Bot] Notion sync error:", notionError);
  }
    } else {
      // Returning user - show balance
      await telegramBotClient.sendBalanceMessage(chatId, user.tokenBalance);
    }
  } catch (error) {
    console.error("[Bot] Start command error:", error);
    await telegramBotClient.sendErrorMessage(chatId, "Ошибка при инициализации. Попробуйте позже.");
  }
}

/**
 * Handle /balance command
 */
export async function handleBalanceCommand(chatId: number | string, userId: number): Promise<void> {
  try {
    const user = await getTelegramUser(userId.toString());

    if (!user) {
      await telegramBotClient.sendErrorMessage(chatId, "Пользователь не найден. Используйте /start");
      return;
    }

    await telegramBotClient.sendBalanceMessage(chatId, user.tokenBalance);
  } catch (error) {
    console.error("[Bot] Balance command error:", error);
    await telegramBotClient.sendErrorMessage(chatId, "Ошибка при получении баланса.");
  }
}

/**
 * Handle /buy command
 */
export async function handleBuyCommand(chatId: number | string, userId: number): Promise<void> {
  try {
    const user = await getTelegramUser(userId.toString());

    if (!user) {
      await telegramBotClient.sendErrorMessage(chatId, "Пользователь не найден. Используйте /start");
      return;
    }

    await telegramBotClient.sendPaymentPackages(chatId);
  } catch (error) {
    console.error("[Bot] Buy command error:", error);
    await telegramBotClient.sendErrorMessage(chatId, "Ошибка при обработке покупки.");
  }
}

/**
 * Handle /help command
 */
export async function handleHelpCommand(chatId: number | string): Promise<void> {
  try {
    await telegramBotClient.sendHelpMessage(chatId);
  } catch (error) {
    console.error("[Bot] Help command error:", error);
  }
}

/**
 * Handle text message (video generation from text)
 */
export async function handleTextMessage(chatId: number | string, userId: number, text: string): Promise<void> {
  try {
    const user = await getTelegramUser(userId.toString());

    if (!user) {
      await telegramBotClient.sendErrorMessage(chatId, "Пользователь не найден. Используйте /start");
      return;
    }

    // Store the prompt in a temporary state (in production, use Redis or session storage)
    // For now, we'll ask for duration selection
    await telegramBotClient.sendDurationSelection(chatId);
  } catch (error) {
    console.error("[Bot] Text message error:", error);
    await telegramBotClient.sendErrorMessage(chatId, "Ошибка при обработке сообщения.");
  }
}

/**
 * Handle image message
 */
export async function handleImageMessage(chatId: number | string, userId: number, fileId: string): Promise<void> {
  try {
    const user = await getTelegramUser(userId.toString());

    if (!user) {
      await telegramBotClient.sendErrorMessage(chatId, "Пользователь не найден. Используйте /start");
      return;
    }

    const imageUrl = await telegramBotClient.getFile(fileId);
    // Store image URL and ask for prompt
    await telegramBotClient.sendMessage(chatId, "📝 Напишите промпт для видео на основе этого изображения:");
  } catch (error) {
    console.error("[Bot] Image message error:", error);
    await telegramBotClient.sendErrorMessage(chatId, "Ошибка при обработке изображения.");
  }
}

/**
 * Handle voice message
 */
export async function handleVoiceMessage(chatId: number | string, userId: number, fileId: string): Promise<void> {
  try {
    const user = await getTelegramUser(userId.toString());

    if (!user) {
      await telegramBotClient.sendErrorMessage(chatId, "Пользователь не найден. Используйте /start");
      return;
    }

    const voiceUrl = await telegramBotClient.getFile(fileId);
    // Store voice URL and ask for duration
    await telegramBotClient.sendDurationSelection(chatId);
  } catch (error) {
    console.error("[Bot] Voice message error:", error);
    await telegramBotClient.sendErrorMessage(chatId, "Ошибка при обработке голоса.");
  }
}

/**
 * Handle callback query (button clicks)
 */
export async function handleCallbackQuery(callbackQueryId: string, chatId: number | string, userId: number, data: string): Promise<void> {
  try {
    const user = await getTelegramUser(userId.toString());

    if (!user) {
      await telegramBotClient.answerCallbackQuery(callbackQueryId, "Пользователь не найден", true);
      return;
    }

    // Handle buy package
    if (data.startsWith("buy_")) {
      const amount = parseInt(data.replace("buy_", ""));
      const pkg = PAYMENT_PACKAGES.find((p) => p.rubles === amount);

      if (!pkg) {
        await telegramBotClient.answerCallbackQuery(callbackQueryId, "Пакет не найден", true);
        return;
      }

      // Create payment
      try {
        const payment = await yandexKassaClient.createPayment({
          amount: pkg.rubles,
          tokens: pkg.tokens,
          telegramId: userId.toString(),
          description: `Покупка ${pkg.tokens} токенов`,
          returnUrl: `https://t.me/your_bot_username`, // Replace with actual bot username
        });

        await telegramBotClient.sendPaymentLink(chatId, payment.confirmation.confirmationUrl, pkg.tokens);
        await telegramBotClient.answerCallbackQuery(callbackQueryId, "Ссылка на оплату отправлена");
      } catch (error) {
        console.error("[Bot] Payment creation error:", error);
        await telegramBotClient.answerCallbackQuery(callbackQueryId, "Ошибка при создании платежа", true);
      }
    }

    // Handle duration selection
    if (data.startsWith("duration_")) {
      const duration = data.replace("duration_", "") as "10" | "15";
      await telegramBotClient.sendQualitySelection(chatId);
      await telegramBotClient.answerCallbackQuery(callbackQueryId, `Выбрана длительность: ${duration} сек`);
    }

    // Handle quality selection
    if (data.startsWith("quality_")) {
      const quality = data.replace("quality_", "");
      await telegramBotClient.sendProcessingMessage(chatId);
      await telegramBotClient.answerCallbackQuery(callbackQueryId, `Выбрано качество: ${quality}`);
      // Start video generation process
    }

    // Handle watermark removal
    if (data === "remove_watermark") {
      // Deduct tokens for watermark removal
      const newBalance = user.tokenBalance - TOKEN_PRICING.WATERMARK_REMOVAL;
      if (newBalance < 0) {
        await telegramBotClient.sendInsufficientBalanceMessage(chatId, TOKEN_PRICING.WATERMARK_REMOVAL, user.tokenBalance);
        return;
      }

      await updateTelegramUserBalance(userId.toString(), newBalance);
      await telegramBotClient.answerCallbackQuery(callbackQueryId, "Удаление водяного знака...");
    }

    if (data === "keep_watermark") {
      await telegramBotClient.answerCallbackQuery(callbackQueryId, "Видео сохранено с водяным знаком");
    }
  } catch (error) {
    console.error("[Bot] Callback query error:", error);
    await telegramBotClient.answerCallbackQuery(callbackQueryId, "Ошибка при обработке запроса", true);
  }
}
