import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScanFace, Clock, Users, CheckCircle2, XCircle, StopCircle } from 'lucide-react';
import { Progress } from './ui/progress';

const mockPresentStudents = [
  { rollNo: 'CS2021001', name: 'Rahul Sharma', time: '09:05 AM', confidence: 98 },
  { rollNo: 'CS2021032', name: 'Sneha Reddy', time: '09:06 AM', confidence: 97 },
  { rollNo: 'CS2021087', name: 'Vikram Joshi', time: '09:08 AM', confidence: 99 },
  { rollNo: 'EC2021045', name: 'Priya Patel', time: '09:10 AM', confidence: 96 },
  { rollNo: 'EC2021078', name: 'Anjali Verma', time: '09:12 AM', confidence: 98 },
];

const mockAbsentStudents = [
  { rollNo: 'ME2021023', name: 'Amit Kumar' },
  { rollNo: 'EE2021056', name: 'Arjun Singh' },
  { rollNo: 'CE2021012', name: 'Kavya Nair' },
];

export function AttendanceMonitoring() {
  const [sessionTime, setSessionTime] = useState(0);
  const [isSessionActive, setIsSessionActive] = useState(true);

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

  const totalStudents = mockPresentStudents.length + mockAbsentStudents.length;
  const attendancePercentage = (mockPresentStudents.length / totalStudents) * 100;

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
                Computer Science - Year 3 - Data Structures
              </p>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium">{formatTime(sessionTime)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium">
                    {mockPresentStudents.length}/{totalStudents} Present
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
              {attendancePercentage.toFixed(0)}%
            </span>
          </div>
          <Progress value={attendancePercentage} className="h-2" />
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
              <p className="text-sm text-gray-600">Total Students</p>
              <h3 className="text-2xl font-bold" style={{ color: '#1E3A8A' }}>
                {totalStudents}
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
              <p className="text-sm text-gray-600">Present</p>
              <h3 className="text-2xl font-bold" style={{ color: '#10B981' }}>
                {mockPresentStudents.length}
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
              <p className="text-sm text-gray-600">Absent</p>
              <h3 className="text-2xl font-bold" style={{ color: '#EF4444' }}>
                {mockAbsentStudents.length}
              </h3>
            </div>
          </div>
        </Card>
      </div>

      {/* Present and Absent Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Present Students */}
        <Card className="rounded-xl shadow-sm">
          <div
            className="p-4 border-b border-gray-200 flex items-center gap-2"
            style={{ backgroundColor: '#ECFDF5' }}
          >
            <CheckCircle2 className="w-5 h-5" style={{ color: '#10B981' }} />
            <h3 className="font-bold" style={{ color: '#10B981' }}>
              Present Students ({mockPresentStudents.length})
            </h3>
          </div>
          <div className="p-4 max-h-96 overflow-y-auto">
            <div className="space-y-2">
              {mockPresentStudents.map((student) => (
                <div
                  key={student.rollNo}
                  className="p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{student.name}</p>
                      <p className="text-sm text-gray-600">{student.rollNo}</p>
                    </div>
                    <div className="text-right">
                      <Badge
                        className="rounded-full mb-1"
                        style={{ backgroundColor: '#ECFDF5', color: '#10B981' }}
                      >
                        {student.confidence}% Match
                      </Badge>
                      <p className="text-xs text-gray-500">{student.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Absent Students */}
        <Card className="rounded-xl shadow-sm">
          <div
            className="p-4 border-b border-gray-200 flex items-center gap-2"
            style={{ backgroundColor: '#FEF2F2' }}
          >
            <XCircle className="w-5 h-5" style={{ color: '#EF4444' }} />
            <h3 className="font-bold" style={{ color: '#EF4444' }}>
              Absent Students ({mockAbsentStudents.length})
            </h3>
          </div>
          <div className="p-4 max-h-96 overflow-y-auto">
            <div className="space-y-2">
              {mockAbsentStudents.map((student) => (
                <div
                  key={student.rollNo}
                  className="p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{student.name}</p>
                      <p className="text-sm text-gray-600">{student.rollNo}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      style={{ borderColor: '#EF4444', color: '#EF4444' }}
                    >
                      Send Alert
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
