'use strict';
// Normalises DB contract responses before they reach the browser.
const { statusLabel, STATUS_LABELS } = require('./db');

const str = (v, max = 500) => (v === null || v === undefined ? null : String(v).slice(0, max));
const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

function normStatus(s) {
  return Object.prototype.hasOwnProperty.call(STATUS_LABELS, s) ? s : 'unavailable';
}

function health(list) {
  if (!Array.isArray(list)) return [];
  return list.slice(0, 100).map((h) => {
    const status = normStatus(h && h.status);
    return {
      component: str(h && h.component, 120),
      status,
      label: statusLabel(status),
      detail: h && h.detail !== undefined && h.detail !== null ? str(typeof h.detail === 'string' ? h.detail : JSON.stringify(h.detail), 500) : null,
      checked_at: str(h && h.checked_at, 40),
    };
  });
}

function counts(c) {
  const out = {};
  if (!c || typeof c !== 'object') return out;
  for (const k of ['platforms', 'leads', 'jobs', 'agreements', 'audit']) out[k] = num(c[k]);
  const jbs = {};
  if (c.jobs_by_state && typeof c.jobs_by_state === 'object') {
    for (const [k, v] of Object.entries(c.jobs_by_state)) jbs[str(k, 40)] = num(v);
  }
  out.jobs_by_state = jbs;
  return out;
}

function summary(d) {
  return {
    generated_at: str(d.generated_at, 40),
    counts: counts(d.counts),
    platforms: Array.isArray(d.platforms)
      ? d.platforms.slice(0, 100).map((p) => ({ id: str(p.id, 64), domain: str(p.domain, 255), leads: num(p.leads), jobs_open: num(p.jobs_open) }))
      : [],
    health: health(d.health),
  };
}

function page(d, mapRow) {
  // Contract list RPCs return {total, rows}; tolerate a bare array (total unknown -> null, never 0).
  const list = Array.isArray(d) ? d : Array.isArray(d && d.rows) ? d.rows : [];
  const rows = list.slice(0, 100).filter((r) => r && typeof r === 'object').map(mapRow);
  return { total: Array.isArray(d) ? null : num(d && d.total), rows };
}

const lead = (r) => ({
  id: str(r.id, 64),
  platform_id: str(r.platform_id, 64),
  name: str(r.name, 200),
  contact: str(r.contact, 200),
  stage: str(r.stage, 20),
  consent_at: str(r.consent_at, 40),
  created_at: str(r.created_at, 40),
});

const job = (r) => ({
  id: str(r.id, 128),
  agent_id: str(r.agent_id, 120),
  state: str(r.state, 40),
  target_platform: str(r.target_platform, 64),
  requires_approval: typeof r.requires_approval === 'boolean' ? r.requires_approval : null,
  attempts: num(r.attempts),
  max_attempts: num(r.max_attempts),
  last_error: str(r.last_error ?? r.error, 500),
  created_at: str(r.created_at, 40),
  updated_at: str(r.updated_at, 40),
});

const audit = (r) => ({
  id: str(r.id, 64),
  at: str(r.at ?? r.created_at, 40),
  actor: str(r.actor ?? r.client_id, 120),
  action: str(r.action, 120),
  target: str(r.target ?? r.entity, 200),
  detail: r.detail === undefined || r.detail === null ? null : str(typeof r.detail === 'string' ? r.detail : JSON.stringify(r.detail), 500),
});

module.exports = { summary, health, page, lead, job, audit };
