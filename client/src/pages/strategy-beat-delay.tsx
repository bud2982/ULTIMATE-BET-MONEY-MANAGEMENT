import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useBetting } from "@/hooks/use-betting";
import { BettingStrategy, BetData, SessionData } from "@/types/betting";
import { formatCurrency, getStrategyDisplayName } from "@/lib/betting-strategies";
import SparklineChart from "@/components/sparkline-chart";
import AnimatedProgressTracker from "@/components/animated-progress-tracker";
import BadgesDisplay from "@/components/badges-display";
import SessionScreenshot from "@/components/session-screenshot";
import { ArrowLeft, Play, RotateCcw, TrendingUp, Target, Timer, Zap, AlertTriangle, CheckCircle, XCircle, Trophy, Calculator, BarChart3, Activity } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mlPredictor, type MLPrediction } from "@/lib/ml-predictor";
import { bettingLogger } from "@/lib/betting-logger";

export default function StrategyBeatDelay() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const betting = useBetting();
  const [confirmingReset, setConfirmingReset] = useState(false);
  
  // Form state
  const [initialBankroll, setInitialBankroll] = useState(1000);
  const [baseStake, setBaseStake] = useState(10);
  const [targetReturn, setTargetReturn] = useState(30);
  const [sessionName, setSessionName] = useState(`Sessione Beat the Delay ${new Date().toLocaleDateString()}`);
  const [stopLoss, setStopLoss] = useState(6);

  // Statistical data state (valori di test per mostrare "NON GIOCARE")
  const [currentSign, setCurrentSign] = useState<'1' | 'X' | '2'>('X');
  const [currentDelay, setCurrentDelay] = useState(8);
  const [historicalFrequency, setHistoricalFrequency] = useState(39);
  const [avgDelay, setAvgDelay] = useState(11);
  const [maxDelay, setMaxDelay] = useState(18);
  const [currentOdds, setCurrentOdds] = useState(1.80);
  const [captureRate, setCaptureRate] = useState(75);
  const [autoCaptureRate, setAutoCaptureRate] = useState(true);
  
  // Calculated values
  const [estimatedProbability, setEstimatedProbability] = useState(0);
  const [expectedValue, setExpectedValue] = useState(0);
  const [shouldPlay, setShouldPlay] = useState(false);
  
  // Post-bet update panel
  const [showUpdatePanel, setShowUpdatePanel] = useState(false);
  const [nextBetDelay, setNextBetDelay] = useState(16);
  const [nextBetOdds, setNextBetOdds] = useState(3.20);
  const [nextHistoricalFrequency, setNextHistoricalFrequency] = useState(39);
  const [nextAvgDelay, setNextAvgDelay] = useState(11);
  const [nextMaxDelay, setNextMaxDelay] = useState(18);

  // Advanced calculation states
  const [recoveryRate, setRecoveryRate] = useState(0);
  const [anomalyIndex, setAnomalyIndex] = useState(0);
  const [showAdvancedPopup, setShowAdvancedPopup] = useState(false);
  const [alertRecovery, setAlertRecovery] = useState(false);
  const [frequencyDetected, setFrequencyDetected] = useState(false);
  // ML state autonomo (non interferisce con il metodo classico)
  const [mlPrediction, setMLPrediction] = useState<MLPrediction>({
    probability: 0,
    confidence: 0,
    factors: {
      delayPattern: 0,
      frequencyTrend: 0,
      oddsValue: 0,
      historicalPerformance: 0
    },
    recommendation: 'AVOID'
  });
  
  // Stato per probabilità combinata (come nel codice Python)
  const [combinedProbability, setCombinedProbability] = useState(0);
  const [combinedEV, setCombinedEV] = useState(0);
  const [showMLComparison, setShowMLComparison] = useState(false);
  
  // Thresholds (aumentata soglia per test NON GIOCARE)
  const [evThreshold, setEvThreshold] = useState(0.08);
  const [recoveryAlertThreshold, setRecoveryAlertThreshold] = useState(0.10);

  // Calculate automatic capture rate based on historical performance
  const calculateAutoCaptureRate = () => {
    // Safe check for betting.sessions
    if (!betting?.sessions || !Array.isArray(betting.sessions) || betting.sessions.length === 0) {
      return 75; // Default conservative value
    }

    const beatDelaySessions = betting.sessions.filter((s: any) => s?.strategy === 'beat-delay');
    if (beatDelaySessions.length === 0) {
      return 75;
    }

    let totalBets = 0;
    let totalWins = 0;
    let totalPredictedWins = 0;

    beatDelaySessions.forEach((session: any) => {
      if (!session?.id) return;
      
      const sessionBets = betting.bets?.filter((bet: any) => bet?.sessionId === session.id) || [];
      sessionBets.forEach((bet: any) => {
        if (!bet) return;
        
        totalBets++;
        if (bet.win) totalWins++;
        
        // Estimate what the system predicted based on the bet being placed
        // If bet was placed, system predicted win probability > 50%
        if (bet.stake && bet.stake > 0) {
          totalPredictedWins++;
        }
      });
    });

    if (totalPredictedWins === 0) {
      return 75;
    }

    // Actual capture rate = (actual wins / predicted wins) * 100
    const actualCaptureRate = (totalWins / totalPredictedWins) * 100;
    
    // Apply smoothing and bounds
    const smoothedRate = Math.max(50, Math.min(95, actualCaptureRate));
    
    // Add confidence adjustment based on sample size
    const confidenceAdjustment = Math.min(10, totalBets / 10);
    const finalRate = smoothedRate - (10 - confidenceAdjustment);
    
    return Math.max(55, Math.min(90, finalRate));
  };

  // Auto-calculate EV and decision when parameters change
  useEffect(() => {
    if (autoCaptureRate) {
      const newCaptureRate = calculateAutoCaptureRate();
      setCaptureRate(newCaptureRate);
    }
    
    calculateEVAndDecision();
    performMLPrediction(); // Calcolo ML parallelo
    // Sincronizza le quote con il betting hook
    betting.setBetOdds(currentOdds);
  }, [currentDelay, historicalFrequency, avgDelay, maxDelay, currentOdds, autoCaptureRate ? (betting.sessions?.length || 0) : captureRate]);

  // Auto-load existing Beat the Delay session
  useEffect(() => {
    if (!betting.currentSession && Array.isArray(betting.sessions) && betting.sessions.length > 0) {
      const beatDelaySession = betting.sessions.find(s => s.strategy === 'beat-delay');
      if (beatDelaySession && beatDelaySession.betCount > 0) {
        betting.setCurrentSession(beatDelaySession);
      }
    }
  }, [betting.sessions, betting.currentSession]);

  // Funzione ML autonoma (replica predict_ml del Python)
  const performMLPrediction = () => {
    const prediction = mlPredictor.predict(
      currentDelay, 
      avgDelay, 
      maxDelay, 
      historicalFrequency / 100, 
      currentOdds
    );
    
    setMLPrediction(prediction);
    
    // Calcola probabilità combinata (come nel codice Python)
    const classicProb = estimatedProbability;
    const combinedProb = mlPredictor.combineProbabilities(classicProb, prediction.probability);
    const combinedEVCalc = combinedProb * (currentOdds - 1) - (1 - combinedProb);
    
    setCombinedProbability(combinedProb);
    setCombinedEV(combinedEVCalc);
  };

  // Machine Learning Analysis System
  const performMLAnalysis = (allBets: any[]) => {
    if (!allBets || allBets.length < 5) {
      return {
        recentWinRate: 0,
        patternStrength: 0,
        confidenceLevel: 0,
        recommendation: 'Dati insufficienti per analisi ML'
      };
    }

    // Analisi ultimi 10 risultati per pattern recognition
    const recentBets = allBets.slice(-10);
    const winRate = recentBets.filter(bet => bet.win).length / recentBets.length;

    // Analisi sequenze vincenti/perdenti per rilevare pattern
    let sequences = [];
    let currentSequence = { type: recentBets[0]?.win ? 'win' : 'loss', length: 1 };
    
    for (let i = 1; i < recentBets.length; i++) {
      const isWin = recentBets[i].win;
      if ((isWin && currentSequence.type === 'win') || (!isWin && currentSequence.type === 'loss')) {
        currentSequence.length++;
      } else {
        sequences.push(currentSequence);
        currentSequence = { type: isWin ? 'win' : 'loss', length: 1 };
      }
    }
    sequences.push(currentSequence);

    // Calcolo forza del pattern (più sequenze = pattern più forte)
    const avgSequenceLength = sequences.reduce((sum, seq) => sum + seq.length, 0) / sequences.length;
    const patternStrength = Math.min(avgSequenceLength / 3, 1.0); // Normalizzato 0-1

    // Analisi recupero post-perdita automatica
    let recoverySuccesses = 0;
    let recoveryAttempts = 0;
    
    for (let i = 0; i < allBets.length - 5; i++) {
      if (!allBets[i].win) { // Dopo una perdita
        recoveryAttempts++;
        // Controlla se vince nelle prossime 5 scommesse
        const next5 = allBets.slice(i + 1, i + 6);
        if (next5.some(bet => bet.win)) {
          recoverySuccesses++;
        }
      }
    }

    const autoRecoveryRate = recoveryAttempts > 0 ? recoverySuccesses / recoveryAttempts : 0;

    // Livello di confidenza basato su quantità dati e pattern consistency
    const dataConfidence = Math.min(allBets.length / 20, 1.0);
    const patternConsistency = 1 - Math.abs(winRate - historicalFrequency / 100);
    const confidenceLevel = (dataConfidence + patternConsistency) / 2;

    // Raccomandazione automatica
    let recommendation = '';
    if (winRate > 0.6 && patternStrength > 0.5) {
      recommendation = '🟢 FREQUENZA RILEVATA - Momento favorevole';
    } else if (winRate < 0.3 && autoRecoveryRate > 0.4) {
      recommendation = '🟡 POSSIBILE INVERSIONE - Monitorare';
    } else if (confidenceLevel < 0.3) {
      recommendation = '🔵 PATTERN INSTABILE - Raccogliere più dati';
    } else {
      recommendation = '⚪ CONDIZIONI NORMALI - Seguire EV';
    }

    return {
      recentWinRate: winRate,
      patternStrength,
      confidenceLevel,
      recommendation,
      autoRecoveryRate
    };
  };

  // Advanced calculation system with ML integration
  const calculateEVAndDecision = () => {
    // Sistema ML autonomo - non interferisce con il calcolo classico
    const allBets = betting.bets || [];
    if (allBets.length > 0) {
      const lastBet = allBets[allBets.length - 1];
      // Addestra ML con risultato precedente se disponibile
      if (lastBet.win !== undefined) {
        mlPredictor.trainWithResult(
          currentDelay, avgDelay, maxDelay, 
          historicalFrequency / 100, currentOdds, lastBet.win
        );
      }
    }

    // 1. Indice anomalia ritardo
    const indice_anomalia_ritardo = (ritardo_attuale: number, ritardo_medio: number, ritardo_massimo: number): number => {
      const delta = (ritardo_attuale - ritardo_medio) / (ritardo_massimo - ritardo_medio + 0.01);
      return Math.max(0.0, Math.min(delta, 1.0));
    };

    // 2. Calcolo probabilità migliorata con ML boost
    const calcola_probabilita_migliorata = (frequenza_storica: number, ritardo_attuale: number, ritardo_medio: number, ritardo_massimo: number, tasso_recupero: number, ml_boost: number): number => {
      const anomalia = indice_anomalia_ritardo(ritardo_attuale, ritardo_medio, ritardo_massimo);
      const boost_ritardo = 1 + (anomalia * 0.10); // boost ritardo max 10%
      const boost_recupero = 1 + tasso_recupero;    // boost da tasso recupero
      const boost_ml = 1 + (ml_boost * 0.15);       // boost ML max 15%
      const p = frequenza_storica * boost_ritardo * boost_recupero * boost_ml;
      return Math.min(p, 1.0);
    };

    // 3. Calcolo EV
    const calcola_ev = (p: number, quota: number): number => {
      return p * (quota - 1) - (1 - p);
    };

    // 4. Should play con ML enhancement
    const should_play = (ev: number, soglia_ev: number, ml_confidence: number): boolean => {
      const adjusted_threshold = soglia_ev * (1 - ml_confidence * 0.3); // Riduce soglia se ML è sicuro
      return ev >= adjusted_threshold;
    };

    // --- Calcoli classici Beat the Delay (invariati) ---
    const frequenza_storica = historicalFrequency / 100;
    const anomalia = indice_anomalia_ritardo(currentDelay, avgDelay, maxDelay);
    const p = calcola_probabilita_migliorata(frequenza_storica, currentDelay, avgDelay, maxDelay, recoveryRate, 0);
    const ev = calcola_ev(p, currentOdds);
    const giocare = should_play(ev, evThreshold, 0);

    // Aggiorna stati metodo classico
    setAnomalyIndex(anomalia);
    setEstimatedProbability(p);
    setExpectedValue(ev);
    setShouldPlay(giocare);
    setAlertRecovery(recoveryRate > recoveryAlertThreshold);

    console.log("\n--- BEAT THE DELAY CLASSICO ---");
    console.log(`Probabilità base: ${(frequenza_storica * 100).toFixed(1)}%`);
    console.log(`Boost ritardo: ${(anomalia * 10).toFixed(1)}%`);
    console.log(`Probabilità finale: ${(p * 100).toFixed(2)}%`);
    console.log(`EV: ${ev.toFixed(3)}`);
    console.log(`Giocare: ${giocare ? 'SÌ' : 'NO'}`);
    
    // Log automatico delle predizioni (replica del Python)
    if (mlPrediction.probability > 0) {
      bettingLogger.logScommessa(
        p, // prob classica
        mlPrediction.probability, // prob ML
        combinedProbability, // prob combinata
        combinedEV, // EV combinato
        currentOdds,
        0, // puntata da determinare al momento della scommessa
        "", // risultato vuoto inizialmente
        betting.currentSession?.id,
        undefined,
        "Beat the Delay + ML"
      );
    }
  };

  // Calculate D'Alembert stake
  const calculateDAlembert = (perditeConsecutive: number, unitaBase: number): number => {
    return unitaBase * (1 + perditeConsecutive);
  };

  const handleReset = async () => {
    if (confirmingReset) {
      try {
        await betting.resetSession();
        setConfirmingReset(false);
        
        toast({
          title: "Reset completato",
          description: "La sessione è stata resettata. Puoi creare una nuova sessione.",
          variant: "default"
        });
        
        setTimeout(() => {
          setConfirmingReset(false);
        }, 500);
      } catch (error) {
        console.error("Errore durante il reset:", error);
        toast({
          title: "Errore",
          description: "Si è verificato un errore durante il reset della sessione.",
          variant: "destructive"
        });
      }
    } else {
      setConfirmingReset(true);
      setTimeout(() => {
        setConfirmingReset(false);
      }, 3000);
    }
  };

  const handleStartSession = () => {
    console.log("DEBUG - handleStartSession chiamata", { initialBankroll, baseStake });
    
    if (initialBankroll <= 0 || baseStake <= 0) {
      console.log("ERROR - Validazione fallita", { initialBankroll, baseStake });
      toast({
        title: "Errore validazione",
        description: "Bankroll e puntata base devono essere maggiori di zero.",
        variant: "destructive"
      });
      return;
    }

    if (baseStake > initialBankroll * 0.1) {
      console.log("WARNING - Puntata troppo alta", { baseStake, maxAllowed: initialBankroll * 0.1 });
      toast({
        title: "Attenzione",
        description: "La puntata base è superiore al 10% del bankroll. Considera di ridurla per una gestione più sicura.",
        variant: "destructive"
      });
      return;
    }

    console.log("DEBUG - Validazione passata, procedendo con creazione sessione");

    // Prima resetta la sessione corrente se esiste
    if (betting.currentSession) {
      betting.resetSession();
    }

    // Aspetta un momento per il reset e poi crea la nuova sessione
    setTimeout(() => {
      const sessionData = {
        name: sessionName,
        initialBankroll,
        currentBankroll: initialBankroll,
        targetReturn,
        strategy: 'beat-delay' as BettingStrategy,
        strategySettings: JSON.stringify({
          baseStake,
          stopLoss,
          targetReturn,
          currentSign,
          currentDelay,
          historicalFrequency,
          avgDelay,
          maxDelay,
          currentOdds,
          captureRate
        })
      };
      
      console.log("DEBUG - Dati sessione da creare:", sessionData);
      
      try {
        betting.startNewSession(sessionData);
        
        toast({
          title: "Sessione creata",
          description: "La nuova sessione Beat the Delay è stata avviata!",
          variant: "default"
        });
      } catch (error) {
        console.error("ERROR - Creazione sessione fallita:", error);
        toast({
          title: "Errore",
          description: "Impossibile creare la sessione. Riprova.",
          variant: "destructive"
        });
      }
    }, 100);
  };

  const getNextStake = () => {
    if (!betting.currentSession) return baseStake;
    
    const settings = JSON.parse(betting.currentSession.strategySettings);
    const state = betting.bettingState?.beatDelay || { 
      level: 0, 
      consecutiveLosses: 0,
      totalStaked: 0,
      currentSign: null,
      currentDelay: 0,
      historicalFrequency: 0.33,
      avgDelay: 3.0,
      maxDelay: 10,
      currentOdds: 2.00,
      captureRate: 0.75,
      estimatedProbability: 0,
      expectedValue: 0,
      shouldPlay: false
    };
    
    // D'Alembert: puntata base * (1 + livello)
    return calculateDAlembert(state.level, settings.baseStake || baseStake);
  };

  const getBeatDelayState = () => {
    return betting.bettingState?.beatDelay || { 
      level: 0, 
      consecutiveLosses: 0, 
      totalStaked: 0,
      currentSign: null,
      currentDelay: 0,
      historicalFrequency: 0.33,
      avgDelay: 3.0,
      maxDelay: 10,
      currentOdds: 2.00,
      captureRate: 0.75,
      estimatedProbability: 0,
      expectedValue: 0,
      shouldPlay: false
    };
  };

  const isInProfit = betting.currentSession 
    ? betting.currentSession.currentBankroll >= betting.currentSession.initialBankroll 
    : false;

  const progressPercentage = betting.currentSession
    ? Math.min(((betting.currentSession.currentBankroll - betting.currentSession.initialBankroll) / (betting.currentSession.initialBankroll * targetReturn / 100)) * 100, 100)
    : 0;

  const state = getBeatDelayState();
  const nextStake = getNextStake();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/')}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Torna alla Home
              </Button>
              <div className="h-8 w-px bg-gray-300" />
              <div className="flex items-center space-x-2">
                <Timer className="h-6 w-6 text-purple-600" />
                <h1 className="text-2xl font-bold text-gray-900">
                  {getStrategyDisplayName('beat-delay')}
                </h1>
                <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                  Avanzato
                </Badge>
              </div>
            </div>
            
            {betting.currentSession && (
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-sm text-gray-500">Bankroll Attuale</div>
                  <div className={`text-xl font-bold ${isInProfit ? 'text-green-600' : betting.currentSession.currentBankroll < betting.currentSession.initialBankroll ? 'text-red-600' : 'text-gray-900'}`}>
                    {formatCurrency(betting.currentSession.currentBankroll)}
                  </div>
                </div>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={handleReset}
                  className={confirmingReset ? "bg-red-600 animate-pulse" : ""}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  {confirmingReset ? "Conferma Reset" : "Reset"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Pannelli sempre visibili: Calcoli e Predizioni */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Pannello Calcoli in Tempo Reale */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center text-blue-800">
                <Activity className="h-4 w-4 mr-2" />
                Calcoli in Tempo Reale
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* ML Analysis Display */}
              <div className="mb-4 p-4 bg-blue-100 rounded-lg border border-blue-300">
                <h5 className="font-semibold text-blue-800 mb-2 flex items-center">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analisi Machine Learning Automatica
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-blue-600">Probabilità ML:</span>
                    <span className="font-bold ml-2">{(mlPrediction.probability * 100).toFixed(1)}%</span>
                  </div>
                  <div>
                    <span className="text-blue-600">Confidenza ML:</span>
                    <span className="font-bold ml-2">{mlPrediction.confidence.toFixed(1)}%</span>
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <span className="text-blue-600">Raccomandazione ML:</span>
                    <span className="font-bold ml-2">{mlPrediction.recommendation}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Probabilità Finale:</span>
                  <span className="font-bold ml-2">{(estimatedProbability * 100).toFixed(2)}%</span>
                </div>
                <div>
                  <span className="text-gray-600">Valore Atteso (EV):</span>
                  <span className={`font-bold ml-2 ${expectedValue >= evThreshold ? 'text-green-600' : 'text-red-600'}`}>
                    {expectedValue.toFixed(4)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Recupero Auto:</span>
                  <span className={`font-bold ml-2 ${recoveryRate > recoveryAlertThreshold ? 'text-orange-600' : 'text-blue-600'}`}>
                    {(recoveryRate * 100).toFixed(1)}%
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Prob. Combinata:</span>
                  <span className="font-bold ml-2 text-purple-600">{(combinedProbability * 100).toFixed(1)}%</span>
                </div>
                <div>
                  <span className="text-gray-600">EV Combinato:</span>
                  <span className="font-bold ml-2 text-purple-600">{combinedEV.toFixed(4)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pannello Confronto Predizioni */}
          <Card className="border-purple-200 bg-purple-50">
            <CardHeader>
              <CardTitle className="flex items-center text-purple-800">
                <Activity className="h-4 w-4 mr-2" />
                Confronto Predizioni: Classico vs ML
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="text-center p-3 bg-white rounded border">
                  <div className="text-blue-600 font-semibold">Metodo Classico</div>
                  <div className="text-lg font-bold">{(estimatedProbability * 100).toFixed(1)}%</div>
                  <div className="text-xs text-gray-500">EV: {expectedValue.toFixed(3)}</div>
                </div>
                <div className="text-center p-3 bg-white rounded border">
                  <div className="text-green-600 font-semibold">Sistema ML</div>
                  <div className="text-lg font-bold">{(mlPrediction.probability * 100).toFixed(1)}%</div>
                  <div className="text-xs text-gray-500">Conf: {mlPrediction.confidence.toFixed(0)}%</div>
                </div>
                <div className="text-center p-3 bg-purple-100 rounded border border-purple-300">
                  <div className="text-purple-600 font-semibold">Combinato</div>
                  <div className="text-lg font-bold">{(combinedProbability * 100).toFixed(1)}%</div>
                  <div className="text-xs text-gray-500">EV: {combinedEV.toFixed(3)}</div>
                </div>
              </div>
              <div className="mt-3 flex justify-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowMLComparison(!showMLComparison)}
                >
                  {showMLComparison ? 'Nascondi' : 'Mostra'} Dettagli ML
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => bettingLogger.downloadCSV()}
                >
                  Scarica Log CSV
                </Button>
              </div>

              {/* Dettagli ML expandibili */}
              {showMLComparison && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                  <h6 className="font-semibold text-gray-800 mb-3">Fattori di Analisi ML:</h6>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">Pattern Ritardo:</span>
                      <div className="font-bold">{(mlPrediction.factors.delayPattern * 100).toFixed(1)}%</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Trend Frequenza:</span>
                      <div className="font-bold">{(mlPrediction.factors.frequencyTrend * 100).toFixed(1)}%</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Valore Quote:</span>
                      <div className="font-bold">{(mlPrediction.factors.oddsValue * 100).toFixed(1)}%</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Performance Storica:</span>
                      <div className="font-bold">{(mlPrediction.factors.historicalPerformance * 100).toFixed(1)}%</div>
                    </div>
                  </div>
                  <div className="mt-3 p-2 bg-yellow-50 rounded text-xs text-yellow-800">
                    <strong>Nota:</strong> Il sistema ML lavora autonomamente e non interferisce con il metodo Beat the Delay classico. 
                    Serve solo per confronto e analisi aggiuntiva.
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Pannello Raccomandazione sempre visibile */}
        <div className="mb-8">
          <Card className={`${shouldPlay ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'} shadow-lg`}>
            <CardContent className="p-6">
              <div className={`text-center ${shouldPlay ? 'bg-green-100' : 'bg-red-100'} rounded-xl p-6`}>
                <div className="flex justify-center mb-4">
                  {shouldPlay ? (
                    <CheckCircle className="h-12 w-12 text-green-600" />
                  ) : (
                    <XCircle className="h-12 w-12 text-red-600" />
                  )}
                </div>
                <h3 className={`text-2xl font-bold ${shouldPlay ? 'text-green-800' : 'text-red-800'}`}>
                  {shouldPlay ? '✅ GIOCA ADESSO' : '❌ NON GIOCARE'}
                </h3>
                <p className={`text-lg mt-2 ${shouldPlay ? 'text-green-700' : 'text-red-700'}`}>
                  {shouldPlay 
                    ? 'Condizioni favorevoli rilevate dal sistema'
                    : 'Aspetta condizioni migliori'
                  }
                </p>
                
                {/* Dettagli decisione */}
                <div className="mt-4 bg-white bg-opacity-60 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">EV Attuale:</span>
                      <div className={`font-bold text-lg ${expectedValue >= evThreshold ? 'text-green-600' : 'text-red-600'}`}>
                        {expectedValue.toFixed(3)}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">Soglia Richiesta:</span>
                      <div className="font-bold text-lg text-gray-800">
                        {evThreshold.toFixed(3)}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">ML Confidence:</span>
                      <div className="font-bold text-lg text-blue-600">
                        {mlPrediction.confidence.toFixed(0)}%
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3 text-center">
                    <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${
                      mlPrediction.recommendation === 'STRONG_PLAY' ? 'bg-green-200 text-green-800' :
                      mlPrediction.recommendation === 'PLAY' ? 'bg-yellow-200 text-yellow-800' :
                      mlPrediction.recommendation === 'CAUTION' ? 'bg-blue-200 text-blue-800' :
                      'bg-gray-200 text-gray-800'
                    }`}>
                      {mlPrediction.recommendation}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {!betting.currentSession ? (
              <Card className="border-purple-200 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-purple-600 to-violet-600 text-white">
                  <CardTitle className="flex items-center">
                    <Zap className="h-5 w-5 mr-2" />
                    Configurazione Beat the Delay
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <Alert className="mb-6 border-purple-200 bg-purple-50">
                    <Timer className="h-4 w-4" />
                    <AlertDescription className="text-purple-800">
                      <strong>Beat the Delay</strong> è una strategia progressiva che incrementa la puntata dopo ogni perdita 
                      con un fattore di ritardo controllato. Progettata per massimizzare i profitti minimizzando i rischi 
                      attraverso una progressione calcolata.
                    </AlertDescription>
                  </Alert>

                  <Tabs defaultValue="basic" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="basic">Impostazioni Base</TabsTrigger>
                      <TabsTrigger value="statistical">Dati Statistici</TabsTrigger>
                      <TabsTrigger value="advanced">Avanzate</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="basic" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="sessionName">Nome Sessione</Label>
                          <Input
                            id="sessionName"
                            value={sessionName}
                            onChange={(e) => setSessionName(e.target.value)}
                            placeholder="Inserisci nome sessione"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="initialBankroll">Bankroll Iniziale (€)</Label>
                          <Input
                            id="initialBankroll"
                            type="number"
                            value={initialBankroll}
                            onChange={(e) => setInitialBankroll(Number(e.target.value))}
                            min="1"
                            step="10"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="baseStake">Puntata Base (€)</Label>
                          <Input
                            id="baseStake"
                            type="number"
                            value={baseStake}
                            onChange={(e) => setBaseStake(Number(e.target.value))}
                            min="0.1"
                            step="0.5"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="targetReturn">Obiettivo Profitto (%)</Label>
                          <Input
                            id="targetReturn"
                            type="number"
                            value={targetReturn}
                            onChange={(e) => setTargetReturn(Number(e.target.value))}
                            min="1"
                            max="100"
                            step="1"
                          />
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="statistical" className="space-y-4">
                      <Alert className="mb-4 border-blue-200 bg-blue-50">
                        <Calculator className="h-4 w-4" />
                        <AlertDescription className="text-blue-800">
                          <strong>Dati Statistici Richiesti:</strong> Inserisci i dati storici del segno che vuoi analizzare.
                          Il sistema calcolerà automaticamente probabilità stimata e valore atteso (EV).
                        </AlertDescription>
                      </Alert>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="currentSign">Segno da Analizzare</Label>
                          <Select value={currentSign} onValueChange={(value: '1' | 'X' | '2') => setCurrentSign(value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleziona segno" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1 (Casa)</SelectItem>
                              <SelectItem value="X">X (Pareggio)</SelectItem>
                              <SelectItem value="2">2 (Trasferta)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="currentDelay">Ritardo Attuale</Label>
                          <Input
                            id="currentDelay"
                            type="number"
                            value={currentDelay}
                            onChange={(e) => setCurrentDelay(Number(e.target.value))}
                            min="0"
                            step="1"
                          />
                          <p className="text-xs text-gray-500">Partite senza uscita del segno</p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="historicalFrequency">Frequenza Storica (%)</Label>
                          <Input
                            id="historicalFrequency"
                            type="number"
                            value={historicalFrequency}
                            onChange={(e) => setHistoricalFrequency(Number(e.target.value))}
                            min="1"
                            max="100"
                            step="0.1"
                          />
                          <p className="text-xs text-gray-500">% di uscite in 1000 partite</p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="avgDelay">Ritardo Medio</Label>
                          <Input
                            id="avgDelay"
                            type="number"
                            value={avgDelay}
                            onChange={(e) => setAvgDelay(Number(e.target.value))}
                            min="1"
                            step="0.1"
                          />
                          <p className="text-xs text-gray-500">Media dei ritardi storici</p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="maxDelay">Ritardo Massimo</Label>
                          <Input
                            id="maxDelay"
                            type="number"
                            value={maxDelay}
                            onChange={(e) => setMaxDelay(Number(e.target.value))}
                            min="1"
                            step="1"
                          />
                          <p className="text-xs text-gray-500">Massimo ritardo storico</p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="currentOdds">Quota Attuale</Label>
                          <Input
                            id="currentOdds"
                            type="number"
                            value={currentOdds}
                            onChange={(e) => setCurrentOdds(Number(e.target.value))}
                            min="1.01"
                            step="0.01"
                          />
                          <p className="text-xs text-gray-500">Quota decimale del bookmaker</p>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="advanced" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="stopLoss">Stop Loss (Livelli D'Alembert)</Label>
                          <Input
                            id="stopLoss"
                            type="number"
                            value={stopLoss}
                            onChange={(e) => setStopLoss(Number(e.target.value))}
                            min="3"
                            max="15"
                            step="1"
                          />
                          <p className="text-xs text-gray-500">Massimo 6 step D'Alembert consigliato</p>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="captureRate">Capture Rate (%)</Label>
                            <div className="flex items-center space-x-2">
                              <Label htmlFor="autoCaptureRate" className="text-sm text-gray-600">Auto</Label>
                              <input
                                id="autoCaptureRate"
                                type="checkbox"
                                checked={autoCaptureRate}
                                onChange={(e) => setAutoCaptureRate(e.target.checked)}
                                className="rounded border-gray-300"
                              />
                            </div>
                          </div>
                          <Input
                            id="captureRate"
                            type="number"
                            value={captureRate}
                            onChange={(e) => setCaptureRate(Number(e.target.value))}
                            min="50"
                            max="95"
                            step="1"
                            disabled={autoCaptureRate}
                            className={autoCaptureRate ? "bg-gray-100 text-gray-600" : ""}
                          />
                          <p className="text-xs text-gray-500">
                            {autoCaptureRate 
                              ? "Calcolato automaticamente dai risultati storici" 
                              : "% di successo reale del sistema (manuale)"}
                          </p>
                          {autoCaptureRate && betting?.sessions && Array.isArray(betting.sessions) && betting.sessions.length > 0 && (
                            <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                              <strong>Auto-Calcolato:</strong> Basato su {betting.sessions.filter((s: any) => s?.strategy === 'beat-delay').length || 0} sessioni precedenti
                            </div>
                          )}
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>

                  <div className="mt-6">
                    <Button 
                      onClick={handleStartSession}
                      className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white text-lg py-3"
                      size="lg"
                    >
                      <Play className="h-5 w-5 mr-2" />
                      Avvia Sessione Beat the Delay
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Session Progress */}
                <Card className="border-purple-200">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center">
                        <Trophy className="h-5 w-5 mr-2 text-purple-600" />
                        Progresso Sessione
                      </span>
                      <Badge variant={isInProfit ? "default" : "secondary"} 
                             className={isInProfit ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                        {isInProfit ? "In Profitto" : "In Perdita"}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm text-gray-600 mb-2">
                          <span>Progresso verso obiettivo ({targetReturn}%)</span>
                          <span>{Math.max(0, progressPercentage).toFixed(1)}%</span>
                        </div>
                        <Progress value={Math.max(0, progressPercentage)} className="h-3" />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">{state.level}</div>
                          <div className="text-sm text-gray-600">Livello Attuale</div>
                        </div>
                        <div className="text-center p-3 bg-orange-50 rounded-lg">
                          <div className="text-2xl font-bold text-orange-600">{state.consecutiveLosses}</div>
                          <div className="text-sm text-gray-600">Perdite Consecutive</div>
                        </div>
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">{formatCurrency(nextStake)}</div>
                          <div className="text-sm text-gray-600">Prossima Puntata</div>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">{betting.currentSession.betCount}</div>
                          <div className="text-sm text-gray-600">Scommesse Totali</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Betting Controls */}
                <Card className="border-purple-200">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Target className="h-5 w-5 mr-2 text-purple-600" />
                      Controlli Scommessa
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Button 
                        onClick={() => {
                          // Log automatico della scommessa con risultato
                          bettingLogger.logScommessa(
                            estimatedProbability, // prob classica
                            mlPrediction.probability, // prob ML
                            combinedProbability, // prob combinata
                            combinedEV, // EV combinato
                            currentOdds,
                            nextStake,
                            "VINTA", // risultato
                            betting.currentSession?.id,
                            betting.bets ? betting.bets.length + 1 : 1,
                            "Beat the Delay + ML"
                          );
                          
                          // Addestra ML con risultato positivo
                          mlPredictor.trainWithResult(
                            currentDelay, avgDelay, maxDelay, 
                            historicalFrequency / 100, currentOdds, true
                          );
                          
                          betting.placeBet(true);
                          // Vincita: ritardo si azzera o diminuisce
                          setNextBetDelay(Math.max(0, currentDelay - 1));
                          setNextBetOdds(currentOdds);
                          setNextHistoricalFrequency(historicalFrequency);
                          setNextAvgDelay(avgDelay);
                          setNextMaxDelay(maxDelay);
                          // Forza ricalcolo immediato per nuova raccomandazione
                          setTimeout(() => {
                            calculateEVAndDecision();
                            performMLPrediction();
                          }, 100);
                          setShowUpdatePanel(true);
                        }}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        size="lg"
                      >
                        <CheckCircle className="h-5 w-5 mr-2" />
                        Vincita ({formatCurrency(nextStake)})
                      </Button>
                      <Button 
                        onClick={() => {
                          // Log automatico della scommessa con risultato
                          bettingLogger.logScommessa(
                            estimatedProbability, // prob classica
                            mlPrediction.probability, // prob ML
                            combinedProbability, // prob combinata
                            combinedEV, // EV combinato
                            currentOdds,
                            nextStake,
                            "PERSA", // risultato
                            betting.currentSession?.id,
                            betting.bets ? betting.bets.length + 1 : 1,
                            "Beat the Delay + ML"
                          );
                          
                          // Addestra ML con risultato negativo
                          mlPredictor.trainWithResult(
                            currentDelay, avgDelay, maxDelay, 
                            historicalFrequency / 100, currentOdds, false
                          );
                          
                          betting.placeBet(false);
                          // Perdita: ritardo aumenta di 1
                          setNextBetDelay(currentDelay + 1);
                          setNextBetOdds(currentOdds);
                          setNextHistoricalFrequency(historicalFrequency);
                          setNextAvgDelay(avgDelay);
                          setNextMaxDelay(maxDelay);
                          // Forza ricalcolo immediato per nuova raccomandazione
                          setTimeout(() => {
                            calculateEVAndDecision();
                            performMLPrediction();
                          }, 100);
                          setShowUpdatePanel(true);
                        }}
                        variant="destructive"
                        className="flex-1"
                        size="lg"
                      >
                        <XCircle className="h-5 w-5 mr-2" />
                        Perdita ({formatCurrency(nextStake)})
                      </Button>
                    </div>
                    
                    {state.level > stopLoss * 0.7 && (
                      <Alert className="mt-4 border-orange-200 bg-orange-50">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription className="text-orange-800">
                          Attenzione: Stai raggiungendo livelli elevati nella progressione. 
                          Considera di limitare le puntate successive.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>

                {/* Post-Bet Update Panel */}
                {showUpdatePanel && (
                  <Card className="border-blue-200 bg-blue-50">
                    <CardHeader>
                      <CardTitle className="flex items-center text-blue-800">
                        <Activity className="h-5 w-5 mr-2" />
                        Aggiorna Valori per Prossima Scommessa
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                        <div>
                          <Label htmlFor="nextBetDelay">Ritardo Attuale</Label>
                          <Input
                            id="nextBetDelay"
                            type="number"
                            value={nextBetDelay}
                            onChange={(e) => setNextBetDelay(Number(e.target.value))}
                            min="0"
                            step="1"
                            className="mt-1"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Partite senza uscita del segno
                          </p>
                        </div>
                        <div>
                          <Label htmlFor="nextBetOdds">Quota Attuale</Label>
                          <Input
                            id="nextBetOdds"
                            type="number"
                            value={nextBetOdds}
                            onChange={(e) => setNextBetOdds(Number(e.target.value))}
                            min="1.01"
                            step="0.01"
                            className="mt-1"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Quota decimale del bookmaker
                          </p>
                        </div>
                        <div>
                          <Label htmlFor="nextHistoricalFrequency">Frequenza Storica (%)</Label>
                          <Input
                            id="nextHistoricalFrequency"
                            type="number"
                            value={nextHistoricalFrequency}
                            onChange={(e) => setNextHistoricalFrequency(Number(e.target.value))}
                            min="1"
                            max="100"
                            step="0.1"
                            className="mt-1"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            % di uscite in 1000 partite
                          </p>
                        </div>
                        <div>
                          <Label htmlFor="nextAvgDelay">Ritardo Medio</Label>
                          <Input
                            id="nextAvgDelay"
                            type="number"
                            value={nextAvgDelay}
                            onChange={(e) => setNextAvgDelay(Number(e.target.value))}
                            min="1"
                            step="0.1"
                            className="mt-1"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Media dei ritardi storici
                          </p>
                        </div>
                        <div>
                          <Label htmlFor="nextMaxDelay">Ritardo Massimo</Label>
                          <Input
                            id="nextMaxDelay"
                            type="number"
                            value={nextMaxDelay}
                            onChange={(e) => setNextMaxDelay(Number(e.target.value))}
                            min="1"
                            step="1"
                            className="mt-1"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Massimo ritardo storico
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-3">
                        <Button 
                          onClick={() => {
                            // Aggiorna tutti i valori statistici
                            setCurrentDelay(nextBetDelay);
                            setCurrentOdds(nextBetOdds);
                            setHistoricalFrequency(nextHistoricalFrequency);
                            setAvgDelay(nextAvgDelay);
                            setMaxDelay(nextMaxDelay);
                            setShowUpdatePanel(false);
                            
                            // Ricalcola immediatamente con i nuovi valori
                            setTimeout(() => {
                              calculateEVAndDecision();
                            }, 50);
                            
                            toast({
                              title: shouldPlay ? "✅ RACCOMANDAZIONE: GIOCA" : "❌ RACCOMANDAZIONE: ASPETTA",
                              description: shouldPlay 
                                ? "Il sistema rileva condizioni favorevoli per la prossima scommessa"
                                : "Condizioni non ancora ottimali, attendi miglioramenti",
                              variant: shouldPlay ? "default" : "destructive",
                            });
                          }}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Conferma e Continua
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setShowUpdatePanel(false)}
                        >
                          Annulla
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Calculation panels positioned below update panel after first bet */}
                {betting.currentSession && betting.bets && betting.bets.length > 0 && (
                  <div className="space-y-4">
                    {/* ML Analysis Display */}
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h5 className="font-semibold text-blue-800 mb-2 flex items-center">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Analisi Machine Learning Automatica
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-blue-600">Probabilità ML:</span>
                          <span className="font-bold ml-2">{(mlPrediction.probability * 100).toFixed(1)}%</span>
                        </div>
                        <div>
                          <span className="text-blue-600">Confidenza ML:</span>
                          <span className="font-bold ml-2">{mlPrediction.confidence.toFixed(1)}%</span>
                        </div>
                        <div className="col-span-1 md:col-span-2">
                          <span className="text-blue-600">Raccomandazione ML:</span>
                          <span className="font-bold ml-2">{mlPrediction.recommendation}</span>
                        </div>
                      </div>
                    </div>

                    {/* Pannello Confronto ML vs Classico */}
                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <h5 className="font-semibold text-purple-800 mb-3 flex items-center">
                        <Activity className="h-4 w-4 mr-2" />
                        Confronto Predizioni: Classico vs ML
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="text-center p-3 bg-white rounded border">
                          <div className="text-blue-600 font-semibold">Metodo Classico</div>
                          <div className="text-lg font-bold">{(estimatedProbability * 100).toFixed(1)}%</div>
                          <div className="text-xs text-gray-500">EV: {expectedValue.toFixed(3)}</div>
                        </div>
                        <div className="text-center p-3 bg-white rounded border">
                          <div className="text-green-600 font-semibold">Sistema ML</div>
                          <div className="text-lg font-bold">{(mlPrediction.probability * 100).toFixed(1)}%</div>
                          <div className="text-xs text-gray-500">Conf: {mlPrediction.confidence.toFixed(0)}%</div>
                        </div>
                        <div className="text-center p-3 bg-purple-100 rounded border border-purple-300">
                          <div className="text-purple-600 font-semibold">Combinato</div>
                          <div className="text-lg font-bold">{(combinedProbability * 100).toFixed(1)}%</div>
                          <div className="text-xs text-gray-500">EV: {combinedEV.toFixed(3)}</div>
                        </div>
                      </div>
                      <div className="mt-3 flex justify-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setShowMLComparison(!showMLComparison)}
                        >
                          {showMLComparison ? 'Nascondi' : 'Mostra'} Dettagli ML
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => bettingLogger.downloadCSV()}
                        >
                          Scarica Log CSV
                        </Button>
                      </div>
                    </div>

                    {/* Dettagli ML expandibili */}
                    {showMLComparison && (
                      <div className="p-4 bg-gray-50 rounded-lg border">
                        <h6 className="font-semibold text-gray-800 mb-3">Fattori di Analisi ML:</h6>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <span className="text-gray-600">Pattern Ritardo:</span>
                            <div className="font-bold">{(mlPrediction.factors.delayPattern * 100).toFixed(1)}%</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Trend Frequenza:</span>
                            <div className="font-bold">{(mlPrediction.factors.frequencyTrend * 100).toFixed(1)}%</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Valore Quote:</span>
                            <div className="font-bold">{(mlPrediction.factors.oddsValue * 100).toFixed(1)}%</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Performance Storica:</span>
                            <div className="font-bold">{(mlPrediction.factors.historicalPerformance * 100).toFixed(1)}%</div>
                          </div>
                        </div>
                        <div className="mt-3 p-2 bg-yellow-50 rounded text-xs text-yellow-800">
                          <strong>Nota:</strong> Il sistema ML lavora autonomamente e non interferisce con il metodo Beat the Delay classico. 
                          Serve solo per confronto e analisi aggiuntiva.
                        </div>
                      </div>
                    )}

                    {/* Additional calculation details */}
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h5 className="font-semibold mb-3 flex items-center">
                        <Calculator className="h-4 w-4 mr-2" />
                        Calcoli Dettagliati
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Probabilità Finale:</span>
                          <span className="font-bold ml-2">{(estimatedProbability * 100).toFixed(2)}%</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Valore Atteso (EV):</span>
                          <span className={`font-bold ml-2 ${expectedValue >= evThreshold ? 'text-green-600' : 'text-red-600'}`}>
                            {expectedValue.toFixed(4)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Recupero Auto:</span>
                          <span className={`font-bold ml-2 ${recoveryRate > recoveryAlertThreshold ? 'text-orange-600' : 'text-blue-600'}`}>
                            {(recoveryRate * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Prob. Combinata:</span>
                          <span className="font-bold ml-2 text-purple-600">{(combinedProbability * 100).toFixed(1)}%</span>
                        </div>
                        <div>
                          <span className="text-gray-600">EV Combinato:</span>
                          <span className="font-bold ml-2 text-purple-600">{combinedEV.toFixed(4)}</span>
                        </div>
                        <div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setShowAdvancedPopup(true)}
                            className="text-xs"
                          >
                            <Calculator className="h-3 w-3 mr-1" />
                            Configura
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Advanced Configuration Popup */}
                {showAdvancedPopup && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowAdvancedPopup(false)}>
                    <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4" onClick={(e) => e.stopPropagation()}>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <Calculator className="h-5 w-5 mr-2 text-purple-600" />
                          Configurazione Avanzata Sistema
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Recovery Rate Control */}
                        <div className="space-y-4">
                          <h4 className="font-semibold text-lg">Tasso di Recupero Post-Ritardo</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="recoveryRate">Tasso Recupero (%)</Label>
                              <Input
                                id="recoveryRate"
                                type="number"
                                value={(recoveryRate * 100).toFixed(1)}
                                onChange={(e) => setRecoveryRate(Number(e.target.value) / 100)}
                                min="0"
                                max="50"
                                step="0.1"
                                className="mt-1"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                % di uscite entro 5 partite dopo ritardo elevato
                              </p>
                            </div>
                            <div>
                              <Label htmlFor="recoveryAlertThreshold">Soglia Alert Recupero (%)</Label>
                              <Input
                                id="recoveryAlertThreshold"
                                type="number"
                                value={(recoveryAlertThreshold * 100).toFixed(1)}
                                onChange={(e) => setRecoveryAlertThreshold(Number(e.target.value) / 100)}
                                min="5"
                                max="30"
                                step="0.1"
                                className="mt-1"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Soglia per alert "Possibile inizio frequenza"
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* EV Threshold */}
                        <div className="space-y-4">
                          <h4 className="font-semibold text-lg">Soglie Valore Atteso</h4>
                          <div>
                            <Label htmlFor="evThreshold">Soglia EV Minima</Label>
                            <Input
                              id="evThreshold"
                              type="number"
                              value={evThreshold.toFixed(3)}
                              onChange={(e) => setEvThreshold(Number(e.target.value))}
                              min="0.001"
                              max="0.200"
                              step="0.001"
                              className="mt-1"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              EV minimo per considerare la scommessa profittevole
                            </p>
                          </div>
                        </div>

                        {/* Real-time Calculations */}
                        <div className="space-y-4">
                          <h4 className="font-semibold text-lg">Calcoli in Tempo Reale</h4>
                          <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Indice Anomalia Ritardo:</span>
                              <span className="font-bold">{anomalyIndex.toFixed(3)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Boost Ritardo (max 10%):</span>
                              <span className="font-bold">{(anomalyIndex * 0.10 * 100).toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Boost Recupero:</span>
                              <span className="font-bold">{(recoveryRate * 100).toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Probabilità Base:</span>
                              <span className="font-bold">{(historicalFrequency / 100).toFixed(3)}</span>
                            </div>
                            <div className="flex justify-between border-t pt-2">
                              <span>Probabilità Corretta:</span>
                              <span className="font-bold text-blue-600">{(estimatedProbability).toFixed(3)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                          <Button 
                            onClick={() => {
                              setShowAdvancedPopup(false);
                              calculateEVAndDecision(); // Ricalcola con nuovi parametri
                              toast({
                                title: "Configurazione Salvata",
                                description: "Sistema aggiornato con nuovi parametri di calcolo.",
                              });
                            }}
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Salva Configurazione
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => setShowAdvancedPopup(false)}
                          >
                            Annulla
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Animated Progress Tracker */}
                <AnimatedProgressTracker session={betting.currentSession} />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Strategy Info */}
            <Card className="border-purple-200">
              <CardHeader>
                <CardTitle className="text-lg">Info Strategia</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-3">
                <div>
                  <strong className="text-purple-600">Beat the Delay</strong> è una strategia progressiva avanzata
                  che utilizza un fattore di ritardo per controllare l'incremento delle puntate.
                </div>
                <div>
                  <strong>Funzionamento:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-xs">
                    <li>Inizia con puntata base</li>
                    <li>Dopo ogni perdita: Puntata × Fattore Ritardo</li>
                    <li>Dopo ogni vincita: Reset al livello base</li>
                    <li>Controllo rischio tramite livelli massimi</li>
                  </ul>
                </div>
                <div>
                  <strong>Vantaggi:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-xs">
                    <li>Crescita controllata delle puntate</li>
                    <li>Recupero graduali delle perdite</li>
                    <li>Flessibilità nel fattore ritardo</li>
                    <li>Protezione tramite limiti</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Current Session Stats */}
            {betting.currentSession && (
              <>
                <Card className="border-purple-200">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Statistiche Sessione
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-gray-500">Vincite</div>
                        <div className="font-bold text-green-600">{betting.currentSession.wins}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Perdite</div>
                        <div className="font-bold text-red-600">{betting.currentSession.losses}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Win Rate</div>
                        <div className="font-bold">
                          {betting.currentSession.betCount > 0 
                            ? `${((betting.currentSession.wins / betting.currentSession.betCount) * 100).toFixed(1)}%`
                            : "0%"
                          }
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500">ROI</div>
                        <div className={`font-bold ${isInProfit ? 'text-green-600' : 'text-red-600'}`}>
                          {(((betting.currentSession.currentBankroll - betting.currentSession.initialBankroll) / betting.currentSession.initialBankroll) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>

                    {/* Sparkline Chart */}
                    {betting.bets && Array.isArray(betting.bets) && betting.bets.length > 0 && (
                      <div className="mt-4">
                        <Label className="text-sm font-medium">Andamento Bankroll</Label>
                        <div className="mt-2">
                          <SparklineChart 
                            bets={betting.bets} 
                            height={80}
                            lineColor="#8b5cf6"
                            showRecentBankroll={true}
                            showDelta={true}
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Badges Display */}
                <BadgesDisplay session={betting.currentSession} bets={betting.bets || []} />

                {/* Bet History */}
                {betting.bets && Array.isArray(betting.bets) && betting.bets.length > 0 && (
                  <Card className="border-purple-200">
                    <CardHeader>
                      <CardTitle className="text-lg">Storico Recente</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {betting.bets.slice(-10).reverse().map((bet: BetData) => (
                          <div key={bet.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                            <div className="flex items-center space-x-2">
                              <div className={`w-3 h-3 rounded-full ${bet.win ? 'bg-green-500' : 'bg-red-500'}`} />
                              <span className="text-sm">Bet #{bet.betNumber}</span>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium">{formatCurrency(bet.stake)}</div>
                              <div className="text-xs text-gray-500">
                                {bet.win ? `+${formatCurrency((bet.potentialWin || 0) - bet.stake)}` : `-${formatCurrency(bet.stake)}`}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Session Screenshot */}
                <SessionScreenshot session={betting.currentSession} bets={betting.bets || []} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}