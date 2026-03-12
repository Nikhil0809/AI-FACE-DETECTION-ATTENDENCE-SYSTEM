import { Card } from './ui/card';
import { Users, UserCheck, UserX, TrendingUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { apiClient } from '../api/apiClient';

const STAT_CARDS = [
  { key: 'total', title: 'Total Students', Icon: Users, bg: '#EEF2FF', iconBg: '#C7D2FE', iconColor: '#1E3A8A', valueColor: '#1E3A8A' },
  { key: 'present', title: 'Today Present', Icon: UserCheck, bg: '#ECFDF5', iconBg: '#BBF7D0', iconColor: '#059669', valueColor: '#059669' },
  { key: 'absent', title: 'Today Absent', Icon: UserX, bg: '#FEF2F2', iconBg: '#FECACA', iconColor: '#DC2626', valueColor: '#DC2626' },
  { key: 'rate', title: 'Attendance Rate', Icon: TrendingUp, bg: '#FFF7ED', iconBg: '#FED7AA', iconColor: '#D97706', valueColor: '#D97706' },
] as const;

export function Dashboard() {
  const [students, setStudents] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { loadDashboardData(); }, []);

  useEffect(() => {
    const ws = apiClient.connectWebSocket((data: any) => {
      if (data.type === 'attendance_marked' || data.type === 'student_registered') loadDashboardData();
    });
    return () => { if (ws) ws.close(); };
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
    } catch { setStudents([]); setAttendance([]); }
    finally { setIsLoading(false); }
  };

  const today = new Date().toDateString();
  const todayRecords = attendance.filter((r) => new Date(r.timestamp).toDateString() === today);
  const todayPresent = todayRecords.length;
  const totalStudents = students.length;
  const todayAbsent = Math.max(0, totalStudents - todayPresent);
  const attendanceRate = totalStudents > 0 ? ((todayPresent / totalStudents) * 100).toFixed(1) : '0';

  const statValues: Record<string, string> = {
    total: isLoading ? '—' : totalStudents.toString(),
    present: isLoading ? '—' : todayPresent.toString(),
    absent: isLoading ? '—' : todayAbsent.toString(),
    rate: isLoading ? '—' : `${attendanceRate}%`,
  };

  const pieData = [
    { name: 'Present', value: todayPresent, color: '#1E3A8A' },
    { name: 'Absent', value: todayAbsent, color: '#EF4444' },
  ];

  const getDailyAttendance = () => {
    const dailyMap: Record<string, number> = {};
    attendance.forEach((r) => {
      const date = new Date(r.timestamp).toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
      dailyMap[date] = (dailyMap[date] || 0) + 1;
    });
    return Object.entries(dailyMap).map(([date, count]) => ({
      date,
      attendance: totalStudents > 0 ? Number(((count / totalStudents) * 100).toFixed(0)) : 0,
    }));
  };

  const monthlyData = getDailyAttendance().slice(-14);

  const recentActivity = attendance
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5)
    .map((r) => ({
      action: `${r.studentName || 'Student'} marked present`,
      details: `Roll: ${r.rollNumber || 'N/A'}`,
      time: new Date(r.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
    }));

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-6 rounded-2xl animate-pulse" style={{ border: '1px solid #E2E8F0' }}>
              <div className="h-5 bg-indigo-50 rounded w-2/3 mb-3" />
              <div className="h-8 bg-indigo-50 rounded w-1/2" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map(({ key, title, Icon, bg, iconBg, iconColor, valueColor }) => (
          <Card
            key={key}
            className="rounded-2xl overflow-hidden transition-all duration-200 group"
            style={{ border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(30,58,138,0.1)')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)')}
          >
            <div className="p-5" style={{ backgroundColor: bg }}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold" style={{ color: '#64748B' }}>{title}</p>
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: iconBg }}
                >
                  <Icon className="w-4.5 h-4.5 w-[18px] h-[18px]" style={{ color: iconColor }} />
                </div>
              </div>
              <p className="text-2xl font-bold" style={{ color: valueColor }}>
                {statValues[key]}
              </p>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Pie Chart */}
        <Card
          className="rounded-2xl overflow-hidden"
          style={{ border: '1px solid #E2E8F0', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
        >
          <div className="px-5 py-4" style={{ borderBottom: '1px solid #E2E8F0', backgroundColor: '#FFFFFF' }}>
            <p className="font-semibold text-sm" style={{ color: '#0F172A' }}>Today's Attendance</p>
          </div>
          <div className="p-5" style={{ backgroundColor: '#FAFBFF' }}>
            {totalStudents === 0 ? (
              <div className="h-56 flex items-center justify-center text-sm" style={{ color: '#94A3B8' }}>
                No attendance data available
              </div>
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={4}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                      stroke="none"
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#fff', borderRadius: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            {totalStudents > 0 && (
              <div className="flex justify-center gap-5 mt-2">
                {pieData.map(({ name, color, value }) => (
                  <div key={name} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                    <span className="text-xs font-medium" style={{ color: '#64748B' }}>
                      {name}: <strong style={{ color: '#0F172A' }}>{value}</strong>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Line Chart */}
        <Card
          className="rounded-2xl overflow-hidden"
          style={{ border: '1px solid #E2E8F0', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
        >
          <div className="px-5 py-4" style={{ borderBottom: '1px solid #E2E8F0', backgroundColor: '#FFFFFF' }}>
            <p className="font-semibold text-sm" style={{ color: '#0F172A' }}>Daily Attendance Trend</p>
          </div>
          <div className="p-5" style={{ backgroundColor: '#FAFBFF' }}>
            {monthlyData.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-sm" style={{ color: '#94A3B8' }}>
                No history available
              </div>
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E8EDFF" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#fff', borderRadius: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="attendance"
                      stroke="#1E3A8A"
                      strokeWidth={2.5}
                      name="Attendance %"
                      dot={{ fill: '#1E3A8A', strokeWidth: 2, r: 3, stroke: '#ffffff' }}
                      activeDot={{ r: 5, strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card
        className="rounded-2xl overflow-hidden"
        style={{ border: '1px solid #E2E8F0', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
      >
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #E2E8F0', backgroundColor: '#FFFFFF' }}>
          <p className="font-semibold text-sm" style={{ color: '#0F172A' }}>Recent Activity</p>
        </div>
        <div className="p-5" style={{ backgroundColor: '#FAFBFF' }}>
          {recentActivity.length === 0 ? (
            <div className="py-10 text-center text-sm" style={{ color: '#94A3B8' }}>
              No recent activity yet.
            </div>
          ) : (
            <div className="space-y-2">
              {recentActivity.map((a, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 px-4 py-3 rounded-xl transition-colors"
                  style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = '#F8FAFF')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = '#FFFFFF')}
                >
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: '#1E3A8A' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate" style={{ color: '#0F172A' }}>{a.action}</p>
                    <p className="text-xs mt-0.5 truncate" style={{ color: '#94A3B8' }}>{a.details}</p>
                  </div>
                  <span
                    className="text-xs font-medium px-2 py-1 rounded-lg flex-shrink-0"
                    style={{ backgroundColor: '#EEF2FF', color: '#1E3A8A' }}
                  >
                    {a.time}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
