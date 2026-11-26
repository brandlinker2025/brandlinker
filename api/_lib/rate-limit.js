'use strict';
// Brute-force limiting for the login endpoint.
// Per-IP: 5 failures / 15 min -> locked 15 min. Global: 25 failures / 15 min -> all logins locked 15 min
// (protects a single-owner dashboard against distributed guessing).
// NOTE: state is in-memory per serverless instance. It slows guessing but is not a global guarantee;
// a shared store (e.g. a DB-backed limiter RPC) is listed as a remaining dependency in the ledger.

const WINDOW_MS = 15 * 60 * 1000;
const LOCK_MS = 15 * 60 * 1000;
const PER_IP_MAX = 5;
const GLOBAL_MAX = 25;
const MAX_TRACKED = 5000;

function createLimiter(opts = {}) {
  const perIpMax = opts.perIpMax || PER_IP_MAX;
  const globalMax = opts.globalMax || GLOBAL_MAX;
  const windowMs = opts.windowMs || WINDOW_MS;
  const lockMs = opts.lockMs || LOCK_MS;
  const ips = new Map(); // ip -> {fails:[ts], lockedUntil}
  let globalFails = [];
  let globalLockedUntil = 0;

  function prune(list, now) {
    return list.filter((t) => now - t < windowMs);
  }

  // Returns 0 if allowed, else seconds until retry.
  function check(ip, now = Date.now()) {
    if (globalLockedUntil > now) return Math.ceil((globalLockedUntil - now) / 1000);
    const s = ips.get(ip);
    if (s && s.lockedUntil > now) return Math.ceil((s.lockedUntil - now) / 1000);
    return 0;
  }

  function fail(ip, now = Date.now()) {
    if (ips.size > MAX_TRACKED) {
      for (const [k, v] of ips) if (v.lockedUntil <= now && prune(v.fails, now).length === 0) ips.delete(k);
      if (ips.size > MAX_TRACKED) globalLockedUntil = now + lockMs; // memory pressure: fail closed
    }
    const s = ips.get(ip) || { fails: [], lockedUntil: 0 };
    s.fails = prune(s.fails, now);
    s.fails.push(now);
    if (s.fails.length >= perIpMax) {
      s.lockedUntil = now + lockMs;
      s.fails = [];
    }
    ips.set(ip, s);
    globalFails = prune(globalFails, now);
    globalFails.push(now);
    if (globalFails.length >= globalMax) {
      globalLockedUntil = now + lockMs;
      globalFails = [];
    }
  }

  function success(ip) {
    ips.delete(ip);
  }

  return { check, fail, success };
}

module.exports = { createLimiter, loginLimiter: createLimiter() };
