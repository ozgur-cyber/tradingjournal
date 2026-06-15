import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase/config';
import { TrendingUp, TrendingDown, Target, Activity, Zap } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const { userData, user } = useAuthStore();
  const [chartData, setChartData] = useState<{name: string, pnl: number, tradePnl?: number}[]>([]);
  const [hasTrades, setHasTrades] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    const fetchTrades = async () => {
      const { data } = await supabase
        .from('trades')
        .select('pnl, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
        
      if (data && data.length > 0) {
        let currentPnl = 0;
        const formattedData = data.map((trade, idx) => {
          currentPnl += Number(trade.pnl);
          
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
      }
    };
    
    fetchTrades();
  }, [user]);

  const totalPnL = userData?.total_pnl || 0;
  const winRate = userData?.win_rate || 0;
  const totalTrades = userData?.total_trades || 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Genel Bakış</h2>
          <p className="text-text-secondary text-sm mt-1">Platformdaki güncel performans metrikleriniz.</p>
        </div>
        <div className="flex items-center space-x-2 bg-brand-success/10 text-brand-success px-3 py-1.5 rounded-lg border border-brand-success/20">
          <span className="w-2 h-2 rounded-full bg-brand-success animate-pulse"></span>
          <span className="text-xs font-bold">Sezon 1 Aktif</span>
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
              <h3 className="text-2xl font-bold text-text-primary">%{winRate.toFixed(1)}</h3>
            </div>
            <div className="p-2 bg-brand-blue/20 rounded-lg text-brand-blue">
              <Target className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-brand-success mt-2 flex items-center">
            <TrendingUp className="w-3 h-3 mr-1" />
            {(userData?.win_trades || 0)} Başarılı İşlem
          </p>
        </div>

        {/* Avg RR Card */}
        <div className="glassmorphism p-5 rounded-2xl relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-text-secondary text-sm font-medium mb-1">Ortalama RR</p>
              <h3 className="text-2xl font-bold text-text-primary">2.4</h3>
            </div>
            <div className="p-2 bg-brand-success/20 rounded-lg text-brand-success">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-text-secondary mt-2 flex items-center">
            Hedeflenen RR (Yakında)
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
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData as any} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPnl" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.05}/>
                  </linearGradient>
                  <filter id="shadow" height="200%">
                    <feDropShadow dx="0" dy="10" stdDeviation="10" floodColor="#8B5CF6" floodOpacity="0.3"/>
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="var(--border-primary)" vertical={false} opacity={0.6} />
                <XAxis 
                  dataKey="name" 
                  stroke="var(--text-secondary)" 
                  fontSize={12} 
                  tickLine={false}
                  axisLine={false}
                  padding={{ left: 20, right: 20 }}
                  dy={10}
                />
                <YAxis 
                  stroke="var(--text-secondary)" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `$${val}`}
                  dx={-10}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--bg-surface)', 
                    borderColor: 'var(--border-primary)', 
                    borderRadius: '16px', 
                    color: 'var(--text-primary)',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                    padding: '12px 16px'
                  }}
                  itemStyle={{ color: '#8B5CF6', fontWeight: 'bold', fontSize: '16px' }}
                  labelStyle={{ color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                  formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Kasa']}
                  cursor={{ stroke: 'var(--border-primary)', strokeWidth: 2, strokeDasharray: '4 4' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="pnl" 
                  stroke="#8B5CF6" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorPnl)" 
                  activeDot={hasTrades ? { r: 8, fill: "#8B5CF6", stroke: "var(--bg-surface)", strokeWidth: 3, style: { filter: 'drop-shadow(0px 0px 8px rgba(139,92,246,0.8))' } } : false}
                  style={hasTrades ? { filter: 'url(#shadow)' } : undefined}
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
