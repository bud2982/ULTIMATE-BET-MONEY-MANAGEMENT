import { pgTable, text, serial, integer, boolean, doublePrecision, timestamp, varchar, jsonb, index } from "drizzle-orm/pg-core";

// Session storage table for Replit Auth
export const authSessions = pgTable(
  "auth_sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  subscriptionStatus: varchar("subscription_status").default("inactive"),
  subscriptionEndsAt: timestamp("subscription_ends_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Betting session schema
export const sessions = pgTable("betting_sessions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  name: text("name").notNull(),
  initialBankroll: doublePrecision("initial_bankroll").notNull(),
  currentBankroll: doublePrecision("current_bankroll").notNull(),
  targetReturn: doublePrecision("target_return").notNull(),
  strategy: text("strategy").notNull(),
  betCount: integer("bet_count").notNull().default(0),
  wins: integer("wins").notNull().default(0),
  losses: integer("losses").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  strategySettings: text("strategy_settings").notNull(),
});

// Bet schema
export const bets = pgTable("bets", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => sessions.id),
  betNumber: integer("bet_number").notNull(),
  stake: doublePrecision("stake").notNull(),
  odds: doublePrecision("odds").notNull(),
  potentialWin: doublePrecision("potential_win").notNull(),
  win: boolean("win").notNull(),
  bankrollBefore: doublePrecision("bankroll_before").notNull(),
  bankrollAfter: doublePrecision("bankroll_after").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
