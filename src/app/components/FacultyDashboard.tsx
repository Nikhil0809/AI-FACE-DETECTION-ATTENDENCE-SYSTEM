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
  TrendingUp,
} from 'lucide-react';
import { Progress } from './ui/progress';

interface DetectedStudent {
  id: string;
  rollNo: string;
  name: string;
  confidence: number;
  timestamp: string;
  image?: string;
}

const studentPool = [
  { rollNo: 'CS2021001', name: 'Rahul Sharma' },
  { rollNo: 'CS2021032', name: 'Sneha Reddy' },
  { rollNo: 'CS2021087', name: 'Vikram Joshi' },
  { rollNo: 'EC2021045', name: 'Priya Patel' },
  { rollNo: 'EC2021078', name: 'Anjali Verma' },
  { rollNo: 'ME2021023', name: 'Amit Kumar' },
  { rollNo: 'EE2021056', name: 'Arjun Singh' },
  { rollNo: 'CE2021012', name: 'Kavya Nair' },
  { rollNo: 'CS2021045', name: 'Ravi Shankar' },
  { rollNo: 'EC2021089', name: 'Deepika Rao' },
];

export function FacultyDashboard() {
  const [isScanning, setIsScanning] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [detectedStudents, setDetectedStudents] = useState<DetectedStudent[]>([]);
  const [currentDetection, setCurrentDetection] = useState<string | null>(null);
  const [scanningAnimation, setScanningAnimation] = useState(0);

  // Session timer
  useEffect(() => {
    if (!isScanning) return;
    const interval = setInterval(() => {
      setSessionTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isScanning]);

  // Scanning animation
  useEffect(() => {
    if (!isScanning) return;
    const interval = setInterval(() => {
      setScanningAnimation((prev) => (prev + 1) % 100);
    }, 50);
    return () => clearInterval(interval);
  }, [isScanning]);

  // Simulate face detection
  useEffect(() => {
    if (!isScanning) return;

    const detectFace = () => {
      // Randomly detect a student
      if (Math.random() > 0.7) {
        const availableStudents = studentPool.filter(
          (student) => !detectedStudents.find((d) => d.rollNo === student.rollNo)
        );

        if (availableStudents.length > 0) {
          const randomStudent =
            availableStudents[Math.floor(Math.random() * availableStudents.length)];
          const confidence = 92 + Math.floor(Math.random() * 7);

          setCurrentDetection(randomStudent.name);

          setTimeout(() => {
            const newDetection: DetectedStudent = {
              id: Math.random().toString(),
              rollNo: randomStudent.rollNo,
              name: randomStudent.name,
              confidence,
              timestamp: new Date().toLocaleTimeString(),
            };

            setDetectedStudents((prev) => [newDetection, ...prev]);
            setCurrentDetection(null);
          }, 1500);
        }
      }
    };

    const interval = setInterval(detectFace, 3000);
    return () => clearInterval(interval);
  }, [isScanning, detectedStudents]);

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

  const totalExpected = studentPool.length;
  const attendancePercentage = (detectedStudents.length / totalExpected) * 100;

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
                {detectedStudents.length}/{totalExpected} ({attendancePercentage.toFixed(0)}%)
              </span>
            </div>
            <Progress value={attendancePercentage} className="h-2" />
          </div>
        )}
      </Card>

      {/* Live Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 rounded-xl shadow-sm">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: '#EEF2FF' }}
            >
              <Users className="w-6 h-6" style={{ color: '#1E3A8A' }} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Expected</p>
              <h3 className="text-2xl font-bold" style={{ color: '#1E3A8A' }}>
                {totalExpected}
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
              <p className="text-sm text-gray-600">Detected</p>
              <h3 className="text-2xl font-bold" style={{ color: '#10B981' }}>
                {detectedStudents.length}
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
              <p className="text-sm text-gray-600">Pending</p>
              <h3 className="text-2xl font-bold" style={{ color: '#EF4444' }}>
                {totalExpected - detectedStudents.length}
              </h3>
            </div>
          </div>
        </Card>

        <Card className="p-6 rounded-xl shadow-sm">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: '#FEF3C7' }}
            >
              <TrendingUp className="w-6 h-6" style={{ color: '#F59E0B' }} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg Confidence</p>
              <h3 className="text-2xl font-bold" style={{ color: '#F59E0B' }}>
                {detectedStudents.length > 0
                  ? (
                      detectedStudents.reduce((sum, s) => sum + s.confidence, 0) /
                      detectedStudents.length
                    ).toFixed(1)
                  : 0}
                %
              </h3>
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

          <div
            className="relative aspect-video flex items-center justify-center"
            style={{ backgroundColor: '#1F2937' }}
          >
            {!isScanning ? (
              <div className="text-center text-gray-400">
                <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Camera Standby</p>
                <p className="text-sm mt-2">Click "Start Recognition" to begin</p>
              </div>
            ) : (
              <div className="relative w-full h-full">
                {/* Simulated camera background */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 to-gray-900/60"></div>

                {/* Scanning grid overlay */}
                <div className="absolute inset-0 opacity-30">
                  <div className="grid grid-cols-8 grid-rows-6 h-full w-full">
                    {Array.from({ length: 48 }).map((_, i) => (
                      <div key={i} className="border border-blue-400/20"></div>
                    ))}
                  </div>
                </div>

                {/* Scanning line animation */}
                <div
                  className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent transition-all duration-100"
                  style={{ top: `${scanningAnimation}%` }}
                ></div>

                {/* Detection frame */}
                {currentDetection && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div
                      className="relative w-64 h-80 border-4 rounded-lg animate-pulse"
                      style={{ borderColor: '#10B981' }}
                    >
                      <div
                        className="absolute -top-8 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-lg font-bold text-white whitespace-nowrap"
                        style={{ backgroundColor: '#10B981' }}
                      >
                        Detecting: {currentDetection}
                      </div>
                      {/* Corner markers */}
                      <div
                        className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4"
                        style={{ borderColor: '#10B981' }}
                      ></div>
                      <div
                        className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4"
                        style={{ borderColor: '#10B981' }}
                      ></div>
                      <div
                        className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4"
                        style={{ borderColor: '#10B981' }}
                      ></div>
                      <div
                        className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4"
                        style={{ borderColor: '#10B981' }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Status overlay */}
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white bg-black/60 px-3 py-2 rounded-lg backdrop-blur-sm">
                    <ScanFace className="w-4 h-4" />
                    <span className="text-sm font-medium">AI Face Detection Active</span>
                  </div>
                  <div className="flex items-center gap-2 text-white bg-black/60 px-3 py-2 rounded-lg backdrop-blur-sm">
                    <div
                      className="w-2 h-2 rounded-full animate-pulse"
                      style={{ backgroundColor: '#10B981' }}
                    ></div>
                    <span className="text-sm font-medium">Scanning...</span>
                  </div>
                </div>
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
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {detectedStudents.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all animate-in slide-in-from-top duration-300"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: '#10B981' }}
                    >
                      {student.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{student.name}</p>
                      <p className="text-sm text-gray-600">{student.rollNo}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge
                      className="rounded-full mb-1"
                      style={{ backgroundColor: '#ECFDF5', color: '#10B981' }}
                    >
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      {student.confidence}% Match
                    </Badge>
                    <p className="text-xs text-gray-500">{student.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
