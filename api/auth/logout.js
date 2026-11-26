'use strict';
const { sendJson, methodNotAllowed, checkSameOrigin } = require('../_lib/http');
const { clearedCookie } = require('../_lib/session');

module.exports = async function logout(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
  const bad = checkSameOrigin(req);
  if (bad) return sendJson(res, 403, { error: bad });
  // Always clear the cookie, whether or not a session existed.
  return sendJson(res, 200, { authenticated: false }, { 'Set-Cookie': clearedCookie() });
};
