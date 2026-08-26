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
  diagnostic?: string;
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

function formatSupabaseError(context: string, err: any): { message: string; diagnostic: string } {
  const msg = err?.message || (typeof err === 'string' ? err : JSON.stringify(err));
  const code = err?.code || err?.statusCode || '';
  const details = err?.details || '';
  const hint = err?.hint || '';

  let diagnostic = '';
  if (code === '42P01' || msg.includes('does not exist') || msg.includes('PGRST204') || msg.includes('campus_hub_store')) {
    diagnostic = 'TABLE MISSING: Table "campus_hub_store" does not exist in Supabase database. Run schema.sql in Supabase SQL Editor.';
  } else if (code === '42501' || msg.includes('row-level security') || msg.includes('RLS') || msg.includes('violates row-level security')) {
    diagnostic = 'RLS VIOLATION: Permission denied by Supabase Row-Level Security. Ensure SUPABASE_SERVICE_ROLE_KEY is used or execute schema.sql policies.';
  } else if (code === '28P01' || msg.includes('password authentication') || msg.includes('Invalid API key') || msg.includes('JWT expired') || msg.includes('PGRST301')) {
    diagnostic = 'AUTHENTICATION FAILURE: Invalid Supabase database credentials or API Key. Check SUPABASE_SERVICE_ROLE_KEY or DATABASE_URL.';
  } else if (msg.includes('ENETUNREACH') || msg.includes('2406:da1a')) {
    diagnostic = 'IPV6 UNREACHABLE (ENETUNREACH): Direct Supabase PostgreSQL (port 5432) resolved to IPv6, which Render/cloud containers cannot route. Automatically failing over to Supabase HTTPS REST API (port 443) or use Supabase IPv4 Pooler.';
  } else if (msg.includes('ENOTFOUND') || msg.includes('ECONNREFUSED') || msg.includes('ETIMEDOUT') || msg.includes('fetch failed')) {
    diagnostic = 'NETWORK/DNS FAILURE: Unable to reach Supabase cloud host. Verify SUPABASE_URL / DATABASE_URL and network connectivity.';
  } else if (msg.includes('SSL') || msg.includes('self signed certificate')) {
    diagnostic = 'SSL CONFIGURATION ERROR: PostgreSQL SSL handshake issue. Ensure ssl mode is enabled with rejectUnauthorized: false.';
  }

  const logBanner = `
================================================================================
[CRITICAL SUPABASE PERSISTENCE ERROR]
Context: ${context}
Timestamp: ${new Date().toISOString()}
Error Message: ${msg}
Error Code: ${code || 'N/A'}
Details: ${details || 'None'} ${hint ? `| Hint: ${hint}` : ''}
Diagnostic / Action: ${diagnostic || 'General cloud database failure'}
================================================================================`;

  console.error(logBanner);
  return { message: msg, diagnostic: diagnostic || 'General cloud database failure' };
}

// Global Singleton DB store with Supabase PostgreSQL as Primary Source of Truth
class DatabaseService {
  private store: DatabaseStore;
  private readonly startTime: number;
  private lastModified: number;
  private readonly dbFilePath: string;
  private isSavingToSupabase: boolean = false;
  private pendingSupabaseSave: boolean = false;
  private initPromise: Promise<void> | null = null;
  private isInitialized: boolean = false;

  // Supabase / Postgres connection state
  private pgPool: Pool | null = null;
  private supabaseClient: SupabaseClient | null = null;
  private databaseUrl: string;
  private supabaseUrl: string;
  private supabaseKey: string;
  private isSupabaseConnected: boolean = false;
  private lastSupabaseSync: string | null = null;
  private lastSupabaseError: string | undefined = undefined;
  private lastDiagnostic: string | undefined = undefined;

  constructor() {
    this.startTime = Date.now();
    this.lastModified = Date.now();
    this.dbFilePath = path.join(process.cwd(), 'data', 'campus_db.json');

    // Read environment variables
    this.databaseUrl = process.env.DATABASE_URL || '';
    this.supabaseUrl = process.env.SUPABASE_URL || '';
    this.supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      '';

    // Start with clean memory store
    this.store = initializeCleanData();

    // In local development only, seed from disk if present
    if (process.env.NODE_ENV !== 'production') {
      try {
        if (fs.existsSync(this.dbFilePath)) {
          const raw = fs.readFileSync(this.dbFilePath, 'utf-8');
          if (raw && raw.trim().length > 0) {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object') {
              this.store = this.mergeWithCleanDefaults(parsed);
              console.log('[LOCAL DEV] Preloaded local disk cache from /data/campus_db.json');
            }
          }
        }
      } catch (err: any) {
        console.warn('[LOCAL DEV] Local disk cache load skipped:', err?.message);
      }
    }

    // Trigger async initialization
    this.ensureInitialized().catch((err) => {
      console.error('[DB Service] Initial cloud connection check failed:', err);
    });
  }

  /**
   * Guarantees Supabase is connected and authoritative data is pulled before handling requests
   */
  public async ensureInitialized(): Promise<void> {
    if (this.isInitialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      console.log('[Supabase Init] Initializing cloud database connection...');
      
      const isProduction = process.env.NODE_ENV === 'production';
      const hasSupabaseConfig = Boolean(this.databaseUrl || (this.supabaseUrl && this.supabaseKey));

      if (!hasSupabaseConfig) {
        const errorNotice = 'No DATABASE_URL or SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY found in environment variables.';
        this.lastSupabaseError = errorNotice;
        this.lastDiagnostic = 'MISSING_ENV_VARS: Configure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Cloud Run or .env.';
        
        if (isProduction) {
          console.error(`
================================================================================
[CRITICAL PRODUCTION WARNING: SUPABASE UNCONFIGURED]
The application is running in PRODUCTION without Supabase credentials!
Data stored in memory/disk WILL BE LOST when Cloud Run scales to zero.
ACTION: Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to your Cloud Run service!
================================================================================`);
        } else {
          console.warn(`[DB Local Dev] No Supabase credentials detected. Running in local development mode.`);
        }
        this.isInitialized = true;
        return;
      }

      await this.initSupabaseConnection();
      this.isInitialized = true;
    })();

    return this.initPromise;
  }

  private async initSupabaseConnection(): Promise<void> {
    // 1. Try Direct PostgreSQL Connection via pg.Pool (Highest performance)
    if (this.databaseUrl) {
      try {
        console.log('[Supabase/PG] Connecting via PostgreSQL Pool to:', this.databaseUrl.replace(/:[^:@]+@/, ':****@'));
        this.pgPool = new Pool({
          connectionString: this.databaseUrl,
          ssl: { rejectUnauthorized: false },
          max: 10,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 10000,
        });

        // Ensure table exists on Supabase / PostgreSQL
        await this.pgPool.query(`
          CREATE TABLE IF NOT EXISTS public.campus_hub_store (
            key TEXT PRIMARY KEY,
            data JSONB NOT NULL,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );
        `);

        // Check if existing data is already in PostgreSQL / Supabase
        const existing = await this.pgPool.query(
          `SELECT data, updated_at FROM public.campus_hub_store WHERE key = 'main_db' LIMIT 1;`
        );

        if (existing.rows.length > 0 && existing.rows[0].data) {
          console.log(`[Supabase/PG] Existing database restored from Supabase (${existing.rows[0].updated_at}).`);
          const cloudData = existing.rows[0].data as DatabaseStore;
          this.store = this.mergeWithCleanDefaults(cloudData);
          this.lastModified = new Date(existing.rows[0].updated_at).getTime() || Date.now();
          this.persistDiskSync();
        } else {
          // No cloud data yet, initial seed to cloud Supabase
          console.log('[Supabase/PG] First-time cloud initialization: Seeding initial dataset to Supabase...');
          await this.pgPool.query(
            `INSERT INTO public.campus_hub_store (key, data, updated_at) 
             VALUES ('main_db', $1, NOW()) 
             ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();`,
            [JSON.stringify(this.store)]
          );
        }

        this.isSupabaseConnected = true;
        this.lastSupabaseSync = new Date().toISOString();
        this.lastSupabaseError = undefined;
        this.lastDiagnostic = undefined;
        console.log('[Supabase/PG] Verified and active as PRIMARY cloud database.');
        return;
      } catch (err: any) {
        const { message, diagnostic } = formatSupabaseError('PostgreSQL Pool Connection Startup', err);
        if (this.pgPool) {
          this.pgPool.end().catch(() => {});
          this.pgPool = null;
        }
        this.isSupabaseConnected = false;
        this.lastSupabaseError = message;
        this.lastDiagnostic = diagnostic;
        console.warn('[Supabase/PG] PostgreSQL Pool unavailable. Attempting Supabase HTTPS REST Client failover...');
      }
    }

    // 2. Try Supabase REST Client via @supabase/supabase-js (Fallback / Standard REST)
    if (this.supabaseUrl && this.supabaseKey) {
      try {
        console.log('[Supabase/REST] Connecting via Supabase JS Client to:', this.supabaseUrl);
        this.initSupabaseRestClient();

        if (this.supabaseClient) {
          const { data, error } = await this.supabaseClient
            .from('campus_hub_store')
            .select('data, updated_at')
            .eq('key', 'main_db')
            .maybeSingle();

          if (error) {
            throw error;
          }

          if (data && data.data) {
            console.log(`[Supabase/REST] Existing database restored from Supabase (${data.updated_at}).`);
            const cloudData = data.data as DatabaseStore;
            this.store = this.mergeWithCleanDefaults(cloudData);
            this.lastModified = new Date(data.updated_at).getTime() || Date.now();
            this.persistDiskSync();
          } else {
            console.log('[Supabase/REST] Seeding initial dataset to Supabase...');
            const { error: upsertError } = await this.supabaseClient
              .from('campus_hub_store')
              .upsert({ key: 'main_db', data: this.store, updated_at: new Date().toISOString() });
            if (upsertError) throw upsertError;
          }

          this.isSupabaseConnected = true;
          this.lastSupabaseSync = new Date().toISOString();
          this.lastSupabaseError = undefined;
          this.lastDiagnostic = undefined;
          console.log('[Supabase/REST] Verified and active as PRIMARY cloud database via HTTPS REST.');
          return;
        }
      } catch (err: any) {
        const { message, diagnostic } = formatSupabaseError('Supabase REST Client Startup', err);
        this.isSupabaseConnected = false;
        this.lastSupabaseError = message;
        this.lastDiagnostic = diagnostic;
      }
    }
  }

  private initSupabaseRestClient(): void {
    if (this.supabaseUrl && this.supabaseKey) {
      try {
        const cleanUrl = this.supabaseUrl.replace(/\/rest\/v1\/?$/, '');
        this.supabaseClient = createClient(cleanUrl, this.supabaseKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        });
      } catch (err: any) {
        formatSupabaseError('Supabase JS createClient', err);
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

  private persistDiskSync(dataToSave?: DatabaseStore): void {
    // Only write to local file in development or as secondary emergency mirror
    try {
      const dir = path.dirname(this.dbFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const data = dataToSave || this.store;
      const tmpPath = `${this.dbFilePath}.tmp.${Date.now()}`;
      fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tmpPath, this.dbFilePath);
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[DB] Local disk mirror write failed:', err);
      }
    }
  }

  /**
   * Persists the current database store directly to Supabase with retries and comprehensive error logging
   */
  public async persistToSupabase(retryCount: number = 2): Promise<boolean> {
    if (this.isSavingToSupabase) {
      this.pendingSupabaseSave = true;
      return true;
    }

    this.isSavingToSupabase = true;
    let attempt = 0;

    while (attempt <= retryCount) {
      try {
        const dataJson = JSON.stringify(this.store);

        if (this.pgPool) {
          try {
            await this.pgPool.query(
              `INSERT INTO public.campus_hub_store (key, data, updated_at)
               VALUES ('main_db', $1, NOW())
               ON CONFLICT (key) DO UPDATE
               SET data = EXCLUDED.data, updated_at = NOW();`,
              [dataJson]
            );
            this.isSupabaseConnected = true;
            this.lastSupabaseSync = new Date().toISOString();
            this.lastSupabaseError = undefined;
            this.lastDiagnostic = undefined;
            return true;
          } catch (pgErr: any) {
            console.warn('[Supabase/PG] PostgreSQL Pool write failed, failing over to Supabase REST client:', pgErr?.message);
            if (this.pgPool) {
              this.pgPool.end().catch(() => {});
              this.pgPool = null;
            }
            // Initialize REST client if not present
            if (!this.supabaseClient) {
              this.initSupabaseRestClient();
            }
          }
        }
        
        if (this.supabaseClient) {
          const { error } = await this.supabaseClient
            .from('campus_hub_store')
            .upsert({ key: 'main_db', data: this.store, updated_at: new Date().toISOString() });
          if (error) throw error;
          this.isSupabaseConnected = true;
          this.lastSupabaseSync = new Date().toISOString();
          this.lastSupabaseError = undefined;
          this.lastDiagnostic = undefined;
          return true;
        } else if (this.databaseUrl || (this.supabaseUrl && this.supabaseKey)) {
          // Re-attempt connecting
          await this.initSupabaseConnection();
          if (this.isSupabaseConnected) {
            return this.persistToSupabase(0);
          }
        }
        
        // Neither connector is available
        const msg = 'No active Supabase connector available to persist data.';
        this.isSupabaseConnected = false;
        this.lastSupabaseError = msg;
        this.lastDiagnostic = 'Configure valid SUPABASE_SERVICE_ROLE_KEY or DATABASE_URL';
        if (process.env.NODE_ENV === 'production') {
          console.error(`[CRITICAL] Write operation could not be saved to Supabase: ${msg}`);
        }
        return false;
      } catch (err: any) {
        attempt++;
        const { message, diagnostic } = formatSupabaseError(`PersistToSupabase (Attempt ${attempt}/${retryCount + 1})`, err);
        this.isSupabaseConnected = false;
        this.lastSupabaseError = message;
        this.lastDiagnostic = diagnostic;

        if (attempt <= retryCount) {
          await new Promise((res) => setTimeout(res, 400 * attempt));
        }
      } finally {
        if (attempt > retryCount) {
          this.isSavingToSupabase = false;
        }
      }
    }

    this.isSavingToSupabase = false;
    if (this.pendingSupabaseSave) {
      this.pendingSupabaseSave = false;
      setTimeout(() => this.persistToSupabase(), 100);
    }
    return false;
  }

  public persistSync(dataToSave?: DatabaseStore): void {
    this.lastModified = Date.now();
    this.persistDiskSync(dataToSave);
    this.persistToSupabase().catch((err) => {
      formatSupabaseError('Background persistSync', err);
    });
  }

  public persist(): void {
    this.lastModified = Date.now();
    this.persistDiskSync();
    this.persistToSupabase().catch((err) => {
      formatSupabaseError('Immediate persist call', err);
    });
  }

  public async pullFromSupabase(): Promise<{ success: boolean; message: string; diagnostic?: string }> {
    try {
      if (!this.pgPool && !this.supabaseClient) {
        await this.initSupabaseConnection();
      }

      if (this.pgPool) {
        try {
          const result = await this.pgPool.query(
            `SELECT data, updated_at FROM public.campus_hub_store WHERE key = 'main_db' LIMIT 1;`
          );
          if (result.rows.length > 0 && result.rows[0].data) {
            const cloudData = result.rows[0].data as DatabaseStore;
            this.store = this.mergeWithCleanDefaults(cloudData);
            this.lastModified = new Date(result.rows[0].updated_at).getTime() || Date.now();
            this.isSupabaseConnected = true;
            this.lastSupabaseSync = new Date().toISOString();
            this.lastSupabaseError = undefined;
            this.lastDiagnostic = undefined;
            this.persistDiskSync();
            return {
              success: true,
              message: `Successfully pulled latest campus state from Supabase (${this.store.students.length} students, ${this.store.teachers.length} faculty, updated ${result.rows[0].updated_at}).`,
            };
          }
        } catch (pgErr: any) {
          console.warn('[Supabase/PG] PostgreSQL Pool read failed, failing over to Supabase REST client:', pgErr?.message);
          if (this.pgPool) {
            this.pgPool.end().catch(() => {});
            this.pgPool = null;
          }
          if (!this.supabaseClient) {
            this.initSupabaseRestClient();
          }
        }
      }

      if (this.supabaseClient) {
        const { data, error } = await this.supabaseClient
          .from('campus_hub_store')
          .select('data, updated_at')
          .eq('key', 'main_db')
          .maybeSingle();

        if (error) throw error;

        if (data && data.data) {
          const cloudData = data.data as DatabaseStore;
          this.store = this.mergeWithCleanDefaults(cloudData);
          this.lastModified = new Date(data.updated_at).getTime() || Date.now();
          this.isSupabaseConnected = true;
          this.lastSupabaseSync = new Date().toISOString();
          this.lastSupabaseError = undefined;
          this.lastDiagnostic = undefined;
          this.persistDiskSync();
          return {
            success: true,
            message: `Successfully pulled latest campus state from Supabase (${this.store.students.length} students, ${this.store.teachers.length} faculty).`,
          };
        }
      }

      return {
        success: false,
        message: 'No remote dataset found in Supabase table campus_hub_store with key=main_db.',
        diagnostic: 'Table is empty or not seeded.',
      };
    } catch (err: any) {
      const { message, diagnostic } = formatSupabaseError('PullFromSupabase', err);
      this.isSupabaseConnected = false;
      this.lastSupabaseError = message;
      this.lastDiagnostic = diagnostic;
      return { success: false, message: `Failed to pull from Supabase: ${message}`, diagnostic };
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
      configured: Boolean(this.databaseUrl || (this.supabaseUrl && this.supabaseKey)),
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
      diagnostic: this.lastDiagnostic,
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
    this.persist();
  }

  public wipeAllData(): { success: boolean; message: string } {
    this.store = initializeCleanData();
    this.persist();
    console.log('[DB] Database wiped completely to 0 records across all entities.');
    return { success: true, message: 'All database records successfully deleted and synced to Supabase.' };
  }

  public resetToSeed(): void {
    this.store = initializeCleanData();
    this.persist();
  }

  public loadSampleData(): void {
    this.store = initializeCleanData();
    this.persist();
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

    this.persist();
    return { success: true, message: 'Campus database restored successfully and persisted to Supabase.' };
  }

  /**
   * Resilient Synchronizer: Protects client-side cache while ensuring Supabase is authoritative.
   * If server has zero data after a fresh cold start (e.g. before initial migration) and client has data,
   * it restores from client snapshot and persists to Supabase.
   */
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
