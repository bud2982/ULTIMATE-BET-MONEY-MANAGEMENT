import { sqliteTable, text, integer, real, index } from "drizzle-orm/sqlite-core";

// Session storage table for Replit Auth
export const authSessions = sqliteTable(
  "auth_sessions",
  {
    sid: text("sid").primaryKey(),
    sess: text("sess").notNull(),
    expire: integer("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = sqliteTable("users", {
  id: text("id").primaryKey().notNull(),
  email: text("email").unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImageUrl: text("profile_image_url"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  subscriptionStatus: text("subscription_status").default("inactive"),
  subscriptionEndsAt: integer("subscription_ends_at"),
  createdAt: integer("created_at").default(Date.now()),
  updatedAt: integer("updated_at").default(Date.now()),
});

// Betting session schema
export const sessions = sqliteTable("betting_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").references(() => users.id),
  name: text("name").notNull(),
  initialBankroll: real("initial_bankroll").notNull(),
  currentBankroll: real("current_bankroll").notNull(),
  targetReturn: real("target_return").notNull(),
  strategy: text("strategy").notNull(),
  betCount: integer("bet_count").notNull().default(0),
  wins: integer("wins").notNull().default(0),
  losses: integer("losses").notNull().default(0),
  createdAt: integer("created_at").notNull().default(Date.now()),
  updatedAt: integer("updated_at").notNull().default(Date.now()),
  strategySettings: text("strategy_settings").notNull(),
});

// Bet schema
export const bets = sqliteTable("bets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionId: integer("session_id").references(() => sessions.id),
  betNumber: integer("bet_number").notNull(),
  stake: real("stake").notNull(),
  odds: real("odds").notNull(),
  potentialWin: real("potential_win").notNull(),
  win: integer("win").notNull(), // SQLite uses integer for boolean
  bankrollBefore: real("bankroll_before").notNull(),
  bankrollAfter: real("bankroll_after").notNull(),
  createdAt: integer("created_at").notNull().default(Date.now()),
});

// Beat the Delay sessions table
export const beatDelaySessionsTable = sqliteTable("beat_delay_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").references(() => users.id),
  sessionName: text("session_name").notNull(),
  createdAt: integer("created_at").notNull().default(Date.now()),
  updatedAt: integer("updated_at").notNull().default(Date.now()),
  
  // Configurazione iniziale
  initialBankroll: real("initial_bankroll").notNull(),
  baseStake: real("base_stake").notNull(),
  targetReturn: real("target_return").notNull(),
  stopLoss: integer("stop_loss").notNull(),
  
  // Risultati finali
  finalBankroll: real("final_bankroll").notNull(),
  totalBets: integer("total_bets").notNull().default(0),
  totalWins: integer("total_wins").notNull().default(0),
  totalLosses: integer("total_losses").notNull().default(0),
  profitLoss: real("profit_loss").notNull().default(0),
  winRate: real("win_rate").notNull().default(0),
  roi: real("roi").notNull().default(0),
  
  // Note personali
  notes: text("notes"),
  
  // Status della sessione
  status: text("status").notNull().default("active"), // active, completed, archived
});

// Beat the Delay bets table
export const beatDelayBetsTable = sqliteTable("beat_delay_bets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionId: integer("session_id").references(() => beatDelaySessionsTable.id),
  betNumber: integer("bet_number").notNull(),
  
  // Dati della scommessa
  stake: real("stake").notNull(),
  odds: real("odds").notNull(),
  potentialWin: real("potential_win").notNull(),
  win: integer("win").notNull(), // SQLite uses integer for boolean
  
  // Bankroll tracking
  bankrollBefore: real("bankroll_before").notNull(),
  bankrollAfter: real("bankroll_after").notNull(),
  
  // Dati Beat the Delay specifici
  currentSign: text("current_sign").notNull(), // '1', 'X', '2'
  currentDelay: integer("current_delay").notNull(),
  historicalFrequency: real("historical_frequency").notNull(),
  avgDelay: real("avg_delay").notNull(),
  maxDelay: real("max_delay").notNull(),
  captureRate: real("capture_rate").notNull(),
  
  // Calcoli Beat the Delay
  estimatedProbability: real("estimated_probability").notNull(),
  expectedValue: real("expected_value").notNull(),
  shouldPlay: integer("should_play").notNull(), // SQLite uses integer for boolean
  anomalyIndex: real("anomaly_index").notNull(),
  recoveryRate: real("recovery_rate").notNull(),
  
  // ML Prediction data
  mlProbability: real("ml_probability").notNull().default(0),
  mlConfidence: real("ml_confidence").notNull().default(0),
  combinedProbability: real("combined_probability").notNull().default(0),
  combinedEV: real("combined_ev").notNull().default(0),
  
  createdAt: integer("created_at").notNull().default(Date.now()),
});

// Trial users table to persist trial data
export const trialUsers = sqliteTable("trial_users", {
  id: text("id").primaryKey().notNull(),
  deviceInfo: text("device_info"),
  trialStart: integer("trial_start").notNull().default(Date.now()),
  trialEnd: integer("trial_end").notNull(),
  createdAt: integer("created_at").notNull().default(Date.now()),
});

// Invite codes table to persist invite codes
export const inviteCodes = sqliteTable("invite_codes", {
  code: text("code").primaryKey().notNull(),
  type: text("type").notNull(),
  createdAt: integer("created_at").notNull().default(Date.now()),
  usedAt: integer("used_at"),
  usedBy: text("used_by"),
});
