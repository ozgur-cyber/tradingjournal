import React, { useEffect, useState } from 'react';
import { LayoutDashboard, Users, Activity, DollarSign, TrendingUp, TrendingDown, AlertTriangle, ShieldAlert } from 'lucide-react';
import { supabase } from '@/lib/supabase/config';

interface DashboardStats {
  totalUsers: number;
  totalTrades: number;
  totalPnl: number;
  bannedUsers: number;
  winRate: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalTrades: 0,
    totalPnl: 0,
    bannedUsers: 0,
    winRate: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('total_trades, total_pnl, is_banned, win_trades');

      if (usersError) throw usersError;

      let tUsers = 0;
      let tTrades = 0;
      let tPnl = 0;
      let bUsers = 0;
      let tWins = 0;

      if (usersData) {
        tUsers = usersData.length;
        usersData.forEach(u => {
          tTrades += (u.total_trades || 0);
          tPnl += (Number(u.total_pnl) || 0);
          if (u.is_banned) bUsers++;
          tWins += (u.win_trades || 0);
        });
      }

      setStats({
        totalUsers: tUsers,
        totalTrades: tTrades,
        totalPnl: tPnl,
        bannedUsers: bUsers,
        winRate: tTrades > 0 ? (tWins / tTrades) * 100 : 0
      });

    } catch (error) {
      console.error("Dashboard verisi getirilirken hata:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-brand-purple/20 rounded-xl">
          <LayoutDashboard className="w-8 h-8 text-brand-purple" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Raporlama Dashboard</h2>
          <p className="text-text-secondary text-sm">Platformun genel sağlığı ve metrikleri.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-purple"></div>
        </div>
      ) : (
        <>
          {/* Top Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="glassmorphism p-6 rounded-2xl border border-border-primary relative overflow-hidden group">
              <div className="flex justify-between items-start mb-4">
                <p className="text-text-secondary font-semibold uppercase tracking-wider text-xs">Toplam Kullanıcı</p>
                <div className="p-2.5 bg-brand-blue/10 rounded-xl text-brand-blue group-hover:bg-brand-blue/20 transition-colors"><Users className="w-5 h-5" /></div>
              </div>
              <h3 className="text-4xl font-black text-white">{stats.totalUsers}</h3>
              <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-brand-blue/10 blur-2xl rounded-full pointer-events-none"></div>
            </div>

            <div className="glassmorphism p-6 rounded-2xl border border-border-primary relative overflow-hidden group">
              <div className="flex justify-between items-start mb-4">
                <p className="text-text-secondary font-semibold uppercase tracking-wider text-xs">Sistem Hacmi (Pnl)</p>
                <div className={`p-2.5 rounded-xl transition-colors ${stats.totalPnl >= 0 ? 'bg-brand-success/10 text-brand-success group-hover:bg-brand-success/20' : 'bg-brand-danger/10 text-brand-danger group-hover:bg-brand-danger/20'}`}>
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <h3 className={`text-4xl font-black ${stats.totalPnl >= 0 ? 'text-brand-success' : 'text-brand-danger'}`}>
                {stats.totalPnl >= 0 ? '+' : ''}${stats.totalPnl.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </h3>
              <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-brand-success/10 blur-2xl rounded-full pointer-events-none"></div>
            </div>

            <div className="glassmorphism p-6 rounded-2xl border border-border-primary relative overflow-hidden group">
              <div className="flex justify-between items-start mb-4">
                <p className="text-text-secondary font-semibold uppercase tracking-wider text-xs">Toplam İşlem</p>
                <div className="p-2.5 bg-brand-purple/10 rounded-xl text-brand-purple group-hover:bg-brand-purple/20 transition-colors"><Activity className="w-5 h-5" /></div>
              </div>
              <h3 className="text-4xl font-black text-white">{stats.totalTrades}</h3>
              <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-brand-purple/10 blur-2xl rounded-full pointer-events-none"></div>
            </div>

            <div className="glassmorphism p-6 rounded-2xl border border-border-primary relative overflow-hidden group">
              <div className="flex justify-between items-start mb-4">
                <p className="text-text-secondary font-semibold uppercase tracking-wider text-xs">Yasaklı Kullanıcı</p>
                <div className="p-2.5 bg-brand-danger/10 rounded-xl text-brand-danger group-hover:bg-brand-danger/20 transition-colors"><ShieldAlert className="w-5 h-5" /></div>
              </div>
              <h3 className="text-4xl font-black text-brand-danger">{stats.bannedUsers}</h3>
              <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-brand-danger/10 blur-2xl rounded-full pointer-events-none"></div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glassmorphism p-6 rounded-2xl border border-border-primary">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-brand-success" />
                Platform Başarı Oranı
              </h3>
              <div className="flex items-center justify-center py-10">
                <div className="relative w-48 h-48 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="96" cy="96" r="80" className="stroke-current text-bg-surface-hover" strokeWidth="12" fill="transparent" />
                    <circle 
                      cx="96" cy="96" r="80" 
                      className={`stroke-current ${stats.winRate >= 50 ? 'text-brand-success' : 'text-brand-danger'}`} 
                      strokeWidth="12" 
                      fill="transparent" 
                      strokeDasharray={`${2 * Math.PI * 80}`} 
                      strokeDashoffset={`${2 * Math.PI * 80 * (1 - stats.winRate / 100)}`} 
                      strokeLinecap="round" 
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-4xl font-black text-white">{stats.winRate.toFixed(1)}</span>
                    <span className="text-xs text-text-secondary mt-1">Win Rate</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="glassmorphism p-6 rounded-2xl border border-border-primary">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                Sistem Uyarıları
              </h3>
              <div className="space-y-4">
                <div className="p-4 bg-brand-danger/10 border border-brand-danger/20 rounded-xl flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-brand-danger shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-white">Yasaklı Hesap Tespit Edildi</h4>
                    <p className="text-xs text-text-secondary mt-1">Sistemde toplam {stats.bannedUsers} adet yasaklı (banlanmış) kullanıcı bulunuyor. Güvenlik kayıtlarını inceleyin.</p>
                  </div>
                </div>
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-white">Leaderboard Exclusions Kontrolü</h4>
                    <p className="text-xs text-text-secondary mt-1">Sıralamadan atılan (soft-ban) kullanıcıları "Moderation" sekmesinden periyodik olarak kontrol etmeyi unutmayın.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;