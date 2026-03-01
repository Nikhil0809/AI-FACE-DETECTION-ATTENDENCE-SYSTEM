import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScanFace, Clock, Users, CheckCircle2, XCircle, StopCircle } from 'lucide-react';
import { Progress } from './ui/progress';
import { getAttendance, AttendanceRecord, connectWebSocket } from '../api/apiClient';

export function AttendanceMonitoring() {
  const [sessionTime, setSessionTime] = useState(0);
  const [isSessionActive, setIsSessionActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);

  // Load attendance records on mount
  useEffect(() => {
    const loadAttendance = async () => {
      setLoading(true);
      const records = await getAttendance(100);
      setAttendanceRecords(records);
      setLoading(false);
    };

    loadAttendance();
  }, []);

  // Set up WebSocket for real-time updates
  useEffect(() => {
    const ws = connectWebSocket((data) => {
      if (data.type === 'attendance_marked') {
        // Reload attendance records
        getAttendance(100).then(setAttendanceRecords);
      }
    });

    return () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    if (!isSessionActive) return;

    const interval = setInterval(() => {
      setSessionTime((prev) => prev + 1);
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
      const date = new Date(timestamp);
      return date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
    } catch {
      return timestamp;
    }
  };

  if (loading) {
    return (
      <Card className="p-6 rounded-xl shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded w-1/3"></div>
          <div className="h-8 bg-gray-200 rounded w-full"></div>
        </div>
      </Card>
    );
  }

  const totalRecords = attendanceRecords.length;
  const uniqueStudents = new Set(attendanceRecords.map((r) => r.rollNumber)).size;

  return (
    <div className="space-y-6">
      {/* Session Status Card */}
      <Card className="p-6 rounded-xl shadow-sm" style={{ backgroundColor: '#EEF2FF' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ backgroundColor: '#1E3A8A' }}
            >
              <ScanFace className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold" style={{ color: '#1E3A8A' }}>
                {isSessionActive ? 'Live Attendance Session' : 'Session Ended'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Real-time Attendance Monitoring
              </p>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium">{formatTime(sessionTime)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium">
                    {totalRecords} Records
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="text-right">
            {isSessionActive ? (
              <Button
                onClick={() => setIsSessionActive(false)}
                className="flex items-center gap-2 text-white"
                style={{ backgroundColor: '#EF4444' }}
              >
                <StopCircle className="w-4 h-4" />
                End Session
              </Button>
            ) : (
              <Button
                onClick={() => {
                  setIsSessionActive(true);
                  setSessionTime(0);
                }}
                className="flex items-center gap-2 text-white"
                style={{ backgroundColor: '#10B981' }}
              >
                <ScanFace className="w-4 h-4" />
                Start New Session
              </Button>
            )}
            {isSessionActive && (
              <div className="flex items-center gap-2 mt-3">
                <div
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: '#10B981' }}
                ></div>
                <span className="text-sm text-gray-600">Recording...</span>
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Attendance Progress</span>
            <span className="text-sm font-bold" style={{ color: '#1E3A8A' }}>
              {totalRecords > 0 ? '100%' : '0%'}
            </span>
          </div>
          <Progress value={totalRecords > 0 ? 100 : 0} className="h-2" />
        </div>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 rounded-xl shadow-sm">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: '#EEF2FF' }}
            >
              <Users className="w-6 h-6" style={{ color: '#1E3A8A' }} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Records</p>
              <h3 className="text-2xl font-bold" style={{ color: '#1E3A8A' }}>
                {totalRecords}
              </h3>
            </div>
          </div>
        </Card>

        <Card className="p-6 rounded-xl shadow-sm">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: '#ECFDF5' }}
            >
              <CheckCircle2 className="w-6 h-6" style={{ color: '#10B981' }} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Unique Students</p>
              <h3 className="text-2xl font-bold" style={{ color: '#10B981' }}>
                {uniqueStudents}
              </h3>
            </div>
          </div>
        </Card>

        <Card className="p-6 rounded-xl shadow-sm">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: '#FEF2F2' }}
            >
              <XCircle className="w-6 h-6" style={{ color: '#EF4444' }} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Session Time</p>
              <h3 className="text-2xl font-bold" style={{ color: '#EF4444' }}>
                {formatTime(sessionTime)}
              </h3>
            </div>
          </div>
        </Card>
      </div>

      {/* Attendance Records List */}
      <Card className="rounded-xl shadow-sm">
        <div
          className="p-4 border-b border-gray-200 flex items-center gap-2"
          style={{ backgroundColor: '#ECFDF5' }}
        >
          <CheckCircle2 className="w-5 h-5" style={{ color: '#10B981' }} />
          <h3 className="font-bold" style={{ color: '#10B981' }}>
            Recent Attendance Records ({totalRecords})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Roll Number</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Student Name</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Time</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {attendanceRecords.length > 0 ? (
                attendanceRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{record.rollNumber}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{record.studentName}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatTimestamp(record.timestamp)}</td>
                    <td className="px-4 py-3 text-sm">
                      <Badge
                        className="rounded-full"
                        style={{ backgroundColor: '#ECFDF5', color: '#10B981' }}
                      >
                        ✓ Present
                      </Badge>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                    No attendance records yet. Start a session to begin recording attendance.
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
