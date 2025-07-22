import { useState, useEffect } from 'react';
import { BettingStrategy, BettingStrategySettings, SessionData } from '@/types/betting';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { getStrategyDisplayName, formatCurrency, calculateROI } from '@/lib/betting-strategies';

interface SettingsPanelProps {
  betting: any;
}

export default function SettingsPanel({ betting }: SettingsPanelProps) {
  const [initialBankroll, setInitialBankroll] = useState<number>(1000);
  const [targetReturn, setTargetReturn] = useState<number>(10);
  const [averageOdds, setAverageOdds] = useState<number>(1.8);
  const [strategy, setStrategy] = useState<BettingStrategy>('percentage');
  
  // Strategy-specific settings
  const [bankrollPercentage, setBankrollPercentage] = useState<number>(2);
  const [dalembertUnit, setDalembertUnit] = useState<number>(10);
  // Qui potrai aggiungere le variabili di stato per il tuo metodo personalizzato

  // Valori default per le nuove implementazioni
  useEffect(() => {
    if (!betting.currentSession) {
      // Imposta i valori predefiniti per le strategie
      setBankrollPercentage(2); // Default 2% della cassa
    }
  }, []);
  
  // Set current session values if we have one
  useEffect(() => {
    if (betting.currentSession) {
      const session = betting.currentSession;
      setInitialBankroll(session.initialBankroll);
      setTargetReturn(session.targetReturn);
      setStrategy(session.strategy);
      
      try {
        const strategySettings: BettingStrategySettings = JSON.parse(session.strategySettings);

        if (strategySettings.bankrollPercentage) setBankrollPercentage(strategySettings.bankrollPercentage);
        if (strategySettings.dalembertUnit) setDalembertUnit(strategySettings.dalembertUnit);
        // I parametri per il tuo metodo personalizzato possono essere aggiunti qui
      } catch (error) {
        console.error("Error parsing strategy settings:", error);
      }
      
      // Set odds from the bet form
      betting.setBetOdds(averageOdds);
    }
  }, [betting.currentSession]);

  const handleStartSession = () => {
    const strategySettings: BettingStrategySettings = {};
    
    // Set the appropriate settings based on selected strategy
    switch (strategy) {
      case 'percentage':
        strategySettings.bankrollPercentage = bankrollPercentage;
        break;
      case 'dalembert':
        strategySettings.dalembertUnit = dalembertUnit;
        break;
      case 'profitfall':
        strategySettings.bankrollPercentage = bankrollPercentage;
        strategySettings.incrementPercentage = 1; // Default increment
        break;
    }
    
    const sessionData: Omit<SessionData, 'betCount' | 'wins' | 'losses'> = {
      name: `Sessione del ${new Date().toLocaleDateString('it-IT')}`,
      initialBankroll,
      currentBankroll: initialBankroll,
      targetReturn,
      strategy,
      strategySettings: JSON.stringify(strategySettings)
    };
    
    betting.startNewSession(sessionData);
  };

  // Calculate progress percentage
  const calculateProgress = () => {
    if (!betting.currentSession) return 0;
    
    const { initialBankroll, currentBankroll, targetReturn } = betting.currentSession;
    if (currentBankroll <= initialBankroll) return 0;
    
    const profit = currentBankroll - initialBankroll;
    const targetProfit = initialBankroll * (targetReturn / 100);
    return Math.min(100, (profit / targetProfit) * 100);
  };

  // Calculate target amount
  const calculateTargetAmount = () => {
    return initialBankroll * (1 + targetReturn / 100);
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <h2 className="text-xl font-montserrat font-semibold mb-4 text-primary">Impostazioni Generali</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Bankroll Settings */}
          <div className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="initialBankroll">Cassa Iniziale (€)</Label>
              <Input 
                id="initialBankroll" 
                type="number" 
                value={initialBankroll}
                onChange={(e) => setInitialBankroll(Number(e.target.value))}
                disabled={!!betting.currentSession}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="targetReturn">Obiettivo di Rendimento (%)</Label>
              <Input 
                id="targetReturn" 
                type="number" 
                value={targetReturn}
                onChange={(e) => setTargetReturn(Number(e.target.value))}
                disabled={!!betting.currentSession}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="averageOdds">Quota Media</Label>
              <Input 
                id="averageOdds" 
                type="number" 
                value={averageOdds}
                step="0.01"
                onChange={(e) => {
                  setAverageOdds(Number(e.target.value));
                  betting.setBetOdds(Number(e.target.value));
                }}
              />
            </div>
          </div>
          
          {/* Strategy Selection */}
          <div>
            <Label className="block mb-3">Strategia di Puntata</Label>
            <RadioGroup 
              value={strategy} 
              onValueChange={(v) => setStrategy(v as BettingStrategy)}
              className="space-y-2"
              disabled={!!betting.currentSession}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="percentage" id="strategyPercentage" />
                <Label htmlFor="strategyPercentage">Percentuale sulla cassa</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="dalembert" id="strategyDalembert" />
                <Label htmlFor="strategyDalembert">D'Alembert</Label>
              </div>
              
              {/* Qui potrai aggiungere la scelta per il tuo metodo personalizzato */}
            </RadioGroup>
            
            {/* Strategy specific settings */}
            <div className="mt-4">

              
              {strategy === 'percentage' && (
                <div>
                  <Label htmlFor="bankrollPercentage" className="block mb-1">Percentuale della cassa (%)</Label>
                  <Input 
                    id="bankrollPercentage" 
                    type="number" 
                    value={bankrollPercentage}
                    min="0.5" 
                    max="10" 
                    step="0.5"
                    onChange={(e) => setBankrollPercentage(Number(e.target.value))}
                    disabled={!!betting.currentSession}
                  />
                </div>
              )}
              
              {strategy === 'dalembert' && (
                <div>
                  <Label htmlFor="dalembertUnit" className="block mb-1">Percentuale della cassa iniziale (%)</Label>
                  <Input 
                    id="dalembertUnit" 
                    type="number" 
                    value={dalembertUnit}
                    min="0.5" 
                    max="10" 
                    step="0.5"
                    onChange={(e) => setDalembertUnit(Number(e.target.value))}
                    disabled={!!betting.currentSession}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Unità di base: {formatCurrency(initialBankroll * (dalembertUnit / 100))}
                  </p>
                </div>
              )}
              
              {/* Qui potrai aggiungere le impostazioni per il tuo metodo personalizzato */}
            </div>
          </div>
          
          {/* Summary and Actions */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-base font-medium text-gray-800 mb-3">Riepilogo</h3>
            
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Cassa Attuale:</span>
                <span className="text-sm font-medium text-gray-800">
                  {betting.currentSession 
                    ? formatCurrency(betting.currentSession.currentBankroll)
                    : formatCurrency(initialBankroll)
                  }
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Obiettivo:</span>
                <span className="text-sm font-medium text-gray-800">
                  {formatCurrency(calculateTargetAmount())}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Scommesse effettuate:</span>
                <span className="text-sm font-medium text-gray-800">
                  {betting.currentSession ? betting.currentSession.betCount : 0}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Progresso:</span>
                <span className="text-sm font-medium text-gray-800">
                  {calculateProgress().toFixed(1)}%
                </span>
              </div>
            </div>
            
            {/* Progress bar */}
            <Progress value={calculateProgress()} className="h-4 mb-4" />
            
            <Button 
              onClick={handleStartSession}
              className="w-full bg-primary hover:bg-blue-800 text-white"
              disabled={betting.isCreatingSession || betting.currentSession !== null}
            >
              {betting.isCreatingSession ? 'Creazione...' : 'Inizia Sessione'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
