// Pure policy foundation; zero paid service triggers, strict confidential isolation.
export type JobState = "queued" | "running" | "awaiting_approval" | "succeeded" | "failed" | "cancelled";

export type Role = "admin" | "manager" | "partner" | "auditor";

export type Provider = {
  id: string;
  name: string;
  enabled: boolean;
  healthy: boolean;
  free: boolean;
  remaining: number;
  confidentialAllowed: boolean;
  rateLimitRPM: number;
  rateLimitRPD: number;
  models: readonly string[];
  latencyMs?: number;
  lastChecked?: string;
  errorCount?: number;
};

export type AuditLogEntry = {
  id: string;
  timestamp: string;
  actor: string;
  role: Role;
  action: string;
  target: string;
  status: "allowed" | "blocked" | "awaiting_approval";
  details?: Record<string, unknown>;
};

export function eligibleProviders(providers: readonly Provider[], confidential = false): Provider[] {
  return providers.filter(
    (p) =>
      p.enabled &&
      p.healthy &&
      p.free &&
      Number.isFinite(p.remaining) &&
      p.remaining > 0 &&
      (!confidential || p.confidentialAllowed)
  );
}

const transitions: Record<JobState, readonly JobState[]> = {
  queued: ["running", "cancelled"],
  running: ["awaiting_approval", "succeeded", "failed", "cancelled"],
  awaiting_approval: ["queued", "cancelled"],
  succeeded: [],
  failed: ["queued", "cancelled"],
  cancelled: [],
};

export function canTransition(from: JobState, to: JobState): boolean {
  return transitions[from]?.includes(to) ?? false;
}

export function requiresApproval(action: string): boolean {
  return !["read_public", "draft", "calculate"].includes(action);
}

// Role-based permissions matrix
const rolePermissions: Record<Role, readonly string[]> = {
  admin: [
    "read_public",
    "draft",
    "calculate",
    "view_confidential",
    "edit_settings",
    "approve_actions",
    "execute_jobs",
    "manage_partners",
    "manage_orders",
    "export_reports",
  ],
  manager: [
    "read_public",
    "draft",
    "calculate",
    "view_confidential",
    "execute_jobs",
    "manage_partners",
    "manage_orders",
  ],
  partner: [
    "read_public",
    "draft",
    "calculate",
    "view_own_partner_data",
  ],
  auditor: [
    "read_public",
    "draft",
    "calculate",
    "audit_code",
    "audit_security",
    "view_logs",
  ],
};

export function canPerformAction(role: Role, action: string): boolean {
  const allowed = rolePermissions[role] ?? [];
  return allowed.includes(action);
}

// Strict safety checks for external requests
export function validateSafeOperation(action: string, isProduction: boolean, hasExplicitApproval: boolean): {
  allowed: boolean;
  reason?: string;
} {
  if (isProduction && !hasExplicitApproval) {
    return {
      allowed: false,
      reason: "Production deployment or modification requires explicit human approval.",
    };
  }

  if (["purchase", "payment", "fund_transfer"].includes(action) && !hasExplicitApproval) {
    return {
      allowed: false,
      reason: "Financial transactions require explicit human approval and are disabled in development mode.",
    };
  }

  if (["publish_public", "bulk_email", "dns_update"].includes(action) && !hasExplicitApproval) {
    return {
      allowed: false,
      reason: "External publishing or destructive operations require explicit human approval.",
    };
  }

  return { allowed: true };
}
