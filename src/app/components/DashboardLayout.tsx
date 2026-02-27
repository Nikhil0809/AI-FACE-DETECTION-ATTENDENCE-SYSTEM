import { ReactNode } from 'react';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  FileText,
  Upload,
  MessageSquare,
  Settings,
  Bell,
  LogOut,
  ScanFace,
} from 'lucide-react';
import { Button } from './ui/button';

interface DashboardLayoutProps {
  children: ReactNode;
  activePage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  userRole: 'admin' | 'faculty';
}

export function DashboardLayout({
  children,
  activePage,
  onNavigate,
  onLogout,
  userRole,
}: DashboardLayoutProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'students', label: 'Students', icon: GraduationCap },
    { id: 'faculty', label: 'Faculty', icon: Users, adminOnly: true },
    { id: 'attendance', label: 'Attendance Monitoring', icon: ScanFace },
    { id: 'reports', label: 'Attendance Reports', icon: FileText },
    { id: 'csv-upload', label: 'CSV Upload', icon: Upload, adminOnly: true },
    { id: 'sms-logs', label: 'SMS Logs', icon: MessageSquare },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const filteredMenuItems = menuItems.filter(
    (item) => !item.adminOnly || userRole === 'admin'
  );

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#F3F4F6' }}>
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: '#1E3A8A' }}
            >
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold" style={{ color: '#1E3A8A' }}>
                AI Attendance
              </h2>
              <p className="text-xs text-gray-500">Management System</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-1">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? 'text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  style={isActive ? { backgroundColor: '#1E3A8A' } : {}}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 px-4 py-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: '#10B981' }}
            >
              {userRole === 'admin' ? 'A' : 'F'}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                {userRole === 'admin' ? 'Admin User' : 'Faculty User'}
              </p>
              <p className="text-xs text-gray-500 capitalize">{userRole}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-8 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: '#1E3A8A' }}>
                {menuItems.find((item) => item.id === activePage)?.label ||
                  'Dashboard'}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Welcome back! Here's what's happening today.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5 text-gray-600" />
                <span
                  className="absolute top-1 right-1 w-2 h-2 rounded-full"
                  style={{ backgroundColor: '#10B981' }}
                ></span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onLogout}
                className="flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
