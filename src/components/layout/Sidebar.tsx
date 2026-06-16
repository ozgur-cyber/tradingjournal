import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Target, Trophy, Users, ShieldAlert, Settings, X } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

const Sidebar = ({ isOpen, onClose }: { isOpen?: boolean, onClose?: () => void }) => {
  const { userData, user } = useAuthStore();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'İşlem Kayıtları', path: '/trades', icon: BookOpen },
    { name: 'Stratejiler', path: '/strategies', icon: Target },
    { name: 'Leaderboard', path: '/leaderboard', icon: Trophy },
    { name: 'Sosyal Akış', path: '/social', icon: Users },
  ];

  const isFounderEmail = user?.email === 'forexrico16@gmail.com' || user?.email === 'admin@gmail.com';
  if (userData?.role === 'Admin' || userData?.role === 'Founder' || isFounderEmail) {
    navItems.push({ name: 'Admin Paneli', path: '/admin', icon: ShieldAlert });
  }

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}
      
      <aside className={`flex flex-col w-[260px] h-[calc(100vh-2rem)] fixed left-4 top-4 bg-bg-surface/90 dark:bg-[#131320]/95 backdrop-blur-xl border border-border-primary/50 dark:border-white/5 rounded-3xl p-6 transition-all duration-300 shadow-2xl z-50 ${isOpen ? 'translate-x-0' : '-translate-x-[150%] md:translate-x-0'} md:flex`}>
        <div className="mb-10 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-purple to-brand-blue flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.5)]">
              <Target className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-brand-purple to-brand-blue bg-clip-text text-transparent tracking-tight">
              NovaTrade
            </h1>
          </div>
          {/* Close button for mobile */}
          <button onClick={onClose} className="md:hidden p-1 text-text-secondary hover:text-text-primary">
            <X className="w-5 h-5" />
          </button>
        </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? 'bg-brand-purple/10 dark:bg-brand-purple/20 text-brand-purple border border-brand-purple/20 dark:border-brand-purple/30 shadow-[0_0_15px_rgba(139,92,246,0.1)] dark:shadow-[0_0_15px_rgba(139,92,246,0.15)]'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover dark:hover:bg-white/5'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.name}</span>
          </NavLink>
        ))}
      </nav>

      </aside>
    </>
  );
};

export default Sidebar;
