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
import { users, sessions, bets, beatDelaySessionsTable, beatDelayBetsTable } from "@shared/database";
import { eq, and, desc } from "drizzle-orm";

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
      const user = {
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

      const result = await db.insert(users)
        .values(user)
        .onConflictDoUpdate({
          target: users.id,
          set: {
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            profileImageUrl: user.profileImageUrl,
            stripeCustomerId: user.stripeCustomerId,
            stripeSubscriptionId: user.stripeSubscriptionId,
            subscriptionStatus: user.subscriptionStatus,
            subscriptionEndsAt: user.subscriptionEndsAt,
            updatedAt: user.updatedAt,
          }
        })
        .returning();

      return result[0];
    } catch (error) {
      console.error('Error upserting user:', error);
      throw error;
    }
  }

  async updateUserSubscription(id: string, subscription: Partial<User>): Promise<User> {
    try {
      const result = await db.update(users)
        .set({
          ...subscription,
          updatedAt: new Date()
        })
        .where(eq(users.id, id))
        .returning();

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
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await db.insert(sessions).values(newSession).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  async updateSession(id: number, updatedFields: Partial<Session>): Promise<Session | undefined> {
    try {
      const result = await db.update(sessions)
        .set({
          ...updatedFields,
          updatedAt: new Date()
        })
        .where(eq(sessions.id, id))
        .returning();

      return result[0] || undefined;
    } catch (error) {
      console.error('Error updating session:', error);
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
        win: betData.win,
        bankrollBefore: betData.bankrollBefore,
        bankrollAfter: betData.bankrollAfter,
        createdAt: new Date(),
      };

      const result = await db.insert(bets).values(newBet).returning();
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

      // Update session statistics
      const updatedSession = {
        currentBankroll: bet.bankrollAfter,
        betCount: currentSession.betCount + 1,
        wins: bet.win ? currentSession.wins + 1 : currentSession.wins,
        losses: bet.win ? currentSession.losses : currentSession.losses + 1,
        updatedAt: new Date(),
      };

      const result = await db.update(sessions)
        .set(updatedSession)
        .where(eq(sessions.id, sessionId))
        .returning();

      return result[0];
    } catch (error) {
      console.error('Error updating session after bet:', error);
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
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await db.insert(beatDelaySessionsTable).values(newSession).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating Beat the Delay session:', error);
      throw error;
    }
  }

  async updateBeatDelaySession(id: number, updates: Partial<BeatDelaySession>): Promise<BeatDelaySession | undefined> {
    try {
      const result = await db.update(beatDelaySessionsTable)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(eq(beatDelaySessionsTable.id, id))
        .returning();

      return result[0] || undefined;
    } catch (error) {
      console.error('Error updating Beat the Delay session:', error);
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

      // Create the bet
      const newBet = {
        sessionId: sessionId,
        betNumber: betData.betNumber,
        stake: betData.stake,
        odds: betData.odds,
        potentialWin: betData.potentialWin,
        win: betData.win,
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
        shouldPlay: betData.shouldPlay,
        anomalyIndex: betData.anomalyIndex,
        recoveryRate: betData.recoveryRate,
        mlProbability: betData.mlProbability || 0,
        mlConfidence: betData.mlConfidence || 0,
        combinedProbability: betData.combinedProbability || 0,
        combinedEV: betData.combinedEV || 0,
        createdAt: new Date(),
      };

      const betResult = await db.insert(beatDelayBetsTable).values(newBet).returning();
      const bet = betResult[0];

      // Update session statistics
      const profitLoss = bet.win ? (bet.potentialWin - bet.stake) : -bet.stake;
      const updatedSession = {
        finalBankroll: bet.bankrollAfter,
        totalBets: session.totalBets + 1,
        totalWins: bet.win ? session.totalWins + 1 : session.totalWins,
        totalLosses: bet.win ? session.totalLosses : session.totalLosses + 1,
        profitLoss: session.profitLoss + profitLoss,
        winRate: ((bet.win ? session.totalWins + 1 : session.totalWins) / (session.totalBets + 1)) * 100,
        roi: ((session.profitLoss + profitLoss) / session.initialBankroll) * 100,
        updatedAt: new Date()
      };

      const sessionResult = await db.update(beatDelaySessionsTable)
        .set(updatedSession)
        .where(eq(beatDelaySessionsTable.id, sessionId))
        .returning();

      return { session: sessionResult[0], bet };
    } catch (error) {
      console.error('Error adding Beat the Delay bet:', error);
      throw error;
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

  async getAllSessions(strategy?: string): Promise<Session[]> {
    const allSessions = Array.from(this.sessions.values());
    if (strategy) {
      return allSessions.filter(s => s.strategy === strategy);
    }
    return allSessions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getSession(id: number): Promise<Session | undefined> {
    return this.sessions.get(id);
  }

  async createSession(insertSession: InsertSession): Promise<Session> {
    const session: Session = {
      id: this.nextSessionId++,
      userId: insertSession.userId || null,
      name: insertSession.name,
      initialBankroll: insertSession.initialBankroll,
      currentBankroll: insertSession.currentBankroll,
      targetReturn: insertSession.targetReturn,
      strategy: insertSession.strategy,
      betCount: insertSession.betCount || 0,
      wins: insertSession.wins || 0,
      losses: insertSession.losses || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      strategySettings: insertSession.strategySettings,
    };
    this.sessions.set(session.id, session);
    this.bets.set(session.id, []);
    return session;
  }

  async updateSession(id: number, updatedFields: Partial<Session>): Promise<Session | undefined> {
    const session = this.sessions.get(id);
    if (!session) return undefined;
    
    const updated = { ...session, ...updatedFields, updatedAt: new Date() };
    this.sessions.set(id, updated);
    return updated;
  }

  async deleteSession(id: number): Promise<boolean> {
    const deleted = this.sessions.delete(id);
    this.bets.delete(id);
    return deleted;
  }

  async getBetsBySessionId(sessionId: number): Promise<Bet[]> {
    return this.bets.get(sessionId) || [];
  }

  async createBet(insertBet: InsertBet): Promise<Bet> {
    const bet: Bet = {
      id: this.nextBetId++,
      sessionId: insertBet.sessionId || null,
      betNumber: insertBet.betNumber,
      stake: insertBet.stake,
      odds: insertBet.odds,
      potentialWin: insertBet.potentialWin,
      win: insertBet.win,
      bankrollBefore: insertBet.bankrollBefore,
      bankrollAfter: insertBet.bankrollAfter,
      createdAt: new Date(),
    };
    
    const sessionBets = this.bets.get(insertBet.sessionId!) || [];
    sessionBets.push(bet);
    this.bets.set(insertBet.sessionId!, sessionBets);
    
    return bet;
  }

  async updateSessionAfterBet(sessionId: number, bet: Bet): Promise<Session> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const updated: Session = {
      ...session,
      currentBankroll: bet.bankrollAfter,
      betCount: session.betCount + 1,
      wins: bet.win ? session.wins + 1 : session.wins,
      losses: bet.win ? session.losses : session.losses + 1,
      updatedAt: new Date()
    };
    
    this.sessions.set(sessionId, updated);
    return updated;
  }

  async deleteAllBetsForSession(sessionId: number): Promise<boolean> {
    this.bets.set(sessionId, []);
    
    const session = this.sessions.get(sessionId);
    if (session) {
      const updated = {
        ...session,
        betCount: 0,
        wins: 0,
        losses: 0,
        updatedAt: new Date()
      };
      this.sessions.set(sessionId, updated);
    }
    
    return true;
  }

  // ===== BEAT THE DELAY METHODS =====

  async getAllBeatDelaySessions(): Promise<BeatDelaySession[]> {
    return Array.from(this.beatDelaySessions.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getBeatDelaySession(id: number): Promise<BeatDelaySession | undefined> {
    return this.beatDelaySessions.get(id);
  }

  async createBeatDelaySession(insertSession: InsertBeatDelaySession): Promise<BeatDelaySession> {
    const session: BeatDelaySession = {
      id: this.nextBeatDelaySessionId++,
      userId: insertSession.userId || null,
      sessionName: insertSession.sessionName,
      createdAt: new Date(),
      updatedAt: new Date(),
      initialBankroll: insertSession.initialBankroll,
      baseStake: insertSession.baseStake,
      targetReturn: insertSession.targetReturn,
      stopLoss: insertSession.stopLoss,
      finalBankroll: insertSession.finalBankroll,
      totalBets: insertSession.totalBets || 0,
      totalWins: insertSession.totalWins || 0,
      totalLosses: insertSession.totalLosses || 0,
      profitLoss: insertSession.profitLoss || 0,
      winRate: insertSession.winRate || 0,
      roi: insertSession.roi || 0,
      notes: insertSession.notes || null,
      status: insertSession.status || "active",
    };
    
    this.beatDelaySessions.set(session.id, session);
    this.beatDelayBets.set(session.id, []);
    return session;
  }

  async updateBeatDelaySession(id: number, updates: Partial<BeatDelaySession>): Promise<BeatDelaySession | undefined> {
    const session = this.beatDelaySessions.get(id);
    if (!session) return undefined;
    
    const updated = { ...session, ...updates, updatedAt: new Date() };
    this.beatDelaySessions.set(id, updated);
    return updated;
  }

  async deleteBeatDelaySession(id: number): Promise<boolean> {
    const deleted = this.beatDelaySessions.delete(id);
    this.beatDelayBets.delete(id);
    return deleted;
  }

  async getBeatDelayBets(sessionId: number): Promise<BeatDelayBet[]> {
    return this.beatDelayBets.get(sessionId) || [];
  }

  async addBeatDelayBet(sessionId: number, insertBet: InsertBeatDelayBet): Promise<{ session: BeatDelaySession; bet: BeatDelayBet }> {
    const session = this.beatDelaySessions.get(sessionId);
    if (!session) {
      throw new Error('Beat the Delay session not found');
    }

    const bet: BeatDelayBet = {
      id: this.nextBeatDelayBetId++,
      sessionId: insertBet.sessionId,
      betNumber: insertBet.betNumber,
      stake: insertBet.stake,
      odds: insertBet.odds,
      potentialWin: insertBet.potentialWin,
      win: insertBet.win,
      bankrollBefore: insertBet.bankrollBefore,
      bankrollAfter: insertBet.bankrollAfter,
      currentSign: insertBet.currentSign,
      currentDelay: insertBet.currentDelay,
      historicalFrequency: insertBet.historicalFrequency,
      avgDelay: insertBet.avgDelay,
      maxDelay: insertBet.maxDelay,
      captureRate: insertBet.captureRate,
      estimatedProbability: insertBet.estimatedProbability,
      expectedValue: insertBet.expectedValue,
      shouldPlay: insertBet.shouldPlay,
      anomalyIndex: insertBet.anomalyIndex,
      recoveryRate: insertBet.recoveryRate,
      mlProbability: insertBet.mlProbability || 0,
      mlConfidence: insertBet.mlConfidence || 0,
      combinedProbability: insertBet.combinedProbability || 0,
      combinedEV: insertBet.combinedEV || 0,
      createdAt: new Date(),
    };
    
    // Add bet to session bets
    const sessionBets = this.beatDelayBets.get(sessionId) || [];
    sessionBets.push(bet);
    this.beatDelayBets.set(sessionId, sessionBets);
    
    // Update session statistics
    const profitLoss = bet.win ? (bet.potentialWin - bet.stake) : -bet.stake;
    const updatedSession: BeatDelaySession = {
      ...session,
      finalBankroll: bet.bankrollAfter,
      totalBets: session.totalBets + 1,
      totalWins: bet.win ? session.totalWins + 1 : session.totalWins,
      totalLosses: bet.win ? session.totalLosses : session.totalLosses + 1,
      profitLoss: session.profitLoss + profitLoss,
      winRate: ((bet.win ? session.totalWins + 1 : session.totalWins) / (session.totalBets + 1)) * 100,
      roi: ((session.profitLoss + profitLoss) / session.initialBankroll) * 100,
      updatedAt: new Date()
    };
    
    this.beatDelaySessions.set(sessionId, updatedSession);
    
    return { session: updatedSession, bet };
  }
}

// Create storage instance with fallback
function createStorage(): IStorage {
  try {
    // Try to use DatabaseStorage if DATABASE_URL is configured for PostgreSQL
    if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres')) {
      console.log('Using DatabaseStorage with PostgreSQL');
      return new DatabaseStorage();
    } else {
      console.log('Using InMemoryStorage (DATABASE_URL not configured for PostgreSQL)');
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
