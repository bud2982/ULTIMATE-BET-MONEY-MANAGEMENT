import { BettingStrategy, BettingStrategySettings, BettingState } from "@/types/betting";

/**
 * Calcola la prossima puntata in base alla strategia selezionata
 * @param strategy La strategia di scommessa (flat, percentage, dalembert, masaniello)
 * @param settings Le impostazioni della strategia
 * @param initialBankroll Il bankroll iniziale (NON quello corrente)
 * @param previousWin Indica se la scommessa precedente è stata vinta o persa (undefined per la prima scommessa)
 * @param bettingState Lo stato attuale delle scommesse
 * @returns La puntata calcolata e lo stato aggiornato
 */
export function calculateNextStake(
  strategy: BettingStrategy,
  settings: BettingStrategySettings,
  initialBankroll: number,
  previousWin?: boolean,
  bettingState: BettingState = {},
  currentOdds?: number
): { stake: number; updatedState: BettingState } {
  // Default return value
  let stake = 0;
  // Create a copy of the betting state to update
  const updatedState: BettingState = JSON.parse(JSON.stringify(bettingState));
  
  // Registriamo i parametri di input per debug
  console.log("DEBUG - calculateNextStake input:", {
    strategy,
    settings,
    initialBankroll,
    previousWin,
    bettingState
  });
  
  // Gestiamo le strategie disponibili
  switch (strategy) {
    case 'flat':
      // Puntata fissa - usa flatStake o un valore di default
      stake = settings.flatStake || settings.baseStake || settings.dalembertUnit || 10;
      break;

    case 'percentage':
      // Calculate stake as percentage of initial bankroll
      stake = initialBankroll * ((settings.bankrollPercentage || 0) / 100);
      break;

    case 'dalembert':
      // Initialize if needed
      if (!bettingState.dalembert) {
        updatedState.dalembert = { currentLevel: 0 };
      }

      // Update level based on previous bet result
      if (previousWin !== undefined) {
        if (previousWin) {
          // Decrease level after win (never below 0)
          updatedState.dalembert!.currentLevel = Math.max(
            0, 
            (bettingState.dalembert?.currentLevel || 0) - 1
          );
        } else {
          // Increase level after loss
          updatedState.dalembert!.currentLevel = (bettingState.dalembert?.currentLevel || 0) + 1;
        }
      }

      // D'Alembert usa dalembertUnit come unità base in euro
      const dalembertUnit = settings.dalembertUnit || 10; // Default 10€ se non specificato
      
      // L'unità base è semplicemente il valore in euro impostato dall'utente
      const baseUnit = dalembertUnit;
      
      // Calcola la puntata in base al livello attuale di D'Alembert
      const levelMultiplier = 1 + updatedState.dalembert!.currentLevel;
      
      // La puntata finale è semplicemente l'unità base moltiplicata per il livello
      stake = baseUnit * levelMultiplier;
      
      // Arrotondiamo per avere al massimo 2 decimali
      stake = Math.round(stake * 100) / 100;
      
      console.log("D'Alembert calculation:", {
        initialBankroll,
        dalembertUnit,
        baseUnit,
        currentLevel: updatedState.dalembert!.currentLevel,
        levelMultiplier,
        finalStake: stake
      });
      break;

    case 'profitfall':
      // Inizializza se necessario
      if (!bettingState.profitfall) {
        updatedState.profitfall = { 
          perditaAccumulata: 0, 
          stepCorrente: 1, 
          isSequenceActive: false,
          stakePrecedente: 0
        };
      }
      
      // Parametri dalla configurazione - Sistema Ibrido Bilanciato
      const stakeIniziale = settings.stakeIniziale || 10; // Default 10€
      const margineProfitto = (settings.margineProfitto || 10) / 100; // Default 10% convertito in decimale
      const profitFallStopLoss = settings.profitFallStopLoss || 100; // Default 100€
      const quotaStepCorrente = currentOdds || 2.0; // Quota dinamica dello step corrente
      
      // Parametri Sistema Ibrido
      const fattoreRecupero = settings.fattoreRecupero || 0.65; // 65% recupero parziale (bilanciato)
      const aumentoMassimoStep = settings.aumentoMassimoStep || (stakeIniziale * 1.5); // 1.5x stake iniziale
      const capMassimoAssoluto = settings.capMassimoAssoluto || (stakeIniziale * 10); // 10x stake iniziale
      const usaQuotaReale = settings.usaQuotaReale !== false; // Default true (quote variabili)
      const quotaRiferimento = settings.quotaRiferimento || 2.0; // Quota fissa per calcoli
      
      // Controllo Stop Loss
      if (updatedState.profitfall!.perditaAccumulata >= profitFallStopLoss) {
        // Stop Loss raggiunto - interrompe la sequenza
        updatedState.profitfall!.isSequenceActive = false;
        stake = 0;
        console.log("PROFIT FALL IBRIDO - Stop Loss raggiunto:", {
          perditaAccumulata: updatedState.profitfall!.perditaAccumulata,
          profitFallStopLoss
        });
        break;
      }
      
      // GESTIONE VINCITA: Continuazione Intelligente
      if (previousWin === true) {
        // Calcola quanto abbiamo recuperato con la vincita precedente
        const stakePrecedente = updatedState.profitfall!.stakePrecedente || 0;
        const vincitaNetta = stakePrecedente * (quotaStepCorrente - 1);
        
        // Aggiorna le perdite residue
        const nuovePerditaAccumulata = Math.max(0, updatedState.profitfall!.perditaAccumulata - vincitaNetta);
        
        if (nuovePerditaAccumulata <= 0) {
          // OBIETTIVO RAGGIUNTO: Recupero completo + profit
          console.log("🎉 PROFIT FALL IBRIDO - OBIETTIVO RAGGIUNTO! Profit realizzato!");
          updatedState.profitfall!.perditaAccumulata = 0;
          updatedState.profitfall!.stepCorrente = 1;
          updatedState.profitfall!.isSequenceActive = false;
          updatedState.profitfall!.stakePrecedente = 0;
          stake = stakeIniziale; // Reset alla puntata iniziale
        } else {
          // CONTINUAZIONE INTELLIGENTE: Continua con le perdite residue
          console.log("📈 PROFIT FALL IBRIDO - Continuazione intelligente con perdite residue:", nuovePerditaAccumulata);
          updatedState.profitfall!.perditaAccumulata = nuovePerditaAccumulata;
          updatedState.profitfall!.stepCorrente++; // Continua la sequenza
          updatedState.profitfall!.isSequenceActive = true;
          
          // Calcola la prossima puntata per le perdite residue
          const perditeRecuperabili = nuovePerditaAccumulata * fattoreRecupero;
          const guadagnoDesiderato = stakeIniziale * margineProfitto;
          const obiettivo = perditeRecuperabili + guadagnoDesiderato;
          
          // Scegli quota per calcolo
          const quotaCalcolo = usaQuotaReale ? quotaStepCorrente : quotaRiferimento;
          
          // Calcola puntata base
          const puntataBase = obiettivo / (quotaCalcolo - 1);
          
          // Applica limite graduale
          const puntataConGradini = Math.min(puntataBase, stakePrecedente + aumentoMassimoStep);
          
          // Applica cap assoluto
          stake = Math.min(puntataConGradini, capMassimoAssoluto);
        }
      }
      // Se è il primo step (SEMPRE stake iniziale fisso)
      else if (updatedState.profitfall!.stepCorrente === 1) {
        stake = stakeIniziale;
        updatedState.profitfall!.isSequenceActive = true;
        updatedState.profitfall!.stakePrecedente = stakeIniziale;
      }
      // Per step >= 2: Formula Ibrida con Recupero Parziale + Controlli di Sicurezza
      else {
        // STEP 1: Calcola obiettivo con recupero parziale
        const perditeRecuperabili = updatedState.profitfall!.perditaAccumulata * fattoreRecupero;
        const guadagnoDesiderato = stakeIniziale * margineProfitto;
        const obiettivo = perditeRecuperabili + guadagnoDesiderato;
        
        // STEP 2: Scegli quota per calcolo
        const quotaCalcolo = usaQuotaReale ? quotaStepCorrente : quotaRiferimento;
        
        if (quotaCalcolo <= 1) {
          console.error("PROFIT FALL IBRIDO - Quota non valida:", quotaCalcolo);
          stake = stakeIniziale; // Fallback alla puntata iniziale
        } else {
          // STEP 3: Calcola puntata base
          const puntataBase = obiettivo / (quotaCalcolo - 1);
          
          // STEP 4: Applica limite graduale
          const stakePrecedente = updatedState.profitfall!.stakePrecedente || stakeIniziale;
          const puntataConGradini = Math.min(puntataBase, stakePrecedente + aumentoMassimoStep);
          
          // STEP 5: Applica cap assoluto
          stake = Math.min(puntataConGradini, capMassimoAssoluto);
        }
        
        // Aggiorna lo stake precedente per il prossimo calcolo
        updatedState.profitfall!.stakePrecedente = stake;
      }
      
      // Arrotondiamo per avere al massimo 2 decimali
      stake = Math.round(stake * 100) / 100;
      
      console.log("PROFIT FALL IBRIDO calculation:", {
        sistema: "Ibrido Bilanciato con Quote Variabili e Continuazione Intelligente",
        stakeIniziale,
        margineProfitto: margineProfitto * 100 + '%',
        fattoreRecupero: fattoreRecupero * 100 + '%',
        aumentoMassimoStep,
        capMassimoAssoluto,
        usaQuotaReale,
        quotaRiferimento,
        quotaStepCorrente,
        profitFallStopLoss,
        perditaAccumulata: updatedState.profitfall!.perditaAccumulata,
        stepCorrente: updatedState.profitfall!.stepCorrente,
        stakePrecedente: updatedState.profitfall!.stakePrecedente,
        isSequenceActive: updatedState.profitfall!.isSequenceActive,
        previousWin,
        perditeRecuperabili: updatedState.profitfall!.stepCorrente > 1 ? 
          (updatedState.profitfall!.perditaAccumulata * fattoreRecupero) : null,
        guadagnoDesiderato: updatedState.profitfall!.stepCorrente > 1 ? 
          (stakeIniziale * margineProfitto) : null,
        obiettivo: updatedState.profitfall!.stepCorrente > 1 ? 
          (updatedState.profitfall!.perditaAccumulata * fattoreRecupero + stakeIniziale * margineProfitto) : null,
        finalStake: stake
      });
      break;

    case 'masaniello':
      // Inizializza lo stato Masaniello se necessario
      if (!bettingState.masaniello) {
        const totalEvents = settings.totalEvents || 5;
        updatedState.masaniello = {
          currentEvent: 0,
          eventsWon: 0,
          eventsLost: 0,
          remainingBankroll: initialBankroll,
          eventResults: Array(totalEvents).fill('pending'),
          isCompleted: false,
          isSuccessful: undefined
        };
      }

      // Assicurati che la cassa residua sia inizializzata correttamente
      if (updatedState.masaniello && updatedState.masaniello.remainingBankroll === 0 && updatedState.masaniello.currentEvent === 0) {
        updatedState.masaniello.remainingBankroll = initialBankroll;
      }

      const masanielloState = updatedState.masaniello!;
      const totalEvents = settings.totalEvents || 5;
      const minimumWins = settings.minimumWins || 3;
      const riskFactor = (settings.riskFactor || 5) / 100; // Default 5%
      
      // Verifica se la sequenza è completata
      if (masanielloState.isCompleted) {
        stake = 0;
        break;
      }

      // Calcola errori tollerabili e variabili di stato
      const erroriTollerabili = totalEvents - minimumWins;
      const eventiRimanenti = totalEvents - masanielloState.currentEvent;
      const cassaResidua = masanielloState.remainingBankroll;
      const erroriAttuali = masanielloState.eventsLost;
      
      // Verifica se l'obiettivo è già raggiunto
      if (masanielloState.eventsWon >= minimumWins) {
        // Obiettivo raggiunto
        updatedState.masaniello!.isCompleted = true;
        updatedState.masaniello!.isSuccessful = true;
        stake = 0;
        break;
      }

      // Interrompere se il numero di vittorie ancora necessarie supera gli eventi rimanenti.
      // A quel punto è matematicamente impossibile raggiungere l'obiettivo.
      const vittorieNecessarie = minimumWins - masanielloState.eventsWon;
      if (vittorieNecessarie > eventiRimanenti) {
        // Obiettivo matematicamente impossibile
        updatedState.masaniello!.isCompleted = true;
        updatedState.masaniello!.isSuccessful = false;
        stake = 0;
        console.log("Masaniello - Obiettivo matematicamente impossibile:", {
          vittorieNecessarie,
          eventiRimanenti,
          eventsWon: masanielloState.eventsWon,
          minimumWins
        });
        break;
      }

      // Calcola la puntata secondo la formula Masaniello
      const denominatore = Math.max(1.0, eventiRimanenti - erroriTollerabili + erroriAttuali);
      stake = (cassaResidua * riskFactor) / denominatore;
      
      // Assicurati che la puntata non superi la cassa residua
      stake = Math.min(stake, cassaResidua * 0.9); // Massimo 90% della cassa residua
      
      // Arrotonda a 2 decimali
      stake = Math.round(stake * 100) / 100;

      console.log("Masaniello calculation:", {
        currentEvent: masanielloState.currentEvent + 1,
        totalEvents,
        minimumWins,
        eventsWon: masanielloState.eventsWon,
        eventsLost: masanielloState.eventsLost,
        eventiRimanenti,
        erroriTollerabili,
        erroriAttuali,
        cassaResidua,
        riskFactor: riskFactor * 100 + '%',
        denominatore,
        finalStake: stake
      });
      break;

    case 'kelly':
      // Inizializza lo stato Kelly se necessario
      if (!bettingState.kelly) {
        updatedState.kelly = {
          events: [],
          totalStakeAllocated: 0,
          isCompleted: false,
          sessionsCompleted: 0
        };
      }

      const kellyState = updatedState.kelly!;
      const kellyFraction = settings.kellyFraction || 0.25; // Default 25%
      const maxRiskPercentage = settings.maxRiskPercentage || 0.20; // Default 20%
      const maxSingleStake = settings.maxSingleStake || initialBankroll * 0.10; // Default 10%
      const events = settings.events || [];

      // Calcola lo stake totale possibile
      const maxTotalStake = initialBankroll * maxRiskPercentage;
      let totalCalculatedStake = 0;

      // Per Kelly, calcoliamo lo stake come somma di tutti gli eventi eseguibili
      for (const evento of events) {
        const stakeCalcolato = calcolaStakeKelly(
          evento.quotaBookmaker,
          evento.probabilitaStimata,
          initialBankroll,
          kellyFraction,
          maxSingleStake
        );

        if (stakeCalcolato.eseguiScommessa) {
          totalCalculatedStake += stakeCalcolato.stake;
        }
      }

      // Applica il cap di rischio simultaneo
      if (totalCalculatedStake > maxTotalStake) {
        const fattoreRiduzione = maxTotalStake / totalCalculatedStake;
        totalCalculatedStake = maxTotalStake;
      }

      stake = totalCalculatedStake;

      console.log("Kelly Ridotto calculation:", {
        kellyFraction: kellyFraction * 100 + '%',
        maxRiskPercentage: maxRiskPercentage * 100 + '%',
        maxSingleStake,
        eventsCount: events.length,
        totalCalculatedStake,
        finalStake: stake
      });
      break;

    case 'beat-delay':
      // Traduzione esatta del codice Python fornito
      const beatDelaySettings = settings as any;
      
      // INPUT dal settings (sostituiscono le variabili Python)
      const frequenza_storica = beatDelaySettings.historicalFrequency || 0.39;
      const ritardo_attuale = beatDelaySettings.currentDelay || 0;
      const ritardo_medio = beatDelaySettings.avgDelay || 11;
      const ritardo_massimo = beatDelaySettings.maxDelay || 18;
      const quotaBeatDelay = beatDelaySettings.currentOdds || 3.20;
      const unit_base = beatDelaySettings.baseStake || 5;
      
      // Storico esiti dalla betting state
      if (!bettingState.beatDelay) {
        updatedState.beatDelay = {
          level: 0,
          consecutiveLosses: 0,
          totalStaked: 0,
          currentSign: null,
          currentDelay: ritardo_attuale,
          historicalFrequency: frequenza_storica,
          avgDelay: ritardo_medio,
          maxDelay: ritardo_massimo,
          currentOdds: quotaBeatDelay,
          captureRate: 0.75,
          estimatedProbability: 0,
          expectedValue: 0,
          shouldPlay: false
        };
      }
      
      const storico_esiti: boolean[] = []; // Qui andrebbe il vero storico delle scommesse
      
      // 1. Calcolo probabilità stimata (funzione Python tradotta)
      const calcola_probabilita = (frequenza_storica: number, ritardo_attuale: number, ritardo_massimo: number): number => {
        let p = frequenza_storica;
        if (ritardo_attuale >= ritardo_massimo * 0.90) {
          p *= 1.05; // incremento del 5% se vicino al massimo
        }
        return Math.min(p, 1.0);
      };
      
      // 2. Calcolo del valore atteso (EV) (funzione Python tradotta)
      const calcola_ev = (p: number, quotaParam: number): number => {
        return p * (quotaParam - 1) - (1 - p);
      };
      
      // 3. Verifica se giocare o meno (funzione Python tradotta)
      const should_play = (ritardo_attuale: number, ritardo_medio: number, ritardo_massimo: number, ev: number): boolean => {
        return (
          ritardo_attuale >= ritardo_medio * 1.10 ||
          ritardo_attuale >= ritardo_massimo * 0.90
        ) && ev >= 0;
      };
      
      // 4. Calcolo puntata con D'Alembert (funzione Python tradotta)
      const calcola_puntata_dalembert = (esiti: boolean[], unit_base: number): number => {
        let step = 0;
        for (const esito of esiti) {
          step += !esito ? 1 : -1; // +1 per perdita, -1 per vincita
        }
        step = Math.max(step, 0);
        return unit_base * (1 + step);
      };
      
      // --- Simulazione del processo (esatta come Python) ---
      const p = calcola_probabilita(frequenza_storica, ritardo_attuale, ritardo_massimo);
      const ev = calcola_ev(p, quotaBeatDelay);
      const giocare = should_play(ritardo_attuale, ritardo_medio, ritardo_massimo, ev);
      
      // Aggiorna lo stato
      updatedState.beatDelay!.estimatedProbability = p;
      updatedState.beatDelay!.expectedValue = ev;
      updatedState.beatDelay!.shouldPlay = giocare;
      
      if (giocare) {
        stake = calcola_puntata_dalembert(storico_esiti, unit_base);
      } else {
        stake = 0; // Non è consigliato scommettere
      }

      console.log("--- DECISIONE Beat the Delay ---");
      console.log(`Probabilità stimata: ${p.toFixed(2)}`);
      console.log(`Valore Atteso (EV): ${ev.toFixed(3)}`);
      console.log(`Condizioni OK per giocare? ${giocare}`);
      if (giocare) {
        console.log(`Puntata da fare: ${stake.toFixed(2)} euro`);
      } else {
        console.log("Non è consigliato scommettere in questo momento.");
      }
      break;
  }

  return { stake, updatedState };
}

/**
 * Implementazione esatta della funzione kelly_ridotto Python
 */
function kelly_ridotto(quota: number, prob_iniziale: number, riduzione: number) {
  const prob_implicita = 1 / quota;
  let prob_cor = prob_iniziale / prob_implicita;
  if (prob_cor > 1) {
    prob_cor = 1.0;
  }
  const q = 1 - prob_cor;
  const b = quota - 1;
  const f_classico = (b * prob_cor - q) / b;
  let f_ridotto = riduzione * f_classico;
  if (f_ridotto < 0) {
    f_ridotto = 0;
  }
  return {
    probabilità_iniziale: prob_iniziale,
    probabilità_normalizzata: prob_cor,
    puntata_kelly_classico: f_classico,
    puntata_kelly_ridotto: f_ridotto,
  };
}

/**
 * Calcola lo stake per un singolo evento usando la funzione kelly_ridotto
 */
function calcolaStakeKelly(
  quotaBookmaker: number,
  probabilitaStimata: number,
  bankrollAttuale: number,
  frazioneKelly: number,
  stakeMassimoSingolo: number
): { stake: number; kellyPercent: number; eseguiScommessa: boolean } {
  // Usa la funzione kelly_ridotto esatta
  const risultato = kelly_ridotto(quotaBookmaker, probabilitaStimata, frazioneKelly);

  if (risultato.puntata_kelly_ridotto <= 0) {
    return { stake: 0, kellyPercent: risultato.puntata_kelly_ridotto, eseguiScommessa: false };
  }

  // Calcola lo stake usando la frazione Kelly ridotta
  let stake = bankrollAttuale * risultato.puntata_kelly_ridotto;

  // Applica il cap per singolo evento
  stake = Math.min(stake, stakeMassimoSingolo);

  // Arrotonda a 2 decimali
  stake = Math.round(stake * 100) / 100;

  return { stake, kellyPercent: risultato.puntata_kelly_ridotto, eseguiScommessa: true };
}

/**
 * Qui si potrebbe inserire in futuro il tuo metodo personalizzato che andrà a sostituire Masaniello
 * Questa sarà la base per implementare la tua strategia su misura
 */

export function getStrategyDisplayName(strategy: BettingStrategy): string {
  const names: Record<BettingStrategy, string> = {
    'flat': 'Puntata Fissa',
    'percentage': 'Percentuale',
    'dalembert': 'D\'Alembert',
    'profitfall': 'PROFIT FALL',
    'masaniello': 'Multi Masaniello',
    'kelly': 'Kelly Ridotto',
    'beat-delay': 'Beat the Delay'
  };
  return names[strategy] || strategy;
}

export function formatCurrency(amount: number): string {
  return '€' + amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}

export function calculatePotentialWin(stake: number, odds: number): number {
  return stake * odds;
}

export function calculateROI(initialBankroll: number, currentBankroll: number): number {
  return ((currentBankroll - initialBankroll) / initialBankroll) * 100;
}