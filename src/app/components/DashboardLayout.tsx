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
    { id: 'admin-settings', label: 'Admin Settings', icon: Settings, adminOnly: true },
  ];

  const filteredMenuItems = menuItems.filter(
    (item) => !item.adminOnly || userRole === 'admin'
  );

  return (
    <div className="min-h-screen flex bg-background text-foreground transition-colors duration-300">
      {/* Sidebar */}
      <div className="w-64 bg-card/60 backdrop-blur-xl border-r border-border shadow-sm flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary text-primary-foreground shadow-sm shadow-primary/20"
            >
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-primary tracking-tight">
                AI Attendance
              </h2>
              <p className="text-xs text-muted-foreground font-medium">Management System</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-1.5">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 font-medium ${isActive
                      ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25 scale-[1.02]'
                      : 'text-muted-foreground hover:bg-secondary/40 hover:text-foreground hover:scale-[1.01]'
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-border/50">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-secondary/30 border border-border/40 hover:bg-secondary/50 transition-colors cursor-pointer">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center bg-accent text-accent-foreground font-bold shadow-sm"
            >
              {userRole === 'admin' ? 'A' : 'F'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground truncate">
                {userRole === 'admin' ? 'Admin User' : 'Faculty User'}
              </p>
              <p className="text-xs text-primary font-medium capitalize truncate">{userRole}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Decorative background element for pure luxury */}
        <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none -z-10" />
        <div className="absolute bottom-[-10%] left-[20%] w-96 h-96 bg-accent/20 rounded-full blur-[100px] pointer-events-none -z-10" />

        {/* Top Header */}
        <header className="bg-card/40 backdrop-blur-xl border-b border-border shadow-sm sticky top-0 z-20">
          <div className="px-8 py-5 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">
                {menuItems.find((item) => item.id === activePage)?.label ||
                  'Dashboard'}
              </h1>
              <p className="text-sm text-muted-foreground mt-1 font-medium">
                Welcome back! Here's what's happening today.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" className="relative rounded-full border-border/50 bg-card/50 hover:bg-secondary/50">
                <Bell className="w-5 h-5 text-muted-foreground" />
                <span
                  className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-destructive border-2 border-background animate-pulse"
                ></span>
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={onLogout}
                className="flex items-center gap-2 rounded-full px-5 shadow-sm shadow-primary/20 hover:shadow-md hover:shadow-primary/30 transition-all font-medium"
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
