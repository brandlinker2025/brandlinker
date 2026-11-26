#!/usr/bin/env node
'use strict';
// "Build" check for a no-bundler project: every JS file must parse, every function must export a handler,
// and every public page referenced in sitemap.xml must exist.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const root = path.join(__dirname, '..');
let failures = 0;
function walk(d) {
  return fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(d, e.name);
    if (e.isDirectory()) return e.name === 'node_modules' ? [] : walk(p);
    return p.endsWith('.js') ? [p] : [];
  });
}
const files = [...walk(path.join(root, 'api')), ...walk(path.join(root, 'assets/js')), ...walk(path.join(root, 'scripts')), ...walk(path.join(root, 'tests'))];
for (const f of files) {
  try { execFileSync(process.execPath, ['--check', f], { stdio: 'pipe' }); } catch (e) { failures++; console.error('SYNTAX', f, String(e.stderr)); }
}
for (const f of walk(path.join(root, 'api')).filter((f) => !f.includes(`${path.sep}_lib${path.sep}`))) {
  const mod = require(f);
  if (typeof mod !== 'function') { failures++; console.error('NO HANDLER', f); }
}
const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
for (const m of sitemap.matchAll(/<loc>https:\/\/www\.brandlinkerbd\.com\/([^<]*)<\/loc>/g)) {
  const page = m[1] === '' ? 'index.html' : m[1] + '.html';
  if (!fs.existsSync(path.join(root, page))) { failures++; console.error('MISSING PAGE', page); }
}
console.log(`checked ${files.length} js files; failures: ${failures}`);
process.exit(failures ? 1 : 0);
