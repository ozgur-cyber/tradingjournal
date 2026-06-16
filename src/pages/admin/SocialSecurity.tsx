import React, { useState, useEffect } from 'react';
import { ShieldAlert, ShieldX, UserX, AlertTriangle, CheckCircle, Search, Ban } from 'lucide-react';
import { supabase } from '@/lib/supabase/config';

interface FlaggedUser {
  id: string;
  target_user_id: string;
  reason: string;
  status: string;
  created_at: string;
  users: {
    username: string;
    email: string;
    is_banned: boolean;
  };
}

const SocialSecurity = () => {
  const [flags, setFlags] = useState<FlaggedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchFlags();
  }, []);

  const fetchFlags = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_flags')
        .select(`
          id, target_user_id, reason, status, created_at,
          users:target_user_id ( username, email, is_banned )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      // Handle the relation correctly
      const formattedData = (data || []).map((item: any) => ({
        ...item,
        users: Array.isArray(item.users) ? item.users[0] : item.users
      }));
      setFlags(formattedData as FlaggedUser[]);
    } catch (err) {
      console.error("Bayraklar çekilirken hata:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async (userId: string, flagId: string) => {
    if (!window.confirm("Bu kullanıcıyı kalıcı olarak sistemden uzaklaştırmak istediğinize emin misiniz?")) return;
    
    try {
      // Ban user
      const { error: banError } = await supabase
        .from('users')
        .update({
          is_banned: true,
          ban_reason: 'Güvenlik & Anti-Spam modülünden kalıcı olarak uzaklaştırıldı.',
          banned_by: 'Admin'
        })
        .eq('id', userId);
        
      if (banError) throw banError;

      // Update flag status
      await supabase
        .from('user_flags')
        .update({ status: 'RESOLVED' })
        .eq('id', flagId);

      alert("Kullanıcı başarıyla uzaklaştırıldı.");
      fetchFlags();
    } catch (err: any) {
      alert("Hata: " + err.message);
    }
  };

  const handleDismiss = async (flagId: string) => {
    try {
      await supabase
        .from('user_flags')
        .update({ status: 'DISMISSED' })
        .eq('id', flagId);
      fetchFlags();
    } catch (err: any) {
      alert("Hata: " + err.message);
    }
  };

  const filteredFlags = flags.filter(f => 
    f.users?.username?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    f.users?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.reason?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-brand-danger/20 rounded-xl">
            <ShieldAlert className="w-8 h-8 text-brand-danger" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Güvenlik & Anti-Spam</h2>
            <p className="text-text-secondary text-sm">Bot hesap tespit, toplu ban ve şikayet aksiyonları.</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glassmorphism p-6 rounded-2xl border border-border-primary border-t-brand-danger">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-5 h-5 text-brand-danger" />
            <h3 className="text-text-secondary font-semibold">Bekleyen İhlaller</h3>
          </div>
          <p className="text-3xl font-black text-white">{flags.filter(f => f.status === 'PENDING').length}</p>
        </div>
        <div className="glassmorphism p-6 rounded-2xl border border-border-primary border-t-brand-success">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-5 h-5 text-brand-success" />
            <h3 className="text-text-secondary font-semibold">Çözülen İhlaller</h3>
          </div>
          <p className="text-3xl font-black text-white">{flags.filter(f => f.status === 'RESOLVED').length}</p>
        </div>
        <div className="glassmorphism p-6 rounded-2xl border border-border-primary border-t-brand-purple">
          <div className="flex items-center gap-3 mb-2">
            <UserX className="w-5 h-5 text-brand-purple" />
            <h3 className="text-text-secondary font-semibold">Toplam Banlanan</h3>
          </div>
          <p className="text-3xl font-black text-white">{flags.filter(f => f.users?.is_banned).length}</p>
        </div>
      </div>

      <div className="glassmorphism rounded-2xl overflow-hidden border border-border-primary flex flex-col min-h-[500px]">
        <div className="p-6 border-b border-border-primary bg-bg-surface-hover/50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h3 className="font-bold text-white text-lg">İhlal Raporları</h3>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input 
              type="text" 
              placeholder="Kullanıcı veya sebep ara..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/40 border border-border-primary rounded-xl pl-10 pr-4 py-2 text-sm text-text-primary focus:border-brand-purple/50 outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto flex-1">
          {loading ? (
             <div className="p-20 text-center flex flex-col items-center">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-danger mb-4"></div>
               <p className="text-text-secondary">Raporlar yükleniyor...</p>
             </div>
          ) : filteredFlags.length === 0 ? (
            <div className="p-20 text-center flex flex-col items-center">
              <ShieldAlert className="w-16 h-16 text-text-secondary opacity-20 mb-4" />
              <p className="text-text-primary font-bold text-xl">Harika!</p>
              <p className="text-text-secondary">Sistemde bekleyen hiçbir ihlal raporu yok.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-black/40 border-b border-border-primary">
                  <th className="p-4 text-xs font-semibold text-text-secondary uppercase">Tarih</th>
                  <th className="p-4 text-xs font-semibold text-text-secondary uppercase">Kullanıcı</th>
                  <th className="p-4 text-xs font-semibold text-text-secondary uppercase">İhlal Sebebi</th>
                  <th className="p-4 text-xs font-semibold text-text-secondary uppercase">Durum</th>
                  <th className="p-4 text-xs font-semibold text-text-secondary uppercase text-right">Aksiyon</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-primary">
                {filteredFlags.map((flag) => (
                  <tr key={flag.id} className="hover:bg-bg-surface-hover/30 transition-colors group">
                    <td className="p-4 text-sm text-text-secondary">
                      {new Date(flag.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-brand-surface border border-border-primary flex items-center justify-center font-bold text-text-primary">
                          {flag.users?.username?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{flag.users?.username || 'Bilinmiyor'}</p>
                          <p className="text-xs text-text-secondary">{flag.users?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-danger/10 border border-brand-danger/20 rounded-lg text-brand-danger text-xs font-bold">
                        <ShieldX className="w-3.5 h-3.5" />
                        {flag.reason}
                      </div>
                    </td>
                    <td className="p-4">
                      {flag.status === 'PENDING' && <span className="px-2.5 py-1 text-[10px] font-bold bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded-full">BEKLEYEN</span>}
                      {flag.status === 'RESOLVED' && <span className="px-2.5 py-1 text-[10px] font-bold bg-brand-success/10 text-brand-success border border-brand-success/20 rounded-full">ÇÖZÜLDÜ (BANLANDI)</span>}
                      {flag.status === 'DISMISSED' && <span className="px-2.5 py-1 text-[10px] font-bold bg-gray-500/10 text-gray-400 border border-gray-500/20 rounded-full">REDDEDİLDİ</span>}
                    </td>
                    <td className="p-4 text-right">
                      {flag.status === 'PENDING' && !flag.users?.is_banned && (
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleDismiss(flag.id)}
                            className="px-3 py-1.5 text-xs font-bold text-text-secondary hover:text-white hover:bg-white/10 rounded-lg transition-colors border border-transparent hover:border-white/20"
                          >
                            Görmezden Gel
                          </button>
                          <button 
                            onClick={() => handleBanUser(flag.target_user_id, flag.id)}
                            className="px-3 py-1.5 text-xs font-bold bg-brand-danger text-white rounded-lg hover:bg-brand-danger/80 transition-colors flex items-center gap-1 shadow-lg shadow-brand-danger/20"
                          >
                            <Ban className="w-3.5 h-3.5" /> Banla
                          </button>
                        </div>
                      )}
                      {flag.users?.is_banned && (
                         <span className="text-xs text-text-secondary italic">Hesap yasaklı</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default SocialSecurity;