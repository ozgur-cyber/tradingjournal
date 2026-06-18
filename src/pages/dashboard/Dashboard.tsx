import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase/config';
import { TrendingUp, TrendingDown, Target, Activity, Zap } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const { userData, user } = useAuthStore();
  const [chartData, setChartData] = useState<{name: string, pnl: number, tradePnl?: number}[]>([]);
  const [hasTrades, setHasTrades] = useState(true);
  const [avgRR, setAvgRR] = useState(0);
  const [timeFilter, setTimeFilter] = useState<'all' | 'month' | 'week'>('all');
  const [filteredStats, setFilteredStats] = useState({ pnl: 0, winRate: 0, trades: 0, wins: 0 });

  useEffect(() => {
    if (!user) return;
    
    const fetchTrades = async () => {
      let query = supabase
        .from('trades')
        .select('pnl, created_at, risk_reward')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
        
      if (timeFilter === 'month') {
        const firstDay = new Date();
        firstDay.setDate(1);
        firstDay.setHours(0,0,0,0);
        query = query.gte('created_at', firstDay.toISOString());
      } else if (timeFilter === 'week') {
        const firstDay = new Date();
        const day = firstDay.getDay() || 7;
        firstDay.setDate(firstDay.getDate() - day + 1);
        firstDay.setHours(0,0,0,0);
        query = query.gte('created_at', firstDay.toISOString());
      }

      const { data } = await query;
        
      if (data && data.length > 0) {
        let currentPnl = 0;
        let totalRR = 0;
        let rrCount = 0;
        let winCount = 0;
        
        const formattedData = data.map((trade, idx) => {
          currentPnl += Number(trade.pnl);
          if (trade.risk_reward) {
            totalRR += Number(trade.risk_reward);
            rrCount++;
          }
          if (Number(trade.pnl) > 0) winCount++;
          
          let dateStr = '';
          try {
            const date = new Date(trade.created_at);
            if (!isNaN(date.getTime())) {
              dateStr = date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
            } else {
              dateStr = `İşlem ${idx + 1}`;
            }
          } catch (e) {
            dateStr = `İşlem ${idx + 1}`;
          }
          
          return {
            name: dateStr,
            pnl: Number(currentPnl.toFixed(2)),
            tradePnl: Number(trade.pnl)
          };
        });
        
        // Ensure at least 2 points for a line
        if (formattedData.length === 1) {
          setChartData([{ name: 'Başlangıç', pnl: 0, tradePnl: 0 }, ...formattedData]);
        } else {
          setChartData(formattedData);
        }
        setHasTrades(true);
        setAvgRR(rrCount > 0 ? totalRR / rrCount : 0);
        setFilteredStats({ pnl: currentPnl, winRate: (winCount / data.length) * 100, trades: data.length, wins: winCount });
      } else {
        // Mock data for empty state to look beautiful under blur
        setChartData([
          { name: 'Pzt', pnl: 10 },
          { name: 'Sal', pnl: 35 },
          { name: 'Çar', pnl: 20 },
          { name: 'Per', pnl: 65 },
          { name: 'Cum', pnl: 50 },
          { name: 'Cts', pnl: 95 }
        ]);
        setHasTrades(false);
        setAvgRR(0);
        setFilteredStats({ pnl: 0, winRate: 0, trades: 0, wins: 0 });
      }
    };
    
    fetchTrades();
  }, [user, timeFilter]);

  const totalPnL = filteredStats.pnl;
  const winRate = filteredStats.winRate;
  const totalTrades = filteredStats.trades;
  const winTrades = filteredStats.wins;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Genel Bakış</h2>
          <p className="text-text-secondary text-sm mt-1">Platformdaki güncel performans metrikleriniz.</p>
        </div>
        <div className="flex bg-bg-surface-hover rounded-xl p-1 border border-border-primary">
          <button 
            onClick={() => setTimeFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${timeFilter === 'all' ? 'bg-brand-purple text-white shadow-lg' : 'text-text-secondary hover:text-white'}`}
          >
            Tüm Zamanlar
          </button>
          <button 
            onClick={() => setTimeFilter('month')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${timeFilter === 'month' ? 'bg-brand-purple text-white shadow-lg' : 'text-text-secondary hover:text-white'}`}
          >
            Bu Ay
          </button>
          <button 
            onClick={() => setTimeFilter('week')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${timeFilter === 'week' ? 'bg-brand-purple text-white shadow-lg' : 'text-text-secondary hover:text-white'}`}
          >
            Bu Hafta
          </button>
        </div>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* PnL Card */}
        <div className="glassmorphism p-5 rounded-2xl relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-text-secondary text-sm font-medium mb-1">Total PnL</p>
              <h3 className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-brand-success' : 'text-brand-danger'}`}>
                {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
              </h3>
            </div>
            <div className={`p-2 rounded-lg ${totalPnL >= 0 ? 'bg-brand-success/20 text-brand-success' : 'bg-brand-danger/20 text-brand-danger'}`}>
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-text-secondary mt-2">
            İşlem sayınız: {totalTrades}
          </p>
        </div>

        {/* Win Rate Card */}
        <div className="glassmorphism p-5 rounded-2xl relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-text-secondary text-sm font-medium mb-1">Kazanma Oranı (Win Rate)</p>
              <h3 className="text-2xl font-bold text-text-primary">{winRate.toFixed(1)}</h3>
            </div>
            <div className="p-2 bg-brand-blue/20 rounded-lg text-brand-blue">
              <Target className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-brand-success mt-2 flex items-center">
            <TrendingUp className="w-3 h-3 mr-1" />
            {winTrades} Başarılı İşlem
          </p>
        </div>

        {/* Avg RR Card */}
        <div className="glassmorphism p-5 rounded-2xl relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-text-secondary text-sm font-medium mb-1">Toplam RR</p>
              <h3 className="text-2xl font-bold text-text-primary">{avgRR > 0 ? '+' : ''}{avgRR.toFixed(2)}R</h3>
            </div>
            <div className={`p-2 rounded-lg ${avgRR >= 1 ? 'bg-brand-success/20 text-brand-success' : 'bg-brand-warning/20 text-brand-warning'}`}>
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-text-secondary mt-2 flex items-center">
            Tüm işlemlerin ortalaması
          </p>
        </div>
      </div>
      
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="lg:col-span-2 bg-bg-surface border border-border-primary p-0 rounded-2xl min-h-[400px] flex flex-col relative group shadow-sm">
          <div className="flex justify-between items-center p-6 border-b border-border-primary/50">
            <div>
              <h3 className="text-lg font-bold text-text-primary">Kasa Büyümesi (Equity)</h3>
              <p className="text-sm text-text-secondary mt-1">Gerçekleşen tüm işlemlerin kümülatif PnL eğrisi.</p>
            </div>
            <div className="flex items-center space-x-2 bg-brand-success/10 text-brand-success px-3 py-1.5 rounded-full border border-brand-success/20">
              <span className="w-2 h-2 rounded-full bg-brand-success animate-pulse"></span>
              <span className="text-xs font-bold">Canlı Veri</span>
            </div>
          </div>
          
          <div className="flex-1 w-full h-full min-h-[300px] p-6 pt-8 relative">
            {!hasTrades && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-bg-surface/60 backdrop-blur-[3px] rounded-b-2xl">
                <div className="w-16 h-16 bg-brand-purple/20 rounded-full flex items-center justify-center mb-4 border border-brand-purple/30">
                  <TrendingUp className="w-8 h-8 text-brand-purple" />
                </div>
                <h4 className="text-lg font-bold text-text-primary mb-2">Henüz İşlem Yok</h4>
                <p className="text-text-secondary text-sm text-center max-w-xs">
                  İlk işleminizi eklediğinizde kasa büyüme grafiğiniz burada şekillenecektir.
                </p>
              </div>
            )}
            <ResponsiveContainer width="100%" height="100%" className="focus:outline-none" style={{ outline: 'none' }}>
              <AreaChart data={chartData as any} margin={{ top: 20, right: 20, left: 0, bottom: 10 }} style={{ outline: 'none' }}>
                <defs>
                  <linearGradient id="colorPnl" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0}/>
                  </linearGradient>
                  <filter id="shadow" height="200%">
                    <feDropShadow dx="0" dy="10" stdDeviation="10" floodColor="#8B5CF6" floodOpacity="0.4"/>
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" vertical={true} horizontal={true} opacity={0.3} />
                <XAxis 
                  dataKey="name" 
                  stroke="var(--text-secondary)" 
                  fontSize={11} 
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                  minTickGap={20}
                />
                <YAxis 
                  stroke="var(--text-secondary)" 
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `$${val}`}
                  width={55}
                  dx={-5}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                    borderColor: 'var(--border-primary)', 
                    borderRadius: '12px', 
                    color: 'var(--text-primary)',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                    padding: '12px 16px',
                    backdropFilter: 'blur(8px)'
                  }}
                  itemStyle={{ color: '#8B5CF6', fontWeight: 'bold', fontSize: '16px' }}
                  labelStyle={{ color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                  formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Kasa']}
                  cursor={{ stroke: 'rgba(139, 92, 246, 0.5)', strokeWidth: 2, strokeDasharray: '4 4' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="pnl" 
                  stroke="#8B5CF6" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorPnl)" 
                  activeDot={hasTrades ? { r: 6, fill: "#8B5CF6", stroke: "#1E1E2D", strokeWidth: 3, style: { outline: 'none', filter: 'drop-shadow(0px 0px 8px rgba(139,92,246,0.9))' } } : false}
                  style={hasTrades ? { outline: 'none', filter: 'url(#shadow)' } : { outline: 'none' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glassmorphism p-6 rounded-2xl flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-brand-purple/20 rounded-full flex items-center justify-center mb-4 relative overflow-hidden">
             <div className="absolute inset-0 bg-brand-purple/20 animate-ping rounded-full"></div>
             <Activity className="w-8 h-8 text-brand-purple relative z-10" />
          </div>
          <h3 className="text-xl font-bold text-text-primary mb-2">Haftalık Analitik</h3>
          <p className="text-sm text-text-secondary">Yapay zeka asistanı işlem alışkanlıklarınızı analiz ediyor...</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
