import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { SessionData, BetData } from '@/types/betting';
import { formatCurrency } from '@/lib/betting-strategies';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface PerformanceDashboardProps {
  session: SessionData;
  bets: BetData[];
}

export default function PerformanceDashboard({ session, bets }: PerformanceDashboardProps) {
  // Stato locale per forzare il re-render
  const [chartKey, setChartKey] = useState(Date.now());
  
  // Forza l'aggiornamento quando cambiano i dati
  useEffect(() => {
    setChartKey(Date.now());
  }, [session, bets.length]);
  
  // Non usiamo useMemo per i dati del grafico per evitare problemi di cache
  const getChartData = () => {
    console.log("Ricalcolo chartData", { 
      betsLength: bets.length, 
      sessionId: session.id,
      initialBankroll: session.initialBankroll,
      currentBankroll: session.currentBankroll
    });
    
    // Dati iniziali
    const data = [
      {
        name: 'Start',
        bankroll: session.initialBankroll,
        target: session.initialBankroll * (1 + session.targetReturn / 100)
      }
    ];
    
    if (bets && bets.length > 0) {
      // Ordina le scommesse per numero progressivo
      const sortedBets = [...bets].sort((a, b) => a.betNumber - b.betNumber);
      
      // Aggiungi ogni scommessa al grafico
      sortedBets.forEach(bet => {
        data.push({
          name: `Bet ${bet.betNumber}`,
          bankroll: bet.bankrollAfter,
          target: session.initialBankroll * (1 + session.targetReturn / 100)
        });
      });
    }
    
    return data;
  };
  
  // Calcola i dati ogni volta che il componente viene renderizzato
  const chartData = getChartData(); 
  
  // Prepara i dati per il grafico a torta senza useMemo
  const getPieData = () => {
    console.log("Ricalcolo pieData", { 
      wins: session.wins, 
      losses: session.losses,
      betCount: session.betCount
    });
    
    return [
      { name: 'Vinte', value: session.wins, color: '#4CAF50' },
      { name: 'Perse', value: session.losses, color: '#E63946' }
    ];
  };
  
  // Calcola i dati ogni volta che il componente viene renderizzato
  const pieData = getPieData(); 
  
  // Formatta gli importi nel tooltip
  const formatTooltipValue = (value: number) => {
    return formatCurrency(value);
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      {/* Grafico: Progresso Verso l'Obiettivo */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-montserrat font-semibold mb-4 text-primary">Progresso Verso l'Obiettivo</h2>
          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer>
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis 
                  tickFormatter={(value) => '€' + value}
                  domain={['auto', 'auto']}
                />
                <Tooltip formatter={formatTooltipValue} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="bankroll"
                  name="Bankroll"
                  stroke="#4CAF50"
                  strokeWidth={2}
                  activeDot={{ r: 8 }}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="target"
                  name="Target"
                  stroke="#FFD700"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      {/* Grafico: Esiti Scommesse */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-montserrat font-semibold mb-4 text-primary">Esiti Scommesse</h2>
          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({name, value}) => `${name}: ${value}`}
                  isAnimationActive={false}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => [value, 'Scommesse']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
