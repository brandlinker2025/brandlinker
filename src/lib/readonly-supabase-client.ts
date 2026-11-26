import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { BlPlatform, BlPartner, BlAgreement, BlLead, BlJob, BlAudit } from "./ecosystem-state";
import { platforms } from "@foundation/platforms";

let readonlyClientInstance: SupabaseClient | null = null;

/**
 * Least-Privilege Read-Only Supabase Client
 *
 * Accepts either:
 * - BL_DASHBOARD_READONLY_KEY (least privilege, dedicated read-only role/token)
 * - BL_SUPABASE_READONLY_KEY / SUPABASE_ANON_KEY (authenticated read token)
 * - Fallback to BL_SUPABASE_SERVICE_KEY if explicitly provided, but never strictly requires it.
 */
export function getReadonlySupabaseClient(): SupabaseClient | null {
  if (typeof window !== "undefined") return null;
  const url = process.env.BL_SUPABASE_URL || "https://enahlkxdplntriipabiu.supabase.co";
  
  // Check read-only keys first for least-privilege
  const key =
    process.env.BL_DASHBOARD_READONLY_KEY ||
    process.env.BL_SUPABASE_READONLY_KEY ||
    process.env.BL_SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!key) return null;

  if (!readonlyClientInstance) {
    readonlyClientInstance = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return readonlyClientInstance;
}

export interface PaginatedCrmQuery {
  page?: number;
  pageSize?: number;
}

export interface DashboardTelemetryResult {
  connected: boolean;
  source: string;
  error?: string;
  counts: {
    leadsCount: number;
    jobsCount: number;
    agreementsCount: number;
    auditCount: number;
    platformsCount: number;
  };
  pagination: {
    page: number;
    pageSize: number;
    totalLeads: number;
    totalPages: number;
  };
  leads: BlLead[];
  jobs: BlJob[];
  agreements: BlAgreement[];
  audit: BlAudit[];
}

/**
 * Fetch actual ecosystem telemetry with exact database counts and paginated CRM records
 */
export async function fetchReadonlyTelemetry(
  options: PaginatedCrmQuery = {}
): Promise<DashboardTelemetryResult> {
  const page = Math.max(1, options.page || 1);
  const pageSize = Math.min(100, Math.max(1, options.pageSize || 10));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = getReadonlySupabaseClient();
  if (!supabase) {
    return {
      connected: false,
      source: "readonly_key_unconfigured",
      error: "Missing BL_DASHBOARD_READONLY_KEY or equivalent read credential",
      counts: { leadsCount: 0, jobsCount: 0, agreementsCount: 0, auditCount: 0, platformsCount: platforms.length },
      pagination: { page, pageSize, totalLeads: 0, totalPages: 0 },
      leads: [],
      jobs: [],
      agreements: [],
      audit: [],
    };
  }

  try {
    // 1. Fetch exact counts using { count: 'exact', head: false } or head: true
    const [
      { count: totalPlatforms, error: errPlatCount },
      { count: totalJobs, data: dbJobs, error: errJobs },
      { count: totalAgreements, data: dbAgreements, error: errAgr },
      { count: totalAudit, data: dbAudit, error: errAudit },
      { count: totalLeads, data: paginatedLeads, error: errLeads },
    ] = await Promise.all([
      supabase.from("bl_platforms").select("*", { count: "exact", head: true }),
      supabase.from("bl_jobs").select("*", { count: "exact" }).limit(20),
      supabase.from("bl_agreements").select("*", { count: "exact" }).limit(20),
      supabase.from("bl_audit").select("*", { count: "exact" }).order("created_at", { ascending: false }).limit(20),
      supabase.from("bl_leads").select("*", { count: "exact" }).range(from, to).order("created_at", { ascending: false }),
    ]);

    // FAIL CLOSED: If any query encounters a database error, sanitize and fail closed
    const queryError = errPlatCount || errJobs || errAgr || errAudit || errLeads;
    if (queryError) {
      return {
        connected: false,
        source: "fail_closed_query_error",
        error: "Database query failed. Sanitized error.",
        counts: { leadsCount: 0, jobsCount: 0, agreementsCount: 0, auditCount: 0, platformsCount: 0 },
        pagination: { page, pageSize, totalLeads: 0, totalPages: 0 },
        leads: [],
        jobs: [],
        agreements: [],
        audit: [],
      };
    }

    const leadsCount = totalLeads ?? 0;
    const totalPages = Math.ceil(leadsCount / pageSize);

    return {
      connected: true,
      source: "supabase_readonly_pool",
      counts: {
        leadsCount,
        jobsCount: totalJobs ?? 0,
        agreementsCount: totalAgreements ?? 0,
        auditCount: totalAudit ?? 0,
        platformsCount: totalPlatforms ?? platforms.length,
      },
      pagination: {
        page,
        pageSize,
        totalLeads: leadsCount,
        totalPages,
      },
      leads: (paginatedLeads || []) as BlLead[],
      jobs: (dbJobs || []) as BlJob[],
      agreements: (dbAgreements || []) as BlAgreement[],
      audit: (dbAudit || []) as BlAudit[],
    };
  } catch (err: any) {
    return {
      connected: false,
      source: "fail_closed_exception",
      error: "Unexpected database connectivity error",
      counts: { leadsCount: 0, jobsCount: 0, agreementsCount: 0, auditCount: 0, platformsCount: 0 },
      pagination: { page, pageSize, totalLeads: 0, totalPages: 0 },
      leads: [],
      jobs: [],
      agreements: [],
      audit: [],
    };
  }
}
