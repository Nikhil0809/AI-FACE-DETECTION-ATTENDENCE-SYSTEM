import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { GraduationCap, MapPin, ScanFace } from 'lucide-react';
import { loginUser, LoginPayload } from '../api/apiClient';

interface LoginPageProps {
  onLogin: (role: 'admin' | 'faculty', user?: any) => void;
  onStudentRegisterClick?: () => void;
  onFacultyRegisterClick?: () => void;
  onAdminRegisterClick?: () => void;
}

export function LoginPage({ onLogin, onStudentRegisterClick, onFacultyRegisterClick, onAdminRegisterClick }: LoginPageProps) {
  const [selectedRole, setSelectedRole] = useState<'admin' | 'faculty'>('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);

    const payload: LoginPayload = {
      email,
      password,
      role: selectedRole,
    };

    const result = await loginUser(payload);

    if (result.status === 'success' && result.user) {
      onLogin(selectedRole, result.user);
    } else {
      setError(result.message || 'Login failed. Please check your credentials.');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F3F4F6' }}>
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{ backgroundColor: '#1E3A8A' }}>
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: '#1E3A8A' }}>
            AI Face Attendance
          </h1>
          <p className="text-gray-600 mt-1">Management System</p>
        </div>

        {/* Role Toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => {
              setSelectedRole('admin');
              setError('');
            }}
            className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all ${
              selectedRole === 'admin'
                ? 'text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            style={selectedRole === 'admin' ? { backgroundColor: '#1E3A8A' } : {}}
          >
            Admin
          </button>
          <button
            onClick={() => {
              setSelectedRole('faculty');
              setError('');
            }}
            className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all ${
              selectedRole === 'faculty'
                ? 'text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            style={selectedRole === 'faculty' ? { backgroundColor: '#1E3A8A' } : {}}
          >
            Faculty
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-800 rounded-lg text-sm border border-red-200">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5"
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5"
              disabled={loading}
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full text-white font-medium py-2.5"
            style={{ backgroundColor: '#1E3A8A' }}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </Button>
        </form>

        {/* Registration Options */}
        <div className="mt-6 space-y-2">
          {onStudentRegisterClick && (
            <Button
              type="button"
              onClick={onStudentRegisterClick}
              variant="outline"
              className="w-full text-center py-2.5 text-sm"
              style={{ borderColor: '#10B981', color: '#10B981' }}
            >
              Student? Register with Face
            </Button>
          )}
          {onFacultyRegisterClick && (
            <Button
              type="button"
              onClick={onFacultyRegisterClick}
              variant="outline"
              className="w-full text-center py-2.5 text-sm"
              style={{ borderColor: '#1E3A8A', color: '#1E3A8A' }}
            >
              Faculty? Create Account
            </Button>
          )}
          {onAdminRegisterClick && (
            <Button
              type="button"
              onClick={onAdminRegisterClick}
              variant="outline"
              className="w-full text-center py-2.5 text-sm"
              style={{ borderColor: '#F59E0B', color: '#F59E0B' }}
            >
              Admin? Create Admin Account
            </Button>
          )}
        </div>

        {/* Status Indicators */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" style={{ color: '#10B981' }} />
              <span className="text-gray-700">Geo-Fencing Active</span>
            </div>
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#10B981' }}></div>
          </div>
          <div className="flex items-center justify-between text-sm mt-3">
            <div className="flex items-center gap-2">
              <ScanFace className="w-4 h-4" style={{ color: '#10B981' }} />
              <span className="text-gray-700">AI Face Enabled</span>
            </div>
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#10B981' }}></div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-500">
          © 2026 University Name. All rights reserved.
        </div>
      </div>
    </div>
  );
}
