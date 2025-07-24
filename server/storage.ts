import { 
  type User, 
  type UpsertUser, 
  type Session, 
  type InsertSession, 
  type Bet, 
  type InsertBet 
} from "@shared/types";

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
}

// In-memory storage for development/testing
export class InMemoryStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private sessions: Map<number, Session> = new Map();
  private bets: Map<number, Bet[]> = new Map();
  private nextSessionId = 1;
  private nextBetId = 1;

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
}

// Export storage instance - using InMemoryStorage for now to avoid DB issues
export const storage = new InMemoryStorage();
