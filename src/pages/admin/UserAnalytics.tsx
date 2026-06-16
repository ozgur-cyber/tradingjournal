import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Users, DollarSign, Target, Award, ArrowUpRight, ArrowDownRight, Search, Activity } from 'lucide-react';
import { supabase } from '@/lib/supabase/config';
import { useAuthStore } from '@/store/authStore';

interface UserAnalytic {
  id: string;
  username: string;
  email: string;
  total_trades: number;
  win_trades: number;
  total_pnl: number;
  win_rate: number;
  created_at: string;
  role: string;
}

const UserAnalytics = () => {
  const { userData, user: currentUser } = useAuthStore();
  const isFounder = userData?.role === 'Founder' || currentUser?.email === 'forexrico16@gmail.com' || currentUser?.email === 'admin@gmail.com';

  const [users, setUsers] = useState<UserAnalytic[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('total_pnl', { ascending: false });

      if (error) throw error;
      setUsers(data as UserAnalytic[]);
    } catch (err) {
      console.error("Analiz verisi getirilirken hata:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.username?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (isFounder && u.email?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const topPnL = users.length > 0 ? users[0] : null;
  const mostActive = [...users].sort((a, b) => (b.total_trades || 0) - (a.total_trades || 0))[0];

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-brand-purple/20 rounded-xl">
            <BarChart3 className="w-8 h-8 text-brand-purple" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Kullanıcı Analitikleri</h2>
            <p className="text-text-secondary text-sm">Tüm üyelerin detaylı işlem performansları ve davranış metrikleri.</p>
          </div>
        </div>
      </div>

      {/* Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glassmorphism p-6 rounded-2xl border border-border-primary relative overflow-hidden group">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-text-secondary font-semibold uppercase tracking-wider text-xs mb-1">En Çok Kazanan (Balina)</p>
              <h3 className="text-2xl font-black text-white">{topPnL?.username || '-'}</h3>
            </div>
            <div className="p-3 bg-brand-success/10 rounded-xl text-brand-success group-hover:scale-110 transition-transform"><Award className="w-6 h-6" /></div>
          </div>
          <div className="flex items-center gap-6">
            <div>
              <p className="text-[10px] text-text-secondary uppercase">Toplam PNL</p>
              <p className="font-bold text-brand-success text-lg">+${(topPnL?.total_pnl || 0).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[10px] text-text-secondary uppercase">Win Rate</p>
              <p className="font-bold text-white text-lg">%{(topPnL?.win_rate || 0).toFixed(1)}</p>
            </div>
          </div>
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-brand-success/5 blur-3xl rounded-full pointer-events-none"></div>
        </div>

        <div className="glassmorphism p-6 rounded-2xl border border-border-primary relative overflow-hidden group">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-text-secondary font-semibold uppercase tracking-wider text-xs mb-1">En Aktif Trader</p>
              <h3 className="text-2xl font-black text-white">{mostActive?.username || '-'}</h3>
            </div>
            <div className="p-3 bg-brand-blue/10 rounded-xl text-brand-blue group-hover:scale-110 transition-transform"><Activity className="w-6 h-6" /></div>
          </div>
          <div className="flex items-center gap-6">
            <div>
              <p className="text-[10px] text-text-secondary uppercase">İşlem Sayısı</p>
              <p className="font-bold text-brand-blue text-lg">{mostActive?.total_trades || 0} İşlem</p>
            </div>
            <div>
              <p className="text-[10px] text-text-secondary uppercase">PnL</p>
              <p className={`font-bold text-lg ${(mostActive?.total_pnl || 0) >= 0 ? 'text-brand-success' : 'text-brand-danger'}`}>
                ${(mostActive?.total_pnl || 0).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-brand-blue/5 blur-3xl rounded-full pointer-events-none"></div>
        </div>
      </div>

      {/* Main Table */}
      <div className="glassmorphism rounded-2xl overflow-hidden border border-border-primary flex flex-col min-h-[500px]">
        <div className="p-6 border-b border-border-primary bg-bg-surface-hover/50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h3 className="font-bold text-white text-lg">Tüm Kullanıcıların Performansı</h3>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input 
              type="text" 
              placeholder="Kullanıcı ara..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/40 border border-border-primary rounded-xl pl-10 pr-4 py-2 text-sm text-text-primary focus:border-brand-purple/50 outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto flex-1">
          {loading ? (
             <div className="p-20 text-center flex flex-col items-center">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-purple mb-4"></div>
               <p className="text-text-secondary">Veriler yükleniyor...</p>
             </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-black/40 border-b border-border-primary">
                  <th className="p-4 text-xs font-semibold text-text-secondary uppercase">Kullanıcı</th>
                  <th className="p-4 text-xs font-semibold text-text-secondary uppercase text-center">İşlem Sayısı</th>
                  <th className="p-4 text-xs font-semibold text-text-secondary uppercase text-center">Win Rate</th>
                  <th className="p-4 text-xs font-semibold text-text-secondary uppercase text-right">Toplam PnL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-primary">
                {filteredUsers.map((user, index) => (
                  <tr key={user.id} className="hover:bg-bg-surface-hover/30 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-brand-surface border border-border-primary flex items-center justify-center font-bold text-text-primary">
                          {user.username?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white flex items-center gap-2">
                            {user.username || 'İsimsiz'}
                            {user.role === 'Founder' && <span className="text-[9px] px-1.5 py-0.5 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded">Founder</span>}
                          </p>
                          <p className="text-xs text-text-secondary">
                            {isFounder ? user.email : '***@***.com'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="font-bold text-white">{user.total_trades || 0}</span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Target className={`w-3.5 h-3.5 ${(user.win_rate || 0) >= 50 ? 'text-brand-success' : 'text-brand-danger'}`} />
                        <span className={`font-bold ${(user.win_rate || 0) >= 50 ? 'text-brand-success' : 'text-brand-danger'}`}>
                          %{(user.win_rate || 0).toFixed(1)}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className={`font-black text-sm flex items-center justify-end gap-1 ${(user.total_pnl || 0) >= 0 ? 'text-brand-success' : 'text-brand-danger'}`}>
                        {(user.total_pnl || 0) >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        {(user.total_pnl || 0) >= 0 ? '+' : ''}${(user.total_pnl || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserAnalytics;