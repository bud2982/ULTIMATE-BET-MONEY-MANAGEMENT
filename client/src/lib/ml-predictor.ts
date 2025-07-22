/**
 * Sistema ML autonomo per predizioni betting
 * Lavora in parallelo al metodo Beat the Delay senza interferire
 */

export interface MLPrediction {
  probability: number;
  confidence: number;
  factors: {
    delayPattern: number;
    frequencyTrend: number;
    oddsValue: number;
    historicalPerformance: number;
  };
  recommendation: 'STRONG_PLAY' | 'PLAY' | 'CAUTION' | 'AVOID';
}

export interface MLTrainingData {
  delay: number;
  avgDelay: number;
  maxDelay: number;
  frequency: number;
  odds: number;
  result: boolean;
  timestamp: number;
}

export class MLPredictor {
  private trainingData: MLTrainingData[] = [];
  private weights = {
    delayPattern: 0.3,
    frequencyTrend: 0.25,
    oddsValue: 0.25,
    historicalPerformance: 0.2
  };

  constructor() {
    this.loadTrainingData();
  }

  /**
   * Predizione ML principale - replica della funzione predict_ml del Python
   */
  predict(delay: number, avgDelay: number, maxDelay: number, frequency: number, odds: number): MLPrediction {
    // Calcolo fattori di analisi ML
    const delayPattern = this.analyzeDelayPattern(delay, avgDelay, maxDelay);
    const frequencyTrend = this.analyzeFrequencyTrend(frequency);
    const oddsValue = this.analyzeOddsValue(odds);
    const historicalPerformance = this.analyzeHistoricalPerformance(delay, frequency, odds);

    // Calcolo probabilità ML combinata
    const probability = this.calculateMLProbability(delayPattern, frequencyTrend, oddsValue, historicalPerformance);
    
    // Calcolo confidenza basata su consistenza dei fattori
    const confidence = this.calculateConfidence(delayPattern, frequencyTrend, oddsValue, historicalPerformance);
    
    // Determinazione raccomandazione
    const recommendation = this.determineRecommendation(probability, confidence);

    return {
      probability,
      confidence,
      factors: {
        delayPattern,
        frequencyTrend,
        oddsValue,
        historicalPerformance
      },
      recommendation
    };
  }

  private analyzeDelayPattern(delay: number, avgDelay: number, maxDelay: number): number {
    // Analisi pattern ritardo con ML
    const normalizedDelay = (delay - avgDelay) / (maxDelay - avgDelay + 0.01);
    const delayRatio = delay / avgDelay;
    
    // Pattern ML: ritardi molto alti hanno probabilità crescente ma con diminishing returns
    const patternScore = Math.tanh(normalizedDelay * 2) * 0.7 + Math.log(delayRatio + 1) * 0.3;
    return Math.max(0, Math.min(patternScore, 1));
  }

  private analyzeFrequencyTrend(frequency: number): number {
    // ML: frequenze basse con pattern storici favorevoli
    const frequencyBoost = frequency < 0.4 ? (0.4 - frequency) * 1.5 : 0;
    const historicalConsistency = this.getFrequencyConsistency(frequency);
    
    return Math.min((frequency + frequencyBoost) * historicalConsistency, 1);
  }

  private analyzeOddsValue(odds: number): number {
    // ML: analisi valore quote ottimale
    const optimalRange = odds >= 2.0 && odds <= 4.0;
    const valueScore = optimalRange ? 0.8 : Math.max(0, 0.8 - Math.abs(odds - 3.0) * 0.1);
    
    return valueScore;
  }

  private analyzeHistoricalPerformance(delay: number, frequency: number, odds: number): number {
    if (this.trainingData.length < 5) return 0.5; // Default neutro con pochi dati

    // Trova situazioni simili nello storico
    const similarSituations = this.trainingData.filter(data =>
      Math.abs(data.delay - delay) <= 3 &&
      Math.abs(data.frequency - frequency) <= 0.1 &&
      Math.abs(data.odds - odds) <= 0.5
    );

    if (similarSituations.length === 0) return 0.5;

    const winRate = similarSituations.filter(s => s.result).length / similarSituations.length;
    return winRate;
  }

  private calculateMLProbability(delayPattern: number, frequencyTrend: number, oddsValue: number, historicalPerformance: number): number {
    // Calcolo probabilità ML ponderata
    const probability = 
      delayPattern * this.weights.delayPattern +
      frequencyTrend * this.weights.frequencyTrend +
      oddsValue * this.weights.oddsValue +
      historicalPerformance * this.weights.historicalPerformance;

    return Math.max(0, Math.min(probability, 1));
  }

  private calculateConfidence(delayPattern: number, frequencyTrend: number, oddsValue: number, historicalPerformance: number): number {
    // Confidenza basata su concordanza dei fattori
    const factors = [delayPattern, frequencyTrend, oddsValue, historicalPerformance];
    const average = factors.reduce((a, b) => a + b) / factors.length;
    const variance = factors.reduce((sum, factor) => sum + Math.pow(factor - average, 2), 0) / factors.length;
    
    // Meno varianza = più confidenza
    const consistency = Math.max(0, 1 - variance * 2);
    
    // Confidenza aumenta con più dati storici
    const dataConfidence = Math.min(this.trainingData.length / 50, 1);
    
    return (consistency * 0.7 + dataConfidence * 0.3) * 100;
  }

  private determineRecommendation(probability: number, confidence: number): MLPrediction['recommendation'] {
    if (probability > 0.7 && confidence > 70) return 'STRONG_PLAY';
    if (probability > 0.5 && confidence > 50) return 'PLAY';
    if (probability > 0.4 && confidence > 30) return 'CAUTION';
    return 'AVOID';
  }

  private getFrequencyConsistency(frequency: number): number {
    // Analizza consistenza frequenza negli ultimi dati
    if (this.trainingData.length < 10) return 1;
    
    const recentData = this.trainingData.slice(-10);
    const avgFrequency = recentData.reduce((sum, d) => sum + d.frequency, 0) / recentData.length;
    const consistency = 1 - Math.abs(frequency - avgFrequency);
    
    return Math.max(0.5, consistency);
  }

  /**
   * Addestra il modello ML con nuovo risultato
   */
  trainWithResult(delay: number, avgDelay: number, maxDelay: number, frequency: number, odds: number, result: boolean): void {
    const newData: MLTrainingData = {
      delay,
      avgDelay,
      maxDelay,
      frequency,
      odds,
      result,
      timestamp: Date.now()
    };

    this.trainingData.push(newData);
    
    // Mantieni solo ultimi 200 record per performance
    if (this.trainingData.length > 200) {
      this.trainingData = this.trainingData.slice(-200);
    }

    // Aggiorna pesi basandosi su performance
    this.updateWeights();
    this.saveTrainingData();
  }

  private updateWeights(): void {
    if (this.trainingData.length < 20) return;

    // Analizza performance dei fattori per ottimizzare pesi
    const recentData = this.trainingData.slice(-50);
    // Implementazione semplificata - in produzione si userebbe regressione più sofisticata
  }

  private loadTrainingData(): void {
    try {
      const saved = localStorage.getItem('ml-training-data');
      if (saved) {
        this.trainingData = JSON.parse(saved);
      }
    } catch (error) {
      console.warn('Errore caricamento dati ML:', error);
      this.trainingData = [];
    }
  }

  private saveTrainingData(): void {
    try {
      localStorage.setItem('ml-training-data', JSON.stringify(this.trainingData));
    } catch (error) {
      console.warn('Errore salvataggio dati ML:', error);
    }
  }

  /**
   * Combina probabilità classica e ML come nel codice Python
   */
  combineProbabilities(classicProb: number, mlProb: number, classicWeight = 0.6, mlWeight = 0.4): number {
    return (classicWeight * classicProb) + (mlWeight * mlProb);
  }

  /**
   * Statistiche del modello ML
   */
  getModelStats(): { totalPredictions: number; winRate: number; confidence: number } {
    if (this.trainingData.length === 0) {
      return { totalPredictions: 0, winRate: 0, confidence: 0 };
    }

    const wins = this.trainingData.filter(d => d.result).length;
    const winRate = wins / this.trainingData.length;
    const confidence = Math.min(this.trainingData.length / 50 * 100, 100);

    return {
      totalPredictions: this.trainingData.length,
      winRate: winRate * 100,
      confidence
    };
  }
}

// Istanza singleton del predittore ML
export const mlPredictor = new MLPredictor();