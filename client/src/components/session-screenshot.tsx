import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SessionData, BetData } from "@/types/betting";
import { Share2, Download, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/betting-strategies";
import html2canvas from 'html2canvas';
import SparklineChart from "@/components/sparkline-chart";

interface SessionScreenshotProps {
  session: SessionData;
  bets: BetData[];
}

export default function SessionScreenshot({ session, bets = [] }: SessionScreenshotProps) {
  const { toast } = useToast();
  const screenshotRef = useRef<HTMLDivElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  
  // Assicuriamoci che bets sia un array
  const safeBets = Array.isArray(bets) ? bets : [];
  
  // Calcola le statistiche della sessione
  const roi = ((session.currentBankroll - session.initialBankroll) / session.initialBankroll) * 100;
  const netProfit = session.currentBankroll - session.initialBankroll;
  const winRate = session.betCount > 0 ? (session.wins / session.betCount) * 100 : 0;
  
  // Genera la data corrente per il timestamp
  const currentDate = new Date().toLocaleDateString('it-IT', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  
  const captureScreenshot = async () => {
    if (!screenshotRef.current) return;
    
    try {
      setIsCapturing(true);
      
      const canvas = await html2canvas(screenshotRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        allowTaint: true,
        useCORS: true
      });
      
      // Usa un approccio più sicuro senza manipolazione DOM diretta
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${session.name.replace(/\s+/g, '_')}_${new Date().getTime()}.png`;
          
          // Simula il click senza aggiungere al DOM
          const clickEvent = new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true
          });
          
          link.dispatchEvent(clickEvent);
          
          // Cleanup immediato
          setTimeout(() => {
            URL.revokeObjectURL(url);
          }, 100);
        }
      }, 'image/png');
      
      toast({
        title: "Screenshot salvato!",
        description: "L'immagine è stata scaricata con successo.",
        variant: "default"
      });
    } catch (error) {
      console.error("Errore durante la cattura dello screenshot:", error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante la cattura dello screenshot.",
        variant: "destructive"
      });
    } finally {
      setIsCapturing(false);
    }
  };
  
  const copyToClipboard = async () => {
    if (!screenshotRef.current) return;
    
    try {
      setIsCopying(true);
      
      const canvas = await html2canvas(screenshotRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        allowTaint: true,
        useCORS: true
      });
      
      // Converti il canvas in un blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob as Blob);
        }, 'image/png');
      });
      
      // Usa l'API Clipboard per copiarla negli appunti
      if (navigator.clipboard && navigator.clipboard.write) {
        const clipboardItem = new ClipboardItem({
          'image/png': blob
        });
        
        await navigator.clipboard.write([clipboardItem]);
        
        toast({
          title: "Screenshot copiato!",
          description: "L'immagine è stata copiata negli appunti.",
          variant: "default"
        });
      } else {
        // Fallback per browser che non supportano clipboard.write
        const dataUrl = canvas.toDataURL('image/png');
        const img = new Image();
        img.src = dataUrl;
        const w = window.open('');
        if (w && w.document) {
          w.document.write(img.outerHTML);
          w.document.title = 'Screenshot Sessione';
        }
        
        toast({
          title: "Screenshot aperto",
          description: "L'immagine è stata aperta in una nuova finestra.",
          variant: "default"
        });
      }
    } catch (error) {
      console.error("Errore durante la copia dello screenshot:", error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante la copia dello screenshot.",
        variant: "destructive"
      });
    } finally {
      setIsCopying(false);
    }
  };

  const getStrategyDisplayName = (strategy: string) => {
    const strategies = {
      'flat': 'Puntata Fissa',
      'percentage': 'Percentuale',
      'kelly': 'Kelly Criterion',
      'dalembert': "D'Alembert",
      'masaniello': 'Masaniello',
      'profitfall': 'Profit Fall',
      'beat-delay': 'Beat the Delay'
    };
    return strategies[strategy as keyof typeof strategies] || strategy;
  };

  return (
    <div className="space-y-4">
      {/* Controlli per screenshot */}
      <div className="flex items-center gap-2">
        <Button 
          onClick={captureScreenshot}
          disabled={isCapturing || isCopying}
          size="sm"
          className="flex items-center gap-2"
        >
          <Download size={16} />
          {isCapturing ? 'Salvando...' : 'Salva Screenshot'}
        </Button>
        
        <Button 
          onClick={copyToClipboard}
          disabled={isCapturing || isCopying}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <Share2 size={16} />
          {isCopying ? 'Copiando...' : 'Copia negli Appunti'}
        </Button>
      </div>

      {/* Contenuto screenshot */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div 
            ref={screenshotRef} 
            className="bg-white p-6 min-h-[400px]"
            style={{ fontFamily: 'Arial, sans-serif' }}
          >
            {/* Header */}
            <div className="border-b pb-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">
                    Report Sessione Betting
                  </h1>
                  <p className="text-gray-600">{session.name}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">{currentDate}</div>
                  <Badge variant="outline" className="mt-1">
                    {getStrategyDisplayName(session.strategy)}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Statistiche principali */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-xs text-gray-500 mb-1">Bankroll Iniziale</div>
                <div className="font-bold">{formatCurrency(session.initialBankroll)}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-xs text-gray-500 mb-1">Bankroll Attuale</div>
                <div className={`font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(session.currentBankroll)}
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-xs text-gray-500 mb-1">Profitto Netto</div>
                <div className={`font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {netProfit >= 0 ? '+' : ''}{formatCurrency(netProfit)}
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-xs text-gray-500 mb-1">Win Rate</div>
                <div className="font-bold">{winRate.toFixed(1)}%</div>
              </div>
            </div>
            
            {/* Grafico andamento */}
            <div className="mb-4">
              <div className="text-sm font-medium text-gray-700 mb-1">Andamento Bankroll</div>
              <div className="h-32 w-full bg-gray-50 p-2 rounded">
                {safeBets.length > 0 ? (
                  <SparklineChart
                    bets={safeBets}
                    height={120}
                    showTooltip={false}
                    animated={false}
                    lineColor={netProfit >= 0 ? '#22c55e' : '#ef4444'}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    Nessun dato disponibile
                  </div>
                )}
              </div>
            </div>

            {/* Riepilogo performance */}
            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div>
                <div className="font-medium text-gray-700 mb-2">Performance</div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>ROI:</span>
                    <span className={`font-medium ${roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {roi >= 0 ? '+' : ''}{roi.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Scommesse Totali:</span>
                    <span className="font-medium">{session.betCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Vinte:</span>
                    <span className="font-medium text-green-600">{session.wins}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Perse:</span>
                    <span className="font-medium text-red-600">{session.losses}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <div className="font-medium text-gray-700 mb-2">Dettagli Strategia</div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Target Return:</span>
                    <span className="font-medium">{session.targetReturn}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Strategia:</span>
                    <span className="font-medium">{getStrategyDisplayName(session.strategy)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t pt-3 mt-4 text-center">
              <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                <CheckCircle size={12} />
                Generato da Betting Strategies Platform
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}