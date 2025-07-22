import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, TrendingUp, Calculator, Shield, BarChart3 } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  const handleSubscribe = () => {
    window.location.href = "/subscribe";
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
            <Button onClick={handleLogin} variant="outline">
              Accedi
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge variant="secondary" className="mb-4">
            Piattaforma Premium di Money Management
          </Badge>
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Gestione Avanzata del
            <span className="text-blue-600"> Bankroll</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Massimizza i tuoi profitti con strategie algoritmiche avanzate: Kelly Ridotto, 
            D'Alembert, Masaniello e Multi-Masaniello. Analisi delle probabilità in tempo reale 
            e gestione del rischio personalizzata.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={handleSubscribe}
              size="lg" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
            >
              Inizia Gratis - €9.99/mese
            </Button>
            <Button 
              onClick={handleLogin}
              size="lg" 
              variant="outline"
              className="px-8 py-3"
            >
              Accedi al tuo Account
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Funzionalità Premium
            </h3>
            <p className="text-lg text-gray-600">
              Tutto quello che serve per una gestione professionale del bankroll
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Calculator className="h-10 w-10 text-blue-600 mb-4" />
                <CardTitle>Kelly Ridotto Avanzato</CardTitle>
                <CardDescription>
                  Calcolo ottimale delle puntate con riduzione del rischio personalizzabile
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Calcolatore probabilità 1X2
                  </li>
                  <li className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Distribuzione Poisson
                  </li>
                  <li className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Slider tolleranza rischio
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <TrendingUp className="h-10 w-10 text-green-600 mb-4" />
                <CardTitle>Strategie Multiple</CardTitle>
                <CardDescription>
                  D'Alembert, Masaniello, Multi-Masaniello e gestione Flat
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Progressioni matematiche
                  </li>
                  <li className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Controllo automatico perdite
                  </li>
                  <li className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Raccomandazioni AI
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <BarChart3 className="h-10 w-10 text-purple-600 mb-4" />
                <CardTitle>Analytics Avanzati</CardTitle>
                <CardDescription>
                  Tracking completo delle performance e sistema badge
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Dashboard performance
                  </li>
                  <li className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Sistema achievement
                  </li>
                  <li className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Export sessioni PDF
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl font-bold text-gray-900 mb-8">
            Prezzo Semplice e Trasparente
          </h3>
          
          <Card className="mx-auto max-w-lg border-2 border-blue-500 shadow-lg">
            <CardHeader className="bg-blue-600 text-white rounded-t-lg">
              <div className="flex items-center justify-center mb-4">
                <Shield className="h-8 w-8 mr-2" />
                <CardTitle className="text-2xl">Piano Premium</CardTitle>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold">€9.99</div>
                <div className="text-blue-100">al mese</div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <ul className="space-y-3 mb-6">
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  Accesso completo a tutte le strategie
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  Calcolatore probabilità avanzato
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  Analytics e tracking dettagliato
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  Supporto prioritario
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  Aggiornamenti gratuiti
                </li>
              </ul>
              <Button 
                onClick={handleSubscribe}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                size="lg"
              >
                Inizia il tuo Abbonamento
              </Button>
              <p className="text-sm text-gray-500 mt-4">
                Cancella in qualsiasi momento. Nessun vincolo.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <TrendingUp className="h-6 w-6 mr-2" />
            <span className="text-xl font-semibold">BettingPro</span>
          </div>
          <p className="text-gray-400 mb-4">
            Piattaforma professionale per la gestione avanzata del bankroll nelle scommesse sportive
          </p>
          <div className="flex justify-center space-x-6 text-sm text-gray-400">
            <a href="#" className="hover:text-white">Privacy Policy</a>
            <a href="#" className="hover:text-white">Termini di Servizio</a>
            <a href="#" className="hover:text-white">Supporto</a>
          </div>
        </div>
      </footer>
    </div>
  );
}