import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Filter, ArrowUpRight, ArrowDownRight, Trash2, Image as ImageIcon, X } from 'lucide-react';
import { supabase } from '@/lib/supabase/config';
import { useAuthStore } from '@/store/authStore';
import AddTradeModal from '@/components/trades/AddTradeModal';

interface Trade {
  id: string;
  pair: string;
  direction: 'LONG' | 'SHORT';
  entry_price: number;
  exit_price: number;
  risk_reward: number;
  pnl: number;
  strategy: string;
  notes: string;
  image_url: string;
  result: 'WIN' | 'LOSS' | 'BREAKEVEN';
  created_at: string;
}

const Trades = () => {
  const { user, userData, refreshUserData } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('add') === 'true') {
      setIsModalOpen(true);
      setSearchParams({}); // Modalı açtıktan sonra query'i temizle
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (user) {
      fetchTrades();
    }
  }, [user]);

  const fetchTrades = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setTrades(data as Trade[]);
    } catch (error) {
      console.error("İşlemler getirilirken hata:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (tradeId: string) => {
    const tradeToDelete = trades.find(t => t.id === tradeId);
    if (!tradeToDelete) return;

    if (!window.confirm("Bu işlemi silmek istediğinize emin misiniz?")) {
      return;
    }

    setDeletingId(tradeId);
    try {
      const { error } = await supabase
        .from('trades')
        .delete()
        .eq('id', tradeId);

      if (error) throw error;

      // Update User Stats in PostgreSQL
      if (userData && user) {
        const isWin = tradeToDelete.pnl > 0;
        const newTotalTrades = Math.max(0, (userData.total_trades || 0) - 1);
        const newTotalPnL = Number(userData.total_pnl || 0) - Number(tradeToDelete.pnl);
        const newWinTrades = Math.max(0, (userData.win_trades || 0) - (isWin ? 1 : 0));
        const newWinRate = newTotalTrades > 0 ? (newWinTrades / newTotalTrades) * 100 : 0;

        await supabase
          .from('users')
          .update({
            total_pnl: newTotalPnL,
            total_trades: newTotalTrades,
            win_trades: newWinTrades,
            win_rate: newWinRate
          })
          .eq('id', user.id);
          
        await refreshUserData();
      }

      setTrades(trades.filter(t => t.id !== tradeId));
    } catch (error) {
      console.error("İşlem silinirken hata:", error);
      alert("Silme işlemi başarısız oldu.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">İşlem Kayıtları</h2>
          <p className="text-text-secondary text-sm mt-1">Tüm trade geçmişiniz ve detaylı analizler.</p>
        </div>
        <div className="flex space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 bg-bg-surface border border-border-primary rounded-lg text-text-primary hover:bg-bg-surface-hover transition-colors shadow-sm">
            <Filter className="w-4 h-4" />
            <span>Filtrele</span>
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-brand-purple rounded-lg text-white font-medium hover:bg-brand-purple/90 transition-all shadow-[0_0_15px_rgba(139,92,246,0.3)] hover:shadow-[0_0_20px_rgba(139,92,246,0.5)]"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni İşlem Ekle</span>
          </button>
        </div>
      </div>

      <AddTradeModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onTradeAdded={fetchTrades}
      />

      <div className="glassmorphism rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-purple mb-4"></div>
            <p className="text-text-secondary font-medium">İşlemleriniz yükleniyor...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-bg-surface-hover dark:bg-black/40 border-b border-border-primary">
                  <th className="p-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">Tarih</th>
                  <th className="p-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">Parite</th>
                  <th className="p-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">Yön</th>
                  <th className="p-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">Strateji & Notlar</th>
                  <th className="p-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">Görsel</th>
                  <th className="p-4 text-xs font-semibold text-text-secondary uppercase tracking-wider text-right">PnL & RR</th>
                  <th className="p-4 text-xs font-semibold text-text-secondary uppercase tracking-wider text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-primary">
                {trades.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-text-secondary">
                      Henüz hiçbir işlem kaydınız bulunmuyor. "Yeni İşlem Ekle" butonuna tıklayarak ilk kaydınızı oluşturun.
                    </td>
                  </tr>
                ) : (
                  trades.map((trade) => (
                    <tr key={trade.id} className="hover:bg-bg-surface-hover dark:hover:bg-white/[0.02] transition-colors group">
                      <td className="p-4 text-sm text-text-secondary">
                        {new Date(trade.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-4 text-sm font-bold text-text-primary">{trade.pair}</td>
                      <td className="p-4 text-sm">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold border ${
                          trade.direction === 'LONG' ? 'bg-brand-success/10 text-brand-success border-brand-success/20' : 'bg-brand-danger/10 text-brand-danger border-brand-danger/20'
                        }`}>
                          {trade.direction === 'LONG' ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />} 
                          {trade.direction}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="text-sm font-medium text-text-primary">{trade.strategy}</div>
                        {trade.notes && <div className="text-xs text-text-secondary truncate max-w-[200px]" title={trade.notes}>{trade.notes}</div>}
                      </td>
                      <td className="p-4">
                        {trade.image_url ? (
                          <button 
                            onClick={() => setSelectedImage(trade.image_url)} 
                            className="inline-block relative group"
                            title="Tam boyutta gör"
                          >
                            <img 
                              src={trade.image_url} 
                              alt="Trade Thumbnail" 
                              className="w-10 h-10 object-cover rounded-lg border border-border-primary group-hover:border-brand-purple transition-all shadow-sm"
                            />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                              <ImageIcon className="w-4 h-4 text-white" />
                            </div>
                          </button>
                        ) : (
                          <span className="text-text-secondary text-[10px] bg-bg-surface-hover px-2 py-1 rounded border border-border-primary">-</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className={`text-sm font-bold ${trade.pnl >= 0 ? 'text-brand-success' : 'text-brand-danger'}`}>
                          {trade.pnl >= 0 ? '+' : ''}${Number(trade.pnl).toFixed(2)}
                        </div>
                        <div className="text-xs font-medium text-text-secondary mt-0.5">
                          {trade.risk_reward}R
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => handleDelete(trade.id)}
                          disabled={deletingId === trade.id}
                          className="p-2 text-text-secondary hover:text-brand-danger hover:bg-brand-danger/10 rounded-lg transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100 disabled:opacity-50"
                          title="İşlemi Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-4xl w-full flex items-center justify-center">
            <button 
              onClick={() => setSelectedImage(null)}
              className="absolute -top-10 right-0 p-2 text-white hover:text-gray-300 bg-black/50 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <img 
              src={selectedImage} 
              alt="Trade Screenshot" 
              className="w-full h-auto max-h-[85vh] object-contain rounded-lg shadow-2xl border border-white/10" 
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Trades;
