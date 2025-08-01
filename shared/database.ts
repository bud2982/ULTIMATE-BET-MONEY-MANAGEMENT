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

// Beat the Delay sessions table
export const beatDelaySessionsTable = pgTable("beat_delay_sessions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  sessionName: text("session_name").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  
  // Configurazione iniziale
  initialBankroll: doublePrecision("initial_bankroll").notNull(),
  baseStake: doublePrecision("base_stake").notNull(),
  targetReturn: doublePrecision("target_return").notNull(),
  stopLoss: integer("stop_loss").notNull(),
  
  // Risultati finali
  finalBankroll: doublePrecision("final_bankroll").notNull(),
  totalBets: integer("total_bets").notNull().default(0),
  totalWins: integer("total_wins").notNull().default(0),
  totalLosses: integer("total_losses").notNull().default(0),
  profitLoss: doublePrecision("profit_loss").notNull().default(0),
  winRate: doublePrecision("win_rate").notNull().default(0),
  roi: doublePrecision("roi").notNull().default(0),
  
  // Note personali
  notes: text("notes"),
  
  // Status della sessione
  status: varchar("status").notNull().default("active"), // active, completed, archived
});

// Beat the Delay bets table
export const beatDelayBetsTable = pgTable("beat_delay_bets", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => beatDelaySessionsTable.id),
  betNumber: integer("bet_number").notNull(),
  
  // Dati della scommessa
  stake: doublePrecision("stake").notNull(),
  odds: doublePrecision("odds").notNull(),
  potentialWin: doublePrecision("potential_win").notNull(),
  win: boolean("win").notNull(),
  
  // Bankroll tracking
  bankrollBefore: doublePrecision("bankroll_before").notNull(),
  bankrollAfter: doublePrecision("bankroll_after").notNull(),
  
  // Dati Beat the Delay specifici
  currentSign: varchar("current_sign").notNull(), // '1', 'X', '2'
  currentDelay: integer("current_delay").notNull(),
  historicalFrequency: doublePrecision("historical_frequency").notNull(),
  avgDelay: doublePrecision("avg_delay").notNull(),
  maxDelay: doublePrecision("max_delay").notNull(),
  captureRate: doublePrecision("capture_rate").notNull(),
  
  // Calcoli Beat the Delay
  estimatedProbability: doublePrecision("estimated_probability").notNull(),
  expectedValue: doublePrecision("expected_value").notNull(),
  shouldPlay: boolean("should_play").notNull(),
  anomalyIndex: doublePrecision("anomaly_index").notNull(),
  recoveryRate: doublePrecision("recovery_rate").notNull(),
  
  // ML Prediction data
  mlProbability: doublePrecision("ml_probability").notNull().default(0),
  mlConfidence: doublePrecision("ml_confidence").notNull().default(0),
  combinedProbability: doublePrecision("combined_probability").notNull().default(0),
  combinedEV: doublePrecision("combined_ev").notNull().default(0),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
