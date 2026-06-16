import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Medal, Crown, ArrowRight, TrendingUp, TrendingDown, ChevronDown, ChevronUp, Activity, Target, Flame } from 'lucide-react';
import { supabase } from '@/lib/supabase/config';

interface TradeData {
  id: string;
  result: string;
  pnl: number;
  pair: string;
  created_at: string;
  risk_reward: number;
  image_url: string;
}

interface LeaderboardUser {
  id: string;
  username: string;
  total_pnl: number;
  win_rate: number;
  total_trades: number;
  average_rr?: number;
  top_pair?: string;
  best_trade?: number;
  worst_trade?: number;
  recent_trend?: ('W' | 'L' | 'B')[];
}

const Leaderboard = () => {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      // Önce banlı/gizlenmiş kullanıcıları çek
      const { data: excData } = await supabase.from('leaderboard_exclusions').select('user_id');
      const excludedIds = excData?.map(e => e.user_id) || [];

      // 1+ işlem yapanları çek ve PnL'ye göre sırala
      const { data, error } = await supabase
        .from('users')
        .select('id, username, total_pnl, win_rate, total_trades')
        .gte('total_trades', 1)
        .order('total_pnl', { ascending: false });

      if (error) throw error;
      
      // Banlı olanları listeden çıkar ve ilk 20'yi al
      const finalData = data?.filter(u => !excludedIds.includes(u.id)).slice(0, 20) || [];
      
      if (finalData.length > 0) {
        const userIds = finalData.map(u => u.id);
        const { data: tradesData } = await supabase
          .from('trades')
          .select('user_id, result, pnl, pair, created_at, risk_reward, image_url')
          .in('user_id', userIds)
          .order('created_at', { ascending: false });

        const detailedUsers = finalData.map(user => {
          const userTrades = tradesData?.filter(t => t.user_id === user.id) || [];
          
          // 10R+ fotoğrafsız kontrolleri
          const validTrades = userTrades.filter(t => {
            const rr = Number(t.risk_reward) || 0;
            if (rr >= 10 && !t.image_url) return false;
            return true;
          });
          
          const totalRR = validTrades.reduce((sum, t) => sum + (Number(t.risk_reward) || 0), 0);
          const avgRR = validTrades.length > 0 ? totalRR / validTrades.length : 0;
          
          // İstatistikler
          let topPair = '-';
          if (validTrades.length > 0) {
            const pairCounts = validTrades.reduce((acc: any, t) => {
              acc[t.pair] = (acc[t.pair] || 0) + 1;
              return acc;
            }, {});
            topPair = Object.keys(pairCounts).reduce((a, b) => pairCounts[a] > pairCounts[b] ? a : b);
          }

          const pnls = validTrades.map(t => Number(t.pnl) || 0);
          const bestTrade = pnls.length > 0 ? Math.max(...pnls) : 0;
          const worstTrade = pnls.length > 0 ? Math.min(...pnls) : 0;

          const recentTrend = userTrades.slice(0, 5).map(t => t.result === 'WIN' ? 'W' : t.result === 'LOSS' ? 'L' : 'B').reverse() as ('W' | 'L' | 'B')[];

          const hasInvalidTrades = userTrades.some(t => (Number(t.risk_reward) || 0) >= 10 && !t.image_url);

          return { 
            ...user, 
            average_rr: avgRR,
            top_pair: topPair,
            best_trade: bestTrade,
            worst_trade: worstTrade,
            recent_trend: recentTrend,
            has_invalid_trades: hasInvalidTrades
          };
        }).filter(u => !u.has_invalid_trades || u.average_rr > 0);

        setUsers(detailedUsers);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error("Leaderboard verisi getirilirken hata:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleRow = (id: string) => {
    if (expandedRow === id) setExpandedRow(null);
    else setExpandedRow(id);
  };

  const getRankStyle = (index: number) => {
    if (index === 0) return 'from-yellow-400 to-orange-500 shadow-[0_0_20px_rgba(234,179,8,0.3)] border-yellow-500/50';
    if (index === 1) return 'from-gray-300 to-gray-500 shadow-[0_0_20px_rgba(156,163,175,0.3)] border-gray-400/50';
    if (index === 2) return 'from-amber-600 to-amber-800 shadow-[0_0_20px_rgba(180,83,9,0.3)] border-amber-700/50';
    return 'bg-bg-surface-hover border-border-primary text-text-primary';
  };

  const top3 = users.slice(0, 3);
  const remainingUsers = users.slice(3);

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <Trophy className="w-16 h-16 mx-auto text-yellow-500 mb-4 drop-shadow-[0_0_15px_rgba(234,179,8,0.4)]" />
        <h2 className="text-4xl font-black bg-gradient-to-r from-yellow-500 via-amber-400 to-orange-500 bg-clip-text text-transparent mb-3 tracking-tight">
          Şampiyonlar Ligi
        </h2>
        <p className="text-text-secondary text-lg">Platformun en kârlı ve istikrarlı trader'ları. Zirveye tırmanmak için tek 1 işlem bile yeterli!</p>
      </div>

      {loading ? (
        <div className="p-20 text-center flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-purple mb-4"></div>
          <p className="text-text-secondary font-medium">Sıralamalar ve istatistikler hesaplanıyor...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="glassmorphism p-16 text-center rounded-2xl border border-border-primary">
          <Trophy className="w-20 h-20 text-text-secondary/30 mx-auto mb-4" />
          <p className="text-text-primary text-2xl font-bold mb-2">Henüz Kimse Zirveye Çıkmadı</p>
          <p className="text-text-secondary text-sm">İlk işlemi siz paylaşarak anında 1. sıraya yerleşebilirsiniz!</p>
        </div>
      ) : (
        <div className="max-w-6xl mx-auto space-y-12">
          
          {/* PODIUM CARDS FOR TOP 3 */}
          {top3.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end mb-12">
              {/* 2nd Place */}
              {top3[1] && (
                <div className="order-2 md:order-1 glassmorphism rounded-2xl border border-gray-400/30 p-6 flex flex-col items-center text-center relative overflow-hidden transform hover:-translate-y-2 transition-transform h-[280px]">
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-gray-300 to-gray-500"></div>
                  <Medal className="w-12 h-12 text-gray-400 mb-3 drop-shadow-[0_0_10px_rgba(156,163,175,0.5)]" />
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-gray-300 to-gray-500 flex items-center justify-center text-white text-2xl font-black mb-3 shadow-lg">
                    {top3[1].username?.charAt(0).toUpperCase()}
                  </div>
                  <Link to={`/profile/${top3[1].username}`} className="font-bold text-xl hover:text-brand-purple transition-colors">{top3[1].username}</Link>
                  <p className="text-gray-400 text-xs uppercase tracking-widest font-bold mt-1 mb-4">Gümüş Trader</p>
                  <div className="mt-auto w-full">
                    <p className={`text-2xl font-black ${top3[1].total_pnl >= 0 ? 'text-brand-success' : 'text-brand-danger'}`}>
                      {top3[1].total_pnl >= 0 ? '+' : '-'}${Math.abs(Number(top3[1].total_pnl)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-text-secondary font-medium mt-1">Win Rate: %{top3[1].win_rate.toFixed(1)}</p>
                  </div>
                </div>
              )}

              {/* 1st Place */}
              {top3[0] && (
                <div className="order-1 md:order-2 glassmorphism rounded-3xl border border-yellow-500/50 p-8 flex flex-col items-center text-center relative overflow-hidden transform md:-translate-y-6 hover:-translate-y-8 transition-transform shadow-[0_0_40px_rgba(234,179,8,0.15)] z-10 h-[320px]">
                  <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-yellow-400 to-orange-500"></div>
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-yellow-500/20 blur-3xl rounded-full"></div>
                  <Crown className="w-16 h-16 text-yellow-500 mb-2 drop-shadow-[0_0_15px_rgba(234,179,8,0.8)]" />
                  <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-yellow-400 to-orange-500 flex items-center justify-center text-white text-3xl font-black mb-3 shadow-[0_0_20px_rgba(234,179,8,0.4)]">
                    {top3[0].username?.charAt(0).toUpperCase()}
                  </div>
                  <Link to={`/profile/${top3[0].username}`} className="font-black text-2xl text-yellow-500 hover:text-yellow-400 transition-colors">{top3[0].username}</Link>
                  <p className="text-yellow-500/80 text-xs uppercase tracking-widest font-bold mt-1 mb-4 animate-pulse">Şampiyon</p>
                  <div className="mt-auto w-full bg-yellow-500/10 rounded-xl p-3 border border-yellow-500/20">
                    <p className={`text-3xl font-black drop-shadow-[0_0_10px_rgba(16,185,129,0.3)] ${top3[0].total_pnl >= 0 ? 'text-brand-success' : 'text-brand-danger'}`}>
                      {top3[0].total_pnl >= 0 ? '+' : '-'}${Math.abs(Number(top3[0].total_pnl)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                    <div className="flex justify-between items-center mt-2 px-2">
                      <span className="text-xs text-text-secondary font-bold">WR: %{top3[0].win_rate.toFixed(1)}</span>
                      <span className="text-xs text-text-secondary font-bold">{top3[0].total_trades} İşlem</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 3rd Place */}
              {top3[2] && (
                <div className="order-3 md:order-3 glassmorphism rounded-2xl border border-amber-700/30 p-6 flex flex-col items-center text-center relative overflow-hidden transform hover:-translate-y-2 transition-transform h-[260px]">
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-600 to-amber-800"></div>
                  <Medal className="w-10 h-10 text-amber-600 mb-3 drop-shadow-[0_0_10px_rgba(180,83,9,0.5)]" />
                  <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-600 to-amber-800 flex items-center justify-center text-white text-xl font-black mb-3 shadow-lg">
                    {top3[2].username?.charAt(0).toUpperCase()}
                  </div>
                  <Link to={`/profile/${top3[2].username}`} className="font-bold text-lg hover:text-brand-purple transition-colors">{top3[2].username}</Link>
                  <p className="text-amber-600 text-[10px] uppercase tracking-widest font-bold mt-1 mb-4">Bronz Trader</p>
                  <div className="mt-auto w-full">
                    <p className={`text-xl font-black ${top3[2].total_pnl >= 0 ? 'text-brand-success' : 'text-brand-danger'}`}>
                      {top3[2].total_pnl >= 0 ? '+' : '-'}${Math.abs(Number(top3[2].total_pnl)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-text-secondary font-medium mt-1">Win Rate: %{top3[2].win_rate.toFixed(1)}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* DETAILED TABLE */}
          {remainingUsers.length > 0 && (
            <div className="glassmorphism rounded-2xl overflow-hidden shadow-2xl border border-border-primary">
              <div className="p-6 border-b border-border-primary bg-black/20">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-brand-purple" /> 
                  Genel Sıralama & Detaylı Analiz
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-bg-surface-hover border-b border-border-primary">
                      <th className="p-4 text-xs font-semibold text-text-secondary uppercase tracking-wider w-16 text-center">Sıra</th>
                      <th className="p-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">Trader</th>
                      <th className="p-4 text-xs font-semibold text-text-secondary uppercase tracking-wider text-center hidden lg:table-cell">Son 5 İşlem</th>
                      <th className="p-4 text-xs font-semibold text-text-secondary uppercase tracking-wider hidden md:table-cell w-48">Kazanma Oranı (WR)</th>
                      <th className="p-4 text-xs font-semibold text-text-secondary uppercase tracking-wider text-center hidden sm:table-cell">Ort. RR</th>
                      <th className="p-4 text-xs font-semibold text-text-secondary uppercase tracking-wider text-right">Toplam PnL</th>
                      <th className="p-4 text-xs font-semibold text-text-secondary uppercase tracking-wider text-center w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-primary">
                    {remainingUsers.map((user, index) => {
                      const realRank = index + 4; // Top 3 are cards
                      const isExpanded = expandedRow === user.id;

                      return (
                        <React.Fragment key={user.id}>
                          <tr 
                            className={`hover:bg-white/[0.02] transition-colors cursor-pointer group ${isExpanded ? 'bg-white/[0.02]' : ''}`}
                            onClick={() => toggleRow(user.id)}
                          >
                            <td className="p-4 text-center">
                              <span className="text-lg font-bold text-text-secondary group-hover:text-white transition-colors">#{realRank}</span>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-9 h-9 rounded-xl bg-bg-surface border border-border-primary flex items-center justify-center text-text-primary font-bold shadow-sm group-hover:border-brand-purple/50 transition-colors">
                                  {user.username?.charAt(0).toUpperCase() || 'U'}
                                </div>
                                <div className="flex flex-col">
                                  <Link 
                                    to={`/profile/${user.username}`} 
                                    onClick={(e) => e.stopPropagation()}
                                    className="font-bold text-text-primary hover:text-brand-purple transition-colors text-sm"
                                  >
                                    {user.username}
                                  </Link>
                                  <span className="text-[10px] text-text-secondary">{user.total_trades} Toplam İşlem</span>
                                </div>
                              </div>
                            </td>
                            <td className="p-4 text-center hidden lg:table-cell">
                              <div className="flex items-center justify-center gap-1">
                                {user.recent_trend && user.recent_trend.length > 0 ? (
                                  user.recent_trend.map((t, i) => (
                                    <span key={i} className={`w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold ${
                                      t === 'W' ? 'bg-brand-success/20 text-brand-success' :
                                      t === 'L' ? 'bg-brand-danger/20 text-brand-danger' : 'bg-gray-500/20 text-gray-400'
                                    }`}>
                                      {t}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-xs text-text-secondary">-</span>
                                )}
                              </div>
                            </td>
                            <td className="p-4 hidden md:table-cell">
                              <div className="flex flex-col gap-1 w-full max-w-[160px]">
                                <div className="flex justify-between items-end">
                                  <span className="text-xs font-bold text-text-primary">%{user.win_rate.toFixed(1)}</span>
                                </div>
                                <div className="w-full bg-black/40 rounded-full h-1.5 overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full ${user.win_rate >= 50 ? 'bg-brand-success' : 'bg-brand-danger'}`}
                                    style={{ width: `${user.win_rate}%` }}
                                  ></div>
                                </div>
                              </div>
                            </td>
                            <td className="p-4 text-center hidden sm:table-cell">
                              <span className="inline-flex items-center px-2 py-1 bg-brand-blue/10 text-brand-blue border border-brand-blue/20 rounded-md text-xs font-bold">
                                {user.average_rr ? user.average_rr.toFixed(2) : '0.00'}R
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              <span className={`text-base font-black ${user.total_pnl >= 0 ? 'text-brand-success' : 'text-brand-danger'}`}>
                                {user.total_pnl >= 0 ? '+' : '-'}${Math.abs(Number(user.total_pnl)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <button className="text-text-secondary hover:text-white transition-colors p-1">
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            </td>
                          </tr>
                          
                          {/* EXPANDED ROW DETAILS */}
                          {isExpanded && (
                            <tr className="bg-black/20 border-b border-border-primary">
                              <td colSpan={7} className="p-0">
                                <div className="px-6 py-5 animate-fade-in">
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-bg-surface-hover border border-border-primary/50 rounded-xl p-4">
                                      <div className="flex items-center gap-2 mb-2">
                                        <Flame className="w-4 h-4 text-brand-danger" />
                                        <p className="text-[10px] text-text-secondary uppercase tracking-wider font-bold">Favori Parite</p>
                                      </div>
                                      <p className="text-lg font-black text-white">{user.top_pair}</p>
                                    </div>
                                    <div className="bg-bg-surface-hover border border-border-primary/50 rounded-xl p-4">
                                      <div className="flex items-center gap-2 mb-2">
                                        <TrendingUp className="w-4 h-4 text-brand-success" />
                                        <p className="text-[10px] text-text-secondary uppercase tracking-wider font-bold">En İyi İşlem</p>
                                      </div>
                                      <p className="text-lg font-black text-brand-success">+${user.best_trade?.toLocaleString('en-US', {minimumFractionDigits:2})}</p>
                                    </div>
                                    <div className="bg-bg-surface-hover border border-border-primary/50 rounded-xl p-4">
                                      <div className="flex items-center gap-2 mb-2">
                                        <TrendingDown className="w-4 h-4 text-brand-danger" />
                                        <p className="text-[10px] text-text-secondary uppercase tracking-wider font-bold">En Kötü İşlem</p>
                                      </div>
                                      <p className="text-lg font-black text-brand-danger">
                                        {user.worst_trade && user.worst_trade < 0 ? `-$${Math.abs(user.worst_trade).toLocaleString('en-US', {minimumFractionDigits:2})}` : '$0.00'}
                                      </p>
                                    </div>
                                    <div className="bg-bg-surface-hover border border-border-primary/50 rounded-xl p-4 flex flex-col justify-center items-center">
                                      <Link 
                                        to={`/profile/${user.username}`}
                                        className="w-full py-2.5 bg-brand-purple hover:bg-brand-purple/80 text-white text-xs font-bold rounded-lg transition-colors text-center flex items-center justify-center gap-1"
                                      >
                                        Profili İncele <ArrowRight className="w-3 h-3" />
                                      </Link>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
};

export default Leaderboard;