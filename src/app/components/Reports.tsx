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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Badge } from './ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getAttendance, AttendanceRecord } from '../api/apiClient';
import { motion } from 'framer-motion';

export function Reports() {
  const [startDate, setStartDate] = useState('2026-02-01');
  const [endDate, setEndDate] = useState('2026-02-28');
  const [selectedDept, setSelectedDept] = useState('all');
  const [loading, setLoading] = useState(true);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<AttendanceRecord[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const records = await getAttendance(500);
      setAttendanceRecords(records);
      setFilteredRecords(records); // Initially show all
      setLoading(false);
    };

    loadData();
  }, []);

  const applyFilters = () => {
    let filtered = attendanceRecords;

    // Date filter
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      filtered = filtered.filter(record => {
        const recordDate = new Date(record.timestamp);
        return recordDate >= start && recordDate <= end;
      });
    }

    // Department filter
    if (selectedDept !== 'all') {
      filtered = filtered.filter(record => record.department === selectedDept);
    }

    setFilteredRecords(filtered);
    setCurrentPage(1); // Reset to first page
  };

  const handleGenerateReport = () => {
    // Validate dates
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      alert('Start date cannot be after end date');
      return;
    }
    applyFilters();
  };

  const handleExportExcel = () => {
    // For now, export as CSV (Excel can open CSV)
    const csvContent = [
      ['Student Name', 'Roll Number', 'Department', 'Section', 'Timestamp'],
      ...filteredRecords.map(record => [
        record.studentName,
        record.rollNumber,
        record.department || '',
        record.section || '',
        record.timestamp
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'attendance_report.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleExportCsv = () => {
    handleExportExcel(); // Same as Excel for now
  };

  // Calculate daily attendance
  const dailyAttendance = filteredRecords.reduce(
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
    if (value === 0) return 'var(--muted)';
    if (value >= 50) return 'var(--primary)';
    if (value >= 30) return '#7CE2FF'; // Accent
    if (value >= 10) return 'var(--secondary)';
    return '#FCA5A5';
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredRecords.slice(indexOfFirstRecord, indexOfLastRecord);

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

  if (loading) {
    return (
      <Card className="p-6 rounded-xl shadow-sm border-border/50 bg-card/60 backdrop-blur-xl">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-muted rounded w-1/3"></div>
          <div className="h-8 bg-muted rounded w-full"></div>
        </div>
      </Card>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Filter Section */}
      <motion.div variants={itemVariants}>
        <Card className="p-6 rounded-xl shadow-sm border-border/50 bg-card/60 backdrop-blur-xl">
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
                  {/* Core Engineering Departments */}
                  <SelectItem value="Computer Science and Engineering">CSE (Core)</SelectItem>
                  <SelectItem value="Electronics and Communication Engineering">ECE</SelectItem>
                  <SelectItem value="Electrical and Electronics Engineering">EEE</SelectItem>
                  <SelectItem value="Mechanical Engineering">ME</SelectItem>
                  <SelectItem value="Civil Engineering">CE</SelectItem>
                  <SelectItem value="Information Technology">IT</SelectItem>
                  {/* New / Specialized Technology Departments */}
                  <SelectItem value="Artificial Intelligence & Data Science">AI & Data Science</SelectItem>
                  <SelectItem value="CSE-AI">CSE - Artificial Intelligence (Special)</SelectItem>
                  <SelectItem value="CSE-DS">CSE - Data Science (Special)</SelectItem>
                  <SelectItem value="CSE-CS">CSE - Cyber Security (Special)</SelectItem>
                  <SelectItem value="Electronics and Computer Engineering">ECM</SelectItem>
                  {/* Other Academic Departments */}
                  <SelectItem value="Engineering & Applied Sciences">Eng. & Applied Sciences</SelectItem>
                  {/* Postgraduate Departments */}
                  <SelectItem value="Master of Business Administration">MBA</SelectItem>
                  <SelectItem value="Master of Computer Applications">MCA</SelectItem>
                  <SelectItem value="M.Tech - Computer Science">M.Tech - CSE</SelectItem>
                  <SelectItem value="M.Tech - Electronics">M.Tech - Electronics</SelectItem>
                  <SelectItem value="M.Tech - AI & Machine Learning">M.Tech - AI & ML</SelectItem>
                  <SelectItem value="M.Tech - Information Technology">M.Tech - IT</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button
                className="flex-1 shadow-sm font-semibold"
                onClick={handleGenerateReport}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Generate
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Export Options */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer border-border/50 bg-card/60 backdrop-blur-xl group">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-lg flex items-center justify-center bg-primary/10 group-hover:bg-primary/20 transition-colors"
            >
              <FileSpreadsheet className="w-7 h-7 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-foreground">Download Excel Report</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Export detailed attendance data in .xlsx format
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2 bg-background/50 hover:bg-primary hover:text-primary-foreground transition-colors"
              onClick={handleExportExcel}
            >
              <Download className="w-4 h-4" />
              Excel
            </Button>
          </div>
        </Card>

        <Card className="p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer border-border/50 bg-card/60 backdrop-blur-xl group">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-lg flex items-center justify-center bg-accent/10 group-hover:bg-accent/20 transition-colors"
            >
              <FileText className="w-7 h-7 text-accent-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-foreground">Download CSV Report</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Export attendance data in .csv format
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2 bg-background/50 hover:bg-accent hover:text-accent-foreground transition-colors"
              onClick={handleExportCsv}
            >
              <Download className="w-4 h-4" />
              CSV
            </Button>
          </div>
        </Card>
      </motion.div>

      {/* Attendance Heatmap Calendar */}
      <motion.div variants={itemVariants}>
        <Card className="p-6 rounded-xl shadow-sm border-border/50 bg-card/60 backdrop-blur-xl">
          <h3 className="text-lg font-bold mb-4 text-foreground tracking-tight">
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
            <span className="text-muted-foreground">Low</span>
            <div className="flex gap-1">
              {[
                { color: 'var(--muted)', label: 'No data' },
                { color: '#FCA5A5', label: '1-10' },
                { color: 'var(--secondary)', label: '10-30' },
                { color: '#7CE2FF', label: '30-50' },
                { color: 'var(--primary)', label: '50+' },
              ].map((item, index) => (
                <div
                  key={index}
                  className="w-6 h-6 rounded"
                  style={{ backgroundColor: item.color }}
                  title={item.label}
                />
              ))}
            </div>
            <span className="text-muted-foreground">High</span>
          </div>
        </Card>
      </motion.div>

      {/* Summary Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 rounded-xl shadow-sm border-border/50 bg-card/60 backdrop-blur-xl hover:-translate-y-1 transition-transform">
          <p className="text-sm text-muted-foreground">Total Attendance Records</p>
          <h3 className="text-3xl font-bold mt-2 text-primary">
            {filteredRecords.length}
          </h3>
        </Card>
        <Card className="p-6 rounded-xl shadow-sm border-border/50 bg-card/60 backdrop-blur-xl hover:-translate-y-1 transition-transform">
          <p className="text-sm text-muted-foreground">Unique Students</p>
          <h3 className="text-3xl font-bold mt-2 text-accent-foreground">
            {new Set(filteredRecords.map((r) => r.rollNumber)).size}
          </h3>
        </Card>
        <Card className="p-6 rounded-xl shadow-sm border-border/50 bg-card/60 backdrop-blur-xl hover:-translate-y-1 transition-transform">
          <p className="text-sm text-muted-foreground">Active Days</p>
          <h3 className="text-3xl font-bold mt-2 text-destructive">
            {dailyAttendance.length}
          </h3>
        </Card>
      </motion.div>

      {/* Detailed Attendance Table */}
      <motion.div variants={itemVariants}>
        <Card className="rounded-xl shadow-sm overflow-hidden border-border/50 bg-card/60 backdrop-blur-xl">
          <div className="p-6 border-b border-border/50 bg-secondary/10 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <h3 className="text-lg font-bold text-foreground">Attendance History</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Showing {indexOfFirstRecord + 1}-{Math.min(indexOfLastRecord, filteredRecords.length)} of {filteredRecords.length} records
              </p>
            </div>
            {/* Pagination Controls */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="bg-background/50 shadow-sm"
              >
                Previous
              </Button>
              <span className="text-sm font-medium px-2 text-muted-foreground">
                Page {currentPage} of {totalPages || 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="bg-background/50 shadow-sm"
              >
                Next
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-secondary/20">
                <TableRow className="border-border/50">
                  <TableHead className="font-semibold text-muted-foreground">Date & Time</TableHead>
                  <TableHead className="font-semibold text-muted-foreground">Student Name</TableHead>
                  <TableHead className="font-semibold text-muted-foreground">Roll No</TableHead>
                  <TableHead className="font-semibold text-muted-foreground">Department</TableHead>
                  <TableHead className="font-semibold text-muted-foreground">Section</TableHead>
                  <TableHead className="font-semibold text-muted-foreground">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border/30">
                {currentRecords.map((record) => (
                  <TableRow key={record.id || record.timestamp + record.rollNumber} className="hover:bg-secondary/20 transition-colors">
                    <TableCell className="font-medium text-foreground">
                      {new Date(record.timestamp).toLocaleString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{record.studentName}</TableCell>
                    <TableCell className="text-muted-foreground font-semibold">{record.rollNumber}</TableCell>
                    <TableCell className="text-muted-foreground">{record.department || 'N/A'}</TableCell>
                    <TableCell className="text-muted-foreground">{record.section || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
                        Present
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {currentRecords.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No attendance records found for the selected filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}
