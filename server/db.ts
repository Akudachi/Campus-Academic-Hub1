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

  const semesters: Semester[] = buildStandardSemesters(departments, defaultSettings.academicYear);
  const subjects: Subject[] = buildStandardSubjects(departments);

  function buildStandardSubjects(departmentsList: Department[]): Subject[] {
    const subs: Subject[] = [];
    
    // ECE
    const eceDept = departmentsList.find((d) => d.code === 'ECE');
    const eceId = eceDept ? eceDept.id : 'dept-ece';
    subs.push(
      { id: 'sub-bec701', code: 'BEC701', name: 'Microwave Engineering and Antenna Theory', departmentId: eceId, semesterNumber: 7, credits: 4 },
      { id: 'sub-bec702', code: 'BEC702', name: 'Computer Networks and Protocols', departmentId: eceId, semesterNumber: 7, credits: 4 },
      { id: 'sub-bec703', code: 'BEC703', name: 'Wireless Communication Systems', departmentId: eceId, semesterNumber: 7, credits: 4 },
      { id: 'sub-bec714d', code: 'BEC714D', name: 'Radar Communication', departmentId: eceId, semesterNumber: 7, credits: 3 },
      { id: 'sub-bme755d', code: 'BME755D', name: 'Non-conventional energy resources', departmentId: eceId, semesterNumber: 7, credits: 3 },
      { id: 'sub-becl701', code: 'BECL701', name: 'Microwave Engineering Lab(IPCC)', departmentId: eceId, semesterNumber: 7, credits: 2 },
      { id: 'sub-becl702', code: 'BECL702', name: 'Computer Networks Lab(IPCC)', departmentId: eceId, semesterNumber: 7, credits: 2 },
      { id: 'sub-bec786', code: 'BEC786', name: 'Major Project Phase-II', departmentId: eceId, semesterNumber: 7, credits: 6 },
      { id: 'sub-21ec41', code: '21EC41', name: 'Signals and Systems', departmentId: eceId, semesterNumber: 4, credits: 4 },
      { id: 'sub-21ec42', code: '21EC42', name: 'Digital Signal Processing', departmentId: eceId, semesterNumber: 4, credits: 4 },
      { id: 'sub-21ec43', code: '21EC43', name: 'Microcontrollers & Embedded Systems', departmentId: eceId, semesterNumber: 4, credits: 4 },
      { id: 'sub-21ec44', code: '21EC44', name: 'Communication Circuits', departmentId: eceId, semesterNumber: 4, credits: 3 },
      { id: 'sub-21ecl46', code: '21ECL46', name: 'DSP & Microcontroller Simulation Lab', departmentId: eceId, semesterNumber: 4, credits: 2 }
    );

    // CSE
    const cseDept = departmentsList.find((d) => d.code === 'CSE');
    const cseId = cseDept ? cseDept.id : 'dept-cse';
    subs.push(
      { id: 'sub-21cs41', code: '21CS41', name: 'Analysis & Design of Algorithms', departmentId: cseId, semesterNumber: 4, credits: 4 },
      { id: 'sub-21cs42', code: '21CS42', name: 'Operating Systems Architecture', departmentId: cseId, semesterNumber: 4, credits: 4 },
      { id: 'sub-21cs43', code: '21CS43', name: 'Database Management Systems', departmentId: cseId, semesterNumber: 4, credits: 4 },
      { id: 'sub-21cs44', code: '21CS44', name: 'Object Oriented Programming with Java', departmentId: cseId, semesterNumber: 4, credits: 3 },
      { id: 'sub-21cs45', code: '21CS45', name: 'Python & Data Engineering', departmentId: cseId, semesterNumber: 4, credits: 3 },
      { id: 'sub-21csl46', code: '21CSL46', name: 'Design of Algorithms & DBMS Lab', departmentId: cseId, semesterNumber: 4, credits: 2 },
      { id: 'sub-21cs61', code: '21CS61', name: 'Software Engineering & Agile Methodologies', departmentId: cseId, semesterNumber: 6, credits: 4 },
      { id: 'sub-21cs62', code: '21CS62', name: 'Computer Networks & Security', departmentId: cseId, semesterNumber: 6, credits: 4 },
      { id: 'sub-21cs63', code: '21CS63', name: 'Full Stack Web Applications', departmentId: cseId, semesterNumber: 6, credits: 3 },
      { id: 'sub-21csl66', code: '21CSL66', name: 'Web Technology & Cloud Lab', departmentId: cseId, semesterNumber: 6, credits: 2 }
    );

    // AI-ML
    const aimlDept = departmentsList.find((d) => d.code === 'AI-ML');
    const aimlId = aimlDept ? aimlDept.id : 'dept-aiml';
    subs.push(
      { id: 'sub-21ai41', code: '21AI41', name: 'Foundations of Data Science', departmentId: aimlId, semesterNumber: 4, credits: 4 },
      { id: 'sub-21ai42', code: '21AI42', name: 'Mathematics for Machine Learning', departmentId: aimlId, semesterNumber: 4, credits: 4 },
      { id: 'sub-21ai43', code: '21AI43', name: 'Data Structures & Algorithms in Python', departmentId: aimlId, semesterNumber: 4, credits: 4 },
      { id: 'sub-21ail46', code: '21AIL46', name: 'Machine Learning Experimentation Lab', departmentId: aimlId, semesterNumber: 4, credits: 2 },
      { id: 'sub-21ai61', code: '21AI61', name: 'Deep Learning & Neural Networks', departmentId: aimlId, semesterNumber: 6, credits: 4 },
      { id: 'sub-21ai62', code: '21AI62', name: 'Natural Language Processing & LLMs', departmentId: aimlId, semesterNumber: 6, credits: 4 }
    );

    // ISE
    const iseDept = departmentsList.find((d) => d.code === 'ISE');
    const iseId = iseDept ? iseDept.id : 'dept-ise';
    subs.push(
      { id: 'sub-21is41', code: '21IS41', name: 'Design and Analysis of Algorithms', departmentId: iseId, semesterNumber: 4, credits: 4 },
      { id: 'sub-21is42', code: '21IS42', name: 'Relational Database Engineering', departmentId: iseId, semesterNumber: 4, credits: 4 },
      { id: 'sub-21is43', code: '21IS43', name: 'Operating Systems & System Programming', departmentId: iseId, semesterNumber: 4, credits: 4 },
      { id: 'sub-21isl46', code: '21ISL46', name: 'DBMS & Systems Lab', departmentId: iseId, semesterNumber: 4, credits: 2 }
    );

    // MECH
    const mechDept = departmentsList.find((d) => d.code === 'MECH');
    const mechId = mechDept ? mechDept.id : 'dept-mech';
    subs.push(
      { id: 'sub-21me41', code: '21ME41', name: 'Fluid Mechanics & Turbo Machinery', departmentId: mechId, semesterNumber: 4, credits: 4 },
      { id: 'sub-21me42', code: '21ME42', name: 'Kinematics of Machines', departmentId: mechId, semesterNumber: 4, credits: 4 },
      { id: 'sub-21me43', code: '21ME43', name: 'Manufacturing Technology & Metallurgy', departmentId: mechId, semesterNumber: 4, credits: 4 },
      { id: 'sub-21mel46', code: '21MEL46', name: 'Fluid Mechanics & Machine Shop Lab', departmentId: mechId, semesterNumber: 4, credits: 2 }
    );

    // CIVIL
    const civilDept = departmentsList.find((d) => d.code === 'CIVIL');
    const civilId = civilDept ? civilDept.id : 'dept-civil';
    subs.push(
      { id: 'sub-21cv41', code: '21CV41', name: 'Structural Mechanics & Analysis', departmentId: civilId, semesterNumber: 4, credits: 4 },
      { id: 'sub-21cv42', code: '21CV42', name: 'Hydrology and Water Resources Engineering', departmentId: civilId, semesterNumber: 4, credits: 4 },
      { id: 'sub-21cv43', code: '21CV43', name: 'Surveying & Geomatics Engineering', departmentId: civilId, semesterNumber: 4, credits: 4 },
      { id: 'sub-21cvl46', code: '21CVL46', name: 'Surveying Field Practice Lab', departmentId: civilId, semesterNumber: 4, credits: 2 }
    );

    return subs;
  }

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
    subjects,
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
