import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { ScanFace, Clock, Users, CheckCircle2, StopCircle, RefreshCw } from 'lucide-react';
import { Progress } from './ui/progress';
import { getAttendance, AttendanceRecord, connectWebSocket } from '../api/apiClient';

export function AttendanceMonitoring() {
  const [sessionTime, setSessionTime] = useState(0);
  const [isSessionActive, setIsSessionActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const records = await getAttendance(100);
      setAttendanceRecords(records);
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    const ws = connectWebSocket((data) => {
      if (data.type === 'attendance_marked') {
        getAttendance(100).then(setAttendanceRecords);
      }
    });
    return () => { if (ws) ws.close(); };
  }, []);

  useEffect(() => {
    if (!isSessionActive) return;
    const interval = setInterval(() => {
      setSessionTime((prev) => {
        if (prev + 1 >= 28800) { setIsSessionActive(false); return prev; }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isSessionActive]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleTimeString('en-IN', {
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
      });
    } catch { return timestamp; }
  };

  const totalRecords = attendanceRecords.length;
  const uniqueStudents = new Set(attendanceRecords.map((r) => r.rollNumber)).size;
  const sessionPct = Math.min(100, (sessionTime / 28800) * 100);

  if (loading) {
    return (
      <div className="space-y-5">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-6 rounded-2xl animate-pulse" style={{ border: '1px solid #E2E8F0' }}>
            <div className="h-8 bg-indigo-50 rounded w-1/3 mb-3" />
            <div className="h-4 bg-indigo-50 rounded w-full" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Session Status Card */}
      <Card
        className="rounded-2xl overflow-hidden"
        style={{ border: '1px solid #C7D2FE', boxShadow: '0 4px 20px rgba(30,58,138,0.08)' }}
      >
        <div
          className="px-6 py-5"
          style={{ background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)', borderBottom: '1px solid #C7D2FE' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-md"
                style={{
                  background: isSessionActive
                    ? 'linear-gradient(135deg, #1E3A8A 0%, #1e40af 100%)'
                    : 'linear-gradient(135deg, #64748B 0%, #475569 100%)',
                }}
              >
                <ScanFace className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold" style={{ color: '#0F172A' }}>
                  {isSessionActive ? 'Live Attendance Session' : 'Session Ended'}
                </h2>
                <p className="text-xs mt-0.5" style={{ color: '#64748B' }}>
                  Real-time Attendance Monitoring
                </p>
                <div className="flex items-center gap-4 mt-1.5">
                  <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: '#374151' }}>
                    <Clock className="w-3.5 h-3.5" style={{ color: '#64748B' }} />
                    {formatTime(sessionTime)}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: '#374151' }}>
                    <Users className="w-3.5 h-3.5" style={{ color: '#64748B' }} />
                    {totalRecords} Records
                  </span>
                  {isSessionActive && (
                    <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: '#059669' }}>
                      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: '#10B981' }} />
                      Live
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div>
              {isSessionActive ? (
                <Button
                  onClick={() => setIsSessionActive(false)}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white rounded-xl"
                  style={{ background: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)', boxShadow: '0 4px 12px rgba(220,38,38,0.3)' }}
                >
                  <StopCircle className="w-4 h-4" />
                  End Session
                </Button>
              ) : (
                <Button
                  onClick={() => { setIsSessionActive(true); setSessionTime(0); }}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white rounded-xl"
                  style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #1e40af 100%)', boxShadow: '0 4px 12px rgba(30,58,138,0.3)' }}
                >
                  <ScanFace className="w-4 h-4" />
                  Start New Session
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-3" style={{ backgroundColor: '#FAFBFF' }}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium" style={{ color: '#64748B' }}>
              Session Uptime Limit (8h Max)
            </span>
            <span className="text-xs font-bold" style={{ color: '#1E3A8A' }}>
              {sessionPct.toFixed(1)}%
            </span>
          </div>
          <Progress value={sessionPct} className="h-1.5" />
        </div>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { label: 'Total Records', value: totalRecords, Icon: Users, bg: '#EEF2FF', iconColor: '#1E3A8A', iconBg: '#C7D2FE' },
          { label: 'Unique Students', value: uniqueStudents, Icon: CheckCircle2, bg: '#ECFDF5', iconColor: '#059669', iconBg: '#BBF7D0' },
          { label: 'Session Time', value: formatTime(sessionTime), Icon: Clock, bg: '#FFF7ED', iconColor: '#D97706', iconBg: '#FED7AA' },
        ].map(({ label, value, Icon, bg, iconColor, iconBg }) => (
          <Card
            key={label}
            className="rounded-2xl overflow-hidden transition-all duration-200"
            style={{ border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
          >
            <div className="p-5 flex items-center gap-4" style={{ backgroundColor: bg }}>
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: iconBg }}
              >
                <Icon className="w-5 h-5" style={{ color: iconColor }} />
              </div>
              <div>
                <p className="text-xs font-medium" style={{ color: '#64748B' }}>{label}</p>
                <p className="text-xl font-bold mt-0.5" style={{ color: '#0F172A' }}>{value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Records Table */}
      <Card
        className="rounded-2xl overflow-hidden"
        style={{ border: '1px solid #E2E8F0', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
      >
        <div
          className="px-5 py-4 flex items-center justify-between"
          style={{ borderBottom: '1px solid #E2E8F0', backgroundColor: '#FFFFFF' }}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#EEF2FF' }}>
              <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#1E3A8A' }} />
            </div>
            <span className="font-semibold text-sm" style={{ color: '#0F172A' }}>
              Recent Attendance Records ({totalRecords})
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1.5 text-xs font-semibold rounded-xl"
            style={{ borderColor: '#C7D2FE', color: '#1E3A8A', backgroundColor: '#EEF2FF' }}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Export CSV
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: '#F8FAFF', borderBottom: '1px solid #E2E8F0' }}>
                {['Roll Number', 'Student Name', 'Time', 'Status'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold" style={{ color: '#64748B' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {attendanceRecords.length > 0 ? (
                attendanceRecords.map((record) => (
                  <tr
                    key={record.id}
                    style={{ borderBottom: '1px solid #F1F5F9' }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = '#F8FAFF')}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = 'transparent')}
                  >
                    <td className="px-5 py-3 font-bold text-xs" style={{ color: '#1E3A8A' }}>
                      {record.rollNumber}
                    </td>
                    <td className="px-5 py-3 font-medium text-sm" style={{ color: '#0F172A' }}>
                      {record.studentName}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className="text-xs font-medium px-2 py-1 rounded-lg"
                        style={{ backgroundColor: '#F1F5F9', color: '#64748B' }}
                      >
                        {formatTimestamp(record.timestamp)}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className="text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{ backgroundColor: '#DCFCE7', color: '#059669' }}
                      >
                        ✓ Present
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-5 py-14 text-center">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
                      style={{ backgroundColor: '#EEF2FF' }}
                    >
                      <ScanFace className="w-7 h-7" style={{ color: '#A5B4FC' }} />
                    </div>
                    <p className="text-sm font-medium" style={{ color: '#94A3B8' }}>
                      No attendance records yet.
                    </p>
                    <p className="text-xs mt-1" style={{ color: '#CBD5E1' }}>
                      Start a recognition session to begin recording.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
