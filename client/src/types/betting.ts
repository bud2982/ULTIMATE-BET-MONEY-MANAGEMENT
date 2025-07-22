export type BettingStrategy = 'flat' | 'percentage' | 'dalembert' | 'profitfall' | 'masaniello' | 'kelly' | 'beat-delay';

export interface KellyEvent {
  id: string;
  name: string;
  quotaBookmaker: number;
  probabilitaStimata: number;
  stakeCalcolato?: number;
  kellyPercent?: number;
  eseguiScommessa?: boolean;
  risultato?: 'won' | 'lost' | 'pending';
}

export interface BettingStrategySettings {
  // Parametri per strategia flat
  flatStake?: number; // Puntata fissa per strategia flat
  bankrollPercentage?: number;
  dalembertUnit?: number;
  incrementPercentage?: number; // Percentuale di incremento per PROFIT FALL
  expectedEvents?: number;
  expectedWins?: number;
  avgOdds?: number;
  targetReturn?: number;
  // Parametri Masaniello
  totalEvents?: number; // Numero totale di eventi
  minimumWins?: number; // Numero minimo di eventi da vincere
  eventOdds?: number[]; // Quote dei singoli eventi
  riskFactor?: number; // Fattore di rischio (3%-8%)
  
  // Parametri Kelly Ridotto
  kellyFraction?: number; // Frazione del Kelly pieno (0.1-0.5)
  maxRiskPercentage?: number; // Rischio massimo simultaneo (es. 20%)
  maxSingleStake?: number; // Puntata massima per singolo evento
  events?: KellyEvent[]; // Eventi Kelly simultanei
  
  // Parametri Beat the Delay (D'Alembert + EV)
  baseStake?: number; // Unità base per D'Alembert
  maxLevels?: number; // Livelli massimi D'Alembert
  delayFactor?: number; // Fattore di ritardo
  resetAfterWin?: boolean; // Reset dopo vincita
  stopLoss?: number; // Stop loss (es. -6 step D'Alembert)
  targetProfit?: number; // Target di uscita
  
  // Parametri Profit Fall (nuovo sistema D'Alembert)
  stakeIniziale?: number; // Puntata iniziale scelta manualmente
  margineProfitto?: number; // Percentuale di guadagno desiderato (es. 10%)
  profitFallStopLoss?: number; // Massimo importo totale di perdita accettabile
}

export interface BetData {
  id?: number;
  sessionId?: number;
  betNumber: number;
  stake: number;
  odds: number;
  potentialWin: number;
  win: boolean;
  won?: boolean; // Alias per compatibilità
  profit?: number; // Profitto/perdita
  bankrollBefore: number;
  bankrollAfter: number;
  createdAt?: Date;
}

export interface SessionData {
  id?: number;
  userId?: number;
  name: string;
  initialBankroll: number;
  currentBankroll: number;
  targetReturn: number;
  strategy: BettingStrategy;
  betCount: number;
  wins: number;
  losses: number;
  createdAt?: Date;
  updatedAt?: Date;
  strategySettings: string; // JSON string of BettingStrategySettings
}

// Interfaccia per lo stato della strategia PROFIT FALL (nuovo sistema D'Alembert)
export interface ProfitFallState {
  perditaAccumulata: number; // Somma di tutte le puntate precedenti non vinte
  stepCorrente: number; // Step corrente della sequenza
  isSequenceActive: boolean; // Se la sequenza è attiva
}

export interface DalembertState {
  currentLevel: number;
}

export interface MasanielloState {
  currentEvent: number; // Evento corrente (0-based)
  eventsWon: number; // Eventi vinti finora
  eventsLost: number; // Eventi persi finora
  remainingBankroll: number; // Cassa residua
  eventResults: ('won' | 'lost' | 'pending')[]; // Risultati degli eventi
  isCompleted: boolean; // Se la sequenza è completata
  isSuccessful?: boolean; // Se l'obiettivo è stato raggiunto
}

export interface KellyState {
  events: KellyEvent[]; // Eventi Kelly simultanei
  totalStakeAllocated: number; // Stake totale allocato
  isCompleted: boolean; // Se tutti gli eventi sono completati
  sessionsCompleted: number; // Numero di sessioni completate
}

export interface BeatDelayState {
  level: number; // Livello D'Alembert attuale
  consecutiveLosses: number; // Perdite consecutive
  totalStaked: number; // Totale puntato
  currentSign: '1' | 'X' | '2' | null; // Segno attualmente monitorato
  currentDelay: number; // Ritardo attuale del segno
  historicalFrequency: number; // Frequenza storica (%)
  avgDelay: number; // Ritardo medio storico
  maxDelay: number; // Ritardo massimo storico
  currentOdds: number; // Quota attuale
  captureRate: number; // Tasso di successo del sistema (%)
  estimatedProbability: number; // Probabilità stimata
  expectedValue: number; // Valore atteso (EV)
  shouldPlay: boolean; // Se entrare nel ciclo D'Alembert
}

export interface BettingState {
  profitfall?: ProfitFallState; // Stato per la strategia PROFIT FALL
  dalembert?: DalembertState;
  masaniello?: MasanielloState; // Stato per la strategia Masaniello
  kelly?: KellyState; // Stato per la strategia Kelly Ridotto
  beatDelay?: BeatDelayState; // Stato per la strategia Beat the Delay
}
