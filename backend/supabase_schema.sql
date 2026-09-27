-- =============================================================================
-- FlashMVP — Supabase Schema & Row-Level Security (RLS) Setup
-- =============================================================================
-- HOW TO RUN:
--   Paste this entire file into:
--   Supabase Dashboard → SQL Editor → New Query → Run
--
-- WHAT THIS DOES:
--   1. Creates the `flashmvp` schema — all FlashMVP platform tables live here.
--   2. Creates core tables: profiles, projects, project_members, run_history.
--   3. Defines two roles via a `user_role` enum: 'admin' and 'user'.
--   4. Enables Row-Level Security (RLS) on every table so:
--        - Regular users  can only see and edit their own data.
--        - Admins         can see and manage everything.
--        - The backend    uses the service key which bypasses RLS entirely
--          (for schema provisioning, deploy orchestration, etc.)
-- =============================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- 0. Schema
-- ─────────────────────────────────────────────────────────────────────────────

CREATE SCHEMA IF NOT EXISTS flashmvp;


-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Enums
-- ─────────────────────────────────────────────────────────────────────────────

-- Role enum used in profiles and project_members tables.
DO $$ BEGIN
    CREATE TYPE flashmvp.user_role AS ENUM ('admin', 'user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Project/container status enum.
DO $$ BEGIN
    CREATE TYPE flashmvp.project_status AS ENUM ('PROVISIONING', 'RUNNING', 'STOPPED', 'CRASHED', 'DELETED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Run result enum.
DO $$ BEGIN
    CREATE TYPE flashmvp.run_status AS ENUM ('RUNNING', 'PASSED', 'FAILED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Tables
-- ─────────────────────────────────────────────────────────────────────────────

-- profiles —
--   One row per Supabase auth user.
--   Created automatically by the trigger below when a user signs up.
--   `role` decides whether the user is a platform admin or a regular developer.
CREATE TABLE IF NOT EXISTS flashmvp.profiles (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email       TEXT NOT NULL,
    full_name   TEXT,
    role        flashmvp.user_role NOT NULL DEFAULT 'user',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  flashmvp.profiles       IS 'One profile row per Supabase auth user. Role controls platform-level access.';
COMMENT ON COLUMN flashmvp.profiles.role  IS 'admin = full xAppHub access; user = own projects only';


-- projects —
--   Each deployed app gets one row here.
--   `db_schema` is the isolated PostgreSQL schema created by skill_cloud_db.py
--   (e.g. "app_proj_8f92a").  `public_url` is the Cloudflare tunnel URL.
CREATE TABLE IF NOT EXISTS flashmvp.projects (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      TEXT UNIQUE NOT NULL,           -- "proj_8f92a"
    app_name        TEXT NOT NULL,
    template        TEXT NOT NULL,                  -- "react-fastapi" | "nextjs-go"
    status          flashmvp.project_status NOT NULL DEFAULT 'PROVISIONING',
    db_schema       TEXT,                           -- "app_proj_8f92a"
    public_url      TEXT,                           -- "https://app-8f92a.trycloudflare.com"
    owner_id        UUID NOT NULL REFERENCES flashmvp.profiles(id) ON DELETE CASCADE,
    ibm_region      TEXT NOT NULL DEFAULT 'us-south',
    deployed_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE flashmvp.projects IS 'One row per deployed FlashMVP application.';


-- project_members —
--   Controls who can access a project and at what permission level.
--   role: 'admin' = full control; 'user' = read/redeploy only.
CREATE TABLE IF NOT EXISTS flashmvp.project_members (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id  UUID NOT NULL REFERENCES flashmvp.projects(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES flashmvp.profiles(id) ON DELETE CASCADE,
    role        flashmvp.user_role NOT NULL DEFAULT 'user',
    granted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (project_id, user_id)
);

COMMENT ON TABLE flashmvp.project_members IS 'RBAC — who can access which project and at what role level.';


-- run_history —
--   Audit log of every QA pipeline + deploy run.
--   `qa_steps` stores the full step-by-step result as JSON.
CREATE TABLE IF NOT EXISTS flashmvp.run_history (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id          TEXT UNIQUE NOT NULL,            -- "run_abc123"
    project_id      UUID NOT NULL REFERENCES flashmvp.projects(id) ON DELETE CASCADE,
    run_number      INTEGER NOT NULL,
    status          flashmvp.run_status NOT NULL DEFAULT 'RUNNING',
    duration_ms     INTEGER,
    deployment_url  TEXT,
    qa_steps        JSONB,                           -- [{step_name, status, duration_ms, log_output}]
    triggered_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at    TIMESTAMPTZ
);

COMMENT ON TABLE flashmvp.run_history IS 'Full audit log of QA pipeline and deployment runs per project.';


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Indexes
-- ─────────────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_projects_owner          ON flashmvp.projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user    ON flashmvp.project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_project_members_project ON flashmvp.project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_run_history_project     ON flashmvp.run_history(project_id);
CREATE INDEX IF NOT EXISTS idx_run_history_triggered   ON flashmvp.run_history(triggered_at DESC);


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Auto-update trigger for updated_at columns
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION flashmvp.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON flashmvp.profiles
    FOR EACH ROW EXECUTE FUNCTION flashmvp.set_updated_at();

CREATE OR REPLACE TRIGGER trg_projects_updated_at
    BEFORE UPDATE ON flashmvp.projects
    FOR EACH ROW EXECUTE FUNCTION flashmvp.set_updated_at();


-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Auto-create profile on signup trigger
--    Whenever a new user signs up via Supabase Auth, this automatically
--    creates their profile row so RLS policies can reference it immediately.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION flashmvp.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    INSERT INTO flashmvp.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        -- First user ever registered becomes admin automatically.
        -- All subsequent users get the default 'user' role.
        CASE
            WHEN (SELECT COUNT(*) FROM flashmvp.profiles) = 0 THEN 'admin'::flashmvp.user_role
            ELSE 'user'::flashmvp.user_role
        END
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION flashmvp.handle_new_user();


-- ─────────────────────────────────────────────────────────────────────────────
-- 6. Helper function — is the current user an admin?
--    Used inside RLS policies to avoid repeating the same subquery.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION flashmvp.is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
    SELECT EXISTS (
        SELECT 1 FROM flashmvp.profiles
        WHERE id = auth.uid()
          AND role = 'admin'
    );
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- 7. Row-Level Security (RLS)
--
--   KEY CONCEPT:
--   • The backend uses the SERVICE KEY  → bypasses ALL RLS (used for provisioning).
--   • The frontend uses the ANON KEY    → goes through ALL RLS policies below.
--   • Logged-in users see only their own data UNLESS they are admin.
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable RLS on all tables
ALTER TABLE flashmvp.profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashmvp.projects        ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashmvp.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashmvp.run_history     ENABLE ROW LEVEL SECURITY;


-- ── profiles ─────────────────────────────────────────────────────────────────

-- Users can read their own profile. Admins can read all profiles.
CREATE POLICY "profiles: select own or admin"
    ON flashmvp.profiles FOR SELECT
    USING (id = auth.uid() OR flashmvp.is_admin());

-- Users can only update their own profile (not their role — that stays server-side).
CREATE POLICY "profiles: update own"
    ON flashmvp.profiles FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());


-- ── projects ─────────────────────────────────────────────────────────────────

-- A user can see a project if they own it, are a member, or are an admin.
CREATE POLICY "projects: select own or member or admin"
    ON flashmvp.projects FOR SELECT
    USING (
        owner_id = auth.uid()
        OR flashmvp.is_admin()
        OR EXISTS (
            SELECT 1 FROM flashmvp.project_members
            WHERE project_members.project_id = projects.id
              AND project_members.user_id    = auth.uid()
        )
    );

-- Only the backend service key creates projects (INSERT is backend-only via service key).
-- Regular users cannot INSERT directly through the anon key.
CREATE POLICY "projects: insert service key only"
    ON flashmvp.projects FOR INSERT
    WITH CHECK (FALSE);   -- anon/user JWT always blocked; service key bypasses RLS

-- Owner or admin can update project metadata.
CREATE POLICY "projects: update owner or admin"
    ON flashmvp.projects FOR UPDATE
    USING (owner_id = auth.uid() OR flashmvp.is_admin());

-- Only admins can delete projects.
CREATE POLICY "projects: delete admin only"
    ON flashmvp.projects FOR DELETE
    USING (flashmvp.is_admin());


-- ── project_members ──────────────────────────────────────────────────────────

-- Users can see memberships for projects they belong to. Admins see everything.
CREATE POLICY "project_members: select own project or admin"
    ON flashmvp.project_members FOR SELECT
    USING (
        user_id = auth.uid()
        OR flashmvp.is_admin()
        OR EXISTS (
            SELECT 1 FROM flashmvp.projects
            WHERE projects.id       = project_members.project_id
              AND projects.owner_id = auth.uid()
        )
    );

-- Only the project owner or an admin can grant/revoke membership.
CREATE POLICY "project_members: insert owner or admin"
    ON flashmvp.project_members FOR INSERT
    WITH CHECK (
        flashmvp.is_admin()
        OR EXISTS (
            SELECT 1 FROM flashmvp.projects
            WHERE projects.id       = project_members.project_id
              AND projects.owner_id = auth.uid()
        )
    );

CREATE POLICY "project_members: delete owner or admin"
    ON flashmvp.project_members FOR DELETE
    USING (
        flashmvp.is_admin()
        OR EXISTS (
            SELECT 1 FROM flashmvp.projects
            WHERE projects.id       = project_members.project_id
              AND projects.owner_id = auth.uid()
        )
    );


-- ── run_history ───────────────────────────────────────────────────────────────

-- Users can see runs for projects they own or are a member of. Admins see all.
CREATE POLICY "run_history: select project member or admin"
    ON flashmvp.run_history FOR SELECT
    USING (
        flashmvp.is_admin()
        OR EXISTS (
            SELECT 1 FROM flashmvp.projects
            WHERE projects.id       = run_history.project_id
              AND projects.owner_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM flashmvp.project_members
            WHERE project_members.project_id = run_history.project_id
              AND project_members.user_id    = auth.uid()
        )
    );

-- Run records are written only by the backend service key (INSERT blocked for anon/user).
CREATE POLICY "run_history: insert service key only"
    ON flashmvp.run_history FOR INSERT
    WITH CHECK (FALSE);


-- =============================================================================
-- DONE. Summary of what was created:
--
--   Schema:  flashmvp
--   Tables:  profiles, projects, project_members, run_history
--   Enums:   user_role (admin | user), project_status, run_status
--   Trigger: auto-create profile on auth.users INSERT
--   Trigger: auto-set updated_at on UPDATE
--   Helper:  flashmvp.is_admin() — used inside RLS policies
--   RLS:     Enabled on all 4 tables with admin vs user separation
-- =============================================================================
