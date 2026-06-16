import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/config';
import { ShieldAlert, UserCog, UserX, Search, Filter, Users, ShieldCheck, Ban, CheckCircle, Eye, X, Lock, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';

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
  banned_by?: string;
  ban_reason?: string;
  warn_count?: number;
  ban_until?: string;
}

const AdminPanel = () => {
  const { userData, user } = useAuthStore();
  const isFounder = userData?.role === 'Founder' || user?.email === 'forexrico16@gmail.com' || user?.email === 'admin@gmail.com';

  const maskEmail = (email: string) => {
    if (!email) return '***@***.com';
    const parts = email.split('@');
    if (parts.length !== 2) return '***@***.com';
    const [name, domain] = parts;
    if (name.length <= 2) return `***@${domain}`;
    return `${name.substring(0, 2)}***@${domain}`;
  };
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [selectedUserTrades, setSelectedUserTrades] = useState<any[]>([]);
  const [loadingTrades, setLoadingTrades] = useState(false);
  
  // Admin Passcode & Ban Modal States
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [adminPasscode, setAdminPasscode] = useState('');
  const [banModalUser, setBanModalUser] = useState<{ id: string, name: string } | null>(null);
  const [banReason, setBanReason] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    const isFounderEmail = user?.email === 'forexrico16@gmail.com' || user?.email === 'admin@gmail.com';
    if (userData && userData.role === 'User' && !isFounderEmail) {
      navigate('/dashboard');
    }
  }, [userData, user, navigate]);

  useEffect(() => {
    const isFounderEmail = user?.email === 'forexrico16@gmail.com' || user?.email === 'admin@gmail.com';
    if (userData && (userData.role !== 'User' || isFounderEmail)) {
      fetchUsers();
      fetchSettings();
    }
  }, [userData, user]);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase.from('platform_settings').select('admin_passcode').eq('id', 1).single();
      if (!error && data) setAdminPasscode(data.admin_passcode || '');
    } catch (error) {}
  };

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
      console.log("Fetching users...");
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Fetch Error:", error);
        throw error;
      }
      console.log("Users fetched:", data);
      if (data) setUsers(data as UserData[]);
    } catch (error) {
      console.error("Kullanıcılar getirilirken hata:", error);
    } finally {
      console.log("Setting loading to false");
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

  const handleBanToggle = async (userId: string, currentStatus: boolean, reason?: string) => {
    if (userData?.role !== 'Founder' && userData?.role !== 'Admin') return;
    
    const targetUser = users.find(u => u.id === userId);
    if (targetUser?.role === 'Founder') return;

    if (!currentStatus && !reason) {
      setBanModalUser({ id: userId, name: targetUser?.username || targetUser?.email || '' });
      return;
    }

    setUpdatingId(userId);
    try {
      const updates = currentStatus 
        ? { is_banned: false, ban_reason: null, banned_by: null }
        : { is_banned: true, ban_reason: reason, banned_by: user?.email };

      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId);

      if (error) throw error;
      setUsers(users.map(u => u.id === userId ? { ...u, ...updates } : u));
      setBanModalUser(null);
      setBanReason('');
    } catch (error) {
      console.error("Ban durumu güncellenirken hata:", error);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleWarn = async (userId: string) => {
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser || targetUser.role === 'Founder') return;

    const reason = prompt(`${targetUser.username || targetUser.email} kullanıcısına uyarı vermek için sebep yazın:`);
    if (!reason) return;

    const currentWarns = (targetUser.warn_count || 0) + 1;
    
    // Escalating ban system
    let banDays = 0;
    let banMessage = '';
    if (currentWarns >= 6) {
      banDays = 180;
      banMessage = `\n\n🚨 ${currentWarns}. uyarı! 180 GÜN BAN uygulandı.`;
    } else if (currentWarns === 5) {
      banDays = 60;
      banMessage = `\n\n🚨 5. uyarı! 60 GÜN BAN uygulandı.`;
    } else if (currentWarns === 4) {
      banDays = 30;
      banMessage = `\n\n🚨 4. uyarı! 30 GÜN BAN uygulandı.`;
    } else if (currentWarns === 3) {
      banDays = 7;
      banMessage = `\n\n🚨 3. uyarı! 7 GÜN BAN uygulandı.`;
    } else {
      banMessage = `\n\nKalan hak: ${3 - currentWarns} uyarı sonra ban başlayacak.`;
    }

    if (!confirm(`${targetUser.username || targetUser.email} kullanıcısına ${currentWarns}. uyarı verilecek.${banMessage}\n\nOnaylıyor musunuz?`)) return;

    setUpdatingId(userId);
    try {
      const updates: any = {
        warn_count: currentWarns,
      };

      if (banDays > 0) {
        const banUntil = new Date();
        banUntil.setDate(banUntil.getDate() + banDays);
        updates.ban_until = banUntil.toISOString();
        updates.is_banned = true;
        updates.ban_reason = `${currentWarns}. uyarı: ${reason} (${banDays} gün ban)`;
        updates.banned_by = user?.email;
      }

      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId);

      if (error) throw error;
      setUsers(users.map(u => u.id === userId ? { ...u, ...updates } : u));
      alert(`✅ Uyarı verildi! (${currentWarns}/3)${banMessage}`);
    } catch (error) {
      console.error("Uyarı verilirken hata:", error);
      alert("Uyarı verilemedi.");
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = (user.username?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
                          (isFounder && user.email.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = roleFilter === 'All' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const totalUsers = users.length;
  const adminCount = users.filter(u => u.role === 'Admin' || u.role === 'Founder').length;
  const bannedCount = users.filter(u => u.is_banned).length;

  if (userData?.role !== 'Admin' && userData?.role !== 'Founder' && user?.email !== 'forexrico16@gmail.com') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center p-8 glassmorphism rounded-2xl max-w-md w-full">
          <div className="w-20 h-20 bg-brand-danger/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="w-10 h-10 text-brand-danger" />
          </div>
          <h2 className="text-3xl font-bold text-text-primary mb-2">Erişim Engellendi</h2>
          <p className="text-text-secondary">Bu sayfayı görüntülemek için yetkiye sahip olmalısınız.</p>
        </div>
      </div>
    );
  }

  if (!isUnlocked && userData?.role !== 'Founder') {
    return (
      <div className="flex items-center justify-center min-h-[60vh] animate-fade-in">
        <div className="glassmorphism p-8 rounded-2xl max-w-md w-full text-center shadow-xl border border-brand-purple/20">
          <div className="w-20 h-20 bg-brand-purple/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_15px_rgba(139,92,246,0.2)]">
            <Lock className="w-10 h-10 text-brand-purple" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">Yönetici Şifresi</h2>
          <p className="text-text-secondary mb-8 text-sm">Admin paneline erişmek için güvenlik şifresini giriniz.</p>
          <div className="space-y-4">
            <input 
              type="password" 
              value={passcodeInput}
              onChange={(e) => setPasscodeInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (passcodeInput === userData?.admin_passcode || (userData?.admin_passcode && userData.admin_passcode.length === 0)) setIsUnlocked(true);
                  else alert("Hatalı Şifre!");
                }
              }}
              placeholder="Şifreniz..."
              className="w-full bg-bg-surface-hover border border-border-primary rounded-xl py-3 px-4 text-center tracking-widest font-mono text-xl focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple transition-all text-text-primary"
            />
            <button 
              onClick={() => {
                if (passcodeInput === userData?.admin_passcode || (userData?.admin_passcode && userData.admin_passcode.length === 0)) setIsUnlocked(true);
                else alert("Hatalı Şifre!");
              }}
              className="w-full bg-brand-purple text-white py-3 rounded-xl font-bold shadow-[0_0_15px_rgba(139,92,246,0.3)] hover:shadow-[0_0_25px_rgba(139,92,246,0.5)] transition-all cursor-pointer hover:bg-brand-blue"
            >
              KİLİDİ AÇ
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black bg-gradient-to-r from-brand-purple via-[#a855f7] to-brand-blue bg-clip-text text-transparent tracking-tight mb-1">Sistem Yönetimi</h2>
          <p className="text-text-secondary text-sm font-medium">Platformdaki tüm kullanıcıları, yetkileri ve durumları yönetin.</p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Bireysel Şifre Sistemi Aktif */}
          <div className="flex items-center space-x-2 bg-brand-danger/10 px-4 py-2.5 rounded-xl border border-brand-danger/30 shadow-[0_0_20px_rgba(239,68,68,0.15)]">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-danger opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-danger shadow-[0_0_10px_rgba(239,68,68,0.8)]"></span>
            </span>
            <span className="text-sm font-bold text-brand-danger uppercase tracking-wider">Admin Modu Aktif</span>
          </div>
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
                            <div className="text-xs text-text-secondary">{isFounder ? user.email : maskEmail(user.email)}</div>
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
                            <div className="mt-2 flex flex-col space-y-1.5">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold bg-brand-danger/20 text-brand-danger w-fit">
                                YASAKLI
                              </span>
                              {user.ban_reason && (
                                <span className="text-[10px] text-text-secondary bg-bg-surface-hover px-2 py-1.5 rounded border border-border-primary block max-w-xs">
                                  <span className="font-semibold block mb-0.5 opacity-70">Sebep:</span> 
                                  {user.ban_reason}
                                </span>
                              )}
                            </div>
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
                        <div className="flex items-center justify-end space-x-2">
                          {/* View Details Button */}
                          <button
                            onClick={() => setSelectedUser(user)}
                            className="p-2 rounded-lg border bg-brand-blue/10 border-brand-blue/30 text-brand-blue hover:bg-brand-blue/20 transition-colors"
                            title="Detayları Gör"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          {/* Ban / Unban Toggle */}
                          <button
                            onClick={() => handleBanToggle(user.id, user.is_banned)}
                            disabled={updatingId === user.id || user.role === 'Founder'}
                            className={`p-2 rounded-lg border transition-colors ${
                              user.role === 'Founder' 
                                ? 'opacity-30 cursor-not-allowed bg-gray-500/10 border-gray-500/30 text-gray-500'
                                : user.is_banned 
                                  ? 'bg-brand-success/10 border-brand-success/30 text-brand-success hover:bg-brand-success/20' 
                                  : 'bg-brand-danger/10 border-brand-danger/30 text-brand-danger hover:bg-brand-danger/20'
                            }`}
                            title={user.is_banned ? 'Yasağı Kaldır' : 'Kullanıcıyı Yasakla'}
                          >
                            {user.is_banned ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                          </button>

                          {/* Warn Button */}
                          <button
                            onClick={() => handleWarn(user.id)}
                            disabled={updatingId === user.id || user.role === 'Founder'}
                            className={`p-2 rounded-lg border transition-colors relative ${
                              user.role === 'Founder'
                                ? 'opacity-30 cursor-not-allowed bg-gray-500/10 border-gray-500/30 text-gray-500'
                                : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/20'
                            }`}
                            title={`Uyarı Ver (Mevcut: ${user.warn_count || 0}/3)`}
                          >
                            <AlertTriangle className="w-4 h-4" />
                            {(user.warn_count || 0) > 0 && (
                              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-yellow-500 text-black text-[9px] font-black rounded-full flex items-center justify-center">
                                {user.warn_count}
                              </span>
                            )}
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
                                  disabled={updatingId === user.id || user.role === 'Founder'}
                                  className={`inline-flex items-center space-x-1 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                                    user.role === 'Founder'
                                      ? 'opacity-30 cursor-not-allowed bg-gray-500/10 border-gray-500/30 text-gray-400'
                                      : 'bg-gray-500/10 hover:bg-gray-500/20 text-gray-400 border border-gray-500/30'
                                  }`}
                                >
                                  <UserX className="w-4 h-4 mr-1" />
                                  Yetkiyi Al
                                </button>
                              )}
                              
                              {user.role === 'Admin' && (
                                <button
                                  onClick={async () => {
                                    if(!confirm(`${user.email} için yeni bir admin şifresi üretmek istediğinize emin misiniz?`)) return;
                                    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
                                    try {
                                      await supabase.from('users').update({ admin_passcode: newCode }).eq('id', user.id);
                                      alert(`Yeni Admin Şifresi: ${newCode}\n\n(Lütfen bu şifreyi sadece ${user.email} ile paylaşın)`);
                                      setUsers(users.map(u => u.id === user.id ? { ...u, admin_passcode: newCode } : u));
                                    } catch (e) {
                                      alert("Şifre üretilirken bir hata oluştu.");
                                    }
                                  }}
                                  className="inline-flex items-center space-x-1 px-3 py-2 bg-brand-success/10 hover:bg-brand-success/20 text-brand-success border border-brand-success/30 rounded-lg text-xs font-semibold transition-colors"
                                >
                                  <Lock className="w-4 h-4 mr-1" />
                                  Şifre Üret
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
      </div>
      {/* Ban Modal */}
      {banModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-bg-surface border border-border-primary rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-brand-danger/20 rounded-full flex items-center justify-center">
                <Ban className="w-5 h-5 text-brand-danger" />
              </div>
              <h3 className="text-xl font-bold text-text-primary">Kullanıcıyı Yasakla</h3>
            </div>
            <p className="text-text-secondary text-sm mb-6"><span className="font-bold text-text-primary">{banModalUser.name}</span> adlı kullanıcıyı sistemden yasaklamak üzeresiniz. Lütfen geçerli bir sebep belirtin.</p>
            <div className="mb-6">
              <label className="block text-sm font-semibold text-text-secondary mb-2">Yasaklama Sebebi (Zorunlu)</label>
              <textarea 
                value={banReason}
                onChange={e => setBanReason(e.target.value)}
                className="w-full bg-bg-surface-hover border border-border-primary rounded-xl p-3 focus:border-brand-danger focus:ring-1 focus:ring-brand-danger outline-none transition-all resize-none text-text-primary"
                placeholder="Örn: Argo kullanım, hileli işlemler..."
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => { setBanModalUser(null); setBanReason(''); }}
                className="px-4 py-2 border border-border-primary rounded-xl text-text-primary hover:bg-bg-surface-hover font-medium transition-colors"
              >
                İptal
              </button>
              <button 
                disabled={!banReason.trim()}
                onClick={() => handleBanToggle(banModalUser.id, false, banReason)}
                className="px-4 py-2 bg-brand-danger text-white rounded-xl hover:bg-red-600 disabled:opacity-50 font-medium shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-all"
              >
                Yasakla
              </button>
            </div>
          </div>
        </div>
      )}

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
                  <p className="text-text-secondary text-sm">{isFounder ? selectedUser.email : maskEmail(selectedUser.email)}</p>
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
