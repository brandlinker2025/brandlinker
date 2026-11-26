# RS × BrandLinker AI Business Ecosystem — Master Dependencies

**Updated:** 2026-11-26T08:30:00+06:00  
**Status:** Verified Operational & Synchronized  

---

## 1. Primary Platform Topology

1. **RSLina.com** (`brandlinker2025/rslina`):
   - Role: Personal Public Portfolio + Private AI Command Center (`/command-center`).
   - Upstream: Central Supabase Database (`enahlkxdplntriipabiu`).
   - Downstream: Dispatches ecosystem-wide agent tasks to BrandLinkerBD, Spark, and Studio.

2. **BrandLinkerBD.com** (`brandlinker2025/brandlinker`):
   - Role: Enterprise HQ, Central Business Management, CRM, & Multi-Brand Approvals.
   - Upstream: Central Supabase Database (`bl_jobs`, `bl_leads`, `bl_platforms`, `bl_audit`).
   - Downstream: Coordinates supplier workflows, employee permissions, and cross-brand marketing.

3. **BrandLinkerSpark.com** (`brandlinker2025/brandlinker-spark`):
   - Role: Dropshipping & Commerce Engine.
   - Upstream: CJdropshipping & AliExpress catalog connectors, Amazon affiliate APIs.
   - Downstream: Dispatches product ad creative generation to BrandLinker Studio.

4. **BrandLinker Studio** (`brandlinker2025/brandlinker-studio`):
   - Role: Video production, Remotion render engine, and creative workspace (Owned by Claude).

5. **BrandLinker Dubai** (`brandlinker2025/brandlinker-dubai`):
   - Role: Luxury property concierge & verified brokerage partnerships (Coordinated with ChatGPT).

---

## 2. Supporting Repository Matrix

| Repository | Role | Integration Type | Approval Gate |
| :--- | :--- | :--- | :--- |
| **RS-AI-Studio** | AI Prompting & Media Studio | Direct API / Workspace | Not Required |
| **BrandLinker-AI-Studio** | Brand Assets & Visual Exports | Asset Generation Pipeline | Human Signature for Publishing |
| **RS-Video-Editor** | Remotion Timeline & Subtitling | Video Composition Engine | Required for Render Export |
| **free-llm-api-resources** | Free-Tier AI Model Health | Policy & Rate Limit Tracker | Free Only (Zero Cost) |
| **Cheap-Ticket-Finder** | Bangladesh & Global Flights | Meta-Search & Deep Linking | Not Required |
| **Language-Tutor-RS** | Voice & Language Tutoring | Interactive AI Companion | Not Required |
