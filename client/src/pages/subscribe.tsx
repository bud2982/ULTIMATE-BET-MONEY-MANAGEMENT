import { useEffect, useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ArrowLeft, CreditCard, Check, Loader2 } from "lucide-react";
import { Elements } from '@stripe/react-stripe-js';
import stripePromise from '@/lib/stripe';
import StripeCheckoutForm from '@/components/StripeCheckoutForm';

// Demo version without Stripe integration
const DemoPaymentForm = ({ planId }: { planId: string }) => {
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const handleDemoSubscription = () => {
    toast({
      title: "Demo Mode Active",
      description: "In production, this would process your payment securely via Stripe",
      variant: "default",
    });
    
    // Simulate successful subscription and redirect
    setTimeout(() => {
      navigate('/');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-blue-600" />
          </div>
          <CardTitle className="text-xl font-bold">Demo Payment Interface</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center space-x-2">
              <Check className="w-5 h-5 text-green-500" />
              <span className="text-sm text-gray-600">Demo environment</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <Check className="w-5 h-5 text-green-500" />
              <span className="text-sm text-gray-600">No actual charges</span>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">Production Features:</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Secure payment processing</li>
              <li>• 7-day free trial period</li>
              <li>• Multiple payment methods</li>
              <li>• Automatic subscription management</li>
            </ul>
          </div>

          <Button 
            onClick={handleDemoSubscription}
            className="w-full py-3 text-lg font-semibold bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            size="lg"
          >
            Simulate Subscription (Demo)
          </Button>

          <div className="text-center space-y-2">
            <p className="text-xs text-gray-500">
              This is a demonstration interface
            </p>
            <p className="text-xs text-gray-500">
              Real payments would be processed securely
            </p>
          </div>

          <Button 
            variant="outline" 
            onClick={() => navigate('/')}
            className="w-full flex items-center justify-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Application
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default function Subscribe() {
  const [clientSecret, setClientSecret] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [planData, setPlanData] = useState(null);
  const { toast } = useToast();

  // Get plan from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const planId = urlParams.get('plan') || 'monthly';

  useEffect(() => {
    // Create subscription for the selected plan
    setIsLoading(true);
    apiRequest("POST", "/api/create-subscription", { planId })
      .then(async (res) => {
        const data = await res.json();
        
        if (data.demoMode) {
          setIsDemoMode(true);
          toast({
            title: "Demo Mode Active",
            description: data.message,
            variant: "default",
          });
        } else {
          setClientSecret(data.clientSecret);
          setPlanData(data.plan);
        }
        
        setIsLoading(false);
      })
      .catch((error) => {
        toast({
          title: "Error",
          description: "Failed to initialize payment",
          variant: "destructive",
        });
        console.error('Payment initialization error:', error);
        setIsLoading(false);
      });
  }, [toast, planId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600">Inizializzazione pagamento...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show demo interface if Stripe is not configured
  if (isDemoMode) {
    return <DemoPaymentForm planId={planId} />;
  }

  // Show Stripe payment interface
  const appearance = {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: '#3b82f6',
    },
  };

  const options = {
    clientSecret,
    appearance,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-blue-600" />
          </div>
          <CardTitle className="text-xl font-bold">
            Completa il Pagamento
          </CardTitle>
          {planData && (
            <p className="text-gray-600 mt-2">
              {planData.name} - €{(planData.amount / 100).toFixed(2)}
            </p>
          )}
        </CardHeader>
        
        <CardContent>
          {clientSecret && (
            <Elements options={options} stripe={stripePromise}>
              <StripeCheckoutForm planId={planId} />
            </Elements>
          )}
        </CardContent>
      </Card>
    </div>
  );
}