import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Mail, Lock } from 'lucide-react';
import { loginUser, LoginPayload } from '../api/apiClient';
import { motion } from 'framer-motion';
import collegeLogo from '../../assets/index.jpg';
import collegeBuilding from '../../assets/vig.jpg';

interface LoginPageProps {
  onLogin: (role: 'admin' | 'faculty', user?: any) => void;
  onStudentRegisterClick?: () => void;
  onFacultyRegisterClick?: () => void;
  onAdminRegisterClick?: () => void;
}

export function LoginPage({ onLogin, onStudentRegisterClick, onFacultyRegisterClick, onAdminRegisterClick }: LoginPageProps) {
  const [selectedRole, setSelectedRole] = useState<'student' | 'faculty' | 'admin'>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Handle Student role which doesn't have a backend portal yet
    if (selectedRole === 'student') {
      setError('Student portal login is currently disabled. Please use Faculty or Admin roles.');
      return;
    }

    if (!email || !password) { setError('Please enter both email and password'); return; }

    setLoading(true);
    // The API currently expects 'admin' or 'faculty'
    const roleForApi = selectedRole as 'admin' | 'faculty';
    const payload: LoginPayload = { email, password, role: roleForApi };
    const result = await loginUser(payload);

    if (result.status === 'success' && result.user) {
      onLogin(roleForApi, result.user);
    } else {
      setError(result.message || 'Login failed. Please check your credentials.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden font-sans">
      {/* Background Image: Bright, daytime college building without heavy dark overlays */}
      <div className="absolute inset-0 z-0 bg-[#e4f0fa]">
        <img
          src={collegeBuilding}
          alt="Vignan Campus"
          className="w-full h-full object-cover"
        />
        {/* Subtle gradient to ensure text readability on the left, but keep building visible */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#002f5b]/80 via-[#002f5b]/20 to-transparent" />
        {/* Very subtle overall lightening blur for that airy atmosphere */}
        <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px]" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col lg:flex-row w-full max-w-[1600px] mx-auto">

        {/* Left Section: Typography */}
        <div className="flex-1 flex px-8 lg:px-24 justify-center flex-col pt-12 lg:pt-0 pb-8">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-white space-y-2 mt-auto lg:mt-32 max-w-xl hidden md:block"
            style={{ textShadow: '0px 2px 12px rgba(0,0,0,0.4), 0px 4px 24px rgba(0,40,90,0.6)' }}
          >
            <h1 className="text-6xl lg:text-7xl font-bold tracking-tight m-0 p-0 leading-none">
              VIGNAN
            </h1>
            <h2 className="text-2xl lg:text-[28px] font-semibold tracking-wide m-0 p-0">
              INSTITUTE OF INFORMATION TECHNOLOGY
            </h2>
            <p className="text-xl lg:text-2xl text-white/90 font-medium tracking-wide mt-4">
              AI Smart Attendance System
            </p>
          </motion.div>
        </div>

        {/* Right Section: Dark Card */}
        <div className="w-full lg:w-[800px] flex items-center justify-center lg:justify-end px-6 lg:px-12 py-12 lg:py-0">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full max-w-[600px]"
          >
            {/* The Dark Container */}
            <div
              className="rounded-2xl overflow-hidden p-10 lg:p-14 relative shadow-2xl"
              style={{
                backgroundColor: '#303346',
                border: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              {/* Header */}
              <div className="text-center mb-8 flex flex-col items-center">
                <img
                  src={collegeLogo}
                  alt="Vignan Logo"
                  className="h-16 mb-4 object-contain"
                />
                <h3 className="text-white text-[26px] font-bold tracking-tight mb-2">
                  Welcome Back
                </h3>
                <p className="text-[#94A3B8] text-[15px]">
                  Sign in to access your portal
                </p>
              </div>

              {/* Tabs */}
              <div className="flex bg-[#232533] rounded-xl p-1 mb-8">
                {(['admin', 'faculty'] as const).map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => { setSelectedRole(role); setError(''); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium text-[14px] transition-all duration-200 ${selectedRole === role
                      ? 'bg-[#4263EB] text-white shadow-md'
                      : 'text-[#94A3B8] hover:text-white'
                      }`}
                  >
                    {role === 'admin' ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>
                    )}
                    <span className="capitalize">{role} Portal</span>
                  </button>
                ))}
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Error Banner */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 text-sm text-red-400 bg-red-400/10 rounded-xl font-medium text-center border border-red-400/20"
                  >
                    {error}
                  </motion.div>
                )}

                {/* Email Input */}
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-[#E2E8F0] text-[13px] font-medium ml-1">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@vignan.ac.in"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      className="w-full px-4 py-6 text-[15px] bg-[#232533] border-[#3E4259] focus:border-[#4263EB] focus:ring-1 focus:ring-[#4263EB] transition-all rounded-xl placeholder:text-[#64748B] text-white shadow-inner"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center ml-1">
                    <Label htmlFor="password" className="text-[#E2E8F0] text-[13px] font-medium">
                      Password
                    </Label>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      className="w-full px-4 py-6 pr-12 text-[15px] tracking-widest bg-[#232533] border-[#3E4259] focus:border-[#4263EB] focus:ring-1 focus:ring-[#4263EB] transition-all rounded-xl placeholder:text-[#64748B] text-white shadow-inner"
                    />
                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                    </div>
                  </div>
                </div>

                {/* Login Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full py-6 mt-6 text-[16px] font-semibold text-white rounded-xl shadow-lg border-none transition-all hover:bg-[#3451c7] bg-[#4263EB] flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Signing in...
                    </span>
                  ) : (
                    <>
                      Sign In
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                    </>
                  )}
                </Button>
              </form>

              {/* Registration Links */}
              <div className="mt-8 pt-6 relative">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-[#3E4259]"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-[#303346] px-3 text-[13px] text-[#94A3B8]">
                    New to the system?
                  </span>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3">
                {onStudentRegisterClick && (
                  <button
                    type="button"
                    onClick={onStudentRegisterClick}
                    className="w-full text-[13px] font-medium text-[#E2E8F0] hover:text-white hover:bg-[#3E4259] py-3 rounded-xl transition-colors border border-[#3E4259] bg-[#232533]"
                  >
                    Student Registration (Face Scan)
                  </button>
                )}
                <div className="flex gap-3">
                  {onFacultyRegisterClick && (
                    <button
                      type="button"
                      onClick={onFacultyRegisterClick}
                      className="flex-1 text-[13px] font-medium text-[#E2E8F0] hover:text-white hover:bg-[#3E4259] py-3 rounded-xl transition-colors border border-[#3E4259] bg-[#232533]"
                    >
                      Setup Faculty
                    </button>
                  )}
                  {onAdminRegisterClick && (
                    <button
                      type="button"
                      onClick={onAdminRegisterClick}
                      className="flex-1 text-[13px] font-medium text-[#E2E8F0] hover:text-white hover:bg-[#3E4259] py-3 rounded-xl transition-colors border border-[#3E4259] bg-[#232533]"
                    >
                      Admin Setup
                    </button>
                  )}
                </div>
              </div>

            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
