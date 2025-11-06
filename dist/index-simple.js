// server/index-simple.ts
import "dotenv/config";
import express2 from "express";
import { createServer } from "http";

// server/routes/telegramWebhookImproved.ts
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

// server/routes/telegramWebhookImproved.ts
var router = express.Router();
router.post("/webhook", async (req, res) => {
  try {
    const update = req.body;
    console.log("[Telegram Webhook] Received update:", {
      update_id: update.update_id,
      has_message: !!update.message,
      message_text: update.message?.text
    });
    if (update.message) {
      const message = update.message;
      const chatId = message.chat.id;
      const userId = message.from.id;
      const firstName = message.from.first_name;
      const username = message.from.username;
      const lastName = message.from.last_name;
      try {
        if (message.text === "/start") {
          const telegramId = userId.toString();
          let user = await getTelegramUser(telegramId);
          if (!user) {
            try {
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
              console.log(`[Telegram] New user created: ${telegramId}`);
            } catch (createError) {
              console.error("[Telegram] Failed to create user:", createError);
            }
          } else {
            console.log(`[Telegram] Returning user: ${telegramId}, balance: ${user.tokenBalance}`);
          }
        } else if (message.text === "/balance") {
          const user = await getTelegramUser(userId.toString());
          if (user) {
            console.log(`[Telegram] Balance check: user ${userId}, balance: ${user.tokenBalance}`);
          } else {
            console.log(`[Telegram] User not found: ${userId}`);
          }
        } else if (message.text?.startsWith("/")) {
          console.log(`[Telegram] Command: ${message.text} from user ${userId}`);
        } else if (message.text) {
          console.log(`[Telegram] Message from user ${userId}: ${message.text.substring(0, 50)}`);
        }
      } catch (handlerError) {
        console.error("[Telegram Webhook] Handler error:", handlerError);
      }
    }
    if (update.callback_query) {
      console.log("[Telegram] Callback query from user:", update.callback_query.from.id);
    }
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
var telegramWebhookImproved_default = router;

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
  app.use("/api/telegram", telegramWebhookImproved_default);
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
