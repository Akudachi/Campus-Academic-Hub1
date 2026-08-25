export type UserRole = 'admin' | 'teacher' | 'student';
export type UserStatus = 'active' | 'disabled';
export type SemesterStatus = 'setup' | 'active' | 'archived';
export type AttendanceStatus = 'present' | 'absent';
export type SubmissionStatus = 'submitted' | 'not_submitted';
export type NoticeAudienceType = 'everyone' | 'department' | 'semester';
export type NotificationType = 'attendance' | 'assignment' | 'marks' | 'notice' | 'event' | 'system';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  phone?: string;
  createdAt: string;
}

export interface TeacherAssignedSubjectSummary {
  assignmentId: string;
  subjectId: string;
  semesterId: string;
  code: string;
  name: string;
  semesterNumber: number;
  departmentCode: string;
}

export interface Teacher {
  id: string;
  userId: string;
  teacherCode: string; // unique, e.g. T001
  department: string;
  designation?: string;
  qualification?: string;
  user?: User;
  assignedSubjects?: TeacherAssignedSubjectSummary[];
  assignedSubjectsCount?: number;
}

export interface Student {
  id: string;
  userId: string;
  usn: string; // unique student identifier, e.g. 2KL23EC001
  department: string;
  currentSemester: number;
  section: string;
  user?: User;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  headOfDepartment?: string;
  establishedYear?: string;
  createdAt?: string;
  studentsCount?: number;
  teachersCount?: number;
  semestersCount?: number;
  subjectsCount?: number;
}

export interface Semester {
  id: string;
  number: number;
  academicYear: string;
  departmentCode: string;
  section: string;
  status: SemesterStatus;
  createdAt: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  departmentId: string;
  semesterNumber: number;
  credits?: number;
}

export interface TeacherSubjectAssignment {
  id: string;
  teacherId: string;
  subjectId: string;
  semesterId: string;
  createdFrom: 'ai_timetable' | 'manual';
  confirmedByAdmin: boolean;
  teacher?: Teacher;
  subject?: Subject;
  semester?: Semester;
}

export interface AttendanceSession {
  id: string;
  subjectId: string;
  teacherId: string;
  semesterId: string;
  date: string; // YYYY-MM-DD
  period?: string;
  topic?: string;
  createdAt: string;
  submitted: boolean; // Once true, immutable
  subject?: Subject;
  teacher?: Teacher;
  recordsCount?: {
    total: number;
    present: number;
    absent: number;
  };
}

export interface AttendanceRecord {
  id: string;
  attendanceSessionId: string;
  studentId: string;
  status: AttendanceStatus;
  student?: Student;
}

export interface Assignment {
  id: string;
  subjectId: string;
  teacherId: string;
  semesterId: string;
  title: string;
  instructions: string;
  dueDate: string;
  createdAt: string;
  pdfData?: string;
  pdfFileName?: string;
  subject?: Subject;
  teacher?: Teacher;
  stats?: {
    totalStudents: number;
    submittedCount: number;
    notSubmittedCount: number;
  };
}

export interface AssignmentSubmissionStatus {
  id: string;
  assignmentId: string;
  studentId: string;
  status: SubmissionStatus;
  markedAt: string;
  student?: Student;
}

export interface TestMarkSheet {
  id: string;
  subjectId: string;
  teacherId: string;
  semesterId: string;
  testName: string;
  maxMarks: number;
  published: boolean;
  createdAt: string;
  updatedAt?: string;
  subject?: Subject;
  teacher?: Teacher;
  stats?: {
    averageMarks: number;
    highestMarks: number;
    lowestMarks: number;
    totalEvaluated: number;
  };
}

export interface TestMark {
  id: string;
  testMarkSheetId: string;
  studentId: string;
  marks: number;
  student?: Student;
}

export interface Notice {
  id: string;
  title: string;
  body: string;
  createdBy: string;
  authorName?: string;
  audienceType: NoticeAudienceType;
  audienceTargetId?: string | null; // e.g. dept code or semester number
  priority?: 'normal' | 'urgent';
  date?: string;
  publishedAt?: string;
  createdAt: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  venue: string;
  posterImageUrl?: string;
  createdBy: string;
  organizer?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export interface ExtractedTimetableRow {
  id: string;
  semester: number;
  subjectName: string;
  subjectCode: string;
  teacherNameRaw: string;
  teacherCode?: string;
  matchedTeacherId: string | null;
  matchedTeacherName?: string;
  confidence: number; // 0.0 to 1.0
  confirmed: boolean;
  departmentCode?: string;
  credits?: number;
  isNewProfessor?: boolean;
  professorEmail?: string;
  weeklyHours?: number;
}

export interface TimetableUpload {
  id: string;
  uploadedFileRef: string;
  status: 'processing' | 'ready_for_review' | 'confirmed';
  createdAt: string;
  extractedRows: ExtractedTimetableRow[];
}

export interface StudentImportRowResult {
  rowNumber: number;
  usn: string;
  name: string;
  email: string;
  department: string;
  semester: number;
  section: string;
  isValid: boolean;
  isExisting?: boolean;
  errors: string[];
}

export interface StudentImportBatch {
  id: string;
  uploadedFileRef: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  status: 'preview' | 'committed';
  createdAt: string;
  results: StudentImportRowResult[];
}

export interface TeacherImportRowResult {
  rowNumber: number;
  teacherCode: string;
  name: string;
  department: string;
  email: string;
  designation: string;
  qualification: string;
  subjectCode?: string;
  subjectName?: string;
  isValid: boolean;
  isExisting?: boolean;
  errors: string[];
}

export interface TeacherImportBatch {
  id: string;
  uploadedFileRef: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  status: 'preview' | 'committed';
  createdAt: string;
  results: TeacherImportRowResult[];
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  details: string;
  timestamp: string;
}

// Student View Aggregations
export interface StudentDashboardSummary {
  student: Student;
  overallAttendancePercentage: number;
  totalClasses: number;
  attendedClasses: number;
  pendingAssignmentsCount: number;
  totalAssignmentsCount: number;
  latestPublishedTest?: {
    testName: string;
    subjectName: string;
    subjectCode: string;
    marks: number;
    maxMarks: number;
    percentage: number;
  };
  unreadNoticesCount: number;
  upcomingEventsCount: number;
  subjectSummaries: {
    subjectId: string;
    subjectName: string;
    subjectCode: string;
    teacherName: string;
    totalClasses: number;
    attendedClasses: number;
    percentage: number;
    status: 'good' | 'warning' | 'critical';
  }[];
}

export interface CampusSettings {
  institutionName: string;
  shortName: string;
  campusCode: string;
  academicYear: string;
  currentSemesterTerm: string;
  semesterTermType?: 'even' | 'odd' | 'custom';
  minAttendanceWarning: number;
  adminContactEmail: string;
  systemStatus: 'ready' | 'operational';
}

export interface SupabaseStatusInfo {
  configured: boolean;
  connected: boolean;
  provider: 'supabase_postgres' | 'supabase_rest' | 'local_fallback';
  databaseHost: string;
  lastSyncTime: string | null;
  status: 'connected' | 'syncing' | 'error' | 'local_only';
  records: {
    students: number;
    teachers: number;
    departments: number;
    semesters: number;
    subjects: number;
    attendanceSessions: number;
    attendanceRecords: number;
    testMarks: number;
    assignments: number;
    notices: number;
  };
  error?: string;
}

export interface SystemStatusInfo {
  serverTime: string;
  uptimeSeconds: number;
  nodeVersion: string;
  environment: string;
  geminiConfigured: boolean;
  databaseStats: {
    usersCount: number;
    teachersCount: number;
    studentsCount: number;
    subjectsCount: number;
    semestersCount: number;
    attendanceSessionsCount: number;
    assignmentsCount: number;
    testMarkSheetsCount: number;
    noticesCount: number;
    eventsCount: number;
  };
}
