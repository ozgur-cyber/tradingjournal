import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Target, Trophy, Users } from 'lucide-react';

const MobileNav = () => {
  const navItems = [
    { name: 'Dash', path: '/dashboard', icon: LayoutDashboard },
    { name: 'İşlemler', path: '/trades', icon: BookOpen },
    { name: 'Strateji', path: '/strategies', icon: Target },
    { name: 'Sıralama', path: '/leaderboard', icon: Trophy },
    { name: 'Sosyal', path: '/social', icon: Users },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-brand-surface/80 backdrop-blur-lg border-t border-white/5 z-50 px-2 flex justify-between items-center">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-full h-full space-y-1 transition-all ${
              isActive
                ? 'text-brand-purple'
                : 'text-gray-500 hover:text-gray-300'
            }`
          }
        >
          <item.icon className="w-6 h-6" />
          <span className="text-[10px] font-medium">{item.name}</span>
        </NavLink>
      ))}
    </nav>
  );
};

export default MobileNav;
