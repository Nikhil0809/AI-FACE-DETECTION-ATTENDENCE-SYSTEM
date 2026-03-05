import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
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
import { Search, Plus, Upload, Edit, Trash2, Download } from 'lucide-react';
import { Badge } from './ui/badge';
import { getStudents, Student } from '../api/apiClient';

export function StudentManagement() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [selectedSection, setSelectedSection] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');

  useEffect(() => {
    // Load students from the backend
    const loadStudents = async () => {
      setLoading(true);
      const apiStudents = await getStudents();
      setStudents(apiStudents || []);
      setLoading(false);
    };

    loadStudents();
  }, []);

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.rollNo.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBranch = selectedBranch === 'all' || student.branch === selectedBranch;
    const matchesSection = selectedSection === 'all' || student.section === selectedSection;
    const matchesYear = selectedYear === 'all' || student.year === selectedYear;
    return matchesSearch && matchesBranch && matchesSection && matchesYear;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="p-6 rounded-xl shadow-sm">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-200 rounded w-1/3"></div>
            <div className="h-8 bg-gray-200 rounded w-full"></div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <Card className="p-6 rounded-xl shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by name or roll number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Branch Filter */}
          <Select value={selectedBranch} onValueChange={setSelectedBranch}>
            <SelectTrigger className="w-full lg:w-48">
              <SelectValue placeholder="Branch" />
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

          {/* Section Filter */}
          <Select value={selectedSection} onValueChange={setSelectedSection}>
            <SelectTrigger className="w-full lg:w-48">
              <SelectValue placeholder="Section" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sections</SelectItem>
              {Array.from({ length: 14 }, (_, i) => String.fromCharCode(65 + i)).map(char => (
                <SelectItem key={char} value={char}>Section {char}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Year Filter */}
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-full lg:w-48">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              <SelectItem value="1st Year">1st Year</SelectItem>
              <SelectItem value="2nd Year">2nd Year</SelectItem>
              <SelectItem value="3rd Year">3rd Year</SelectItem>
              <SelectItem value="4th Year">4th Year</SelectItem>
            </SelectContent>
          </Select>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              className="flex items-center gap-2 text-white"
              style={{ backgroundColor: '#10B981' }}
            >
              <Plus className="w-4 h-4" />
              Add Student
            </Button>
            <Button
              variant="outline"
              className="flex items-center gap-2"
              style={{ borderColor: '#1E3A8A', color: '#1E3A8A' }}
            >
              <Upload className="w-4 h-4" />
              CSV Upload
            </Button>
          </div>
        </div>
      </Card>

      {/* Students Table */}
      <Card className="rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold" style={{ color: '#1E3A8A' }}>
              Student Records
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {filteredStudents.length} students found
            </p>
          </div>
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Roll No</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Section</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student) => (
                <TableRow key={student.rollNo} className="hover:bg-gray-50">
                  <TableCell className="font-medium">{student.rollNo}</TableCell>
                  <TableCell>{student.name}</TableCell>
                  <TableCell>{student.branch}</TableCell>
                  <TableCell>{student.section}</TableCell>
                  <TableCell>{student.year}</TableCell>
                  <TableCell>{student.phone}</TableCell>
                  <TableCell>
                    <Badge
                      variant={student.status === 'Active' ? 'default' : 'secondary'}
                      className="rounded-full"
                      style={
                        student.status === 'Active'
                          ? { backgroundColor: '#ECFDF5', color: '#10B981' }
                          : {}
                      }
                    >
                      {student.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4 text-gray-600" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
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
