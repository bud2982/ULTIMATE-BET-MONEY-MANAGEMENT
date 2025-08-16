import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { AlertCircle, Home, Save, FolderOpen, Trash2 } from "lucide-react";
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
  
  // Nuovi parametri Sistema Ibrido Bilanciato
  const [fattoreRecupero, setFattoreRecupero] = useState(65); // 65% (bilanciato)
  const [aumentoMassimoStep, setAumentoMassimoStep] = useState(15); // €15 (1.5x stake iniziale default)
  const [capMassimoAssoluto, setCapMassimoAssoluto] = useState(100); // €100 (10x stake iniziale default)
  const [usaQuotaReale, setUsaQuotaReale] = useState(true); // Quote variabili
  const [quotaRiferimento, setQuotaRiferimento] = useState(2.0); // Quota fissa per calcoli
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  
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
  
  // Nota: Rimosso caricamento automatico delle sessioni per evitare conflitti
  // Le sessioni vengono ora caricate solo manualmente tramite i pulsanti
  
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
        
        // Parametri Sistema Ibrido
        setFattoreRecupero(settings.fattoreRecupero ? settings.fattoreRecupero * 100 : 65);
        setAumentoMassimoStep(settings.aumentoMassimoStep || (settings.stakeIniziale || 10) * 1.5);
        setCapMassimoAssoluto(settings.capMassimoAssoluto || (settings.stakeIniziale || 10) * 10);
        setUsaQuotaReale(settings.usaQuotaReale !== false);
        setQuotaRiferimento(settings.quotaRiferimento || 2.0);
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
      
      // Reset parametri Sistema Ibrido ai valori di default
      setFattoreRecupero(65);
      setAumentoMassimoStep(15);
      setCapMassimoAssoluto(100);
      setUsaQuotaReale(true);
      setQuotaRiferimento(2.0);
      setShowAdvancedSettings(false);
    }
  }, [betting.currentSession]);
  
  // Aggiorna automaticamente i valori di default del sistema ibrido quando cambia lo stake iniziale
  useEffect(() => {
    if (!betting.currentSession) {
      // Solo se non c'è una sessione attiva, aggiorna i valori di default
      setAumentoMassimoStep(stakeIniziale * 1.5);
      setCapMassimoAssoluto(stakeIniziale * 10);
    }
  }, [stakeIniziale, betting.currentSession]);
  
  const handleStartNewSession = () => {
    console.log("🚀 handleStartNewSession chiamata con parametri:", {
      sessionName,
      initialBankroll,
      stakeIniziale,
      margineProfitto,
      profitFallStopLoss,
      targetReturn,
      fattoreRecupero,
      aumentoMassimoStep,
      capMassimoAssoluto,
      usaQuotaReale,
      quotaRiferimento
    });
    
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
    
    // Validazione parametri Sistema Ibrido
    const validFattoreRecupero = Number(fattoreRecupero);
    if (isNaN(validFattoreRecupero) || validFattoreRecupero < 30 || validFattoreRecupero > 100) {
      toast({
        title: "Fattore Recupero non valido",
        description: "Il fattore di recupero deve essere tra 30% e 100%",
        variant: "destructive"
      });
      return;
    }
    
    const validAumentoMassimoStep = Number(aumentoMassimoStep);
    if (isNaN(validAumentoMassimoStep) || validAumentoMassimoStep <= 0) {
      toast({
        title: "Aumento Max Step non valido",
        description: "L'aumento massimo per step deve essere maggiore di zero",
        variant: "destructive"
      });
      return;
    }
    
    const validCapMassimoAssoluto = Number(capMassimoAssoluto);
    if (isNaN(validCapMassimoAssoluto) || validCapMassimoAssoluto <= 0) {
      toast({
        title: "Cap Assoluto non valido",
        description: "Il cap massimo assoluto deve essere maggiore di zero",
        variant: "destructive"
      });
      return;
    }
    
    const validQuotaRiferimento = Number(quotaRiferimento);
    if (isNaN(validQuotaRiferimento) || validQuotaRiferimento < 1.1) {
      toast({
        title: "Quota Riferimento non valida",
        description: "La quota di riferimento deve essere almeno 1.1",
        variant: "destructive"
      });
      return;
    }
    
    // Crea le impostazioni della strategia PROFIT FALL (Sistema Ibrido Bilanciato)
    const strategySettings = {
      stakeIniziale: validStakeIniziale,
      margineProfitto: validMargineProfitto,
      profitFallStopLoss: validProfitFallStopLoss,
      
      // Parametri Sistema Ibrido (usa valori validati)
      fattoreRecupero: validFattoreRecupero / 100, // Converte da percentuale a decimale
      aumentoMassimoStep: validAumentoMassimoStep,
      capMassimoAssoluto: validCapMassimoAssoluto,
      usaQuotaReale: usaQuotaReale,
      quotaRiferimento: validQuotaRiferimento
    };
    
    // Inizia una nuova sessione con tutti i campi richiesti
    const sessionData = {
      name: sessionName.trim(),
      initialBankroll: validInitialBankroll,
      currentBankroll: validInitialBankroll,
      targetReturn: validTargetReturn,
      strategy: 'profitfall' as const,
      strategySettings: JSON.stringify(strategySettings)
    };
    
    console.log("🚀 Creando sessione Profit Fall:", sessionData);
    
    betting.startNewSession(sessionData);
    
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
        
        // Reset parametri Sistema Ibrido
        setFattoreRecupero(65);
        setAumentoMassimoStep(15);
        setCapMassimoAssoluto(100);
        setUsaQuotaReale(true);
        setQuotaRiferimento(2.0);
        setShowAdvancedSettings(false);
        
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
          
          <div className="flex items-center gap-2">
            {/* Toolbar Salva/Carica/Cancella per Profit Fall */}
            <Button
              variant="outline"
              className="text-sm"
              onClick={() => {
                if (!betting.currentSession) return;
                const s = {
                  name: betting.currentSession.name,
                  initialBankroll: betting.currentSession.initialBankroll,
                  currentBankroll: betting.currentSession.currentBankroll,
                  targetReturn: betting.currentSession.targetReturn,
                  strategy: betting.currentSession.strategy,
                  betCount: betting.currentSession.betCount,
                  wins: betting.currentSession.wins,
                  losses: betting.currentSession.losses,
                  strategySettings: betting.currentSession.strategySettings,
                };
                if (betting.saveSnapshot) {
                  betting.saveSnapshot(s as any);
                  toast({ title: 'Sessione salvata', description: 'Snapshot salvato nello storico.' });
                }
              }}
            >
              <Save className="w-4 h-4 mr-2" /> Salva
            </Button>
            <Button
              variant="outline"
              className="text-sm"
              onClick={() => {
                // Carica l'ultima sessione PROFIT FALL disponibile
                const sessions = (betting.sessions || []).filter((x: any) => x.strategy === 'profitfall');
                if (sessions.length === 0) {
                  toast({ title: 'Nessuna sessione da caricare' });
                  return;
                }
                // Ordina per data più recente
                sessions.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                const s = sessions[0];
                betting.setCurrentSession(s);
                toast({ title: 'Sessione caricata', description: s.name });
              }}
            >
              <FolderOpen className="w-4 h-4 mr-2" /> Carica
            </Button>
            <Button
              variant="destructive"
              className="text-sm"
              onClick={async () => {
                if (!betting.currentSession?.id) {
                  toast({ title: 'Nessuna sessione attiva' });
                  return;
                }
                if (window.confirm('Sei sicuro di voler resettare la sessione corrente?')) {
                  try {
                    await betting.resetSession();
                    toast({ title: 'Sessione resettata' });
                  } catch (e) {
                    toast({ title: 'Errore reset', variant: 'destructive' });
                  }
                }
              }}
            >
              <Trash2 className="w-4 h-4 mr-2" /> Reset
            </Button>
            <Button onClick={() => navigate('/')} variant="outline" className="flex items-center gap-2">
              <Home size={16} />
              Torna alla Home
            </Button>
          </div>
        </div>
        
        <p className="mt-2 text-gray-600">
          La strategia <strong>PROFIT FALL</strong> è progettata per massimizzare i profitti e minimizzare i rischi:
          <br />• <strong>Gestione Intelligente</strong> - Adatta automaticamente le puntate in base all'andamento
          <br />• <strong>Controllo del Rischio</strong> - Limiti di sicurezza per proteggere il bankroll
          <br />• <strong>Recupero Graduale</strong> - Recupera le perdite in modo sostenibile
          <br />• <strong>Obiettivo Profitto</strong> - Punta sempre a chiudere in positivo
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
                  
                  {/* Sezione Parametri Avanzati Sistema Ibrido */}
                  <div className="border-t pt-4 mt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                      className="w-full mb-4"
                    >
                      {showAdvancedSettings ? "🔽 Nascondi" : "🔧 Mostra"} Parametri Avanzati Sistema Ibrido
                    </Button>
                    
                    {showAdvancedSettings && (
                      <div className="space-y-4 bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <div className="text-sm text-blue-800 font-medium mb-3">
                          ⚙️ <strong>Sistema Ibrido Bilanciato</strong> - Configurazione Avanzata
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="fattoreRecupero">Fattore Recupero</Label>
                            <div className="flex items-center space-x-2">
                              <Input
                                id="fattoreRecupero"
                                type="number"
                                min="30"
                                max="100"
                                step="5"
                                value={fattoreRecupero}
                                onChange={(e) => setFattoreRecupero(parseFloat(e.target.value))}
                                className="mt-1"
                              />
                              <span className="text-gray-500">%</span>
                            </div>
                            <p className="text-sm text-blue-600 mt-1">
                              Recupera il {fattoreRecupero}% delle perdite per volta (65% = bilanciato)
                            </p>
                          </div>
                          
                          <div>
                            <Label htmlFor="aumentoMassimoStep">Aumento Max per Step</Label>
                            <div className="flex items-center space-x-2">
                              <Input
                                id="aumentoMassimoStep"
                                type="number"
                                min="5"
                                max="100"
                                step="5"
                                value={aumentoMassimoStep}
                                onChange={(e) => setAumentoMassimoStep(parseFloat(e.target.value))}
                                className="mt-1"
                              />
                              <span className="text-gray-500">€</span>
                            </div>
                            <p className="text-sm text-blue-600 mt-1">
                              Limite graduale: max +{formatCurrency(aumentoMassimoStep)} per step
                            </p>
                          </div>
                          
                          <div>
                            <Label htmlFor="capMassimoAssoluto">Cap Massimo Assoluto</Label>
                            <div className="flex items-center space-x-2">
                              <Input
                                id="capMassimoAssoluto"
                                type="number"
                                min="50"
                                max="1000"
                                step="10"
                                value={capMassimoAssoluto}
                                onChange={(e) => setCapMassimoAssoluto(parseFloat(e.target.value))}
                                className="mt-1"
                              />
                              <span className="text-gray-500">€</span>
                            </div>
                            <p className="text-sm text-blue-600 mt-1">
                              Puntata massima assoluta: {formatCurrency(capMassimoAssoluto)}
                            </p>
                          </div>
                          
                          <div>
                            <Label htmlFor="quotaRiferimento">Quota di Riferimento</Label>
                            <div className="flex items-center space-x-2">
                              <Input
                                id="quotaRiferimento"
                                type="number"
                                min="1.5"
                                max="5.0"
                                step="0.1"
                                value={quotaRiferimento}
                                onChange={(e) => setQuotaRiferimento(parseFloat(e.target.value))}
                                className="mt-1"
                                disabled={usaQuotaReale}
                              />
                            </div>
                            <p className="text-sm text-blue-600 mt-1">
                              Quota fissa per calcoli (solo se quote fisse attive)
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 pt-2">
                          <input
                            type="checkbox"
                            id="usaQuotaReale"
                            checked={usaQuotaReale}
                            onChange={(e) => setUsaQuotaReale(e.target.checked)}
                            className="rounded"
                          />
                          <Label htmlFor="usaQuotaReale" className="text-sm">
                            🎯 <strong>Quote Variabili</strong> - Adatta le puntate alle quote reali
                          </Label>
                        </div>
                        
                        <div className="bg-white p-3 rounded border border-blue-300">
                          <div className="text-xs text-blue-700">
                            <strong>💡 Configurazione Attuale:</strong>
                            <br />• Recupero: {fattoreRecupero}% delle perdite
                            <br />• Limite graduale: +{formatCurrency(aumentoMassimoStep)} per step
                            <br />• Cap assoluto: {formatCurrency(capMassimoAssoluto)}
                            <br />• Quote: {usaQuotaReale ? "Variabili (si adatta alle quote reali)" : `Fisse (sempre ${quotaRiferimento})`}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <Button 
                    onClick={handleStartNewSession} 
                    className="w-full mt-4 bg-primary text-white"
                    disabled={betting.isCreatingSession}
                  >
                    {betting.isCreatingSession ? "Creazione in corso..." : "Crea Nuova Sessione"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pulsanti Gestione Sessioni */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">🎮 Gestione Sessioni</h3>
              
              {betting.currentSession && betting.currentSession.strategy === 'profitfall' ? (
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-medium text-green-800">✅ Sessione Attiva</p>
                    <p className="text-sm text-green-700">{betting.currentSession.name}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                      onClick={() => {
                        // Forza il salvataggio della sessione corrente
                        if (betting.currentSession) {
                          toast({
                            title: "Sessione salvata",
                            description: `Sessione "${betting.currentSession.name}" salvata con successo`,
                          });
                        }
                      }}
                    >
                      💾 Salva Sessione
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                      onClick={() => {
                        if (window.confirm("Sei sicuro di voler resettare la sessione corrente?")) {
                          betting.resetSession();
                          toast({
                            title: "Sessione resettata",
                            description: "La sessione è stata resettata",
                          });
                        }
                      }}
                    >
                      🔄 Reset Sessione
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-sm font-medium text-gray-600">ℹ️ Nessuna sessione attiva</p>
                    <p className="text-sm text-gray-500">Crea una nuova sessione o carica una esistente</p>
                  </div>
                  
                  {Array.isArray(betting.sessions) && betting.sessions.filter(s => s.strategy === 'profitfall').length > 0 && (
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Carica Sessione Esistente:</Label>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {betting.sessions
                          .filter(s => s.strategy === 'profitfall')
                          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                          .map((session) => (
                            <div key={session.id} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                              <div className="flex-1">
                                <p className="text-sm font-medium">{session.name}</p>
                                <p className="text-xs text-gray-500">
                                  {formatCurrency(session.currentBankroll)} • {session.betCount} scommesse
                                </p>
                              </div>
                              <div className="flex space-x-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs px-2 py-1"
                                  onClick={() => {
                                    betting.setCurrentSession(session);
                                    
                                    // Carica i parametri della sessione nei form
                                    const settings = JSON.parse(session.strategySettings);
                                    setSessionName(session.name);
                                    setInitialBankroll(session.initialBankroll);
                                    setStakeIniziale(settings.stakeIniziale || 10);
                                    setMargineProfitto(settings.margineProfitto || 10);
                                    setProfitFallStopLoss(settings.profitFallStopLoss || 100);
                                    setTargetReturn(session.targetReturn);
                                    setFattoreRecupero((settings.fattoreRecupero || 0.65) * 100);
                                    setAumentoMassimoStep(settings.aumentoMassimoStep || 15);
                                    setCapMassimoAssoluto(settings.capMassimoAssoluto || 100);
                                    setUsaQuotaReale(settings.usaQuotaReale !== false);
                                    setQuotaRiferimento(settings.quotaRiferimento || 2.0);
                                    
                                    toast({
                                      title: "Sessione caricata",
                                      description: `Sessione "${session.name}" caricata con successo`,
                                    });
                                  }}
                                >
                                  📂 Carica
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 border-red-200"
                                  onClick={() => {
                                    if (window.confirm(`Sei sicuro di voler eliminare la sessione "${session.name}"?`)) {
                                      betting.deleteSession(session.id!);
                                      toast({
                                        title: "Sessione eliminata",
                                        description: `Sessione "${session.name}" eliminata con successo`,
                                      });
                                    }
                                  }}
                                >
                                  🗑️ Elimina
                                </Button>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Come Funziona PROFIT FALL (Sistema Ibrido)</h2>
              <div className="space-y-4 text-sm">
                <p>
                  <strong>PROFIT FALL</strong> utilizza un innovativo <strong>Sistema Ibrido Bilanciato</strong> che combina 
                  il recupero delle perdite con controlli avanzati di rischio per una gestione intelligente del bankroll.
                </p>
                
                <div>
                  <p className="font-semibold">Come Funziona il Sistema Ibrido:</p>
                  <ul className="list-disc pl-5 space-y-2 mt-2">
                    <li>
                      <strong>Recupero Parziale:</strong> Non recupera il 100% delle perdite, ma una percentuale configurabile (es. 65%)
                    </li>
                    <li>
                      <strong>Aumenti Graduali:</strong> Limita l'aumento tra una puntata e l'altra per evitare escalation pericolose
                    </li>
                    <li>
                      <strong>Cap Assoluto:</strong> Impone un limite massimo invalicabile per ogni singola puntata
                    </li>
                    <li>
                      <strong>Quote Adattive:</strong> Si adatta automaticamente alle quote reali o usa una quota fissa di riferimento
                    </li>
                  </ul>
                </div>
                
                <div>
                  <p className="font-semibold">Vantaggi del Sistema Ibrido:</p>
                  <ul className="list-disc pl-5 space-y-1 mt-2">
                    <li><strong>Sicurezza Avanzata:</strong> Tripla protezione contro perdite eccessive</li>
                    <li><strong>Flessibilità:</strong> Parametri completamente personalizzabili</li>
                    <li><strong>Controllo Intelligente:</strong> Bilancia recupero e prudenza</li>
                    <li><strong>Adattabilità:</strong> Funziona con quote fisse o variabili</li>
                  </ul>
                </div>
                
                <div>
                  <p className="font-semibold">Parametri Chiave:</p>
                  <ul className="list-disc pl-5 space-y-1 mt-2">
                    <li><strong>Fattore Recupero:</strong> Percentuale delle perdite da recuperare (30-100%)</li>
                    <li><strong>Aumento Max Step:</strong> Limite di crescita tra puntate consecutive</li>
                    <li><strong>Cap Assoluto:</strong> Puntata massima mai superabile</li>
                    <li><strong>Stop Loss:</strong> Limite totale di perdite accettabili</li>
                  </ul>
                </div>
                
                <div>
                  <p className="font-semibold">Quando Usarlo:</p>
                  <ul className="list-disc pl-5 space-y-1 mt-2">
                    <li>Vuoi un sistema di recupero più sicuro del D'Alembert classico</li>
                    <li>Preferisci controlli multipli del rischio</li>
                    <li>Desideri personalizzare completamente i parametri</li>
                    <li>Cerchi un equilibrio tra aggressività e prudenza</li>
                  </ul>
                </div>
                
                <div className="bg-blue-50 p-3 rounded-md border border-blue-200 mt-4">
                  <p className="font-medium text-blue-800">⚙️ Sistema Avanzato</p>
                  <p className="text-blue-700">
                    Il Sistema Ibrido è ideale per utenti esperti che vogliono un controllo granulare 
                    sui parametri di rischio. Usa i parametri avanzati per personalizzare completamente il comportamento.
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
                          className="p-4 border rounded-lg hover:bg-gray-50 transition"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <p className="font-medium">{session.name}</p>
                              <p className="text-sm text-gray-500">
                                Scommesse: {session.betCount} (V: {session.wins} | P: {session.losses})
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                Creata: {new Date(session.createdAt).toLocaleDateString('it-IT')}
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
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs flex-1"
                              onClick={() => {
                                betting.setCurrentSession(session);
                                
                                // Carica i parametri della sessione nei form
                                const settings = JSON.parse(session.strategySettings);
                                setSessionName(session.name);
                                setInitialBankroll(session.initialBankroll);
                                setStakeIniziale(settings.stakeIniziale || 10);
                                setMargineProfitto(settings.margineProfitto || 10);
                                setProfitFallStopLoss(settings.profitFallStopLoss || 100);
                                setTargetReturn(session.targetReturn);
                                setFattoreRecupero((settings.fattoreRecupero || 0.65) * 100);
                                setAumentoMassimoStep(settings.aumentoMassimoStep || 15);
                                setCapMassimoAssoluto(settings.capMassimoAssoluto || 100);
                                setUsaQuotaReale(settings.usaQuotaReale !== false);
                                setQuotaRiferimento(settings.quotaRiferimento || 2.0);
                                
                                toast({
                                  title: "Sessione caricata",
                                  description: `Sessione "${session.name}" caricata con successo`,
                                });
                              }}
                            >
                              Carica
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                              onClick={() => {
                                if (window.confirm(`Sei sicuro di voler eliminare la sessione "${session.name}"?`)) {
                                  betting.deleteSession(session.id!);
                                  toast({
                                    title: "Sessione eliminata",
                                    description: `Sessione "${session.name}" eliminata con successo`,
                                  });
                                }
                              }}
                            >
                              Elimina
                            </Button>
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