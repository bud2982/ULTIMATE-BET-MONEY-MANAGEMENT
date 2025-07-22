import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Calendar, Crown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function TrialStatus() {
  const { user, isTrial } = useAuth();

  // Cast user to any to access trial properties
  const userWithTrial = user as any;
  
  if (!isTrial || !userWithTrial?.trialExpiresAt) return null;

  const expiresAt = new Date(userWithTrial.trialExpiresAt);
  const now = new Date();
  const daysLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const hoursLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60));

  const getStatusColor = () => {
    if (daysLeft <= 1) return "bg-red-50 border-red-200";
    if (daysLeft <= 2) return "bg-orange-50 border-orange-200";
    return "bg-blue-50 border-blue-200";
  };

  const getTextColor = () => {
    if (daysLeft <= 1) return "text-red-700";
    if (daysLeft <= 2) return "text-orange-700";
    return "text-blue-700";
  };

  return (
    <Card className={`${getStatusColor()} mb-4`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Clock className={`h-5 w-5 ${getTextColor()}`} />
              <Badge variant="secondary" className={getTextColor()}>
                Trial Gratuito
              </Badge>
            </div>
            <div className={`text-sm ${getTextColor()}`}>
              {daysLeft > 0 ? (
                <span>
                  <Calendar className="h-4 w-4 inline mr-1" />
                  {daysLeft === 1 ? `${hoursLeft} ore rimaste` : `${daysLeft} giorni rimasti`}
                </span>
              ) : (
                <span>Trial scaduto</span>
              )}
            </div>
          </div>
          <Button 
            size="sm" 
            onClick={() => window.location.href = "/plans"}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Crown className="h-4 w-4 mr-1" />
            Upgrade Premium
          </Button>
        </div>
        {daysLeft <= 2 && (
          <div className={`mt-2 text-xs ${getTextColor()}`}>
            Il tuo trial sta per scadere. Scegli un piano premium per continuare ad usare tutte le funzionalità.
          </div>
        )}
      </CardContent>
    </Card>
  );
}