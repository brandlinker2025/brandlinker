import { NextResponse } from "next/server";
import { createJob, getJobs, transitionJob } from "@/lib/ecosystem-state";
import { requiresApproval, type JobState } from "@foundation/policy";

// In-memory idempotency store
const processedIdempotencyKeys = new Set<string>();

export async function GET(req: Request) {
  // Machine token check for n8n worker polling
  const token = req.headers.get("x-machine-token") || req.headers.get("x-n8n-token");
  const expectedToken = process.env.MACHINE_API_TOKEN || process.env.N8N_FACTORY_TOKEN || "rs-machine-dev-token";

  if (!token || token !== expectedToken) {
    return NextResponse.json({ error: "Unauthorized machine token." }, { status: 401 });
  }

  const jobs = getJobs();
  const queuedJobs = jobs.filter((j) => j.state === "queued");

  return NextResponse.json({
    status: "online",
    workerProtocolVersion: "1.0.0",
    queuedCount: queuedJobs.length,
    queuedJobs: queuedJobs.slice(0, 10),
  });
}

export async function POST(req: Request) {
  try {
    const token = req.headers.get("x-machine-token") || req.headers.get("x-n8n-token");
    const expectedToken = process.env.MACHINE_API_TOKEN || process.env.N8N_FACTORY_TOKEN || "rs-machine-dev-token";

    if (!token || token !== expectedToken) {
      return NextResponse.json({ error: "Unauthorized machine token." }, { status: 401 });
    }

    const idempotencyKey = req.headers.get("x-idempotency-key");
    if (idempotencyKey) {
      if (processedIdempotencyKeys.has(idempotencyKey)) {
        return NextResponse.json(
          { message: "Duplicate request ignored (idempotent)", idempotencyKey },
          { status: 200 }
        );
      }
      processedIdempotencyKeys.add(idempotencyKey);
    }

    const body = await req.json();
    const { actionType, title, module = "n8n_workflow", payload = {} } = body;

    // Check if the requested action requires human-in-the-loop approval
    const needApproval = requiresApproval(actionType || "external_write");

    const job = createJob(
      title || `n8n Triggered: ${actionType || "Workflow Task"}`,
      module,
      { ...payload, actionType, idempotencyKey },
      needApproval
    );

    return NextResponse.json({
      success: true,
      jobId: job.id,
      state: job.state,
      requiresApproval: needApproval,
      message: needApproval
        ? "Job held in 'awaiting_approval' state. Approval required from Admin before external execution."
        : "Job queued for background processing.",
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Webhook dispatch failed" },
      { status: 500 }
    );
  }
}
