import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus, UserCheck, Activity, Target, TrendingUp, DollarSign } from 'lucide-react';
import { supabase } from '@/lib/supabase/config';
import { useSocialStore } from '@/store/socialStore';

interface UserProfile {
  id: string;
  username: string;
  total_pnl: number;
  win_rate: number;
  total_trades: number;
  role: string;
  created_at: string;
}

interface RecentTrade {
  id: string;
  pair: string;
  direction: string;
  pnl: number;
  risk_reward: number;
  created_at: string;
}

const PublicProfile = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [recentTrades, setRecentTrades] = useState<RecentTrade[]>([]);
  const [loading, setLoading] = useState(true);

  const { followedUsers, toggleFollow } = useSocialStore();
  const isFollowing = followedUsers.includes(username || '');

  useEffect(() => {
    if (username) {
      fetchProfile();
    }
  }, [username]);

  const fetchProfile = async () => {
    try {
      // 1. Fetch user stats
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();

      if (userError) throw userError;
      setProfile(userData);

      // 2. Fetch recent public trades
      if (userData) {
        const { data: tradeData, error: tradeError } = await supabase
          .from('trades')
          .select('id, pair, direction, pnl, created_at, risk_reward')
          .eq('user_id', userData.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (!tradeError && tradeData) {
          setRecentTrades(tradeData);
        }
      }
    } catch (error) {
      console.error("Profil getirilirken hata:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-purple"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-20 h-20 bg-bg-surface-hover rounded-full flex items-center justify-center mb-2">
          <Activity className="w-10 h-10 text-text-secondary" />
        </div>
        <h2 className="text-2xl font-bold text-text-primary">Kullanıcı Bulunamadı</h2>
        <p className="text-text-secondary">Aradığınız profil mevcut değil veya silinmiş.</p>
        <button onClick={() => navigate(-1)} className="px-4 py-2 mt-4 bg-brand-purple hover:bg-brand-purple/80 text-white rounded-lg transition-colors">
          Geri Dön
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10 animate-fade-in">
      {/* Header / Banner */}
      <div className="relative glassmorphism rounded-3xl overflow-hidden border border-border-primary">
        <div className="h-32 bg-gradient-to-r from-brand-purple/20 via-brand-blue/20 to-transparent"></div>
        
        <button 
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 p-2 bg-black/30 hover:bg-black/50 text-white rounded-full backdrop-blur-md transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="px-8 pb-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 -mt-12 relative z-10">
            <div className="flex items-end space-x-5">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-brand-purple to-brand-blue flex items-center justify-center text-white font-bold text-4xl shadow-xl border-4 border-bg-primary">
                {profile.username?.charAt(0).toUpperCase()}
              </div>
              <div className="mb-2">
                <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
                  {profile.username}
                  {profile.role === 'Founder' && (
                    <span className="text-yellow-500 text-xs font-bold bg-yellow-500/10 px-2 py-1 rounded-full border border-yellow-500/20">Founder</span>
                  )}
                </h1>
                <p className="text-text-secondary text-sm mt-1">
                  Platforma katılım: {new Date(profile.created_at).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>

            <button 
              onClick={() => toggleFollow(profile.username)}
              className={`px-6 py-2.5 rounded-xl flex items-center gap-2 font-bold transition-all shadow-lg ${
                isFollowing 
                  ? 'bg-bg-surface-hover text-brand-success border border-brand-success/30 hover:bg-bg-surface' 
                  : 'bg-brand-purple text-white hover:bg-brand-purple/90 hover:-translate-y-1'
              }`}
            >
              {isFollowing ? <><UserCheck className="w-5 h-5" /> Takiptesin</> : <><UserPlus className="w-5 h-5" /> Takip Et</>}
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glassmorphism p-6 rounded-2xl border border-border-primary relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <p className="text-text-secondary font-medium">Toplam İşlem</p>
            <div className="p-2 bg-brand-blue/10 rounded-lg text-brand-blue"><Activity className="w-5 h-5" /></div>
          </div>
          <h3 className="text-3xl font-bold text-text-primary">{profile.total_trades || 0}</h3>
        </div>

        <div className="glassmorphism p-6 rounded-2xl border border-border-primary relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <p className="text-text-secondary font-medium">Win Rate</p>
            <div className="p-2 bg-brand-success/10 rounded-lg text-brand-success"><Target className="w-5 h-5" /></div>
          </div>
          <h3 className="text-3xl font-bold text-brand-success">%{(profile.win_rate || 0).toFixed(1)}</h3>
        </div>

        <div className="glassmorphism p-6 rounded-2xl border border-border-primary relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <p className="text-text-secondary font-medium">Toplam PnL</p>
            <div className={`p-2 rounded-lg ${profile.total_pnl >= 0 ? 'bg-brand-success/10 text-brand-success' : 'bg-brand-danger/10 text-brand-danger'}`}>
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <h3 className={`text-3xl font-bold ${profile.total_pnl >= 0 ? 'text-brand-success' : 'text-brand-danger'}`}>
            ${(profile.total_pnl || 0).toFixed(2)}
          </h3>
        </div>
      </div>

      {/* Recent Trades */}
      <div className="glassmorphism p-6 rounded-2xl border border-border-primary">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-6 h-6 text-brand-purple" />
          <h3 className="text-xl font-bold text-text-primary">Son İşlemler</h3>
        </div>

        {recentTrades.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-text-secondary">Kullanıcının henüz halka açık işlemi bulunmuyor.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentTrades.map(trade => (
              <div key={trade.id} className="flex items-center justify-between p-4 bg-bg-surface-hover dark:bg-black/20 rounded-xl border border-border-primary">
                <div className="flex items-center gap-4">
                  <div className={`w-2 h-10 rounded-full ${trade.direction === 'LONG' ? 'bg-brand-success' : 'bg-brand-danger'}`}></div>
                  <div>
                    <h4 className="font-bold text-text-primary flex items-center gap-2">
                      {trade.pair}
                      {trade.risk_reward ? <span className="px-1.5 py-0.5 rounded bg-bg-primary text-[10px] border border-border-primary font-normal text-text-secondary">{trade.risk_reward}R</span> : null}
                    </h4>
                    <p className={`text-xs font-bold ${trade.direction === 'LONG' ? 'text-brand-success' : 'text-brand-danger'}`}>
                      {trade.direction}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className={`font-bold ${trade.pnl >= 0 ? 'text-brand-success' : 'text-brand-danger'}`}>
                    {trade.pnl >= 0 ? '+' : ''}{trade.pnl.toFixed(2)}$
                  </p>
                  <p className="text-xs text-text-secondary">
                    {new Date(trade.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicProfile;
