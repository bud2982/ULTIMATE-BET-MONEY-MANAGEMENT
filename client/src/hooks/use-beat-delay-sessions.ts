import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

// LocalStorage keys for Beat the Delay
const BEAT_DELAY_STORAGE_KEYS = {
  SELECTED_SESSION: 'beat_delay_selected_session',
  SESSIONS_CACHE: 'beat_delay_sessions_cache',
  BETS_CACHE: 'beat_delay_bets_cache'
};

// LocalStorage utilities
const saveToLocalStorage = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to save to localStorage:', error);
  }
};

const loadFromLocalStorage = (key: string) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.warn('Failed to load from localStorage:', error);
    return null;
  }
};

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
  const [selectedSession, setSelectedSession] = useState<BeatDelaySession | null>(() => {
    // Load selected session from localStorage on initialization
    return loadFromLocalStorage(BEAT_DELAY_STORAGE_KEYS.SELECTED_SESSION);
  });

  // Get all Beat the Delay sessions
  const { 
    data: sessions = [],
    isLoading: sessionsLoading,
    error: sessionsError,
    refetch: refetchSessions
  } = useQuery({
    queryKey: ['/api/beat-delay-sessions'],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', '/api/beat-delay-sessions');
        const data = await res.json();
        return data.map((session: any) => ({
          ...session,
          createdAt: new Date(session.createdAt),
          updatedAt: new Date(session.updatedAt)
        })) as BeatDelaySession[];
      } catch (error) {
        console.warn('Failed to fetch Beat the Delay sessions from server, using localStorage cache:', error);
        // Fallback to localStorage cache
        const cachedSessions = loadFromLocalStorage(BEAT_DELAY_STORAGE_KEYS.SESSIONS_CACHE) || [];
        return cachedSessions.map((session: any) => ({
          ...session,
          createdAt: new Date(session.createdAt),
          updatedAt: new Date(session.updatedAt)
        })) as BeatDelaySession[];
      }
    },
    staleTime: 30000, // 30 seconds
    retry: 1
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
      try {
        const res = await apiRequest('GET', `/api/beat-delay-sessions/${selectedSession.id}/bets`);
        const data = await res.json();
        return data.map((bet: any) => ({
          ...bet,
          createdAt: new Date(bet.createdAt)
        })) as BeatDelayBet[];
      } catch (error) {
        console.warn('Failed to fetch Beat the Delay bets from server, using localStorage cache:', error);
        // Fallback to localStorage cache
        const cachedBets = loadFromLocalStorage(`${BEAT_DELAY_STORAGE_KEYS.BETS_CACHE}_${selectedSession.id}`) || [];
        return cachedBets.map((bet: any) => ({
          ...bet,
          createdAt: new Date(bet.createdAt)
        })) as BeatDelayBet[];
      }
    },
    enabled: !!selectedSession?.id,
    retry: 1
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
      
      try {
        const res = await apiRequest('POST', '/api/beat-delay-sessions', newSession);
        return await res.json();
      } catch (error) {
        console.warn('Failed to create Beat the Delay session on server, saving locally:', error);
        // Create session locally with a temporary ID
        const localSession = {
          ...newSession,
          id: Date.now(), // Use timestamp as temporary ID
          userId: null,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        // Save to localStorage
        const cachedSessions = loadFromLocalStorage(BEAT_DELAY_STORAGE_KEYS.SESSIONS_CACHE) || [];
        cachedSessions.unshift(localSession);
        saveToLocalStorage(BEAT_DELAY_STORAGE_KEYS.SESSIONS_CACHE, cachedSessions);
        
        return localSession;
      }
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
      try {
        const res = await apiRequest('POST', `/api/beat-delay-sessions/${sessionId}/bets`, {
          ...bet,
          sessionId
        });
        return await res.json();
      } catch (error) {
        console.warn('Failed to add Beat the Delay bet on server, saving locally:', error);
        
        // Create bet locally
        const localBet = {
          ...bet,
          id: Date.now(), // Use timestamp as temporary ID
          sessionId,
          createdAt: new Date()
        };
        
        // Update local session
        const cachedSessions = loadFromLocalStorage(BEAT_DELAY_STORAGE_KEYS.SESSIONS_CACHE) || [];
        const sessionIndex = cachedSessions.findIndex((s: any) => s.id === sessionId);
        
        if (sessionIndex !== -1) {
          const session = cachedSessions[sessionIndex];
          const profitLoss = bet.win ? (bet.potentialWin - bet.stake) : -bet.stake;
          
          const updatedSession = {
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
          
          cachedSessions[sessionIndex] = updatedSession;
          saveToLocalStorage(BEAT_DELAY_STORAGE_KEYS.SESSIONS_CACHE, cachedSessions);
          
          // Save bet to local cache
          const cachedBets = loadFromLocalStorage(`${BEAT_DELAY_STORAGE_KEYS.BETS_CACHE}_${sessionId}`) || [];
          cachedBets.push(localBet);
          saveToLocalStorage(`${BEAT_DELAY_STORAGE_KEYS.BETS_CACHE}_${sessionId}`, cachedBets);
          
          return { session: updatedSession, bet: localBet };
        }
        
        throw error;
      }
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

  // Save selected session to localStorage when it changes
  useEffect(() => {
    saveToLocalStorage(BEAT_DELAY_STORAGE_KEYS.SELECTED_SESSION, selectedSession);
  }, [selectedSession]);

  // Save sessions cache to localStorage when they change
  useEffect(() => {
    if (sessions && sessions.length > 0) {
      saveToLocalStorage(BEAT_DELAY_STORAGE_KEYS.SESSIONS_CACHE, sessions);
    }
  }, [sessions]);

  // Save bets cache to localStorage when they change
  useEffect(() => {
    if (sessionBets && sessionBets.length > 0 && selectedSession?.id) {
      saveToLocalStorage(`${BEAT_DELAY_STORAGE_KEYS.BETS_CACHE}_${selectedSession.id}`, sessionBets);
    }
  }, [sessionBets, selectedSession?.id]);

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