import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Search, Upload, Edit, Trash2, Download, UserPlus, Users } from 'lucide-react';
import { getStudents, Student, updateStudent, deleteStudent } from '../api/apiClient';

interface StudentManagementProps {
  onAddStudent: () => void;
  facultyDepartmentId?: number;
  userRole?: 'admin' | 'faculty';
}

export function StudentManagement({ onAddStudent, facultyDepartmentId, userRole = 'admin' }: StudentManagementProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [selectedSection, setSelectedSection] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');

  // Edit/Delete states
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    // Load students from the backend
    const loadStudents = async () => {
      setLoading(true);
      const apiStudents = await getStudents(facultyDepartmentId);
      setStudents(apiStudents || []);
      setLoading(false);
    };

    loadStudents();
  }, [facultyDepartmentId]);

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.rollNo.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBranch = selectedBranch === 'all' || student.branch === selectedBranch;
    const matchesSection = selectedSection === 'all' || student.section === selectedSection;
    const matchesYear = selectedYear === 'all' || student.year === selectedYear;
    return matchesSearch && matchesBranch && matchesSection && matchesYear;
  });

  // Handler functions
  const handleAddStudent = () => {
    onAddStudent();
  };

  const handleCsvUpload = () => {
    // For now, show alert - in real app, open file picker and process CSV
    alert('CSV Upload functionality - open file picker and process CSV data');
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setShowEditModal(true);
  };

  const handleDeleteStudent = (student: Student) => {
    setDeletingStudent(student);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteStudent = async () => {
    if (!deletingStudent) return;

    setActionLoading(true);
    const result = await deleteStudent(deletingStudent.id);
    if (result.status === 'success') {
      setStudents(prev => prev.filter(s => s.id !== deletingStudent.id));
      setShowDeleteConfirm(false);
      setDeletingStudent(null);
    } else {
      alert('Failed to delete student: ' + result.message);
    }
    setActionLoading(false);
  };

  const handleUpdateStudent = async (updatedStudent: Student) => {
    setActionLoading(true);
    const result = await updateStudent(updatedStudent.id, updatedStudent.name);
    if (result.status === 'success') {
      setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
      setShowEditModal(false);
      setEditingStudent(null);
    } else {
      alert('Failed to update student: ' + result.message);
    }
    setActionLoading(false);
  };

  const handleExportCsv = () => {
    const csvContent = [
      ['Roll No', 'Name', 'Branch', 'Section', 'Year', 'Phone', 'Status'],
      ...filteredStudents.map(student => [
        student.rollNo,
        student.name,
        student.branch,
        student.section,
        student.year || '',
        student.phone || '',
        student.status || 'Active'
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'students.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="space-y-5">
        {[...Array(2)].map((_, i) => (
          <Card key={i} className="p-6 rounded-2xl animate-pulse" style={{ border: '1px solid #E2E8F0' }}>
            <div className="h-6 bg-indigo-50 rounded w-1/3 mb-3" />
            <div className="h-4 bg-indigo-50 rounded w-full" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Faculty Dept Banner */}
      {userRole === 'faculty' && facultyDepartmentId && (
        <div
          className="flex items-center gap-3 px-5 py-3 rounded-xl"
          style={{ background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)', border: '1px solid #C7D2FE' }}
        >
          <span className="text-base">🏫</span>
          <span className="text-sm font-medium" style={{ color: '#1E3A8A' }}>
            Showing students from your department only
          </span>
        </div>
      )}
      {/* Header Actions */}
      <div>
        <Card
          className="rounded-2xl overflow-hidden"
          style={{ border: '1px solid #E2E8F0', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
        >
          <div className="px-5 py-4 flex flex-col lg:flex-row gap-3" style={{ backgroundColor: '#FAFBFF' }}>
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: '#94A3B8' }} />
              <input
                type="text"
                placeholder="Search by name or roll number…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-xl outline-none"
                style={{ border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', color: '#0F172A' }}
              />
            </div>

            {/* Branch Filter */}
            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger className="w-full lg:w-48 rounded-xl" style={{ border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF' }}>
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
              <SelectTrigger className="w-full lg:w-48 rounded-xl" style={{ border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF' }}>
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
              <SelectTrigger className="w-full lg:w-48 rounded-xl" style={{ border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF' }}>
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
              <button
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white rounded-xl"
                style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #1e40af 100%)', boxShadow: '0 4px 12px rgba(30,58,138,0.25)' }}
                onClick={handleAddStudent}
              >
                <UserPlus className="w-4 h-4" />
                Add Student
              </button>
              <button
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl"
                style={{ border: '1px solid #C7D2FE', color: '#1E3A8A', backgroundColor: '#EEF2FF' }}
                onClick={handleCsvUpload}
              >
                <Upload className="w-4 h-4" />
                CSV Upload
              </button>
            </div>
          </div>
        </Card>
      </div>

      {/* Students Table */}
      <Card
        className="rounded-2xl overflow-hidden"
        style={{ border: '1px solid #E2E8F0', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
      >
        <div
          className="px-5 py-4 flex items-center justify-between"
          style={{ borderBottom: '1px solid #E2E8F0', backgroundColor: '#FFFFFF' }}
        >
          <div>
            <p className="font-semibold text-sm" style={{ color: '#0F172A' }}>Student Records</p>
            <p className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>Showing {filteredStudents.length} students</p>
          </div>
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl"
            style={{ border: '1px solid #C7D2FE', color: '#1E3A8A', backgroundColor: '#EEF2FF' }}
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow style={{ backgroundColor: '#F8FAFF', borderBottom: '1px solid #E2E8F0' }}>
                {['Roll No', 'Name', 'Branch', 'Section', 'Year', 'Phone', 'Status', ''].map(h => (
                  <TableHead key={h} className="text-xs font-semibold" style={{ color: '#64748B' }}>{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student) => (
                <TableRow
                  key={student.rollNo}
                  style={{ borderBottom: '1px solid #F1F5F9' }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = '#F8FAFF')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = 'transparent')}
                >
                  <TableCell className="font-bold text-xs" style={{ color: '#1E3A8A' }}>{student.rollNo}</TableCell>
                  <TableCell className="font-medium text-sm" style={{ color: '#0F172A' }}>{student.name}</TableCell>
                  <TableCell className="text-xs" style={{ color: '#64748B' }}>{student.branch}</TableCell>
                  <TableCell className="text-xs" style={{ color: '#64748B' }}>{student.section}</TableCell>
                  <TableCell className="text-xs" style={{ color: '#64748B' }}>{student.year}</TableCell>
                  <TableCell className="text-xs" style={{ color: '#64748B' }}>{student.phone}</TableCell>
                  <TableCell>
                    <span
                      className="text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={student.status === 'Active'
                        ? { backgroundColor: '#DCFCE7', color: '#059669' }
                        : { backgroundColor: '#FEE2E2', color: '#DC2626' }}
                    >
                      {student.status || 'Active'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {userRole === 'admin' && (
                        <button
                          className="p-1.5 rounded-lg transition-colors"
                          onClick={() => handleEditStudent(student)}
                          title="Edit"
                          style={{ color: '#94A3B8' }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.backgroundColor = '#EEF2FF';
                            (e.currentTarget as HTMLElement).style.color = '#1E3A8A';
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                            (e.currentTarget as HTMLElement).style.color = '#94A3B8';
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        className="p-1.5 rounded-lg transition-colors"
                        onClick={() => handleDeleteStudent(student)}
                        title="Delete"
                        style={{ color: '#94A3B8' }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.backgroundColor = '#FEE2E2';
                          (e.currentTarget as HTMLElement).style.color = '#DC2626';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                          (e.currentTarget as HTMLElement).style.color = '#94A3B8';
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredStudents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-14">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: '#EEF2FF' }}>
                        <Users className="w-6 h-6" style={{ color: '#A5B4FC' }} />
                      </div>
                      <p className="text-sm font-medium" style={{ color: '#94A3B8' }}>No students found.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Edit Student Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
            <DialogDescription>
              Update student information
            </DialogDescription>
          </DialogHeader>
          {editingStudent && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={editingStudent.name}
                  onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => editingStudent && handleUpdateStudent(editingStudent)}
              disabled={actionLoading}
            >
              {actionLoading ? 'Updating...' : 'Update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Student</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {deletingStudent?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteStudent}
              disabled={actionLoading}
            >
              {actionLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
