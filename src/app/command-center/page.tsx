"use client";

import React, { useState, useEffect } from "react";
import {
  Shield,
  Cpu,
  Activity,
  Layers,
  Users,
  Building2,
  ShoppingBag,
  Video,
  Plane,
  Languages,
  Workflow,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ArrowRight,
  RefreshCw,
  Send,
  Sparkles,
  Zap,
  TrendingUp,
  FileText,
  DollarSign,
  Clock,
  Check,
  X,
  Database,
  History,
} from "lucide-react";

type Agent = {
  id: string;
  name: string;
  capability: string;
  module: string;
  status: string;
  confidentialDefault: boolean;
  sampleInput: string;
};

type Provider = {
  id: string;
  name: string;
  free: boolean;
  enabled: boolean;
  healthy: boolean;
  remaining: number;
  confidentialAllowed: boolean;
  rateLimitRPM?: number;
  rateLimitRPD?: number;
  models?: string[];
  stats: {
    successCount: number;
    failureCount: number;
    totalLatencyMs: number;
    lastLatencyMs: number;
  };
};

type Platform = {
  id: string;
  domain: string;
};

type Partner = {
  id: string;
  name: string;
  createdAt: string;
};

type Agreement = {
  id: string;
  partnerId: string;
  evidenceSha256: string;
  evidencePath: string;
  commissionBps: number;
  validFrom: string;
  validUntil: string;
  status: "draft" | "approved" | "revoked";
  approvedBy: string | null;
};

type Lead = {
  id: string;
  platformId: string;
  name: string;
  contact: string;
  consentAt: string | null;
  stage: string;
  createdAt: string;
  budgetAED?: number;
};

type Job = {
  id: string;
  platformId: string;
  agentId: string;
  state: string;
  revision: number;
  idempotencyKey: string;
  createdAt: string;
};

type AuditEntry = {
  id: string;
  actorId: string;
  action: string;
  entityId: string;
  createdAt: string;
  details?: string;
};

type Approval = {
  id: string;
  jobId: string;
  title: string;
  actionType: string;
  requestedBy: string;
  riskLevel: string;
  details: string;
  status: string;
  createdAt: string;
};

export default function CommandCenterPage() {
  const [pin, setPin] = useState("");
  const [authError, setAuthError] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState("partner");
  const [actorName, setActorName] = useState("");
  const [activeTab, setActiveTab] = useState<
    "overview" | "agents" | "providers" | "crm" | "dubai" | "spark" | "studio" | "travel" | "tutor" | "automation" | "audit" | "approvals"
  >("overview");

  // Ecosystem state loaded from actual backend
  const [metrics, setMetrics] = useState<any>(null);
  const [agentsList, setAgentsList] = useState<Agent[]>([]);
  const [providersList, setProvidersList] = useState<Provider[]>([]);
  const [platformsList, setPlatformsList] = useState<Platform[]>([]);
  const [partnersList, setPartnersList] = useState<Partner[]>([]);
  const [agreementsList, setAgreementsList] = useState<Agreement[]>([]);
  const [leadsList, setLeadsList] = useState<Lead[]>([]);
  const [jobsList, setJobsList] = useState<Job[]>([]);
  const [auditList, setAuditList] = useState<AuditEntry[]>([]);
  const [approvalsList, setApprovalsList] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(false);

  // Agent execution console
  const [selectedAgentId, setSelectedAgentId] = useState<string>("executive");
  const [agentPrompt, setAgentPrompt] = useState<string>("");
  const [isConfidential, setIsConfidential] = useState<boolean>(false);
  const [dispatchLoading, setDispatchLoading] = useState(false);
  const [agentOutput, setAgentOutput] = useState<any>(null);

  // Drop shipping & Commerce
  const [calcCost, setCalcCost] = useState(12);
  const [calcShipping, setCalcShipping] = useState(4);
  const [calcMargin, setCalcMargin] = useState(65);
  const [calcResult, setCalcResult] = useState<any>(null);

  // Dubai Real estate Commission
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>("");
  const [propValue, setPropValue] = useState(3500000);
  const [isVatRegistered, setIsVatRegistered] = useState(false);
  const [supplierTrn, setSupplierTrn] = useState("");
  const [propResult, setPropResult] = useState<any>(null);
  const [commError, setCommError] = useState("");

  useEffect(() => {
    checkSession();
  }, []);

  async function checkSession() {
    try {
      const res = await fetch("/api/command-center/auth");
      const data = await res.json();
      if (data.authenticated) {
        setIsAuthenticated(true);
        setUserRole(data.role);
        setActorName(data.actor);
        fetchEcosystemData();
      }
    } catch {
      // Not authenticated
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthError("");
    try {
      const res = await fetch("/api/command-center/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      if (data.authenticated) {
        setIsAuthenticated(true);
        setUserRole(data.role);
        setActorName(data.actor);
        fetchEcosystemData();
      } else {
        setAuthError(data.error || "Access Denied. Invalid PIN or Key.");
      }
    } catch (err: any) {
      setAuthError(err.message || "Login failed");
    }
  }

  async function fetchEcosystemData() {
    setLoading(true);
    try {
      const [aiRes, dataRes] = await Promise.all([
        fetch("/api/command-center/ai"),
        fetch("/api/command-center/data"),
      ]);

      if (aiRes.ok) {
        const aiData = await aiRes.json();
        setAgentsList(aiData.agents || []);
        setProvidersList(aiData.providers || []);
      }

      if (dataRes.ok) {
        const d = await dataRes.json();
        setMetrics(d.metrics);
        setPlatformsList(d.platforms || []);
        setPartnersList(d.partners || []);
        setAgreementsList(d.agreements || []);
        setLeadsList(d.leads || []);
        setJobsList(d.jobs || []);
        setApprovalsList(d.approvals || []);
        setAuditList(d.audit || []);
      }
    } catch (err) {
      console.error("Failed to load ecosystem data", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDispatchAgent() {
    if (!agentPrompt.trim()) return;
    setDispatchLoading(true);
    setAgentOutput(null);

    try {
      const res = await fetch("/api/command-center/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: selectedAgentId,
          prompt: agentPrompt,
          confidential: isConfidential,
        }),
      });

      const data = await res.json();
      setAgentOutput(data);
      fetchEcosystemData();
    } catch (err: any) {
      setAgentOutput({ status: "error", error: err.message });
    } finally {
      setDispatchLoading(false);
    }
  }

  async function handleApproval(approvalId: string, decision: "approved" | "rejected") {
    try {
      const res = await fetch("/api/command-center/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approve_actions",
          payload: { approvalId, decision },
        }),
      });
      if (res.ok) {
        fetchEcosystemData();
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleCalculateCommission() {
    setCommError("");
    setPropResult(null);
    try {
      const res = await fetch("/api/command-center/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "calculate",
          payload: {
            type: "commission",
            partnerId: selectedPartnerId,
            propertyValueAED: Number(propValue),
            isVatRegistered,
            supplierTrn: isVatRegistered ? supplierTrn : undefined,
            asOfDate: "2026-06-01",
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCommError(data.error || "Commission calculation rejected.");
      } else {
        setPropResult(data);
        fetchEcosystemData();
      }
    } catch (err: any) {
      setCommError(err.message || "Failed to calculate commission");
    }
  }

  async function handleCalculateLandedCost() {
    try {
      const res = await fetch("/api/command-center/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "calculate",
          payload: {
            type: "landed_cost",
            costUSD: Number(calcCost),
            shippingUSD: Number(calcShipping),
            targetMargin: Number(calcMargin) / 100,
          },
        }),
      });
      const data = await res.json();
      setCalcResult(data);
    } catch (err) {
      console.error(err);
    }
  }

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="w-full max-w-md bg-slate-900/80 border border-slate-800 rounded-2xl p-8 backdrop-blur-xl shadow-2xl relative z-10">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="p-3 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-xl shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">RS × BrandLinker</h1>
              <p className="text-xs text-slate-400">AI Command Center & Business Control</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Executive Access PIN / Token
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Enter Executive Master PIN / Access Token"
                  className="w-full px-4 py-3 bg-slate-950/70 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-mono"
                  autoFocus
                />
                <Lock className="w-5 h-5 text-slate-500 absolute right-3 top-3.5" />
              </div>
            </div>

            {authError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium rounded-xl shadow-lg shadow-cyan-500/20 flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              <span>Unlock Command Center</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-800/80 text-center">
            <p className="text-xs text-slate-500 mb-1">Supported Roles: Executive Admin · Operations Manager · Independent Auditor</p>
            <p className="text-[11px] text-slate-600">Bearer token authentication with constant-time SHA-256 verification</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-lg shadow-md">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold tracking-tight text-white">RS AI Command Center</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-medium">
                Supabase: enahlkxdplntriipabiu
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              RS × BrandLinker Unified Business Ecosystem (Next.js 16.4.6)
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-semibold text-white">{actorName}</div>
            <div className="text-[10px] uppercase font-mono text-cyan-400">Role: {userRole}</div>
          </div>
          <button
            onClick={() => fetchEcosystemData()}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-lg border border-slate-700/50 transition cursor-pointer"
            title="Refresh Status"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => {
              setIsAuthenticated(false);
              document.cookie = "rs_admin_token=; Max-Age=0; path=/";
            }}
            className="text-xs text-slate-400 hover:text-rose-400 px-3 py-1.5 rounded-lg border border-slate-800 hover:border-rose-500/30 transition cursor-pointer"
          >
            Lock
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto space-x-1 pb-2 border-b border-slate-800/80 scrollbar-none text-xs font-medium">
          {[
            { id: "overview", label: "Executive Overview", icon: Activity },
            { id: "agents", label: "AI Agent Hub", icon: Sparkles },
            { id: "providers", label: "Free Provider Health", icon: Zap },
            { id: "crm", label: `CRM Leads (${leadsList.length})`, icon: Users },
            { id: "dubai", label: "Dubai & Agreements", icon: Building2 },
            { id: "spark", label: "Spark Commerce", icon: ShoppingBag },
            { id: "studio", label: "Creative Studio", icon: Video },
            { id: "travel", label: "Travel Intel", icon: Plane },
            { id: "tutor", label: "Language Tutor", icon: Languages },
            { id: "automation", label: "n8n Automation", icon: Workflow },
            { id: "audit", label: `Audit Log (${auditList.length})`, icon: History },
            {
              id: "approvals",
              label: `Approvals (${metrics?.pendingApprovalsCount || 0})`,
              icon: AlertTriangle,
              highlight: metrics?.pendingApprovalsCount > 0,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-xl whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent"
                } ${tab.highlight ? "text-amber-400 font-bold" : ""}`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: EXECUTIVE OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: "Core Platforms", val: `${platformsList.length} Domains`, sub: "bl_platforms active", icon: Layers },
                { label: "Business Agents", val: `${agentsList.length} Connected`, sub: "Multi-domain dispatch", icon: Sparkles },
                { label: "Free AI Providers", val: `${providersList.length} Online`, sub: "$0 Spend policy", icon: Zap },
                { label: "bl_leads", val: `${leadsList.length} Inquiries`, sub: "Qualified Pipeline", icon: Users },
                { label: "bl_agreements", val: `${agreementsList.filter((a) => a.status === "approved").length} Approved`, sub: "Signed evidence verified", icon: Building2 },
                {
                  label: "Pending Approvals",
                  val: metrics?.pendingApprovalsCount || 0,
                  sub: "Human Sign-off Gate",
                  icon: AlertTriangle,
                  alert: metrics?.pendingApprovalsCount > 0,
                },
              ].map((card, i) => {
                const Icon = card.icon;
                return (
                  <div
                    key={i}
                    className={`bg-slate-900/60 border rounded-2xl p-4 backdrop-blur-sm ${
                      card.alert ? "border-amber-500/40 bg-amber-500/5" : "border-slate-800"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-slate-400">{card.label}</span>
                      <Icon className={`w-4 h-4 ${card.alert ? "text-amber-400" : "text-cyan-400"}`} />
                    </div>
                    <div className="text-xl font-bold text-white tracking-tight">{card.val}</div>
                    <div className="text-[11px] text-slate-500 mt-1">{card.sub}</div>
                  </div>
                );
              })}
            </div>

            {/* Central Database Integration Status */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Database className="w-5 h-5 text-cyan-400" />
                  <h2 className="text-base font-bold text-white">Central Ecosystem Database (Supabase)</h2>
                </div>
                <span className="text-xs px-2.5 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded-full font-mono">
                  Project: enahlkxdplntriipabiu
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Connected to central tables: <code className="text-slate-200">bl_platforms</code>, <code className="text-slate-200">bl_jobs</code>, <code className="text-slate-200">bl_partners</code>, <code className="text-slate-200">bl_agreements</code>, <code className="text-slate-200">bl_leads</code>, and <code className="text-slate-200">bl_audit</code>.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 text-xs">
                {platformsList.map((p) => (
                  <div key={p.id} className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-xl">
                    <div className="text-white font-medium">{p.id}</div>
                    <div className="text-[11px] text-cyan-400 font-mono mt-0.5">{p.domain}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: AGENT REGISTRY & CONSOLE */}
        {activeTab === "agents" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                12 Connected Business Agents
              </h3>
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {agentsList.map((agent) => {
                  const isSelected = selectedAgentId === agent.id;
                  return (
                    <div
                      key={agent.id}
                      onClick={() => {
                        setSelectedAgentId(agent.id);
                        setAgentPrompt(agent.sampleInput || "");
                        setAgentOutput(null);
                        setIsConfidential(agent.confidentialDefault);
                      }}
                      className={`p-4 rounded-xl border text-xs cursor-pointer transition ${
                        isSelected
                          ? "bg-cyan-500/10 border-cyan-500/40 shadow-sm"
                          : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-white text-sm">{agent.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                          {agent.module}
                        </span>
                      </div>
                      <p className="text-slate-400 line-clamp-2">{agent.capability}</p>
                      {agent.confidentialDefault && (
                        <div className="mt-2 text-[10px] text-amber-400 flex items-center space-x-1">
                          <Lock className="w-3 h-3" />
                          <span>Confidential Local-Only Routing</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h2 className="text-base font-bold text-white">
                      {agentsList.find((a) => a.id === selectedAgentId)?.name || "Agent Console"}
                    </h2>
                    <p className="text-xs text-slate-400">
                      {agentsList.find((a) => a.id === selectedAgentId)?.capability}
                    </p>
                  </div>
                  <label className="flex items-center space-x-1.5 text-xs text-slate-300 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700/60 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isConfidential}
                      onChange={(e) => setIsConfidential(e.target.checked)}
                      className="rounded border-slate-600 text-cyan-500 focus:ring-0"
                    />
                    <span className="text-[11px] font-medium">Confidential Safe Mode</span>
                  </label>
                </div>

                <div className="mt-4 space-y-2">
                  <label className="text-xs text-slate-400 font-medium">Prompt Directive:</label>
                  <textarea
                    rows={4}
                    value={agentPrompt}
                    onChange={(e) => setAgentPrompt(e.target.value)}
                    placeholder="Enter directive for agent..."
                    className="w-full p-3 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                  <div className="flex justify-between items-center text-[11px] text-slate-500">
                    <span>Free provider router automatically selects best available model.</span>
                    <button
                      onClick={handleDispatchAgent}
                      disabled={dispatchLoading || !agentPrompt.trim()}
                      className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium rounded-lg shadow-sm flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
                    >
                      {dispatchLoading ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Routing...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Dispatch Agent</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {agentOutput && (
                  <div className="mt-6 p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800/80">
                      <span className="font-semibold text-slate-300 flex items-center space-x-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Execution Output</span>
                      </span>
                      {agentOutput.status === "succeeded" && (
                        <div className="flex items-center space-x-2 text-[11px]">
                          <span className="text-emerald-400 font-mono">Provider: {agentOutput.providerId}</span>
                        </div>
                      )}
                    </div>
                    {agentOutput.status === "succeeded" ? (
                      <div className="text-xs text-slate-200 font-sans whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto">
                        {agentOutput.output}
                      </div>
                    ) : (
                      <div className="text-xs text-rose-400 space-y-1">
                        <p className="font-semibold">Provider Notice / Closed-Fail Guard:</p>
                        <p>{agentOutput.reason || agentOutput.error || "Execution unavailable."}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: FREE PROVIDER HEALTH */}
        {activeTab === "providers" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <Zap className="w-5 h-5 text-cyan-400" />
                <span>Zero-Cost AI Provider Health & Quota Matrix</span>
              </h2>
              <p className="text-xs text-slate-400">
                Guaranteed $0 spend. Automatically enforces free-tier limits with closed-fail policy.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {providersList.map((p) => (
                <div key={p.id} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white">{p.name}</h3>
                      <p className="text-[11px] text-slate-500 font-mono">{p.id}</p>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                        p.enabled && p.healthy
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-slate-800 text-slate-400 border border-slate-700"
                      }`}
                    >
                      {p.enabled && p.healthy ? "Online / Verified" : "Standby / Unconfigured"}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs pt-2 border-t border-slate-800/80">
                    <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
                      <div className="text-[10px] text-slate-400">Daily Quota</div>
                      <div className="font-bold text-white mt-0.5">{p.rateLimitRPD ?? 1500} RPD</div>
                    </div>
                    <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
                      <div className="text-[10px] text-slate-400">Rate Limit</div>
                      <div className="font-bold text-white mt-0.5">{p.rateLimitRPM ?? 15} RPM</div>
                    </div>
                    <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
                      <div className="text-[10px] text-slate-400">Confidential Safe</div>
                      <div className="font-bold text-white mt-0.5">
                        {p.confidentialAllowed ? "Yes (Private)" : "No (Public)"}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: CRM LEADS */}
        {activeTab === "crm" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <Users className="w-5 h-5 text-cyan-400" />
                <span>Central Leads Pipeline (bl_leads)</span>
              </h2>
              <p className="text-xs text-slate-400">Unified inquiries across all 5 platforms.</p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/70 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Name / Contact</th>
                    <th className="p-3.5">Platform</th>
                    <th className="p-3.5">Stage</th>
                    <th className="p-3.5">Consent Recorded</th>
                    <th className="p-3.5">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {leadsList.map((lead) => (
                    <tr key={lead.id} className="hover:bg-slate-800/30 transition">
                      <td className="p-3.5 font-medium text-white">
                        <div>{lead.name}</div>
                        <div className="text-[10px] text-slate-500">{lead.contact}</div>
                      </td>
                      <td className="p-3.5 font-mono text-cyan-400">{lead.platformId}</td>
                      <td className="p-3.5">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono uppercase bg-slate-800 text-slate-300">
                          {lead.stage}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-400 font-mono text-[11px]">{lead.consentAt || "Pre-consent"}</td>
                      <td className="p-3.5">
                        <button
                          onClick={() => {
                            setActiveTab("agents");
                            setSelectedAgentId("executive");
                            setAgentPrompt(`Prepare an executive follow-up briefing for client ${lead.name} regarding platform ${lead.platformId}.`);
                          }}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] transition"
                        >
                          Draft AI Reply
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: DUBAI & AGREEMENTS */}
        {activeTab === "dubai" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-cyan-400" />
                <span>Dubai Real Estate & Signed Partner Agreements (bl_agreements)</span>
              </h2>
              <p className="text-xs text-slate-400">
                Strict evidence verification. Unapproved or draft agreements cannot calculate commission.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {agreementsList.length === 0 ? (
                <div className="col-span-full p-8 border border-slate-800/80 bg-slate-900/40 rounded-2xl text-center space-y-2">
                  <Building2 className="w-8 h-8 text-slate-600 mx-auto" />
                  <h3 className="text-sm font-semibold text-slate-300">No Partner Agreements Found in Central Database</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    <code>bl_agreements</code> currently has 0 approved records. Zero fabricated demo agreements are loaded. Partner commissions strictly require an approved contract with verified SHA-256 evidence.
                  </p>
                </div>
              ) : (
                agreementsList.map((agr) => {
                  const partner = partnersList.find((p) => p.id === agr.partnerId);
                  const isApproved = agr.status === "approved";
                  return (
                    <div key={agr.id} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-white text-sm">{partner?.name || "Partner"}</h3>
                          <p className="text-[11px] text-slate-400 font-mono">{agr.id}</p>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase ${
                            isApproved
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}
                        >
                          {agr.status}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-300 pt-2 border-t border-slate-800">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Commission BPS:</span>
                          <span className="font-bold text-cyan-400">{agr.commissionBps} bps ({(agr.commissionBps / 100).toFixed(2)}%)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Validity Period:</span>
                          <span className="font-mono text-[11px]">{agr.validFrom} to {agr.validUntil}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Evidence SHA-256:</span>
                          <span className="font-mono text-[10px] text-slate-400 truncate max-w-[120px]">{agr.evidenceSha256}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Approved By:</span>
                          <span className="text-slate-300 text-[11px]">{agr.approvedBy || "Pending Admin Sign-off"}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Evidence-Gated Commission Calculator */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-cyan-400" />
                <span>Evidence-Gated Dubai Commission & UAE VAT Calculator</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs text-slate-400">Select Partner</label>
                  <select
                    value={selectedPartnerId}
                    onChange={(e) => setSelectedPartnerId(e.target.value)}
                    className="w-full mt-1 p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  >
                    {partnersList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400">Property Value (AED)</label>
                  <input
                    type="number"
                    value={propValue}
                    onChange={(e) => setPropValue(Number(e.target.value))}
                    className="w-full mt-1 p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">UAE VAT Registered</label>
                  <select
                    value={isVatRegistered ? "yes" : "no"}
                    onChange={(e) => setIsVatRegistered(e.target.value === "yes")}
                    className="w-full mt-1 p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  >
                    <option value="no">No (Under AED 375k threshold / Not Registered)</option>
                    <option value="yes">Yes (Registered with Federal Tax Authority)</option>
                  </select>
                </div>
                {isVatRegistered && (
                  <div>
                    <label className="text-xs text-slate-400">FTA Tax Registration Number (TRN)</label>
                    <input
                      type="text"
                      value={supplierTrn}
                      onChange={(e) => setSupplierTrn(e.target.value)}
                      placeholder="15-digit TRN (e.g. 100...)"
                      maxLength={15}
                      className="w-full mt-1 p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono"
                    />
                  </div>
                )}
                <div className="flex items-end">
                  <button
                    onClick={handleCalculateCommission}
                    className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
                  >
                    Calculate Verified Split
                  </button>
                </div>
              </div>

              {commError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs">
                  {commError}
                </div>
              )}

              {propResult && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800 text-xs">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                    <div className="text-slate-400 text-[10px]">Verified Commission Rate</div>
                    <div className="font-bold text-cyan-400 mt-1">
                      {propResult.commissionRatePercent}% ({propResult.commissionBps} bps)
                    </div>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                    <div className="text-slate-400 text-[10px]">Gross Commission</div>
                    <div className="font-bold text-white mt-1">
                      {propResult.grossCommissionAED?.toLocaleString()} AED
                    </div>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                    <div className="text-slate-400 text-[10px]">UAE VAT ({propResult.vatRatePercent}%)</div>
                    <div className="font-bold text-amber-400 mt-1">
                      {propResult.uaeVatAED?.toLocaleString()} AED
                    </div>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                    <div className="text-slate-400 text-[10px]">Total Tax Invoice</div>
                    <div className="font-bold text-emerald-400 mt-1">
                      {propResult.totalInvoiceAED?.toLocaleString()} AED
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 6: AUDIT LOG */}
        {activeTab === "audit" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <History className="w-5 h-5 text-cyan-400" />
                <span>Central Immutable Audit Log (bl_audit)</span>
              </h2>
              <p className="text-xs text-slate-400">Complete immutable record of all ecosystem operations.</p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/70 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Timestamp</th>
                    <th className="p-3.5">Actor</th>
                    <th className="p-3.5">Action</th>
                    <th className="p-3.5">Entity ID</th>
                    <th className="p-3.5">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {auditList.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-800/30 transition">
                      <td className="p-3.5 font-mono text-[11px] text-slate-500">
                        {new Date(entry.createdAt).toLocaleTimeString()}
                      </td>
                      <td className="p-3.5 font-semibold text-white">{entry.actorId}</td>
                      <td className="p-3.5 font-mono text-cyan-400">{entry.action}</td>
                      <td className="p-3.5 font-mono text-slate-400 text-[11px]">{entry.entityId}</td>
                      <td className="p-3.5 text-slate-400 max-w-sm truncate">{entry.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 7: APPROVALS */}
        {activeTab === "approvals" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <span>Action Approval Center</span>
              </h2>
              <p className="text-xs text-slate-400">Human-in-the-loop gate for sensitive actions and contract verifications.</p>
            </div>

            <div className="space-y-4">
              {approvalsList.map((appr) => {
                const isPending = appr.status === "pending";
                return (
                  <div
                    key={appr.id}
                    className={`p-5 rounded-2xl border text-xs space-y-3 transition ${
                      isPending ? "bg-slate-900/80 border-amber-500/40 shadow-lg" : "bg-slate-900/40 border-slate-800"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-white text-sm">{appr.title}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] uppercase font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            {appr.riskLevel} Risk
                          </span>
                        </div>
                        <p className="text-slate-400 text-[11px] mt-0.5">
                          Requested By: {appr.requestedBy} • Action: {appr.actionType}
                        </p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-mono uppercase bg-amber-500/20 text-amber-300 font-bold">
                        {appr.status}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl text-slate-300">
                      {appr.details}
                    </div>

                    {isPending && (
                      <div className="flex space-x-3 pt-2">
                        <button
                          onClick={() => handleApproval(appr.id, "approved")}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl flex items-center space-x-1.5 transition cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve & Verify Agreement</span>
                        </button>
                        <button
                          onClick={() => handleApproval(appr.id, "rejected")}
                          className="px-4 py-2 bg-slate-800 hover:bg-rose-600/80 text-slate-300 hover:text-white font-medium rounded-xl flex items-center space-x-1.5 transition cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
