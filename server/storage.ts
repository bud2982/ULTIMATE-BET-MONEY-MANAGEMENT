import { 
  type User, 
  type UpsertUser, 
  type Session, 
  type InsertSession, 
  type Bet, 
  type InsertBet 
} from "@shared/schema";

export interface IStorage {
  // User operations for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
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

import { db } from './db';
import { eq, desc } from 'drizzle-orm';
import { users, sessions, bets } from '@shared/schema';

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async upsertUser(user: UpsertUser): Promise<User> {
    const [result] = await db
      .insert(users)
      .values(user)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImageUrl: user.profileImageUrl,
          updatedAt: new Date()
        }
      })
      .returning();
    return result;
  }

  async updateUserSubscription(id: string, subscription: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...subscription, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Session operations
  async getAllSessions(strategy?: string): Promise<Session[]> {
    if (strategy) {
      // Se è specificata una strategia, filtra per quella specifica
      return await db
        .select()
        .from(sessions)
        .where(eq(sessions.strategy, strategy))
        .orderBy(desc(sessions.createdAt));
    } else {
      // Altrimenti restituisci tutte le sessioni
      return await db
        .select()
        .from(sessions)
        .orderBy(desc(sessions.createdAt));
    }
  }

  async getSession(id: number): Promise<Session | undefined> {
    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, id));
    return session || undefined;
  }

  async createSession(insertSession: InsertSession): Promise<Session> {
    const [session] = await db
      .insert(sessions)
      .values({
        ...insertSession,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return session;
  }

  async updateSession(id: number, updatedFields: Partial<Session>): Promise<Session | undefined> {
    const [updatedSession] = await db
      .update(sessions)
      .set({
        ...updatedFields,
        updatedAt: new Date()
      })
      .where(eq(sessions.id, id))
      .returning();
    return updatedSession || undefined;
  }

  async deleteSession(id: number): Promise<boolean> {
    // Delete all bets associated with this session
    await db
      .delete(bets)
      .where(eq(bets.sessionId, id));

    // Delete the session
    const result = await db
      .delete(sessions)
      .where(eq(sessions.id, id))
      .returning({ id: sessions.id });

    return result.length > 0;
  }

  // Bet operations
  async getBetsBySessionId(sessionId: number): Promise<Bet[]> {
    return await db
      .select()
      .from(bets)
      .where(eq(bets.sessionId, sessionId))
      .orderBy(bets.betNumber);
  }

  async createBet(insertBet: InsertBet): Promise<Bet> {
    const [bet] = await db
      .insert(bets)
      .values({
        ...insertBet,
        createdAt: new Date()
      })
      .returning();
    return bet;
  }

  async updateSessionAfterBet(sessionId: number, bet: Bet): Promise<Session> {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session with ID ${sessionId} not found`);
    }

    // Update session bankroll and stats
    const [updatedSession] = await db
      .update(sessions)
      .set({
        currentBankroll: bet.bankrollAfter,
        betCount: session.betCount + 1,
        wins: bet.win ? session.wins + 1 : session.wins,
        losses: bet.win ? session.losses : session.losses + 1,
        updatedAt: new Date()
      })
      .where(eq(sessions.id, sessionId))
      .returning();

    return updatedSession;
  }

  async deleteAllBetsForSession(sessionId: number): Promise<boolean> {
    // Verifica se la sessione esiste
    const session = await this.getSession(sessionId);
    if (!session) {
      console.log("Sessione non trovata");
      return false;
    }

    try {
      // Elimina tutte le scommesse per questa sessione
      console.log(`Eliminazione scommesse per sessione ${sessionId}...`);
      const result = await db
        .delete(bets)
        .where(eq(bets.sessionId, sessionId))
        .returning({ id: bets.id });
      
      console.log(`Scommesse eliminate: ${result.length}`);

      // Aggiorna la sessione per ripristinare lo stato iniziale
      console.log(`Aggiornamento sessione ${sessionId}...`);
      await db
        .update(sessions)
        .set({
          currentBankroll: session.initialBankroll,
          betCount: 0,
          wins: 0,
          losses: 0,
          updatedAt: new Date()
        })
        .where(eq(sessions.id, sessionId));

      console.log(`Sessione ${sessionId} aggiornata con successo`);
      return true;
    } catch (error) {
      console.error("Errore durante l'eliminazione delle scommesse:", error);
      return false;
    }
  }
}

// Classe di storage in memoria per gestire problemi temporanei del database
class MemoryStorage implements IStorage {
  private users: User[] = [];
  private sessions: Session[] = [];
  private bets: Bet[] = [];
  private nextUserId = 1;
  private nextSessionId = 1;
  private nextBetId = 1;

  async getUser(id: string): Promise<User | undefined> {
    return this.users.find(u => u.id === id);
  }

  async upsertUser(user: UpsertUser): Promise<User> {
    const existingUser = this.users.find(u => u.id === user.id);
    if (existingUser) {
      Object.assign(existingUser, user, { updatedAt: new Date() });
      return existingUser;
    } else {
      const newUser: User = {
        id: user.id!,
        email: user.email ?? null,
        firstName: user.firstName ?? null,
        lastName: user.lastName ?? null,
        profileImageUrl: user.profileImageUrl ?? null,
        stripeCustomerId: user.stripeCustomerId ?? null,
        stripeSubscriptionId: user.stripeSubscriptionId ?? null,
        subscriptionStatus: user.subscriptionStatus ?? null,
        subscriptionEndsAt: user.subscriptionEndsAt ?? null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.users.push(newUser);
      return newUser;
    }
  }

  async updateUserSubscription(id: string, subscription: Partial<User>): Promise<User> {
    const user = this.users.find(u => u.id === id);
    if (!user) throw new Error('User not found');
    Object.assign(user, subscription, { updatedAt: new Date() });
    return user;
  }

  async getAllSessions(strategy?: string): Promise<Session[]> {
    let filteredSessions = this.sessions;
    if (strategy) {
      filteredSessions = this.sessions.filter(s => s.strategy === strategy);
    }
    return filteredSessions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getSession(id: number): Promise<Session | undefined> {
    return this.sessions.find(s => s.id === id);
  }

  async createSession(insertSession: InsertSession): Promise<Session> {
    const session: Session = {
      id: this.nextSessionId++,
      name: insertSession.name,
      userId: insertSession.userId || null,
      initialBankroll: insertSession.initialBankroll,
      currentBankroll: insertSession.currentBankroll,
      targetReturn: insertSession.targetReturn,
      strategy: insertSession.strategy,
      strategySettings: insertSession.strategySettings,
      betCount: 0,
      wins: 0,
      losses: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.sessions.push(session);
    return session;
  }

  async updateSession(id: number, updatedFields: Partial<Session>): Promise<Session | undefined> {
    const sessionIndex = this.sessions.findIndex(s => s.id === id);
    if (sessionIndex === -1) return undefined;
    
    this.sessions[sessionIndex] = {
      ...this.sessions[sessionIndex],
      ...updatedFields,
      updatedAt: new Date()
    };
    return this.sessions[sessionIndex];
  }

  async deleteSession(id: number): Promise<boolean> {
    const sessionIndex = this.sessions.findIndex(s => s.id === id);
    if (sessionIndex === -1) return false;
    
    this.sessions.splice(sessionIndex, 1);
    this.bets = this.bets.filter(b => b.sessionId !== id);
    return true;
  }

  async getBetsBySessionId(sessionId: number): Promise<Bet[]> {
    return this.bets
      .filter(b => b.sessionId === sessionId)
      .sort((a, b) => a.betNumber - b.betNumber);
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
      createdAt: new Date()
    };
    this.bets.push(bet);
    return bet;
  }

  async updateSessionAfterBet(sessionId: number, bet: Bet): Promise<Session> {
    const session = this.sessions.find(s => s.id === sessionId);
    if (!session) throw new Error('Session not found');

    session.betCount = session.betCount + 1;
    session.currentBankroll = bet.bankrollAfter;
    if (bet.win) {
      session.wins = session.wins + 1;
    } else {
      session.losses = session.losses + 1;
    }
    session.updatedAt = new Date();

    return session;
  }

  async deleteAllBetsForSession(sessionId: number): Promise<boolean> {
    const initialLength = this.bets.length;
    this.bets = this.bets.filter(b => b.sessionId !== sessionId);
    return this.bets.length < initialLength;
  }
}

// Usa storage in memoria per evitare problemi di database
// Implementazione in memoria per ora
class AuthMemoryStorage implements IStorage {
  private users: User[] = [];
  private sessions: Session[] = [];
  private bets: Bet[] = [];
  private nextSessionId = 1;
  private nextBetId = 1;

  // User operations for Replit Auth
  async getUser(id: string): Promise<User | undefined> {
    return this.users.find(u => u.id === id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existingIndex = this.users.findIndex(u => u.id === userData.id);
    const user: User = {
      id: userData.id!,
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

    if (existingIndex >= 0) {
      this.users[existingIndex] = user;
    } else {
      this.users.push(user);
    }
    return user;
  }

  async updateUserSubscription(id: string, subscription: Partial<User>): Promise<User> {
    const userIndex = this.users.findIndex(u => u.id === id);
    if (userIndex === -1) {
      throw new Error("User not found");
    }
    
    this.users[userIndex] = { ...this.users[userIndex], ...subscription, updatedAt: new Date() };
    return this.users[userIndex];
  }

  // Session operations
  async getAllSessions(strategy?: string): Promise<Session[]> {
    if (strategy) {
      return this.sessions.filter(s => s.strategy === strategy);
    }
    return [...this.sessions];
  }

  async getSession(id: number): Promise<Session | undefined> {
    return this.sessions.find(s => s.id === id);
  }

  async createSession(insertSession: InsertSession): Promise<Session> {
    const session: Session = {
      id: this.nextSessionId++,
      userId: insertSession.userId ?? null,
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
    this.sessions.push(session);
    return session;
  }

  async updateSession(id: number, updatedFields: Partial<Session>): Promise<Session | undefined> {
    const sessionIndex = this.sessions.findIndex(s => s.id === id);
    if (sessionIndex === -1) return undefined;
    
    this.sessions[sessionIndex] = { ...this.sessions[sessionIndex], ...updatedFields, updatedAt: new Date() };
    return this.sessions[sessionIndex];
  }

  async deleteSession(id: number): Promise<boolean> {
    const sessionIndex = this.sessions.findIndex(s => s.id === id);
    if (sessionIndex === -1) return false;
    
    this.sessions.splice(sessionIndex, 1);
    await this.deleteAllBetsForSession(id);
    return true;
  }

  // Bet operations
  async getBetsBySessionId(sessionId: number): Promise<Bet[]> {
    return this.bets.filter(b => b.sessionId === sessionId);
  }

  async createBet(insertBet: InsertBet): Promise<Bet> {
    const bet: Bet = {
      id: this.nextBetId++,
      sessionId: insertBet.sessionId ?? null,
      betNumber: insertBet.betNumber,
      stake: insertBet.stake,
      odds: insertBet.odds,
      potentialWin: insertBet.potentialWin,
      win: insertBet.win,
      bankrollBefore: insertBet.bankrollBefore,
      bankrollAfter: insertBet.bankrollAfter,
      createdAt: new Date(),
    };
    this.bets.push(bet);
    return bet;
  }

  async updateSessionAfterBet(sessionId: number, bet: Bet): Promise<Session> {
    const session = await this.getSession(sessionId);
    if (!session) throw new Error("Session not found");

    const updatedSession = {
      ...session,
      currentBankroll: bet.bankrollAfter,
      betCount: session.betCount + 1,
      wins: bet.win ? session.wins + 1 : session.wins,
      losses: bet.win ? session.losses : session.losses + 1,
      updatedAt: new Date(),
    };

    await this.updateSession(sessionId, updatedSession);
    return updatedSession;
  }

  async deleteAllBetsForSession(sessionId: number): Promise<boolean> {
    const beforeLength = this.bets.length;
    this.bets = this.bets.filter(b => b.sessionId !== sessionId);
    return this.bets.length < beforeLength;
  }
}

export const storage = new AuthMemoryStorage();
