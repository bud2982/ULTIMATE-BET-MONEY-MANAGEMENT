import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Shield, ArrowLeft, Check } from 'lucide-react';

export default function Checkout() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Extract parameters from URL
  const urlParams = new URLSearchParams(window.location.search);
  const planId = urlParams.get('plan') || 'basic';

  const handleDemoCheckout = () => {
    toast({
      title: "Demo Mode",
      description: "In production, secure payment processing would occur here",
      variant: "default",
    });
    
    // Simulate successful checkout
    setTimeout(() => {
      navigate('/');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-6">
        <Card className="w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <Shield className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Demo Checkout</CardTitle>
            <p className="text-gray-600">Secure payment simulation</p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Check className="w-5 h-5 text-green-500" />
                <span className="text-sm">SSL Secured</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="w-5 h-5 text-green-500" />
                <span className="text-sm">PCI Compliant</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="w-5 h-5 text-green-500" />
                <span className="text-sm">Demo Safe</span>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">Production Payment Features:</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Multiple payment methods (cards, digital wallets)</li>
                <li>• Real-time payment verification</li>
                <li>• Secure tokenization</li>
                <li>• Automatic receipt generation</li>
                <li>• Subscription management</li>
              </ul>
            </div>

            <div className="space-y-4">
              <Button 
                onClick={handleDemoCheckout}
                className="w-full py-3 text-lg font-semibold bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                size="lg"
              >
                <CreditCard className="w-5 h-5 mr-2" />
                Simulate Payment (Demo)
              </Button>

              <div className="text-center space-y-2">
                <p className="text-xs text-gray-500">
                  This is a demonstration of the checkout process
                </p>
                <p className="text-xs text-gray-500">
                  No actual payment processing occurs in demo mode
                </p>
              </div>

              <Button 
                variant="outline" 
                onClick={() => navigate('/pricing')}
                className="w-full flex items-center justify-center"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Plans
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}