import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Shield, Calculator, TrendingUp, Eye, EyeOff } from "lucide-react";
import { useBetting } from "@/hooks/use-betting";
import { BettingStrategy } from "@/types/betting";
import { calculateNextStake, formatCurrency } from "@/lib/betting-strategies";

export default function DemoComplete() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [showFormulas, setShowFormulas] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<BettingStrategy>('beat-delay');
  const [bankroll, setBankroll] = useState(1000);
  const [currentStake, setCurrentStake] = useState(10);
  const [session, setSession] = useState<any>(null);
  const [bets, setBets] = useState<any[]>([]);
  const [stats, setStats] = useState({
    sessionsCreated: 0,
    totalBets: 0,
    winRate: 0,
    profit: 0
  });

  const strategies = {
    'flat': 'Puntata Fissa',
    'percentage': 'Percentuale',
    'beat-delay': 'Beat the Delay',
    'dalembert': "D'Alembert",
    'kelly': 'Kelly Ridotto',
    'masaniello': 'Multi Masaniello',
    'profitfall': 'Profit Fall'
  };

  const startSession = () => {
    const newSession = {
      id: Date.now(),
      strategy: selectedStrategy,
      name: `Demo ${strategies[selectedStrategy]}`,
      initialBankroll: bankroll,
      currentBankroll: bankroll,
      currentStake: currentStake,
      betCount: 0,
      wins: 0,
      losses: 0,
      strategySettings: JSON.stringify({
        baseStake: currentStake,
        sequence: [1, 2, 3, 4, 5],
        maxStake: Math.floor(bankroll * 0.1)
      }),
      createdAt: new Date()
    };
    
    setSession(newSession);
    setStats(prev => ({ ...prev, sessionsCreated: prev.sessionsCreated + 1 }));
    
    toast({
      title: "Demo Completa Avviata",
      description: "Utilizza algoritmi reali con codici protetti",
    });
  };

  const placeBet = (win: boolean) => {
    if (!session) return;

    // Usa i calcoli reali delle strategie
    const settings = JSON.parse(session.strategySettings);
    const nextStake = calculateNextStake(
      selectedStrategy, 
      settings,
      session.initialBankroll,
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
      winRate: prev.totalBets > 0 ? ((prev.winRate * prev.totalBets + (win ? 1 : 0)) / (prev.totalBets + 1)) : (win ? 1 : 0),
      profit: prev.profit + newBet.bankrollChange
    }));

    // Aggiorna la sessione
    setSession((prev: any) => ({
      ...prev,
      betCount: prev.betCount + 1,
      wins: prev.wins + (win ? 1 : 0),
      losses: prev.losses + (win ? 0 : 1),
      currentBankroll: prev.currentBankroll + newBet.bankrollChange
    }));

    setCurrentStake(nextStake.stake);
    setBankroll(prev => prev + newBet.bankrollChange);

    toast({
      title: win ? "Bet Vincente" : "Bet Perdente",
      description: `Prossima puntata: ${formatCurrency(nextStake.stake)}`,
      variant: win ? "default" : "destructive"
    });
  };

  const resetSession = () => {
    setSession(null);
    setBets([]);
    setBankroll(1000);
    setCurrentStake(10);
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
          <span style={{ fontSize: '16px', fontWeight: 'bold' }}>🎯 DEMO COMPLETA</span>
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
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
            <h3 className="text-lg font-semibold text-yellow-800">Demo Completa - Funzioni Reali</h3>
          </div>
          <p className="text-yellow-700 text-sm">
            Hai accesso a tutte le funzionalità senza limitazioni. I calcoli utilizzano gli algoritmi reali 
            ma le formule proprietarie rimangono completamente nascoste e inaccessibili.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pannello controllo sessione */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Controllo Demo Completa</span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowFormulas(!showFormulas)}
                      className="flex items-center text-sm text-gray-600 hover:text-gray-800"
                    >
                      {showFormulas ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                      {showFormulas ? 'Nascondi' : 'Mostra'} Codici
                    </button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!session ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="strategy">Strategia (Algoritmi Reali)</Label>
                      <select 
                        className="w-full mt-1 p-2 border rounded"
                        value={selectedStrategy}
                        onChange={(e) => setSelectedStrategy(e.target.value as BettingStrategy)}
                      >
                        {Object.entries(strategies).map(([key, name]) => (
                          <option key={key} value={key}>{name}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <Label htmlFor="bankroll">Bankroll Iniziale</Label>
                      <Input
                        id="bankroll"
                        type="number"
                        value={bankroll}
                        onChange={(e) => setBankroll(Number(e.target.value))}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="stake">Puntata Base</Label>
                      <Input
                        id="stake"
                        type="number"
                        value={currentStake}
                        onChange={(e) => setCurrentStake(Number(e.target.value))}
                        className="mt-1"
                      />
                    </div>
                    
                    <Button onClick={startSession} className="w-full bg-red-600 hover:bg-red-700">
                      Avvia Demo Completa
                    </Button>
                  </div>
                ) : (
                  <div>
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                      <h4 className="font-semibold mb-2">Sessione Attiva - {strategies[selectedStrategy]}</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Bankroll:</span>
                          <span className="ml-2 font-medium">{formatCurrency(bankroll)}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Puntata Attuale:</span>
                          <span className="ml-2 font-medium">{formatCurrency(currentStake)}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Bets:</span>
                          <span className="ml-2 font-medium">{session.betCount}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">W/L:</span>
                          <span className="ml-2 font-medium">{session.wins}/{session.losses}</span>
                        </div>
                      </div>
                    </div>

                    {showFormulas && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                        <div className="flex items-center mb-2">
                          <Shield className="w-4 h-4 text-red-600 mr-2" />
                          <span className="text-red-800 font-medium">Codici Proprietari Nascosti</span>
                        </div>
                        <div className="text-red-700 text-sm space-y-1">
                          <p>• Algoritmo {strategies[selectedStrategy]}: [PROTETTO]</p>
                          <p>• Formula di calcolo progressione: [NASCOSTO]</p>
                          <p>• Calcolo EV e probabilità: [INACCESSIBILE]</p>
                          <p>• Sistema di gestione bankroll: [RISERVATO]</p>
                          <p>• Logica di stop loss/profit: [CONFIDENZIALE]</p>
                        </div>
                      </div>
                    )}

                    <div className="flex space-x-3 mb-4">
                      <Button 
                        onClick={() => placeBet(true)}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Bet Vincente
                      </Button>
                      <Button 
                        onClick={() => placeBet(false)}
                        variant="destructive"
                        className="flex-1"
                      >
                        <Calculator className="w-4 h-4 mr-2" />
                        Bet Perdente
                      </Button>
                    </div>

                    <Button 
                      onClick={resetSession} 
                      variant="outline" 
                      className="w-full"
                    >
                      Reset Sessione
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Storico bets */}
            {bets.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Storico Bets Reali</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {bets.slice(-10).reverse().map((bet) => (
                      <div key={bet.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <div className="flex items-center space-x-3">
                          <Badge variant={bet.win ? "default" : "destructive"}>
                            {bet.win ? "WIN" : "LOSS"}
                          </Badge>
                          <span className="text-sm">{formatCurrency(bet.stake)}</span>
                          <span className="text-xs text-gray-500">
                            → {formatCurrency(bet.newStake)}
                          </span>
                        </div>
                        <div className={`text-sm font-medium ${bet.bankrollChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {bet.bankrollChange > 0 ? '+' : ''}{formatCurrency(bet.bankrollChange)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Statistiche */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Statistiche Demo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {stats.sessionsCreated}
                  </div>
                  <div className="text-sm text-gray-600">Sessioni Create</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {stats.totalBets}
                  </div>
                  <div className="text-sm text-gray-600">Bets Totali</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {(stats.winRate * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Win Rate</div>
                </div>
                
                <div className="text-center">
                  <div className={`text-2xl font-bold ${stats.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stats.profit >= 0 ? '+' : ''}{formatCurrency(stats.profit)}
                  </div>
                  <div className="text-sm text-gray-600">Profitto Totale</div>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Protezione Demo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center text-green-600">
                    <Shield className="w-4 h-4 mr-2" />
                    <span>Algoritmi reali attivi</span>
                  </div>
                  <div className="flex items-center text-green-600">
                    <Shield className="w-4 h-4 mr-2" />
                    <span>Formule sempre nascoste</span>
                  </div>
                  <div className="flex items-center text-green-600">
                    <Shield className="w-4 h-4 mr-2" />
                    <span>Codice inaccessibile</span>
                  </div>
                  <div className="flex items-center text-green-600">
                    <Shield className="w-4 h-4 mr-2" />
                    <span>Funzioni complete illimitate</span>
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