import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import MobileNav from './MobileNav';

const DashboardLayout = () => {
  return (
    <div className="flex h-screen bg-bg-primary text-text-primary transition-colors duration-300">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden md:ml-[280px]">
        <TopBar />
        
        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-10 hide-scrollbar bg-bg-primary transition-colors duration-300">
          <Outlet />
        </main>
      </div>

      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  );
};

export default DashboardLayout;
