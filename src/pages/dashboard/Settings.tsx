import React, { useState, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { supabase } from '@/lib/supabase/config';
import { Shield, User, Palette, Lock, Activity, CheckCircle, AlertCircle, Camera, Bell, Globe, EyeOff, Smartphone } from 'lucide-react';

const Settings = () => {
  const { userData, user, refreshUserData } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'preferences' | 'notifications' | 'privacy'>('profile');
  
  // Profile State
  const [username, setUsername] = useState(userData?.username || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 2 * 1024 * 1024) {
      setProfileMessage({ type: 'error', text: 'Dosya boyutu en fazla 2MB olmalıdır.' });
      return;
    }

    setAvatarUploading(true);
    setProfileMessage({ type: '', text: '' });

    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const avatarUrl = urlData.publicUrl + '?t=' + Date.now();

      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: avatarUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      await refreshUserData();
      setProfileMessage({ type: 'success', text: 'Profil fotoğrafınız güncellendi!' });
    } catch (err: any) {
      setProfileMessage({ type: 'error', text: err.message || 'Fotoğraf yüklenemedi.' });
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setProfileLoading(true);
    setProfileMessage({ type: '', text: '' });
    
    try {
      const { error } = await supabase
        .from('users')
        .update({ username })
        .eq('id', user.id);
        
      if (error) throw error;
      setProfileMessage({ type: 'success', text: 'Profil bilgileriniz başarıyla güncellendi!' });
    } catch (err: any) {
      setProfileMessage({ type: 'error', text: err.message || 'Bir hata oluştu.' });
    } finally {
      setProfileLoading(false);
    }
  };

  // Security State
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityLoading, setSecurityLoading] = useState(false);
  const [securityMessage, setSecurityMessage] = useState({ type: '', text: '' });

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setSecurityMessage({ type: 'error', text: 'Şifreler eşleşmiyor!' });
      return;
    }
    if (password.length < 6) {
      setSecurityMessage({ type: 'error', text: 'Şifre en az 6 karakter olmalıdır.' });
      return;
    }
    
    setSecurityLoading(true);
    setSecurityMessage({ type: '', text: '' });
    
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSecurityMessage({ type: 'success', text: 'Şifreniz başarıyla güncellendi!' });
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setSecurityMessage({ type: 'error', text: err.message || 'Şifre güncellenemedi.' });
    } finally {
      setSecurityLoading(false);
    }
  };

  // Preferences State
  const { isDarkMode, toggleDarkMode } = useThemeStore();
  const [language, setLanguage] = useState('tr');

  // Notifications State (Dummy)
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);
  const [marketingNotif, setMarketingNotif] = useState(false);

  // Privacy State (Dummy)
  const [publicProfile, setPublicProfile] = useState(true);
  const [showPnL, setShowPnL] = useState(true);

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-10">
      <div>
        <h2 className="text-3xl font-bold text-text-primary tracking-tight">Detaylı Ayarlar</h2>
        <p className="text-text-secondary text-sm mt-1">Hesap, güvenlik, bildirimler ve gizlilik tercihlerinizi yönetin.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 space-y-2 flex-shrink-0">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'profile' 
                ? 'bg-brand-purple/10 dark:bg-brand-purple/20 text-brand-purple border border-brand-purple/20 font-semibold' 
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover dark:hover:bg-white/5'
            }`}
          >
            <User className="w-5 h-5" />
            <span>Profil Bilgileri</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('security')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'security' 
                ? 'bg-brand-purple/10 dark:bg-brand-purple/20 text-brand-purple border border-brand-purple/20 font-semibold' 
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover dark:hover:bg-white/5'
            }`}
          >
            <Shield className="w-5 h-5" />
            <span>Güvenlik & Şifre</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('preferences')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'preferences' 
                ? 'bg-brand-purple/10 dark:bg-brand-purple/20 text-brand-purple border border-brand-purple/20 font-semibold' 
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover dark:hover:bg-white/5'
            }`}
          >
            <Palette className="w-5 h-5" />
            <span>Arayüz & Tercihler</span>
          </button>

          <button 
            onClick={() => setActiveTab('notifications')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'notifications' 
                ? 'bg-brand-purple/10 dark:bg-brand-purple/20 text-brand-purple border border-brand-purple/20 font-semibold' 
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover dark:hover:bg-white/5'
            }`}
          >
            <Bell className="w-5 h-5" />
            <span>Bildirim Ayarları</span>
          </button>

          <button 
            onClick={() => setActiveTab('privacy')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'privacy' 
                ? 'bg-brand-purple/10 dark:bg-brand-purple/20 text-brand-purple border border-brand-purple/20 font-semibold' 
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover dark:hover:bg-white/5'
            }`}
          >
            <EyeOff className="w-5 h-5" />
            <span>Gizlilik</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 glassmorphism p-8 rounded-2xl relative overflow-hidden">
          
          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-fade-in relative z-10">
              <h3 className="text-xl font-bold text-text-primary mb-6">Genel Profil Bilgileri</h3>
              
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8 p-6 bg-bg-surface-hover dark:bg-black/20 rounded-xl border border-border-primary">
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  {userData?.avatar_url ? (
                    <img 
                      src={userData.avatar_url} 
                      alt="Avatar" 
                      className="w-24 h-24 rounded-full object-cover shadow-lg ring-2 ring-brand-purple/30"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-brand-purple to-brand-blue flex items-center justify-center text-3xl font-bold text-white shadow-lg">
                      {userData?.username?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {avatarUploading ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    ) : (
                      <Camera className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept="image/*" 
                    onChange={handleAvatarUpload}
                    className="hidden" 
                  />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h4 className="text-lg font-bold text-text-primary">{userData?.username || 'İsimsiz Trader'}</h4>
                  <p className="text-text-secondary text-sm mb-2">{user?.email}</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${
                    userData?.role === 'Founder' ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30' : 
                    userData?.role === 'Admin' ? 'bg-brand-danger/20 text-brand-danger border-brand-danger/30' :
                    'bg-brand-blue/20 text-brand-blue border-brand-blue/30'
                  }`}>
                    {userData?.role || 'Kullanıcı'}
                  </span>
                  <p className="text-xs text-text-secondary mt-3">Desteklenen formatlar: JPG, PNG. Maksimum dosya boyutu 2MB.</p>
                </div>
              </div>

              {profileMessage.text && (
                <div className={`p-4 rounded-lg flex items-center space-x-2 text-sm ${
                  profileMessage.type === 'success' ? 'bg-brand-success/10 text-brand-success border border-brand-success/20' : 'bg-brand-danger/10 text-brand-danger border border-brand-danger/20'
                }`}>
                  {profileMessage.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  <span>{profileMessage.text}</span>
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Kullanıcı Adı</label>
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-bg-primary border border-border-primary rounded-lg p-3 text-text-primary focus:border-brand-purple/50 outline-none transition-colors"
                    placeholder="Ekranda görünecek isminiz"
                  />
                </div>
                <button 
                  type="submit"
                  disabled={profileLoading}
                  className="px-6 py-3 bg-brand-purple hover:bg-brand-purple/80 text-white font-bold rounded-lg transition-colors flex items-center gap-2 w-full sm:w-auto justify-center"
                >
                  {profileLoading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : 'Değişiklikleri Kaydet'}
                </button>
              </form>
            </div>
          )}

          {/* SECURITY TAB */}
          {activeTab === 'security' && (
            <div className="space-y-8 animate-fade-in relative z-10">
              <div>
                <h3 className="text-xl font-bold text-text-primary mb-2">Güvenlik ve Şifre Değişimi</h3>
                <p className="text-text-secondary text-sm">Hesabınızı güvende tutmak için güçlü bir şifre kullanın.</p>
              </div>
              
              {securityMessage.text && (
                <div className={`p-4 rounded-lg flex items-center space-x-2 text-sm ${
                  securityMessage.type === 'success' ? 'bg-brand-success/10 text-brand-success border border-brand-success/20' : 'bg-brand-danger/10 text-brand-danger border border-brand-danger/20'
                }`}>
                  {securityMessage.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  <span>{securityMessage.text}</span>
                </div>
              )}

              <form onSubmit={handleUpdatePassword} className="space-y-4 bg-bg-surface-hover dark:bg-black/20 p-6 rounded-xl border border-border-primary">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Yeni Şifre</label>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-bg-primary border border-border-primary rounded-lg p-3 text-text-primary focus:border-brand-purple/50 outline-none transition-colors"
                    placeholder="En az 6 karakter"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Yeni Şifre (Tekrar)</label>
                  <input 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-bg-primary border border-border-primary rounded-lg p-3 text-text-primary focus:border-brand-purple/50 outline-none transition-colors"
                    placeholder="Şifrenizi tekrar girin"
                  />
                </div>
                <button 
                  type="submit"
                  disabled={securityLoading}
                  className="px-6 py-3 bg-brand-blue hover:bg-brand-blue/80 text-white font-bold rounded-lg transition-colors flex items-center gap-2"
                >
                  {securityLoading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <><Lock className="w-4 h-4" /> Şifreyi Güncelle</>}
                </button>
              </form>

              <div className="border-t border-border-primary pt-8">
                <h4 className="text-lg font-bold text-text-primary mb-4">Aktif Oturumlar</h4>
                <div className="bg-bg-surface-hover dark:bg-black/20 p-4 rounded-xl border border-border-primary flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-brand-success/20 rounded-lg text-brand-success">
                      <Smartphone className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-text-primary font-bold text-sm">Windows PC - Chrome</p>
                      <p className="text-text-secondary text-xs">Şu anki cihazınız (IP: 192.168.1.1)</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-brand-success bg-brand-success/10 px-2 py-1 rounded">Aktif</span>
                </div>
              </div>
            </div>
          )}

          {/* PREFERENCES TAB */}
          {activeTab === 'preferences' && (
            <div className="space-y-8 animate-fade-in relative z-10">
              <div>
                <h3 className="text-xl font-bold text-text-primary mb-2">Arayüz ve Tercihler</h3>
                <p className="text-text-secondary text-sm">Platformun görünümünü ve bölgesel ayarlarını özelleştirin.</p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-bg-surface-hover dark:bg-black/20 rounded-xl border border-border-primary">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-brand-blue/20 rounded-lg text-brand-blue">
                      <Palette className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-text-primary font-bold text-sm">Karanlık Mod (Dark Mode)</h4>
                      <p className="text-xs text-text-secondary mt-1">Göz yormayan karanlık arayüz teması.</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={isDarkMode} onChange={() => toggleDarkMode()} />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-purple"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-bg-surface-hover dark:bg-black/20 rounded-xl border border-border-primary">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-amber-500/20 rounded-lg text-amber-500">
                      <Globe className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-text-primary font-bold text-sm">Platform Dili</h4>
                      <p className="text-xs text-text-secondary mt-1">NovaTrade arayüz dili (Şu an sadece TR).</p>
                    </div>
                  </div>
                  <select 
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="bg-bg-primary border border-border-primary text-text-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-purple"
                  >
                    <option value="tr">Türkçe</option>
                    <option value="en" disabled>English (Yakında)</option>
                  </select>
                </div>

              </div>
            </div>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === 'notifications' && (
            <div className="space-y-8 animate-fade-in relative z-10">
              <div>
                <h3 className="text-xl font-bold text-text-primary mb-2">Bildirim Ayarları</h3>
                <p className="text-text-secondary text-sm">Hangi konularda bildirim almak istediğinizi seçin.</p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-bg-surface-hover dark:bg-black/20 rounded-xl border border-border-primary">
                  <div>
                    <h4 className="text-text-primary font-bold text-sm">E-posta Bildirimleri</h4>
                    <p className="text-xs text-text-secondary mt-1">Önemli hesap güncellemeleri ve güvenlik uyarıları.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={emailNotif} onChange={() => setEmailNotif(!emailNotif)} />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-purple"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-bg-surface-hover dark:bg-black/20 rounded-xl border border-border-primary">
                  <div>
                    <h4 className="text-text-primary font-bold text-sm">Tarayıcı Bildirimleri</h4>
                    <p className="text-xs text-text-secondary mt-1">Sosyal akış etkileşimleri (Beğeniler vb.) anında ekranda görünsün.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={pushNotif} onChange={() => setPushNotif(!pushNotif)} />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-purple"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-bg-surface-hover dark:bg-black/20 rounded-xl border border-border-primary">
                  <div>
                    <h4 className="text-text-primary font-bold text-sm">Pazarlama ve Yenilikler</h4>
                    <p className="text-xs text-text-secondary mt-1">Yeni özellikler ve güncellemeler hakkında bültenler.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={marketingNotif} onChange={() => setMarketingNotif(!marketingNotif)} />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-purple"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* PRIVACY TAB */}
          {activeTab === 'privacy' && (
            <div className="space-y-8 animate-fade-in relative z-10">
              <div>
                <h3 className="text-xl font-bold text-text-primary mb-2">Gizlilik ve Görünürlük</h3>
                <p className="text-text-secondary text-sm">Profilinizin ve işlemlerinizin platformdaki görünürlüğünü ayarlayın.</p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-bg-surface-hover dark:bg-black/20 rounded-xl border border-border-primary">
                  <div>
                    <h4 className="text-text-primary font-bold text-sm">Herkese Açık Profil</h4>
                    <p className="text-xs text-text-secondary mt-1">Profilinizin Sosyal Akış ve Leaderboard'da görünmesine izin verin.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={publicProfile} onChange={() => setPublicProfile(!publicProfile)} />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-purple"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-bg-surface-hover dark:bg-black/20 rounded-xl border border-border-primary">
                  <div>
                    <h4 className="text-text-primary font-bold text-sm">İşlem Tutarlarını Gizle</h4>
                    <p className="text-xs text-text-secondary mt-1">Sosyal akışta sadece işlemin yönü ve stratejisi görünsün, $ miktarları gizlensin.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={!showPnL} onChange={() => setShowPnL(!showPnL)} />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-purple"></div>
                  </label>
                </div>

              </div>

              <div className="mt-8 pt-8 border-t border-border-primary">
                <h4 className="text-lg font-bold text-brand-danger mb-4">Tehlikeli Bölge</h4>
                <div className="p-4 rounded-xl border border-brand-danger/30 bg-brand-danger/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <p className="text-text-primary font-bold text-sm">Hesabı Kalıcı Olarak Sil</p>
                    <p className="text-text-secondary text-xs mt-1">Tüm işlem geçmişiniz, verileriniz ve ayarlarınız geri döndürülemez şekilde silinir.</p>
                  </div>
                  <button className="px-4 py-2 bg-brand-danger/20 hover:bg-brand-danger text-brand-danger hover:text-white transition-colors rounded-lg text-sm font-bold whitespace-nowrap">
                    Hesabımı Sil
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Decorative Glow */}
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-brand-purple/10 blur-[100px] rounded-full pointer-events-none"></div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
