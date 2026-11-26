'use strict';
const { protect } = require('../_lib/guard');
const { sendJson } = require('../_lib/http');
const { rpc, dbErrorBody, statusLabel } = require('../_lib/db');
const shape = require('../_lib/shape');

module.exports = protect(async (req, res, session) => {
  const r = await rpc('bl_dashboard_summary');
  if (!r.ok) return sendJson(res, r.httpStatus, { ...dbErrorBody(r), role: session.role });
  return sendJson(res, 200, {
    db: { status: 'live_verified', label: statusLabel('live_verified') },
    role: session.role,
    data: shape.summary(r.data),
  });
});
