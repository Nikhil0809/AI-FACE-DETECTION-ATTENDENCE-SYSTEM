import { Card } from './ui/card';
import { Users, UserCheck, UserX, TrendingUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { apiClient } from '../api/apiClient';
import { motion } from 'framer-motion';

interface StudentData {
  id: string;
  name: string;
  rollNumber?: string;
}

interface AttendanceRecord {
  id: string;
  studentId?: string;
  studentName?: string;
  rollNumber?: string;
  timestamp: string;
  status?: string;
}

export function Dashboard() {
  const [students, setStudents] = useState<StudentData[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch real data from backend
  useEffect(() => {
    loadDashboardData();
  }, []);

  // Listen for real-time updates
  useEffect(() => {
    const ws = apiClient.connectWebSocket((data: any) => {
      if (data.type === 'attendance_marked' || data.type === 'student_registered') {
        loadDashboardData();
      }
    });
    return () => {
      if (ws) ws.close();
    };
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const [studentsData, attendanceData] = await Promise.all([
        apiClient.getStudents(),
        apiClient.getAttendance(),
      ]);
      setStudents(studentsData || []);
      setAttendance(attendanceData || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setStudents([]);
      setAttendance([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate today's attendance from real data
  const getTodayAttendance = () => {
    const today = new Date().toDateString();
    const todayRecords = attendance.filter(
      (record) => new Date(record.timestamp).toDateString() === today
    );
    return {
      present: todayRecords.length,
      absent: Math.max(0, students.length - todayRecords.length),
    };
  };

  const { present: todayPresent, absent: todayAbsent } = getTodayAttendance();
  const totalStudents = students.length || 0;
  const attendancePercentage =
    totalStudents > 0 ? ((todayPresent / totalStudents) * 100).toFixed(1) : '0';

  // Calculate attendance distribution for pie chart
  const attendanceDistribution = [
    { name: 'Present', value: todayPresent, color: '#4F8EF7' }, // Primary
    { name: 'Absent', value: todayAbsent, color: '#EF4444' }, // Destructive
  ];

  // Calculate daily attendance for the month
  const getDailyAttendance = () => {
    const dailyMap: { [key: string]: number } = {};
    attendance.forEach((record) => {
      const date = new Date(record.timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
      });
      dailyMap[date] = (dailyMap[date] || 0) + 1;
    });
    return Object.entries(dailyMap).map(([date, count]) => ({
      date,
      attendance: totalStudents > 0 ? ((count / totalStudents) * 100).toFixed(0) : 0,
    }));
  };

  const monthlyData = getDailyAttendance().slice(-30); // Last 30 days

  // Department data (if department info is available in future, calculate from students)
  const departmentData = [];

  const statCards = [
    {
      title: 'Total Students',
      value: isLoading ? '-' : totalStudents.toString(),
      icon: Users,
      bgColor: 'bg-primary/10',
      iconColor: 'text-primary',
    },
    {
      title: 'Today Present',
      value: isLoading ? '-' : todayPresent.toString(),
      icon: UserCheck,
      bgColor: 'bg-accent/20',
      iconColor: 'text-accent-foreground',
    },
    {
      title: 'Today Absent',
      value: isLoading ? '-' : todayAbsent.toString(),
      icon: UserX,
      bgColor: 'bg-destructive/10',
      iconColor: 'text-destructive',
    },
    {
      title: 'Attendance Rate',
      value: isLoading ? '-' : `${attendancePercentage}%`,
      icon: TrendingUp,
      bgColor: 'bg-secondary/50',
      iconColor: 'text-primary',
    },
  ];

  // Get recent attendance records for activity feed
  const getRecentActivity = () => {
    return attendance
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 4)
      .map((record) => ({
        action: `${record.studentName || 'Student'} marked as present`,
        details: `Roll: ${record.rollNumber || 'N/A'}`,
        time: new Date(record.timestamp).toLocaleTimeString(),
      }));
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card
              key={i}
              className="p-6 rounded-xl shadow-sm"
              style={{ backgroundColor: '#f5f5f5' }}
            >
              <div className="h-20 bg-gray-300 rounded animate-pulse"></div>
            </Card>
          ))}
        </div>
        <Card className="p-6 rounded-xl shadow-sm">
          <div className="h-80 bg-gray-300 rounded animate-pulse"></div>
        </Card>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div variants={itemVariants} key={index}>
              <Card className="p-6 rounded-xl shadow-sm border-border/50 hover:shadow-lg hover:border-primary/20 transition-all duration-300 bg-card/60 backdrop-blur-xl group">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">{stat.title}</p>
                    <h3 className="text-3xl font-bold mt-2 text-foreground tracking-tight">
                      {stat.value}
                    </h3>
                  </div>
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110 ${stat.bgColor}`}>
                    <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Distribution */}
        <motion.div variants={itemVariants}>
          <Card className="p-6 rounded-xl shadow-sm border-border/50 bg-card/60 backdrop-blur-xl hover:shadow-md transition-all h-full">
            <h3 className="text-lg font-bold mb-4 text-foreground tracking-tight">
              Today's Attendance
            </h3>
            {totalStudents === 0 ? (
              <div className="h-80 flex items-center justify-center text-muted-foreground">
                No attendance data available
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={attendanceDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      stroke="none"
                    >
                      {attendanceDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Attendance Trend */}
        <motion.div variants={itemVariants}>
          <Card className="p-6 rounded-xl shadow-sm border-border/50 bg-card/60 backdrop-blur-xl hover:shadow-md transition-all h-full">
            <h3 className="text-lg font-bold mb-4 text-foreground tracking-tight">
              Daily Attendance Trend
            </h3>
            {monthlyData.length === 0 ? (
              <div className="h-80 flex items-center justify-center text-muted-foreground">
                No attendance history available
              </div>
            ) : (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="attendance"
                      stroke="#4F8EF7"
                      strokeWidth={3}
                      name="Attendance %"
                      dot={{ fill: '#4F8EF7', strokeWidth: 2, r: 4, stroke: 'white' }}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div variants={itemVariants}>
        <Card className="p-6 rounded-xl shadow-sm border-border/50 bg-card/60 backdrop-blur-xl">
          <h3 className="text-lg font-bold mb-4 text-foreground tracking-tight">
            Recent Activity
          </h3>
          {attendance.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No recent activity. Registrations will appear here.
            </div>
          ) : (
            <div className="space-y-3">
              {getRecentActivity().map((activity, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 p-4 rounded-xl hover:bg-secondary/40 transition-colors border border-transparent hover:border-border/50"
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full mt-1.5 shadow-sm bg-primary"
                  ></div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{activity.action}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{activity.details}</p>
                  </div>
                  <p className="text-xs font-medium text-muted-foreground bg-secondary/50 px-2 py-1 rounded-md">{activity.time}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </motion.div>
    </motion.div>
  );
}
