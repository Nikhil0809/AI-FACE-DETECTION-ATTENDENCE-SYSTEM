import { useState, useEffect, useRef } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  ScanFace,
  Camera,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Play,
  Square,
  AlertCircle,
  Trash2,
  GraduationCap,
  Download,
  Wifi,
  Database,
  Shield,
  Cpu,
  RefreshCw,
  FileText,
  Sun,
  Moon,
  Bell,
  BellOff,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Progress } from './ui/progress';
import AttendanceCamera, { DetectionResult } from './AttendanceCamera';
import { apiClient } from '../api/apiClient';
import { deleteStudent } from '../api/apiClient';
import { getDepartments } from '../api/apiClient';

interface DetectedStudent {
  id: string;
  rollNo: string;
  name: string;
  confidence: number;
  timestamp: string;
  status: 'matched' | 'unknown';
  attendanceStatus?: 'Present' | 'Late'; // Late if detected after session end time
}

// Session presets
const SESSION_PRESETS = [
  { key: 'morning', label: 'Morning', icon: Sun, start: '08:45', end: '09:20', color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A' },
  { key: 'evening', label: 'Evening', icon: Moon, start: '15:30', end: '16:20', color: '#6366F1', bg: '#EEF2FF', border: '#C7D2FE' },
] as const;

function getAttendanceStatus(sessionEnd: string): 'Present' | 'Late' {
  const now = new Date();
  const [h, m] = sessionEnd.split(':').map(Number);
  const endMins = h * 60 + m;
  const nowMins = now.getHours() * 60 + now.getMinutes();
  return nowMins > endMins ? 'Late' : 'Present';
}

interface StudentData {
  id: number | string;
  name: string;
  rollNo: string;
  branch?: string;
  section?: string;
  phone?: string;
}

interface FacultyDashboardProps {
  currentUser?: {
    id?: number;
    name?: string;
    email?: string;
    departmentId?: number;
    role?: string;
  };
}

// ── Stat Chip ─────────────────────────────────────────────────────────────────
function StatChip({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div
      className="flex items-center gap-2 px-4 py-2 rounded-lg"
      style={{ backgroundColor: '#F8FAFF', border: '1px solid #E2E8F0' }}
    >
      <span className="text-xs font-medium" style={{ color: '#64748B' }}>
        {label}
      </span>
      <span className="text-lg font-bold" style={{ color }}>
        {value}
      </span>
    </div>
  );
}

// ── System Status Row ─────────────────────────────────────────────────────────
function StatusRow({
  label,
  value,
  active,
  isCamera,
}: {
  label: string;
  value: string;
  active: boolean;
  isCamera?: boolean;
}) {
  const dotColor = active ? '#10B981' : '#F59E0B';
  const textColor = active ? '#059669' : '#D97706';
  const bgColor = active ? '#ECFDF5' : '#FFFBEB';

  return (
    <div
      className="flex items-center justify-between px-4 py-2.5 rounded-xl"
      style={{ backgroundColor: '#F8FAFF', border: '1px solid #EEF2FF' }}
    >
      <span className="text-sm font-medium" style={{ color: '#374151' }}>
        {label}
      </span>
      <span
        className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
        style={{ backgroundColor: bgColor, color: textColor }}
      >
        {isCamera && !active ? null : (
          <span
            className="w-1.5 h-1.5 rounded-full inline-block"
            style={{ backgroundColor: dotColor }}
          />
        )}
        {value}
      </span>
    </div>
  );
}

export function FacultyDashboard({ currentUser }: FacultyDashboardProps) {
  const [activeTab, setActiveTab] = useState<'attendance' | 'students' | 'logs'>('attendance');
  const [isScanning, setIsScanning] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [detectedStudents, setDetectedStudents] = useState<DetectedStudent[]>([]);
  const [currentDetection, setCurrentDetection] = useState<string | null>(null);
  const [allStudents, setAllStudents] = useState<StudentData[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);
  const [departmentName, setDepartmentName] = useState<string>('Your Department');
  const [selectedSession, setSelectedSession] = useState<typeof SESSION_PRESETS[number]>(SESSION_PRESETS[0]);
  const [unknownAlerts, setUnknownAlerts] = useState<{ id: string; timestamp: string }[]>([]);
  const [showAlertPanel, setShowAlertPanel] = useState(false);

  const [deletingStudent, setDeletingStudent] = useState<StudentData | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const lastUnknownAtRef = useRef<number>(0);
  const UNKNOWN_COOLDOWN_MS = 5000;

  const facultyDepartmentId = currentUser?.departmentId;

  useEffect(() => {
    const loadDeptName = async () => {
      if (!facultyDepartmentId) return;
      try {
        const depts = await getDepartments();
        const dept = depts.find((d) => d.id === facultyDepartmentId);
        if (dept) setDepartmentName(dept.name);
      } catch { /* keep default */ }
    };
    loadDeptName();
  }, [facultyDepartmentId]);

  useEffect(() => { loadStudents(); }, [facultyDepartmentId]);

  const loadStudents = async () => {
    try {
      setIsLoadingStudents(true);
      const students = await apiClient.getStudents(facultyDepartmentId ?? undefined);
      setAllStudents(students || []);
    } catch { setAllStudents([]); } finally { setIsLoadingStudents(false); }
  };

  useEffect(() => {
    const ws = apiClient.connectWebSocket((data: any) => {
      if (data.type === 'student_registered' || data.type === 'student_deleted') loadStudents();
    });
    return () => { if (ws) ws.close(); };
  }, []);

  useEffect(() => {
    if (!isScanning) return;
    const interval = setInterval(() => setSessionTime((p) => p + 1), 1000);
    return () => clearInterval(interval);
  }, [isScanning]);

  const handleCameraDetection = (data: DetectionResult) => {
    if (!data.status || data.status === 'no_face' || data.status === 'error') return;
    const isMatched = data.status === 'matched' && !!data.name;
    const displayName = isMatched ? data.name : 'Unregistered Person';
    setCurrentDetection(displayName);

    if (isMatched) {
      const attStatus = getAttendanceStatus(selectedSession.end);
      const newDetection: DetectedStudent = {
        id: data.id ?? `matched-${Date.now()}`,
        rollNo: data.rollNo ?? data.roll_number ?? '—',
        name: displayName,
        confidence: data.confidence ?? 0,
        timestamp: data.timestamp ?? new Date().toLocaleTimeString(),
        status: 'matched',
        attendanceStatus: attStatus,
      };
      setDetectedStudents((prev) => {
        if (prev.some((s) => s.rollNo === newDetection.rollNo && s.status === 'matched')) return prev;
        return [newDetection, ...prev.slice(0, 49)];
      });
    } else {
      const now = Date.now();
      if (now - lastUnknownAtRef.current < UNKNOWN_COOLDOWN_MS) return;
      lastUnknownAtRef.current = now;
      const unknownEntry: DetectedStudent = {
        id: `unknown-${now}`,
        rollNo: '—',
        name: 'Unregistered Person',
        confidence: 0,
        timestamp: new Date().toLocaleTimeString(),
        status: 'unknown',
      };
      setDetectedStudents((prev) => [unknownEntry, ...prev.filter((s) => s.status !== 'unknown').slice(0, 49)]);
      // Add to alert panel
      setUnknownAlerts((prev) => [{ id: `alert-${now}`, timestamp: new Date().toLocaleTimeString() }, ...prev.slice(0, 9)]);
      setShowAlertPanel(true);
    }
    setTimeout(() => setCurrentDetection(null), 1500);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartSession = () => { setIsScanning(true); setSessionTime(0); setDetectedStudents([]); setUnknownAlerts([]); };
  const handleStopSession = () => { setIsScanning(false); setCurrentDetection(null); };

  const handleExportSessionCsv = () => {
    const matched = detectedStudents.filter((s) => s.status === 'matched');
    if (matched.length === 0) return;
    const csv = ['Roll No,Name,Status,Time', ...matched.map((s) => `${s.rollNo},${s.name},${s.attendanceStatus || 'Present'},${s.timestamp}`)].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `session_${selectedSession.key}_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteClick = (student: StudentData) => { setDeletingStudent(student); setShowDeleteConfirm(true); };
  const confirmDelete = async () => {
    if (!deletingStudent) return;
    setDeleteLoading(true);
    try {
      const result = await deleteStudent(Number(deletingStudent.id));
      if (result.status === 'success') {
        setAllStudents((prev) => prev.filter((s) => s.id !== deletingStudent.id));
        setShowDeleteConfirm(false);
        setDeletingStudent(null);
      } else { alert('Failed to delete student: ' + result.message); }
    } catch { alert('Delete request failed.'); } finally { setDeleteLoading(false); }
  };

  const totalExpected = allStudents.length;
  const matchedCount = detectedStudents.filter((s) => s.status === 'matched').length;
  const unknownCount = detectedStudents.filter((s) => s.status === 'unknown').length;
  const pendingCount = Math.max(0, totalExpected - matchedCount);
  const attendancePercentage = totalExpected > 0 ? (matchedCount / totalExpected) * 100 : 0;

  const getYearFromRollNo = (rollNo: string): string => {
    const prefix = parseInt(rollNo?.substring(0, 2) || '0', 10);
    if (!prefix) return 'Unknown';
    const joiningYear = 2000 + prefix;
    const currentAcademicYear =
      new Date().getMonth() >= 5 ? new Date().getFullYear() : new Date().getFullYear() - 1;
    const yearOfStudy = currentAcademicYear - joiningYear + 1;
    if (yearOfStudy === 1) return '1st Year';
    if (yearOfStudy === 2) return '2nd Year';
    if (yearOfStudy === 3) return '3rd Year';
    if (yearOfStudy === 4) return '4th Year';
    return 'Alumni';
  };

  const YEAR_FILTERS = ['all', '1st Year', '2nd Year', '3rd Year', '4th Year'];
  const filteredStudents = allStudents.filter((s) => {
    const matchesYear = selectedYear === 'all' || getYearFromRollNo(s.rollNo) === selectedYear;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.rollNo.toLowerCase().includes(q) ||
      (s.section || '').toLowerCase().includes(q);
    return matchesYear && matchesSearch;
  });

  const TAB_STYLE = (active: boolean) => ({
    padding: '10px 20px',
    fontSize: '0.875rem',
    fontWeight: active ? 600 : 500,
    color: active ? '#1E3A8A' : '#64748B',
    borderBottom: active ? '2px solid #1E3A8A' : '2px solid transparent',
    background: 'none',
    cursor: 'pointer',
    transition: 'all 0.15s',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  });

  const systemStatuses = [
    { label: 'Camera Status', value: isScanning ? 'Active' : 'Standby', active: isScanning, isCamera: true, Icon: Camera },
    { label: 'AI Model', value: 'Loaded', active: true, Icon: Cpu },
    { label: 'Network', value: 'Connected', active: true, Icon: Wifi },
    { label: 'Geo-Fence', value: 'Verified', active: true, Icon: Shield },
    { label: 'Database Sync', value: 'Synced', active: true, Icon: Database },
  ];

  return (
    <div className="space-y-5">
      {/* ── Department Banner ── */}
      <div
        className="flex items-center gap-3 px-5 py-3 rounded-xl"
        style={{
          background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)',
          border: '1px solid #C7D2FE',
        }}
      >
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: '#1E3A8A' }}
        >
          <GraduationCap className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="text-sm font-medium" style={{ color: '#1E3A8A' }}>
          Department:{' '}
          <strong>
            {departmentName}
            {facultyDepartmentId ? '' : ' (Loading…)'}
          </strong>{' '}
          — You can only view and manage students from your department.
        </span>
      </div>

      {/* ── Session Selector ── */}
      <div>
        <p className="text-xs font-semibold mb-2" style={{ color: '#94A3B8' }}>SELECT ATTENDANCE SESSION</p>
        <div className="grid grid-cols-2 gap-3">
          {SESSION_PRESETS.map((preset) => {
            const Icon = preset.icon;
            const isActive = selectedSession.key === preset.key;
            return (
              <button
                key={preset.key}
                onClick={() => setSelectedSession(preset)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
                style={{
                  backgroundColor: isActive ? preset.bg : '#FFFFFF',
                  border: isActive ? `2px solid ${preset.color}` : '1px solid #E2E8F0',
                  boxShadow: isActive ? `0 4px 12px ${preset.color}33` : 'none',
                }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: preset.color + '22' }}>
                  <Icon className="w-5 h-5" style={{ color: preset.color }} />
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: isActive ? preset.color : '#0F172A' }}>{preset.label} Session</p>
                  <p className="text-xs" style={{ color: '#94A3B8' }}>
                    {preset.start.replace(':', ':').replace(/^0/, '')} – {preset.end.replace(':', ':').replace(/^(1[0-9]|[2-9])/, m => m)}
                    {' '}AM/PM
                  </p>
                </div>
                {isActive && <div className="ml-auto w-2.5 h-2.5 rounded-full" style={{ backgroundColor: preset.color }} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Tab Navigation + CTA ── */}
      <div
        className="flex items-center justify-between"
        style={{ borderBottom: '1px solid #E2E8F0' }}
      >
        <div className="flex">
          <button style={TAB_STYLE(activeTab === 'attendance')} onClick={() => setActiveTab('attendance')}>
            <ScanFace className="w-4 h-4" />
            Attendance Session
          </button>
          <button style={TAB_STYLE(activeTab === 'students')} onClick={() => setActiveTab('students')}>
            <Users className="w-4 h-4" />
            My Students
            <span
              className="ml-1 text-xs font-bold px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: '#EEF2FF', color: '#1E3A8A' }}
            >
              {allStudents.length}
            </span>
          </button>
          <button style={TAB_STYLE(activeTab === 'logs')} onClick={() => setActiveTab('logs')}>
            <FileText className="w-4 h-4" />
            Logs
          </button>
        </div>

        <div className="pb-2">
          {activeTab === 'attendance' && (
            !isScanning ? (
              <Button
                onClick={handleStartSession}
                className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white rounded-xl"
                style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', boxShadow: '0 4px 12px rgba(5,150,105,0.3)' }}
              >
                <Play className="w-4 h-4" />
                Start Recognition
              </Button>
            ) : (
              <Button
                onClick={handleStopSession}
                className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white rounded-xl"
                style={{ background: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)', boxShadow: '0 4px 12px rgba(220,38,38,0.3)' }}
              >
                <Square className="w-4 h-4" />
                End Session
              </Button>
            )
          )}
        </div>
      </div>

      {/* ── ATTENDANCE TAB ── */}
      {activeTab === 'attendance' && (
        <>
          {/* Session Header Card */}
          <Card
            className="rounded-2xl overflow-hidden"
            style={{ border: '1px solid #E2E8F0', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
          >
            <div
              className="px-6 py-5 flex items-center justify-between"
              style={{ background: 'linear-gradient(135deg, #F8FAFF 0%, #EEF2FF 100%)', borderBottom: '1px solid #E8EDFF' }}
            >
              {/* Left: Icon + title */}
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-md"
                  style={{
                    background: isScanning
                      ? 'linear-gradient(135deg, #059669 0%, #047857 100%)'
                      : 'linear-gradient(135deg, #1E3A8A 0%, #1e40af 100%)',
                  }}
                >
                  {isScanning ? (
                    <Camera className="w-7 h-7 text-white animate-pulse" />
                  ) : (
                    <ScanFace className="w-7 h-7 text-white" />
                  )}
                </div>
                <div>
                  <h2 className="text-base font-bold" style={{ color: '#0F172A' }}>
                    {isScanning ? 'Live Face Recognition Active' : 'Start Attendance Session'}
                  </h2>
                  <p className="text-sm mt-0.5" style={{ color: '#64748B' }}>
                    {departmentName}
                  </p>
                  {isScanning && (
                    <div className="flex items-center gap-4 mt-1.5">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" style={{ color: '#64748B' }} />
                        <span className="text-xs font-semibold" style={{ color: '#374151' }}>
                          {formatTime(sessionTime)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#10B981' }} />
                        <span className="text-xs font-medium" style={{ color: '#059669' }}>
                          Live
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Stat chips */}
              <div className="flex items-center gap-3">
                <StatChip label="Expected" value={totalExpected} color="#1E3A8A" />
                <StatChip label="Present" value={matchedCount} color="#059669" />
                <StatChip label="Unregistered" value={unknownCount} color="#DC2626" />
              </div>
            </div>

            {isScanning && (
              <div className="px-6 py-3" style={{ backgroundColor: '#FAFBFF' }}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium" style={{ color: '#64748B' }}>
                    Session Progress
                  </span>
                  <span className="text-xs font-bold" style={{ color: '#1E3A8A' }}>
                    {matchedCount}/{totalExpected} ({attendancePercentage.toFixed(0)}%)
                  </span>
                </div>
                <Progress value={attendancePercentage} className="h-1.5" style={{ backgroundColor: '#E0E7FF' }} />
              </div>
            )}
          </Card>

          {/* Camera + System Status */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Camera Feed */}
            <Card
              className="lg:col-span-2 rounded-2xl overflow-hidden"
              style={{ border: '1px solid #E2E8F0', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
            >
              <div
                className="px-5 py-3.5 flex items-center justify-between"
                style={{ borderBottom: '1px solid #E2E8F0', backgroundColor: '#FFFFFF' }}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: '#EEF2FF' }}
                  >
                    <Camera className="w-3.5 h-3.5" style={{ color: '#1E3A8A' }} />
                  </div>
                  <span className="font-semibold text-sm" style={{ color: '#0F172A' }}>
                    Live Camera Feed
                  </span>
                </div>
                {isScanning && (
                  <span
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full"
                    style={{ backgroundColor: '#ECFDF5', color: '#059669' }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    Recording
                  </span>
                )}
                {!isScanning && (
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: '#F1F5F9', color: '#94A3B8' }}
                  >
                    Standby
                  </span>
                )}
              </div>

              <div className="relative" style={{ minHeight: 380 }}>
                {!isScanning ? (
                  <div
                    className="flex flex-col items-center justify-center gap-3"
                    style={{ minHeight: 380, background: 'linear-gradient(160deg, #0F172A 0%, #1E293B 100%)' }}
                  >
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center mb-1"
                      style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                    >
                      <Camera className="w-8 h-8" style={{ color: 'rgba(255,255,255,0.3)' }} />
                    </div>
                    <p className="text-base font-semibold" style={{ color: 'rgba(255,255,255,0.6)' }}>
                      Camera Standby
                    </p>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      Click "Start Recognition" to begin
                    </p>
                  </div>
                ) : (
                  <div className="w-full" style={{ minHeight: 380 }}>
                    <AttendanceCamera onDetection={handleCameraDetection} />
                  </div>
                )}
              </div>

              {isScanning && (
                <div
                  className="px-5 py-3 flex items-center justify-between"
                  style={{ borderTop: '1px solid #E2E8F0', backgroundColor: '#FAFBFF' }}
                >
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: '#64748B' }}>
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                    Face Detection Model v2.1.0
                  </div>
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: '#64748B' }}>
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                    Confidence Threshold: 95%
                  </div>
                </div>
              )}
            </Card>

            {/* System Status */}
            <Card
              className="rounded-2xl overflow-hidden"
              style={{ border: '1px solid #E2E8F0', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
            >
              <div
                className="px-5 py-3.5"
                style={{ borderBottom: '1px solid #E2E8F0', backgroundColor: '#FFFFFF' }}
              >
                <span className="font-semibold text-sm" style={{ color: '#0F172A' }}>
                  System Status
                </span>
              </div>
              <div className="p-4 space-y-2.5" style={{ backgroundColor: '#FAFBFF' }}>
                {systemStatuses.map(({ label, value, active, isCamera }) => (
                  <StatusRow key={label} label={label} value={value} active={active} isCamera={isCamera} />
                ))}
              </div>
              <div className="px-4 pb-4" style={{ backgroundColor: '#FAFBFF' }}>
                <Button
                  variant="outline"
                  onClick={handleExportSessionCsv}
                  className="w-full flex items-center justify-center gap-2 text-sm font-semibold rounded-xl"

                  style={{
                    borderColor: '#C7D2FE',
                    color: '#1E3A8A',
                    backgroundColor: '#EEF2FF',
                  }}
                >
                  <Download className="w-4 h-4" />
                  Export List
                </Button>
              </div>

              {/* Unknown Face Alert Panel */}
              {unknownAlerts.length > 0 && (
                <div
                  className="mx-4 mb-4 rounded-xl overflow-hidden"
                  style={{ border: '1px solid #FDE68A', backgroundColor: '#FFFBEB' }}
                >
                  <div
                    className="flex items-center justify-between px-3 py-2 cursor-pointer"
                    onClick={() => setShowAlertPanel((v) => !v)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#F59E0B' }} />
                      <Bell className="w-3.5 h-3.5" style={{ color: '#D97706' }} />
                      <span className="text-xs font-bold" style={{ color: '#D97706' }}>
                        {unknownAlerts.length} Unknown Detection{unknownAlerts.length > 1 ? 's' : ''}
                      </span>
                    </div>
                    <BellOff className="w-3.5 h-3.5" style={{ color: '#D97706' }} />
                  </div>
                  {showAlertPanel && (
                    <div className="p-2 space-y-1 max-h-32 overflow-y-auto">
                      {unknownAlerts.map((alert) => (
                        <div
                          key={alert.id}
                          className="flex items-center gap-2 px-2 py-1 rounded-lg"
                          style={{ backgroundColor: '#FEF3C7' }}
                        >
                          <AlertCircle className="w-3 h-3 flex-shrink-0" style={{ color: '#D97706' }} />
                          <span className="text-xs" style={{ color: '#92400E' }}>
                            Unregistered face at {alert.timestamp}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Card>

          </div>

          {/* Live Recognition Feed */}
          <Card
            className="rounded-2xl overflow-hidden"
            style={{ border: '1px solid #E2E8F0', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
          >
            <div
              className="px-5 py-3.5 flex items-center justify-between"
              style={{ borderBottom: '1px solid #E2E8F0', backgroundColor: '#FFFFFF' }}
            >
              <div>
                <p className="font-semibold text-sm" style={{ color: '#0F172A' }}>
                  Live Recognition Feed
                </p>
                <p className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>
                  Real-time attendance marking as students are detected
                </p>
              </div>
            </div>

            <div className="p-5" style={{ backgroundColor: '#FAFBFF' }}>
              {detectedStudents.length === 0 ? (
                <div className="text-center py-10">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
                    style={{ backgroundColor: '#EEF2FF' }}
                  >
                    <Users className="w-7 h-7" style={{ color: '#A5B4FC' }} />
                  </div>
                  <p className="text-sm font-medium" style={{ color: '#94A3B8' }}>
                    No students detected yet
                  </p>
                  <p className="text-xs mt-1" style={{ color: '#CBD5E1' }}>
                    {isScanning ? 'Scanning for faces…' : 'Start a session to begin'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {detectedStudents.map((student) => {
                    const isMatch = student.status === 'matched';
                    return (
                      <div
                        key={student.id}
                        className="flex items-center justify-between px-4 py-3 rounded-xl transition-all"
                        style={{
                          backgroundColor: isMatch ? '#F0FDF4' : '#FFF7ED',
                          border: `1px solid ${isMatch ? '#BBF7D0' : '#FED7AA'}`,
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm"
                            style={{ backgroundColor: isMatch ? '#059669' : '#F97316' }}
                          >
                            {isMatch ? student.name.charAt(0).toUpperCase() : '?'}
                          </div>
                          <div>
                            <p className="text-sm font-semibold" style={{ color: '#0F172A' }}>
                              {student.name}
                            </p>
                            <p className="text-xs" style={{ color: '#94A3B8' }}>
                              {isMatch ? `Roll: ${student.rollNo}` : 'Not in system'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span
                            className="text-xs font-semibold px-2.5 py-1 rounded-full"
                            style={{
                              backgroundColor: isMatch
                                ? (student.attendanceStatus === 'Late' ? '#FEF3C7' : '#DCFCE7')
                                : '#FEF3C7',
                              color: isMatch
                                ? (student.attendanceStatus === 'Late' ? '#D97706' : '#059669')
                                : '#D97706',
                            }}
                          >
                            {isMatch
                              ? (student.attendanceStatus === 'Late' ? '⏰ Late' : '✓ Present')
                              : '⚠ Unregistered'}
                          </span>
                          <p className="text-xs mt-1" style={{ color: '#CBD5E1' }}>
                            {student.timestamp}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>
        </>
      )}

      {/* ── STUDENTS TAB ── */}
      {activeTab === 'students' && (
        <Card
          className="rounded-2xl overflow-hidden"
          style={{ border: '1px solid #E2E8F0', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
        >
          <div
            className="px-6 py-4"
            style={{ borderBottom: '1px solid #E2E8F0', backgroundColor: '#FFFFFF' }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-sm" style={{ color: '#0F172A' }}>
                  Student Records
                </h3>
                <p className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>
                  {isLoadingStudents
                    ? 'Loading…'
                    : `${filteredStudents.length} of ${allStudents.length} students · ${departmentName}`}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={loadStudents}
                disabled={isLoadingStudents}
                className="flex items-center gap-1.5 text-xs font-semibold rounded-xl"
                style={{ borderColor: '#C7D2FE', color: '#1E3A8A', backgroundColor: '#EEF2FF' }}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh
              </Button>
            </div>

            <div className="relative mb-3">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
                style={{ color: '#94A3B8' }}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Search by name, roll no or section…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-xl outline-none"
                style={{
                  border: '1px solid #E2E8F0',
                  backgroundColor: '#F8FAFF',
                  color: '#0F172A',
                }}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {YEAR_FILTERS.map((yr) => (
                <button
                  key={yr}
                  onClick={() => setSelectedYear(yr)}
                  className="px-3 py-1 rounded-full text-xs font-semibold transition-all"
                  style={
                    selectedYear === yr
                      ? { backgroundColor: '#1E3A8A', color: '#FFFFFF' }
                      : { backgroundColor: '#EEF2FF', color: '#64748B' }
                  }
                >
                  {yr === 'all' ? 'All Years' : yr}
                  {yr !== 'all' && (
                    <span
                      className="ml-1.5 px-1 py-0.5 rounded-full text-[10px] font-bold"
                      style={{
                        backgroundColor: selectedYear === yr ? 'rgba(255,255,255,0.2)' : '#E0E7FF',
                        color: selectedYear === yr ? '#FFFFFF' : '#1E3A8A',
                      }}
                    >
                      {allStudents.filter((s) => getYearFromRollNo(s.rollNo) === yr).length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {isLoadingStudents ? (
            <div className="p-8 text-center">
              <div className="animate-pulse flex flex-col items-center gap-3">
                <div className="w-12 h-12 bg-indigo-100 rounded-full" />
                <div className="h-3 bg-indigo-100 rounded w-40" />
              </div>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-12 text-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: '#EEF2FF' }}
              >
                <Users className="w-8 h-8" style={{ color: '#A5B4FC' }} />
              </div>
              <p className="text-sm font-semibold" style={{ color: '#64748B' }}>
                {allStudents.length === 0
                  ? 'No students found in your department.'
                  : 'No students match the current filters.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: '#F8FAFF', borderBottom: '1px solid #E2E8F0' }}>
                    {['Roll No', 'Name', 'Year', 'Section', 'Phone', ''].map((h) => (
                      <th
                        key={h}
                        className="px-5 py-3 text-left text-xs font-semibold"
                        style={{ color: '#64748B' }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => {
                    const yearLabel = getYearFromRollNo(student.rollNo);
                    const yearColors: Record<string, { bg: string; text: string }> = {
                      '1st Year': { bg: '#F3E8FF', text: '#7C3AED' },
                      '2nd Year': { bg: '#EEF2FF', text: '#4338CA' },
                      '3rd Year': { bg: '#ECFDF5', text: '#059669' },
                      '4th Year': { bg: '#FEF3C7', text: '#D97706' },
                      Alumni: { bg: '#F1F5F9', text: '#64748B' },
                      Unknown: { bg: '#F1F5F9', text: '#94A3B8' },
                    };
                    const yc = yearColors[yearLabel] || yearColors.Unknown;
                    return (
                      <tr
                        key={student.id}
                        className="transition-colors"
                        style={{ borderBottom: '1px solid #F1F5F9' }}
                        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = '#F8FAFF')}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = 'transparent')}
                      >
                        <td className="px-5 py-3 font-bold text-xs" style={{ color: '#1E3A8A' }}>
                          {student.rollNo}
                        </td>
                        <td className="px-5 py-3 font-medium" style={{ color: '#0F172A' }}>
                          {student.name}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                            style={{ backgroundColor: yc.bg, color: yc.text }}
                          >
                            {yearLabel}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-xs" style={{ color: '#64748B' }}>
                          {student.section || '—'}
                        </td>
                        <td className="px-5 py-3 text-xs" style={{ color: '#64748B' }}>
                          {student.phone || '—'}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button
                            onClick={() => handleDeleteClick(student)}
                            className="p-1.5 rounded-lg transition-colors"
                            title="Delete student"
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLElement).style.backgroundColor = '#FEF2F2';
                              (e.currentTarget as HTMLElement).style.color = '#EF4444';
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                              (e.currentTarget as HTMLElement).style.color = '#94A3B8';
                            }}
                            style={{ color: '#94A3B8' }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* ── LOGS TAB ── */}
      {activeTab === 'logs' && (
        <Card
          className="rounded-2xl overflow-hidden"
          style={{ border: '1px solid #E2E8F0', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
        >
          <div
            className="px-5 py-4"
            style={{ borderBottom: '1px solid #E2E8F0', backgroundColor: '#FFFFFF' }}
          >
            <p className="font-semibold text-sm" style={{ color: '#0F172A' }}>
              Session Logs
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>
              History of recognized and unregistered faces from this session
            </p>
          </div>

          <div className="p-5" style={{ backgroundColor: '#FAFBFF' }}>
            {detectedStudents.length === 0 ? (
              <div className="text-center py-10">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
                  style={{ backgroundColor: '#EEF2FF' }}
                >
                  <FileText className="w-7 h-7" style={{ color: '#A5B4FC' }} />
                </div>
                <p className="text-sm font-medium" style={{ color: '#94A3B8' }}>
                  No session logs yet
                </p>
                <p className="text-xs mt-1" style={{ color: '#CBD5E1' }}>
                  Start a recognition session to see logs here
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {detectedStudents.map((student, idx) => {
                  const isMatch = student.status === 'matched';
                  return (
                    <div
                      key={student.id}
                      className="flex items-center gap-4 px-4 py-3 rounded-xl"
                      style={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                      }}
                    >
                      <span className="text-xs font-bold w-5 text-right flex-shrink-0" style={{ color: '#CBD5E1' }}>
                        {idx + 1}
                      </span>
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ backgroundColor: isMatch ? '#059669' : '#F97316' }}
                      >
                        {isMatch ? student.name.charAt(0).toUpperCase() : '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: '#0F172A' }}>
                          {student.name}
                        </p>
                        <p className="text-xs" style={{ color: '#94A3B8' }}>
                          {isMatch ? `Roll: ${student.rollNo}` : 'Unregistered'}
                        </p>
                      </div>
                      <span
                        className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor: isMatch ? '#DCFCE7' : '#FEF3C7',
                          color: isMatch ? '#059669' : '#D97706',
                        }}
                      >
                        {isMatch ? 'Present' : 'Unknown'}
                      </span>
                      <span className="text-xs flex-shrink-0" style={{ color: '#CBD5E1' }}>
                        {student.timestamp}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Delete Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <Trash2 className="w-5 h-5" /> Delete Student
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deletingStudent?.name}</strong> ({deletingStudent?.rollNo})?
              This will also remove all their attendance records. This action <strong>cannot be undone</strong>.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} disabled={deleteLoading}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteLoading}
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              {deleteLoading ? 'Deleting…' : 'Yes, Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
