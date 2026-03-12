// Enhanced API client for Enterprise AI Attendance System
const API_BASE_URL = (import.meta.env as any)?.VITE_API_URL || 'http://localhost:8000';

// ===========================
// TYPES & INTERFACES
// ===========================

export interface Department {
  id: number;
  name: string;
  code: string;
  specialization?: string;
}

export interface Section {
  id: number;
  name: string;
}

export interface LoginPayload {
  email: string;
  password: string;
  role: 'admin' | 'faculty';
}

export interface User {
  id: number;
  name: string;
  email?: string;
  role?: 'admin' | 'faculty';
  departmentId?: number;
}

export interface LoginResponse {
  status: 'success' | 'error';
  message?: string;
  user?: User;
}

export interface RegisterPayload {
  rollNumber: string;
  name: string;
  phoneNumber: string;
  year: string;
  departmentId: number;
  sectionId: number;
  imageFile: File;
}

export interface FacultyRegisterPayload {
  email: string;
  password: string;
  name: string;
  departmentId: number;
}

export interface AdminRegisterPayload {
  email: string;
  password: string;
  name: string;
  departmentId: number;
}

export interface RegisterResponse {
  status: 'success' | 'error';
  message: string;
}

export interface Student {
  id: number;
  name: string;
  rollNo: string;
  department: string;
  section: string;
  status?: string;
  year?: string;
  phone?: string;
  branch?: string;
}

export interface Faculty {
  id: number;
  name: string;
  email: string;
  departmentId: number;
  role: 'faculty' | 'admin';
  joinDate?: string;
}

export interface AttendanceRecord {
  id: number;
  studentName: string;
  rollNumber: string;
  timestamp: string;
  department?: string;
  section?: string;
}

export interface AttendanceSession {
  id: number;
  name: string;
  departmentId: number;
  startTime: string;
  endTime: string;
  date: string;
  isActive: boolean;
  createdAt?: string;
}

export interface SmsLog {
  timestamp: string;
  phone: string;
  student: string;
  rollNo: string;
  message: string;
  status: string;
}

// ===========================
// DEPARTMENT & SECTION APIs
// ===========================

export async function getDepartments(): Promise<Department[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/departments`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    return data.departments || [];
  } catch (error) {
    console.warn('Could not fetch departments:', error);
    return [];
  }
}

export async function getSections(departmentId: number): Promise<Section[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/departments/${departmentId}/sections`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    return data.sections || [];
  } catch (error) {
    console.warn(`Could not fetch sections for department ${departmentId}:`, error);
    return [];
  }
}

export async function createSection(departmentId: number, sectionName: string): Promise<RegisterResponse> {
  const formData = new FormData();
  formData.append('section_name', sectionName);

  try {
    const response = await fetch(`${API_BASE_URL}/departments/${departmentId}/sections`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to create section',
    };
  }
}

// ===========================
// AUTHENTICATION APIS
// ===========================

export async function loginUser(payload: LoginPayload): Promise<LoginResponse> {
  const formData = new FormData();
  formData.append('email', payload.email);
  formData.append('password', payload.password);
  formData.append('role', payload.role);

  try {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Login failed',
    };
  }
}

// ===========================
// STUDENT REGISTRATION & MGMT
// ===========================

export async function registerStudent(payload: RegisterPayload): Promise<RegisterResponse> {
  const formData = new FormData();
  formData.append('roll_number', payload.rollNumber);
  formData.append('name', payload.name);
  formData.append('phone_number', payload.phoneNumber);
  formData.append('year', payload.year);
  formData.append('department_id', payload.departmentId.toString());
  formData.append('section_id', payload.sectionId.toString());
  formData.append('file', payload.imageFile);

  try {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Registration failed',
    };
  }
}

export async function getStudents(departmentId?: number): Promise<Student[]> {
  try {
    const url = departmentId
      ? `${API_BASE_URL}/students?department_id=${departmentId}`
      : `${API_BASE_URL}/students`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.students || [];
  } catch (error) {
    console.warn('Could not fetch students:', error);
    return [];
  }
}

export async function getStudent(studentId: number): Promise<Student | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/students/${studentId}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.student || null;
  } catch (error) {
    console.warn(`Could not fetch student ${studentId}:`, error);
    return null;
  }
}

// ===========================
// FACULTY & ADMIN REGISTRATION
// ===========================

export async function registerFacultyMember(payload: FacultyRegisterPayload): Promise<RegisterResponse> {
  const formData = new FormData();
  formData.append('email', payload.email);
  formData.append('password', payload.password);
  formData.append('name', payload.name);
  formData.append('department', payload.departmentId.toString());

  try {
    const response = await fetch(`${API_BASE_URL}/register-faculty`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Registration failed',
    };
  }
}

export async function registerAdmin(payload: AdminRegisterPayload): Promise<RegisterResponse> {
  const formData = new FormData();
  formData.append('email', payload.email);
  formData.append('password', payload.password);
  formData.append('name', payload.name);
  formData.append('department', payload.departmentId.toString());

  try {
    const response = await fetch(`${API_BASE_URL}/register-admin`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Registration failed',
    };
  }
}

export async function getFaculty(departmentId?: number): Promise<Faculty[]> {
  try {
    const url = departmentId
      ? `${API_BASE_URL}/faculty?department_id=${departmentId}`
      : `${API_BASE_URL}/faculty`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.faculty || [];
  } catch (error) {
    console.warn('Could not fetch faculty:', error);
    return [];
  }
}

// ===========================
// ATTENDANCE APIS
// ===========================

export async function markAttendance(studentId: number, markedBy?: number): Promise<RegisterResponse> {
  const formData = new FormData();
  if (markedBy) formData.append('marked_by', markedBy.toString());

  try {
    const response = await fetch(`${API_BASE_URL}/attendance/${studentId}`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to mark attendance',
    };
  }
}

export async function getAttendance(
  limit: number = 100,
  departmentId?: number
): Promise<AttendanceRecord[]> {
  try {
    const url = departmentId
      ? `${API_BASE_URL}/attendance?limit=${limit}&department_id=${departmentId}`
      : `${API_BASE_URL}/attendance?limit=${limit}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.attendance || [];
  } catch (error) {
    console.warn('Could not fetch attendance:', error);
    return [];
  }
}

export async function getAttendanceByDate(
  departmentId: number,
  date: string
): Promise<AttendanceRecord[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/attendance/department/${departmentId}/date/${date}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.attendance || [];
  } catch (error) {
    console.warn(`Could not fetch attendance for ${date}:`, error);
    return [];
  }
}

// ===========================
// FACE RECOGNITION & VIEWER
// ===========================

export async function recognizeFace(imageFile: File): Promise<any> {
  const formData = new FormData();
  formData.append('file', imageFile);

  try {
    const response = await fetch(`${API_BASE_URL}/recognize`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Recognition failed',
    };
  }
}

export async function getStudentFace(studentId: number): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/faces/student/${studentId}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.warn(`Could not fetch face for student ${studentId}:`, error);
    return { status: 'error', message: 'Failed to fetch face data' };
  }
}

export async function getAllFaces(departmentId?: number): Promise<Student[]> {
  try {
    const url = departmentId
      ? `${API_BASE_URL}/faces/all?department_id=${departmentId}`
      : `${API_BASE_URL}/faces/all`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.faces || [];
  } catch (error) {
    console.warn('Could not fetch faces:', error);
    return [];
  }
}

// ===========================
// ADMIN OPERATIONS
// ===========================

export async function deleteAllStudents(): Promise<RegisterResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/delete-students`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to delete students',
    };
  }
}

export async function deleteAllAttendance(): Promise<RegisterResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/delete-attendance`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to delete attendance',
    };
  }
}

export async function resetDatabase(): Promise<RegisterResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/reset-database`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to reset database',
    };
  }
}

// ===========================
// ATTENDANCE SESSIONS (ADMIN & FACULTY)
// ===========================

export async function createAttendanceSession(
  name: string,
  departmentId: number,
  startTime: string,
  endTime: string,
  date: string,
  createdBy: number
): Promise<RegisterResponse> {
  const formData = new FormData();
  formData.append('name', name);
  formData.append('department_id', departmentId.toString());
  formData.append('start_time', startTime);
  formData.append('end_time', endTime);
  formData.append('date', date);
  formData.append('created_by', createdBy.toString());

  try {
    const response = await fetch(`${API_BASE_URL}/attendance-sessions`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to create session',
    };
  }
}

export async function getAttendanceSessions(
  departmentId?: number,
  date?: string
): Promise<AttendanceSession[]> {
  try {
    let url = `${API_BASE_URL}/attendance-sessions`;
    const params = [];
    if (departmentId) params.push(`department_id=${departmentId}`);
    if (date) params.push(`date=${date}`);
    if (params.length > 0) url += '?' + params.join('&');

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.sessions || [];
  } catch (error) {
    console.warn('Could not fetch attendance sessions:', error);
    return [];
  }
}

export async function updateAttendanceSession(
  sessionId: number,
  name?: string,
  startTime?: string,
  endTime?: string,
  isActive?: boolean
): Promise<RegisterResponse> {
  const formData = new FormData();
  if (name) formData.append('name', name);
  if (startTime) formData.append('start_time', startTime);
  if (endTime) formData.append('end_time', endTime);
  if (isActive !== undefined) formData.append('is_active', isActive.toString());

  try {
    const response = await fetch(`${API_BASE_URL}/attendance-sessions/${sessionId}`, {
      method: 'PUT',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to update session',
    };
  }
}

export async function deleteAttendanceSession(sessionId: number): Promise<RegisterResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/attendance-sessions/${sessionId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to delete session',
    };
  }
}

// ===========================
// STUDENT MANAGEMENT (ADMIN & FACULTY)
// ===========================

export async function updateStudent(
  studentId: number,
  name?: string,
  phoneNumber?: string,
  sectionId?: number,
  isActive?: boolean
): Promise<RegisterResponse> {
  const formData = new FormData();
  if (name) formData.append('name', name);
  if (phoneNumber) formData.append('phone_number', phoneNumber);
  if (sectionId) formData.append('section_id', sectionId.toString());
  if (isActive !== undefined) formData.append('is_active', isActive.toString());

  try {
    const response = await fetch(`${API_BASE_URL}/students/${studentId}`, {
      method: 'PUT',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to update student',
    };
  }
}

export async function deleteStudent(studentId: number): Promise<RegisterResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/students/${studentId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to delete student',
    };
  }
}

export async function deleteStudentByRollNumber(rollNumber: string): Promise<RegisterResponse> {
  const formData = new FormData();
  formData.append('roll_number', rollNumber);

  try {
    const response = await fetch(`${API_BASE_URL}/students/delete-by-rollnumber`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to delete student',
    };
  }
}

// ===========================
// WEBSOCKET REALTIME UPDATES
// ===========================

export function connectWebSocket(onMessage: (data: any) => void): WebSocket | null {
  try {
    const wsProtocol = API_BASE_URL.startsWith('https') ? 'wss' : 'ws';
    const wsUrl = API_BASE_URL.replace(/^https?/, wsProtocol) + '/ws';

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connected');
      ws.send(JSON.stringify({ type: 'ping' }));
      // Send ping every 30 seconds to keep connection alive
      setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, 30000);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };

    return ws;
  } catch (error) {
    console.error('Failed to connect WebSocket:', error);
    return null;
  }
}

// ===========================
// HEALTH CHECK
// ===========================

export async function healthCheck(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/`);
    return response.ok;
  } catch (error) {
    console.warn('Backend health check failed:', error);
    return false;
  }
}

// ===========================
// SMS NOTIFICATIONS
// ===========================

export async function sendSms(phone: string, name: string, rollNo: string): Promise<{ status: string; message: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/sms/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, name, rollNo }),
    });
    return await response.json();
  } catch (error) {
    console.error('Error sending SMS:', error);
    return { status: 'error', message: 'Failed to connect to SMS gateway' };
  }
}

export async function getSmsLogs(): Promise<{ status: string; logs: SmsLog[] }> {
  try {
    const response = await fetch(`${API_BASE_URL}/sms/logs`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching SMS logs:', error);
    return { status: 'error', logs: [] };
  }
}

// ===========================
// CONVENIENT API CLIENT OBJECT
// ===========================

export const apiClient = {
  // Departments & Sections
  getDepartments,
  getSections,
  createSection,
  // Auth
  loginUser,
  // Students
  registerStudent,
  getStudents,
  getStudent,
  // Faculty & Admin
  registerFacultyMember,
  registerAdmin,
  getFaculty,
  // Attendance
  markAttendance,
  getAttendance,
  getAttendanceByDate,
  // Face Recognition
  recognizeFace,
  getStudentFace,
  getAllFaces,
  // Admin 
  deleteAllStudents,
  deleteAllAttendance,
  resetDatabase,
  // Attendance Sessions
  createAttendanceSession,
  getAttendanceSessions,
  updateAttendanceSession,
  deleteAttendanceSession,
  // Student Management
  updateStudent,
  deleteStudent,
  deleteStudentByRollNumber,
  // WebSocket
  connectWebSocket,
  // Health
  healthCheck,
  // SMS
  sendSms,
  getSmsLogs,
};
