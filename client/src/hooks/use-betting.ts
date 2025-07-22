import { useState, useEffect } from 'react';
import { 
  BettingStrategy, 
  BettingStrategySettings, 
  SessionData, 
  BetData,
  BettingState
} from '@/types/betting';
import { calculateNextStake, calculatePotentialWin } from '@/lib/betting-strategies';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export function useBetting() {
  const queryClient = useQueryClient();
  const [currentSession, setCurrentSession] = useState<SessionData | null>(null);
  const [bettingState, setBettingState] = useState<BettingState>({});
  const [nextStake, setNextStake] = useState<number>(0);
  const [stakePercentage, setStakePercentage] = useState<number>(10); // Default 10% della cassa
  const [betOdds, setBetOdds] = useState<number>(1.8);
  const [potentialWin, setPotentialWin] = useState<number>(0);
  const [forceRefresh, setForceRefresh] = useState<number>(Date.now());

  // Get all sessions, filtered by strategy if specified
  const { 
    data: sessions,
    isLoading: sessionsLoading,
    error: sessionsError,
    refetch: refetchSessions
  } = useQuery({
    queryKey: ['/api/sessions', currentSession?.strategy],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/sessions');
      return await res.json();
    },
    enabled: true
  });

  // Get bets for current session
  const {
    data: bets,
    isLoading: betsLoading,
    error: betsError,
    refetch: refetchBets
  } = useQuery({
    queryKey: ['/api/sessions', currentSession?.id, 'bets', forceRefresh],
    queryFn: async () => {
      if (!currentSession?.id) return [];
      const res = await apiRequest('GET', `/api/sessions/${currentSession.id}/bets`);
      return await res.json();
    },
    enabled: !!currentSession?.id
  });

  // Create new session
  const createSessionMutation = useMutation({
    mutationFn: async (newSession: SessionData) => {
      const res = await apiRequest('POST', '/api/sessions', newSession);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/sessions', data.strategy] });
      setCurrentSession(data);
      resetBettingState(data.strategy);
      // Ricarica le sessioni per il filtro per strategia
      refetchSessions();
    }
  });

  // Update session
  const updateSessionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<SessionData> }) => {
      const res = await apiRequest('PATCH', `/api/sessions/${id}`, data);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/sessions', data.strategy] });
      queryClient.invalidateQueries({ queryKey: ['/api/sessions'] });
      setCurrentSession(data);
    }
  });

  // Delete session
  const deleteSessionMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/sessions/${id}`);
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['/api/sessions'] });
      if (currentSession?.id === id) {
        setCurrentSession(null);
      }
    }
  });

  // Add bet to session
  const addBetMutation = useMutation({
    mutationFn: async ({ sessionId, bet }: { sessionId: number, bet: BetData }) => {
      const res = await apiRequest('POST', `/api/sessions/${sessionId}/bets`, bet);
      return await res.json();
    },
    onSuccess: (data) => {
      // Forziamo l'aggiornamento anche quando aggiungiamo scommesse
      setForceRefresh(Date.now());
      
      // Invalida tutte le query correlate alle sessioni
      queryClient.invalidateQueries({ queryKey: ['/api/sessions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/sessions', data.session.strategy] });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/sessions', data.session.id, 'bets', forceRefresh] 
      });
      
      setCurrentSession(data.session);
      
      // Esplicitamente ricarica le scommesse
      refetchBets();
      
      // Ricarica le sessioni per il filtro per strategia
      refetchSessions();
      
      // Update betting state based on the new bet result
      const newBet = data.bet;
      updateBettingStateAfterBet(newBet.win);
    }
  });

  // Aggiorna la stake percentage quando cambia la sessione
  useEffect(() => {
    if (currentSession) {
      const settings: BettingStrategySettings = JSON.parse(currentSession.strategySettings);
      
      // Imposta la percentuale in base alla strategia
      if (currentSession.strategy === 'percentage' && settings.bankrollPercentage) {
        setStakePercentage(settings.bankrollPercentage);
      } else {
        // Default 10%
        setStakePercentage(10);
      }
      
      // Calcola lo stato di betting (level per D'Alembert, ecc.)
      if (!settings.targetReturn) {
        settings.targetReturn = currentSession.targetReturn;
      }
      
      console.log("DEBUG - Inizializzazione stato betting:", {
        strategy: currentSession.strategy,
        settings,
        initialBankroll: currentSession.initialBankroll, // Uso il bankroll iniziale, non quello corrente
      });
      
      const { updatedState } = calculateNextStake(
        currentSession.strategy,
        settings,
        currentSession.initialBankroll, // Uso il bankroll iniziale, non quello corrente
        undefined, // previousWin è undefined in fase di inizializzazione
        bettingState,
        2.0 // odds di default per Profit Fall
      );
      
      setBettingState(updatedState);
    }
  }, [currentSession]);

  // Aggiorna la puntata (valore in euro) quando la percentuale cambia
  useEffect(() => {
    if (currentSession) {
      // Calcola in base alla percentuale scelta e alla strategia
      const settings: BettingStrategySettings = JSON.parse(currentSession.strategySettings);
      
      // Calcola la puntata usando la funzione appropriata per ogni strategia
      const { stake } = calculateNextStake(
        currentSession.strategy,
        settings,
        currentSession.initialBankroll,
        undefined,
        bettingState,
        betOdds // usa le odds correnti per Profit Fall dinamico
      );
      setNextStake(stake);
    }
  }, [stakePercentage, currentSession, bettingState, betOdds]);

  // Update potential win when stake or odds change
  useEffect(() => {
    setPotentialWin(calculatePotentialWin(nextStake, betOdds));
  }, [nextStake, betOdds]);

  function updateBettingStateAfterBet(win: boolean) {
    if (!currentSession) return;
    
    const settings: BettingStrategySettings = JSON.parse(currentSession.strategySettings);
    
    // Assicuriamoci che il targetReturn sia sempre impostato
    if (!settings.targetReturn) {
      settings.targetReturn = currentSession.targetReturn;
    }
    
    // Debug per updateBettingStateAfterBet
    console.log("DEBUG - updateBettingStateAfterBet:", {
      strategy: currentSession.strategy,
      settings,
      initialBankroll: currentSession.initialBankroll, // Dovremmo usare questa
      currentBankroll: currentSession.currentBankroll,
      win,
      bettingState
    });
    
    const { stake, updatedState } = calculateNextStake(
      currentSession.strategy,
      settings,
      currentSession.initialBankroll, // CORREZIONE: usa bankroll INIZIALE, non corrente
      win,
      bettingState,
      betOdds // odds per Profit Fall
    );
    
    setBettingState(updatedState);
    
    // Ricalcola automaticamente la puntata per l'evento successivo
    setNextStake(stake);
  }

  function resetBettingState(strategy: BettingStrategy) {
    // Reset completo dello stato di betting in base alla strategia
    switch (strategy) {
      case 'dalembert':
        setBettingState({
          dalembert: { currentLevel: 0 }
        });
        break;
      case 'profitfall':
        setBettingState({
          profitfall: { 
            perditaAccumulata: 0, 
            stepCorrente: 1, 
            isSequenceActive: false 
          }
        });
        break;
      case 'masaniello':
        // Per Masaniello, inizializza con il bankroll della sessione corrente
        const initialBankroll = currentSession?.initialBankroll || 1000;
        const settings = currentSession ? JSON.parse(currentSession.strategySettings) : {};
        const totalEvents = settings.totalEvents || 5;
        
        setBettingState({
          masaniello: {
            currentEvent: 0,
            eventsWon: 0,
            eventsLost: 0,
            remainingBankroll: initialBankroll,
            eventResults: Array(totalEvents).fill('pending'),
            isCompleted: false,
            isSuccessful: undefined
          }
        });
        break;
      case 'kelly':
        setBettingState({
          kelly: {
            events: [],
            totalStakeAllocated: 0,
            isCompleted: false,
            sessionsCompleted: 0
          }
        });
        break;
      default:
        setBettingState({});
        break;
    }
  }

  // Create a new session and automatically save the current one
  function startNewSession(sessionData: Omit<SessionData, 'betCount' | 'wins' | 'losses'>) {
    // La sessione precedente viene automaticamente salvata nel DB
    // Non dobbiamo fare nulla in particolare perché è già stata salvata tramite addBetMutation
    
    // Reset dello stato corrente
    setCurrentSession(null);
    setBettingState({});
    
    // Crea la nuova sessione partendo da zero
    const newSession: SessionData = {
      ...sessionData,
      betCount: 0,
      wins: 0,
      losses: 0,
      currentBankroll: sessionData.initialBankroll
    };
    
    createSessionMutation.mutate(newSession);
  }

  // Place a new bet in the current session
  function placeBet(win: boolean) {
    if (!currentSession) return;
    
    console.log("DEBUG - placeBet start", { win, currentSession, bettingState });
    
    // Prima salviamo la puntata corrente per aggiungerla all'array
    const currentStake = nextStake;
    
    // Per PROFIT FALL, aggiorniamo lo stato della sequenza
    if (currentSession.strategy === 'profitfall') {
      const newState = { ...bettingState };
      if (!newState.profitfall) {
        newState.profitfall = { 
          perditaAccumulata: 0, 
          stepCorrente: 1, 
          isSequenceActive: false 
        };
      }
      
      // Se è una perdita, aggiunge la puntata alle perdite accumulate
      if (!win) {
        newState.profitfall.perditaAccumulata += currentStake;
        newState.profitfall.stepCorrente += 1;
        newState.profitfall.isSequenceActive = true;
      } else {
        // In caso di vincita, resetta la sequenza
        newState.profitfall.perditaAccumulata = 0;
        newState.profitfall.stepCorrente = 1;
        newState.profitfall.isSequenceActive = false;
      }
      
      setBettingState(newState);
    }

    // Per Masaniello, aggiorniamo lo stato specifico
    if (currentSession.strategy === 'masaniello') {
      const newState = { ...bettingState };
      if (newState.masaniello) {
        // Aggiorna i risultati dell'evento corrente
        newState.masaniello.eventResults[newState.masaniello.currentEvent] = win ? 'won' : 'lost';
        
        if (win) {
          newState.masaniello.eventsWon++;
          // Aggiorna la cassa residua con la vincita netta
          newState.masaniello.remainingBankroll = newState.masaniello.remainingBankroll + (potentialWin - currentStake);
        } else {
          newState.masaniello.eventsLost++;
          // Aggiorna la cassa residua sottraendo la puntata
          newState.masaniello.remainingBankroll = newState.masaniello.remainingBankroll - currentStake;
        }
        
        // Passa al prossimo evento
        newState.masaniello.currentEvent++;
        
        // Verifica se l'obiettivo è raggiunto o se è matematicamente impossibile
        const settings = JSON.parse(currentSession.strategySettings);
        const totalEvents = settings.totalEvents || 5;
        const minimumWins = settings.minimumWins || 3;
        const eventiRimanenti = totalEvents - newState.masaniello.currentEvent;
        const vittorieNecessarie = minimumWins - newState.masaniello.eventsWon;
        
        if (newState.masaniello.eventsWon >= minimumWins) {
          // Obiettivo raggiunto
          newState.masaniello.isCompleted = true;
          newState.masaniello.isSuccessful = true;
        } else if (vittorieNecessarie > eventiRimanenti) {
          // Obiettivo matematicamente impossibile
          newState.masaniello.isCompleted = true;
          newState.masaniello.isSuccessful = false;
        } else if (newState.masaniello.currentEvent >= totalEvents) {
          // Tutti gli eventi completati
          newState.masaniello.isCompleted = true;
          newState.masaniello.isSuccessful = (newState.masaniello.eventsWon >= minimumWins);
        }
        
        setBettingState(newState);
        
        console.log("DEBUG - Masaniello state updated:", {
          currentEvent: newState.masaniello.currentEvent,
          eventsWon: newState.masaniello.eventsWon,
          eventsLost: newState.masaniello.eventsLost,
          remainingBankroll: newState.masaniello.remainingBankroll,
          isCompleted: newState.masaniello.isCompleted,
          isSuccessful: newState.masaniello.isSuccessful
        });
      }
    }
    
    // Poi aggiorniamo lo stato di betting in base all'esito
    updateBettingStateAfterBet(win);
    
    // Debug post update
    console.log("DEBUG - dopo updateBettingStateAfterBet", { bettingState });
    
    const bankrollBefore = currentSession.currentBankroll;
    let bankrollAfter = bankrollBefore;
    
    if (win) {
      // On win, add potential win minus stake
      bankrollAfter += (potentialWin - currentStake);
    } else {
      // On loss, subtract stake
      bankrollAfter -= currentStake;
    }
    
    const newBet: BetData = {
      sessionId: currentSession.id,
      betNumber: currentSession.betCount + 1,
      stake: currentStake,
      odds: betOdds,
      potentialWin: potentialWin,
      win: win,
      bankrollBefore: bankrollBefore,
      bankrollAfter: bankrollAfter
    };
    
    console.log("DEBUG - Nuova scommessa in uscita", { newBet });
    addBetMutation.mutate({ sessionId: currentSession.id!, bet: newBet });
  }

  // Reset the current session
  function resetSession() {
    if (!currentSession) return;
    
    console.log("Avvio reset della sessione:", currentSession.id);
    
    // Prima eliminiamo tutte le scommesse dal server
    apiRequest('DELETE', `/api/sessions/${currentSession.id}/bets`)
      .then(() => {
        console.log("✅ Scommesse eliminate con successo");
        
        // Poi eliminiamo completamente la sessione dal database
        return apiRequest('DELETE', `/api/sessions/${currentSession.id}`);
      })
      .then(() => {
        console.log("✅ Sessione eliminata completamente");
        
        // Reset dello stato di betting dopo aver cancellato tutto
        resetBettingState(currentSession.strategy);
        
        // IMPORTANTE: Resettiamo completamente la sessione corrente per permettere la modifica dei parametri
        setCurrentSession(null);
        setBettingState({});
        
        // Invalidiamo manualmente le query per forzare un aggiornamento
        queryClient.invalidateQueries({ queryKey: ['sessions'] });
        queryClient.invalidateQueries({ queryKey: [`/api/sessions/${currentSession.id}/bets`] });
        queryClient.invalidateQueries({ queryKey: ['typed-sessions'] });
        queryClient.invalidateQueries({ queryKey: ['typed-bets'] });
        
        // Forziamo l'aggiornamento delle query
        setForceRefresh(Date.now());
        
        console.log("✅ Reset completato - ora puoi modificare i parametri");
      })
      .catch((error) => {
        console.error("Errore durante il reset della sessione:", error);
      });
  }

  return {
    // State
    sessions,
    currentSession,
    bets,
    nextStake,
    stakePercentage,
    betOdds,
    potentialWin,
    bettingState,
    
    // Loading states
    sessionsLoading,
    betsLoading,
    isCreatingSession: createSessionMutation.isPending,
    isUpdatingSession: updateSessionMutation.isPending,
    isDeletingSession: deleteSessionMutation.isPending,
    isPlacingBet: addBetMutation.isPending,
    
    // Errors
    sessionsError,
    betsError,
    
    // Actions
    setCurrentSession,
    setStakePercentage,
    setBetOdds,
    startNewSession,
    placeBet,
    resetSession,
    deleteSession: (id: number) => deleteSessionMutation.mutate(id),
    updateSession: ({ id, data }: { id: number; data: Partial<SessionData> }) => updateSessionMutation.mutate({ id, data })
  };
}
