import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScanFace, Clock, Users, CheckCircle2, XCircle, StopCircle } from 'lucide-react';
import { Progress } from './ui/progress';
import { getAttendance, AttendanceRecord, connectWebSocket } from '../api/apiClient';
import { motion } from 'framer-motion';

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
      setSessionTime((prev) => {
        const newTime = prev + 1;
        // Auto-stop after 8 hours (28800 seconds) to prevent infinite running
        if (newTime >= 28800) {
          setIsSessionActive(false);
          return prev;
        }
        return newTime;
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

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    show: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Session Status Card */}
      <motion.div variants={itemVariants}>
        <Card className="p-6 rounded-xl shadow-sm border-border/50 bg-primary/5 backdrop-blur-md relative overflow-hidden">
          {/* Decorative Blob */}
          <div className="absolute top-[-50%] right-[-10%] w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-5">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center bg-primary text-primary-foreground shadow-lg shadow-primary/20"
              >
                <ScanFace className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground tracking-tight">
                  {isSessionActive ? 'Live Attendance Session' : 'Session Ended'}
                </h2>
                <p className="text-sm text-muted-foreground font-medium mt-1">
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
            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4 mt-4 md:mt-0">
              {isSessionActive ? (
                <Button
                  onClick={() => setIsSessionActive(false)}
                  className="flex items-center gap-2 font-semibold shadow-sm w-full sm:w-auto"
                  variant="destructive"
                  size="lg"
                >
                  <StopCircle className="w-5 h-5" />
                  End Session
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    setIsSessionActive(true);
                    setSessionTime(0);
                  }}
                  className="flex items-center gap-2 font-semibold shadow-sm shadow-primary/20 w-full sm:w-auto"
                  size="lg"
                >
                  <ScanFace className="w-5 h-5" />
                  Start New Session
                </Button>
              )}
              {isSessionActive && (
                <div className="flex items-center gap-2 px-4 py-2 bg-background/50 rounded-lg border border-border/50 backdrop-blur-sm hidden sm:flex">
                  <div className="w-2.5 h-2.5 rounded-full animate-pulse bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                  <span className="text-sm font-medium text-foreground">Recording</span>
                </div>
              )}
            </div>
          </div>
          {isSessionActive && (
            <div className="flex items-center gap-2 mt-3">
              <div
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: '#10B981' }}
              ></div>
              <span className="text-sm text-gray-600">Recording...</span>
            </div>
          )}

          <div className="mt-8 relative z-10 w-full max-w-2xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Session Uptime Limit (8 Hours Max)</span>
              <span className="text-sm font-bold text-primary">
                {Math.min(100, (sessionTime / 28800) * 100).toFixed(1)}%
              </span>
            </div>
            <Progress value={Math.min(100, (sessionTime / 28800) * 100)} className="h-2.5 bg-background border border-border/50" />
          </div>
        </Card>
      </motion.div>

    {/* Stats Row */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div variants={itemVariants}>
          <Card className="p-6 rounded-xl shadow-sm border-border/50 bg-card/60 backdrop-blur-xl hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center bg-primary/10 text-primary"
              >
                <Users className="w-7 h-7" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Records</p>
                <h3 className="text-2xl font-bold text-foreground">
                  {totalRecords}
                </h3>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="p-6 rounded-xl shadow-sm border-border/50 bg-card/60 backdrop-blur-xl hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center bg-accent/20 text-accent-foreground"
              >
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Unique Students</p>
                <h3 className="text-2xl font-bold text-foreground">
                  {uniqueStudents}
                </h3>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="p-6 rounded-xl shadow-sm border-border/50 bg-card/60 backdrop-blur-xl hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center bg-secondary/50 text-secondary-foreground"
              >
                <Clock className="w-7 h-7" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Session Time</p>
                <h3 className="text-2xl font-bold text-foreground tracking-tight">
                  {formatTime(sessionTime)}
                </h3>
              </div>
            </div>
          </Card>
        </motion.div>
      </div >

    {/* Attendance Records List */}
    <motion.div variants={itemVariants}>
      <Card className="rounded-xl shadow-sm border-border/50 bg-card/60 backdrop-blur-xl overflow-hidden">
        <div
          className="p-5 border-b border-border/50 bg-secondary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-foreground">
              Recent Attendance Records ({totalRecords})
            </h3>
          </div>
          <Button variant="outline" size="sm" className="bg-background">Export CSV</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary/10 border-b border-border/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Roll Number</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Student Name</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Time</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {attendanceRecords.length > 0 ? (
                attendanceRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-foreground">{record.rollNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-muted-foreground">{record.studentName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      <span className="bg-background px-2.5 py-1 rounded-md border border-border/50 shadow-sm text-xs font-medium">
                        {formatTimestamp(record.timestamp)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Badge
                        variant="outline"
                        className="rounded-full bg-accent/10 border-accent/20 text-accent-foreground font-semibold px-3 py-1"
                      >
                        ✓ Present
                      </Badge>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                    No attendance records yet. Start a session to begin recording attendance.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
      </motion.div>
    </motion.div>
  );
}
