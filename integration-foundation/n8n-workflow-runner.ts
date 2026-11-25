import { requiresApproval, type JobState } from "./policy";
import type { Job, JobStore } from "./job-store";
import { transitionJob } from "./job-service";

export type N8nNode = {
  id: string;
  name: string;
  type: "webhook_trigger" | "policy_gate" | "agent_dispatch" | "transformer" | "output_webhook";
  parameters: Record<string, any>;
};

export type N8nWorkflowDefinition = {
  id: string;
  name: string;
  nodes: N8nNode[];
  active: boolean;
};

export type WorkflowExecutionContext = {
  store: JobStore;
  machineToken: string;
  expectedToken: string;
  idempotencyKey?: string;
};

export type WorkflowExecutionResult = {
  workflowId: string;
  jobId: string;
  finalState: JobState;
  executedNodes: string[];
  output?: any;
  approvalRequired?: boolean;
};

export async function executeN8nWorkflow(
  workflow: N8nWorkflowDefinition,
  inputPayload: Record<string, any>,
  context: WorkflowExecutionContext
): Promise<WorkflowExecutionResult> {
  // Step 1: Verify machine token authentication
  if (context.machineToken !== context.expectedToken) {
    throw new Error("Unauthorized machine token for n8n workflow execution");
  }

  const executedNodes: string[] = [];
  const jobId = `wf-job-${workflow.id}-${Date.now()}`;
  const now = new Date().toISOString();

  // Create initial job in durable store
  const initialJob: Job = {
    id: jobId,
    agentId: inputPayload.agentId || "automation",
    state: "queued",
    revision: 1,
    createdAt: now,
    updatedAt: now,
    idempotencyKey: context.idempotencyKey || `wf-idem-${jobId}`,
  };

  const storedJob = await context.store.createOrGet(initialJob);

  // Transition to running
  let currentJob = await transitionJob(context.store, storedJob.id, "running");

  let currentData = { ...inputPayload };

  // Step through workflow nodes
  for (const node of workflow.nodes) {
    executedNodes.push(node.name);

    if (node.type === "webhook_trigger") {
      // Validate schema
      if (!currentData) {
        throw new Error("Workflow input data missing");
      }
    } else if (node.type === "policy_gate") {
      const actionType = node.parameters?.actionType || currentData.actionType || "draft";
      if (requiresApproval(actionType)) {
        // Must pause workflow in awaiting_approval state
        currentJob = await transitionJob(context.store, currentJob.id, "awaiting_approval");
        return {
          workflowId: workflow.id,
          jobId: currentJob.id,
          finalState: "awaiting_approval",
          executedNodes,
          approvalRequired: true,
          output: "Workflow paused at policy gate. Human administrator approval required to resume.",
        };
      }
    } else if (node.type === "agent_dispatch") {
      // Process payload
      currentData = {
        ...currentData,
        processedBy: node.parameters?.agentId || "executive",
        summary: `Processed ${Object.keys(currentData).length} fields for action ${currentData.actionType || "general"}`,
      };
    } else if (node.type === "transformer") {
      currentData = {
        ...currentData,
        transformedAt: new Date().toISOString(),
        status: "ready_for_delivery",
      };
    }
  }

  // Final transition to succeeded
  currentJob = await transitionJob(context.store, currentJob.id, "succeeded");

  return {
    workflowId: workflow.id,
    jobId: currentJob.id,
    finalState: "succeeded",
    executedNodes,
    output: currentData,
    approvalRequired: false,
  };
}
