import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge as BadgeComponent } from "@/components/ui/badge";
import { SessionData, BetData } from "@/types/betting";
import { Badge, calculateBadges } from "@/lib/badges";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { Award, Lock } from 'lucide-react';

interface BadgesDisplayProps {
  session: SessionData;
  bets: BetData[];
}

export default function BadgesDisplay({ session, bets }: BadgesDisplayProps) {
  // Ottiene i badge per questa sessione
  const badges = calculateBadges(session, bets);
  
  // Raggruppa i badge per livello
  const groupedBadges = {
    bronze: badges.filter(badge => badge.level === 'bronze'),
    silver: badges.filter(badge => badge.level === 'silver'),
    gold: badges.filter(badge => badge.level === 'gold'),
    platinum: badges.filter(badge => badge.level === 'platinum')
  };
  
  // Calcola lo stato di avanzamento
  const totalBadges = badges.length;
  const unlockedBadges = badges.filter(badge => badge.unlocked).length;
  const progressPercentage = totalBadges > 0 
    ? Math.round((unlockedBadges / totalBadges) * 100) 
    : 0;
  
  // Restituisce il colore per un livello specifico di badge
  const getLevelColor = (level: 'bronze' | 'silver' | 'gold' | 'platinum') => {
    switch (level) {
      case 'bronze': return 'bg-amber-700';
      case 'silver': return 'bg-gray-400';
      case 'gold': return 'bg-yellow-500';
      case 'platinum': return 'bg-blue-500';
      default: return 'bg-gray-300';
    }
  };
  
  // Restituisce il colore del testo per un livello specifico di badge
  const getLevelTextColor = (level: 'bronze' | 'silver' | 'gold' | 'platinum') => {
    switch (level) {
      case 'bronze': return 'text-amber-700';
      case 'silver': return 'text-gray-500';
      case 'gold': return 'text-yellow-600';
      case 'platinum': return 'text-blue-600';
      default: return 'text-gray-500';
    }
  };
  
  // Renderizza un singolo badge
  const renderBadge = (badge: Badge, index: number) => {
    return (
      <motion.div
        key={`badge-${badge.id}-${index}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`bg-white p-4 rounded-lg border ${badge.unlocked ? 'border-gray-200' : 'border-gray-100 opacity-60'}`}
      >
        <div className="flex items-start">
          <div className="mr-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${badge.unlocked ? `${getLevelColor(badge.level)} text-white` : 'bg-gray-200'}`}>
              {badge.unlocked ? (
                <span className="text-lg">{badge.icon}</span>
              ) : (
                <Lock className="w-4 h-4 text-gray-400" />
              )}
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center">
              <h3 className={`text-sm font-medium ${badge.unlocked ? 'text-gray-800' : 'text-gray-400'}`}>
                {badge.name}
              </h3>
              {badge.unlocked && (
                <BadgeComponent variant="outline" className={`ml-2 text-xs ${getLevelTextColor(badge.level)} border-current`}>
                  {badge.level.charAt(0).toUpperCase() + badge.level.slice(1)}
                </BadgeComponent>
              )}
            </div>
            <p className={`text-xs mt-1 ${badge.unlocked ? 'text-gray-600' : 'text-gray-400'}`}>
              {badge.description}
            </p>
          </div>
        </div>
      </motion.div>
    );
  };
  
  return (
    <Card className="mb-6 overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Award className="w-5 h-5 text-purple-500 mr-2" />
            <h3 className="text-lg font-medium">I tuoi Traguardi</h3>
          </div>
          <div className="text-sm text-gray-500">
            {unlockedBadges}/{totalBadges} sbloccati
          </div>
        </div>
        
        {/* Barra di progresso */}
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-5">
          <div 
            className="bg-purple-600 h-2.5 rounded-full" 
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
        
        {/* Tabs per i livelli di badge */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid grid-cols-5 mb-4">
            <TabsTrigger value="all">Tutti</TabsTrigger>
            <TabsTrigger value="bronze">Bronzo</TabsTrigger>
            <TabsTrigger value="silver">Argento</TabsTrigger>
            <TabsTrigger value="gold">Oro</TabsTrigger>
            <TabsTrigger value="platinum">Platino</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {badges.map((badge, index) => renderBadge(badge, index))}
            </div>
          </TabsContent>
          
          <TabsContent value="bronze" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {groupedBadges.bronze.map((badge, index) => renderBadge(badge, index))}
              {groupedBadges.bronze.length === 0 && (
                <p className="text-gray-500 text-sm py-4">
                  Nessun badge bronzo in questa sessione.
                </p>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="silver" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {groupedBadges.silver.map((badge, index) => renderBadge(badge, index))}
              {groupedBadges.silver.length === 0 && (
                <p className="text-gray-500 text-sm py-4">
                  Nessun badge argento in questa sessione.
                </p>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="gold" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {groupedBadges.gold.map((badge, index) => renderBadge(badge, index))}
              {groupedBadges.gold.length === 0 && (
                <p className="text-gray-500 text-sm py-4">
                  Nessun badge oro in questa sessione.
                </p>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="platinum" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {groupedBadges.platinum.map((badge, index) => renderBadge(badge, index))}
              {groupedBadges.platinum.length === 0 && (
                <p className="text-gray-500 text-sm py-4">
                  Nessun badge platino in questa sessione.
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}