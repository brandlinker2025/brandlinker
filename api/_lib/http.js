'use strict';
// Small HTTP helpers shared by the dashboard serverless functions.
// Files under api/_lib are not exposed as Vercel functions (underscore prefix).

const MAX_BODY_BYTES = 8 * 1024;

function setSecurityHeaders(res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
}

function sendJson(res, status, body, extraHeaders) {
  setSecurityHeaders(res);
  if (extraHeaders) {
    for (const [k, v] of Object.entries(extraHeaders)) res.setHeader(k, v);
  }
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function methodNotAllowed(res, allowed) {
  sendJson(res, 405, { error: 'method_not_allowed' }, { Allow: allowed.join(', ') });
}

function header(req, name) {
  const v = req.headers ? req.headers[name.toLowerCase()] : undefined;
  return Array.isArray(v) ? v[0] : v;
}

function clientIp(req) {
  const raw =
    header(req, 'x-vercel-forwarded-for') ||
    header(req, 'x-real-ip') ||
    header(req, 'x-forwarded-for') ||
    (req.socket && req.socket.remoteAddress) ||
    'unknown';
  return String(raw).split(',')[0].trim().slice(0, 64) || 'unknown';
}

function getQuery(req) {
  if (req.query && typeof req.query === 'object') return req.query;
  const url = new URL(req.url || '/', 'http://localhost');
  const out = {};
  for (const [k, v] of url.searchParams) out[k] = v;
  return out;
}

// Reads a JSON object body. Vercel may already have parsed req.body.
async function readJson(req) {
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
    const text = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : String(req.body);
    if (text.length > MAX_BODY_BYTES) throw httpError(413, 'body_too_large');
    return parseObject(text);
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw httpError(413, 'body_too_large');
    chunks.push(chunk);
  }
  return parseObject(Buffer.concat(chunks).toString('utf8'));
}

function parseObject(text) {
  if (!text) return {};
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw httpError(400, 'invalid_json');
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw httpError(400, 'invalid_json');
  return parsed;
}

function httpError(status, code, detail) {
  const e = new Error(code);
  e.status = status;
  e.code = code;
  if (detail) e.detail = detail;
  return e;
}

// CSRF defence for state-changing requests: JSON content type and same-origin Origin header.
function checkSameOrigin(req) {
  const ct = String(header(req, 'content-type') || '').toLowerCase();
  if (!ct.startsWith('application/json')) return 'content_type_must_be_json';
  const origin = header(req, 'origin');
  const host = header(req, 'x-forwarded-host') || header(req, 'host');
  if (!origin || !host) return 'origin_required';
  let originHost;
  try {
    originHost = new URL(origin).host;
  } catch {
    return 'origin_invalid';
  }
  if (originHost.toLowerCase() !== String(host).toLowerCase()) return 'cross_origin_rejected';
  return null;
}

module.exports = {
  sendJson,
  methodNotAllowed,
  header,
  clientIp,
  getQuery,
  readJson,
  httpError,
  checkSameOrigin,
  setSecurityHeaders,
};
