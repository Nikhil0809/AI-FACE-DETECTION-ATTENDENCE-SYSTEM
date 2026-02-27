import { Card } from './ui/card';
import { Users, UserCheck, UserX, TrendingUp } from 'lucide-react';
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

const departmentData = [
  { name: 'Computer Science', present: 145, absent: 12 },
  { name: 'Electronics', present: 98, absent: 8 },
  { name: 'Mechanical', present: 112, absent: 15 },
  { name: 'Civil', present: 87, absent: 6 },
  { name: 'Electrical', present: 102, absent: 9 },
];

const monthlyData = [
  { month: 'Jan', attendance: 92 },
  { month: 'Feb', attendance: 89 },
  { month: 'Mar', attendance: 94 },
  { month: 'Apr', attendance: 91 },
  { month: 'May', attendance: 93 },
  { month: 'Jun', attendance: 95 },
];

const attendanceDistribution = [
  { name: 'Present', value: 544, color: '#10B981' },
  { name: 'Absent', value: 50, color: '#EF4444' },
];

export function Dashboard() {
  const totalStudents = 594;
  const todayPresent = 544;
  const todayAbsent = 50;
  const attendancePercentage = ((todayPresent / totalStudents) * 100).toFixed(1);

  const statCards = [
    {
      title: 'Total Students',
      value: totalStudents.toString(),
      icon: Users,
      bgColor: '#EEF2FF',
      iconColor: '#1E3A8A',
    },
    {
      title: 'Today Present',
      value: todayPresent.toString(),
      icon: UserCheck,
      bgColor: '#ECFDF5',
      iconColor: '#10B981',
    },
    {
      title: 'Today Absent',
      value: todayAbsent.toString(),
      icon: UserX,
      bgColor: '#FEF2F2',
      iconColor: '#EF4444',
    },
    {
      title: 'Attendance Rate',
      value: `${attendancePercentage}%`,
      icon: TrendingUp,
      bgColor: '#FEF3C7',
      iconColor: '#F59E0B',
    },
  ];

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
        </Card>

        {/* Department Comparison */}
        <Card className="p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-bold mb-4" style={{ color: '#1E3A8A' }}>
            Department-wise Attendance
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="present" fill="#10B981" name="Present" radius={[8, 8, 0, 0]} />
                <Bar dataKey="absent" fill="#EF4444" name="Absent" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Monthly Trend */}
      <Card className="p-6 rounded-xl shadow-sm">
        <h3 className="text-lg font-bold mb-4" style={{ color: '#1E3A8A' }}>
          Monthly Attendance Trend (%)
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" />
              <YAxis domain={[85, 100]} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="attendance"
                stroke="#1E3A8A"
                strokeWidth={3}
                name="Attendance %"
                dot={{ fill: '#10B981', r: 6 }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Recent Activity */}
      <Card className="p-6 rounded-xl shadow-sm">
        <h3 className="text-lg font-bold mb-4" style={{ color: '#1E3A8A' }}>
          Recent Activity
        </h3>
        <div className="space-y-3">
          {[
            {
              action: 'Attendance session started',
              dept: 'Computer Science - Year 3',
              time: '10 minutes ago',
            },
            {
              action: 'CSV upload completed',
              dept: '45 new students added',
              time: '1 hour ago',
            },
            {
              action: 'SMS notifications sent',
              dept: '50 absence alerts sent to parents',
              time: '2 hours ago',
            },
            {
              action: 'Report generated',
              dept: 'Monthly attendance report - Electronics',
              time: '3 hours ago',
            },
          ].map((activity, index) => (
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
                <p className="text-sm text-gray-600">{activity.dept}</p>
              </div>
              <p className="text-xs text-gray-500">{activity.time}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
