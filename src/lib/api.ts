import {
  User,
  Teacher,
  Student,
  Semester,
  Subject,
  TeacherSubjectAssignment,
  AttendanceSession,
  Assignment,
  TestMarkSheet,
  Notice,
  Event,
  Notification,
  ExtractedTimetableRow,
  StudentImportRowResult,
  TeacherImportRowResult,
  StudentDashboardSummary,
  CampusSettings,
  SystemStatusInfo,
  Department,
} from '../types';
import { storageService } from './storageService';

let currentToken: string | null = localStorage.getItem('cah_token') || 'usr-admin-1';
let currentUserId: string | null = localStorage.getItem('cah_user_id') || 'usr-admin-1';

export function setAuthToken(token: string | null, userId?: string | null) {
  currentToken = token;
  currentUserId = userId || token;
  if (token) {
    localStorage.setItem('cah_token', token);
    if (userId) localStorage.setItem('cah_user_id', userId);
  } else {
    localStorage.removeItem('cah_token');
    localStorage.removeItem('cah_user_id');
  }
}

export function getAuthToken(): string | null {
  return currentToken;
}

export function getCurrentUserId(): string | null {
  return currentUserId;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const isGet = !options.method || options.method.toUpperCase() === 'GET';
  const cacheKey = `req_${endpoint}_${currentUserId || 'anon'}`;

  // If offline and making a GET request, serve cached data if available
  if (!storageService.isOnline()) {
    if (isGet) {
      const cached = storageService.get<T>(cacheKey);
      if (cached) {
        return cached.data;
      }
    } else {
      throw new Error('You are currently offline. Changes cannot be saved until network is restored.');
    }
  }

  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  if (currentToken) {
    headers.set('Authorization', `Bearer ${currentToken}`);
  }
  if (currentUserId) {
    headers.set('x-user-id', currentUserId);
  }

  try {
    const response = await fetch(endpoint, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP Error ${response.status}: ${response.statusText}`);
    }

    // Automatically cache successful GET responses to LocalStorage
    if (isGet) {
      storageService.save<T>(cacheKey, data);
    }

    return data;
  } catch (err: any) {
    // If network error/offline occurs during fetch, gracefully fallback to Local Storage Cache
    if (isGet) {
      const cached = storageService.get<T>(cacheKey);
      if (cached) {
        console.info(`[Offline Mode] Falling back to cached data for: ${endpoint}`);
        return cached.data;
      }
    }
    throw err;
  }
}

export const api = {
  // Auth
  login: (credentials: { email?: string; userId?: string; role?: string }) =>
    request<{ token: string; user: User; teacher?: Teacher; student?: Student }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  getMe: () => request<{ user: User; teacher?: Teacher; student?: Student }>('/api/me'),

  getPersonas: () =>
    request<{
      personas: {
        user: User;
        teacher?: Teacher;
        student?: Student;
        displaySub: string;
      }[];
    }>('/api/auth/personas'),

  // Admin: Teachers
  getTeachers: () =>
    request<{ teachers: (Teacher & { user: User; assignedSubjectsCount: number })[]; total: number }>('/api/admin/teachers'),

  createTeacher: (payload: {
    name: string;
    email: string;
    department: string;
    teacherCode: string;
    designation?: string;
    qualification?: string;
    initialSubjectId?: string;
    initialSemesterId?: string;
  }) =>
    request<{ teacher: Teacher & { user: User } }>('/api/admin/teachers', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  assignTeacherSubject: (teacherId: string, payload: { subjectId: string; semesterId?: string }) =>
    request<{ success: boolean; assignment: any }>('/api/admin/teachers/' + teacherId + '/assign-subject', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  bulkCreateTeachers: (teachers: any[]) =>
    request<{ createdCount: number; errors: string[]; totalProcessed: number; updatedCount?: number }>('/api/admin/teachers/bulk', {
      method: 'POST',
      body: JSON.stringify({ teachers }),
    }),

  validateTeacherImport: (payload: { rawText?: string; rows?: any[]; fileName?: string }) =>
    request<{
      batchId: string;
      totalRows: number;
      validRows: number;
      invalidRows: number;
      results: TeacherImportRowResult[];
    }>('/api/admin/teachers/import/validate', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  commitTeacherImport: (payload: { batchId?: string; rows?: TeacherImportRowResult[] }) =>
    request<{ success: boolean; insertedCount: number; updatedCount: number; totalCommitted: number }>(
      '/api/admin/teachers/import/commit',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    ),

  // Admin: Students
  getStudents: () =>
    request<{ students: (Student & { user: User })[]; total: number }>('/api/admin/students'),

  createStudent: (payload: {
    usn: string;
    name: string;
    department: string;
    semester: number;
    section: string;
    email?: string;
  }) =>
    request<{ success: boolean; student: Student & { user: User } }>('/api/admin/students', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getSubjects: () =>
    request<{ subjects: (Subject & { departmentCode?: string; departmentName?: string })[] }>('/api/admin/subjects'),

  // Admin: Students Import
  validateStudentImport: (payload: {
    rawText?: string;
    rows?: any[];
    fileName?: string;
    department?: string;
    semester?: number;
    section?: string;
  }) =>
    request<{
      batchId: string;
      totalRows: number;
      validRows: number;
      invalidRows: number;
      results: StudentImportRowResult[];
    }>('/api/admin/students/import/validate', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  commitStudentImport: (payload: { batchId?: string; rows?: StudentImportRowResult[] }) =>
    request<{ success: boolean; insertedCount: number; updatedCount: number; totalCommitted: number }>(
      '/api/admin/students/import/commit',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    ),

  // Admin: Timetable AI
  uploadTimetable: (payload: {
    fileName?: string;
    rawText?: string;
    fileContent?: string;
    imageData?: string;
    imageMimeType?: string;
    semester?: number;
    departmentCode?: string;
  }) =>
    request<{
      uploadId: string;
      extractedRows: ExtractedTimetableRow[];
      totalRows: number;
      availableTeachers: (Teacher & { user?: User })[];
      hasImage?: boolean;
    }>('/api/admin/timetable/upload', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getTimetableReview: (id: string) =>
    request<{ upload: any; teachers: (Teacher & { user?: User })[] }>(`/api/admin/timetable/${id}/review`),

  confirmTimetable: (id: string, confirmedRows: ExtractedTimetableRow[]) =>
    request<{
      success: boolean;
      createdAssignments: number;
      createdSubjectsCount: number;
      createdProfessorsCount: number;
      totalSubjects: number;
      totalTeachers: number;
      totalAssignments: number;
    }>(`/api/admin/timetable/${id}/confirm`, {
      method: 'POST',
      body: JSON.stringify({ confirmedRows }),
    }),

  // Admin: Semesters
  getSemesters: () => request<{ semesters: (Semester & { name: string; semesterNumber: number; startDate: string; endDate: string; subjectsCount: number; studentsCount: number; teacherAssignmentsCount: number })[] }>('/api/admin/semesters'),

  createSemester: (payload: {
    number: number;
    departmentCode: string;
    section: string;
    academicYear: string;
    status?: 'setup' | 'active';
  }) =>
    request<{ success: boolean; semester: Semester }>('/api/admin/semesters', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  deleteSemester: (semesterId: string) =>
    request<{ success: boolean; message: string }>(`/api/admin/semesters/${semesterId}`, {
      method: 'DELETE',
    }),

  getSemesterStudents: (semesterId: string) =>
    request<{
      students: Array<{
        id: string;
        userId: string;
        usn: string;
        name: string;
        email: string;
        department: string;
        currentSemester: number;
        section: string;
        attendancePercentage: number;
      }>;
      total: number;
      semester: Semester;
    }>(`/api/admin/semesters/${semesterId}/students`),

  activateSemester: (semesterId: string) =>
    request<{ success: boolean; semester: Semester }>('/api/admin/semesters/activate', {
      method: 'POST',
      body: JSON.stringify({ semesterId }),
    }),

  completeSemester: (semesterId: string) =>
    request<{ success: boolean; message: string }>(`/api/admin/semesters/${semesterId}/complete`, {
      method: 'POST',
    }),

  completeAndPromoteSemester: (
    semesterId: string,
    payload: {
      targetSemesterNumber?: number;
      targetAcademicYear?: string;
      studentIds?: string[];
      activateNextSemester?: boolean;
    }
  ) =>
    request<{
      success: boolean;
      message: string;
      promotedCount: number;
      archivedSemester: Semester;
      nextSemester?: Semester;
    }>(`/api/admin/semesters/${semesterId}/complete-and-promote`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Admin: Notices & Events
  createNotice: (payload: {
    title: string;
    body: string;
    audienceType: 'everyone' | 'department' | 'semester';
    audienceTargetId?: string | null;
    priority?: 'normal' | 'urgent';
  }) =>
    request<{ notice: Notice; notifiedStudentsCount: number }>('/api/admin/notices', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  createEvent: (payload: {
    title: string;
    description: string;
    date: string;
    venue: string;
    posterImageUrl?: string;
    organizer?: string;
  }) =>
    request<{ event: Event }>('/api/admin/events', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Admin: Reports
  getAttendanceReport: (params: {
    department?: string;
    semester?: string;
    belowThreshold?: string;
    search?: string;
  }) => {
    const query = new URLSearchParams(params as any).toString();
    return request<{
      students: any[];
      total: number;
      metrics: {
        totalStudents: number;
        below80Count: number;
        below50Count: number;
        avgAttendance: number;
      };
    }>(`/api/admin/reports/attendance?${query}`);
  },

  getAssignmentsReport: () =>
    request<{ assignments: any[] }>('/api/admin/reports/assignments'),

  getMarksReport: () =>
    request<{ sheets: any[] }>('/api/admin/reports/marks'),

  getAuditLogs: () =>
    request<{ logs: any[] }>('/api/admin/audit-logs'),

  // Teacher: Subjects & Attendance
  getTeacherSubjects: () =>
    request<{ subjects: any[]; teacher: Teacher }>('/api/teacher/subjects'),

  getTeacherAttendanceSessions: (subjectId?: string) =>
    request<{ sessions: any[] }>(`/api/teacher/attendance/sessions${subjectId ? `?subjectId=${subjectId}` : ''}`),

  getAttendanceRoster: (subjectId: string, semesterId?: string) =>
    request<{
      subject: Subject;
      semester: Semester;
      students: { studentId: string; usn: string; name: string; currentPercentage: number; defaultStatus: 'present' }[];
    }>(`/api/teacher/attendance/roster?subjectId=${subjectId}${semesterId ? `&semesterId=${semesterId}` : ''}`),

  createAttendanceSession: (payload: {
    subjectId: string;
    semesterId?: string;
    date: string;
    period?: string;
    topic?: string;
    records: { studentId: string; status: 'present' | 'absent' }[];
    submitImmediately: boolean;
  }) =>
    request<{ session: AttendanceSession; recordsCount: number }>('/api/teacher/attendance/sessions', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  submitAttendanceSession: (sessionId: string) =>
    request<{ success: boolean; message: string; session: AttendanceSession }>(
      `/api/teacher/attendance/sessions/${sessionId}/submit`,
      { method: 'POST' }
    ),

  getTeacherAttendanceAnalytics: (subjectId?: string, filter?: string) => {
    const query = new URLSearchParams();
    if (subjectId) query.set('subjectId', subjectId);
    if (filter) query.set('filter', filter);
    return request<{
      students: any[];
      totalClassesConducted: number;
      below80Count: number;
      below50Count: number;
    }>(`/api/teacher/attendance/analytics?${query.toString()}`);
  },

  // Teacher: Assignments (NO MARKS)
  getTeacherAssignments: (subjectId?: string) =>
    request<{ assignments: any[] }>(`/api/teacher/assignments${subjectId ? `?subjectId=${subjectId}` : ''}`),

  createAssignment: (payload: {
    subjectId: string;
    semesterId?: string;
    title: string;
    instructions: string;
    dueDate: string;
    pdfData?: string;
    pdfFileName?: string;
  }) =>
    request<{ assignment: Assignment; enrolledCount: number }>('/api/teacher/assignments', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getAssignmentRoster: (assignmentId: string) =>
    request<{
      assignment: Assignment;
      subject: Subject;
      students: { submissionId: string; studentId: string; usn: string; name: string; status: 'submitted' | 'not_submitted'; markedAt: string }[];
    }>(`/api/teacher/assignments/${assignmentId}/roster`),

  updateSubmissionStatus: (assignmentId: string, studentId: string, status: 'submitted' | 'not_submitted') =>
    request<{ success: boolean; record: any }>(`/api/teacher/assignments/${assignmentId}/submission-status`, {
      method: 'PATCH',
      body: JSON.stringify({ studentId, status }),
    }),

  // Teacher: Test Marks
  getTeacherMarkSheets: (subjectId?: string) =>
    request<{ sheets: any[] }>(`/api/teacher/marks/sheets${subjectId ? `?subjectId=${subjectId}` : ''}`),

  createMarkSheet: (payload: {
    subjectId: string;
    semesterId?: string;
    testName: string;
    maxMarks: number;
    published?: boolean;
    initialMarks?: { studentId: string; marks: number }[];
  }) =>
    request<{ sheet: TestMarkSheet }>('/api/teacher/marks/sheets', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getMarkSheetDetails: (sheetId: string) =>
    request<{
      sheet: TestMarkSheet;
      subject: Subject;
      students: { studentId: string; usn: string; name: string; marks: number; hasEntry: boolean }[];
    }>(`/api/teacher/marks/sheets/${sheetId}`),

  updateMarks: (sheetId: string, studentMarks: { studentId: string; marks: number }[]) =>
    request<{ success: boolean; message: string }>(`/api/teacher/marks/sheets/${sheetId}/marks`, {
      method: 'PATCH',
      body: JSON.stringify({ studentMarks }),
    }),

  publishMarkSheet: (sheetId: string, published: boolean) =>
    request<{ success: boolean; sheet: TestMarkSheet }>(`/api/teacher/marks/sheets/${sheetId}/publish`, {
      method: 'POST',
      body: JSON.stringify({ published }),
    }),

  // Student (100% Read Only)
  getStudentDashboard: () => request<StudentDashboardSummary>('/api/student/dashboard'),
  getStudentAttendance: () => request<{
    overallPercentage: number;
    totalAllClasses: number;
    totalAllAttended: number;
    subjects: any[];
  }>('/api/student/attendance'),
  getStudentAssignments: () => request<{ assignments: any[] }>('/api/student/assignments'),
  getStudentMarks: () => request<{ testResults: any[] }>('/api/student/marks'),
  getStudentProfile: () => request<{ student: any }>('/api/student/profile'),
  getStudentNotices: () => request<{ notices: Notice[] }>('/api/student/notices'),
  getStudentEvents: () => request<{ events: Event[] }>('/api/student/events'),

  // Common: Notifications
  getNotifications: () => request<{ notifications: Notification[]; unreadCount: number }>('/api/notifications'),
  markNotificationRead: (id: string) => request<{ success: boolean }>(`/api/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () => request<{ success: boolean }>('/api/notifications/read-all', { method: 'POST' }),

  // Academic Departments & Branches
  getDepartments: () =>
    request<{ departments: Department[]; total: number }>('/api/departments'),
  getAdminDepartments: () =>
    request<{ departments: Department[]; total: number }>('/api/admin/departments'),
  createDepartment: (payload: {
    name: string;
    code: string;
    description?: string;
    headOfDepartment?: string;
    establishedYear?: string;
  }) =>
    request<{ success: boolean; department: Department; message: string }>('/api/admin/departments', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateDepartment: (id: string, payload: Partial<Department>) =>
    request<{ success: boolean; department: Department }>(`/api/admin/departments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteDepartment: (id: string, force: boolean = false) =>
    request<{ success: boolean; message: string; deletedDepartment: Department }>(`/api/admin/departments/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ force }),
    }),

  // Campus Settings & System Health / Deployment
  getCampusSettings: () => request<{ settings: CampusSettings }>('/api/settings'),
  getAdminCampusSettings: () => request<{ settings: CampusSettings }>('/api/admin/settings'),
  updateCampusSettings: (payload: Partial<CampusSettings>) =>
    request<{ success: boolean; settings: CampusSettings }>('/api/admin/settings', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getSystemStatus: () => request<{ status: SystemStatusInfo }>('/api/admin/system/status'),
  restoreDatabase: (data: any) =>
    request<{ success: boolean; message: string }>('/api/admin/restore', {
      method: 'POST',
      body: JSON.stringify({ data }),
    }),
  resetDatabase: () =>
    request<{ success: boolean; message: string }>('/api/admin/reset', {
      method: 'POST',
    }),
  loadSampleDataset: () =>
    request<{ success: boolean; message: string }>('/api/admin/load-demo', {
      method: 'POST',
    }),
};
