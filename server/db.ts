import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, telegramUsers, TelegramUser, InsertTelegramUser, tokenTransactions, InsertTokenTransaction, videoGenerations, InsertVideoGeneration, paymentTransactions, InsertPaymentTransaction, notionSyncStatus, InsertNotionSyncStatus } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
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

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============ TELEGRAM USER FUNCTIONS ============

export async function getTelegramUser(telegramId: string): Promise<TelegramUser | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(telegramUsers).where(eq(telegramUsers.telegramId, telegramId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createTelegramUser(data: InsertTelegramUser): Promise<TelegramUser> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(telegramUsers).values(data);
  const user = await getTelegramUser(data.telegramId!);
  if (!user) throw new Error("Failed to create user");
  return user;
}

export async function updateTelegramUserBalance(telegramId: string, newBalance: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(telegramUsers).set({ tokenBalance: newBalance }).where(eq(telegramUsers.telegramId, telegramId));
}

export async function addTokensToUser(telegramId: string, amount: number): Promise<TelegramUser> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const user = await getTelegramUser(telegramId);
  if (!user) throw new Error("User not found");

  const newBalance = user.tokenBalance + amount;
  await updateTelegramUserBalance(telegramId, newBalance);

  const updatedUser = await getTelegramUser(telegramId);
  if (!updatedUser) throw new Error("Failed to update user");
  return updatedUser;
}

export async function deductTokensFromUser(telegramId: string, amount: number): Promise<TelegramUser> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const user = await getTelegramUser(telegramId);
  if (!user) throw new Error("User not found");
  if (user.tokenBalance < amount) throw new Error("Insufficient tokens");

  const newBalance = user.tokenBalance - amount;
  await updateTelegramUserBalance(telegramId, newBalance);

  const updatedUser = await getTelegramUser(telegramId);
  if (!updatedUser) throw new Error("Failed to update user");
  return updatedUser;
}

// ============ TOKEN TRANSACTION FUNCTIONS ============

export async function createTokenTransaction(data: InsertTokenTransaction): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(tokenTransactions).values(data);
}

export async function getUserTokenTransactions(telegramId: string, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select().from(tokenTransactions).where(eq(tokenTransactions.telegramId, telegramId)).limit(limit);
  return result;
}

// ============ VIDEO GENERATION FUNCTIONS ============

export async function createVideoGeneration(data: InsertVideoGeneration) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(videoGenerations).values(data);
  return result;
}

export async function getVideoGeneration(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(videoGenerations).where(eq(videoGenerations.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateVideoGenerationStatus(id: number, status: string, outputVideoUrl?: string, errorMessage?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: any = { status };
  if (outputVideoUrl) updateData.outputVideoUrl = outputVideoUrl;
  if (errorMessage) updateData.errorMessage = errorMessage;
  if (status === "completed") updateData.completedAt = new Date();

  await db.update(videoGenerations).set(updateData).where(eq(videoGenerations.id, id));
}

export async function getUserVideoGenerations(telegramId: string, limit: number = 20) {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select().from(videoGenerations).where(eq(videoGenerations.telegramId, telegramId)).limit(limit);
  return result;
}

// ============ PAYMENT TRANSACTION FUNCTIONS ============

export async function createPaymentTransaction(data: InsertPaymentTransaction) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(paymentTransactions).values(data);
}

export async function getPaymentTransaction(paymentId: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(paymentTransactions).where(eq(paymentTransactions.paymentId, paymentId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updatePaymentTransaction(paymentId: string, status: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: any = { status };
  if (status === "succeeded") updateData.completedAt = new Date();

  await db.update(paymentTransactions).set(updateData).where(eq(paymentTransactions.paymentId, paymentId));
}

export async function getUserPaymentTransactions(telegramId: string, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select().from(paymentTransactions).where(eq(paymentTransactions.telegramId, telegramId)).limit(limit);
  return result;
}

// ============ NOTION SYNC FUNCTIONS ============

export async function createNotionSyncStatus(data: InsertNotionSyncStatus) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(notionSyncStatus).values(data);
}

export async function updateNotionSyncStatus(id: number, synced: boolean, notionPageId?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: any = { synced, syncedAt: new Date() };
  if (notionPageId) updateData.notionPageId = notionPageId;

  await db.update(notionSyncStatus).set(updateData).where(eq(notionSyncStatus.id, id));
}

export async function getUnsyncedRecords(entityType: string, limit: number = 100) {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select().from(notionSyncStatus).where(and(eq(notionSyncStatus.entityType, entityType as any), eq(notionSyncStatus.synced, false))).limit(limit);
  return result;
}
