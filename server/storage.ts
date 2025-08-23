import { 
  type User, 
  type UpsertUser, 
  type Session, 
  type InsertSession, 
  type Bet, 
  type InsertBet
} from "@shared/types";

import {
  type BeatDelaySession,
  type InsertBeatDelaySession,
  type BeatDelayBet,
  type InsertBeatDelayBet
} from "@shared/schema";

import { db } from "./db";
import { users, sessions, bets, beatDelaySessionsTable, beatDelayBetsTable, trialUsers as trialUsersTable, inviteCodes as inviteCodesTable } from "@shared/database";
import { eq, and, desc, gte } from "drizzle-orm";

// Extended types for better type safety
export interface ExtendedUser {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  subscriptionStatus?: string;
  subscriptionEndsAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IStorage {
  // User operations for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: ExtendedUser): Promise<User>;
  updateUserSubscription(id: string, subscription: Partial<User>): Promise<User>;

  // Session operations
  getAllSessions(strategy?: string): Promise<Session[]>;
  getSession(id: number): Promise<Session | undefined>;
  createSession(session: InsertSession): Promise<Session>;
  updateSession(id: number, updatedFields: Partial<Session>): Promise<Session | undefined>;
  deleteSession(id: number): Promise<boolean>;

  // Bet operations
  getBetsBySessionId(sessionId: number): Promise<Bet[]>;
  createBet(bet: InsertBet): Promise<Bet>;
  updateSessionAfterBet(sessionId: number, bet: Bet): Promise<Session>;
  deleteAllBetsForSession(sessionId: number): Promise<boolean>;

  // Beat the Delay operations
  getAllBeatDelaySessions(): Promise<BeatDelaySession[]>;
  getBeatDelaySession(id: number): Promise<BeatDelaySession | undefined>;
  createBeatDelaySession(session: InsertBeatDelaySession): Promise<BeatDelaySession>;
  updateBeatDelaySession(id: number, updates: Partial<BeatDelaySession>): Promise<BeatDelaySession | undefined>;
  deleteBeatDelaySession(id: number): Promise<boolean>;
  getBeatDelayBets(sessionId: number): Promise<BeatDelayBet[]>;
  addBeatDelayBet(sessionId: number, bet: InsertBeatDelayBet): Promise<{ session: BeatDelaySession; bet: BeatDelayBet }>;
}

// Database storage implementation using PostgreSQL
export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    try {
      const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
      return result[0] || undefined;
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }

  async upsertUser(userData: ExtendedUser): Promise<User> {
    try {
      // Convert Date objects to timestamps for SQLite
      const userForDB = {
        id: userData.id,
        email: userData.email || null,
        firstName: userData.firstName || null,
        lastName: userData.lastName || null,
        profileImageUrl: userData.profileImageUrl || null,
        stripeCustomerId: userData.stripeCustomerId || null,
        stripeSubscriptionId: userData.stripeSubscriptionId || null,
        subscriptionStatus: userData.subscriptionStatus || "inactive",
        subscriptionEndsAt: userData.subscriptionEndsAt ? Math.floor(userData.subscriptionEndsAt.getTime() / 1000) : null,
        createdAt: userData.createdAt ? Math.floor(userData.createdAt.getTime() / 1000) : Math.floor(Date.now() / 1000),
        updatedAt: Math.floor(Date.now() / 1000),
      };

      // SQLite compatible UPSERT using INSERT OR REPLACE
      try {
        await db.insert(users).values(userForDB);
      } catch (insertError) {
        // If insert fails due to unique constraint, update instead
        await db.update(users)
          .set({
            email: userForDB.email,
            firstName: userForDB.firstName,
            lastName: userForDB.lastName,
            profileImageUrl: userForDB.profileImageUrl,
            stripeCustomerId: userForDB.stripeCustomerId,
            stripeSubscriptionId: userForDB.stripeSubscriptionId,
            subscriptionStatus: userForDB.subscriptionStatus,
            subscriptionEndsAt: userForDB.subscriptionEndsAt,
            updatedAt: userForDB.updatedAt,
          })
          .where(eq(users.id, userData.id));
      }

      // Get the inserted/updated user (SQLite doesn't support RETURNING)
      const result = await db.select().from(users).where(eq(users.id, userData.id)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Error upserting user:', error);
      throw error;
    }
  }

  async updateUserSubscription(id: string, subscription: Partial<User>): Promise<User> {
    try {
      // Convert Date fields to timestamps for SQLite
      const updateData = {
        ...subscription,
        updatedAt: Math.floor(Date.now() / 1000)
      };

      await db.update(users)
        .set(updateData)
        .where(eq(users.id, id));

      // Get updated user (SQLite doesn't support RETURNING)
      const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
      
      if (!result[0]) {
        throw new Error('User not found');
      }

      return result[0];
    } catch (error) {
      console.error('Error updating user subscription:', error);
      throw error;
    }
  }

  // Session operations
  async getAllSessions(strategy?: string): Promise<Session[]> {
    try {
      let query = db.select().from(sessions).orderBy(desc(sessions.createdAt));
      
      if (strategy) {
        query = query.where(eq(sessions.strategy, strategy));
      }

      return await query;
    } catch (error) {
      console.error('Error getting all sessions:', error);
      return [];
    }
  }

  async getSession(id: number): Promise<Session | undefined> {
    try {
      const result = await db.select().from(sessions).where(eq(sessions.id, id)).limit(1);
      return result[0] || undefined;
    } catch (error) {
      console.error('Error getting session:', error);
      return undefined;
    }
  }

  async createSession(sessionData: InsertSession): Promise<Session> {
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const newSession = {
        userId: sessionData.userId || null,
        name: sessionData.name,
        initialBankroll: sessionData.initialBankroll,
        currentBankroll: sessionData.currentBankroll,
        targetReturn: sessionData.targetReturn,
        strategy: sessionData.strategy,
        betCount: sessionData.betCount || 0,
        wins: sessionData.wins || 0,
        losses: sessionData.losses || 0,
        strategySettings: sessionData.strategySettings,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      await db.insert(sessions).values(newSession);
      
      // Get the inserted session (SQLite doesn't support RETURNING)
      // Since SQLite auto-increments the ID, we need to get the last inserted row
      const result = await db.select().from(sessions)
        .orderBy(desc(sessions.id))
        .limit(1);
        
      console.log('✅ Session created successfully:', result[0]);
      return result[0];
    } catch (error) {
      console.error('❌ Error creating session:', error);
      throw error;
    }
  }

  async updateSession(id: number, updatedFields: Partial<Session>): Promise<Session | undefined> {
    try {
      // Convert Date fields to timestamps for SQLite
      const updateData = {
        ...updatedFields,
        updatedAt: Math.floor(Date.now() / 1000)
      };

      await db.update(sessions)
        .set(updateData)
        .where(eq(sessions.id, id));

      // Get updated session (SQLite doesn't support RETURNING)
      const result = await db.select().from(sessions).where(eq(sessions.id, id)).limit(1);
      console.log('✅ Session updated successfully:', result[0]);
      return result[0] || undefined;
    } catch (error) {
      console.error('❌ Error updating session:', error);
      return undefined;
    }
  }

  async deleteSession(id: number): Promise<boolean> {
    try {
      // First delete all bets for this session
      await db.delete(bets).where(eq(bets.sessionId, id));
      
      // Then delete the session
      const result = await db.delete(sessions).where(eq(sessions.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting session:', error);
      return false;
    }
  }

  // Bet operations
  async getBetsBySessionId(sessionId: number): Promise<Bet[]> {
    try {
      return await db.select().from(bets)
        .where(eq(bets.sessionId, sessionId))
        .orderBy(bets.betNumber);
    } catch (error) {
      console.error('Error getting bets by session ID:', error);
      return [];
    }
  }

  async createBet(betData: InsertBet): Promise<Bet> {
    try {
      const newBet = {
        sessionId: betData.sessionId || null,
        betNumber: betData.betNumber,
        stake: betData.stake,
        odds: betData.odds,
        potentialWin: betData.potentialWin,
        win: betData.win ? 1 : 0, // Convert boolean to integer for SQLite
        bankrollBefore: betData.bankrollBefore,
        bankrollAfter: betData.bankrollAfter,
        createdAt: Math.floor(Date.now() / 1000),
      };

      await db.insert(bets).values(newBet);
      
      // Get the inserted bet (SQLite doesn't support RETURNING)
      const result = await db.select().from(bets)
        .orderBy(desc(bets.id))
        .limit(1);
        
      console.log('✅ Bet created successfully:', result[0]);
      return result[0];
    } catch (error) {
      console.error('Error creating bet:', error);
      throw error;
    }
  }

  async updateSessionAfterBet(sessionId: number, bet: Bet): Promise<Session> {
    try {
      // Get current session
      const currentSession = await this.getSession(sessionId);
      if (!currentSession) {
        throw new Error('Session not found');
      }

      // Convert bet.win from integer back to boolean for logic
      const betWon = bet.win === 1 || bet.win === true;

      // Update session statistics
      const updatedSession = {
        currentBankroll: bet.bankrollAfter,
        betCount: currentSession.betCount + 1,
        wins: betWon ? currentSession.wins + 1 : currentSession.wins,
        losses: betWon ? currentSession.losses : currentSession.losses + 1,
        updatedAt: Math.floor(Date.now() / 1000),
      };

      await db.update(sessions)
        .set(updatedSession)
        .where(eq(sessions.id, sessionId));

      // Get updated session (SQLite doesn't support RETURNING)
      const result = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);
      console.log('✅ Session updated after bet:', result[0]);
      return result[0];
    } catch (error) {
      console.error('❌ Error updating session after bet:', error);
      throw error;
    }
  }

  async deleteAllBetsForSession(sessionId: number): Promise<boolean> {
    try {
      await db.delete(bets).where(eq(bets.sessionId, sessionId));
      return true;
    } catch (error) {
      console.error('Error deleting all bets for session:', error);
      return false;
    }
  }

  // Beat the Delay operations
  async getAllBeatDelaySessions(): Promise<BeatDelaySession[]> {
    try {
      return await db.select().from(beatDelaySessionsTable)
        .orderBy(desc(beatDelaySessionsTable.createdAt));
    } catch (error) {
      console.error('Error getting all Beat the Delay sessions:', error);
      return [];
    }
  }

  async getBeatDelaySession(id: number): Promise<BeatDelaySession | undefined> {
    try {
      const result = await db.select().from(beatDelaySessionsTable)
        .where(eq(beatDelaySessionsTable.id, id))
        .limit(1);
      return result[0] || undefined;
    } catch (error) {
      console.error('Error getting Beat the Delay session:', error);
      return undefined;
    }
  }

  async createBeatDelaySession(sessionData: InsertBeatDelaySession): Promise<BeatDelaySession> {
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const newSession = {
        userId: sessionData.userId || null,
        sessionName: sessionData.sessionName,
        initialBankroll: sessionData.initialBankroll,
        baseStake: sessionData.baseStake,
        targetReturn: sessionData.targetReturn,
        stopLoss: sessionData.stopLoss,
        finalBankroll: sessionData.finalBankroll,
        totalBets: sessionData.totalBets || 0,
        totalWins: sessionData.totalWins || 0,
        totalLosses: sessionData.totalLosses || 0,
        profitLoss: sessionData.profitLoss || 0,
        winRate: sessionData.winRate || 0,
        roi: sessionData.roi || 0,
        notes: sessionData.notes || null,
        status: sessionData.status || 'active',
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      await db.insert(beatDelaySessionsTable).values(newSession);
      
      // Get the inserted session (SQLite doesn't support RETURNING)
      const result = await db.select().from(beatDelaySessionsTable)
        .orderBy(desc(beatDelaySessionsTable.id))
        .limit(1);
        
      console.log('✅ Beat the Delay session created successfully:', result[0]);
      return result[0];
    } catch (error) {
      console.error('❌ Error creating Beat the Delay session:', error);
      throw error;
    }
  }

  async updateBeatDelaySession(id: number, updates: Partial<BeatDelaySession>): Promise<BeatDelaySession | undefined> {
    try {
      // Convert Date fields to timestamps for SQLite
      const updateData = {
        ...updates,
        updatedAt: Math.floor(Date.now() / 1000)
      };

      await db.update(beatDelaySessionsTable)
        .set(updateData)
        .where(eq(beatDelaySessionsTable.id, id));

      // Get updated session (SQLite doesn't support RETURNING)
      const result = await db.select().from(beatDelaySessionsTable).where(eq(beatDelaySessionsTable.id, id)).limit(1);
      console.log('✅ Beat the Delay session updated successfully:', result[0]);
      return result[0] || undefined;
    } catch (error) {
      console.error('❌ Error updating Beat the Delay session:', error);
      return undefined;
    }
  }

  async deleteBeatDelaySession(id: number): Promise<boolean> {
    try {
      // First delete all bets for this session
      await db.delete(beatDelayBetsTable).where(eq(beatDelayBetsTable.sessionId, id));
      
      // Then delete the session
      await db.delete(beatDelaySessionsTable).where(eq(beatDelaySessionsTable.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting Beat the Delay session:', error);
      return false;
    }
  }

  async getBeatDelayBets(sessionId: number): Promise<BeatDelayBet[]> {
    try {
      return await db.select().from(beatDelayBetsTable)
        .where(eq(beatDelayBetsTable.sessionId, sessionId))
        .orderBy(beatDelayBetsTable.betNumber);
    } catch (error) {
      console.error('Error getting Beat the Delay bets:', error);
      return [];
    }
  }

  async addBeatDelayBet(sessionId: number, betData: InsertBeatDelayBet): Promise<{ session: BeatDelaySession; bet: BeatDelayBet }> {
    try {
      // Get current session
      const session = await this.getBeatDelaySession(sessionId);
      if (!session) {
        throw new Error('Beat the Delay session not found');
      }

      // Create the bet with SQLite compatible types
      const newBet = {
        sessionId: sessionId,
        betNumber: betData.betNumber,
        stake: betData.stake,
        odds: betData.odds,
        potentialWin: betData.potentialWin,
        win: betData.win ? 1 : 0, // Convert boolean to integer for SQLite
        bankrollBefore: betData.bankrollBefore,
        bankrollAfter: betData.bankrollAfter,
        currentSign: betData.currentSign,
        currentDelay: betData.currentDelay,
        historicalFrequency: betData.historicalFrequency,
        avgDelay: betData.avgDelay,
        maxDelay: betData.maxDelay,
        captureRate: betData.captureRate,
        estimatedProbability: betData.estimatedProbability,
        expectedValue: betData.expectedValue,
        shouldPlay: betData.shouldPlay ? 1 : 0, // Convert boolean to integer for SQLite
        anomalyIndex: betData.anomalyIndex,
        recoveryRate: betData.recoveryRate,
        mlProbability: betData.mlProbability || 0,
        mlConfidence: betData.mlConfidence || 0,
        combinedProbability: betData.combinedProbability || 0,
        combinedEV: betData.combinedEV || 0,
        createdAt: Math.floor(Date.now() / 1000),
      };

      await db.insert(beatDelayBetsTable).values(newBet);
      
      // Get the inserted bet (SQLite doesn't support RETURNING)
      const betResult = await db.select().from(beatDelayBetsTable)
        .orderBy(desc(beatDelayBetsTable.id))
        .limit(1);
      const bet = betResult[0];

      // Update session statistics - convert bet.win back to boolean for logic
      const betWon = bet.win === 1 || bet.win === true;
      const profitLoss = betWon ? (bet.potentialWin - bet.stake) : -bet.stake;
      const updatedSession = {
        finalBankroll: bet.bankrollAfter,
        totalBets: session.totalBets + 1,
        totalWins: betWon ? session.totalWins + 1 : session.totalWins,
        totalLosses: betWon ? session.totalLosses : session.totalLosses + 1,
        profitLoss: session.profitLoss + profitLoss,
        winRate: ((betWon ? session.totalWins + 1 : session.totalWins) / (session.totalBets + 1)) * 100,
        roi: ((session.profitLoss + profitLoss) / session.initialBankroll) * 100,
        updatedAt: Math.floor(Date.now() / 1000)
      };

      await db.update(beatDelaySessionsTable)
        .set(updatedSession)
        .where(eq(beatDelaySessionsTable.id, sessionId));

      // Get updated session (SQLite doesn't support RETURNING)
      const sessionResult = await db.select().from(beatDelaySessionsTable)
        .where(eq(beatDelaySessionsTable.id, sessionId))
        .limit(1);

      console.log('✅ Beat the Delay bet added successfully');
      return { session: sessionResult[0], bet };
    } catch (error) {
      console.error('❌ Error adding Beat the Delay bet:', error);
      throw error;
    }
  }

  // Trial Users operations
  async getTrialUser(id: string): Promise<{ id: string; deviceInfo?: string; trialStart: number; trialEnd: number; } | undefined> {
    try {
      const result = await db.select().from(trialUsersTable).where(eq(trialUsersTable.id, id)).limit(1);
      const user = result[0];
      
      if (!user) return undefined;
      
      return {
        id: user.id,
        deviceInfo: user.deviceInfo || undefined,
        trialStart: user.trialStart,
        trialEnd: user.trialEnd
      };
    } catch (error) {
      console.error('Error getting trial user:', error);
      return undefined;
    }
  }

  async createTrialUser(userId: string, deviceInfo: string, trialDurationMs: number): Promise<{ id: string; deviceInfo?: string; trialStart: number; trialEnd: number; }> {
    try {
      const now = Math.floor(Date.now() / 1000); // Convert to seconds for SQLite
      const trialEnd = now + Math.floor(trialDurationMs / 1000);
      
      const trialUser = {
        id: userId,
        deviceInfo: deviceInfo,
        trialStart: now,
        trialEnd: trialEnd,
        createdAt: now
      };

      await db.insert(trialUsersTable).values(trialUser);
      
      // Get the inserted user (SQLite doesn't support RETURNING)
      const result = await db.select().from(trialUsersTable).where(eq(trialUsersTable.id, userId)).limit(1);
      const created = result[0];
      
      console.log('✅ Trial user created successfully:', created);
      return {
        id: created.id,
        deviceInfo: created.deviceInfo || undefined,
        trialStart: created.trialStart,
        trialEnd: created.trialEnd
      };
    } catch (error) {
      console.error('❌ Error creating trial user:', error);
      throw error;
    }
  }

  // Invite Codes operations
  async getInviteCode(code: string): Promise<{ code: string; type: string; usedAt?: number; usedBy?: string; } | undefined> {
    try {
      const result = await db.select().from(inviteCodesTable).where(eq(inviteCodesTable.code, code)).limit(1);
      const invite = result[0];
      
      if (!invite) return undefined;
      
      return {
        code: invite.code,
        type: invite.type,
        usedAt: invite.usedAt || undefined,
        usedBy: invite.usedBy || undefined
      };
    } catch (error) {
      console.error('Error getting invite code:', error);
      return undefined;
    }
  }

  async createInviteCode(code: string, type: string): Promise<{ code: string; type: string; createdAt: number; }> {
    try {
      const now = Math.floor(Date.now() / 1000); // Convert to seconds for SQLite
      const inviteCode = {
        code: code,
        type: type,
        createdAt: now,
        usedAt: null,
        usedBy: null
      };

      await db.insert(inviteCodesTable).values(inviteCode);
      
      // Get the inserted invite code (SQLite doesn't support RETURNING)
      const result = await db.select().from(inviteCodesTable).where(eq(inviteCodesTable.code, code)).limit(1);
      const created = result[0];
      
      console.log('✅ Invite code created successfully:', created);
      return {
        code: created.code,
        type: created.type,
        createdAt: created.createdAt
      };
    } catch (error) {
      console.error('❌ Error creating invite code:', error);
      throw error;
    }
  }

  async useInviteCode(code: string, userId: string): Promise<boolean> {
    try {
      const now = Math.floor(Date.now() / 1000); // Convert to seconds for SQLite
      
      await db.update(inviteCodesTable)
        .set({
          usedAt: now,
          usedBy: userId
        })
        .where(eq(inviteCodesTable.code, code));

      // Check if the update was successful by selecting the updated record
      const result = await db.select().from(inviteCodesTable)
        .where(eq(inviteCodesTable.code, code))
        .limit(1);

      console.log('✅ Invite code used successfully');
      return result.length > 0 && result[0].usedBy === userId;
    } catch (error) {
      console.error('❌ Error using invite code:', error);
      return false;
    }
  }
}

// In-memory storage for development/testing
export class InMemoryStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private sessions: Map<number, Session> = new Map();
  private bets: Map<number, Bet[]> = new Map();
  private nextSessionId = 1;
  private nextBetId = 1;

  // Beat the Delay storage
  private beatDelaySessions: Map<number, BeatDelaySession> = new Map();
  private beatDelayBets: Map<number, BeatDelayBet[]> = new Map();
  private nextBeatDelaySessionId = 1;
  private nextBeatDelayBetId = 1;

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(userData: ExtendedUser): Promise<User> {
    const user: User = {
      id: userData.id,
      email: userData.email || null,
      firstName: userData.firstName || null,
      lastName: userData.lastName || null,
      profileImageUrl: userData.profileImageUrl || null,
      stripeCustomerId: userData.stripeCustomerId || null,
      stripeSubscriptionId: userData.stripeSubscriptionId || null,
      subscriptionStatus: userData.subscriptionStatus || "inactive",
      subscriptionEndsAt: userData.subscriptionEndsAt || null,
      createdAt: userData.createdAt || new Date(),
      updatedAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  async updateUserSubscription(id: string, subscription: Partial<User>): Promise<User> {
    const user = this.users.get(id);
    if (!user) {
      throw new Error('User not found');
    }
    const updatedUser = { ...user, ...subscription, updatedAt: new Date() };
    this.users.set(id, updatedUser);
    return updatedUser;
  }




}

// Create storage instance with fallback
function createStorage(): IStorage {
  try {
    // Try to use DatabaseStorage if DATABASE_URL is configured
    if (process.env.DATABASE_URL) {
      console.log('Using DatabaseStorage with SQLite');
      return new DatabaseStorage();
    } else {
      console.log('Using InMemoryStorage (DATABASE_URL not configured)');
      return new InMemoryStorage();
    }
  } catch (error) {
    console.warn('Failed to initialize DatabaseStorage, falling back to InMemoryStorage:', error);
    return new InMemoryStorage();
  }
}

// Export storage instance - with automatic fallback
export const storage = createStorage();

// Keep both implementations available for testing
export const databaseStorage = new DatabaseStorage();
export const inMemoryStorage = new InMemoryStorage();
