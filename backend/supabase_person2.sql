-- Run as postgres in Supabase SQL Editor AFTER supabase_schema.sql.
-- Person 2 owns run history and service visibility.
-- Stage/job definitions come from repository configuration and source files.
BEGIN;

-- Intentionally removes former definitions and their data, policies and indexes.
-- Drop jobs first because their stage_id references qa_stages.
DROP TABLE IF EXISTS flashmvp.qa_steps;
DROP TABLE IF EXISTS flashmvp.qa_stages;

CREATE TABLE IF NOT EXISTS flashmvp.project_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES flashmvp.projects(id) ON DELETE CASCADE,
    service_type TEXT NOT NULL CHECK (service_type IN ('frontend', 'backend', 'db')),
    container_id TEXT,
    url TEXT,
    port INTEGER CHECK (port BETWEEN 1 AND 65535),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (project_id, service_type)
);
CREATE OR REPLACE TRIGGER trg_project_services_updated_at
    BEFORE UPDATE ON flashmvp.project_services
    FOR EACH ROW EXECUTE FUNCTION flashmvp.set_updated_at();

ALTER TABLE flashmvp.run_history ADD COLUMN IF NOT EXISTS branch TEXT;
ALTER TABLE flashmvp.run_history ADD COLUMN IF NOT EXISTS commit_sha TEXT;
-- run_history.qa_steps remains the immutable result snapshot for each run.

CREATE OR REPLACE FUNCTION flashmvp.can_access_project(
    p_project_id UUID, p_write BOOLEAN DEFAULT false
)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
    SELECT auth.uid() IS NOT NULL AND (
        EXISTS (SELECT 1 FROM flashmvp.profiles WHERE id = auth.uid() AND role = 'admin')
        OR EXISTS (SELECT 1 FROM flashmvp.projects WHERE id = p_project_id AND owner_id = auth.uid())
        OR EXISTS (
            SELECT 1 FROM flashmvp.project_members
            WHERE project_id = p_project_id AND user_id = auth.uid()
              AND (NOT p_write OR role = 'admin')
        )
    );
$$;
REVOKE ALL ON FUNCTION flashmvp.can_access_project(UUID, BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION flashmvp.can_access_project(UUID, BOOLEAN)
    TO authenticated, service_role;

ALTER TABLE flashmvp.project_services ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "project_services: read project" ON flashmvp.project_services;
CREATE POLICY "project_services: read project" ON flashmvp.project_services
    FOR SELECT TO authenticated USING (flashmvp.can_access_project(project_id));

DROP POLICY IF EXISTS "projects: select own or member or admin" ON flashmvp.projects;
CREATE POLICY "projects: select own or member or admin" ON flashmvp.projects
    FOR SELECT TO authenticated USING (flashmvp.can_access_project(id));
DROP POLICY IF EXISTS "project_members: select own project or admin" ON flashmvp.project_members;
CREATE POLICY "project_members: select own project or admin" ON flashmvp.project_members
    FOR SELECT TO authenticated USING (flashmvp.can_access_project(project_id));
DROP POLICY IF EXISTS "run_history: select project member or admin" ON flashmvp.run_history;
CREATE POLICY "run_history: select project member or admin" ON flashmvp.run_history
    FOR SELECT TO authenticated USING (flashmvp.can_access_project(project_id));

GRANT USAGE ON SCHEMA flashmvp TO authenticated, service_role;
REVOKE ALL ON TABLE flashmvp.project_services FROM anon, authenticated;
GRANT SELECT ON TABLE flashmvp.project_services, flashmvp.profiles,
    flashmvp.projects, flashmvp.project_members, flashmvp.run_history TO authenticated;
GRANT ALL ON TABLE flashmvp.profiles, flashmvp.projects,
    flashmvp.project_members, flashmvp.run_history,
    flashmvp.project_services TO service_role;

COMMIT;
