import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, BarChart3, Target, Zap, Eye } from 'lucide-react';
import SparklineChart from '@/components/sparkline-chart';
import type { SessionData, BetData } from '@/types/betting';

interface TrendSparklinesProps {
  sessions: SessionData[];
  allBets: Record<number, BetData[]>;
  onSessionSelect?: (session: SessionData) => void;
}

interface SessionMetrics {
  session: SessionData;
  bets: BetData[];
  roi: number;
  winRate: number;
  maxDrawdown: number;
  currentStreak: number;
  streakType: 'win' | 'loss';
  trend: 'up' | 'down' | 'stable';
  volatility: 'low' | 'medium' | 'high';
}

export default function TrendSparklines({ 
  sessions, 
  allBets, 
  onSessionSelect 
}: TrendSparklinesProps) {
  const [selectedMetric, setSelectedMetric] = useState<'bankroll' | 'roi' | 'winrate' | 'streak'>('bankroll');
  const [hoveredSession, setHoveredSession] = useState<number | null>(null);
  const [sessionMetrics, setSessionMetrics] = useState<SessionMetrics[]>([]);

  // Calculate metrics for all sessions
  useEffect(() => {
    const metrics: SessionMetrics[] = sessions
      .filter(session => session.id)
      .map(session => {
        const sessionId = session.id!;
        const bets = allBets[sessionId] || [];
        
        // Calculate basic metrics
        const wins = bets.filter(bet => bet.win).length;
        const winRate = bets.length > 0 ? (wins / bets.length) * 100 : 0;
        const roi = session.initialBankroll > 0 
          ? ((session.currentBankroll - session.initialBankroll) / session.initialBankroll) * 100 
          : 0;

        // Calculate streak
        let currentStreak = 0;
        let streakType: 'win' | 'loss' = 'win';
        if (bets.length > 0) {
          const lastBet = bets[bets.length - 1];
          streakType = lastBet.win ? 'win' : 'loss';
          
          // Count consecutive results from the end
          for (let i = bets.length - 1; i >= 0; i--) {
            if (bets[i].win === lastBet.win) {
              currentStreak++;
            } else {
              break;
            }
          }
        }

        // Calculate max drawdown
        let maxBankroll = session.initialBankroll;
        let minBankroll = session.initialBankroll;
        let runningBankroll = session.initialBankroll;
        
        bets.forEach(bet => {
          if (bet.win) {
            runningBankroll += (bet.stake * bet.odds) - bet.stake;
          } else {
            runningBankroll -= bet.stake;
          }
          maxBankroll = Math.max(maxBankroll, runningBankroll);
          minBankroll = Math.min(minBankroll, runningBankroll);
        });

        const maxDrawdown = maxBankroll > minBankroll ? ((maxBankroll - minBankroll) / maxBankroll) * 100 : 0;

        // Determine trend
        let trend: 'up' | 'down' | 'stable' = 'stable';
        if (roi > 2) trend = 'up';
        else if (roi < -2) trend = 'down';

        // Determine volatility
        let volatility: 'low' | 'medium' | 'high' = 'low';
        if (maxDrawdown > 20) volatility = 'high';
        else if (maxDrawdown > 10) volatility = 'medium';

        return {
          session,
          bets,
          roi,
          winRate,
          maxDrawdown,
          currentStreak,
          streakType,
          trend,
          volatility
        };
      });

    setSessionMetrics(metrics);
  }, [sessions, allBets]);

  const formatMetricValue = (metrics: SessionMetrics, metric: string) => {
    switch (metric) {
      case 'bankroll':
        return `€${metrics.session.currentBankroll.toFixed(2)}`;
      case 'roi':
        return `${metrics.roi.toFixed(1)}%`;
      case 'winrate':
        return `${metrics.winRate.toFixed(1)}%`;
      case 'streak':
        return `${metrics.currentStreak} ${metrics.streakType === 'win' ? 'W' : 'L'}`;
      default:
        return '';
    }
  };

  const getVolatilityColor = (volatility: string) => {
    switch (volatility) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp size={14} className="text-green-500" />;
      case 'down': return <TrendingDown size={14} className="text-red-500" />;
      default: return <div className="w-3 h-0.5 bg-gray-400 rounded"></div>;
    }
  };

  const getMetricIcon = (metric: string) => {
    switch (metric) {
      case 'bankroll': return <BarChart3 size={16} />;
      case 'roi': return <TrendingUp size={16} />;
      case 'winrate': return <Target size={16} />;
      case 'streak': return <Zap size={16} />;
      default: return <BarChart3 size={16} />;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 size={20} />
          Interactive Betting Trend Sparklines
        </CardTitle>
        
        <Tabs value={selectedMetric} onValueChange={(value) => setSelectedMetric(value as any)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="bankroll" className="flex items-center gap-1">
              {getMetricIcon('bankroll')}
              Bankroll
            </TabsTrigger>
            <TabsTrigger value="roi" className="flex items-center gap-1">
              {getMetricIcon('roi')}
              ROI
            </TabsTrigger>
            <TabsTrigger value="winrate" className="flex items-center gap-1">
              {getMetricIcon('winrate')}
              Win Rate
            </TabsTrigger>
            <TabsTrigger value="streak" className="flex items-center gap-1">
              {getMetricIcon('streak')}
              Streak
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {sessionMetrics.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <BarChart3 size={48} className="mx-auto mb-4 opacity-50" />
              <p>Nessuna sessione disponibile per l'analisi dei trend</p>
            </div>
          ) : (
            sessionMetrics.map((metrics) => (
              <div
                key={metrics.session.id}
                className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                  hoveredSession === metrics.session.id 
                    ? 'border-blue-300 bg-blue-50 shadow-md' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onMouseEnter={() => setHoveredSession(metrics.session.id || null)}
                onMouseLeave={() => setHoveredSession(null)}
                onClick={() => onSessionSelect?.(metrics.session)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-gray-900">{metrics.session.name}</h3>
                    <Badge variant="outline" className={getVolatilityColor(metrics.volatility)}>
                      {metrics.volatility} volatility
                    </Badge>
                    <Badge variant="outline">
                      {metrics.bets.length} bets
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        {formatMetricValue(metrics, selectedMetric)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {selectedMetric === 'bankroll' && `${metrics.roi.toFixed(1)}% ROI`}
                        {selectedMetric === 'roi' && `€${metrics.session.currentBankroll.toFixed(2)}`}
                        {selectedMetric === 'winrate' && `${metrics.bets.length} bets`}
                        {selectedMetric === 'streak' && `${metrics.winRate.toFixed(1)}% win rate`}
                      </div>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSessionSelect?.(metrics.session);
                      }}
                    >
                      <Eye size={16} />
                    </Button>
                  </div>
                </div>

                <div className="mb-3">
                  <SparklineChart
                    bets={metrics.bets}
                    width="100%"
                    height={80}
                    lineColor={metrics.trend === 'up' ? '#10b981' : metrics.trend === 'down' ? '#ef4444' : '#6b7280'}
                    showTooltip={true}
                    animated={true}
                  />
                </div>

                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      {getTrendIcon(metrics.trend)}
                      {metrics.trend} trend
                    </span>
                    <span>Max Drawdown: {metrics.maxDrawdown.toFixed(1)}%</span>
                    <span>Streak: {metrics.currentStreak} {metrics.streakType}</span>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    {metrics.session.createdAt ? new Date(metrics.session.createdAt).toLocaleDateString() : 'N/A'}
                  </div>
                </div>

                {hoveredSession === metrics.session.id && (
                  <div className="mt-3 p-3 bg-white/90 rounded border text-xs">
                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <div className="font-medium">ROI</div>
                        <div>{metrics.roi.toFixed(1)}%</div>
                      </div>
                      <div>
                        <div className="font-medium">Win Rate</div>
                        <div>{metrics.winRate.toFixed(1)}%</div>
                      </div>
                      <div>
                        <div className="font-medium">Max DD</div>
                        <div>{metrics.maxDrawdown.toFixed(1)}%</div>
                      </div>
                      <div>
                        <div className="font-medium">Strategy</div>
                        <div className="capitalize">{metrics.session.strategy}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}