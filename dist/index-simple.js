var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});

// server/index-simple.ts
import "dotenv/config";
import express2 from "express";
import { createServer } from "http";

// server/routes/telegramWebhook.ts
import express from "express";

// server/db.ts
import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";

// drizzle/schema.ts
import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, decimal } from "drizzle-orm/mysql-core";
var users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull()
});
var telegramUsers = mysqlTable("telegram_users", {
  id: int("id").autoincrement().primaryKey(),
  telegramId: varchar("telegramId", { length: 64 }).notNull().unique(),
  username: varchar("username", { length: 255 }),
  firstName: varchar("firstName", { length: 255 }),
  lastName: varchar("lastName", { length: 255 }),
  tokenBalance: int("tokenBalance").default(0).notNull(),
  totalTokensPurchased: int("totalTokensPurchased").default(0).notNull(),
  totalTokensSpent: int("totalTokensSpent").default(0).notNull(),
  totalGenerations: int("totalGenerations").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  lastInteractionAt: timestamp("lastInteractionAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var tokenTransactions = mysqlTable("token_transactions", {
  id: int("id").autoincrement().primaryKey(),
  telegramId: varchar("telegramId", { length: 64 }).notNull(),
  type: mysqlEnum("type", ["purchase", "generation", "removal", "refund", "bonus"]).notNull(),
  amount: int("amount").notNull(),
  balanceBefore: int("balanceBefore").notNull(),
  balanceAfter: int("balanceAfter").notNull(),
  description: text("description"),
  relatedTransactionId: int("relatedTransactionId"),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var videoGenerations = mysqlTable("video_generations", {
  id: int("id").autoincrement().primaryKey(),
  telegramId: varchar("telegramId", { length: 64 }).notNull(),
  inputType: mysqlEnum("inputType", ["text", "image", "voice"]).notNull(),
  duration: mysqlEnum("duration", ["10", "15"]).notNull(),
  quality: varchar("quality", { length: 50 }).default("standard").notNull(),
  prompt: text("prompt"),
  inputFileUrl: text("inputFileUrl"),
  outputVideoUrl: text("outputVideoUrl"),
  tokensCost: int("tokensCost").notNull(),
  hasWatermark: boolean("hasWatermark").default(true).notNull(),
  watermarkRemovalApplied: boolean("watermarkRemovalApplied").default(false).notNull(),
  watermarkRemovalCost: int("watermarkRemovalCost").default(0).notNull(),
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
  errorMessage: text("errorMessage"),
  kieAiJobId: varchar("kieAiJobId", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var paymentTransactions = mysqlTable("payment_transactions", {
  id: int("id").autoincrement().primaryKey(),
  telegramId: varchar("telegramId", { length: 64 }).notNull(),
  paymentId: varchar("paymentId", { length: 255 }).notNull().unique(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  tokens: int("tokens").notNull(),
  status: mysqlEnum("status", ["pending", "succeeded", "failed", "cancelled"]).default("pending").notNull(),
  paymentMethod: varchar("paymentMethod", { length: 50 }),
  description: text("description"),
  notionSynced: boolean("notionSynced").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var notionSyncStatus = mysqlTable("notion_sync_status", {
  id: int("id").autoincrement().primaryKey(),
  entityType: mysqlEnum("entityType", ["user", "transaction", "generation", "payment"]).notNull(),
  entityId: varchar("entityId", { length: 255 }).notNull(),
  telegramId: varchar("telegramId", { length: 64 }).notNull(),
  notionPageId: varchar("notionPageId", { length: 255 }),
  synced: boolean("synced").default(false).notNull(),
  syncedAt: timestamp("syncedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});

// server/_core/env.ts
var ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? ""
};

// server/db.ts
var _db = null;
async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}
async function getTelegramUser(telegramId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(telegramUsers).where(eq(telegramUsers.telegramId, telegramId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function createTelegramUser(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(telegramUsers).values(data);
  const user = await getTelegramUser(data.telegramId);
  if (!user) throw new Error("Failed to create user");
  return user;
}
async function updateTelegramUserBalance(telegramId, newBalance) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(telegramUsers).set({ tokenBalance: newBalance }).where(eq(telegramUsers.telegramId, telegramId));
}

// server/services/telegramBotClient.ts
import axios from "axios";

// shared/config.ts
var TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
var KIE_AI_API_KEY = process.env.KIE_AI_API_KEY || "";
var YANDEX_KASSA_SHOP_ID = process.env.YANDEX_KASSA_SHOP_ID || "";
var YANDEX_KASSA_SECRET_KEY = process.env.YANDEX_KASSA_SECRET_KEY || "";
var NOTION_API_KEY = process.env.NOTION_API_KEY || "";
var NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID || "";
var TOKEN_PRICING = {
  VIDEO_10_SEC: 20,
  VIDEO_15_SEC: 25,
  WATERMARK_REMOVAL: 10,
  FREE_TOKENS_ON_START: 60
};
var PAYMENT_PACKAGES = [
  { rubles: 500, tokens: 500, displayName: "500 \u0442\u043E\u043A\u0435\u043D\u043E\u0432" },
  { rubles: 1e3, tokens: 1e3, displayName: "1000 \u0442\u043E\u043A\u0435\u043D\u043E\u0432" },
  { rubles: 2e3, tokens: 2e3, displayName: "2000 \u0442\u043E\u043A\u0435\u043D\u043E\u0432" },
  { rubles: 4e3, tokens: 4e3, displayName: "4000 \u0442\u043E\u043A\u0435\u043D\u043E\u0432" }
];
var YANDEX_KASSA_CONFIG = {
  BASE_URL: "https://api.yookassa.ru/v3",
  ENDPOINTS: {
    CREATE_PAYMENT: "/payments",
    GET_PAYMENT: "/payments"
  }
};
var NOTION_CONFIG = {
  BASE_URL: "https://api.notion.com/v1",
  VERSION: "2022-06-28"
};
var EMOJI = {
  WELCOME: "\u{1F44B}",
  BALANCE: "\u{1F4B0}",
  VIDEO: "\u{1F3AC}",
  PAYMENT: "\u{1F4B3}",
  SUCCESS: "\u2705",
  ERROR: "\u274C",
  LOADING: "\u23F3",
  WATERMARK: "\u{1F3A8}",
  TOKENS: "\u{1FA99}",
  HISTORY: "\u{1F4DC}",
  SETTINGS: "\u2699\uFE0F",
  DOWNLOAD: "\u2B07\uFE0F",
  QUALITY: "\u{1F3A5}"
};

// server/services/telegramBotClient.ts
var TelegramBotClient = class {
  client;
  botToken;
  apiUrl;
  constructor() {
    this.botToken = TELEGRAM_BOT_TOKEN;
    this.apiUrl = `https://api.telegram.org/bot${this.botToken}`;
    this.client = axios.create({
      baseURL: this.apiUrl,
      timeout: 3e4
    });
  }
  /**
   * Send text message
   */
  async sendMessage(chatId, text2, options) {
    try {
      const payload = {
        chat_id: chatId,
        text: text2,
        parse_mode: "HTML",
        ...options
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
  async sendWelcomeMessage(chatId, firstName) {
    const text2 = `${EMOJI.WELCOME} \u0417\u0434\u0440\u0430\u0432\u0441\u0442\u0432\u0443\u0439\u0442\u0435, ${firstName}!

\u042F \u043F\u043E\u043C\u043E\u0433\u0443 \u0432\u0430\u043C \u0441 \u0433\u0435\u043D\u0435\u0440\u0430\u0446\u0438\u0435\u0439 \u0432\u0438\u0434\u0435\u043E \u0447\u0435\u0440\u0435\u0437 \u0442\u0435\u043A\u0441\u0442, \u0444\u043E\u0442\u043E \u0441 \u0442\u0435\u043A\u0441\u0442\u043E\u043C \u0437\u0430\u043F\u0440\u043E\u0441\u0430 \u0438\u043B\u0438 \u0433\u043E\u043B\u043E\u0441\u043E\u0432\u043E\u0435 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435.

${EMOJI.TOKENS} <b>\u0412\u0430\u043C \u0432\u044B\u0434\u0430\u043D\u043E 60 \u0431\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u044B\u0445 \u0442\u043E\u043A\u0435\u043D\u043E\u0432!</b>

<b>\u0421\u0442\u043E\u0438\u043C\u043E\u0441\u0442\u044C \u0433\u0435\u043D\u0435\u0440\u0430\u0446\u0438\u0438:</b>
${EMOJI.VIDEO} \u0412\u0438\u0434\u0435\u043E 10 \u0441\u0435\u043A: ${TOKEN_PRICING.VIDEO_10_SEC} \u0442\u043E\u043A\u0435\u043D\u043E\u0432
${EMOJI.VIDEO} \u0412\u0438\u0434\u0435\u043E 15 \u0441\u0435\u043A: ${TOKEN_PRICING.VIDEO_15_SEC} \u0442\u043E\u043A\u0435\u043D\u043E\u0432
${EMOJI.WATERMARK} \u0423\u0434\u0430\u043B\u0435\u043D\u0438\u0435 \u0432\u043E\u0434\u044F\u043D\u043E\u0433\u043E \u0437\u043D\u0430\u043A\u0430: ${TOKEN_PRICING.WATERMARK_REMOVAL} \u0442\u043E\u043A\u0435\u043D\u043E\u0432

\u0418\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0439\u0442\u0435 \u043A\u043E\u043C\u0430\u043D\u0434\u044B:
/balance - \u0412\u0430\u0448 \u0431\u0430\u043B\u0430\u043D\u0441
/buy - \u041A\u0443\u043F\u0438\u0442\u044C \u0442\u043E\u043A\u0435\u043D\u044B
/help - \u0421\u043F\u0440\u0430\u0432\u043A\u0430`;
    await this.sendMessage(chatId, text2);
  }
  /**
   * Send balance message
   */
  async sendBalanceMessage(chatId, balance) {
    const text2 = `${EMOJI.BALANCE} <b>\u0412\u0430\u0448 \u0431\u0430\u043B\u0430\u043D\u0441: ${balance} \u0442\u043E\u043A\u0435\u043D\u043E\u0432</b>

${EMOJI.VIDEO} \u0412\u0438\u0434\u0435\u043E 10 \u0441\u0435\u043A: ${TOKEN_PRICING.VIDEO_10_SEC} \u0442\u043E\u043A\u0435\u043D\u043E\u0432
${EMOJI.VIDEO} \u0412\u0438\u0434\u0435\u043E 15 \u0441\u0435\u043A: ${TOKEN_PRICING.VIDEO_15_SEC} \u0442\u043E\u043A\u0435\u043D\u043E\u0432
${EMOJI.WATERMARK} \u0423\u0434\u0430\u043B\u0435\u043D\u0438\u0435 \u0432\u043E\u0434\u044F\u043D\u043E\u0433\u043E \u0437\u043D\u0430\u043A\u0430: ${TOKEN_PRICING.WATERMARK_REMOVAL} \u0442\u043E\u043A\u0435\u043D\u043E\u0432`;
    await this.sendMessage(chatId, text2);
  }
  /**
   * Send payment packages keyboard
   */
  async sendPaymentPackages(chatId) {
    const buttons = PAYMENT_PACKAGES.map((pkg) => [
      {
        text: `${EMOJI.PAYMENT} ${pkg.displayName} (${pkg.rubles} \u0440\u0443\u0431)`,
        callback_data: `buy_${pkg.rubles}`
      }
    ]);
    const text2 = `${EMOJI.PAYMENT} <b>\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u043F\u0430\u043A\u0435\u0442 \u0442\u043E\u043A\u0435\u043D\u043E\u0432:</b>`;
    await this.sendMessage(chatId, text2, {
      reply_markup: {
        inline_keyboard: buttons
      }
    });
  }
  /**
   * Send video generation options
   */
  async sendGenerationOptions(chatId) {
    const text2 = `${EMOJI.VIDEO} <b>\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0442\u0438\u043F \u0433\u0435\u043D\u0435\u0440\u0430\u0446\u0438\u0438:</b>

1\uFE0F\u20E3 <b>\u0422\u0435\u043A\u0441\u0442 \u2192 \u0412\u0438\u0434\u0435\u043E</b> - \u041D\u0430\u043F\u0438\u0448\u0438\u0442\u0435 \u043F\u0440\u043E\u043C\u043F\u0442
2\uFE0F\u20E3 <b>\u0424\u043E\u0442\u043E \u2192 \u0412\u0438\u0434\u0435\u043E</b> - \u0417\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u0435 \u0438\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u0435
3\uFE0F\u20E3 <b>\u0413\u043E\u043B\u043E\u0441 \u2192 \u0412\u0438\u0434\u0435\u043E</b> - \u041E\u0442\u043F\u0440\u0430\u0432\u044C\u0442\u0435 \u0433\u043E\u043B\u043E\u0441\u043E\u0432\u043E\u0435 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435`;
    await this.sendMessage(chatId, text2);
  }
  /**
   * Send video duration selection
   */
  async sendDurationSelection(chatId) {
    const buttons = [
      [
        {
          text: `${EMOJI.VIDEO} 10 \u0441\u0435\u043A (${TOKEN_PRICING.VIDEO_10_SEC} \u0442\u043E\u043A\u0435\u043D\u043E\u0432)`,
          callback_data: "duration_10"
        }
      ],
      [
        {
          text: `${EMOJI.VIDEO} 15 \u0441\u0435\u043A (${TOKEN_PRICING.VIDEO_15_SEC} \u0442\u043E\u043A\u0435\u043D\u043E\u0432)`,
          callback_data: "duration_15"
        }
      ]
    ];
    const text2 = `${EMOJI.VIDEO} <b>\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0434\u043B\u0438\u0442\u0435\u043B\u044C\u043D\u043E\u0441\u0442\u044C \u0432\u0438\u0434\u0435\u043E:</b>`;
    await this.sendMessage(chatId, text2, {
      reply_markup: {
        inline_keyboard: buttons
      }
    });
  }
  /**
   * Send quality selection
   */
  async sendQualitySelection(chatId) {
    const buttons = [
      [{ text: "\u{1F539} \u041D\u0438\u0437\u043A\u043E\u0435", callback_data: "quality_low" }],
      [{ text: "\u{1F538} \u0421\u0442\u0430\u043D\u0434\u0430\u0440\u0442\u043D\u043E\u0435", callback_data: "quality_standard" }],
      [{ text: "\u{1F53A} \u0412\u044B\u0441\u043E\u043A\u043E\u0435", callback_data: "quality_high" }]
    ];
    const text2 = `${EMOJI.QUALITY} <b>\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u043A\u0430\u0447\u0435\u0441\u0442\u0432\u043E \u0432\u0438\u0434\u0435\u043E:</b>`;
    await this.sendMessage(chatId, text2, {
      reply_markup: {
        inline_keyboard: buttons
      }
    });
  }
  /**
   * Send processing message
   */
  async sendProcessingMessage(chatId) {
    const text2 = `${EMOJI.LOADING} \u0413\u0435\u043D\u0435\u0440\u0438\u0440\u0443\u044E \u0432\u0438\u0434\u0435\u043E... \u042D\u0442\u043E \u043C\u043E\u0436\u0435\u0442 \u0437\u0430\u043D\u044F\u0442\u044C \u043D\u0435\u043A\u043E\u0442\u043E\u0440\u043E\u0435 \u0432\u0440\u0435\u043C\u044F.`;
    await this.sendMessage(chatId, text2);
  }
  /**
   * Send success message with balance
   */
  async sendSuccessMessage(chatId, balance, videoUrl) {
    let text2 = `${EMOJI.SUCCESS} <b>\u0412\u0438\u0434\u0435\u043E \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0441\u0433\u0435\u043D\u0435\u0440\u0438\u0440\u043E\u0432\u0430\u043D\u043E!</b>

${EMOJI.BALANCE} \u0412\u0430\u0448 \u0431\u0430\u043B\u0430\u043D\u0441: <b>${balance} \u0442\u043E\u043A\u0435\u043D\u043E\u0432</b>`;
    if (videoUrl) {
      text2 += `

${EMOJI.DOWNLOAD} <a href="${videoUrl}">\u0421\u043A\u0430\u0447\u0430\u0442\u044C \u0432\u0438\u0434\u0435\u043E</a>`;
    }
    await this.sendMessage(chatId, text2, {
      disable_web_page_preview: true
    });
  }
  /**
   * Send error message
   */
  async sendErrorMessage(chatId, errorMessage) {
    const text2 = `${EMOJI.ERROR} <b>\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0433\u0435\u043D\u0435\u0440\u0430\u0446\u0438\u0438 \u0432\u0438\u0434\u0435\u043E:</b>

${errorMessage}`;
    await this.sendMessage(chatId, text2);
  }
  /**
   * Send insufficient balance message
   */
  async sendInsufficientBalanceMessage(chatId, requiredTokens, currentBalance) {
    const text2 = `${EMOJI.ERROR} <b>\u041D\u0435\u0434\u043E\u0441\u0442\u0430\u0442\u043E\u0447\u043D\u043E \u0442\u043E\u043A\u0435\u043D\u043E\u0432!</b>

\u0422\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044F: ${requiredTokens} \u0442\u043E\u043A\u0435\u043D\u043E\u0432
\u0412\u0430\u0448 \u0431\u0430\u043B\u0430\u043D\u0441: ${currentBalance} \u0442\u043E\u043A\u0435\u043D\u043E\u0432

\u0418\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0439\u0442\u0435 /buy \u0434\u043B\u044F \u043F\u043E\u043A\u0443\u043F\u043A\u0438 \u0442\u043E\u043A\u0435\u043D\u043E\u0432.`;
    await this.sendMessage(chatId, text2);
  }
  /**
   * Send payment link
   */
  async sendPaymentLink(chatId, paymentUrl, tokens) {
    const text2 = `${EMOJI.PAYMENT} <b>\u0421\u0441\u044B\u043B\u043A\u0430 \u043D\u0430 \u043E\u043F\u043B\u0430\u0442\u0443:</b>

\u0412\u044B \u043F\u043E\u043A\u0443\u043F\u0430\u0435\u0442\u0435: <b>${tokens} \u0442\u043E\u043A\u0435\u043D\u043E\u0432</b>

<a href="${paymentUrl}">\u041F\u0435\u0440\u0435\u0439\u0442\u0438 \u043A \u043E\u043F\u043B\u0430\u0442\u0435</a>`;
    await this.sendMessage(chatId, text2, {
      disable_web_page_preview: true
    });
  }
  /**
   * Send watermark removal option
   */
  async sendWatermarkRemovalOption(chatId) {
    const buttons = [
      [{ text: `${EMOJI.WATERMARK} \u0423\u0434\u0430\u043B\u0438\u0442\u044C \u0432\u043E\u0434\u044F\u043D\u043E\u0439 \u0437\u043D\u0430\u043A (${TOKEN_PRICING.WATERMARK_REMOVAL} \u0442\u043E\u043A\u0435\u043D\u043E\u0432)`, callback_data: "remove_watermark" }],
      [{ text: `${EMOJI.SUCCESS} \u041E\u0441\u0442\u0430\u0432\u0438\u0442\u044C \u043A\u0430\u043A \u0435\u0441\u0442\u044C`, callback_data: "keep_watermark" }]
    ];
    const text2 = `${EMOJI.WATERMARK} <b>\u0423\u0434\u0430\u043B\u0438\u0442\u044C \u0432\u043E\u0434\u044F\u043D\u043E\u0439 \u0437\u043D\u0430\u043A?</b>`;
    await this.sendMessage(chatId, text2, {
      reply_markup: {
        inline_keyboard: buttons
      }
    });
  }
  /**
   * Send help message
   */
  async sendHelpMessage(chatId) {
    const text2 = `${EMOJI.SETTINGS} <b>\u0421\u043F\u0440\u0430\u0432\u043A\u0430 \u043F\u043E \u043A\u043E\u043C\u0430\u043D\u0434\u0430\u043C:</b>

/start - \u041D\u0430\u0447\u0430\u043B\u043E \u0440\u0430\u0431\u043E\u0442\u044B
/balance - \u041F\u0440\u043E\u0432\u0435\u0440\u0438\u0442\u044C \u0431\u0430\u043B\u0430\u043D\u0441
/buy - \u041A\u0443\u043F\u0438\u0442\u044C \u0442\u043E\u043A\u0435\u043D\u044B
/history - \u0418\u0441\u0442\u043E\u0440\u0438\u044F \u0433\u0435\u043D\u0435\u0440\u0430\u0446\u0438\u0439
/help - \u042D\u0442\u0430 \u0441\u043F\u0440\u0430\u0432\u043A\u0430

<b>\u041A\u0430\u043A \u0433\u0435\u043D\u0435\u0440\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u0432\u0438\u0434\u0435\u043E:</b>
1. \u041D\u0430\u043F\u0438\u0448\u0438\u0442\u0435 \u0442\u0435\u043A\u0441\u0442 (\u043F\u0440\u043E\u043C\u043F\u0442)
2. \u0417\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u0435 \u0444\u043E\u0442\u043E \u0438\u043B\u0438 \u0433\u043E\u043B\u043E\u0441 (\u043E\u043F\u0446\u0438\u043E\u043D\u0430\u043B\u044C\u043D\u043E)
3. \u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0434\u043B\u0438\u0442\u0435\u043B\u044C\u043D\u043E\u0441\u0442\u044C \u0438 \u043A\u0430\u0447\u0435\u0441\u0442\u0432\u043E
4. \u0412\u0438\u0434\u0435\u043E \u0431\u0443\u0434\u0435\u0442 \u0441\u0433\u0435\u043D\u0435\u0440\u0438\u0440\u043E\u0432\u0430\u043D\u043E`;
    await this.sendMessage(chatId, text2);
  }
  /**
   * Answer callback query
   */
  async answerCallbackQuery(callbackQueryId, text2, showAlert) {
    try {
      await this.client.post("/answerCallbackQuery", {
        callback_query_id: callbackQueryId,
        text: text2 || "",
        show_alert: showAlert || false
      });
    } catch (error) {
      console.error("[Telegram] Answer callback query error:", error);
    }
  }
  /**
   * Get file
   */
  async getFile(fileId) {
    try {
      const response = await this.client.get("/getFile", {
        params: { file_id: fileId }
      });
      const filePath = response.data.result.file_path;
      return `https://api.telegram.org/file/bot${this.botToken}/${filePath}`;
    } catch (error) {
      console.error("[Telegram] Get file error:", error);
      throw error;
    }
  }
};
var telegramBotClient = new TelegramBotClient();

// server/services/yandexKassaClient.ts
import axios2 from "axios";
var YandexKassaClient = class {
  client;
  shopId;
  secretKey;
  constructor() {
    this.shopId = YANDEX_KASSA_SHOP_ID;
    this.secretKey = YANDEX_KASSA_SECRET_KEY;
    const auth = Buffer.from(`${this.shopId}:${this.secretKey}`).toString("base64");
    this.client = axios2.create({
      baseURL: YANDEX_KASSA_CONFIG.BASE_URL,
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
        "Idempotency-Key": this.generateIdempotencyKey()
      },
      timeout: 3e4
    });
  }
  /**
   * Create payment for token purchase
   */
  async createPayment(request) {
    try {
      const payload = {
        amount: {
          value: request.amount.toFixed(2),
          currency: "RUB"
        },
        payment_method_data: {
          type: "bank_card"
        },
        confirmation: {
          type: "redirect",
          return_url: request.returnUrl
        },
        metadata: {
          telegramId: request.telegramId,
          tokens: request.tokens
        },
        description: request.description
      };
      const response = await this.client.post(
        YANDEX_KASSA_CONFIG.ENDPOINTS.CREATE_PAYMENT,
        payload
      );
      return {
        id: response.data.id,
        status: response.data.status,
        amount: response.data.amount,
        confirmation: response.data.confirmation,
        created_at: response.data.created_at
      };
    } catch (error) {
      console.error("[Yandex.Kassa] Payment creation error:", error);
      throw new Error(`Failed to create payment: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
  /**
   * Get payment status
   */
  async getPayment(paymentId) {
    try {
      const response = await this.client.get(
        `${YANDEX_KASSA_CONFIG.ENDPOINTS.GET_PAYMENT}/${paymentId}`
      );
      return {
        id: response.data.id,
        status: response.data.status,
        amount: response.data.amount,
        payment_method: response.data.payment_method,
        created_at: response.data.created_at,
        captured_at: response.data.captured_at
      };
    } catch (error) {
      console.error("[Yandex.Kassa] Payment status check error:", error);
      throw new Error(`Failed to get payment: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(body, signature) {
    try {
      const crypto = __require("crypto");
      const hash = crypto.createHmac("sha256", this.secretKey).update(body).digest("base64");
      return hash === signature;
    } catch (error) {
      console.error("[Yandex.Kassa] Webhook verification error:", error);
      return false;
    }
  }
  /**
   * Generate unique idempotency key
   */
  generateIdempotencyKey() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
};
var yandexKassaClient = new YandexKassaClient();

// server/services/notionClient.ts
import axios3 from "axios";
var NotionClient = class {
  client;
  databaseId;
  constructor() {
    this.databaseId = NOTION_DATABASE_ID;
    this.client = axios3.create({
      baseURL: NOTION_CONFIG.BASE_URL,
      headers: {
        Authorization: `Bearer ${NOTION_API_KEY}`,
        "Notion-Version": NOTION_CONFIG.VERSION,
        "Content-Type": "application/json"
      },
      timeout: 3e4
    });
  }
  /**
   * Create or update user record in Notion
   */
  async syncUserToNotion(user) {
    try {
      const existingPageId = await this.findUserPage(user.telegramId);
      if (existingPageId) {
        await this.updateUserPage(existingPageId, user);
        return existingPageId;
      } else {
        const pageId = await this.createUserPage(user);
        return pageId;
      }
    } catch (error) {
      console.error("[Notion] User sync error:", error);
      throw new Error(`Failed to sync user to Notion: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
  /**
   * Find user page by Telegram ID
   */
  async findUserPage(telegramId) {
    try {
      const response = await this.client.post("/databases/" + this.databaseId + "/query", {
        filter: {
          property: "Telegram ID",
          rich_text: {
            equals: telegramId
          }
        }
      });
      if (response.data.results && response.data.results.length > 0) {
        return response.data.results[0].id;
      }
      return null;
    } catch (error) {
      console.error("[Notion] Find user page error:", error);
      return null;
    }
  }
  /**
   * Create new user page in Notion
   */
  async createUserPage(user) {
    try {
      const response = await this.client.post("/pages", {
        parent: {
          database_id: this.databaseId
        },
        properties: {
          "Telegram ID": {
            title: [
              {
                text: {
                  content: user.telegramId
                }
              }
            ]
          },
          "Username": {
            rich_text: [
              {
                text: {
                  content: user.username || ""
                }
              }
            ]
          },
          "First Name": {
            rich_text: [
              {
                text: {
                  content: user.firstName || ""
                }
              }
            ]
          },
          "Last Name": {
            rich_text: [
              {
                text: {
                  content: user.lastName || ""
                }
              }
            ]
          },
          "Current Balance": {
            number: user.currentBalance
          },
          "Total Purchased": {
            number: user.totalTokensPurchased
          },
          "Total Spent": {
            number: user.totalTokensSpent
          },
          "Total Generations": {
            number: user.totalGenerations
          },
          "Last Interaction": {
            date: {
              start: user.lastInteractionAt
            }
          },
          "Created At": {
            date: {
              start: user.createdAt
            }
          }
        }
      });
      return response.data.id;
    } catch (error) {
      console.error("[Notion] Create user page error:", error);
      throw error;
    }
  }
  /**
   * Update existing user page in Notion
   */
  async updateUserPage(pageId, user) {
    try {
      await this.client.patch(`/pages/${pageId}`, {
        properties: {
          "Username": {
            rich_text: [
              {
                text: {
                  content: user.username || ""
                }
              }
            ]
          },
          "First Name": {
            rich_text: [
              {
                text: {
                  content: user.firstName || ""
                }
              }
            ]
          },
          "Last Name": {
            rich_text: [
              {
                text: {
                  content: user.lastName || ""
                }
              }
            ]
          },
          "Current Balance": {
            number: user.currentBalance
          },
          "Total Purchased": {
            number: user.totalTokensPurchased
          },
          "Total Spent": {
            number: user.totalTokensSpent
          },
          "Total Generations": {
            number: user.totalGenerations
          },
          "Last Interaction": {
            date: {
              start: user.lastInteractionAt
            }
          }
        }
      });
    } catch (error) {
      console.error("[Notion] Update user page error:", error);
      throw error;
    }
  }
  /**
   * Add transaction record to Notion
   */
  async addTransactionToNotion(telegramId, type, amount, description) {
    try {
      console.log(`[Notion] Transaction: ${telegramId} - ${type} - ${amount} tokens - ${description}`);
    } catch (error) {
      console.error("[Notion] Add transaction error:", error);
    }
  }
};
var notionClient = new NotionClient();

// server/services/botHandlers.ts
async function handleStartCommand(chatId, userId, firstName, username, lastName) {
  try {
    const telegramId = userId.toString();
    let user = await getTelegramUser(telegramId);
    if (!user) {
      user = await createTelegramUser({
        telegramId,
        username: username || void 0,
        firstName,
        lastName: lastName || void 0,
        tokenBalance: TOKEN_PRICING.FREE_TOKENS_ON_START,
        totalTokensPurchased: 0,
        totalTokensSpent: 0,
        totalGenerations: 0
      });
      await telegramBotClient.sendWelcomeMessage(chatId, firstName);
      try {
        await notionClient.syncUserToNotion({
          telegramId,
          username: username || void 0,
          firstName,
          lastName: lastName || void 0,
          currentBalance: TOKEN_PRICING.FREE_TOKENS_ON_START,
          totalTokensPurchased: 0,
          totalTokensSpent: 0,
          totalGenerations: 0,
          lastInteractionAt: (/* @__PURE__ */ new Date()).toISOString(),
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        });
      } catch (notionError) {
        console.error("[Bot] Notion sync error:", notionError);
      }
    } else {
      await telegramBotClient.sendBalanceMessage(chatId, user.tokenBalance);
    }
  } catch (error) {
    console.error("[Bot] Start command error:", error);
    await telegramBotClient.sendErrorMessage(chatId, "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0438\u043D\u0438\u0446\u0438\u0430\u043B\u0438\u0437\u0430\u0446\u0438\u0438. \u041F\u043E\u043F\u0440\u043E\u0431\u0443\u0439\u0442\u0435 \u043F\u043E\u0437\u0436\u0435.");
  }
}
async function handleBalanceCommand(chatId, userId) {
  try {
    const user = await getTelegramUser(userId.toString());
    if (!user) {
      await telegramBotClient.sendErrorMessage(chatId, "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D. \u0418\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0439\u0442\u0435 /start");
      return;
    }
    await telegramBotClient.sendBalanceMessage(chatId, user.tokenBalance);
  } catch (error) {
    console.error("[Bot] Balance command error:", error);
    await telegramBotClient.sendErrorMessage(chatId, "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0438 \u0431\u0430\u043B\u0430\u043D\u0441\u0430.");
  }
}
async function handleBuyCommand(chatId, userId) {
  try {
    const user = await getTelegramUser(userId.toString());
    if (!user) {
      await telegramBotClient.sendErrorMessage(chatId, "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D. \u0418\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0439\u0442\u0435 /start");
      return;
    }
    await telegramBotClient.sendPaymentPackages(chatId);
  } catch (error) {
    console.error("[Bot] Buy command error:", error);
    await telegramBotClient.sendErrorMessage(chatId, "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0435 \u043F\u043E\u043A\u0443\u043F\u043A\u0438.");
  }
}
async function handleHelpCommand(chatId) {
  try {
    await telegramBotClient.sendHelpMessage(chatId);
  } catch (error) {
    console.error("[Bot] Help command error:", error);
  }
}
async function handleTextMessage(chatId, userId, text2) {
  try {
    const user = await getTelegramUser(userId.toString());
    if (!user) {
      await telegramBotClient.sendErrorMessage(chatId, "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D. \u0418\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0439\u0442\u0435 /start");
      return;
    }
    await telegramBotClient.sendDurationSelection(chatId);
  } catch (error) {
    console.error("[Bot] Text message error:", error);
    await telegramBotClient.sendErrorMessage(chatId, "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0435 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u044F.");
  }
}
async function handleImageMessage(chatId, userId, fileId) {
  try {
    const user = await getTelegramUser(userId.toString());
    if (!user) {
      await telegramBotClient.sendErrorMessage(chatId, "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D. \u0418\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0439\u0442\u0435 /start");
      return;
    }
    const imageUrl = await telegramBotClient.getFile(fileId);
    await telegramBotClient.sendMessage(chatId, "\u{1F4DD} \u041D\u0430\u043F\u0438\u0448\u0438\u0442\u0435 \u043F\u0440\u043E\u043C\u043F\u0442 \u0434\u043B\u044F \u0432\u0438\u0434\u0435\u043E \u043D\u0430 \u043E\u0441\u043D\u043E\u0432\u0435 \u044D\u0442\u043E\u0433\u043E \u0438\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u044F:");
  } catch (error) {
    console.error("[Bot] Image message error:", error);
    await telegramBotClient.sendErrorMessage(chatId, "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0435 \u0438\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u044F.");
  }
}
async function handleVoiceMessage(chatId, userId, fileId) {
  try {
    const user = await getTelegramUser(userId.toString());
    if (!user) {
      await telegramBotClient.sendErrorMessage(chatId, "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D. \u0418\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0439\u0442\u0435 /start");
      return;
    }
    const voiceUrl = await telegramBotClient.getFile(fileId);
    await telegramBotClient.sendDurationSelection(chatId);
  } catch (error) {
    console.error("[Bot] Voice message error:", error);
    await telegramBotClient.sendErrorMessage(chatId, "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0435 \u0433\u043E\u043B\u043E\u0441\u0430.");
  }
}
async function handleCallbackQuery(callbackQueryId, chatId, userId, data) {
  try {
    const user = await getTelegramUser(userId.toString());
    if (!user) {
      await telegramBotClient.answerCallbackQuery(callbackQueryId, "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D", true);
      return;
    }
    if (data.startsWith("buy_")) {
      const amount = parseInt(data.replace("buy_", ""));
      const pkg = PAYMENT_PACKAGES.find((p) => p.rubles === amount);
      if (!pkg) {
        await telegramBotClient.answerCallbackQuery(callbackQueryId, "\u041F\u0430\u043A\u0435\u0442 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D", true);
        return;
      }
      try {
        const payment = await yandexKassaClient.createPayment({
          amount: pkg.rubles,
          tokens: pkg.tokens,
          telegramId: userId.toString(),
          description: `\u041F\u043E\u043A\u0443\u043F\u043A\u0430 ${pkg.tokens} \u0442\u043E\u043A\u0435\u043D\u043E\u0432`,
          returnUrl: `https://t.me/your_bot_username`
          // Replace with actual bot username
        });
        await telegramBotClient.sendPaymentLink(chatId, payment.confirmation.confirmationUrl, pkg.tokens);
        await telegramBotClient.answerCallbackQuery(callbackQueryId, "\u0421\u0441\u044B\u043B\u043A\u0430 \u043D\u0430 \u043E\u043F\u043B\u0430\u0442\u0443 \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0430");
      } catch (error) {
        console.error("[Bot] Payment creation error:", error);
        await telegramBotClient.answerCallbackQuery(callbackQueryId, "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u0438 \u043F\u043B\u0430\u0442\u0435\u0436\u0430", true);
      }
    }
    if (data.startsWith("duration_")) {
      const duration = data.replace("duration_", "");
      await telegramBotClient.sendQualitySelection(chatId);
      await telegramBotClient.answerCallbackQuery(callbackQueryId, `\u0412\u044B\u0431\u0440\u0430\u043D\u0430 \u0434\u043B\u0438\u0442\u0435\u043B\u044C\u043D\u043E\u0441\u0442\u044C: ${duration} \u0441\u0435\u043A`);
    }
    if (data.startsWith("quality_")) {
      const quality = data.replace("quality_", "");
      await telegramBotClient.sendProcessingMessage(chatId);
      await telegramBotClient.answerCallbackQuery(callbackQueryId, `\u0412\u044B\u0431\u0440\u0430\u043D\u043E \u043A\u0430\u0447\u0435\u0441\u0442\u0432\u043E: ${quality}`);
    }
    if (data === "remove_watermark") {
      const newBalance = user.tokenBalance - TOKEN_PRICING.WATERMARK_REMOVAL;
      if (newBalance < 0) {
        await telegramBotClient.sendInsufficientBalanceMessage(chatId, TOKEN_PRICING.WATERMARK_REMOVAL, user.tokenBalance);
        return;
      }
      await updateTelegramUserBalance(userId.toString(), newBalance);
      await telegramBotClient.answerCallbackQuery(callbackQueryId, "\u0423\u0434\u0430\u043B\u0435\u043D\u0438\u0435 \u0432\u043E\u0434\u044F\u043D\u043E\u0433\u043E \u0437\u043D\u0430\u043A\u0430...");
    }
    if (data === "keep_watermark") {
      await telegramBotClient.answerCallbackQuery(callbackQueryId, "\u0412\u0438\u0434\u0435\u043E \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u043E \u0441 \u0432\u043E\u0434\u044F\u043D\u044B\u043C \u0437\u043D\u0430\u043A\u043E\u043C");
    }
  } catch (error) {
    console.error("[Bot] Callback query error:", error);
    await telegramBotClient.answerCallbackQuery(callbackQueryId, "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0435 \u0437\u0430\u043F\u0440\u043E\u0441\u0430", true);
  }
}

// server/routes/telegramWebhook.ts
var router = express.Router();
router.post("/webhook", async (req, res) => {
  try {
    const update = req.body;
    if (update.message) {
      const message = update.message;
      const chatId = message.chat.id;
      const userId = message.from.id;
      const firstName = message.from.first_name;
      const username = message.from.username;
      const lastName = message.from.last_name;
      if (message.text === "/start") {
        await handleStartCommand(chatId, userId, firstName, username, lastName);
      } else if (message.text === "/balance") {
        await handleBalanceCommand(chatId, userId);
      } else if (message.text === "/buy") {
        await handleBuyCommand(chatId, userId);
      } else if (message.text === "/help") {
        await handleHelpCommand(chatId);
      } else if (message.text && !message.text.startsWith("/")) {
        await handleTextMessage(chatId, userId, message.text);
      } else if (message.photo) {
        const largestPhoto = message.photo[message.photo.length - 1];
        await handleImageMessage(chatId, userId, largestPhoto.file_id);
      } else if (message.voice) {
        await handleVoiceMessage(chatId, userId, message.voice.file_id);
      }
    }
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
router.post("/payment-webhook", async (req, res) => {
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
      const user = await getTelegramUser(telegramId);
      if (user) {
        const newBalance = user.tokenBalance + tokens;
        console.log(`[Payment] User ${telegramId} received ${tokens} tokens. New balance: ${newBalance}`);
      }
    }
    res.json({ ok: true });
  } catch (error) {
    console.error("[Payment Webhook] Error:", error);
    res.status(500).json({ ok: false, error: "Internal server error" });
  }
});
var telegramWebhook_default = router;

// server/index-simple.ts
async function startServer() {
  const app = express2();
  const server = createServer(app);
  app.use(express2.json({ limit: "50mb" }));
  app.use(express2.urlencoded({ limit: "50mb", extended: true }));
  app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  });
  app.use("/api/telegram", telegramWebhook_default);
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
