import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Shield, Clock, Lock, CheckCircle, AlertTriangle } from "lucide-react";

export default function DemoAccess() {
  const [demoCode, setDemoCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [demoData, setDemoData] = useState<any>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Get code from URL if present
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const codeFromUrl = urlParams.get('code');
    if (codeFromUrl) {
      setDemoCode(codeFromUrl);
      validateDemo(codeFromUrl);
    }
  }, []);

  const validateDemo = async (code?: string) => {
    const codeToValidate = code || demoCode;
    if (!codeToValidate.trim()) {
      toast({
        title: "Errore",
        description: "Inserisci un codice demo valido",
        variant: "destructive"
      });
      return;
    }

    setIsValidating(true);
    try {
      const response = await apiRequest("POST", "/api/validate-demo", { code: codeToValidate });
      const responseData = await response.json();
      
      setDemoData(responseData);
      
      // Store demo session
      sessionStorage.setItem('demoCode', codeToValidate);
      sessionStorage.setItem('demoData', JSON.stringify(responseData));
      
      toast({
        title: "Accesso Demo Autorizzato!",
        description: `Benvenuto nella demo ${responseData.demoType || 'completa'}`,
        variant: "default"
      });

      // Redirect to demo interface after 2 seconds
      setTimeout(() => {
        navigate('/demo-interface');
      }, 2000);

    } catch (error: any) {
      console.error('Demo validation error:', error);
      
      if (error.message.includes('410') || error.message.includes('scaduto')) {
        setIsExpired(true);
        toast({
          title: "Demo Scaduta",
          description: "Questo codice demo è scaduto. Contatta chi ti ha inviato l'invito.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Codice Non Valido",
          description: "Il codice demo inserito non è valido o è già stato utilizzato.",
          variant: "destructive"
        });
      }
    } finally {
      setIsValidating(false);
    }
  };

  const getDemoTypeInfo = (type: string) => {
    const types = {
      basic: {
        name: "Demo Base",
        icon: <Shield className="w-5 h-5" />,
        color: "bg-blue-100 text-blue-800",
        description: "Accesso alle funzioni principali con dati demo"
      },
      interactive: {
        name: "Demo Interattiva", 
        icon: <CheckCircle className="w-5 h-5" />,
        color: "bg-green-100 text-green-800",
        description: "Permette inserimento dati con calcoli semplificati"
      },
      showcase: {
        name: "Demo Showcase",
        icon: <Lock className="w-5 h-5" />,
        color: "bg-purple-100 text-purple-800",
        description: "Presenta tutte le funzionalità con protezione IP"
      }
    };
    return types[type as keyof typeof types] || types.basic;
  };

  const formatTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffMs = expiry.getTime() - now.getTime();
    
    if (diffMs <= 0) return "Scaduto";
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m rimanenti`;
    }
    return `${minutes}m rimanenti`;
  };

  if (demoData) {
    const typeInfo = getDemoTypeInfo(demoData.demoType);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-2xl">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-green-800">
              Accesso Autorizzato!
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="text-center">
              <Badge className={`${typeInfo.color} mb-3`}>
                {typeInfo.icon}
                <span className="ml-2">{typeInfo.name}</span>
              </Badge>
              <p className="text-gray-600">{typeInfo.description}</p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <Clock className="w-4 h-4 text-yellow-600 mr-2" />
                <span className="text-sm font-semibold text-yellow-800">
                  {formatTimeRemaining(demoData.expiresAt)}
                </span>
              </div>
              <p className="text-xs text-yellow-700">
                La demo si disattiverà automaticamente alla scadenza
              </p>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <AlertTriangle className="w-4 h-4 text-orange-600 mr-2" />
                <span className="text-sm font-semibold text-orange-800">
                  Versione Protetta
                </span>
              </div>
              <p className="text-xs text-orange-700">
                I calcoli sono semplificati per proteggere la proprietà intellettuale
              </p>
            </div>

            <Button 
              onClick={() => navigate('/demo-interface')}
              className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
              size="lg"
            >
              Accedi alla Demo
            </Button>

            <div className="text-center">
              <p className="text-xs text-gray-500">
                Reindirizzamento automatico in corso...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Lock className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800">
            Accesso Demo
          </CardTitle>
          <p className="text-gray-600">
            Inserisci il codice ricevuto via email per accedere alla demo
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="demoCode">Codice Demo</Label>
            <Input
              id="demoCode"
              type="text"
              value={demoCode}
              onChange={(e) => setDemoCode(e.target.value.toUpperCase())}
              placeholder="ABC12345"
              className="text-center text-lg font-mono tracking-wider"
              maxLength={8}
            />
          </div>

          {isExpired && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <AlertTriangle className="w-4 h-4 text-red-600 mr-2" />
                <span className="text-sm font-semibold text-red-800">
                  Demo Scaduta
                </span>
              </div>
              <p className="text-xs text-red-700">
                Questo codice è scaduto. Richiedi un nuovo invito.
              </p>
            </div>
          )}

          <Button 
            onClick={() => validateDemo()}
            disabled={isValidating || !demoCode.trim()}
            className="w-full"
            size="lg"
          >
            {isValidating ? 'Validazione...' : 'Accedi alla Demo'}
          </Button>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-2">Cosa include la demo:</h4>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• Interfaccia completa del software</li>
              <li>• Tutte le strategie di betting</li>
              <li>• Analytics e grafici interattivi</li>
              <li>• Calcoli semplificati per protezione IP</li>
            </ul>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              Non hai ricevuto il codice? Contatta chi ti ha inviato l'invito
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}