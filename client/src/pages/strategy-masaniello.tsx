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
import { BettingStrategy, BetData, SessionData } from "@/types/betting";
import { formatCurrency, getStrategyDisplayName } from "@/lib/betting-strategies";
import SparklineChart from "@/components/sparkline-chart";
import AnimatedProgressTracker from "@/components/animated-progress-tracker";
import BadgesDisplay from "@/components/badges-display";
import SessionScreenshot from "@/components/session-screenshot";
import { AlertCircle, CheckCircle, XCircle, Clock } from "lucide-react";

export default function StrategyMasaniello() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const betting = useBetting();
  const [confirmingReset, setConfirmingReset] = useState(false);
  
  // Form state
  const [initialBankroll, setInitialBankroll] = useState(1000);
  const [totalEvents, setTotalEvents] = useState(6);
  const [minimumWins, setMinimumWins] = useState(4);
  const [riskFactor, setRiskFactor] = useState(5);
  const [sessionName, setSessionName] = useState(`Sessione Multi Masaniello ${new Date().toLocaleDateString()}`);
  const [targetReturn, setTargetReturn] = useState(30);
  const [eventOdds, setEventOdds] = useState<number[]>([1.90, 2.00, 1.75, 2.10, 1.95, 1.85]);
  
  // Auto-load existing Masaniello session
  useEffect(() => {
    if (!betting.currentSession && Array.isArray(betting.sessions) && betting.sessions.length > 0) {
      const masanielloSession = betting.sessions.find(s => s.strategy === 'masaniello');
      if (masanielloSession && masanielloSession.betCount > 0) {
        betting.setCurrentSession(masanielloSession);
      }
    }
  }, [betting.sessions, betting.currentSession]);

  // Update odds array when total events changes
  useEffect(() => {
    if (eventOdds.length !== totalEvents) {
      const newOdds = [...eventOdds];
      while (newOdds.length < totalEvents) {
        newOdds.push(1.90);
      }
      if (newOdds.length > totalEvents) {
        newOdds.splice(totalEvents);
      }
      setEventOdds(newOdds);
    }
  }, [totalEvents]);

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
    
    if (!totalEvents || totalEvents < 3 || totalEvents > 20) {
      toast({
        title: "Errore",
        description: "Inserisci un numero di eventi valido (3-20)",
        variant: "destructive"
      });
      return;
    }
    
    if (!minimumWins || minimumWins < 1 || minimumWins > totalEvents) {
      toast({
        title: "Errore",
        description: "Il numero minimo di vittorie deve essere tra 1 e il totale degli eventi",
        variant: "destructive"
      });
      return;
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
        strategy: 'masaniello' as BettingStrategy,
        strategySettings: JSON.stringify({
          totalEvents,
          minimumWins,
          riskFactor,
          eventOdds,
          targetReturn
        })
      };
      
      betting.startNewSession(sessionData);
      
      toast({
        title: "Sessione creata",
        description: "La nuova sessione Multi Masaniello è stata avviata!",
        variant: "default"
      });
    }, 100);
  };

  const updateEventOdds = (index: number, value: number) => {
    const newOdds = [...eventOdds];
    newOdds[index] = value;
    setEventOdds(newOdds);
  };

  const getMasanielloState = () => {
    return betting.bettingState?.masaniello;
  };

  const getEventStatus = (eventIndex: number) => {
    const state = getMasanielloState();
    if (!state) return 'pending';
    
    if (eventIndex < state.currentEvent) {
      return state.eventResults[eventIndex];
    } else if (eventIndex === state.currentEvent) {
      return 'current';
    }
    return 'pending';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'won':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'lost':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'current':
        return <Clock className="w-4 h-4 text-blue-600" />;
      default:
        return <div className="w-4 h-4 rounded-full border-2 border-gray-300" />;
    }
  };

  const getCurrentEventOdds = () => {
    const state = getMasanielloState();
    if (!state || state.isCompleted) return 1.90;
    
    const settings = betting.currentSession ? JSON.parse(betting.currentSession.strategySettings) : {};
    const odds = settings.eventOdds || eventOdds;
    return odds[state.currentEvent] || 1.90;
  };

  const getSequenceStatus = () => {
    const state = getMasanielloState();
    if (!state) return { status: 'not_started', message: 'Non iniziata' };
    
    if (state.isCompleted) {
      if (state.isSuccessful) {
        return { status: 'success', message: 'OBIETTIVO RAGGIUNTO!' };
      } else {
        // Verifica se il fallimento è dovuto a impossibilità matematica
        const settings = betting.currentSession ? JSON.parse(betting.currentSession.strategySettings) : {};
        const totalEvents = settings.totalEvents || 5;
        const minimumWins = settings.minimumWins || 3;
        const eventiRimanenti = totalEvents - state.currentEvent;
        const vittorieNecessarie = minimumWins - state.eventsWon;
        
        if (vittorieNecessarie > eventiRimanenti) {
          return { status: 'failed', message: 'IMPOSSIBILE MATEMATICAMENTE' };
        } else {
          return { status: 'failed', message: 'OBIETTIVO FALLITO' };
        }
      }
    }
    
    const settings = betting.currentSession ? JSON.parse(betting.currentSession.strategySettings) : {};
    const totalEvents = settings.totalEvents || 5;
    const minimumWins = settings.minimumWins || 3;
    const eventiRimanenti = totalEvents - state.currentEvent;
    const vittorieNecessarie = minimumWins - state.eventsWon;
    
    // Controlla se l'obiettivo è ancora raggiungibile
    if (vittorieNecessarie > eventiRimanenti) {
      return { status: 'impossible', message: 'MATEMATICAMENTE IMPOSSIBILE' };
    }
    
    return { 
      status: 'in_progress', 
      message: `Evento ${state.currentEvent + 1}/${totalEvents} - Servono ${vittorieNecessarie} vittorie su ${eventiRimanenti} eventi` 
    };
  };

  const isInProfit = betting.currentSession 
    ? betting.currentSession.currentBankroll >= betting.currentSession.initialBankroll 
    : false;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-red-50">
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
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 bg-clip-text text-transparent">
                  {getStrategyDisplayName('masaniello')}
                </h1>
                <p className="text-gray-600">Sistema di money management per eventi multipli</p>
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
            {betting.currentSession && betting.currentSession.strategy === 'masaniello' ? (
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
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Stato Sequenza</h3>
                      <div className="flex items-center space-x-2">
                        {getSequenceStatus().status === 'success' && <CheckCircle className="w-4 h-4 text-green-600" />}
                        {getSequenceStatus().status === 'failed' && <XCircle className="w-4 h-4 text-red-600" />}
                        {getSequenceStatus().status === 'impossible' && <AlertCircle className="w-4 h-4 text-orange-600" />}
                        {getSequenceStatus().status === 'in_progress' && <Clock className="w-4 h-4 text-blue-600" />}
                        <p className={`text-sm font-medium ${
                          getSequenceStatus().status === 'impossible' ? 'text-orange-600' : 
                          getSequenceStatus().status === 'failed' ? 'text-red-600' :
                          getSequenceStatus().status === 'success' ? 'text-green-600' : ''
                        }`}>
                          {getSequenceStatus().message}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white">
                    <CardContent className="p-4">
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Eventi</h3>
                      <p className="text-xl font-bold text-gray-800">
                        {getMasanielloState()?.eventsWon || 0}W - {getMasanielloState()?.eventsLost || 0}L
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {getMasanielloState()?.currentEvent || 0} giocati
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-white">
                    <CardContent className="p-4">
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Prossima Puntata</h3>
                      <p className="text-xl font-bold text-purple-600">
                        {formatCurrency(betting.nextStake)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Quota: {getCurrentEventOdds().toFixed(2)}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Events Table */}
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Piano Eventi - Tracciamento Completo</h3>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Evento</TableHead>
                            <TableHead>Quota</TableHead>
                            <TableHead>Puntata</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Risultato</TableHead>
                            <TableHead>Vincita Pot.</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {eventOdds.map((odds, index) => {
                            const status = getEventStatus(index);
                            const sequenceStatus = getSequenceStatus();
                            const isImpossible = sequenceStatus.status === 'impossible' || 
                                               (sequenceStatus.status === 'failed' && sequenceStatus.message.includes('MATEMATICAMENTE'));
                            const isPastImpossible = isImpossible && status === 'pending';
                            
                            // Calcola puntata per questo evento
                            let eventStake = '-';
                            let potentialWin = '-';
                            
                            if (status === 'current') {
                              eventStake = formatCurrency(betting.nextStake);
                              potentialWin = formatCurrency(betting.nextStake * odds);
                            } else if (betting.bets && betting.bets.length > index) {
                              // Usa la puntata storica se disponibile
                              const bet = betting.bets[index];
                              if (bet) {
                                eventStake = formatCurrency(bet.stake);
                                potentialWin = formatCurrency(bet.potentialWin);
                              }
                            }
                            
                            return (
                              <TableRow key={index} className={`
                                ${status === 'current' ? 'bg-blue-50' : ''} 
                                ${isPastImpossible ? 'bg-gray-50 opacity-60' : ''}
                              `}>
                                <TableCell className="font-medium">Evento {index + 1}</TableCell>
                                <TableCell>{odds.toFixed(2)}</TableCell>
                                <TableCell className="font-medium">
                                  <span className={isPastImpossible ? 'text-gray-400' : status === 'current' ? 'text-blue-600' : ''}>
                                    {eventStake}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center space-x-2">
                                    {getStatusIcon(status)}
                                    <span className={`text-sm ${isPastImpossible ? 'text-gray-400' : ''}`}>
                                      {status === 'current' ? 'In corso' : 
                                       status === 'won' ? 'Vinto' :
                                       status === 'lost' ? 'Perso' : 
                                       isPastImpossible ? 'Annullato' : 'Da giocare'}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {status === 'won' && <Badge variant="default" className="bg-green-100 text-green-800">Vittoria</Badge>}
                                  {status === 'lost' && <Badge variant="destructive">Sconfitta</Badge>}
                                  {status === 'current' && <Badge variant="outline" className="border-blue-500 text-blue-700">Attuale</Badge>}
                                  {isPastImpossible && <Badge variant="outline" className="border-gray-400 text-gray-500">Annullato</Badge>}
                                </TableCell>
                                <TableCell className="font-medium">
                                  <span className={isPastImpossible ? 'text-gray-400' : status === 'current' ? 'text-blue-600' : ''}>
                                    {potentialWin}
                                  </span>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                {/* Betting Controls */}
                {!getMasanielloState()?.isCompleted && (
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold mb-4">Piazza Scommessa</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="mb-2 block">Puntata Consigliata</Label>
                          <div className="text-2xl font-bold text-purple-600 mb-2">
                            {formatCurrency(betting.nextStake)}
                          </div>
                          <p className="text-sm text-gray-500">
                            Quota: {getCurrentEventOdds().toFixed(2)} | 
                            Vincita Potenziale: {formatCurrency(betting.nextStake * getCurrentEventOdds())}
                          </p>
                        </div>
                        
                        <div className="flex flex-col space-y-2">
                          <Button
                            onClick={() => betting.placeBet(true)}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            Scommessa Vinta
                          </Button>
                          <Button
                            onClick={() => betting.placeBet(false)}
                            variant="destructive"
                          >
                            Scommessa Persa
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Final Result */}
                {getMasanielloState()?.isCompleted && (
                  <Card className={`border-2 ${
                    getMasanielloState()?.isSuccessful ? 'border-green-500 bg-green-50' : 
                    getSequenceStatus().message.includes('MATEMATICAMENTE') ? 'border-orange-500 bg-orange-50' :
                    'border-red-500 bg-red-50'
                  }`}>
                    <CardContent className="p-6 text-center">
                      <div className="flex items-center justify-center space-x-2 mb-4">
                        {getMasanielloState()?.isSuccessful ? (
                          <CheckCircle className="w-8 h-8 text-green-600" />
                        ) : getSequenceStatus().message.includes('MATEMATICAMENTE') ? (
                          <AlertCircle className="w-8 h-8 text-orange-600" />
                        ) : (
                          <XCircle className="w-8 h-8 text-red-600" />
                        )}
                        <h3 className={`text-2xl font-bold ${
                          getMasanielloState()?.isSuccessful ? 'text-green-600' : 
                          getSequenceStatus().message.includes('MATEMATICAMENTE') ? 'text-orange-600' :
                          'text-red-600'
                        }`}>
                          {getMasanielloState()?.isSuccessful ? 'OBIETTIVO RAGGIUNTO!' : getSequenceStatus().message}
                        </h3>
                      </div>
                      
                      {getSequenceStatus().message.includes('MATEMATICAMENTE') && (
                        <div className="mb-4 p-3 bg-orange-100 border border-orange-300 rounded-lg">
                          <p className="text-sm text-orange-800">
                            La sequenza è stata interrotta automaticamente perché era diventato matematicamente impossibile 
                            raggiungere il numero minimo di vittorie richieste con gli eventi rimanenti.
                          </p>
                        </div>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-sm text-gray-500">Profit/Loss</p>
                          <p className={`text-xl font-bold ${isInProfit ? 'text-green-600' : 'text-red-600'}`}>
                            {isInProfit ? '+' : ''}{formatCurrency(betting.currentSession.currentBankroll - betting.currentSession.initialBankroll)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Eventi Vinti</p>
                          <p className="text-xl font-bold">{getMasanielloState()?.eventsWon}/{JSON.parse(betting.currentSession.strategySettings).totalEvents}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">ROI</p>
                          <p className={`text-xl font-bold ${isInProfit ? 'text-green-600' : 'text-red-600'}`}>
                            {((betting.currentSession.currentBankroll / betting.currentSession.initialBankroll - 1) * 100).toFixed(2)}%
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Progress Tracker and Charts */}
                <AnimatedProgressTracker session={betting.currentSession} />
                
                {betting.bets && betting.bets.length > 0 && (
                  <div className="mb-6 mt-2">
                    <h3 className="text-sm font-medium text-gray-600 mb-2">Andamento Bankroll</h3>
                    <div className="h-24 w-full">
                      <SparklineChart 
                        bets={betting.bets} 
                        lineColor="#7C3AED" 
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
                  <h2 className="text-xl font-semibold mb-4">Nuova Sessione Multi Masaniello</h2>
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
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="mb-1 block">Cassa Iniziale (€)</Label>
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

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="mb-1 block">Numero Totale Eventi</Label>
                        <Input
                          type="number"
                          value={totalEvents}
                          onChange={(e) => setTotalEvents(Number(e.target.value))}
                          min="3"
                          max="20"
                        />
                      </div>
                      <div>
                        <Label className="mb-1 block">Vittorie Minime Richieste</Label>
                        <Input
                          type="number"
                          value={minimumWins}
                          onChange={(e) => setMinimumWins(Number(e.target.value))}
                          min="1"
                          max={totalEvents}
                        />
                      </div>
                      <div>
                        <Label className="mb-1 block">Fattore Rischio (%)</Label>
                        <Input
                          type="number"
                          value={riskFactor}
                          onChange={(e) => setRiskFactor(Number(e.target.value))}
                          min="1"
                          max="15"
                          step="0.5"
                        />
                      </div>
                    </div>

                    {/* Event Odds Configuration */}
                    <div>
                      <Label className="mb-2 block">Quote degli Eventi</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {eventOdds.map((odds, index) => (
                          <div key={index}>
                            <Label className="text-xs text-gray-500">Evento {index + 1}</Label>
                            <Input
                              type="number"
                              value={odds}
                              onChange={(e) => updateEventOdds(index, Number(e.target.value))}
                              min="1.01"
                              max="10"
                              step="0.01"
                              className="mt-1"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">Riepilogo Piano</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Cassa:</span>
                          <div className="font-medium">{formatCurrency(initialBankroll)}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Eventi:</span>
                          <div className="font-medium">{totalEvents}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Vittorie Necessarie:</span>
                          <div className="font-medium">{minimumWins}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Errori Tollerati:</span>
                          <div className="font-medium">{totalEvents - minimumWins}</div>
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 hover:from-purple-700 hover:via-pink-700 hover:to-red-700 text-white"
                      onClick={handleCreateSession}
                    >
                      Inizia Piano Masaniello
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
                <h2 className="text-xl font-semibold mb-4">Come Funziona Multi Masaniello</h2>
                <div className="space-y-4 text-sm">
                  <p>
                    <strong>Multi Masaniello</strong> è un sistema di money management per eventi multipli 
                    che calcola dinamicamente la puntata ottimale per raggiungere un obiettivo di profitto.
                  </p>
                  
                  <div>
                    <p className="font-semibold">Caratteristiche:</p>
                    <ul className="list-disc pl-5 space-y-1 mt-2">
                      <li>Puntate calcolate dinamicamente in base al progresso</li>
                      <li>Tolleranza configurabile agli errori</li>
                      <li>Quote personalizzabili per ogni evento</li>
                      <li>Controllo automatico della raggiungibilità dell'obiettivo</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-semibold">Formula di calcolo:</p>
                    <p className="text-xs text-gray-600 mt-1">
                      Puntata = (Cassa Residua × Fattore Rischio) / 
                      (Eventi Rimanenti - Errori Tollerabili + Errori Attuali)
                    </p>
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