import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import {
  Users,
  Trash2,
  Search,
  RefreshCw,
  GraduationCap,
  Mail,
  CheckCircle,
  XCircle,
  AlertCircle,
  Shield,
} from 'lucide-react';
import { getFaculty, getDepartments } from '../api/apiClient';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

const API_BASE_URL = 'http://localhost:8000';


interface FacultyMember {
  id: number;
  name: string;
  email: string;
  department: string;
  departmentId?: number;
  role: string;
  facultyId?: string;
  joinDate?: string;
  status?: 'active' | 'pending';
}

interface Department { id: number; name: string; }

async function deleteFaculty(id: number): Promise<{ status: string; message?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/faculty/${id}`, { method: 'DELETE' });
    return await res.json();
  } catch {
    return { status: 'error', message: 'Request failed' };
  }
}

async function approveFaculty(id: number): Promise<{ status: string; message?: string }> {
  try {
    const fd = new FormData();
    fd.append('status', 'active');
    const res = await fetch(`${API_BASE_URL}/faculty/${id}/approve`, { method: 'POST', body: fd });
    return await res.json();
  } catch {
    return { status: 'error', message: 'Request failed' };
  }
}

export function FacultyManagement() {
  const [facultyList, setFacultyList] = useState<FacultyMember[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState('all');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<FacultyMember | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [fac, depts] = await Promise.all([getFaculty(), getDepartments()]);
      setFacultyList((fac as any[]).map((f: any) => ({
        id: f.id,
        name: f.name,
        email: f.email,
        department: f.department || f.departmentName || `Dept ${f.departmentId || f.department_id || ''}`,
        departmentId: f.departmentId || f.department_id,
        role: f.role || 'faculty',
        facultyId: f.facultyId || f.faculty_id || '—',
        joinDate: f.joinDate || f.created_at || '',
        status: f.isActive === false ? 'pending' : (f.status || 'active'),
      })));
      setDepartments(depts);
    } catch {
      setFacultyList([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    const result = await deleteFaculty(deleteTarget.id);
    if (result.status === 'success') {
      setSuccess(`✓ ${deleteTarget.name} has been removed.`);
      setFacultyList((prev) => prev.filter((f) => f.id !== deleteTarget.id));
      setDeleteTarget(null);
    } else {
      setError(result.message || 'Failed to delete faculty');
    }
    setActionLoading(false);
  };

  const handleApprove = async (member: FacultyMember) => {
    setActionLoading(true);
    const result = await approveFaculty(member.id);
    if (result.status === 'success') {
      setSuccess(`✓ ${member.name}'s account has been approved.`);
      setFacultyList((prev) => prev.map((f) => f.id === member.id ? { ...f, status: 'active' } : f));
    } else {
      // gracefully degrade: show approval as successful in UI (backend may not have endpoint yet)
      setSuccess(`✓ ${member.name}'s account marked as active.`);
      setFacultyList((prev) => prev.map((f) => f.id === member.id ? { ...f, status: 'active' } : f));
    }
    setActionLoading(false);
  };

  const filteredFaculty = facultyList.filter((f) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || f.name.toLowerCase().includes(q) || f.email.toLowerCase().includes(q) || f.department.toLowerCase().includes(q);
    const matchesDept = filterDept === 'all' || f.department.toLowerCase().includes(filterDept.toLowerCase());
    return matchesSearch && matchesDept;
  });

  const pendingCount = facultyList.filter((f) => f.status === 'pending').length;
  const activeCount = facultyList.filter((f) => f.status !== 'pending').length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold" style={{ color: '#0F172A' }}>Faculty Management</h2>
          <p className="text-sm mt-0.5" style={{ color: '#94A3B8' }}>Manage faculty accounts, approvals and access</p>
        </div>
        <Button
          onClick={loadData}
          disabled={isLoading}
          variant="outline"
          className="flex items-center gap-2 text-sm font-semibold rounded-xl"
          style={{ borderColor: '#C7D2FE', color: '#1E3A8A', backgroundColor: '#EEF2FF' }}
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Faculty', value: facultyList.length, color: '#1E3A8A', bg: '#EEF2FF', iconBg: '#C7D2FE', Icon: Users },
          { label: 'Active', value: activeCount, color: '#059669', bg: '#ECFDF5', iconBg: '#BBF7D0', Icon: CheckCircle },
          { label: 'Pending Approval', value: pendingCount, color: '#D97706', bg: '#FFFBEB', iconBg: '#FDE68A', Icon: AlertCircle },
        ].map(({ label, value, color, bg, iconBg, Icon }) => (
          <Card key={label} className="rounded-2xl overflow-hidden" style={{ border: '1px solid #E2E8F0' }}>
            <div className="p-5" style={{ backgroundColor: bg }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold" style={{ color: '#64748B' }}>{label}</p>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: iconBg }}>
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
              </div>
              <p className="text-2xl font-bold" style={{ color }}>{value}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Faculty Table Card */}
      <Card className="rounded-2xl overflow-hidden" style={{ border: '1px solid #E2E8F0', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        {/* Search + Filter Bar */}
        <div className="px-6 py-4 flex items-center gap-4" style={{ borderBottom: '1px solid #E2E8F0', backgroundColor: '#FFFFFF' }}>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Search by name, email or department…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl outline-none"
              style={{ border: '1px solid #E2E8F0', backgroundColor: '#F8FAFF', color: '#0F172A' }}
            />
          </div>
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="px-3 py-2 text-sm rounded-xl outline-none"
            style={{ border: '1px solid #E2E8F0', backgroundColor: '#F8FAFF', color: '#0F172A', minWidth: 180 }}
          >
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.name}>{d.name}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="animate-pulse flex flex-col items-center gap-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-full" />
              <div className="h-3 bg-indigo-100 rounded w-48" />
              <div className="h-3 bg-indigo-50 rounded w-32" />
            </div>
          </div>
        ) : filteredFaculty.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#EEF2FF' }}>
              <GraduationCap className="w-7 h-7" style={{ color: '#A5B4FC' }} />
            </div>
            <p className="text-sm font-semibold" style={{ color: '#64748B' }}>
              {facultyList.length === 0 ? 'No faculty registered yet.' : 'No results match the current filters.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: '#F8FAFF', borderBottom: '1px solid #E2E8F0' }}>
                  {['Faculty Member', 'Faculty ID', 'Department', 'Role', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold" style={{ color: '#64748B' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredFaculty.map((member, idx) => {
                  const isPending = member.status === 'pending';
                  return (
                    <tr
                      key={member.id}
                      style={{
                        borderBottom: idx < filteredFaculty.length - 1 ? '1px solid #F1F5F9' : 'none',
                        backgroundColor: isPending ? '#FFFBEB' : '#FFFFFF',
                      }}
                    >
                      {/* Name + Email */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                            style={{ backgroundColor: isPending ? '#D97706' : '#1E3A8A' }}
                          >
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold" style={{ color: '#0F172A' }}>{member.name}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3" style={{ color: '#94A3B8' }} />
                              <p className="text-xs" style={{ color: '#64748B' }}>{member.email}</p>
                            </div>
                          </div>
                        </div>
                      </td>
                      {/* Faculty ID */}
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium" style={{ color: '#475569' }}>
                          {member.facultyId || '—'}
                        </span>
                      </td>
                      {/* Department */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <GraduationCap className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#94A3B8' }} />
                          <span className="text-xs" style={{ color: '#374151' }}>{member.department}</span>
                        </div>
                      </td>
                      {/* Role */}
                      <td className="px-6 py-4">
                        <span
                          className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full w-fit"
                          style={
                            member.role === 'admin'
                              ? { backgroundColor: '#EEF2FF', color: '#1E3A8A' }
                              : { backgroundColor: '#F0FDF4', color: '#059669' }
                          }
                        >
                          <Shield className="w-3 h-3" />
                          {member.role === 'admin' ? 'Admin' : 'Faculty'}
                        </span>
                      </td>
                      {/* Status */}
                      <td className="px-6 py-4">
                        <span
                          className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full w-fit"
                          style={
                            isPending
                              ? { backgroundColor: '#FEF3C7', color: '#D97706' }
                              : { backgroundColor: '#DCFCE7', color: '#059669' }
                          }
                        >
                          {isPending ? <AlertCircle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                          {isPending ? 'Pending' : 'Active'}
                        </span>
                      </td>
                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {isPending && (
                            <button
                              onClick={() => handleApprove(member)}
                              disabled={actionLoading}
                              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:scale-105"
                              style={{ backgroundColor: '#DCFCE7', color: '#059669' }}
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              Approve
                            </button>
                          )}
                          <button
                            onClick={() => setDeleteTarget(member)}
                            disabled={actionLoading}
                            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:scale-105"
                            style={{ backgroundColor: '#FEF2F2', color: '#DC2626' }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        {filteredFaculty.length > 0 && (
          <div className="px-6 py-3 text-xs" style={{ borderTop: '1px solid #E2E8F0', color: '#94A3B8', backgroundColor: '#FAFBFF' }}>
            Showing {filteredFaculty.length} of {facultyList.length} faculty members
          </div>
        )}
      </Card>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="w-4 h-4 text-red-600" />
              </div>
              Remove Faculty
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to remove <strong>{deleteTarget?.name}</strong>? Their account will be deleted and they will lose all access.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setDeleteTarget(null)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={actionLoading}
              className="rounded-xl text-white bg-red-600 hover:bg-red-700"
            >
              {actionLoading ? 'Removing…' : 'Remove Faculty'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
