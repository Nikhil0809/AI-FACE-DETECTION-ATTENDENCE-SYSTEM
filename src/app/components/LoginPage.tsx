import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { GraduationCap, MapPin, ScanFace, ChevronRight, ShieldCheck, Zap, Database } from 'lucide-react';
import { loginUser, LoginPayload } from '../api/apiClient';
import { motion } from 'framer-motion';
import { PageTransition } from './ui/PageTransition';

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

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
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
    <PageTransition className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] right-[-5%] w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-[-10%] left-[10%] w-[600px] h-[600px] bg-accent/20 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Top Navbar */}
      <nav className="w-full px-8 py-6 flex items-center justify-between border-b border-border/40 backdrop-blur-sm z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/25">
            <ScanFace className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="font-bold text-xl tracking-tight text-foreground">AIAttend</span>
        </div>
        <div className="hidden md:flex gap-8 items-center text-sm font-medium text-muted-foreground">
          <a href="#features" className="hover:text-primary transition-colors">Features</a>
          <a href="#tech" className="hover:text-primary transition-colors">Tech Stack</a>
          <Button variant="ghost" className="hidden">Contact</Button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="flex-1 flex flex-col lg:flex-row items-center justify-center p-8 lg:p-16 gap-16 z-10 max-w-7xl mx-auto w-full">
        {/* Left: Copy & Features */}
        <div className="flex-1 space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Live Face Detection Engine
            </div>
            <h1 className="text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1]">
              Next-Gen <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Attendance</span> System
            </h1>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-lg">
              Automate your classroom with AI-powered face recognition. Say goodbye to manual roll calls and hello to seamless, real-time analytics.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid grid-cols-2 gap-4 max-w-lg mt-8"
          >
            <div className="flex gap-3 items-start">
              <div className="p-2 rounded-lg bg-secondary/50 text-primary">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Real-time Speed</h4>
                <p className="text-xs text-muted-foreground">Sub-second recognition</p>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <div className="p-2 rounded-lg bg-secondary/50 text-primary">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Anti-Spoofing</h4>
                <p className="text-xs text-muted-foreground">High accuracy models</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right: Login Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full max-w-md lg:w-[450px]"
        >
          <Card className="border-border/50 shadow-2xl shadow-primary/10 bg-card/80 backdrop-blur-2xl">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
              <CardDescription>Enter your credentials to access the portal</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Role Toggle */}
              <div className="flex gap-2 mb-6 p-1 bg-secondary/30 rounded-lg">
                <button
                  onClick={() => {
                    setSelectedRole('admin');
                    setError('');
                  }}
                  className={`flex-1 py-2 text-sm rounded-md font-medium transition-all duration-200 ${selectedRole === 'admin'
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/50'
                    }`}
                >
                  Admin Portal
                </button>
                <button
                  onClick={() => {
                    setSelectedRole('faculty');
                    setError('');
                  }}
                  className={`flex-1 py-2 text-sm rounded-md font-medium transition-all duration-200 ${selectedRole === 'faculty'
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/50'
                    }`}
                >
                  Faculty Portal
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 p-3 bg-destructive/10 text-destructive rounded-lg text-sm border border-destructive/20 font-medium">
                  {error}
                </motion.div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@university.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="bg-input-background"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <a href="#" className="text-xs font-medium text-primary hover:underline">Forgot password?</a>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="bg-input-background"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 font-semibold shadow-md shadow-primary/20 group"
                  size="lg"
                >
                  {loading ? 'Authenticating...' : 'Start Attendance'}
                  {!loading && <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />}
                </Button>
              </form>

              {/* Registration Options */}
              <div className="mt-8 space-y-3">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border/80" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground font-medium">New to the system?</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {onStudentRegisterClick && (
                    <Button type="button" onClick={onStudentRegisterClick} variant="outline" className="w-full text-xs font-medium h-9 border-primary/30 text-primary hover:bg-primary/5">
                      Student Registration (Face Scan)
                    </Button>
                  )}
                  <div className="flex gap-2">
                    {onFacultyRegisterClick && (
                      <Button type="button" onClick={onFacultyRegisterClick} variant="secondary" className="flex-1 text-xs font-medium h-9 bg-secondary/50 hover:bg-secondary">
                        Setup Faculty
                      </Button>
                    )}
                    {onAdminRegisterClick && (
                      <Button type="button" onClick={onAdminRegisterClick} variant="ghost" className="flex-1 text-xs font-medium h-9 text-muted-foreground">
                        Admin Setup
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Footer / Status */}
      <div className="py-6 border-t border-border/40 mt-auto bg-card/30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-8 flex flex-col sm:flex-row items-center justify-between text-sm text-muted-foreground gap-4">
          <p>© 2026 AI Attendance Systems. All rights reserved.</p>
          <div className="flex items-center gap-6 font-medium">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
              </span>
              Systems Operational
            </div>
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-primary" />
              <span className="text-primary hidden sm:inline">Secure Environment</span>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
