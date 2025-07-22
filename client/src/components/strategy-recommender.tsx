import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  BarChart, 
  AlertCircle,
  Zap,
  Target,
  Percent,
  Hash,
  ArrowUpDown 
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { SessionData, BetData, BettingStrategy } from '@/types/betting';
import { Badge } from '@/components/ui/badge';
import { getStrategyDisplayName } from '@/lib/betting-strategies';
import { recommendStrategies, StrategyRecommendation } from '@/lib/strategy-recommender';

interface StrategyRecommenderProps {
  sessions: SessionData[];
  allBets: Record<number, BetData[]>;
  currentStrategy?: BettingStrategy;
  onSelectStrategy: (strategy: BettingStrategy) => void;
}

export default function StrategyRecommender({ 
  sessions, 
  allBets, 
  currentStrategy, 
  onSelectStrategy 
}: StrategyRecommenderProps) {
  const [recommendations, setRecommendations] = useState<StrategyRecommendation[]>([]);
  const [showDetails, setShowDetails] = useState(false);
  
  // Genera le raccomandazioni quando cambiano le sessioni o le scommesse
  useEffect(() => {
    if (sessions.length > 0) {
      const strategyRecommendations = recommendStrategies(sessions, allBets);
      setRecommendations(strategyRecommendations);
    } else {
      setRecommendations([
        {
          strategy: 'flat',
          confidence: 0.7,
          reason: "Per iniziare, la strategia flat è la più sicura e semplice da gestire."
        }
      ]);
    }
  }, [sessions, allBets]);
  
  // Restituisce un'icona in base alla strategia
  const getStrategyIcon = (strategy: BettingStrategy) => {
    switch (strategy) {
      case 'flat':
        return <Hash className="w-5 h-5 mr-2" />;
      case 'percentage':
        return <Percent className="w-5 h-5 mr-2" />;
      case 'dalembert':
        return <ArrowUpDown className="w-5 h-5 mr-2" />;
      // Qui si può aggiungere il caso per il tuo metodo personalizzato
      default:
        return <BarChart className="w-5 h-5 mr-2" />;
    }
  };
  
  // Formatta il valore di confidenza in percentuale
  const formatConfidence = (confidence: number) => {
    return `${Math.round(confidence * 100)}%`;
  };
  
  // Determina il colore della progress bar in base al valore di confidenza
  const getProgressColor = (confidence: number) => {
    if (confidence > 0.7) return "bg-green-500";
    if (confidence > 0.5) return "bg-yellow-500";
    return "bg-red-500";
  };
  
  if (recommendations.length === 0) {
    return null;
  }
  
  // Raccomandazione principale (la più alta confidenza)
  const topRecommendation = recommendations[0];
  
  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl font-montserrat text-primary flex items-center">
              <Zap className="w-5 h-5 mr-2" /> Raccomandazione Strategia
            </CardTitle>
            <CardDescription>
              Analisi dei tuoi dati storici per suggerire la strategia ottimale
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? 'Nascondi dettagli' : 'Mostra dettagli'}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Top Recommendation */}
        <div className="bg-primary/5 p-4 rounded-lg mb-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center">
              {getStrategyIcon(topRecommendation.strategy)}
              <h3 className="text-lg font-semibold">
                {getStrategyDisplayName(topRecommendation.strategy)}
              </h3>
              {currentStrategy === topRecommendation.strategy && (
                <Badge variant="outline" className="ml-2 bg-green-100 text-green-800">
                  In uso
                </Badge>
              )}
            </div>
            <div className="text-sm font-medium text-right">
              Confidenza: <span className="text-primary">{formatConfidence(topRecommendation.confidence)}</span>
            </div>
          </div>
          
          <Progress 
            value={topRecommendation.confidence * 100} 
            className={`h-2 mb-3 ${getProgressColor(topRecommendation.confidence)}`} 
          />
          
          <p className="text-sm text-gray-600 mb-3">{topRecommendation.reason}</p>
          
          {currentStrategy !== topRecommendation.strategy && (
            <Button 
              onClick={() => onSelectStrategy(topRecommendation.strategy)}
              size="sm"
              className="flex items-center"
            >
              <TrendingUp className="w-4 h-4 mr-1" /> Usa questa strategia
            </Button>
          )}
        </div>
        
        {/* Other Recommendations (shown when details are expanded) */}
        {showDetails && recommendations.slice(1).map((rec, index) => (
          <div key={rec.strategy} className="border p-4 rounded-lg mb-3 last:mb-0">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center">
                {getStrategyIcon(rec.strategy)}
                <h3 className="text-md font-medium">
                  {getStrategyDisplayName(rec.strategy)}
                </h3>
                {currentStrategy === rec.strategy && (
                  <Badge variant="outline" className="ml-2 bg-green-100 text-green-800">
                    In uso
                  </Badge>
                )}
              </div>
              <div className="text-sm font-medium">
                Confidenza: <span>{formatConfidence(rec.confidence)}</span>
              </div>
            </div>
            
            <Progress 
              value={rec.confidence * 100} 
              className={`h-1.5 mb-2 ${getProgressColor(rec.confidence)}`} 
            />
            
            <p className="text-sm text-gray-600 mb-2">{rec.reason}</p>
            
            {currentStrategy !== rec.strategy && (
              <Button 
                onClick={() => onSelectStrategy(rec.strategy)}
                size="sm"
                variant="outline"
                className="flex items-center"
              >
                Usa questa strategia
              </Button>
            )}
          </div>
        ))}
      </CardContent>
      
      <CardFooter className="pt-0 pb-4">
        <div className="w-full text-xs text-gray-500 flex items-center">
          <AlertCircle className="w-3 h-3 mr-1" />
          Le raccomandazioni si basano sullo storico delle tue scommesse e vengono aggiornate automaticamente.
        </div>
      </CardFooter>
    </Card>
  );
}