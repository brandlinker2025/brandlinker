'use strict';
// Owner-only dashboard authentication.
//  - Password hashes (scrypt) come from env; plain passwords are never stored.
//  - Session = HMAC-SHA256 signed cookie (HttpOnly, Secure, SameSite=Strict, __Host- prefix) with absolute expiry.
//  - Fails closed: if the secret or hashes are missing/weak, nobody can log in.
const crypto = require('crypto');
const { header } = require('./http');

const COOKIE_NAME = '__Host-bl_dash';
const SESSION_TTL_SECONDS = 8 * 60 * 60; // 8 hours absolute
const MIN_SECRET_LENGTH = 32;
const MIN_PLAIN_PASSWORD = 20;
const ROLES = Object.freeze({ owner: 'owner', viewer: 'viewer' });

function authConfig(env = process.env) {
  const secret = env.DASHBOARD_SESSION_SECRET || '';
  const ownerHash = env.DASHBOARD_OWNER_PASSWORD_HASH || '';
  const viewerHash = env.DASHBOARD_VIEWER_PASSWORD_HASH || '';
  const missing = [];
  if (secret.length < MIN_SECRET_LENGTH) missing.push('DASHBOARD_SESSION_SECRET (>=32 chars)');
  // Owner credential: an scrypt hash, or (simpler setup) a long random password kept in a Sensitive env var.
  // A plain password is hashed once per instance with a random salt and compared with scrypt + timingSafeEqual.
  const owner = parseHash(ownerHash) || plainAsHash(env.DASHBOARD_OWNER_PASSWORD);
  const viewer = parseHash(viewerHash) || plainAsHash(env.DASHBOARD_VIEWER_PASSWORD);
  if (!owner) missing.push('DASHBOARD_OWNER_PASSWORD (>=20 chars) or DASHBOARD_OWNER_PASSWORD_HASH (scrypt$...)');
  return {
    configured: missing.length === 0,
    missing,
    secret,
    hashes: { owner, viewer },
  };
}

const plainCache = new Map();
function plainAsHash(pw) {
  if (typeof pw !== 'string' || pw.length < MIN_PLAIN_PASSWORD) return null;
  if (!plainCache.has(pw)) plainCache.set(pw, parseHash(hashPassword(pw)));
  return plainCache.get(pw);
}

// Format: scrypt$<N>$<r>$<p>$<salt b64>$<hash b64>
function parseHash(str) {
  if (typeof str !== 'string') return null;
  const parts = str.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return null;
  const [N, r, p] = parts.slice(1, 4).map((x) => Number.parseInt(x, 10));
  if (!(N >= 16384 && N <= 1048576 && (N & (N - 1)) === 0 && r >= 8 && r <= 32 && p >= 1 && p <= 4)) return null;
  const salt = Buffer.from(parts[4], 'base64');
  const hash = Buffer.from(parts[5], 'base64');
  if (salt.length < 16 || hash.length < 32) return null;
  return { N, r, p, salt, hash };
}

function hashPassword(password, opts = {}) {
  const N = opts.N || 32768;
  const r = 8;
  const p = 1;
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(String(password), salt, 32, { N, r, p, maxmem: 128 * N * r * 2 });
  return ['scrypt', N, r, p, salt.toString('base64'), hash.toString('base64')].join('$');
}

function verifyPassword(password, parsed) {
  if (!parsed || typeof password !== 'string' || password.length === 0 || password.length > 256) return false;
  let derived;
  try {
    derived = crypto.scryptSync(password, parsed.salt, parsed.hash.length, {
      N: parsed.N,
      r: parsed.r,
      p: parsed.p,
      maxmem: 128 * parsed.N * parsed.r * 2,
    });
  } catch {
    return false;
  }
  return crypto.timingSafeEqual(derived, parsed.hash);
}

// Returns the role whose password matches, or null. Checks every configured role
// so timing does not reveal which role exists.
function checkCredentials(password, cfg) {
  let role = null;
  for (const r of [ROLES.owner, ROLES.viewer]) {
    const h = cfg.hashes[r];
    if (h && verifyPassword(password, h) && !role) role = r;
  }
  return role;
}

function b64url(buf) {
  return Buffer.from(buf).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
}
function fromB64url(s) {
  return Buffer.from(String(s).replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}

function sign(payloadB64, secret) {
  return b64url(crypto.createHmac('sha256', secret).update('bl-dash-v1.' + payloadB64).digest());
}

function createSessionToken(role, secret, now = Date.now()) {
  const iat = Math.floor(now / 1000);
  const payload = { v: 1, role, iat, exp: iat + SESSION_TTL_SECONDS, n: b64url(crypto.randomBytes(12)) };
  const p = b64url(JSON.stringify(payload));
  return p + '.' + sign(p, secret);
}

function verifySessionToken(token, secret, now = Date.now()) {
  if (!secret || secret.length < MIN_SECRET_LENGTH) return null;
  if (typeof token !== 'string' || token.length > 512) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const expected = Buffer.from(sign(parts[0], secret));
  const given = Buffer.from(parts[1]);
  if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) return null;
  let payload;
  try {
    payload = JSON.parse(fromB64url(parts[0]).toString('utf8'));
  } catch {
    return null;
  }
  const t = Math.floor(now / 1000);
  if (!payload || payload.v !== 1) return null;
  if (payload.role !== ROLES.owner && payload.role !== ROLES.viewer) return null;
  if (!Number.isInteger(payload.exp) || payload.exp <= t) return null;
  if (!Number.isInteger(payload.iat) || payload.iat > t + 60) return null;
  if (payload.exp - payload.iat > SESSION_TTL_SECONDS) return null;
  return { role: payload.role, exp: payload.exp, iat: payload.iat };
}

function parseCookies(req) {
  const raw = header(req, 'cookie') || '';
  const out = {};
  for (const part of String(raw).split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    const k = part.slice(0, i).trim();
    if (k && !(k in out)) out[k] = part.slice(i + 1).trim();
  }
  return out;
}

function sessionCookie(token) {
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_TTL_SECONDS}`;
}
function clearedCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

// Returns {role, exp} for a valid session, else null. Never throws.
function getSession(req, env = process.env, now = Date.now()) {
  const cfg = authConfig(env);
  if (!cfg.configured) return null;
  const token = parseCookies(req)[COOKIE_NAME];
  if (!token) return null;
  return verifySessionToken(token, cfg.secret, now);
}

module.exports = {
  COOKIE_NAME,
  SESSION_TTL_SECONDS,
  ROLES,
  authConfig,
  parseHash,
  hashPassword,
  verifyPassword,
  checkCredentials,
  createSessionToken,
  verifySessionToken,
  parseCookies,
  sessionCookie,
  clearedCookie,
  getSession,
};
