import { useEffect, useState, useRef } from 'react';
import { Link, useLocation } from 'wouter';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useBetting } from "@/hooks/use-betting";
import { BettingStrategy, SessionData } from "@/types/betting";
import { useQuery } from "@tanstack/react-query";
import StrategyRecommender from "@/components/strategy-recommender";
import TrendSparklines from "@/components/trend-sparklines";
import Footer from "@/components/footer";
import { formatCurrency } from "@/lib/betting-strategies";
import SparklineChart from "@/components/sparkline-chart";

export default function Home() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const betting = useBetting();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [allSessionBets, setAllSessionBets] = useState<Record<number, any>>({});
  const [globalBankroll, setGlobalBankroll] = useState<number>(10000);
  const [allocatedBankroll, setAllocatedBankroll] = useState<number>(0);
  const [availableBankroll, setAvailableBankroll] = useState<number>(10000);
  const [activeStrategies, setActiveStrategies] = useState<Record<string, number>>({});
  
  // Usa react-query per ottenere le sessioni tipizzate correttamente
  const { data: sessionsTyped } = useQuery<SessionData[]>({
    queryKey: ['typed-sessions'],
    queryFn: async () => {
      if (Array.isArray(betting.sessions)) {
        return betting.sessions as SessionData[];
      }
      return [];
    },
    enabled: !!betting.sessions,
    staleTime: 1000 // Refresh solo quando cambiano i dati
  });
  
  // Costruisci la mappa di tutte le scommesse per sessionId
  useEffect(() => {
    if (sessionsTyped && sessionsTyped.length > 0) {
      const fetchAllBets = async () => {
        const betsMap: Record<number, any> = {};
        
        for (const session of sessionsTyped) {
          if (session.id) {
            try {
              const response = await fetch(`/api/sessions/${session.id}/bets`);
              const sessionBets = await response.json();
              if (Array.isArray(sessionBets)) {
                betsMap[session.id] = sessionBets;
              }
            } catch (error) {
              console.error(`Errore nel recupero delle scommesse per la sessione ${session.id}:`, error);
            }
          }
        }
        
        setAllSessionBets(betsMap);
      };
      
      fetchAllBets();
    }
  }, [sessionsTyped]);
  
  // Calcola il bankroll allocato e le strategie attive
  useEffect(() => {
    let allocated = 0;
    let totalProfit = 0;
    const strategies: Record<string, number> = {};
    
    if (sessionsTyped && sessionsTyped.length > 0) {
      for (const session of sessionsTyped) {
        allocated += session.initialBankroll;
        totalProfit += (session.currentBankroll - session.initialBankroll);
        
        if (!strategies[session.strategy]) {
          strategies[session.strategy] = 0;
        }
        strategies[session.strategy] += 1;
      }
    }
    
    setAllocatedBankroll(allocated);
    setActiveStrategies(strategies);
    
    // Aggiorna il bankroll globale nel localStorage per persistenza
    localStorage.setItem('globalBankroll', globalBankroll.toString());
    
    // Non calcoliamo qui il bankroll disponibile perché è gestito direttamente 
    // dalle pagine delle strategie al momento della creazione/chiusura di sessioni
    
    console.log('Bankroll aggiornato:', {
      globalBankroll,
      allocated,
      available: Number(localStorage.getItem('availableBankroll') || '0'),
      totalProfit
    });
  }, [sessionsTyped, globalBankroll]);

  // Chiudi il menu quando si clicca fuori
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMobileMenu(false);
      }
    }

    if (showMobileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showMobileMenu]);
  
  // Carica il bankroll globale e disponibile dal localStorage all'avvio
  useEffect(() => {
    const savedGlobalBankroll = localStorage.getItem('globalBankroll');
    const savedAvailableBankroll = localStorage.getItem('availableBankroll');
    
    if (savedGlobalBankroll) {
      setGlobalBankroll(Number(savedGlobalBankroll));
    }
    
    // Se c'è un valore salvato per il bankroll disponibile, usalo direttamente
    // Questo assicura che le entrate/uscite delle sessioni vengano considerate
    if (savedAvailableBankroll) {
      setAvailableBankroll(Number(savedAvailableBankroll));
    }
  }, []);
  
  // Controlla periodicamente il valore del bankroll disponibile nel localStorage
  // per sincronizzare quando è cambiato da altre pagine (creazione/chiusura sessioni)
  useEffect(() => {
    const checkAvailableBankroll = () => {
      const currentAvailableBankroll = Number(localStorage.getItem('availableBankroll') || '0');
      if (currentAvailableBankroll !== availableBankroll) {
        setAvailableBankroll(currentAvailableBankroll);
      }
    };
    
    // Controlla subito
    checkAvailableBankroll();
    
    // Controlla periodicamente (ogni 2 secondi)
    const intervalId = setInterval(checkAvailableBankroll, 2000);
    
    // Pulisci l'intervallo quando il componente viene smontato
    return () => clearInterval(intervalId);
  }, [availableBankroll]);
  
  // Non carichiamo font esterni per migliorare la compatibilità
  
  // Calcola i guadagni/perdite complessivi
  const calculateTotalProfitLoss = () => {
    if (!sessionsTyped || sessionsTyped.length === 0) return 0;
    
    let initialTotal = 0;
    let currentTotal = 0;
    
    for (const session of sessionsTyped) {
      initialTotal += session.initialBankroll;
      currentTotal += session.currentBankroll;
    }
    
    return currentTotal - initialTotal;
  };
  
  // Calcola la percentuale di rendimento complessivo
  const calculateTotalROI = () => {
    if (!sessionsTyped || sessionsTyped.length === 0 || allocatedBankroll === 0) return 0;
    
    const profitLoss = calculateTotalProfitLoss();
    return (profitLoss / allocatedBankroll) * 100;
  };
  
  // Gestisce il cambio di strategia consigliata
  const handleStrategyChange = (strategy: BettingStrategy) => {
    // Naviga direttamente alla pagina della strategia consigliata
    navigate(`/strategia/${strategy}`);
    
    toast({
      title: "Strategia consigliata",
      description: `Navigazione alla strategia ${strategy}`,
      variant: "default"
    });
  };
  
  // Fornisci valori sicuri con tipizzazione corretta
  const sessions = sessionsTyped || [];
  
  return (
    <div className="bg-gray-100 font-roboto min-h-screen">
      {/* Header Mobile-First */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '60px',
          backgroundColor: '#1e40af',
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
        <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
          🎮 TOP BET
        </div>
        
        <div style={{ display: 'flex', gap: '8px', position: 'relative' }}>
          <div
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            style={{
              backgroundColor: 'white',
              color: '#1e40af',
              padding: '8px 15px',
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              userSelect: 'none'
            }}
          >
            MENU
          </div>
          
          <div
            onClick={() => navigate('/strategia/percentage')}
            style={{
              backgroundColor: '#16a34a',
              color: 'white',
              padding: '8px 15px',
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              userSelect: 'none'
            }}
          >
            NUOVO
          </div>
          
          {/* Menu Dropdown */}
          {showMobileMenu && (
            <div
              ref={menuRef}
              style={{
                position: 'absolute',
                top: '50px',
                right: '0',
                backgroundColor: 'white',
                border: '1px solid #ccc',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                zIndex: 9999,
                minWidth: '220px',
                overflow: 'hidden'
              }}
            >
              <div
                onClick={() => {
                  navigate('/pricing');
                  setShowMobileMenu(false);
                }}
                style={{
                  padding: '15px 20px',
                  cursor: 'pointer',
                  borderBottom: '1px solid #eee',
                  fontSize: '14px',
                  color: '#333',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
              >
                💳 Piani e Abbonamenti
              </div>
              
              <div
                onClick={() => {
                  navigate('/account');
                  setShowMobileMenu(false);
                }}
                style={{
                  padding: '15px 20px',
                  cursor: 'pointer',
                  borderBottom: '1px solid #eee',
                  fontSize: '14px',
                  color: '#333',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
              >
                👤 Account
              </div>
              
              <div
                onClick={() => {
                  navigate('/demo-invite');
                  setShowMobileMenu(false);
                }}
                style={{
                  padding: '15px 20px',
                  cursor: 'pointer',
                  borderBottom: '1px solid #eee',
                  fontSize: '14px',
                  color: '#333',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
              >
                🛡️ Demo per Amici
              </div>
              
              <div
                onClick={() => {
                  navigate('/demo-complete');
                  setShowMobileMenu(false);
                }}
                style={{
                  padding: '15px 20px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: '#333',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  backgroundColor: '#fef3c7',
                  fontWeight: '600'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fde68a'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#fef3c7'}
              >
                🎯 Demo Completa
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Spazio per header fisso */}
      <div style={{ height: '60px' }}></div>
      
      {/* Background overlay with subtle pattern */}
      <div className="bg-sports-overlay">
        <div className="sports-img bg-gray-100"></div>
      </div>
      
      <header className="bg-primary text-white shadow-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="text-2xl font-montserrat font-bold">TOP BET MONEY MANAGEMENT</div>
            </div>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-6">
        {/* Sezione Cassa Globale */}
        <Card className="mb-6 border-b-4 border-primary">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-primary">Cassa Globale</h2>
              <div className="text-sm text-gray-600">
                {allocatedBankroll > 0 && (
                  <span className={calculateTotalROI() >= 0 ? 'text-green-600' : 'text-red-600'}>
                    ROI: {calculateTotalROI().toFixed(2)}%
                  </span>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white border rounded-lg p-4 shadow-sm">
                <h3 className="text-sm font-medium text-gray-600 mb-1">Bankroll Globale</h3>
                <div className="flex items-center">
                  <Input 
                    type="number" 
                    value={globalBankroll}
                    onChange={(e) => setGlobalBankroll(Number(e.target.value))}
                    className="text-lg font-bold text-gray-800 border-0 p-0 h-auto focus-visible:ring-0"
                  />
                  <span className="text-sm ml-1">€</span>
                </div>
                <div className="mt-3">
                  <h3 className="text-sm font-medium text-gray-600">Disponibile: <span className="font-bold">{formatCurrency(availableBankroll)}</span></h3>
                </div>
                <div className="mt-2 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Resetta il bankroll disponibile allo stesso valore del bankroll globale
                      localStorage.setItem('availableBankroll', globalBankroll.toString());
                      setAvailableBankroll(globalBankroll);
                      toast({
                        title: "Bankroll disponibile resettato",
                        description: "Il bankroll disponibile è stato reimpostato al valore del bankroll globale.",
                        variant: "default",
                        className: "bg-green-100 border-green-400 text-green-800"
                      });
                    }}
                    className="text-xs"
                  >
                    Resetta Disponibile
                  </Button>
                </div>
              </div>
              
              <div className="bg-white border rounded-lg p-4 shadow-sm">
                <h3 className="text-sm font-medium text-gray-600 mb-1">Bankroll Allocato</h3>
                <p className="text-lg font-bold text-gray-800">{formatCurrency(allocatedBankroll)}</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-primary h-2 rounded-full" 
                    style={{ 
                      width: `${Math.min(100, (allocatedBankroll / globalBankroll) * 100)}%`
                    }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {(allocatedBankroll / globalBankroll * 100).toFixed(2)}% del bankroll globale
                </p>
              </div>
              
              <div className="bg-white border rounded-lg p-4 shadow-sm">
                <h3 className="text-sm font-medium text-gray-600 mb-1">Profitti/Perdite</h3>
                <p className={`text-lg font-bold ${calculateTotalProfitLoss() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {calculateTotalProfitLoss() >= 0 ? '+' : ''}{formatCurrency(calculateTotalProfitLoss())}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Da tutte le strategie attive
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Sistema di raccomandazione intelligente delle strategie */}
        {!betting.sessionsLoading && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-primary mb-4">Strategie Consigliate</h2>
            <StrategyRecommender
              sessions={sessions}
              allBets={allSessionBets}
              currentStrategy={undefined}
              onSelectStrategy={handleStrategyChange}
            />
          </div>
        )}
        
        {/* Interactive Betting Trend Sparklines */}
        {sessions.length > 0 && (
          <div className="mb-6">
            <TrendSparklines 
              sessions={sessions}
              allBets={allSessionBets}
              onSessionSelect={(session) => {
                navigate(`/strategia/${session.strategy}`);
              }}
            />
          </div>
        )}
        
        {/* Strategie disponibili */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-primary mb-4">Strategie Disponibili</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

            
            <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <div className="bg-green-500 h-2"></div>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold">Percentuale</h3>
                  {activeStrategies['percentuale'] && (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                      {activeStrategies['percentuale']} sessioni
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Punta una percentuale fissa del bankroll attuale ad ogni scommessa.
                </p>
                <Button 
                  className="w-full bg-green-500 hover:bg-green-600"
                  onClick={() => navigate('/strategia/percentage')}
                >
                  Accedi
                </Button>
              </CardContent>
            </Card>
            
            <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <div className="bg-purple-500 h-2"></div>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold">D'Alembert</h3>
                  {activeStrategies['dalembert'] && (
                    <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
                      {activeStrategies['dalembert']} sessioni
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Aumenta o diminuisci gradualmente la puntata in base al risultato precedente.
                </p>
                <Button 
                  className="w-full bg-purple-500 hover:bg-purple-600"
                  onClick={() => navigate('/strategia/dalembert')}
                >
                  Accedi
                </Button>
              </CardContent>
            </Card>
            
            <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 h-2"></div>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 bg-clip-text text-transparent">PROFIT FALL</h3>
                  {activeStrategies['profitfall'] && (
                    <span className="bg-pink-100 text-pink-800 text-xs px-2 py-1 rounded">
                      {activeStrategies['profitfall']} sessioni
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Progressione a cascata con incrementi percentuali fissi per massimizzare i profitti.
                </p>
                <Button 
                  className="w-full bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 hover:from-purple-600 hover:via-pink-600 hover:to-red-600"
                  onClick={() => navigate('/strategia/profitfall')}
                >
                  Accedi
                </Button>
              </CardContent>
            </Card>
            
            <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-2"></div>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">Multi Masaniello</h3>
                  {activeStrategies['masaniello'] && (
                    <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded">
                      {activeStrategies['masaniello']} sessioni
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Sistema avanzato di money management per eventi multipli con calcolo dinamico delle puntate.
                </p>
                <Button 
                  className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600"
                  onClick={() => navigate('/strategia/masaniello')}
                >
                  Accedi
                </Button>
              </CardContent>
            </Card>
            
            <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 h-2"></div>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 bg-clip-text text-transparent">Kelly Ridotto</h3>
                  {activeStrategies['kelly'] && (
                    <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded">
                      {activeStrategies['kelly']} sessioni
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Criterio Kelly per eventi simultanei con riduzione del rischio e controllo matematico delle puntate.
                </p>
                <Button 
                  className="w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600"
                  onClick={() => navigate('/strategia/kelly')}
                >
                  Accedi
                </Button>
              </CardContent>
            </Card>
            
            <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <div className="bg-gradient-to-r from-purple-500 via-violet-500 to-indigo-500 h-2"></div>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-500 via-violet-500 to-indigo-500 bg-clip-text text-transparent">Beat the Delay</h3>
                  {activeStrategies['beat-delay'] && (
                    <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
                      {activeStrategies['beat-delay']} sessioni
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Sistema D'Alembert avanzato con analisi statistica dei ritardi e calcolo del valore atteso (EV).
                </p>
                <Button 
                  className="w-full bg-gradient-to-r from-purple-500 via-violet-500 to-indigo-500 hover:from-purple-600 hover:via-violet-600 hover:to-indigo-600"
                  onClick={() => navigate('/strategia/beat-delay')}
                >
                  Accedi
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
        

      </main>
      
      <Footer />
    </div>
  );
}
