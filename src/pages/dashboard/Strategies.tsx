import React, { useEffect, useState } from 'react';
import { Target, Activity, Percent, TrendingUp, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/config';
import { useAuthStore } from '@/store/authStore';

interface StrategyStat {
  id?: string;
  name: string;
  totalTrades: number;
  winTrades: number;
  totalPnl: number;
  winRate: number;
  isCustom: boolean;
}

const Strategies = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<StrategyStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [newStrategyName, setNewStrategyName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (user) {
      fetchStrategyStats();
    }
  }, [user]);

  const fetchStrategyStats = async () => {
    try {
      // 1. Fetch custom strategies
      const { data: customData, error: customError } = await supabase
        .from('strategies')
        .select('id, name')
        .eq('user_id', user?.id);

      if (customError) throw customError;

      // 2. Fetch trades
      const { data: tradesData, error: tradesError } = await supabase
        .from('trades')
        .select('strategy, pnl')
        .eq('user_id', user?.id);

      if (tradesError) throw tradesError;

      const strategyMap: Record<string, StrategyStat> = {};

      // Initialize with custom strategies
      if (customData) {
        customData.forEach(s => {
          strategyMap[s.name] = {
            id: s.id,
            name: s.name,
            totalTrades: 0,
            winTrades: 0,
            totalPnl: 0,
            winRate: 0,
            isCustom: true
          };
        });
      }

      // Populate from trades
      if (tradesData) {
        tradesData.forEach((trade) => {
          const sName = trade.strategy || 'Belirtilmemiş';
          if (!strategyMap[sName]) {
            strategyMap[sName] = {
              name: sName,
              totalTrades: 0,
              winTrades: 0,
              totalPnl: 0,
              winRate: 0,
              isCustom: false
            };
          }

          strategyMap[sName].totalTrades += 1;
          strategyMap[sName].totalPnl += Number(trade.pnl);
          if (trade.pnl > 0) {
            strategyMap[sName].winTrades += 1;
          }
        });
      }

      // Calculate win rates
      const statsArray = Object.values(strategyMap).map(s => {
        s.winRate = s.totalTrades > 0 ? (s.winTrades / s.totalTrades) * 100 : 0;
        return s;
      });

      // Sort by total trades descending
      statsArray.sort((a, b) => b.totalTrades - a.totalTrades);

      setStats(statsArray);
    } catch (error) {
      console.error("Strateji verileri getirilirken hata:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStrategy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStrategyName.trim() || !user) return;
    
    setIsAdding(true);
    try {
      const { error } = await supabase
        .from('strategies')
        .insert([{ user_id: user.id, name: newStrategyName.trim() }]);
        
      if (error) throw error;
      setNewStrategyName('');
      await fetchStrategyStats();
    } catch (err) {
      console.error("Strateji eklenirken hata:", err);
      alert("Strateji eklenemedi.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteStrategy = async (id: string) => {
    if (!confirm("Bu stratejiyi silmek istediğinize emin misiniz? (Geçmiş işlemleriniz silinmez)")) return;
    
    try {
      const { error } = await supabase
        .from('strategies')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      await fetchStrategyStats();
    } catch (err) {
      console.error("Strateji silinirken hata:", err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Strateji Analizi</h2>
          <p className="text-text-secondary text-sm mt-1">Stratejilerinizi yönetin ve hangisinin daha çok kazandırdığını keşfedin.</p>
        </div>
      </div>

      {/* Add Strategy Form */}
      <div className="glassmorphism p-6 rounded-2xl">
        <form onSubmit={handleAddStrategy} className="flex gap-4">
          <input 
            type="text" 
            value={newStrategyName}
            onChange={(e) => setNewStrategyName(e.target.value)}
            placeholder="Yeni strateji adı (Örn: RSI Uyumsuzluk)"
            className="flex-1 bg-bg-primary border border-border-primary rounded-lg p-3 text-text-primary placeholder-text-secondary focus:border-brand-purple/50 outline-none"
            maxLength={30}
          />
          <button 
            type="submit"
            disabled={isAdding || !newStrategyName.trim()}
            className="px-6 py-3 bg-brand-purple hover:bg-brand-purple/80 text-white font-bold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isAdding ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                Ekle
              </>
            )}
          </button>
        </form>
      </div>

      {loading ? (
        <div className="p-12 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-purple mx-auto mb-4"></div>
          <p className="text-text-secondary">Stratejileriniz analiz ediliyor...</p>
        </div>
      ) : stats.length === 0 ? (
        <div className="glassmorphism p-12 rounded-2xl text-center">
          <Target className="w-16 h-16 text-text-secondary mx-auto mb-4 opacity-50" />
          <p className="text-text-secondary text-lg">Henüz hiç işlem kaydetmediniz.</p>
          <p className="text-text-secondary text-sm mt-2 opacity-70">İşlem ekledikçe strateji başarı oranlarınız burada belirecek.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats.map((stat, index) => (
            <div key={index} className="glassmorphism rounded-2xl overflow-hidden hover:border-brand-purple/30 transition-all group relative">
              <div className="p-6 relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-purple/10 to-brand-blue/10 flex items-center justify-center border border-border-primary group-hover:scale-110 transition-transform">
                    <Target className="w-6 h-6 text-brand-purple" />
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      stat.totalPnl >= 0 ? 'bg-brand-success/10 text-brand-success border-brand-success/20' : 'bg-brand-danger/10 text-brand-danger border-brand-danger/20'
                    }`}>
                      {stat.totalPnl >= 0 ? '+' : ''}${stat.totalPnl.toFixed(2)}
                    </div>
                    {stat.isCustom && stat.id && (
                      <button 
                        onClick={() => handleDeleteStrategy(stat.id!)}
                        className="text-gray-500 hover:text-brand-danger transition-colors p-1"
                        title="Stratejiyi Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  {stat.name}
                  {stat.isCustom && <span className="text-[10px] bg-brand-blue/20 text-brand-blue px-2 py-0.5 rounded border border-brand-blue/30">Özel</span>}
                </h3>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Kazanma Oranı</span>
                      <span className="text-white font-bold">{stat.winRate.toFixed(1)}</span>
                    </div>
                    <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${stat.winRate > 50 ? 'bg-brand-success' : stat.winRate > 30 ? 'bg-yellow-500' : 'bg-brand-danger'}`}
                        style={{ width: `${stat.winRate}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex justify-between pt-4 border-t border-white/5">
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-500">Kullanım Sayısı</span>
                      <span className="text-sm font-bold text-white flex items-center mt-1">
                        <Activity className="w-4 h-4 text-gray-400 mr-1" />
                        {stat.totalTrades} İşlem
                      </span>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-xs text-gray-500">Başarılı İşlem</span>
                      <span className="text-sm font-bold text-brand-success flex items-center justify-end mt-1">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        {stat.winTrades}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Background glow */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-purple/5 blur-3xl rounded-full group-hover:bg-brand-purple/10 transition-colors pointer-events-none"></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Strategies;
