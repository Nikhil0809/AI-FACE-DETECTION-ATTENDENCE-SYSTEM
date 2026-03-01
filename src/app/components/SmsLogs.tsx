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
import { useState, useEffect } from 'react';
import { apiClient } from '../api/apiClient';

interface SmsLog {
  id: string;
  student: string;
  rollNo: string;
  phone: string;
  message: string;
  status: string;
  time: string;
  date: string;
}

export function SmsLogs() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [smsLogs, setSmsLogs] = useState<SmsLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load SMS logs from backend
  useEffect(() => {
    loadSmsLogs();
  }, []);

  const loadSmsLogs = async () => {
    try {
      setIsLoading(true);
      // TODO: Implement SMS log endpoint in backend when SMS functionality is added
      // For now, start with empty logs
      setSmsLogs([]);
    } catch (error) {
      console.error('Error loading SMS logs:', error);
      setSmsLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Listen for SMS log updates via WebSocket
  useEffect(() => {
    const ws = apiClient.connectWebSocket((data: any) => {
      if (data.type === 'sms_sent') {
        loadSmsLogs();
      }
    });
    return () => {
      if (ws) ws.close();
    };
  }, []);

  const filteredLogs = smsLogs.filter((log) => {
    const matchesSearch =
      log.student.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.rollNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.phone.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: smsLogs.length,
    sent: smsLogs.filter((log) => log.status === 'Sent').length,
    failed: smsLogs.filter((log) => log.status === 'Failed').length,
    pending: smsLogs.filter((log) => log.status === 'Pending').length,
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
            {isLoading ? 'Loading...' : `${filteredLogs.length} messages found`}
          </p>
        </div>

        {isLoading ? (
          <div className="p-12 text-center">
            <div className="h-8 bg-gray-300 rounded animate-pulse mb-4 w-1/2 mx-auto"></div>
          </div>
        ) : smsLogs.length === 0 ? (
          <div className="p-12 text-center text-gray-600">
            <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No SMS logs available</p>
            <p className="text-sm mt-2">SMS notifications will appear here when the SMS feature is enabled.</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-gray-600">
            <p className="text-lg">No messages match your search</p>
            <p className="text-sm mt-2">Try adjusting your search or filter criteria</p>
          </div>
        ) : (
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
        )}
      </Card>
    </div>
  );
}
