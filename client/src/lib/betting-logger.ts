/**
 * Sistema di log persistente per scommesse
 * Replica la funzionalità log_scommessa del codice Python
 * Mantiene traccia permanente di tutte le giocate
 */

export interface BettingLogEntry {
  dataOra: string;
  probClassica: number;
  probML: number;
  probCombinata: number;
  evCombinato: number;
  quota: number;
  puntata: number;
  risultato: string;
  sessionId?: number;
  betId?: number;
  strategy: string;
}

export class BettingLogger {
  private readonly LOG_KEY = 'betting-log-persistent';
  private readonly MAX_ENTRIES = 10000; // Limite per performance

  /**
   * Registra una nuova scommessa nel log persistente
   * Replica esatta della funzione log_scommessa Python
   */
  logScommessa(
    probClassica: number,
    probML: number,
    probCombinata: number,
    evCombinato: number,
    quota: number,
    puntata: number,
    risultato: string = "",
    sessionId?: number,
    betId?: number,
    strategy: string = "Beat the Delay"
  ): void {
    const entry: BettingLogEntry = {
      dataOra: new Date().toISOString().replace('T', ' ').substring(0, 19),
      probClassica: Number(probClassica.toFixed(4)),
      probML: Number(probML.toFixed(4)),
      probCombinata: Number(probCombinata.toFixed(4)),
      evCombinato: Number(evCombinato.toFixed(4)),
      quota: Number(quota.toFixed(2)),
      puntata: Number(puntata.toFixed(2)),
      risultato,
      sessionId,
      betId,
      strategy
    };

    this.appendToLog(entry);
    console.log(`[BETTING LOG] Scommessa registrata: EV=${evCombinato.toFixed(3)}, Puntata=€${puntata.toFixed(2)}`);
  }

  /**
   * Aggiorna il risultato di una scommessa esistente
   */
  updateResult(sessionId: number, betId: number, risultato: string): void {
    const logs = this.getAllLogs();
    const entryIndex = logs.findIndex(log => 
      log.sessionId === sessionId && log.betId === betId
    );

    if (entryIndex !== -1) {
      logs[entryIndex].risultato = risultato;
      this.saveLogs(logs);
      console.log(`[BETTING LOG] Risultato aggiornato per bet ${betId}: ${risultato}`);
    }
  }

  /**
   * Recupera tutti i log delle scommesse
   */
  getAllLogs(): BettingLogEntry[] {
    try {
      const stored = localStorage.getItem(this.LOG_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Errore lettura log scommesse:', error);
      return [];
    }
  }

  /**
   * Recupera log filtrati per strategia
   */
  getLogsByStrategy(strategy: string): BettingLogEntry[] {
    return this.getAllLogs().filter(log => log.strategy === strategy);
  }

  /**
   * Recupera log per sessione specifica
   */
  getLogsBySession(sessionId: number): BettingLogEntry[] {
    return this.getAllLogs().filter(log => log.sessionId === sessionId);
  }

  /**
   * Statistiche complete dal log
   */
  getLogStatistics(): {
    totalBets: number;
    winRate: number;
    avgEV: number;
    totalStaked: number;
    totalProfit: number;
    avgClassicProb: number;
    avgMLProb: number;
    avgCombinedProb: number;
    bestEV: number;
    worstEV: number;
  } {
    const logs = this.getAllLogs().filter(log => log.risultato !== "");
    
    if (logs.length === 0) {
      return {
        totalBets: 0, winRate: 0, avgEV: 0, totalStaked: 0, totalProfit: 0,
        avgClassicProb: 0, avgMLProb: 0, avgCombinedProb: 0, bestEV: 0, worstEV: 0
      };
    }

    const wins = logs.filter(log => log.risultato.toLowerCase().includes('vint')).length;
    const totalStaked = logs.reduce((sum, log) => sum + log.puntata, 0);
    
    // Calcola profitto stimato (semplificato)
    const totalProfit = logs.reduce((profit, log) => {
      if (log.risultato.toLowerCase().includes('vint')) {
        return profit + (log.puntata * log.quota - log.puntata);
      } else if (log.risultato.toLowerCase().includes('pers')) {
        return profit - log.puntata;
      }
      return profit;
    }, 0);

    return {
      totalBets: logs.length,
      winRate: (wins / logs.length) * 100,
      avgEV: logs.reduce((sum, log) => sum + log.evCombinato, 0) / logs.length,
      totalStaked,
      totalProfit,
      avgClassicProb: logs.reduce((sum, log) => sum + log.probClassica, 0) / logs.length,
      avgMLProb: logs.reduce((sum, log) => sum + log.probML, 0) / logs.length,
      avgCombinedProb: logs.reduce((sum, log) => sum + log.probCombinata, 0) / logs.length,
      bestEV: Math.max(...logs.map(log => log.evCombinato)),
      worstEV: Math.min(...logs.map(log => log.evCombinato))
    };
  }

  /**
   * Esporta log in formato CSV (come il Python)
   */
  exportToCSV(): string {
    const logs = this.getAllLogs();
    const headers = ['DataOra', 'Prob_Classica', 'Prob_ML', 'Prob_Combinata', 'EV_Combinato', 'Quota', 'Puntata', 'Risultato', 'Strategy'];
    
    const csvContent = [
      headers.join(','),
      ...logs.map(log => [
        log.dataOra,
        log.probClassica.toFixed(4),
        log.probML.toFixed(4),
        log.probCombinata.toFixed(4),
        log.evCombinato.toFixed(4),
        log.quota.toFixed(2),
        log.puntata.toFixed(2),
        `"${log.risultato}"`,
        `"${log.strategy}"`
      ].join(','))
    ].join('\n');

    return csvContent;
  }

  /**
   * Scarica log come file CSV
   */
  downloadCSV(): void {
    try {
      // Controlla che il DOM sia pronto
      if (typeof window === 'undefined' || !document || !document.body) {
        console.warn('DOM non disponibile per download CSV');
        return;
      }

      const csvContent = this.exportToCSV();
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      
      // Usa il metodo moderno se supportato
      if (window.navigator && window.navigator.share) {
        const file = new File([blob], `log_scommesse_${new Date().toISOString().split('T')[0]}.csv`, {
          type: 'text/csv'
        });
        window.navigator.share({
          files: [file],
          title: 'Log Scommesse'
        }).catch(() => {
          // Fallback al metodo tradizionale
          this.downloadCSVFallback(blob);
        });
      } else {
        this.downloadCSVFallback(blob);
      }
    } catch (error) {
      console.error('Errore durante download CSV:', error);
    }
  }

  private downloadCSVFallback(blob: Blob): void {
    try {
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.href = url;
      link.download = `log_scommesse_${new Date().toISOString().split('T')[0]}.csv`;
      link.style.display = 'none';
      
      // Evita manipolazione diretta del DOM
      const clickEvent = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true
      });
      
      link.dispatchEvent(clickEvent);
      
      // Cleanup immediato
      setTimeout(() => {
        try {
          URL.revokeObjectURL(url);
        } catch (e) {
          console.warn('Errore cleanup URL:', e);
        }
      }, 100);
      
    } catch (error) {
      console.error('Errore fallback download:', error);
    }
  }

  /**
   * Confronto performance Metodo Classico vs ML
   */
  getMethodComparison(): {
    classicOnly: { winRate: number; avgEV: number; count: number };
    mlOnly: { winRate: number; avgEV: number; count: number };
    combined: { winRate: number; avgEV: number; count: number };
  } {
    const logs = this.getAllLogs().filter(log => log.risultato !== "");
    
    // Simula decisioni basate solo su metodo classico o ML
    const classicDecisions = logs.filter(log => log.probClassica > 0.5);
    const mlDecisions = logs.filter(log => log.probML > 0.5);
    const combinedDecisions = logs.filter(log => log.probCombinata > 0.5);

    const calculateStats = (subset: BettingLogEntry[]) => {
      if (subset.length === 0) return { winRate: 0, avgEV: 0, count: 0 };
      const wins = subset.filter(log => log.risultato.toLowerCase().includes('vint')).length;
      return {
        winRate: (wins / subset.length) * 100,
        avgEV: subset.reduce((sum, log) => sum + log.evCombinato, 0) / subset.length,
        count: subset.length
      };
    };

    return {
      classicOnly: calculateStats(classicDecisions),
      mlOnly: calculateStats(mlDecisions),
      combined: calculateStats(combinedDecisions)
    };
  }

  private appendToLog(entry: BettingLogEntry): void {
    const logs = this.getAllLogs();
    logs.push(entry);
    
    // Mantieni solo gli ultimi MAX_ENTRIES per performance
    if (logs.length > this.MAX_ENTRIES) {
      logs.splice(0, logs.length - this.MAX_ENTRIES);
    }
    
    this.saveLogs(logs);
  }

  private saveLogs(logs: BettingLogEntry[]): void {
    try {
      localStorage.setItem(this.LOG_KEY, JSON.stringify(logs));
    } catch (error) {
      console.error('Errore salvataggio log scommesse:', error);
      // In caso di quota storage superata, rimuovi i record più vecchi
      if (error instanceof DOMException && error.code === 22) {
        const reducedLogs = logs.slice(-Math.floor(this.MAX_ENTRIES * 0.8));
        localStorage.setItem(this.LOG_KEY, JSON.stringify(reducedLogs));
      }
    }
  }

  /**
   * Pulisce log più vecchi di N giorni (opzionale, per manutenzione)
   */
  cleanOldLogs(daysToKeep: number = 365): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    const logs = this.getAllLogs();
    const initialCount = logs.length;
    const filteredLogs = logs.filter(log => new Date(log.dataOra) >= cutoffDate);
    
    this.saveLogs(filteredLogs);
    return initialCount - filteredLogs.length;
  }
}

// Istanza singleton del logger
export const bettingLogger = new BettingLogger();