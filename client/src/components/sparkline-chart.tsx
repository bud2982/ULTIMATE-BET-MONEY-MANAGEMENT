import React, { useEffect, useState } from 'react';
import { Line, LineChart, ResponsiveContainer, Tooltip } from 'recharts';
import { BetData } from '@/types/betting';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/betting-strategies';
import { motion } from 'framer-motion';

interface SparklineChartProps {
  bets: BetData[];
  width?: number | string;
  height?: number;
  className?: string;
  lineColor?: string;
  showTooltip?: boolean;
  showRecentBankroll?: boolean;
  showDelta?: boolean;
  animated?: boolean;
}

export default function SparklineChart({
  bets,
  width = '100%',
  height = 60,
  className,
  lineColor = '#3B82F6', // Default to blue-500
  showTooltip = true,
  showRecentBankroll = true,
  showDelta = true,
  animated = true,
}: SparklineChartProps) {
  const [displayBets, setDisplayBets] = useState<BetData[]>([]);
  
  // Prepare the data for the chart
  useEffect(() => {
    if (!animated) {
      setDisplayBets(bets);
      return;
    }
    
    // Reset if we have a different dataset
    if (bets.length === 0) {
      setDisplayBets([]);
      return;
    }
    
    // Animate by gradually adding bets
    if (displayBets.length < bets.length) {
      const timer = setTimeout(() => {
        setDisplayBets(bets.slice(0, displayBets.length + 1));
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [bets, displayBets.length, animated]);
  
  // Don't display anything if there's no data yet
  if (bets.length === 0) {
    return null;
  }
  
  // We use the bankrollAfter property for the chart data
  const chartData = displayBets.map((bet, index) => ({
    index,
    bankroll: bet.bankrollAfter,
  }));
  
  // Get the delta (difference between first and last bankroll)
  const initialBankroll = bets[0].bankrollBefore;
  const currentBankroll = bets[bets.length - 1].bankrollAfter;
  const delta = currentBankroll - initialBankroll;
  const percentageChange = (delta / initialBankroll) * 100;
  const isPositiveTrend = delta >= 0;
  
  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const betIndex = payload[0].payload.index;
      const currentBet = displayBets[betIndex];
      
      return (
        <Card className="shadow-lg">
          <CardContent className="p-2 text-xs">
            <div className="font-medium">Scommessa #{currentBet.betNumber}</div>
            <div>Bankroll: {formatCurrency(currentBet.bankrollAfter)}</div>
            <div>
              Esito: 
              <span className={currentBet.win ? 'text-green-500 ml-1' : 'text-red-500 ml-1'}>
                {currentBet.win ? 'Vinta' : 'Persa'}
              </span>
            </div>
          </CardContent>
        </Card>
      );
    }
    
    return null;
  };
  
  return (
    <div className={cn("w-full", className)}>
      <div className="flex justify-between items-center mb-1 h-5">
        {showRecentBankroll && (
          <div className="text-sm font-medium">
            {formatCurrency(currentBankroll)}
          </div>
        )}
        
        {showDelta && delta !== 0 && (
          <motion.div 
            className={cn(
              "text-xs font-medium rounded-full px-1.5 py-0.5", 
              isPositiveTrend ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
            )}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {isPositiveTrend ? '+' : ''}{formatCurrency(delta)} ({percentageChange.toFixed(1)}%)
          </motion.div>
        )}
      </div>
      
      <ResponsiveContainer width={width} height={height}>
        <LineChart data={chartData}>
          {showTooltip && <Tooltip content={<CustomTooltip />} />}
          <Line 
            type="monotone" 
            dataKey="bankroll" 
            stroke={lineColor}
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
            animationDuration={500}
            animationEasing="ease-out"
            isAnimationActive={true}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}