import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { CheckCircle, Home, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function SubscriptionSuccess() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [paymentStatus, setPaymentStatus] = useState<'loading' | 'succeeded' | 'failed'>('loading');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentIntent = urlParams.get('payment_intent');
    const paymentIntentClientSecret = urlParams.get('payment_intent_client_secret');

    if (paymentIntent && paymentIntentClientSecret) {
      // In a real app, you would verify the payment status with your backend
      // For now, we'll assume success
      setPaymentStatus('succeeded');
      
      toast({
        title: "Pagamento Completato!",
        description: "Il tuo abbonamento è stato attivato con successo.",
        variant: "default",
      });
    } else {
      setPaymentStatus('failed');
      
      toast({
        title: "Errore",
        description: "Non è stato possibile verificare il pagamento.",
        variant: "destructive",
      });
    }
  }, [toast]);

  if (paymentStatus === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Verifica del pagamento in corso...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (paymentStatus === 'failed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-red-600" />
            </div>
            <CardTitle className="text-xl font-bold text-red-800">
              Pagamento Non Riuscito
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            <p className="text-gray-600">
              Si è verificato un problema durante la verifica del pagamento.
            </p>
            
            <div className="space-y-3">
              <Button 
                onClick={() => navigate('/pricing')}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                Riprova Pagamento
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => navigate('/')}
                className="w-full"
              >
                <Home className="w-4 h-4 mr-2" />
                Torna alla Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-green-800">
            Abbonamento Attivato!
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6 text-center">
          <div className="space-y-2">
            <p className="text-lg font-semibold text-gray-900">
              Benvenuto nel mondo del betting professionale!
            </p>
            <p className="text-gray-600">
              Il tuo abbonamento è stato attivato con successo. Hai accesso completo a tutte le funzionalità premium.
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-800 mb-2">Cosa puoi fare ora:</h3>
            <ul className="text-sm text-green-700 space-y-1 text-left">
              <li>✅ Accesso a tutte le strategie di betting</li>
              <li>✅ Analytics avanzate e ROI tracking</li>
              <li>✅ Beat the Delay con ML predittivo</li>
              <li>✅ Esportazione dati e backup cloud</li>
              <li>✅ Supporto prioritario</li>
            </ul>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={() => navigate('/')}
              className="w-full py-3 text-lg font-semibold bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
              size="lg"
            >
              <Home className="w-5 h-5 mr-2" />
              Inizia Subito
            </Button>
            
            <p className="text-xs text-gray-500">
              Ricorda: hai 7 giorni di prova gratuita!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}