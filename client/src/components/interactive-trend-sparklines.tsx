import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, BarChart3, Target, Zap, Eye } from 'lucide-react';
import type { SessionData, BetData } from '@/types/betting';

interface InteractiveTrendSparklinesProps {
  sessions: SessionData[];
  allBets: Record<number, BetData[]>;
  onSessionSelect?: (session: SessionData) => void;
}

interface TrendPoint {
  x: number;
  y: number;
  bet: BetData;
  isWin: boolean;
  bankroll: number;
  stake: number;
}

interface SparklineData {
  session: SessionData;
  points: TrendPoint[];
  trend: 'up' | 'down' | 'stable';
  volatility: 'low' | 'medium' | 'high';
  roi: number;
  winRate: number;
  maxDrawdown: number;
  currentStreak: number;
  streakType: 'win' | 'loss';
}

export default function InteractiveTrendSparklines({ 
  sessions, 
  allBets, 
  onSessionSelect 
}: InteractiveTrendSparklinesProps) {
  // Componente temporaneamente disabilitato per risolvere errori DOM
  return (
    <div className="bg-white p-6 rounded-lg border">
      <h3 className="text-lg font-medium mb-4">Analisi Trend Sessioni</h3>
      <div className="text-center py-8 text-gray-500">
        <p>Funzionalità temporaneamente disabilitata</p>
        <p className="text-sm">Sarà riattivata dopo ottimizzazioni</p>
      </div>
    </div>
  );

  // Codice originale commentato
  /*
  const [selectedMetric, setSelectedMetric] = useState<'bankroll' | 'roi' | 'winrate' | 'streak'>('bankroll');
  const [hoveredSession, setHoveredSession] = useState<number | null>(null);
  const [sparklineData, setSparklineData] = useState<SparklineData[]>([]);
  const canvasRefs = useRef<Record<number, HTMLCanvasElement | null>>({});

  // Process sessions into sparkline data
  useEffect(() => {
    const processedData: SparklineData[] = sessions
      .filter(session => session.id)
      .map((session, index) => {
        const sessionId = session.id;
        if (!sessionId) return null;
        
        const bets = allBets[sessionId] || [];
        const points: TrendPoint[] = [];
        
        let runningBankroll = session.initialBankroll;
        let maxBankroll = session.initialBankroll;
        let minBankroll = session.initialBankroll;
        let wins = 0;
        let currentStreak = 0;
        let streakType: 'win' | 'loss' = 'win';
        let lastResult: boolean | null = null;

        bets.forEach((bet: any, index: number) => {
          const isWin = bet.result === 'win';
          if (isWin) {
            runningBankroll += (bet.stake * bet.odds) - bet.stake;
            wins++;
          } else {
            runningBankroll -= bet.stake;
          }

          // Track streak
          if (lastResult === null || lastResult === isWin) {
            currentStreak++;
          } else {
            currentStreak = 1;
          }
          streakType = isWin ? 'win' : 'loss';
          lastResult = isWin;

          maxBankroll = Math.max(maxBankroll, runningBankroll);
          minBankroll = Math.min(minBankroll, runningBankroll);

          points.push({
            x: index,
            y: runningBankroll,
            bet,
            isWin,
            bankroll: runningBankroll,
            stake: bet.stake
          });
        });

        // Calculate metrics
        const roi = ((session.currentBankroll - session.initialBankroll) / session.initialBankroll) * 100;
        const winRate = bets.length > 0 ? (wins / bets.length) * 100 : 0;
        const maxDrawdown = maxBankroll > minBankroll ? ((maxBankroll - minBankroll) / maxBankroll) * 100 : 0;
        
        // Determine trend
        let trend: 'up' | 'down' | 'stable' = 'stable';
        if (points.length >= 2) {
          const firstPoint = points[0];
          const lastPoint = points[points.length - 1];
          const change = ((lastPoint.y - firstPoint.y) / firstPoint.y) * 100;
          if (change > 2) trend = 'up';
          else if (change < -2) trend = 'down';
        }

        // Determine volatility based on bankroll swings
        let volatility: 'low' | 'medium' | 'high' = 'low';
        if (maxDrawdown > 20) volatility = 'high';
        else if (maxDrawdown > 10) volatility = 'medium';

        return {
          session,
          points,
          trend,
          volatility,
          roi,
          winRate,
          maxDrawdown,
          currentStreak,
          streakType
        };
      })
      .filter((data): data is SparklineData => data !== null);

    setSparklineData(processedData);
  }, [sessions, allBets]);

  // Draw sparkline on canvas
  const drawSparkline = (canvas: HTMLCanvasElement, data: SparklineData, metric: string) => {
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    if (!ctx || data.points.length === 0) return;

    const { width, height } = canvas;
    const padding = 10;
    const plotWidth = width - 2 * padding;
    const plotHeight = height - 2 * padding;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Get values based on selected metric
    const values = data.points.map(point => {
      switch (metric) {
        case 'roi':
          return ((point.bankroll - data.session.initialBankroll) / data.session.initialBankroll) * 100;
        case 'winrate':
          const betIndex = data.points.indexOf(point);
          const wins = data.points.slice(0, betIndex + 1).filter(p => p.isWin).length;
          return (wins / (betIndex + 1)) * 100;
        case 'streak':
          return point.isWin ? 1 : -1;
        default:
          return point.bankroll;
      }
    });

    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const range = maxValue - minValue || 1;

    // Draw background
    ctx.fillStyle = data.trend === 'up' ? '#f0f9ff' : data.trend === 'down' ? '#fef2f2' : '#f9fafb';
    ctx.fillRect(0, 0, width, height);

    // Draw grid lines
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 0.5;
    ctx.setLineDash([2, 2]);
    for (let i = 1; i < 4; i++) {
      const y = padding + (plotHeight * i / 4);
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Draw sparkline
    if (data.points.length > 1) {
      ctx.strokeStyle = data.trend === 'up' ? '#10b981' : data.trend === 'down' ? '#ef4444' : '#6b7280';
      ctx.lineWidth = 2;
      ctx.beginPath();

      data.points.forEach((point, index) => {
        const x = padding + (index / (data.points.length - 1)) * plotWidth;
        const y = padding + plotHeight - ((values[index] - minValue) / range) * plotHeight;
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();

      // Draw win/loss points
      data.points.forEach((point, index) => {
        const x = padding + (index / (data.points.length - 1)) * plotWidth;
        const y = padding + plotHeight - ((values[index] - minValue) / range) * plotHeight;
        
        ctx.fillStyle = point.isWin ? '#10b981' : '#ef4444';
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fill();
      });
    }

    // Draw trend arrow
    const arrowSize = 8;
    const arrowX = width - padding - arrowSize;
    const arrowY = padding + arrowSize;
    
    ctx.fillStyle = data.trend === 'up' ? '#10b981' : data.trend === 'down' ? '#ef4444' : '#6b7280';
    ctx.beginPath();
    if (data.trend === 'up') {
      ctx.moveTo(arrowX, arrowY + arrowSize);
      ctx.lineTo(arrowX + arrowSize, arrowY + arrowSize);
      ctx.lineTo(arrowX + arrowSize/2, arrowY);
    } else if (data.trend === 'down') {
      ctx.moveTo(arrowX, arrowY);
      ctx.lineTo(arrowX + arrowSize, arrowY);
      ctx.lineTo(arrowX + arrowSize/2, arrowY + arrowSize);
    } else {
      ctx.moveTo(arrowX, arrowY + arrowSize/2);
      ctx.lineTo(arrowX + arrowSize, arrowY + arrowSize/2);
    }
    ctx.closePath();
    ctx.fill();
  };

  // Update canvas when data changes
  useEffect(() => {
    sparklineData.forEach(data => {
      if (data.session.id) {
        const canvas = canvasRefs.current[data.session.id];
        if (canvas) {
          drawSparkline(canvas, data, selectedMetric);
        }
      }
    });
  }, [sparklineData, selectedMetric]);

  const getMetricIcon = (metric: string) => {
    switch (metric) {
      case 'bankroll': return <BarChart3 size={16} />;
      case 'roi': return <TrendingUp size={16} />;
      case 'winrate': return <Target size={16} />;
      case 'streak': return <Zap size={16} />;
      default: return <BarChart3 size={16} />;
    }
  };

  const formatMetricValue = (data: SparklineData, metric: string) => {
    switch (metric) {
      case 'bankroll':
        return `€${data.session.currentBankroll.toFixed(2)}`;
      case 'roi':
        return `${data.roi.toFixed(1)}%`;
      case 'winrate':
        return `${data.winRate.toFixed(1)}%`;
      case 'streak':
        return `${data.currentStreak} ${data.streakType === 'win' ? 'W' : 'L'}`;
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
          {sparklineData.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <BarChart3 size={48} className="mx-auto mb-4 opacity-50" />
              <p>Nessuna sessione disponibile per l'analisi dei trend</p>
            </div>
          ) : (
            sparklineData.map((data) => (
              <div
                key={data.session.id}
                className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                  hoveredSession === data.session.id 
                    ? 'border-blue-300 bg-blue-50 shadow-md' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onMouseEnter={() => setHoveredSession(data.session.id)}
                onMouseLeave={() => setHoveredSession(null)}
                onClick={() => onSessionSelect?.(data.session)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-gray-900">{data.session.name}</h3>
                    <Badge variant="outline" className={getVolatilityColor(data.volatility)}>
                      {data.volatility} volatility
                    </Badge>
                    <Badge variant="outline">
                      {data.points.length} bets
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        {formatMetricValue(data, selectedMetric)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {selectedMetric === 'bankroll' && `${data.roi.toFixed(1)}% ROI`}
                        {selectedMetric === 'roi' && `€${data.session.currentBankroll.toFixed(2)}`}
                        {selectedMetric === 'winrate' && `${data.points.length} bets`}
                        {selectedMetric === 'streak' && `${data.winRate.toFixed(1)}% win rate`}
                      </div>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSessionSelect?.(data.session);
                      }}
                    >
                      <Eye size={16} />
                    </Button>
                  </div>
                </div>

                <div className="relative">
                  <canvas
                    ref={(el) => canvasRefs.current[data.session.id] = el}
                    width={800}
                    height={120}
                    className="w-full h-[120px] rounded border"
                    style={{ maxWidth: '100%' }}
                  />
                  
                  {hoveredSession === data.session.id && (
                    <div className="absolute top-2 left-2 bg-white/90 p-2 rounded shadow-lg text-xs">
                      <div className="grid grid-cols-2 gap-2">
                        <div>ROI: {data.roi.toFixed(1)}%</div>
                        <div>Win Rate: {data.winRate.toFixed(1)}%</div>
                        <div>Max DD: {data.maxDrawdown.toFixed(1)}%</div>
                        <div>Streak: {data.currentStreak} {data.streakType}</div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between mt-3 text-sm text-gray-600">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      {data.trend === 'up' ? <TrendingUp size={14} className="text-green-500" /> : 
                       data.trend === 'down' ? <TrendingDown size={14} className="text-red-500" /> : 
                       <div className="w-3 h-0.5 bg-gray-400 rounded"></div>}
                      {data.trend} trend
                    </span>
                    <span>Max Drawdown: {data.maxDrawdown.toFixed(1)}%</span>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    {new Date(data.session.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
  */
}