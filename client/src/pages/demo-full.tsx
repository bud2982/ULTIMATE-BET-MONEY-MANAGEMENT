import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Shield, Clock, ArrowLeft, Eye, EyeOff, TrendingUp, Calculator } from "lucide-react";
import { useBetting } from "@/hooks/use-betting";
import { BettingStrategy } from "@/types/betting";
import { calculateNextStake, formatCurrency } from "@/lib/betting-strategies";

export default function DemoFull() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const betting = useBetting();
  const [showFormulas, setShowFormulas] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<BettingStrategy>('beat-delay');
  const [realBankroll, setRealBankroll] = useState(1000);
  const [currentStake, setCurrentStake] = useState(10);
  const [sequence, setSequence] = useState([1, 2, 3, 4, 5]);
  const [realSession, setRealSession] = useState<any>(null);
  const [bets, setBets] = useState<any[]>([]);
  const [stats, setStats] = useState({
    sessionsCreated: 0,
    totalBets: 0,
    winRate: 0,
    profit: 0
  });
  
  // Stati mancanti
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [demoData, setDemoData] = useState({
    strategy: 'beat-delay',
    bankroll: 1000,
    currentStake: 10,
    expectedValue: 0.15
  });
  const [demoStats, setDemoStats] = useState({
    sessionsCreated: 0,
    totalBets: 0,
    winRate: 0,
    profit: 0
  });
  
  const placeDemoBet = (win: boolean) => {
    // Logica per piazzare una scommessa demo
    setDemoStats(prev => ({
      ...prev,
      totalBets: prev.totalBets + 1,
      winRate: prev.totalBets > 0 ? ((prev.winRate * prev.totalBets + (win ? 1 : 0)) / (prev.totalBets + 1)) : (win ? 1 : 0),
      profit: prev.profit + (win ? demoData.currentStake * 0.5 : -demoData.currentStake)
    }));
  };
  
  const startDemoSession = () => {
    setCurrentSession({
      id: Date.now(),
      strategy: demoData.strategy,
      bankroll: demoData.bankroll,
      initialBankroll: demoData.bankroll
    });
    setDemoStats(prev => ({ ...prev, sessionsCreated: prev.sessionsCreated + 1 }));
  };

  const startRealSession = () => {
    const sessionData = {
      id: Date.now(),
      strategy: selectedStrategy,
      name: `Demo ${selectedStrategy.toUpperCase()}`,
      initialBankroll: realBankroll,
      currentBankroll: realBankroll,
      currentStake: currentStake,
      betCount: 0,
      wins: 0,
      losses: 0,
      strategySettings: JSON.stringify({
        baseStake: currentStake,
        sequence: sequence,
        maxStake: Math.floor(realBankroll * 0.1)
      }),
      createdAt: new Date()
    };
    
    setRealSession(sessionData);
    setStats(prev => ({ ...prev, sessionsCreated: prev.sessionsCreated + 1 }));
    
    toast({
      title: "Sessione Demo Completa Avviata",
      description: "Utilizza algoritmi reali con codici nascosti",
    });
  };

  const placeRealBet = (win: boolean) => {
    if (!realSession) return;

    // Usa i calcoli reali delle strategie ma nascondi l'implementazione
    const settings = JSON.parse(realSession.strategySettings);
    const nextStake = calculateNextStake(
      selectedStrategy, 
      settings,
      realSession.initialBankroll,
      win,
      {},
      1.5 // odds di default
    );

    const newBet = {
      id: Date.now(),
      stake: currentStake,
      win,
      timestamp: new Date(),
      newStake: nextStake,
      bankrollChange: win ? currentStake * 0.9 : -currentStake
    };

    setBets(prev => [...prev, newBet]);
    setStats(prev => ({
      ...prev,
      totalBets: prev.totalBets + 1,
      winRate: ((prev.winRate * prev.totalBets + (win ? 1 : 0)) / (prev.totalBets + 1)),
      profit: prev.profit + newBet.bankrollChange
    }));

    // Aggiorna la sessione reale
    setRealSession((prev: any) => ({
      ...prev,
      betCount: prev.betCount + 1,
      wins: prev.wins + (win ? 1 : 0),
      losses: prev.losses + (win ? 0 : 1),
      currentBankroll: prev.currentBankroll + newBet.bankrollChange
    }));

    setCurrentStake(nextStake.stake);
    setRealBankroll(prev => prev + newBet.bankrollChange);

    toast({
      title: win ? "Bet Vincente" : "Bet Perdente",
      description: `Prossima puntata: ${formatCurrency(nextStake.stake)}`,
      variant: win ? "default" : "destructive"
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4">
      {/* Header fisso demo */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '60px',
          backgroundColor: '#dc2626',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 15px',
          zIndex: 10000,
          fontFamily: 'Arial, sans-serif',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            onClick={() => navigate('/')}
            style={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              padding: '5px 10px',
              borderRadius: '15px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            ← Esci Demo
          </div>
          <span style={{ fontSize: '16px', fontWeight: 'bold' }}>🛡️ DEMO COMPLETA</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Badge className="bg-yellow-100 text-yellow-800">
            <Shield className="w-4 h-4 mr-1" />
            Codici Protetti
          </Badge>
        </div>
      </div>

      {/* Spazio per header fisso */}
      <div style={{ height: '60px' }}></div>

      <div className="container mx-auto max-w-6xl py-6">
        {/* Banner di avviso demo */}
        <div className="mb-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <AlertTriangle className="w-5 h-5 text-orange-600 mr-2" />
            <h3 className="text-lg font-semibold text-orange-800">Modalità Demo Completa</h3>
          </div>
          <p className="text-orange-700 text-sm">
            Hai accesso a tutte le funzionalità senza limitazioni. I calcoli sono reali ma gli algoritmi proprietari 
            rimangono completamente nascosti e inaccessibili. Perfetto per testare tutte le strategie!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pannello controllo sessione */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Controllo Sessione Demo</span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowFormulas(!showFormulas)}
                      className="flex items-center text-sm text-gray-600 hover:text-gray-800"
                    >
                      {showFormulas ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                      {showFormulas ? 'Nascondi' : 'Mostra'} Formule
                    </button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!currentSession ? (
                  <div className="text-center py-8">
                    <div className="mb-4">
                      <Label htmlFor="strategy">Strategia Demo</Label>
                      <select 
                        className="w-full mt-1 p-2 border rounded"
                        value={demoData.strategy}
                        onChange={(e) => setDemoData(prev => ({ ...prev, strategy: e.target.value }))}
                      >
                        <option value="beat-delay">Beat the Delay</option>
                        <option value="dalembert">D'Alembert</option>
                        <option value="kelly">Kelly Ridotto</option>
                        <option value="masaniello">Multi Masaniello</option>
                        <option value="profitfall">Profit Fall</option>
                      </select>
                    </div>
                    
                    <div className="mb-4">
                      <Label htmlFor="bankroll">Bankroll Demo</Label>
                      <Input
                        id="bankroll"
                        type="number"
                        value={demoData.bankroll}
                        onChange={(e) => setDemoData(prev => ({ ...prev, bankroll: Number(e.target.value) }))}
                        className="mt-1"
                      />
                    </div>
                    
                    <Button onClick={startDemoSession} className="w-full">
                      Avvia Sessione Demo Completa
                    </Button>
                  </div>
                ) : (
                  <div>
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                      <h4 className="font-semibold mb-2">Stato Sessione Attuale</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Strategia:</span>
                          <span className="ml-2 font-medium">{currentSession.strategy.toUpperCase()}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Bankroll:</span>
                          <span className="ml-2 font-medium">€{demoData.bankroll.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Puntata Attuale:</span>
                          <span className="ml-2 font-medium">€{demoData.currentStake}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Valore Atteso:</span>
                          <span className="ml-2 font-medium">{demoData.expectedValue}</span>
                        </div>
                      </div>
                    </div>

                    {showFormulas && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                        <div className="flex items-center mb-2">
                          <Shield className="w-4 h-4 text-red-600 mr-2" />
                          <span className="text-red-800 font-medium">Formule Protette</span>
                        </div>
                        <div className="text-red-700 text-sm space-y-1">
                          <p>• Algoritmo di calcolo: [NASCOSTO]</p>
                          <p>• Formula D'Alembert avanzata: [INACCESSIBILE]</p>
                          <p>• Calcolo EV proprietario: [PROTETTO]</p>
                          <p>• Sistema di progressione: [RISERVATO]</p>
                        </div>
                      </div>
                    )}

                    <div className="flex space-x-3">
                      <Button 
                        onClick={() => placeDemoBet(true)}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        Bet Vincente
                      </Button>
                      <Button 
                        onClick={() => placeDemoBet(false)}
                        variant="destructive"
                        className="flex-1"
                      >
                        Bet Perdente
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Storico bets demo */}
            {bets.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Storico Bets Demo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {bets.slice(-10).reverse().map((bet) => (
                      <div key={bet.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <div className="flex items-center space-x-3">
                          <Badge variant={bet.win ? "default" : "destructive"}>
                            {bet.win ? "WIN" : "LOSS"}
                          </Badge>
                          <span className="text-sm">€{bet.stake}</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {bet.bankrollChange > 0 ? '+' : ''}€{bet.bankrollChange.toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Statistiche demo */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Statistiche Demo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {demoStats.sessionsCreated}
                  </div>
                  <div className="text-sm text-gray-600">Sessioni Create</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {demoStats.totalBets}
                  </div>
                  <div className="text-sm text-gray-600">Bets Totali</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {demoStats.winRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Win Rate</div>
                </div>
                
                <div className="text-center">
                  <div className={`text-2xl font-bold ${demoStats.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {demoStats.profit >= 0 ? '+' : ''}€{demoStats.profit.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600">Profitto Totale</div>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Sicurezza Demo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center text-green-600">
                    <Shield className="w-4 h-4 mr-2" />
                    <span>Algoritmi protetti</span>
                  </div>
                  <div className="flex items-center text-green-600">
                    <Shield className="w-4 h-4 mr-2" />
                    <span>Formule nascoste</span>
                  </div>
                  <div className="flex items-center text-green-600">
                    <Shield className="w-4 h-4 mr-2" />
                    <span>Codice inaccessibile</span>
                  </div>
                  <div className="flex items-center text-green-600">
                    <Shield className="w-4 h-4 mr-2" />
                    <span>Funzioni complete</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}