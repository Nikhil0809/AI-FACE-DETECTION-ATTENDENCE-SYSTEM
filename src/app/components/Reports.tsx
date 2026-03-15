import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Calendar, Download, FileText, FileSpreadsheet, RefreshCw } from 'lucide-react';
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
import { getAttendance, AttendanceRecord, getStudents, Student, sendSms } from '../api/apiClient';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, CheckCircle2, AlertCircle } from 'lucide-react';

export function Reports() {
  const [startDate, setStartDate] = useState('2026-02-01');
  const [endDate, setEndDate] = useState('2026-02-28');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'present' | 'absent'>('all');
  const [loading, setLoading] = useState(true);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<any[]>([]);
  const [sendingSms, setSendingSms] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [records, students] = await Promise.all([
          getAttendance(1000),
          getStudents()
        ]);
        setAttendanceRecords(records);
        setAllStudents(students);
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Recalculate filtered records whenever deps change
  useEffect(() => {
    applyFilters();
  }, [attendanceRecords, allStudents, startDate, endDate, selectedDept, selectedStatus]);

  const applyFilters = () => {
    // 1. Filter students by department first
    let students = allStudents;
    if (selectedDept !== 'all') {
      students = students.filter(s => s.branch === selectedDept || s.department === selectedDept);
    }

    // 2. Identify who is present
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59);

    const filteredAttendance = attendanceRecords.filter(record => {
      const d = new Date(record.timestamp);
      return d >= start && d <= end;
    });

    const presentRolls = new Set(filteredAttendance.map(r => r.rollNumber));

    // 3. Build the combined list
    const combined: any[] = [];

    // Add present records
    filteredAttendance.forEach(record => {
      if (selectedStatus === 'absent') return;
      combined.push({
        ...record,
        status: 'Present',
        studentName: record.studentName,
        rollNumber: record.rollNumber,
        phone: allStudents.find(s => s.rollNo === record.rollNumber)?.phone || ''
      });
    });

    // Add absent students (only if we're looking at a single day or want a general list)
    // For simplicity, we'll show students who have 0 records in the range as 'Absent'
    if (selectedStatus !== 'present') {
      students.forEach(student => {
        if (!presentRolls.has(student.rollNo)) {
          combined.push({
            id: `absent-${student.id}`,
            studentName: student.name,
            rollNumber: student.rollNo,
            department: student.branch || student.department,
            section: student.section,
            timestamp: 'N/A',
            status: 'Absent',
            phone: student.phone || ''
          });
        }
      });
    }

    // Apply department filter again just in case (for attendance records that might not have student info linked)
    let final = combined;
    if (selectedDept !== 'all') {
      final = final.filter(r => r.department === selectedDept || r.branch === selectedDept);
    }

    setFilteredRecords(final);
    setCurrentPage(1);
  };

  const handleSendSms = async (student: any) => {
    if (!student.phone) {
      alert('Phone number not available for this student');
      return;
    }
    setSendingSms(student.rollNumber);
    try {
      const res = await sendSms(student.phone, student.studentName, student.rollNumber);
      if (res.status === 'success') {
        alert(`SMS sent successfully to ${student.studentName}'s parent`);
      } else {
        alert('Failed to send SMS: ' + res.message);
      }
    } catch (err) {
      alert('An error occurred while sending SMS');
    } finally {
      setSendingSms(null);
    }
  };

  const handleGenerateReport = () => {
    // Validate dates
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      alert('Start date cannot be after end date');
      return;
    }
    applyFilters();
  };

  const handleExportCsv = () => {
    const csvContent = [
      ['Student Name', 'Roll Number', 'Department', 'Section', 'Status', 'Date & Time'],
      ...filteredRecords.map(record => [
        record.studentName,
        record.rollNumber,
        record.department || '',
        record.section || '',
        record.status || 'Present',
        record.timestamp === 'N/A' ? 'Absent' : new Date(record.timestamp).toLocaleString(),
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${startDate}_to_${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportExcel = handleExportCsv; // CSV is openable in Excel

  const handleExportPdf = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const rows = filteredRecords.map((r, i) => `
      <tr style="background:${i%2===0?'#fff':'#f8faff'}">
        <td>${r.timestamp !== 'N/A' ? new Date(r.timestamp).toLocaleString() : '—'}</td>
        <td>${r.studentName}</td>
        <td>${r.rollNumber}</td>
        <td>${r.department || ''}</td>
        <td style="color:${r.status==='Present'?'#059669':'#DC2626'};font-weight:600">${r.status}</td>
      </tr>`).join('');
    printWindow.document.write(`
      <html><head><title>Attendance Report</title>
      <style>body{font-family:Arial,sans-serif;padding:20px}h2{color:#1E3A8A}table{width:100%;border-collapse:collapse;font-size:12px}th{background:#1E3A8A;color:#fff;padding:8px;text-align:left}td{padding:7px 8px;border-bottom:1px solid #eee}</style>
      </head><body>
      <h2>Attendance Report</h2>
      <p style="color:#64748B;font-size:12px">${startDate} to ${endDate} · ${filteredRecords.length} records</p>
      <table><thead><tr><th>Date &amp; Time</th><th>Student Name</th><th>Roll No</th><th>Department</th><th>Status</th></tr></thead>
      <tbody>${rows}</tbody></table>
      </body></html>`);
    printWindow.document.close();
    printWindow.print();
  };



  // Calculate daily attendance
  const dailyAttendance = filteredRecords.reduce(
    (acc: any[], record: any) => {
      const date = new Date(record.timestamp).getDate().toString().padStart(2, '0');
      const existing = acc.find((d: any) => d.date === date);
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
    show: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } as any }
  };

  if (loading) {
    return (
      <Card className="p-6 rounded-2xl overflow-hidden" style={{ border: '1px solid #E2E8F0', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', backgroundColor: '#FFFFFF' }}>
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
        <Card className="p-6 rounded-2xl overflow-hidden" style={{ border: '1px solid #E2E8F0', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', backgroundColor: '#FFFFFF' }}>
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
              <Label htmlFor="status">Status</Label>
              <Select value={selectedStatus} onValueChange={(v: 'all' | 'present' | 'absent') => setSelectedStatus(v)}>
                <SelectTrigger className="mt-1.5 font-medium">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All (Both)</SelectItem>
                  <SelectItem value="present">Present Only</SelectItem>
                  <SelectItem value="absent">Absent Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button
                className="flex-1 shadow-sm font-semibold bg-primary hover:bg-primary/90"
                onClick={applyFilters}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Export Options */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 rounded-2xl overflow-hidden cursor-pointer" style={{ border: '1px solid #E2E8F0', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', backgroundColor: '#FFFFFF' }}>
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

        <Card className="p-6 rounded-2xl overflow-hidden cursor-pointer" style={{ border: '1px solid #E2E8F0', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', backgroundColor: '#FFFFFF' }}>
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
        <Card className="p-6 rounded-2xl overflow-hidden" style={{ border: '1px solid #E2E8F0', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', backgroundColor: '#FFFFFF' }}>
          <h3 className="text-lg font-bold mb-4 text-foreground tracking-tight">
            Daily Attendance Heatmap (Current Month)
          </h3>
          <div className="grid grid-cols-7 gap-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day: string) => (
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
        <Card className="p-6 rounded-2xl overflow-hidden hover:-translate-y-1 transition-transform" style={{ border: '1px solid #E2E8F0', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', backgroundColor: '#FFFFFF' }}>
          <p className="text-sm text-muted-foreground">Total Attendance Records</p>
          <h3 className="text-3xl font-bold mt-2 text-primary">
            {filteredRecords.length}
          </h3>
        </Card>
        <Card className="p-6 rounded-2xl overflow-hidden hover:-translate-y-1 transition-transform" style={{ border: '1px solid #E2E8F0', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', backgroundColor: '#FFFFFF' }}>
          <p className="text-sm text-muted-foreground">Unique Students</p>
          <h3 className="text-3xl font-bold mt-2 text-accent-foreground">
            {new Set(filteredRecords.map((r) => r.rollNumber)).size}
          </h3>
        </Card>
        <Card className="p-6 rounded-2xl overflow-hidden hover:-translate-y-1 transition-transform" style={{ border: '1px solid #E2E8F0', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', backgroundColor: '#FFFFFF' }}>
          <p className="text-sm text-muted-foreground">Active Days</p>
          <h3 className="text-3xl font-bold mt-2 text-destructive">
            {dailyAttendance.length}
          </h3>
        </Card>
      </motion.div>

      {/* Detailed Attendance Table */}
      <motion.div variants={itemVariants}>
        <Card className="rounded-2xl overflow-hidden" style={{ border: '1px solid #E2E8F0', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div className="p-6 flex flex-col sm:flex-row justify-between items-center gap-4" style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E2E8F0' }}>
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
                  <TableHead className="font-semibold text-muted-foreground">Status</TableHead>
                  <TableHead className="font-semibold text-muted-foreground">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border/30">
                <AnimatePresence>
                  {currentRecords.map((record) => (
                    <TableRow
                      key={record.id || record.timestamp + record.rollNumber}
                      className={`hover:bg-secondary/20 transition-colors ${record.status === 'Absent' ? 'bg-red-500/5' : ''}`}
                    >
                      <TableCell className="font-medium text-foreground">
                        {record.status === 'Present' ? (
                          new Date(record.timestamp).toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        ) : (
                          <span className="text-muted-foreground italic">No record</span>
                        )}
                      </TableCell>
                      <TableCell className="font-bold text-foreground">{record.studentName}</TableCell>
                      <TableCell className="text-muted-foreground font-semibold">{record.rollNumber}</TableCell>
                      <TableCell>
                        {record.status === 'Present' ? (
                          <Badge className="bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20 gap-1.5 py-1 px-3">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Present
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/20 gap-1.5 py-1 px-3">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Absent
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {record.status === 'Absent' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-2 bg-primary/5 hover:bg-primary hover:text-white transition-all border-primary/20"
                            onClick={() => handleSendSms(record)}
                            disabled={sendingSms === record.rollNumber}
                          >
                            <Send className={`w-3.5 h-3.5 ${sendingSms === record.rollNumber ? 'animate-bounce' : ''}`} />
                            {sendingSms === record.rollNumber ? 'Sending...' : 'Notify Parent'}
                          </Button>
                        )}
                        {record.status === 'Present' && (
                          <span className="text-[10px] uppercase tracking-widest font-bold text-green-500/50 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Recorded
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </AnimatePresence>
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
