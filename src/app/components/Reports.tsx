import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Calendar, Download, FileText, FileSpreadsheet } from 'lucide-react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getAttendance, AttendanceRecord } from '../api/apiClient';

export function Reports() {
  const [startDate, setStartDate] = useState('2026-02-01');
  const [endDate, setEndDate] = useState('2026-02-28');
  const [selectedDept, setSelectedDept] = useState('all');
  const [loading, setLoading] = useState(true);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const records = await getAttendance(500);
      setAttendanceRecords(records);
      setLoading(false);
    };

    loadData();
  }, []);

  // Calculate daily attendance
  const dailyAttendance = attendanceRecords.reduce(
    (acc, record) => {
      const date = new Date(record.timestamp).getDate().toString().padStart(2, '0');
      const existing = acc.find((d) => d.date === date);
      if (existing) {
        existing.value += 1;
      } else {
        acc.push({ date, value: 1 });
      }
      return acc;
    },
    [] as Array<{ date: string; value: number }>
  );

  const getHeatmapColor = (value: number) => {
    if (value === 0) return '#E5E7EB';
    if (value >= 50) return '#10B981';
    if (value >= 30) return '#34D399';
    if (value >= 10) return '#6EE7B7';
    return '#FCA5A5';
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

  return (
    <div className="space-y-6">
      {/* Filter Section */}
      <Card className="p-6 rounded-xl shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="start-date">Start Date</Label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="end-date">End Date</Label>
            <Input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="department">Department</Label>
            <Select value={selectedDept} onValueChange={setSelectedDept}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Select Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="cs">Computer Science</SelectItem>
                <SelectItem value="ec">Electronics</SelectItem>
                <SelectItem value="me">Mechanical</SelectItem>
                <SelectItem value="ce">Civil</SelectItem>
                <SelectItem value="ee">Electrical</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end gap-2">
            <Button
              className="flex-1 text-white"
              style={{ backgroundColor: '#1E3A8A' }}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Generate
            </Button>
          </div>
        </div>
      </Card>

      {/* Export Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: '#ECFDF5' }}
            >
              <FileSpreadsheet className="w-7 h-7" style={{ color: '#10B981' }} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900">Download Excel Report</h3>
              <p className="text-sm text-gray-600 mt-1">
                Export detailed attendance data in .xlsx format
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              style={{ borderColor: '#10B981', color: '#10B981' }}
            >
              <Download className="w-4 h-4" />
              Excel
            </Button>
          </div>
        </Card>

        <Card className="p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: '#EEF2FF' }}
            >
              <FileText className="w-7 h-7" style={{ color: '#1E3A8A' }} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900">Download CSV Report</h3>
              <p className="text-sm text-gray-600 mt-1">
                Export attendance data in .csv format
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              style={{ borderColor: '#1E3A8A', color: '#1E3A8A' }}
            >
              <Download className="w-4 h-4" />
              CSV
            </Button>
          </div>
        </Card>
      </div>

      {/* Attendance Heatmap Calendar */}
      <Card className="p-6 rounded-xl shadow-sm">
        <h3 className="text-lg font-bold mb-4" style={{ color: '#1E3A8A' }}>
          Daily Attendance Heatmap (Current Month)
        </h3>
        <div className="grid grid-cols-7 gap-2">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
              {day}
            </div>
          ))}
          {dailyAttendance.map((day) => (
            <div
              key={day.date}
              className="aspect-square rounded-lg flex items-center justify-center text-sm font-medium cursor-pointer hover:opacity-80 transition-opacity"
              style={{ backgroundColor: getHeatmapColor(day.value) }}
              title={`${day.value} attendance records`}
            >
              <span className={day.value > 0 ? 'text-white font-bold' : 'text-gray-400'}>
                {day.date}
              </span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center gap-4 mt-6 text-sm">
          <span className="text-gray-600">Low</span>
          <div className="flex gap-1">
            {[
              { color: '#E5E7EB', label: 'No data' },
              { color: '#FCA5A5', label: '1-10' },
              { color: '#6EE7B7', label: '10-30' },
              { color: '#34D399', label: '30-50' },
              { color: '#10B981', label: '50+' },
            ].map((item, index) => (
              <div
                key={index}
                className="w-6 h-6 rounded"
                style={{ backgroundColor: item.color }}
                title={item.label}
              />
            ))}
          </div>
          <span className="text-gray-600">High</span>
        </div>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 rounded-xl shadow-sm">
          <p className="text-sm text-gray-600">Total Attendance Records</p>
          <h3 className="text-3xl font-bold mt-2" style={{ color: '#1E3A8A' }}>
            {attendanceRecords.length}
          </h3>
        </Card>
        <Card className="p-6 rounded-xl shadow-sm">
          <p className="text-sm text-gray-600">Unique Students</p>
          <h3 className="text-3xl font-bold mt-2" style={{ color: '#10B981' }}>
            {new Set(attendanceRecords.map((r) => r.rollNumber)).size}
          </h3>
        </Card>
        <Card className="p-6 rounded-xl shadow-sm">
          <p className="text-sm text-gray-600">Active Days</p>
          <h3 className="text-3xl font-bold mt-2" style={{ color: '#EF4444' }}>
            {dailyAttendance.length}
          </h3>
        </Card>
      </div>
    </div>
  );
}
