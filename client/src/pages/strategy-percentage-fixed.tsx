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

export default function StrategyPercentage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const betting = useBetting();
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [initialBankroll, setInitialBankroll] = useState(1000);
  const [targetReturn, setTargetReturn] = useState(10);
  const [bankrollPercentage, setBankrollPercentage] = useState(5);
  const [sessionName, setSessionName] = useState(`Sessione Percentuale ${new Date().toLocaleDateString()}`);
  
  // Gestione della scommessa vinta
  const handleWin = (e: React.MouseEvent) => {
    e.preventDefault();
    const scrollPosition = window.scrollY;
    betting.placeBet(true);
    setTimeout(() => {
      window.scrollTo(0, scrollPosition);
    }, 100);
  };
  
  // Gestione della scommessa persa
  const handleLoss = (e: React.MouseEvent) => {
    e.preventDefault();
    const scrollPosition = window.scrollY;
    betting.placeBet(false);
    setTimeout(() => {
      window.scrollTo(0, scrollPosition);
    }, 100);
  };
  
  // Gestione del reset della sessione
  const handleResetConfirm = (e: React.MouseEvent) => {
    e.preventDefault();
    if (confirmingReset) {
      console.log("🔄 Confermato reset della sessione");
      betting.resetSession();
      setConfirmingReset(false);
      
      // Forziamo un reload della pagina dopo un breve ritardo
      // per assicurarci che tutti i dati siano aggiornati
      console.log("🔄 Forza ricaricamento della pagina tra 1 secondo");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } else {
      setConfirmingReset(true);
      // Reset automatico dopo 3 secondi se non confermato
      setTimeout(() => setConfirmingReset(false), 3000);
    }
  };
  
  // Iniziare una nuova sessione
  const handleStartSession = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verifica se c'è abbastanza bankroll disponibile
    const availableBankroll = Number(localStorage.getItem('availableBankroll') || '0');
    
    if (initialBankroll > availableBankroll) {
      toast({
        title: "Bankroll insufficiente",
        description: `Disponibile: ${formatCurrency(availableBankroll)}, Richiesto: ${formatCurrency(initialBankroll)}`,
        variant: "destructive"
      });
      return;
    }
    
    // Aggiorna il bankroll disponibile
    const newAvailableBankroll = availableBankroll - initialBankroll;
    localStorage.setItem('availableBankroll', newAvailableBankroll.toString());
    
    // Aggiorna il bankroll allocato
    const allocatedBankroll = Number(localStorage.getItem('allocatedBankroll') || '0');
    const newAllocatedBankroll = allocatedBankroll + initialBankroll;
    localStorage.setItem('allocatedBankroll', newAllocatedBankroll.toString());
    
    // Crea la sessione
    betting.startNewSession({
      name: sessionName,
      initialBankroll,
      currentBankroll: initialBankroll,
      targetReturn,
      strategy: 'percentage',
      strategySettings: JSON.stringify({
        bankrollPercentage
      })
    });
  };
  
  // Carica i dati iniziali dal localStorage
  useEffect(() => {
    const globalBankroll = Number(localStorage.getItem('globalBankroll') || '10000');
    const allocatedBankroll = Number(localStorage.getItem('allocatedBankroll') || '0');
    const availableBankroll = Number(localStorage.getItem('availableBankroll') || (globalBankroll - allocatedBankroll).toString());

    // Se non c'è un valore salvato per availableBankroll, inizializzarlo
    if (!localStorage.getItem('availableBankroll')) {
      localStorage.setItem('availableBankroll', availableBankroll.toString());
    }
    
    // Imposta un bankroll iniziale predefinito che sia il minimo tra 1000 e la metà del disponibile
    const suggestedInitial = Math.min(1000, Math.floor(availableBankroll / 2));
    setInitialBankroll(suggestedInitial > 0 ? suggestedInitial : 100);
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Strategia Percentuale</h1>
      
      {!betting.currentSession ? (
        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">Nuova Sessione</h2>
            <form onSubmit={handleStartSession}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label htmlFor="sessionName" className="mb-1">Nome Sessione</Label>
                  <Input 
                    id="sessionName" 
                    value={sessionName} 
                    onChange={(e) => setSessionName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="initialBankroll" className="mb-1">Bankroll Iniziale (€)</Label>
                  <Input 
                    id="initialBankroll" 
                    type="number" 
                    value={initialBankroll}
                    onChange={(e) => setInitialBankroll(Number(e.target.value))}
                    min="10"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="targetReturn" className="mb-1">Rendimento Target (%)</Label>
                  <Input 
                    id="targetReturn" 
                    type="number" 
                    value={targetReturn}
                    onChange={(e) => setTargetReturn(Number(e.target.value))}
                    min="1"
                    max="100"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="bankrollPercentage" className="mb-1">Percentuale della Cassa (%)</Label>
                  <Input 
                    id="bankrollPercentage" 
                    type="number" 
                    value={bankrollPercentage}
                    onChange={(e) => setBankrollPercentage(Number(e.target.value))}
                    min="0.5"
                    max="10"
                    step="0.5"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Puntata iniziale: {formatCurrency(initialBankroll * (bankrollPercentage / 100))}
                  </p>
                </div>
              </div>
              <div className="text-center">
                <Button 
                  type="submit" 
                  className="bg-blue-500 hover:bg-blue-600"
                  disabled={betting.isCreatingSession}
                >
                  {betting.isCreatingSession ? "Creazione..." : "Inizia Sessione"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="mb-6">
            <CardContent className="p-6 pb-4">
              <div className="flex justify-between mb-4">
                <h2 className="text-xl font-semibold">{betting.currentSession.name}</h2>
                <Badge className="ml-2">
                  {getStrategyDisplayName(betting.currentSession.strategy)}
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <Label className="block text-sm text-gray-500">Cassa Iniziale</Label>
                  <span className="text-lg font-medium">
                    {formatCurrency(betting.currentSession.initialBankroll)}
                  </span>
                </div>
                <div>
                  <Label className="block text-sm text-gray-500">Cassa Attuale</Label>
                  <span className={`text-lg font-medium ${
                    betting.currentSession.currentBankroll >= betting.currentSession.initialBankroll 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {formatCurrency(betting.currentSession.currentBankroll)}
                  </span>
                </div>
                <div>
                  <Label className="block text-sm text-gray-500">Rendimento Target</Label>
                  <span className="text-lg font-medium">
                    {betting.currentSession.targetReturn}% ({formatCurrency(betting.currentSession.initialBankroll * (1 + betting.currentSession.targetReturn / 100))})
                  </span>
                </div>
                <div>
                  <Label className="block text-sm text-gray-500">Performance</Label>
                  <span className={`text-lg font-medium ${
                    betting.currentSession.currentBankroll >= betting.currentSession.initialBankroll 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {((betting.currentSession.currentBankroll - betting.currentSession.initialBankroll) / betting.currentSession.initialBankroll * 100).toFixed(2)}%
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <Label className="block text-sm text-gray-500">Scommesse Totali</Label>
                  <span className="text-lg font-medium">{betting.currentSession.betCount}</span>
                </div>
                <div>
                  <Label className="block text-sm text-gray-500">Vincite</Label>
                  <span className="text-lg font-medium text-green-600">{betting.currentSession.wins}</span>
                </div>
                <div>
                  <Label className="block text-sm text-gray-500">Perdite</Label>
                  <span className="text-lg font-medium text-red-600">{betting.currentSession.losses}</span>
                </div>
              </div>
              
              {/* Tracker animato con mascotte */}
              {betting.currentSession && (
                <AnimatedProgressTracker session={betting.currentSession} />
              )}
              
              {/* Sezione per nuova scommessa - sempre visibile subito dopo il tracker */}
              <div className="bg-gray-50 p-4 rounded-lg mt-6 mb-6">
                <h3 className="text-base font-medium text-gray-800 mb-3">Nuova Scommessa</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                  <div>
                    <Label htmlFor="stakePercentage" className="mb-1">Puntata (% della cassa iniziale)</Label>
                    <div className="relative">
                      <Input 
                        id="stakePercentage" 
                        type="number" 
                        value={betting.stakePercentage}
                        onChange={(e) => betting.setStakePercentage(Number(e.target.value))}
                        min="0.1"
                        max="100"
                        step="0.1"
                        className="pr-24"
                      />
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
                        {betting.currentSession ? 
                          `${formatCurrency(betting.nextStake)} (${betting.stakePercentage.toFixed(2)}%)` 
                          : ''}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="betOdds" className="mb-1">Quota</Label>
                    <Input 
                      id="betOdds" 
                      type="number" 
                      value={betting.betOdds}
                      onChange={(e) => betting.setBetOdds(Number(e.target.value))}
                      step="0.01"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="potentialWin" className="mb-1">Potenziale Vincita (€)</Label>
                    <div className="relative">
                      <Input 
                        id="potentialWin" 
                        type="text" 
                        value={betting.potentialWin !== undefined ? betting.potentialWin.toFixed(2) : '0.00'}
                        readOnly
                        className="bg-gray-100"
                      />
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
                        {betting.currentSession && betting.potentialWin ? 
                          `${((betting.potentialWin / betting.currentSession.initialBankroll) * 100).toFixed(2)}% della cassa iniziale` 
                          : ''}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap justify-between items-center">
                  <div className="flex items-center space-x-4 mb-4 md:mb-0">
                    <Label className="text-sm font-medium text-gray-700">Esito:</Label>
                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={handleWin}
                        className="bg-green-500 hover:bg-green-600 text-white"
                        disabled={betting.isPlacingBet}
                      >
                        Vinta
                      </Button>
                      <Button
                        onClick={handleLoss}
                        className="bg-red-500 hover:bg-red-600 text-white"
                        disabled={betting.isPlacingBet}
                      >
                        Persa
                      </Button>
                    </div>
                  </div>
                  
                  <Button
                    onClick={handleResetConfirm}
                    variant={confirmingReset ? "destructive" : "outline"}
                    className={confirmingReset ? "" : "bg-gray-200 hover:bg-gray-300 text-gray-700"}
                    disabled={betting.isPlacingBet || betting.isUpdatingSession}
                  >
                    {confirmingReset ? "Conferma Reset" : "Reset"}
                  </Button>
                </div>
              </div>
              
              {/* Sparkline Chart - Mostrato solo se ci sono scommesse */}
              {betting.bets && betting.bets.length > 0 && (
                <div className="mb-6 mt-2">
                  <h3 className="text-sm font-medium text-gray-600 mb-2">Andamento Bankroll</h3>
                  <div className="h-24 w-full">
                    <SparklineChart 
                      bets={betting.bets} 
                      lineColor="#3B82F6" 
                      height={90} 
                      animated={true}
                      showTooltip={true}
                      showRecentBankroll={true}
                      showDelta={true}
                    />
                  </div>
                </div>
              )}
              
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
            </CardContent>
          </Card>
          
          <div className="mt-6 text-center">
            <Button 
              onClick={() => {
                if (!betting.currentSession) return;
                
                // Calcola il profitto o la perdita della sessione
                const sessionProfit = betting.currentSession.currentBankroll - betting.currentSession.initialBankroll;
                
                // Aggiorna il bankroll disponibile aggiungendo il valore attuale della sessione
                const availableBankroll = Number(localStorage.getItem('availableBankroll') || '0');
                const newAvailableBankroll = availableBankroll + betting.currentSession.currentBankroll;
                localStorage.setItem('availableBankroll', newAvailableBankroll.toString());
                
                // Aggiorna il bankroll globale se c'è stato un profitto
                const globalBankroll = Number(localStorage.getItem('globalBankroll') || '10000');
                if (sessionProfit !== 0) {
                  const newGlobalBankroll = globalBankroll + sessionProfit;
                  localStorage.setItem('globalBankroll', newGlobalBankroll.toString());
                }
                
                // Chiudi la sessione
                betting.setCurrentSession(null);
                
                toast({
                  title: "Sessione chiusa",
                  description: sessionProfit >= 0 
                    ? `Hai guadagnato ${formatCurrency(sessionProfit)}! Il bankroll è stato aggiornato.` 
                    : `Hai perso ${formatCurrency(Math.abs(sessionProfit))}. Il bankroll è stato aggiornato.`,
                  variant: "default",
                  className: sessionProfit >= 0 ? "bg-green-100 border-green-400 text-green-800" : "bg-red-100 border-red-400 text-red-800"
                });
                
                // Forza un reload della pagina per aggiornare tutti i valori
                setTimeout(() => {
                  window.location.reload();
                }, 2000);
              }}
              variant="outline" 
              className="bg-gray-200 hover:bg-gray-300 text-gray-700"
            >
              Chiudi Sessione
            </Button>
          </div>
        </>
      )}
      
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-4">Sessioni Salvate</h2>
        {betting.sessionsLoading ? (
          <p className="text-center py-4">Caricamento sessioni...</p>
        ) : Array.isArray(betting.sessions) && betting.sessions.filter((session: SessionData) => session.strategy === 'percentage').length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {betting.sessions
              .filter((session: SessionData) => session.strategy === 'percentage')
              .map((session: SessionData) => (
                <Card key={session.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-lg">{session.name}</h3>
                      <Badge
                        className={
                          session.currentBankroll >= session.initialBankroll
                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                            : "bg-red-100 text-red-800 hover:bg-red-100"
                        }
                      >
                        {((session.currentBankroll - session.initialBankroll) / session.initialBankroll * 100).toFixed(2)}%
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      Cassa: {formatCurrency(session.currentBankroll)} / Target: {formatCurrency(session.initialBankroll * (1 + session.targetReturn / 100))}
                    </div>
                    <div className="text-xs text-gray-500 mb-3">
                      Scommesse: {session.betCount} (V: {session.wins} | P: {session.losses})
                    </div>
                    
                    {/* Sparkline Chart per sessioni salvate - da aggiungere in futuro quando disponibili le scommesse di tutte le sessioni */}
                    {/* {session.betCount > 0 && session.id && (
                      <div className="mb-3 mt-1 h-16 w-full">
                        <SparklineChart 
                          bets={[]} 
                          lineColor="#3B82F6" 
                          height={60} 
                          animated={false}
                        />
                      </div>
                    )} */}
                    
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={() => betting.setCurrentSession(session)}
                      >
                        Carica
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                        onClick={() => {
                          if (window.confirm(`Sei sicuro di voler eliminare la sessione "${session.name}"?`)) {
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
        ) : (
          <p className="text-center py-4 text-gray-500">Nessuna sessione Percentuale salvata</p>
        )}
      </div>
    </div>
  );
}