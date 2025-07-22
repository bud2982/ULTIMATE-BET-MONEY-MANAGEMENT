import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useBetting } from "@/hooks/use-betting";
import { BettingStrategy, BetData, SessionData, KellyEvent } from "@/types/betting";
import { formatCurrency, getStrategyDisplayName } from "@/lib/betting-strategies";
import SparklineChart from "@/components/sparkline-chart";
import AnimatedProgressTracker from "@/components/animated-progress-tracker";
import BadgesDisplay from "@/components/badges-display";
import SessionScreenshot from "@/components/session-screenshot";
import { AlertCircle, CheckCircle, XCircle, Plus, Trash2, Calculator, BarChart3, TrendingUp, Loader2, HelpCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";

export default function StrategyKelly() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const betting = useBetting();
  const [confirmingReset, setConfirmingReset] = useState(false);
  
  // Form state
  const [initialBankroll, setInitialBankroll] = useState(1000);
  const [kellyFraction, setKellyFraction] = useState(25); // 25% del Kelly pieno
  const [maxRiskPercentage, setMaxRiskPercentage] = useState(20); // 20% rischio massimo simultaneo
  const [maxSingleStake, setMaxSingleStake] = useState(100); // Puntata massima per singolo evento
  const [sessionName, setSessionName] = useState(`Sessione Kelly Ridotto ${new Date().toLocaleDateString()}`);
  const [targetReturn, setTargetReturn] = useState(30);
  
  // Risk Tolerance Settings
  const [riskTolerance, setRiskTolerance] = useState(50); // 0-100 scale
  const [dynamicKellyEnabled, setDynamicKellyEnabled] = useState(true);
  
  // Eventi Kelly
  const [events, setEvents] = useState<KellyEvent[]>([
    { id: '1', name: 'Evento A', quotaBookmaker: 2.00, probabilitaStimata: 0.55 },
    { id: '2', name: 'Evento B', quotaBookmaker: 2.40, probabilitaStimata: 0.40 },
    { id: '3', name: 'Evento C', quotaBookmaker: 1.65, probabilitaStimata: 0.50 }
  ]);

  // Probability Calculator state
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [calcMethod, setCalcMethod] = useState<'quote' | 'poisson'>('quote');
  
  // Quote method state
  const [calcQuota1, setCalcQuota1] = useState(2.50);
  const [calcQuotaX, setCalcQuotaX] = useState(3.20);
  const [calcQuota2, setCalcQuota2] = useState(2.80);
  
  // Poisson method state
  const [avgHome, setAvgHome] = useState(1.5);
  const [avgAway, setAvgAway] = useState(1.2);
  const [maxGoals, setMaxGoals] = useState(6);
  
  // Results state
  const [calcProbNormalized, setCalcProbNormalized] = useState({});
  const [calcKellyResults, setCalcKellyResults] = useState({
    "1": { classic: 0, reduced: 0 },
    "X": { classic: 0, reduced: 0 },
    "2": { classic: 0, reduced: 0 }
  });
  const [calcRecommendation, setCalcRecommendation] = useState("");
  
  // UI state
  const [isCalculating, setIsCalculating] = useState(false);
  const [savedPreferences, setSavedPreferences] = useState(() => {
    const saved = localStorage.getItem('kelly-calc-preferences');
    return saved ? JSON.parse(saved) : { method: 'quote', autoSave: true };
  });

  // Auto-load existing Kelly session
  useEffect(() => {
    if (!betting.currentSession && Array.isArray(betting.sessions) && betting.sessions.length > 0) {
      const kellySession = betting.sessions.find(s => s.strategy === 'kelly');
      if (kellySession && kellySession.betCount > 0) {
        betting.setCurrentSession(kellySession);
      }
    }
  }, [betting.sessions, betting.currentSession]);

  // Load preferences and set initial method
  useEffect(() => {
    if (savedPreferences.method && savedPreferences.method !== calcMethod) {
      setCalcMethod(savedPreferences.method);
    }
  }, []);

  // Save preferences when method changes
  useEffect(() => {
    if (savedPreferences.autoSave) {
      const newPreferences = { ...savedPreferences, method: calcMethod };
      localStorage.setItem('kelly-calc-preferences', JSON.stringify(newPreferences));
      setSavedPreferences(newPreferences);
    }
  }, [calcMethod]);

  // Auto-calculate probabilities when calculator inputs change
  useEffect(() => {
    if (calcMethod === 'quote' && calcQuota1 > 1 && calcQuotaX > 1 && calcQuota2 > 1) {
      calculateProbabilities();
    } else if (calcMethod === 'poisson' && avgHome > 0 && avgAway > 0) {
      calculateProbabilities();
    }
  }, [calcMethod, calcQuota1, calcQuotaX, calcQuota2, avgHome, avgAway, maxGoals]);

  // Save and load risk tolerance settings
  useEffect(() => {
    localStorage.setItem('kelly-risk-tolerance', riskTolerance.toString());
    localStorage.setItem('kelly-dynamic-enabled', dynamicKellyEnabled.toString());
  }, [riskTolerance, dynamicKellyEnabled]);

  useEffect(() => {
    const savedRiskTolerance = localStorage.getItem('kelly-risk-tolerance');
    const savedDynamicKelly = localStorage.getItem('kelly-dynamic-enabled');
    
    if (savedRiskTolerance) {
      setRiskTolerance(parseInt(savedRiskTolerance));
    }
    if (savedDynamicKelly) {
      setDynamicKellyEnabled(savedDynamicKelly === 'true');
    }
  }, []);

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
        setConfirmingReset(false);
      }
    } else {
      setConfirmingReset(true);
      
      toast({
        title: "Conferma reset",
        description: "Clicca di nuovo su 'Reset' per confermare.",
        variant: "default"
      });
      
      setTimeout(() => {
        setConfirmingReset(false);
      }, 5000);
    }
  };

  const handleCreateSession = () => {
    if (!initialBankroll || initialBankroll <= 0) {
      toast({
        title: "Errore",
        description: "Inserisci un bankroll iniziale valido",
        variant: "destructive"
      });
      return;
    }
    
    if (events.length === 0) {
      toast({
        title: "Errore",
        description: "Aggiungi almeno un evento",
        variant: "destructive"
      });
      return;
    }

    // Valida eventi
    for (const evento of events) {
      if (evento.quotaBookmaker <= 1 || evento.probabilitaStimata <= 0 || evento.probabilitaStimata >= 1) {
        toast({
          title: "Errore",
          description: `Evento ${evento.name}: quota deve essere > 1 e probabilità tra 0 e 1`,
          variant: "destructive"
        });
        return;
      }
    }

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
        strategy: 'kelly' as BettingStrategy,
        strategySettings: JSON.stringify({
          kellyFraction: kellyFraction / 100,
          maxRiskPercentage: maxRiskPercentage / 100,
          maxSingleStake,
          events,
          targetReturn
        })
      };
      
      betting.startNewSession(sessionData);
      
      toast({
        title: "Sessione creata",
        description: "La nuova sessione Kelly Ridotto è stata avviata!",
        variant: "default"
      });
    }, 100);
  };

  const addEvent = () => {
    const newEvent: KellyEvent = {
      id: Date.now().toString(),
      name: `Evento ${events.length + 1}`,
      quotaBookmaker: 2.00,
      probabilitaStimata: 0.50
    };
    setEvents([...events, newEvent]);
  };

  const removeEvent = (id: string) => {
    setEvents(events.filter(e => e.id !== id));
  };

  const updateEvent = (id: string, field: keyof KellyEvent, value: string | number) => {
    setEvents(events.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  // Calculate dynamic Kelly fraction based on risk tolerance
  const getDynamicKellyFraction = () => {
    if (!dynamicKellyEnabled) return kellyFraction / 100;
    
    // Risk tolerance scale: 0-100
    // Conservative (0-30): 10-25% Kelly
    // Moderate (31-70): 25-50% Kelly
    // Aggressive (71-100): 50-75% Kelly
    let dynamicFraction;
    if (riskTolerance <= 30) {
      dynamicFraction = 10 + (riskTolerance / 30) * 15; // 10-25%
    } else if (riskTolerance <= 70) {
      dynamicFraction = 25 + ((riskTolerance - 30) / 40) * 25; // 25-50%
    } else {
      dynamicFraction = 50 + ((riskTolerance - 70) / 30) * 25; // 50-75%
    }
    
    return Math.min(dynamicFraction / 100, 0.75); // Cap at 75%
  };

  const calculateKellyPreview = (quota: number, probabilita: number) => {
    const p = probabilita;
    const q = quota;
    const kellyPercent = ((p * (q - 1)) - (1 - p)) / (q - 1);
    
    if (kellyPercent <= 0) return { kelly: 0, stake: 0, recommended: false, riskLevel: 'none' };
    
    const fraction = getDynamicKellyFraction();
    const adjustedKelly = kellyPercent * fraction;
    const stake = Math.min(
      initialBankroll * adjustedKelly,
      maxSingleStake
    );
    
    // Determine risk level based on Kelly percentage
    let riskLevel = 'low';
    if (adjustedKelly > 0.15) riskLevel = 'high';
    else if (adjustedKelly > 0.08) riskLevel = 'medium';
    
    return {
      kelly: kellyPercent * 100,
      adjustedKelly: adjustedKelly * 100,
      stake: Math.round(stake * 100) / 100,
      recommended: true,
      riskLevel
    };
  };

  const getTotalStakePreview = () => {
    let total = 0;
    for (const evento of events) {
      const preview = calculateKellyPreview(evento.quotaBookmaker, evento.probabilitaStimata);
      if (preview.recommended) {
        total += preview.stake;
      }
    }
    
    const maxTotal = initialBankroll * (maxRiskPercentage / 100);
    if (total > maxTotal) {
      return { total: maxTotal, capped: true };
    }
    
    return { total, capped: false };
  };

  // Implementazione del nuovo codice Python fornito
  const calcola_probabilita_corretta = (quote: number[]) => {
    // Calcola le probabilità implicite
    const prob_implicite = quote.map(q => 1 / q);
    const somma = prob_implicite.reduce((sum, p) => sum + p, 0);
    // Rimuove il margine del bookmaker
    return prob_implicite.map(p => Math.round((p / somma) * 10000) / 10000);
  };

  const kelly_stake = (prob_stimata: number, quota: number, frazione_kelly: number = 1.0): number => {
    const b = quota - 1;
    const q = 1 - prob_stimata;
    const f = (b * prob_stimata - q) / b;
    // Applica Kelly ridotto
    const f_ridotto = f * frazione_kelly;
    return f_ridotto > 0 ? Math.round(f_ridotto * 10000) / 10000 : 0;
  };

  // Implementazione funzioni Poisson
  const poisson_prob = (lmbda: number, k: number): number => {
    const factorial = (n: number): number => n <= 1 ? 1 : n * factorial(n - 1);
    return (Math.pow(lmbda, k) * Math.exp(-lmbda)) / factorial(k);
  };

  const calcola_prob_poisson = (avg_home: number, avg_away: number, max_goals: number = 6) => {
    let prob_1 = 0.0;
    let prob_x = 0.0; 
    let prob_2 = 0.0;
    
    for (let home_goals = 0; home_goals <= max_goals; home_goals++) {
      for (let away_goals = 0; away_goals <= max_goals; away_goals++) {
        const p = poisson_prob(avg_home, home_goals) * poisson_prob(avg_away, away_goals);
        if (home_goals > away_goals) {
          prob_1 += p;
        } else if (home_goals === away_goals) {
          prob_x += p;
        } else {
          prob_2 += p;
        }
      }
    }
    
    return [
      Math.round(prob_1 * 10000) / 10000,
      Math.round(prob_x * 10000) / 10000,
      Math.round(prob_2 * 10000) / 10000
    ];
  };

  const calculateProbabilities = async () => {
    setIsCalculating(true);
    console.log('Calculating probabilities...', { calcMethod, calcQuota1, calcQuotaX, calcQuota2, avgHome, avgAway });
    
    // Simulate calculation delay for loading state
    await new Promise(resolve => setTimeout(resolve, 300));
    
    let prob_corrette: number[];
    let quota_scelta: number;
    let quote: number[];

    if (calcMethod === 'quote') {
      // Valida input quote
      if (calcQuota1 <= 1 || calcQuotaX <= 1 || calcQuota2 <= 1) {
        console.log('Invalid quotes, resetting results');
        setCalcProbNormalized({});
        setCalcKellyResults({
          "1": { classic: 0, reduced: 0 },
          "X": { classic: 0, reduced: 0 },
          "2": { classic: 0, reduced: 0 }
        });
        setCalcRecommendation("");
        return;
      }

      // 📌 Quote 1X2 da input utente
      quote = [calcQuota1, calcQuotaX, calcQuota2];  // [1, X, 2]
      prob_corrette = calcola_probabilita_corretta(quote);
      console.log('Quote method - probabilities:', prob_corrette);

    } else {
      // Valida input Poisson
      if (avgHome <= 0 || avgAway <= 0) {
        setCalcProbNormalized({});
        setCalcKellyResults({
          "1": { classic: 0, reduced: 0 },
          "X": { classic: 0, reduced: 0 },
          "2": { classic: 0, reduced: 0 }
        });
        setCalcRecommendation("");
        return;
      }

      // 📌 Calcolo Poisson
      prob_corrette = calcola_prob_poisson(avgHome, avgAway, maxGoals);
      
      // Per Poisson, utilizziamo le quote dell'interfaccia come riferimento
      quote = [calcQuota1, calcQuotaX, calcQuota2];
    }

    // Calcola Kelly per tutti e tre gli esiti (1, X, 2)
    const kellyResults = {
      "1": {
        classic: kelly_stake(prob_corrette[0], quote[0]),
        reduced: kelly_stake(prob_corrette[0], quote[0], 0.5)
      },
      "X": {
        classic: kelly_stake(prob_corrette[1], quote[1]),
        reduced: kelly_stake(prob_corrette[1], quote[1], 0.5)
      },
      "2": {
        classic: kelly_stake(prob_corrette[2], quote[2]),
        reduced: kelly_stake(prob_corrette[2], quote[2], 0.5)
      }
    };
    
    // Crea struttura compatibile per il display
    const probabilita = {
      "1": prob_corrette[0],
      "X": prob_corrette[1], 
      "2": prob_corrette[2]
    };

    // Aggiorna stati con i risultati
    console.log('Setting probabilities:', probabilita);
    console.log('Setting Kelly results:', kellyResults);
    
    setCalcProbNormalized(probabilita);
    setCalcKellyResults(kellyResults);

    // Trova il miglior valore Kelly e genera raccomandazione
    const bestOutcome = Object.entries(kellyResults).reduce((best, [outcome, kelly]) => {
      return kelly.reduced > best.value ? { outcome, value: kelly.reduced } : best;
    }, { outcome: "", value: 0 });

    let recommendation = "";
    if (bestOutcome.value <= 0) {
      recommendation = "Nessuna scommessa con valore - Non scommettere";
    } else if (bestOutcome.value < 0.02) {
      recommendation = `Miglior valore: segno ${bestOutcome.outcome} - Valore basso`;
    } else if (bestOutcome.value < 0.05) {
      recommendation = `Miglior valore: segno ${bestOutcome.outcome} - Valore moderato`;
    } else if (bestOutcome.value < 0.10) {
      recommendation = `Miglior valore: segno ${bestOutcome.outcome} - Buon valore`;
    } else {
      recommendation = `Miglior valore: segno ${bestOutcome.outcome} - Alto valore`;
    }
    
    console.log('Setting recommendation:', recommendation);
    setCalcRecommendation(recommendation);
    setIsCalculating(false);
  };

  const applyCalculatedProbability = (eventId: string, outcome: '1' | 'X' | '2') => {
    const probability = (calcProbNormalized as any)[outcome];
    if (probability > 0) {
      updateEvent(eventId, 'probabilitaStimata', probability);
      setCalculatorOpen(false);
      
      const outcomeNames = { '1': 'Casa', 'X': 'Pareggio', '2': 'Trasferta' };
      toast({
        title: "Probabilità applicata",
        description: `Probabilità ${outcomeNames[outcome]} ${(probability * 100).toFixed(2)}% applicata all'evento`
      });
    }
  };

  const getKellyState = () => {
    return betting.bettingState?.kelly;
  };

  const isInProfit = betting.currentSession 
    ? betting.currentSession.currentBankroll >= betting.currentSession.initialBankroll 
    : false;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/')}
                className="text-gray-600 hover:text-gray-900"
              >
                ← Torna alla Home
              </Button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                  {getStrategyDisplayName('kelly')}
                </h1>
                <p className="text-gray-600">Criterio Kelly per eventi simultanei con riduzione del rischio</p>
              </div>
            </div>
            {betting.currentSession && (
              <Button
                variant={confirmingReset ? "destructive" : "outline"}
                onClick={handleReset}
                className={`${confirmingReset ? 'animate-pulse' : ''}`}
              >
                {confirmingReset ? "Conferma Reset" : "Reset"}
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Content */}
          <div className="lg:col-span-2">
            {betting.currentSession && betting.currentSession.strategy === 'kelly' ? (
              <div className="space-y-6">
                {/* Status Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="bg-white">
                    <CardContent className="p-4">
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Bankroll Attuale</h3>
                      <p className={`text-xl font-bold ${isInProfit ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(betting.currentSession.currentBankroll)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Iniziale: {formatCurrency(betting.currentSession.initialBankroll)}
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-white">
                    <CardContent className="p-4">
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Puntata Totale</h3>
                      <p className="text-xl font-bold text-teal-600">
                        {formatCurrency(betting.nextStake)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Su {events.length} eventi
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-white">
                    <CardContent className="p-4">
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Scommesse</h3>
                      <p className="text-xl font-bold text-gray-800">
                        {betting.currentSession.wins}W - {betting.currentSession.losses}L
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {betting.currentSession.betCount} totali
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-white">
                    <CardContent className="p-4">
                      <h3 className="text-sm font-medium text-gray-500 mb-1">ROI</h3>
                      <p className={`text-xl font-bold ${isInProfit ? 'text-green-600' : 'text-red-600'}`}>
                        {((betting.currentSession.currentBankroll / betting.currentSession.initialBankroll - 1) * 100).toFixed(2)}%
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Kelly Events Table */}
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Eventi Kelly - Calcoli Dinamici</h3>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Evento</TableHead>
                            <TableHead>Quota</TableHead>
                            <TableHead>Probabilità</TableHead>
                            <TableHead>Kelly %</TableHead>
                            <TableHead>Stake</TableHead>
                            <TableHead>Esegui</TableHead>
                            <TableHead>Azione</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {events.map((evento) => {
                            const preview = calculateKellyPreview(evento.quotaBookmaker, evento.probabilitaStimata);
                            return (
                              <TableRow key={evento.id}>
                                <TableCell className="font-medium">{evento.name}</TableCell>
                                <TableCell>{evento.quotaBookmaker.toFixed(2)}</TableCell>
                                <TableCell>{(evento.probabilitaStimata * 100).toFixed(1)}%</TableCell>
                                <TableCell>
                                  <div className="space-y-1">
                                    <span className={preview.kelly > 0 ? 'text-green-600' : 'text-red-600'}>
                                      {preview.kelly.toFixed(2)}%
                                    </span>
                                    {dynamicKellyEnabled && preview.adjustedKelly && (
                                      <div className="text-xs text-blue-600">
                                        → {preview.adjustedKelly.toFixed(2)}%
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="font-medium">
                                  {preview.recommended ? formatCurrency(preview.stake) : '-'}
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-col gap-1">
                                    {preview.recommended ? (
                                      <Badge variant="default" className="bg-green-100 text-green-800">✓ Sì</Badge>
                                    ) : (
                                      <Badge variant="destructive">✗ No</Badge>
                                    )}
                                    {preview.recommended && preview.riskLevel && (
                                      <Badge 
                                        variant="outline" 
                                        className={`text-xs ${
                                          preview.riskLevel === 'high' ? 'border-red-300 text-red-700' :
                                          preview.riskLevel === 'medium' ? 'border-yellow-300 text-yellow-700' :
                                          'border-green-300 text-green-700'
                                        }`}
                                      >
                                        {preview.riskLevel === 'high' ? 'Alto' : 
                                         preview.riskLevel === 'medium' ? 'Medio' : 'Basso'}
                                      </Badge>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => betting.placeBet(true)}
                                      disabled={!preview.recommended}
                                      className="bg-green-50 hover:bg-green-100"
                                    >
                                      Vinta
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => betting.placeBet(false)}
                                      disabled={!preview.recommended}
                                      className="bg-red-50 hover:bg-red-100"
                                    >
                                      Persa
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                    
                    {/* Summary */}
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Totale Investimento:</span>
                          <div className="font-medium">{formatCurrency(getTotalStakePreview().total)}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Frazione Kelly:</span>
                          <div className="font-medium">{kellyFraction}%</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Rischio Max:</span>
                          <div className="font-medium">{maxRiskPercentage}%</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Cap Applicato:</span>
                          <div className="font-medium">{getTotalStakePreview().capped ? 'Sì' : 'No'}</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Progress Tracker and Charts */}
                <AnimatedProgressTracker session={betting.currentSession} />
                
                {betting.bets && betting.bets.length > 0 && (
                  <div className="mb-6 mt-2">
                    <h3 className="text-sm font-medium text-gray-600 mb-2">Andamento Bankroll</h3>
                    <div className="h-24 w-full">
                      <SparklineChart 
                        bets={betting.bets} 
                        lineColor="#059669" 
                        height={90} 
                        animated={true}
                        showTooltip={true}
                        showRecentBankroll={true}
                        showDelta={true}
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Create New Session Form */
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Nuova Sessione Kelly Ridotto</h2>
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="sessionName">Nome Sessione</Label>
                      <Input
                        id="sessionName"
                        value={sessionName}
                        onChange={(e) => setSessionName(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="mb-1 block">Bankroll Iniziale (€)</Label>
                        <Input
                          type="number"
                          value={initialBankroll}
                          onChange={(e) => setInitialBankroll(Number(e.target.value))}
                          min="10"
                        />
                      </div>
                      <div>
                        <Label className="mb-1 block">Rendimento Target (%)</Label>
                        <Input
                          type="number"
                          value={targetReturn}
                          onChange={(e) => setTargetReturn(Number(e.target.value))}
                          min="1"
                          max="100"
                        />
                      </div>
                    </div>

                    {/* Risk Tolerance Slider */}
                    <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between mb-3">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          Tolleranza al Rischio Personalizzata
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-sm">
                                <p>Regola dinamicamente la frazione Kelly in base al tuo profilo di rischio. 
                                Conservativo (0-30): 10-25% Kelly, Moderato (31-70): 25-50% Kelly, 
                                Aggressivo (71-100): 50-75% Kelly</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </Label>
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={dynamicKellyEnabled}
                              onChange={(e) => setDynamicKellyEnabled(e.target.checked)}
                              className="rounded"
                            />
                            Dinamico
                          </label>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600">Conservativo</span>
                          <span className="text-xs text-gray-600">Moderato</span>
                          <span className="text-xs text-gray-600">Aggressivo</span>
                        </div>
                        
                        <Slider
                          value={[riskTolerance]}
                          onValueChange={(value) => setRiskTolerance(value[0])}
                          max={100}
                          min={0}
                          step={5}
                          className="w-full"
                          disabled={!dynamicKellyEnabled}
                        />
                        
                        <div className="flex justify-between text-sm">
                          <span className={`font-medium ${riskTolerance <= 30 ? 'text-green-600' : 'text-gray-400'}`}>
                            0-30
                          </span>
                          <span className={`font-medium ${riskTolerance > 30 && riskTolerance <= 70 ? 'text-yellow-600' : 'text-gray-400'}`}>
                            31-70
                          </span>
                          <span className={`font-medium ${riskTolerance > 70 ? 'text-red-600' : 'text-gray-400'}`}>
                            71-100
                          </span>
                        </div>
                        
                        <div className="bg-white p-3 rounded border">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Valore corrente:</span>
                            <span className="font-bold text-lg">{riskTolerance}</span>
                          </div>
                          {dynamicKellyEnabled && (
                            <div className="flex justify-between items-center mt-1">
                              <span className="text-xs text-gray-500">Frazione Kelly dinamica:</span>
                              <span className="text-sm font-medium text-blue-600">
                                {(getDynamicKellyFraction() * 100).toFixed(1)}%
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="mb-1 block">Frazione Kelly (%)</Label>
                        <Input
                          type="number"
                          value={kellyFraction}
                          onChange={(e) => setKellyFraction(Number(e.target.value))}
                          min="10"
                          max="50"
                          step="5"
                          disabled={dynamicKellyEnabled}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {dynamicKellyEnabled ? 
                            `Automatico: ${(getDynamicKellyFraction() * 100).toFixed(1)}%` : 
                            'Riduzione del Kelly pieno (consigliato 25%)'
                          }
                        </p>
                      </div>
                      <div>
                        <Label className="mb-1 block">Rischio Max Simultaneo (%)</Label>
                        <Input
                          type="number"
                          value={maxRiskPercentage}
                          onChange={(e) => setMaxRiskPercentage(Number(e.target.value))}
                          min="5"
                          max="50"
                          step="5"
                        />
                        <p className="text-xs text-gray-500 mt-1">Cap totale per tutti gli eventi</p>
                      </div>
                      <div>
                        <Label className="mb-1 block">Puntata Max Singola (€)</Label>
                        <Input
                          type="number"
                          value={maxSingleStake}
                          onChange={(e) => setMaxSingleStake(Number(e.target.value))}
                          min="1"
                        />
                        <p className="text-xs text-gray-500 mt-1">Limite per singolo evento</p>
                      </div>
                    </div>

                    {/* Eventi Configuration */}
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <Label className="text-base font-medium">Configurazione Eventi</Label>
                        <div className="flex gap-2">
                          <Dialog open={calculatorOpen} onOpenChange={setCalculatorOpen}>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline">
                                <BarChart3 className="w-4 h-4 mr-1" />
                                Probability Calculator
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-none max-h-none w-screen h-screen m-0 p-0">
                              <div className="w-full h-full overflow-auto">
                                <div className="p-6 min-w-[800px]">
                                  <DialogHeader className="sticky top-0 bg-background z-10 pb-4">
                                  <DialogTitle className="flex items-center gap-2">
                                    <Calculator className="w-5 h-5" />
                                    Calcolatore di Probabilità Kelly
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-xs">
                                          <p>Il criterio di Kelly calcola la frazione ottimale del bankroll da scommettere per massimizzare la crescita a lungo termine</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </DialogTitle>
                                  <DialogDescription>
                                    Calcola probabilità ottimali per le tue scommesse usando quote bookmaker o distribuzione Poisson
                                  </DialogDescription>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Badge variant="outline">Metodo salvato: {savedPreferences.method === 'quote' ? 'Quote' : 'Poisson'}</Badge>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      onClick={() => {
                                        const newPrefs = { ...savedPreferences, autoSave: !savedPreferences.autoSave };
                                        setSavedPreferences(newPrefs);
                                        localStorage.setItem('kelly-calc-preferences', JSON.stringify(newPrefs));
                                      }}
                                    >
                                      {savedPreferences.autoSave ? 'Salvataggio: ON' : 'Salvataggio: OFF'}
                                    </Button>
                                  </div>
                                </DialogHeader>
                              <Tabs defaultValue="calculator" className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                  <TabsTrigger value="calculator">Calcolatore</TabsTrigger>
                                  <TabsTrigger value="guide">Guida</TabsTrigger>
                                </TabsList>
                                <TabsContent value="calculator" className="space-y-4">
                                  {/* Method Selection */}
                                  <div className="mb-4">
                                    <Label className="text-base font-medium">Metodo di Calcolo</Label>
                                    <Tabs value={calcMethod} onValueChange={(value) => setCalcMethod(value as 'quote' | 'poisson')} className="w-full mt-2">
                                      <TabsList className="grid w-full grid-cols-2">
                                        <TabsTrigger value="quote">Quote Bookmaker</TabsTrigger>
                                        <TabsTrigger value="poisson">Distribuzione Poisson</TabsTrigger>
                                      </TabsList>
                                      
                                      <TabsContent value="quote" className="mt-4">
                                        <div className="overflow-x-auto">
                                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 min-w-[300px]">
                                            <div className="min-w-0">
                                              <Label className="text-sm font-medium">Quota segno 1</Label>
                                              <Input
                                                type="number"
                                                value={calcQuota1}
                                                onChange={(e) => setCalcQuota1(parseFloat(e.target.value) || 2.50)}
                                                min="1.01"
                                                step="0.01"
                                                className="mt-1"
                                              />
                                            </div>
                                            <div className="min-w-0">
                                              <Label className="text-sm font-medium">Quota segno X</Label>
                                              <Input
                                                type="number"
                                                value={calcQuotaX}
                                                onChange={(e) => setCalcQuotaX(parseFloat(e.target.value) || 3.20)}
                                                min="1.01"
                                                step="0.01"
                                                className="mt-1"
                                              />
                                            </div>
                                            <div className="min-w-0">
                                              <Label className="text-sm font-medium">Quota segno 2</Label>
                                              <Input
                                                type="number"
                                                value={calcQuota2}
                                                onChange={(e) => setCalcQuota2(parseFloat(e.target.value) || 2.80)}
                                                min="1.01"
                                                step="0.01"
                                                className="mt-1"
                                              />
                                            </div>
                                          </div>
                                        </div>
                                      </TabsContent>
                                      
                                      <TabsContent value="poisson" className="mt-4">
                                        <div className="overflow-x-auto">
                                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 min-w-[320px]">
                                            <div className="min-w-0">
                                              <Label className="text-sm font-medium">Media gol casa (λ)</Label>
                                              <Input
                                                type="number"
                                                value={avgHome}
                                                onChange={(e) => setAvgHome(parseFloat(e.target.value) || 1.5)}
                                                min="0.1"
                                                step="0.1"
                                                className="mt-1"
                                              />
                                            </div>
                                            <div className="min-w-0">
                                              <Label className="text-sm font-medium">Media gol trasferta (λ)</Label>
                                              <Input
                                                type="number"
                                                value={avgAway}
                                                onChange={(e) => setAvgAway(parseFloat(e.target.value) || 1.2)}
                                                min="0.1"
                                                step="0.1"
                                                className="mt-1"
                                              />
                                            </div>
                                            <div className="min-w-0">
                                              <Label className="text-sm font-medium">Gol massimi</Label>
                                              <Input
                                                type="number"
                                                value={maxGoals}
                                                onChange={(e) => setMaxGoals(parseInt(e.target.value) || 6)}
                                                min="3"
                                                max="10"
                                                className="mt-1"
                                              />
                                            </div>
                                            <div className="min-w-0">
                                              <Label className="text-sm font-medium">Quota pareggio</Label>
                                              <Input
                                                type="number"
                                                value={calcQuotaX}
                                                onChange={(e) => setCalcQuotaX(parseFloat(e.target.value) || 3.20)}
                                                min="1.01"
                                                step="0.01"
                                                className="mt-1"
                                              />
                                              <p className="text-xs text-muted-foreground mt-1">Per calcolo Kelly</p>
                                            </div>
                                          </div>
                                        </div>
                                      </TabsContent>
                                    </Tabs>
                                  </div>
                                  
                                  <Button onClick={calculateProbabilities} className="w-full mb-4" disabled={isCalculating}>
                                    {isCalculating ? (
                                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                      <Calculator className="w-4 h-4 mr-2" />
                                    )}
                                    {isCalculating ? 'Calcolando...' : 'Calcola Probabilità'}
                                  </Button>
                                  
                                  {(Object.keys(calcProbNormalized).length > 0 || calcRecommendation) && (
                                    <div className="space-y-4">
                                      <div className="p-4 bg-gray-50 rounded-lg">
                                        <h4 className="font-medium mb-3">Risultati Calcolo</h4>
                                        <div className="space-y-3 text-sm">
                                        <div>
                                          <h5 className="font-medium mb-2 flex items-center gap-2">
                                            Probabilità Calcolate
                                            <TooltipProvider>
                                              <Tooltip>
                                                <TooltipTrigger asChild>
                                                  <HelpCircle className="w-3 h-3 text-muted-foreground cursor-help" />
                                                </TooltipTrigger>
                                                <TooltipContent className="max-w-xs">
                                                  <p>Probabilità normalizzate che rimuovono il margine del bookmaker</p>
                                                </TooltipContent>
                                              </Tooltip>
                                            </TooltipProvider>
                                          </h5>
                                          <div className="space-y-1">
                                            <div className="flex justify-between">
                                              <span>Segno 1 (Casa):</span>
                                              <span className="font-mono">{((calcProbNormalized as any)["1"] * 100 || 0).toFixed(2)}%</span>
                                            </div>
                                            <div className="flex justify-between">
                                              <span>Segno X (Pareggio):</span>
                                              <span className="font-mono">{((calcProbNormalized as any)["X"] * 100 || 0).toFixed(2)}%</span>
                                            </div>
                                            <div className="flex justify-between">
                                              <span>Segno 2 (Trasferta):</span>
                                              <span className="font-mono">{((calcProbNormalized as any)["2"] * 100 || 0).toFixed(2)}%</span>
                                            </div>
                                          </div>
                                        </div>
                                        
                                        <div>
                                          <h5 className="font-medium mb-2 flex items-center gap-2">
                                            Kelly Classico
                                            <TooltipProvider>
                                              <Tooltip>
                                                <TooltipTrigger asChild>
                                                  <HelpCircle className="w-3 h-3 text-muted-foreground cursor-help" />
                                                </TooltipTrigger>
                                                <TooltipContent className="max-w-xs">
                                                  <p>Formula Kelly completa: f = (bp - q) / b dove b=quota-1, p=probabilità, q=1-p</p>
                                                </TooltipContent>
                                              </Tooltip>
                                            </TooltipProvider>
                                          </h5>
                                          <div className="space-y-1">
                                            <div className="flex justify-between">
                                              <span>Segno 1:</span>
                                              <span className={`font-mono ${(calcKellyResults as any)["1"]?.classic > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {(((calcKellyResults as any)["1"]?.classic || 0) * 100).toFixed(2)}%
                                              </span>
                                            </div>
                                            <div className="flex justify-between">
                                              <span>Segno X:</span>
                                              <span className={`font-mono ${(calcKellyResults as any)["X"]?.classic > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {(((calcKellyResults as any)["X"]?.classic || 0) * 100).toFixed(2)}%
                                              </span>
                                            </div>
                                            <div className="flex justify-between">
                                              <span>Segno 2:</span>
                                              <span className={`font-mono ${(calcKellyResults as any)["2"]?.classic > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {(((calcKellyResults as any)["2"]?.classic || 0) * 100).toFixed(2)}%
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                        
                                        <div>
                                          <h5 className="font-medium mb-2 flex items-center gap-2">
                                            Kelly Ridotto (50%)
                                            <TooltipProvider>
                                              <Tooltip>
                                                <TooltipTrigger asChild>
                                                  <HelpCircle className="w-3 h-3 text-muted-foreground cursor-help" />
                                                </TooltipTrigger>
                                                <TooltipContent className="max-w-xs">
                                                  <p>Kelly ridotto per controllo del rischio: f_ridotto = f_kelly × 0.5. Più conservativo ma più sicuro</p>
                                                </TooltipContent>
                                              </Tooltip>
                                            </TooltipProvider>
                                          </h5>
                                          <div className="space-y-1">
                                            <div className="flex justify-between">
                                              <span>Segno 1:</span>
                                              <span className={`font-mono ${(calcKellyResults as any)["1"]?.reduced > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {(((calcKellyResults as any)["1"]?.reduced || 0) * 100).toFixed(2)}%
                                              </span>
                                            </div>
                                            <div className="flex justify-between">
                                              <span>Segno X:</span>
                                              <span className={`font-mono ${(calcKellyResults as any)["X"]?.reduced > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {(((calcKellyResults as any)["X"]?.reduced || 0) * 100).toFixed(2)}%
                                              </span>
                                            </div>
                                            <div className="flex justify-between">
                                              <span>Segno 2:</span>
                                              <span className={`font-mono ${(calcKellyResults as any)["2"]?.reduced > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {(((calcKellyResults as any)["2"]?.reduced || 0) * 100).toFixed(2)}%
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                      {calcRecommendation && (
                                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                          <div className="text-sm font-medium text-blue-900">
                                            {calcRecommendation}
                                          </div>
                                        </div>
                                      )}
                                      <div className="space-y-3">
                                        <Label>Applica probabilità a evento:</Label>
                                        {events.map((evento) => (
                                          <div key={evento.id} className="p-3 border rounded-lg bg-white">
                                            <div className="font-medium text-sm mb-2">{evento.name}</div>
                                            <div className="grid grid-cols-3 gap-2">
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => applyCalculatedProbability(evento.id, '1')}
                                                disabled={!((calcProbNormalized as any)["1"] > 0)}
                                                className="text-xs"
                                              >
                                                Segno 1
                                                <br />
                                                {((calcProbNormalized as any)["1"] * 100 || 0).toFixed(1)}%
                                              </Button>
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => applyCalculatedProbability(evento.id, 'X')}
                                                disabled={!((calcProbNormalized as any)["X"] > 0)}
                                                className="text-xs"
                                              >
                                                Segno X
                                                <br />
                                                {((calcProbNormalized as any)["X"] * 100 || 0).toFixed(1)}%
                                              </Button>
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => applyCalculatedProbability(evento.id, '2')}
                                                disabled={!((calcProbNormalized as any)["2"] > 0)}
                                                className="text-xs"
                                              >
                                                Segno 2
                                                <br />
                                                {((calcProbNormalized as any)["2"] * 100 || 0).toFixed(1)}%
                                              </Button>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                    </div>
                                  )}
                                </TabsContent>
                                <TabsContent value="guide" className="space-y-4">
                                  <div className="prose prose-sm max-w-none">
                                    <h4>Metodo Quote Bookmaker</h4>
                                    <div className="space-y-2">
                                      <p><strong>1. Quote 1-X-2:</strong> Inserisci le tre quote del bookmaker per segno 1, pareggio (X) e segno 2</p>
                                      <p><strong>2. Normalizzazione:</strong> Il sistema calcola automaticamente le probabilità corrette normalizzate</p>
                                      <p><strong>3. Kelly per segno X:</strong> Calcola frazione Kelly classico e ridotto per il pareggio</p>
                                    </div>
                                    
                                    <h4 className="mt-4">Metodo Distribuzione Poisson</h4>
                                    <div className="space-y-2">
                                      <p><strong>1. Media gol:</strong> Inserisci la media gol attesa per squadra casa e trasferta (λ)</p>
                                      <p><strong>2. Simulazione:</strong> Il sistema simula tutti i possibili risultati fino al numero massimo di gol</p>
                                      <p><strong>3. Probabilità calcolate:</strong> Ottieni probabilità teoriche basate su modello statistico</p>
                                      <p><strong>4. Quota di riferimento:</strong> Inserisci quota bookmaker per calcolo Kelly finale</p>
                                    </div>
                                    
                                    <h4 className="mt-4">Interpretazione Risultati</h4>
                                    <div className="space-y-1">
                                      <p><strong>Probabilità 1-X-2:</strong> Probabilità per vittoria casa, pareggio, vittoria trasferta</p>
                                      <p><strong>Kelly classico:</strong> Frazione ottimale teorica per ciascun esito</p>
                                      <p><strong>Kelly ridotto (50%):</strong> Frazione consigliata con controllo del rischio</p>
                                      <p><strong>Valori positivi:</strong> Indicano scommesse con valore matematico</p>
                                      <p><strong>Valori negativi/zero:</strong> Scommesse sfavorevoli da evitare</p>
                                      <p><strong>Miglior valore:</strong> Il sistema identifica automaticamente l'esito più vantaggioso</p>
                                    </div>
                                  </div>
                                </TabsContent>
                              </Tabs>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button onClick={addEvent} size="sm" variant="outline">
                            <Plus className="w-4 h-4 mr-1" />
                            Aggiungi Evento
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        {events.map((evento, index) => {
                          const preview = calculateKellyPreview(evento.quotaBookmaker, evento.probabilitaStimata);
                          return (
                            <div key={evento.id} className="p-4 border rounded-lg bg-gray-50">
                              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                                <div>
                                  <Label className="text-xs">Nome Evento</Label>
                                  <Input
                                    value={evento.name}
                                    onChange={(e) => updateEvent(evento.id, 'name', e.target.value)}
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Quota Bookmaker</Label>
                                  <Input
                                    type="number"
                                    value={evento.quotaBookmaker}
                                    onChange={(e) => updateEvent(evento.id, 'quotaBookmaker', parseFloat(e.target.value) || 2.00)}
                                    min="1.01"
                                    step="0.01"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Probabilità Stimata</Label>
                                  <Input
                                    type="number"
                                    value={evento.probabilitaStimata}
                                    onChange={(e) => updateEvent(evento.id, 'probabilitaStimata', parseFloat(e.target.value) || 0.50)}
                                    min="0.01"
                                    max="0.99"
                                    step="0.01"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Kelly & Stake</Label>
                                  <div className="text-sm">
                                    <div className={preview.kelly > 0 ? 'text-green-600' : 'text-red-600'}>
                                      {preview.kelly.toFixed(2)}% → {preview.recommended ? formatCurrency(preview.stake) : 'No bet'}
                                    </div>
                                  </div>
                                </div>
                                <div>
                                  <Button
                                    onClick={() => removeEvent(evento.id)}
                                    size="sm"
                                    variant="outline"
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="bg-emerald-50 p-4 rounded-lg">
                      <h4 className="font-medium mb-2 flex items-center">
                        <Calculator className="w-4 h-4 mr-2" />
                        Riepilogo Calcoli Kelly
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Eventi Totali:</span>
                          <div className="font-medium">{events.length}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Eventi Raccomandati:</span>
                          <div className="font-medium">{events.filter(e => calculateKellyPreview(e.quotaBookmaker, e.probabilitaStimata).recommended).length}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Investimento Totale:</span>
                          <div className="font-medium">{formatCurrency(getTotalStakePreview().total)}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">% del Bankroll:</span>
                          <div className="font-medium">{((getTotalStakePreview().total / initialBankroll) * 100).toFixed(1)}%</div>
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:via-teal-700 hover:to-cyan-700 text-white"
                      onClick={handleCreateSession}
                    >
                      Inizia Sessione Kelly Ridotto
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* How it Works */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Come Funziona Kelly Ridotto</h2>
                <div className="space-y-4 text-sm">
                  <p>
                    <strong>Kelly Ridotto</strong> applica il criterio Kelly con riduzione del rischio 
                    per calcolare la puntata ottimale su eventi simultanei.
                  </p>
                  
                  <div>
                    <p className="font-semibold">Formula Kelly:</p>
                    <p className="text-xs text-gray-600 mt-1 font-mono">
                      Kelly% = [(p × (q-1)) - (1-p)] / (q-1)
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Dove p = probabilità stimata, q = quota bookmaker
                    </p>
                  </div>

                  <div>
                    <p className="font-semibold">Caratteristiche:</p>
                    <ul className="list-disc pl-5 space-y-1 mt-2">
                      <li>Riduzione del Kelly pieno (25% consigliato)</li>
                      <li>Cap di rischio simultaneo su tutti gli eventi</li>
                      <li>Limite massimo per singola puntata</li>
                      <li>Solo eventi con Kelly positivo vengono giocati</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-semibold">Regole di Sicurezza:</p>
                    <ul className="list-disc pl-5 space-y-1 mt-2">
                      <li>Se Kelly ≤ 0, nessuna puntata</li>
                      <li>Stake totale ≤ % max del bankroll</li>
                      <li>Ogni evento ha un cap individuale</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Badges and Session Screenshot */}
            {betting.currentSession && (
              <>
                <BadgesDisplay session={betting.currentSession} bets={betting.bets || []} />
                <SessionScreenshot session={betting.currentSession} bets={betting.bets || []} />
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}