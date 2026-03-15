import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  AlertCircle,
  Trash2,
  RotateCcw,
  Database,
  Clock,
  Users,
  Edit2,
  Sun,
  Moon,
  Plus,
  CheckCircle,
  XCircle,
  Calendar,
} from 'lucide-react';
import { apiClient, getDepartments } from '../api/apiClient';
import { ConfirmationDialog } from './ui/confirmation-dialog';

interface Department { id: number; name: string; }
interface Session {
  id: number;
  name: string;
  departmentId: number;
  startTime: string;
  endTime: string;
  date: string;
  isActive: boolean;
}

const SESSION_PRESETS = [
  {
    key: 'morning',
    label: 'Morning Session',
    icon: Sun,
    start: '08:45',
    end: '09:20',
    color: '#F59E0B',
    bg: '#FFFBEB',
    border: '#FDE68A',
    description: '8:45 AM – 9:20 AM',
  },
  {
    key: 'evening',
    label: 'Evening Session',
    icon: Moon,
    start: '15:30',
    end: '16:20',
    color: '#6366F1',
    bg: '#EEF2FF',
    border: '#C7D2FE',
    description: '3:30 PM – 4:20 PM',
  },
];

function formatTime(t: string) {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

function isSessionActive(start: string, end: string, date: string): boolean {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  if (date !== todayStr) return false;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const startMins = sh * 60 + sm;
  const endMins = eh * 60 + em;
  return nowMins >= startMins && nowMins <= endMins;
}

export function AdminSettings() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  } | null>(null);

  // Sessions state
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [sessionForm, setSessionForm] = useState({
    name: '',
    departmentId: '',
    startTime: '',
    endTime: '',
    date: new Date().toISOString().slice(0, 10),
  });

  // Student Management state
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [studentForm, setStudentForm] = useState({
    studentId: '',
    name: '',
    phoneNumber: '',
  });

  useEffect(() => {
    loadDepartments();
    loadSessions();
  }, []);

  const loadDepartments = async () => {
    const depts = await getDepartments();
    setDepartments(depts);
  };

  const loadSessions = async () => {
    setSessionsLoading(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const data = await apiClient.getAttendanceSessions(undefined, today);
      setSessions(data || []);
    } catch {
      setSessions([]);
    } finally {
      setSessionsLoading(false);
    }
  };

  const applyPreset = (preset: typeof SESSION_PRESETS[0]) => {
    setSessionForm((f) => ({
      ...f,
      name: preset.label,
      startTime: preset.start,
      endTime: preset.end,
    }));
    setShowSessionForm(true);
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
      1
    );

    if (result.status === 'success') {
      setSuccess('✓ Attendance session created successfully!');
      setSessionForm({ name: '', departmentId: '', startTime: '', endTime: '', date: new Date().toISOString().slice(0, 10) });
      setShowSessionForm(false);
      loadSessions();
    } else {
      setError(result.message || 'Failed to create session');
    }
    setLoading(false);
  };

  const handleDeleteSession = (id: number, name: string) => {
    setConfirmDialog({
      open: true,
      title: 'Delete Session',
      description: `Are you sure you want to delete the session "${name}"?`,
      onConfirm: async () => {
        setLoading(true);
        const result = await apiClient.deleteAttendanceSession(id);
        if (result.status === 'success') {
          setSuccess('✓ Session deleted.');
          setConfirmDialog(null);
          loadSessions();
        } else {
          setError(result.message || 'Failed to delete session');
        }
        setLoading(false);
      },
    });
  };

  const handleDeleteStudents = async () => {
    setConfirmDialog({
      open: true,
      title: 'Delete All Students',
      description: 'Are you sure you want to delete all students and their face vectors? This action cannot be undone.',
      onConfirm: async () => {
        setLoading(true);
        setError('');
        setSuccess('');
        const result = await apiClient.deleteAllStudents();
        if (result.status === 'success') {
          setSuccess('✓ All students deleted successfully!');
          setConfirmDialog(null);
        } else {
          setError(result.message || 'Failed to delete students');
        }
        setLoading(false);
      },
    });
  };

  const handleDeleteAttendance = async () => {
    setConfirmDialog({
      open: true,
      title: 'Delete All Attendance Records',
      description: 'Are you sure you want to delete all attendance records? This action cannot be undone.',
      onConfirm: async () => {
        setLoading(true);
        setError('');
        setSuccess('');
        const result = await apiClient.deleteAllAttendance();
        if (result.status === 'success') {
          setSuccess('✓ All attendance records deleted successfully!');
          setConfirmDialog(null);
        } else {
          setError(result.message || 'Failed to delete attendance');
        }
        setLoading(false);
      },
    });
  };

  const handleResetDatabase = async () => {
    setConfirmDialog({
      open: true,
      title: 'Reset Database',
      description: 'Are you sure you want to reset the entire database? All data will be permanently lost.',
      onConfirm: async () => {
        setLoading(true);
        setError('');
        setSuccess('');
        const result = await apiClient.resetDatabase();
        if (result.status === 'success') {
          setSuccess('✓ Database reset successfully! All data has been cleared.');
          setConfirmDialog(null);
        } else {
          setError(result.message || 'Failed to reset database');
        }
        setLoading(false);
      },
    });
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
    const result = await apiClient.updateStudent(parseInt(studentForm.studentId), studentForm.name, studentForm.phoneNumber || undefined);
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
    if (!studentForm.studentId) { setError('Please enter student ID'); return; }
    setConfirmDialog({
      open: true,
      title: 'Delete Student',
      description: `Are you sure you want to delete student ${studentForm.studentId}? This cannot be undone.`,
      onConfirm: async () => {
        setLoading(true);
        setError('');
        setSuccess('');
        const result = await apiClient.deleteStudent(parseInt(studentForm.studentId));
        if (result.status === 'success') {
          setSuccess('✓ Student deleted successfully!');
          setConfirmDialog(null);
          setStudentForm({ studentId: '', name: '', phoneNumber: '' });
          setShowStudentForm(false);
        } else {
          setError(result.message || 'Failed to delete student');
        }
        setLoading(false);
      },
    });
  };

  const getDeptName = (id: number) => departments.find((d) => d.id === id)?.name || `Dept ${id}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold" style={{ color: '#1E3A8A' }}>Admin Settings</h2>
        <p className="text-sm mt-1" style={{ color: '#64748B' }}>Manage sessions, students, and system operations</p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      {/* ── ATTENDANCE SESSIONS ── */}
      <Card className="rounded-2xl overflow-hidden" style={{ border: '1px solid #E2E8F0', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        {/* Card Header */}
        <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #E2E8F0', backgroundColor: '#FFFFFF' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#EEF2FF' }}>
              <Clock className="w-5 h-5" style={{ color: '#1E3A8A' }} />
            </div>
            <div>
              <h3 className="text-base font-bold" style={{ color: '#0F172A' }}>Attendance Sessions</h3>
              <p className="text-xs" style={{ color: '#94A3B8' }}>
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
          <Button
            onClick={() => setShowSessionForm((v) => !v)}
            className="flex items-center gap-2 text-sm font-semibold text-white rounded-xl px-4 py-2"
            style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)', boxShadow: '0 4px 12px rgba(30,58,138,0.25)' }}
          >
            <Plus className="w-4 h-4" />
            New Session
          </Button>
        </div>

        <div className="p-6 space-y-5" style={{ backgroundColor: '#FAFBFF' }}>
          {/* Preset Buttons */}
          <div>
            <p className="text-xs font-semibold mb-3" style={{ color: '#64748B' }}>⚡ QUICK PRESETS</p>
            <div className="grid grid-cols-2 gap-4">
              {SESSION_PRESETS.map((preset) => {
                const Icon = preset.icon;
                return (
                  <button
                    key={preset.key}
                    onClick={() => applyPreset(preset)}
                    className="flex items-center gap-4 p-4 rounded-2xl text-left transition-all hover:scale-[1.02]"
                    style={{ backgroundColor: preset.bg, border: `2px solid ${preset.border}` }}
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: preset.color + '22' }}
                    >
                      <Icon className="w-6 h-6" style={{ color: preset.color }} />
                    </div>
                    <div>
                      <p className="text-sm font-bold" style={{ color: '#0F172A' }}>{preset.label}</p>
                      <p className="text-xs font-medium mt-0.5" style={{ color: preset.color }}>{preset.description}</p>
                      <p className="text-xs mt-1" style={{ color: '#94A3B8' }}>Click to use this preset</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Create Session Form */}
          {showSessionForm && (
            <form onSubmit={handleCreateSession} className="space-y-4 p-5 rounded-2xl" style={{ border: '1px solid #C7D2FE', backgroundColor: '#FFFFFF' }}>
              <p className="text-sm font-bold" style={{ color: '#1E3A8A' }}>Create New Session</p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold" style={{ color: '#64748B' }}>Session Name</Label>
                  <Input
                    type="text"
                    placeholder="e.g., Morning Session"
                    value={sessionForm.name}
                    onChange={(e) => setSessionForm({ ...sessionForm, name: e.target.value })}
                    className="mt-1.5 rounded-xl"
                    style={{ borderColor: '#C7D2FE' }}
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold" style={{ color: '#64748B' }}>Department</Label>
                  <select
                    value={sessionForm.departmentId}
                    onChange={(e) => setSessionForm({ ...sessionForm, departmentId: e.target.value })}
                    className="w-full mt-1.5 rounded-xl px-3 py-2 text-sm outline-none"
                    style={{ border: '1px solid #C7D2FE', backgroundColor: '#F8FAFF', color: '#0F172A' }}
                  >
                    <option value="">Select department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs font-semibold" style={{ color: '#64748B' }}>Start Time</Label>
                  <Input
                    type="time"
                    value={sessionForm.startTime}
                    onChange={(e) => setSessionForm({ ...sessionForm, startTime: e.target.value })}
                    className="mt-1.5 rounded-xl"
                    style={{ borderColor: '#C7D2FE' }}
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold" style={{ color: '#64748B' }}>End Time</Label>
                  <Input
                    type="time"
                    value={sessionForm.endTime}
                    onChange={(e) => setSessionForm({ ...sessionForm, endTime: e.target.value })}
                    className="mt-1.5 rounded-xl"
                    style={{ borderColor: '#C7D2FE' }}
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold" style={{ color: '#64748B' }}>Date</Label>
                  <Input
                    type="date"
                    value={sessionForm.date}
                    onChange={(e) => setSessionForm({ ...sessionForm, date: e.target.value })}
                    className="mt-1.5 rounded-xl"
                    style={{ borderColor: '#C7D2FE' }}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 font-semibold text-white rounded-xl"
                  style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)' }}
                >
                  Create Session
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 rounded-xl"
                  onClick={() => { setShowSessionForm(false); setError(''); }}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {/* Today's Sessions List */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4" style={{ color: '#1E3A8A' }} />
              <p className="text-xs font-semibold" style={{ color: '#64748B' }}>TODAY'S SESSIONS</p>
            </div>

            {sessionsLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-16 rounded-xl animate-pulse" style={{ backgroundColor: '#E2E8F0' }} />
                ))}
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-8 rounded-2xl" style={{ border: '2px dashed #E2E8F0', backgroundColor: '#FFFFFF' }}>
                <Clock className="w-8 h-8 mx-auto mb-2" style={{ color: '#CBD5E1' }} />
                <p className="text-sm font-medium" style={{ color: '#94A3B8' }}>No sessions created for today</p>
                <p className="text-xs mt-1" style={{ color: '#CBD5E1' }}>Use the presets above to quickly add a session</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.map((session) => {
                  const active = isSessionActive(session.startTime, session.endTime, session.date);
                  const isMorning = session.startTime <= '12:00';
                  const PresetIcon = isMorning ? Sun : Moon;
                  const accentColor = isMorning ? '#F59E0B' : '#6366F1';
                  const accentBg = isMorning ? '#FFFBEB' : '#EEF2FF';
                  return (
                    <div
                      key={session.id}
                      className="flex items-center justify-between px-4 py-3 rounded-2xl"
                      style={{
                        border: active ? `2px solid ${accentColor}` : '1px solid #E2E8F0',
                        backgroundColor: active ? accentBg : '#FFFFFF',
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: accentColor + '22' }}>
                          <PresetIcon className="w-5 h-5" style={{ color: accentColor }} />
                        </div>
                        <div>
                          <p className="text-sm font-bold" style={{ color: '#0F172A' }}>{session.name}</p>
                          <p className="text-xs mt-0.5" style={{ color: '#64748B' }}>
                            {formatTime(session.startTime)} – {formatTime(session.endTime)} · {getDeptName(session.departmentId)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                          style={
                            active
                              ? { backgroundColor: accentColor + '22', color: accentColor }
                              : { backgroundColor: '#F1F5F9', color: '#94A3B8' }
                          }
                        >
                          {active ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {active ? 'Active' : 'Inactive'}
                        </span>
                        <button
                          onClick={() => handleDeleteSession(session.id, session.name)}
                          className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                          title="Delete session"
                        >
                          <Trash2 className="w-4 h-4" style={{ color: '#DC2626' }} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* ── DATABASE MANAGEMENT ── */}
      <Card className="rounded-2xl overflow-hidden" style={{ border: '1px solid #E2E8F0', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <div className="px-6 py-4 flex items-center gap-3" style={{ borderBottom: '1px solid #E2E8F0', backgroundColor: '#FFFFFF' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#FEF2F2' }}>
            <Database className="w-5 h-5" style={{ color: '#DC2626' }} />
          </div>
          <div>
            <h3 className="text-base font-bold" style={{ color: '#0F172A' }}>Database Management</h3>
            <p className="text-xs" style={{ color: '#94A3B8' }}>Destructive actions — use with caution</p>
          </div>
        </div>

        <div className="p-6 space-y-4" style={{ backgroundColor: '#FAFBFF' }}>
          {[
            { label: 'Delete All Students', desc: 'Remove all student records and face vectors', onClick: handleDeleteStudents, color: 'bg-red-600 hover:bg-red-700' },
            { label: 'Delete All Attendance Records', desc: 'Remove all attendance marking history', onClick: handleDeleteAttendance, color: 'bg-yellow-600 hover:bg-yellow-700' },
            { label: 'Reset Entire Database', desc: 'WARNING: Deletes all students and attendance records permanently.', onClick: handleResetDatabase, color: 'bg-red-800 hover:bg-red-900' },
          ].map(({ label, desc, onClick, color }) => (
            <div key={label} className="flex items-center justify-between p-4 rounded-xl" style={{ border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF' }}>
              <div>
                <h4 className="font-semibold text-sm" style={{ color: '#0F172A' }}>{label}</h4>
                <p className="text-xs mt-0.5" style={{ color: '#64748B' }}>{desc}</p>
              </div>
              <Button
                onClick={onClick}
                disabled={loading}
                className={`flex items-center gap-2 text-sm font-semibold text-white rounded-xl px-4 py-2 ${color}`}
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
            </div>
          ))}

          <div className="flex items-center justify-between p-4 rounded-xl" style={{ border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF' }}>
            <div>
              <h4 className="font-semibold text-sm" style={{ color: '#0F172A' }}>Reset Entire Database</h4>
              <p className="text-xs mt-0.5" style={{ color: '#64748B' }}>
                <strong>WARNING:</strong> Deletes all students and attendance records permanently.
              </p>
            </div>
            <Button
              onClick={handleResetDatabase}
              disabled={loading}
              className="flex items-center gap-2 text-sm font-semibold text-white rounded-xl px-4 py-2 bg-red-700 hover:bg-red-800"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </Button>
          </div>
        </div>
      </Card>

      {/* ── STUDENT MANAGEMENT ── */}
      <Card className="rounded-2xl overflow-hidden" style={{ border: '1px solid #E2E8F0', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #E2E8F0', backgroundColor: '#FFFFFF' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#EEF2FF' }}>
              <Users className="w-5 h-5" style={{ color: '#1E3A8A' }} />
            </div>
            <h3 className="text-base font-bold" style={{ color: '#0F172A' }}>Student Data Management</h3>
          </div>
        </div>

        <div className="p-6" style={{ backgroundColor: '#FAFBFF' }}>
          {showStudentForm ? (
            <form className="space-y-4 p-5 rounded-2xl" style={{ border: '1px solid #C7D2FE', backgroundColor: '#FFFFFF' }}>
              <p className="text-sm font-bold" style={{ color: '#1E3A8A' }}>Edit / Delete Student</p>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs font-semibold" style={{ color: '#64748B' }}>Student ID</Label>
                  <Input
                    type="number"
                    placeholder="Enter ID"
                    value={studentForm.studentId}
                    onChange={(e) => setStudentForm({ ...studentForm, studentId: e.target.value })}
                    className="mt-1.5 rounded-xl"
                    style={{ borderColor: '#C7D2FE' }}
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold" style={{ color: '#64748B' }}>Student Name</Label>
                  <Input
                    type="text"
                    placeholder="Enter name"
                    value={studentForm.name}
                    onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                    className="mt-1.5 rounded-xl"
                    style={{ borderColor: '#C7D2FE' }}
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold" style={{ color: '#64748B' }}>Phone (optional)</Label>
                  <Input
                    type="tel"
                    placeholder="Phone number"
                    value={studentForm.phoneNumber}
                    onChange={(e) => setStudentForm({ ...studentForm, phoneNumber: e.target.value })}
                    className="mt-1.5 rounded-xl"
                    style={{ borderColor: '#C7D2FE' }}
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <Button onClick={handleUpdateStudent} className="flex-1 font-semibold text-white rounded-xl bg-green-600 hover:bg-green-700" disabled={loading}>
                  <Edit2 className="w-4 h-4 mr-2" /> Update
                </Button>
                <Button onClick={handleDeleteStudent} className="flex-1 font-semibold text-white rounded-xl bg-red-600 hover:bg-red-700" disabled={loading}>
                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                </Button>
                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowStudentForm(false)} disabled={loading}>
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <Button
              onClick={() => setShowStudentForm(true)}
              className="w-full font-semibold text-white rounded-xl py-3"
              style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)' }}
            >
              <Edit2 className="w-4 h-4 mr-2" /> Manage Student Data
            </Button>
          )}
        </div>
      </Card>

      {/* Info */}
      <Card className="p-5 rounded-2xl" style={{ backgroundColor: '#F0F9FF', border: '1px solid #BAE6FD' }}>
        <h4 className="font-semibold text-sm mb-3" style={{ color: '#0369A1' }}>ℹ️ Important Notes</h4>
        <ul className="text-xs space-y-1.5" style={{ color: '#0369A1' }}>
          <li>✓ Deleting students removes their face vectors and profile data permanently</li>
          <li>✓ Session presets (Morning 8:45–9:20, Evening 3:30–4:20) are fixed institutional times</li>
          <li>✓ Sessions are scoped per department — each department can have its own session</li>
          <li>✓ All destructive operations create an audit trail and cannot be undone</li>
        </ul>
      </Card>

      {/* Confirmation Dialog */}
      {confirmDialog && (
        <ConfirmationDialog
          open={confirmDialog.open}
          onOpenChange={(open) => setConfirmDialog(open ? confirmDialog : null)}
          title={confirmDialog.title}
          description={confirmDialog.description}
          onConfirm={confirmDialog.onConfirm}
          loading={loading}
          variant="destructive"
        />
      )}
    </div>
  );
}
