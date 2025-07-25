import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useBeatDelaySessions, type CreateBeatDelaySessionData, type CreateBeatDelayBetData } from "@/hooks/use-beat-delay-sessions";
import BeatDelaySessionsManager from "@/components/beat-delay-sessions-manager";
import { formatCurrency } from "@/lib/betting-strategies";
import { ArrowLeft, TestTube, Play, Plus } from "lucide-react";
import { useLocation } from "wouter";

export default function TestBeatDelaySessions() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const beatDelaySessions = useBeatDelaySessions();
  const [testingInProgress, setTestingInProgress] = useState(false);

  const createTestSession = async () => {
    setTestingInProgress(true);
    
    try {
      const testSessionData: CreateBeatDelaySessionData = {
        sessionName: `Test Session ${new Date().toLocaleTimeString()}`,
        initialBankroll: 1000,
        baseStake: 10,
        targetReturn: 30,
        stopLoss: 6,
        notes: "Sessione di test per verificare il funzionamento del sistema Beat the Delay"
      };

      beatDelaySessions.createSession(testSessionData);
      
      toast({
        title: "Sessione di test creata",
        description: "La sessione di test è stata creata con successo",
      });
    } catch (error) {
      toast({
        title: "Errore",
        description: "Errore nella creazione della sessione di test",
        variant: "destructive"
      });
    } finally {
      setTestingInProgress(false);
    }
  };

  const addTestBets = async () => {
    if (!beatDelaySessions.selectedSession) {
      toast({
        title: "Errore",
        description: "Seleziona prima una sessione",
        variant: "destructive"
      });
      return;
    }

    setTestingInProgress(true);

    try {
      // Aggiungi alcune scommesse di test
      const testBets: CreateBeatDelayBetData[] = [
        {
          betNumber: 1,
          stake: 10,
          odds: 2.5,
          potentialWin: 25,
          win: true,
          bankrollBefore: 1000,
          bankrollAfter: 1015,
          currentSign: 'X',
          currentDelay: 8,
          historicalFrequency: 35,
          avgDelay: 11,
          maxDelay: 18,
          captureRate: 75,
          estimatedProbability: 0.45,
          expectedValue: 0.125,
          shouldPlay: true,
          anomalyIndex: 0.3,
          recoveryRate: 0.15,
          mlProbability: 0.52,
          mlConfidence: 0.78,
          combinedProbability: 0.485,
          combinedEV: 0.138,
        },
        {
          betNumber: 2,
          stake: 10,
          odds: 1.8,
          potentialWin: 18,
          win: false,
          bankrollBefore: 1015,
          bankrollAfter: 1005,
          currentSign: '1',
          currentDelay: 12,
          historicalFrequency: 42,
          avgDelay: 9,
          maxDelay: 15,
          captureRate: 75,
          estimatedProbability: 0.58,
          expectedValue: 0.064,
          shouldPlay: true,
          anomalyIndex: 0.6,
          recoveryRate: 0.08,
          mlProbability: 0.61,
          mlConfidence: 0.82,
          combinedProbability: 0.595,
          combinedEV: 0.076,
        },
        {
          betNumber: 3,
          stake: 20, // D'Alembert progression
          odds: 2.1,
          potentialWin: 42,
          win: true,
          bankrollBefore: 1005,
          bankrollAfter: 1027,
          currentSign: '2',
          currentDelay: 5,
          historicalFrequency: 38,
          avgDelay: 8,
          maxDelay: 12,
          captureRate: 75,
          estimatedProbability: 0.41,
          expectedValue: 0.051,
          shouldPlay: true,
          anomalyIndex: 0.1,
          recoveryRate: 0.22,
          mlProbability: 0.44,
          mlConfidence: 0.65,
          combinedProbability: 0.425,
          combinedEV: 0.068,
        }
      ];

      for (const bet of testBets) {
        await new Promise(resolve => setTimeout(resolve, 500)); // Delay per simulare scommesse reali
        beatDelaySessions.addBet(beatDelaySessions.selectedSession.id, bet);
      }

      toast({
        title: "Scommesse di test aggiunte",
        description: "Le scommesse di test sono state aggiunte con successo",
      });
    } catch (error) {
      toast({
        title: "Errore",
        description: "Errore nell'aggiunta delle scommesse di test",
        variant: "destructive"
      });
    } finally {
      setTestingInProgress(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/")}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Indietro
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  <TestTube className="h-6 w-6 mr-2 text-purple-600" />
                  Test Beat the Delay Sessions
                </h1>
                <p className="text-sm text-gray-500">
                  Pagina di test per verificare il funzionamento del sistema di sessioni
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Controlli di test */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TestTube className="w-5 h-5 mr-2" />
                Controlli di Test
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-4">
                <Button 
                  onClick={createTestSession}
                  disabled={testingInProgress || beatDelaySessions.isCreating}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Crea Sessione Test
                </Button>
                
                <Button 
                  onClick={addTestBets}
                  disabled={testingInProgress || beatDelaySessions.isAddingBet || !beatDelaySessions.selectedSession}
                  variant="outline"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Aggiungi Scommesse Test
                </Button>
              </div>
              
              {beatDelaySessions.selectedSession && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-medium text-blue-900">Sessione Selezionata:</h3>
                  <p className="text-blue-700">{beatDelaySessions.selectedSession.sessionName}</p>
                  <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                    <div>
                      <span className="text-blue-600">Bankroll: </span>
                      <span className="font-medium">{formatCurrency(beatDelaySessions.selectedSession.finalBankroll)}</span>
                    </div>
                    <div>
                      <span className="text-blue-600">Scommesse: </span>
                      <span className="font-medium">{beatDelaySessions.selectedSession.totalBets}</span>
                    </div>
                    <div>
                      <span className="text-blue-600">Win Rate: </span>
                      <span className="font-medium">{beatDelaySessions.selectedSession.winRate.toFixed(1)}%</span>
                    </div>
                    <div>
                      <span className="text-blue-600">ROI: </span>
                      <span className={`font-medium ${beatDelaySessions.selectedSession.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {beatDelaySessions.selectedSession.roi.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stati di caricamento */}
          {(beatDelaySessions.sessionsLoading || beatDelaySessions.betsLoading) && (
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Caricamento...</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Errori */}
          {(beatDelaySessions.sessionsError || beatDelaySessions.createError || beatDelaySessions.addBetError) && (
            <Card className="border-red-200">
              <CardContent className="p-6">
                <div className="text-red-600">
                  <h3 className="font-medium">Errori rilevati:</h3>
                  <ul className="mt-2 space-y-1 text-sm">
                    {beatDelaySessions.sessionsError && (
                      <li>• Errore caricamento sessioni: {beatDelaySessions.sessionsError.message}</li>
                    )}
                    {beatDelaySessions.createError && (
                      <li>• Errore creazione sessione: {beatDelaySessions.createError.message}</li>
                    )}
                    {beatDelaySessions.addBetError && (
                      <li>• Errore aggiunta scommessa: {beatDelaySessions.addBetError.message}</li>
                    )}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Componente principale */}
          <BeatDelaySessionsManager 
            onSessionLoad={(session) => {
              toast({
                title: "Sessione caricata",
                description: `Sessione "${session.sessionName}" caricata per il test`,
              });
            }}
            currentSessionData={null}
          />

          {/* Dettagli scommesse della sessione selezionata */}
          {beatDelaySessions.selectedSession && beatDelaySessions.sessionBets.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Scommesse della Sessione</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {beatDelaySessions.sessionBets.map((bet) => (
                    <div key={bet.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <div>
                        <span className="font-medium">Bet #{bet.betNumber}</span>
                        <span className="ml-2 text-sm text-gray-600">
                          {bet.currentSign} - Delay: {bet.currentDelay}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className={`font-medium ${bet.win ? 'text-green-600' : 'text-red-600'}`}>
                          {bet.win ? 'WIN' : 'LOSS'}
                        </div>
                        <div className="text-sm text-gray-600">
                          {formatCurrency(bet.stake)} @ {bet.odds}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}