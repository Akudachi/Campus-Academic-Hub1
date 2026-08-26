-- ==============================================================================
-- Campus Academic Hub — Supabase PostgreSQL Database Schema
-- 
-- Description:
-- Master persistence table, security rules, and automatic timestamp trigger for
-- K.L.E. College of Engineering and Technology Academic Hub.
--
-- How to apply:
-- 1. Open your Supabase Project Dashboard: https://supabase.com/dashboard
-- 2. Navigate to "SQL Editor" in the left sidebar
-- 3. Paste the entire contents of this file and click "Run" (or Ctrl+Enter)
-- 4. Verify in "Table Editor" that the table "campus_hub_store" exists.
-- ==============================================================================

-- 1. Create the Master State Store Table
-- Stores the authoritative academic database (departments, teachers, students,
-- attendance sessions/records, assignments, test marks, notices, timetable, settings).
CREATE TABLE IF NOT EXISTS public.campus_hub_store (
  key TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add descriptive comment on table and columns
COMMENT ON TABLE public.campus_hub_store IS 'Authoritative JSON state store for Campus Academic Hub (KLECET)';
COMMENT ON COLUMN public.campus_hub_store.key IS 'Primary key identifier for the dataset (e.g. main_db)';
COMMENT ON COLUMN public.campus_hub_store.data IS 'Complete relational-equivalent academic JSON structure';
COMMENT ON COLUMN public.campus_hub_store.updated_at IS 'Timestamp of the latest state modification or cloud sync';

-- 2. Create Index on updated_at for fast polling & status checks
CREATE INDEX IF NOT EXISTS idx_campus_hub_store_updated_at 
ON public.campus_hub_store (updated_at DESC);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.campus_hub_store ENABLE ROW LEVEL SECURITY;

-- 4. Clean up any existing policies to avoid duplicates on re-run
DROP POLICY IF EXISTS "Service role has full access" ON public.campus_hub_store;
DROP POLICY IF EXISTS "Allow service role full access" ON public.campus_hub_store;
DROP POLICY IF EXISTS "Allow authenticated read and write" ON public.campus_hub_store;
DROP POLICY IF EXISTS "Allow anon read and write access" ON public.campus_hub_store;
DROP POLICY IF EXISTS "Allow all backend operations" ON public.campus_hub_store;

-- 5. Create RLS Policies

-- Policy A: Full access for Service Role (used by backend with SUPABASE_SERVICE_ROLE_KEY)
CREATE POLICY "Service role has full access" 
ON public.campus_hub_store
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy B: Allow anon access for REST client read/write (used if backend connects via SUPABASE_ANON_KEY)
CREATE POLICY "Allow anon read and write access" 
ON public.campus_hub_store
FOR ALL
TO anon
USING (true)
WITH CHECK (true);

-- Policy C: Allow authenticated users full access (for authenticated dashboard sessions)
CREATE POLICY "Allow authenticated read and write" 
ON public.campus_hub_store
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 6. Automatic updated_at Timestamp Trigger Function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if present to ensure clean idempotency
DROP TRIGGER IF EXISTS set_updated_at ON public.campus_hub_store;

-- Create the Trigger to auto-update updated_at on every modification
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.campus_hub_store
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ==============================================================================
-- 7. Verification & Seed Health Check
-- The following query can be run to inspect existing database rows:
--
-- SELECT key, updated_at, pg_size_pretty(pg_column_size(data)) as size,
--        jsonb_array_length(COALESCE(data->'students', '[]'::jsonb)) as student_count,
--        jsonb_array_length(COALESCE(data->'teachers', '[]'::jsonb)) as teacher_count
-- FROM public.campus_hub_store;
-- ==============================================================================
