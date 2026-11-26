'use strict';
// Central DB contract client (BrandLinker-Ecosystem, PostgREST RPCs).
// Uses ONLY the publishable key + this platform's own client id/secret. Never a service-role key:
// a key that looks privileged is refused and reported as "Not configured".

const DEFAULT_TIMEOUT_MS = 8000;
const REQUIRED_ENV = ['SUPABASE_URL', 'SUPABASE_PUBLISHABLE_KEY', 'BL_CLIENT_ID', 'BL_CLIENT_SECRET'];

const STATUS_LABELS = Object.freeze({
  live_verified: 'Connected and live verified',
  configured_unverified: 'Configured but not verified',
  not_configured: 'Not configured',
  unavailable: 'Unavailable',
  failed: 'Failed',
});

function statusLabel(status) {
  return STATUS_LABELS[status] || STATUS_LABELS.unavailable;
}

// Detects a service-role / secret key so it can never be used by mistake.
function looksPrivileged(key) {
  if (!key) return false;
  if (/^sb_secret_/i.test(key)) return true;
  const parts = key.split('.');
  if (parts.length === 3) {
    try {
      const payload = JSON.parse(Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));
      if (payload && payload.role && payload.role !== 'anon') return true;
    } catch {
      /* not a JWT */
    }
  }
  return false;
}

function dbConfig(env = process.env) {
  const missing = REQUIRED_ENV.filter((k) => !env[k] || !String(env[k]).trim());
  const key = String(env.SUPABASE_PUBLISHABLE_KEY || '').trim();
  let url = String(env.SUPABASE_URL || '').trim().replace(/\/+$/, '');
  const problems = [];
  if (key && looksPrivileged(key)) problems.push('SUPABASE_PUBLISHABLE_KEY looks like a privileged/service-role key; refused');
  if (key && (key === String(env.SUPABASE_SERVICE_ROLE_KEY || '') || key === String(env.BL_SUPABASE_SERVICE_KEY || ''))) {
    problems.push('SUPABASE_PUBLISHABLE_KEY equals a service-role key; refused');
  }
  if (url && !/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url)) problems.push('SUPABASE_URL must be https://<ref>.supabase.co');
  const configured = missing.length === 0 && problems.length === 0;
  return {
    configured,
    missing,
    problems,
    url,
    key,
    clientId: String(env.BL_CLIENT_ID || '').trim(),
    clientSecret: String(env.BL_CLIENT_SECRET || ''),
  };
}

// Result shape: { ok:true, data } | { ok:false, status, httpStatus, code, detail }
// status uses the contract vocabulary: not_configured | unavailable | failed
async function rpc(fn, args = {}, opts = {}) {
  const env = opts.env || process.env;
  const fetchImpl = opts.fetchImpl || globalThis.fetch;
  const timeoutMs = opts.timeoutMs || DEFAULT_TIMEOUT_MS;
  const cfg = dbConfig(env);
  if (!cfg.configured) {
    return {
      ok: false,
      status: 'not_configured',
      httpStatus: 503,
      code: 'db_not_configured',
      detail: { missing_env: cfg.missing, problems: cfg.problems },
    };
  }
  if (!/^bl_[a-z_]+$/.test(fn)) throw new Error('invalid rpc name');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let resp;
  try {
    resp = await fetchImpl(`${cfg.url}/rest/v1/rpc/${fn}`, {
      method: 'POST',
      headers: {
        apikey: cfg.key,
        Authorization: `Bearer ${cfg.key}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ p_client: cfg.clientId, p_secret: cfg.clientSecret, ...args }),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    const timedOut = err && (err.name === 'AbortError' || err.name === 'TimeoutError');
    return { ok: false, status: 'unavailable', httpStatus: 503, code: timedOut ? 'db_timeout' : 'db_unreachable' };
  }
  clearTimeout(timer);

  let body = null;
  try {
    const text = await resp.text();
    body = text ? JSON.parse(text) : null;
  } catch {
    body = null;
  }

  if (resp.ok) {
    if (body === null || typeof body !== 'object') {
      return { ok: false, status: 'failed', httpStatus: 502, code: 'db_bad_response' };
    }
    return { ok: true, data: body };
  }

  const sqlState = body && typeof body.code === 'string' ? body.code : '';
  if (resp.status === 401 || resp.status === 403 || sqlState === '42501') {
    // Credential rejected or scope missing: the DB is reachable but our access failed.
    return { ok: false, status: 'failed', httpStatus: 502, code: 'db_access_denied' };
  }
  if (sqlState === '22023' || resp.status === 400) {
    return { ok: false, status: 'failed', httpStatus: 400, code: 'db_invalid_input' };
  }
  if (sqlState === 'P0002' || resp.status === 404) {
    return { ok: false, status: 'failed', httpStatus: 404, code: 'not_found' };
  }
  return { ok: false, status: 'unavailable', httpStatus: 503, code: 'db_unavailable' };
}

// Standard JSON body for a failed DB call. Never contains numbers that could be read as data.
function dbErrorBody(result) {
  return {
    error: result.code,
    db: { status: result.status, label: statusLabel(result.status), ...(result.detail ? result.detail : {}) },
    data: null,
  };
}

module.exports = { rpc, dbConfig, dbErrorBody, statusLabel, STATUS_LABELS, looksPrivileged, REQUIRED_ENV };
