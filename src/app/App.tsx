import { useState, useEffect } from 'react';
import { LoginPage } from './components/LoginPage';
import { RegistrationPage } from './components/RegistrationPage';
import { FacultyRegistrationPage } from './components/FacultyRegistrationPage';
import { AdminRegistrationPage } from './components/AdminRegistrationPage';
import { DashboardLayout } from './components/DashboardLayout';
import { Dashboard } from './components/Dashboard';
import { FacultyDashboard } from './components/FacultyDashboard';
import { StudentManagement } from './components/StudentManagement';
import { AttendanceMonitoring } from './components/AttendanceMonitoring';
import { Reports } from './components/Reports';
import { SmsLogs } from './components/SmsLogs';
import { AdminSettings } from './components/AdminSettings';

type PageState = 'login' | 'register-student' | 'register-faculty' | 'register-admin' | 'dashboard';

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageState>('login');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'faculty'>('admin');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activePage, setActivePage] = useState('dashboard');

  // Check for saved session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    const savedRole = localStorage.getItem('userRole');
    if (savedUser && savedRole) {
      try {
        setCurrentUser(JSON.parse(savedUser));
        setUserRole(savedRole as 'admin' | 'faculty');
        setIsLoggedIn(true);
        setCurrentPage('dashboard');
      } catch (error) {
        console.error('Failed to restore session');
        localStorage.clear();
      }
    }
  }, []);

  const handleLogin = (role: 'admin' | 'faculty', user?: any) => {
    setUserRole(role);
    setCurrentUser(user);
    setIsLoggedIn(true);
    setCurrentPage('dashboard');
    setActivePage('dashboard');

    // Save session
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
      localStorage.setItem('userRole', role);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentPage('login');
    setActivePage('dashboard');
    setCurrentUser(null);
    localStorage.clear();
  };

  const handleStudentRegistrationClick = () => {
    setCurrentPage('register-student');
  };

  const handleFacultyRegistrationClick = () => {
    setCurrentPage('register-faculty');
  };

  const handleAdminRegistrationClick = () => {
    setCurrentPage('register-admin');
  };

  const handleRegistrationComplete = (type: 'student' | 'faculty' | 'admin') => {
    setCurrentPage('login');
    // Could show a success message or auto-route to login
  };

  const handleBackToLogin = () => {
    setCurrentPage('login');
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
      case 'admin-settings':
        return <AdminSettings />;
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
    if (currentPage === 'register-student') {
      return (
        <RegistrationPage
          onRegistrationComplete={() => handleRegistrationComplete('student')}
          onBackToLogin={handleBackToLogin}
        />
      );
    }
    if (currentPage === 'register-faculty') {
      return (
        <FacultyRegistrationPage
          onRegistrationComplete={() => handleRegistrationComplete('faculty')}
          onBackToLogin={handleBackToLogin}
        />
      );
    }
    if (currentPage === 'register-admin') {
      return (
        <AdminRegistrationPage
          onRegistrationComplete={() => handleRegistrationComplete('admin')}
          onBackToLogin={handleBackToLogin}
        />
      );
    }
    return (
      <LoginPage
        onLogin={handleLogin}
        onStudentRegisterClick={handleStudentRegistrationClick}
        onFacultyRegisterClick={handleFacultyRegistrationClick}
        onAdminRegisterClick={handleAdminRegistrationClick}
      />
    );
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