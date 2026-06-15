import React, { useEffect, useState } from 'react';
import { Users, MessageSquare, Heart, Share2, Rocket, UserPlus, UserCheck, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase/config';
import { useSocialStore } from '@/store/socialStore';

interface SocialTrade {
  id: string;
  username: string;
  pair: string;
  direction: string;
  strategy: string;
  notes: string;
  pnl: number;
  created_at: string;
  users: {
    role: string;
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
      const { data, error } = await supabase
        .from('trades')
        .select(`
          id, username, pair, direction, strategy, notes, pnl, created_at,
          users (role)
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      if (data) {
        setTrades(data as unknown as SocialTrade[]);
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

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10 animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            Sosyal Akış <Rocket className="w-5 h-5 text-brand-purple" />
          </h2>
          <p className="text-text-secondary text-sm mt-1">Diğer trader'ların paylaştığı işlemleri ve analizleri inceleyin.</p>
        </div>
        <button 
          onClick={() => setFilterFollowing(!filterFollowing)}
          className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium border ${
            filterFollowing 
              ? 'bg-brand-purple text-white border-brand-purple' 
              : 'bg-bg-surface-hover dark:bg-brand-surface border-border-primary text-text-primary hover:bg-bg-surface'
          }`}
        >
          Sadece Takip Ettiklerim
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-purple"></div>
        </div>
      ) : trades.length === 0 ? (
        <div className="glassmorphism p-12 rounded-2xl text-center">
          <Users className="w-16 h-16 text-text-secondary mx-auto mb-4 opacity-50" />
          <p className="text-text-secondary text-lg">
            {filterFollowing ? "Takip ettiğiniz kimse henüz işlem paylaşmadı." : "Platformda henüz hiç işlem paylaşılmadı."}
          </p>
          <p className="text-text-secondary text-sm mt-2 opacity-70">
            {filterFollowing ? "Daha fazla trader takip ederek akışınızı zenginleştirin." : "İlk işlemi siz paylaşın ve akışı başlatın!"}
          </p>
        </div>
      ) : displayTrades.length === 0 && filterFollowing ? (
        <div className="glassmorphism p-12 rounded-2xl text-center">
          <Users className="w-16 h-16 text-text-secondary mx-auto mb-4 opacity-50" />
          <p className="text-text-secondary text-lg">Takip ettiğiniz trader'lar henüz işlem paylaşmadı.</p>
        </div>
      ) : (
        displayTrades.map((trade) => (
          <SocialCard key={trade.id} trade={trade} getTimeAgo={getTimeAgo} />
        ))
      )}
    </div>
  );
};

const SocialCard = ({ trade, getTimeAgo }: { trade: SocialTrade, getTimeAgo: (d: string) => string }) => {
  const { followedUsers, likedTrades, comments, toggleFollow, toggleLike, addComment } = useSocialStore();
  
  const isLiked = likedTrades.includes(trade.id);
  const isFollowing = followedUsers.includes(trade.username);
  const tradeComments = comments.filter(c => c.tradeId === trade.id);
  
  // Create a stable random like count so it doesn't change on re-renders, plus actual user likes
  const [baseLikeCount] = useState(Math.floor(Math.random() * 20)); 
  const totalLikes = baseLikeCount + (isLiked ? 1 : 0);
  
  const [isSharing, setIsSharing] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');

  const handleLike = () => {
    toggleLike(trade.id);
  };

  const handleFollow = () => {
    if (trade.username) toggleFollow(trade.username);
  };

  const handleShare = () => {
    setIsSharing(true);
    navigator.clipboard.writeText(`https://novatrade.com/trade/${trade.id}`);
    setTimeout(() => setIsSharing(false), 2000);
  };

  const submitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    addComment(trade.id, 'Siz', newComment.trim());
    setNewComment('');
  };

  return (
    <div className="glassmorphism p-6 rounded-2xl space-y-4 hover:border-brand-purple/20 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-purple to-brand-blue flex items-center justify-center text-white font-bold shadow-[0_0_15px_rgba(139,92,246,0.3)]">
            {trade.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Link to={`/profile/${trade.username}`} className="font-bold text-text-primary text-sm flex items-center hover:text-brand-purple transition-colors">
                {trade.username || 'İsimsiz Trader'}
                {trade.users?.role === 'Founder' && (
                  <span className="text-yellow-500 text-[10px] font-bold bg-yellow-500/10 px-2 py-0.5 rounded-full ml-2 border border-yellow-500/20">Founder</span>
                )}
              </Link>
              {trade.username && (
                <button 
                  onClick={handleFollow}
                  className={`text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 transition-colors ${
                    isFollowing 
                      ? 'bg-brand-success/10 text-brand-success border border-brand-success/20' 
                      : 'bg-brand-purple/10 text-brand-purple border border-brand-purple/20 hover:bg-brand-purple hover:text-white'
                  }`}
                >
                  {isFollowing ? <><UserCheck className="w-3 h-3" /> Takip Ediliyor</> : <><UserPlus className="w-3 h-3" /> Takip Et</>}
                </button>
              )}
            </div>
            <p className="text-xs text-text-secondary">{getTimeAgo(trade.created_at)}</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded text-xs font-bold border ${
          trade.pnl >= 0 ? 'bg-brand-success/20 text-brand-success border-brand-success/30' : 'bg-brand-danger/20 text-brand-danger border-brand-danger/30'
        }`}>
          {trade.pnl >= 0 ? 'WIN' : 'LOSS'} (${Math.abs(trade.pnl).toFixed(2)})
        </span>
      </div>
      
      <p className="text-text-secondary text-sm whitespace-pre-line">
        {trade.notes || `${trade.pair} paritesinde bir ${trade.direction} işlemi alındı.`}
      </p>

      <div className="bg-bg-surface-hover dark:bg-black/30 rounded-xl p-4 border border-border-primary flex flex-wrap gap-6">
        <div>
          <p className="text-xs text-text-secondary mb-1">Parite</p>
          <p className="text-sm font-bold text-text-primary">{trade.pair}</p>
        </div>
        <div>
          <p className="text-xs text-text-secondary mb-1">Yön</p>
          <p className={`text-sm font-bold ${trade.direction === 'LONG' ? 'text-brand-success' : 'text-brand-danger'}`}>
            {trade.direction}
          </p>
        </div>
        <div>
          <p className="text-xs text-text-secondary mb-1">Strateji</p>
          <p className="text-sm font-bold text-text-primary">{trade.strategy || 'Belirtilmedi'}</p>
        </div>
      </div>

      <div className="flex items-center space-x-6 pt-3 border-t border-border-primary mt-2">
        <button 
          onClick={handleLike}
          className={`flex items-center space-x-2 transition-colors group ${isLiked ? 'text-brand-danger' : 'text-text-secondary hover:text-brand-danger'}`}
        >
          <Heart className={`w-4 h-4 ${isLiked ? 'fill-brand-danger' : 'group-hover:fill-brand-danger'}`} />
          <span className="text-xs font-medium">{totalLikes > 0 ? totalLikes : 'Beğen'}</span>
        </button>
        <button 
          onClick={() => setShowComments(!showComments)}
          className={`flex items-center space-x-2 transition-colors ${showComments ? 'text-brand-blue' : 'text-text-secondary hover:text-brand-blue'}`}
        >
          <MessageSquare className="w-4 h-4" />
          <span className="text-xs font-medium">{tradeComments.length > 0 ? tradeComments.length : 'Yorum'}</span>
        </button>
        <button 
          onClick={handleShare}
          className={`flex items-center space-x-2 transition-colors ml-auto ${isSharing ? 'text-brand-success' : 'text-text-secondary hover:text-text-primary'}`}
        >
          <Share2 className="w-4 h-4" />
          {isSharing && <span className="text-xs text-brand-success ml-1">Kopyalandı!</span>}
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-border-primary space-y-4 animate-fade-in">
          {tradeComments.length > 0 ? (
            <div className="space-y-3">
              {tradeComments.map(comment => (
                <div key={comment.id} className="bg-bg-surface-hover dark:bg-black/20 p-3 rounded-lg text-sm">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-text-primary text-xs">{comment.username}</span>
                    <span className="text-[10px] text-text-secondary">{getTimeAgo(comment.createdAt)}</span>
                  </div>
                  <p className="text-text-secondary">{comment.text}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-text-secondary text-xs text-center italic opacity-70">Henüz yorum yapılmamış. İlk yorumu sen yap!</p>
          )}
          
          <form onSubmit={submitComment} className="flex gap-2">
            <input 
              type="text" 
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Yorum yaz..."
              className="flex-1 bg-bg-primary border border-border-primary rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-secondary focus:border-brand-purple/50 outline-none"
            />
            <button 
              type="submit"
              disabled={!newComment.trim()}
              className="px-3 py-2 bg-brand-purple hover:bg-brand-purple/80 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Social;
