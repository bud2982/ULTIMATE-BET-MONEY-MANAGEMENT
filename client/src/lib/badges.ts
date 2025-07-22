import { SessionData, BetData } from "@/types/betting";

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string; // Emoji o icona 
  level: 'bronze' | 'silver' | 'gold' | 'platinum';
  unlocked: boolean;
}

// Funzione principale per calcolare tutti i badge per una sessione
export function calculateBadges(session: SessionData, bets: BetData[]): Badge[] {
  if (!session || !bets) return [];
  
  const badges: Badge[] = [
    // Badge per serie di vittorie consecutive
    {
      id: 'streak_1',
      name: 'Principiante Fortunato',
      description: 'Ottieni 2 vittorie consecutive',
      icon: '🎯',
      level: 'bronze',
      unlocked: hasWinningStreak(bets, 2)
    },
    {
      id: 'streak_2',
      name: 'Sulla Cresta dell\'Onda',
      description: 'Ottieni 3 vittorie consecutive',
      icon: '🌊',
      level: 'silver',
      unlocked: hasWinningStreak(bets, 3)
    },
    {
      id: 'streak_3',
      name: 'In Serie',
      description: 'Ottieni 5 vittorie consecutive',
      icon: '🔥',
      level: 'gold',
      unlocked: hasWinningStreak(bets, 5)
    },
    {
      id: 'streak_4',
      name: 'Invincibile',
      description: 'Ottieni 7+ vittorie consecutive',
      icon: '⚡',
      level: 'platinum',
      unlocked: hasWinningStreak(bets, 7)
    },
    
    // Badge per numero totale di vittorie
    {
      id: 'wins_1',
      name: 'Prima Vittoria',
      description: 'Vinci la tua prima scommessa',
      icon: '🏆',
      level: 'bronze',
      unlocked: countWins(bets) >= 1
    },
    {
      id: 'wins_2',
      name: 'Collezionista',
      description: 'Raggiungi 5 vittorie totali',
      icon: '🏅',
      level: 'silver',
      unlocked: countWins(bets) >= 5
    },
    {
      id: 'wins_3',
      name: 'Campione',
      description: 'Raggiungi 10 vittorie totali',
      icon: '👑',
      level: 'gold',
      unlocked: countWins(bets) >= 10
    },
    {
      id: 'wins_4',
      name: 'Leggenda',
      description: 'Raggiungi 20+ vittorie totali',
      icon: '🌟',
      level: 'platinum',
      unlocked: countWins(bets) >= 20
    },
    
    // Badge per ROI positivo
    {
      id: 'roi_1',
      name: 'Profitto Iniziale',
      description: 'Raggiungi un ROI positivo',
      icon: '📈',
      level: 'bronze',
      unlocked: calculateROI(session) > 0
    },
    {
      id: 'roi_2',
      name: 'Investitore Solido',
      description: 'Raggiungi un ROI del 10%',
      icon: '💰',
      level: 'silver',
      unlocked: calculateROI(session) >= 10
    },
    {
      id: 'roi_3',
      name: 'Investitore Esperto',
      description: 'Raggiungi un ROI del 25%',
      icon: '💸',
      level: 'gold',
      unlocked: calculateROI(session) >= 25
    },
    {
      id: 'roi_4',
      name: 'Guru degli Investimenti',
      description: 'Raggiungi un ROI del 50%+',
      icon: '🤑',
      level: 'platinum',
      unlocked: calculateROI(session) >= 50
    },
    
    // Badge per recupero dopo perdite consecutive
    {
      id: 'recovery_1',
      name: 'Resiliente',
      description: 'Vinci dopo 2 perdite consecutive',
      icon: '🛡️',
      level: 'bronze',
      unlocked: hasRecoveryAfterLosses(bets, 2)
    },
    {
      id: 'recovery_2',
      name: 'Rimonta',
      description: 'Vinci dopo 3 perdite consecutive',
      icon: '🔄',
      level: 'silver',
      unlocked: hasRecoveryAfterLosses(bets, 3)
    },
    {
      id: 'recovery_3',
      name: 'Fenice',
      description: 'Vinci dopo 4 perdite consecutive',
      icon: '🦅',
      level: 'gold',
      unlocked: hasRecoveryAfterLosses(bets, 4)
    },
    {
      id: 'recovery_4',
      name: 'Rinascita',
      description: 'Torna in positivo dopo aver perso il 30%+ del bankroll',
      icon: '🌈',
      level: 'platinum',
      unlocked: hasComeback(bets, session, 30)
    },
    
    // Badge per D'Alembert
    {
      id: 'dalembert_1',
      name: 'Alchemista Principiante',
      description: 'Raggiungi il livello 2 nella progressione D\'Alembert',
      icon: '🧪',
      level: 'bronze',
      unlocked: session.strategy === 'dalembert' && hasDalembertProgression(bets, 2)
    },
    {
      id: 'dalembert_2',
      name: 'Alchemista Esperto',
      description: 'Raggiungi il livello 3 nella progressione D\'Alembert',
      icon: '⚗️',
      level: 'silver',
      unlocked: session.strategy === 'dalembert' && hasDalembertProgression(bets, 3)
    },
    {
      id: 'dalembert_3',
      name: 'Maestro D\'Alembert',
      description: 'Raggiungi il livello 5 nella progressione D\'Alembert',
      icon: '🔮',
      level: 'gold',
      unlocked: session.strategy === 'dalembert' && hasDalembertProgression(bets, 5)
    },
    
    // Badge per disciplina nelle scommesse
    {
      id: 'discipline_1',
      name: 'Disciplinato',
      description: 'Completa 10+ scommesse seguendo rigorosamente la strategia',
      icon: '📊',
      level: 'gold',
      unlocked: bets.length >= 10 && hasDiscipline(bets, session)
    },
    
    // Badge per raggiungimento del target
    {
      id: 'target_1',
      name: 'Obiettivo Raggiunto',
      description: 'Raggiungi il target ROI impostato',
      icon: '🎯',
      level: 'platinum',
      unlocked: session.currentBankroll >= session.initialBankroll * (1 + session.targetReturn / 100)
    }
  ];
  
  return badges;
}

// Funzioni helper per verificare le condizioni di sblocco dei badge

// Verifica se c'è una serie di vittorie consecutive
function hasWinningStreak(bets: BetData[], count: number): boolean {
  let currentStreak = 0;
  let maxStreak = 0;
  
  for (const bet of bets) {
    if (bet.win) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }
  
  return maxStreak >= count;
}

// Conta il numero totale di vittorie
function countWins(bets: BetData[]): number {
  return bets.filter(bet => bet.win).length;
}

// Calcola il ROI (Return on Investment) per la sessione
function calculateROI(session: SessionData): number {
  return ((session.currentBankroll / session.initialBankroll) - 1) * 100;
}

// Verifica se c'è stato un recupero dopo un certo numero di perdite consecutive
function hasRecoveryAfterLosses(bets: BetData[], lossesCount: number): boolean {
  let consecutiveLosses = 0;
  
  for (let i = 0; i < bets.length; i++) {
    if (!bets[i].win) {
      consecutiveLosses++;
      
      // Se abbiamo raggiunto il numero richiesto di perdite consecutive
      // e la scommessa successiva è una vincita, abbiamo un recupero
      if (consecutiveLosses >= lossesCount && i + 1 < bets.length && bets[i + 1].win) {
        return true;
      }
    } else {
      consecutiveLosses = 0;
    }
  }
  
  return false;
}

/**
 * Verifica se in una sessione c'è stato un importante recupero
 * dopo un periodo di perdite significative
 */
function hasComeback(bets: BetData[], session: SessionData, percentageDown: number): boolean {
  if (bets.length < 3) return false;
  
  let lowestBankroll = session.initialBankroll;
  let lowestIndex = -1;
  
  // Trova il punto più basso del bankroll
  for (let i = 0; i < bets.length; i++) {
    if (bets[i].bankrollAfter < lowestBankroll) {
      lowestBankroll = bets[i].bankrollAfter;
      lowestIndex = i;
    }
  }
  
  // Se non abbiamo trovato un punto basso significativo o è l'ultima scommessa
  if (lowestIndex === -1 || lowestIndex === bets.length - 1) return false;
  
  // Calcola quanto è sceso il bankroll in percentuale
  const dropPercentage = ((session.initialBankroll - lowestBankroll) / session.initialBankroll) * 100;
  
  // Verifica se la perdita è stata significativa (almeno la percentuale specificata)
  if (dropPercentage < percentageDown) return false;
  
  // Verifica se c'è stato un recupero dopo il punto più basso
  return session.currentBankroll > lowestBankroll && session.currentBankroll >= session.initialBankroll;
}

/**
 * Verifica se il giocatore ha seguito una progressione D'Alembert
 * raggiungendo almeno il livello specificato
 */
function hasDalembertProgression(bets: BetData[], minLevel: number): boolean {
  // Se non ci sono abbastanza scommesse, non possiamo avere una progressione
  if (bets.length < minLevel) return false;
  
  let maxLevel = 0;
  let currentLevel = 0;
  
  for (let i = 0; i < bets.length; i++) {
    // In D'Alembert, il livello aumenta dopo una perdita e diminuisce dopo una vincita
    if (!bets[i].win) {
      currentLevel++;
      maxLevel = Math.max(maxLevel, currentLevel);
    } else if (currentLevel > 0) {
      currentLevel--;
    }
  }
  
  return maxLevel >= minLevel;
}

/**
 * Verifica se il giocatore ha mantenuto disciplina non superando
 * le puntate suggerite dalla strategia
 */
function hasDiscipline(bets: BetData[], session: SessionData): boolean {
  // Implementazione semplificata: verifichiamo che nessuna scommessa superi il 20% del bankroll iniziale
  const maxAllowedStake = session.initialBankroll * 0.2;
  
  return !bets.some(bet => bet.stake > maxAllowedStake);
}