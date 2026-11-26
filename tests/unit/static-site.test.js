'use strict';
// Guards the public website: pages + SEO files must stay byte-identical to main, and the dashboard must not be indexed.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..', '..');

const PUBLIC = ['index.html', 'about.html', 'brands.html', 'contact.html', 'robots.txt', 'sitemap.xml', 'llms.txt', 'favicon.svg',
  'assets/css/styles.css', 'assets/js/app.js', 'assets/js/vfx.js'];

test('public pages and SEO files unchanged vs origin/main', (t) => {
  let base;
  try { base = execFileSync('git', ['-C', ROOT, 'rev-parse', '--verify', 'origin/main'], { stdio: 'pipe' }).toString().trim(); } catch { /* no git */ }
  if (!base) return t.skip('origin/main not available');
  for (const f of PUBLIC) {
    const orig = execFileSync('git', ['-C', ROOT, 'show', `${base}:${f}`]);
    assert.ok(orig.equals(fs.readFileSync(path.join(ROOT, f))), `${f} changed`);
  }
});

test('dashboard page is noindex and not in the sitemap; no inline script (CSP script-src self)', () => {
  const html = fs.readFileSync(path.join(ROOT, 'dashboard.html'), 'utf8');
  assert.match(html, /<meta name="robots" content="noindex, nofollow/);
  assert.doesNotMatch(fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8'), /dashboard/);
  assert.doesNotMatch(html, /<script(?![^>]*\bsrc=)[^>]*>/);
  const vercel = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
  const rule = vercel.headers.find((h) => h.source.startsWith('/dashboard'));
  assert.ok(rule.headers.some((h) => h.key === 'Content-Security-Policy' && /script-src 'self'/.test(h.value)));
});

test('dashboard client never uses innerHTML/outerHTML/insertAdjacentHTML/document.write', () => {
  const js = fs.readFileSync(path.join(ROOT, 'assets/js/dashboard.js'), 'utf8');
  assert.doesNotMatch(js, /innerHTML|outerHTML|insertAdjacentHTML|document\.write/);
});

test('no service-role key usage and no committed env files', () => {
  const files = execFileSync('git', ['-C', ROOT, 'ls-files'], { stdio: 'pipe' }).toString().split('\n').filter(Boolean);
  assert.ok(!files.some((f) => /(^|\/)\.env(\.|$)/.test(f)), 'no .env files tracked');
  for (const f of files.filter((f) => f.startsWith('api/') && f.endsWith('.js'))) {
    const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
    // The only allowed mention is the refusal guard in db.js.
    const uses = src.match(/process\.env\.(SUPABASE_SERVICE_ROLE_KEY|BL_SUPABASE_SERVICE_KEY)|env\.(SUPABASE_SERVICE_ROLE_KEY|BL_SUPABASE_SERVICE_KEY)/g) || [];
    if (f !== 'api/_lib/db.js') assert.equal(uses.length, 0, f);
  }
});
