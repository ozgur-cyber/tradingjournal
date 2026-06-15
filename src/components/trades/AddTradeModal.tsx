import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Info, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase/config';
import { useAuthStore } from '@/store/authStore';

interface AddTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTradeAdded: () => void;
}

const AddTradeModal: React.FC<AddTradeModalProps> = ({ isOpen, onClose, onTradeAdded }) => {
  const { user, userData, refreshUserData } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [pair, setPair] = useState('');
  const [direction, setDirection] = useState<'LONG' | 'SHORT'>('LONG');
  const [entryPrice, setEntryPrice] = useState('');
  const [exitPrice, setExitPrice] = useState('');
  const [rr, setRr] = useState('');
  const [pnl, setPnl] = useState('');
  const [strategy, setStrategy] = useState('Smart Money Concepts');
  const [notes, setNotes] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [customStrategies, setCustomStrategies] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      const fetchStrategies = async () => {
        const { data } = await supabase
          .from('strategies')
          .select('name')
          .eq('user_id', user.id);
        
        if (data) {
          setCustomStrategies(data.map(s => s.name));
        }
      };
      fetchStrategies();
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        setError("Resim boyutu 5MB'dan küçük olmalıdır.");
        return;
      }
      setImage(file);
      setError('');
    }
  };

  const handleSubmit = async () => {
    if (!pair || !entryPrice || !exitPrice || !rr || !pnl) {
      setError("Lütfen tüm zorunlu alanları doldurun.");
      return;
    }

    if (!user) {
      setError("Oturum bulunamadı.");
      return;
    }

    setLoading(true);
    setError('');

    const rrValue = parseFloat(rr);

    // 10R ve üstü işlemlerde fotoğraf zorunluluğu kontrolü
    if (rrValue >= 10 && !image) {
      // Mevcut ihlal sayısını çek
      const { data: currentUser } = await supabase
        .from('users')
        .select('no_photo_violations')
        .eq('id', user.id)
        .single();

      const violations = (currentUser?.no_photo_violations || 0) + 1;

      // İhlali kaydet
      await supabase
        .from('users')
        .update({ no_photo_violations: violations })
        .eq('id', user.id);

      if (violations >= 3) {
        // 3. ihlal = 7 gün ban
        const banUntil = new Date();
        banUntil.setDate(banUntil.getDate() + 7);
        await supabase
          .from('users')
          .update({
            is_banned: true,
            ban_until: banUntil.toISOString(),
            ban_reason: `10R+ işlemlerde 3 kez fotoğraf eklemeden kayıt girme ihlali (7 gün ban)`,
            banned_by: 'Sistem (Otomatik)'
          })
          .eq('id', user.id);
        
        setError(`⛔ 3. ihlal! 10R ve üstü işlemlerde fotoğraf eklemek zorunludur. Hesabınız 7 gün askıya alındı.`);
        setLoading(false);
        return;
      }

      setError(`⚠️ UYARI (${violations}/3): 10R ve üstü işlemlerde ekran görüntüsü eklemek zorunludur! 3 ihlalde hesabınız 7 gün askıya alınacaktır. Lütfen fotoğraf ekleyip tekrar deneyin.`);
      setLoading(false);
      return;
    }
    try {
      let finalImageUrl = '';

      // Upload Image to Supabase Storage if selected
      if (image) {
        try {
          const fileExt = image.name.split('.').pop();
          const fileName = `${user.id}/${Date.now()}.${fileExt}`;

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('trades')
            .upload(fileName, image);

          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from('trades')
              .getPublicUrl(fileName);
            finalImageUrl = publicUrl;
          } else {
            console.warn("Resim yüklenemedi, işlem resimsiz kaydedilecek:", uploadError.message);
          }
        } catch (imgErr) {
          console.warn("Resim yükleme atlandı:", imgErr);
        }
      }

      const pnlValue = parseFloat(pnl);
      const isWin = pnlValue > 0;
      const isLoss = pnlValue < 0;

      // Save Trade to Supabase Postgres
      const { error: dbError } = await supabase
        .from('trades')
        .insert([
          {
            user_id: user.id,
            user_email: user.email,
            username: userData?.username || 'Trader',
            pair: pair.toUpperCase(),
            direction,
            entry_price: parseFloat(entryPrice),
            exit_price: parseFloat(exitPrice),
            risk_reward: parseFloat(rr),
            pnl: pnlValue,
            strategy,
            notes,
            image_url: finalImageUrl,
            result: isWin ? 'WIN' : isLoss ? 'LOSS' : 'BREAKEVEN'
          }
        ]);

      if (dbError) throw dbError;

      // Update User Stats in PostgreSQL
      if (userData) {
        const newTotalTrades = (userData.total_trades || 0) + 1;
        const newTotalPnL = Number(userData.total_pnl || 0) + pnlValue;
        const newWinTrades = (userData.win_trades || 0) + (isWin ? 1 : 0);
        const newWinRate = (newWinTrades / newTotalTrades) * 100;

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

      onTradeAdded();
      
      // Reset form
      setPair('');
      setEntryPrice('');
      setExitPrice('');
      setRr('');
      setPnl('');
      setNotes('');
      setImage(null);
      onClose();

    } catch (err: any) {
      console.error("Trade kaydedilirken hata:", err);
      setError(err.message || "İşlem kaydedilemedi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={!loading ? onClose : undefined} />

      <div className="relative w-full max-w-2xl bg-brand-surface border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-black/20">
          <h3 className="text-xl font-bold text-white">Yeni İşlem Ekle</h3>
          <button 
            onClick={!loading ? onClose : undefined}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {error && (
            <div className="p-4 bg-brand-danger/10 border border-brand-danger/30 rounded-lg text-brand-danger text-sm font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Parite / Varlık *</label>
              <input 
                type="text" 
                value={pair}
                onChange={(e) => setPair(e.target.value)}
                placeholder="Örn: EUR/USD" 
                className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white placeholder-gray-500 focus:border-brand-purple/50 outline-none uppercase"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">İşlem Yönü *</label>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setDirection('LONG')}
                  className={`flex-1 py-3 rounded-lg font-bold transition-all ${
                    direction === 'LONG' 
                      ? 'bg-brand-success/20 text-brand-success border border-brand-success/50' 
                      : 'bg-black/30 text-gray-400 border border-white/5 hover:bg-white/5'
                  }`}
                >
                  LONG
                </button>
                <button
                  type="button"
                  onClick={() => setDirection('SHORT')}
                  className={`flex-1 py-3 rounded-lg font-bold transition-all ${
                    direction === 'SHORT' 
                      ? 'bg-brand-danger/20 text-brand-danger border border-brand-danger/50' 
                      : 'bg-black/30 text-gray-400 border border-white/5 hover:bg-white/5'
                  }`}
                >
                  SHORT
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Giriş Fiyatı *</label>
              <input 
                type="number" 
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                step="any"
                placeholder="0.00" 
                className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white placeholder-gray-500 focus:border-brand-purple/50 outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Çıkış Fiyatı *</label>
              <input 
                type="number" 
                value={exitPrice}
                onChange={(e) => setExitPrice(e.target.value)}
                step="any"
                placeholder="0.00" 
                className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white placeholder-gray-500 focus:border-brand-purple/50 outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Risk/Ödül Oranı (R) *</label>
              <input 
                type="number" 
                value={rr}
                onChange={(e) => setRr(e.target.value)}
                step="0.1"
                placeholder="Örn: 2.5 veya -1" 
                className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white placeholder-gray-500 focus:border-brand-purple/50 outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Gerçekleşen Kâr/Zarar ($) *</label>
              <input 
                type="number" 
                value={pnl}
                onChange={(e) => setPnl(e.target.value)}
                step="any"
                placeholder="Örn: 150 veya -50" 
                className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white placeholder-gray-500 focus:border-brand-purple/50 outline-none"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-300">Strateji</label>
              <select 
                value={strategy}
                onChange={(e) => setStrategy(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white focus:border-brand-purple/50 outline-none"
              >
                <option value="Smart Money Concepts">Smart Money Concepts</option>
                <option value="Price Action">Price Action</option>
                <option value="Algoritmik">Algoritmik / Bot</option>
                <option value="Diğer">Diğer</option>
                {customStrategies.map((s, idx) => (
                  <option key={idx} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Supabase Storage File Upload */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-300">Ekran Görüntüsü Yükle (Ücretsiz!)</label>
              <input 
                type="file" 
                accept="image/*"
                ref={fileInputRef}
                className="hidden"
                onChange={handleImageChange}
              />
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-colors cursor-pointer group ${
                  image ? 'border-brand-success/50 bg-brand-success/5' : 'border-white/10 hover:border-brand-purple/50 hover:bg-brand-purple/5'
                }`}
              >
                {image ? (
                  <div className="text-center">
                    <ImageIcon className="w-8 h-8 text-brand-success mx-auto mb-2" />
                    <p className="text-sm font-medium text-brand-success">{image.name}</p>
                    <p className="text-xs text-gray-500 mt-1">Değiştirmek için tıklayın</p>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-brand-surface flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Upload className="w-6 h-6 text-gray-400 group-hover:text-brand-purple" />
                    </div>
                    <p className="text-sm text-gray-400 font-medium">Supabase Storage'a Resim Yükle</p>
                    <p className="text-xs text-gray-500 mt-1">Sürükle bırak veya tıklayarak seç (Max 5MB)</p>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-300">İşlem Notları</label>
              <textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="İşleme giriş sebebiniz, psikolojiniz vb. notlar..."
                className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white placeholder-gray-500 focus:border-brand-purple/50 outline-none resize-none"
              />
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-white/5 bg-black/30 flex justify-end space-x-3">
          <button 
            onClick={onClose}
            disabled={loading}
            className="px-6 py-2 rounded-lg font-medium text-gray-300 hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            İptal
          </button>
          <button 
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 flex items-center space-x-2 bg-gradient-to-r from-brand-purple to-brand-blue rounded-lg font-bold text-white shadow-[0_0_15px_rgba(139,92,246,0.3)] hover:shadow-[0_0_20px_rgba(139,92,246,0.5)] transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="animate-spin h-4 w-4 border-2 border-white/20 border-t-white rounded-full"></span>
                <span>Kaydediliyor...</span>
              </>
            ) : (
              <span>İşlemi Kaydet</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddTradeModal;
