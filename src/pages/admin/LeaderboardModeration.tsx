import React, { useEffect, useState } from 'react';
import { Trophy, ShieldAlert, Search, UserX, UserCheck, AlertTriangle, Info } from 'lucide-react';
import { supabase } from '@/lib/supabase/config';
import { useAuthStore } from '@/store/authStore';

interface UserWithExclusion {
  id: string;
  username: string;
  email: string;
  total_trades: number;
  total_pnl: number;
  is_excluded: boolean;
  exclusion_reason?: string;
}

const LeaderboardModeration = () => {
  const { userData, user: currentUser } = useAuthStore();
  const isFounder = userData?.role === 'Founder' || currentUser?.email === 'forexrico16@gmail.com' || currentUser?.email === 'admin@gmail.com';

  const [users, setUsers] = useState<UserWithExclusion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Kural Ayarları State'leri
  const [activeTab, setActiveTab] = useState<'users' | 'rules'>('users');
  const [maxPnL, setMaxPnL] = useState(10000);
  const [pnlWeight, setPnlWeight] = useState(0.40);
  const [winRateWeight, setWinRateWeight] = useState(0.25);
  const [rrWeight, setRrWeight] = useState(0.20);
  const [consistencyWeight, setConsistencyWeight] = useState(0.15);
  const [minTrades, setMinTrades] = useState(0);
  const [rulesLoading, setRulesLoading] = useState(false);
  const [savingRules, setSavingRules] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchRules();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, username, email, total_trades, total_pnl')
        .order('total_trades', { ascending: false });

      if (usersError) throw usersError;

      const { data: exclusionsData, error: excError } = await supabase
        .from('leaderboard_exclusions')
        .select('user_id, reason');

      if (excError) throw excError;

      const exclusionsMap = new Map();
      exclusionsData?.forEach(exc => {
        exclusionsMap.set(exc.user_id, exc.reason || 'Kural ihlali');
      });

      if (usersData) {
        const combined = usersData.map(u => ({
          ...u,
          is_excluded: exclusionsMap.has(u.id),
          exclusion_reason: exclusionsMap.get(u.id)
        }));
        setUsers(combined);
      }
    } catch (error) {
      console.error("Moderasyon verisi getirilirken hata:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRules = async () => {
    try {
      setRulesLoading(true);
      setDbError(null);
      const { data, error } = await supabase
        .from('platform_settings')
        .select('max_pnl, pnl_weight, win_rate_weight, rr_weight, consistency_weight, min_trades')
        .eq('id', 1)
        .single();

      if (error) {
        console.error("Platform ayarları yüklenemedi:", error);
        if (error.code === 'PGRST204' || error.message?.includes('column') || error.message?.includes('relation')) {
          setDbError("Veritabanında platform_settings tablosu veya gerekli kolonlar bulunamadı. Lütfen Supabase SQL editöründe gerekli migrasyon kodunu çalıştırın.");
        } else {
          setDbError(`Platform ayarları yüklenirken hata oluştu: ${error.message}`);
        }
      } else if (data) {
        if (data.max_pnl !== null) setMaxPnL(Number(data.max_pnl));
        if (data.pnl_weight !== null) setPnlWeight(Number(data.pnl_weight));
        if (data.win_rate_weight !== null) setWinRateWeight(Number(data.win_rate_weight));
        if (data.rr_weight !== null) setRrWeight(Number(data.rr_weight));
        if (data.consistency_weight !== null) setConsistencyWeight(Number(data.consistency_weight));
        if (data.min_trades !== null) setMinTrades(Number(data.min_trades));
      }
    } catch (err: any) {
      console.error(err);
      setDbError(err.message || "Bilinmeyen bir hata oluştu.");
    } finally {
      setRulesLoading(false);
    }
  };

  const saveRules = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFounder) {
      alert("Bu ayarları değiştirme yetkiniz bulunmamaktadır. Yalnızca Kurucu (Founder) bu ayarları düzenleyebilir.");
      setSavingRules(false);
      return;
    }
    setSavingRules(true);
    setDbError(null);
    setSaveSuccess(false);

    try {
      const { error } = await supabase
        .from('platform_settings')
        .update({
          min_trades: minTrades
        })
        .eq('id', 1);

      if (error) {
        console.error("Kurallar kaydedilirken hata:", error);
        setDbError(`Kaydetme başarısız: ${error.message}. Lütfen veritabanı bağlantısını kontrol edin.`);
      } else {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err: any) {
      console.error(err);
      setDbError(err.message || "Bilinmeyen bir hata oluştu.");
    } finally {
      setSavingRules(false);
    }
  };

  const toggleExclusion = async (user: UserWithExclusion) => {
    try {
      setProcessingId(user.id);
      if (user.is_excluded) {
        const { error } = await supabase
          .from('leaderboard_exclusions')
          .delete()
          .eq('user_id', user.id);
        
        if (error) throw error;
        
        setUsers(users.map(u => u.id === user.id ? { ...u, is_excluded: false, exclusion_reason: undefined } : u));
      } else {
        const reason = window.prompt('Neden sıralamadan çıkarıyorsunuz?', 'Şüpheli işlem aktivitesi / Hile');
        if (reason === null) return;

        const { error } = await supabase
          .from('leaderboard_exclusions')
          .insert([{ user_id: user.id, reason: reason || 'Belirtilmedi' }]);
        
        if (error) throw error;
        
        setUsers(users.map(u => u.id === user.id ? { ...u, is_excluded: true, exclusion_reason: reason || 'Belirtilmedi' } : u));
      }
    } catch (error) {
      console.error("İşlem başarısız:", error);
      alert("Bir hata oluştu.");
    } finally {
      setProcessingId(null);
    }
  };

  const maskEmail = (email: string) => {
    if (!email) return '***@***.com';
    const parts = email.split('@');
    if (parts.length !== 2) return '***@***.com';
    const [name, domain] = parts;
    if (name.length <= 2) return `***@${domain}`;
    return `${name.substring(0, 2)}***@${domain}`;
  };

  const filteredUsers = users.filter(u => 
    u.username?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (isFounder && u.email?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-brand-purple/20 rounded-xl">
          <Trophy className="w-8 h-8 text-brand-purple" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Leaderboard Moderasyon</h2>
          <p className="text-text-secondary text-sm">Puan silme, soft-exclusion mekanizmaları ve sıralama kuralları.</p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-4 border-b border-border-primary pb-px mb-6">
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all px-2 ${
            activeTab === 'users'
              ? 'border-brand-purple text-brand-purple'
              : 'border-transparent text-text-secondary hover:text-white'
          }`}
        >
          Trader Listesi (Sıralama Yönetimi)
        </button>
        <button
          onClick={() => setActiveTab('rules')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all px-2 ${
            activeTab === 'rules'
              ? 'border-brand-purple text-brand-purple'
              : 'border-transparent text-text-secondary hover:text-white'
          }`}
        >
          Leaderboard Skor Kuralları
        </button>
      </div>

      {activeTab === 'users' ? (
        <>
          <div className="bg-bg-surface-hover border border-brand-danger/30 rounded-xl p-4 flex gap-3 text-sm text-text-primary">
            <AlertTriangle className="w-5 h-5 text-brand-danger shrink-0" />
            <p>Buradan engellenen kullanıcılar platformu kullanmaya ve işlem yapmaya devam edebilirler ancak <strong className="text-brand-danger">Şampiyonlar Ligi (Leaderboard) sıralamasında asla görünmezler.</strong> Ödül avcılarını ve kural ihlalcilerini elemek için kullanın.</p>
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input 
                type="text" 
                placeholder="Trader ara..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black/30 border border-border-primary rounded-xl py-2.5 pl-10 pr-4 text-sm focus:border-brand-purple/50 focus:ring-1 focus:ring-brand-purple/50 outline-none text-white transition-all"
              />
            </div>
          </div>

          <div className="bg-black/20 border border-border-primary rounded-2xl overflow-hidden">
            {loading ? (
              <div className="p-10 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-purple"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-bg-surface-hover border-b border-border-primary text-xs uppercase tracking-wider text-text-secondary">
                      <th className="p-4 font-semibold">Trader</th>
                      <th className="p-4 font-semibold">Toplam İşlem</th>
                      <th className="p-4 font-semibold text-right">Durum</th>
                      <th className="p-4 font-semibold text-right">Aksiyon</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-primary">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-text-secondary">Sonuç bulunamadı.</td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-brand-surface border border-border-primary flex items-center justify-center font-bold text-white">
                                {user.username?.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-bold text-white">{user.username}</p>
                                <p className="text-xs text-text-secondary">{isFounder ? user.email : maskEmail(user.email)}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="font-medium text-white">{user.total_trades} İşlem</span>
                          </td>
                          <td className="p-4 text-right">
                            {user.is_excluded ? (
                              <div className="inline-flex flex-col items-end">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-brand-danger/20 text-brand-danger border border-brand-danger/30">
                                  <ShieldAlert className="w-3 h-3" /> Engelli (Gizli)
                                </span>
                                <span className="text-[10px] text-text-secondary mt-1 max-w-[150px] truncate" title={user.exclusion_reason}>
                                  Sebep: {user.exclusion_reason}
                                </span>
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-brand-success/20 text-brand-success border border-brand-success/30">
                                Temiz
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => toggleExclusion(user)}
                              disabled={processingId === user.id}
                              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-50 ${
                                user.is_excluded 
                                  ? 'bg-brand-success/10 text-brand-success border border-brand-success/30 hover:bg-brand-success/20'
                                  : 'bg-brand-danger/10 text-brand-danger border border-brand-danger/30 hover:bg-brand-danger/20'
                              }`}
                            >
                              {processingId === user.id ? (
                                <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></span>
                              ) : user.is_excluded ? (
                                <><UserCheck className="w-4 h-4" /> Geri Al</>
                              ) : (
                                <><UserX className="w-4 h-4" /> Sıralamadan At</>
                              )}
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
        </>
      ) : (
        <div className="glassmorphism rounded-2xl border border-border-primary p-6 md:p-8 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-white">Liderlik Tablosu Sıralama Kuralları</h3>
          </div>

          <p className="text-text-secondary text-sm">
            Şampiyonlar Ligi sıralaması, kullanıcıların toplam kâr miktarına (Profit) göre yapılmaktadır. Sıralama listesini düzenlemek için aşağıdaki kuralı belirleyebilirsiniz.
          </p>

          {!isFounder && (
            <div className="p-4 bg-brand-danger/10 border border-brand-danger/20 rounded-xl text-sm text-brand-danger flex gap-3">
              <AlertTriangle className="w-5 h-5 text-brand-danger shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-white">Yalnızca Kurucu Düzenleyebilir</p>
                <p className="text-xs text-text-secondary mt-1">
                  Bu ayarlar platform kurucusu (Founder) dışındaki yöneticiler tarafından değiştirilemez. Şu an sadece mevcut kuralları görüntülüyorsunuz.
                </p>
              </div>
            </div>
          )}

          {dbError && (
            <div className="p-4 bg-brand-danger/10 border border-brand-danger/30 rounded-xl text-sm text-brand-danger">
              <p className="font-semibold text-white">Veritabanı Hatası</p>
              <p className="text-xs text-text-secondary mt-1">{dbError}</p>
            </div>
          )}

          {saveSuccess && (
            <div className="p-4 bg-brand-success/10 border border-brand-success/30 rounded-xl text-sm text-brand-success font-semibold flex items-center gap-2">
              <UserCheck className="w-5 h-5" />
              <span>Sıralama kuralları başarıyla kaydedildi!</span>
            </div>
          )}

          {rulesLoading ? (
            <div className="py-12 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-purple"></div>
            </div>
          ) : (
            <form onSubmit={saveRules} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 max-w-md">
                {/* Min Trades */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Sıralama için En Az İşlem Sayısı</label>
                    <Info className="w-3.5 h-3.5 text-text-secondary cursor-help" title="Bir traderın sıralamaya girebilmesi için yapması gereken en az işlem sayısıdır. 0 yapılırsa her işlem sayısı kabul edilir." />
                  </div>
                  <input
                    type="number"
                    value={minTrades}
                    onChange={(e) => setMinTrades(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-black/30 border border-border-primary rounded-xl py-3 px-4 text-white focus:border-brand-purple/50 focus:ring-1 focus:ring-brand-purple/50 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    required
                    min={0}
                    disabled={!isFounder}
                  />
                </div>
              </div>

              {isFounder && (
                <div className="pt-4 border-t border-border-primary flex justify-end">
                  <button
                    type="submit"
                    disabled={savingRules}
                    className="px-6 py-3 bg-brand-purple hover:bg-brand-purple/80 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all shadow-lg flex items-center gap-2"
                  >
                    {savingRules ? (
                      <>
                        <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                        Kaydediliyor...
                      </>
                    ) : (
                      'Ayarları Kaydet'
                    )}
                  </button>
                </div>
              )}
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default LeaderboardModeration;
