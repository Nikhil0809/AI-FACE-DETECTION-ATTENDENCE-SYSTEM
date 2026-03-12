import { useState } from 'react';
import { loginUser, LoginPayload } from '../api/apiClient';
import { motion } from 'framer-motion';
import collegeLogo from '../../assets/vignan-logo.jpg';
import collegeBuilding from '../../assets/vig.jpg';

interface LoginPageProps {
  onLogin: (role: 'admin' | 'faculty', user?: any) => void;
  onStudentRegisterClick?: () => void;
  onFacultyRegisterClick?: () => void;
  onAdminRegisterClick?: () => void;
}

export function LoginPage({
  onLogin,
  onStudentRegisterClick,
  onFacultyRegisterClick,
  onAdminRegisterClick,
}: LoginPageProps) {
  const [selectedRole, setSelectedRole] = useState<'faculty' | 'admin'>('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Please enter both email and password.'); return; }
    setLoading(true);
    const payload: LoginPayload = { email, password, role: selectedRole };
    const result = await loginUser(payload);
    if (result.status === 'success' && result.user) {
      onLogin(selectedRole, result.user);
    } else {
      setError(result.message || 'Invalid credentials. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* ── College Building Background ── */}
      <div className="absolute inset-0 z-0">
        <img
          src={collegeBuilding}
          alt="Vignan Campus"
          className="w-full h-full object-cover"
        />
        {/* Deep blue overlay — keeps campus visible, ensures card contrast */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(135deg, rgba(10,25,60,0.72) 0%, rgba(20,40,100,0.55) 50%, rgba(10,25,60,0.65) 100%)' }}
        />
        {/* Subtle frosted-glass vignette at edges */}
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(5,10,30,0.35) 100%)' }}
        />
      </div>

      {/* ── Two-Column Layout: Branding Left | Card Center-Left ── */}
      <div className="relative z-10 w-full min-h-screen flex items-center justify-center gap-12 lg:gap-32 px-6 lg:px-12 py-12">
        {/* Left: Branding */}
        <div className="hidden lg:flex flex-col justify-center max-w-[540px]">
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >

            <h1
              className="text-5xl lg:text-6xl font-black leading-tight mb-4"
              style={{ color: '#FFFFFF', fontFamily: 'Montserrat, sans-serif', letterSpacing: '-0.02em', textShadow: '0 4px 24px rgba(0,0,0,0.4)' }}
            >
              Vignan
              <br />
              <span style={{ color: '#93C5FD' }}>AI Attendance</span>
              <br />
              <span className="text-4xl lg:text-5xl" style={{ color: 'rgba(255,255,255,0.8)' }}>System</span>
            </h1>

            <p className="text-base font-medium mb-1" style={{ color: 'rgba(255,255,255,0.75)' }}>
              Vignan Institute of Information Technology
            </p>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.48)' }}>
              Face-recognition based automated attendance<br />with real-time SMS alerts &amp; analytics dashboard.
            </p>


          </motion.div>
        </div>

        {/* Card column */}
        <div className="w-full lg:w-auto flex-shrink-0">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="w-full"
            style={{ maxWidth: 420 }}
          >
            {/* ── Card ── */}
            <div
              className="rounded-3xl px-8 py-10 flex flex-col justify-center"
              style={{
                backgroundColor: '#FFFFFF',
                boxShadow: '0 8px 40px rgba(30,58,138,0.12), 0 2px 8px rgba(0,0,0,0.06)',
                border: '1px solid #E8EDFF',
                minHeight: 600,
              }}
            >
              {/* Logo + Title */}
              <div className="flex flex-col items-center mb-8">
                <img
                  src={collegeLogo}
                  alt="Vignan Institute"
                  className="h-12 object-contain mb-5"
                  style={{ filter: 'drop-shadow(0 2px 6px rgba(30,58,138,0.15))' }}
                />
                <h1
                  className="text-2xl font-bold tracking-tight"
                  style={{ color: '#0F172A', fontStyle: 'italic' }}
                >
                  Vignan AI Attendance
                </h1>
                <p className="text-sm mt-1.5" style={{ color: '#64748B' }}>
                  Welcome back! Please enter your details.
                </p>
              </div>

              {/* Role Tabs */}
              <div
                className="flex rounded-xl p-1 mb-7"
                style={{ backgroundColor: '#F0F4FF', border: '1px solid #E2E8F0' }}
              >
                {(['admin', 'faculty'] as const).map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => { setSelectedRole(role); setError(''); }}
                    className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 capitalize"
                    style={
                      selectedRole === role
                        ? {
                          backgroundColor: '#1E3A8A',
                          color: '#FFFFFF',
                          boxShadow: '0 2px 8px rgba(30,58,138,0.25)',
                        }
                        : { color: '#64748B', backgroundColor: 'transparent' }
                    }
                  >
                    {role} Portal
                  </button>
                ))}
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Error */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 text-xs font-medium text-center rounded-lg"
                    style={{ backgroundColor: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}
                  >
                    {error}
                  </motion.div>
                )}

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-semibold mb-2"
                    style={{ color: '#0F172A' }}
                  >
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="name@vignan.ac.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    autoComplete="email"
                    className="w-full outline-none transition-all"
                    style={{
                      padding: '12px 14px',
                      fontSize: '0.9rem',
                      border: '1.5px solid #E2E8F0',
                      borderRadius: 10,
                      backgroundColor: '#FFFFFF',
                      color: '#0F172A',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#1E3A8A';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(30,58,138,0.08)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#E2E8F0';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label
                      htmlFor="password"
                      className="text-sm font-semibold"
                      style={{ color: '#0F172A' }}
                    >
                      Password
                    </label>
                    <button
                      type="button"
                      className="text-sm font-medium"
                      style={{ color: '#1E3A8A' }}
                      tabIndex={-1}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      autoComplete="current-password"
                      className="w-full outline-none transition-all pr-11"
                      style={{
                        padding: '12px 14px',
                        fontSize: '0.9rem',
                        border: '1.5px solid #E2E8F0',
                        borderRadius: 10,
                        backgroundColor: '#FFFFFF',
                        color: '#0F172A',
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#1E3A8A';
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(30,58,138,0.08)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#E2E8F0';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-3.5 flex items-center"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Remember Me */}
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <div
                    onClick={() => setRememberMe(!rememberMe)}
                    className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-colors"
                    style={{
                      border: rememberMe ? 'none' : '1.5px solid #CBD5E1',
                      backgroundColor: rememberMe ? '#1E3A8A' : '#FFFFFF',
                    }}
                  >
                    {rememberMe && (
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm" style={{ color: '#475569' }}>
                    Remember for 30 days
                  </span>
                </label>

                {/* Sign In Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center font-semibold text-white rounded-xl transition-all duration-200"
                  style={{
                    padding: '13px',
                    fontSize: '0.95rem',
                    background: loading
                      ? '#64748B'
                      : 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 100%)',
                    boxShadow: loading ? 'none' : '0 4px 16px rgba(15,23,42,0.35)',
                    cursor: loading ? 'not-allowed' : 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 24px rgba(15,23,42,0.45)';
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(15,23,42,0.35)';
                  }}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Signing in…
                    </span>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>

              {/* OR Divider */}
              <div className="relative my-7">
                <div style={{ borderTop: '1px solid #E2E8F0' }} />
                <span
                  className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 text-xs font-semibold tracking-widest"
                  style={{ backgroundColor: '#FFFFFF', color: '#94A3B8', top: '50%' }}
                >
                  OR CONTINUE WITH
                </span>
              </div>

              {/* Registration Buttons */}
              <div className="flex gap-3 mb-7">
                {onFacultyRegisterClick && (
                  <button
                    type="button"
                    onClick={onFacultyRegisterClick}
                    className="flex-1 flex items-center justify-center gap-2 font-semibold text-sm rounded-xl transition-all"
                    style={{
                      padding: '11px',
                      border: '1.5px solid #E2E8F0',
                      color: '#0F172A',
                      backgroundColor: '#FFFFFF',
                    }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = '#F8FAFF')}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = '#FFFFFF')}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" />
                    </svg>
                    Setup Faculty
                  </button>
                )}
                {onAdminRegisterClick && (
                  <button
                    type="button"
                    onClick={onAdminRegisterClick}
                    className="flex-1 flex items-center justify-center gap-2 font-semibold text-sm rounded-xl transition-all"
                    style={{
                      padding: '11px',
                      border: '1.5px solid #E2E8F0',
                      color: '#0F172A',
                      backgroundColor: '#FFFFFF',
                    }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = '#F8FAFF')}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = '#FFFFFF')}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    Admin Setup
                  </button>
                )}
              </div>

              {/* Student Registration link */}
              {onStudentRegisterClick && (
                <p className="text-center text-sm" style={{ color: '#64748B' }}>
                  Need to register?{' '}
                  <button
                    type="button"
                    onClick={onStudentRegisterClick}
                    className="font-semibold transition-colors"
                    style={{ color: '#1E3A8A' }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#0F172A')}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = '#1E3A8A')}
                  >
                    Student Face Registration
                  </button>
                </p>
              )}
            </div>

            {/* Footer note */}
            <p className="text-center text-xs mt-5" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Vignan Institute of Information Technology · AI Smart Attendance
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
