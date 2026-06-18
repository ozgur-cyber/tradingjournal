import React, { useEffect, useState } from 'react';
import { Users, MessageSquare, Heart, Rocket, UserPlus, UserCheck, Send, TrendingUp, TrendingDown, BarChart3, Target, Clock, Flame, Trophy, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase/config';
import { useSocialStore } from '@/store/socialStore';
import { useAuthStore } from '@/store/authStore';
import { db } from '@/lib/firebase/config';
import { collection, onSnapshot, addDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';

interface SocialTrade {
  id: string;
  username: string;
  pair: string;
  direction: string;
  strategy: string;
  notes: string;
  pnl: number;
  created_at: string;
  entry_price?: number;
  exit_price?: number;
  lot_size?: number;
  image_url?: string;
  users?: {
    role: string;
    avatar_url?: string;
  };
}

const Social = () => {
  const [trades, setTrades] = useState<SocialTrade[]>([]);
  const [loading, setLoading] = useState(true);

  const { followedUsers } = useSocialStore();
  const [filterFollowing, setFilterFollowing] = useState(false);

  useEffect(() => {
    fetchFeed();
  }, []);

  const fetchFeed = async () => {
    try {
      setLoading(true);
      const { data: tradesData, error: tradesError } = await supabase
        .from('trades')
        .select('*').eq('isPublic', true)
        .order('created_at', { ascending: false })
        .limit(30);

      if (tradesError) throw tradesError;
      
      if (tradesData && tradesData.length > 0) {
        const userIds = [...new Set(tradesData.map(t => t.user_id))];
        const { data: usersData } = await supabase
          .from('users')
          .select('id, role, avatar_url')
          .in('id', userIds);

        const enrichedTrades = tradesData.map(trade => {
          const user = usersData?.find(u => u.id === trade.user_id);
          return {
            ...trade,
            users: user ? { role: user.role, avatar_url: user.avatar_url } : { role: 'USER' }
          };
        });

        setTrades(enrichedTrades as unknown as SocialTrade[]);
      } else {
        setTrades([]);
      }
    } catch (error) {
      console.error("Sosyal akış getirilirken hata:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const diff = new Date().getTime() - new Date(dateString).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} gün önce`;
    if (hours > 0) return `${hours} saat önce`;
    if (minutes > 0) return `${minutes} dakika önce`;
    return 'Az önce';
  };

  const displayTrades = filterFollowing 
    ? trades.filter(t => followedUsers.includes(t.username))
    : trades;

  // Stats
  const totalWins = trades.filter(t => t.pnl >= 0).length;
  const totalLosses = trades.filter(t => t.pnl < 0).length;
  const totalPnl = trades.reduce((acc, t) => acc + (t.pnl || 0), 0);
  const hotPair = trades.length > 0 
    ? Object.entries(trades.reduce((acc: Record<string, number>, t) => { acc[t.pair] = (acc[t.pair] || 0) + 1; return acc; }, {})).sort((a, b) => b[1] - a[1])[0]?.[0] || '-'
    : '-';

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        <div>
          <h2 className="text-4xl font-black bg-gradient-to-r from-brand-purple via-[#a855f7] to-brand-blue bg-clip-text text-transparent tracking-tight flex items-center gap-3">
            Sosyal Akış <Rocket className="w-7 h-7 text-brand-purple" />
          </h2>
          <p className="text-text-secondary text-sm mt-2 font-medium">Diğer trader'ların paylaştığı işlemleri ve analizleri inceleyin.</p>
        </div>
        <button 
          onClick={() => setFilterFollowing(!filterFollowing)}
          className={`px-5 py-2.5 rounded-xl transition-all text-sm font-semibold border shadow-sm ${
            filterFollowing 
              ? 'bg-brand-purple text-white border-brand-purple shadow-[0_0_15px_rgba(139,92,246,0.3)]' 
              : 'bg-bg-surface-hover dark:bg-[#131320]/60 border-border-primary text-text-primary hover:border-brand-purple/30'
          }`}
        >
          {filterFollowing ? '✓ Takip Ettiklerim' : 'Sadece Takip Ettiklerim'}
        </button>
      </div>

      {/* Live Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glassmorphism p-4 rounded-2xl relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-text-secondary font-semibold">Toplam İşlem</p>
              <p className="text-2xl font-black text-text-primary mt-1">{trades.length}</p>
            </div>
            <div className="p-2.5 bg-brand-blue/15 rounded-xl text-brand-blue">
              <BarChart3 className="w-5 h-5" />
            </div>
          </div>
          <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-brand-blue/10 blur-2xl rounded-full pointer-events-none"></div>
        </div>
        <div className="glassmorphism p-4 rounded-2xl relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-text-secondary font-semibold">Win / Loss</p>
              <p className="text-2xl font-black text-text-primary mt-1">
                <span className="text-brand-success">{totalWins}</span>
                <span className="text-text-secondary mx-1">/</span>
                <span className="text-brand-danger">{totalLosses}</span>
              </p>
            </div>
            <div className="p-2.5 bg-brand-success/15 rounded-xl text-brand-success">
              <Trophy className="w-5 h-5" />
            </div>
          </div>
          <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-brand-success/10 blur-2xl rounded-full pointer-events-none"></div>
        </div>
        <div className="glassmorphism p-4 rounded-2xl relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-text-secondary font-semibold">Toplam PnL</p>
              <p className={`text-2xl font-black mt-1 ${totalPnl >= 0 ? 'text-brand-success' : 'text-brand-danger'}`}>
                ${totalPnl.toFixed(0)}
              </p>
            </div>
            <div className={`p-2.5 rounded-xl ${totalPnl >= 0 ? 'bg-brand-success/15 text-brand-success' : 'bg-brand-danger/15 text-brand-danger'}`}>
              {totalPnl >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
            </div>
          </div>
          <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-brand-purple/10 blur-2xl rounded-full pointer-events-none"></div>
        </div>
        <div className="glassmorphism p-4 rounded-2xl relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-text-secondary font-semibold">En Popüler</p>
              <p className="text-2xl font-black text-brand-purple mt-1">{hotPair}</p>
            </div>
            <div className="p-2.5 bg-brand-danger/15 rounded-xl text-brand-danger">
              <Flame className="w-5 h-5" />
            </div>
          </div>
          <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-brand-danger/10 blur-2xl rounded-full pointer-events-none"></div>
        </div>
      </div>

      {/* Feed */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-brand-purple border-t-transparent"></div>
          <p className="text-text-secondary text-sm">Akış yükleniyor...</p>
        </div>
      ) : trades.length === 0 ? (
        <div className="glassmorphism p-16 rounded-2xl text-center">
          <Users className="w-20 h-20 text-text-secondary mx-auto mb-6 opacity-30" />
          <p className="text-text-primary text-xl font-bold mb-2">
            {filterFollowing ? "Takip ettiğiniz kimse henüz işlem paylaşmadı." : "Platformda henüz hiç işlem paylaşılmadı."}
          </p>
          <p className="text-text-secondary text-sm">
            {filterFollowing ? "Daha fazla trader takip ederek akışınızı zenginleştirin." : "İlk işlemi siz paylaşın ve akışı başlatın!"}
          </p>
        </div>
      ) : displayTrades.length === 0 && filterFollowing ? (
        <div className="glassmorphism p-16 rounded-2xl text-center">
          <Users className="w-20 h-20 text-text-secondary mx-auto mb-6 opacity-30" />
          <p className="text-text-primary text-xl font-bold">Takip ettiğiniz trader'lar henüz işlem paylaşmadı.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {displayTrades.map((trade) => (
            <SocialCard key={trade.id} trade={trade} getTimeAgo={getTimeAgo} />
          ))}
        </div>
      )}
    </div>
  );
};

const SocialCard = ({ trade, getTimeAgo }: { trade: SocialTrade, getTimeAgo: (d: string) => string }) => {
  const { userData, user: authUser } = useAuthStore();
  const [firestoreComments, setFirestoreComments] = useState<any[]>([]);
  
  useEffect(() => {
    const q = query(collection(db, 'trades', trade.id, 'comments'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setFirestoreComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [trade.id]);

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !userData) return;
    try {
      await addDoc(collection(db, 'trades', trade.id, 'comments'), {
        userId: userData.id,
        username: userData.username || 'User',
        avatarURL: userData.avatar_url || '',
        text: newComment.trim(),
        timestamp: new Date().toISOString()
      });
      setNewComment('');
    } catch (err) {
      console.error(err);
    }
  };

  const deleteComment = async (commentId: string) => {
    if (confirm("Bu yorumu silmek istediğinize emin misiniz?")) {
      try {
        await deleteDoc(doc(db, 'trades', trade.id, 'comments', commentId));
      } catch (err) {
        console.error(err);
      }
    }
  };
  const { followedUsers, likedTrades, toggleFollow, toggleLike } = useSocialStore();
  
  const isLiked = likedTrades.includes(trade.id);
  const isFollowing = followedUsers.includes(trade.username);
  const tradeComments = comments.filter(c => c.tradeId === trade.id);
  
  const [baseLikeCount] = useState(0); 
  const totalLikes = baseLikeCount + (isLiked ? 1 : 0);
  
  const [showComments, setShowComments] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [newComment, setNewComment] = useState('');

  const handleLike = () => {
    toggleLike(trade.id);
  };

  const handleFollow = () => {
    if (trade.username) toggleFollow(trade.username);
  };


  const submitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    addComment(trade.id, 'Siz', newComment.trim());
    setNewComment('');
  };

  const pnlPercent = trade.entry_price && trade.exit_price 
    ? (((trade.exit_price - trade.entry_price) / trade.entry_price) * 100 * (trade.direction === 'SHORT' ? -1 : 1)).toFixed(2)
    : null;

  return (
    <div className="glassmorphism p-0 rounded-2xl overflow-hidden hover:border-brand-purple/30 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(139,92,246,0.15)] group relative">
      {/* Top accent bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${trade.pnl >= 0 ? 'bg-gradient-to-b from-brand-success to-brand-success/20' : 'bg-gradient-to-b from-brand-danger to-brand-danger/20'}`}></div>
      
      <div className="p-6 space-y-4">
        {/* User Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {trade.users?.avatar_url ? (
              <img 
                src={trade.users.avatar_url} 
                alt={trade.username} 
                className="w-11 h-11 rounded-full object-cover ring-2 ring-brand-purple/20 shadow-lg"
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-brand-purple to-brand-blue flex items-center justify-center text-white font-bold shadow-[0_0_15px_rgba(139,92,246,0.3)]">
                {trade.username?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <Link to={`/profile/${trade.username}`} className="font-bold text-text-primary text-sm flex items-center hover:text-brand-purple transition-colors">
                  {trade.username || 'İsimsiz Trader'}
                </Link>
                {trade.users?.role === 'Founder' && (
                  <span className="text-yellow-500 text-[10px] font-bold bg-yellow-500/10 px-2 py-0.5 rounded-full border border-yellow-500/20 shadow-[0_0_8px_rgba(234,179,8,0.15)]">
                    ⭐ Founder
                  </span>
                )}
                {trade.users?.role === 'Admin' && (
                  <span className="text-brand-danger text-[10px] font-bold bg-brand-danger/10 px-2 py-0.5 rounded-full border border-brand-danger/20">
                    🛡️ Admin
                  </span>
                )}
                {trade.username && (
                  <button 
                    onClick={handleFollow}
                    className={`text-[10px] px-2.5 py-0.5 rounded-full flex items-center gap-1 transition-all font-semibold ${
                      isFollowing 
                        ? 'bg-brand-success/10 text-brand-success border border-brand-success/20' 
                        : 'bg-brand-purple/10 text-brand-purple border border-brand-purple/20 hover:bg-brand-purple hover:text-white hover:shadow-[0_0_10px_rgba(139,92,246,0.3)]'
                    }`}
                  >
                    {isFollowing ? <><UserCheck className="w-3 h-3" /> Takipte</> : <><UserPlus className="w-3 h-3" /> Takip Et</>}
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <Clock className="w-3 h-3 text-text-secondary" />
                <p className="text-[11px] text-text-secondary">{getTimeAgo(trade.created_at)}</p>
              </div>
            </div>
          </div>

          {/* PnL Badge */}
          <div className={`flex flex-col items-end`}>
            <span className={`px-4 py-1.5 rounded-xl text-xs font-black border shadow-sm ${
              trade.pnl >= 0 
                ? 'bg-brand-success/15 text-brand-success border-brand-success/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]' 
                : 'bg-brand-danger/15 text-brand-danger border-brand-danger/30 shadow-[0_0_12px_rgba(239,68,68,0.15)]'
            }`}>
              {trade.pnl >= 0 ? '▲ WIN' : '▼ LOSS'} ${Math.abs(trade.pnl).toFixed(2)}
            </span>
          </div>
        </div>
        
        {/* Trade Note */}
        {trade.notes && (
          <p className="text-text-secondary text-sm leading-relaxed pl-14">
            {trade.notes}
          </p>
        )}

        {/* Trade Info Card */}
        <div className="bg-bg-surface-hover dark:bg-black/30 rounded-xl p-4 border border-border-primary ml-14">
          <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-text-secondary font-semibold mb-1">Parite</p>
              <p className="text-sm font-black text-text-primary">{trade.pair}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-text-secondary font-semibold mb-1">Yön</p>
              <div className="flex items-center gap-1.5">
                {trade.direction === 'LONG' ? <TrendingUp className="w-3.5 h-3.5 text-brand-success" /> : <TrendingDown className="w-3.5 h-3.5 text-brand-danger" />}
                <p className={`text-sm font-black ${trade.direction === 'LONG' ? 'text-brand-success' : 'text-brand-danger'}`}>
                  {trade.direction}
                </p>
              </div>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-text-secondary font-semibold mb-1">Strateji</p>
              <p className="text-sm font-bold text-brand-purple">{trade.strategy || 'Belirtilmedi'}</p>
            </div>
            {trade.entry_price && (
              <div className="hidden md:block">
                <p className="text-[10px] uppercase tracking-wider text-text-secondary font-semibold mb-1">Giriş</p>
                <p className="text-sm font-bold text-text-primary">${trade.entry_price}</p>
              </div>
            )}
            {trade.exit_price && (
              <div className="hidden md:block">
                <p className="text-[10px] uppercase tracking-wider text-text-secondary font-semibold mb-1">Çıkış</p>
                <p className="text-sm font-bold text-text-primary">${trade.exit_price}</p>
              </div>
            )}
          </div>

          {/* Expandable details */}
          {(trade.entry_price || trade.lot_size || trade.image_url) && (
            <button 
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-1 mt-3 text-[10px] text-text-secondary hover:text-brand-purple transition-colors font-semibold uppercase tracking-wider"
            >
              {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {showDetails ? 'Detayları Gizle' : 'Detayları Göster'}
            </button>
          )}

          {showDetails && (
            <div className="mt-3 pt-3 border-t border-border-primary animate-fade-in">
              <div className="grid grid-cols-3 gap-4 mb-4">
                {trade.entry_price && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-text-secondary font-semibold mb-1">Giriş Fiyatı</p>
                    <p className="text-sm font-bold text-text-primary">${trade.entry_price}</p>
                  </div>
                )}
                {trade.exit_price && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-text-secondary font-semibold mb-1">Çıkış Fiyatı</p>
                    <p className="text-sm font-bold text-text-primary">${trade.exit_price}</p>
                  </div>
                )}
                {trade.lot_size && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-text-secondary font-semibold mb-1">Lot Büyüklüğü</p>
                    <p className="text-sm font-bold text-text-primary">{trade.lot_size}</p>
                  </div>
                )}
              </div>
              
              {trade.image_url && (
                <div className="mt-2 rounded-xl overflow-hidden border border-border-primary">
                  <a href={trade.image_url} target="_blank" rel="noreferrer"><img src={trade.image_url} alt="Trade Screenshot" className="w-full h-auto object-cover max-h-[400px] hover:scale-[1.02] transition-transform duration-500 cursor-zoom-in" title="Büyütmek için tıkla" /></a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-5 pt-3 border-t border-border-primary ml-14">
          <button 
            onClick={handleLike}
            className={`flex items-center space-x-2 transition-all group/btn ${isLiked ? 'text-brand-danger scale-105' : 'text-text-secondary hover:text-brand-danger'}`}
          >
            <Heart className={`w-[18px] h-[18px] transition-transform group-hover/btn:scale-110 ${isLiked ? 'fill-brand-danger' : ''}`} />
            <span className="text-xs font-bold">{totalLikes > 0 ? totalLikes : 'Beğen'}</span>
          </button>
          <button 
            onClick={() => setShowComments(!showComments)}
            className={`flex items-center space-x-2 transition-all ${showComments ? 'text-brand-blue' : 'text-text-secondary hover:text-brand-blue'}`}
          >
            <MessageSquare className="w-[18px] h-[18px]" />
            <span className="text-xs font-bold">{firestoreComments.length > 0 ? `${firestoreComments.length} Yorum` : 'Yorum'}</span>
          </button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="ml-14 pt-4 border-t border-border-primary space-y-3 animate-fade-in">
            {firestoreComments.length > 0 ? (
              <div className="space-y-2.5">
                {firestoreComments.map(comment => (
                  <div key={comment.id} className="bg-bg-surface-hover dark:bg-black/20 p-3.5 rounded-xl text-sm border border-border-primary/50">
                    <div className="flex justify-between items-start mb-1.5">
                      <div className="flex items-center gap-2">
                        {comment.avatarURL ? <img src={comment.avatarURL} className="w-6 h-6 rounded-full object-cover" /> : <div className="w-6 h-6 rounded-full bg-brand-purple/20 flex items-center justify-center text-[10px] font-bold text-brand-purple">{comment.username?.charAt(0)}</div>}
                        <div>
                          <span className="font-bold text-text-primary text-xs">{comment.username}</span>
                          <span className="text-[9px] text-text-secondary ml-2">{getTimeAgo(comment.timestamp)}</span>
                        </div>
                      </div>
                      {(comment.userId === userData?.id || userData?.role === 'Admin' || userData?.role === 'Founder') && (
                        <button onClick={() => deleteComment(comment.id)} className="text-text-secondary hover:text-brand-danger transition-colors p-1" title="Yorumu Sil">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                        </button>
                      )}
                    </div>
                    <p className="text-text-secondary text-[13px] leading-relaxed ml-8">{comment.text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-text-secondary text-xs text-center py-3 italic opacity-60">Henüz yorum yapılmamış. İlk yorumu sen yap!</p>
            )}
            
            <form onSubmit={submitComment} className="flex gap-2">
              <input 
                type="text" 
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Yorum yaz..."
                className="flex-1 bg-bg-primary dark:bg-black/30 border border-border-primary rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-secondary focus:border-brand-purple/50 focus:ring-1 focus:ring-brand-purple/30 outline-none transition-all"
              />
              <button 
                type="submit"
                disabled={!newComment.trim()}
                className="px-4 py-2.5 bg-brand-purple hover:bg-brand-purple/80 text-white rounded-xl transition-all disabled:opacity-30 shadow-[0_0_10px_rgba(139,92,246,0.2)] hover:shadow-[0_0_20px_rgba(139,92,246,0.4)]"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Social;
