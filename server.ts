import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { db } from './server/db';
import { extractTimetableData } from './server/gemini';
import {
  User,
  Teacher,
  Student,
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
  ExtractedTimetableRow,
  StudentImportRowResult,
  StudentDashboardSummary,
} from './src/types';

dotenv.config();

const app = express();
const PORT = 3000;

// Body parser
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Auth Middleware: extracts user from Authorization header or session simulation
interface AuthenticatedRequest extends Request {
  user?: User;
  teacher?: Teacher;
  student?: Student;
}

function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const store = db.getStore();
  const authHeader = req.headers.authorization;
  const userHeader = req.headers['x-user-id'] as string;

  let user: User | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    // Token can be user ID or role
    user = store.users.find((u) => u.id === token || u.email === token);
  } else if (userHeader) {
    user = store.users.find((u) => u.id === userHeader);
  }

  // Default fallback for development/demo: if no token provided, set default admin or allow public auth routes
  if (!user && (req.path.startsWith('/api/auth') || req.path === '/api/health')) {
    return next();
  }

  if (!user) {
    // Return default first admin user if no header, to allow smooth interaction
    user = store.users[0];
  }

  req.user = user;

  if (user.role === 'teacher') {
    req.teacher = store.teachers.find((t) => t.userId === user?.id);
  } else if (user.role === 'student') {
    req.student = store.students.find((s) => s.userId === user?.id);
  }

  next();
}

app.use(authMiddleware);

// Strict Role Guard
function requireRole(...allowedRoles: ('admin' | 'teacher' | 'student')[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: User authentication required.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Forbidden: ${req.user.role.toUpperCase()} role cannot access this resource. Required: ${allowedRoles.join(', ')}.`,
      });
    }
    next();
  };
}

// Student Read-Only Mutation Barrier
function rejectStudentMutations(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (req.user?.role === 'student' && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return res.status(403).json({
      error: 'Forbidden: Students are 100% read-only and cannot create, modify, or delete academic records.',
    });
  }
  next();
}

app.use('/api', rejectStudentMutations);

// ==========================================
// 1. AUTH & ME ENDPOINTS
// ==========================================

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Public / General Campus Settings
app.get('/api/settings', (req, res) => {
  const store = db.getStore();
  res.json({ settings: store.settings });
});

// Admin: System Status & Health Metrics
app.get('/api/admin/system/status', requireRole('admin'), (req: AuthenticatedRequest, res: Response) => {
  const store = db.getStore();
  const uptimeSeconds = db.getUptimeSeconds();
  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 5);

  const statusInfo = {
    serverTime: new Date().toISOString(),
    uptimeSeconds,
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'production',
    geminiConfigured: hasGeminiKey,
    databaseStats: {
      usersCount: store.users.length,
      teachersCount: store.teachers.length,
      studentsCount: store.students.length,
      subjectsCount: store.subjects.length,
      semestersCount: store.semesters.length,
      attendanceSessionsCount: store.attendanceSessions.length,
      assignmentsCount: store.assignments.length,
      testMarkSheetsCount: store.testMarkSheets.length,
      noticesCount: store.notices.length,
      eventsCount: store.events.length,
    },
  };

  res.json({ status: statusInfo });
});

// Admin: Campus Settings CRUD
app.get('/api/admin/settings', requireRole('admin'), (req: AuthenticatedRequest, res: Response) => {
  const store = db.getStore();
  res.json({ settings: store.settings });
});

app.post('/api/admin/settings', requireRole('admin'), (req: AuthenticatedRequest, res: Response) => {
  const {
    institutionName,
    shortName,
    campusCode,
    academicYear,
    currentSemesterTerm,
    minAttendanceWarning,
    adminContactEmail,
  } = req.body;

  const updated = db.updateSettings({
    institutionName: institutionName || 'Apex Institute of Technology',
    shortName: shortName || 'AIT',
    campusCode: campusCode || 'AIT-2026',
    academicYear: academicYear || '2025-2026',
    currentSemesterTerm: currentSemesterTerm || 'Even Semester (Sem 4 & 6)',
    minAttendanceWarning: Number(minAttendanceWarning) || 75,
    adminContactEmail: adminContactEmail || 'admin@campus.edu',
  });

  db.logAudit(
    req.user!.id,
    req.user!.name,
    'admin',
    'SETTINGS_UPDATED',
    `Updated campus configuration for ${updated.institutionName}`
  );

  res.json({ success: true, settings: updated });
});

// Admin: Full Database Backup Export
app.get('/api/admin/backup', requireRole('admin'), (req: AuthenticatedRequest, res: Response) => {
  const store = db.getStore();
  const backupPayload = {
    metadata: {
      exportedAt: new Date().toISOString(),
      institution: store.settings.institutionName,
      campusCode: store.settings.campusCode,
      academicYear: store.settings.academicYear,
      systemVersion: '1.0.0',
    },
    data: store,
  };

  db.logAudit(
    req.user!.id,
    req.user!.name,
    'admin',
    'DATABASE_BACKUP',
    'Generated and downloaded full campus database snapshot'
  );

  res.setHeader('Content-Type', 'application/json');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=campus_academic_backup_${Date.now()}.json`
  );
  res.json(backupPayload);
});

// Admin: Restore Database from Backup JSON
app.post('/api/admin/restore', requireRole('admin'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { data } = req.body;
    if (!data) {
      return res.status(400).json({ error: 'Invalid backup file: "data" property missing.' });
    }

    const result = db.restoreData(data);
    db.logAudit(
      req.user!.id,
      req.user!.name,
      'admin',
      'DATABASE_RESTORED',
      'Restored campus database from uploaded backup snapshot'
    );

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to restore database.' });
  }
});

// Admin: Reset / Wipe to Fresh Clean Slate (Zero Demo Records)
app.post('/api/admin/reset', requireRole('admin'), (req: AuthenticatedRequest, res: Response) => {
  db.resetToClean();
  db.logAudit(
    req.user!.id,
    req.user!.name,
    'admin',
    'DATABASE_CLEARED',
    'Reset all institutional records to clean production slate (zero demo values)'
  );
  res.json({ success: true, message: 'Campus database reset to clean slate with 0 demo records.' });
});

// Admin: Optional Load Sample Demo Pack
app.post('/api/admin/load-demo', requireRole('admin'), (req: AuthenticatedRequest, res: Response) => {
  db.loadSampleData();
  db.logAudit(
    req.user!.id,
    req.user!.name,
    'admin',
    'DATABASE_DEMO_LOADED',
    'Loaded sample campus demo dataset'
  );
  res.json({ success: true, message: 'Sample demo dataset loaded successfully.' });
});

app.post('/api/auth/login', (req: AuthenticatedRequest, res: Response) => {
  const { email, role, userId, usn } = req.body;
  const store = db.getStore();

  let user: User | undefined;
  if (userId) {
    user = store.users.find((u) => u.id === userId);
  } else if (email) {
    const rawInput = email.trim();
    const input = rawInput.toLowerCase();
    
    // 1. Direct email match
    user = store.users.find((u) => u.email.toLowerCase() === input);
    
    // 2. Fallback for the campus admin email variants
    if (!user && (input === '00adarsh.kudachi00@gmail.com' || input === 'admin@campus.edu')) {
      user = store.users.find((u) => u.role === 'admin');
    }
    
    // 3. Match by student USN
    if (!user) {
      const studentMatch = store.students.find((s) => s.usn.toLowerCase() === input);
      if (studentMatch) {
        user = store.users.find((u) => u.id === studentMatch.userId);
      }
    }
    
    // 4. Match by teacher code
    if (!user) {
      const teacherMatch = store.teachers.find((t) => t.teacherCode.toLowerCase() === input);
      if (teacherMatch) {
        user = store.users.find((u) => u.id === teacherMatch.userId);
      }
    }
  } else if (usn) {
    const studentMatch = store.students.find((s) => s.usn.toLowerCase() === usn.trim().toLowerCase());
    if (studentMatch) {
      user = store.users.find((u) => u.id === studentMatch.userId);
    }
  } else if (role) {
    user = store.users.find((u) => u.role === role);
  }

  if (!user) {
    return res.status(401).json({ error: 'User not found. Please check your email, USN, or Teacher Code.' });
  }

  let teacherProfile = undefined;
  let studentProfile = undefined;

  if (user.role === 'teacher') {
    teacherProfile = store.teachers.find((t) => t.userId === user?.id);
  } else if (user.role === 'student') {
    studentProfile = store.students.find((s) => s.userId === user?.id);
  }

  res.json({
    token: user.id,
    user,
    teacher: teacherProfile,
    student: studentProfile,
  });
});

app.get('/api/me', (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const store = db.getStore();
  const teacher = req.user.role === 'teacher' ? store.teachers.find((t) => t.userId === req.user?.id) : undefined;
  const student = req.user.role === 'student' ? store.students.find((s) => s.userId === req.user?.id) : undefined;

  res.json({
    user: req.user,
    teacher,
    student,
  });
});

// Switch role convenience endpoint for instant demo/testing
app.get('/api/auth/personas', (req, res) => {
  const store = db.getStore();
  const personas = store.users.map((u) => {
    const teacher = store.teachers.find((t) => t.userId === u.id);
    const student = store.students.find((s) => s.userId === u.id);
    return {
      user: u,
      teacher,
      student,
      displaySub: teacher
        ? `${teacher.teacherCode} • Dept of ${teacher.department} • ${teacher.designation || 'Faculty'}`
        : student
        ? `USN: ${student.usn} • ${student.department} Sem ${student.currentSemester}-${student.section}`
        : 'System Administrator',
    };
  });
  res.json({ personas });
});

// ==========================================
// 2. ADMIN ENDPOINTS
// ==========================================

// 2.1 Teachers Master List CRUD & Bulk
app.get('/api/admin/teachers', requireRole('admin'), (req: AuthenticatedRequest, res: Response) => {
  const store = db.getStore();
  const teachersWithUser = store.teachers.map((t) => ({
    ...t,
    user: store.users.find((u) => u.id === t.userId),
    assignedSubjectsCount: store.teacherSubjectAssignments.filter((a) => a.teacherId === t.id && a.confirmedByAdmin).length,
  }));
  res.json({ teachers: teachersWithUser, total: teachersWithUser.length });
});

app.post('/api/admin/teachers', requireRole('admin'), (req: AuthenticatedRequest, res: Response) => {
  const { name, email, department, teacherCode, designation, qualification } = req.body;
  const store = db.getStore();

  if (!name || !email || !department || !teacherCode) {
    return res.status(400).json({ error: 'Name, email, department, and teacherCode are required.' });
  }

  // Check unique teacherCode & email
  if (store.teachers.some((t) => t.teacherCode.toUpperCase() === teacherCode.toUpperCase())) {
    return res.status(409).json({ error: `Teacher code "${teacherCode}" is already in use.` });
  }
  if (store.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(409).json({ error: `Email "${email}" is already registered.` });
  }

  const userId = `usr-tea-${Date.now()}`;
  const teacherId = `tea-${Date.now()}`;

  const newUser: User = {
    id: userId,
    name,
    email,
    role: 'teacher',
    status: 'active',
    createdAt: new Date().toISOString(),
  };

  const newTeacher: Teacher = {
    id: teacherId,
    userId,
    teacherCode: teacherCode.toUpperCase(),
    department,
    designation: designation || 'Assistant Professor',
    qualification: qualification || 'M.Tech / Ph.D',
  };

  store.users.push(newUser);
  store.teachers.push(newTeacher);

  // If initial subject was provided for assignment
  if (req.body.initialSubjectId && req.body.initialSemesterId) {
    const existingAssignment = store.teacherSubjectAssignments.find(
      (a) => a.teacherId === teacherId && a.subjectId === req.body.initialSubjectId
    );
    if (!existingAssignment) {
      store.teacherSubjectAssignments.push({
        id: `tsa-${Date.now()}`,
        teacherId,
        subjectId: req.body.initialSubjectId,
        semesterId: req.body.initialSemesterId,
        createdFrom: 'manual',
        confirmedByAdmin: true,
      });
    }
  }

  db.logAudit(req.user!.id, req.user!.name, 'admin', 'TEACHER_CREATED', `Created teacher ${name} (${teacherCode})`);

  res.status(201).json({ teacher: { ...newTeacher, user: newUser } });
});

app.post('/api/admin/teachers/:id/assign-subject', requireRole('admin'), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { subjectId, semesterId } = req.body;
  const store = db.getStore();

  const teacher = store.teachers.find((t) => t.id === id);
  if (!teacher) {
    return res.status(404).json({ error: 'Teacher not found.' });
  }

  const subject = store.subjects.find((s) => s.id === subjectId);
  if (!subject) {
    return res.status(404).json({ error: 'Subject not found.' });
  }

  const semester = store.semesters.find((s) => s.id === semesterId) ||
    store.semesters.find((s) => s.number === subject.semesterNumber && s.status !== 'archived') ||
    store.semesters[0];

  const existingAssignment = store.teacherSubjectAssignments.find(
    (a) => a.teacherId === id && a.subjectId === subjectId && a.semesterId === semester.id
  );

  if (existingAssignment) {
    existingAssignment.confirmedByAdmin = true;
    return res.json({ success: true, assignment: existingAssignment, message: 'Subject assignment already active.' });
  }

  const newAssignment: TeacherSubjectAssignment = {
    id: `tsa-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    teacherId: id,
    subjectId,
    semesterId: semester.id,
    createdFrom: 'manual',
    confirmedByAdmin: true,
  };

  store.teacherSubjectAssignments.push(newAssignment);

  db.logAudit(
    req.user!.id,
    req.user!.name,
    'admin',
    'TEACHER_SUBJECT_ASSIGNED',
    `Assigned subject ${subject.code} (${subject.name}) to teacher ${teacher.teacherCode}`
  );

  res.status(201).json({ success: true, assignment: newAssignment });
});

// Helper for normalizing department aliases
function normalizeDeptCode(deptStr: string, validCodes: string[]): string {
  const d = (deptStr || '').trim().toUpperCase();
  if (validCodes.includes(d)) return d;
  if (['CSE', 'CS', 'COMPUTER SCIENCE', 'COMP SCI', 'CSE-AI', 'AI'].some((k) => d.includes(k) || d === k)) return 'CSE';
  if (['ECE', 'EC', 'ELECTRONICS', 'E&C', 'COMMUNICATION'].some((k) => d.includes(k) || d === k)) return 'ECE';
  if (['ISE', 'IS', 'INFORMATION SCIENCE', 'INFO SCI', 'IT'].some((k) => d.includes(k) || d === k)) return 'ISE';
  if (['MECH', 'ME', 'MECHANICAL'].some((k) => d.includes(k) || d === k)) return 'MECH';
  if (['CIVIL', 'CV'].some((k) => d.includes(k) || d === k)) return 'CIVIL';
  return validCodes[0] || 'CSE';
}

// 2.1 Teacher Bulk Import & Validation
app.post('/api/admin/teachers/import/validate', requireRole('admin'), (req: AuthenticatedRequest, res: Response) => {
  const { rawText, rows } = req.body;
  const store = db.getStore();
  const validDeptCodes = store.departments.map((d) => d.code.toUpperCase());

  let inputRows: any[] = [];
  if (Array.isArray(rows) && rows.length > 0) {
    inputRows = rows;
  } else if (typeof rawText === 'string') {
    const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const startIndex = lines[0]?.toLowerCase().includes('code') || lines[0]?.toLowerCase().includes('name') ? 1 : 0;
    for (let i = startIndex; i < lines.length; i++) {
      const parts = lines[i].split(/[,\t;|]/).map((p) => p.replace(/^["']|["']$/g, '').trim());
      if (parts.length >= 2) {
        inputRows.push({
          teacherCode: parts[0],
          name: parts[1],
          department: parts[2] || 'CSE',
          email: parts[3] || '',
          designation: parts[4] || 'Assistant Professor',
          qualification: parts[5] || 'M.Tech',
        });
      }
    }
  }

  if (inputRows.length === 0) {
    return res.status(400).json({ error: 'No teacher records found in input.' });
  }

  // Calculate next sequential code base
  const existingNumbers = store.teachers
    .map((t) => parseInt(t.teacherCode.replace(/\D/g, ''), 10))
    .filter((n) => !isNaN(n) && n > 0);
  let nextCodeNum = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 10;

  const results: any[] = [];
  let validCount = 0;
  let invalidCount = 0;

  inputRows.forEach((row, idx) => {
    const errors: string[] = [];
    let name = (row.name || '').trim();
    let teacherCode = (row.teacherCode || '').toUpperCase().trim();
    let dept = normalizeDeptCode(row.department, validDeptCodes);
    let designation = (row.designation || 'Assistant Professor').trim();
    let qualification = (row.qualification || 'M.Tech').trim();

    if (!name || name.length < 2) {
      errors.push('Faculty name is required and must be at least 2 characters.');
    }

    if (!teacherCode) {
      teacherCode = `T${(nextCodeNum++).toString().padStart(3, '0')}`;
    }

    const cleanSlug = name
      .toLowerCase()
      .replace(/^(dr\.|prof\.|mr\.|mrs\.|ms\.)\s*/i, '')
      .trim()
      .replace(/[^a-z0-9]+/g, '.');
    let email = (row.email || (cleanSlug ? `${cleanSlug}@campus.edu` : `${teacherCode.toLowerCase()}@campus.edu`)).trim().toLowerCase();

    // Check if this teacher exists
    const isExisting = store.teachers.some((t) => t.teacherCode.toUpperCase() === teacherCode.toUpperCase());

    const isValid = errors.length === 0;
    if (isValid) validCount++;
    else invalidCount++;

    results.push({
      rowNumber: idx + 1,
      teacherCode,
      name,
      department: dept,
      email,
      designation,
      qualification,
      isValid,
      isExisting,
      errors,
    });
  });

  const batchId = `tib-${Date.now()}`;
  res.json({
    batchId,
    totalRows: results.length,
    validRows: validCount,
    invalidRows: invalidCount,
    results,
  });
});

app.post('/api/admin/teachers/import/commit', requireRole('admin'), (req: AuthenticatedRequest, res: Response) => {
  const { rows } = req.body;
  const store = db.getStore();

  let targetRows: any[] = [];
  if (Array.isArray(rows)) {
    targetRows = rows.filter((r) => r.isValid);
  }

  if (targetRows.length === 0) {
    return res.status(400).json({ error: 'No valid teacher rows to commit.' });
  }

  let insertedCount = 0;
  let updatedCount = 0;

  targetRows.forEach((row, idx) => {
    const existingTeacher = store.teachers.find(
      (t) => t.teacherCode.toUpperCase() === row.teacherCode.toUpperCase()
    );

    if (existingTeacher) {
      existingTeacher.department = row.department;
      existingTeacher.designation = row.designation || existingTeacher.designation;
      existingTeacher.qualification = row.qualification || existingTeacher.qualification;

      const user = store.users.find((u) => u.id === existingTeacher.userId);
      if (user) {
        user.name = row.name;
        if (row.email) user.email = row.email.toLowerCase();
      }
      updatedCount++;
    } else {
      const userId = `usr-tea-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`;
      const teacherId = `tea-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`;

      const newUser: User = {
        id: userId,
        name: row.name,
        email: row.email || `${row.teacherCode.toLowerCase()}@campus.edu`,
        role: 'teacher',
        status: 'active',
        createdAt: new Date().toISOString(),
      };

      const newTeacher: Teacher = {
        id: teacherId,
        userId,
        teacherCode: row.teacherCode.toUpperCase(),
        department: row.department,
        designation: row.designation || 'Assistant Professor',
        qualification: row.qualification || 'M.Tech',
      };

      store.users.push(newUser);
      store.teachers.push(newTeacher);
      insertedCount++;
    }
  });

  db.logAudit(
    req.user!.id,
    req.user!.name,
    'admin',
    'TEACHERS_IMPORT_COMMITTED',
    `Committed teacher roster: ${insertedCount} added, ${updatedCount} updated`
  );

  res.json({
    success: true,
    insertedCount,
    updatedCount,
    totalCommitted: insertedCount + updatedCount,
  });
});

app.post('/api/admin/teachers/bulk', requireRole('admin'), (req: AuthenticatedRequest, res: Response) => {
  const { teachers } = req.body;
  const store = db.getStore();
  const validDeptCodes = store.departments.map((d) => d.code.toUpperCase());

  if (!Array.isArray(teachers) || teachers.length === 0) {
    return res.status(400).json({ error: 'Provide a valid array of teacher records.' });
  }

  let createdCount = 0;
  let updatedCount = 0;
  const errors: string[] = [];

  const existingNumbers = store.teachers
    .map((t) => parseInt(t.teacherCode.replace(/\D/g, ''), 10))
    .filter((n) => !isNaN(n) && n > 0);
  let nextCodeNum = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 10;

  teachers.forEach((item, idx) => {
    let { name, email, department, teacherCode, designation, qualification } = item;
    name = (name || '').trim();
    if (!name) {
      errors.push(`Row ${idx + 1}: Name is required.`);
      return;
    }

    teacherCode = (teacherCode || `T${(nextCodeNum++).toString().padStart(3, '0')}`).toUpperCase().trim();
    department = normalizeDeptCode(department, validDeptCodes);

    const cleanSlug = name
      .toLowerCase()
      .replace(/^(dr\.|prof\.|mr\.|mrs\.|ms\.)\s*/i, '')
      .trim()
      .replace(/[^a-z0-9]+/g, '.');
    email = (email || `${cleanSlug || teacherCode.toLowerCase()}@campus.edu`).toLowerCase().trim();

    const existingTeacher = store.teachers.find((t) => t.teacherCode.toUpperCase() === teacherCode.toUpperCase());
    if (existingTeacher) {
      existingTeacher.department = department;
      existingTeacher.designation = designation || existingTeacher.designation;
      existingTeacher.qualification = qualification || existingTeacher.qualification;
      const user = store.users.find((u) => u.id === existingTeacher.userId);
      if (user) {
        user.name = name;
        user.email = email;
      }
      updatedCount++;
      return;
    }

    const userId = `usr-tea-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`;
    const teacherId = `tea-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`;

    const newUser: User = {
      id: userId,
      name,
      email,
      role: 'teacher',
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    const newTeacher: Teacher = {
      id: teacherId,
      userId,
      teacherCode: teacherCode.toUpperCase(),
      department,
      designation: designation || 'Assistant Professor',
      qualification: qualification || 'M.Tech',
    };

    store.users.push(newUser);
    store.teachers.push(newTeacher);
    createdCount++;
  });

  db.logAudit(
    req.user!.id,
    req.user!.name,
    'admin',
    'TEACHERS_BULK_IMPORT',
    `Bulk processed teachers: ${createdCount} created, ${updatedCount} updated`
  );

  res.json({
    createdCount,
    updatedCount,
    errors,
    totalProcessed: teachers.length,
  });
});

// 2.2 Student Bulk Import & Validation
app.post('/api/admin/students/import/validate', requireRole('admin'), (req: AuthenticatedRequest, res: Response) => {
  const { rawText, rows } = req.body;
  const store = db.getStore();
  const validDeptCodes = store.departments.map((d) => d.code.toUpperCase());

  let inputRows: any[] = [];
  if (Array.isArray(rows) && rows.length > 0) {
    inputRows = rows;
  } else if (typeof rawText === 'string') {
    // Parse CSV or tab delimited text (e.g. Sl.No, USN, Name or USN, Name)
    const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const startIndex = lines[0]?.toLowerCase().includes('usn') || lines[0]?.toLowerCase().includes('roll') || lines[0]?.toLowerCase().includes('sl') ? 1 : 0;
    for (let i = startIndex; i < lines.length; i++) {
      const parts = lines[i].split(/[,\t;|]/).map((p) => p.replace(/^["']|["']$/g, '').trim());
      if (parts.length >= 2) {
        let usn = '';
        let name = '';
        let dept = req.body.department || 'CSE';
        let sem = Number(req.body.semester) || 4;
        let sec = req.body.section || 'A';

        // Check if Col 0 is Sl.No (number) and Col 1 is USN
        if (/^\d+$/.test(parts[0]) && parts[1] && parts[1].length >= 4) {
          usn = parts[1];
          name = parts[2] || `Student ${parts[1]}`;
        } else if (parts[0] && parts[0].length >= 4) {
          usn = parts[0];
          name = parts[1] || `Student ${parts[0]}`;
          if (parts[2] && parts[2].length <= 5 && isNaN(Number(parts[2]))) dept = parts[2];
          if (parts[3] && !isNaN(Number(parts[3]))) sem = Number(parts[3]);
          if (parts[4]) sec = parts[4];
        }

        // Auto-detect dept from USN if present (e.g., 2KL23CS -> CSE, 2KL23EC -> ECE)
        const usnUpper = usn.toUpperCase();
        if (usnUpper.includes('CS') || usnUpper.includes('CSE')) dept = 'CSE';
        else if (usnUpper.includes('EC') || usnUpper.includes('ECE')) dept = 'ECE';
        else if (usnUpper.includes('IS') || usnUpper.includes('ISE')) dept = 'ISE';
        else if (usnUpper.includes('ME') || usnUpper.includes('MECH')) dept = 'MECH';
        else if (usnUpper.includes('CV') || usnUpper.includes('CIVIL')) dept = 'CIVIL';

        if (usn && usn.length >= 4 && !usnUpper.includes('USN') && !usnUpper.includes('TOTAL') && !usnUpper.includes('SIGN')) {
          inputRows.push({
            usn: usn.toUpperCase(),
            name: name,
            department: dept,
            semester: sem,
            section: sec,
            email: `${usn.toLowerCase()}@student.campus.edu`,
          });
        }
      }
    }
  }

  if (inputRows.length === 0) {
    return res.status(400).json({ error: 'No student rows found in input.' });
  }

  const results: StudentImportRowResult[] = [];
  let validCount = 0;
  let invalidCount = 0;

  inputRows.forEach((row, idx) => {
    const errors: string[] = [];
    const usn = (row.usn || '').toUpperCase().trim();
    const name = (row.name || '').trim();
    const dept = normalizeDeptCode(row.department, validDeptCodes);
    const sem = Number(row.semester) || 4;
    const sec = (row.section || 'A').toUpperCase().trim();
    const email = (row.email || `${usn.toLowerCase()}@student.campus.edu`).trim().toLowerCase();

    if (!usn || usn.length < 4) {
      errors.push('USN must be at least 4 alphanumeric characters (e.g. 2KL23CS001).');
    }
    if (!name || name.length < 2) {
      errors.push('Name is required and must be at least 2 characters.');
    }
    if (isNaN(sem) || sem < 1 || sem > 8) {
      errors.push('Semester must be an integer between 1 and 8.');
    }

    const isExisting = store.students.some((s) => s.usn.toUpperCase() === usn.toUpperCase());
    const isValid = errors.length === 0;
    if (isValid) validCount++;
    else invalidCount++;

    results.push({
      rowNumber: idx + 1,
      usn,
      name,
      email,
      department: dept,
      semester: sem,
      section: sec || 'A',
      isValid,
      isExisting,
      errors,
    });
  });

  const batchId = `sib-${Date.now()}`;
  const batch: any = {
    id: batchId,
    uploadedFileRef: req.body.fileName || 'students_upload.xlsx',
    totalRows: results.length,
    validRows: validCount,
    invalidRows: invalidCount,
    status: 'preview',
    createdAt: new Date().toISOString(),
    results,
  };

  store.studentImportBatches.push(batch);

  res.json({
    batchId,
    totalRows: results.length,
    validRows: validCount,
    invalidRows: invalidCount,
    results,
  });
});

app.post('/api/admin/students/import/commit', requireRole('admin'), (req: AuthenticatedRequest, res: Response) => {
  const { batchId, rows } = req.body;
  const store = db.getStore();

  let targetRows: StudentImportRowResult[] = [];
  if (Array.isArray(rows)) {
    targetRows = rows.filter((r) => r.isValid);
  } else if (batchId) {
    const batch = store.studentImportBatches.find((b) => b.id === batchId);
    if (batch) {
      targetRows = batch.results.filter((r) => r.isValid);
      batch.status = 'committed';
    }
  }

  if (targetRows.length === 0) {
    return res.status(400).json({ error: 'No valid rows to commit.' });
  }

  let updatedCount = 0;
  let insertedCount = 0;

  targetRows.forEach((row) => {
    const existingStudent = store.students.find((s) => s.usn.toUpperCase() === row.usn.toUpperCase());
    if (existingStudent) {
      // Update existing student
      existingStudent.department = row.department;
      existingStudent.currentSemester = row.semester;
      existingStudent.section = row.section;

      const user = store.users.find((u) => u.id === existingStudent.userId);
      if (user) {
        user.name = row.name;
        if (row.email) user.email = row.email;
      }
      updatedCount++;
    } else {
      // Insert new user + student
      const userId = `usr-stu-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      const studentId = `stu-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

      const newUser: User = {
        id: userId,
        name: row.name,
        email: row.email || `${row.usn.toLowerCase()}@student.campus.edu`,
        role: 'student',
        status: 'active',
        createdAt: new Date().toISOString(),
      };

      const newStudent: Student = {
        id: studentId,
        userId,
        usn: row.usn.toUpperCase(),
        department: row.department,
        currentSemester: row.semester,
        section: row.section,
      };

      store.users.push(newUser);
      store.students.push(newStudent);
      insertedCount++;
    }
  });

  db.logAudit(
    req.user!.id,
    req.user!.name,
    'admin',
    'STUDENT_IMPORT_COMMITTED',
    `Processed student import: ${insertedCount} inserted, ${updatedCount} updated`
  );

  res.json({
    success: true,
    insertedCount,
    updatedCount,
    totalCommitted: insertedCount + updatedCount,
  });
});

app.get('/api/admin/students', requireRole('admin'), (req: AuthenticatedRequest, res: Response) => {
  const store = db.getStore();
  const studentsWithUser = store.students.map((s) => {
    const user = store.users.find((u) => u.id === s.userId);
    const name = getStudentDisplayName(s, store);
    return {
      ...s,
      name,
      user: user || { id: s.userId, name, email: `${s.usn.toLowerCase()}@student.campus.edu`, role: 'student', status: 'active', createdAt: new Date().toISOString() },
    };
  });
  res.json({ students: studentsWithUser, total: studentsWithUser.length });
});

app.post('/api/admin/students', requireRole('admin'), (req: AuthenticatedRequest, res: Response) => {
  const { usn, name, department, semester, section, email } = req.body;
  const store = db.getStore();

  const cleanUsn = (usn || '').toUpperCase().trim();
  const cleanName = (name || '').trim();
  const cleanDept = (department || 'CSE').toUpperCase().trim();
  const numSemester = Number(semester) || 4;
  const cleanSection = (section || 'A').toUpperCase().trim();
  const cleanEmail = (email || `${cleanUsn.toLowerCase()}@student.campus.edu`).trim().toLowerCase();

  if (!cleanUsn || cleanUsn.length < 4) {
    return res.status(400).json({ error: 'Valid USN is required (at least 4 characters).' });
  }
  if (!cleanName || cleanName.length < 2) {
    return res.status(400).json({ error: 'Student full name is required.' });
  }

  // Check duplicate USN
  if (store.students.some((s) => s.usn.toUpperCase() === cleanUsn)) {
    return res.status(409).json({ error: `A student with USN "${cleanUsn}" is already registered.` });
  }

  // Check duplicate user email
  if (store.users.some((u) => u.email.toLowerCase() === cleanEmail)) {
    return res.status(409).json({ error: `A student with email "${cleanEmail}" is already registered.` });
  }

  const userId = `usr-stu-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
  const studentId = `stu-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

  const newUser: User = {
    id: userId,
    name: cleanName,
    email: cleanEmail,
    role: 'student',
    status: 'active',
    createdAt: new Date().toISOString(),
  };

  const newStudent: Student = {
    id: studentId,
    userId,
    usn: cleanUsn,
    department: cleanDept,
    currentSemester: numSemester,
    section: cleanSection,
  };

  store.users.push(newUser);
  store.students.push(newStudent);

  db.logAudit(
    req.user!.id,
    req.user!.name,
    'admin',
    'STUDENT_CREATED',
    `Enrolled student ${cleanName} (${cleanUsn}) in Sem ${numSemester} ${cleanDept}`
  );

  res.status(201).json({
    success: true,
    student: {
      ...newStudent,
      user: newUser,
    },
  });
});

app.get('/api/admin/subjects', requireRole('admin', 'teacher'), (req: AuthenticatedRequest, res: Response) => {
  const store = db.getStore();
  const enriched = store.subjects.map((sub) => {
    const dept = store.departments.find((d) => d.id === sub.departmentId);
    return {
      ...sub,
      departmentCode: dept?.code || 'CSE',
      departmentName: dept?.name || 'Computer Science & Engineering',
    };
  });
  res.json({ subjects: enriched });
});

// 2.3 Timetable AI Upload, Extraction, Review & Confirm
app.post('/api/admin/timetable/upload', requireRole('admin'), async (req: AuthenticatedRequest, res: Response) => {
  const { fileName, fileContent, rawText, imageData, imageMimeType, semester, departmentCode } = req.body;
  const store = db.getStore();

  const content = fileContent || rawText || '';
  const teachersWithUser = store.teachers.map((t) => ({
    ...t,
    user: store.users.find((u) => u.id === t.userId),
  }));

  try {
    const extractedRows = await extractTimetableData({
      fileName: fileName || (imageData ? 'Timetable_Photo.png' : 'Timetable_Spring2026.csv'),
      fileContent: content,
      imageData,
      imageMimeType: imageMimeType || 'image/jpeg',
      existingTeachers: teachersWithUser,
      currentSemesters: store.semesters.map((s) => s.number),
      defaultSemester: Number(semester) || 4,
      defaultDepartment: departmentCode || 'CSE',
    });

    const uploadId = `tt-${Date.now()}`;
    const timetableUpload: any = {
      id: uploadId,
      uploadedFileRef: fileName || (imageData ? 'Timetable_Photo.png' : 'Timetable_Upload.csv'),
      hasImage: Boolean(imageData),
      status: 'ready_for_review',
      createdAt: new Date().toISOString(),
      extractedRows,
    };

    store.timetableUploads.push(timetableUpload);

    db.logAudit(
      req.user!.id,
      req.user!.name,
      'admin',
      'TIMETABLE_EXTRACTED',
      `Extracted ${extractedRows.length} subject-faculty mappings via ${imageData ? 'Multimodal Photo AI' : 'Text OCR'}`
    );

    res.json({
      uploadId,
      extractedRows,
      totalRows: extractedRows.length,
      availableTeachers: teachersWithUser,
      hasImage: Boolean(imageData),
    });
  } catch (error: any) {
    console.error('Timetable upload/extraction error:', error);
    res.status(500).json({ error: error.message || 'Timetable extraction failed.' });
  }
});

app.get('/api/admin/timetable/:id/review', requireRole('admin'), (req: AuthenticatedRequest, res: Response) => {
  const store = db.getStore();
  const upload = store.timetableUploads.find((t) => t.id === req.params.id);
  if (!upload) {
    return res.status(404).json({ error: 'Timetable upload not found.' });
  }
  const teachersWithUser = store.teachers.map((t) => ({
    ...t,
    user: store.users.find((u) => u.id === t.userId),
  }));

  res.json({ upload, teachers: teachersWithUser });
});

app.post('/api/admin/timetable/:id/confirm', requireRole('admin'), (req: AuthenticatedRequest, res: Response) => {
  const { confirmedRows } = req.body;
  const store = db.getStore();
  const upload = store.timetableUploads.find((t) => t.id === req.params.id);

  const rowsToConfirm: ExtractedTimetableRow[] = confirmedRows || upload?.extractedRows || [];

  if (rowsToConfirm.length === 0) {
    return res.status(400).json({ error: 'No rows to confirm.' });
  }

  let createdAssignments = 0;
  let createdSubjectsCount = 0;
  let createdProfessorsCount = 0;

  // Calculate next sequential teacher code
  const existingNumbers = store.teachers
    .map((t) => parseInt(t.teacherCode.replace(/\D/g, ''), 10))
    .filter((n) => !isNaN(n) && n > 0);
  let nextCodeNum = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 10;

  rowsToConfirm.forEach((row) => {
    if (!row.subjectCode || !row.subjectName) return;

    const rowSemNum = Number(row.semester) || 4;
    const rawDeptCode = (row.departmentCode || 'CSE').toUpperCase().trim();

    // 1. Resolve Department
    let dept = store.departments.find(
      (d) => d.code.toUpperCase() === rawDeptCode || d.name.toUpperCase().includes(rawDeptCode)
    );
    if (!dept) {
      dept = store.departments[0] || { id: 'dept-cse', name: 'Computer Science & Engineering', code: 'CSE' };
    }

    // 2. Add or Update Subject in Master Catalog
    const cleanSubCode = row.subjectCode.toUpperCase().trim();
    let subject = store.subjects.find((s) => s.code.toUpperCase() === cleanSubCode);
    
    if (!subject) {
      subject = {
        id: `sub-${cleanSubCode.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString(36)}`,
        code: cleanSubCode,
        name: row.subjectName.trim(),
        departmentId: dept.id,
        semesterNumber: rowSemNum,
        credits: Number(row.credits) || 4,
      };
      store.subjects.push(subject);
      createdSubjectsCount++;
    } else {
      // Update subject metadata with extracted details
      subject.name = row.subjectName.trim() || subject.name;
      subject.semesterNumber = rowSemNum || subject.semesterNumber;
      if (row.credits) subject.credits = Number(row.credits);
      if (dept.id) subject.departmentId = dept.id;
    }

    // 3. Resolve or Auto-Register Professor / Faculty
    let resolvedTeacherId: string | null = row.matchedTeacherId || null;

    if (!resolvedTeacherId && row.teacherNameRaw && row.teacherNameRaw.trim().length > 1) {
      const rawName = row.teacherNameRaw.trim();
      const existingTchr = store.teachers.find((t) => {
        const u = store.users.find((usr) => usr.id === t.userId);
        return u?.name.toLowerCase() === rawName.toLowerCase() || t.teacherCode.toLowerCase() === rawName.toLowerCase();
      });

      if (existingTchr) {
        resolvedTeacherId = existingTchr.id;
      } else {
        // Auto-Register new professor from timetable
        const tCode = `T${(nextCodeNum++).toString().padStart(3, '0')}`;
        const newUserId = `usr-${tCode.toLowerCase()}-${Date.now().toString(36)}`;
        const cleanSlug = rawName
          .toLowerCase()
          .replace(/^(dr\.|prof\.|mr\.|mrs\.|ms\.)\s*/i, '')
          .trim()
          .replace(/[^a-z0-9]+/g, '.');
        const profEmail = row.professorEmail || (cleanSlug ? `${cleanSlug}@campus.edu` : `${tCode.toLowerCase()}@campus.edu`);

        const newUser: User = {
          id: newUserId,
          name: rawName,
          email: profEmail,
          role: 'teacher',
          status: 'active',
          createdAt: new Date().toISOString(),
        };
        store.users.push(newUser);

        const newTeacher: Teacher = {
          id: `tchr-${tCode.toLowerCase()}`,
          userId: newUserId,
          teacherCode: tCode,
          department: dept.code,
          designation: 'Assistant Professor',
          qualification: 'M.Tech / Ph.D',
        };
        store.teachers.push(newTeacher);

        resolvedTeacherId = newTeacher.id;
        createdProfessorsCount++;
      }
    }

    // 4. Assign Professor to Subject in Target Semester
    if (resolvedTeacherId && subject) {
      // Find matching active semester
      let targetSemester = store.semesters.find(
        (s) => s.number === rowSemNum && s.departmentCode.toUpperCase() === dept!.code.toUpperCase() && s.status === 'active'
      );
      if (!targetSemester) {
        targetSemester = store.semesters.find((s) => s.number === rowSemNum && s.status === 'active');
      }
      if (!targetSemester) {
        targetSemester = store.semesters.find((s) => s.number === rowSemNum) || store.semesters[0];
      }

      if (targetSemester) {
        const existingAssignment = store.teacherSubjectAssignments.find(
          (a) => a.teacherId === resolvedTeacherId && a.subjectId === subject!.id && a.semesterId === targetSemester!.id
        );

        if (!existingAssignment) {
          store.teacherSubjectAssignments.push({
            id: `tsa-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 4)}`,
            teacherId: resolvedTeacherId,
            subjectId: subject.id,
            semesterId: targetSemester.id,
            createdFrom: 'ai_timetable',
            confirmedByAdmin: true,
          });
          createdAssignments++;
        } else {
          existingAssignment.confirmedByAdmin = true;
        }
      }
    }
  });

  if (upload) {
    upload.status = 'confirmed';
  }

  db.logAudit(
    req.user!.id,
    req.user!.name,
    'admin',
    'TIMETABLE_CONFIRMED',
    `Confirmed timetable: Provisioned ${createdSubjectsCount} subjects, registered ${createdProfessorsCount} professors, linked ${createdAssignments} faculty-subject assignments.`
  );

  res.json({
    success: true,
    createdAssignments,
    createdSubjectsCount,
    createdProfessorsCount,
    totalSubjects: store.subjects.length,
    totalTeachers: store.teachers.length,
    totalAssignments: store.teacherSubjectAssignments.length,
  });
});

// 2.4 Semester Activation, Creation, Deletion & Complete Semester Archival & Progression
app.get('/api/admin/semesters', requireRole('admin'), (req: AuthenticatedRequest, res: Response) => {
  const store = db.getStore();
  const enriched = store.semesters.map((s) => ({
    ...s,
    name: `Semester ${s.number} (${s.departmentCode}) - Section ${s.section}`,
    semesterNumber: s.number,
    startDate: s.academicYear ? `${s.academicYear.split('-')[0]}-08-01` : '2025-08-01',
    endDate: s.academicYear ? `${s.academicYear.split('-')[1] || '2026'}-05-31` : '2026-05-31',
    subjectsCount: store.subjects.filter((sub) => sub.semesterNumber === s.number).length,
    studentsCount: store.students.filter((st) => st.currentSemester === s.number && st.department === s.departmentCode).length,
    teacherAssignmentsCount: store.teacherSubjectAssignments.filter((a) => a.semesterId === s.id && a.confirmedByAdmin).length,
  }));
  res.json({ semesters: enriched });
});

app.post('/api/admin/semesters', requireRole('admin'), (req: AuthenticatedRequest, res: Response) => {
  const { number, departmentCode, section, academicYear, status } = req.body;
  const store = db.getStore();
  const numSemester = Number(number);
  const cleanDept = (departmentCode || 'CSE').toUpperCase().trim();
  const cleanSec = (section || 'A').toUpperCase().trim();
  const cleanAY = (academicYear || store.settings.academicYear || '2025-2026').trim();
  const initStatus = status === 'active' ? 'active' : 'setup';

  if (isNaN(numSemester) || numSemester < 1 || numSemester > 8) {
    return res.status(400).json({ error: 'Semester number must be an integer between 1 and 8.' });
  }

  // Check if identical semester already exists
  const existing = store.semesters.find(
    (s) => s.number === numSemester && s.departmentCode === cleanDept && s.section === cleanSec && s.academicYear === cleanAY
  );
  if (existing) {
    return res.status(409).json({ error: `Semester ${numSemester} ${cleanDept} Sec ${cleanSec} (AY ${cleanAY}) already exists.` });
  }

  // If new is active, archive other active ones for same dept/section
  if (initStatus === 'active') {
    store.semesters
      .filter((s) => s.departmentCode === cleanDept && s.section === cleanSec)
      .forEach((s) => {
        if (s.status === 'active') s.status = 'archived';
      });
  }

  const newSemester: Semester = {
    id: `sem-${cleanDept.toLowerCase()}-${numSemester}-${Date.now().toString(36)}`,
    number: numSemester,
    academicYear: cleanAY,
    departmentCode: cleanDept,
    section: cleanSec,
    status: initStatus,
    createdAt: new Date().toISOString(),
  };

  store.semesters.push(newSemester);

  db.logAudit(
    req.user!.id,
    req.user!.name,
    'admin',
    'SEMESTER_CREATED',
    `Created Semester ${numSemester} ${cleanDept} Sec ${cleanSec} (${initStatus})`
  );

  res.status(201).json({ success: true, semester: newSemester });
});

app.delete('/api/admin/semesters/:id', requireRole('admin'), (req: AuthenticatedRequest, res: Response) => {
  const store = db.getStore();
  const index = store.semesters.findIndex((s) => s.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Semester not found.' });
  }
  const [removed] = store.semesters.splice(index, 1);
  db.logAudit(
    req.user!.id,
    req.user!.name,
    'admin',
    'SEMESTER_DELETED',
    `Removed semester cycle ${removed.number} ${removed.departmentCode}`
  );
  res.json({ success: true, message: 'Semester cycle removed successfully.' });
});

app.get('/api/admin/semesters/:id/students', requireRole('admin'), (req: AuthenticatedRequest, res: Response) => {
  const store = db.getStore();
  const semester = store.semesters.find((s) => s.id === req.params.id);
  if (!semester) {
    return res.status(404).json({ error: 'Semester not found.' });
  }

  let matching = store.students.filter(
    (st) => st.currentSemester === semester.number && (!semester.departmentCode || st.department === semester.departmentCode)
  );

  if (matching.length === 0 && semester.departmentCode) {
    matching = store.students.filter((st) => st.department === semester.departmentCode);
  }

  if (matching.length === 0) {
    matching = store.students;
  }

  const matchingStudents = matching.map((st) => {
    const user = store.users.find((u) => u.id === st.userId);
    const studentRecords = store.attendanceRecords.filter((r) => r.studentId === st.id);
    const attended = studentRecords.filter((r) => r.status === 'present').length;
    const total = studentRecords.length;
    const pct = total > 0 ? Math.round((attended / total) * 100) : 100;
    return {
      id: st.id,
      userId: st.userId,
      usn: st.usn,
      name: getStudentDisplayName(st, store),
      email: user?.email || `${st.usn.toLowerCase()}@student.campus.edu`,
      department: st.department,
      currentSemester: st.currentSemester,
      section: st.section,
      attendancePercentage: pct,
    };
  });

  res.json({ students: matchingStudents, total: matchingStudents.length, semester });
});

app.post('/api/admin/semesters/activate', requireRole('admin'), (req: AuthenticatedRequest, res: Response) => {
  const { semesterId } = req.body;
  const store = db.getStore();

  const semester = store.semesters.find((s) => s.id === semesterId);
  if (!semester) {
    return res.status(404).json({ error: 'Semester not found.' });
  }

  // Enforce rule: Only one semester per department/section can be active
  store.semesters
    .filter((s) => s.departmentCode === semester.departmentCode && s.section === semester.section && s.id !== semester.id)
    .forEach((s) => {
      if (s.status === 'active') s.status = 'archived';
    });

  semester.status = 'active';

  db.logAudit(
    req.user!.id,
    req.user!.name,
    'admin',
    'SEMESTER_ACTIVATED',
    `Activated Semester ${semester.number} ${semester.departmentCode} (Sec ${semester.section})`
  );

  res.json({ success: true, semester });
});

app.post('/api/admin/semesters/:id/complete', requireRole('admin'), (req: AuthenticatedRequest, res: Response) => {
  const store = db.getStore();
  const semester = store.semesters.find((s) => s.id === req.params.id);
  if (!semester) {
    return res.status(404).json({ error: 'Semester not found.' });
  }

  semester.status = 'archived';

  db.logAudit(
    req.user!.id,
    req.user!.name,
    'admin',
    'SEMESTER_ARCHIVED',
    `Completed and archived Semester ${semester.number} ${semester.departmentCode}`
  );

  res.json({
    success: true,
    message: `Semester ${semester.number} ${semester.departmentCode} archived. You can now setup a new semester.`,
  });
});

app.post('/api/admin/semesters/:id/complete-and-promote', requireRole('admin'), (req: AuthenticatedRequest, res: Response) => {
  const store = db.getStore();
  const currentSemester = store.semesters.find((s) => s.id === req.params.id);
  if (!currentSemester) {
    return res.status(404).json({ error: 'Current semester not found.' });
  }

  const {
    targetSemesterNumber,
    targetAcademicYear,
    studentIds,
    activateNextSemester = true,
  } = req.body;

  const nextSemNum = Number(targetSemesterNumber) || (currentSemester.number + 1);
  const nextAY = (targetAcademicYear || currentSemester.academicYear).trim();

  // 1. Archive current semester
  currentSemester.status = 'archived';

  // 2. Find or create the next semester (if <= 8)
  let nextSemester: Semester | undefined;
  if (nextSemNum <= 8) {
    nextSemester = store.semesters.find(
      (s) =>
        s.number === nextSemNum &&
        s.departmentCode === currentSemester.departmentCode &&
        s.section === currentSemester.section &&
        s.academicYear === nextAY
    );

    if (!nextSemester) {
      nextSemester = {
        id: `sem-${currentSemester.departmentCode.toLowerCase()}-${nextSemNum}-${Date.now().toString(36)}`,
        number: nextSemNum,
        academicYear: nextAY,
        departmentCode: currentSemester.departmentCode,
        section: currentSemester.section,
        status: activateNextSemester ? 'active' : 'setup',
        createdAt: new Date().toISOString(),
      };
      store.semesters.push(nextSemester);
    } else if (activateNextSemester) {
      store.semesters
        .filter((s) => s.departmentCode === currentSemester.departmentCode && s.section === currentSemester.section && s.id !== nextSemester!.id)
        .forEach((s) => {
          if (s.status === 'active') s.status = 'archived';
        });
      nextSemester.status = 'active';
    }
  }

  // 3. Promote matching students
  let eligibleStudents: Student[] = [];

  if (Array.isArray(studentIds) && studentIds.length > 0) {
    eligibleStudents = store.students.filter((st) => studentIds.includes(st.id));
  } else {
    eligibleStudents = store.students.filter(
      (st) => st.currentSemester === currentSemester.number && (!currentSemester.departmentCode || st.department === currentSemester.departmentCode)
    );
    if (eligibleStudents.length === 0 && currentSemester.departmentCode) {
      eligibleStudents = store.students.filter((st) => st.department === currentSemester.departmentCode);
    }
  }

  let promotedCount = 0;
  const promotedUserIds: string[] = [];

  eligibleStudents.forEach((st) => {
    st.currentSemester = nextSemNum;
    promotedCount++;
    promotedUserIds.push(st.userId);
  });

  // 4. Send real system notifications
  if (promotedUserIds.length > 0) {
    if (nextSemNum <= 8) {
      db.notifyUsers(
        promotedUserIds,
        'system',
        `Semester Progression: Promoted to Sem ${nextSemNum}`,
        `You have been promoted to Semester ${nextSemNum} (${currentSemester.departmentCode}). Welcome to your new term!`,
        '/student'
      );
    } else {
      db.notifyUsers(
        promotedUserIds,
        'system',
        'Congratulations on Graduation!',
        `You have successfully completed Semester 8 (${currentSemester.departmentCode}) and graduated!`,
        '/student'
      );
    }
  }

  db.logAudit(
    req.user!.id,
    req.user!.name,
    'admin',
    'SEMESTER_COMPLETED_AND_PROMOTED',
    `Archived Sem ${currentSemester.number} ${currentSemester.departmentCode} and promoted ${promotedCount} students to Sem ${nextSemNum}`
  );

  res.json({
    success: true,
    message: `Completed Semester ${currentSemester.number} and promoted ${promotedCount} students to Semester ${nextSemNum}.`,
    promotedCount,
    archivedSemester: currentSemester,
    nextSemester,
  });
});

// 2.5 Admin Notices & Events
app.post('/api/admin/notices', requireRole('admin'), (req: AuthenticatedRequest, res: Response) => {
  const { title, body, audienceType, audienceTargetId, priority } = req.body;
  const store = db.getStore();

  if (!title || !body || !audienceType) {
    return res.status(400).json({ error: 'Title, body, and audienceType are required.' });
  }

  const newNotice: Notice = {
    id: `not-${Date.now()}`,
    title,
    body,
    createdBy: req.user!.id,
    authorName: req.user!.name,
    audienceType,
    audienceTargetId: audienceTargetId || null,
    priority: priority || 'normal',
    createdAt: new Date().toISOString(),
  };

  store.notices.unshift(newNotice);

  // Generate real server-side notifications for matching students
  let targetStudentUserIds: string[] = [];
  if (audienceType === 'everyone') {
    targetStudentUserIds = store.students.map((s) => s.userId);
  } else if (audienceType === 'department') {
    targetStudentUserIds = store.students
      .filter((s) => s.department.toUpperCase() === (audienceTargetId || '').toUpperCase())
      .map((s) => s.userId);
  } else if (audienceType === 'semester') {
    targetStudentUserIds = store.students
      .filter((s) => s.currentSemester === Number(audienceTargetId))
      .map((s) => s.userId);
  }

  db.notifyUsers(
    targetStudentUserIds,
    'notice',
    `New Notice: ${title}`,
    body.slice(0, 120) + (body.length > 120 ? '...' : ''),
    '/student/notices'
  );

  db.logAudit(req.user!.id, req.user!.name, 'admin', 'NOTICE_PUBLISHED', `Published notice "${title}" to ${audienceType}`);

  res.status(201).json({ notice: newNotice, notifiedStudentsCount: targetStudentUserIds.length });
});

app.post('/api/admin/events', requireRole('admin'), (req: AuthenticatedRequest, res: Response) => {
  const { title, description, date, venue, posterImageUrl, organizer } = req.body;
  const store = db.getStore();

  if (!title || !description || !date || !venue) {
    return res.status(400).json({ error: 'Title, description, date, and venue are required.' });
  }

  const newEvent: Event = {
    id: `evt-${Date.now()}`,
    title,
    description,
    date,
    venue,
    posterImageUrl: posterImageUrl || 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=800&q=80',
    createdBy: req.user!.id,
    organizer: organizer || 'Campus Academic Hub',
    createdAt: new Date().toISOString(),
  };

  store.events.unshift(newEvent);

  // Notify all students
  const allStudentUserIds = store.students.map((s) => s.userId);
  db.notifyUsers(
    allStudentUserIds,
    'event',
    `Upcoming Campus Event: ${title}`,
    `Scheduled for ${date} at ${venue}`,
    '/student/events'
  );

  db.logAudit(req.user!.id, req.user!.name, 'admin', 'EVENT_PUBLISHED', `Published event "${title}" on ${date}`);

  res.status(201).json({ event: newEvent });
});

// 2.6 Admin Reports (Attendance, Assignments, Marks with CSV export)
app.get('/api/admin/reports/attendance', requireRole('admin'), (req: AuthenticatedRequest, res: Response) => {
  const store = db.getStore();
  const { department, semester, belowThreshold, subjectId, search } = req.query;

  let students = store.students.map((s) => {
    const user = store.users.find((u) => u.id === s.userId);
    // Calculate student attendance across all subjects
    const records = store.attendanceRecords.filter((r) => r.studentId === s.id);
    const total = records.length;
    const present = records.filter((r) => r.status === 'present').length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 100;

    return {
      studentId: s.id,
      usn: s.usn,
      name: user?.name || 'Unknown',
      department: s.department,
      semester: s.currentSemester,
      section: s.section,
      totalClasses: total,
      attendedClasses: present,
      percentage,
      status: percentage < 50 ? 'critical' : percentage < 80 ? 'warning' : 'good',
    };
  });

  if (department) {
    students = students.filter((s) => s.department === department);
  }
  if (semester) {
    students = students.filter((s) => s.semester === Number(semester));
  }
  if (belowThreshold === '80') {
    students = students.filter((s) => s.percentage < 80);
  } else if (belowThreshold === '50') {
    students = students.filter((s) => s.percentage < 50);
  }
  if (search) {
    const q = (search as string).toLowerCase();
    students = students.filter((s) => s.name.toLowerCase().includes(q) || s.usn.toLowerCase().includes(q));
  }

  // Summary Metrics
  const totalStudents = students.length;
  const below80Count = students.filter((s) => s.percentage < 80).length;
  const below50Count = students.filter((s) => s.percentage < 50).length;
  const avgAttendance = totalStudents > 0 ? Math.round(students.reduce((acc, s) => acc + s.percentage, 0) / totalStudents) : 0;

  res.json({
    students,
    total: students.length,
    metrics: {
      totalStudents,
      below80Count,
      below50Count,
      avgAttendance,
    },
  });
});

app.get('/api/admin/reports/assignments', requireRole('admin'), (req: AuthenticatedRequest, res: Response) => {
  const store = db.getStore();
  const assignmentsReport = store.assignments.map((a) => {
    const subject = store.subjects.find((sub) => sub.id === a.subjectId);
    const teacher = store.teachers.find((t) => t.id === a.teacherId);
    const teacherUser = teacher ? store.users.find((u) => u.id === teacher.userId) : null;
    const statuses = store.assignmentSubmissionStatuses.filter((s) => s.assignmentId === a.id);
    const total = statuses.length;
    const submitted = statuses.filter((s) => s.status === 'submitted').length;
    const notSubmitted = total - submitted;
    const rate = total > 0 ? Math.round((submitted / total) * 100) : 0;

    return {
      assignmentId: a.id,
      title: a.title,
      subjectCode: subject?.code || 'N/A',
      subjectName: subject?.name || 'N/A',
      teacherName: teacherUser?.name || 'Faculty',
      dueDate: a.dueDate,
      totalStudents: total,
      submittedCount: submitted,
      notSubmittedCount: notSubmitted,
      submissionRate: rate,
    };
  });

  res.json({ assignments: assignmentsReport });
});

app.get('/api/admin/reports/marks', requireRole('admin'), (req: AuthenticatedRequest, res: Response) => {
  const store = db.getStore();
  const sheets = store.testMarkSheets.map((tms) => {
    const subject = store.subjects.find((s) => s.id === tms.subjectId);
    const teacher = store.teachers.find((t) => t.id === tms.teacherId);
    const teacherUser = teacher ? store.users.find((u) => u.id === teacher.userId) : null;
    const marksList = store.testMarks.filter((tm) => tm.testMarkSheetId === tms.id);

    const scores = marksList.map((m) => m.marks);
    const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const max = scores.length > 0 ? Math.max(...scores) : 0;
    const min = scores.length > 0 ? Math.min(...scores) : 0;

    return {
      sheetId: tms.id,
      testName: tms.testName,
      subjectCode: subject?.code || 'N/A',
      subjectName: subject?.name || 'N/A',
      teacherName: teacherUser?.name || 'Faculty',
      maxMarks: tms.maxMarks,
      published: tms.published,
      totalEvaluated: marksList.length,
      averageMarks: avg,
      highestMarks: max,
      lowestMarks: min,
    };
  });

  res.json({ sheets });
});

// Admin Audit Logs
app.get('/api/admin/audit-logs', requireRole('admin'), (req: AuthenticatedRequest, res: Response) => {
  const store = db.getStore();
  res.json({ logs: store.auditLogs.slice(0, 100) });
});

// ==========================================
// 3. TEACHER ENDPOINTS
// ==========================================

// 3.1 Teacher Subjects
app.get('/api/teacher/subjects', requireRole('teacher', 'admin'), (req: AuthenticatedRequest, res: Response) => {
  const store = db.getStore();
  const teacher = req.teacher || (req.user?.role === 'admin' ? store.teachers[0] : null);

  if (!teacher) {
    return res.status(403).json({ error: 'No associated teacher profile found.' });
  }

  const assignments = store.teacherSubjectAssignments.filter(
    (a) => a.teacherId === teacher.id && a.confirmedByAdmin
  );

  const enriched = assignments.map((a) => {
    const subject = store.subjects.find((s) => s.id === a.subjectId);
    const semester = store.semesters.find((s) => s.id === a.semesterId);
    const studentsCount = store.students.filter(
      (st) => semester && st.currentSemester === semester.number && st.department === semester.departmentCode
    ).length;
    const sessionsCount = store.attendanceSessions.filter((att) => att.subjectId === a.subjectId).length;
    const activeAssignments = store.assignments.filter((asg) => asg.subjectId === a.subjectId).length;

    return {
      id: a.subjectId,
      assignmentId: a.id,
      subjectId: a.subjectId,
      semesterId: a.semesterId,
      code: subject?.code || '',
      name: subject?.name || '',
      subjectCode: subject?.code || '',
      subjectName: subject?.name || '',
      semesterNumber: semester?.number || 4,
      departmentCode: semester?.departmentCode || 'CSE',
      department: semester?.departmentCode || 'CSE',
      section: semester?.section || 'A',
      credits: subject?.credits || 4,
      type: 'Core Theory',
      studentsCount,
      enrolledStudentsCount: studentsCount,
      sessionsCount,
      activeAssignments,
    };
  });

  res.json({ subjects: enriched, teacher });
});

// 3.2 Teacher Attendance Sessions
app.get('/api/teacher/attendance/sessions', requireRole('teacher', 'admin'), (req: AuthenticatedRequest, res: Response) => {
  const store = db.getStore();
  const teacher = req.teacher || (req.user?.role === 'admin' ? store.teachers[0] : null);
  const { subjectId } = req.query;

  let sessions = store.attendanceSessions;
  if (teacher && req.user?.role === 'teacher') {
    sessions = sessions.filter((s) => s.teacherId === teacher.id);
  }
  if (subjectId) {
    sessions = sessions.filter((s) => s.subjectId === subjectId);
  }

  const enriched = sessions.map((sess) => {
    const subject = store.subjects.find((s) => s.id === sess.subjectId);
    const records = store.attendanceRecords.filter((r) => r.attendanceSessionId === sess.id);
    const present = records.filter((r) => r.status === 'present').length;
    const absent = records.filter((r) => r.status === 'absent').length;

    return {
      ...sess,
      subjectName: subject?.name,
      subjectCode: subject?.code,
      recordsCount: {
        total: records.length,
        present,
        absent,
      },
    };
  });

  res.json({ sessions: enriched });
});

// Helper to reliably get student display name across all storage formats
function getStudentDisplayName(student: Student, store: any): string {
  const user = store.users.find((u: any) => u.id === student.userId);
  if (user && user.name && user.name.trim().length > 0) {
    return user.name;
  }
  if ((student as any).name && typeof (student as any).name === 'string' && (student as any).name.trim().length > 0) {
    return (student as any).name;
  }
  if ((student as any).studentName && typeof (student as any).studentName === 'string' && (student as any).studentName.trim().length > 0) {
    return (student as any).studentName;
  }
  return student.usn ? `Student (${student.usn})` : 'Student';
}

// Multi-tier student resolver: guarantees enrolled students are found without dropping records
function getEnrolledStudentsForSubject(subjectId?: string, semesterIdOrNumber?: string | number, departmentCode?: string): Student[] {
  const store = db.getStore();
  const allStudents = store.students;
  if (!allStudents || allStudents.length === 0) {
    return [];
  }

  const subject = subjectId ? store.subjects.find((s) => s.id === subjectId) : undefined;
  
  let targetSemester: number | undefined;
  let targetDept: string | undefined;

  if (subject) {
    targetSemester = subject.semesterNumber;
    targetDept = (subject as any).departmentCode || (subject as any).departmentId;
  }

  if (semesterIdOrNumber !== undefined && semesterIdOrNumber !== '') {
    if (typeof semesterIdOrNumber === 'number') {
      targetSemester = semesterIdOrNumber;
    } else {
      const semObj = store.semesters.find((s) => s.id === semesterIdOrNumber);
      if (semObj) {
        targetSemester = semObj.number;
        if (!targetDept) targetDept = semObj.departmentCode;
      } else if (!isNaN(Number(semesterIdOrNumber))) {
        targetSemester = Number(semesterIdOrNumber);
      }
    }
  }

  if (departmentCode) {
    targetDept = departmentCode;
  }

  // Tier 1: exact semester AND exact department
  if (targetSemester && targetDept) {
    const tier1 = allStudents.filter(
      (st) => st.currentSemester === targetSemester && (!st.department || st.department.toUpperCase() === targetDept?.toUpperCase())
    );
    if (tier1.length > 0) return tier1;
  }

  // Tier 2: exact semester
  if (targetSemester) {
    const tier2 = allStudents.filter((st) => st.currentSemester === targetSemester);
    if (tier2.length > 0) return tier2;
  }

  // Tier 3: exact department
  if (targetDept) {
    const tier3 = allStudents.filter((st) => st.department && st.department.toUpperCase() === targetDept?.toUpperCase());
    if (tier3.length > 0) return tier3;
  }

  // Tier 4: Fallback to all students in database (ensures newly imported or entered students are never hidden)
  return allStudents;
}

// Get enrolled students for taking attendance
app.get('/api/teacher/attendance/roster', requireRole('teacher', 'admin'), (req: AuthenticatedRequest, res: Response) => {
  const store = db.getStore();
  const { subjectId, semesterId } = req.query;

  if (!subjectId) {
    return res.status(400).json({ error: 'subjectId is required.' });
  }

  const subject = store.subjects.find((s) => s.id === subjectId);
  const semester = store.semesters.find((s) => s.id === semesterId) || store.semesters.find((s) => s.number === subject?.semesterNumber);
  const enrolledStudents = getEnrolledStudentsForSubject(subjectId as string, semesterId as string);

  const students = enrolledStudents.map((st) => {
    // calculate overall % in this subject
    const subjectSessions = store.attendanceSessions.filter((sess) => sess.subjectId === subjectId);
    const sessionIds = subjectSessions.map((s) => s.id);
    const studentRecords = store.attendanceRecords.filter((r) => r.studentId === st.id && sessionIds.includes(r.attendanceSessionId));
    const attended = studentRecords.filter((r) => r.status === 'present').length;
    const pct = studentRecords.length > 0 ? Math.round((attended / studentRecords.length) * 100) : 100;

    return {
      studentId: st.id,
      usn: st.usn,
      name: getStudentDisplayName(st, store),
      department: st.department,
      semester: st.currentSemester,
      section: st.section,
      currentPercentage: pct,
      defaultStatus: 'present' as const,
    };
  });

  res.json({ subject, semester, students });
});

// Create & Submit Attendance Session
app.post('/api/teacher/attendance/sessions', requireRole('teacher', 'admin'), (req: AuthenticatedRequest, res: Response) => {
  const { subjectId, semesterId, date, period, topic, records, submitImmediately } = req.body;
  const store = db.getStore();
  const teacher = req.teacher || store.teachers[0];

  if (!subjectId || !records || !Array.isArray(records)) {
    return res.status(400).json({ error: 'subjectId and student records are required.' });
  }

  // Teacher ownership check
  if (req.user?.role === 'teacher') {
    const isAssigned = store.teacherSubjectAssignments.some(
      (a) => a.teacherId === teacher.id && a.subjectId === subjectId && a.confirmedByAdmin
    );
    if (!isAssigned) {
      return res.status(403).json({ error: 'Forbidden: You are not assigned to teach this subject.' });
    }
  }

  const sessionId = `att-sess-${Date.now()}`;
  const subject = store.subjects.find((s) => s.id === subjectId);
  const now = new Date().toISOString();

  const newSession: AttendanceSession = {
    id: sessionId,
    subjectId,
    teacherId: teacher.id,
    semesterId: semesterId || store.semesters[0].id,
    date: date || now.split('T')[0],
    period: period || '10:00 - 11:00 AM',
    topic: topic || 'Class Lecture',
    createdAt: now,
    submitted: Boolean(submitImmediately),
  };

  store.attendanceSessions.unshift(newSession);

  // Insert records
  records.forEach((r: { studentId: string; status: 'present' | 'absent' }) => {
    store.attendanceRecords.push({
      id: `rec-${sessionId}-${r.studentId}`,
      attendanceSessionId: sessionId,
      studentId: r.studentId,
      status: r.status,
    });
  });

  if (newSession.submitted) {
    // Generate notification for absent students
    const absentStudentIds = records.filter((r) => r.status === 'absent').map((r) => r.studentId);
    const absentUsers = store.students.filter((s) => absentStudentIds.includes(s.id)).map((s) => s.userId);

    db.notifyUsers(
      absentUsers,
      'attendance',
      `Attendance Alert: Marked Absent`,
      `You were marked Absent for ${subject?.name || 'Class'} on ${newSession.date}.`,
      '/student/attendance'
    );

    db.logAudit(
      req.user!.id,
      req.user!.name,
      'teacher',
      'ATTENDANCE_SUBMITTED',
      `Submitted attendance for ${subject?.code} on ${newSession.date} (${records.length} students)`
    );
  }

  res.status(201).json({ session: newSession, recordsCount: records.length });
});

// Submit/Lock Attendance Session (Once submitted, immutable)
app.post('/api/teacher/attendance/sessions/:id/submit', requireRole('teacher', 'admin'), (req: AuthenticatedRequest, res: Response) => {
  const store = db.getStore();
  const session = store.attendanceSessions.find((s) => s.id === req.params.id);

  if (!session) {
    return res.status(404).json({ error: 'Attendance session not found.' });
  }

  if (session.submitted) {
    return res.status(400).json({ error: 'Attendance session is already submitted and locked against further edits.' });
  }

  session.submitted = true;

  const subject = store.subjects.find((s) => s.id === session.subjectId);
  db.logAudit(
    req.user!.id,
    req.user!.name,
    'teacher',
    'ATTENDANCE_SUBMITTED',
    `Locked and submitted attendance session for ${subject?.code || session.subjectId}`
  );

  res.json({ success: true, message: 'Attendance submitted and locked successfully.', session });
});

// Teacher Attendance Analytics (<80%, <50% filters)
app.get('/api/teacher/attendance/analytics', requireRole('teacher', 'admin'), (req: AuthenticatedRequest, res: Response) => {
  const store = db.getStore();
  const { subjectId, filter } = req.query;
  const teacher = req.teacher || store.teachers[0];

  let targetSubjectIds: string[] = [];
  if (subjectId) {
    targetSubjectIds = [subjectId as string];
  } else {
    targetSubjectIds = store.teacherSubjectAssignments
      .filter((a) => a.teacherId === teacher.id && a.confirmedByAdmin)
      .map((a) => a.subjectId);
  }

  const sessions = store.attendanceSessions.filter((s) => targetSubjectIds.includes(s.subjectId));
  const sessionIds = sessions.map((s) => s.id);

  const studentAnalytics: any[] = [];

  store.students.forEach((st) => {
    const user = store.users.find((u) => u.id === st.userId);
    const records = store.attendanceRecords.filter(
      (r) => r.studentId === st.id && sessionIds.includes(r.attendanceSessionId)
    );

    if (records.length === 0) return;

    const attended = records.filter((r) => r.status === 'present').length;
    const total = records.length;
    const percentage = Math.round((attended / total) * 100);

    let status = 'good';
    if (percentage < 50) status = 'critical';
    else if (percentage < 80) status = 'warning';

    studentAnalytics.push({
      studentId: st.id,
      usn: st.usn,
      name: user?.name || 'Student',
      department: st.department,
      section: st.section,
      attendedClasses: attended,
      totalClasses: total,
      percentage,
      status,
    });
  });

  let filtered = studentAnalytics;
  if (filter === 'below80') {
    filtered = studentAnalytics.filter((s) => s.percentage < 80);
  } else if (filter === 'below50') {
    filtered = studentAnalytics.filter((s) => s.percentage < 50);
  }

  res.json({
    students: filtered,
    totalClassesConducted: sessions.length,
    below80Count: studentAnalytics.filter((s) => s.percentage < 80).length,
    below50Count: studentAnalytics.filter((s) => s.percentage < 50).length,
  });
});

// 3.3 Teacher Assignments (NO MARKS FIELD)
app.get('/api/teacher/assignments', requireRole('teacher', 'admin'), (req: AuthenticatedRequest, res: Response) => {
  const store = db.getStore();
  const teacher = req.teacher || store.teachers[0];
  const { subjectId } = req.query;

  let assignments = store.assignments;
  if (req.user?.role === 'teacher') {
    assignments = assignments.filter((a) => a.teacherId === teacher.id);
  }
  if (subjectId) {
    assignments = assignments.filter((a) => a.subjectId === subjectId);
  }

  const enriched = assignments.map((a) => {
    const subject = store.subjects.find((s) => s.id === a.subjectId);
    const enrolledStudents = getEnrolledStudentsForSubject(a.subjectId, a.semesterId);
    const statuses = store.assignmentSubmissionStatuses.filter((s) => s.assignmentId === a.id);
    const submittedCount = statuses.filter((s) => s.status === 'submitted').length;
    const notSubmittedCount = Math.max(0, (enrolledStudents.length || statuses.length) - submittedCount);

    return {
      ...a,
      pdfData: a.pdfData,
      pdfFileName: a.pdfFileName,
      department: (subject as any)?.departmentCode || (subject as any)?.departmentId || 'CSE',
      semesterNumber: subject?.semesterNumber || 4,
      subjectName: subject?.name,
      subjectCode: subject?.code,
      stats: {
        totalStudents: enrolledStudents.length || statuses.length,
        submittedCount,
        notSubmittedCount,
      },
    };
  });

  res.json({ assignments: enriched });
});

app.post('/api/teacher/assignments', requireRole('teacher', 'admin'), (req: AuthenticatedRequest, res: Response) => {
  const { subjectId, semesterId, title, instructions, dueDate, pdfData, pdfFileName } = req.body;
  const store = db.getStore();
  const teacher = req.teacher || store.teachers[0];

  if (!subjectId || !title || !instructions || !dueDate) {
    return res.status(400).json({ error: 'Subject, title, instructions, and dueDate are required.' });
  }

  // Teacher authorization check
  if (req.user?.role === 'teacher') {
    const isAssigned = store.teacherSubjectAssignments.some(
      (a) => a.teacherId === teacher.id && a.subjectId === subjectId && a.confirmedByAdmin
    );
    if (!isAssigned) {
      return res.status(403).json({ error: 'Forbidden: You cannot assign tasks for subjects not assigned to you.' });
    }
  }

  const assignmentId = `asg-${Date.now()}`;
  const newAssignment: Assignment = {
    id: assignmentId,
    subjectId,
    teacherId: teacher.id,
    semesterId: semesterId || store.semesters[0].id,
    title,
    instructions,
    dueDate,
    pdfData: pdfData || undefined,
    pdfFileName: pdfFileName || undefined,
    createdAt: new Date().toISOString(),
  };

  store.assignments.unshift(newAssignment);

  // Initialize submission status roster for all enrolled students
  const subject = store.subjects.find((s) => s.id === subjectId);
  const enrolledStudents = getEnrolledStudentsForSubject(subjectId, semesterId);

  enrolledStudents.forEach((st) => {
    const existing = store.assignmentSubmissionStatuses.find(
      (s) => s.assignmentId === assignmentId && s.studentId === st.id
    );
    if (!existing) {
      store.assignmentSubmissionStatuses.push({
        id: `sub-stat-${assignmentId}-${st.id}`,
        assignmentId,
        studentId: st.id,
        status: 'not_submitted',
        markedAt: new Date().toISOString(),
      });
    }
  });

  // Notify students
  const studentUserIds = enrolledStudents.map((s) => s.userId);
  db.notifyUsers(
    studentUserIds,
    'assignment',
    `New Assignment: ${title}`,
    `Subject: ${subject?.name || 'Class'}. Due on ${dueDate}.`,
    '/student/assignments'
  );

  db.logAudit(req.user!.id, req.user!.name, 'teacher', 'ASSIGNMENT_CREATED', `Created assignment "${title}" for ${subject?.code}`);

  res.status(201).json({ assignment: newAssignment, enrolledCount: enrolledStudents.length });
});

// Get assignment roster & submission status
app.get('/api/teacher/assignments/:id/roster', requireRole('teacher', 'admin'), (req: AuthenticatedRequest, res: Response) => {
  const store = db.getStore();
  const assignment = store.assignments.find((a) => a.id === req.params.id);
  if (!assignment) {
    return res.status(404).json({ error: 'Assignment not found.' });
  }

  const subject = store.subjects.find((s) => s.id === assignment.subjectId);
  const enrolledStudents = getEnrolledStudentsForSubject(assignment.subjectId, assignment.semesterId);

  // Ensure every student has a submission record in the store
  enrolledStudents.forEach((st) => {
    let statusRecord = store.assignmentSubmissionStatuses.find(
      (s) => s.assignmentId === assignment.id && s.studentId === st.id
    );
    if (!statusRecord) {
      statusRecord = {
        id: `sub-stat-${assignment.id}-${st.id}`,
        assignmentId: assignment.id,
        studentId: st.id,
        status: 'not_submitted',
        markedAt: new Date().toISOString(),
      };
      store.assignmentSubmissionStatuses.push(statusRecord);
    }
  });

  const studentsRoster = enrolledStudents.map((st) => {
    const statusRecord = store.assignmentSubmissionStatuses.find(
      (s) => s.assignmentId === assignment.id && s.studentId === st.id
    );
    return {
      submissionId: statusRecord?.id || `sub-stat-${assignment.id}-${st.id}`,
      studentId: st.id,
      usn: st.usn || '',
      name: getStudentDisplayName(st, store),
      department: st.department,
      semester: st.currentSemester,
      section: st.section,
      status: statusRecord ? statusRecord.status : 'not_submitted',
      markedAt: statusRecord?.markedAt,
    };
  });

  res.json({ assignment, subject, students: studentsRoster });
});

// Update assignment submission status (Instant Submitted / Not Submitted toggle)
app.patch('/api/teacher/assignments/:id/submission-status', requireRole('teacher', 'admin'), (req: AuthenticatedRequest, res: Response) => {
  const { studentId, status } = req.body;
  const store = db.getStore();

  if (!studentId || !['submitted', 'not_submitted'].includes(status)) {
    return res.status(400).json({ error: 'Valid studentId and status (submitted | not_submitted) are required.' });
  }

  let record = store.assignmentSubmissionStatuses.find(
    (s) => s.assignmentId === req.params.id && s.studentId === studentId
  );

  if (!record) {
    record = {
      id: `sub-stat-${req.params.id}-${studentId}`,
      assignmentId: req.params.id,
      studentId,
      status,
      markedAt: new Date().toISOString(),
    };
    store.assignmentSubmissionStatuses.push(record);
  } else {
    record.status = status;
    record.markedAt = new Date().toISOString();
  }

  res.json({ success: true, record });
});

// 3.4 Teacher Test Marks
app.get('/api/teacher/marks/sheets', requireRole('teacher', 'admin'), (req: AuthenticatedRequest, res: Response) => {
  const store = db.getStore();
  const teacher = req.teacher || store.teachers[0];
  const { subjectId } = req.query;

  let sheets = store.testMarkSheets;
  if (req.user?.role === 'teacher') {
    sheets = sheets.filter((s) => s.teacherId === teacher.id);
  }
  if (subjectId) {
    sheets = sheets.filter((s) => s.subjectId === subjectId);
  }

  const enriched = sheets.map((sheet) => {
    const subject = store.subjects.find((s) => s.id === sheet.subjectId);
    const marksList = store.testMarks.filter((tm) => tm.testMarkSheetId === sheet.id);
    const scores = marksList.map((m) => Number(m.marks)).filter((n) => !isNaN(n));
    const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const max = scores.length > 0 ? Math.max(...scores) : 0;
    const min = scores.length > 0 ? Math.min(...scores) : 0;
    const enrolledStudents = getEnrolledStudentsForSubject(sheet.subjectId, sheet.semesterId);

    return {
      ...sheet,
      subjectName: subject?.name,
      subjectCode: subject?.code,
      averageMarks: avg,
      highestMarks: max,
      lowestMarks: min,
      evaluatedCount: marksList.length,
      stats: {
        totalStudents: enrolledStudents.length || marksList.length,
        totalEvaluated: marksList.length,
        averageMarks: avg,
        highestMarks: max,
        lowestMarks: min,
      },
    };
  });

  res.json({ sheets: enriched });
});

app.post('/api/teacher/marks/sheets', requireRole('teacher', 'admin'), (req: AuthenticatedRequest, res: Response) => {
  const { subjectId, semesterId, testName, maxMarks, initialMarks, published } = req.body;
  const store = db.getStore();
  const teacher = req.teacher || store.teachers[0];

  if (!subjectId || !testName || !maxMarks) {
    return res.status(400).json({ error: 'Subject, testName, and maxMarks are required.' });
  }

  const sheetId = `tms-${Date.now()}`;
  const newSheet: TestMarkSheet = {
    id: sheetId,
    subjectId,
    teacherId: teacher.id,
    semesterId: semesterId || store.semesters[0].id,
    testName,
    maxMarks: Number(maxMarks),
    published: Boolean(published),
    createdAt: new Date().toISOString(),
  };

  store.testMarkSheets.unshift(newSheet);

  if (Array.isArray(initialMarks)) {
    initialMarks.forEach((m: { studentId: string; marks: number }) => {
      store.testMarks.push({
        id: `tm-${sheetId}-${m.studentId}`,
        testMarkSheetId: sheetId,
        studentId: m.studentId,
        marks: Number(m.marks),
      });
    });
  }

  db.logAudit(req.user!.id, req.user!.name, 'teacher', 'TEST_SHEET_CREATED', `Created marks sheet "${testName}" (${maxMarks} max marks)`);

  res.status(201).json({ sheet: newSheet });
});

app.get('/api/teacher/marks/sheets/:id', requireRole('teacher', 'admin'), (req: AuthenticatedRequest, res: Response) => {
  const store = db.getStore();
  const sheet = store.testMarkSheets.find((s) => s.id === req.params.id);
  if (!sheet) {
    return res.status(404).json({ error: 'Test mark sheet not found.' });
  }

  const subject = store.subjects.find((s) => s.id === sheet.subjectId);
  const marks = store.testMarks.filter((tm) => tm.testMarkSheetId === sheet.id);
  const enrolledStudents = getEnrolledStudentsForSubject(sheet.subjectId, sheet.semesterId);

  const studentsWithMarks = enrolledStudents.map((st) => {
    const studentMark = marks.find((m) => m.studentId === st.id);
    return {
      studentId: st.id,
      usn: st.usn,
      name: getStudentDisplayName(st, store),
      department: st.department,
      semester: st.currentSemester,
      section: st.section,
      marks: studentMark ? studentMark.marks : 0,
      hasEntry: Boolean(studentMark),
    };
  });

  res.json({ sheet, subject, students: studentsWithMarks });
});

// Update student marks (editable by teachers at any time)
app.patch('/api/teacher/marks/sheets/:id/marks', requireRole('teacher', 'admin'), (req: AuthenticatedRequest, res: Response) => {
  const { studentMarks } = req.body;
  const store = db.getStore();
  const sheet = store.testMarkSheets.find((s) => s.id === req.params.id);

  if (!sheet) {
    return res.status(404).json({ error: 'Test mark sheet not found.' });
  }

  if (!Array.isArray(studentMarks)) {
    return res.status(400).json({ error: 'studentMarks array is required.' });
  }

  studentMarks.forEach((entry: { studentId: string; marks: number }) => {
    let markRecord = store.testMarks.find(
      (m) => m.testMarkSheetId === sheet.id && m.studentId === entry.studentId
    );

    const clampedMarks = Math.min(Math.max(0, Number(entry.marks)), sheet.maxMarks);

    if (markRecord) {
      markRecord.marks = clampedMarks;
    } else {
      store.testMarks.push({
        id: `tm-${sheet.id}-${entry.studentId}`,
        testMarkSheetId: sheet.id,
        studentId: entry.studentId,
        marks: clampedMarks,
      });
    }
  });

  sheet.updatedAt = new Date().toISOString();

  res.json({ success: true, message: 'Marks updated successfully.' });
});

// Publish / Unpublish test marks
app.post('/api/teacher/marks/sheets/:id/publish', requireRole('teacher', 'admin'), (req: AuthenticatedRequest, res: Response) => {
  const { published } = req.body;
  const store = db.getStore();
  const sheet = store.testMarkSheets.find((s) => s.id === req.params.id);

  if (!sheet) {
    return res.status(404).json({ error: 'Test mark sheet not found.' });
  }

  sheet.published = published !== undefined ? Boolean(published) : true;

  if (sheet.published) {
    const subject = store.subjects.find((s) => s.id === sheet.subjectId);
    const teacher = store.teachers.find((t) => t.id === sheet.teacherId);
    const teacherUser = teacher ? store.users.find((u) => u.id === teacher.userId) : null;
    const enrolledStudents = store.students.filter(
      (st) => !subject || st.currentSemester === subject.semesterNumber
    );

    const studentUserIds = enrolledStudents.map((s) => s.userId);
    db.notifyUsers(
      studentUserIds,
      'marks',
      `Test Marks Published: ${sheet.testName}`,
      `${teacherUser?.name || 'Faculty'} has published marks for ${subject?.name || 'Subject'}.`,
      '/student/marks'
    );

    db.logAudit(
      req.user!.id,
      req.user!.name,
      'teacher',
      'MARKS_PUBLISHED',
      `Published marks for ${sheet.testName} (${subject?.code})`
    );
  }

  res.json({ success: true, sheet });
});

// ==========================================
// 4. STUDENT ENDPOINTS (100% READ ONLY)
// ==========================================

// Helper to get active student
function getStudentFromReq(req: AuthenticatedRequest): Student | null {
  const store = db.getStore();
  if (req.student) return req.student;
  if (req.user?.role === 'student') {
    return store.students.find((s) => s.userId === req.user?.id) || null;
  }
  // If admin/teacher is viewing student endpoints for demo, pick first student
  return store.students[0];
}

// 4.1 Student Dashboard (Live computed summary)
app.get('/api/student/dashboard', requireRole('student', 'admin', 'teacher'), (req: AuthenticatedRequest, res: Response) => {
  const store = db.getStore();
  const student = getStudentFromReq(req);

  if (!student) {
    return res.status(404).json({ error: 'Student record not found.' });
  }

  const user = store.users.find((u) => u.id === student.userId);

  // Overall Attendance
  const studentRecords = store.attendanceRecords.filter((r) => r.studentId === student.id);
  const totalClasses = studentRecords.length;
  const attendedClasses = studentRecords.filter((r) => r.status === 'present').length;
  const overallAttendancePercentage = totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : 100;

  // Pending assignments (assigned to this semester & student not submitted)
  const semesterAssignments = store.assignments.filter((a) => {
    const subject = store.subjects.find((s) => s.id === a.subjectId);
    return subject && subject.semesterNumber === student.currentSemester;
  });

  const studentSubmissions = store.assignmentSubmissionStatuses.filter((s) => s.studentId === student.id);
  const pendingAssignmentsCount = semesterAssignments.filter((a) => {
    const sub = studentSubmissions.find((s) => s.assignmentId === a.id);
    return !sub || sub.status === 'not_submitted';
  }).length;

  // Latest published test mark
  const publishedSheets = store.testMarkSheets.filter((tms) => tms.published);
  let latestPublishedTest = undefined;

  if (publishedSheets.length > 0) {
    const latestSheet = publishedSheets[0];
    const subject = store.subjects.find((s) => s.id === latestSheet.subjectId);
    const markEntry = store.testMarks.find((m) => m.testMarkSheetId === latestSheet.id && m.studentId === student.id);
    if (markEntry) {
      latestPublishedTest = {
        testName: latestSheet.testName,
        subjectName: subject?.name || 'Subject',
        subjectCode: subject?.code || '',
        marks: markEntry.marks,
        maxMarks: latestSheet.maxMarks,
        percentage: Math.round((markEntry.marks / latestSheet.maxMarks) * 100),
      };
    }
  }

  // Unread notices and events
  const unreadNoticesCount = store.notices.length;
  const upcomingEventsCount = store.events.length;

  // Subject-wise attendance breakdown
  const subjects = store.subjects.filter((s) => s.semesterNumber === student.currentSemester);
  const subjectSummaries = subjects.map((sub) => {
    const subSessions = store.attendanceSessions.filter((sess) => sess.subjectId === sub.id);
    const subSessionIds = subSessions.map((s) => s.id);
    const subRecords = store.attendanceRecords.filter(
      (r) => r.studentId === student.id && subSessionIds.includes(r.attendanceSessionId)
    );
    const subAttended = subRecords.filter((r) => r.status === 'present').length;
    const subTotal = subRecords.length;
    const pct = subTotal > 0 ? Math.round((subAttended / subTotal) * 100) : 100;

    const assignment = store.teacherSubjectAssignments.find((a) => a.subjectId === sub.id && a.confirmedByAdmin);
    const teacher = assignment ? store.teachers.find((t) => t.id === assignment.teacherId) : null;
    const teacherUser = teacher ? store.users.find((u) => u.id === teacher.userId) : null;

    let status: 'good' | 'warning' | 'critical' = 'good';
    if (pct < 50) status = 'critical';
    else if (pct < 80) status = 'warning';

    return {
      subjectId: sub.id,
      subjectName: sub.name,
      subjectCode: sub.code,
      teacherName: teacherUser?.name || 'Faculty',
      totalClasses: subTotal,
      attendedClasses: subAttended,
      percentage: pct,
      status,
    };
  });

  const dashboard: StudentDashboardSummary = {
    student: { ...student, user },
    overallAttendancePercentage,
    totalClasses,
    attendedClasses,
    pendingAssignmentsCount,
    totalAssignmentsCount: semesterAssignments.length,
    latestPublishedTest,
    unreadNoticesCount,
    upcomingEventsCount,
    subjectSummaries,
  };

  res.json(dashboard);
});

// 4.2 Student Attendance
app.get('/api/student/attendance', requireRole('student', 'admin', 'teacher'), (req: AuthenticatedRequest, res: Response) => {
  const store = db.getStore();
  const student = getStudentFromReq(req);

  if (!student) {
    return res.status(404).json({ error: 'Student record not found.' });
  }

  const subjects = store.subjects.filter((s) => s.semesterNumber === student.currentSemester);

  const subjectsBreakdown = subjects.map((sub) => {
    const sessions = store.attendanceSessions.filter((sess) => sess.subjectId === sub.id);
    const sessionIds = sessions.map((s) => s.id);
    const records = store.attendanceRecords.filter(
      (r) => r.studentId === student.id && sessionIds.includes(r.attendanceSessionId)
    );

    const attended = records.filter((r) => r.status === 'present').length;
    const absent = records.filter((r) => r.status === 'absent').length;
    const total = records.length;
    const percentage = total > 0 ? Math.round((attended / total) * 100) : 100;

    const assignment = store.teacherSubjectAssignments.find((a) => a.subjectId === sub.id && a.confirmedByAdmin);
    const teacher = assignment ? store.teachers.find((t) => t.id === assignment.teacherId) : null;
    const teacherUser = teacher ? store.users.find((u) => u.id === teacher.userId) : null;

    // Detailed sessions list
    const sessionDetails = sessions.map((sess) => {
      const rec = store.attendanceRecords.find((r) => r.attendanceSessionId === sess.id && r.studentId === student.id);
      return {
        sessionId: sess.id,
        date: sess.date,
        period: sess.period,
        topic: sess.topic,
        status: rec ? rec.status : 'present',
      };
    });

    return {
      subjectId: sub.id,
      subjectCode: sub.code,
      subjectName: sub.name,
      teacherName: teacherUser?.name || 'Faculty',
      totalClasses: total,
      attendedClasses: attended,
      absentClasses: absent,
      percentage,
      isBelowThreshold: percentage < 75,
      sessions: sessionDetails,
    };
  });

  const totalAllClasses = subjectsBreakdown.reduce((a, b) => a + b.totalClasses, 0);
  const totalAllAttended = subjectsBreakdown.reduce((a, b) => a + b.attendedClasses, 0);
  const overallPercentage = totalAllClasses > 0 ? Math.round((totalAllAttended / totalAllClasses) * 100) : 100;

  res.json({
    overallPercentage,
    totalAllClasses,
    totalAllAttended,
    subjects: subjectsBreakdown,
  });
});

// 4.3 Student Assignments (read-only submission status)
app.get('/api/student/assignments', requireRole('student', 'admin', 'teacher'), (req: AuthenticatedRequest, res: Response) => {
  const store = db.getStore();
  const student = getStudentFromReq(req);

  if (!student) {
    return res.status(404).json({ error: 'Student record not found.' });
  }

  const subjects = store.subjects.filter((s) => s.semesterNumber === student.currentSemester);
  const subjectIds = subjects.map((s) => s.id);

  const assignments = store.assignments.filter((a) => subjectIds.includes(a.subjectId));

  const list = assignments.map((a) => {
    const subject = store.subjects.find((s) => s.id === a.subjectId);
    const teacher = store.teachers.find((t) => t.id === a.teacherId);
    const teacherUser = teacher ? store.users.find((u) => u.id === teacher.userId) : null;
    const statusRecord = store.assignmentSubmissionStatuses.find(
      (s) => s.assignmentId === a.id && s.studentId === student.id
    );

    return {
      assignmentId: a.id,
      id: a.id,
      title: a.title,
      instructions: a.instructions,
      dueDate: a.dueDate,
      createdAt: a.createdAt,
      pdfData: a.pdfData,
      pdfFileName: a.pdfFileName,
      semester: subject?.semesterNumber || student.currentSemester,
      department: student.department || (subject as any)?.departmentCode || 'CSE',
      subjectCode: subject?.code || '',
      subjectName: subject?.name || '',
      teacherName: teacherUser?.name || 'Faculty',
      status: statusRecord ? statusRecord.status : 'not_submitted',
      markedAt: statusRecord?.markedAt,
    };
  });

  res.json({ assignments: list });
});

// 4.4 Student Marks (ONLY published test marks)
app.get('/api/student/marks', requireRole('student', 'admin', 'teacher'), (req: AuthenticatedRequest, res: Response) => {
  const store = db.getStore();
  const student = getStudentFromReq(req);

  if (!student) {
    return res.status(404).json({ error: 'Student record not found.' });
  }

  // Hard Rule: ONLY published mark sheets are visible to students
  const publishedSheets = store.testMarkSheets.filter((s) => s.published);

  const results = publishedSheets.map((sheet) => {
    const subject = store.subjects.find((s) => s.id === sheet.subjectId);
    const teacher = store.teachers.find((t) => t.id === sheet.teacherId);
    const teacherUser = teacher ? store.users.find((u) => u.id === teacher.userId) : null;
    const markEntry = store.testMarks.find((m) => m.testMarkSheetId === sheet.id && m.studentId === student.id);

    const allSheetMarks = store.testMarks.filter((tm) => tm.testMarkSheetId === sheet.id);
    const validScores = allSheetMarks.map((m) => Number(m.marks)).filter((n) => !isNaN(n));
    const classAvg = validScores.length > 0 ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length) : 0;
    const highestMarks = validScores.length > 0 ? Math.max(...validScores) : 0;
    const lowestMarks = validScores.length > 0 ? Math.min(...validScores) : 0;

    const studentMarks = markEntry ? Number(markEntry.marks) || 0 : 0;
    const maxMarks = Number(sheet.maxMarks) || 25;
    const percentage = maxMarks > 0 ? Math.round((studentMarks / maxMarks) * 100) : 0;

    return {
      id: sheet.id,
      sheetId: sheet.id,
      testName: sheet.testName,
      subjectCode: subject?.code || '',
      subjectName: subject?.name || 'Subject',
      teacherName: teacherUser?.name || 'Faculty',
      maxMarks,
      studentMarks,
      marksObtained: studentMarks,
      percentage,
      classAverage: classAvg,
      highestMarks,
      lowestMarks,
      publishedAt: sheet.createdAt,
    };
  });

  res.json({ testResults: results });
});

// 4.5 Student Profile (100% read-only)
app.get('/api/student/profile', requireRole('student', 'admin', 'teacher'), (req: AuthenticatedRequest, res: Response) => {
  const store = db.getStore();
  const student = getStudentFromReq(req);

  if (!student) {
    return res.status(404).json({ error: 'Student record not found.' });
  }

  const user = store.users.find((u) => u.id === student.userId);
  const department = store.departments.find((d) => d.code === student.department);
  const semester = store.semesters.find(
    (s) => s.number === student.currentSemester && s.departmentCode === student.department
  );

  res.json({
    student: {
      ...student,
      user,
      departmentName: department?.name || student.department,
      academicYear: semester?.academicYear || '2025-2026',
    },
  });
});

// 4.6 Student Targeted Notices & Events
app.get('/api/student/notices', requireRole('student', 'admin', 'teacher'), (req: AuthenticatedRequest, res: Response) => {
  const store = db.getStore();
  const student = getStudentFromReq(req);

  let notices = store.notices;
  if (student && req.user?.role === 'student') {
    // Filter notices targeted to Everyone, their department, or their semester
    notices = notices.filter(
      (n) =>
        n.audienceType === 'everyone' ||
        (n.audienceType === 'department' && (n.audienceTargetId || '').toUpperCase() === student.department.toUpperCase()) ||
        (n.audienceType === 'semester' && String(n.audienceTargetId) === String(student.currentSemester))
    );
  }

  res.json({ notices });
});

app.get('/api/student/events', requireRole('student', 'admin', 'teacher'), (req: AuthenticatedRequest, res: Response) => {
  const store = db.getStore();
  res.json({ events: store.events });
});

// 4.7 Notifications Feed
app.get('/api/notifications', (req: AuthenticatedRequest, res: Response) => {
  const store = db.getStore();
  const userId = req.user?.id || store.users[0].id;
  const userNotifications = store.notifications.filter((n) => n.userId === userId);
  const unreadCount = userNotifications.filter((n) => !n.read).length;

  res.json({
    notifications: userNotifications,
    unreadCount,
  });
});

app.patch('/api/notifications/:id/read', (req: AuthenticatedRequest, res: Response) => {
  const store = db.getStore();
  const notif = store.notifications.find((n) => n.id === req.params.id);
  if (notif) {
    notif.read = true;
  }
  res.json({ success: true });
});

app.post('/api/notifications/read-all', (req: AuthenticatedRequest, res: Response) => {
  const store = db.getStore();
  const userId = req.user?.id || store.users[0].id;
  store.notifications.filter((n) => n.userId === userId).forEach((n) => (n.read = true));
  res.json({ success: true });
});

// ==========================================
// 5. SERVER BOOTSTRAP & VITE MIDDLEWARE
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Campus Academic Hub server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
