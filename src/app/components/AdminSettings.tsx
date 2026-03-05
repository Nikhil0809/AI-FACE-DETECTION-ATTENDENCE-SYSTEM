import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { AlertCircle, Trash2, RotateCcw, Database, Clock, Users, Edit2 } from 'lucide-react';
import { apiClient } from '../api/apiClient';

export function AdminSettings() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirmAction, setConfirmAction] = useState<string | null>(null);
  
  // Attendance Session state
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [sessionForm, setSessionForm] = useState({
    name: '',
    departmentId: '',
    startTime: '',
    endTime: '',
    date: '',
  });
  
  // Student Management state
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [studentForm, setStudentForm] = useState({
    studentId: '',
    name: '',
    phoneNumber: '',
  });

  const handleDeleteStudents = async () => {
    if (confirmAction !== 'delete-students') {
      setConfirmAction('delete-students');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    const result = await apiClient.deleteAllStudents();
    if (result.status === 'success') {
      setSuccess('✓ All students deleted successfully!');
      setConfirmAction(null);
    } else {
      setError(result.message || 'Failed to delete students');
    }
    setLoading(false);
  };

  const handleDeleteAttendance = async () => {
    if (confirmAction !== 'delete-attendance') {
      setConfirmAction('delete-attendance');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    const result = await apiClient.deleteAllAttendance();
    if (result.status === 'success') {
      setSuccess('✓ All attendance records deleted successfully!');
      setConfirmAction(null);
    } else {
      setError(result.message || 'Failed to delete attendance');
    }
    setLoading(false);
  };

  const handleResetDatabase = async () => {
    if (confirmAction !== 'reset-database') {
      setConfirmAction('reset-database');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    const result = await apiClient.resetDatabase();
    if (result.status === 'success') {
      setSuccess('✓ Database reset successfully! All data has been cleared.');
      setConfirmAction(null);
    } else {
      setError(result.message || 'Failed to reset database');
    }
    setLoading(false);
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionForm.name || !sessionForm.departmentId || !sessionForm.startTime || !sessionForm.endTime || !sessionForm.date) {
      setError('Please fill all session fields');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');

    const result = await apiClient.createAttendanceSession(
      sessionForm.name,
      parseInt(sessionForm.departmentId),
      sessionForm.startTime,
      sessionForm.endTime,
      sessionForm.date,
      1  // Default admin user ID
    );

    if (result.status === 'success') {
      setSuccess('✓ Attendance session created successfully!');
      setSessionForm({ name: '', departmentId: '', startTime: '', endTime: '', date: '' });
      setShowSessionForm(false);
    } else {
      setError(result.message || 'Failed to create session');
    }
    setLoading(false);
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentForm.studentId || !studentForm.name) {
      setError('Please fill student fields');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');

    const result = await apiClient.updateStudent(
      parseInt(studentForm.studentId),
      studentForm.name,
      studentForm.phoneNumber || undefined
    );

    if (result.status === 'success') {
      setSuccess('✓ Student information updated successfully!');
      setStudentForm({ studentId: '', name: '', phoneNumber: '' });
      setShowStudentForm(false);
    } else {
      setError(result.message || 'Failed to update student');
    }
    setLoading(false);
  };

  const handleDeleteStudent = async () => {
    if (!studentForm.studentId) {
      setError('Please enter student ID');
      return;
    }

    if (confirmAction !== 'delete-student') {
      setConfirmAction('delete-student');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    const result = await apiClient.deleteStudent(parseInt(studentForm.studentId));
    if (result.status === 'success') {
      setSuccess('✓ Student deleted successfully!');
      setConfirmAction(null);
      setStudentForm({ studentId: '', name: '', phoneNumber: '' });
      setShowStudentForm(false);
    } else {
      setError(result.message || 'Failed to delete student');
    }
    setLoading(false);
  }

  const handleCancel = () => {
    setConfirmAction(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900" style={{ color: '#1E3A8A' }}>
          Admin Settings
        </h2>
        <p className="text-gray-600 mt-2">Manage database and system operations</p>
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
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      {/* Database Management Section */}
      <Card className="p-6 rounded-xl shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <Database className="w-6 h-6" style={{ color: '#1E3A8A' }} />
          <h3 className="text-lg font-bold" style={{ color: '#1E3A8A' }}>
            Database Management
          </h3>
        </div>

        <div className="space-y-4">
          {/* Delete Students */}
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Delete All Students</h4>
                <p className="text-sm text-gray-600 mt-1">Remove all student records and their face vectors from the database</p>
              </div>
              <Button
                onClick={handleDeleteStudents}
                className={`px-4 py-2 rounded-lg text-white font-medium transition-all ${
                  confirmAction === 'delete-students'
                    ? 'bg-red-700 hover:bg-red-800'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
                disabled={loading}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {confirmAction === 'delete-students' ? 'Confirm Delete?' : 'Delete Students'}
              </Button>
            </div>
            {confirmAction === 'delete-students' && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded flex gap-2">
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="flex-1"
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteStudents}
                  className="flex-1 bg-red-600 text-white hover:bg-red-700"
                  disabled={loading}
                >
                  {loading ? 'Deleting...' : 'Yes, Delete All'}
                </Button>
              </div>
            )}
          </div>

          {/* Delete Attendance */}
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Delete All Attendance Records</h4>
                <p className="text-sm text-gray-600 mt-1">Remove all attendance marking history</p>
              </div>
              <Button
                onClick={handleDeleteAttendance}
                className={`px-4 py-2 rounded-lg text-white font-medium transition-all ${
                  confirmAction === 'delete-attendance'
                    ? 'bg-yellow-700 hover:bg-yellow-800'
                    : 'bg-yellow-600 hover:bg-yellow-700'
                }`}
                disabled={loading}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {confirmAction === 'delete-attendance' ? 'Confirm Delete?' : 'Delete Records'}
              </Button>
            </div>
            {confirmAction === 'delete-attendance' && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded flex gap-2">
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="flex-1"
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteAttendance}
                  className="flex-1 bg-yellow-600 text-white hover:bg-yellow-700"
                  disabled={loading}
                >
                  {loading ? 'Deleting...' : 'Yes, Delete All'}
                </Button>
              </div>
            )}
          </div>

          {/* Reset Database */}
          <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-bold text-gray-900">Reset Entire Database</h4>
                <p className="text-sm text-gray-600 mt-1">
                  <strong>WARNING:</strong> This will delete all students and attendance records. This action cannot be undone.
                </p>
              </div>
              <Button
                onClick={handleResetDatabase}
                className={`px-4 py-2 rounded-lg text-white font-medium transition-all ${
                  confirmAction === 'reset-database'
                    ? 'bg-red-800 hover:bg-red-900'
                    : 'bg-red-700 hover:bg-red-800'
                }`}
                disabled={loading}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                {confirmAction === 'reset-database' ? 'Confirm Reset?' : 'Reset Database'}
              </Button>
            </div>
            {confirmAction === 'reset-database' && (
              <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded flex gap-2">
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="flex-1"
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleResetDatabase}
                  className="flex-1 bg-red-800 text-white hover:bg-red-900"
                  disabled={loading}
                >
                  {loading ? 'Resetting...' : 'Yes, Reset Database'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Attendance Sessions Management */}
      <Card className="p-6 rounded-xl shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <Clock className="w-6 h-6" style={{ color: '#1E3A8A' }} />
          <h3 className="text-lg font-bold" style={{ color: '#1E3A8A' }}>
            Attendance Sessions
          </h3>
        </div>

        {showSessionForm ? (
          <form onSubmit={handleCreateSession} className="space-y-4">
            <div>
              <Label>Session Name</Label>
              <Input
                type="text"
                placeholder="e.g., Morning Session"
                value={sessionForm.name}
                onChange={(e) => setSessionForm({ ...sessionForm, name: e.target.value })}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label>Department ID</Label>
              <Input
                type="number"
                placeholder="Enter department ID"
                value={sessionForm.departmentId}
                onChange={(e) => setSessionForm({ ...sessionForm, departmentId: e.target.value })}
                className="mt-1.5"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Time (HH:MM)</Label>
                <Input
                  type="time"
                  value={sessionForm.startTime}
                  onChange={(e) => setSessionForm({ ...sessionForm, startTime: e.target.value })}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>End Time (HH:MM)</Label>
                <Input
                  type="time"
                  value={sessionForm.endTime}
                  onChange={(e) => setSessionForm({ ...sessionForm, endTime: e.target.value })}
                  className="mt-1.5"
                />
              </div>
            </div>

            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={sessionForm.date}
                onChange={(e) => setSessionForm({ ...sessionForm, date: e.target.value })}
                className="mt-1.5"
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                className="flex-1 bg-green-600 text-white hover:bg-green-700"
                disabled={loading}
              >
                Create Session
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setShowSessionForm(false)}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <Button
            onClick={() => setShowSessionForm(true)}
            className="w-full bg-blue-600 text-white hover:bg-blue-700"
          >
            + Create New Attendance Session
          </Button>
        )}
      </Card>

      {/* Student Data Management */}
      <Card className="p-6 rounded-xl shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <Users className="w-6 h-6" style={{ color: '#1E3A8A' }} />
          <h3 className="text-lg font-bold" style={{ color: '#1E3A8A' }}>
            Student Management
          </h3>
        </div>

        {showStudentForm ? (
          <form className="space-y-4">
            <div>
              <Label>Student ID</Label>
              <Input
                type="number"
                placeholder="Enter student ID"
                value={studentForm.studentId}
                onChange={(e) => setStudentForm({ ...studentForm, studentId: e.target.value })}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label>Student Name</Label>
              <Input
                type="text"
                placeholder="Enter student name"
                value={studentForm.name}
                onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label>Phone Number</Label>
              <Input
                type="tel"
                placeholder="Enter phone number (optional)"
                value={studentForm.phoneNumber}
                onChange={(e) => setStudentForm({ ...studentForm, phoneNumber: e.target.value })}
                className="mt-1.5"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleUpdateStudent}
                className="flex-1 bg-green-600 text-white hover:bg-green-700"
                disabled={loading}
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Update Student
              </Button>
              <Button
                onClick={handleDeleteStudent}
                className={`flex-1 text-white font-medium transition-all ${
                  confirmAction === 'delete-student'
                    ? 'bg-red-700 hover:bg-red-800'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
                disabled={loading}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {confirmAction === 'delete-student' ? 'Confirm?' : 'Delete'}
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowStudentForm(false);
                  setConfirmAction(null);
                }}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>

            {confirmAction === 'delete-student' && (
              <div className="p-3 bg-red-50 border border-red-200 rounded">
                <p className="text-sm text-red-700">Are you sure you want to delete this student?</p>
              </div>
            )}
          </form>
        ) : (
          <Button
            onClick={() => setShowStudentForm(true)}
            className="w-full bg-blue-600 text-white hover:bg-blue-700"
          >
            + Manage Student Data
          </Button>
        )}
      </Card>
      <Card className="p-6 rounded-xl shadow-sm bg-blue-50 border border-blue-200">
        <h4 className="font-medium text-gray-900 mb-3">Important Information</h4>
        <ul className="text-sm text-gray-700 space-y-2">
          <li>✓ Deleting students removes their face vectors and profile data</li>
          <li>✓ Deleting attendance records clears all marking history</li>
          <li>✓ Database reset will clear all data but keep admin accounts</li>
          <li>✓ All operations are logged and cannot be undone</li>
        </ul>
      </Card>
    </div>
  );
}
