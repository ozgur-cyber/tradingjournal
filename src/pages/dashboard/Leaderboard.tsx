import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Medal, Crown, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase/config';

interface LeaderboardUser {
  id: string;
  username: string;
  total_pnl: number;
  win_rate: number;
  total_trades: number;
  average_rr?: number;
}

const Leaderboard = () => {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      // En az 10 işlem yapan kullanıcıları getir ve PnL'ye göre sırala
      const { data, error } = await supabase
        .from('users')
        .select('id, username, total_pnl, win_rate, total_trades')
        .gte('total_trades', 10)
        .order('total_pnl', { ascending: false })
        .limit(10);

      if (error) throw error;
      
      if (data && data.length > 0) {
        const userIds = data.map(u => u.id);
        const { data: tradesData } = await supabase
          .from('trades')
          .select('user_id, risk_reward, image_url')
          .in('user_id', userIds);

        const usersWithRR = data.map(user => {
          const userTrades = tradesData?.filter(t => t.user_id === user.id) || [];
          // 10R+ ve fotoğrafsız işlemleri leaderboard hesaplamasından çıkar
          const validTrades = userTrades.filter(t => {
            const rr = Number(t.risk_reward) || 0;
            if (rr >= 10 && !t.image_url) return false; // Fotoğrafsız 10R+ = geçersiz
            return true;
          });
          const totalRR = validTrades.reduce((sum, t) => sum + (Number(t.risk_reward) || 0), 0);
          const avgRR = validTrades.length > 0 ? totalRR / validTrades.length : 0;
          
          // 10R+ fotoğrafsız işlem varsa, o kullanıcının PnL'sini de düzelt
          const invalidTrades = userTrades.filter(t => {
            const rr = Number(t.risk_reward) || 0;
            return rr >= 10 && !t.image_url;
          });
          const hasInvalidTrades = invalidTrades.length > 0;
          
          return { 
            ...user, 
            average_rr: avgRR,
            has_invalid_trades: hasInvalidTrades
          };
        }).filter(u => !u.has_invalid_trades || u.average_rr > 0); // Tamamen geçersiz olanları çıkar

        setUsers(usersWithRR);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error("Leaderboard verisi getirilirken hata:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <Trophy className="w-16 h-16 mx-auto text-yellow-500 mb-4 drop-shadow-[0_0_15px_rgba(234,179,8,0.4)]" />
        <h2 className="text-4xl font-bold text-text-primary mb-3">En İyi Traderlar</h2>
        <p className="text-text-secondary">Platformun en kârlı ve istikrarlı işlem yapan üyeleri. Sıralama en az 10 işlem yapan kullanıcıları kapsar.</p>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="glassmorphism rounded-2xl overflow-hidden shadow-2xl">
          {loading ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-500 mb-4"></div>
              <p className="text-text-secondary">Sıralama hesaplanıyor...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-text-secondary text-lg">Henüz sıralamaya girebilecek (10+ işlem yapan) bir kullanıcı bulunmuyor.</p>
              <p className="text-text-secondary text-sm mt-2 opacity-70">İşlem yapmaya devam ederek liderlik koltuğuna oturabilirsiniz!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-bg-surface-hover dark:bg-black/40 border-b border-border-primary">
                    <th className="p-5 text-xs font-semibold text-text-secondary uppercase tracking-wider w-20 text-center">Sıra</th>
                    <th className="p-5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Trader</th>
                    <th className="p-5 text-xs font-semibold text-text-secondary uppercase tracking-wider text-center hidden sm:table-cell">İşlem</th>
                    <th className="p-5 text-xs font-semibold text-text-secondary uppercase tracking-wider text-center hidden sm:table-cell">Win Rate</th>
                    <th className="p-5 text-xs font-semibold text-text-secondary uppercase tracking-wider text-center hidden md:table-cell">Ort. RR</th>
                    <th className="p-5 text-xs font-semibold text-text-secondary uppercase tracking-wider text-right">Toplam PnL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-primary">
                  {users.map((user, index) => (
                    <tr 
                      key={user.id} 
                      className={`hover:bg-bg-surface-hover dark:hover:bg-white/[0.02] transition-colors ${
                        index === 0 ? 'bg-gradient-to-r from-yellow-500/10 to-transparent' :
                        index === 1 ? 'bg-gradient-to-r from-gray-300/10 to-transparent' :
                        index === 2 ? 'bg-gradient-to-r from-amber-700/10 to-transparent' : ''
                      }`}
                    >
                      <td className="p-5">
                        <div className="flex justify-center">
                          {index === 0 ? <Crown className="w-6 h-6 text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]" /> :
                           index === 1 ? <Medal className="w-6 h-6 text-gray-300 drop-shadow-[0_0_10px_rgba(209,213,219,0.5)]" /> :
                           index === 2 ? <Medal className="w-6 h-6 text-amber-700 drop-shadow-[0_0_10px_rgba(180,83,9,0.5)]" /> :
                           <span className="text-xl font-bold text-text-secondary">#{index + 1}</span>}
                        </div>
                      </td>
                      <td className="p-5">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-lg ${
                            index === 0 ? 'bg-gradient-to-tr from-yellow-400 to-orange-500' :
                            index === 1 ? 'bg-gradient-to-tr from-gray-300 to-gray-500' :
                            index === 2 ? 'bg-gradient-to-tr from-amber-600 to-amber-800' :
                            'bg-bg-surface border border-border-primary text-text-primary'
                          }`}>
                            {user.username?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <Link to={`/profile/${user.username}`} className={`font-bold hover:text-brand-purple transition-colors flex items-center gap-1 group ${index === 0 ? 'text-yellow-500' : 'text-text-primary'}`}>
                              {user.username || 'İsimsiz Trader'}
                              <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity -ml-1 group-hover:ml-0" />
                            </Link>
                            {index === 0 && <p className="text-[10px] text-yellow-500/80 uppercase font-bold tracking-wider">Mevcut Şampiyon</p>}
                          </div>
                        </div>
                      </td>
                      <td className="p-5 text-center hidden sm:table-cell">
                        <span className="text-text-secondary font-medium">{user.total_trades}</span>
                      </td>
                      <td className="p-5 text-center hidden sm:table-cell">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${
                          user.win_rate >= 50 ? 'bg-brand-success/10 text-brand-success' : 'bg-brand-danger/10 text-brand-danger'
                        }`}>
                          %{user.win_rate.toFixed(1)}
                        </span>
                      </td>
                      <td className="p-5 text-center hidden md:table-cell">
                        <span className="text-text-primary font-bold">{user.average_rr ? user.average_rr.toFixed(2) : '0.00'}R</span>
                      </td>
                      <td className="p-5 text-right">
                        <span className="text-xl font-black text-brand-success drop-shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                          +${Number(user.total_pnl).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
