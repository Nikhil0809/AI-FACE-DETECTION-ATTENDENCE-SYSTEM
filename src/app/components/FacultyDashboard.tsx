import { useState, useEffect } from 'react';
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
  Wifi,
  AlertCircle,
} from 'lucide-react';
import { Progress } from './ui/progress';
import AttendanceCamera, { DetectionResult } from './AttendanceCamera';
import { apiClient } from '../api/apiClient';

interface DetectedStudent {
  id: string;
  rollNo: string;
  name: string;
  confidence: number;
  timestamp: string;
  status: 'matched' | 'unknown';
}

interface StudentData {
  id: number | string;
  name: string;
  rollNo: string;
}

export function FacultyDashboard() {
  const [isScanning, setIsScanning] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [detectedStudents, setDetectedStudents] = useState<DetectedStudent[]>([]);
  const [currentDetection, setCurrentDetection] = useState<string | null>(null);
  const [allStudents, setAllStudents] = useState<StudentData[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);

  // Load students from backend
  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      setIsLoadingStudents(true);
      const students = await apiClient.getStudents();
      setAllStudents(students || []);
    } catch (error) {
      console.error('Error loading students:', error);
      setAllStudents([]);
    } finally {
      setIsLoadingStudents(false);
    }
  };

  // Listen for new student registrations
  useEffect(() => {
    const ws = apiClient.connectWebSocket((data: any) => {
      if (data.type === 'student_registered') {
        loadStudents();
      }
    });
    return () => {
      if (ws) ws.close();
    };
  }, []);

  // Session timer
  useEffect(() => {
    if (!isScanning) return;
    const interval = setInterval(() => {
      setSessionTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isScanning]);


  // When the camera component reports a result, add it to the list
  const handleCameraDetection = (data: DetectionResult) => {
    if (!data.status || data.status === 'no_face' || data.status === 'error') return;

    const isMatched = data.status === 'matched' && !!data.name;
    const displayName = isMatched ? data.name : 'Unregistered Person';

    setCurrentDetection(displayName);

    const newDetection: DetectedStudent = {
      id: data.id ?? `unknown-${Date.now()}`,
      rollNo: data.rollNo ?? data.roll_number ?? '—',
      name: displayName,
      confidence: data.confidence ?? 0,
      timestamp: data.timestamp ?? new Date().toLocaleTimeString(),
      status: isMatched ? 'matched' : 'unknown',
    };

    setDetectedStudents((prev) => {
      // For matched: deduplicate by rollNo; for unknown: always show
      if (isMatched && prev.some((s) => s.rollNo === newDetection.rollNo && s.status === 'matched')) return prev;
      return [newDetection, ...prev.slice(0, 49)]; // cap at 50 entries
    });

    setTimeout(() => setCurrentDetection(null), 1500);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartSession = () => {
    setIsScanning(true);
    setSessionTime(0);
    setDetectedStudents([]);
  };

  const handleStopSession = () => {
    setIsScanning(false);
    setCurrentDetection(null);
  };

  const totalExpected = allStudents.length;
  const matchedCount = detectedStudents.filter(s => s.status === 'matched').length;
  const unknownCount = detectedStudents.filter(s => s.status === 'unknown').length;
  const pendingCount = Math.max(0, totalExpected - matchedCount);
  const attendancePercentage = totalExpected > 0 ? (matchedCount / totalExpected) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Session Control Header */}
      <Card className="p-6 rounded-xl shadow-sm" style={{ backgroundColor: '#EEF2FF' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ backgroundColor: isScanning ? '#10B981' : '#1E3A8A' }}
            >
              {isScanning ? (
                <Camera className="w-8 h-8 text-white animate-pulse" />
              ) : (
                <ScanFace className="w-8 h-8 text-white" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold" style={{ color: '#1E3A8A' }}>
                {isScanning ? 'Live Face Recognition Active' : 'Start Attendance Session'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Data Structures - Year 3 - Computer Science
              </p>
              {isScanning && (
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium">{formatTime(sessionTime)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Wifi className="w-4 h-4" style={{ color: '#10B981' }} />
                    <span className="text-sm font-medium text-gray-600">Connected</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="text-right">
            {!isScanning ? (
              <Button
                onClick={handleStartSession}
                className="flex items-center gap-2 text-white px-6 py-3 text-base"
                style={{ backgroundColor: '#10B981' }}
              >
                <Play className="w-5 h-5" />
                Start Recognition
              </Button>
            ) : (
              <Button
                onClick={handleStopSession}
                className="flex items-center gap-2 text-white px-6 py-3 text-base"
                style={{ backgroundColor: '#EF4444' }}
              >
                <Square className="w-5 h-5" />
                End Session
              </Button>
            )}
          </div>
        </div>

        {isScanning && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Session Progress</span>
              <span className="text-sm font-bold" style={{ color: '#1E3A8A' }}>
                {matchedCount}/{totalExpected} ({attendancePercentage.toFixed(0)}%)
              </span>
            </div>
            <Progress value={attendancePercentage} className="h-2" />
          </div>
        )}
      </Card>

      {/* Live Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Expected */}
        <Card className="p-5 rounded-xl shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#EEF2FF' }}>
              <Users className="w-5 h-5" style={{ color: '#1E3A8A' }} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Expected</p>
              <h3 className="text-2xl font-bold" style={{ color: '#1E3A8A' }}>{totalExpected}</h3>
            </div>
          </div>
        </Card>

        {/* Present (matched) */}
        <Card className="p-5 rounded-xl shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#ECFDF5' }}>
              <CheckCircle2 className="w-5 h-5" style={{ color: '#10B981' }} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Present</p>
              <h3 className="text-2xl font-bold" style={{ color: '#10B981' }}>{matchedCount}</h3>
            </div>
          </div>
        </Card>

        {/* Pending (not yet marked) */}
        <Card className="p-5 rounded-xl shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#FEF2F2' }}>
              <XCircle className="w-5 h-5" style={{ color: '#EF4444' }} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Pending</p>
              <h3 className="text-2xl font-bold" style={{ color: '#EF4444' }}>{pendingCount}</h3>
            </div>
          </div>
        </Card>

        {/* Unregistered */}
        <Card className="p-5 rounded-xl shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#FFF7ED' }}>
              <AlertCircle className="w-5 h-5" style={{ color: '#F97316' }} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Unregistered</p>
              <h3 className="text-2xl font-bold" style={{ color: '#F97316' }}>{unknownCount}</h3>
            </div>
          </div>
        </Card>
      </div>

      {/* Camera Feed and Detection */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Camera Feed Simulation */}
        <Card className="lg:col-span-2 rounded-xl shadow-sm overflow-hidden">
          <div
            className="p-4 border-b border-gray-200 flex items-center justify-between"
            style={{ backgroundColor: '#F9FAFB' }}
          >
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5" style={{ color: '#1E3A8A' }} />
              <h3 className="font-bold" style={{ color: '#1E3A8A' }}>
                Live Camera Feed
              </h3>
            </div>
            {isScanning && (
              <Badge
                className="rounded-full flex items-center gap-1.5"
                style={{ backgroundColor: '#ECFDF5', color: '#10B981' }}
              >
                <div
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: '#10B981' }}
                ></div>
                Recording
              </Badge>
            )}
          </div>

          {/* Camera area — let AttendanceCamera fill the card body */}
          <div className="relative" style={{ minHeight: 420 }}>
            {!isScanning ? (
              <div
                className="flex flex-col items-center justify-center gap-3 text-gray-400"
                style={{ minHeight: 420, backgroundColor: '#1F2937' }}
              >
                <Camera className="w-16 h-16 opacity-40" />
                <p className="text-lg">Camera Standby</p>
                <p className="text-sm opacity-70">Click "Start Recognition" to begin</p>
              </div>
            ) : (
              /* AttendanceCamera handles the video, bounding box, and overlays internally */
              <div className="w-full" style={{ minHeight: 420 }}>
                <AttendanceCamera onDetection={handleCameraDetection} />
              </div>
            )}
          </div>

          {/* Camera Controls */}
          {isScanning && (
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="w-4 h-4" style={{ color: '#10B981' }} />
                  <span>Face Detection Model: v2.1.0</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <AlertCircle className="w-4 h-4" style={{ color: '#F59E0B' }} />
                  <span>Confidence Threshold: 95%</span>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* System Status */}
        <Card className="rounded-xl shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-bold" style={{ color: '#1E3A8A' }}>
              System Status
            </h3>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-700">Camera Status</span>
              <Badge
                className="rounded-full"
                style={
                  isScanning
                    ? { backgroundColor: '#ECFDF5', color: '#10B981' }
                    : { backgroundColor: '#F3F4F6', color: '#6B7280' }
                }
              >
                {isScanning ? 'Active' : 'Standby'}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-700">AI Model</span>
              <Badge
                className="rounded-full"
                style={{ backgroundColor: '#ECFDF5', color: '#10B981' }}
              >
                Loaded
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-700">Network</span>
              <Badge
                className="rounded-full"
                style={{ backgroundColor: '#ECFDF5', color: '#10B981' }}
              >
                Connected
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-700">Geo-Fence</span>
              <Badge
                className="rounded-full"
                style={{ backgroundColor: '#ECFDF5', color: '#10B981' }}
              >
                Verified
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-700">Database Sync</span>
              <Badge
                className="rounded-full"
                style={{ backgroundColor: '#ECFDF5', color: '#10B981' }}
              >
                Synced
              </Badge>
            </div>
          </div>
        </Card>
      </div>

      {/* Live Recognition Feed */}
      <Card className="rounded-xl shadow-sm">
        <div
          className="p-4 border-b border-gray-200 flex items-center justify-between"
          style={{ backgroundColor: '#F9FAFB' }}
        >
          <div>
            <h3 className="font-bold" style={{ color: '#1E3A8A' }}>
              Live Recognition Feed
            </h3>
            <p className="text-sm text-gray-600 mt-0.5">
              Real-time attendance marking as students are detected
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            style={{ borderColor: '#1E3A8A', color: '#1E3A8A' }}
          >
            Export List
          </Button>
        </div>

        <div className="p-4">
          {detectedStudents.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No students detected yet</p>
              <p className="text-xs mt-1">
                {isScanning ? 'Scanning for faces...' : 'Start a session to begin'}
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {detectedStudents.map((student) => {
                const isMatch = student.status === 'matched';
                return (
                  <div
                    key={student.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all animate-in slide-in-from-top duration-300 ${isMatch
                      ? 'bg-emerald-50 border-emerald-200'
                      : 'bg-orange-50 border-orange-200'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm"
                        style={{ backgroundColor: isMatch ? '#10B981' : '#F97316' }}
                      >
                        {isMatch ? student.name.charAt(0).toUpperCase() : '?'}
                      </div>
                      <div>
                        <p className={`font-semibold text-sm ${isMatch ? 'text-gray-900' : 'text-orange-800'}`}>
                          {student.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {isMatch ? `Roll: ${student.rollNo}` : 'Not in system'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge
                        className="rounded-full mb-1 text-xs px-2 py-0.5"
                        style={isMatch
                          ? { backgroundColor: '#ECFDF5', color: '#059669' }
                          : { backgroundColor: '#FFF7ED', color: '#EA580C' }
                        }
                      >
                        {isMatch ? (
                          <><CheckCircle2 className="w-3 h-3 mr-1" />Present</>
                        ) : (
                          <><XCircle className="w-3 h-3 mr-1" />Unregistered</>
                        )}
                      </Badge>
                      <p className="text-xs text-gray-400">{student.timestamp}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
