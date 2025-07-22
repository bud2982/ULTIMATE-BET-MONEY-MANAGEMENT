import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from "@/components/ui/card";
import { SessionData } from "@/types/betting";
import { formatCurrency } from "@/lib/betting-strategies";
import { Trophy, TrendingUp, Medal, AlertTriangle } from 'lucide-react';

interface AnimatedProgressTrackerProps {
  session: SessionData;
}

export default function AnimatedProgressTracker({ session }: AnimatedProgressTrackerProps) {
  const [mascotMood, setMascotMood] = useState<'happy' | 'neutral' | 'sad'>('neutral');
  const [message, setMessage] = useState<string>('');
  const [progressPercentage, setProgressPercentage] = useState<number>(0);
  const [showTargetAnimation, setShowTargetAnimation] = useState<boolean>(false);
  
  useEffect(() => {
    // Calcola il progresso percentuale verso l'obiettivo
    if (session) {
      const initialBankroll = session.initialBankroll;
      const currentBankroll = session.currentBankroll;
      const targetBankroll = initialBankroll * (1 + session.targetReturn / 100);
      
      // Se siamo partiti da un valore superiore al target, impostiamo un progress bar al 100%
      if (initialBankroll >= targetBankroll) {
        setProgressPercentage(100);
      } else {
        // Calcoliamo quanto siamo vicini al target (da 0 a 100%)
        const totalGain = targetBankroll - initialBankroll;
        const currentGain = currentBankroll - initialBankroll;
        
        // Calcoliamo la percentuale di completamento
        let progress = (currentGain / totalGain) * 100;
        
        // Limitiamo tra 0 e 100
        progress = Math.max(0, Math.min(100, progress));
        
        setProgressPercentage(progress);
        
        // Imposta lo stato d'animo della mascotte in base al progresso
        if (progress >= 80) {
          setMascotMood('happy');
          setMessage('Ottimo lavoro! Sei quasi al tuo obiettivo! 🚀');
        } else if (progress >= 0) {
          setMascotMood('neutral');
          setMessage('Stai facendo progressi verso il tuo obiettivo.');
        } else {
          setMascotMood('sad');
          setMessage('Continua a provare, puoi recuperare! 💪');
        }
        
        // Mostra un'animazione speciale quando l'obiettivo viene raggiunto
        if (progress >= 100 && !showTargetAnimation) {
          setShowTargetAnimation(true);
          setMessage('Congratulazioni! Hai raggiunto il tuo obiettivo! 🎉');
          
          // Nascondi l'animazione dopo 5 secondi
          setTimeout(() => {
            setShowTargetAnimation(false);
          }, 5000);
        }
      }
    }
  }, [session]);
  
  // Funzione per ottenere il colore della progress bar in base al progresso
  const getProgressColor = () => {
    if (progressPercentage >= 75) return 'bg-green-500';
    if (progressPercentage >= 50) return 'bg-blue-500';
    if (progressPercentage >= 25) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  // Funzione per ottenere il colore di sfondo della mascotte
  const getMascotBgColor = () => {
    if (mascotMood === 'happy') return 'bg-green-100';
    if (mascotMood === 'neutral') return 'bg-blue-100';
    return 'bg-orange-100';
  };
  
  // Renderizza la mascotte in base allo stato d'animo
  const renderMascot = () => {
    const baseClass = `w-14 h-14 rounded-full flex items-center justify-center ${getMascotBgColor()}`;
    
    switch (mascotMood) {
      case 'happy':
        return (
          <motion.div
            className={baseClass}
            animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, repeatType: 'reverse' }}
          >
            <span className="text-2xl" role="img" aria-label="Happy mascot">
              😄
            </span>
          </motion.div>
        );
      case 'sad':
        return (
          <motion.div
            className={baseClass}
            animate={{ y: [0, 3, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
          >
            <span className="text-2xl" role="img" aria-label="Sad mascot">
              😔
            </span>
          </motion.div>
        );
      default: // neutral
        return (
          <motion.div
            className={baseClass}
            animate={{ rotate: [0, 5, 0, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity, repeatType: 'reverse' }}
          >
            <span className="text-2xl" role="img" aria-label="Neutral mascot">
              🙂
            </span>
          </motion.div>
        );
    }
  };
  
  return (
    <Card className="bg-white shadow-sm mb-6 overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center mb-3">
          <h3 className="text-lg font-medium flex-1">Tracciamento Progresso</h3>
          <div className="flex items-center">
            <span className="text-sm text-gray-500 mr-2">
              Target: {formatCurrency(session.initialBankroll * (1 + session.targetReturn / 100))}
            </span>
          </div>
        </div>
        
        <div className="flex items-center mb-4">
          {renderMascot()}
          
          <div className="ml-4 flex-1">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm mb-2"
            >
              {message}
            </motion.p>
            
            <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className={`h-full ${getProgressColor()}`}
                initial={{ width: '0%' }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
            
            <div className="flex justify-between mt-1">
              <span className="text-xs text-gray-500">
                {formatCurrency(session.initialBankroll)}
              </span>
              <span className="text-xs text-gray-500">
                {formatCurrency(session.initialBankroll * (1 + session.targetReturn / 100))}
              </span>
            </div>
          </div>
        </div>
        
        {/* Visualizzazione delle statistiche */}
        <div className="grid grid-cols-3 gap-3 mt-2">
          <div className="bg-purple-50 p-2 rounded-md flex items-center">
            <TrendingUp className="w-4 h-4 text-purple-500 mr-2" />
            <div>
              <div className="text-xs text-gray-500">Profitto</div>
              <div className={`text-sm font-medium ${session.currentBankroll >= session.initialBankroll ? 'text-green-600' : 'text-red-600'}`}>
                {session.currentBankroll >= session.initialBankroll ? '+' : ''}
                {formatCurrency(session.currentBankroll - session.initialBankroll)}
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 p-2 rounded-md flex items-center">
            <Trophy className="w-4 h-4 text-blue-500 mr-2" />
            <div>
              <div className="text-xs text-gray-500">Win Rate</div>
              <div className="text-sm font-medium">
                {session.betCount > 0 
                  ? `${((session.wins / session.betCount) * 100).toFixed(1)}%` 
                  : '0%'}
              </div>
            </div>
          </div>
          
          <div className="bg-amber-50 p-2 rounded-md flex items-center">
            <Medal className="w-4 h-4 text-amber-500 mr-2" />
            <div>
              <div className="text-xs text-gray-500">ROI</div>
              <div className={`text-sm font-medium ${session.currentBankroll >= session.initialBankroll ? 'text-green-600' : 'text-red-600'}`}>
                {session.currentBankroll >= session.initialBankroll ? '+' : ''}
                {((session.currentBankroll / session.initialBankroll - 1) * 100).toFixed(2)}%
              </div>
            </div>
          </div>
        </div>
        
        {/* Animazione speciale quando si raggiunge l'obiettivo */}
        <AnimatePresence>
          {showTargetAnimation && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="absolute inset-0 bg-green-500 bg-opacity-80 flex flex-col items-center justify-center text-white"
            >
              <motion.div
                animate={{ 
                  rotate: [0, 15, -15, 0],
                  scale: [1, 1.2, 1] 
                }}
                transition={{ 
                  duration: 1.5,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              >
                <Trophy size={60} className="text-yellow-300 mb-4" />
              </motion.div>
              <motion.h2
                animate={{ y: [10, 0, 10] }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
                className="text-2xl font-bold mb-2"
              >
                Obiettivo Raggiunto!
              </motion.h2>
              <p className="text-center px-4">
                Hai raggiunto il tuo target di {session.targetReturn}%!
                <br />
                Continua così!
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}