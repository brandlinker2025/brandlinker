'use strict';
process.env.DASHBOARD_FAIL_DELAY_MS = '1';
const test = require('node:test');
const assert = require('node:assert/strict');
const m = require('../support/mock');
const session = require('../../api/_lib/session');
const { createLimiter } = require('../../api/_lib/rate-limit');
const login = require('../../api/auth/login');
const logout = require('../../api/auth/logout');
const sessionEp = require('../../api/auth/session');
const summary = require('../../api/dashboard/summary');

test('auth not configured: login fails closed with 503 and session reports auth_configured=false', async () => {
  m.setEnv({ auth: false });
  const r = await m.call(login, { method: 'POST', body: { password: 'anything-at-all' } });
  assert.equal(r.status, 503);
  assert.equal(r.json.error, 'auth_not_configured');
  assert.equal(r.headers['set-cookie'], undefined);
  const s = await m.call(sessionEp, {});
  assert.equal(s.status, 200);
  assert.equal(s.json.auth_configured, false);
  assert.equal(s.json.authenticated, false);
});

test('weak secret (<32 chars) counts as not configured, and a forged cookie is rejected', async () => {
  m.setEnv({ extra: { DASHBOARD_SESSION_SECRET: 'short-secret' } });
  assert.equal(session.authConfig().configured, false);
  const r = await m.call(summary, { cookie: `${session.COOKIE_NAME}=${session.createSessionToken('owner', 'short-secret')}` });
  assert.equal(r.status, 401);
});

test('login: wrong password 401, correct password sets HttpOnly Secure SameSite=Strict cookie with expiry', async () => {
  m.setEnv();
  const bad = await m.call(login, { method: 'POST', body: { password: 'nope' }, ip: '198.51.100.1' });
  assert.equal(bad.status, 401);
  assert.equal(bad.headers['set-cookie'], undefined);
  const ok = await m.call(login, { method: 'POST', body: { password: m.OWNER_PW }, ip: '198.51.100.1' });
  assert.equal(ok.status, 200);
  assert.equal(ok.json.role, 'owner');
  const c = ok.headers['set-cookie'];
  assert.match(c, /^__Host-bl_dash=/);
  for (const flag of ['HttpOnly', 'Secure', 'SameSite=Strict', 'Path=/', `Max-Age=${session.SESSION_TTL_SECONDS}`]) assert.ok(c.includes(flag), flag);
  const s = await m.call(sessionEp, { cookie: c.split(';')[0] });
  assert.equal(s.json.authenticated, true);
  assert.equal(s.json.role, 'owner');
});

test('viewer password yields read-only role', async () => {
  m.setEnv();
  const ok = await m.call(login, { method: 'POST', body: { password: m.VIEWER_PW }, ip: '198.51.100.2' });
  assert.equal(ok.status, 200);
  assert.equal(ok.json.role, 'viewer');
});

test('login rejects cross-origin and non-JSON requests (CSRF)', async () => {
  m.setEnv();
  const x = await m.call(login, { method: 'POST', body: { password: m.OWNER_PW }, headers: { origin: 'https://evil.example' } });
  assert.equal(x.status, 403);
  const y = await m.call(login, { method: 'POST', body: { password: m.OWNER_PW }, headers: { 'content-type': 'text/plain' } });
  assert.equal(y.status, 403);
  const z = await m.call(login, { method: 'GET' });
  assert.equal(z.status, 405);
});

test('brute force: 5 failures lock the IP (429 even with the right password); other IPs unaffected', async () => {
  m.setEnv();
  const ip = '192.0.2.77';
  for (let i = 0; i < 5; i++) {
    const r = await m.call(login, { method: 'POST', body: { password: 'wrong-' + i }, ip });
    assert.equal(r.status, 401);
  }
  const locked = await m.call(login, { method: 'POST', body: { password: m.OWNER_PW }, ip });
  assert.equal(locked.status, 429);
  assert.ok(Number(locked.headers['retry-after']) > 0);
  const other = await m.call(login, { method: 'POST', body: { password: m.OWNER_PW }, ip: '192.0.2.78' });
  assert.equal(other.status, 200);
});

test('rate limiter: global lock after distributed failures, and unlock after the window', () => {
  const l = createLimiter({ perIpMax: 5, globalMax: 10, windowMs: 1000, lockMs: 1000 });
  const t = 1_000_000;
  for (let i = 0; i < 10; i++) l.fail('ip' + i, t);
  assert.ok(l.check('fresh-ip', t + 1) > 0, 'global lock applies to new IPs');
  assert.equal(l.check('fresh-ip', t + 1001), 0, 'lock expires');
});

test('session expiry: expired, tampered and future-issued tokens are rejected', () => {
  const now = Date.now();
  const tok = session.createSessionToken('owner', m.SECRET, now);
  assert.ok(session.verifySessionToken(tok, m.SECRET, now));
  assert.equal(session.verifySessionToken(tok, m.SECRET, now + (session.SESSION_TTL_SECONDS + 1) * 1000), null);
  const [p, s] = tok.split('.');
  const forged = Buffer.from(JSON.stringify({ v: 1, role: 'owner', iat: 0, exp: 9999999999, n: 'x' })).toString('base64url');
  assert.equal(session.verifySessionToken(`${forged}.${s}`, m.SECRET, now), null);
  assert.equal(session.verifySessionToken(`${p}.${s}x`, m.SECRET, now), null);
  assert.equal(session.verifySessionToken(tok, 'other-secret'.padEnd(40, 'z'), now), null);
  const future = session.createSessionToken('owner', m.SECRET, now + 3600_000);
  assert.equal(session.verifySessionToken(future, m.SECRET, now), null);
});

test('expired cookie on an API call -> 401', async () => {
  m.setEnv();
  const old = Date.now() - (session.SESSION_TTL_SECONDS + 60) * 1000;
  const r = await m.call(summary, { cookie: m.cookieFor('owner', old) });
  assert.equal(r.status, 401);
});

test('logout clears the cookie (Max-Age=0) and requires same-origin POST', async () => {
  m.setEnv();
  const r = await m.call(logout, { method: 'POST', cookie: m.cookieFor('owner') });
  assert.equal(r.status, 200);
  assert.match(r.headers['set-cookie'], /^__Host-bl_dash=;.*Max-Age=0/);
  const x = await m.call(logout, { method: 'POST', headers: { origin: 'https://evil.example' } });
  assert.equal(x.status, 403);
});

test('password hashes: malformed or weak-parameter hashes are not accepted as configuration', () => {
  assert.equal(session.parseHash('plaintextpassword'), null);
  assert.equal(session.parseHash('scrypt$1024$8$1$AAAAAAAAAAAAAAAAAAAAAA==$' + Buffer.alloc(32).toString('base64')), null);
  assert.ok(session.parseHash(m.OWNER_HASH));
  assert.equal(session.verifyPassword('x'.repeat(300), session.parseHash(m.OWNER_HASH)), false);
});
