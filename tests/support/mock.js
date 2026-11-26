'use strict';
// Test helpers: fake Vercel req/res, env setup, and fetch mocks. No network.
const { hashPassword, createSessionToken, COOKIE_NAME } = require('../../api/_lib/session');

const SECRET = 'test-secret-'.padEnd(48, 'x');
const OWNER_PW = 'owner-password-123';
const VIEWER_PW = 'viewer-password-456';
const OWNER_HASH = hashPassword(OWNER_PW, { N: 16384 });
const VIEWER_HASH = hashPassword(VIEWER_PW, { N: 16384 });

const DB_ENV = {
  SUPABASE_URL: 'https://enahlkxdplntriipabiu.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_testkey',
  BL_CLIENT_ID: 'bl-dashboard-test',
  BL_CLIENT_SECRET: 'client-secret-test',
};
const ALL_KEYS = ['DASHBOARD_SESSION_SECRET', 'DASHBOARD_OWNER_PASSWORD_HASH', 'DASHBOARD_VIEWER_PASSWORD_HASH',
  'SUPABASE_SERVICE_ROLE_KEY', 'BL_SUPABASE_SERVICE_KEY', ...Object.keys(DB_ENV)];

function setEnv({ auth = true, db = true, extra = {} } = {}) {
  for (const k of ALL_KEYS) delete process.env[k];
  if (auth) {
    process.env.DASHBOARD_SESSION_SECRET = SECRET;
    process.env.DASHBOARD_OWNER_PASSWORD_HASH = OWNER_HASH;
    process.env.DASHBOARD_VIEWER_PASSWORD_HASH = VIEWER_HASH;
  }
  if (db) Object.assign(process.env, DB_ENV);
  Object.assign(process.env, extra);
}

function cookieFor(role, now) {
  return `${COOKIE_NAME}=${createSessionToken(role, SECRET, now)}`;
}

function req({ method = 'GET', url = '/', headers = {}, body, cookie, ip = '203.0.113.9' } = {}) {
  const h = { host: 'dash.test', 'x-real-ip': ip, ...headers };
  if (cookie) h.cookie = cookie;
  if (method !== 'GET' && !('origin' in h)) h.origin = 'https://dash.test';
  if (method !== 'GET' && !('content-type' in h)) h['content-type'] = 'application/json';
  return { method, url, headers: h, body: body === undefined ? (method === 'GET' ? undefined : {}) : body };
}

async function call(handler, opts) {
  const headers = {};
  const res = {
    statusCode: 200,
    setHeader(k, v) { headers[k.toLowerCase()] = v; },
    getHeader(k) { return headers[k.toLowerCase()]; },
    end(b) { this.body = b; },
  };
  await handler(req(opts), res);
  let json = null;
  try { json = JSON.parse(res.body); } catch { /* not json */ }
  return { status: res.statusCode, headers, json, raw: res.body };
}

// Replace global fetch; returns a recorder.
function mockFetch(impl) {
  const calls = [];
  const original = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    calls.push({ url, init, body: init && init.body ? JSON.parse(init.body) : null });
    return impl(url, init);
  };
  return { calls, restore: () => { globalThis.fetch = original; } };
}

function jsonResponse(status, body) {
  return new Response(body === undefined ? '' : JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

module.exports = { SECRET, OWNER_PW, VIEWER_PW, OWNER_HASH, VIEWER_HASH, DB_ENV, setEnv, cookieFor, req, call, mockFetch, jsonResponse };
