import axios, { AxiosInstance } from "axios";
import { TELEGRAM_BOT_TOKEN, EMOJI, PAYMENT_PACKAGES, TOKEN_PRICING } from "../../shared/config";

interface TelegramMessage {
  chat_id: number | string;
  text: string;
  parse_mode?: "HTML" | "Markdown" | "MarkdownV2";
  reply_markup?: any;
  disable_web_page_preview?: boolean;
}

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      username?: string;
      last_name?: string;
    };
    chat: {
      id: number;
      type: string;
      title?: string;
      username?: string;
      first_name?: string;
      last_name?: string;
    };
    date: number;
    text?: string;
    document?: {
      file_id: string;
      file_unique_id: string;
      file_size: number;
      mime_type: string;
    };
    photo?: Array<{
      file_id: string;
      file_unique_id: string;
      file_size: number;
      width: number;
      height: number;
    }>;
    voice?: {
      file_id: string;
      file_unique_id: string;
      duration: number;
      mime_type: string;
      file_size: number;
    };
  };
  callback_query?: {
    id: string;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      username?: string;
    };
    chat_instance: string;
    data: string;
    message?: {
      message_id: number;
      chat: {
        id: number;
      };
    };
  };
}

class TelegramBotClient {
  private client: AxiosInstance;
  private botToken: string;
  private apiUrl: string;

  constructor() {
    this.botToken = TELEGRAM_BOT_TOKEN;
    this.apiUrl = `https://api.telegram.org/bot${this.botToken}`;

    this.client = axios.create({
      baseURL: this.apiUrl,
      timeout: 30000,
    });
  }

  /**
   * Send text message
   */
  async sendMessage(chatId: number | string, text: string, options?: any): Promise<void> {
    try {
      const payload: TelegramMessage = {
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        ...options,
      };

      await this.client.post("/sendMessage", payload);
    } catch (error) {
      console.error("[Telegram] Send message error:", error);
      throw error;
    }
  }

  /**
   * Send welcome message on first /start
   */
  async sendWelcomeMessage(chatId: number | string, firstName: string): Promise<void> {
    const text = `${EMOJI.WELCOME} Здравствуйте, ${firstName}!

Я помогу вам с генерацией видео через текст, фото с текстом запроса или голосовое сообщение.

${EMOJI.TOKENS} <b>Вам выдано 60 бесплатных токенов!</b>

<b>Стоимость генерации:</b>
${EMOJI.VIDEO} Видео 10 сек: ${TOKEN_PRICING.VIDEO_10_SEC} токенов
${EMOJI.VIDEO} Видео 15 сек: ${TOKEN_PRICING.VIDEO_15_SEC} токенов
${EMOJI.WATERMARK} Удаление водяного знака: ${TOKEN_PRICING.WATERMARK_REMOVAL} токенов

Используйте команды:
/balance - Ваш баланс
/buy - Купить токены
/help - Справка`;

    await this.sendMessage(chatId, text);
  }

  /**
   * Send balance message
   */
  async sendBalanceMessage(chatId: number | string, balance: number): Promise<void> {
    const text = `${EMOJI.BALANCE} <b>Ваш баланс: ${balance} токенов</b>

${EMOJI.VIDEO} Видео 10 сек: ${TOKEN_PRICING.VIDEO_10_SEC} токенов
${EMOJI.VIDEO} Видео 15 сек: ${TOKEN_PRICING.VIDEO_15_SEC} токенов
${EMOJI.WATERMARK} Удаление водяного знака: ${TOKEN_PRICING.WATERMARK_REMOVAL} токенов`;

    await this.sendMessage(chatId, text);
  }

  /**
   * Send payment packages keyboard
   */
  async sendPaymentPackages(chatId: number | string): Promise<void> {
    const buttons = PAYMENT_PACKAGES.map((pkg) => [
      {
        text: `${EMOJI.PAYMENT} ${pkg.displayName} (${pkg.rubles} руб)`,
        callback_data: `buy_${pkg.rubles}`,
      },
    ]);

    const text = `${EMOJI.PAYMENT} <b>Выберите пакет токенов:</b>`;

    await this.sendMessage(chatId, text, {
      reply_markup: {
        inline_keyboard: buttons,
      },
    });
  }

  /**
   * Send video generation options
   */
  async sendGenerationOptions(chatId: number | string): Promise<void> {
    const text = `${EMOJI.VIDEO} <b>Выберите тип генерации:</b>

1️⃣ <b>Текст → Видео</b> - Напишите промпт
2️⃣ <b>Фото → Видео</b> - Загрузите изображение
3️⃣ <b>Голос → Видео</b> - Отправьте голосовое сообщение`;

    await this.sendMessage(chatId, text);
  }

  /**
   * Send video duration selection
   */
  async sendDurationSelection(chatId: number | string): Promise<void> {
    const buttons = [
      [
        {
          text: `${EMOJI.VIDEO} 10 сек (${TOKEN_PRICING.VIDEO_10_SEC} токенов)`,
          callback_data: "duration_10",
        },
      ],
      [
        {
          text: `${EMOJI.VIDEO} 15 сек (${TOKEN_PRICING.VIDEO_15_SEC} токенов)`,
          callback_data: "duration_15",
        },
      ],
    ];

    const text = `${EMOJI.VIDEO} <b>Выберите длительность видео:</b>`;

    await this.sendMessage(chatId, text, {
      reply_markup: {
        inline_keyboard: buttons,
      },
    });
  }

  /**
   * Send quality selection
   */
  async sendQualitySelection(chatId: number | string): Promise<void> {
    const buttons = [
      [{ text: "🔹 Низкое", callback_data: "quality_low" }],
      [{ text: "🔸 Стандартное", callback_data: "quality_standard" }],
      [{ text: "🔺 Высокое", callback_data: "quality_high" }],
    ];

    const text = `${EMOJI.QUALITY} <b>Выберите качество видео:</b>`;

    await this.sendMessage(chatId, text, {
      reply_markup: {
        inline_keyboard: buttons,
      },
    });
  }

  /**
   * Send processing message
   */
  async sendProcessingMessage(chatId: number | string): Promise<void> {
    const text = `${EMOJI.LOADING} Генерирую видео... Это может занять некоторое время.`;

    await this.sendMessage(chatId, text);
  }

  /**
   * Send success message with balance
   */
  async sendSuccessMessage(chatId: number | string, balance: number, videoUrl?: string): Promise<void> {
    let text = `${EMOJI.SUCCESS} <b>Видео успешно сгенерировано!</b>

${EMOJI.BALANCE} Ваш баланс: <b>${balance} токенов</b>`;

    if (videoUrl) {
      text += `\n\n${EMOJI.DOWNLOAD} <a href="${videoUrl}">Скачать видео</a>`;
    }

    await this.sendMessage(chatId, text, {
      disable_web_page_preview: true,
    });
  }

  /**
   * Send error message
   */
  async sendErrorMessage(chatId: number | string, errorMessage: string): Promise<void> {
    const text = `${EMOJI.ERROR} <b>Ошибка при генерации видео:</b>\n\n${errorMessage}`;

    await this.sendMessage(chatId, text);
  }

  /**
   * Send insufficient balance message
   */
  async sendInsufficientBalanceMessage(chatId: number | string, requiredTokens: number, currentBalance: number): Promise<void> {
    const text = `${EMOJI.ERROR} <b>Недостаточно токенов!</b>

Требуется: ${requiredTokens} токенов
Ваш баланс: ${currentBalance} токенов

Используйте /buy для покупки токенов.`;

    await this.sendMessage(chatId, text);
  }

  /**
   * Send payment link
   */
  async sendPaymentLink(chatId: number | string, paymentUrl: string, tokens: number): Promise<void> {
    const text = `${EMOJI.PAYMENT} <b>Ссылка на оплату:</b>

Вы покупаете: <b>${tokens} токенов</b>

<a href="${paymentUrl}">Перейти к оплате</a>`;

    await this.sendMessage(chatId, text, {
      disable_web_page_preview: true,
    });
  }

  /**
   * Send watermark removal option
   */
  async sendWatermarkRemovalOption(chatId: number | string): Promise<void> {
    const buttons = [
      [{ text: `${EMOJI.WATERMARK} Удалить водяной знак (${TOKEN_PRICING.WATERMARK_REMOVAL} токенов)`, callback_data: "remove_watermark" }],
      [{ text: `${EMOJI.SUCCESS} Оставить как есть`, callback_data: "keep_watermark" }],
    ];

    const text = `${EMOJI.WATERMARK} <b>Удалить водяной знак?</b>`;

    await this.sendMessage(chatId, text, {
      reply_markup: {
        inline_keyboard: buttons,
      },
    });
  }

  /**
   * Send help message
   */
  async sendHelpMessage(chatId: number | string): Promise<void> {
    const text = `${EMOJI.SETTINGS} <b>Справка по командам:</b>

/start - Начало работы
/balance - Проверить баланс
/buy - Купить токены
/history - История генераций
/help - Эта справка

<b>Как генерировать видео:</b>
1. Напишите текст (промпт)
2. Загрузите фото или голос (опционально)
3. Выберите длительность и качество
4. Видео будет сгенерировано`;

    await this.sendMessage(chatId, text);
  }

  /**
   * Answer callback query
   */
  async answerCallbackQuery(callbackQueryId: string, text?: string, showAlert?: boolean): Promise<void> {
    try {
      await this.client.post("/answerCallbackQuery", {
        callback_query_id: callbackQueryId,
        text: text || "",
        show_alert: showAlert || false,
      });
    } catch (error) {
      console.error("[Telegram] Answer callback query error:", error);
    }
  }

  /**
   * Get file
   */
  async getFile(fileId: string): Promise<string> {
    try {
      const response = await this.client.get("/getFile", {
        params: { file_id: fileId },
      });

      const filePath = response.data.result.file_path;
      return `https://api.telegram.org/file/bot${this.botToken}/${filePath}`;
    } catch (error) {
      console.error("[Telegram] Get file error:", error);
      throw error;
    }
  }
}

export const telegramBotClient = new TelegramBotClient();
