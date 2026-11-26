'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { authConfig, checkCredentials } = require('../../api/_lib/session');

test('owner can be configured with a long plain password (Sensitive env) instead of a hash', () => {
  const env = { DASHBOARD_SESSION_SECRET: 's'.repeat(40), DASHBOARD_OWNER_PASSWORD: 'Correct-Horse-Battery-Staple-42' };
  const cfg = authConfig(env);
  assert.equal(cfg.configured, true);
  assert.equal(checkCredentials('Correct-Horse-Battery-Staple-42', cfg), 'owner');
  assert.equal(checkCredentials('Correct-Horse-Battery-Staple-41', cfg), null);
});

test('a short plain password is refused (fails closed)', () => {
  const cfg = authConfig({ DASHBOARD_SESSION_SECRET: 's'.repeat(40), DASHBOARD_OWNER_PASSWORD: 'short-pass' });
  assert.equal(cfg.configured, false);
  assert.equal(checkCredentials('short-pass', cfg), null);
});
