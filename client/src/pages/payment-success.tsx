import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { CheckCircle, Crown, Star, Zap } from 'lucide-react';

export default function PaymentSuccess() {
  const [, navigate] = useLocation();
  
  const urlParams = new URLSearchParams(window.location.search);
  const planId = urlParams.get('plan') || 'basic';

  const planDetails = {
    basic: {
      name: 'Piano Base',
      icon: <Zap className="w-12 h-12 text-blue-500" />,
      color: 'from-blue-500 to-cyan-500'
    },
    pro: {
      name: 'Piano Pro',
      icon: <Star className="w-12 h-12 text-purple-500" />,
      color: 'from-purple-500 to-pink-500'
    },
    premium: {
      name: 'Piano Premium',
      icon: <Crown className="w-12 h-12 text-yellow-500" />,
      color: 'from-yellow-500 to-orange-500'
    }
  };

  const currentPlan = planDetails[planId as keyof typeof planDetails] || planDetails.basic;

  useEffect(() => {
    // Aggiorna lo stato dell'utente dopo il pagamento
    // Questo sarà gestito automaticamente dal webhook di Stripe
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        <Card className="shadow-2xl text-center">
          <CardHeader className="space-y-6 pt-8">
            <div className="flex justify-center">
              <div className="relative">
                <CheckCircle className="w-20 h-20 text-green-500" />
                <div className="absolute -top-2 -right-2">
                  {currentPlan.icon}
                </div>
              </div>
            </div>
            
            <div>
              <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
                Pagamento Completato!
              </CardTitle>
              <p className="text-lg text-gray-600">
                Benvenuto nel {currentPlan.name}
              </p>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 pb-8">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="font-semibold text-green-800 mb-2">
                La tua prova gratuita è iniziata!
              </h3>
              <p className="text-sm text-green-700">
                Hai 7 giorni per esplorare tutte le funzionalità del {currentPlan.name}. 
                Il primo addebito avverrà solo dopo il periodo di prova.
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Cosa puoi fare ora:</h4>
              <div className="space-y-2 text-left">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-700">Accedi a tutte le strategie del piano</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-700">Crea sessioni di betting illimitate</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-700">Visualizza analytics avanzate</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-700">Esporta i tuoi dati</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={() => navigate('/')}
                className={`w-full py-3 text-lg font-semibold bg-gradient-to-r ${currentPlan.color} hover:opacity-90`}
                size="lg"
              >
                Inizia a Usare le Strategie
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => navigate('/account')}
                className="w-full"
              >
                Gestisci Account
              </Button>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-500">
                Hai ricevuto un'email di conferma con tutti i dettagli
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}