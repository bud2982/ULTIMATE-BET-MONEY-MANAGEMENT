import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Crown, TrendingUp, Smartphone, Monitor, Tablet } from "lucide-react";

export default function Plans() {
  const plans = [
    {
      id: 'monthly',
      name: 'Piano Mensile',
      price: '€9.99',
      period: '/mese',
      description: 'Perfetto per iniziare',
      features: [
        'Tutte le strategie premium',
        'Dashboard analytics completo',
        'Supporto clienti prioritario',
        'Accesso multi-dispositivo'
      ],
      color: 'blue',
      popular: false
    },
    {
      id: 'semester',
      name: 'Piano Semestrale',
      price: '€40',
      period: '6 mesi',
      description: 'Risparmio del 33%',
      features: [
        'Tutte le funzionalità del piano mensile',
        'Accesso esteso 6 mesi',
        'Supporto prioritario dedicato',
        'Backup cloud delle sessioni'
      ],
      color: 'green',
      popular: true
    },
    {
      id: 'lifetime',
      name: 'Piano A Vita',
      price: '€24',
      period: 'per sempre',
      description: 'Miglior valore',
      features: [
        'Accesso illimitato a vita',
        'Tutti gli aggiornamenti futuri',
        'Supporto premium lifetime',
        'Accesso beta nuove funzionalità'
      ],
      color: 'purple',
      popular: false
    }
  ];

  const handleSelectPlan = (planId: string) => {
    window.location.href = `/subscribe?plan=${planId}`;
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
            <Button onClick={() => window.location.href = "/api/login"} variant="outline">
              Accedi
            </Button>
          </div>
        </div>
      </header>

      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="flex items-center justify-center mb-4">
              <Crown className="h-12 w-12 text-blue-600 mr-3" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Scegli il Tuo Piano Premium
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Accedi alle strategie di money management più avanzate. Tutti i piani includono 
              accesso completo su tutti i tuoi dispositivi personali.
            </p>
          </div>

          {/* Multi-Device Feature Highlight */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 mb-12">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Accesso Multi-Dispositivo Incluso
              </h3>
              <p className="text-gray-600 mb-6">
                Usa BettingPro su tutti i tuoi dispositivi con un unico abbonamento
              </p>
              <div className="flex justify-center space-x-8">
                <div className="flex flex-col items-center">
                  <Monitor className="h-12 w-12 text-blue-600 mb-2" />
                  <span className="text-sm font-medium">Desktop</span>
                </div>
                <div className="flex flex-col items-center">
                  <Tablet className="h-12 w-12 text-green-600 mb-2" />
                  <span className="text-sm font-medium">Tablet</span>
                </div>
                <div className="flex flex-col items-center">
                  <Smartphone className="h-12 w-12 text-purple-600 mb-2" />
                  <span className="text-sm font-medium">Mobile</span>
                </div>
              </div>
            </div>
          </div>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <Card 
                key={plan.id} 
                className={`relative ${plan.popular ? 'ring-2 ring-green-500 shadow-2xl scale-105' : 'shadow-lg'}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-green-600 text-white px-4 py-1">
                      PIÙ POPOLARE
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                  <CardDescription className="text-sm">{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className={`text-4xl font-bold text-${plan.color}-600`}>
                      {plan.price}
                    </span>
                    <span className="text-gray-500 ml-1">
                      {plan.period}
                    </span>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    onClick={() => handleSelectPlan(plan.id)}
                    className={`w-full mt-6 ${
                      plan.color === 'green' ? 'bg-green-600 hover:bg-green-700' :
                      plan.color === 'purple' ? 'bg-purple-600 hover:bg-purple-700' :
                      'bg-blue-600 hover:bg-blue-700'
                    } text-white`}
                    size="lg"
                  >
                    Scegli {plan.name}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* FAQ Section */}
          <div className="mt-16 text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-8">
              Domande Frequenti
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="text-left">
                <h4 className="font-semibold text-lg mb-2">
                  Su quanti dispositivi posso usare l'app?
                </h4>
                <p className="text-gray-600">
                  Puoi accedere da tutti i tuoi dispositivi personali: computer, tablet, smartphone. 
                  Non ci sono limiti sul numero di dispositivi.
                </p>
              </div>
              <div className="text-left">
                <h4 className="font-semibold text-lg mb-2">
                  Posso cambiare piano in qualsiasi momento?
                </h4>
                <p className="text-gray-600">
                  Sì, puoi fare upgrade o downgrade del tuo piano in qualsiasi momento. 
                  Le modifiche entrano in vigore nel prossimo ciclo di fatturazione.
                </p>
              </div>
            </div>
          </div>

          {/* Security Note */}
          <div className="mt-12 text-center">
            <p className="text-sm text-gray-500">
              Tutti i pagamenti sono elaborati in modo sicuro tramite Stripe • 
              Garanzia di rimborso 30 giorni • Supporto clienti 24/7
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}