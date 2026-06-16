import React, { useEffect, useState } from 'react';
import { Trophy, ShieldAlert, Search, UserX, UserCheck, AlertTriangle } from 'lucide-react';
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

  useEffect(() => {
    fetchUsers();
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
          <p className="text-text-secondary text-sm">Puan silme ve soft-exclusion mekanizmaları.</p>
        </div>
      </div>

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
    </div>
  );
};

export default LeaderboardModeration;
