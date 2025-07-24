// Simplified types for immediate use
export interface User {
  id: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  profileImageUrl?: string | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  subscriptionStatus?: string | null;
  subscriptionEndsAt?: Date | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export interface Session {
  id: number;
  userId?: string | null;
  name: string;
  initialBankroll: number;
  currentBankroll: number;
  targetReturn: number;
  strategy: string;
  betCount: number;
  wins: number;
  losses: number;
  createdAt: Date;
  updatedAt: Date;
  strategySettings: string;
}

export interface Bet {
  id: number;
  sessionId?: number | null;
  betNumber: number;
  stake: number;
  odds: number;
  potentialWin: number;
  win: boolean;
  bankrollBefore: number;
  bankrollAfter: number;
  createdAt: Date;
}

export interface InsertSession {
  userId?: string;
  name: string;
  initialBankroll: number;
  currentBankroll: number;
  targetReturn: number;
  strategy: string;
  betCount?: number;
  wins?: number;
  losses?: number;
  strategySettings: string;
}

export interface InsertBet {
  sessionId?: number;
  betNumber: number;
  stake: number;
  odds: number;
  potentialWin: number;
  win: boolean;
  bankrollBefore: number;
  bankrollAfter: number;
}

export type UpsertUser = Partial<User> & { id: string };
