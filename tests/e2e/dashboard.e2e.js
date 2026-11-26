'use strict';
// Real-browser test (Chromium via Playwright) against the local Vercel-like dev server.
// The central DB is mocked by replacing the server process's global fetch — no network, no paid services.
process.env.DASHBOARD_FAIL_DELAY_MS = '1';
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { createServer } = require('../support/dev-server');
const m = require('../support/mock');

const XSS_NAME = '<img src=x onerror="window.__xss=1">"><script>window.__xss=2</script>';
let dbMode = 'live';
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, init) => {
  if (!String(url).startsWith('https://enahlkxdplntriipabiu.supabase.co/')) return realFetch(url, init);
  if (dbMode === 'down') return m.jsonResponse(503, { message: 'down' });
  const fn = String(url).split('/').pop();
  if (fn === 'bl_dashboard_summary') {
    return m.jsonResponse(200, { generated_at: new Date().toISOString(), counts: { platforms: 2, leads: 1, jobs: 1, agreements: 0, audit: 3, jobs_by_state: { awaiting_approval: 1 } },
      platforms: [{ id: 'brandlinker', domain: 'brandlinkerbd.com', leads: 1, jobs_open: 1 }],
      health: [{ component: 'db', status: 'live_verified', detail: 'ok', checked_at: new Date().toISOString() }, { component: 'n8n', status: 'not_configured' }] });
  }
  if (fn === 'bl_list_leads') {
    return m.jsonResponse(200, { total: 1, rows: [{ id: '3f0c8a52-6d0e-4c4c-9a55-2b8f0f1d2e11', platform_id: 'brandlinker', name: XSS_NAME, contact: '<b>bold</b>@x', stage: 'new', consent_at: '2026-11-01T00:00:00Z', created_at: '2026-11-01T00:00:00Z' }] });
  }
  if (fn === 'bl_list_jobs') return m.jsonResponse(200, { total: 1, rows: [{ id: 'job-1', agent_id: 'agent<x>', state: 'awaiting_approval', attempts: 0, max_attempts: 3 }] });
  if (fn === 'bl_list_audit') return m.jsonResponse(200, { total: 0, rows: [] });
  return m.jsonResponse(404, { code: 'P0002' });
};

const results = [];
async function step(name, fn) {
  try { await fn(); results.push(['PASS', name]); } catch (e) { results.push(['FAIL', name, e.message.split('\n').slice(0,6).join(' ')]); }
}

(async () => {
  const server = createServer();
  await new Promise((r) => server.listen(0, r));
  const base = `http://localhost:${server.address().port}`;
  const browser = await chromium.launch();
  try {
    await step('public pages return 200 and keep their titles', async () => {
      const ctx = await browser.newContext({ deviceScaleFactor: 1 });
      const page = await ctx.newPage();
      for (const p of ['/', '/about', '/brands', '/contact', '/robots.txt', '/sitemap.xml']) {
        const r = await page.goto(base + p);
        assert.equal(r.status(), 200, p);
      }
      await page.goto(base + '/');
      assert.match(await page.title(), /BrandLinker/);
      await ctx.close();
    });

    await step('auth env missing: dashboard shows "Not configured", API 401', async () => {
      m.setEnv({ auth: false, db: false });
      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      await page.goto(base + '/dashboard');
      await page.waitForSelector('#auth-not-configured:not([hidden])');
      assert.match(await page.textContent('#auth-not-configured'), /Not configured/);
      const api = await page.evaluate(() => fetch('/api/dashboard/summary').then((r) => r.status));
      assert.equal(api, 401);
      await ctx.close();
    });

    m.setEnv({ auth: true, db: false });
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const dialogs = [];
    page.on('dialog', (d) => { dialogs.push(d.message()); d.dismiss(); });

    await step('wrong password shows error, no session', async () => {
      await page.goto(base + '/dashboard');
      await page.fill('#password', 'wrong-password');
      await page.click('#login-form button');
      await page.waitForFunction(() => document.getElementById('login-error').textContent.length > 0);
      assert.equal(await page.isHidden('#app-view'), true);
    });

    await step('owner login, DB not configured: tiles say "Not configured", no zeros', async () => {
      await page.fill('#password', m.OWNER_PW);
      await page.click('#login-form button');
      await page.waitForSelector('#app-view:not([hidden])');
      await page.waitForFunction(() => document.querySelectorAll('#counts .tile').length > 0);
      const vals = await page.$$eval('#counts .tile__value', (n) => n.map((x) => x.textContent));
      assert.ok(vals.length >= 5 && vals.every((v) => v === 'Not configured'), JSON.stringify(vals));
      assert.match(await page.textContent('#db-status'), /Not configured/);
      const cookies = await ctx.cookies();
      const c = cookies.find((x) => x.name === '__Host-bl_dash');
      assert.ok(c && c.httpOnly && c.secure && c.sameSite === 'Strict', 'cookie flags');
      assert.equal(await page.evaluate(() => document.cookie.includes('bl_dash')), false, 'cookie not readable by JS');
    });

    await step('DB outage (503): tiles and leads say "Unavailable", never 0', async () => {
      m.setEnv({ auth: true, db: true });
      dbMode = 'down';
      await page.reload();
      await page.waitForFunction(() => /Unavailable/.test(document.getElementById('db-status').textContent));
      const vals = await page.$$eval('#counts .tile__value', (n) => n.map((x) => x.textContent));
      assert.ok(vals.every((v) => v === 'Unavailable'), JSON.stringify(vals));
      assert.ok(!vals.includes('0'));
      await page.click('[data-tab=leads]');
      await page.waitForFunction(() => /Unavailable/.test(document.getElementById('leads-table').textContent));
      await page.click('[data-tab=health]');
      assert.match(await page.textContent('#health-list'), /Unavailable/);
      assert.doesNotMatch(await page.textContent('#health-list'), /live verified/);
    });

    await step('DB live: counts render; malicious lead name rendered as inert text (XSS-safe)', async () => {
      dbMode = 'live';
      await page.click('[data-tab=overview]');
      await page.waitForFunction(() => /live verified/.test(document.getElementById('db-status').textContent));
      await page.click('[data-tab=leads]');
      await page.waitForFunction(() => document.querySelectorAll('#leads-table tbody tr').length === 1);
      const cellText = await page.textContent('#leads-table tbody tr td');
      assert.equal(cellText, XSS_NAME);
      assert.equal(await page.$$eval('#leads-table img, #leads-table script, #leads-table b', (n) => n.length), 0);
      await page.waitForTimeout(200);
      assert.equal(await page.evaluate(() => window.__xss), undefined);
      assert.equal(await page.$$eval('#leads-table select', (n) => n.length), 1, 'owner can change stage');
      await page.click('[data-tab=jobs]');
      await page.waitForFunction(() => document.querySelectorAll('#jobs-table tbody tr').length === 1);
      assert.equal(await page.$$eval('#jobs-table button', (n) => n.map((b) => b.textContent).join(',')), 'Approve,Reject,Cancel');
      await page.click('[data-tab=pending]');
      assert.equal((await page.textContent('#pending-list')).match(/Not yet connected/g).length, 4);
    });

    await step('logout clears session; API is 401 afterwards', async () => {
      await page.click('#logout-btn');
      await page.waitForSelector('#login-view:not([hidden])');
      assert.equal((await ctx.cookies()).some((c) => c.name === '__Host-bl_dash'), false);
      assert.equal(await page.evaluate(() => fetch('/api/dashboard/summary').then((r) => r.status)), 401);
    });

    await step('viewer (read-only): no stage selector, no approval buttons', async () => {
      await page.fill('#password', m.VIEWER_PW);
      await page.click('#login-form button');
      await page.waitForSelector('#app-view:not([hidden])');
      assert.equal(await page.isVisible('#readonly-note'), true);
      await page.click('[data-tab=leads]');
      await page.waitForFunction(() => document.querySelectorAll('#leads-table tbody tr').length === 1);
      assert.equal(await page.$$eval('#leads-table select', (n) => n.length), 0);
      await page.click('[data-tab=jobs]');
      await page.waitForFunction(() => document.querySelectorAll('#jobs-table tbody tr').length === 1);
      assert.equal(await page.$$eval('#jobs-table button', (n) => n.length), 0);
      const st = await page.evaluate(() => fetch('/api/dashboard/lead-stage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: '3f0c8a52-6d0e-4c4c-9a55-2b8f0f1d2e11', stage: 'won' }) }).then((r) => r.status));
      assert.equal(st, 403);
    });

    await step('CSP: dashboard served with script-src self and noindex headers', async () => {
      const r = await page.goto(base + '/dashboard');
      assert.match(r.headers()['content-security-policy'], /script-src 'self'/);
      assert.match(r.headers()['x-robots-tag'], /noindex/);
    });
    assert.deepEqual(dialogs, []);
    await ctx.close();
  } finally {
    await browser.close();
    server.close();
  }
  for (const r of results) console.log(r.join(' | '));
  const failed = results.filter((r) => r[0] === 'FAIL').length;
  console.log(`e2e: ${results.length - failed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
