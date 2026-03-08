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
import { Search, Plus, Upload, Edit, Trash2, Download, UserPlus } from 'lucide-react';
import { Badge } from './ui/badge';
import { getStudents, Student, updateStudent, deleteStudent } from '../api/apiClient';
import { motion, AnimatePresence } from 'framer-motion';

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

  const containerVariants: any = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants: any = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Faculty Dept Banner */}
      {userRole === 'faculty' && facultyDepartmentId && (
        <motion.div variants={itemVariants}>
          <div className="rounded-xl px-5 py-3 bg-blue-50 border border-blue-200 text-blue-800 text-sm font-medium flex items-center gap-2">
            <span className="text-base">🏫</span>
            Showing students from your department only
          </div>
        </motion.div>
      )}
      {/* Header Actions */}
      <motion.div variants={itemVariants}>
        <Card className="p-6 rounded-xl shadow-sm border-border/50 bg-card/60 backdrop-blur-xl">
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
            <div className="flex gap-3">
              <Button
                className="flex items-center gap-2 font-semibold shadow-sm w-full lg:w-auto"
                onClick={handleAddStudent}
              >
                <UserPlus className="w-4 h-4" />
                Add Student
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-2 font-semibold shadow-sm w-full lg:w-auto bg-background/50"
                onClick={handleCsvUpload}
              >
                <Upload className="w-4 h-4" />
                CSV Upload
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Students Table */}
      <motion.div variants={itemVariants}>
        <Card className="rounded-xl shadow-sm overflow-hidden border-border/50 bg-card/60 backdrop-blur-xl">
          <div className="p-6 border-b border-border/50 bg-secondary/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-foreground tracking-tight">
                Student Records
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Showing {filteredStudents.length} students
              </p>
            </div>
            <Button variant="outline" className="flex items-center gap-2 bg-background/50 shadow-sm" onClick={handleExportCsv}>
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-secondary/20">
                <TableRow className="border-border/50">
                  <TableHead className="font-semibold text-muted-foreground">Roll No</TableHead>
                  <TableHead className="font-semibold text-muted-foreground">Name</TableHead>
                  <TableHead className="font-semibold text-muted-foreground">Branch</TableHead>
                  <TableHead className="font-semibold text-muted-foreground">Section</TableHead>
                  <TableHead className="font-semibold text-muted-foreground">Year</TableHead>
                  <TableHead className="font-semibold text-muted-foreground">Phone</TableHead>
                  <TableHead className="font-semibold text-muted-foreground">Status</TableHead>
                  <TableHead className="text-right font-semibold text-muted-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border/30">
                <AnimatePresence>
                  {filteredStudents.map((student) => (
                    <motion.tr
                      key={student.rollNo}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="hover:bg-secondary/20 transition-colors"
                    >
                      <TableCell className="font-semibold text-foreground">{student.rollNo}</TableCell>
                      <TableCell className="font-medium text-muted-foreground">{student.name}</TableCell>
                      <TableCell className="text-muted-foreground">{student.branch}</TableCell>
                      <TableCell className="text-muted-foreground">{student.section}</TableCell>
                      <TableCell className="text-muted-foreground">{student.year}</TableCell>
                      <TableCell className="text-muted-foreground">{student.phone}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`rounded-full px-3 py-1 font-semibold ${student.status === 'Active'
                            ? 'bg-accent/10 border-accent/20 text-accent-foreground'
                            : 'bg-destructive/10 border-destructive/20 text-destructive'
                            }`}
                        >
                          {student.status || 'Active'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {userRole === 'admin' && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors" onClick={() => handleEditStudent(student)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive transition-colors text-muted-foreground" onClick={() => handleDeleteStudent(student)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
                {filteredStudents.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                      No students found matching your criteria.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </motion.div>

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
    </motion.div>
  );
}
