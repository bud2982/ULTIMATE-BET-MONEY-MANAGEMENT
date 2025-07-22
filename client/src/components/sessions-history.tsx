import { useState } from 'react';
import { SessionData, BettingStrategy } from '@/types/betting';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { formatCurrency, getStrategyDisplayName, calculateROI } from '@/lib/betting-strategies';
import { Eye, Trash2, Play, BarChart2, Filter } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SessionsHistoryProps {
  sessions: SessionData[];
  setCurrentSession: (session: SessionData) => void;
  deleteSession: (id: number) => void;
  loading: boolean;
}

export default function SessionsHistory({ 
  sessions, 
  setCurrentSession, 
  deleteSession,
  loading
}: SessionsHistoryProps) {
  const [sessionToDelete, setSessionToDelete] = useState<number | null>(null);
  
  const handleViewSession = (session: SessionData) => {
    setCurrentSession(session);
  };
  
  const handleDeleteClick = (id: number) => {
    setSessionToDelete(id);
  };
  
  const confirmDelete = () => {
    if (sessionToDelete !== null) {
      deleteSession(sessionToDelete);
      setSessionToDelete(null);
    }
  };
  
  const cancelDelete = () => {
    setSessionToDelete(null);
  };
  
  const formatDate = (dateString: Date) => {
    return new Date(dateString).toLocaleDateString('it-IT');
  };
  
  // Strategie disponibili  
  const [activeStrategy, setActiveStrategy] = useState<string>('all');
  
  // Filtra le sessioni in base alla strategia selezionata
  const filteredSessions = activeStrategy === 'all' 
    ? sessions 
    : sessions.filter(session => session.strategy === activeStrategy);
    
  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-xl font-montserrat font-semibold mb-4 text-primary">Sessioni Precedenti</h2>
        
        {/* Tabs per filtrare per strategia */}
        <Tabs defaultValue="all" className="mb-4" onValueChange={setActiveStrategy}>
          <TabsList className="grid grid-cols-5 mb-4">
            <TabsTrigger value="all" className="flex items-center gap-1">
              <Filter size={16} /> Tutte
            </TabsTrigger>
            <TabsTrigger value="flat" className="flex items-center gap-1">
              Flat
            </TabsTrigger>
            <TabsTrigger value="percentage" className="flex items-center gap-1">
              Percentuale
            </TabsTrigger>
            <TabsTrigger value="dalembert" className="flex items-center gap-1">
              D'Alembert
            </TabsTrigger>
            <TabsTrigger value="masaniello" className="flex items-center gap-1">
              Masaniello
            </TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Strategia</TableHead>
                <TableHead>Cassa Iniziale</TableHead>
                <TableHead>Cassa Finale</TableHead>
                <TableHead>P&L</TableHead>
                <TableHead>ROI</TableHead>
                <TableHead className="text-center">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">Caricamento sessioni...</TableCell>
                </TableRow>
              ) : filteredSessions.length > 0 ? (
                filteredSessions.map((session, index) => {
                  const roi = calculateROI(session.initialBankroll, session.currentBankroll);
                  const isPositive = roi >= 0;
                  
                  return (
                    <TableRow key={`session-${session.id}-${index}`}>
                      <TableCell className="whitespace-nowrap">
                        {session.createdAt ? formatDate(session.createdAt) : 'N/A'}
                      </TableCell>
                      <TableCell>{getStrategyDisplayName(session.strategy)}</TableCell>
                      <TableCell>{formatCurrency(session.initialBankroll)}</TableCell>
                      <TableCell>{formatCurrency(session.currentBankroll)}</TableCell>
                      <TableCell className={isPositive ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                        {isPositive ? '+' : ''}{formatCurrency(session.currentBankroll - session.initialBankroll)}
                      </TableCell>
                      <TableCell className={isPositive ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                        {isPositive ? '+' : ''}{roi.toFixed(2)}%
                      </TableCell>
                      <TableCell className="text-center">
                        <Button 
                          variant="ghost" 
                          className="text-blue-600 hover:text-blue-800 mr-2"
                          onClick={() => handleViewSession(session)}
                          size="sm"
                          title="Visualizza sessione"
                        >
                          <Eye size={16} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          className="text-red-600 hover:text-red-800"
                          onClick={() => handleDeleteClick(session.id!)}
                          size="sm"
                          title="Elimina sessione"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">
                    {activeStrategy === 'all' 
                      ? 'Nessuna sessione trovata. Crea una nuova sessione per iniziare.'
                      : `Nessuna sessione trovata per la strategia ${getStrategyDisplayName(activeStrategy as BettingStrategy)}.`}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        <AlertDialog open={sessionToDelete !== null} onOpenChange={cancelDelete}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Conferma eliminazione</AlertDialogTitle>
              <AlertDialogDescription>
                Sei sicuro di voler eliminare questa sessione? Questa azione è irreversibile.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annulla</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
                Elimina
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
