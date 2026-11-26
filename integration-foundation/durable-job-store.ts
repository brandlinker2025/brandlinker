import type { Job, JobStore } from "./job-store";
import { FileJobStore } from "./file-job-store";

export interface DatabaseAdapter {
  query<T = any>(sql: string, params?: any[]): Promise<T[]>;
  execute(sql: string, params?: any[]): Promise<{ rowsAffected: number }>;
}

export class ProductionSqlJobStore implements JobStore {
  private db: DatabaseAdapter;
  private tableName: string;

  constructor(db: DatabaseAdapter, tableName = "ecosystem_jobs") {
    this.db = db;
    this.tableName = tableName;
  }

  async initSchema(): Promise<void> {
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS ${this.tableName} (
        id TEXT PRIMARY KEY,
        agent_id TEXT NOT NULL,
        state TEXT NOT NULL,
        revision INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        idempotency_key TEXT UNIQUE NOT NULL
      )
    `);
    await this.db.execute(`
      CREATE INDEX IF NOT EXISTS idx_jobs_idempotency ON ${this.tableName} (idempotency_key)
    `);
  }

  async createOrGet(job: Job): Promise<Job> {
    // Check idempotency first
    const existing = await this.db.query<any>(
      `SELECT * FROM ${this.tableName} WHERE idempotency_key = ? OR id = ? LIMIT 1`,
      [job.idempotencyKey, job.id]
    );

    if (existing.length > 0) {
      const row = existing[0];
      return {
        id: row.id,
        agentId: row.agent_id,
        state: row.state,
        revision: row.revision,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        idempotencyKey: row.idempotency_key,
      };
    }

    // Atomic insert
    await this.db.execute(
      `INSERT INTO ${this.tableName} (id, agent_id, state, revision, created_at, updated_at, idempotency_key)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [job.id, job.agentId, job.state, job.revision, job.createdAt, job.updatedAt, job.idempotencyKey]
    );

    return job;
  }

  async get(id: string): Promise<Job | null> {
    const rows = await this.db.query<any>(
      `SELECT * FROM ${this.tableName} WHERE id = ? LIMIT 1`,
      [id]
    );
    if (rows.length === 0) return null;
    const row = rows[0];
    return {
      id: row.id,
      agentId: row.agent_id,
      state: row.state,
      revision: row.revision,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      idempotencyKey: row.idempotency_key,
    };
  }

  async compareAndSet(id: string, expectedRevision: number, next: Job): Promise<boolean> {
    const res = await this.db.execute(
      `UPDATE ${this.tableName}
       SET state = ?, revision = ?, updated_at = ?
       WHERE id = ? AND revision = ?`,
      [next.state, next.revision, next.updatedAt, id, expectedRevision]
    );
    return res.rowsAffected > 0;
  }
}

// In-memory SQLite-compatible simulator for testing SQL concurrency
export class MemorySqlDatabase implements DatabaseAdapter {
  private rows: Map<string, any> = new Map();
  private idempotencyMap: Map<string, string> = new Map();

  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    if (sql.includes("WHERE idempotency_key = ? OR id = ?")) {
      const [key, id] = params;
      const targetId = this.idempotencyMap.get(key) || id;
      const found = this.rows.get(targetId);
      return found ? [found as T] : [];
    }
    if (sql.includes("WHERE id = ?")) {
      const [id] = params;
      const found = this.rows.get(id);
      return found ? [found as T] : [];
    }
    return Array.from(this.rows.values()) as T[];
  }

  async execute(sql: string, params: any[] = []): Promise<{ rowsAffected: number }> {
    if (sql.includes("INSERT INTO")) {
      const [id, agent_id, state, revision, created_at, updated_at, idempotency_key] = params;
      if (this.idempotencyMap.has(idempotency_key) || this.rows.has(id)) {
        throw new Error("UNIQUE constraint failed: ecosystem_jobs.idempotency_key");
      }
      this.rows.set(id, { id, agent_id, state, revision, created_at, updated_at, idempotency_key });
      this.idempotencyMap.set(idempotency_key, id);
      return { rowsAffected: 1 };
    }

    if (sql.includes("UPDATE")) {
      const [state, revision, updated_at, id, expectedRevision] = params;
      const existing = this.rows.get(id);
      if (!existing || existing.revision !== expectedRevision) {
        return { rowsAffected: 0 };
      }
      this.rows.set(id, { ...existing, state, revision, updated_at });
      return { rowsAffected: 1 };
    }

    return { rowsAffected: 0 };
  }
}

// Factory function
export function createDurableJobStore(): JobStore {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "CRITICAL: Central durable database required in production. Silent FileJobStore fallback is strictly prohibited in production environments."
    );
  }
  // Local development durable store only
  return new FileJobStore();
}
