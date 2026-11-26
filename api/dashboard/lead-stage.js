'use strict';
const { protect } = require('../_lib/guard');
const { sendJson, readJson } = require('../_lib/http');
const { rpc, dbErrorBody } = require('../_lib/db');
const { ROLES } = require('../_lib/session');
const v = require('../_lib/validate');

module.exports = protect(
  async (req, res) => {
    const body = await readJson(req);
    const r0 = v.collect({ id: v.uuid(body.id, 'id'), stage: v.requiredEnum(body.stage, v.LEAD_STAGES, 'stage') });
    if (r0.errors) return sendJson(res, 400, { error: 'invalid_input', details: r0.errors });
    const r = await rpc('bl_update_lead_stage', { p_id: r0.values.id, p_stage: r0.values.stage });
    if (!r.ok) return sendJson(res, r.httpStatus, dbErrorBody(r));
    return sendJson(res, 200, { ok: true, id: r0.values.id, stage: r0.values.stage });
  },
  { methods: ['POST'], role: ROLES.owner }
);
