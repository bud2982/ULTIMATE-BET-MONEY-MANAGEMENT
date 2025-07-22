import { useState } from 'react';
import { BetData } from '@/types/betting';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Alert,
  AlertTitle,
  AlertDescription
} from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { 
  getStrategyDisplayName, 
  formatCurrency 
} from '@/lib/betting-strategies';
import { useToast } from '@/hooks/use-toast';

interface CurrentSessionProps {
  betting: any;
}

export default function CurrentSession({ betting }: CurrentSessionProps) {
  const { toast } = useToast();
  const [confirmingReset, setConfirmingReset] = useState(false);
  
  const handleWin = (e: React.MouseEvent) => {
    // Previene il comportamento predefinito del pulsante che potrebbe causare uno scroll
    e.preventDefault();
    
    // Salva la posizione di scroll attuale
    const scrollPosition = window.scrollY;
    
    // Esegue l'azione
    betting.placeBet(true);
    
    // Ripristina la posizione di scroll dopo un breve ritardo
    setTimeout(() => {
      window.scrollTo(0, scrollPosition);
    }, 100);
  };
  
  const handleLoss = (e: React.MouseEvent) => {
    // Previene il comportamento predefinito del pulsante che potrebbe causare uno scroll
    e.preventDefault();
    
    // Salva la posizione di scroll attuale
    const scrollPosition = window.scrollY;
    
    // Esegue l'azione
    betting.placeBet(false);
    
    // Ripristina la posizione di scroll dopo un breve ritardo
    setTimeout(() => {
      window.scrollTo(0, scrollPosition);
    }, 100);
  };
  
  const handleResetConfirm = () => {
    if (confirmingReset) {
      console.log("🔄 Confermato reset della sessione");
      
      // Mostra una notifica che il reset è in corso
      toast({
        title: "Reset in corso...",
        description: "Attendere mentre la sessione viene resettata.",
        variant: "default"
      });
      
      try {
        // Chiamata per resettare la sessione
        betting.resetSession();
        
        // Reset dello stato locale
        setConfirmingReset(false);
        
        // Mostra una notifica di successo
        toast({
          title: "Sessione resettata",
          description: "Tutti i dati della sessione sono stati reimpostati.",
          variant: "default",
          className: "bg-green-100 border-green-400 text-green-800"
        });
        
        // Se il reload non era sufficiente, forziamo un reload completo della pagina
        console.log("🔄 Forza ricaricamento della pagina tra 1 secondo");
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } catch (error) {
        console.error("Errore durante il reset:", error);
        
        // Mostra una notifica di errore
        toast({
          title: "Errore durante il reset",
          description: "Si è verificato un errore durante il reset della sessione. Ricarica la pagina e riprova.",
          variant: "destructive"
        });
      }
    } else {
      setConfirmingReset(true);
      setTimeout(() => setConfirmingReset(false), 3000); // Reset after 3 seconds
    }
  };
  
  // Calcola la variazione percentuale tra il bankroll iniziale e quello attuale
  const calculatePercentageChange = () => {
    if (!betting.currentSession) return 0;
    
    const { initialBankroll, currentBankroll } = betting.currentSession;
    if (initialBankroll === 0) return 0;
    
    return ((currentBankroll - initialBankroll) / initialBankroll) * 100;
  };
  
  // Ottieni la percentuale formattata con segno
  const getPercentageWithSign = () => {
    const percentage = calculatePercentageChange();
    return percentage >= 0 ? `+${percentage.toFixed(2)}%` : `${percentage.toFixed(2)}%`;
  };
  
  // Calcola quanto manca per raggiungere l'obiettivo
  const calculateTargetRemaining = () => {
    if (!betting.currentSession) return 0;
    
    const { initialBankroll, currentBankroll, targetReturn } = betting.currentSession;
    const targetAmount = initialBankroll * (1 + targetReturn / 100);
    return targetAmount - currentBankroll;
  };
  
  if (!betting.currentSession) {
    return null;
  }
  
  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-montserrat font-semibold text-primary">Sessione Corrente</h2>
          <Badge variant="outline" className="text-sm font-medium bg-gray-100 px-3 py-1">
            Strategia: <span className="text-primary ml-1">
              {getStrategyDisplayName(betting.currentSession.strategy)}
            </span>
          </Badge>
        </div>

        {/* Riepilogo Cassa */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white border rounded-lg p-4 shadow-sm">
            <h3 className="text-sm font-medium text-gray-600 mb-1">Cassa Iniziale</h3>
            <p className="text-lg font-bold text-gray-800">{formatCurrency(betting.currentSession.initialBankroll)}</p>
          </div>
          
          <div className="bg-white border rounded-lg p-4 shadow-sm">
            <h3 className="text-sm font-medium text-gray-600 mb-1">Cassa Attuale</h3>
            <div className="flex items-center">
              <p className="text-lg font-bold text-gray-800">{formatCurrency(betting.currentSession.currentBankroll)}</p>
              <span className={`ml-2 text-sm font-medium ${calculatePercentageChange() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {getPercentageWithSign()}
              </span>
            </div>
          </div>
          
          <div className="bg-white border rounded-lg p-4 shadow-sm">
            <h3 className="text-sm font-medium text-gray-600 mb-1">Obiettivo</h3>
            <p className="text-lg font-bold text-gray-800">
              {formatCurrency(betting.currentSession.initialBankroll * (1 + betting.currentSession.targetReturn / 100))}
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-primary h-2 rounded-full" 
                style={{ 
                  width: `${Math.min(100, (betting.currentSession.currentBankroll / (betting.currentSession.initialBankroll * (1 + betting.currentSession.targetReturn / 100))) * 100)}%`
                }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {calculateTargetRemaining() > 0 
                ? `Mancano ${formatCurrency(calculateTargetRemaining())} all'obiettivo` 
                : 'Obiettivo raggiunto!'}
            </p>
          </div>
        </div>
        
        {/* Bet list */}
        <div className="overflow-x-auto mb-4">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="w-[80px]">#</TableHead>
                <TableHead>Puntata (€)</TableHead>
                <TableHead>Quota</TableHead>
                <TableHead>Potenziale Vincita (€)</TableHead>
                <TableHead>Esito</TableHead>
                <TableHead>Cassa (€)</TableHead>
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
                    <TableCell>{bet.stake !== undefined ? bet.stake.toFixed(2) : '0.00'}</TableCell>
                    <TableCell>{bet.odds !== undefined ? bet.odds.toFixed(2) : '0.00'}</TableCell>
                    <TableCell>{bet.potentialWin !== undefined ? bet.potentialWin.toFixed(2) : '0.00'}</TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline"
                        className={bet.win 
                          ? "bg-green-100 text-green-800 hover:bg-green-100" 
                          : "bg-red-100 text-red-800 hover:bg-red-100"
                        }
                      >
                        {bet.win ? 'Vinta' : 'Persa'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{bet.bankrollAfter !== undefined ? bet.bankrollAfter.toFixed(2) : '0.00'}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    Nessuna scommessa registrata. Inizia aggiungendo una nuova scommessa.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Add new bet form */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-base font-medium text-gray-800 mb-3">Nuova Scommessa</h3>
          
          {/* Avviso Rischio - Generale */}
          {betting.nextStake > betting.currentSession.currentBankroll && (
            <Alert variant="warning" className="mb-4 border-2 border-yellow-500">
              <AlertTriangle className="h-5 w-5 text-yellow-700" />
              <AlertTitle className="text-yellow-800 font-bold">Attenzione! Rischio bankroll negativo</AlertTitle>
              <AlertDescription className="text-yellow-700">
                Questa puntata di {formatCurrency(betting.nextStake)} potrebbe portare il tuo bankroll in negativo se persa.
                <span className="block mt-1 font-medium">
                  Bankroll potenziale dopo perdita: {formatCurrency(betting.currentSession.currentBankroll - betting.nextStake)}
                </span>
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
            <div>
              <Label htmlFor="nextStake" className="mb-1">Puntata (€)</Label>
              <Input 
                id="nextStake" 
                type="text" 
                value={betting.nextStake !== undefined ? betting.nextStake.toFixed(2) : '0.00'}
                readOnly
                className={`bg-gray-100 ${betting.nextStake > betting.currentSession.currentBankroll ? 'border-yellow-500 focus:ring-yellow-500' : ''}`}
              />
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
              <Input 
                id="potentialWin" 
                type="text" 
                value={betting.potentialWin !== undefined ? betting.potentialWin.toFixed(2) : '0.00'}
                readOnly
                className="bg-gray-100"
              />
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
      </CardContent>
    </Card>
  );
}
