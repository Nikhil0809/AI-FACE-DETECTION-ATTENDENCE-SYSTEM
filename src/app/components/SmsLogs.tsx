import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Button } from './ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Search, Download, MessageSquare, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useState } from 'react';

const mockSmsLogs = [
  {
    id: 1,
    student: 'Rahul Sharma',
    rollNo: 'CS2021001',
    phone: '+91 98765 43210',
    message: 'Your ward was absent on 27/02/2026. Please ensure regular attendance.',
    status: 'Sent',
    time: '10:30 AM',
    date: '27/02/2026',
  },
  {
    id: 2,
    student: 'Amit Kumar',
    rollNo: 'ME2021023',
    phone: '+91 98765 43212',
    message: 'Your ward was absent on 27/02/2026. Please ensure regular attendance.',
    status: 'Sent',
    time: '10:31 AM',
    date: '27/02/2026',
  },
  {
    id: 3,
    student: 'Arjun Singh',
    rollNo: 'EE2021056',
    phone: '+91 98765 43214',
    message: 'Your ward was absent on 27/02/2026. Please ensure regular attendance.',
    status: 'Failed',
    time: '10:32 AM',
    date: '27/02/2026',
  },
  {
    id: 4,
    student: 'Kavya Nair',
    rollNo: 'CE2021012',
    phone: '+91 98765 43215',
    message: 'Your ward was absent on 27/02/2026. Please ensure regular attendance.',
    status: 'Sent',
    time: '10:33 AM',
    date: '27/02/2026',
  },
  {
    id: 5,
    student: 'Priya Patel',
    rollNo: 'EC2021045',
    phone: '+91 98765 43211',
    message: 'Reminder: Low attendance (78%). Please improve attendance.',
    status: 'Sent',
    time: '09:15 AM',
    date: '26/02/2026',
  },
  {
    id: 6,
    student: 'Sneha Reddy',
    rollNo: 'CS2021032',
    phone: '+91 98765 43213',
    message: 'Monthly attendance report: 92% attendance. Keep it up!',
    status: 'Sent',
    time: '09:00 AM',
    date: '25/02/2026',
  },
  {
    id: 7,
    student: 'Vikram Joshi',
    rollNo: 'CS2021087',
    phone: '+91 98765 43216',
    message: 'Your ward was absent on 24/02/2026. Please ensure regular attendance.',
    status: 'Pending',
    time: '10:45 AM',
    date: '24/02/2026',
  },
  {
    id: 8,
    student: 'Anjali Verma',
    rollNo: 'EC2021078',
    phone: '+91 98765 43217',
    message: 'Reminder: Low attendance (81%). Please improve attendance.',
    status: 'Failed',
    time: '03:20 PM',
    date: '23/02/2026',
  },
];

export function SmsLogs() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredLogs = mockSmsLogs.filter((log) => {
    const matchesSearch =
      log.student.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.rollNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.phone.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: mockSmsLogs.length,
    sent: mockSmsLogs.filter((log) => log.status === 'Sent').length,
    failed: mockSmsLogs.filter((log) => log.status === 'Failed').length,
    pending: mockSmsLogs.filter((log) => log.status === 'Pending').length,
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Sent':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'Failed':
        return <XCircle className="w-4 h-4" />;
      case 'Pending':
        return <Clock className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Sent':
        return { backgroundColor: '#ECFDF5', color: '#10B981' };
      case 'Failed':
        return { backgroundColor: '#FEF2F2', color: '#EF4444' };
      case 'Pending':
        return { backgroundColor: '#FEF3C7', color: '#F59E0B' };
      default:
        return {};
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 rounded-xl shadow-sm">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: '#EEF2FF' }}
            >
              <MessageSquare className="w-6 h-6" style={{ color: '#1E3A8A' }} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total SMS</p>
              <h3 className="text-2xl font-bold" style={{ color: '#1E3A8A' }}>
                {stats.total}
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
              <p className="text-sm text-gray-600">Sent</p>
              <h3 className="text-2xl font-bold" style={{ color: '#10B981' }}>
                {stats.sent}
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
              <p className="text-sm text-gray-600">Failed</p>
              <h3 className="text-2xl font-bold" style={{ color: '#EF4444' }}>
                {stats.failed}
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
              <Clock className="w-6 h-6" style={{ color: '#F59E0B' }} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <h3 className="text-2xl font-bold" style={{ color: '#F59E0B' }}>
                {stats.pending}
              </h3>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6 rounded-xl shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by student name, roll number, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full lg:w-48">
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Sent">Sent</SelectItem>
              <SelectItem value="Failed">Failed</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            className="flex items-center gap-2"
            style={{ borderColor: '#1E3A8A', color: '#1E3A8A' }}
          >
            <Download className="w-4 h-4" />
            Export Logs
          </Button>
        </div>
      </Card>

      {/* SMS Logs Table */}
      <Card className="rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-bold" style={{ color: '#1E3A8A' }}>
            SMS Notification Logs
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {filteredLogs.length} messages found
          </p>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Roll No</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date & Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">{log.student}</TableCell>
                  <TableCell>{log.rollNo}</TableCell>
                  <TableCell>{log.phone}</TableCell>
                  <TableCell>
                    <p className="text-sm text-gray-600 max-w-md truncate">
                      {log.message}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className="rounded-full flex items-center gap-1.5 w-fit"
                      style={getStatusColor(log.status)}
                    >
                      {getStatusIcon(log.status)}
                      {log.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p className="font-medium text-gray-900">{log.date}</p>
                      <p className="text-gray-500">{log.time}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
