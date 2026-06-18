import React, { useState, useRef, useEffect } from 'react';
import { Menu, Bell, Search, LogOut, Settings, User } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';

const TopBar = ({ onMenuClick }: { onMenuClick?: () => void }) => {
  const { userData, signOut } = useAuthStore();
  const navigate = useNavigate();
  
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <header className="h-20 flex items-center justify-between px-6 lg:px-10 border-b border-border-primary bg-bg-surface/80 dark:bg-brand-ultra-dark/80 backdrop-blur-md sticky top-0 z-40 transition-colors duration-300">
      <div className="flex-1 flex items-center">
        <button 
          onClick={onMenuClick}
          className="md:hidden p-2 -ml-2 mr-2 text-text-secondary hover:text-text-primary transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="p-2 text-text-secondary hover:text-text-primary transition-colors relative"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-brand-purple rounded-full animate-pulse"></span>
          </button>
          
          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-bg-surface border border-border-primary rounded-xl shadow-2xl py-2 z-50 animate-fade-in">
              <div className="px-4 py-2 border-b border-border-primary">
                <h4 className="text-text-primary font-bold text-sm">Bildirimler</h4>
              </div>
              <div className="p-4 text-center text-text-secondary text-sm">
                Henüz yeni bildiriminiz yok.
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-3 border-l border-border-primary pl-4 relative" ref={profileRef}>
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-text-primary">{userData?.username || 'Trader'}</p>
            <p className="text-xs text-brand-purple">{userData?.role}</p>
          </div>
          
          <div 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-purple to-brand-blue flex items-center justify-center text-white font-bold cursor-pointer shadow-[0_0_15px_rgba(139,92,246,0.3)] hover:scale-105 transition-transform"
          >
            {userData?.avatar_url ? <img src={userData.avatar_url} className="w-full h-full rounded-full object-cover" /> : (userData?.username?.charAt(0).toUpperCase() || 'U')}
          </div>

          {isProfileOpen && (
            <div className="absolute top-12 right-0 w-48 bg-bg-surface border border-border-primary rounded-xl shadow-2xl py-2 z-50 animate-fade-in">
              <button 
                onClick={() => { navigate(`/profile/${userData?.username}`); setIsProfileOpen(false); }}
                className="w-full text-left px-4 py-2 text-sm text-text-secondary hover:bg-bg-surface-hover dark:hover:bg-white/5 hover:text-text-primary flex items-center gap-2 transition-colors"
              >
                <User className="w-4 h-4" /> Profilim
              </button>
              <button 
                onClick={() => { navigate('/settings'); setIsProfileOpen(false); }}
                className="w-full text-left px-4 py-2 text-sm text-text-secondary hover:bg-bg-surface-hover dark:hover:bg-white/5 hover:text-text-primary flex items-center gap-2 transition-colors"
              >
                <Settings className="w-4 h-4" /> Ayarlar
              </button>
              <div className="my-1 border-t border-border-primary"></div>
              <button 
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-brand-danger hover:bg-brand-danger/10 flex items-center gap-2 transition-colors"
              >
                <LogOut className="w-4 h-4" /> Çıkış Yap
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopBar;
