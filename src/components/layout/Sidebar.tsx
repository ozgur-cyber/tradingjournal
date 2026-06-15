import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Target, Trophy, Users, ShieldAlert, Settings } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

const Sidebar = () => {
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
    <aside className="hidden md:flex flex-col w-[280px] h-screen fixed left-0 top-0 bg-bg-surface dark:bg-bg-surface/40 backdrop-blur-md border-r border-border-primary p-6 transition-colors duration-300">
      <div className="mb-10 flex items-center space-x-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-purple to-brand-blue flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.5)]">
          <Target className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-brand-purple to-brand-blue bg-clip-text text-transparent tracking-tight">
          NovaTrade
        </h1>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
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
  );
};

export default Sidebar;
