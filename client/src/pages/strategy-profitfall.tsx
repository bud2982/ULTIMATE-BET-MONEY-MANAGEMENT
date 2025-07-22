import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useBetting } from "@/hooks/use-betting";
import { BettingStrategy, BetData } from "@/types/betting";
import { formatCurrency, getStrategyDisplayName } from "@/lib/betting-strategies";
import SparklineChart from "@/components/sparkline-chart";
import AnimatedProgressTracker from "@/components/animated-progress-tracker";
import BadgesDisplay from "@/components/badges-display";
import SessionScreenshot from "@/components/session-screenshot";
import { AlertCircle, Home } from "lucide-react";
import { motion } from "framer-motion";

export default function StrategyProfitFall() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const betting = useBetting();
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [initialBankroll, setInitialBankroll] = useState(1000);
  const [stakeIniziale, setStakeIniziale] = useState(10);
  const [margineProfitto, setMargineProfitto] = useState(10);
  const [profitFallStopLoss, setProfitFallStopLoss] = useState(100);
  const [odds, setOdds] = useState(2.0);
  const [sessionName, setSessionName] = useState(`Sessione PROFIT FALL ${new Date().toLocaleDateString()}`);
  const [targetReturn, setTargetReturn] = useState(30);
  const [showRiskWarning, setShowRiskWarning] = useState(false);
  
  // Verifica se il prossimo importo della scommessa potrebbe portare il bankroll in negativo
  useEffect(() => {
    if (!betting.currentSession) return;
    
    // Mostra avviso se la prossima puntata supera il bankroll disponibile
    if (betting.nextStake > betting.currentSession.currentBankroll) {
      setShowRiskWarning(true);
    } else {
      setShowRiskWarning(false);
    }
  }, [betting.nextStake, betting.currentSession]);
  
  // Se non c'è una sessione corrente e arrivano dati dalle sessioni, controlla se ce n'è una di tipo profitfall
  // MA SOLO se non abbiamo appena fatto un reset
  useEffect(() => {
    if (!betting.currentSession && Array.isArray(betting.sessions) && betting.sessions.length > 0) {
      const profitfallSession = betting.sessions.find(s => s.strategy === 'profitfall');
      if (profitfallSession && profitfallSession.betCount > 0) {
        // Imposta la sessione solo se ha delle scommesse (non è stata resettata)
        betting.setCurrentSession(profitfallSession);
      }
    }
  }, [betting.sessions, betting.currentSession]);
  
  // Imposta valori iniziali quando c'è una sessione corrente
  useEffect(() => {
    if (betting.currentSession && betting.currentSession.strategy === 'profitfall') {
      try {
        const settings = JSON.parse(betting.currentSession.strategySettings);
        
        // Aggiorna i valori del form con quelli della sessione
        setInitialBankroll(betting.currentSession.initialBankroll);
        setStakeIniziale(settings.stakeIniziale || 10);
        setMargineProfitto(settings.margineProfitto || 10);
        setProfitFallStopLoss(settings.profitFallStopLoss || 100);
        setTargetReturn(betting.currentSession.targetReturn);
        setSessionName(betting.currentSession.name);
      } catch (error) {
        console.error("Errore nel parsing delle impostazioni della strategia:", error);
      }
    } else if (!betting.currentSession) {
      // Se non c'è sessione corrente (dopo reset), resetta i valori di default
      setInitialBankroll(1000);
      setStakeIniziale(10);
      setMargineProfitto(10);
      setProfitFallStopLoss(100);
      setTargetReturn(30);
      setSessionName(`Sessione PROFIT FALL ${new Date().toLocaleDateString()}`);
      setShowRiskWarning(false);
    }
  }, [betting.currentSession]);
  
  const handleStartNewSession = () => {
    // Validazione nome sessione
    if (!sessionName || !sessionName.trim()) {
      toast({
        title: "Nome sessione richiesto",
        description: "Il nome della sessione è obbligatorio",
        variant: "destructive"
      });
      return;
    }
    
    // Validazione bankroll iniziale
    const validInitialBankroll = Number(initialBankroll);
    if (isNaN(validInitialBankroll) || validInitialBankroll <= 0) {
      toast({
        title: "Bankroll non valido",
        description: "Il bankroll iniziale deve essere un numero maggiore di zero",
        variant: "destructive"
      });
      return;
    }
    
    // Validazione stake iniziale
    const validStakeIniziale = Number(stakeIniziale);
    if (isNaN(validStakeIniziale) || validStakeIniziale <= 0) {
      toast({
        title: "Stake iniziale non valido",
        description: "Lo stake iniziale deve essere un numero maggiore di zero",
        variant: "destructive"
      });
      return;
    }
    
    // Validazione margine profitto
    const validMargineProfitto = Number(margineProfitto);
    if (isNaN(validMargineProfitto) || validMargineProfitto <= 0 || validMargineProfitto > 100) {
      toast({
        title: "Margine profitto non valido",
        description: "Il margine di profitto deve essere un numero tra 0.1 e 100%",
        variant: "destructive"
      });
      return;
    }
    
    // Validazione stop loss
    const validProfitFallStopLoss = Number(profitFallStopLoss);
    if (isNaN(validProfitFallStopLoss) || validProfitFallStopLoss <= 0) {
      toast({
        title: "Stop Loss non valido",
        description: "Lo Stop Loss deve essere un numero maggiore di zero",
        variant: "destructive"
      });
      return;
    }
    
    // Validazione target di ritorno
    const validTargetReturn = Number(targetReturn);
    if (isNaN(validTargetReturn) || validTargetReturn <= 0) {
      toast({
        title: "Target non valido",
        description: "Il target di ritorno deve essere un numero maggiore di zero",
        variant: "destructive"
      });
      return;
    }
    
    // Crea le impostazioni della strategia PROFIT FALL (nuovo sistema D'Alembert)
    const strategySettings = {
      stakeIniziale: validStakeIniziale,
      margineProfitto: validMargineProfitto,
      profitFallStopLoss: validProfitFallStopLoss
    };
    
    // Inizia una nuova sessione con tutti i campi richiesti
    betting.startNewSession({
      name: sessionName.trim(),
      initialBankroll: validInitialBankroll,
      currentBankroll: validInitialBankroll,
      targetReturn: validTargetReturn,
      strategy: 'profitfall',
      strategySettings: JSON.stringify(strategySettings)
    });
    
    toast({
      title: "Sessione iniziata",
      description: "Puoi iniziare a piazzare le tue scommesse",
    });
  };
  
  const handlePlaceBet = (win: boolean) => {
    betting.placeBet(win);
    
    if (win) {
      toast({
        title: "Scommessa vinta!",
        description: "Complimenti! La tua scommessa è stata vincente.",
        variant: "default"
      });
    } else {
      toast({
        title: "Scommessa persa",
        description: "Peccato... Riprova con la prossima scommessa.",
        variant: "destructive"
      });
    }
  };
  
  // Gestione del reset della sessione
  const handleResetConfirm = async () => {
    if (confirmingReset) {
      console.log("🔄 Confermato reset della sessione");
      
      toast({
        title: "Reset in corso...",
        description: "Attendere mentre la sessione viene resettata.",
        variant: "default"
      });
      
      try {
        await betting.resetSession();
        setConfirmingReset(false);
        
        // Reset anche dello stato locale del form per permettere la modifica
        setInitialBankroll(1000);
        setStakeIniziale(10);
        setMargineProfitto(10);
        setProfitFallStopLoss(100);
        setOdds(2.0);
        setSessionName(`Sessione PROFIT FALL ${new Date().toLocaleDateString()}`);
        setTargetReturn(30);
        setShowRiskWarning(false);
        
        toast({
          title: "Sessione resettata",
          description: "Ora puoi modificare tutti i parametri per creare una nuova sessione.",
          variant: "default",
          className: "bg-green-100 border-green-400 text-green-800"
        });
      } catch (error) {
        console.error("Errore durante il reset:", error);
        
        toast({
          title: "Errore durante il reset",
          description: "Si è verificato un errore durante il reset della sessione. Ricarica la pagina e riprova.",
          variant: "destructive"
        });
      }
    } else {
      setConfirmingReset(true);
      setTimeout(() => setConfirmingReset(false), 3000);
    }
  };
  
  // Usa la prossima puntata calcolata da betting
  const nextStake = betting.currentSession 
    ? (betting.nextStake || 0)
    : stakeIniziale;
  
  // Calcola il potenziale ritorno della prossima scommessa
  const potentialReturn = (nextStake || 0) * (odds || 1);
  
  // Calcola se siamo in profit o in perdita
  const isInProfit = betting.currentSession && betting.currentSession.currentBankroll > betting.currentSession.initialBankroll;
  
  // Calcola la percentuale di ROI
  const roi = betting.currentSession 
    ? ((betting.currentSession.currentBankroll - betting.currentSession.initialBankroll) / betting.currentSession.initialBankroll) * 100 
    : 0;
  
  // Calcola il progresso verso il target
  const progressToTarget = betting.currentSession 
    ? Math.min(100, (roi / targetReturn) * 100) 
    : 0;
  
  return (
    <div className="container py-4 max-w-7xl mx-auto">
      <header className="mb-8">
        <div className="flex justify-between items-center">
          <div className="relative">
            {/* Nome della strategia con effetto LED - colori cascata d'acqua */}
            <motion.div
              className="text-3xl font-bold text-white px-4 py-2 z-10 relative"
              initial={{ opacity: 0.9 }}
              animate={{ 
                opacity: [0.9, 1, 0.9]
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 2 
              }}
            >
              PROFIT FALL
            </motion.div>
            
            {/* Cornice LED attorno al titolo - colori cascata d'acqua */}
            <motion.div
              className="absolute inset-0 -z-10 rounded-lg border-2"
              initial={{ opacity: 0.8 }}
              animate={{ 
                opacity: [0.8, 1, 0.8],
                boxShadow: [
                  "0 0 5px 1px #38bdf8, inset 0 0 5px 1px #38bdf8",
                  "0 0 10px 2px #0ea5e9, inset 0 0 10px 2px #0ea5e9",
                  "0 0 5px 1px #38bdf8, inset 0 0 5px 1px #38bdf8"
                ],
                borderColor: [
                  "#38bdf8",
                  "#0ea5e9",
                  "#38bdf8"
                ],
                background: [
                  "linear-gradient(45deg, rgba(56, 189, 248, 0.2) 0%, rgba(14, 165, 233, 0.2) 100%)",
                  "linear-gradient(45deg, rgba(14, 165, 233, 0.3) 0%, rgba(2, 132, 199, 0.3) 100%)",
                  "linear-gradient(45deg, rgba(56, 189, 248, 0.2) 0%, rgba(14, 165, 233, 0.2) 100%)"
                ]
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 3 
              }}
            />
          </div>
          
          <Button onClick={() => navigate('/')} variant="outline" className="flex items-center gap-2">
            <Home size={16} />
            Torna alla Home
          </Button>
        </div>
        
        <p className="mt-2 text-gray-600">
          La strategia PROFIT FALL utilizza una progressione a cascata con un incremento percentuale fisso.
          Ogni puntata aumenta in base alle puntate precedenti, seguendo una progressione incrementale.
        </p>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          {betting.currentSession && betting.currentSession.strategy === 'profitfall' ? (
            <div className="space-y-6">
              <Card>
                <CardContent className="pt-6">
                  <h2 className="text-xl font-semibold mb-4">Stato Sessione</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Nome Sessione</p>
                      <p className="font-medium">{betting.currentSession.name}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500">Bankroll</p>
                      <p className={`font-medium ${isInProfit ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(betting.currentSession.currentBankroll)}
                        <span className="text-xs ml-1">
                          ({isInProfit ? '+' : ''}{formatCurrency(betting.currentSession.currentBankroll - betting.currentSession.initialBankroll)})
                        </span>
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500">Scommesse Totali</p>
                      <p className="font-medium">{betting.currentSession.betCount}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500">Vincite/Perdite</p>
                      <p className="font-medium">
                        <span className="text-green-600">{betting.currentSession.wins}</span> / <span className="text-red-600">{betting.currentSession.losses}</span>
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500">ROI</p>
                      <p className={`font-medium ${roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {roi.toFixed(2)}%
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500">Target</p>
                      <p className="font-medium">
                        {targetReturn}% ({formatCurrency(betting.currentSession.initialBankroll * (1 + targetReturn / 100))})
                      </p>
                    </div>
                  </div>
                  
                  {betting.bets && betting.bets.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-500 mb-1">Andamento Bankroll</p>
                      <div className="h-20">
                        <SparklineChart 
                          bets={betting.bets} 
                          lineColor="#0ea5e9" 
                          height={80} 
                          showTooltip={true}
                          showRecentBankroll={true}
                          animated={true}
                        />
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-4">
                    <div className="flex justify-between items-center mt-2 text-sm text-gray-600">
                      <span>Progresso: {progressToTarget.toFixed(0)}%</span>
                      <span>Target: {targetReturn}%</span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full mt-1 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full"
                        style={{ width: `${progressToTarget}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex space-x-2">
                    <Button
                      onClick={handleResetConfirm}
                      variant={confirmingReset ? "destructive" : "outline"}
                      className={confirmingReset ? "" : "bg-gray-200 hover:bg-gray-300 text-gray-700"}
                      disabled={betting.isPlacingBet || betting.isUpdatingSession}
                    >
                      {confirmingReset ? "Conferma Reset" : "Reset"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <h2 className="text-xl font-semibold mb-4">Nuova Scommessa</h2>
                  
                  {showRiskWarning && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 flex items-center">
                      <AlertCircle className="h-5 w-5 mr-2" />
                      <span>
                        <strong>Attenzione!</strong> La prossima puntata supera il tuo bankroll disponibile.
                        Considera di resettare la sessione o modificare la strategia.
                      </span>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label htmlFor="nextStake">Prossima Puntata</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          id="nextStake"
                          value={nextStake.toFixed(2)}
                          readOnly
                          className="font-medium"
                        />
                        <span className="text-gray-500">€</span>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="odds">Quota</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          id="odds"
                          type="number"
                          min="1.01"
                          step="0.01"
                          value={odds}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            const newOdds = isNaN(value) ? 1.01 : value;
                            setOdds(newOdds);
                            // Aggiorna le odds nel sistema betting per ricalcolare la puntata
                            betting.setBetOdds(newOdds);
                          }}
                        />
                        <span className="text-gray-500">×</span>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="potentialReturn">Vincita Potenziale</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          id="potentialReturn"
                          value={potentialReturn.toFixed(2)}
                          readOnly
                          className="font-medium"
                        />
                        <span className="text-gray-500">€</span>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="profitIfWin">Profitto in caso di vincita</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          id="profitIfWin"
                          value={(potentialReturn - nextStake).toFixed(2)}
                          readOnly
                          className="font-medium"
                        />
                        <span className="text-gray-500">€</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      onClick={() => handlePlaceBet(true)}
                      variant="default"
                      className="w-full bg-green-600 hover:bg-green-700"
                      disabled={nextStake > betting.currentSession.currentBankroll}
                    >
                      Scommessa Vinta
                    </Button>
                    
                    <Button
                      onClick={() => handlePlaceBet(false)}
                      variant="default"
                      className="w-full bg-red-600 hover:bg-red-700"
                      disabled={nextStake > betting.currentSession.currentBankroll}
                    >
                      Scommessa Persa
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              {/* Componenti di gamification */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardContent className="pt-6">
                    <h2 className="text-xl font-semibold mb-4">Progresso</h2>
                    <AnimatedProgressTracker session={betting.currentSession} />
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <h2 className="text-xl font-semibold mb-4">Badges</h2>
                    <BadgesDisplay session={betting.currentSession} bets={betting.bets} />
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardContent className="pt-6">
                  <h2 className="text-xl font-semibold mb-4">Condividi Sessione</h2>
                  <SessionScreenshot session={betting.currentSession} bets={betting.bets} />
                </CardContent>
              </Card>
              
              {betting.bets && betting.bets.length > 0 && (
                <Card>
                  <CardContent className="pt-6">
                    <h2 className="text-xl font-semibold mb-4">Storico Scommesse</h2>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>#</TableHead>
                            <TableHead>Importo</TableHead>
                            <TableHead>Quota</TableHead>
                            <TableHead>Risultato</TableHead>
                            <TableHead>Vincita</TableHead>
                            <TableHead>Bankroll</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {betting.bets.map((bet: BetData) => (
                            <TableRow key={bet.betNumber}>
                              <TableCell>{bet.betNumber}</TableCell>
                              <TableCell>{formatCurrency(bet.stake)}</TableCell>
                              <TableCell>{bet.odds.toFixed(2)}</TableCell>
                              <TableCell>
                                <Badge variant={bet.win ? "default" : "destructive"}>
                                  {bet.win ? "Vinta" : "Persa"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {bet.win ? formatCurrency(bet.potentialWin) : "-"}
                              </TableCell>
                              <TableCell>{formatCurrency(bet.bankrollAfter)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Nuova Sessione PROFIT FALL</h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="sessionName">Nome Sessione</Label>
                    <Input
                      id="sessionName"
                      value={sessionName}
                      onChange={(e) => setSessionName(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="initialBankroll">Bankroll Iniziale</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="initialBankroll"
                        type="number"
                        min="100"
                        step="100"
                        value={initialBankroll}
                        onChange={(e) => setInitialBankroll(parseFloat(e.target.value))}
                        className="mt-1"
                      />
                      <span className="text-gray-500">€</span>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="stakeIniziale">Puntata Iniziale (Stake Base)</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="stakeIniziale"
                        type="number"
                        min="1"
                        step="0.1"
                        value={stakeIniziale}
                        onChange={(e) => setStakeIniziale(parseFloat(e.target.value))}
                        className="mt-1"
                      />
                      <span className="text-gray-500">€</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      La prima puntata sarà sempre di {formatCurrency(stakeIniziale)}
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="margineProfitto">Margine di Profitto Desiderato</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="margineProfitto"
                        type="number"
                        min="1"
                        max="100"
                        step="1"
                        value={margineProfitto}
                        onChange={(e) => setMargineProfitto(parseFloat(e.target.value))}
                        className="mt-1"
                      />
                      <span className="text-gray-500">%</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Ogni sequenza punta a guadagnare il {margineProfitto}% dello stake iniziale
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="profitFallStopLoss">Stop Loss Massimo</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="profitFallStopLoss"
                        type="number"
                        min="10"
                        step="10"
                        value={profitFallStopLoss}
                        onChange={(e) => setProfitFallStopLoss(parseFloat(e.target.value))}
                        className="mt-1"
                      />
                      <span className="text-gray-500">€</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      La sequenza si interrompe se le perdite superano {formatCurrency(profitFallStopLoss)}
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="targetReturn">Target di Ritorno</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="targetReturn"
                        type="number"
                        min="1"
                        max="1000"
                        step="1"
                        value={targetReturn}
                        onChange={(e) => setTargetReturn(parseFloat(e.target.value))}
                        className="mt-1"
                      />
                      <span className="text-gray-500">%</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Target bankroll: {formatCurrency(initialBankroll * (1 + targetReturn / 100))}
                    </p>
                  </div>
                  
                  <Button 
                    onClick={handleStartNewSession} 
                    className="w-full mt-2 bg-primary text-white"
                    disabled={betting.isCreatingSession}
                  >
                    {betting.isCreatingSession ? "Creazione in corso..." : "Crea Nuova Sessione"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Come Funziona PROFIT FALL (Sistema D'Alembert)</h2>
              <div className="space-y-4 text-sm">
                <p>
                  <strong>PROFIT FALL</strong> utilizza un sistema di money management dinamico basato su D'Alembert 
                  che si adatta alle quote variabili per garantire sempre il margine di profitto configurato.
                </p>
                
                <div>
                  <p className="font-semibold">Formula corretta per step ≥ 2:</p>
                  <div className="bg-gray-100 p-3 rounded font-mono text-center my-2">
                    puntata = (perdite totali accumulate + guadagno desiderato) / (quota corrente - 1)
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    dove: guadagno desiderato = stake iniziale × margine profitto
                  </p>
                  <ul className="list-disc pl-5 space-y-2 mt-2">
                    <li>
                      <strong>Prima puntata:</strong> Sempre uguale allo stake iniziale configurato (es: 10€)
                    </li>
                    <li>
                      <strong>Dopo una perdita:</strong> La puntata viene calcolata per recuperare tutte le perdite 
                      accumulate + ottenere il margine di profitto desiderato
                    </li>
                    <li>
                      <strong>Dopo una vincita:</strong> La sequenza si resetta e si riparte dallo stake iniziale
                    </li>
                  </ul>
                </div>
                
                <p>
                  <strong>Stop Loss automatico:</strong> La sequenza si interrompe se le perdite superano l'importo massimo configurato.
                </p>
                
                <p>
                  <strong>Esempio pratico:</strong>
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Stake iniziale: 10€</li>
                  <li>Margine profitto: 10%</li>
                  <li>Quota: 2.0</li>
                  <li>Stop Loss: 100€</li>
                </ul>
                <div className="bg-blue-50 p-3 rounded mt-2">
                  <p className="font-medium text-blue-800">Sequenza corretta (quote variabili):</p>
                  <ul className="text-blue-700 text-sm space-y-1">
                    <li>• <strong>STEP 1:</strong> 10€ (stake fisso) - quota 2.0 - PERSA → perdita = 10€</li>
                    <li>• <strong>STEP 2:</strong> (10 + 1) / (1.80-1) = 13.75€ - quota 1.80 - PERSA → perdita totale = 23.75€</li>
                    <li>• <strong>STEP 3:</strong> (23.75 + 1) / (2.20-1) = 20.62€ - quota 2.20 - VINTA!</li>
                    <li>• <strong>Incasso:</strong> 20.62€ × 2.20 = 45.36€</li>
                    <li>• <strong>Profitto netto:</strong> 45.36€ - 23.75€ - 20.62€ = +0.99€ ≈ +1€ (10% di 10€)</li>
                  </ul>
                  <p className="text-xs text-blue-600 mt-2 font-medium">
                    ✓ Formula corretta: recupera TUTTE le perdite + garantisce il margine configurato
                  </p>
                </div>
                
                <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200 mt-4">
                  <p className="font-medium text-yellow-800">Importante</p>
                  <p className="text-yellow-700">
                    Il sistema è progettato per garantire sempre il margine di profitto configurato 
                    ad ogni vincita, indipendentemente dal momento in cui avviene nella sequenza.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Storico sessioni */}
          {Array.isArray(betting.sessions) && betting.sessions.filter((session) => session.strategy === 'profitfall').length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Sessioni Precedenti</h2>
                <div className="space-y-4">
                  {betting.sessions
                    .filter((session) => session.strategy === 'profitfall')
                    .map((session) => {
                      const profitLoss = session.currentBankroll - session.initialBankroll;
                      const roi = (profitLoss / session.initialBankroll) * 100;
                      
                      return (
                        <div 
                          key={session.id} 
                          className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition"
                          onClick={() => betting.setCurrentSession(session)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{session.name}</p>
                              <p className="text-sm text-gray-500">
                                Scommesse: {session.betCount} (V: {session.wins} | P: {session.losses})
                              </p>
                            </div>
                            <div 
                              className={`px-2 py-1 text-xs font-medium rounded ${
                                roi >= 0 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {roi.toFixed(2)}%
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}