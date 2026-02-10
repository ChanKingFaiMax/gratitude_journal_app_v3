import { eq, and, desc, isNull, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, User, users, journalEntries, InsertJournalEntry, JournalEntry, userStats, InsertUserStats, UserStats, emailVerifications, InsertEmailVerification, EmailVerification } from "../drizzle/schema";
import { ENV } from "./_core/env";

// Database connection instance
let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
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
      values.role = "admin";
      updateSet.role = "admin";
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

// ============ Journal Entry Functions ============

/**
 * Get all journal entries for a user
 */
export async function getUserJournalEntries(userId: number): Promise<JournalEntry[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get journal entries: database not available");
    return [];
  }

  return db.select()
    .from(journalEntries)
    .where(and(
      eq(journalEntries.userId, userId),
      eq(journalEntries.isDeleted, false)
    ))
    .orderBy(desc(journalEntries.createdAt));
}

/**
 * Get a single journal entry by ID
 */
export async function getJournalEntryById(id: number, userId: number): Promise<JournalEntry | undefined> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get journal entry: database not available");
    return undefined;
  }

  const result = await db.select()
    .from(journalEntries)
    .where(and(
      eq(journalEntries.id, id),
      eq(journalEntries.userId, userId)
    ))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Create a new journal entry
 */
export async function createJournalEntry(data: InsertJournalEntry): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(journalEntries).values(data);
  return Number(result[0].insertId);
}

/**
 * Update a journal entry
 */
export async function updateJournalEntry(id: number, userId: number, data: Partial<InsertJournalEntry>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(journalEntries)
    .set(data)
    .where(and(
      eq(journalEntries.id, id),
      eq(journalEntries.userId, userId)
    ));
}

/**
 * Soft delete a journal entry
 */
export async function deleteJournalEntry(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(journalEntries)
    .set({ isDeleted: true })
    .where(and(
      eq(journalEntries.id, id),
      eq(journalEntries.userId, userId)
    ));
}

/**
 * Sync journal entries from local storage
 * Returns the synced entries with their server IDs
 */
export async function syncJournalEntries(
  userId: number,
  localEntries: Array<{
    localId: string;
    topic: string;
    content: string;
    source: 'gratitude' | 'philosophy' | 'free';
    mastersSummary?: unknown;
    formlessReflection?: string;
    language?: string;
    localCreatedAt?: Date;
    localUpdatedAt?: Date;
  }>
): Promise<JournalEntry[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const results: JournalEntry[] = [];

  for (const entry of localEntries) {
    // Check if entry already exists by localId
    const existing = await db.select()
      .from(journalEntries)
      .where(and(
        eq(journalEntries.userId, userId),
        eq(journalEntries.localId, entry.localId)
      ))
      .limit(1);

    if (existing.length > 0) {
      // Update existing entry if local is newer
      const existingEntry = existing[0];
      if (entry.localUpdatedAt && existingEntry.localUpdatedAt && 
          new Date(entry.localUpdatedAt) > new Date(existingEntry.localUpdatedAt)) {
        await db.update(journalEntries)
          .set({
            topic: entry.topic,
            content: entry.content,
            mastersSummary: entry.mastersSummary,
            formlessReflection: entry.formlessReflection,
            localUpdatedAt: entry.localUpdatedAt,
          })
          .where(eq(journalEntries.id, existingEntry.id));
      }
      results.push(existingEntry);
    } else {
      // Create new entry
      const insertResult = await db.insert(journalEntries).values({
        userId,
        localId: entry.localId,
        topic: entry.topic,
        content: entry.content,
        source: entry.source,
        mastersSummary: entry.mastersSummary,
        formlessReflection: entry.formlessReflection,
        language: entry.language || 'zh',
        localCreatedAt: entry.localCreatedAt,
        localUpdatedAt: entry.localUpdatedAt,
      });

      const newEntry = await db.select()
        .from(journalEntries)
        .where(eq(journalEntries.id, Number(insertResult[0].insertId)))
        .limit(1);

      if (newEntry.length > 0) {
        results.push(newEntry[0]);
      }
    }
  }

  return results;
}

// ============ User Stats Functions ============

/**
 * Get user statistics
 */
export async function getUserStats(userId: number): Promise<UserStats | undefined> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user stats: database not available");
    return undefined;
  }

  const result = await db.select()
    .from(userStats)
    .where(eq(userStats.userId, userId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Create or update user statistics
 */
export async function upsertUserStats(data: InsertUserStats): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(userStats)
    .values(data)
    .onDuplicateKeyUpdate({
      set: {
        totalEntries: data.totalEntries,
        currentStreak: data.currentStreak,
        longestStreak: data.longestStreak,
        lastEntryDate: data.lastEntryDate,
        achievements: data.achievements,
      },
    });
}

/**
 * Sync user stats from local storage
 */
export async function syncUserStats(
  userId: number,
  localStats: {
    totalEntries: number;
    currentStreak: number;
    longestStreak: number;
    lastEntryDate?: string;
    achievements?: unknown;
  }
): Promise<UserStats> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get existing stats
  const existing = await getUserStats(userId);

  if (existing) {
    // Merge stats - take the maximum values
    const mergedStats = {
      totalEntries: Math.max(existing.totalEntries, localStats.totalEntries),
      currentStreak: Math.max(existing.currentStreak, localStats.currentStreak),
      longestStreak: Math.max(existing.longestStreak, localStats.longestStreak),
      lastEntryDate: localStats.lastEntryDate || existing.lastEntryDate,
      achievements: localStats.achievements || existing.achievements,
    };

    await db.update(userStats)
      .set(mergedStats)
      .where(eq(userStats.userId, userId));

    return { ...existing, ...mergedStats };
  } else {
    // Create new stats
    await db.insert(userStats).values({
      userId,
      ...localStats,
    });

    const newStats = await getUserStats(userId);
    return newStats!;
  }
}

// ============ Email Verification Functions ============

/**
 * Create a new email verification code
 */
export async function createEmailVerification(email: string, code: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 minutes expiration

  await db.insert(emailVerifications).values({
    email,
    code,
    expiresAt,
  });
}

/**
 * Verify an email code
 * Returns true if code is valid and not expired
 */
export async function verifyEmailCode(email: string, code: string): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select()
    .from(emailVerifications)
    .where(and(
      eq(emailVerifications.email, email),
      eq(emailVerifications.code, code),
      eq(emailVerifications.isUsed, false)
    ))
    .orderBy(desc(emailVerifications.createdAt))
    .limit(1);

  if (result.length === 0) return false;

  const verification = result[0];
  
  // Check if expired
  if (new Date() > new Date(verification.expiresAt)) {
    return false;
  }

  // Mark as used
  await db.update(emailVerifications)
    .set({ isUsed: true })
    .where(eq(emailVerifications.id, verification.id));

  return true;
}

/**
 * Clean up expired verification codes (older than 1 hour)
 */
export async function cleanupExpiredVerifications(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const oneHourAgo = new Date();
  oneHourAgo.setHours(oneHourAgo.getHours() - 1);

  await db.delete(emailVerifications)
    .where(and(
      eq(emailVerifications.isUsed, true)
    ));
}

/**
 * Get or create user by email
 */
export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Create user with email
 */
export async function createUserWithEmail(email: string): Promise<User> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Generate a unique openId for email users
  const openId = `email_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  await db.insert(users).values({
    openId,
    email,
    loginMethod: 'email',
  });

  const user = await getUserByEmail(email);
  if (!user) throw new Error("Failed to create user");

  return user;
}
