import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Star, Crown, Zap } from 'lucide-react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';

const plans = [
  {
    id: 'basic',
    name: 'Piano Base',
    price: 9.99,
    period: 'mese',
    description: 'Perfetto per iniziare con le strategie di base',
    icon: <Zap className="w-6 h-6" />,
    features: [
      'Strategia Profit Fall',
      'Strategia D\'Alembert',
      'Strategia Percentuale',
      'Storico sessioni illimitato',
      'Supporto email',
      'Dashboard analytics di base'
    ],
    popular: false,
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'pro',
    name: 'Piano Pro',
    price: 19.99,
    period: 'mese',
    description: 'Per scommettitori esperti che vogliono strategie avanzate',
    icon: <Star className="w-6 h-6" />,
    features: [
      'Tutte le funzionalità del Piano Base',
      'Kelly Ridotto per eventi simultanei',
      'Multi Masaniello avanzato',
      'Interactive Betting Trend Sparklines',
      'Analytics avanzate con ROI tracking',
      'Esportazione dati CSV/PDF',
      'Supporto prioritario'
    ],
    popular: true,
    color: 'from-purple-500 to-pink-500'
  },
  {
    id: 'premium',
    name: 'Piano Premium',
    price: 29.99,
    period: 'mese',
    description: 'La soluzione completa per professionisti',
    icon: <Crown className="w-6 h-6" />,
    features: [
      'Tutte le funzionalità del Piano Pro',
      'Beat the Delay con ML predittivo',
      'Sistema ML autonomo avanzato',
      'Analisi predittiva dei trend',
      'API access per integrazioni',
      'Backup automatico cloud',
      'Consulenza strategica personalizzata',
      'Accesso anticipato a nuove funzionalità'
    ],
    popular: false,
    color: 'from-yellow-500 to-orange-500'
  }
];

export default function Pricing() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();

  const handleSubscribe = (planId: string) => {
    if (!isAuthenticated) {
      // Redirect to login
      window.location.href = '/api/login';
      return;
    }

    // Navigate to the subscribe page with the selected plan
    navigate(`/subscribe?plan=${planId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Scegli il Piano Perfetto per Te
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Accedi alle strategie di betting più avanzate con piani flessibili 
            pensati per ogni livello di esperienza
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <Card 
              key={plan.id}
              className={`relative overflow-hidden hover:shadow-2xl transition-all duration-300 ${
                plan.popular ? 'ring-2 ring-purple-500 transform scale-105' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-0 right-0">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-center py-2 text-sm font-semibold">
                    PIÙ POPOLARE
                  </div>
                </div>
              )}
              
              <div className={`h-2 bg-gradient-to-r ${plan.color}`}></div>
              
              <CardHeader className={plan.popular ? 'pt-8' : 'pt-6'}>
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg bg-gradient-to-r ${plan.color}`}>
                    <div className="text-white">
                      {plan.icon}
                    </div>
                  </div>
                  {plan.popular && (
                    <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">
                      Consigliato
                    </Badge>
                  )}
                </div>
                
                <CardTitle className="text-2xl font-bold text-gray-900">
                  {plan.name}
                </CardTitle>
                
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold text-gray-900">€{plan.price}</span>
                  <span className="text-lg text-gray-600 ml-1">/{plan.period}</span>
                </div>
                
                <p className="text-gray-600 mt-2">{plan.description}</p>
              </CardHeader>

              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  onClick={() => handleSubscribe(plan.id)}
                  className={`w-full py-3 text-lg font-semibold bg-gradient-to-r ${plan.color} hover:opacity-90 transition-opacity`}
                  size="lg"
                >
                  {isAuthenticated ? 'Sottoscrivi Ora' : 'Accedi e Sottoscrivi'}
                </Button>

                <div className="text-center text-sm text-gray-500">
                  <p>Cancella in qualsiasi momento</p>
                  <p>Prova gratuita di 7 giorni</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Domande Frequenti
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Posso cambiare piano in qualsiasi momento?
                </h3>
                <p className="text-gray-600">
                  Sì, puoi aggiornare o declassare il tuo piano in qualsiasi momento. 
                  Le modifiche avranno effetto dal ciclo di fatturazione successivo.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Come funziona la prova gratuita?
                </h3>
                <p className="text-gray-600">
                  Tutti i piani includono 7 giorni di prova gratuita. Puoi cancellare 
                  prima della fine del periodo di prova senza alcun addebito.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  I miei dati sono al sicuro?
                </h3>
                <p className="text-gray-600">
                  Assolutamente. Utilizziamo crittografia di livello bancario e 
                  backup automatici per proteggere i tuoi dati di betting.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Supporto clienti disponibile?
                </h3>
                <p className="text-gray-600">
                  Offriamo supporto email per tutti i piani, con supporto prioritario 
                  per i clienti Pro e Premium.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <Button 
            variant="outline" 
            onClick={() => navigate('/')}
            className="mr-4"
          >
            Torna alla Home
          </Button>
          
          <Button 
            variant="link"
            onClick={() => navigate('/support')}
          >
            Hai domande? Contattaci
          </Button>
        </div>
      </div>
    </div>
  );
}