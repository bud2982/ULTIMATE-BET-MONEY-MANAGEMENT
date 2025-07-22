import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from "@/hooks/use-toast";
import { 
  User, 
  CreditCard, 
  Calendar, 
  Crown, 
  Star, 
  Zap, 
  AlertTriangle,
  CheckCircle,
  ArrowLeft 
} from 'lucide-react';

export default function Account() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Mock data - in produzione questi dati verrebbero dal backend
  const subscription = {
    status: 'active',
    plan: 'pro',
    nextBilling: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    trialEndsAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    isInTrial: true
  };

  const planDetails = {
    basic: {
      name: 'Piano Base',
      price: '€9.99/mese',
      icon: Zap,
      color: 'bg-blue-100 text-blue-800'
    },
    pro: {
      name: 'Piano Pro',
      price: '€19.99/mese',
      icon: Star,
      color: 'bg-purple-100 text-purple-800'
    },
    premium: {
      name: 'Piano Premium',
      price: '€29.99/mese',
      icon: Crown,
      color: 'bg-yellow-100 text-yellow-800'
    }
  };

  const currentPlan = planDetails[subscription.plan as keyof typeof planDetails];

  const handleCancelSubscription = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      toast({
        title: "Abbonamento Cancellato",
        description: "Il tuo abbonamento verrà cancellato alla fine del periodo di fatturazione.",
      });
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile cancellare l'abbonamento. Riprova più tardi.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgradePlan = () => {
    navigate('/pricing');
  };

  if (!user || typeof user !== 'object' || !user.id) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <Card>
          <CardContent className="p-6 text-center">
            <p>Devi essere autenticato per visualizzare questa pagina.</p>
            <Button onClick={() => window.location.href = '/api/login'} className="mt-4">
              Accedi
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Il Mio Account</h1>
            <Button 
              variant="outline" 
              onClick={() => navigate('/')}
              className="flex items-center"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Torna alla Home
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Informazioni Profilo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Profilo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  {user.profileImageUrl && typeof user.profileImageUrl === 'string' && (
                    <img 
                      src={user.profileImageUrl} 
                      alt="Profile" 
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {user.firstName || ''} {user.lastName || ''}
                    </h3>
                    <p className="text-gray-600">{user.email || 'Email non disponibile'}</p>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-500">Membro dal</p>
                  <p className="font-medium">
                    {new Date(user.createdAt || Date.now()).toLocaleDateString('it-IT')}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Stato Abbonamento */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CreditCard className="w-5 h-5 mr-2" />
                    Abbonamento
                  </div>
                  <Badge className={currentPlan.color}>
                    {React.createElement(currentPlan.icon, { className: "w-4 h-4 mr-1" })}
                    {currentPlan.name}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {subscription.isInTrial && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                      <span className="font-medium text-green-800">
                        Prova Gratuita Attiva
                      </span>
                    </div>
                    <p className="text-sm text-green-700 mt-1">
                      La tua prova gratuita termina il {subscription.trialEndsAt.toLocaleDateString('it-IT')}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Piano Attuale</p>
                    <p className="font-semibold text-lg">{currentPlan.name}</p>
                    <p className="text-gray-600">{currentPlan.price}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">
                      {subscription.isInTrial ? 'Primo Addebito' : 'Prossimo Addebito'}
                    </p>
                    <p className="font-semibold">
                      {subscription.nextBilling.toLocaleDateString('it-IT')}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button 
                    onClick={handleUpgradePlan}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    Cambia Piano
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => window.open('https://billing.stripe.com/p/login/test_00000000000000', '_blank')}
                  >
                    Gestisci Fatturazione
                  </Button>
                  
                  <Button 
                    variant="destructive"
                    onClick={handleCancelSubscription}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Cancellazione...' : 'Cancella Abbonamento'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Statistiche Utilizzo */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Statistiche di Utilizzo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">12</div>
                    <div className="text-sm text-gray-600">Sessioni Totali</div>
                  </div>
                  
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">€156.89</div>
                    <div className="text-sm text-gray-600">Profitto Totale</div>
                  </div>
                  
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">3</div>
                    <div className="text-sm text-gray-600">Strategie Usate</div>
                  </div>
                  
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">68%</div>
                    <div className="text-sm text-gray-600">Win Rate Medio</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Supporto */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Hai bisogno di aiuto?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="font-semibold">Contatta il Supporto</h4>
                    <p className="text-sm text-gray-600">
                      Il nostro team è qui per aiutarti con qualsiasi domanda o problema.
                    </p>
                    <Button variant="outline">
                      Apri Ticket di Supporto
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-semibold">Risorse Utili</h4>
                    <div className="space-y-2">
                      <Button variant="link" className="p-0 h-auto justify-start">
                        Guida alle Strategie
                      </Button>
                      <Button variant="link" className="p-0 h-auto justify-start">
                        FAQ
                      </Button>
                      <Button variant="link" className="p-0 h-auto justify-start">
                        Video Tutorial
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}