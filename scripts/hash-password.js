#!/usr/bin/env node
'use strict';
// Generates a scrypt hash for DASHBOARD_OWNER_PASSWORD_HASH / DASHBOARD_VIEWER_PASSWORD_HASH.
// Usage: node scripts/hash-password.js   (reads the password from stdin without echoing it in shell history)
const { hashPassword } = require('../api/_lib/session');

let input = '';
process.stdin.setEncoding('utf8');
if (process.stdin.isTTY) process.stderr.write('Password (min 12 chars), then Enter: ');
process.stdin.on('data', (c) => {
  input += c;
  if (input.includes('\n')) done();
});
process.stdin.on('end', done);
let finished = false;
function done() {
  if (finished) return;
  finished = true;
  const pw = input.split('\n')[0].replace(/\r$/, '');
  if (pw.length < 12) {
    process.stderr.write('\nPassword must be at least 12 characters.\n');
    process.exit(1);
  }
  process.stdout.write(hashPassword(pw) + '\n');
  process.exit(0);
}
