import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/config';
import { ShieldAlert, UserCog, UserX, Search, Filter, Users, ShieldCheck, Ban, CheckCircle, Eye, X } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

interface UserData {
  id: string;
  email: string;
  username: string;
  role: 'User' | 'Admin' | 'Founder';
  is_banned: boolean;
  total_trades: number;
  win_trades: number;
  total_pnl: number;
  win_rate: number;
  created_at: string;
}

const AdminPanel = () => {
  const { userData } = useAuthStore();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [selectedUserTrades, setSelectedUserTrades] = useState<any[]>([]);
  const [loadingTrades, setLoadingTrades] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      fetchUserTrades(selectedUser.id);
    } else {
      setSelectedUserTrades([]);
    }
  }, [selectedUser]);

  const fetchUserTrades = async (userId: string) => {
    setLoadingTrades(true);
    try {
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      if (data) setSelectedUserTrades(data);
    } catch (error) {
      console.error("Kullanıcı işlemleri getirilirken hata:", error);
    } finally {
      setLoadingTrades(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setUsers(data as UserData[]);
    } catch (error) {
      console.error("Kullanıcılar getirilirken hata:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'User' | 'Admin') => {
    if (userData?.role !== 'Founder') return;
    
    const targetUser = users.find(u => u.id === userId);
    if (targetUser?.role === 'Founder') return;

    setUpdatingId(userId);
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (error) {
      console.error("Rol güncellenirken hata:", error);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleBanToggle = async (userId: string, currentStatus: boolean) => {
    if (userData?.role !== 'Founder' && userData?.role !== 'Admin') return;
    
    const targetUser = users.find(u => u.id === userId);
    if (targetUser?.role === 'Founder') return;

    setUpdatingId(userId);
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_banned: !currentStatus })
        .eq('id', userId);

      if (error) throw error;
      setUsers(users.map(u => u.id === userId ? { ...u, is_banned: !currentStatus } : u));
    } catch (error) {
      console.error("Ban durumu güncellenirken hata:", error);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = (user.username?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
                          user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'All' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const totalUsers = users.length;
  const adminCount = users.filter(u => u.role === 'Admin' || u.role === 'Founder').length;
  const bannedCount = users.filter(u => u.is_banned).length;

  if (userData?.role !== 'Admin' && userData?.role !== 'Founder') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center p-8 glassmorphism rounded-2xl max-w-md w-full">
          <div className="w-20 h-20 bg-brand-danger/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="w-10 h-10 text-brand-danger" />
          </div>
          <h2 className="text-3xl font-bold text-text-primary mb-2">Erişim Engellendi</h2>
          <p className="text-text-secondary">Bu sayfayı görüntülemek için "Founder" veya "Admin" yetkisine sahip olmalısınız.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-text-primary tracking-tight">Sistem Yönetimi</h2>
          <p className="text-text-secondary text-sm mt-1">Platformdaki tüm kullanıcıları, yetkileri ve durumları yönetin.</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-danger opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-danger"></span>
          </span>
          <span className="text-sm font-medium text-brand-danger">Admin Modu Aktif</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glassmorphism p-6 rounded-2xl relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-text-secondary text-sm font-medium mb-1">Toplam Kullanıcı</p>
              <h3 className="text-3xl font-bold text-text-primary">{totalUsers}</h3>
            </div>
            <div className="p-3 bg-brand-blue/20 rounded-xl text-brand-blue">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-brand-blue/10 blur-3xl rounded-full pointer-events-none"></div>
        </div>

        <div className="glassmorphism p-6 rounded-2xl relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-text-secondary text-sm font-medium mb-1">Yetkili Personel</p>
              <h3 className="text-3xl font-bold text-text-primary">{adminCount}</h3>
            </div>
            <div className="p-3 bg-brand-purple/20 rounded-xl text-brand-purple">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>
          <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-brand-purple/10 blur-3xl rounded-full pointer-events-none"></div>
        </div>

        <div className="glassmorphism p-6 rounded-2xl relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-text-secondary text-sm font-medium mb-1">Engellenen Hesaplar</p>
              <h3 className="text-3xl font-bold text-text-primary">{bannedCount}</h3>
            </div>
            <div className="p-3 bg-brand-danger/20 rounded-xl text-brand-danger">
              <UserX className="w-6 h-6" />
            </div>
          </div>
          <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-brand-danger/10 blur-3xl rounded-full pointer-events-none"></div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between glassmorphism p-4 rounded-2xl">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Kullanıcı adı veya e-posta ara..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-bg-surface-hover dark:bg-black/30 border border-border-primary rounded-xl py-2.5 pl-10 pr-4 text-sm text-text-primary placeholder-text-secondary focus:outline-none focus:border-brand-purple/50 focus:ring-1 focus:ring-brand-purple/50 transition-all"
          />
        </div>
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <Filter className="w-5 h-5 text-gray-400 hidden md:block" />
          <select 
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full md:w-auto bg-bg-surface-hover dark:bg-black/30 border border-border-primary rounded-xl py-2.5 px-4 text-sm text-text-primary focus:outline-none focus:border-brand-purple/50 appearance-none"
          >
            <option value="All">Tüm Roller</option>
            <option value="Founder">Kurucular</option>
            <option value="Admin">Adminler</option>
            <option value="User">Standart Üyeler</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="glassmorphism rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-purple mb-4"></div>
            <p className="text-gray-400 font-medium">Sistem verileri taranıyor...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-bg-surface-hover dark:bg-black/40 border-b border-border-primary">
                  <th className="p-5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Kullanıcı Bilgisi</th>
                  <th className="p-5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Rol & Durum</th>
                  <th className="p-5 text-xs font-semibold text-text-secondary uppercase tracking-wider hidden md:table-cell">Performans</th>
                  <th className="p-5 text-xs font-semibold text-text-secondary uppercase tracking-wider text-right">Aksiyonlar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-primary">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-text-secondary">
                      Kriterlere uygun kullanıcı bulunamadı.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-bg-surface-hover dark:hover:bg-white/[0.02] transition-colors group">
                      <td className="p-5">
                        <div className="flex items-center space-x-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-lg ${
                            user.role === 'Founder' ? 'bg-gradient-to-tr from-yellow-400 to-orange-500' :
                            user.role === 'Admin' ? 'bg-gradient-to-tr from-brand-danger to-red-600' :
                            'bg-gradient-to-tr from-brand-purple to-brand-blue'
                          }`}>
                            {user.username?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-text-primary flex items-center space-x-2">
                              <span>{user.username || 'İsimsiz Trader'}</span>
                              {user.is_banned && <Ban className="w-3.5 h-3.5 text-brand-danger" />}
                            </div>
                            <div className="text-xs text-text-secondary">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-5">
                        <div className="flex flex-col items-start space-y-2">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${
                            user.role === 'Founder' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 
                            user.role === 'Admin' ? 'bg-brand-danger/10 text-brand-danger border-brand-danger/20' : 
                            'bg-brand-blue/10 text-brand-blue border-brand-blue/20'
                          }`}>
                            {user.role}
                          </span>
                          {user.is_banned && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold bg-brand-danger/20 text-brand-danger">
                              YASAKLI
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-5 hidden md:table-cell">
                        <div className="flex items-center space-x-4">
                          <div>
                            <p className="text-xs text-text-secondary">İşlemler</p>
                            <p className="font-semibold text-text-primary">{user.total_trades || 0}</p>
                          </div>
                          <div>
                            <p className="text-xs text-text-secondary">Win Rate</p>
                            <p className="font-semibold text-brand-success">%{(user.win_rate || 0).toFixed(1)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-text-secondary">PnL</p>
                            <p className={`font-semibold ${
                              (user.total_pnl || 0) >= 0 ? 'text-brand-success' : 'text-brand-danger'
                            }`}>
                              ${(user.total_pnl || 0).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-5 text-right">
                        <div className="flex items-center justify-end space-x-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                          {/* View Details Button */}
                          <button
                            onClick={() => setSelectedUser(user)}
                            className="p-2 rounded-lg border bg-brand-blue/10 border-brand-blue/30 text-brand-blue hover:bg-brand-blue/20 transition-colors"
                            title="Detayları Gör"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          {user.role !== 'Founder' && (
                            <>
                              {/* Ban / Unban Toggle */}
                            <button
                              onClick={() => handleBanToggle(user.id, user.is_banned)}
                              disabled={updatingId === user.id}
                              className={`p-2 rounded-lg border transition-colors ${
                                user.is_banned 
                                  ? 'bg-brand-success/10 border-brand-success/30 text-brand-success hover:bg-brand-success/20' 
                                  : 'bg-brand-danger/10 border-brand-danger/30 text-brand-danger hover:bg-brand-danger/20'
                              }`}
                              title={user.is_banned ? 'Yasağı Kaldır' : 'Kullanıcıyı Yasakla'}
                            >
                              {user.is_banned ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                            </button>

                            {/* Role Toggle - Only Founder can do this */}
                            {userData?.role === 'Founder' && (
                              <>
                                {user.role === 'User' ? (
                                  <button
                                    onClick={() => handleRoleChange(user.id, 'Admin')}
                                    disabled={updatingId === user.id}
                                    className="inline-flex items-center space-x-1 px-3 py-2 bg-brand-purple/10 hover:bg-brand-purple/20 text-brand-purple border border-brand-purple/30 rounded-lg text-xs font-semibold transition-colors"
                                  >
                                    <UserCog className="w-4 h-4 mr-1" />
                                    Admin Yap
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleRoleChange(user.id, 'User')}
                                    disabled={updatingId === user.id}
                                    className="inline-flex items-center space-x-1 px-3 py-2 bg-gray-500/10 hover:bg-gray-500/20 text-gray-400 border border-gray-500/30 rounded-lg text-xs font-semibold transition-colors"
                                  >
                                    <UserX className="w-4 h-4 mr-1" />
                                    Yetkiyi Al
                                  </button>
                                )}
                              </>
                              )}
                            </>
                          )}
                        </div>
                        {user.role === 'Founder' && (
                          <span className="text-xs text-yellow-500/50 font-medium italic">Değiştirilemez</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-bg-surface border border-border-primary rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-border-primary bg-bg-surface-hover">
              <h3 className="text-xl font-bold text-text-primary">Kullanıcı Detayları</h3>
              <button 
                onClick={() => setSelectedUser(null)}
                className="text-text-secondary hover:text-text-primary transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-purple to-brand-blue flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                  {selectedUser.username?.charAt(0).toUpperCase() || selectedUser.email.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-xl font-bold text-text-primary">{selectedUser.username || 'İsimsiz Trader'}</h4>
                  <p className="text-text-secondary text-sm">{selectedUser.email}</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold mt-1 ${
                    selectedUser.role === 'Founder' ? 'bg-yellow-500/10 text-yellow-500' : 
                    selectedUser.role === 'Admin' ? 'bg-brand-danger/10 text-brand-danger' : 
                    'bg-brand-blue/10 text-brand-blue'
                  }`}>
                    {selectedUser.role}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-bg-surface-hover dark:bg-black/20 p-4 rounded-xl border border-border-primary">
                  <p className="text-xs text-text-secondary mb-1">Toplam İşlem</p>
                  <p className="text-xl font-bold text-text-primary">{selectedUser.total_trades || 0}</p>
                </div>
                <div className="bg-bg-surface-hover dark:bg-black/20 p-4 rounded-xl border border-border-primary">
                  <p className="text-xs text-text-secondary mb-1">Kazanma Oranı</p>
                  <p className="text-xl font-bold text-brand-success">%{(selectedUser.win_rate || 0).toFixed(1)}</p>
                </div>
                <div className="col-span-2 bg-bg-surface-hover dark:bg-black/20 p-4 rounded-xl border border-border-primary">
                  <p className="text-xs text-text-secondary mb-1">Toplam PnL</p>
                  <p className={`text-2xl font-bold ${
                    (selectedUser.total_pnl || 0) >= 0 ? 'text-brand-success' : 'text-brand-danger'
                  }`}>
                    ${(selectedUser.total_pnl || 0).toFixed(2)}
                  </p>
                </div>
              </div>
              
              <div className="pt-4 border-t border-border-primary">
                <h5 className="font-bold text-text-primary mb-3">Son İşlemler</h5>
                {loadingTrades ? (
                  <div className="flex justify-center p-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-purple"></div>
                  </div>
                ) : selectedUserTrades.length === 0 ? (
                  <p className="text-text-secondary text-sm italic">Kullanıcının henüz işlemi bulunmuyor.</p>
                ) : (
                  <div className="space-y-3">
                    {selectedUserTrades.map(trade => (
                      <div key={trade.id} className="bg-bg-surface-hover dark:bg-black/20 p-3 rounded-lg border border-border-primary flex justify-between items-center">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-text-primary text-sm">{trade.pair}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${trade.direction === 'LONG' ? 'bg-brand-success/10 text-brand-success' : 'bg-brand-danger/10 text-brand-danger'}`}>
                              {trade.direction}
                            </span>
                          </div>
                          <p className="text-xs text-text-secondary mt-1">
                            {trade.strategy || 'Strateji Belirtilmedi'} 
                            {trade.risk_reward ? <span className="ml-2 px-1.5 py-0.5 rounded bg-bg-primary text-[10px] border border-border-primary">{trade.risk_reward}R</span> : ''}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold text-sm ${trade.pnl >= 0 ? 'text-brand-success' : 'text-brand-danger'}`}>
                            {trade.pnl >= 0 ? '+' : ''}{trade.pnl.toFixed(2)}$
                          </p>
                          <p className="text-[10px] text-text-secondary mt-1">
                            {new Date(trade.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="pt-4 border-t border-border-primary">
                <p className="text-xs text-text-secondary mb-1">Kayıt Tarihi</p>
                <p className="text-sm font-medium text-text-primary">
                  {new Date(selectedUser.created_at).toLocaleDateString('tr-TR', { 
                    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute:'2-digit'
                  })}
                </p>
              </div>
            </div>
            
            <div className="p-6 border-t border-border-primary bg-bg-surface-hover flex justify-end">
              <button 
                onClick={() => setSelectedUser(null)}
                className="px-6 py-2 bg-brand-surface border border-border-primary rounded-lg text-text-primary hover:bg-bg-surface transition-colors font-medium"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
