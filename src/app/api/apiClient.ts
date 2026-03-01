// API client for backend communication
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface LoginPayload {
  email: string;
  password: string;
  role: 'admin' | 'faculty';
}

export interface User {
  id: number;
  name: string;
  email: string;
  department: string;
  role: 'admin' | 'faculty';
}

export interface LoginResponse {
  status: 'success' | 'error';
  message?: string;
  user?: User;
}

export interface RegisterPayload {
  rollNumber: string;
  name: string;
  department: string;
  imageFile: File;
}

export interface FacultyRegisterPayload {
  email: string;
  password: string;
  name: string;
  department: string;
}

export interface AdminRegisterPayload {
  email: string;
  password: string;
  name: string;
  department: string;
}

export interface RegisterResponse {
  status: 'success' | 'error';
  message: string;
}

export interface Student {
  rollNo: string;
  name: string;
  department: string;
  year?: string;
  phone?: string;
  status?: string;
  id?: number;
}

export interface Faculty {
  id: number;
  name: string;
  email: string;
  department: string;
  joinDate?: string;
}

export interface AttendanceRecord {
  id: number;
  studentName: string;
  rollNumber: string;
  timestamp: string;
}

/**
 * Login user (admin or faculty)
 */
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

/**
 * Register new faculty member
 */
export async function registerFacultyMember(payload: FacultyRegisterPayload): Promise<RegisterResponse> {
  const formData = new FormData();
  formData.append('email', payload.email);
  formData.append('password', payload.password);
  formData.append('name', payload.name);
  formData.append('department', payload.department);

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

/**
 * Register a new admin
 */
export async function registerAdmin(payload: AdminRegisterPayload): Promise<RegisterResponse> {
  const formData = new FormData();
  formData.append('email', payload.email);
  formData.append('password', payload.password);
  formData.append('name', payload.name);
  formData.append('department', payload.department);

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

/**
 * Register a new student with face recognition
 */
export async function registerStudent(payload: RegisterPayload): Promise<RegisterResponse> {
  const formData = new FormData();
  formData.append('roll_number', payload.rollNumber);
  formData.append('name', payload.name);
  formData.append('department', payload.department);
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

/**
 * Recognize a face and get attendance
 */
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

/**
 * Get all students
 */
export async function getStudents(): Promise<Student[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/students`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.students || [];
  } catch (error) {
    console.warn('Could not fetch students from backend:', error);
    return [];
  }
}

/**
 * Get all faculty members
 */
export async function getFaculty(): Promise<Faculty[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/faculty`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.faculty || [];
  } catch (error) {
    console.warn('Could not fetch faculty from backend:', error);
    return [];
  }
}

/**
 * Get attendance records
 */
export async function getAttendance(limit: number = 100): Promise<AttendanceRecord[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/attendance?limit=${limit}`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.attendance || [];
  } catch (error) {
    console.warn('Could not fetch attendance from backend:', error);
    return [];
  }
}

/**
 * Mark attendance for a student
 */
export async function markAttendance(studentId: number): Promise<RegisterResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/attendance/${studentId}`, {
      method: 'POST',
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

/**
 * Connect to WebSocket for real-time updates
 */
export function connectWebSocket(onMessage: (data: any) => void): WebSocket {
  const wsProtocol = API_BASE_URL.startsWith('https') ? 'wss' : 'ws';
  const wsUrl = API_BASE_URL.replace(/^https?/, wsProtocol) + '/ws';

  const ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    console.log('WebSocket connected');
    ws.send(JSON.stringify({ type: 'ping' }));
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
}

/**
 * Health check
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/`, {
      method: 'GET',
    });
    return response.ok;
  } catch (error) {
    console.warn('Backend health check failed:', error);
    return false;
  }
}

/**
 * Delete all students from database (admin only)
 */
export async function deleteAllStudents(): Promise<{ status: string; message: string }> {
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

/**
 * Delete all attendance records (admin only)
 */
export async function deleteAllAttendance(): Promise<{ status: string; message: string }> {
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

/**
 * Reset entire database (admin only)
 */
export async function resetDatabase(): Promise<{ status: string; message: string }> {
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

/**
 * Consolidated API client object for easier importing
 */
export const apiClient = {
  loginUser,
  registerStudent,
  registerFacultyMember,
  registerAdmin,
  recognizeFace,
  getStudents,
  getFaculty,
  getAttendance,
  markAttendance,
  connectWebSocket,
  healthCheck,
  deleteAllStudents,
  deleteAllAttendance,
  resetDatabase,
};

