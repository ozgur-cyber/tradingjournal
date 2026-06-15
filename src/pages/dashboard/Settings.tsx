import React, { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { supabase } from '@/lib/supabase/config';
import { Shield, User, Palette, Lock, Activity, CheckCircle, AlertCircle } from 'lucide-react';

const Settings = () => {
  const { userData, user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'preferences'>('profile');
  
  // Profile State
  const [username, setUsername] = useState(userData?.username || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });

  // Security State
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityLoading, setSecurityLoading] = useState(false);
  const [securityMessage, setSecurityMessage] = useState({ type: '', text: '' });

  // Preferences State
  const { isDarkMode, toggleDarkMode } = useThemeStore();

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

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-10">
      <div>
        <h2 className="text-3xl font-bold text-text-primary tracking-tight">Hesap Ayarları</h2>
        <p className="text-text-secondary text-sm mt-1">Profilinizi, güvenlik ayarlarınızı ve tercihlerinizi yönetin.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 space-y-2">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'profile' 
                ? 'bg-brand-purple/10 dark:bg-brand-purple/20 text-brand-purple border border-brand-purple/20 dark:border-brand-purple/30 font-semibold' 
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
                ? 'bg-brand-purple/10 dark:bg-brand-purple/20 text-brand-purple border border-brand-purple/20 dark:border-brand-purple/30 font-semibold' 
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
                ? 'bg-brand-purple/10 dark:bg-brand-purple/20 text-brand-purple border border-brand-purple/20 dark:border-brand-purple/30 font-semibold' 
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover dark:hover:bg-white/5'
            }`}
          >
            <Palette className="w-5 h-5" />
            <span>Tercihler & Bildirim</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 glassmorphism p-8 rounded-2xl relative overflow-hidden">
          
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-fade-in relative z-10">
              <h3 className="text-xl font-bold text-text-primary mb-6">Genel Profil Bilgileri</h3>
              
              <div className="flex items-center space-x-6 mb-8 p-6 bg-bg-surface-hover dark:bg-black/20 rounded-xl border border-border-primary">
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-brand-purple to-brand-blue flex items-center justify-center text-3xl font-bold text-white shadow-lg">
                  {userData?.username?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-lg font-bold text-text-primary">{userData?.username || 'İsimsiz Trader'}</h4>
                  <p className="text-text-secondary text-sm">{user?.email}</p>
                  <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold border ${
                    userData?.role === 'Founder' ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30' : 
                    userData?.role === 'Admin' ? 'bg-brand-danger/20 text-brand-danger border-brand-danger/30' :
                    'bg-brand-blue/20 text-brand-blue border-brand-blue/30'
                  }`}>
                    {userData?.role || 'Kullanıcı'}
                  </span>
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
                  className="px-6 py-3 bg-brand-purple hover:bg-brand-purple/80 text-white font-bold rounded-lg transition-colors flex items-center gap-2"
                >
                  {profileLoading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : 'Değişiklikleri Kaydet'}
                </button>
              </form>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6 animate-fade-in relative z-10">
              <h3 className="text-xl font-bold text-text-primary mb-6">Güvenlik ve Şifre Değişimi</h3>
              
              {securityMessage.text && (
                <div className={`p-4 rounded-lg flex items-center space-x-2 text-sm ${
                  securityMessage.type === 'success' ? 'bg-brand-success/10 text-brand-success border border-brand-success/20' : 'bg-brand-danger/10 text-brand-danger border border-brand-danger/20'
                }`}>
                  {securityMessage.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  <span>{securityMessage.text}</span>
                </div>
              )}

              <form onSubmit={handleUpdatePassword} className="space-y-4">
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
                  <label className="block text-sm font-medium text-gray-400 mb-1">Yeni Şifre (Tekrar)</label>
                  <input 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white focus:border-brand-purple/50 outline-none"
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
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className="space-y-6 animate-fade-in relative z-10">
              <h3 className="text-xl font-bold text-text-primary mb-6">Uygulama Tercihleri</h3>
              
              <div className="space-y-6">

                <div className="flex items-center justify-between p-4 bg-bg-surface-hover dark:bg-black/20 rounded-xl border border-border-primary">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-brand-blue/20 rounded-lg text-brand-blue">
                      <Palette className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-text-primary font-bold">Karanlık Mod (Dark Mode)</h4>
                      <p className="text-sm text-text-secondary">Göz yormayan karanlık arayüz teması.</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={isDarkMode} onChange={() => toggleDarkMode()} />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-purple"></div>
                  </label>
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
