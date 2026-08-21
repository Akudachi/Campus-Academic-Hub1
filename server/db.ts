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
      id: 'dept-cse',
      name: 'Computer Science & Engineering',
      code: 'CSE',
      headOfDepartment: 'Dr. Ramesh Sharma',
      description: 'Core computing, algorithms, software engineering, and systems architecture.',
      establishedYear: '2005',
      createdAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 'dept-ece',
      name: 'Electronics & Communication Engineering',
      code: 'ECE',
      headOfDepartment: 'Dr. Ananya Joshi',
      description: 'VLSI design, embedded systems, signal processing, and communication networks.',
      establishedYear: '2005',
      createdAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 'dept-ise',
      name: 'Information Science & Engineering',
      code: 'ISE',
      headOfDepartment: 'Dr. Sanjay Kulkarni',
      description: 'Cloud technologies, database engineering, enterprise software, and cybersecurity.',
      establishedYear: '2010',
      createdAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 'dept-mech',
      name: 'Mechanical Engineering',
      code: 'MECH',
      headOfDepartment: 'Dr. Rajesh Patil',
      description: 'Thermodynamics, robotics, manufacturing systems, and finite element modeling.',
      establishedYear: '2008',
      createdAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 'dept-civil',
      name: 'Civil Engineering',
      code: 'CIVIL',
      headOfDepartment: 'Dr. Meera Nambiar',
      description: 'Structural engineering, geotechnics, urban transport, and environmental hydrology.',
      establishedYear: '2008',
      createdAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 'dept-aiml',
      name: 'Artificial Intelligence & Machine Learning',
      code: 'AI-ML',
      headOfDepartment: 'Dr. Vikramaditya Rao',
      description: 'Deep neural networks, computer vision, natural language processing, and LLMs.',
      establishedYear: '2022',
      createdAt: '2026-01-01T00:00:00Z',
    },
  ];

  const semesters: Semester[] = [
    {
      id: 'sem-cse-4',
      number: 4,
      academicYear: '2025-2026',
      departmentCode: 'CSE',
      section: 'A',
      status: 'active',
      createdAt: '2026-01-10T08:00:00Z',
    },
    {
      id: 'sem-cse-6',
      number: 6,
      academicYear: '2025-2026',
      departmentCode: 'CSE',
      section: 'A',
      status: 'active',
      createdAt: '2026-01-10T08:00:00Z',
    },
    {
      id: 'sem-ece-4',
      number: 4,
      academicYear: '2025-2026',
      departmentCode: 'ECE',
      section: 'A',
      status: 'active',
      createdAt: '2026-01-10T08:00:00Z',
    },
    {
      id: 'sem-ise-4',
      number: 4,
      academicYear: '2025-2026',
      departmentCode: 'ISE',
      section: 'A',
      status: 'active',
      createdAt: '2026-01-10T08:00:00Z',
    },
    {
      id: 'sem-mech-4',
      number: 4,
      academicYear: '2025-2026',
      departmentCode: 'MECH',
      section: 'A',
      status: 'active',
      createdAt: '2026-01-10T08:00:00Z',
    },
    {
      id: 'sem-civil-4',
      number: 4,
      academicYear: '2025-2026',
      departmentCode: 'CIVIL',
      section: 'A',
      status: 'active',
      createdAt: '2026-01-10T08:00:00Z',
    },
  ];

  const users: User[] = [
    {
      id: 'usr-admin-1',
      name: 'Campus Administrator',
      email: 'admin@campus.edu',
      role: 'admin',
      status: 'active',
      createdAt: new Date().toISOString(),
    },
  ];

  const defaultSettings: CampusSettings = {
    institutionName: 'Campus Institute of Technology',
    shortName: 'CIT',
    campusCode: 'CIT-2026',
    academicYear: '2025-2026',
    currentSemesterTerm: 'Even Semester (Sem 4 & 6)',
    minAttendanceWarning: 75,
    adminContactEmail: 'admin@campus.edu',
    systemStatus: 'operational',
  };

  const initialNotifications: Notification[] = [
    {
      id: 'notif-ready',
      userId: 'usr-admin-1',
      type: 'system',
      title: 'Ready for Live Real Data Testing',
      message: 'All demo values have been removed. You can now import real faculty, students, and timetable sheets.',
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
      details: 'Campus Academic Hub initialized with clean production database (0 demo records).',
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
    notices: [],
    events: [],
    notifications: initialNotifications,
    timetableUploads: [],
    studentImportBatches: [],
    auditLogs: initialAuditLogs,
  };
}

function initializeSampleDemoData(): DatabaseStore {
  const departments: Department[] = [
    { id: 'dept-cse', name: 'Computer Science & Engineering', code: 'CSE' },
    { id: 'dept-ece', name: 'Electronics & Communication Engineering', code: 'ECE' },
    { id: 'dept-ise', name: 'Information Science & Engineering', code: 'ISE' },
    { id: 'dept-mech', name: 'Mechanical Engineering', code: 'MECH' },
  ];

  const semesters: Semester[] = [
    {
      id: 'sem-cse-4',
      number: 4,
      academicYear: '2025-2026',
      departmentCode: 'CSE',
      section: 'A',
      status: 'active',
      createdAt: '2026-01-10T08:00:00Z',
    },
    {
      id: 'sem-ece-4',
      number: 4,
      academicYear: '2025-2026',
      departmentCode: 'ECE',
      section: 'A',
      status: 'active',
      createdAt: '2026-01-10T08:00:00Z',
    },
    {
      id: 'sem-cse-6',
      number: 6,
      academicYear: '2025-2026',
      departmentCode: 'CSE',
      section: 'A',
      status: 'setup',
      createdAt: '2026-02-01T08:00:00Z',
    },
  ];

  const users: User[] = [
    {
      id: 'usr-admin-1',
      name: 'Dr. Arthur Pendelton',
      email: 'admin@campus.edu',
      role: 'admin',
      status: 'active',
      createdAt: '2025-08-01T00:00:00Z',
    },
    {
      id: 'usr-tea-1',
      name: 'Dr. Ramesh Kumar',
      email: 'ramesh.kumar@campus.edu',
      role: 'teacher',
      status: 'active',
      createdAt: '2025-08-01T00:00:00Z',
    },
    {
      id: 'usr-tea-2',
      name: 'Prof. Anjali Sharma',
      email: 'anjali.sharma@campus.edu',
      role: 'teacher',
      status: 'active',
      createdAt: '2025-08-01T00:00:00Z',
    },
    {
      id: 'usr-tea-3',
      name: 'Dr. Vikram Rao',
      email: 'vikram.rao@campus.edu',
      role: 'teacher',
      status: 'active',
      createdAt: '2025-08-01T00:00:00Z',
    },
    {
      id: 'usr-tea-4',
      name: 'Prof. Deepa Nair',
      email: 'deepa.nair@campus.edu',
      role: 'teacher',
      status: 'active',
      createdAt: '2025-08-01T00:00:00Z',
    },
    {
      id: 'usr-stu-1',
      name: 'Adarsh Kudachi',
      email: 'adarsh.k@student.campus.edu',
      role: 'student',
      status: 'active',
      createdAt: '2025-08-15T00:00:00Z',
    },
    {
      id: 'usr-stu-2',
      name: 'Priya Nair',
      email: 'priya.n@student.campus.edu',
      role: 'student',
      status: 'active',
      createdAt: '2025-08-15T00:00:00Z',
    },
    {
      id: 'usr-stu-3',
      name: 'Rahul Deshmukh',
      email: 'rahul.d@student.campus.edu',
      role: 'student',
      status: 'active',
      createdAt: '2025-08-15T00:00:00Z',
    },
    {
      id: 'usr-stu-4',
      name: 'Sneha Kulkarni',
      email: 'sneha.k@student.campus.edu',
      role: 'student',
      status: 'active',
      createdAt: '2025-08-15T00:00:00Z',
    },
    {
      id: 'usr-stu-5',
      name: 'Kevin D\'Souza',
      email: 'kevin.d@student.campus.edu',
      role: 'student',
      status: 'active',
      createdAt: '2025-08-15T00:00:00Z',
    },
    {
      id: 'usr-stu-6',
      name: 'Pooja Hegde',
      email: 'pooja.h@student.campus.edu',
      role: 'student',
      status: 'active',
      createdAt: '2025-08-15T00:00:00Z',
    },
    {
      id: 'usr-stu-7',
      name: 'Tanmay Joshi',
      email: 'tanmay.j@student.campus.edu',
      role: 'student',
      status: 'active',
      createdAt: '2025-08-15T00:00:00Z',
    },
    {
      id: 'usr-stu-8',
      name: 'Meera Sen',
      email: 'meera.s@student.campus.edu',
      role: 'student',
      status: 'active',
      createdAt: '2025-08-15T00:00:00Z',
    },
  ];

  const teachers: Teacher[] = [
    {
      id: 'tea-1',
      userId: 'usr-tea-1',
      teacherCode: 'T001',
      department: 'CSE',
      designation: 'Professor & Head',
      qualification: 'Ph.D in Computer Science',
    },
    {
      id: 'tea-2',
      userId: 'usr-tea-2',
      teacherCode: 'T002',
      department: 'CSE',
      designation: 'Associate Professor',
      qualification: 'M.Tech, Ph.D (Pursuing)',
    },
    {
      id: 'tea-3',
      userId: 'usr-tea-3',
      teacherCode: 'T003',
      department: 'ECE',
      designation: 'Professor',
      qualification: 'Ph.D in Signal Processing',
    },
    {
      id: 'tea-4',
      userId: 'usr-tea-4',
      teacherCode: 'T004',
      department: 'ISE',
      designation: 'Assistant Professor',
      qualification: 'M.Tech in Software Engineering',
    },
  ];

  const students: Student[] = [
    {
      id: 'stu-1',
      userId: 'usr-stu-1',
      usn: '2KL23CS001',
      department: 'CSE',
      currentSemester: 4,
      section: 'A',
    },
    {
      id: 'stu-2',
      userId: 'usr-stu-2',
      usn: '2KL23CS002',
      department: 'CSE',
      currentSemester: 4,
      section: 'A',
    },
    {
      id: 'stu-3',
      userId: 'usr-stu-3',
      usn: '2KL23CS003',
      department: 'CSE',
      currentSemester: 4,
      section: 'A',
    },
    {
      id: 'stu-4',
      userId: 'usr-stu-4',
      usn: '2KL23CS004',
      department: 'CSE',
      currentSemester: 4,
      section: 'A',
    },
    {
      id: 'stu-5',
      userId: 'usr-stu-5',
      usn: '2KL23CS005',
      department: 'CSE',
      currentSemester: 4,
      section: 'A',
    },
    {
      id: 'stu-6',
      userId: 'usr-stu-6',
      usn: '2KL23CS006',
      department: 'CSE',
      currentSemester: 4,
      section: 'A',
    },
    {
      id: 'stu-7',
      userId: 'usr-stu-7',
      usn: '2KL23CS007',
      department: 'CSE',
      currentSemester: 4,
      section: 'A',
    },
    {
      id: 'stu-8',
      userId: 'usr-stu-8',
      usn: '2KL23CS008',
      department: 'CSE',
      currentSemester: 4,
      section: 'A',
    },
  ];

  const subjects: Subject[] = [
    {
      id: 'sub-cs401',
      name: 'Database Management Systems',
      code: 'CS401',
      departmentId: 'dept-cse',
      semesterNumber: 4,
      credits: 4,
    },
    {
      id: 'sub-cs402',
      name: 'Operating Systems',
      code: 'CS402',
      departmentId: 'dept-cse',
      semesterNumber: 4,
      credits: 4,
    },
    {
      id: 'sub-cs403',
      name: 'Design & Analysis of Algorithms',
      code: 'CS403',
      departmentId: 'dept-cse',
      semesterNumber: 4,
      credits: 4,
    },
    {
      id: 'sub-ec401',
      name: 'Signals & Systems',
      code: 'EC401',
      departmentId: 'dept-ece',
      semesterNumber: 4,
      credits: 4,
    },
  ];

  const teacherSubjectAssignments: TeacherSubjectAssignment[] = [
    {
      id: 'tsa-1',
      teacherId: 'tea-1',
      subjectId: 'sub-cs401',
      semesterId: 'sem-cse-4',
      createdFrom: 'ai_timetable',
      confirmedByAdmin: true,
    },
    {
      id: 'tsa-2',
      teacherId: 'tea-1',
      subjectId: 'sub-cs402',
      semesterId: 'sem-cse-4',
      createdFrom: 'ai_timetable',
      confirmedByAdmin: true,
    },
    {
      id: 'tsa-3',
      teacherId: 'tea-2',
      subjectId: 'sub-cs403',
      semesterId: 'sem-cse-4',
      createdFrom: 'manual',
      confirmedByAdmin: true,
    },
    {
      id: 'tsa-4',
      teacherId: 'tea-3',
      subjectId: 'sub-ec401',
      semesterId: 'sem-ece-4',
      createdFrom: 'manual',
      confirmedByAdmin: true,
    },
  ];

  // Seed 5 Attendance sessions for CS401 and CS403
  const attendanceSessions: AttendanceSession[] = [
    {
      id: 'att-sess-1',
      subjectId: 'sub-cs401',
      teacherId: 'tea-1',
      semesterId: 'sem-cse-4',
      date: '2026-02-10',
      period: '09:00 - 10:00 AM',
      topic: 'Introduction to Relational Algebra & ER Modeling',
      createdAt: '2026-02-10T09:55:00Z',
      submitted: true,
    },
    {
      id: 'att-sess-2',
      subjectId: 'sub-cs401',
      teacherId: 'tea-1',
      semesterId: 'sem-cse-4',
      date: '2026-02-12',
      period: '10:00 - 11:00 AM',
      topic: 'SQL DDL and DML Constraints',
      createdAt: '2026-02-12T10:55:00Z',
      submitted: true,
    },
    {
      id: 'att-sess-3',
      subjectId: 'sub-cs401',
      teacherId: 'tea-1',
      semesterId: 'sem-cse-4',
      date: '2026-02-14',
      period: '09:00 - 10:00 AM',
      topic: 'Normalization: 1NF, 2NF, 3NF & BCNF',
      createdAt: '2026-02-14T09:55:00Z',
      submitted: true,
    },
    {
      id: 'att-sess-4',
      subjectId: 'sub-cs402',
      teacherId: 'tea-1',
      semesterId: 'sem-cse-4',
      date: '2026-02-11',
      period: '11:15 - 12:15 PM',
      topic: 'Process Scheduling Algorithms (FCFS, SJF, RR)',
      createdAt: '2026-02-11T12:10:00Z',
      submitted: true,
    },
    {
      id: 'att-sess-5',
      subjectId: 'sub-cs403',
      teacherId: 'tea-2',
      semesterId: 'sem-cse-4',
      date: '2026-02-13',
      period: '02:00 - 03:00 PM',
      topic: 'Divide and Conquer: Master Theorem & Merge Sort',
      createdAt: '2026-02-13T14:58:00Z',
      submitted: true,
    },
  ];

  const attendanceRecords: AttendanceRecord[] = [];
  // Populate records for each session
  // Session 1: all present except stu-3
  students.forEach((st) => {
    attendanceRecords.push({
      id: `rec-1-${st.id}`,
      attendanceSessionId: 'att-sess-1',
      studentId: st.id,
      status: st.id === 'stu-3' ? 'absent' : 'present',
    });
  });
  // Session 2: all present except stu-5 and stu-7
  students.forEach((st) => {
    attendanceRecords.push({
      id: `rec-2-${st.id}`,
      attendanceSessionId: 'att-sess-2',
      studentId: st.id,
      status: st.id === 'stu-5' || st.id === 'stu-7' ? 'absent' : 'present',
    });
  });
  // Session 3: all present except stu-8
  students.forEach((st) => {
    attendanceRecords.push({
      id: `rec-3-${st.id}`,
      attendanceSessionId: 'att-sess-3',
      studentId: st.id,
      status: st.id === 'stu-8' ? 'absent' : 'present',
    });
  });
  // Session 4: all present except stu-4 and stu-5
  students.forEach((st) => {
    attendanceRecords.push({
      id: `rec-4-${st.id}`,
      attendanceSessionId: 'att-sess-4',
      studentId: st.id,
      status: st.id === 'stu-4' || st.id === 'stu-5' ? 'absent' : 'present',
    });
  });
  // Session 5: all present
  students.forEach((st) => {
    attendanceRecords.push({
      id: `rec-5-${st.id}`,
      attendanceSessionId: 'att-sess-5',
      studentId: st.id,
      status: 'present',
    });
  });

  const assignments: Assignment[] = [
    {
      id: 'asg-1',
      subjectId: 'sub-cs401',
      teacherId: 'tea-1',
      semesterId: 'sem-cse-4',
      title: 'Assignment 1: Complex SQL Queries & Indexing Analysis',
      instructions:
        'Write SQL queries for the banking database schema provided. Include execution plans for indexed vs non-indexed queries. Submit handwritten solutions or typed printed reports during Friday lab hours.',
      dueDate: '2026-08-22',
      createdAt: '2026-08-10T10:00:00Z',
    },
    {
      id: 'asg-2',
      subjectId: 'sub-cs402',
      teacherId: 'tea-1',
      semesterId: 'sem-cse-4',
      title: 'Assignment 1: Concurrency & Semaphore Simulation',
      instructions:
        'Solve the Dining Philosophers and Producer-Consumer synchronization problems using POSIX semaphores. Submit the lab verification sheet.',
      dueDate: '2026-08-25',
      createdAt: '2026-08-12T14:30:00Z',
    },
    {
      id: 'asg-3',
      subjectId: 'sub-cs403',
      teacherId: 'tea-2',
      semesterId: 'sem-cse-4',
      title: 'Assignment 1: Dynamic Programming Recurrence Formulations',
      instructions:
        'Derive recursive formulas and bottom-up DP matrices for 0/1 Knapsack, Longest Common Subsequence, and Matrix Chain Multiplication.',
      dueDate: '2026-08-28',
      createdAt: '2026-08-14T11:00:00Z',
    },
  ];

  const assignmentSubmissionStatuses: AssignmentSubmissionStatus[] = [
    // Asg 1
    { id: 'sub-stat-1-1', assignmentId: 'asg-1', studentId: 'stu-1', status: 'submitted', markedAt: '2026-08-15T09:00:00Z' },
    { id: 'sub-stat-1-2', assignmentId: 'asg-1', studentId: 'stu-2', status: 'submitted', markedAt: '2026-08-15T09:05:00Z' },
    { id: 'sub-stat-1-3', assignmentId: 'asg-1', studentId: 'stu-3', status: 'submitted', markedAt: '2026-08-15T09:10:00Z' },
    { id: 'sub-stat-1-4', assignmentId: 'asg-1', studentId: 'stu-4', status: 'not_submitted', markedAt: '2026-08-15T09:15:00Z' },
    { id: 'sub-stat-1-5', assignmentId: 'asg-1', studentId: 'stu-5', status: 'not_submitted', markedAt: '2026-08-15T09:15:00Z' },
    { id: 'sub-stat-1-6', assignmentId: 'asg-1', studentId: 'stu-6', status: 'submitted', markedAt: '2026-08-15T09:20:00Z' },
    { id: 'sub-stat-1-7', assignmentId: 'asg-1', studentId: 'stu-7', status: 'submitted', markedAt: '2026-08-15T09:25:00Z' },
    { id: 'sub-stat-1-8', assignmentId: 'asg-1', studentId: 'stu-8', status: 'not_submitted', markedAt: '2026-08-15T09:30:00Z' },

    // Asg 2
    { id: 'sub-stat-2-1', assignmentId: 'asg-2', studentId: 'stu-1', status: 'submitted', markedAt: '2026-08-14T15:00:00Z' },
    { id: 'sub-stat-2-2', assignmentId: 'asg-2', studentId: 'stu-2', status: 'submitted', markedAt: '2026-08-14T15:05:00Z' },
    { id: 'sub-stat-2-3', assignmentId: 'asg-2', studentId: 'stu-3', status: 'not_submitted', markedAt: '2026-08-14T15:10:00Z' },
    { id: 'sub-stat-2-4', assignmentId: 'asg-2', studentId: 'stu-4', status: 'submitted', markedAt: '2026-08-14T15:15:00Z' },
    { id: 'sub-stat-2-5', assignmentId: 'asg-2', studentId: 'stu-5', status: 'not_submitted', markedAt: '2026-08-14T15:20:00Z' },
    { id: 'sub-stat-2-6', assignmentId: 'asg-2', studentId: 'stu-6', status: 'submitted', markedAt: '2026-08-14T15:25:00Z' },
    { id: 'sub-stat-2-7', assignmentId: 'asg-2', studentId: 'stu-7', status: 'submitted', markedAt: '2026-08-14T15:30:00Z' },
    { id: 'sub-stat-2-8', assignmentId: 'asg-2', studentId: 'stu-8', status: 'submitted', markedAt: '2026-08-14T15:35:00Z' },

    // Asg 3
    { id: 'sub-stat-3-1', assignmentId: 'asg-3', studentId: 'stu-1', status: 'not_submitted', markedAt: '2026-08-15T11:00:00Z' },
    { id: 'sub-stat-3-2', assignmentId: 'asg-3', studentId: 'stu-2', status: 'not_submitted', markedAt: '2026-08-15T11:00:00Z' },
    { id: 'sub-stat-3-3', assignmentId: 'asg-3', studentId: 'stu-3', status: 'not_submitted', markedAt: '2026-08-15T11:00:00Z' },
    { id: 'sub-stat-3-4', assignmentId: 'asg-3', studentId: 'stu-4', status: 'not_submitted', markedAt: '2026-08-15T11:00:00Z' },
    { id: 'sub-stat-3-5', assignmentId: 'asg-3', studentId: 'stu-5', status: 'not_submitted', markedAt: '2026-08-15T11:00:00Z' },
    { id: 'sub-stat-3-6', assignmentId: 'asg-3', studentId: 'stu-6', status: 'not_submitted', markedAt: '2026-08-15T11:00:00Z' },
    { id: 'sub-stat-3-7', assignmentId: 'asg-3', studentId: 'stu-7', status: 'not_submitted', markedAt: '2026-08-15T11:00:00Z' },
    { id: 'sub-stat-3-8', assignmentId: 'asg-3', studentId: 'stu-8', status: 'not_submitted', markedAt: '2026-08-15T11:00:00Z' },
  ];

  const testMarkSheets: TestMarkSheet[] = [
    {
      id: 'tms-1',
      subjectId: 'sub-cs401',
      teacherId: 'tea-1',
      semesterId: 'sem-cse-4',
      testName: 'Continuous Internal Evaluation (CIE-1)',
      maxMarks: 50,
      published: true,
      createdAt: '2026-02-18T16:00:00Z',
    },
    {
      id: 'tms-2',
      subjectId: 'sub-cs402',
      teacherId: 'tea-1',
      semesterId: 'sem-cse-4',
      testName: 'Midterm Quiz & Lab Evaluation',
      maxMarks: 25,
      published: true,
      createdAt: '2026-02-20T17:00:00Z',
    },
    {
      id: 'tms-3',
      subjectId: 'sub-cs403',
      teacherId: 'tea-2',
      semesterId: 'sem-cse-4',
      testName: 'Continuous Internal Evaluation (CIE-1)',
      maxMarks: 50,
      published: false, // Draft / Unpublished by teacher
      createdAt: '2026-02-22T10:00:00Z',
    },
  ];

  const testMarks: TestMark[] = [
    // TMS 1 (CS401 - Published)
    { id: 'tm-1-1', testMarkSheetId: 'tms-1', studentId: 'stu-1', marks: 46 },
    { id: 'tm-1-2', testMarkSheetId: 'tms-1', studentId: 'stu-2', marks: 48 },
    { id: 'tm-1-3', testMarkSheetId: 'tms-1', studentId: 'stu-3', marks: 39 },
    { id: 'tm-1-4', testMarkSheetId: 'tms-1', studentId: 'stu-4', marks: 42 },
    { id: 'tm-1-5', testMarkSheetId: 'tms-1', studentId: 'stu-5', marks: 31 },
    { id: 'tm-1-6', testMarkSheetId: 'tms-1', studentId: 'stu-6', marks: 45 },
    { id: 'tm-1-7', testMarkSheetId: 'tms-1', studentId: 'stu-7', marks: 37 },
    { id: 'tm-1-8', testMarkSheetId: 'tms-1', studentId: 'stu-8', marks: 44 },

    // TMS 2 (CS402 - Published)
    { id: 'tm-2-1', testMarkSheetId: 'tms-2', studentId: 'stu-1', marks: 23 },
    { id: 'tm-2-2', testMarkSheetId: 'tms-2', studentId: 'stu-2', marks: 24 },
    { id: 'tm-2-3', testMarkSheetId: 'tms-2', studentId: 'stu-3', marks: 18 },
    { id: 'tm-2-4', testMarkSheetId: 'tms-2', studentId: 'stu-4', marks: 21 },
    { id: 'tm-2-5', testMarkSheetId: 'tms-2', studentId: 'stu-5', marks: 15 },
    { id: 'tm-2-6', testMarkSheetId: 'tms-2', studentId: 'stu-6', marks: 22 },
    { id: 'tm-2-7', testMarkSheetId: 'tms-2', studentId: 'stu-7', marks: 19 },
    { id: 'tm-2-8', testMarkSheetId: 'tms-2', studentId: 'stu-8', marks: 23 },

    // TMS 3 (CS403 - Unpublished)
    { id: 'tm-3-1', testMarkSheetId: 'tms-3', studentId: 'stu-1', marks: 44 },
    { id: 'tm-3-2', testMarkSheetId: 'tms-3', studentId: 'stu-2', marks: 47 },
    { id: 'tm-3-3', testMarkSheetId: 'tms-3', studentId: 'stu-3', marks: 35 },
    { id: 'tm-3-4', testMarkSheetId: 'tms-3', studentId: 'stu-4', marks: 40 },
    { id: 'tm-3-5', testMarkSheetId: 'tms-3', studentId: 'stu-5', marks: 28 },
    { id: 'tm-3-6', testMarkSheetId: 'tms-3', studentId: 'stu-6', marks: 43 },
    { id: 'tm-3-7', testMarkSheetId: 'tms-3', studentId: 'stu-7', marks: 36 },
    { id: 'tm-3-8', testMarkSheetId: 'tms-3', studentId: 'stu-8', marks: 41 },
  ];

  const notices: Notice[] = [
    {
      id: 'not-1',
      title: 'Mandatory 75% Attendance Requirement for Semester End Examinations',
      body: 'As per university academic regulations, students with less than 75% cumulative attendance in any registered subject will not be eligible to appear for the Semester End Examinations. Weekly reports are being monitored by the Dean Office.',
      createdBy: 'usr-admin-1',
      authorName: 'Office of the Dean (Academic)',
      audienceType: 'everyone',
      priority: 'urgent',
      createdAt: '2026-02-05T09:00:00Z',
    },
    {
      id: 'not-2',
      title: 'CSE Department: Industry Guest Lecture on Distributed Storage Architecture',
      body: 'The Department of Computer Science & Engineering is organizing a technical seminar on Modern Distributed File Systems & Cloud Object Stores. Attendance is required for all 4th and 6th semester CSE students.',
      createdBy: 'usr-admin-1',
      authorName: 'CSE Department Coordinator',
      audienceType: 'department',
      audienceTargetId: 'CSE',
      priority: 'normal',
      createdAt: '2026-02-12T11:30:00Z',
    },
    {
      id: 'not-3',
      title: 'Semester 4 Schedule: Lab Midterms & Project Phase-1 Evaluation',
      body: 'All Semester 4 sections will undergo lab evaluations between March 2nd and March 6th. Please ensure your physical assignment lab journals and test sheets are submitted to your respective subject teachers prior to the evaluation week.',
      createdBy: 'usr-admin-1',
      authorName: 'Academic Registrar',
      audienceType: 'semester',
      audienceTargetId: '4',
      priority: 'normal',
      createdAt: '2026-02-15T14:00:00Z',
    },
  ];

  const events: Event[] = [
    {
      id: 'evt-1',
      title: 'HackCampus 2026: 36-Hour National Collegiate Hackathon',
      description: 'Join over 100 teams tackling real-world problems in Edge AI, FinTech, and Renewable Energy. Cash prizes up to $10,000, industry mentorship, and fast-track interview opportunities.',
      date: '2026-09-15',
      venue: 'Main Campus Innovation Pavilion & Central Lab 3',
      posterImageUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80',
      createdBy: 'usr-admin-1',
      organizer: 'Centre for Innovation & Student Tech Council',
      createdAt: '2026-02-01T10:00:00Z',
    },
    {
      id: 'evt-2',
      title: 'Annual Tech Symposium: NextGen Computing & Robotics Expo',
      description: 'Featuring keynote addresses by leading silicon architects, robotics demonstrations, and research paper presentations across AI, IoT, and Mechatronics.',
      date: '2026-09-28',
      venue: 'Sir M. Visvesvaraya Auditorium',
      posterImageUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80',
      createdBy: 'usr-admin-1',
      organizer: 'Faculty of Engineering & Technology',
      createdAt: '2026-02-08T12:00:00Z',
    },
  ];

  const notifications: Notification[] = [
    {
      id: 'notif-1',
      userId: 'usr-stu-1',
      type: 'marks',
      title: 'Test Marks Published',
      message: 'Dr. Ramesh Kumar has published marks for Continuous Internal Evaluation (CIE-1) in Database Management Systems (CS401).',
      link: '/student/marks',
      read: false,
      createdAt: '2026-02-18T16:05:00Z',
    },
    {
      id: 'notif-2',
      userId: 'usr-stu-1',
      type: 'assignment',
      title: 'New Assignment Assigned',
      message: 'New assignment posted: "Assignment 1: Complex SQL Queries & Indexing Analysis" in CS401. Due date: 2026-08-22.',
      link: '/student/assignments',
      read: true,
      createdAt: '2026-08-10T10:05:00Z',
    },
    {
      id: 'notif-3',
      userId: 'usr-stu-1',
      type: 'attendance',
      title: 'Attendance Recorded',
      message: 'Your attendance has been marked as Present for CS401 (Database Management Systems).',
      link: '/student/attendance',
      read: true,
      createdAt: '2026-02-14T09:56:00Z',
    },
    {
      id: 'notif-4',
      userId: 'usr-stu-1',
      type: 'notice',
      title: 'New Academic Notice',
      message: 'Mandatory 75% Attendance Requirement for Semester End Examinations.',
      link: '/student/notices',
      read: false,
      createdAt: '2026-02-05T09:02:00Z',
    },
  ];

  const auditLogs: AuditLog[] = [
    {
      id: 'aud-1',
      userId: 'usr-admin-1',
      userName: 'Dr. Arthur Pendelton',
      userRole: 'admin',
      action: 'SEMESTER_ACTIVATED',
      details: 'Activated Semester 4 CSE (Section A) for Academic Year 2025-2026',
      timestamp: '2026-01-10T08:30:00Z',
    },
    {
      id: 'aud-2',
      userId: 'usr-tea-1',
      userName: 'Dr. Ramesh Kumar',
      userRole: 'teacher',
      action: 'ATTENDANCE_SUBMITTED',
      details: 'Submitted attendance session for CS401 on 2026-02-14 (7 Present, 1 Absent)',
      timestamp: '2026-02-14T09:55:00Z',
    },
    {
      id: 'aud-3',
      userId: 'usr-tea-1',
      userName: 'Dr. Ramesh Kumar',
      userRole: 'teacher',
      action: 'MARKS_PUBLISHED',
      details: 'Published CIE-1 marks sheet for Database Management Systems (CS401)',
      timestamp: '2026-02-18T16:00:00Z',
    },
  ];

  const defaultSettings: CampusSettings = {
    institutionName: 'Apex Institute of Technology',
    shortName: 'AIT',
    campusCode: 'AIT-2026',
    academicYear: '2025-2026',
    currentSemesterTerm: 'Even Semester (Semesters 2, 4, 6, 8)',
    semesterTermType: 'even',
    minAttendanceWarning: 75,
    adminContactEmail: 'admin@campus.edu',
    systemStatus: 'operational',
  };

  return {
    settings: defaultSettings,
    users,
    teachers,
    students,
    departments,
    semesters,
    subjects,
    teacherSubjectAssignments,
    attendanceSessions,
    attendanceRecords,
    assignments,
    assignmentSubmissionStatuses,
    testMarkSheets,
    testMarks,
    notices,
    events,
    notifications,
    timetableUploads: [],
    studentImportBatches: [],
    auditLogs,
  };
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
