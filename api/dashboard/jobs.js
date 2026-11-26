'use strict';
const { protect } = require('../_lib/guard');
const { sendJson, getQuery } = require('../_lib/http');
const { rpc, dbErrorBody, statusLabel } = require('../_lib/db');
const v = require('../_lib/validate');
const shape = require('../_lib/shape');

module.exports = protect(async (req, res) => {
  const q = getQuery(req);
  const r0 = v.collect({
    state: v.optionalEnum(q.state, v.JOB_STATES, 'state'),
    limit: v.limit(q.limit),
    offset: v.offset(q.offset),
  });
  if (r0.errors) return sendJson(res, 400, { error: 'invalid_input', details: r0.errors });
  const p = r0.values;
  const r = await rpc('bl_list_jobs', { p_state: p.state, p_limit: p.limit, p_offset: p.offset });
  if (!r.ok) return sendJson(res, r.httpStatus, dbErrorBody(r));
  return sendJson(res, 200, {
    db: { status: 'live_verified', label: statusLabel('live_verified') },
    query: p,
    data: shape.page(r.data, shape.job),
  });
});
