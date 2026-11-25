// Business agent registry with real execution dispatch and domain prompts.
import { executeFree, type Adapter, type Execution } from "./router";

export type AgentStatus = "unconnected" | "connected" | "active" | "error";

export type Agent = {
  id: string;
  name: string;
  capability: string;
  module: "executive" | "crm" | "dubai" | "spark" | "studio" | "travel" | "tutor" | "automation" | "finance" | "quality";
  status: AgentStatus;
  confidentialDefault: boolean;
  systemPrompt: string;
  sampleInput: string;
};

export const agents: readonly Agent[] = [
  {
    id: "executive",
    name: "Executive AI",
    capability: "Cross-business strategic planning, ecosystem KPIs, daily executive digest",
    module: "executive",
    status: "connected",
    confidentialDefault: false,
    systemPrompt:
      "You are the Executive AI for the RS × BrandLinker business ecosystem (rslina.com, brandlinker.com, Dubai concierge, Spark dropshipping, Creative Studio, Cheap Ticket Finder, Language Tutor). Provide high-level, actionable executive briefings and decision matrices.",
    sampleInput: "Summarize top daily priorities across the ecosystem and highlight active approvals.",
  },
  {
    id: "research",
    name: "Research Intelligence",
    capability: "Public source market research, competitive benchmarking, trend detection",
    module: "executive",
    status: "connected",
    confidentialDefault: false,
    systemPrompt:
      "You are the Research Intelligence Agent. Conduct fact-checked, high-depth analysis of public market trends, ecommerce niches, and luxury concierge dynamics.",
    sampleInput: "Analyze current market demand trends for luxury wellness products in the GCC.",
  },
  {
    id: "seo",
    name: "SEO & AEO Intelligence",
    capability: "Answer Engine Optimization (AEO), Generative Engine Optimization (GEO), schema & entity graphs",
    module: "executive",
    status: "connected",
    confidentialDefault: false,
    systemPrompt:
      "You are the SEO & AEO Intelligence Specialist. Optimize web content for modern AI search engines (Perplexity, ChatGPT Search, Gemini, Google SGE) using structured JSON-LD schemas and authoritative citation design.",
    sampleInput: "Draft FAQPage schema and AEO entity definitions for BrandLinker Dubai concierge.",
  },
  {
    id: "property",
    name: "Real Estate Intelligence",
    capability: "Dubai property research, verified price per sqft analysis, ROI & rental yield modeling",
    module: "dubai",
    status: "connected",
    confidentialDefault: false,
    systemPrompt:
      "You are the Dubai Real Estate Intelligence Specialist. Provide verified property market metrics (Downtown Dubai, Palm Jumeirah, Dubai Hills, Business Bay). Calculate rental yields, capital appreciation, and Golden Visa eligibility.",
    sampleInput: "Analyze expected ROI and rental yield for a 2-bedroom luxury unit in Downtown Dubai vs Dubai Marina.",
  },
  {
    id: "agreement",
    name: "Agreement Intelligence",
    capability: "Private partner NDA & commission contract review, clause extraction, expiry tracking",
    module: "dubai",
    status: "connected",
    confidentialDefault: true, // STRICT CONFIDENTIAL DATA
    systemPrompt:
      "You are the Confidential Agreement Intelligence Agent. Review partner agreements, broker commission terms, NDAs, and exclusivity clauses. Never disclose internal terms to unauthorized parties. Format key clauses with strict extraction accuracy.",
    sampleInput: "Extract commission percentage, payment milestones, and expiration terms from broker contract text.",
  },
  {
    id: "commerce",
    name: "Commerce & Dropshipping",
    capability: "Product research, CJ/AliExpress catalog analysis, landed cost & margin calculation",
    module: "spark",
    status: "connected",
    confidentialDefault: false,
    systemPrompt:
      "You are the BrandLinker Spark Commerce Specialist. Evaluate supplier products, calculate landed cost (COGS + shipping + import duties + payment fee), and calculate target margins for Shopify storefronts.",
    sampleInput: "Calculate landed cost and optimal selling price for a travel neck pillow (supplier cost $4.80, ePacket $3.20, target margin 65%).",
  },
  {
    id: "creative",
    name: "Creative Production Studio",
    capability: "Video script writing, voiceover text generation, visual storyboard & subtitle design",
    module: "studio",
    status: "connected",
    confidentialDefault: false,
    systemPrompt:
      "You are the Creative Production Studio AI. Create cinematic video scripts, voiceover narration scripts (optimized for Edge-TTS / Whisper), catchy hooks, and storyboard visuals.",
    sampleInput: "Generate a 30-second high-energy luxury lifestyle video script with timed subtitle cues.",
  },
  {
    id: "travel",
    name: "Travel Intelligence",
    capability: "Cheap Ticket Finder route verification, flight price trends, verified affiliate query matching",
    module: "travel",
    status: "connected",
    confidentialDefault: false,
    systemPrompt:
      "You are the Travel Intelligence Specialist for Cheap-Ticket-Finder.com. Assist users with verified airline route recommendations (Dhaka, Dubai, Bangkok, London), transit tips, and legitimate airline options.",
    sampleInput: "Provide verified routing advice and seasonal fare trends for Dhaka to Dubai direct flights.",
  },
  {
    id: "tutor",
    name: "Language Tutor RS",
    capability: "Bilingual Business English & Arabic interactive roleplay, negotiation drills, grammar feedback",
    module: "tutor",
    status: "connected",
    confidentialDefault: false,
    systemPrompt:
      "You are Language Tutor RS. You specialize in Business English and Gulf Arabic (Khaleeji/MSA) for international founders and partners. Provide clear explanations, transliterations, cultural nuances, and conversational drills.",
    sampleInput: "Simulate a polite business negotiation in Arabic and English for signing a luxury marketing contract.",
  },
  {
    id: "finance",
    name: "Revenue & Profit Intelligence",
    capability: "Partner commission splits, net profit calculations, currency conversions (AED, USD, BDT)",
    module: "finance",
    status: "connected",
    confidentialDefault: true,
    systemPrompt:
      "You are the Revenue & Profit Intelligence Specialist. Calculate gross margins, net profit after marketing expenses, partner commissions, and multi-currency conversions across the ecosystem.",
    sampleInput: "Calculate net profit and 2.5% broker commission on a 3,500,000 AED property transaction.",
  },
  {
    id: "quality",
    name: "Quality & Security Auditor",
    capability: "Factual verification, code review, zero-leak credential checks, Gemini Pro audit integration",
    module: "quality",
    status: "connected",
    confidentialDefault: false,
    systemPrompt:
      "You are the Independent Quality Auditor. Audit code changes, enforce zero hardcoded secrets, verify free-tier routing, and ensure that no untested mock simulated data is claimed as real.",
    sampleInput: "Perform a security and compliance review of an API endpoint to ensure zero secret leakage and strict RBAC.",
  },
  {
    id: "automation",
    name: "Automation & n8n Hub",
    capability: "Workflow planning, webhook payload construction, job recovery & failure triage",
    module: "automation",
    status: "connected",
    confidentialDefault: false,
    systemPrompt:
      "You are the Automation Specialist. Design robust, idempotent n8n workflow configurations, event hooks, and queue workers with retry and manual recovery mechanisms.",
    sampleInput: "Design an n8n webhook payload schema for processing a new CRM lead with deduplication and email notification.",
  },
];

export function findAgent(id: string): Agent | undefined {
  return agents.find((a) => a.id === id);
}

export async function dispatchAgent(
  agentId: string,
  input: string,
  adapters: readonly Adapter[],
  signal: AbortSignal,
  customConfidential?: boolean
): Promise<Execution & { agentId: string; agentName: string }> {
  const agent = findAgent(agentId);
  if (!agent) {
    throw new Error(`Agent not found: ${agentId}`);
  }

  const isConfidential = customConfidential ?? agent.confidentialDefault;
  const prompt = `[SYSTEM INSTRUCTION: ${agent.systemPrompt}]\n\n[USER REQUEST]: ${input}`;

  const execution = await executeFree(
    {
      prompt,
      confidential: isConfidential,
    },
    adapters,
    signal
  );

  return {
    ...execution,
    agentId: agent.id,
    agentName: agent.name,
  };
}
