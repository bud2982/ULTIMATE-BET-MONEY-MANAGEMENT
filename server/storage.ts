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

// Export storage instance - using InMemoryStorage for now to avoid DB issues
export const storage = new InMemoryStorage();
