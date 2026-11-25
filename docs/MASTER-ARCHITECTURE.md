# RS × BrandLinker AI Business Ecosystem — Master Architecture Specification

**Version:** 1.0.0  
**Security Classification:** Strict Enterprise Confidential / Zero-Cost Free-Tier Enforced  
**Lead Implementation Engineer:** Antigravity (Google DeepMind)  
**Master Architect:** ChatGPT  
**Quality Auditor:** Gemini Pro  

---

## 1. System Overview & Component Topology

```
+---------------------------------------------------------------------------------------+
|                                RS × BrandLinker Ecosystem                             |
+---------------------------------------------------------------------------------------+
|                                                                                       |
|   +-----------------------+     +------------------------+     +------------------+   |
|   |   rslina.com          |     |   brandlinker.com      |     |   Dubai Concierge|   |
|   |   (Founder & Hub)     |     |   (Umbrella Holding)   |     |   (Real Estate)  |   |
|   +-----------+-----------+     +-----------+------------+     +--------+---------+   |
|               |                             |                           |             |
|   +-----------+-----------+     +-----------+------------+     +--------+---------+   |
|   |   Spark Dropshipping  |     |   Creative Studio      |     |   Cheap Tickets  |   |
|   |   (E-commerce Store)  |     |   (Video Production)   |     |   & Language RS  |   |
|   +-----------+-----------+     +-----------+------------+     +--------+---------+   |
|               |                             |                           |             |
+---------------+-----------------------------+---------------------------+-------------+
                                              |
                                              v
+---------------------------------------------------------------------------------------+
|                    Central AI Command Center & Security Gateway                       |
|                          (src/app/command-center & /api/*)                            |
+---------------------------------------------------------------------------------------+
|  - Multi-Role RBAC: Admin (RS Lina), Manager, Partner, Auditor                        |
|  - Timing-Safe Auth: timingSafeEqual + SHA-256 Bearer Token Verification              |
|  - Sliding-Window Rate Limiter: Per-IP & Per-Token DoS & Brute-Force Protection       |
|  - Action Approval Gate: Gating financial, publishing, or contract write operations  |
+---------------------------------------------------------------------------------------+
                                              |
                                              v
+---------------------------------------------------------------------------------------+
|                  Free-Only AI Provider Router (Closed-Fail Policy)                    |
|                        (integration-foundation/router.ts)                             |
+---------------------------------------------------------------------------------------+
|                                                                                       |
|   +------------------------------------+    +-------------------------------------+   |
|   | Public Cloud Free Providers        |    | Private Local Compute Provider      |   |
|   | (Confidential Data STRICTLY BLOCKED|    | (Confidential Data STRICTLY ALLOWED)|   |
|   +------------------------------------+    +-------------------------------------+   |
|   | - Google AI Studio (Gemini 2.5)    |    | - Local Ollama (qwen2.5:3b)         |   |
|   | - OpenRouter Free (:free models)   |    | - Zero network transmission         |   |
|   | - Hugging Face Free Serverless     |    | - Trade secrets & PII safe          |   |
|   +------------------------------------+    +-------------------------------------+   |
|                                                                                       |
+---------------------------------------------------------------------------------------+
                                              |
                                              v
+---------------------------------------------------------------------------------------+
|                     Durable Job Engine & Storage Architecture                         |
|                 (integration-foundation/job-store.ts & file-job-store.ts)             |
+---------------------------------------------------------------------------------------+
|  - States: queued -> running -> awaiting_approval -> succeeded / failed / cancelled   |
|  - Concurrency: Atomic compareAndSet optimistic locking with revision counter         |
|  - Idempotency: Unique X-Idempotency-Key indexing to prevent duplicate execution     |
|  - Persistence: Atomic write-and-rename filesystem durability across server restarts  |
+---------------------------------------------------------------------------------------+
```

---

## 2. Security & Policy Principles

1. **Closed-Fail Policy:** If no free-tier provider is available or quotas are exhausted, requests fail with `{ status: "unavailable", attempted: [...] }`. No credit card, billable endpoint, or paid fallback will ever be called.
2. **Confidentiality Fence:** Public free providers (Google AI Studio, OpenRouter, Hugging Face) have `confidentialAllowed: false`. Any prompt containing private partner contracts, NDAs, or customer PII is automatically routed exclusively to local compute (`ollama-local`). If local compute is unavailable, the request fails closed immediately.
3. **Approval Gates for External Operations:** Any mutating operation (`publish`, `purchase`, `contract_sign`, `supplier_payment`, `bulk_email`) transitions to `awaiting_approval` and cannot execute until approved by an authenticated Admin.
4. **Verified Partner Terms:** Financial calculations must never assume arbitrary margins or company splits. Dubai property commissions use executed Channel Partner Agreement terms + statutory 5% UAE VAT. Spark commerce calculations use verified COGS, shipping, and import duties.
