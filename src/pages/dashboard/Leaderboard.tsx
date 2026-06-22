import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Medal, Crown, ArrowRight, TrendingUp, TrendingDown, ChevronDown, ChevronUp, Activity, Target, Flame, AlertTriangle, Lock } from 'lucide-react';
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
  weighted_score?: number;
  avatar_url?: string;
  win_rate: number;
  total_trades: number;
  average_rr?: number;
  top_pair?: string;
  best_trade?: number;
  worst_trade?: number;
  recent_trend?: ('W' | 'L' | 'B')[];
  has_invalid_trades?: boolean;
  account_size: number;
  country_code: string;
  equity: number;
  gain_percent: number;
  rank: number;
}

const Leaderboard = () => {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [availableMonths, setAvailableMonths] = useState<{value: string, label: string}[]>([]);

  useEffect(() => {
    const months = [{ value: 'all', label: 'Tüm Zamanlar' }];
    const currentDate = new Date();
    const startDate = new Date(2026, 5, 1);
    for (let i = 0; i < 12; i++) {
      const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      if (d < startDate) break;
      const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
      months.push({ value, label });
    }
    setAvailableMonths(months);
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [selectedMonth]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);

      // Ağırlıkları veritabanından çek (varsayılan değerler yedek olarak hazır)
      let maxPnL = 10000;
      let pnlWeight = 0.40;
      let winRateWeight = 0.25;
      let rrWeight = 0.20;
      let consistencyWeight = 0.15;
      let minTrades = 0;

      try {
        const { data: settingsData, error: settingsError } = await supabase
          .from('platform_settings')
          .select('max_pnl, pnl_weight, win_rate_weight, rr_weight, consistency_weight, min_trades')
          .eq('id', 1)
          .single();

        if (!settingsError && settingsData) {
          if (settingsData.max_pnl !== null && settingsData.max_pnl !== undefined) maxPnL = Number(settingsData.max_pnl);
          if (settingsData.pnl_weight !== null && settingsData.pnl_weight !== undefined) pnlWeight = Number(settingsData.pnl_weight);
          if (settingsData.win_rate_weight !== null && settingsData.win_rate_weight !== undefined) winRateWeight = Number(settingsData.win_rate_weight);
          if (settingsData.rr_weight !== null && settingsData.rr_weight !== undefined) rrWeight = Number(settingsData.rr_weight);
          if (settingsData.consistency_weight !== null && settingsData.consistency_weight !== undefined) consistencyWeight = Number(settingsData.consistency_weight);
          if (settingsData.min_trades !== null && settingsData.min_trades !== undefined) minTrades = Number(settingsData.min_trades);
        }
      } catch (err) {
        console.warn("Platform ayarları çekilemedi, varsayılan kurallar kullanılacak:", err);
      }

      // Önce banlı/gizlenmiş kullanıcıları çek
      const { data: excData } = await supabase.from('leaderboard_exclusions').select('user_id');
      const excludedIds = excData?.map(e => e.user_id) || [];

      // Tüm kullanıcıları çek
      let usersData: any[] | null = null;
      let usersError: any = null;

      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, username, avatar_url, is_public, account_size, country_code');
        if (error) throw error;
        usersData = data;
      } catch (err) {
        console.warn("Extended user columns missing, falling back to basic columns:", err);
        const { data, error } = await supabase
          .from('users')
          .select('id, username, avatar_url, is_public');
        if (error) throw error;
        usersData = data;
      }

      let tradesQuery = supabase.from('trades').select('user_id, result, pnl, pair, created_at, risk_reward, image_url');
      
      if (selectedMonth !== 'all') {
        const [year, month] = selectedMonth.split('-');
        const startDate = new Date(Number(year), Number(month) - 1, 1).toISOString();
        const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59).toISOString();
        tradesQuery = tradesQuery.gte('created_at', startDate).lte('created_at', endDate);
      }

      const { data: tradesData, error: tradesError } = await tradesQuery;
      if (tradesError) throw tradesError;

      // İşlemleri user_id bazında grupla
      const userTradesMap = new Map<string, any[]>();
      if (tradesData) {
        tradesData.forEach(t => {
          if (!userTradesMap.has(t.user_id)) userTradesMap.set(t.user_id, []);
          userTradesMap.get(t.user_id)!.push(t);
        });
      }

      if (!usersData) return;

      const validUsers = usersData.filter(u => !excludedIds.includes(u.id) && u.is_public !== false);

      const detailedUsers = validUsers.map(u => {
        const userId = u.id;
        const userTrades = userTradesMap.get(userId) || [];
        const validTrades = userTrades;
        
        const totalPnL = validTrades.reduce((sum, t) => sum + (Number(t.pnl) || 0), 0);
        const totalTrades = validTrades.length;

        // Hiç işlemi olmayanları liderlik tablosunda gösterme veya minimum işlem kriteri kontrolü
        if (totalTrades === 0 || totalTrades < minTrades) return null;

        const winTrades = validTrades.filter(t => t.pnl > 0).length;
        const winRate = totalTrades > 0 ? (winTrades / totalTrades) * 100 : 0;
        
        const totalRR = validTrades.reduce((sum, t) => sum + (Number(t.risk_reward) || 0), 0);
        const avgRR = totalTrades > 0 ? totalRR / totalTrades : 0;
        
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

        // Weighted Score Hesaplaması
        const pnlScore = Math.min((totalPnL / maxPnL) * 100, 100) * pnlWeight;
        const winRateScore = winRate * winRateWeight;
        const rrScore = Math.min(avgRR * 10, 100) * rrWeight;
        const consistencyScore = Math.min(totalTrades * 5, 100) * consistencyWeight;
        const weightedScore = pnlScore + winRateScore + rrScore + consistencyScore;

        const recentTrend = userTrades.slice(0, 5).map(t => t.pnl > 0 ? 'W' : t.pnl < 0 ? 'L' : 'B').reverse() as ('W' | 'L' | 'B')[];

        // Fallbacks if db doesn't have these columns yet or they are empty
        const fallbackAccountSizes: Record<string, number> = {
          'osman': 400000,
          'forexrico': 400000,
          'emre': 200000,
          'admin': 100000
        };
        const fallbackCountryCodes: Record<string, string> = {
          'osman': 'SK',
          'forexrico': 'MY',
          'emre': 'AE',
          'admin': 'TR'
        };

        const accountSize = Number(u.account_size || fallbackAccountSizes[u.username?.toLowerCase()] || 100000);
        const countryCode = String(u.country_code || fallbackCountryCodes[u.username?.toLowerCase()] || 'TR');
        const equity = accountSize + totalPnL;
        const gainPercent = (totalPnL / accountSize) * 100;

        return { 
          id: userId,
          username: u.username || 'Trader',
          avatar_url: u.avatar_url,
          total_pnl: totalPnL,
          weighted_score: weightedScore,
          win_rate: winRate,
          total_trades: totalTrades,
          average_rr: avgRR,
          top_pair: topPair,
          best_trade: bestTrade,
          worst_trade: worstTrade,
          recent_trend: recentTrend,
          has_invalid_trades: false,
          account_size: accountSize,
          country_code: countryCode,
          equity: equity,
          gain_percent: gainPercent
        } as LeaderboardUser;
      }).filter(Boolean) as LeaderboardUser[];

      // Kâra göre sırala (Profit / PnL descending)
      detailedUsers.sort((a, b) => b.total_pnl - a.total_pnl);
      
      const rankedUsers = detailedUsers.map((user, idx) => ({
        ...user,
        rank: idx + 1
      }));

      setUsers(rankedUsers);

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

  const sizeTabs = ['ALL', '10K', '25K', '50K', '100K', '200K'];
  const [activeSizeTab, setActiveSizeTab] = useState<'ALL' | '10K' | '25K' | '50K' | '100K' | '200K'>('ALL');
  const [isLocked, setIsLocked] = useState(true);

  const getFilteredUsers = () => {
    if (activeSizeTab === 'ALL') return users;
    const sizeMap: Record<string, number> = {
      '10K': 10000,
      '25K': 25000,
      '50K': 50000,
      '100K': 100000,
      '200K': 200000
    };
    const targetSize = sizeMap[activeSizeTab];
    return users
      .filter(u => u.account_size === targetSize)
      .map((u, idx) => ({ ...u, rank: idx + 1 }));
  };

  const filteredUsersList = getFilteredUsers();
  const top3 = filteredUsersList.slice(0, 3);
  const remainingUsers = filteredUsersList.slice(3);

  return (
    <div className="space-y-6 animate-fade-in pb-10 max-w-6xl mx-auto">
      {/* Tabs Filter */}
      <div className="flex justify-center space-x-6 border-b border-border-primary/30 pb-3 mb-6">
        {sizeTabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveSizeTab(tab as any)}
            className={`relative pb-2 font-black text-xs sm:text-sm tracking-wider transition-all duration-200 cursor-pointer ${
              activeSizeTab === tab ? 'text-brand-blue scale-105' : 'text-text-secondary hover:text-white'
            }`}
          >
            {tab}
            {activeSizeTab === tab && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-blue rounded-full"></span>
            )}
          </button>
        ))}
      </div>

      {/* Date and Status Bar */}
      <div className="flex items-center space-x-2 text-[11px] font-bold text-text-secondary mb-8">
        <span className="w-2 h-2 rounded-full bg-brand-success"></span>
        <span className="text-white">•</span>
        <span>{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
      </div>

      {loading ? (
        <div className="p-20 text-center flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-purple mb-4"></div>
          <p className="text-text-secondary font-medium">Sıralamalar ve istatistikler hesaplanıyor...</p>
        </div>
      ) : filteredUsersList.length === 0 ? (
        <div className="glassmorphism p-16 text-center rounded-2xl border border-border-primary">
          <Trophy className="w-20 h-20 text-text-secondary/30 mx-auto mb-4" />
          <p className="text-text-primary text-2xl font-bold mb-2">Bu Seviyede Henüz İşlem Yok</p>
          <p className="text-text-secondary text-sm">İlk işlemi siz paylaşarak anında 1. sıraya yerleşebilirsiniz!</p>
        </div>
      ) : (
        <div className="space-y-10">
          {/* PODIUM CARDS FOR TOP 3 */}
          {top3.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              {/* 2nd Place */}
              {top3[1] ? (
                <div className="order-2 md:order-1 glassmorphism rounded-2xl border border-gray-400/30 p-6 flex flex-col justify-between h-[250px] relative overflow-hidden transform hover:-translate-y-1 transition-all shadow-[0_5px_15px_rgba(0,0,0,0.2)]">
                  {/* Rank Header */}
                  <div className="flex justify-between items-start">
                    <Trophy className="w-10 h-10 text-gray-400 drop-shadow-[0_0_8px_rgba(156,163,175,0.4)]" />
                    <span className="text-2xl font-black text-gray-400">2.</span>
                  </div>

                  {/* User Profile */}
                  <div className="my-2">
                    <Link to={`/profile/${top3[1].username}`} className="font-black text-lg text-white hover:text-brand-purple transition-colors truncate block">
                      {top3[1].username}
                    </Link>
                    <div className="flex items-center space-x-1.5 mt-1">
                      <img 
                        src={`https://flagcdn.com/16x12/${(top3[1].country_code || 'tr').toLowerCase()}.png`} 
                        alt={top3[1].country_code} 
                        className="rounded-sm"
                      />
                      <span className="text-[10px] text-text-secondary font-bold uppercase">{top3[1].country_code}</span>
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-2 border-t border-border-primary/30 pt-3">
                    <div>
                      <p className="text-[9px] text-text-secondary uppercase font-bold">Profit</p>
                      <p className="text-xs font-black text-white">${Math.floor(top3[1].total_pnl).toLocaleString('en-US')}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-text-secondary uppercase font-bold">Equity</p>
                      <p className="text-xs font-black text-white">${Math.floor(top3[1].equity).toLocaleString('en-US')}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-text-secondary uppercase font-bold">Gain %</p>
                      <p className={`text-xs font-black ${top3[1].total_pnl >= 0 ? 'text-brand-success' : 'text-brand-danger'}`}>
                        {top3[1].gain_percent >= 0 ? '+' : ''}{top3[1].gain_percent.toFixed(0)}%
                      </p>
                    </div>
                  </div>

                  {/* Footer Banner */}
                  <div className="-mx-6 -mb-6 mt-3 bg-black/40 border-t border-border-primary/30 px-6 py-2.5 flex justify-between items-center text-[10px]">
                    <span className="text-text-secondary font-bold">Account size:</span>
                    <span className="text-white font-black">${top3[1].account_size.toLocaleString('en-US')}</span>
                  </div>
                </div>
              ) : (
                <div className="order-2 md:order-1 h-[250px] border border-border-primary/20 border-dashed rounded-2xl flex items-center justify-center text-text-secondary text-xs">
                  Henüz 2. Sıra Boş
                </div>
              )}

              {/* 1st Place */}
              {top3[0] ? (
                <div className="order-1 md:order-2 glassmorphism rounded-3xl border border-yellow-500/50 p-6 flex flex-col justify-between h-[270px] relative overflow-hidden transform md:-translate-y-4 hover:-translate-y-5 transition-all shadow-[0_10px_25px_rgba(234,179,8,0.15)] z-10">
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-yellow-400 to-orange-500"></div>
                  
                  {/* Rank Header */}
                  <div className="flex justify-between items-start">
                    <Trophy className="w-12 h-12 text-yellow-500 drop-shadow-[0_0_12px_rgba(234,179,8,0.6)]" />
                    <span className="text-3xl font-black text-yellow-500">1.</span>
                  </div>

                  {/* User Profile */}
                  <div className="my-2">
                    <Link to={`/profile/${top3[0].username}`} className="font-black text-xl text-yellow-500 hover:text-yellow-400 transition-colors truncate block">
                      {top3[0].username}
                    </Link>
                    <div className="flex items-center space-x-1.5 mt-1">
                      <img 
                        src={`https://flagcdn.com/16x12/${(top3[0].country_code || 'tr').toLowerCase()}.png`} 
                        alt={top3[0].country_code} 
                        className="rounded-sm"
                      />
                      <span className="text-[10px] text-text-secondary font-bold uppercase">{top3[0].country_code}</span>
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-2 border-t border-border-primary/30 pt-3">
                    <div>
                      <p className="text-[9px] text-text-secondary uppercase font-bold">Profit</p>
                      <p className="text-xs font-black text-white">${Math.floor(top3[0].total_pnl).toLocaleString('en-US')}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-text-secondary uppercase font-bold">Equity</p>
                      <p className="text-xs font-black text-white">${Math.floor(top3[0].equity).toLocaleString('en-US')}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-text-secondary uppercase font-bold">Gain %</p>
                      <p className={`text-xs font-black ${top3[0].total_pnl >= 0 ? 'text-brand-success' : 'text-brand-danger'}`}>
                        {top3[0].gain_percent >= 0 ? '+' : ''}{top3[0].gain_percent.toFixed(0)}%
                      </p>
                    </div>
                  </div>

                  {/* Footer Banner */}
                  <div className="-mx-6 -mb-6 mt-3 bg-black/45 border-t border-border-primary/40 px-6 py-2.5 flex justify-between items-center text-[10px] bg-yellow-500/5">
                    <span className="text-yellow-500/80 font-bold">Account size:</span>
                    <span className="text-white font-black">${top3[0].account_size.toLocaleString('en-US')}</span>
                  </div>
                </div>
              ) : (
                <div className="order-1 md:order-2 h-[270px] border border-border-primary/20 border-dashed rounded-3xl flex items-center justify-center text-text-secondary text-xs">
                  Henüz Lider Yok
                </div>
              )}

              {/* 3rd Place */}
              {top3[2] ? (
                <div className="order-3 md:order-3 glassmorphism rounded-2xl border border-amber-700/40 p-6 flex flex-col justify-between h-[235px] relative overflow-hidden transform hover:-translate-y-1 transition-all shadow-[0_5px_15px_rgba(0,0,0,0.2)]">
                  {/* Rank Header */}
                  <div className="flex justify-between items-start">
                    <Trophy className="w-9 h-9 text-amber-600 drop-shadow-[0_0_8px_rgba(180,83,9,0.4)]" />
                    <span className="text-xl font-black text-amber-600">3.</span>
                  </div>

                  {/* User Profile */}
                  <div className="my-1">
                    <Link to={`/profile/${top3[2].username}`} className="font-black text-base text-white hover:text-brand-purple transition-colors truncate block">
                      {top3[2].username}
                    </Link>
                    <div className="flex items-center space-x-1.5 mt-0.5">
                      <img 
                        src={`https://flagcdn.com/16x12/${(top3[2].country_code || 'tr').toLowerCase()}.png`} 
                        alt={top3[2].country_code} 
                        className="rounded-sm"
                      />
                      <span className="text-[10px] text-text-secondary font-bold uppercase">{top3[2].country_code}</span>
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-2 border-t border-border-primary/30 pt-3">
                    <div>
                      <p className="text-[9px] text-text-secondary uppercase font-bold">Profit</p>
                      <p className="text-xs font-black text-white">${Math.floor(top3[2].total_pnl).toLocaleString('en-US')}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-text-secondary uppercase font-bold">Equity</p>
                      <p className="text-xs font-black text-white">${Math.floor(top3[2].equity).toLocaleString('en-US')}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-text-secondary uppercase font-bold">Gain %</p>
                      <p className={`text-xs font-black ${top3[2].total_pnl >= 0 ? 'text-brand-success' : 'text-brand-danger'}`}>
                        {top3[2].gain_percent >= 0 ? '+' : ''}{top3[2].gain_percent.toFixed(0)}%
                      </p>
                    </div>
                  </div>

                  {/* Footer Banner */}
                  <div className="-mx-6 -mb-6 mt-3 bg-black/40 border-t border-border-primary/30 px-6 py-2.5 flex justify-between items-center text-[10px]">
                    <span className="text-text-secondary font-bold">Account size:</span>
                    <span className="text-white font-black">${top3[2].account_size.toLocaleString('en-US')}</span>
                  </div>
                </div>
              ) : (
                <div className="order-3 md:order-3 h-[235px] border border-border-primary/20 border-dashed rounded-2xl flex items-center justify-center text-text-secondary text-xs">
                  Henüz 3. Sıra Boş
                </div>
              )}
            </div>
          )}

          {/* DETAILED TABLE SECTION */}
          <div className="glassmorphism rounded-2xl overflow-hidden shadow-2xl border border-border-primary/50 relative">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-bg-surface-hover/50 border-b border-border-primary/50">
                    <th className="p-4 text-[10px] font-bold text-text-secondary uppercase tracking-wider w-16 text-center">#</th>
                    <th className="p-4 text-[10px] font-bold text-text-secondary uppercase tracking-wider">Name</th>
                    <th className="p-4 text-[10px] font-bold text-text-secondary uppercase tracking-wider">Profit</th>
                    <th className="p-4 text-[10px] font-bold text-text-secondary uppercase tracking-wider">Equity</th>
                    <th className="p-4 text-[10px] font-bold text-text-secondary uppercase tracking-wider text-center">Gain %</th>
                    <th className="p-4 text-[10px] font-bold text-text-secondary uppercase tracking-wider text-center">Account size</th>
                    <th className="p-4 text-[10px] font-bold text-text-secondary uppercase tracking-wider text-center">Country</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-primary/30">
                  {/* Row 4 (rendered always if exists) */}
                  {remainingUsers[0] && (
                    <tr className="hover:bg-white/[0.01] transition-colors border-b border-border-primary/30">
                      <td className="p-4 text-center text-xs font-bold text-text-secondary">{remainingUsers[0].rank}.</td>
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          {remainingUsers[0].avatar_url ? (
                            <img src={remainingUsers[0].avatar_url} className="w-7 h-7 rounded-full object-cover border border-border-primary" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-brand-purple/20 flex items-center justify-center text-xs font-black text-brand-purple">
                              {remainingUsers[0].username?.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <Link to={`/profile/${remainingUsers[0].username}`} className="font-bold text-sm text-white hover:text-brand-purple transition-colors">
                            {remainingUsers[0].username}
                          </Link>
                        </div>
                      </td>
                      <td className={`p-4 text-sm font-bold ${remainingUsers[0].total_pnl >= 0 ? 'text-brand-success' : 'text-brand-danger'}`}>
                        {remainingUsers[0].total_pnl >= 0 ? '+' : '-'}${Math.abs(remainingUsers[0].total_pnl).toLocaleString('en-US')}
                      </td>
                      <td className="p-4 text-sm font-bold text-white">
                        ${Math.floor(remainingUsers[0].equity).toLocaleString('en-US')}
                      </td>
                      <td className={`p-4 text-center text-sm font-bold ${remainingUsers[0].total_pnl >= 0 ? 'text-brand-success' : 'text-brand-danger'}`}>
                        {remainingUsers[0].gain_percent >= 0 ? '+' : ''}{remainingUsers[0].gain_percent.toFixed(0)}%
                      </td>
                      <td className="p-4 text-center text-sm font-bold text-white">
                        ${remainingUsers[0].account_size.toLocaleString('en-US')}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center space-x-1.5">
                          <img 
                            src={`https://flagcdn.com/16x12/${(remainingUsers[0].country_code || 'tr').toLowerCase()}.png`} 
                            alt={remainingUsers[0].country_code} 
                            className="rounded-sm"
                          />
                          <span className="text-[10px] text-text-secondary font-bold uppercase">{remainingUsers[0].country_code}</span>
                        </div>
                      </td>
                    </tr>
                  )}

                  {/* Remaining Rows (blurred if isLocked is true) */}
                  {remainingUsers.slice(1).map((user) => (
                    <tr 
                      key={user.id} 
                      className={`hover:bg-white/[0.01] transition-colors border-b border-border-primary/30 ${
                        isLocked ? 'filter blur-sm select-none pointer-events-none opacity-20' : ''
                      }`}
                    >
                      <td className="p-4 text-center text-xs font-bold text-text-secondary">{user.rank}.</td>
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          {user.avatar_url ? (
                            <img src={user.avatar_url} className="w-7 h-7 rounded-full object-cover border border-border-primary" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-brand-purple/20 flex items-center justify-center text-xs font-black text-brand-purple">
                              {user.username?.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <Link to={`/profile/${user.username}`} className="font-bold text-sm text-white hover:text-brand-purple transition-colors">
                            {user.username}
                          </Link>
                        </div>
                      </td>
                      <td className={`p-4 text-sm font-bold ${user.total_pnl >= 0 ? 'text-brand-success' : 'text-brand-danger'}`}>
                        {user.total_pnl >= 0 ? '+' : '-'}${Math.abs(user.total_pnl).toLocaleString('en-US')}
                      </td>
                      <td className="p-4 text-sm font-bold text-white">
                        ${Math.floor(user.equity).toLocaleString('en-US')}
                      </td>
                      <td className={`p-4 text-center text-sm font-bold ${user.total_pnl >= 0 ? 'text-brand-success' : 'text-brand-danger'}`}>
                        {user.gain_percent >= 0 ? '+' : ''}{user.gain_percent.toFixed(0)}%
                      </td>
                      <td className="p-4 text-center text-sm font-bold text-white">
                        ${user.account_size.toLocaleString('en-US')}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center space-x-1.5">
                          <img 
                            src={`https://flagcdn.com/16x12/${(user.country_code || 'tr').toLowerCase()}.png`} 
                            alt={user.country_code} 
                            className="rounded-sm"
                          />
                          <span className="text-[10px] text-text-secondary font-bold uppercase">{user.country_code}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Lock Overlay */}
            {isLocked && remainingUsers.length > 1 && (
              <div className="absolute inset-x-0 bottom-0 top-[60px] bg-gradient-to-t from-bg-primary via-bg-primary/80 to-transparent flex flex-col items-center justify-center p-8 z-20">
                <div className="bg-bg-surface border border-border-primary/50 rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl relative overflow-hidden backdrop-blur-md">
                  <div className="flex justify-center mb-4">
                    <span className="p-3 bg-brand-blue/15 text-brand-blue rounded-full border border-brand-blue/20">
                      <Lock className="w-6 h-6" />
                    </span>
                  </div>
                  <h4 className="text-base font-black text-white mb-2">Only For Registered</h4>
                  <p className="text-xs text-text-secondary mb-6 leading-relaxed">
                    Only the registered users can see the full leaderboard in their Client Area.
                  </p>
                  <button 
                    onClick={() => setIsLocked(false)}
                    className="w-full py-3 bg-brand-blue hover:bg-brand-blue/90 text-white font-bold text-xs rounded-xl shadow-lg shadow-brand-blue/20 transition-all cursor-pointer"
                  >
                    Get Started
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
