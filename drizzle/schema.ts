import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, decimal } from "drizzle-orm/mysql-core";

/**
 * Core user table for Manus OAuth
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Telegram users table - stores Telegram user data
 */
export const telegramUsers = mysqlTable("telegram_users", {
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
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TelegramUser = typeof telegramUsers.$inferSelect;
export type InsertTelegramUser = typeof telegramUsers.$inferInsert;

/**
 * Token transactions table - tracks all token movements
 */
export const tokenTransactions = mysqlTable("token_transactions", {
  id: int("id").autoincrement().primaryKey(),
  telegramId: varchar("telegramId", { length: 64 }).notNull(),
  type: mysqlEnum("type", ["purchase", "generation", "removal", "refund", "bonus"]).notNull(),
  amount: int("amount").notNull(),
  balanceBefore: int("balanceBefore").notNull(),
  balanceAfter: int("balanceAfter").notNull(),
  description: text("description"),
  relatedTransactionId: int("relatedTransactionId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TokenTransaction = typeof tokenTransactions.$inferSelect;
export type InsertTokenTransaction = typeof tokenTransactions.$inferInsert;

/**
 * Video generation history table
 */
export const videoGenerations = mysqlTable("video_generations", {
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
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VideoGeneration = typeof videoGenerations.$inferSelect;
export type InsertVideoGeneration = typeof videoGenerations.$inferInsert;

/**
 * Payment transactions table - Yandex.Kassa payments
 */
export const paymentTransactions = mysqlTable("payment_transactions", {
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
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PaymentTransaction = typeof paymentTransactions.$inferSelect;
export type InsertPaymentTransaction = typeof paymentTransactions.$inferInsert;

/**
 * Notion sync status table - tracks which records have been synced to Notion
 */
export const notionSyncStatus = mysqlTable("notion_sync_status", {
  id: int("id").autoincrement().primaryKey(),
  entityType: mysqlEnum("entityType", ["user", "transaction", "generation", "payment"]).notNull(),
  entityId: varchar("entityId", { length: 255 }).notNull(),
  telegramId: varchar("telegramId", { length: 64 }).notNull(),
  notionPageId: varchar("notionPageId", { length: 255 }),
  synced: boolean("synced").default(false).notNull(),
  syncedAt: timestamp("syncedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NotionSyncStatus = typeof notionSyncStatus.$inferSelect;
export type InsertNotionSyncStatus = typeof notionSyncStatus.$inferInsert;
