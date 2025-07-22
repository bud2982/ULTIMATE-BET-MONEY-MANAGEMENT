import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Crown, TrendingUp } from "lucide-react";

export default function PremiumUpgrade() {
  const handleViewPlans = () => {
    window.location.href = "/plans";
  };

  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl mx-auto shadow-xl border-2 border-blue-200">
        <CardHeader className="text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
          <div className="flex items-center justify-center mb-4">
            <Crown className="h-10 w-10 mr-3" />
            <CardTitle className="text-3xl">Abbonamento Premium Richiesto</CardTitle>
          </div>
          <CardDescription className="text-blue-100 text-lg">
            Accedi a tutte le strategie avanzate di money management
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <Badge variant="secondary" className="mb-4 text-lg px-4 py-2">
              Tutte le Funzionalità Premium
            </Badge>
            <p className="text-gray-600 text-lg">
              Sblocca il potenziale completo della piattaforma con strategie algoritmiche avanzate 
              e strumenti di analisi professionale.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-3">
              <h4 className="font-semibold text-lg flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                Strategie Avanzate
              </h4>
              <ul className="space-y-2">
                <li className="flex items-center text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Kelly Ridotto con slider rischio personalizzato
                </li>
                <li className="flex items-center text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  D'Alembert, Masaniello, Multi-Masaniello
                </li>
                <li className="flex items-center text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Gestione Percentage e Profit Fall
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-lg flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
                Strumenti Premium
              </h4>
              <ul className="space-y-2">
                <li className="flex items-center text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Calcolatore probabilità 1X2 e Poisson
                </li>
                <li className="flex items-center text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Dashboard analytics completo
                </li>
                <li className="flex items-center text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Sistema badge e achievement
                </li>
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {/* Piano Mensile */}
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 text-center">
              <div className="text-2xl font-bold text-blue-600 mb-2">€9.99</div>
              <p className="text-blue-800 font-medium mb-1">Mensile</p>
              <p className="text-xs text-blue-600">Cancella quando vuoi</p>
            </div>
            
            {/* Piano Semestrale */}
            <div className="bg-green-50 p-6 rounded-lg border border-green-200 text-center relative">
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-green-600 text-white">RISPARMIO 33%</Badge>
              </div>
              <div className="text-2xl font-bold text-green-600 mb-2">€40</div>
              <p className="text-green-800 font-medium mb-1">6 Mesi</p>
              <p className="text-xs text-green-600">€6.67/mese</p>
            </div>
            
            {/* Piano Lifetime */}
            <div className="bg-purple-50 p-6 rounded-lg border border-purple-200 text-center relative">
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-purple-600 text-white">MIGLIORE OFFERTA</Badge>
              </div>
              <div className="text-2xl font-bold text-purple-600 mb-2">€24</div>
              <p className="text-purple-800 font-medium mb-1">A Vita</p>
              <p className="text-xs text-purple-600">Pagamento unico</p>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border mb-6">
            <div className="flex items-center justify-center mb-2">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              <span className="font-semibold text-gray-800">Accesso Multi-Dispositivo Incluso</span>
            </div>
            <p className="text-sm text-gray-600 text-center">
              Usa l'app su tutti i tuoi dispositivi personali: computer, tablet, smartphone
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button 
              onClick={() => window.location.href = "/trial"}
              className="w-full bg-green-600 hover:bg-green-700 text-white text-lg py-4 font-semibold"
              size="lg"
            >
              Prova Gratis 5 Giorni
            </Button>
            <Button 
              onClick={handleViewPlans}
              variant="outline"
              className="w-full text-lg py-3"
              size="lg"
            >
              Vedi Tutti i Piani Premium
            </Button>
            <Button 
              onClick={handleLogin}
              variant="ghost"
              className="w-full text-lg py-2"
              size="lg"
            >
              Hai già un account?
            </Button>
          </div>

          <p className="text-center text-xs text-gray-500 mt-6">
            Pagamento sicuro elaborato da Stripe • Supporto clienti 24/7
          </p>
        </CardContent>
      </Card>
    </div>
  );
}