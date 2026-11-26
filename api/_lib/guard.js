'use strict';
const { sendJson, methodNotAllowed, checkSameOrigin, httpError } = require('./http');
const { getSession, ROLES } = require('./session');

// Wraps a handler with: method allow-list, valid session (401), role check (403),
// and same-origin JSON check for state-changing methods (403).
function protect(handler, { methods = ['GET'], role = null } = {}) {
  return async function guarded(req, res) {
    try {
      if (!methods.includes(req.method)) return methodNotAllowed(res, methods);
      const session = getSession(req);
      if (!session) return sendJson(res, 401, { error: 'unauthorized', authenticated: false });
      if (role === ROLES.owner && session.role !== ROLES.owner) {
        return sendJson(res, 403, { error: 'forbidden', detail: 'owner role required (read-only session)' });
      }
      if (req.method !== 'GET') {
        const bad = checkSameOrigin(req);
        if (bad) return sendJson(res, 403, { error: bad });
      }
      return await handler(req, res, session);
    } catch (err) {
      if (err && err.status) return sendJson(res, err.status, { error: err.code || 'bad_request' });
      // Never leak internals.
      return sendJson(res, 500, { error: 'internal_error' });
    }
  };
}

module.exports = { protect, httpError };
