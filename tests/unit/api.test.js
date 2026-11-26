'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const m = require('../support/mock');
const summary = require('../../api/dashboard/summary');
const leads = require('../../api/dashboard/leads');
const leadStage = require('../../api/dashboard/lead-stage');
const jobs = require('../../api/dashboard/jobs');
const jobAction = require('../../api/dashboard/job-action');
const audit = require('../../api/dashboard/audit');

const LEAD_ID = '3f0c8a52-6d0e-4c4c-9a55-2b8f0f1d2e11';

test('every dashboard endpoint returns 401 without a session (and never calls the DB)', async () => {
  m.setEnv();
  const f = m.mockFetch(() => m.jsonResponse(200, {}));
  try {
    for (const [h, method] of [[summary, 'GET'], [leads, 'GET'], [jobs, 'GET'], [audit, 'GET'], [leadStage, 'POST'], [jobAction, 'POST']]) {
      const r = await m.call(h, { method });
      assert.equal(r.status, 401);
      assert.equal(r.json.error, 'unauthorized');
      assert.equal(r.headers['cache-control'].includes('no-store'), true);
    }
    // garbage cookie
    const r = await m.call(summary, { cookie: '__Host-bl_dash=abc.def' });
    assert.equal(r.status, 401);
    assert.equal(f.calls.length, 0);
  } finally { f.restore(); }
});

test('wrong method -> 405', async () => {
  m.setEnv();
  assert.equal((await m.call(summary, { method: 'POST', cookie: m.cookieFor('owner') })).status, 405);
  assert.equal((await m.call(leadStage, { method: 'GET', cookie: m.cookieFor('owner') })).status, 405);
});

test('read-only (viewer) session can read but gets 403 on stage change / approve / cancel', async () => {
  m.setEnv();
  const f = m.mockFetch(() => m.jsonResponse(200, { total: 0, rows: [] }));
  try {
    const cookie = m.cookieFor('viewer');
    assert.equal((await m.call(leads, { cookie })).status, 200);
    const s = await m.call(leadStage, { method: 'POST', cookie, body: { id: LEAD_ID, stage: 'won' } });
    assert.equal(s.status, 403);
    const a = await m.call(jobAction, { method: 'POST', cookie, body: { job_id: 'job-1', action: 'approve' } });
    assert.equal(a.status, 403);
    assert.equal(f.calls.length, 1, 'only the read call reached the DB');
  } finally { f.restore(); }
});

test('owner mutations require same-origin JSON (CSRF)', async () => {
  m.setEnv();
  const f = m.mockFetch(() => m.jsonResponse(200, {}));
  try {
    const r = await m.call(leadStage, { method: 'POST', cookie: m.cookieFor('owner'), body: { id: LEAD_ID, stage: 'won' }, headers: { origin: 'https://evil.example' } });
    assert.equal(r.status, 403);
    assert.equal(f.calls.length, 0);
  } finally { f.restore(); }
});

test('DB not configured -> 503 "Not configured", no counts', async () => {
  m.setEnv({ db: false });
  const r = await m.call(summary, { cookie: m.cookieFor('owner') });
  assert.equal(r.status, 503);
  assert.equal(r.json.db.status, 'not_configured');
  assert.equal(r.json.db.label, 'Not configured');
  assert.equal(r.json.data, null);
  assert.deepEqual(r.json.db.missing_env, ['SUPABASE_URL', 'SUPABASE_PUBLISHABLE_KEY', 'BL_CLIENT_ID', 'BL_CLIENT_SECRET']);
  assert.doesNotMatch(r.raw, /"(leads|jobs|platforms)":\s*0/);
});

test('service-role / secret keys are refused (Not configured), never sent', async () => {
  const f = m.mockFetch(() => m.jsonResponse(200, {}));
  try {
    for (const key of ['sb_secret_abc123', 'x.' + Buffer.from(JSON.stringify({ role: 'service_role' })).toString('base64url') + '.y']) {
      m.setEnv({ extra: { SUPABASE_PUBLISHABLE_KEY: key } });
      const r = await m.call(summary, { cookie: m.cookieFor('owner') });
      assert.equal(r.status, 503);
      assert.equal(r.json.db.status, 'not_configured');
    }
    m.setEnv({ extra: { SUPABASE_SERVICE_ROLE_KEY: m.DB_ENV.SUPABASE_PUBLISHABLE_KEY } });
    assert.equal((await m.call(summary, { cookie: m.cookieFor('owner') })).json.db.status, 'not_configured');
    assert.equal(f.calls.length, 0);
  } finally { f.restore(); }
});

for (const [name, impl, code] of [
  ['HTTP 503', () => m.jsonResponse(503, { message: 'upstream down' }), 'db_unavailable'],
  ['HTTP 500', () => m.jsonResponse(500, {}), 'db_unavailable'],
  ['network error', () => { throw new TypeError('fetch failed'); }, 'db_unreachable'],
]) {
  test(`DB outage (${name}) -> 503 "Unavailable", data null, no zeros`, async () => {
    m.setEnv();
    const f = m.mockFetch(impl);
    try {
      for (const h of [summary, leads, jobs, audit]) {
        const r = await m.call(h, { cookie: m.cookieFor('owner') });
        assert.equal(r.status, 503);
        assert.equal(r.json.error, code);
        assert.equal(r.json.db.label, 'Unavailable');
        assert.equal(r.json.data, null);
        assert.doesNotMatch(r.raw, /:\s*0[,}]/);
      }
    } finally { f.restore(); }
  });
}

test('DB timeout -> "Unavailable" (abort after timeout)', async () => {
  m.setEnv();
  const { rpc } = require('../../api/_lib/db');
  const r = await rpc('bl_dashboard_summary', {}, {
    timeoutMs: 50,
    fetchImpl: (url, init) => new Promise((_, reject) => init.signal.addEventListener('abort', () => {
      const e = new Error('aborted'); e.name = 'AbortError'; reject(e);
    })),
  });
  assert.equal(r.ok, false);
  assert.equal(r.status, 'unavailable');
  assert.equal(r.code, 'db_timeout');
});

test('DB rejects our credential (401 / 42501) -> "Failed", not zeros', async () => {
  m.setEnv();
  const f = m.mockFetch(() => m.jsonResponse(401, { code: '42501', message: 'permission denied' }));
  try {
    const r = await m.call(summary, { cookie: m.cookieFor('owner') });
    assert.equal(r.status, 502);
    assert.equal(r.json.db.label, 'Failed');
    assert.equal(r.json.data, null);
  } finally { f.restore(); }
});

test('summary success: correct RPC, headers, body; health statuses mapped to the 5-label vocabulary', async () => {
  m.setEnv();
  const f = m.mockFetch(() => m.jsonResponse(200, {
    generated_at: '2026-11-26T00:00:00Z',
    counts: { platforms: 6, leads: 12, jobs: 3, agreements: 0, audit: 40, jobs_by_state: { queued: 1, awaiting_approval: 2 } },
    platforms: [{ id: 'brandlinker', domain: 'brandlinkerbd.com', leads: 4, jobs_open: 1 }],
    health: [
      { component: 'a', status: 'live_verified', detail: { ms: 10 }, checked_at: 'x' },
      { component: 'b', status: 'configured_unverified' }, { component: 'c', status: 'not_configured' },
      { component: 'd', status: 'unavailable' }, { component: 'e', status: 'failed' }, { component: 'f', status: 'green!!' },
    ],
  }));
  try {
    const r = await m.call(summary, { cookie: m.cookieFor('owner') });
    assert.equal(r.status, 200);
    const c = f.calls[0];
    assert.equal(c.url, 'https://enahlkxdplntriipabiu.supabase.co/rest/v1/rpc/bl_dashboard_summary');
    assert.equal(c.init.headers.apikey, 'sb_publishable_testkey');
    assert.equal(c.init.headers.Authorization, 'Bearer sb_publishable_testkey');
    assert.deepEqual(c.body, { p_client: 'bl-dashboard-test', p_secret: 'client-secret-test' });
    assert.equal(r.json.db.label, 'Connected and live verified');
    assert.equal(r.json.data.counts.leads, 12);
    assert.deepEqual(r.json.data.health.map((h) => h.label), [
      'Connected and live verified', 'Configured but not verified', 'Not configured', 'Unavailable', 'Failed', 'Unavailable']);
    assert.doesNotMatch(r.raw, /client-secret-test|sb_publishable_testkey/, 'secrets never echoed to the browser');
  } finally { f.restore(); }
});

test('leads: validation (limit<=100, offset>=0, stage enum, search length, platform)', async () => {
  m.setEnv();
  const f = m.mockFetch(() => m.jsonResponse(200, { total: 0, rows: [] }));
  const cookie = m.cookieFor('owner');
  try {
    for (const qs of ['limit=101', 'limit=0', 'limit=abc', 'offset=-1', 'offset=1.5', 'stage=hacked', 'search=' + 'a'.repeat(101),
      'search=%00x', 'platform=../../etc', 'limit=1e3']) {
      const r = await m.call(leads, { cookie, url: '/api/dashboard/leads?' + qs });
      assert.equal(r.status, 400, qs);
      assert.equal(r.json.error, 'invalid_input');
    }
    assert.equal(f.calls.length, 0, 'invalid input never reaches the DB');
    const ok = await m.call(leads, { cookie, url: '/api/dashboard/leads?limit=100&offset=200&stage=won&search=%20Rahim%20&platform=brandlinker' });
    assert.equal(ok.status, 200);
    assert.deepEqual(f.calls[0].body, { p_client: 'bl-dashboard-test', p_secret: 'client-secret-test', p_platform: 'brandlinker', p_stage: 'won', p_search: 'Rahim', p_limit: 100, p_offset: 200 });
    const def = await m.call(leads, { cookie, url: '/api/dashboard/leads' });
    assert.equal(def.status, 200);
    assert.equal(f.calls[1].body.p_limit, 25);
    assert.equal(f.calls[1].body.p_offset, 0);
    assert.equal(f.calls[1].body.p_stage, null);
  } finally { f.restore(); }
});

test('leads: pagination totals pass through; rows capped at 100; total null is not turned into 0', async () => {
  m.setEnv();
  const rows = Array.from({ length: 150 }, (_, i) => ({ id: String(i), name: 'n' + i, stage: 'new' }));
  const f = m.mockFetch(() => m.jsonResponse(200, { total: 1234, rows }));
  try {
    const r = await m.call(leads, { cookie: m.cookieFor('owner'), url: '/api/dashboard/leads?limit=100&offset=100' });
    assert.equal(r.json.data.total, 1234);
    assert.equal(r.json.data.rows.length, 100);
  } finally { f.restore(); }
  const g = m.mockFetch(() => m.jsonResponse(200, [{ id: 'a1', action: 'x' }]));
  try {
    const r = await m.call(audit, { cookie: m.cookieFor('owner') });
    assert.equal(r.json.data.total, null);
    assert.equal(r.json.data.rows.length, 1);
  } finally { g.restore(); }
});

test('lead stage change: validates UUID + stage enum, calls bl_update_lead_stage', async () => {
  m.setEnv();
  const f = m.mockFetch(() => m.jsonResponse(200, { ok: true }));
  const cookie = m.cookieFor('owner');
  try {
    assert.equal((await m.call(leadStage, { method: 'POST', cookie, body: { id: 'not-a-uuid', stage: 'won' } })).status, 400);
    assert.equal((await m.call(leadStage, { method: 'POST', cookie, body: { id: LEAD_ID, stage: 'archived' } })).status, 400);
    assert.equal((await m.call(leadStage, { method: 'POST', cookie, body: '{bad json' })).status, 400);
    assert.equal(f.calls.length, 0);
    const ok = await m.call(leadStage, { method: 'POST', cookie, body: { id: LEAD_ID, stage: 'qualified' } });
    assert.equal(ok.status, 200);
    assert.match(f.calls[0].url, /rpc\/bl_update_lead_stage$/);
    assert.equal(f.calls[0].body.p_id, LEAD_ID);
    assert.equal(f.calls[0].body.p_stage, 'qualified');
  } finally { f.restore(); }
});

test('jobs: state enum validation; approval center routes to bl_decide_job / bl_cancel_job', async () => {
  m.setEnv();
  const f = m.mockFetch(() => m.jsonResponse(200, { total: 0, rows: [] }));
  const cookie = m.cookieFor('owner');
  try {
    assert.equal((await m.call(jobs, { cookie, url: '/api/dashboard/jobs?state=pending' })).status, 400);
    assert.equal((await m.call(jobs, { cookie, url: '/api/dashboard/jobs?state=awaiting_approval&limit=10' })).status, 200);
    assert.deepEqual(f.calls[0].body.p_state, 'awaiting_approval');
    assert.equal((await m.call(jobAction, { method: 'POST', cookie, body: { job_id: 'j 1;drop', action: 'approve' } })).status, 400);
    assert.equal((await m.call(jobAction, { method: 'POST', cookie, body: { job_id: 'j1', action: 'delete' } })).status, 400);
    assert.equal((await m.call(jobAction, { method: 'POST', cookie, body: { job_id: 'j1', action: 'approve', note: 'x'.repeat(501) } })).status, 400);
    await m.call(jobAction, { method: 'POST', cookie, body: { job_id: 'j1', action: 'approve', note: 'ok' } });
    await m.call(jobAction, { method: 'POST', cookie, body: { job_id: 'j2', action: 'reject' } });
    await m.call(jobAction, { method: 'POST', cookie, body: { job_id: 'j3', action: 'cancel' } });
    const tail = f.calls.slice(-3);
    assert.match(tail[0].url, /bl_decide_job$/); assert.equal(tail[0].body.p_approve, true); assert.equal(tail[0].body.p_note, 'ok');
    assert.match(tail[1].url, /bl_decide_job$/); assert.equal(tail[1].body.p_approve, false);
    assert.match(tail[2].url, /bl_cancel_job$/); assert.equal(tail[2].body.p_job_id, 'j3');
  } finally { f.restore(); }
});

test('audit: limit validation', async () => {
  m.setEnv();
  const f = m.mockFetch(() => m.jsonResponse(200, { total: 0, rows: [] }));
  try {
    assert.equal((await m.call(audit, { cookie: m.cookieFor('viewer'), url: '/api/dashboard/audit?limit=500' })).status, 400);
    assert.equal((await m.call(audit, { cookie: m.cookieFor('viewer'), url: '/api/dashboard/audit?limit=50&offset=50' })).status, 200);
    assert.equal(f.calls[0].body.p_limit, 50);
  } finally { f.restore(); }
});
