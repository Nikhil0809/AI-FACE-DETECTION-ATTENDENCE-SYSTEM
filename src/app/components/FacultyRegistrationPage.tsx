import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { registerFacultyMember, RegisterResponse } from '../api/apiClient';
import { GraduationCap, ArrowLeft } from 'lucide-react';

interface FacultyRegistrationPageProps {
  onRegistrationComplete: () => void;
  onBackToLogin: () => void;
}

export function FacultyRegistrationPage({
  onRegistrationComplete,
  onBackToLogin,
}: FacultyRegistrationPageProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    department: '',
  });

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setMessage(null);
  };

  const validateForm = (): boolean => {
    if (!formData.email || !formData.password || !formData.name || !formData.department) {
      setMessage({ type: 'error', text: 'Please fill all fields' });
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

    if (!formData.email.includes('@')) {
      setMessage({ type: 'error', text: 'Please enter a valid email' });
      return false;
    }

    return true;
  };

  const handleSubmitRegistration = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    const response = await registerFacultyMember({
      email: formData.email,
      password: formData.password,
      name: formData.name,
      department: formData.department,
    });

    if (response.status === 'success') {
      setMessage({ type: 'success', text: 'Faculty registration successful! Redirecting to login...' });
      setTimeout(() => {
        onRegistrationComplete();
      }, 1500);
    } else {
      setMessage({ type: 'error', text: response.message || 'Registration failed' });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F3F4F6' }}>
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full" style={{ backgroundColor: '#1E3A8A' }}>
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: '#1E3A8A' }}>
                Faculty Registration
              </h1>
              <p className="text-sm text-gray-600">Create your account</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onBackToLogin} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>

        {/* Messages */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmitRegistration} className="space-y-4">
          <div>
            <Label htmlFor="name">Full Name</Label>
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
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="e.g., john.smith@university.edu"
              value={formData.email}
              onChange={handleFormChange}
              className="mt-1.5"
            />
            <p className="text-xs text-gray-500 mt-1">Use your university email</p>
          </div>

          <div>
            <Label htmlFor="department">Department</Label>
            <select
              id="department"
              name="department"
              value={formData.department}
              onChange={handleFormChange}
              className="mt-1.5 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none"
              style={{ borderColor: '#E5E7EB' }}
            >
              <option value="">Select Department</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Electronics">Electronics</option>
              <option value="Mechanical">Mechanical</option>
              <option value="Civil">Civil</option>
              <option value="Electrical">Electrical</option>
            </select>
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="At least 6 characters"
              value={formData.password}
              onChange={handleFormChange}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirm Password</Label>
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

          <div className="flex gap-2 pt-4">
            <Button
              onClick={onBackToLogin}
              variant="outline"
              className="flex-1"
              style={{ borderColor: '#1E3A8A', color: '#1E3A8A' }}
            >
              Back
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 text-white font-medium py-2.5"
              style={{ backgroundColor: '#1E3A8A' }}
            >
              {loading ? '⏳ Registering...' : '✓ Create Account'}
            </Button>
          </div>
        </form>

        {/* Info Box */}
        <Card className="mt-6 p-4 bg-blue-50 border border-blue-200">
          <p className="text-sm text-blue-800 font-medium mb-2">📝 After Registration:</p>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Your account will be created immediately</li>
            <li>• You can log in with your email and password</li>
            <li>• Admin approval may be required</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
