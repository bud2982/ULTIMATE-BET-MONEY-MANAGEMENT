import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Shield, Clock, AlertTriangle, Calculator, TrendingUp, Eye, ArrowLeft } from "lucide-react";

export default function DemoInterface() {
  const [demoData, setDemoData] = useState<any>(null);
  const [bankroll, setBankroll] = useState(1000);
  const [odds, setOdds] = useState(2.0);
  const [strategy, setStrategy] = useState("percentage");
  const [calculation, setCalculation] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState("");
  const [, navigate] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    // Check if demo session is valid
    const demoCode = sessionStorage.getItem('demoCode');
    const storedDemoData = sessionStorage.getItem('demoData');
    
    if (!demoCode || !storedDemoData) {
      toast({
        title: "Sessione Demo Scaduta",
        description: "Accesso demo non trovato. Reindirizzamento...",
        variant: "destructive"
      });
      navigate('/demo');
      return;
    }

    const parsedDemoData = JSON.parse(storedDemoData);
    setDemoData(parsedDemoData);

    // Check if demo is still valid
    if (parsedDemoData.expiresAt && new Date() > new Date(parsedDemoData.expiresAt)) {
      toast({
        title: "Demo Scaduta",
        description: "La sessione demo è scaduta",
        variant: "destructive"
      });
      sessionStorage.removeItem('demoCode');
      sessionStorage.removeItem('demoData');
      navigate('/demo');
      return;
    }

    // Update time remaining every minute
    const updateTimer = () => {
      if (!parsedDemoData.expiresAt) {
        setTimeRemaining("Illimitato");
        return;
      }
      
      const now = new Date();
      const expiry = new Date(parsedDemoData.expiresAt);
      const diffMs = expiry.getTime() - now.getTime();
      
      if (diffMs <= 0) {
        setTimeRemaining("Scaduto");
        sessionStorage.removeItem('demoCode');
        sessionStorage.removeItem('demoData');
        navigate('/demo');
        return;
      }
      
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      setTimeRemaining(`${hours}h ${minutes}m`);
    };

    updateTimer();
    const timer = setInterval(updateTimer, 60000);
    
    // Cleanup function per evitare memory leaks
    return () => {
      clearInterval(timer);
    };
  }, [navigate, toast]);

  const calculateBet = async () => {
    if (!demoData) return;

    setIsCalculating(true);
    try {
      const demoCode = sessionStorage.getItem('demoCode');
      const response = await apiRequest("POST", "/api/demo/calculate-bet", {
        strategy,
        bankroll,
        odds,
        demoCode
      });

      setCalculation(response);
      toast({
        title: "Calcolo Completato",
        description: "Risultato demo generato",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Errore Calcolo",
        description: "Impossibile calcolare la puntata demo",
        variant: "destructive"
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const strategies = {
    percentage: "Percentuale Fissa",
    kelly: "Kelly Ridotto",
    profitfall: "Profit Fall",
    "beat-delay": "Beat the Delay"
  };

  if (!demoData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4">
      <div className="container mx-auto max-w-6xl py-6">
        {/* Header Demo */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/demo')}
                className="mr-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Esci Demo
              </Button>
              <h1 className="text-3xl font-bold text-gray-900">
                Demo Protetta - Betting Strategies
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                <Clock className="w-4 h-4 mr-2" />
                {timeRemaining}
              </Badge>
              <Badge className="bg-orange-100 text-orange-800">
                <Shield className="w-4 h-4 mr-2" />
                {demoData?.demoType?.toUpperCase() || 'DEMO'}
              </Badge>
            </div>
          </div>
          
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <AlertTriangle className="w-5 h-5 text-orange-600 mr-2" />
              <span className="font-semibold text-orange-800">Versione Demo Protetta</span>
            </div>
            <p className="text-sm text-orange-700">
              Questa è una versione demo con calcoli semplificati. Le formule reali sono protette per sicurezza della proprietà intellettuale.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pannello Input */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calculator className="w-5 h-5 mr-2" />
                Calcolatore Demo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="bankroll">Bankroll (€)</Label>
                <Input
                  id="bankroll"
                  type="number"
                  value={bankroll}
                  onChange={(e) => setBankroll(Number(e.target.value))}
                  min="1"
                  step="1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="odds">Quota</Label>
                <Input
                  id="odds"
                  type="number"
                  value={odds}
                  onChange={(e) => setOdds(Number(e.target.value))}
                  min="1.01"
                  step="0.01"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="strategy">Strategia</Label>
                <Select value={strategy} onValueChange={setStrategy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(strategies).map(([key, name]) => (
                      <SelectItem key={key} value={key}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={calculateBet}
                disabled={isCalculating}
                className="w-full"
                size="lg"
              >
                {isCalculating ? 'Calcolando...' : 'Calcola Puntata Demo'}
              </Button>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <h4 className="font-semibold text-blue-800 mb-2">Limitazioni Demo:</h4>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• Calcoli semplificati senza algoritmi proprietari</li>
                  <li>• Risultati approssimativi per protezione IP</li>
                  <li>• ML predittivo disabilitato</li>
                  <li>• Funzioni limitate nel tempo</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Pannello Risultati */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                Risultati Demo
              </CardTitle>
            </CardHeader>
            <CardContent>
              {calculation ? (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="text-center mb-3">
                      <span className="text-2xl font-bold text-green-800">
                        €{calculation.stake}
                      </span>
                      <p className="text-sm text-green-600">Puntata consigliata</p>
                    </div>
                    <p className="text-sm text-green-700 text-center">
                      {calculation.reasoning}
                    </p>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800 font-medium">
                      {calculation.warning}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="font-semibold text-gray-700">Strategia</p>
                      <p className="text-gray-600">{strategies[strategy as keyof typeof strategies]}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="font-semibold text-gray-700">% Bankroll</p>
                      <p className="text-gray-600">{((calculation.stake / bankroll) * 100).toFixed(2)}%</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <h4 className="font-semibold text-gray-800 mb-2">Info Demo:</h4>
                    <p className="text-xs text-gray-600">
                      I calcoli mostrati sono versioni semplificate delle strategie reali. 
                      La versione completa include algoritmi avanzati, ML predittivo e formule proprietarie.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Inserisci i parametri e clicca "Calcola" per vedere i risultati demo</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Pannello Funzionalità Demo */}
        <Card className="mt-6 shadow-lg">
          <CardHeader>
            <CardTitle>Funzionalità Disponibili in Demo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-2">✓ Disponibile</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Interfaccia completa</li>
                  <li>• Input personalizzati</li>
                  <li>• Calcoli semplificati</li>
                  <li>• Tutte le strategie visibili</li>
                </ul>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-800 mb-2">⚠ Limitato</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Formule approssimate</li>
                  <li>• Dati demo preimpostati</li>
                  <li>• Export ridotto</li>
                  <li>• Tempo limitato</li>
                </ul>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-semibold text-red-800 mb-2">✗ Non Disponibile</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>• Algoritmi proprietari</li>
                  <li>• ML predittivo avanzato</li>
                  <li>• Formule originali</li>
                  <li>• Salvataggio permanente</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}