-- ==============================================================================
-- Least-Privilege Read-Only Dashboard Role & Policies Migration
-- Target: BrandLinker Ecosystem Supabase (enahlkxdplntriipabiu)
-- Architecture: Lead Implementation Engineer (Antigravity) & Master Architect (ChatGPT)
-- ==============================================================================

-- 1. Create a dedicated read-only role for the executive business dashboard
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'bl_dashboard_readonly') THEN
    CREATE ROLE bl_dashboard_readonly WITH NOLOGIN;
  END IF;
END
$$;

-- 2. Grant table selection rights ONLY on required business telemetry tables
GRANT USAGE ON SCHEMA public TO bl_dashboard_readonly;

GRANT SELECT ON TABLE public.bl_platforms TO bl_dashboard_readonly;
GRANT SELECT ON TABLE public.bl_partners TO bl_dashboard_readonly;
GRANT SELECT ON TABLE public.bl_agreements TO bl_dashboard_readonly;
GRANT SELECT ON TABLE public.bl_leads TO bl_dashboard_readonly;
GRANT SELECT ON TABLE public.bl_jobs TO bl_dashboard_readonly;
GRANT SELECT ON TABLE public.bl_audit TO bl_dashboard_readonly;

-- 3. Explicitly REVOKE all write, insert, update, delete, and DDL permissions
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON ALL TABLES IN SCHEMA public FROM bl_dashboard_readonly;
REVOKE CREATE ON SCHEMA public FROM bl_dashboard_readonly;

-- 4. Enable Row Level Security (RLS) on each table
ALTER TABLE public.bl_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bl_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bl_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bl_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bl_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bl_audit ENABLE ROW LEVEL SECURITY;

-- 5. Create granular SELECT policies for authenticated read-only dashboard role
DROP POLICY IF EXISTS "dashboard_readonly_select_platforms" ON public.bl_platforms;
CREATE POLICY "dashboard_readonly_select_platforms" ON public.bl_platforms
  FOR SELECT TO bl_dashboard_readonly USING (true);

DROP POLICY IF EXISTS "dashboard_readonly_select_partners" ON public.bl_partners;
CREATE POLICY "dashboard_readonly_select_partners" ON public.bl_partners
  FOR SELECT TO bl_dashboard_readonly USING (true);

DROP POLICY IF EXISTS "dashboard_readonly_select_agreements" ON public.bl_agreements;
CREATE POLICY "dashboard_readonly_select_agreements" ON public.bl_agreements
  FOR SELECT TO bl_dashboard_readonly USING (true);

DROP POLICY IF EXISTS "dashboard_readonly_select_leads" ON public.bl_leads;
CREATE POLICY "dashboard_readonly_select_leads" ON public.bl_leads
  FOR SELECT TO bl_dashboard_readonly USING (true);

DROP POLICY IF EXISTS "dashboard_readonly_select_jobs" ON public.bl_jobs;
CREATE POLICY "dashboard_readonly_select_jobs" ON public.bl_jobs
  FOR SELECT TO bl_dashboard_readonly USING (true);

DROP POLICY IF EXISTS "dashboard_readonly_select_audit" ON public.bl_audit;
CREATE POLICY "dashboard_readonly_select_audit" ON public.bl_audit
  FOR SELECT TO bl_dashboard_readonly USING (true);

-- 6. RPC: Exact count helper executing inside read-only sandbox
CREATE OR REPLACE FUNCTION public.get_dashboard_counts()
RETURNS json
LANGUAGE sql
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT json_build_object(
    'leadsCount', (SELECT count(*) FROM public.bl_leads),
    'jobsCount', (SELECT count(*) FROM public.bl_jobs),
    'agreementsCount', (SELECT count(*) FROM public.bl_agreements),
    'auditCount', (SELECT count(*) FROM public.bl_audit),
    'platformsCount', (SELECT count(*) FROM public.bl_platforms)
  );
$$;

REVOKE ALL ON FUNCTION public.get_dashboard_counts() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_dashboard_counts() TO bl_dashboard_readonly;
