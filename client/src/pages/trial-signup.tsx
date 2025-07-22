import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, Gift, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function TrialSignup() {
  const [email, setEmail] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleStartTrial = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await apiRequest("POST", "/api/start-trial", {
        email,
        inviteCode: inviteCode || undefined
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Trial Attivato!",
          description: `Il tuo trial di 5 giorni è iniziato. Scade il ${new Date(data.expiresAt).toLocaleDateString('it-IT')}`
        });
        window.location.href = "/";
      } else {
        throw new Error("Errore nell'attivazione del trial");
      }
    } catch (error) {
      toast({
        title: "Errore",
        description: "Non è stato possibile attivare il trial. Riprova più tardi.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">BettingPro</h1>
            </div>
            <Button onClick={() => window.location.href = "/plans"} variant="outline">
              Vedi Piani Premium
            </Button>
          </div>
        </div>
      </header>

      <div className="py-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <Clock className="h-12 w-12 text-blue-600 mr-3" />
              <Gift className="h-12 w-12 text-green-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Prova Gratis per 5 Giorni
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Accesso completo a tutte le strategie premium di money management. 
              Nessuna carta di credito richiesta.
            </p>
          </div>

          {/* Trial Benefits */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <div className="text-center mb-6">
              <Badge className="bg-green-600 text-white mb-4 text-lg px-4 py-2">
                Trial Gratuito 5 Giorni
              </Badge>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Tutto Incluso, Completamente Gratis
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-3">
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span>Kelly Ridotto con slider rischio personalizzato</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span>D'Alembert, Masaniello, Multi-Masaniello</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span>Gestione Percentage e Profit Fall</span>
                  </li>
                </ul>
              </div>
              <div className="space-y-3">
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span>Calcolatore probabilità 1X2 e Poisson</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span>Dashboard analytics completo</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span>Accesso multi-dispositivo illimitato</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Signup Form */}
            <form onSubmit={handleStartTrial} className="space-y-6">
              <div>
                <Label htmlFor="email" className="text-sm font-medium">
                  Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Il tuo indirizzo email"
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="inviteCode" className="text-sm font-medium">
                  Codice Invito (Opzionale)
                </Label>
                <Input
                  id="inviteCode"
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="TRIAL2024"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Se hai un codice invito, inseriscilo per benefici extra
                </p>
              </div>

              <Button 
                type="submit"
                disabled={isLoading || !email}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-lg py-3"
                size="lg"
              >
                {isLoading ? "Attivazione..." : "Inizia Trial Gratuito"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Al termine del trial potrai scegliere un piano premium. 
                Nessun addebito automatico.
              </p>
            </div>
          </div>

          {/* FAQ */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h4 className="font-semibold text-lg mb-4">Domande Frequenti</h4>
            <div className="space-y-4 text-sm">
              <div>
                <p className="font-medium">È davvero gratuito?</p>
                <p className="text-gray-600">Sì, 5 giorni completi senza costi o carte di credito richieste.</p>
              </div>
              <div>
                <p className="font-medium">Cosa succede dopo 5 giorni?</p>
                <p className="text-gray-600">Il trial scade automaticamente. Potrai scegliere un piano premium per continuare.</p>
              </div>
              <div>
                <p className="font-medium">Posso usarlo su più dispositivi?</p>
                <p className="text-gray-600">Sì, accesso illimitato su tutti i tuoi dispositivi personali.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}