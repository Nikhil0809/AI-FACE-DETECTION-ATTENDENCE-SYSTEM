import { useState } from 'react';
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

const subjectWiseData = [
  { subject: 'Data Structures', attendance: 94 },
  { subject: 'Algorithms', attendance: 91 },
  { subject: 'Database Systems', attendance: 88 },
  { subject: 'Operating Systems', attendance: 92 },
  { subject: 'Computer Networks', attendance: 89 },
  { subject: 'Software Engineering', attendance: 93 },
];

const attendanceHeatmap = [
  { date: '01', value: 92 },
  { date: '02', value: 88 },
  { date: '03', value: 95 },
  { date: '04', value: 91 },
  { date: '05', value: 89 },
  { date: '06', value: 0 }, // Sunday
  { date: '07', value: 0 }, // Sunday
  { date: '08', value: 94 },
  { date: '09', value: 90 },
  { date: '10', value: 93 },
  { date: '11', value: 87 },
  { date: '12', value: 91 },
  { date: '13', value: 0 },
  { date: '14', value: 0 },
  { date: '15', value: 96 },
  { date: '16', value: 89 },
  { date: '17', value: 92 },
  { date: '18', value: 88 },
  { date: '19', value: 94 },
  { date: '20', value: 0 },
  { date: '21', value: 0 },
  { date: '22', value: 91 },
  { date: '23', value: 93 },
  { date: '24', value: 90 },
  { date: '25', value: 95 },
  { date: '26', value: 89 },
  { date: '27', value: 92 },
  { date: '28', value: 0 },
];

export function Reports() {
  const [startDate, setStartDate] = useState('2026-02-01');
  const [endDate, setEndDate] = useState('2026-02-28');
  const [selectedDept, setSelectedDept] = useState('all');

  const getHeatmapColor = (value: number) => {
    if (value === 0) return '#E5E7EB';
    if (value >= 95) return '#10B981';
    if (value >= 90) return '#34D399';
    if (value >= 85) return '#6EE7B7';
    return '#FCA5A5';
  };

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
          February 2026 - Attendance Heatmap
        </h3>
        <div className="grid grid-cols-7 gap-2">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
              {day}
            </div>
          ))}
          {attendanceHeatmap.map((day) => (
            <div
              key={day.date}
              className="aspect-square rounded-lg flex items-center justify-center text-sm font-medium cursor-pointer hover:opacity-80 transition-opacity"
              style={{ backgroundColor: getHeatmapColor(day.value) }}
              title={day.value > 0 ? `${day.value}% attendance` : 'No class'}
            >
              <span className={day.value > 0 ? 'text-white' : 'text-gray-400'}>
                {day.date}
              </span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center gap-4 mt-6 text-sm">
          <span className="text-gray-600">Less</span>
          <div className="flex gap-1">
            {[
              { color: '#E5E7EB', label: 'No class' },
              { color: '#FCA5A5', label: '<85%' },
              { color: '#6EE7B7', label: '85-90%' },
              { color: '#34D399', label: '90-95%' },
              { color: '#10B981', label: '95%+' },
            ].map((item, index) => (
              <div
                key={index}
                className="w-6 h-6 rounded"
                style={{ backgroundColor: item.color }}
                title={item.label}
              />
            ))}
          </div>
          <span className="text-gray-600">More</span>
        </div>
      </Card>

      {/* Subject-wise Breakdown */}
      <Card className="p-6 rounded-xl shadow-sm">
        <h3 className="text-lg font-bold mb-4" style={{ color: '#1E3A8A' }}>
          Subject-wise Attendance Breakdown
        </h3>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={subjectWiseData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis type="number" domain={[0, 100]} />
              <YAxis dataKey="subject" type="category" width={150} />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="attendance"
                fill="#1E3A8A"
                name="Attendance %"
                radius={[0, 8, 8, 0]}
                label={{ position: 'right', fill: '#1E3A8A', fontWeight: 'bold' }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 rounded-xl shadow-sm">
          <p className="text-sm text-gray-600">Average Attendance</p>
          <h3 className="text-3xl font-bold mt-2" style={{ color: '#1E3A8A' }}>
            91.2%
          </h3>
        </Card>
        <Card className="p-6 rounded-xl shadow-sm">
          <p className="text-sm text-gray-600">Total Classes</p>
          <h3 className="text-3xl font-bold mt-2" style={{ color: '#1E3A8A' }}>
            124
          </h3>
        </Card>
        <Card className="p-6 rounded-xl shadow-sm">
          <p className="text-sm text-gray-600">Best Performing Subject</p>
          <h3 className="text-lg font-bold mt-2" style={{ color: '#10B981' }}>
            Data Structures
          </h3>
        </Card>
        <Card className="p-6 rounded-xl shadow-sm">
          <p className="text-sm text-gray-600">Needs Attention</p>
          <h3 className="text-lg font-bold mt-2" style={{ color: '#EF4444' }}>
            Database Systems
          </h3>
        </Card>
      </div>
    </div>
  );
}
