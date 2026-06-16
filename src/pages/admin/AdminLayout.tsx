import React from 'react';
import { Outlet, NavLink, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { BarChart3, ShieldAlert, Trophy, LayoutDashboard, UserX, CalendarDays, History } from 'lucide-react';

const AdminLayout = () => {
  const { userData } = useAuthStore();
  
  if (!userData || !['Founder', 'Admin', 'SuperAdmin', 'Moderator', 'SeasonAdmin'].includes(userData.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  const tabs = [
    { name: 'Analytics', path: '/admin/analytics', icon: BarChart3, roles: ['Founder', 'SuperAdmin', 'Moderator', 'Admin'] },
    { name: 'Moderation', path: '/admin/moderation', icon: ShieldAlert, roles: ['Founder', 'SuperAdmin', 'Moderator', 'Admin'] },
    { name: 'Leaderboard', path: '/admin/leaderboard', icon: Trophy, roles: ['Founder', 'SuperAdmin', 'Moderator', 'Admin'] },
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard, roles: ['Founder', 'SuperAdmin', 'Moderator', 'Admin'] },
    { name: 'Security', path: '/admin/security', icon: UserX, roles: ['Founder', 'SuperAdmin', 'Moderator', 'Admin'] },
    { name: 'Seasons', path: '/admin/seasons', icon: CalendarDays, roles: ['Founder', 'SuperAdmin', 'SeasonAdmin', 'Admin'] },
    { name: 'Audit Logs', path: '/admin/audit', icon: History, roles: ['Founder', 'SuperAdmin', 'Moderator', 'Admin'] },
  ];

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <div className="w-full md:w-64 flex-shrink-0">
        <div className="bg-bg-surface border border-border-primary rounded-xl p-4 sticky top-24">
          <h2 className="text-xl font-bold mb-6 px-2">Backoffice</h2>
          <nav className="space-y-1">
            {tabs.filter(t => t.roles.includes(userData.role)).map(tab => (
              <NavLink
                key={tab.path}
                to={tab.path}
                className={({ isActive }) =>
                  lex items-center space-x-3 px-3 py-2 rounded-lg transition-colors 
                }
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.name}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <Outlet />
      </div>
    </div>
  );
};
export default AdminLayout;
