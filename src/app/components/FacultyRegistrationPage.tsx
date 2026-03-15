import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { registerFacultyMember, RegisterResponse, getDepartments, Department } from '../api/apiClient';
import { GraduationCap, ArrowLeft, Clock, CheckCircle, AlertCircle, BadgeCheck } from 'lucide-react';

interface FacultyRegistrationPageProps {
  onRegistrationComplete: () => void;
  onBackToLogin: () => void;
}

export function FacultyRegistrationPage({
  onRegistrationComplete,
  onBackToLogin,
}: FacultyRegistrationPageProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'pending'; text: string } | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingDepts, setLoadingDepts] = useState(true);
  const [registered, setRegistered] = useState(false);

  const [formData, setFormData] = useState({
    facultyId: '',
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    departmentId: '',
  });

  // Load departments on mount
  useEffect(() => {
    const loadDepartments = async () => {
      const depts = await getDepartments();
      setDepartments(depts);
      setLoadingDepts(false);
    };
    loadDepartments();
  }, []);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setMessage(null);
  };

  const validateForm = (): boolean => {
    if (!formData.facultyId || !formData.email || !formData.password || !formData.name || !formData.departmentId) {
      setMessage({ type: 'error', text: 'Please fill all required fields including your Faculty ID' });
      return false;
    }
    if (!/^[A-Za-z0-9\-\/]+$/.test(formData.facultyId)) {
      setMessage({ type: 'error', text: 'Faculty ID should contain only letters, numbers, hyphens or slashes' });
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return false;
    }
    if (formData.password.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return false;
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (!passwordRegex.test(formData.password)) {
      setMessage({ type: 'error', text: 'Password must contain uppercase, lowercase, and a number' });
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setMessage({ type: 'error', text: 'Please enter a valid email address' });
      return false;
    }
    return true;
  };

  const handleSubmitRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    const response = await registerFacultyMember({
      email: formData.email,
      password: formData.password,
      name: formData.name,
      departmentId: parseInt(formData.departmentId),
      facultyId: formData.facultyId,
    });

    if (response.status === 'success') {
      setRegistered(true);
      setMessage({
        type: 'pending',
        text: 'Registration submitted! Your account is pending admin approval. You will be able to log in once the admin approves your account.',
      });
    } else {
      setMessage({ type: 'error', text: response.message || 'Registration failed' });
    }
    setLoading(false);
  };

  // Success / Pending state
  if (registered) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F3F4F6' }}>
        <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-lg text-center space-y-5">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
            style={{ backgroundColor: '#FEF3C7' }}
          >
            <Clock className="w-8 h-8" style={{ color: '#D97706' }} />
          </div>
          <h2 className="text-xl font-bold" style={{ color: '#0F172A' }}>Account Pending Approval</h2>
          <p className="text-sm" style={{ color: '#64748B' }}>
            Your faculty account has been submitted successfully. An admin must approve it before you can log in.
          </p>
          <div className="p-4 rounded-xl text-left space-y-2" style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A' }}>
            <p className="text-xs font-semibold" style={{ color: '#D97706' }}>What happens next?</p>
            <ul className="text-xs space-y-1" style={{ color: '#92400E' }}>
              <li className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3" /> Your Faculty ID <strong>{formData.facultyId}</strong> will be verified by admin</li>
              <li className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> After approval, you can log in using your email and password</li>
              <li className="flex items-center gap-1.5"><BadgeCheck className="w-3 h-3" /> Contact admin if approval is delayed</li>
            </ul>
          </div>
          <Button
            onClick={onBackToLogin}
            className="w-full text-white font-semibold rounded-xl"
            style={{ backgroundColor: '#1E3A8A' }}
          >
            Back to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F3F4F6' }}>
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ backgroundColor: '#1E3A8A' }}>
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ color: '#1E3A8A' }}>Faculty Registration</h1>
              <p className="text-xs" style={{ color: '#64748B' }}>Create your account — pending admin approval</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onBackToLogin} className="flex items-center gap-1.5">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
        </div>

        {/* Messages */}
        {message && (
          <div
            className={`mb-5 p-4 rounded-xl flex gap-3 ${
              message.type === 'error'
                ? 'bg-red-50 border border-red-200 text-red-800'
                : 'bg-amber-50 border border-amber-200 text-amber-800'
            }`}
          >
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p className="text-sm">{message.text}</p>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmitRegistration} className="space-y-4">

          {/* Faculty ID — NEW field */}
          <div>
            <Label htmlFor="facultyId">
              Faculty / Employee ID <span className="text-red-500">*</span>
            </Label>
            <Input
              id="facultyId"
              name="facultyId"
              type="text"
              placeholder="e.g. FAC-2024-001 or EMP12345"
              value={formData.facultyId}
              onChange={handleFormChange}
              className="mt-1.5"
            />
            <p className="text-xs mt-1" style={{ color: '#94A3B8' }}>
              Your official institution-issued faculty or employee ID
            </p>
          </div>

          <div>
            <Label htmlFor="name">Full Name <span className="text-red-500">*</span></Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="e.g., Dr. John Smith"
              value={formData.name}
              onChange={handleFormChange}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="email">Email Address <span className="text-red-500">*</span></Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="your.name@university.edu"
              value={formData.email}
              onChange={handleFormChange}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="department">Department <span className="text-red-500">*</span></Label>
            <select
              id="department"
              name="departmentId"
              value={formData.departmentId}
              onChange={handleFormChange}
              className="mt-1.5 w-full px-3 py-2.5 text-sm rounded-xl outline-none"
              style={{ border: '1px solid #E2E8F0', backgroundColor: '#F8FAFF', color: '#0F172A' }}
              required
              disabled={loadingDepts}
            >
              <option value="">
                {loadingDepts ? 'Loading departments...' : 'Select Department'}
              </option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>
                  {dept.specialization ? `${dept.name} (${dept.specialization})` : dept.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="password">Password <span className="text-red-500">*</span></Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Min 6 chars, uppercase + number"
              value={formData.password}
              onChange={handleFormChange}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirm Password <span className="text-red-500">*</span></Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Re-enter password"
              value={formData.confirmPassword}
              onChange={handleFormChange}
              className="mt-1.5"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              onClick={onBackToLogin}
              variant="outline"
              type="button"
              className="flex-1 rounded-xl"
              style={{ borderColor: '#1E3A8A', color: '#1E3A8A' }}
            >
              Back
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 text-white font-semibold rounded-xl"
              style={{ backgroundColor: '#1E3A8A' }}
            >
              {loading ? '⏳ Registering...' : 'Submit Request'}
            </Button>
          </div>
        </form>

        {/* Info Note */}
        <Card className="mt-5 p-4" style={{ backgroundColor: '#FFF7ED', border: '1px solid #FED7AA' }}>
          <div className="flex items-start gap-2">
            <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#D97706' }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: '#92400E' }}>Pending Approval</p>
              <p className="text-xs mt-1" style={{ color: '#92400E' }}>
                New accounts require admin approval before login. Your Faculty ID will be used for identity verification.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
