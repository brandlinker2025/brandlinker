'use strict';
// Local server that mimics the Vercel deployment: static files with cleanUrls + /api functions + vercel.json headers.
// Used by the e2e test and `npm run dev`. Not deployed (.vercelignore).
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const vercel = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml',
  '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.xml': 'application/xml', '.txt': 'text/plain' };

function applyHeaders(pathname, res) {
  for (const rule of vercel.headers) {
    const re = new RegExp('^' + rule.source.replace(/\(\.\*\)/g, '(.*)') + '$');
    if (re.test(pathname)) for (const h of rule.headers) res.setHeader(h.key, h.value);
  }
}

function createServer() {
  return http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const p = decodeURIComponent(url.pathname);
    applyHeaders(p, res);
    if (p.startsWith('/api/')) {
      if (p.includes('..') || p.includes('/_')) { res.statusCode = 404; return res.end(); }
      const file = path.join(ROOT, p + '.js');
      if (!fs.existsSync(file)) { res.statusCode = 404; return res.end(); }
      req.query = Object.fromEntries(url.searchParams);
      try { return await require(file)(req, res); } catch (e) { res.statusCode = 500; return res.end(); }
    }
    let file = p === '/' ? '/index.html' : p;
    if (!path.extname(file)) file += '.html';
    const abs = path.normalize(path.join(ROOT, file));
    if (!abs.startsWith(ROOT) || abs.includes(`${path.sep}tests${path.sep}`) || !fs.existsSync(abs) || fs.statSync(abs).isDirectory()) {
      res.statusCode = 404; return res.end('not found');
    }
    res.setHeader('Content-Type', TYPES[path.extname(abs)] || 'application/octet-stream');
    fs.createReadStream(abs).pipe(res);
  });
}

if (require.main === module) {
  const port = Number(process.env.PORT || 3999);
  createServer().listen(port, () => console.log(`dev server on http://localhost:${port}`));
}
module.exports = { createServer };
