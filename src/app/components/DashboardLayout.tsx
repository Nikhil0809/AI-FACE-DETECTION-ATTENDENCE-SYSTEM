import { ReactNode } from 'react';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  FileText,
  Upload,
  MessageSquare,
  Settings,
  Search,
  Mic,
  LogOut,
  ScanFace,
} from 'lucide-react';
import collegeLogo from '../../assets/vignan-logo.jpg';

interface DashboardLayoutProps {
  children: ReactNode;
  activePage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  userRole: 'admin' | 'faculty';
  currentUser?: any;
}

export function DashboardLayout({
  children,
  activePage,
  onNavigate,
  onLogout,
  userRole,
  currentUser,
}: DashboardLayoutProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'students', label: 'Students', icon: GraduationCap },
    { id: 'faculty', label: 'Faculty', icon: Users, adminOnly: true },
    { id: 'attendance', label: 'Attendance Monitoring', icon: ScanFace },
    { id: 'reports', label: 'Attendance Reports', icon: FileText },
    { id: 'csv-upload', label: 'CSV Upload', icon: Upload, adminOnly: true },
    { id: 'sms-logs', label: 'SMS Logs', icon: MessageSquare },
    { id: 'admin-settings', label: 'Admin Settings', icon: Settings, adminOnly: true },
  ];

  const filteredMenuItems = menuItems.filter(
    (item) => !item.adminOnly || userRole === 'admin'
  );

  const displayName = currentUser?.name || (userRole === 'admin' ? 'Admin User' : 'Faculty User');
  const displayEmail = currentUser?.email || '';
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const pageTitles: Record<string, string> = {
    dashboard: 'Dashboard',
    students: 'Students',
    faculty: 'Faculty',
    attendance: 'Attendance Monitoring',
    reports: 'Attendance Reports',
    'csv-upload': 'CSV Upload',
    'sms-logs': 'SMS Logs',
    'admin-settings': 'Admin Settings',
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#F0F4FF' }}>
      {/* ── Sidebar ── */}
      <div
        className="w-56 flex flex-col flex-shrink-0"
        style={{
          backgroundColor: '#FFFFFF',
          borderRight: '1px solid #E2E8F0',
          boxShadow: '2px 0 8px rgba(0,0,0,0.04)',
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center justify-center px-4 py-3"
          style={{ borderBottom: '1px solid #E2E8F0', backgroundColor: '#0f2040', minHeight: 64 }}
        >
          <img
            src={collegeLogo}
            alt="Vignan Institute"
            className="w-full object-contain"
            style={{ maxHeight: 52 }}
          />
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto">
          <div className="space-y-0.5">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all duration-150 text-left"
                  style={
                    isActive
                      ? {
                        backgroundColor: '#EEF2FF',
                        color: '#1E3A8A',
                        fontWeight: 600,
                      }
                      : {
                        color: '#64748B',
                        fontWeight: 500,
                      }
                  }
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.backgroundColor = '#F8FAFF';
                      (e.currentTarget as HTMLElement).style.color = '#1E3A8A';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                      (e.currentTarget as HTMLElement).style.color = '#64748B';
                    }
                  }}
                >
                  <div
                    className="flex items-center justify-center w-8 h-8 rounded-md flex-shrink-0"
                    style={isActive ? { backgroundColor: '#C7D7FF' } : { backgroundColor: 'transparent' }}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* User Info at Bottom */}
        <div
          className="p-3"
          style={{ borderTop: '1px solid #E2E8F0' }}
        >
          <div className="flex items-center gap-2.5 p-2 rounded-lg">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm shadow-sm"
              style={{ backgroundColor: '#1E3A8A' }}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">{displayName}</p>
              <p className="text-xs font-medium capitalize" style={{ color: '#4F8EF7' }}>
                {userRole} User
              </p>
            </div>
            <button
              onClick={onLogout}
              className="p-1.5 rounded-md hover:bg-red-50 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4 text-gray-400 hover:text-red-500 transition-colors" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header
          className="flex-shrink-0 flex items-center justify-between px-6 py-3"
          style={{
            backgroundColor: '#FFFFFF',
            borderBottom: '1px solid #E2E8F0',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}
        >
          {/* Page Title */}
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#0F172A' }}>
              {pageTitles[activePage] || 'Dashboard'}
            </h1>
            <p className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>
              Welcome {displayName.split(' ')[0]}! Here's what's happening today.
            </p>
          </div>

          {/* Search + Mic + Avatar */}
          <div className="flex items-center gap-3">
            {/* Search bar */}
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-lg"
              style={{
                backgroundColor: '#F4F6FA',
                border: '1px solid #E2E8F0',
                minWidth: 200,
              }}
            >
              <Search className="w-4 h-4 flex-shrink-0" style={{ color: '#94A3B8' }} />
              <input
                type="text"
                placeholder="Search"
                className="bg-transparent outline-none text-sm w-full"
                style={{ color: '#0F172A' }}
              />
            </div>
            {/* Microphone */}
            <button
              className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
              style={{ backgroundColor: '#F4F6FA', border: '1px solid #E2E8F0' }}
            >
              <Mic className="w-4 h-4" style={{ color: '#64748B' }} />
            </button>
            {/* Avatar */}
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm shadow-sm cursor-pointer relative"
              style={{ backgroundColor: '#1E3A8A' }}
              title={displayName}
            >
              {initials}
              <span
                className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white"
                style={{ backgroundColor: '#10B981' }}
              />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
