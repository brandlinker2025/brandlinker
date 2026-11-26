import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { requireAction, verifyRequestSession } from "@/lib/auth-guard";
import { evaluateUaeVat } from "@/lib/uae-tax";
import { checkRateLimit, getClientIp } from "@/lib/rate-limiter";
import {
  fetchActualEcosystemData,
  persistLeadToDb,
  updateLeadStageInDb,
  persistAuditToDb,
  updateAgreementInDb,
  getSupabaseClient,
} from "@/lib/supabase-client";
import { calculateCommission, type AgreementTerms } from "@foundation/agreement-commission";
import {
  getPlatforms,
  getPartners,
  getAgreements,
  getLeads,
  getJobs,
  getApprovals,
  getAuditLog,
  addLead,
  updateLeadStage,
  resolveApproval,
  logAudit,
  type BlLead,
} from "@/lib/ecosystem-state";

export async function GET(req: Request) {
  const ip = getClientIp(req);
  const rateLimit = checkRateLimit(`data-get:${ip}`, 60, 60);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
  }

  // Require confidential-data authorization for private dashboard endpoints
  const session = verifyRequestSession(req);
  if (!session.authorized) {
    return NextResponse.json({ error: session.error || "Authentication required." }, { status: 401 });
  }

  const hasConfidentialAuth = requireAction(req, "view_confidential").authorized ||
    requireAction(req, "view_logs").authorized;

  if (!hasConfidentialAuth) {
    return NextResponse.json(
      { error: "Access Denied: Confidential-data authorization required for ecosystem dashboard." },
      { status: 403 }
    );
  }

  // Fetch actual data from Supabase; fail closed if query errors occur
  const actualData = await fetchActualEcosystemData();
  const platforms = actualData.platforms.length > 0 ? actualData.platforms : getPlatforms();
  const partners = actualData.connected ? actualData.partners : getPartners();
  const agreements = actualData.connected ? actualData.agreements : getAgreements();
  const leads = actualData.connected ? actualData.leads : getLeads();
  const jobs = actualData.connected ? actualData.jobs : getJobs();
  const audit = actualData.connected ? actualData.audit : getAuditLog();
  const approvals = getApprovals();

  const totalLeads = leads.length;
  const activeAgreements = agreements.filter((a) => a.status === "approved").length;
  const pendingApprovalsCount = approvals.filter((a) => a.status === "pending").length;
  const activeJobsCount = jobs.filter((j) => ["queued", "running"].includes(j.state)).length;

  return NextResponse.json({
    metrics: {
      totalPlatforms: platforms.length,
      totalPartners: partners.length,
      activeAgreements,
      totalLeads,
      pendingApprovalsCount,
      activeJobsCount,
      supabaseProjectId: "enahlkxdplntriipabiu",
      centralDatabaseStatus: actualData.connected
        ? "enahlkxdplntriipabiu.supabase.co (LIVE CONNECTED - Fail-Closed Guard Active)"
        : actualData.error
        ? `Database Error (Failed Closed): ${actualData.error}`
        : "enahlkxdplntriipabiu.supabase.co (Unconfigured Service Role Key - Fail Closed)",
      dataSource: actualData.source,
      failClosed: !actualData.connected,
    },
    platforms,
    partners,
    agreements,
    leads,
    jobs,
    approvals,
    audit,
    actor: session.actor,
    role: session.role,
  });
}

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const rateLimit = checkRateLimit(`data-post:${ip}`, 45, 60);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { action, payload } = body;

    if (!action) {
      return NextResponse.json({ error: "Action is required." }, { status: 400 });
    }

    const session = requireAction(req, action);
    if (!session.authorized) {
      return NextResponse.json({ error: session.error }, { status: 403 });
    }

    switch (action) {
      case "add_lead": {
        const lead = addLead(payload, session.actor);
        // Persist to actual database table if connected
        await persistLeadToDb(lead);
        await persistAuditToDb({
          id: randomUUID(),
          actorId: session.actor,
          action: "LEAD_CREATED",
          entityId: lead.id,
          createdAt: new Date().toISOString(),
        });
        return NextResponse.json({ success: true, lead });
      }

      case "update_lead_status":
      case "update_lead_stage": {
        const ok = updateLeadStage(payload.id, payload.stage || payload.status, session.actor);
        await updateLeadStageInDb(payload.id, payload.stage || payload.status);
        return NextResponse.json({ success: ok });
      }

      case "approve_actions": {
        const { approvalId, decision, agreementId } = payload;
        const ok = resolveApproval(approvalId, decision, session.actor);
        if (agreementId) {
          await updateAgreementInDb(agreementId, decision === "approved" ? "approved" : "revoked", session.actor);
        }
        await persistAuditToDb({
          id: randomUUID(),
          actorId: session.actor,
          action: decision === "approved" ? "ACTION_APPROVED" : "ACTION_REJECTED",
          entityId: approvalId,
          createdAt: new Date().toISOString(),
        });
        return NextResponse.json({ success: ok });
      }

      case "calculate": {
        const { type } = payload;

        if (type === "landed_cost") {
          const { costUSD, shippingUSD, dutyRate = 0.05, targetMargin = 0.6 } = payload;
          const duty = costUSD * dutyRate;
          const landedCost = costUSD + shippingUSD + duty;
          const sellingPrice = landedCost / (1 - targetMargin);
          const profit = sellingPrice - landedCost;
          return NextResponse.json({
            landedCost: Math.round(landedCost * 100) / 100,
            recommendedPrice: Math.round(sellingPrice * 100) / 100,
            unitProfit: Math.round(profit * 100) / 100,
            marginPercent: Math.round(targetMargin * 100),
          });
        }

        if (type === "commission") {
          const {
            propertyValueAED,
            partnerId,
            asOfDate = new Date().toISOString().split("T")[0],
            isVatRegistered = false, // Never assume VAT registration
            supplierTrn,             // No fake default TRN
            clientResidency = "uae_resident",
          } = payload;

          // Calculate commissions EXCLUSIVELY from verified database agreements
          let matchingAgreement: any = null;
          const supabase = getSupabaseClient();
          if (supabase) {
            const { data, error } = await supabase
              .from("bl_agreements")
              .select("*")
              .eq("partner_id", partnerId)
              .eq("status", "approved")
              .maybeSingle();

            if (error) {
              return NextResponse.json(
                { error: `Database error querying partner agreements: ${error.message}` },
                { status: 503 }
              );
            }
            if (data) {
              matchingAgreement = {
                id: data.id,
                evidenceSha256: data.evidence_sha256,
                status: data.status,
                approvedBy: data.approved_by,
                validFrom: data.valid_from,
                validUntil: data.valid_until,
                commissionBasisPoints: data.commission_bps,
              };
            }
          }

          if (!matchingAgreement) {
            return NextResponse.json(
              { error: "Commission Calculation Blocked: No approved agreement found in central database (bl_agreements). Signed agreement evidence and admin approval are required." },
              { status: 422 }
            );
          }

          let commResult;
          try {
            const amountMinor = Math.round(Number(propertyValueAED) * 100);
            const commMinor = calculateCommission(amountMinor, matchingAgreement as AgreementTerms, asOfDate);
            commResult = {
              amountAED: Number(propertyValueAED),
              commissionAED: commMinor / 100,
              commissionBps: matchingAgreement.commissionBasisPoints,
              agreementId: matchingAgreement.id,
              evidenceSha256: matchingAgreement.evidenceSha256,
              status: matchingAgreement.status,
            };
          } catch (err: any) {
            return NextResponse.json(
              { error: `Commission Calculation Rejected: ${err.message}` },
              { status: 422 }
            );
          }

          // Evaluate statutory UAE VAT applicability without assumed registration or default TRN
          const vatAssessment = evaluateUaeVat({
            isSupplierVatRegistered: Boolean(isVatRegistered && supplierTrn),
            supplierTrn: supplierTrn ? String(supplierTrn).trim() : undefined,
            clientResidency,
            propertyLocation: "uae",
          });

          const vatRate = vatAssessment.vatApplicable ? vatAssessment.ratePercent / 100 : 0;
          const uaeVatAED = commResult.commissionAED * vatRate;
          const totalInvoiceAED = commResult.commissionAED + uaeVatAED;

          logAudit(
            session.actor,
            "COMMISSION_CALCULATE",
            commResult.agreementId,
            `Property: ${propertyValueAED} AED | Commission: ${commResult.commissionAED} AED`
          );

          return NextResponse.json({
            ...commResult,
            vatApplicable: vatAssessment.vatApplicable,
            vatRatePercent: vatAssessment.ratePercent,
            trnValidated: vatAssessment.trnValidated,
            legalBasis: vatAssessment.legalBasis,
            uaeVatAED,
            totalInvoiceAED,
          });
        }

        return NextResponse.json({ error: "Unsupported calculation type" }, { status: 400 });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json(
      { error: "Invalid request payload", details: err.message },
      { status: 400 }
    );
  }
}
