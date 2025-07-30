import React, { useState } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { Loader2, ArrowLeft } from 'lucide-react';

interface StripeCheckoutFormProps {
  planId: string;
}

export default function StripeCheckoutForm({ planId }: StripeCheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/subscription-success`,
      },
    });

    if (error) {
      if (error.type === "card_error" || error.type === "validation_error") {
        toast({
          title: "Errore di Pagamento",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Errore Imprevisto",
          description: "Si è verificato un errore durante il pagamento. Riprova.",
          variant: "destructive",
        });
      }
    }

    setIsLoading(false);
  };

  const paymentElementOptions = {
    layout: "tabs" as const,
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement 
        id="payment-element" 
        options={paymentElementOptions}
      />
      
      <div className="space-y-4">
        <Button 
          disabled={isLoading || !stripe || !elements} 
          type="submit"
          className="w-full py-3 text-lg font-semibold bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Elaborazione...
            </>
          ) : (
            'Conferma Pagamento'
          )}
        </Button>

        <div className="text-center space-y-2">
          <p className="text-xs text-gray-500">
            🔒 Pagamento sicuro elaborato da Stripe
          </p>
          <p className="text-xs text-gray-500">
            ✅ Prova gratuita di 7 giorni inclusa
          </p>
        </div>

        <Button 
          type="button"
          variant="outline" 
          onClick={() => navigate('/pricing')}
          className="w-full flex items-center justify-center"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Torna ai Piani
        </Button>
      </div>
    </form>
  );
}