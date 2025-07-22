import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Copy, Plus, Users, Calendar, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface InviteCode {
  id: number;
  code: string;
  uses: number;
  maxUses: number;
  expiresAt: string;
  createdAt: string;
  active: boolean;
}

export default function InviteManager() {
  const [maxUses, setMaxUses] = useState(10);
  const [expiryDays, setExpiryDays] = useState(30);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: inviteCodes = [], isLoading } = useQuery<InviteCode[]>({
    queryKey: ["/api/invite-codes"],
    retry: false,
  });

  const createInviteMutation = useMutation({
    mutationFn: async (data: { maxUses: number; expiryDays: number }) => {
      return apiRequest("POST", "/api/invite-codes", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invite-codes"] });
      toast({
        title: "Codice Creato!",
        description: "Il nuovo codice invito è stato generato con successo."
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Non è stato possibile creare il codice invito.",
        variant: "destructive"
      });
    }
  });

  const handleCreateInvite = () => {
    createInviteMutation.mutate({ maxUses, expiryDays });
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Copiato!",
      description: `Codice ${code} copiato negli appunti.`
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestione Codici Invito</h1>
          <p className="text-gray-600">
            Genera codici invito per far provare gratuitamente BettingPro ai tuoi amici
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Create New Invite */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Plus className="h-5 w-5 mr-2" />
                Nuovo Codice Invito
              </CardTitle>
              <CardDescription>
                Crea un nuovo codice per i tuoi amici
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="maxUses">Numero massimo utilizzi</Label>
                <Input
                  id="maxUses"
                  type="number"
                  value={maxUses}
                  onChange={(e) => setMaxUses(parseInt(e.target.value))}
                  min="1"
                  max="100"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="expiryDays">Scadenza (giorni)</Label>
                <Input
                  id="expiryDays"
                  type="number"
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(parseInt(e.target.value))}
                  min="1"
                  max="365"
                  className="mt-1"
                />
              </div>

              <Button 
                onClick={handleCreateInvite}
                disabled={createInviteMutation.isPending}
                className="w-full"
              >
                {createInviteMutation.isPending ? "Creazione..." : "Genera Codice"}
              </Button>
            </CardContent>
          </Card>

          {/* Invite Codes List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  I Tuoi Codici Invito
                </CardTitle>
                <CardDescription>
                  Gestisci e condividi i codici invito attivi
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-20 bg-gray-200 rounded animate-pulse" />
                    ))}
                  </div>
                ) : inviteCodes.length > 0 ? (
                  <div className="space-y-4">
                    {inviteCodes.map((invite: InviteCode) => (
                      <div key={invite.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <code className="bg-blue-100 text-blue-800 px-3 py-1 rounded font-mono font-bold">
                              {invite.code}
                            </code>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(invite.code)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                          <Badge variant={invite.active ? "default" : "secondary"}>
                            {invite.active ? "Attivo" : "Scaduto"}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center space-x-6 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {invite.uses}/{invite.maxUses} utilizzi
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            Scade: {formatDate(invite.expiresAt)}
                          </div>
                        </div>
                        
                        {invite.uses >= invite.maxUses && (
                          <div className="mt-2 flex items-center text-sm text-green-600">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Codice esaurito
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Nessun codice invito creato</p>
                    <p className="text-sm text-gray-400">Crea il tuo primo codice per iniziare</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Instructions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Come Funziona</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-600 font-bold">1</span>
                </div>
                <h4 className="font-semibold mb-2">Genera Codice</h4>
                <p className="text-sm text-gray-600">
                  Crea un nuovo codice invito personalizzato con limiti di utilizzo
                </p>
              </div>
              <div className="text-center">
                <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <span className="text-green-600 font-bold">2</span>
                </div>
                <h4 className="font-semibold mb-2">Condividi</h4>
                <p className="text-sm text-gray-600">
                  Invia il codice ai tuoi amici insieme al link della pagina trial
                </p>
              </div>
              <div className="text-center">
                <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <span className="text-purple-600 font-bold">3</span>
                </div>
                <h4 className="font-semibold mb-2">Trial Esteso</h4>
                <p className="text-sm text-gray-600">
                  Chi usa il tuo codice ottiene 5 giorni di trial gratuito completo
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}