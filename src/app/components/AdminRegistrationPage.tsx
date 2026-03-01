import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { ArrowLeft, Lock, Mail, User, AlertCircle } from 'lucide-react';
import { apiClient } from '../api/apiClient';

interface AdminRegistrationPageProps {
  onRegistrationComplete?: () => void;
  onBackToLogin?: () => void;
}

export function AdminRegistrationPage({ onRegistrationComplete, onBackToLogin }: AdminRegistrationPageProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: 'Administration',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('All fields are required');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    const result = await apiClient.registerAdmin({
      email: formData.email,
      password: formData.password,
      name: formData.name,
      department: formData.department,
    });

    if (result.status === 'success') {
      setSuccess('✓ Admin registration successful! Redirecting to login...');
      setTimeout(() => {
        if (onRegistrationComplete) {
          onRegistrationComplete();
        }
      }, 2000);
    } else {
      setError(result.message || 'Registration failed. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F3F4F6' }}>
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg">
        {/* Back Button */}
        <button
          onClick={onBackToLogin}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{ backgroundColor: '#1E3A8A' }}>
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: '#1E3A8A' }}>
            Admin Registration
          </h1>
          <p className="text-gray-600 mt-1">Create a new administrator account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Admin Name */}
          <div>
            <Label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Full Name
              </div>
            </Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Enter admin name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full"
              disabled={loading}
            />
          </div>

          {/* Email */}
          <div>
            <Label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </div>
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="admin@university.edu"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full"
              disabled={loading}
            />
          </div>

          {/* Department */}
          <div>
            <Label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">
              Department
            </Label>
            <select
              id="department"
              name="department"
              value={formData.department}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none"
              disabled={loading}
            >
              <option value="Administration">Administration</option>
              <option value="Management">Management</option>
              <option value="IT">IT</option>
              <option value="HR">Human Resources</option>
            </select>
          </div>

          {/* Password */}
          <div>
            <Label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Password
              </div>
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="At least 6 characters"
              value={formData.password}
              onChange={handleInputChange}
              className="w-full"
              disabled={loading}
            />
          </div>

          {/* Confirm Password */}
          <div>
            <Label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password
            </Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className="w-full"
              disabled={loading}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex gap-3">
              <div className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5">✓</div>
              <p className="text-sm text-green-700">{success}</p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full py-2.5 text-white font-medium rounded-lg transition-all"
            style={{ backgroundColor: loading ? '#9CA3AF' : '#1E3A8A' }}
            disabled={loading}
          >
            {loading ? 'Creating Admin Account...' : 'Register as Admin'}
          </Button>
        </form>

        {/* Security Note */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Admin accounts have elevated privileges. Ensure strong passwords are used.
          </p>
        </div>
      </div>
    </div>
  );
}
