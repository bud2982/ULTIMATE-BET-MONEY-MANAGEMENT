import { BettingStrategy, SessionData, BetData } from '@/types/betting';

// Interfaccia per le informazioni relative alla strategia utilizzate per la raccomandazione
export interface StrategyRecommendation {
  strategy: BettingStrategy;
  confidence: number; // valore tra 0 e 1
  reason: string;
}

// Interfaccia per le metriche di prestazione delle sessioni
interface SessionMetrics {
  winRate: number;
  avgOdds: number;
  volatility: number;
  roi: number;
  longestWinStreak: number;
  longestLoseStreak: number;
  streakiness: number; // tendenza a vincere/perdere consecutivamente
}

/**
 * Calcola le metriche di prestazione per una sessione specifica
 * @param session La sessione da analizzare
 * @param bets Le scommesse relative alla sessione
 * @returns Le metriche calcolate
 */
function calculateSessionMetrics(session: SessionData, bets: BetData[]): SessionMetrics {
  if (!bets.length) {
    return {
      winRate: 0,
      avgOdds: 0,
      volatility: 0,
      roi: 0,
      longestWinStreak: 0,
      longestLoseStreak: 0,
      streakiness: 0
    };
  }

  // Calcola il tasso di vincite
  const winRate = session.wins / session.betCount;
  
  // Calcola la quota media
  const avgOdds = bets.reduce((acc, bet) => acc + bet.odds, 0) / bets.length;
  
  // Calcola il ROI (Return on Investment)
  const roi = ((session.currentBankroll - session.initialBankroll) / session.initialBankroll) * 100;
  
  // Calcola la volatilità (deviazione standard delle variazioni di bankroll)
  let bankrollChanges: number[] = [];
  let previousBankroll = session.initialBankroll;
  
  bets.forEach(bet => {
    const change = bet.bankrollAfter - previousBankroll;
    bankrollChanges.push(change);
    previousBankroll = bet.bankrollAfter;
  });
  
  const avgChange = bankrollChanges.reduce((acc, change) => acc + change, 0) / bankrollChanges.length;
  const volatility = Math.sqrt(
    bankrollChanges.reduce((acc, change) => acc + Math.pow(change - avgChange, 2), 0) / bankrollChanges.length
  );
  
  // Calcola la lunghezza delle serie di vincite/perdite consecutive
  let currentWinStreak = 0;
  let currentLoseStreak = 0;
  let longestWinStreak = 0;
  let longestLoseStreak = 0;
  let winStreaks: number[] = [];
  let loseStreaks: number[] = [];
  
  bets.forEach(bet => {
    if (bet.win) {
      currentWinStreak++;
      if (currentLoseStreak > 0) {
        loseStreaks.push(currentLoseStreak);
        currentLoseStreak = 0;
      }
    } else {
      currentLoseStreak++;
      if (currentWinStreak > 0) {
        winStreaks.push(currentWinStreak);
        currentWinStreak = 0;
      }
    }
    
    longestWinStreak = Math.max(longestWinStreak, currentWinStreak);
    longestLoseStreak = Math.max(longestLoseStreak, currentLoseStreak);
  });
  
  // Aggiunge l'ultima serie in corso
  if (currentWinStreak > 0) winStreaks.push(currentWinStreak);
  if (currentLoseStreak > 0) loseStreaks.push(currentLoseStreak);
  
  // Calcola la "streakiness" (tendenza a vincere/perdere consecutivamente)
  // Alto valore = più streaky, basso valore = più alternato
  const avgWinStreak = winStreaks.length ? winStreaks.reduce((a, b) => a + b, 0) / winStreaks.length : 0;
  const avgLoseStreak = loseStreaks.length ? loseStreaks.reduce((a, b) => a + b, 0) / loseStreaks.length : 0;
  const streakiness = (avgWinStreak + avgLoseStreak) / 2;
  
  return {
    winRate,
    avgOdds,
    volatility,
    roi,
    longestWinStreak,
    longestLoseStreak,
    streakiness
  };
}

/**
 * Analizza le sessioni storiche e fornisce raccomandazioni sulle strategie di scommessa
 * @param sessions Tutte le sessioni disponibili
 * @param allBets Tutte le scommesse disponibili, raggruppate per sessionId
 * @returns Un array di raccomandazioni strategiche ordinate per confidenza
 */
export function recommendStrategies(
  sessions: SessionData[],
  allBets: Record<number, BetData[]>
): StrategyRecommendation[] {
  if (!sessions.length) {
    return [
      {
        strategy: 'flat',
        confidence: 0.7,
        reason: "Per iniziare, la strategia flat è la più sicura e semplice da gestire."
      }
    ];
  }

  // Calcola le metriche per ogni sessione
  const sessionMetrics = sessions.map(session => {
    const bets = allBets[session.id!] || [];
    return {
      session,
      metrics: calculateSessionMetrics(session, bets)
    };
  });

  // Calcola le metriche aggregate di tutte le sessioni
  const aggregateMetrics = {
    avgWinRate: sessionMetrics.reduce((acc, sm) => acc + sm.metrics.winRate, 0) / sessionMetrics.length,
    avgOdds: sessionMetrics.reduce((acc, sm) => acc + sm.metrics.avgOdds, 0) / sessionMetrics.length,
    avgVolatility: sessionMetrics.reduce((acc, sm) => acc + sm.metrics.volatility, 0) / sessionMetrics.length,
    avgROI: sessionMetrics.reduce((acc, sm) => acc + sm.metrics.roi, 0) / sessionMetrics.length,
    avgStreakiness: sessionMetrics.reduce((acc, sm) => acc + sm.metrics.streakiness, 0) / sessionMetrics.length,
    maxLoseStreak: Math.max(...sessionMetrics.map(sm => sm.metrics.longestLoseStreak)),
  };

  // Regole per raccomandazioni basate sui dati storici
  const recommendations: StrategyRecommendation[] = [];

  // FLAT: Raccomandato per utenti con bassa tolleranza al rischio o con alta volatilità
  const flatConfidence = calculateFlatConfidence(aggregateMetrics);
  recommendations.push({
    strategy: 'flat',
    confidence: flatConfidence,
    reason: getFlatRecommendationReason(aggregateMetrics, flatConfidence)
  });

  // PERCENTAGE: Buono per protezione del capitale con adattamento alle oscillazioni
  const percentageConfidence = calculatePercentageConfidence(aggregateMetrics);
  recommendations.push({
    strategy: 'percentage',
    confidence: percentageConfidence,
    reason: getPercentageRecommendationReason(aggregateMetrics, percentageConfidence)
  });

  // D'ALEMBERT: Adatto per chi ha frequenti serie di vincite/perdite alternate
  const dalembertConfidence = calculateDalembertConfidence(aggregateMetrics);
  recommendations.push({
    strategy: 'dalembert',
    confidence: dalembertConfidence,
    reason: getDalembertRecommendationReason(aggregateMetrics, dalembertConfidence)
  });

  // Qui in futuro sarà possibile aggiungere la raccomandazione per il tuo metodo personalizzato

  // Ordina le raccomandazioni per confidenza (dalla più alta alla più bassa)
  return recommendations.sort((a, b) => b.confidence - a.confidence);
}

// Funzioni di calcolo della confidenza per ogni strategia

function calculateFlatConfidence(metrics: any): number {
  // La strategia flat è consigliata per alta volatilità (l'utente vuole minimizzare il rischio)
  // o bassa streakiness (le vincite/perdite sono più casuali)
  let confidence = 0.5; // base
  
  if (metrics.avgVolatility > 0.1) confidence += 0.2;
  if (metrics.avgStreakiness < 1.5) confidence += 0.2;
  if (metrics.avgWinRate < 0.4) confidence += 0.1; // Con basso win rate meglio essere conservativi
  
  // Cap a 0.95
  return Math.min(0.95, confidence);
}

function calculatePercentageConfidence(metrics: any): number {
  // La strategia percentage è consigliata per chi ha bankroll variabile
  // e vuole adattare le puntate alla situazione corrente
  let confidence = 0.4; // base
  
  if (metrics.avgROI > 10) confidence += 0.2; // Buon ROI, può essere utile puntare di più
  if (metrics.avgWinRate > 0.5) confidence += 0.2; // Con alto win rate può aumentare il rischio
  if (metrics.avgVolatility > 0.05 && metrics.avgVolatility < 0.15) confidence += 0.1; // Volatilità media
  
  return Math.min(0.95, confidence);
}

function calculateDalembertConfidence(metrics: any): number {
  // D'Alembert è buono per chi ha serie di vincite/perdite alternate
  // e vuole recuperare le perdite gradualmente
  let confidence = 0.3; // base
  
  if (metrics.avgStreakiness < 2) confidence += 0.2; // Bassa streakiness = alternarsi di vincite/perdite
  if (metrics.avgOdds < 2.2) confidence += 0.2; // Quote basse funzionano meglio con D'Alembert
  if (metrics.maxLoseStreak < 4) confidence += 0.2; // Se non ci sono lunghe serie di perdite consecutive
  
  return Math.min(0.95, confidence);
}

// Qui si potrà inserire in futuro la funzione per calcolare la confidenza del tuo metodo personalizzato

// Funzioni per generare spiegazioni personalizzate

function getFlatRecommendationReason(metrics: any, confidence: number): string {
  if (confidence > 0.7) {
    return "La strategia flat (puntata fissa) è consigliata perché i tuoi pattern di scommessa mostrano una certa volatilità. Questa strategia ti aiuterà a minimizzare i rischi e mantenere un bankroll stabile.";
  } else if (confidence > 0.5) {
    return "La strategia flat è una scelta equilibrata che può aiutarti a gestire il rischio, anche se potrebbe non massimizzare i guadagni con il tuo attuale pattern di scommesse.";
  } else {
    return "La strategia flat è semplice e sicura, ma con il tuo profilo di scommessa potresti ottenere risultati migliori con altre strategie.";
  }
}

function getPercentageRecommendationReason(metrics: any, confidence: number): string {
  if (confidence > 0.7) {
    return "La strategia percentuale è fortemente consigliata perché il tuo ROI è buono e hai un win rate favorevole. Ti permetterà di ottimizzare il tuo bankroll adattando le puntate alla situazione corrente.";
  } else if (confidence > 0.5) {
    return "La strategia percentuale ti aiuterebbe ad adattare le puntate ai cambiamenti del tuo bankroll, il che potrebbe essere vantaggioso dato il tuo pattern di scommesse.";
  } else {
    return "La strategia percentuale potrebbe non essere la scelta ottimale per il tuo profilo di scommessa attuale.";
  }
}

function getDalembertRecommendationReason(metrics: any, confidence: number): string {
  if (confidence > 0.7) {
    return "Il sistema D'Alembert è altamente consigliato perché le tue scommesse mostrano un pattern di vincite e perdite alternate. Questa strategia ti aiuterà a recuperare gradualmente le perdite.";
  } else if (confidence > 0.5) {
    return "Il sistema D'Alembert potrebbe essere vantaggioso per te, soprattutto se continui a scommettere su quote basse e vuoi un approccio graduale per recuperare le perdite.";
  } else {
    return "Il sistema D'Alembert non sembra adattarsi al tuo attuale pattern di scommesse, che include serie troppo lunghe di perdite o quote troppo alte.";
  }
}

// Qui si potrà inserire in futuro la funzione per generare una spiegazione per il tuo metodo personalizzato