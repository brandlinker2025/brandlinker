import fs from "node:fs";
import path from "node:path";
import type { Job, JobStore } from "./job-store";

export class FileJobStore implements JobStore {
  private filePath: string;
  private jobs: Map<string, Job> = new Map();
  private idempotencyIndex: Map<string, string> = new Map(); // idempotencyKey -> jobId
  private loaded: boolean = false;

  constructor(filePath?: string) {
    this.filePath = filePath || path.join(process.cwd(), "data", "jobs-store.json");
    this.ensureLoaded();
  }

  private ensureLoaded(): void {
    if (this.loaded) return;
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, "utf8");
        const list: Job[] = JSON.parse(raw);
        for (const job of list) {
          this.jobs.set(job.id, job);
          if (job.idempotencyKey) {
            this.idempotencyIndex.set(job.idempotencyKey, job.id);
          }
        }
      }
    } catch {
      // If file doesn't exist or is empty, initialize fresh map
    }
    this.loaded = true;
  }

  private persistSync(): void {
    const list = Array.from(this.jobs.values());
    const tempPath = `${this.filePath}.${Date.now()}.tmp`;
    const data = JSON.stringify(list, null, 2);
    fs.writeFileSync(tempPath, data, "utf8");
    fs.renameSync(tempPath, this.filePath);
  }

  async createOrGet(job: Job): Promise<Job> {
    this.ensureLoaded();

    // Check idempotency key first
    if (job.idempotencyKey && this.idempotencyIndex.has(job.idempotencyKey)) {
      const existingId = this.idempotencyIndex.get(job.idempotencyKey)!;
      const existing = this.jobs.get(existingId);
      if (existing) return existing;
    }

    // Check existing by ID
    const existingById = this.jobs.get(job.id);
    if (existingById) return existingById;

    // Insert new
    this.jobs.set(job.id, job);
    if (job.idempotencyKey) {
      this.idempotencyIndex.set(job.idempotencyKey, job.id);
    }
    this.persistSync();
    return job;
  }

  async get(id: string): Promise<Job | null> {
    this.ensureLoaded();
    return this.jobs.get(id) || null;
  }

  async compareAndSet(id: string, expectedRevision: number, next: Job): Promise<boolean> {
    this.ensureLoaded();
    const current = this.jobs.get(id);
    if (!current) return false;

    if (current.revision !== expectedRevision) {
      return false;
    }

    this.jobs.set(id, next);
    this.persistSync();
    return true;
  }

  // Helper for tests to reload state from disk
  reloadFromDisk(): void {
    this.loaded = false;
    this.jobs.clear();
    this.idempotencyIndex.clear();
    this.ensureLoaded();
  }
}
