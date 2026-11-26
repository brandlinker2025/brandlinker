import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { BlPlatform, BlPartner, BlAgreement, BlLead, BlJob, BlAudit } from "./ecosystem-state";
import { platforms } from "@foundation/platforms";

let clientInstance: SupabaseClient | null = null;

// Server-side only: strictly requires service_role key.
// Anonymous key fallback is strictly prohibited for private server operations.
export function getSupabaseClient(): SupabaseClient | null {
  if (typeof window !== "undefined") return null;
  const url = process.env.BL_SUPABASE_URL || "https://enahlkxdplntriipabiu.supabase.co";
  const key = process.env.BL_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  if (!clientInstance) {
    clientInstance = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return clientInstance;
}

export async function fetchActualEcosystemData() {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return {
      connected: false,
      source: "service_key_unconfigured",
      platforms: [...platforms],
      partners: [] as BlPartner[],
      agreements: [] as BlAgreement[],
      leads: [] as BlLead[],
      jobs: [] as BlJob[],
      audit: [] as BlAudit[],
    };
  }

  try {
    const [
      { data: dbPlatforms, error: errPlat },
      { data: dbPartners, error: errPart },
      { data: dbAgreements, error: errAgr },
      { data: dbLeads, error: errLead },
      { data: dbJobs, error: errJobs },
      { data: dbAudit, error: errAudit },
    ] = await Promise.all([
      supabase.from("bl_platforms").select("*"),
      supabase.from("bl_partners").select("*"),
      supabase.from("bl_agreements").select("*"),
      supabase.from("bl_leads").select("*"),
      supabase.from("bl_jobs").select("*"),
      supabase.from("bl_audit").select("*").order("created_at", { ascending: false }).limit(100),
    ]);

    // FAIL CLOSED: If ANY required query fails, refuse partial or simulated state
    const queryError = errPlat || errPart || errAgr || errLead || errJobs || errAudit;
    if (queryError) {
      return {
        connected: false,
        source: "fail_closed_query_error",
        error: queryError.message || "Required database query failed",
        platforms: [...platforms],
        partners: [] as BlPartner[],
        agreements: [] as BlAgreement[],
        leads: [] as BlLead[],
        jobs: [] as BlJob[],
        audit: [] as BlAudit[],
      };
    }

    return {
      connected: true,
      source: "supabase_live",
      platforms: (dbPlatforms && dbPlatforms.length > 0) ? dbPlatforms : [...platforms],
      partners: dbPartners || [],
      agreements: (dbAgreements || []).map((a: any) => ({
        id: a.id,
        partnerId: a.partner_id,
        evidenceSha256: a.evidence_sha256,
        evidencePath: a.evidence_path,
        commissionBps: a.commission_bps,
        validFrom: a.valid_from,
        validUntil: a.valid_until,
        status: a.status,
        approvedBy: a.approved_by,
      })),
      leads: (dbLeads || []).map((l: any) => ({
        id: l.id,
        platformId: l.platform_id,
        name: l.name,
        contact: l.contact,
        consentAt: l.consent_at,
        stage: l.stage,
        createdAt: l.created_at,
        budgetAED: l.budget_aed,
      })),
      jobs: (dbJobs || []).map((j: any) => ({
        id: j.id,
        platformId: j.platform_id || "rslina",
        agentId: j.agent_id,
        state: j.state,
        revision: j.revision,
        idempotencyKey: j.idempotency_key,
        createdAt: j.created_at,
        updatedAt: j.updated_at,
      })),
      audit: (dbAudit || []).map((au: any) => ({
        id: String(au.id),
        actorId: au.actor_id,
        action: au.action,
        entityId: au.entity_id,
        createdAt: au.created_at,
        details: au.details,
      })),
    };
  } catch (err: any) {
    // FAIL CLOSED
    return {
      connected: false,
      source: "fail_closed_exception",
      error: err?.message || "Database connection threw an unhandled exception",
      platforms: [...platforms],
      partners: [],
      agreements: [],
      leads: [],
      jobs: [],
      audit: [],
    };
  }
}

// Write/persist operations directly to Supabase tables
export async function persistLeadToDb(lead: BlLead): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;
  const { error } = await supabase.from("bl_leads").insert({
    platform_id: lead.platformId,
    name: lead.name,
    contact: lead.contact,
    consent_at: lead.consentAt,
    stage: lead.stage,
    created_at: lead.createdAt,
  });
  return !error;
}

export async function updateLeadStageInDb(id: string, stage: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;
  const { error } = await supabase.from("bl_leads").update({ stage }).eq("id", id);
  return !error;
}

export async function persistAuditToDb(entry: BlAudit): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;
  const { error } = await supabase.from("bl_audit").insert({
    actor_id: entry.actorId && /^[0-9a-f-]{36}$/i.test(entry.actorId) ? entry.actorId : null,
    action: entry.action,
    entity_id: entry.entityId,
    created_at: entry.createdAt,
  });
  return !error;
}

export async function persistJobToDb(job: BlJob): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;
  const { error } = await supabase.from("bl_jobs").insert({
    id: job.id,
    platform_id: job.platformId,
    agent_id: job.agentId,
    state: job.state,
    revision: job.revision,
    idempotency_key: job.idempotencyKey,
    created_at: job.createdAt,
    updated_at: job.updatedAt,
  });
  return !error;
}

export async function updateJobInDb(id: string, state: string, revision: number): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;
  const { error } = await supabase
    .from("bl_jobs")
    .update({ state, revision, updated_at: new Date().toISOString() })
    .eq("id", id);
  return !error;
}

export async function updateAgreementInDb(id: string, status: string, approvedBy: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;
  const { error } = await supabase
    .from("bl_agreements")
    .update({ status, approved_by: approvedBy })
    .eq("id", id);
  return !error;
}
