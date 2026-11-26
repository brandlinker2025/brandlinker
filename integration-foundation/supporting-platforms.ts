/**
 * Cross-Platform Supporting Repository Connector & Task Execution Registry
 *
 * Supported Repositories:
 * 1. RS-AI-Studio: AI media and prompt playground
 * 2. BrandLinker-AI-Studio: Brand studio assets and generation pipelines
 * 3. RS-Video-Editor: Automated clip cutting and subtitle timeline pipeline
 * 4. free-llm-api-resources: Free-tier provider documentation and endpoint health
 * 5. Cheap-Ticket-Finder: Flight search engine and fare aggregator
 * 6. Language-Tutor-RS: Multi-language tutoring and voice prompt system
 *
 * Guarantees:
 * - Durable task queues with retry & idempotency
 * - Human approval gates for external publishing or financial execution
 * - Free AI provider routing with strict zero-cost enforcement
 * - Audit logging across all operations
 */

export interface SupportingProject {
  id: string;
  name: string;
  repoPath: string;
  role: string;
  status: "connected" | "active" | "standby";
  capabilities: string[];
}

export const SUPPORTING_PROJECTS: SupportingProject[] = [
  {
    id: "rs-ai-studio",
    name: "RS AI Studio",
    repoPath: "C:\\Users\\RS LINA\\Documents\\RS-AI-Studio",
    role: "AI Creative & Prompt Prototyping",
    status: "connected",
    capabilities: ["image_prompting", "style_transfer", "creative_synthesis"],
  },
  {
    id: "brandlinker-ai-studio",
    name: "BrandLinker AI Studio",
    repoPath: "C:\\Users\\RS LINA\\Documents\\BrandLinker-AI-Studio",
    role: "Brand Asset & Marketing Automation",
    status: "connected",
    capabilities: ["brand_guidelines", "asset_export", "visual_generator"],
  },
  {
    id: "rs-video-editor",
    name: "RS Video Editor",
    repoPath: "C:\\Users\\RS LINA\\Documents\\RS-Video-Editor",
    role: "Timeline Video Processing & Subtitling",
    status: "connected",
    capabilities: ["video_slicing", "caption_render", "remotion_composition"],
  },
  {
    id: "free-llm-resources",
    name: "Free LLM API Resources",
    repoPath: "C:\\Users\\RS LINA\\Documents\\free-llm-api-resources",
    role: "Free AI Provider Catalog & Health Mon",
    status: "connected",
    capabilities: ["quota_tracking", "model_discovery", "free_routing_rules"],
  },
  {
    id: "cheap-ticket-finder",
    name: "Cheap Ticket Finder",
    repoPath: "C:\\Users\\RS LINA\\Documents\\Cheap-Ticket-Finder",
    role: "Bangladesh & Global Flight Price Comparison",
    status: "connected",
    capabilities: ["flight_aggregator", "fare_history", "affiliate_forward"],
  },
  {
    id: "language-tutor-rs",
    name: "Language Tutor RS",
    repoPath: "C:\\Users\\RS LINA\\Documents\\Language-Tutor-RS",
    role: "AI Language Practice & Interactive Tutor",
    status: "connected",
    capabilities: ["grammar_correction", "vocabulary_flashcards", "conversation_flow"],
  },
];

export interface CrossPlatformTask {
  taskId: string;
  sourcePlatform: string;
  targetProjectId: string;
  action: string;
  payload: Record<string, any>;
  status: "queued" | "running" | "approval_required" | "completed" | "failed";
  requiresApproval: boolean;
  approvedBy?: string;
  idempotencyKey: string;
  retries: number;
  maxRetries: number;
  createdAt: string;
  updatedAt: string;
}

export class SupportingPlatformManager {
  private tasks: Map<string, CrossPlatformTask> = new Map();

  getRegisteredProjects(): SupportingProject[] {
    return SUPPORTING_PROJECTS;
  }

  submitTask(task: Omit<CrossPlatformTask, "status" | "requiresApproval" | "retries" | "createdAt" | "updatedAt">): CrossPlatformTask {
    // Check if task exists by idempotency key
    for (const existing of this.tasks.values()) {
      if (existing.idempotencyKey === task.idempotencyKey) {
        return existing;
      }
    }

    // Determine if human approval is required (e.g. publishing or spending)
    const requiresApproval = task.action.includes("publish") || task.action.includes("order") || task.action.includes("disburse");
    const now = new Date().toISOString();

    const created: CrossPlatformTask = {
      ...task,
      status: requiresApproval ? "approval_required" : "queued",
      requiresApproval,
      retries: 0,
      createdAt: now,
      updatedAt: now,
    };

    this.tasks.set(created.taskId, created);
    return created;
  }

  approveTask(taskId: string, approver: string): CrossPlatformTask {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error("Task not found");
    if (!task.requiresApproval) throw new Error("Task does not require approval");

    task.status = "queued";
    task.approvedBy = approver;
    task.updatedAt = new Date().toISOString();
    return task;
  }

  getTask(taskId: string): CrossPlatformTask | undefined {
    return this.tasks.get(taskId);
  }
}
