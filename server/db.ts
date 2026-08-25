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

  const adminUsers: User[] = [
    {
      id: 'usr-admin-1',
      name: 'Adarsh Kudachi (Administrator)',
      email: 'adarshkudachi18@gmail.com',
      role: 'admin',
      status: 'active',
      createdAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 'usr-admin-2',
      name: 'Campus Administrator',
      email: 'ecedept123456@gmail.com',
      role: 'admin',
      status: 'active',
      createdAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 'usr-admin-3',
      name: 'College Administration Desk',
      email: 'admin@klecet.edu.in',
      role: 'admin',
      status: 'active',
      createdAt: '2026-01-01T00:00:00Z',
    },
  ];

  return {
    settings: defaultSettings,
    users: adminUsers,
    teachers: [],
    students: [],
    departments: [],
    semesters: [],
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
      departments: Array.isArray(cloudData.departments) ? cloudData.departments : [],
      semesters: Array.isArray(cloudData.semesters) ? cloudData.semesters : [],
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
      const tmpPath = `${this.dbFilePath}.tmp.${Date.now()}`;
      fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tmpPath, this.dbFilePath);
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
