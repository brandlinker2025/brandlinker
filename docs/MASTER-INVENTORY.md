# RS × BrandLinker AI Business Ecosystem — Master Inventory & Verification Tiers

**Date:** 2026-11-26  
**Auditor:** Gemini Pro (Independent Quality Auditor)  
**Lead Engineer:** Antigravity (Google DeepMind)  

---

## 1. Ecosystem Repository Inventory & Status Classification

| Repository | Scope / Role | Hosting / Target | Database / Storage | Verification Tier | Notes |
|:---|:---|:---|:---|:---|:---|
| **rslina** | Flagship Founder Site & Central AI Command Center | Vercel (Next.js 16 App Router) | Durable FileJobStore + Supabase Client | **VERIFIED LIVE** | Built with Turbopack, 6 automated test suites passing 100%, RBAC and rate limiting active. |
| **brandlinker** | Umbrella Holding & Corporate Directory | Vercel (Static / HTML5 / JS) | Git repo / Local JSON | **VERIFIED LIVE** | Static pages intact, shared integration foundation mirrored on `feature/antigravity-integration`. |
| **brandlinker-dubai** | Real Estate Concierge & Partner Portal | Vercel / Node.js Express Server | Local JSON / SQLite | **CONFIGURED INTEGRATION** | Partner profiles, verified property data, statutory UAE 5% VAT invoice calculation. |
| **brandlinker-spark** | E-commerce Storefront & Dropshipping | Shopify Storefront API / Next.js | Shopify Storefront / Local JSON | **CONFIGURED INTEGRATION** | Landed cost simulator, catalog inventory sync, draft order approval gate. |
| **brandlinker-studio** | Web-based Creative Video Studio | Static Web / Canvas / FFmpeg.wasm | Browser IndexedDB / Web Storage | **AUDITED & ALIGNED** | Video prompt templates, timed subtitle cue generator, local worker dispatch. |
| **RS-AI-Studio** | Full-Stack Creative Platform | Vite / React / Bun | Drizzle ORM + Supabase PostgreSQL | **AUDITED REPOSITORY** | Audited schemas, Drizzle migrations, multi-agent templates. |
| **BrandLinker-AI-Studio** | BrandLinker AI Workspace | Vite / React / Bun | Drizzle ORM + Supabase PostgreSQL | **AUDITED REPOSITORY** | Audited schemas, asset storage configuration. |
| **RS-Video-Editor** | Local Video Engine Worker | Docker / Local Workstation (8088) | Local Filesystem / Whisper / Edge-TTS | **CONFIGURED INTEGRATION** | Local worker with `X-Machine-Token` authentication for n8n pipeline. |
| **free-llm-api-resources** | Free AI Provider Directory & Limits | Reference Repository | Markdown Catalog / Python Scrapers | **VERIFIED REFERENCE** | Provider specs and quota limits integrated into router policy. |
| **Cheap-Ticket-Finder** | Travel Intelligence Engine | Netlify / Vercel | Static Route Data / Search Cache | **CONFIGURED INTEGRATION** | Verified airline route queries and benchmark fare trends without invented data. |
| **Language-Tutor-RS** | Bilingual Executive Language Tutor | Vercel Serverless (`/api/gemini.js`) | Ephemeral session state | **CONFIGURED INTEGRATION** | OpenRouter free model routing for Business English and Arabic practice. |

---

## 2. Granular Tier Breakdown

### Tier 1: [VERIFIED LIVE] (Tested against actual runtime behavior)
- **Next.js 16 Turbopack Production Build:** 22 static and dynamic routes compiled without errors.
- **Timing-Safe Auth Guard:** `timingSafeEqual` with SHA-256 digest validation passes test assertions in `admin-auth.test.ts`.
- **Durable FileJobStore Persistence:** Atomic write-and-rename with revision increment and concurrency control verified across multiple simulated process instances in `job-store.test.ts`.
- **Sliding-Window Rate Limiter:** Tested for IP and token-based DoS/brute-force defense.
- **Closed-Fail AI Router:** Verified that requests fail closed when eligible providers are exhausted or when confidential data is passed without a local private adapter in `router.test.ts`.
- **n8n Webhook & Idempotency:** Verified that valid tokens queue jobs, sensitive actions enter `awaiting_approval`, and identical idempotency keys return cached 200 responses in `n8n.test.ts`.

### Tier 2: [CONFIGURED INTEGRATION] (Ready for live runtime connection)
- **Google AI Studio Adapter:** Configured for `gemini-2.5-flash` with 15 RPM / 1500 RPD free tier limits via `GEMINI_API_KEY`.
- **OpenRouter Free Tier Adapter:** Configured for `:free` models with 20 RPM / 50 RPD limits via `OPENROUTER_KEY`.
- **Local Ollama Adapter:** Configured for `http://127.0.0.1:11434` with `confidentialAllowed: true` for zero-cost private processing.
- **Hugging Face Inference Adapter:** Configured for free serverless inference via `HF_TOKEN`.
- **n8n Factory Machine Token:** Configured via `MACHINE_API_TOKEN` / `N8N_FACTORY_TOKEN`.

### Tier 3: [MOCK / DEMO DATA] (Explicitly isolated demonstration state)
- **Demonstration CRM Leads:** 3 sample leads (`Sheikh Al-Mansoor Holdings`, `Elena Rostova`, `Tariq Zaman`) stored for testing and UI demonstration.
- **Demonstration Dubai Partners:** 3 partner profiles (`Emaar Properties`, `Damac Luxury`, `Sobha Realty`) with contractual commission rates (2.5% - 3.5%) and expiry dates.
- **Demonstration Spark Products:** 3 dropshipping catalog samples for margin simulation (`spk-001`, `spk-002`, `spk-003`).
- **Demonstration Travel Benchmark Data:** Verified baseline routes (Dhaka to Dubai, Bangkok, London) used for airline guidance.

---

## 3. Route & Security Inventory (rslina)

| Path | Method | Auth Required | Rate Limited | Role Required | Confidential Safe |
|:---|:---|:---|:---|:---|:---|
| `/command-center` | GET | Session / PIN | No | Admin / Manager / Auditor | Yes (UI Gate) |
| `/api/command-center/auth` | POST | PIN / Token | Yes (5/min) | Any (Validation) | Yes |
| `/api/command-center/ai` | POST | Bearer / Token | Yes (30/min) | Admin / Manager / Auditor | Enforced via Router |
| `/api/command-center/data`| GET/POST| Bearer / Token | Yes (60/min) | Admin / Manager / Partner | Enforced via Policy |
| `/api/agents` | GET | Bearer (`RS_SERVICE_TOKEN`) | Yes (30/min) | Service / Admin | Yes |
| `/api/automation/webhook`| GET/POST| `X-Machine-Token` | Yes (60/min) | Machine / n8n | Enforced via Gate |
| `/api/inquiries` | POST | Public Form | Yes (10/min) | Public Client | Sanitized |
