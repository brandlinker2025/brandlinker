import { canTransition, type JobState, type Role } from "@foundation/policy";
import { calculateCommission, type AgreementTerms } from "@foundation/agreement-commission";
import { platforms, type PlatformId } from "@foundation/platforms";

export type BlPlatform = {
  id: PlatformId;
  domain: string;
};

export type BlJob = {
  id: string;
  platformId: PlatformId;
  agentId: string;
  state: JobState;
  revision: number;
  idempotencyKey: string;
  createdAt: string;
  updatedAt: string;
};

export type BlPartner = {
  id: string;
  name: string;
  createdAt: string;
};

export type BlAgreement = {
  id: string;
  partnerId: string;
  evidenceSha256: string;
  evidencePath: string;
  commissionBps: number; // e.g. 250 bps = 2.50%
  validFrom: string;
  validUntil: string;
  status: "draft" | "approved" | "revoked";
  approvedBy: string | null;
};

export type BlLead = {
  id: string;
  platformId: PlatformId;
  name: string;
  contact: string;
  consentAt: string | null;
  stage: "new" | "contacted" | "qualified" | "converted" | "closed";
  createdAt: string;
  budgetAED?: number;
};

export type BlAudit = {
  id: string;
  actorId: string;
  action: string;
  entityId: string;
  createdAt: string;
  details?: string;
};

export type ApprovalRequest = {
  id: string;
  jobId: string;
  title: string;
  actionType: "purchase" | "publish" | "bulk_email" | "contract_sign" | "supplier_payment" | "partner_agreement_verification";
  requestedBy: string;
  riskLevel: "low" | "medium" | "high";
  details: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
};

// Central ecosystem runtime state
// Fabricated demo datasets removed: runtime mirrors actual database records.
// In real database: Agreements=0, approved agreements=0, jobs=0, audit entries=0.
let blPlatformsList: BlPlatform[] = [...platforms];
let blPartnersList: BlPartner[] = [];
let blAgreementsList: BlAgreement[] = [];
let blLeadsList: BlLead[] = [];
let blJobsList: BlJob[] = [];
let blAuditList: BlAudit[] = [];
let approvals: ApprovalRequest[] = [];

// Getters
export function getPlatforms() { return [...blPlatformsList]; }
export function getPartners() { return [...blPartnersList]; }
export function getAgreements() { return [...blAgreementsList]; }
export function getLeads() { return [...blLeadsList]; }
export function getJobs() { return [...blJobsList]; }
export function getAuditLog() { return [...blAuditList]; }
export function getApprovals() { return [...approvals]; }

// Audit logger
export function logAudit(actorId: string, action: string, entityId: string, details?: string): BlAudit {
  const entry: BlAudit = {
    id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    actorId,
    action,
    entityId,
    details,
    createdAt: new Date().toISOString(),
  };
  blAuditList.unshift(entry);
  return entry;
}

// Mutators
export function createJob(
  title: string,
  moduleOrPlatform: string,
  payload: Record<string, any> = {},
  requiresApproval = false
): BlJob {
  const platformId: PlatformId = (isPlatformId(moduleOrPlatform) ? moduleOrPlatform : "rslina") as PlatformId;
  const newJob: BlJob = {
    id: `job-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    platformId,
    agentId: payload.agentId || "automation",
    state: requiresApproval ? "awaiting_approval" : "queued",
    revision: 0,
    idempotencyKey: payload.idempotencyKey || `idem-${Date.now()}-${Math.random()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  blJobsList.unshift(newJob);

  if (requiresApproval) {
    approvals.unshift({
      id: `appr-${Date.now()}`,
      jobId: newJob.id,
      title: `Approve: ${title}`,
      actionType: "publish",
      requestedBy: "Job Engine",
      riskLevel: "medium",
      details: JSON.stringify(payload),
      status: "pending",
      createdAt: new Date().toISOString(),
    });
  }

  logAudit("system", "JOB_CREATED", newJob.id, `Created job ${newJob.id} (State: ${newJob.state})`);
  return newJob;
}

export function transitionJob(id: string, newState: JobState, actor = "system"): boolean {
  const job = blJobsList.find((j) => j.id === id);
  if (!job) return false;

  if (!canTransition(job.state, newState)) {
    throw new Error(`Invalid transition from ${job.state} to ${newState}`);
  }

  job.state = newState;
  job.revision += 1;
  job.updatedAt = new Date().toISOString();
  logAudit(actor, "JOB_TRANSITION", id, `Transitioned to ${newState} (Rev: ${job.revision})`);
  return true;
}

function isPlatformId(val: string): val is PlatformId {
  return platforms.some((p) => p.id === val);
}

export function addLead(lead: Omit<BlLead, "id" | "createdAt">, actor = "system"): BlLead {
  const newLead: BlLead = {
    ...lead,
    id: `lead-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  blLeadsList.unshift(newLead);
  logAudit(actor, "LEAD_CREATED", newLead.id, `Created lead ${newLead.name} on ${newLead.platformId}`);
  return newLead;
}

export function updateLeadStage(id: string, stage: BlLead["stage"], actor = "system"): boolean {
  const lead = blLeadsList.find((l) => l.id === id);
  if (lead) {
    lead.stage = stage;
    logAudit(actor, "LEAD_STAGE_UPDATED", id, `Updated stage to ${stage}`);
    return true;
  }
  return false;
}

// Commission calculator using Master Architect's agreement-commission.ts
export function calculatePartnerCommission(
  partnerId: string,
  amountAED: number,
  asOfDate: string = new Date().toISOString().split("T")[0]
): {
  amountAED: number;
  commissionAED: number;
  commissionBps: number;
  agreementId: string;
  evidenceSha256: string;
  status: string;
} {
  const agreement = blAgreementsList.find((a) => a.partnerId === partnerId);
  if (!agreement) {
    throw new Error("No agreement on record for specified partner");
  }

  const terms: AgreementTerms = {
    agreementId: agreement.id,
    evidenceId: agreement.evidenceSha256,
    status: agreement.status,
    approvedBy: agreement.approvedBy,
    validFrom: agreement.validFrom,
    validUntil: agreement.validUntil,
    commissionBasisPoints: agreement.commissionBps,
  };

  // Convert amountAED to minor units (fils / cents: 1 AED = 100 fils)
  const amountMinor = Math.round(amountAED * 100);
  const commissionMinor = calculateCommission(amountMinor, terms, asOfDate);
  const commissionAED = commissionMinor / 100;

  return {
    amountAED,
    commissionAED,
    commissionBps: agreement.commissionBps,
    agreementId: agreement.id,
    evidenceSha256: agreement.evidenceSha256,
    status: agreement.status,
  };
}

export function resolveApproval(id: string, decision: "approved" | "rejected", actor: string): boolean {
  const appr = approvals.find((a) => a.id === id);
  if (!appr || appr.status !== "pending") return false;

  appr.status = decision;
  logAudit(actor, `APPROVAL_${decision.toUpperCase()}`, id, appr.title);

  if (appr.actionType === "partner_agreement_verification") {
    const agreement = blAgreementsList.find((a) => a.id === "agr-sobha-03");
    if (agreement) {
      if (decision === "approved") {
        agreement.status = "approved";
        agreement.approvedBy = actor;
        logAudit(actor, "AGREEMENT_APPROVED", agreement.id, `Approved by ${actor}`);
      } else {
        agreement.status = "revoked";
        logAudit(actor, "AGREEMENT_REVOKED", agreement.id, `Revoked by ${actor}`);
      }
    }
  }

  const job = blJobsList.find((j) => j.id === appr.jobId);
  if (job && job.state === "awaiting_approval") {
    if (decision === "approved") {
      job.state = "queued";
    } else {
      job.state = "cancelled";
    }
    job.updatedAt = new Date().toISOString();
  }
  return true;
}
