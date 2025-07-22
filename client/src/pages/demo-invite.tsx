import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Mail, Clock, Users, Shield, Eye, EyeOff, Star, AlertTriangle, Zap } from "lucide-react";

export default function DemoInvite() {
  const [email, setEmail] = useState("");
  const [demoType, setDemoType] = useState("basic");
  const [duration, setDuration] = useState(24);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [invitesList, setInvitesList] = useState<any[]>([]);
  const [showInvitesList, setShowInvitesList] = useState(false);
  const { toast } = useToast();

  const demoTypes = {
    basic: {
      name: "Demo Base",
      description: "Interfaccia e funzioni principali senza formule sensibili",
      features: ["Interfaccia completa", "Dati demo preimpostati", "Navigazione limitata"],
      color: "bg-blue-100 text-blue-800"
    },
    interactive: {
      name: "Demo Interattiva",
      description: "Permette inserimento dati ma con calcoli semplificati",
      features: ["Input personalizzati", "Grafici demo", "Risultati approssimativi"],
      color: "bg-green-100 text-green-800"
    },
    showcase: {
      name: "Demo Showcase",
      description: "Presenta tutte le funzionalità con dati pre-configurati",
      features: ["Tutte le strategie visibili", "Analytics complete", "Export limitato"],
      color: "bg-purple-100 text-purple-800"
    },
    full: {
      name: "Demo Completa",
      description: "Tutte le funzioni senza restrizioni, algoritmi nascosti e inaccessibili",
      features: ["Funzioni complete illimitate", "Tutte le strategie reali", "Codici sempre protetti", "Sessioni illimitate"],
      color: "bg-yellow-100 text-yellow-800"
    }
  };

  const handleCreateDemo = async () => {
    if (!email.trim()) {
      toast({
        title: "Errore",
        description: "Inserisci un'email valida",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/create-demo-invite", {
        email,
        demoType,
        duration,
        features: demoTypes[demoType as keyof typeof demoTypes].features
      });

      const data = await response.json();
      setGeneratedCode(data.inviteCode);
      setEmailSent(data.emailSent || false);
      
      // Aggiorna la lista locale degli inviti
      const newInvite = {
        code: data.inviteCode,
        email,
        demoType,
        duration,
        createdAt: new Date(),
        emailSent: data.emailSent || false
      };
      setInvitesList(prev => [newInvite, ...prev]);
      
      toast({
        title: "Invito Demo Creato!",
        description: data.emailSent 
          ? `Email inviata a ${email}` 
          : `Codice generato: ${data.inviteCode}`,
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile creare l'invito demo",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4">
      <div className="container mx-auto max-w-4xl py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Sistema Demo Protetto
          </h1>
          <p className="text-gray-600">
            Crea inviti demo sicuri per far provare il software senza esporre codici sensibili
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Creazione Demo */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="w-5 h-5 mr-2" />
                Crea Invito Demo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email del tuo amico</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="amico@email.com"
                  className="w-full"
                />
              </div>

              <div className="space-y-3">
                <Label>Tipo di Demo</Label>
                {Object.entries(demoTypes).map(([key, demo]) => (
                  <div
                    key={key}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      demoType === key 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setDemoType(key)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{demo.name}</h4>
                      <Badge className={demo.color}>{key}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{demo.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {demo.features.map((feature, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Durata (ore)</Label>
                <div className="flex gap-2">
                  {[6, 12, 24, 48].map((hours) => (
                    <Button
                      key={hours}
                      variant={duration === hours ? "default" : "outline"}
                      size="sm"
                      onClick={() => setDuration(hours)}
                    >
                      {hours}h
                    </Button>
                  ))}
                </div>
              </div>

              <Button 
                onClick={handleCreateDemo}
                disabled={isLoading}
                className="w-full"
                size="lg"
              >
                {isLoading ? 'Creazione...' : 'Crea Demo Sicura'}
              </Button>

              {generatedCode && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-2">Demo Creata!</h4>
                  <p className="text-sm text-green-700 mb-2">
                    Codice: <code className="bg-white px-2 py-1 rounded font-mono text-lg">{generatedCode}</code>
                  </p>
                  <p className="text-xs text-green-600 mb-2">
                    L'invito scadrà tra {duration} ore
                  </p>
                  
                  {emailSent ? (
                    <div className="mt-2 p-2 bg-green-100 border border-green-300 rounded">
                      <p className="text-sm text-green-800">
                        ✓ Email inviata con successo a {email}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                        <p className="text-sm text-yellow-800 font-medium mb-2">
                          Email non configurata - Usa il codice manualmente
                        </p>
                        <p className="text-xs text-yellow-700">
                          Invia questo link al destinatario: 
                        </p>
                        <div className="mt-1 p-2 bg-white rounded border">
                          <code className="text-xs break-all">
                            {window.location.origin}/demo/{generatedCode}
                          </code>
                        </div>
                      </div>
                      
                      <Button
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/demo/${generatedCode}`);
                          toast({
                            title: "Link copiato!",
                            description: "Il link demo è stato copiato negli appunti"
                          });
                        }}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        Copia Link Demo
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Lista Inviti Creati */}
          {invitesList.length > 0 && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Clock className="w-5 h-5 mr-2" />
                    Inviti Demo Creati
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowInvitesList(!showInvitesList)}
                  >
                    {showInvitesList ? 'Nascondi' : 'Mostra'} ({invitesList.length})
                  </Button>
                </CardTitle>
              </CardHeader>
              {showInvitesList && (
                <CardContent>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {invitesList.map((invite, index) => (
                      <div key={index} className="p-3 border rounded-lg bg-gray-50">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium text-sm">{invite.email}</p>
                            <p className="text-xs text-gray-600">
                              {demoTypes[invite.demoType as keyof typeof demoTypes].name} - {invite.duration}h
                            </p>
                          </div>
                          <Badge variant={invite.emailSent ? "default" : "secondary"}>
                            {invite.emailSent ? "Email inviata" : "Solo codice"}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <code className="text-xs bg-white px-2 py-1 rounded border">
                            {invite.code}
                          </code>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText(`${window.location.origin}/demo/${invite.code}`);
                              toast({
                                title: "Link copiato!",
                                description: "Link demo copiato negli appunti"
                              });
                            }}
                          >
                            Copia Link
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          )}

          {/* Stato Sistema Email */}
          <Card className="shadow-lg border-orange-200">
            <CardHeader>
              <CardTitle className="flex items-center text-orange-800">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Configurazione Email
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <h4 className="font-semibold text-orange-800 mb-2">Sistema Temporaneo Attivo</h4>
                <p className="text-sm text-orange-700 mb-3">
                  Gli inviti demo vengono creati correttamente ma le email non vengono inviate automaticamente. 
                  I codici e link sono disponibili per condivisione manuale.
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-orange-700">
                    <div className="w-2 h-2 bg-orange-400 rounded-full mr-2"></div>
                    Generazione codici: Funzionante
                  </div>
                  <div className="flex items-center text-orange-700">
                    <div className="w-2 h-2 bg-red-400 rounded-full mr-2"></div>
                    Invio email: Richiede configurazione SendGrid
                  </div>
                  <div className="flex items-center text-orange-700">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                    Link diretti: Disponibili per copia
                  </div>
                </div>
              </div>
              
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-blue-800">
                    <strong>Come testare ora:</strong> Usa il test rapido o crea un invito personalizzato
                  </p>
                  <Button
                    onClick={async () => {
                      setIsLoading(true);
                      try {
                        const testEmail = `test-${Date.now()}@example.com`;
                        const response = await apiRequest("POST", "/api/create-demo-invite", {
                          email: testEmail,
                          demoType: "full",
                          duration: 24,
                          features: demoTypes.full.features
                        });
                        
                        const data = await response.json();
                        const testInvite = {
                          code: data.inviteCode,
                          email: testEmail,
                          demoType: "full",
                          duration: 24,
                          createdAt: new Date(),
                          emailSent: false
                        };
                        setInvitesList(prev => [testInvite, ...prev]);
                        
                        // Apri automaticamente il link demo
                        window.open(`/demo/${data.inviteCode}`, '_blank');
                        
                        toast({
                          title: "Test Demo Creato!",
                          description: "Demo Completa aperta in nuova scheda",
                        });
                      } catch (error) {
                        toast({
                          title: "Errore Test",
                          description: "Impossibile creare test demo",
                          variant: "destructive"
                        });
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                    disabled={isLoading}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Zap className="w-4 h-4 mr-1" />
                    Test Rapido
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Caratteristiche Protezione */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Protezione Codici
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center p-3 bg-green-50 rounded-lg">
                  <Shield className="w-5 h-5 text-green-600 mr-3" />
                  <div>
                    <h4 className="font-semibold text-green-800">Formule Protette</h4>
                    <p className="text-sm text-green-700">
                      Tutti i calcoli sensibili sono sostituiti con approssimazioni
                    </p>
                  </div>
                </div>

                <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                  <Clock className="w-5 h-5 text-blue-600 mr-3" />
                  <div>
                    <h4 className="font-semibold text-blue-800">Accesso Limitato</h4>
                    <p className="text-sm text-blue-700">
                      La demo scade automaticamente dopo il tempo stabilito
                    </p>
                  </div>
                </div>

                <div className="flex items-center p-3 bg-purple-50 rounded-lg">
                  <Users className="w-5 h-5 text-purple-600 mr-3" />
                  <div>
                    <h4 className="font-semibold text-purple-800">Dati Isolati</h4>
                    <p className="text-sm text-purple-700">
                      I dati demo non interferiscono con il sistema principale
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full"
                >
                  {showAdvanced ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                  {showAdvanced ? 'Nascondi' : 'Mostra'} Dettagli Tecnici
                </Button>

                {showAdvanced && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg text-sm">
                    <h5 className="font-semibold mb-2">Protezioni Implementate:</h5>
                    <ul className="space-y-1 text-gray-700">
                      <li>• Algoritmi semplificati per Beat the Delay</li>
                      <li>• Coefficienti Kelly sostituiti con valori fissi</li>
                      <li>• Profit Fall con logica approssimativa</li>
                      <li>• ML predittivo disabilitato</li>
                      <li>• Export limitato a dati non sensibili</li>
                      <li>• Codice sorgente oscurato nel browser</li>
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Link accesso demo */}
        <Card className="mt-8 shadow-lg">
          <CardHeader>
            <CardTitle>Come Funziona</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4">
                <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-600 font-bold">1</span>
                </div>
                <h4 className="font-semibold mb-2">Crea Invito</h4>
                <p className="text-sm text-gray-600">
                  Inserisci l'email e scegli il tipo di demo più adatto
                </p>
              </div>
              <div className="text-center p-4">
                <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <span className="text-green-600 font-bold">2</span>
                </div>
                <h4 className="font-semibold mb-2">Invio Automatico</h4>
                <p className="text-sm text-gray-600">
                  Il tuo amico riceve il link e il codice di accesso via email
                </p>
              </div>
              <div className="text-center p-4">
                <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <span className="text-purple-600 font-bold">3</span>
                </div>
                <h4 className="font-semibold mb-2">Accesso Sicuro</h4>
                <p className="text-sm text-gray-600">
                  Prova tutte le funzioni senza accesso ai codici reali
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}