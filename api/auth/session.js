'use strict';
const { sendJson, methodNotAllowed } = require('../_lib/http');
const { authConfig, getSession } = require('../_lib/session');

// Public status probe: says only whether auth is configured and whether the caller is logged in.
module.exports = async function session(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
  const cfg = authConfig();
  const s = cfg.configured ? getSession(req) : null;
  return sendJson(res, 200, {
    auth_configured: cfg.configured,
    authenticated: Boolean(s),
    role: s ? s.role : null,
    expires_at: s ? new Date(s.exp * 1000).toISOString() : null,
  });
};
