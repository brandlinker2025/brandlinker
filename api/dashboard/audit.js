'use strict';
const { protect } = require('../_lib/guard');
const { sendJson, getQuery } = require('../_lib/http');
const { rpc, dbErrorBody, statusLabel } = require('../_lib/db');
const v = require('../_lib/validate');
const shape = require('../_lib/shape');

module.exports = protect(async (req, res) => {
  const q = getQuery(req);
  const r0 = v.collect({ limit: v.limit(q.limit), offset: v.offset(q.offset) });
  if (r0.errors) return sendJson(res, 400, { error: 'invalid_input', details: r0.errors });
  const r = await rpc('bl_list_audit', { p_limit: r0.values.limit, p_offset: r0.values.offset });
  if (!r.ok) return sendJson(res, r.httpStatus, dbErrorBody(r));
  return sendJson(res, 200, {
    db: { status: 'live_verified', label: statusLabel('live_verified') },
    query: r0.values,
    data: shape.page(r.data, shape.audit),
  });
});
