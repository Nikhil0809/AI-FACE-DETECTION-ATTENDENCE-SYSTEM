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

interface StudentData {
  id: string;
  name: string;
  rollNumber: string;
}

interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName?: string;
  rollNumber?: string;
  timestamp: string;
  status: string;
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
    { name: 'Present', value: todayPresent, color: '#10B981' },
    { name: 'Absent', value: todayAbsent, color: '#EF4444' },
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
      bgColor: '#EEF2FF',
      iconColor: '#1E3A8A',
    },
    {
      title: 'Today Present',
      value: isLoading ? '-' : todayPresent.toString(),
      icon: UserCheck,
      bgColor: '#ECFDF5',
      iconColor: '#10B981',
    },
    {
      title: 'Today Absent',
      value: isLoading ? '-' : todayAbsent.toString(),
      icon: UserX,
      bgColor: '#FEF2F2',
      iconColor: '#EF4444',
    },
    {
      title: 'Attendance Rate',
      value: isLoading ? '-' : `${attendancePercentage}%`,
      icon: TrendingUp,
      bgColor: '#FEF3C7',
      iconColor: '#F59E0B',
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

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">{stat.title}</p>
                  <h3 className="text-3xl font-bold mt-2" style={{ color: '#1E3A8A' }}>
                    {stat.value}
                  </h3>
                </div>
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: stat.bgColor }}
                >
                  <Icon className="w-6 h-6" style={{ color: stat.iconColor }} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Distribution */}
        <Card className="p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-bold mb-4" style={{ color: '#1E3A8A' }}>
            Today's Attendance Distribution
          </h3>
          {totalStudents === 0 ? (
            <div className="h-80 flex items-center justify-center text-gray-600">
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
                  >
                    {attendanceDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Attendance Trend */}
        <Card className="p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-bold mb-4" style={{ color: '#1E3A8A' }}>
            Daily Attendance Trend
          </h3>
          {monthlyData.length === 0 ? (
            <div className="h-80 flex items-center justify-center text-gray-600">
              No attendance history available
            </div>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="attendance"
                    stroke="#1E3A8A"
                    strokeWidth={3}
                    name="Attendance %"
                    dot={{ fill: '#10B981', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="p-6 rounded-xl shadow-sm">
        <h3 className="text-lg font-bold mb-4" style={{ color: '#1E3A8A' }}>
          Recent Activity
        </h3>
        {attendance.length === 0 ? (
          <div className="text-center py-8 text-gray-600">
            No recent activity. Registrations will appear here.
          </div>
        ) : (
          <div className="space-y-3">
            {getRecentActivity().map((activity, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div
                  className="w-2 h-2 rounded-full mt-2"
                  style={{ backgroundColor: '#10B981' }}
                ></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <p className="text-sm text-gray-600">{activity.details}</p>
                </div>
                <p className="text-xs text-gray-500">{activity.time}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
