'use strict';
const { protect } = require('../_lib/guard');
const { sendJson, getQuery } = require('../_lib/http');
const { rpc, dbErrorBody, statusLabel } = require('../_lib/db');
const v = require('../_lib/validate');
const shape = require('../_lib/shape');

module.exports = protect(async (req, res) => {
  const q = getQuery(req);
  const r0 = v.collect({
    platform: v.platform(q.platform),
    stage: v.optionalEnum(q.stage, v.LEAD_STAGES, 'stage'),
    search: v.search(q.search),
    limit: v.limit(q.limit),
    offset: v.offset(q.offset),
  });
  if (r0.errors) return sendJson(res, 400, { error: 'invalid_input', details: r0.errors });
  const p = r0.values;
  const r = await rpc('bl_list_leads', {
    p_platform: p.platform,
    p_stage: p.stage,
    p_search: p.search,
    p_limit: p.limit,
    p_offset: p.offset,
  });
  if (!r.ok) return sendJson(res, r.httpStatus, dbErrorBody(r));
  return sendJson(res, 200, {
    db: { status: 'live_verified', label: statusLabel('live_verified') },
    query: p,
    data: shape.page(r.data, shape.lead),
  });
});
