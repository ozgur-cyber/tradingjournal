import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import MobileNav from './MobileNav';
import { useAuthStore } from '@/store/authStore';
import { useSocialStore } from '@/store/socialStore';

const DashboardLayout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { userData } = useAuthStore();
  const { fetchFollows } = useSocialStore();

  useEffect(() => {
    if (userData?.id) {
      fetchFollows(userData.id);
    }
  }, [userData?.id, fetchFollows]);

  return (
    <div className="flex h-screen text-text-primary transition-colors duration-300 relative">
      {/* Sidebar */}
      <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden md:ml-[280px]">
        <TopBar onMenuClick={() => setIsMobileMenuOpen(true)} />
        
        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-10 hide-scrollbar transition-colors duration-300 mb-16 md:mb-0">
          <Outlet />
        </main>
      </div>

      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  );
};

export default DashboardLayout;
