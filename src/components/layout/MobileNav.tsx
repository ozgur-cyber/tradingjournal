import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Plus, Trophy, User } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

const MobileNav = () => {
  const { userData } = useAuthStore();
  const navigate = useNavigate();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-bg-surface/90 dark:bg-[#0a0a0f]/90 backdrop-blur-lg border-t border-white/5 z-50 px-2 flex justify-around items-center pb-safe">
      <NavLink to="/dashboard" className={({ isActive }) => `flex flex-col items-center justify-center w-16 h-full space-y-1 transition-all ${isActive ? 'text-brand-purple' : 'text-gray-500 hover:text-gray-300'}`}>
        <LayoutDashboard className="w-6 h-6" />
        <span className="text-[10px] font-medium">Dash</span>
      </NavLink>

      <NavLink to="/trades" className={({ isActive }) => `flex flex-col items-center justify-center w-16 h-full space-y-1 transition-all ${isActive ? 'text-brand-purple' : 'text-gray-500 hover:text-gray-300'}`}>
        <BookOpen className="w-6 h-6" />
        <span className="text-[10px] font-medium">İşlemler</span>
      </NavLink>

      <button 
        onClick={() => navigate('/trades?add=true')}
        className="flex flex-col items-center justify-center relative -top-5"
      >
        <div className="w-14 h-14 rounded-full bg-brand-purple flex items-center justify-center text-white shadow-[0_0_15px_rgba(139,92,246,0.5)]">
          <Plus className="w-7 h-7" />
        </div>
      </button>

      <NavLink to="/leaderboard" className={({ isActive }) => `flex flex-col items-center justify-center w-16 h-full space-y-1 transition-all ${isActive ? 'text-brand-purple' : 'text-gray-500 hover:text-gray-300'}`}>
        <Trophy className="w-6 h-6" />
        <span className="text-[10px] font-medium">Sıralama</span>
      </NavLink>

      <NavLink to={userData?.username ? `/profile/${userData.username}` : '/settings'} className={({ isActive }) => `flex flex-col items-center justify-center w-16 h-full space-y-1 transition-all ${isActive ? 'text-brand-purple' : 'text-gray-500 hover:text-gray-300'}`}>
        <User className="w-6 h-6" />
        <span className="text-[10px] font-medium">Profil</span>
      </NavLink>
    </nav>
  );
};

export default MobileNav;
