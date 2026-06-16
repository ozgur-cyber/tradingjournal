import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Dashboard from '@/pages/dashboard/Dashboard';
import Trades from '@/pages/dashboard/Trades';
import Strategies from '@/pages/dashboard/Strategies';
import Leaderboard from '@/pages/dashboard/Leaderboard';
import Social from '@/pages/dashboard/Social';
import Settings from '@/pages/dashboard/Settings';
import PublicProfile from '@/pages/dashboard/PublicProfile';

// Admin imports
import AdminLayout from '@/pages/admin/AdminLayout';
import UserAnalytics from '@/pages/admin/UserAnalytics';
import UserModeration from '@/pages/admin/UserModeration';
import LeaderboardModeration from '@/pages/admin/LeaderboardModeration';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import SocialSecurity from '@/pages/admin/SocialSecurity';
import SeasonManagement from '@/pages/admin/SeasonManagement';
import AuditLogs from '@/pages/admin/AuditLogs';
function App() {
  const { initializeAuth, user, isLoading } = useAuthStore();
  const { isDarkMode } = useThemeStore();

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const unsubscribe = initializeAuth();
    return () => unsubscribe();
  }, [initializeAuth]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-purple"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Home />} />
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
        
        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/trades" element={<Trades />} />
            <Route path="/strategies" element={<Strategies />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/social" element={<Social />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/profile/:username" element={<PublicProfile />} />
            
            {/* Admin Nested Routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="analytics" replace />} />
              <Route path="analytics" element={<UserAnalytics />} />
              <Route path="moderation" element={<UserModeration />} />
              <Route path="leaderboard" element={<LeaderboardModeration />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="security" element={<SocialSecurity />} />
              <Route path="seasons" element={<SeasonManagement />} />
              <Route path="audit" element={<AuditLogs />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
