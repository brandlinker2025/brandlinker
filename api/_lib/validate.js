'use strict';
// Input validation for dashboard API parameters. Every function returns {value} or {error}.

const LEAD_STAGES = Object.freeze(['new', 'contacted', 'qualified', 'won', 'lost']);
const JOB_STATES = Object.freeze(['queued', 'running', 'awaiting_approval', 'succeeded', 'failed', 'cancelled']);
const MAX_LIMIT = 100;
const MAX_OFFSET = 1000000;
const MAX_SEARCH = 100;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// eslint-disable-next-line no-control-regex
const CONTROL_RE = /[\u0000-\u001f\u007f]/;

function int(raw, { name, min, max, def }) {
  if (raw === undefined || raw === null || raw === '') return { value: def };
  const s = String(raw);
  if (!/^-?\d{1,9}$/.test(s)) return { error: `${name} must be an integer` };
  const n = Number.parseInt(s, 10);
  if (n < min || n > max) return { error: `${name} must be between ${min} and ${max}` };
  return { value: n };
}

function limit(raw, def = 25) {
  return int(raw, { name: 'limit', min: 1, max: MAX_LIMIT, def });
}
function offset(raw) {
  return int(raw, { name: 'offset', min: 0, max: MAX_OFFSET, def: 0 });
}

function optionalEnum(raw, allowed, name) {
  if (raw === undefined || raw === null || raw === '') return { value: null };
  if (typeof raw !== 'string' || !allowed.includes(raw)) return { error: `${name} must be one of: ${allowed.join(', ')}` };
  return { value: raw };
}
function requiredEnum(raw, allowed, name) {
  if (raw === undefined || raw === null || raw === '') return { error: `${name} is required` };
  return optionalEnum(raw, allowed, name);
}

function search(raw) {
  if (raw === undefined || raw === null || raw === '') return { value: null };
  if (typeof raw !== 'string') return { error: 'search must be a string' };
  const s = raw.trim();
  if (s.length > MAX_SEARCH) return { error: `search must be at most ${MAX_SEARCH} characters` };
  if (CONTROL_RE.test(s)) return { error: 'search contains control characters' };
  return { value: s || null };
}

function platform(raw) {
  if (raw === undefined || raw === null || raw === '') return { value: null };
  if (typeof raw !== 'string' || !/^[a-z0-9][a-z0-9._-]{0,63}$/i.test(raw)) return { error: 'platform is invalid' };
  return { value: raw };
}

function uuid(raw, name = 'id') {
  if (typeof raw !== 'string' || !UUID_RE.test(raw)) return { error: `${name} must be a UUID` };
  return { value: raw.toLowerCase() };
}

function jobId(raw) {
  if (typeof raw !== 'string' || !/^[A-Za-z0-9._:-]{1,128}$/.test(raw)) return { error: 'job_id is invalid' };
  return { value: raw };
}

function bool(raw, name) {
  if (typeof raw !== 'boolean') return { error: `${name} must be true or false` };
  return { value: raw };
}

function note(raw) {
  if (raw === undefined || raw === null || raw === '') return { value: null };
  if (typeof raw !== 'string') return { error: 'note must be a string' };
  if (raw.length > 500) return { error: 'note must be at most 500 characters' };
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(raw)) return { error: 'note contains control characters' };
  return { value: raw.trim() || null };
}

// Runs a map of validators; returns {values} or {errors}.
function collect(spec) {
  const values = {};
  const errors = [];
  for (const [key, result] of Object.entries(spec)) {
    if (result.error) errors.push(result.error);
    else values[key] = result.value;
  }
  return errors.length ? { errors } : { values };
}

module.exports = {
  LEAD_STAGES,
  JOB_STATES,
  MAX_LIMIT,
  limit,
  offset,
  optionalEnum,
  requiredEnum,
  search,
  platform,
  uuid,
  jobId,
  bool,
  note,
  collect,
};
