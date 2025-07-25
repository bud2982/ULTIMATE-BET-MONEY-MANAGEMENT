import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useBeatDelaySessions, type BeatDelaySession, type CreateBeatDelaySessionData } from "@/hooks/use-beat-delay-sessions";
import { formatCurrency } from "@/lib/betting-strategies";
import { 
  Save, 
  FolderOpen, 
  Trash2, 
  Plus, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  BarChart3,
  Archive,
  Play,
  Pause,
  CheckCircle,
  AlertTriangle,
  Eye,
  Edit3
} from "lucide-react";

interface BeatDelaySessionsManagerProps {
  onSessionLoad?: (session: BeatDelaySession) => void;
  currentSessionData?: {
    sessionName: string;
    initialBankroll: number;
    baseStake: number;
    targetReturn: number;
    stopLoss: number;
    finalBankroll: number;
    totalBets: number;
    totalWins: number;
    totalLosses: number;
    profitLoss: number;
  };
}

export default function BeatDelaySessionsManager({ 
  onSessionLoad, 
  currentSessionData 
}: BeatDelaySessionsManagerProps) {
  const { toast } = useToast();
  const {
    sessions,
    selectedSession,
    sessionsLoading,
    isCreating,
    isDeleting,
    createSession,
    deleteSession,
    updateSession,
    loadSession,
    getSessionStats
  } = useBeatDelaySessions();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [viewingSession, setViewingSession] = useState<BeatDelaySession | null>(null);
  const [newSessionData, setNewSessionData] = useState<CreateBeatDelaySessionData>({
    sessionName: `Sessione Beat the Delay ${new Date().toLocaleDateString()}`,
    initialBankroll: 1000,
    baseStake: 10,
    targetReturn: 30,
    stopLoss: 6,
    notes: ""
  });

  const handleCreateSession = () => {
    if (!newSessionData.sessionName.trim()) {
      toast({
        title: "Errore",
        description: "Il nome della sessione è obbligatorio",
        variant: "destructive"
      });
      return;
    }

    createSession(newSessionData);
    setShowCreateDialog(false);
    setNewSessionData({
      sessionName: `Sessione Beat the Delay ${new Date().toLocaleDateString()}`,
      initialBankroll: 1000,
      baseStake: 10,
      targetReturn: 30,
      stopLoss: 6,
      notes: ""
    });
    
    toast({
      title: "Sessione creata",
      description: "La nuova sessione è stata creata con successo",
    });
  };

  const handleSaveCurrentSession = () => {
    if (!currentSessionData) {
      toast({
        title: "Errore",
        description: "Nessuna sessione attiva da salvare",
        variant: "destructive"
      });
      return;
    }

    const sessionToSave: CreateBeatDelaySessionData = {
      sessionName: currentSessionData.sessionName,
      initialBankroll: currentSessionData.initialBankroll,
      baseStake: currentSessionData.baseStake,
      targetReturn: currentSessionData.targetReturn,
      stopLoss: currentSessionData.stopLoss,
      notes: `Sessione salvata il ${new Date().toLocaleString()}`
    };

    createSession(sessionToSave);
    
    toast({
      title: "Sessione salvata",
      description: "La sessione corrente è stata salvata con successo",
    });
  };

  const handleLoadSession = (session: BeatDelaySession) => {
    loadSession(session);
    if (onSessionLoad) {
      onSessionLoad(session);
    }
    
    toast({
      title: "Sessione caricata",
      description: `Sessione "${session.sessionName}" caricata con successo`,
    });
  };

  const handleDeleteSession = (session: BeatDelaySession) => {
    if (window.confirm(`Sei sicuro di voler eliminare la sessione "${session.sessionName}"?`)) {
      deleteSession(session.id);
      
      toast({
        title: "Sessione eliminata",
        description: "La sessione è stata eliminata con successo",
      });
    }
  };

  const handleViewSession = (session: BeatDelaySession) => {
    setViewingSession(session);
    setShowViewDialog(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-500"><Play className="w-3 h-3 mr-1" />Attiva</Badge>;
      case 'completed':
        return <Badge variant="secondary"><CheckCircle className="w-3 h-3 mr-1" />Completata</Badge>;
      case 'archived':
        return <Badge variant="outline"><Archive className="w-3 h-3 mr-1" />Archiviata</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getProfitBadge = (profitLoss: number) => {
    if (profitLoss > 0) {
      return (
        <Badge variant="default" className="bg-green-500">
          <TrendingUp className="w-3 h-3 mr-1" />
          +{formatCurrency(profitLoss)}
        </Badge>
      );
    } else if (profitLoss < 0) {
      return (
        <Badge variant="destructive">
          <TrendingDown className="w-3 h-3 mr-1" />
          {formatCurrency(profitLoss)}
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline">
          <Target className="w-3 h-3 mr-1" />
          {formatCurrency(0)}
        </Badge>
      );
    }
  };

  if (sessionsLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Caricamento sessioni...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header con azioni */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <FolderOpen className="w-5 h-5 mr-2" />
              Gestione Sessioni Beat the Delay
            </span>
            <div className="flex space-x-2">
              {currentSessionData && (
                <Button onClick={handleSaveCurrentSession} size="sm">
                  <Save className="w-4 h-4 mr-2" />
                  Salva Corrente
                </Button>
              )}
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Nuova Sessione
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Crea Nuova Sessione</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="sessionName">Nome Sessione</Label>
                      <Input
                        id="sessionName"
                        value={newSessionData.sessionName}
                        onChange={(e) => setNewSessionData(prev => ({ ...prev, sessionName: e.target.value }))}
                        placeholder="Nome della sessione"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="initialBankroll">Bankroll Iniziale (€)</Label>
                        <Input
                          id="initialBankroll"
                          type="number"
                          value={newSessionData.initialBankroll}
                          onChange={(e) => setNewSessionData(prev => ({ ...prev, initialBankroll: Number(e.target.value) }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="baseStake">Puntata Base (€)</Label>
                        <Input
                          id="baseStake"
                          type="number"
                          value={newSessionData.baseStake}
                          onChange={(e) => setNewSessionData(prev => ({ ...prev, baseStake: Number(e.target.value) }))}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="targetReturn">Target Return (%)</Label>
                        <Input
                          id="targetReturn"
                          type="number"
                          value={newSessionData.targetReturn}
                          onChange={(e) => setNewSessionData(prev => ({ ...prev, targetReturn: Number(e.target.value) }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="stopLoss">Stop Loss</Label>
                        <Input
                          id="stopLoss"
                          type="number"
                          value={newSessionData.stopLoss}
                          onChange={(e) => setNewSessionData(prev => ({ ...prev, stopLoss: Number(e.target.value) }))}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="notes">Note (opzionale)</Label>
                      <Textarea
                        id="notes"
                        value={newSessionData.notes}
                        onChange={(e) => setNewSessionData(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Note sulla sessione..."
                        rows={3}
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                        Annulla
                      </Button>
                      <Button onClick={handleCreateSession} disabled={isCreating}>
                        {isCreating ? "Creazione..." : "Crea Sessione"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Nessuna sessione salvata. Crea una nuova sessione per iniziare.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Bankroll</TableHead>
                    <TableHead>Scommesse</TableHead>
                    <TableHead>Win Rate</TableHead>
                    <TableHead>Profitto/Perdita</TableHead>
                    <TableHead>ROI</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell className="font-medium">{session.sessionName}</TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="w-4 h-4 mr-1" />
                          {session.createdAt.toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{formatCurrency(session.initialBankroll)} → {formatCurrency(session.finalBankroll)}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{session.totalBets} totali</div>
                          <div className="text-xs text-gray-500">
                            {session.totalWins}W / {session.totalLosses}L
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={session.winRate >= 50 ? "default" : "secondary"}>
                          {session.winRate.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getProfitBadge(session.profitLoss)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={session.roi >= 0 ? "default" : "destructive"}>
                          {session.roi.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(session.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewSession(session)}
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleLoadSession(session)}
                          >
                            <Play className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteSession(session)}
                            disabled={isDeleting}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog per visualizzare dettagli sessione */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Dettagli Sessione: {viewingSession?.sessionName}</DialogTitle>
          </DialogHeader>
          {viewingSession && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Configurazione</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Bankroll Iniziale:</span>
                      <span className="font-medium">{formatCurrency(viewingSession.initialBankroll)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Puntata Base:</span>
                      <span className="font-medium">{formatCurrency(viewingSession.baseStake)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Target Return:</span>
                      <span className="font-medium">{viewingSession.targetReturn}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Stop Loss:</span>
                      <span className="font-medium">{viewingSession.stopLoss}</span>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Risultati</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Bankroll Finale:</span>
                      <span className="font-medium">{formatCurrency(viewingSession.finalBankroll)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Profitto/Perdita:</span>
                      <span className={`font-medium ${viewingSession.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(viewingSession.profitLoss)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">ROI:</span>
                      <span className={`font-medium ${viewingSession.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {viewingSession.roi.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Win Rate:</span>
                      <span className="font-medium">{viewingSession.winRate.toFixed(1)}%</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Statistiche Scommesse</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold">{viewingSession.totalBets}</div>
                      <div className="text-sm text-gray-500">Totali</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">{viewingSession.totalWins}</div>
                      <div className="text-sm text-gray-500">Vincenti</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-red-600">{viewingSession.totalLosses}</div>
                      <div className="text-sm text-gray-500">Perdenti</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {viewingSession.notes && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Note</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-700">{viewingSession.notes}</p>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowViewDialog(false)}>
                  Chiudi
                </Button>
                <Button onClick={() => {
                  handleLoadSession(viewingSession);
                  setShowViewDialog(false);
                }}>
                  <Play className="w-4 h-4 mr-2" />
                  Carica Sessione
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}