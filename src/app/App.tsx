import { useState } from 'react';
import { LoginPage } from './components/LoginPage';
import { DashboardLayout } from './components/DashboardLayout';
import { Dashboard } from './components/Dashboard';
import { FacultyDashboard } from './components/FacultyDashboard';
import { StudentManagement } from './components/StudentManagement';
import { AttendanceMonitoring } from './components/AttendanceMonitoring';
import { Reports } from './components/Reports';
import { SmsLogs } from './components/SmsLogs';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'faculty'>('admin');
  const [activePage, setActivePage] = useState('dashboard');

  const handleLogin = (role: 'admin' | 'faculty') => {
    setUserRole(role);
    setIsLoggedIn(true);
    setActivePage('dashboard');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setActivePage('dashboard');
  };

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        // Show FacultyDashboard for faculty, regular Dashboard for admin
        return userRole === 'faculty' ? <FacultyDashboard /> : <Dashboard />;
      case 'students':
        return <StudentManagement />;
      case 'attendance':
        return <AttendanceMonitoring />;
      case 'reports':
        return <Reports />;
      case 'sms-logs':
        return <SmsLogs />;
      case 'csv-upload':
        return (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-gray-900">CSV Upload</h2>
            <p className="text-gray-600 mt-2">CSV upload functionality coming soon...</p>
          </div>
        );
      case 'faculty':
        return (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-gray-900">Faculty Management</h2>
            <p className="text-gray-600 mt-2">Faculty management functionality coming soon...</p>
          </div>
        );
      case 'settings':
        return (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
            <p className="text-gray-600 mt-2">Settings configuration coming soon...</p>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <DashboardLayout
      activePage={activePage}
      onNavigate={setActivePage}
      onLogout={handleLogout}
      userRole={userRole}
    >
      {renderPage()}
    </DashboardLayout>
  );
}