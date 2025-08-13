import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from "@shared/database";
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Extract file path from DATABASE_URL
const dbPath = process.env.DATABASE_URL.replace('file:', '');

// Ensure directory exists
const dbDir = dirname(dbPath);
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true });
}

// Create SQLite connection
const sqlite = new Database(dbPath);

// Enable WAL mode for better concurrent access
sqlite.pragma('journal_mode = WAL');

export const db = drizzle(sqlite, { schema });

// Initialize database with schema
export async function initializeDatabase() {
  try {
    // Create tables if they don't exist using raw SQL
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS "auth_sessions" (
        "sid" varchar PRIMARY KEY NOT NULL,
        "sess" text NOT NULL,
        "expire" integer NOT NULL
      );
      
      CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "auth_sessions" ("expire");
      
      CREATE TABLE IF NOT EXISTS "users" (
        "id" varchar PRIMARY KEY NOT NULL,
        "email" varchar UNIQUE,
        "first_name" varchar,
        "last_name" varchar,
        "profile_image_url" varchar,
        "stripe_customer_id" varchar,
        "stripe_subscription_id" varchar,
        "subscription_status" varchar DEFAULT 'inactive',
        "subscription_ends_at" integer,
        "created_at" integer DEFAULT (strftime('%s', 'now')),
        "updated_at" integer DEFAULT (strftime('%s', 'now'))
      );
      
      CREATE TABLE IF NOT EXISTS "betting_sessions" (
        "id" integer PRIMARY KEY AUTOINCREMENT,
        "user_id" varchar REFERENCES "users"("id"),
        "name" text NOT NULL,
        "initial_bankroll" real NOT NULL,
        "current_bankroll" real NOT NULL,
        "target_return" real NOT NULL,
        "strategy" text NOT NULL,
        "bet_count" integer DEFAULT 0 NOT NULL,
        "wins" integer DEFAULT 0 NOT NULL,
        "losses" integer DEFAULT 0 NOT NULL,
        "created_at" integer DEFAULT (strftime('%s', 'now')) NOT NULL,
        "updated_at" integer DEFAULT (strftime('%s', 'now')) NOT NULL,
        "strategy_settings" text NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS "bets" (
        "id" integer PRIMARY KEY AUTOINCREMENT,
        "session_id" integer REFERENCES "betting_sessions"("id"),
        "bet_number" integer NOT NULL,
        "stake" real NOT NULL,
        "odds" real NOT NULL,
        "potential_win" real NOT NULL,
        "win" integer NOT NULL,
        "bankroll_before" real NOT NULL,
        "bankroll_after" real NOT NULL,
        "created_at" integer DEFAULT (strftime('%s', 'now')) NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS "beat_delay_sessions" (
        "id" integer PRIMARY KEY AUTOINCREMENT,
        "user_id" varchar REFERENCES "users"("id"),
        "session_name" text NOT NULL,
        "created_at" integer DEFAULT (strftime('%s', 'now')) NOT NULL,
        "updated_at" integer DEFAULT (strftime('%s', 'now')) NOT NULL,
        "initial_bankroll" real NOT NULL,
        "base_stake" real NOT NULL,
        "target_return" real NOT NULL,
        "stop_loss" integer NOT NULL,
        "final_bankroll" real NOT NULL,
        "total_bets" integer DEFAULT 0 NOT NULL,
        "total_wins" integer DEFAULT 0 NOT NULL,
        "total_losses" integer DEFAULT 0 NOT NULL,
        "profit_loss" real DEFAULT 0 NOT NULL,
        "win_rate" real DEFAULT 0 NOT NULL,
        "roi" real DEFAULT 0 NOT NULL,
        "notes" text,
        "status" varchar DEFAULT 'active' NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS "beat_delay_bets" (
        "id" integer PRIMARY KEY AUTOINCREMENT,
        "session_id" integer REFERENCES "beat_delay_sessions"("id"),
        "bet_number" integer NOT NULL,
        "stake" real NOT NULL,
        "odds" real NOT NULL,
        "potential_win" real NOT NULL,
        "win" integer NOT NULL,
        "bankroll_before" real NOT NULL,
        "bankroll_after" real NOT NULL,
        "current_sign" varchar NOT NULL,
        "current_delay" integer NOT NULL,
        "historical_frequency" real NOT NULL,
        "avg_delay" real NOT NULL,
        "max_delay" real NOT NULL,
        "capture_rate" real NOT NULL,
        "estimated_probability" real NOT NULL,
        "expected_value" real NOT NULL,
        "should_play" integer NOT NULL,
        "anomaly_index" real NOT NULL,
        "recovery_rate" real NOT NULL,
        "ml_probability" real DEFAULT 0 NOT NULL,
        "ml_confidence" real DEFAULT 0 NOT NULL,
        "combined_probability" real DEFAULT 0 NOT NULL,
        "combined_ev" real DEFAULT 0 NOT NULL,
        "created_at" integer DEFAULT (strftime('%s', 'now')) NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS "trial_users" (
        "id" varchar PRIMARY KEY NOT NULL,
        "device_info" text,
        "trial_start" integer DEFAULT (strftime('%s', 'now')) NOT NULL,
        "trial_end" integer NOT NULL,
        "created_at" integer DEFAULT (strftime('%s', 'now')) NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS "invite_codes" (
        "code" varchar PRIMARY KEY NOT NULL,
        "type" varchar NOT NULL,
        "created_at" integer DEFAULT (strftime('%s', 'now')) NOT NULL,
        "used_at" integer,
        "used_by" varchar
      );
    `);
    
    console.log('✅ Database initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
}
