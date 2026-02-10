import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
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
 * User journal entries table - stores gratitude and philosophy journal entries
 */
export const journalEntries = mysqlTable("journal_entries", {
  id: int("id").autoincrement().primaryKey(),
  /** Reference to the user who created this entry */
  userId: int("userId").notNull(),
  /** Local ID from AsyncStorage for sync purposes */
  localId: varchar("localId", { length: 64 }),
  /** Journal entry topic/title */
  topic: varchar("topic", { length: 500 }).notNull(),
  /** Journal entry content */
  content: text("content").notNull(),
  /** Source of the entry: gratitude, philosophy, or free */
  source: mysqlEnum("source", ["gratitude", "philosophy", "free"]).default("gratitude").notNull(),
  /** Masters' summaries as JSON array */
  mastersSummary: json("mastersSummary"),
  /** Formless reflection content */
  formlessReflection: text("formlessReflection"),
  /** Language of the entry */
  language: varchar("language", { length: 10 }).default("zh"),
  /** Whether the entry is deleted (soft delete) */
  isDeleted: boolean("isDeleted").default(false).notNull(),
  /** Timestamp when the entry was created locally */
  localCreatedAt: timestamp("localCreatedAt"),
  /** Timestamp when the entry was last updated locally */
  localUpdatedAt: timestamp("localUpdatedAt"),
  /** Server timestamps */
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type JournalEntry = typeof journalEntries.$inferSelect;
export type InsertJournalEntry = typeof journalEntries.$inferInsert;

/**
 * User statistics table - stores aggregated user statistics
 */
export const userStats = mysqlTable("user_stats", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  /** Total number of journal entries */
  totalEntries: int("totalEntries").default(0).notNull(),
  /** Current streak (consecutive days) */
  currentStreak: int("currentStreak").default(0).notNull(),
  /** Longest streak ever achieved */
  longestStreak: int("longestStreak").default(0).notNull(),
  /** Last entry date for streak calculation */
  lastEntryDate: varchar("lastEntryDate", { length: 10 }),
  /** Achievements as JSON array */
  achievements: json("achievements"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserStats = typeof userStats.$inferSelect;
export type InsertUserStats = typeof userStats.$inferInsert;

/**
 * Email verification table - stores verification codes for email login
 */
export const emailVerifications = mysqlTable("email_verifications", {
  id: int("id").autoincrement().primaryKey(),
  /** Email address to verify */
  email: varchar("email", { length: 320 }).notNull(),
  /** 6-digit verification code */
  code: varchar("code", { length: 6 }).notNull(),
  /** Whether the code has been used */
  isUsed: boolean("isUsed").default(false).notNull(),
  /** Expiration time (10 minutes from creation) */
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EmailVerification = typeof emailVerifications.$inferSelect;
export type InsertEmailVerification = typeof emailVerifications.$inferInsert;
