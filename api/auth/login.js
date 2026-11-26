'use strict';
const { sendJson, methodNotAllowed, readJson, clientIp, checkSameOrigin } = require('../_lib/http');
const { authConfig, checkCredentials, createSessionToken, sessionCookie } = require('../_lib/session');
const { loginLimiter } = require('../_lib/rate-limit');

const FAIL_DELAY_MS = Number(process.env.DASHBOARD_FAIL_DELAY_MS || 400);

module.exports = async function login(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
  const cfg = authConfig();
  if (!cfg.configured) {
    // Fail closed: no login possible until the owner configures auth env vars.
    return sendJson(res, 503, { error: 'auth_not_configured', auth: { status: 'not_configured', label: 'Not configured' } });
  }
  const bad = checkSameOrigin(req);
  if (bad) return sendJson(res, 403, { error: bad });

  const ip = clientIp(req);
  const retry = loginLimiter.check(ip);
  if (retry > 0) return sendJson(res, 429, { error: 'too_many_attempts', retry_after: retry }, { 'Retry-After': String(retry) });

  let body;
  try {
    body = await readJson(req);
  } catch (err) {
    return sendJson(res, err.status || 400, { error: err.code || 'bad_request' });
  }
  const password = typeof body.password === 'string' ? body.password : '';
  const role = password ? checkCredentials(password, cfg) : null;
  if (!role) {
    loginLimiter.fail(ip);
    await new Promise((r) => setTimeout(r, FAIL_DELAY_MS));
    return sendJson(res, 401, { error: 'invalid_credentials' });
  }
  loginLimiter.success(ip);
  const token = createSessionToken(role, cfg.secret);
  return sendJson(res, 200, { authenticated: true, role }, { 'Set-Cookie': sessionCookie(token) });
};
