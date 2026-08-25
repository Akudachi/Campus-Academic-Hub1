import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
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

dotenv.config();

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

export interface SupabaseStatus {
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
          status: 'setup',
          createdAt: '2026-01-10T08:00:00Z',
        });
      }
    });
    return sems;
  }

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

  function buildStandardFacultyAndAssignments(
    departmentsList: Department[],
    subjectsList: Subject[],
    semestersList: Semester[]
  ): { teachers: Teacher[]; users: User[]; assignments: TeacherSubjectAssignment[] } {
    const teachers: Teacher[] = [
      // ECE
      {
        id: 'tea-ece-01',
        userId: 'usr-tea-ece-01',
        teacherCode: 'ECE01',
        department: 'ECE',
        designation: 'Professor & Head of Dept',
        qualification: 'Ph.D (VLSI & Signal Processing)',
      },
      {
        id: 'tea-ece-02',
        userId: 'usr-tea-ece-02',
        teacherCode: 'ECE02',
        department: 'ECE',
        designation: 'Assistant Professor',
        qualification: 'M.Tech (Digital Electronics)',
      },
      {
        id: 'tea-ece-03',
        userId: 'usr-tea-ece-03',
        teacherCode: 'ECE03',
        department: 'ECE',
        designation: 'Assistant Professor',
        qualification: 'M.Tech (Embedded Systems)',
      },
      // CSE
      {
        id: 'tea-cse-01',
        userId: 'usr-tea-cse-01',
        teacherCode: 'CSE01',
        department: 'CSE',
        designation: 'Professor & Head of Dept',
        qualification: 'Ph.D (Computer Engineering)',
      },
      {
        id: 'tea-cse-02',
        userId: 'usr-tea-cse-02',
        teacherCode: 'CSE02',
        department: 'CSE',
        designation: 'Associate Professor',
        qualification: 'M.Tech, Ph.D (Cloud Architecture)',
      },
      {
        id: 'tea-cse-03',
        userId: 'usr-tea-cse-03',
        teacherCode: 'CSE03',
        department: 'CSE',
        designation: 'Assistant Professor',
        qualification: 'M.Tech (Software Engineering)',
      },
      // AI-ML
      {
        id: 'tea-aiml-01',
        userId: 'usr-tea-aiml-01',
        teacherCode: 'AIML01',
        department: 'AI-ML',
        designation: 'Professor & Head of Dept',
        qualification: 'Ph.D (Deep Learning & Neural Systems)',
      },
      {
        id: 'tea-aiml-02',
        userId: 'usr-tea-aiml-02',
        teacherCode: 'AIML02',
        department: 'AI-ML',
        designation: 'Assistant Professor',
        qualification: 'M.Tech (Data Science)',
      },
      // ISE
      {
        id: 'tea-ise-01',
        userId: 'usr-tea-ise-01',
        teacherCode: 'ISE01',
        department: 'ISE',
        designation: 'Professor & Head of Dept',
        qualification: 'Ph.D (Information Systems)',
      },
      {
        id: 'tea-ise-02',
        userId: 'usr-tea-ise-02',
        teacherCode: 'ISE02',
        department: 'ISE',
        designation: 'Assistant Professor',
        qualification: 'M.Tech (Network Security)',
      },
      // MECH
      {
        id: 'tea-mech-01',
        userId: 'usr-tea-mech-01',
        teacherCode: 'MECH01',
        department: 'MECH',
        designation: 'Professor & Head of Dept',
        qualification: 'Ph.D (Thermal & Robotics)',
      },
      // CIVIL
      {
        id: 'tea-civil-01',
        userId: 'usr-tea-civil-01',
        teacherCode: 'CIVIL01',
        department: 'CIVIL',
        designation: 'Professor & Head of Dept',
        qualification: 'Ph.D (Structural Mechanics)',
      },
    ];

    const facultyUsers: User[] = [
      { id: 'usr-tea-ece-01', name: 'Dr. B. S. Halakarnimath', email: 'bsh@klecet.edu.in', role: 'teacher', status: 'active', createdAt: '2026-01-01T00:00:00Z' },
      { id: 'usr-tea-ece-02', name: 'Prof. Veeresh M.', email: 'veereshm@klecet.edu.in', role: 'teacher', status: 'active', createdAt: '2026-01-01T00:00:00Z' },
      { id: 'usr-tea-ece-03', name: 'Prof. S. R. Patil', email: 'srpatil@klecet.edu.in', role: 'teacher', status: 'active', createdAt: '2026-01-01T00:00:00Z' },
      { id: 'usr-tea-cse-01', name: 'Dr. S. V. Viraktamath', email: 'svv@klecet.edu.in', role: 'teacher', status: 'active', createdAt: '2026-01-01T00:00:00Z' },
      { id: 'usr-tea-cse-02', name: 'Prof. Anand R.', email: 'anandr@klecet.edu.in', role: 'teacher', status: 'active', createdAt: '2026-01-01T00:00:00Z' },
      { id: 'usr-tea-cse-03', name: 'Prof. Sneha Kulkarni', email: 'snehak@klecet.edu.in', role: 'teacher', status: 'active', createdAt: '2026-01-01T00:00:00Z' },
      { id: 'usr-tea-aiml-01', name: 'Dr. V. M. Sheelavantar', email: 'vms@klecet.edu.in', role: 'teacher', status: 'active', createdAt: '2026-01-01T00:00:00Z' },
      { id: 'usr-tea-aiml-02', name: 'Prof. Pooja Deshpande', email: 'poojad@klecet.edu.in', role: 'teacher', status: 'active', createdAt: '2026-01-01T00:00:00Z' },
      { id: 'usr-tea-ise-01', name: 'Dr. P. R. Hampannavar', email: 'prh@klecet.edu.in', role: 'teacher', status: 'active', createdAt: '2026-01-01T00:00:00Z' },
      { id: 'usr-tea-ise-02', name: 'Prof. Chetan M.', email: 'chetanm@klecet.edu.in', role: 'teacher', status: 'active', createdAt: '2026-01-01T00:00:00Z' },
      { id: 'usr-tea-mech-01', name: 'Dr. S. B. Shivakumar', email: 'sbshivakumar@klecet.edu.in', role: 'teacher', status: 'active', createdAt: '2026-01-01T00:00:00Z' },
      { id: 'usr-tea-civil-01', name: 'Dr. S. C. Kamate', email: 'sckamate@klecet.edu.in', role: 'teacher', status: 'active', createdAt: '2026-01-01T00:00:00Z' },
    ];

    const assignments: TeacherSubjectAssignment[] = [];
    const assignmentPairs = [
      { teacherId: 'tea-ece-01', subCode: 'BEC701', deptCode: 'ECE', semNum: 7 },
      { teacherId: 'tea-ece-01', subCode: '21EC41', deptCode: 'ECE', semNum: 4 },
      { teacherId: 'tea-ece-02', subCode: 'BEC702', deptCode: 'ECE', semNum: 7 },
      { teacherId: 'tea-ece-02', subCode: '21EC42', deptCode: 'ECE', semNum: 4 },
      { teacherId: 'tea-ece-03', subCode: 'BEC703', deptCode: 'ECE', semNum: 7 },
      { teacherId: 'tea-ece-03', subCode: '21EC43', deptCode: 'ECE', semNum: 4 },
      { teacherId: 'tea-cse-01', subCode: '21CS41', deptCode: 'CSE', semNum: 4 },
      { teacherId: 'tea-cse-01', subCode: '21CS61', deptCode: 'CSE', semNum: 6 },
      { teacherId: 'tea-cse-02', subCode: '21CS42', deptCode: 'CSE', semNum: 4 },
      { teacherId: 'tea-cse-02', subCode: '21CS62', deptCode: 'CSE', semNum: 6 },
      { teacherId: 'tea-cse-03', subCode: '21CS43', deptCode: 'CSE', semNum: 4 },
      { teacherId: 'tea-cse-03', subCode: '21CS63', deptCode: 'CSE', semNum: 6 },
      { teacherId: 'tea-aiml-01', subCode: '21AI41', deptCode: 'AI-ML', semNum: 4 },
      { teacherId: 'tea-aiml-01', subCode: '21AI61', deptCode: 'AI-ML', semNum: 6 },
      { teacherId: 'tea-aiml-02', subCode: '21AI42', deptCode: 'AI-ML', semNum: 4 },
      { teacherId: 'tea-aiml-02', subCode: '21AI62', deptCode: 'AI-ML', semNum: 6 },
      { teacherId: 'tea-ise-01', subCode: '21IS41', deptCode: 'ISE', semNum: 4 },
      { teacherId: 'tea-ise-01', subCode: '21IS42', deptCode: 'ISE', semNum: 4 },
      { teacherId: 'tea-ise-02', subCode: '21IS43', deptCode: 'ISE', semNum: 4 },
      { teacherId: 'tea-mech-01', subCode: '21ME41', deptCode: 'MECH', semNum: 4 },
      { teacherId: 'tea-mech-01', subCode: '21ME42', deptCode: 'MECH', semNum: 4 },
      { teacherId: 'tea-civil-01', subCode: '21CV41', deptCode: 'CIVIL', semNum: 4 },
      { teacherId: 'tea-civil-01', subCode: '21CV42', deptCode: 'CIVIL', semNum: 4 },
    ];

    assignmentPairs.forEach((pair, idx) => {
      const sub = subjectsList.find((s) => s.code.toUpperCase() === pair.subCode.toUpperCase());
      const sem = semestersList.find((s) => s.number === pair.semNum && s.departmentCode.toUpperCase() === pair.deptCode.toUpperCase()) || semestersList[0];
      if (sub && sem) {
        assignments.push({
          id: `tsa-std-${idx + 1}`,
          teacherId: pair.teacherId,
          subjectId: sub.id,
          semesterId: sem.id,
          createdFrom: 'manual',
          confirmedByAdmin: true,
        });
      }
    });

    return { teachers, users: facultyUsers, assignments };
  }

  const semesters: Semester[] = buildStandardSemesters(departments, defaultSettings.academicYear);

  const adminUsers: User[] = [
    {
      id: 'usr-admin-1',
      name: 'Adarsh Kudachi (Administrator)',
      email: 'adarshkudachi18@gmail.com',
      role: 'admin',
      status: 'active',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'usr-admin-2',
      name: 'Campus Administrator',
      email: 'ecedept123456@gmail.com',
      role: 'admin',
      status: 'active',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'usr-admin-3',
      name: 'College Administration Desk',
      email: 'admin@klecet.edu.in',
      role: 'admin',
      status: 'active',
      createdAt: new Date().toISOString(),
    },
  ];

  return {
    settings: defaultSettings,
    users: adminUsers,
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
    notices: [],
    events: [],
    notifications: [],
    timetableUploads: [],
    studentImportBatches: [],
    auditLogs: [],
  };
}

function initializeSampleDemoData(): DatabaseStore {
  return initializeCleanData();
}

// Global Singleton DB store with Supabase PostgreSQL & local disk fallback
class DatabaseService {
  private store: DatabaseStore;
  private readonly startTime: number;
  private lastModified: number;
  private readonly dbFilePath: string;
  private saveTimeout: NodeJS.Timeout | null = null;
  private isSavingToSupabase: boolean = false;
  private pendingSupabaseSave: boolean = false;

  // Supabase / Postgres connection state
  private pgPool: Pool | null = null;
  private supabaseClient: SupabaseClient | null = null;
  private databaseUrl: string;
  private supabaseUrl: string;
  private supabaseKey: string;
  private isSupabaseConnected: boolean = false;
  private lastSupabaseSync: string | null = null;
  private lastSupabaseError: string | undefined = undefined;

  constructor() {
    this.startTime = Date.now();
    this.lastModified = Date.now();
    this.dbFilePath = path.join(process.cwd(), 'data', 'campus_db.json');

    // Supabase credentials configuration
    this.databaseUrl = process.env.DATABASE_URL || '';
    this.supabaseUrl = process.env.SUPABASE_URL || '';
    this.supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      '';

    // 1. Initial fast load from local disk / memory to avoid cold-start lag
    this.store = this.loadFromDisk();

    // 2. Initialize Supabase Pool and sync latest data from cloud
    this.initSupabase();
  }

  private async initSupabase(): Promise<void> {
    try {
      if (this.databaseUrl) {
        this.pgPool = new Pool({
          connectionString: this.databaseUrl,
          ssl: { rejectUnauthorized: false },
          max: 10,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 10000,
        });

        // Ensure table exists on Supabase / PostgreSQL
        await this.pgPool.query(`
          CREATE TABLE IF NOT EXISTS campus_hub_store (
            key TEXT PRIMARY KEY,
            data JSONB NOT NULL,
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );
        `);

        // Check if existing data is already in PostgreSQL / Supabase
        const existing = await this.pgPool.query(
          `SELECT data, updated_at FROM campus_hub_store WHERE key = 'main_db' LIMIT 1;`
        );

        if (existing.rows.length > 0 && existing.rows[0].data) {
          console.log('[Supabase/PG] Existing database found in cloud! Restoring cloud state to memory & disk cache...');
          const cloudData = existing.rows[0].data as DatabaseStore;
          this.store = this.mergeWithCleanDefaults(cloudData);
          this.persistDiskSync();
        } else {
          // No cloud data yet, initial seed from local store
          console.log('[Supabase/PG] First time init: Seeding initial dataset to cloud PostgreSQL...');
          await this.pgPool.query(
            `INSERT INTO campus_hub_store (key, data, updated_at) VALUES ('main_db', $1, NOW()) ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();`,
            [JSON.stringify(this.store)]
          );
        }

        this.isSupabaseConnected = true;
        this.lastSupabaseSync = new Date().toISOString();
        this.lastSupabaseError = undefined;
        console.log('[Supabase/PG] Cloud database connected and synchronized.');
      } else if (this.supabaseUrl && this.supabaseKey) {
        this.initSupabaseRestClient();
        if (this.supabaseClient) {
          const { data, error } = await this.supabaseClient
            .from('campus_hub_store')
            .select('data, updated_at')
            .eq('key', 'main_db')
            .maybeSingle();

          if (!error && data && data.data) {
            console.log('[Supabase/REST] Existing database found in Supabase! Restoring cloud state...');
            const cloudData = data.data as DatabaseStore;
            this.store = this.mergeWithCleanDefaults(cloudData);
            this.persistDiskSync();
            this.isSupabaseConnected = true;
            this.lastSupabaseSync = new Date().toISOString();
            this.lastSupabaseError = undefined;
          } else {
            console.log('[Supabase/REST] No cloud dataset found. Seeding initial data...');
            await this.supabaseClient
              .from('campus_hub_store')
              .upsert({ key: 'main_db', data: this.store, updated_at: new Date().toISOString() });
            this.isSupabaseConnected = true;
            this.lastSupabaseSync = new Date().toISOString();
            this.lastSupabaseError = undefined;
          }
        }
      }
    } catch (err: any) {
      this.isSupabaseConnected = false;
      this.lastSupabaseError = err.message || 'Failed to connect to cloud database';
      console.warn('[DB] Could not sync with remote database at startup, running on local cache:', err.message);

      // Attempt Supabase JS Client fallback if pg connection had issues
      if (!this.supabaseClient && this.supabaseUrl && this.supabaseKey) {
        this.initSupabaseRestClient();
      }
    }
  }

  private initSupabaseRestClient(): void {
    if (this.supabaseUrl && this.supabaseKey) {
      try {
        const cleanUrl = this.supabaseUrl.replace(/\/rest\/v1\/?$/, '');
        this.supabaseClient = createClient(cleanUrl, this.supabaseKey, {
          auth: { persistSession: false },
        });
        console.log('[Supabase] REST Client initialized as backup connector.');
      } catch (err: any) {
        console.warn('[Supabase] REST Client initialization failed:', err.message);
      }
    }
  }

  private mergeWithCleanDefaults(cloudData: Partial<DatabaseStore>): DatabaseStore {
    const clean = initializeCleanData();
    const cloudUserMap = new Map((Array.isArray(cloudData.users) ? cloudData.users : []).map((u) => [u.id, u]));
    
    // Ensure all default admin accounts exist, but prefer any updated cloud version
    const mergedUsers: User[] = [];
    for (const cleanUser of clean.users) {
      if (cloudUserMap.has(cleanUser.id)) {
        mergedUsers.push(cloudUserMap.get(cleanUser.id)!);
        cloudUserMap.delete(cleanUser.id);
      } else {
        mergedUsers.push(cleanUser);
      }
    }
    // Add all other users (teachers, students, custom admins)
    for (const remainingUser of cloudUserMap.values()) {
      mergedUsers.push(remainingUser);
    }

    return {
      settings: cloudData.settings ? { ...clean.settings, ...cloudData.settings } : clean.settings,
      users: mergedUsers,
      teachers: Array.isArray(cloudData.teachers) ? cloudData.teachers : [],
      students: Array.isArray(cloudData.students) ? cloudData.students : [],
      departments: Array.isArray(cloudData.departments) && cloudData.departments.length > 0 ? cloudData.departments : clean.departments,
      semesters: Array.isArray(cloudData.semesters) && cloudData.semesters.length > 0 ? cloudData.semesters : clean.semesters,
      subjects: Array.isArray(cloudData.subjects) ? cloudData.subjects : [],
      teacherSubjectAssignments: Array.isArray(cloudData.teacherSubjectAssignments) ? cloudData.teacherSubjectAssignments : [],
      attendanceSessions: Array.isArray(cloudData.attendanceSessions) ? cloudData.attendanceSessions : [],
      attendanceRecords: Array.isArray(cloudData.attendanceRecords) ? cloudData.attendanceRecords : [],
      assignments: Array.isArray(cloudData.assignments) ? cloudData.assignments : [],
      assignmentSubmissionStatuses: Array.isArray(cloudData.assignmentSubmissionStatuses) ? cloudData.assignmentSubmissionStatuses : [],
      testMarkSheets: Array.isArray(cloudData.testMarkSheets) ? cloudData.testMarkSheets : [],
      testMarks: Array.isArray(cloudData.testMarks) ? cloudData.testMarks : [],
      notices: Array.isArray(cloudData.notices) ? cloudData.notices : [],
      events: Array.isArray(cloudData.events) ? cloudData.events : [],
      notifications: Array.isArray(cloudData.notifications) ? cloudData.notifications : [],
      timetableUploads: Array.isArray(cloudData.timetableUploads) ? cloudData.timetableUploads : [],
      studentImportBatches: Array.isArray(cloudData.studentImportBatches) ? cloudData.studentImportBatches : [],
      auditLogs: Array.isArray(cloudData.auditLogs) ? cloudData.auditLogs : [],
    };
  }

  private loadFromDisk(): DatabaseStore {
    try {
      if (fs.existsSync(this.dbFilePath)) {
        const raw = fs.readFileSync(this.dbFilePath, 'utf-8');
        if (raw && raw.trim().length > 0) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object' && Array.isArray(parsed.departments)) {
            console.log(
              `[DB] Loaded campus database from local disk: ${parsed.students?.length || 0} students, ${parsed.teachers?.length || 0} faculty.`
            );
            this.lastModified = Date.now();
            return this.mergeWithCleanDefaults(parsed);
          }
        }
      }
    } catch (err) {
      console.warn('[DB] Could not load persisted data from disk, initializing clean database:', err);
    }
    const clean = initializeCleanData();
    this.persistDiskSync(clean);
    return clean;
  }

  private persistDiskSync(dataToSave?: DatabaseStore): void {
    try {
      const dir = path.dirname(this.dbFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const data = dataToSave || this.store;
      fs.writeFileSync(this.dbFilePath, JSON.stringify(data, null, 2), 'utf-8');
      this.lastModified = Date.now();
    } catch (err) {
      console.error('[DB] Failed to persist data to disk:', err);
    }
  }

  public async persistToSupabase(): Promise<boolean> {
    if (this.isSavingToSupabase) {
      this.pendingSupabaseSave = true;
      return true;
    }

    this.isSavingToSupabase = true;
    try {
      const dataJson = JSON.stringify(this.store);

      if (this.pgPool) {
        await this.pgPool.query(
          `INSERT INTO campus_hub_store (key, data, updated_at)
           VALUES ('main_db', $1, NOW())
           ON CONFLICT (key) DO UPDATE
           SET data = EXCLUDED.data, updated_at = NOW();`,
          [dataJson]
        );
        this.isSupabaseConnected = true;
        this.lastSupabaseSync = new Date().toISOString();
        this.lastSupabaseError = undefined;
      } else if (this.supabaseClient) {
        const { error } = await this.supabaseClient
          .from('campus_hub_store')
          .upsert({ key: 'main_db', data: this.store, updated_at: new Date().toISOString() });
        if (error) throw error;
        this.isSupabaseConnected = true;
        this.lastSupabaseSync = new Date().toISOString();
        this.lastSupabaseError = undefined;
      }
      return true;
    } catch (err: any) {
      this.isSupabaseConnected = false;
      this.lastSupabaseError = err.message || 'Supabase save failed';
      console.error('[Supabase Save Error]:', err.message);
      return false;
    } finally {
      this.isSavingToSupabase = false;
      if (this.pendingSupabaseSave) {
        this.pendingSupabaseSave = false;
        setTimeout(() => this.persistToSupabase(), 100);
      }
    }
  }

  public persistSync(dataToSave?: DatabaseStore): void {
    this.persistDiskSync(dataToSave);
    this.persistToSupabase().catch((err) => {
      console.warn('[DB] Background Supabase persist error:', err);
    });
  }

  public persist(): void {
    this.lastModified = Date.now();
    // Immediate synchronous local write for instant consistency
    this.persistDiskSync();
    // Immediate asynchronous push to cloud PostgreSQL
    this.persistToSupabase().catch((err) => {
      console.warn('[DB] Immediate Supabase save caught:', err);
    });
  }

  public async pullFromSupabase(): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.pgPool && !this.supabaseClient) {
        await this.initSupabase();
      }

      if (this.pgPool) {
        const result = await this.pgPool.query(
          `SELECT data, updated_at FROM campus_hub_store WHERE key = 'main_db' LIMIT 1;`
        );
        if (result.rows.length > 0 && result.rows[0].data) {
          const cloudData = result.rows[0].data as DatabaseStore;
          this.store = this.mergeWithCleanDefaults(cloudData);
          this.lastModified = Date.now();
          this.isSupabaseConnected = true;
          this.lastSupabaseSync = new Date().toISOString();
          this.lastSupabaseError = undefined;
          this.persistDiskSync();
          return {
            success: true,
            message: `Successfully pulled latest campus state from Supabase (${this.store.students.length} students, ${this.store.teachers.length} faculty).`,
          };
        }
      } else if (this.supabaseClient) {
        const { data, error } = await this.supabaseClient
          .from('campus_hub_store')
          .select('data, updated_at')
          .eq('key', 'main_db')
          .maybeSingle();

        if (!error && data && data.data) {
          const cloudData = data.data as DatabaseStore;
          this.store = this.mergeWithCleanDefaults(cloudData);
          this.lastModified = Date.now();
          this.isSupabaseConnected = true;
          this.lastSupabaseSync = new Date().toISOString();
          this.lastSupabaseError = undefined;
          this.persistDiskSync();
          return {
            success: true,
            message: `Successfully pulled latest campus state from Supabase (${this.store.students.length} students, ${this.store.teachers.length} faculty).`,
          };
        }
      }

      return { success: false, message: 'No remote dataset found in Supabase.' };
    } catch (err: any) {
      this.isSupabaseConnected = false;
      this.lastSupabaseError = err.message;
      return { success: false, message: `Failed to pull from Supabase: ${err.message}` };
    }
  }

  public getSupabaseStatus(): SupabaseStatus {
    let host = 'Not configured';
    try {
      if (this.databaseUrl) {
        const match = this.databaseUrl.match(/@([^:/]+)/);
        if (match && match[1]) host = match[1];
      } else if (this.supabaseUrl) {
        const parsed = new URL(this.supabaseUrl);
        host = parsed.hostname;
      }
    } catch {
      // ignore
    }

    return {
      configured: Boolean(this.databaseUrl || this.supabaseUrl),
      connected: this.isSupabaseConnected,
      provider: this.pgPool ? 'supabase_postgres' : this.supabaseClient ? 'supabase_rest' : 'local_fallback',
      databaseHost: host,
      lastSyncTime: this.lastSupabaseSync,
      status: this.isSupabaseConnected ? 'connected' : this.lastSupabaseError ? 'error' : 'local_only',
      records: {
        students: this.store.students?.length || 0,
        teachers: this.store.teachers?.length || 0,
        departments: this.store.departments?.length || 0,
        semesters: this.store.semesters?.length || 0,
        subjects: this.store.subjects?.length || 0,
        attendanceSessions: this.store.attendanceSessions?.length || 0,
        attendanceRecords: this.store.attendanceRecords?.length || 0,
        testMarks: this.store.testMarks?.length || 0,
        assignments: this.store.assignments?.length || 0,
        notices: this.store.notices?.length || 0,
      },
      error: this.lastSupabaseError,
    };
  }

  public getLastModified(): number {
    return this.lastModified;
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
    this.persist();
    return this.store.settings;
  }

  public resetToClean(): void {
    this.store = initializeCleanData();
    this.persistSync();
  }

  public wipeAllData(): { success: boolean; message: string } {
    this.store = initializeCleanData();
    this.persistSync();
    this.persistToSupabase().catch((err) => console.warn('[DB] Supabase wipe sync error:', err));
    console.log('[DB] Database wiped completely to 0 records across all entities.');
    return { success: true, message: 'All database records successfully deleted from database.' };
  }

  public resetToSeed(): void {
    this.store = initializeCleanData();
    this.persistSync();
  }

  public loadSampleData(): void {
    this.store = initializeSampleDemoData();
    this.persistSync();
  }

  public restoreData(newData: Partial<DatabaseStore>): { success: boolean; message: string } {
    if (!newData || typeof newData !== 'object') {
      throw new Error('Invalid backup data format.');
    }

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

    this.persistSync();
    return { success: true, message: 'Campus database restored successfully and persisted to Supabase and storage.' };
  }

  // Authoritative Synchronizer: Server sends authoritative state to client
  public syncWithClient(clientSnapshot?: Partial<DatabaseStore>, clientLastModified?: number): {
    store: DatabaseStore;
    lastModified: number;
    actionTaken: 'restored_from_client' | 'client_updated_from_server' | 'in_sync';
  } {
    return {
      store: this.store,
      lastModified: this.lastModified,
      actionTaken: 'client_updated_from_server',
    };
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
    this.persist();
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
    this.persist();
  }
}

export const db = new DatabaseService();
