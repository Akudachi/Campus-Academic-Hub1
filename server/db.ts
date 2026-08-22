import {
  User,
  Teacher,
  Student,
  Department,
  Semester,
  Subject,
  TeacherSubjectAssignment,
  AttendanceSession,
  AttendanceRecord,
  Assignment,
  AssignmentSubmissionStatus,
  TestMarkSheet,
  TestMark,
  Notice,
  Event,
  Notification,
  TimetableUpload,
  StudentImportBatch,
  AuditLog,
  CampusSettings,
} from '../src/types';

// In-Memory Database Store
export interface DatabaseStore {
  settings: CampusSettings;
  users: User[];
  teachers: Teacher[];
  students: Student[];
  departments: Department[];
  semesters: Semester[];
  subjects: Subject[];
  teacherSubjectAssignments: TeacherSubjectAssignment[];
  attendanceSessions: AttendanceSession[];
  attendanceRecords: AttendanceRecord[];
  assignments: Assignment[];
  assignmentSubmissionStatuses: AssignmentSubmissionStatus[];
  testMarkSheets: TestMarkSheet[];
  testMarks: TestMark[];
  notices: Notice[];
  events: Event[];
  notifications: Notification[];
  timetableUploads: TimetableUpload[];
  studentImportBatches: StudentImportBatch[];
  auditLogs: AuditLog[];
}

function initializeCleanData(): DatabaseStore {
  const departments: Department[] = [
    {
      id: 'dept-ece',
      name: 'Electronics & Communication Engineering',
      code: 'ECE',
      headOfDepartment: 'Dr. B. S. Halakarnimath',
      description: 'VLSI design, embedded systems, signal processing, IoT, and communication networks.',
      establishedYear: '2008',
      createdAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 'dept-cse',
      name: 'Computer Science & Engineering',
      code: 'CSE',
      headOfDepartment: 'Dr. S. V. Viraktamath',
      description: 'Core computing, algorithms, cloud systems, and software engineering.',
      establishedYear: '2008',
      createdAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 'dept-aiml',
      name: 'Artificial Intelligence & Machine Learning',
      code: 'AI-ML',
      headOfDepartment: 'Dr. V. M. Sheelavantar',
      description: 'Deep learning, neural architectures, computer vision, data science, and LLM applications.',
      establishedYear: '2022',
      createdAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 'dept-ise',
      name: 'Information Science & Engineering',
      code: 'ISE',
      headOfDepartment: 'Dr. P. R. Hampannavar',
      description: 'Information security, database engineering, web architectures, and distributed computing.',
      establishedYear: '2010',
      createdAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 'dept-mech',
      name: 'Mechanical Engineering',
      code: 'MECH',
      headOfDepartment: 'Dr. S. B. Shivakumar',
      description: 'Robotics, thermal systems, computer-aided manufacturing, and finite element modeling.',
      establishedYear: '2008',
      createdAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 'dept-civil',
      name: 'Civil Engineering',
      code: 'CIVIL',
      headOfDepartment: 'Dr. S. C. Kamate',
      description: 'Structural mechanics, geotechnical surveying, environmental hydrology, and urban planning.',
      establishedYear: '2008',
      createdAt: '2026-01-01T00:00:00Z',
    },
  ];

  function buildStandardSemesters(departmentsList: Department[], academicYear = '2026-2027'): Semester[] {
    const sems: Semester[] = [];
    departmentsList.forEach((dept) => {
      for (let semNum = 1; semNum <= 8; semNum++) {
        sems.push({
          id: `sem-${dept.code.toLowerCase()}-${semNum}`,
          number: semNum,
          academicYear,
          departmentCode: dept.code,
          section: 'A',
          status: [2, 4, 6, 8].includes(semNum) ? 'active' : 'setup',
          createdAt: '2026-01-10T08:00:00Z',
        });
      }
    });
    return sems;
  }

  const semesters: Semester[] = buildStandardSemesters(departments, '2026-2027');

  const users: User[] = [
    {
      id: 'usr-admin-1',
      name: 'Campus Administrator',
      email: 'ecedept123456@gmail.com',
      role: 'admin',
      status: 'active',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'usr-admin-2',
      name: 'College Administration Desk',
      email: 'admin@klecet.edu.in',
      role: 'admin',
      status: 'active',
      createdAt: new Date().toISOString(),
    },
  ];

  const defaultSettings: CampusSettings = {
    institutionName: "K.L.E. Society's KLE College of Engineering and Technology",
    shortName: 'KLECET',
    campusCode: 'KLECET-2026',
    academicYear: '2026-2027',
    currentSemesterTerm: 'Even Semester (Semesters 2, 4, 6, 8)',
    semesterTermType: 'even',
    minAttendanceWarning: 75,
    adminContactEmail: 'ecedept123456@gmail.com',
    systemStatus: 'operational',
  };

  const initialNotices: Notice[] = [
    {
      id: 'notice-klecet-welcome',
      title: "Welcome to K.L.E. College of Engineering and Technology Academic Portal",
      body: "The centralized digital academic hub for K.L.E. College of Engineering and Technology is now initialized for Academic Year 2026-2027. Faculty members and administrators can manage attendance sessions, continuous internal evaluations (CIE), curriculum timetables, and student records.",
      createdBy: 'usr-admin-1',
      authorName: 'College Administration',
      audienceType: 'everyone',
      priority: 'normal',
      createdAt: new Date().toISOString(),
    },
  ];

  const initialNotifications: Notification[] = [
    {
      id: 'notif-ready',
      userId: 'usr-admin-1',
      type: 'system',
      title: 'Portal Ready for Production Operations',
      message: 'All demo data has been purged. K.L.E. College of Engineering and Technology is ready for faculty allocation, student enrollment, and timetable generation.',
      link: '/admin',
      read: false,
      createdAt: new Date().toISOString(),
    },
  ];

  const initialAuditLogs: AuditLog[] = [
    {
      id: 'aud-1',
      userId: 'usr-admin-1',
      userName: 'Campus Administrator',
      userRole: 'admin',
      action: 'SYSTEM_INITIALIZED',
      details: "K.L.E. Society's KLE College of Engineering and Technology academic portal initialized with clean state (0 demo records).",
      timestamp: new Date().toISOString(),
    },
  ];

  return {
    settings: defaultSettings,
    users,
    teachers: [],
    students: [],
    departments,
    semesters,
    subjects: [],
    teacherSubjectAssignments: [],
    attendanceSessions: [],
    attendanceRecords: [],
    assignments: [],
    assignmentSubmissionStatuses: [],
    testMarkSheets: [],
    testMarks: [],
    notices: initialNotices,
    events: [],
    notifications: initialNotifications,
    timetableUploads: [],
    studentImportBatches: [],
    auditLogs: initialAuditLogs,
  };
}

function initializeSampleDemoData(): DatabaseStore {
  return initializeCleanData();
}

// Global Singleton DB store
class DatabaseService {
  private store: DatabaseStore;
  private readonly startTime: number;

  constructor() {
    this.startTime = Date.now();
    this.store = initializeCleanData();
  }

  public getStore(): DatabaseStore {
    return this.store;
  }

  public getUptimeSeconds(): number {
    return Math.floor((Date.now() - this.startTime) / 1000);
  }

  public updateSettings(partial: Partial<CampusSettings>): CampusSettings {
    this.store.settings = {
      ...this.store.settings,
      ...partial,
    };
    return this.store.settings;
  }

  public resetToClean(): void {
    this.store = initializeCleanData();
  }

  public resetToSeed(): void {
    this.store = initializeCleanData();
  }

  public loadSampleData(): void {
    this.store = initializeSampleDemoData();
  }

  public restoreData(newData: Partial<DatabaseStore>): { success: boolean; message: string } {
    if (!newData || typeof newData !== 'object') {
      throw new Error('Invalid backup data format.');
    }

    // Merge or replace core arrays safely
    if (newData.settings) this.store.settings = { ...this.store.settings, ...newData.settings };
    if (Array.isArray(newData.users)) this.store.users = newData.users;
    if (Array.isArray(newData.teachers)) this.store.teachers = newData.teachers;
    if (Array.isArray(newData.students)) this.store.students = newData.students;
    if (Array.isArray(newData.departments)) this.store.departments = newData.departments;
    if (Array.isArray(newData.semesters)) this.store.semesters = newData.semesters;
    if (Array.isArray(newData.subjects)) this.store.subjects = newData.subjects;
    if (Array.isArray(newData.teacherSubjectAssignments)) this.store.teacherSubjectAssignments = newData.teacherSubjectAssignments;
    if (Array.isArray(newData.attendanceSessions)) this.store.attendanceSessions = newData.attendanceSessions;
    if (Array.isArray(newData.attendanceRecords)) this.store.attendanceRecords = newData.attendanceRecords;
    if (Array.isArray(newData.assignments)) this.store.assignments = newData.assignments;
    if (Array.isArray(newData.assignmentSubmissionStatuses)) this.store.assignmentSubmissionStatuses = newData.assignmentSubmissionStatuses;
    if (Array.isArray(newData.testMarkSheets)) this.store.testMarkSheets = newData.testMarkSheets;
    if (Array.isArray(newData.testMarks)) this.store.testMarks = newData.testMarks;
    if (Array.isArray(newData.notices)) this.store.notices = newData.notices;
    if (Array.isArray(newData.events)) this.store.events = newData.events;
    if (Array.isArray(newData.notifications)) this.store.notifications = newData.notifications;
    if (Array.isArray(newData.auditLogs)) this.store.auditLogs = newData.auditLogs;

    return { success: true, message: 'Campus database restored successfully.' };
  }

  // Audit Logger
  public logAudit(userId: string, userName: string, userRole: any, action: string, details: string) {
    this.store.auditLogs.unshift({
      id: `aud-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      userId,
      userName,
      userRole,
      action,
      details,
      timestamp: new Date().toISOString(),
    });
  }

  // Helper to create notifications for target audience
  public notifyUsers(userIds: string[], type: any, title: string, message: string, link?: string) {
    const now = new Date().toISOString();
    userIds.forEach((uid) => {
      this.store.notifications.unshift({
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        userId: uid,
        type,
        title,
        message,
        link,
        read: false,
        createdAt: now,
      });
    });
  }
}

export const db = new DatabaseService();
