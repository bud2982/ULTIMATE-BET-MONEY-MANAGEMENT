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
import { BettingStrategy, BetData, SessionData } from "@/types/betting";
import { formatCurrency, getStrategyDisplayName } from "@/lib/betting-strategies";
import SparklineChart from "@/components/sparkline-chart";
import AnimatedProgressTracker from "@/components/animated-progress-tracker";
import BadgesDisplay from "@/components/badges-display";
import SessionScreenshot from "@/components/session-screenshot";
import { AlertCircle } from "lucide-react";

export default function StrategyDalembert() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const betting = useBetting();
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [initialBankroll, setInitialBankroll] = useState(1000);
  const [dalembertUnit, setDalembertUnit] = useState(15);
  const [odds, setOdds] = useState(2.0);
  const [sessionName, setSessionName] = useState(`Sessione D'Alembert ${new Date().toLocaleDateString()}`);
  const [targetReturn, setTargetReturn] = useState(30);
  const [showRiskWarning, setShowRiskWarning] = useState(false);
  
  // Calcola automaticamente il valore dell'unità D'Alembert in euro
  useEffect(() => {
    // Suggeriamo circa il 1.5% del bankroll iniziale come unità di base in euro
    const suggestedUnit = Math.round(initialBankroll * 0.015); // 1.5% del bankroll iniziale
    setDalembertUnit(Math.max(5, suggestedUnit)); // Minimo 5€
  }, [initialBankroll]);
  
  // Verifica se il prossimo importo della scommessa potrebbe portare il bankroll in negativo
  useEffect(() => {
    if (!betting.currentSession) {
      setShowRiskWarning(false);
      return;
    }
    
    // Se l'importo della prossima scommessa supera il bankroll corrente, mostra l'avviso
    if (betting.nextStake > betting.currentSession.currentBankroll) {
      setShowRiskWarning(true);
    } else {
      setShowRiskWarning(false);
    }
  }, [betting.nextStake, betting.currentSession]);
  
  // Gestione del reset della sessione
  const handleResetConfirm = () => {
    if (confirmingReset) {
      console.log("🔄 Confermato reset della sessione");
      
      toast({
        title: "Reset in corso...",
        description: "Attendere mentre la sessione viene resettata.",
        variant: "default"
      });
      
      try {
        // Reset della sessione
        betting.resetSession();
        setConfirmingReset(false);
        
        toast({
          title: "Sessione resettata",
          description: "La sessione è stata ripristinata ai valori iniziali.",
          variant: "default"
        });
        
        // Forziamo un refresh della pagina dopo un breve ritardo
        // per assicurarci che tutti i dati siano aggiornati
        setTimeout(() => {
          window.location.reload();
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
      
      // Reset automatico dello stato di conferma dopo 5 secondi
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
    
    if (!dalembertUnit || dalembertUnit <= 0) {
      toast({
        title: "Errore",
        description: "Inserisci un'unità D'Alembert valida",
        variant: "destructive"
      });
      return;
    }
    

    
    const sessionData = {
      name: sessionName,
      initialBankroll,
      currentBankroll: initialBankroll,
      targetReturn,
      strategy: 'dalembert' as BettingStrategy,
      strategySettings: JSON.stringify({
        dalembertUnit,
        targetReturn
      })
    };
    
    betting.startNewSession(sessionData);
    
    toast({
      title: "Sessione creata",
      description: `Nuova sessione D'Alembert con ${formatCurrency(initialBankroll)} di bankroll`,
      variant: "default"
    });
  };
  
  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Strategia D'Alembert</h1>
          <p className="text-gray-600">Aumenta la puntata dopo una perdita, diminuiscila dopo una vincita</p>
        </div>
        <Button 
          onClick={() => navigate('/')}
          variant="outline"
          className="bg-gray-200 hover:bg-gray-300"
        >
          Torna alla Home
        </Button>
      </div>
      
      {betting.currentSession && betting.currentSession.strategy === 'dalembert' ? (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">{betting.currentSession.name}</h2>
            <div>
              <Button
                variant="outline"
                size="sm"
                className={`mr-2 ${confirmingReset 
                  ? 'bg-red-500 text-white hover:bg-red-600' 
                  : 'border-red-500 text-red-500 hover:bg-red-500 hover:text-white'
                }`}
                onClick={handleResetConfirm}
              >
                {confirmingReset ? 'Conferma Reset' : 'Reset'}
              </Button>
            </div>
          </div>
          
          {/* Info sulla sessione attiva */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-white">
              <CardContent className="p-4">
                <h3 className="text-sm font-medium text-gray-500 mb-1">Bankroll</h3>
                <p className="text-xl font-bold text-gray-800">{formatCurrency(betting.currentSession.currentBankroll)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Iniziale: {formatCurrency(betting.currentSession.initialBankroll)}
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-white">
              <CardContent className="p-4">
                <h3 className="text-sm font-medium text-gray-500 mb-1">Profitto/Perdita</h3>
                <p className={`text-xl font-bold ${betting.currentSession.currentBankroll >= betting.currentSession.initialBankroll ? 'text-green-600' : 'text-red-600'}`}>
                  {betting.currentSession.currentBankroll >= betting.currentSession.initialBankroll ? '+' : ''}
                  {formatCurrency(betting.currentSession.currentBankroll - betting.currentSession.initialBankroll)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {((betting.currentSession.currentBankroll / betting.currentSession.initialBankroll - 1) * 100).toFixed(2)}% ROI
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-white">
              <CardContent className="p-4">
                <h3 className="text-sm font-medium text-gray-500 mb-1">Scommesse</h3>
                <p className="text-xl font-bold text-gray-800">{betting.currentSession.betCount}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {betting.currentSession.wins} vinte, {betting.currentSession.losses} perse
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-white">
              <CardContent className="p-4">
                <h3 className="text-sm font-medium text-gray-500 mb-1">Target Return</h3>
                <p className="text-xl font-bold text-gray-800">{formatCurrency(betting.currentSession.initialBankroll * (1 + betting.currentSession.targetReturn / 100))}</p>
                <p className="text-xs text-gray-500 mt-1">
                  +{betting.currentSession.targetReturn}% del bankroll iniziale
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Tracker animato con mascotte */}
          <AnimatedProgressTracker session={betting.currentSession} />
          
          {/* Visualizzazione Sparkline */}
          {betting.bets && betting.bets.length > 0 && (
            <div className="mb-6 mt-2">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Andamento Bankroll</h3>
              <div className="h-24 w-full">
                <SparklineChart 
                  bets={betting.bets} 
                  lineColor="#9333EA" 
                  height={90} 
                  animated={true}
                  showTooltip={true}
                  showRecentBankroll={true}
                />
              </div>
            </div>
          )}
          
          {/* Sezione scommessa */}
          <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
            <h3 className="text-lg font-medium mb-3">Piazza Scommessa</h3>
            
            {showRiskWarning && (
              <div className="bg-red-50 border border-red-200 rounded p-3 mb-4 flex items-start">
                <AlertCircle className="text-red-500 mr-2 mt-0.5 flex-shrink-0" size={18} />
                <div>
                  <p className="text-red-800 text-sm font-medium">Attenzione: Rischio Bankroll</p>
                  <p className="text-red-700 text-xs">
                    La prossima puntata ({formatCurrency(betting.nextStake)}) supera il bankroll attuale ({formatCurrency(betting.currentSession.currentBankroll)}).
                    Se continui, il bankroll diventerà negativo.
                  </p>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="bet-amount" className="text-sm font-medium text-gray-700 mb-1 block">
                  Importo Prossima Puntata
                </Label>
                <div className="text-lg font-bold text-gray-800 mb-1">{formatCurrency(betting.nextStake)}</div>
                <p className="text-xs text-gray-500">
                  Calcolato con strategia D'Alembert (unità: {dalembertUnit})
                </p>
              </div>
              
              <div>
                <Label htmlFor="odds" className="text-sm font-medium text-gray-700 mb-1 block">
                  Quota
                </Label>
                <Input
                  id="odds"
                  type="number"
                  step="0.1"
                  min="1.01"
                  value={odds}
                  onChange={(e) => setOdds(Number(e.target.value))}
                  className="mb-1"
                />
              </div>
              
              <div>
                <Label htmlFor="potential-win" className="text-sm font-medium text-gray-700 mb-1 block">
                  Vincita Potenziale
                </Label>
                <div className="text-lg font-bold text-gray-800 mb-1">
                  {formatCurrency(betting.nextStake * odds)}
                </div>
                <p className="text-xs text-gray-500">
                  Profitto netto: {formatCurrency(betting.nextStake * odds - betting.nextStake)}
                </p>
              </div>
            </div>
            
            <div className="mt-4 flex gap-2">
              <Button
                onClick={() => betting.placeBet(true)}
                className="bg-green-600 hover:bg-green-700 flex-1"
              >
                Scommessa Vinta
              </Button>
              <Button
                onClick={() => betting.placeBet(false)}
                className="bg-red-600 hover:bg-red-700 flex-1"
              >
                Scommessa Persa
              </Button>
            </div>
          </div>
          
          {/* Badge e Achievement */}
          {betting.bets && betting.bets.length > 0 && (
            <BadgesDisplay session={betting.currentSession} bets={betting.bets} />
          )}
          
          {/* Condividi Sessione */}
          {betting.bets && betting.bets.length > 0 && (
            <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
              <h3 className="text-lg font-medium mb-3">Condividi la tua Sessione</h3>
              <SessionScreenshot session={betting.currentSession} bets={betting.bets} />
            </div>
          )}
          
          {/* Tabella delle scommesse */}
          <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
            <h3 className="text-lg font-medium mb-3">Storico Scommesse</h3>
            
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">N°</TableHead>
                    <TableHead>Importo</TableHead>
                    <TableHead>Quota</TableHead>
                    <TableHead>Pot. Vincita</TableHead>
                    <TableHead>Risultato</TableHead>
                    <TableHead className="text-right">Bankroll</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {betting.betsLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">Caricamento scommesse...</TableCell>
                    </TableRow>
                  ) : betting.bets && betting.bets.length > 0 ? (
                    betting.bets.map((bet: BetData) => (
                      <TableRow key={bet.id}>
                        <TableCell className="font-medium">{bet.betNumber}</TableCell>
                        <TableCell>{formatCurrency(bet.stake)}</TableCell>
                        <TableCell>{bet.odds.toFixed(2)}</TableCell>
                        <TableCell>{formatCurrency(bet.potentialWin)}</TableCell>
                        <TableCell>
                          <Badge variant={bet.win ? "success" : "destructive"}>
                            {bet.win ? 'Vinta' : 'Persa'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(bet.bankrollAfter)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">Nessuna scommessa registrata</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <Card className="mb-6">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Nuova Sessione</h2>
              
              <div className="grid grid-cols-1 gap-4 mb-6">
                <div>
                  <Label className="mb-1 block">Nome Sessione</Label>
                  <Input 
                    value={sessionName}
                    onChange={(e) => setSessionName(e.target.value)}
                    className="mb-4"
                  />
                </div>
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
                <div>
                  <Label className="mb-1 block">Unità D'Alembert (€)</Label>
                  <Input
                    type="number"
                    value={dalembertUnit}
                    onChange={(e) => setDalembertUnit(Number(e.target.value))}
                    min="1"
                    max="100"
                    step="1"
                  />
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">
                    Puntata iniziale: {formatCurrency(dalembertUnit)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Progressione: {formatCurrency(dalembertUnit)} → {formatCurrency(dalembertUnit * 2)} → {formatCurrency(dalembertUnit * 3)} → {formatCurrency(dalembertUnit * 4)} → ...
                  </p>
                </div>
              </div>
              
              <Button
                className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                onClick={handleCreateSession}
              >
                Inizia Sessione
              </Button>
            </CardContent>
          </Card>
          
          {/* Sessioni Salvate */}
          {Array.isArray(betting.sessions) && betting.sessions.filter((session: SessionData) => session.strategy === 'dalembert').length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Sessioni Salvate</h2>
              
              <div className="space-y-4">
                {betting.sessions
                  .filter((session: SessionData) => session.strategy === 'dalembert')
                  .map((session: SessionData) => (
                    <Card key={session.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="font-medium">{session.name}</h3>
                          <Badge variant={session.currentBankroll >= session.initialBankroll ? "success" : "destructive"}>
                            {((session.currentBankroll / session.initialBankroll - 1) * 100).toFixed(2)}%
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          Cassa: {formatCurrency(session.currentBankroll)} / Target: {formatCurrency(session.initialBankroll * (1 + session.targetReturn / 100))}
                        </p>
                        <p className="text-sm text-gray-600 mb-3">
                          Scommesse: {session.betCount} (V: {session.wins} | P: {session.losses})
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => betting.setCurrentSession(session)}
                          >
                            Carica
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                            onClick={() => {
                              if (confirm(`Sei sicuro di voler eliminare la sessione "${session.name}"?`)) {
                                betting.deleteSession(session.id!);
                              }
                            }}
                          >
                            Elimina
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          )}
          
          {/* Pulsante aggiuntivo per tornare alla Home */}
          <div className="flex justify-center mt-8 pb-4">
            <Button
              onClick={() => navigate('/')}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800"
              size="lg"
            >
              ← Torna alla Home
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}