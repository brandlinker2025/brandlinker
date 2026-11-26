'use strict';
// Approval center actions: approve / reject (bl_decide_job) and cancel (bl_cancel_job). Owner only.
const { protect } = require('../_lib/guard');
const { sendJson, readJson } = require('../_lib/http');
const { rpc, dbErrorBody } = require('../_lib/db');
const { ROLES } = require('../_lib/session');
const v = require('../_lib/validate');

const ACTIONS = ['approve', 'reject', 'cancel'];

module.exports = protect(
  async (req, res) => {
    const body = await readJson(req);
    const r0 = v.collect({
      job_id: v.jobId(body.job_id),
      action: v.requiredEnum(body.action, ACTIONS, 'action'),
      note: v.note(body.note),
    });
    if (r0.errors) return sendJson(res, 400, { error: 'invalid_input', details: r0.errors });
    const { job_id, action, note } = r0.values;
    const r =
      action === 'cancel'
        ? await rpc('bl_cancel_job', { p_job_id: job_id })
        : await rpc('bl_decide_job', { p_job_id: job_id, p_approve: action === 'approve', p_note: note });
    if (!r.ok) return sendJson(res, r.httpStatus, dbErrorBody(r));
    return sendJson(res, 200, { ok: true, job_id, action });
  },
  { methods: ['POST'], role: ROLES.owner }
);
