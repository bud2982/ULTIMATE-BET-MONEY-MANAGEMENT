import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

// Tipi per Beat the Delay Sessions
export interface BeatDelaySession {
  id: number;
  userId?: string | null;
  sessionName: string;
  createdAt: Date;
  updatedAt: Date;
  initialBankroll: number;
  baseStake: number;
  targetReturn: number;
  stopLoss: number;
  finalBankroll: number;
  totalBets: number;
  totalWins: number;
  totalLosses: number;
  profitLoss: number;
  winRate: number;
  roi: number;
  notes?: string | null;
  status: 'active' | 'completed' | 'archived';
}

export interface BeatDelayBet {
  id: number;
  sessionId: number;
  betNumber: number;
  stake: number;
  odds: number;
  potentialWin: number;
  win: boolean;
  bankrollBefore: number;
  bankrollAfter: number;
  currentSign: '1' | 'X' | '2';
  currentDelay: number;
  historicalFrequency: number;
  avgDelay: number;
  maxDelay: number;
  captureRate: number;
  estimatedProbability: number;
  expectedValue: number;
  shouldPlay: boolean;
  anomalyIndex: number;
  recoveryRate: number;
  mlProbability: number;
  mlConfidence: number;
  combinedProbability: number;
  combinedEV: number;
  createdAt: Date;
}

export interface CreateBeatDelaySessionData {
  sessionName: string;
  initialBankroll: number;
  baseStake: number;
  targetReturn: number;
  stopLoss: number;
  notes?: string;
}

export interface CreateBeatDelayBetData {
  betNumber: number;
  stake: number;
  odds: number;
  potentialWin: number;
  win: boolean;
  bankrollBefore: number;
  bankrollAfter: number;
  currentSign: '1' | 'X' | '2';
  currentDelay: number;
  historicalFrequency: number;
  avgDelay: number;
  maxDelay: number;
  captureRate: number;
  estimatedProbability: number;
  expectedValue: number;
  shouldPlay: boolean;
  anomalyIndex: number;
  recoveryRate: number;
  mlProbability?: number;
  mlConfidence?: number;
  combinedProbability?: number;
  combinedEV?: number;
}

export function useBeatDelaySessions() {
  const queryClient = useQueryClient();
  const [selectedSession, setSelectedSession] = useState<BeatDelaySession | null>(null);

  // Get all Beat the Delay sessions
  const { 
    data: sessions = [],
    isLoading: sessionsLoading,
    error: sessionsError,
    refetch: refetchSessions
  } = useQuery({
    queryKey: ['/api/beat-delay-sessions'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/beat-delay-sessions');
      const data = await res.json();
      return data.map((session: any) => ({
        ...session,
        createdAt: new Date(session.createdAt),
        updatedAt: new Date(session.updatedAt)
      })) as BeatDelaySession[];
    },
    staleTime: 30000, // 30 seconds
  });

  // Get bets for selected session
  const {
    data: sessionBets = [],
    isLoading: betsLoading,
    error: betsError,
    refetch: refetchBets
  } = useQuery({
    queryKey: ['/api/beat-delay-sessions', selectedSession?.id, 'bets'],
    queryFn: async () => {
      if (!selectedSession?.id) return [];
      const res = await apiRequest('GET', `/api/beat-delay-sessions/${selectedSession.id}/bets`);
      const data = await res.json();
      return data.map((bet: any) => ({
        ...bet,
        createdAt: new Date(bet.createdAt)
      })) as BeatDelayBet[];
    },
    enabled: !!selectedSession?.id
  });

  // Create new session
  const createSessionMutation = useMutation({
    mutationFn: async (sessionData: CreateBeatDelaySessionData) => {
      const newSession = {
        ...sessionData,
        finalBankroll: sessionData.initialBankroll,
        totalBets: 0,
        totalWins: 0,
        totalLosses: 0,
        profitLoss: 0,
        winRate: 0,
        roi: 0,
        status: 'active' as const
      };
      
      const res = await apiRequest('POST', '/api/beat-delay-sessions', newSession);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/beat-delay-sessions'] });
      setSelectedSession(data);
    }
  });

  // Update session
  const updateSessionMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number, updates: Partial<BeatDelaySession> }) => {
      const res = await apiRequest('PATCH', `/api/beat-delay-sessions/${id}`, updates);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/beat-delay-sessions'] });
      if (selectedSession?.id === data.id) {
        setSelectedSession(data);
      }
    }
  });

  // Delete session
  const deleteSessionMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/beat-delay-sessions/${id}`);
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['/api/beat-delay-sessions'] });
      if (selectedSession?.id === id) {
        setSelectedSession(null);
      }
    }
  });

  // Add bet to session
  const addBetMutation = useMutation({
    mutationFn: async ({ sessionId, bet }: { sessionId: number, bet: CreateBeatDelayBetData }) => {
      const res = await apiRequest('POST', `/api/beat-delay-sessions/${sessionId}/bets`, {
        ...bet,
        sessionId
      });
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/beat-delay-sessions'] });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/beat-delay-sessions', data.session.id, 'bets'] 
      });
      setSelectedSession(data.session);
    }
  });

  // Helper functions
  const createSession = (sessionData: CreateBeatDelaySessionData) => {
    createSessionMutation.mutate(sessionData);
  };

  const updateSession = (id: number, updates: Partial<BeatDelaySession>) => {
    updateSessionMutation.mutate({ id, updates });
  };

  const deleteSession = (id: number) => {
    deleteSessionMutation.mutate(id);
  };

  const addBet = (sessionId: number, bet: CreateBeatDelayBetData) => {
    addBetMutation.mutate({ sessionId, bet });
  };

  const loadSession = (session: BeatDelaySession) => {
    setSelectedSession(session);
  };

  const clearSession = () => {
    setSelectedSession(null);
  };

  // Save current session to localStorage for persistence
  const saveToLocalStorage = (session: BeatDelaySession, bets: BeatDelayBet[]) => {
    const sessionData = {
      session,
      bets,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem(`beat-delay-session-${session.id}`, JSON.stringify(sessionData));
  };

  // Load session from localStorage
  const loadFromLocalStorage = (sessionId: number) => {
    const saved = localStorage.getItem(`beat-delay-session-${sessionId}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.error('Error loading session from localStorage:', error);
        return null;
      }
    }
    return null;
  };

  // Get session statistics
  const getSessionStats = (session: BeatDelaySession) => {
    return {
      totalProfit: session.profitLoss,
      winRate: session.winRate,
      roi: session.roi,
      avgStake: session.totalBets > 0 ? (session.initialBankroll - session.finalBankroll + session.profitLoss) / session.totalBets : 0,
      bestStreak: 0, // TODO: Calculate from bets
      worstStreak: 0, // TODO: Calculate from bets
      totalVolume: session.totalBets * (session.initialBankroll / 100), // Estimate
    };
  };

  return {
    // Data
    sessions,
    selectedSession,
    sessionBets,
    
    // Loading states
    sessionsLoading,
    betsLoading,
    isCreating: createSessionMutation.isPending,
    isUpdating: updateSessionMutation.isPending,
    isDeleting: deleteSessionMutation.isPending,
    isAddingBet: addBetMutation.isPending,
    
    // Error states
    sessionsError,
    betsError,
    createError: createSessionMutation.error,
    updateError: updateSessionMutation.error,
    deleteError: deleteSessionMutation.error,
    addBetError: addBetMutation.error,
    
    // Actions
    createSession,
    updateSession,
    deleteSession,
    addBet,
    loadSession,
    clearSession,
    refetchSessions,
    refetchBets,
    
    // Utilities
    saveToLocalStorage,
    loadFromLocalStorage,
    getSessionStats,
  };
}