/* BrandLinker private business dashboard.
 * Security rules for this file:
 *  - All data from the API is rendered with textContent / createTextNode only (never HTML string sinks).
 *  - When a DB call fails, tiles show the status label ("Not configured" / "Unavailable" / "Failed"), never 0.
 */
(function () {
  'use strict';

  var LABELS = {
    live_verified: 'Connected and live verified',
    configured_unverified: 'Configured but not verified',
    not_configured: 'Not configured',
    unavailable: 'Unavailable',
    failed: 'Failed'
  };
  var STAGES = ['new', 'contacted', 'qualified', 'won', 'lost'];
  var PENDING = [
    ['Sales, revenue, expenses & profit', 'No finance tables or RPCs in the central DB contract.'],
    ['Vendors / suppliers', 'No vendor RPCs in the central DB contract.'],
    ['Social content workflow', 'No content-calendar RPCs in the central DB contract.'],
    ['Notifications', 'No notification RPCs in the central DB contract.']
  ];

  var state = { role: null, leads: { offset: 0 }, jobs: { offset: 0 }, audit: { offset: 0 } };

  function $(id) { return document.getElementById(id); }

  // el('td', {class:'x'}, 'text' | Node | [..]) — text children become text nodes.
  function el(tag, attrs, children) {
    var n = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === 'class') n.className = attrs[k];
        else if (k === 'text') n.textContent = attrs[k];
        else if (k.indexOf('on') === 0 && typeof attrs[k] === 'function') n.addEventListener(k.slice(2), attrs[k]);
        else n.setAttribute(k, attrs[k]);
      });
    }
    [].concat(children === undefined ? [] : children).forEach(function (c) {
      if (c === null || c === undefined) return;
      n.appendChild(typeof c === 'object' && c.nodeType ? c : document.createTextNode(String(c)));
    });
    return n;
  }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); return node; }
  function text(v) { return v === null || v === undefined || v === '' ? '—' : String(v); }
  function fmtDate(v) {
    if (!v) return '—';
    var d = new Date(v);
    return isNaN(d.getTime()) ? String(v) : d.toLocaleString();
  }

  function setStatus(node, status, extra) {
    node.className = 'status status--' + (LABELS[status] ? status : 'unavailable');
    node.textContent = (LABELS[status] || LABELS.unavailable) + (extra ? ' — ' + extra : '');
  }

  function api(path, opts) {
    opts = opts || {};
    var init = { method: opts.method || 'GET', credentials: 'same-origin', headers: { Accept: 'application/json' } };
    if (opts.body) {
      init.headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(opts.body);
    }
    return fetch(path, init).then(function (r) {
      return r.json().catch(function () { return null; }).then(function (b) {
        if (r.status === 401 && path.indexOf('/api/auth/') !== 0) showLogin();
        return { status: r.status, body: b || {} };
      });
    }, function () {
      return { status: 0, body: { error: 'network', db: { status: 'unavailable' } } };
    });
  }

  function dbStatusOf(res) {
    if (res.status === 200) return 'live_verified';
    var s = res.body && res.body.db && res.body.db.status;
    return LABELS[s] ? s : 'unavailable';
  }

  // ---------- auth ----------
  function showLogin(authConfigured) {
    $('app-view').hidden = true;
    $('session-bar').hidden = true;
    $('login-view').hidden = false;
    if (authConfigured === false) {
      $('auth-not-configured').hidden = false;
      $('login-form').hidden = true;
    } else {
      $('auth-not-configured').hidden = true;
      $('login-form').hidden = false;
    }
  }

  function showApp(sess) {
    state.role = sess.role;
    $('login-view').hidden = true;
    $('app-view').hidden = false;
    $('session-bar').hidden = false;
    $('session-role').textContent = sess.role === 'owner' ? 'Owner' : 'Read-only';
    $('session-exp').textContent = sess.expires_at ? 'Session ends ' + fmtDate(sess.expires_at) : '';
    $('readonly-note').hidden = sess.role === 'owner';
    loadOverview();
  }

  function boot() {
    api('/api/auth/session').then(function (r) {
      if (r.status === 200 && r.body.authenticated) showApp(r.body);
      else showLogin(r.status === 200 ? r.body.auth_configured : undefined);
    });
  }

  $('login-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var pw = $('password');
    $('login-error').textContent = '';
    api('/api/auth/login', { method: 'POST', body: { password: pw.value } }).then(function (r) {
      pw.value = '';
      if (r.status === 200) return boot();
      if (r.status === 429) $('login-error').textContent = 'Too many attempts. Try again in ' + Math.ceil((r.body.retry_after || 900) / 60) + ' min.';
      else if (r.status === 503) showLogin(false);
      else $('login-error').textContent = 'Sign-in failed.';
    });
  });

  $('logout-btn').addEventListener('click', function () {
    api('/api/auth/logout', { method: 'POST', body: {} }).then(function () { state.role = null; showLogin(true); });
  });

  // ---------- tabs ----------
  var loaders = {
    overview: loadOverview,
    leads: loadLeads,
    jobs: loadJobs,
    audit: loadAudit,
    health: loadOverview,
    pending: renderPending
  };
  Array.prototype.forEach.call(document.querySelectorAll('.tabs button'), function (b) {
    b.addEventListener('click', function () {
      var tab = b.getAttribute('data-tab');
      Array.prototype.forEach.call(document.querySelectorAll('.tabs button'), function (x) { x.classList.toggle('is-active', x === b); });
      Array.prototype.forEach.call(document.querySelectorAll('[data-panel]'), function (p) { p.hidden = p.getAttribute('data-panel') !== tab; });
      loaders[tab]();
    });
  });

  // ---------- overview + health ----------
  var COUNT_KEYS = [['leads', 'Leads'], ['jobs', 'Jobs'], ['platforms', 'Platforms'], ['agreements', 'Agreements'], ['audit', 'Audit events']];

  function tile(label, value, status) {
    var ok = status === 'live_verified' && typeof value === 'number';
    return el('div', { class: 'tile' }, [
      el('div', { class: 'tile__label', text: label }),
      el('div', { class: 'tile__value' + (ok ? '' : ' tile__value--na'), text: ok ? value.toLocaleString() : (status === 'live_verified' ? 'Not reported' : LABELS[status]) })
    ]);
  }

  function loadOverview() {
    api('/api/dashboard/summary').then(function (r) {
      if (r.status === 401) return;
      var status = dbStatusOf(r);
      var d = r.status === 200 ? r.body.data : null;
      setStatus($('db-status'), status, status === 'not_configured' ? 'central database credentials not set' : '');
      var counts = clear($('counts'));
      COUNT_KEYS.forEach(function (k) { counts.appendChild(tile(k[1], d ? d.counts[k[0]] : null, status)); });
      if (d && d.counts.jobs_by_state) {
        Object.keys(d.counts.jobs_by_state).forEach(function (s) {
          counts.appendChild(tile('Jobs: ' + s, d.counts.jobs_by_state[s], status));
        });
      }
      var pl = clear($('platforms'));
      if (!d) pl.appendChild(el('p', { class: 'muted', text: LABELS[status] }));
      else if (!d.platforms.length) pl.appendChild(el('p', { class: 'muted', text: 'No platforms returned.' }));
      else {
        pl.appendChild(table(['Platform', 'Domain', 'Leads', 'Open jobs'], d.platforms.map(function (p) {
          return [text(p.id), text(p.domain), text(p.leads), text(p.jobs_open)];
        })));
      }
      $('generated-at').textContent = d && d.generated_at ? 'Generated ' + fmtDate(d.generated_at) : '';
      renderHealth(status, d);
    });
  }

  function renderHealth(dbStatus, d) {
    var list = clear($('health-list'));
    var rows = [['Central database (dashboard access)', dbStatus, dbStatus === 'live_verified' ? 'Summary RPC answered' : '', '']];
    if (d) d.health.forEach(function (h) { rows.push([text(h.component), h.status, h.detail || '', h.checked_at]); });
    else rows.push(['Ecosystem components', dbStatus, 'Health is reported by the central database, which is ' + LABELS[dbStatus].toLowerCase() + '.', '']);
    var t = table(['Component', 'Status', 'Detail', 'Checked'], rows.map(function (h) {
      var s = el('span'); setStatus(s, h[1]);
      return [h[0], s, text(h[2]), fmtDate(h[3])];
    }));
    list.appendChild(t);
  }

  function renderPending() {
    var p = clear($('pending-list'));
    PENDING.forEach(function (x) {
      p.appendChild(el('div', { class: 'tile' }, [
        el('div', { class: 'tile__label', text: x[0] }),
        el('div', { class: 'tile__value tile__value--na', text: 'Not yet connected' }),
        el('p', { class: 'muted small', text: x[1] })
      ]));
    });
  }

  // ---------- table + pager helpers ----------
  function table(headers, rows) {
    return el('div', { class: 'table-wrap' }, el('table', null, [
      el('thead', null, el('tr', null, headers.map(function (h) { return el('th', { text: h }); }))),
      el('tbody', null, rows.map(function (r) { return el('tr', null, r.map(function (c) { return el('td', null, c); })); }))
    ]));
  }

  function pager(node, page, total, limit, onMove) {
    clear(node);
    var start = page.rows ? page.offset + 1 : 0;
    var info = total === null || total === undefined ? 'Total not reported' : (total === 0 ? 'No results' : start + '–' + (page.offset + page.count) + ' of ' + total);
    node.appendChild(el('button', { class: 'btn btn--ghost btn--sm', type: 'button', onclick: function () { onMove(Math.max(0, page.offset - limit)); } }, 'Previous'));
    node.appendChild(el('span', { class: 'muted', text: info }));
    var next = el('button', { class: 'btn btn--ghost btn--sm', type: 'button', onclick: function () { onMove(page.offset + limit); } }, 'Next');
    if (page.offset === 0) node.firstChild.disabled = true;
    if (typeof total === 'number' ? page.offset + limit >= total : page.count < limit) next.disabled = true;
    node.appendChild(next);
  }

  function failBox(node, res) {
    var s = dbStatusOf(res);
    var box = el('div', { class: 'status status--' + s });
    box.appendChild(el('strong', { text: LABELS[s] }));
    if (res.status === 400) box.appendChild(document.createTextNode(' — invalid filter: ' + [].concat(res.body.details || res.body.error || []).join('; ')));
    clear(node).appendChild(box);
  }

  function formQuery(form, extra) {
    var q = [];
    Array.prototype.forEach.call(form.elements, function (f) {
      if (f.name && f.value) q.push(encodeURIComponent(f.name) + '=' + encodeURIComponent(f.value));
    });
    Object.keys(extra).forEach(function (k) { q.push(k + '=' + encodeURIComponent(extra[k])); });
    return q.join('&');
  }

  // ---------- leads ----------
  function loadLeads() {
    var form = $('leads-filter');
    var limit = parseInt(form.elements.limit.value, 10) || 25;
    api('/api/dashboard/leads?' + formQuery(form, { offset: state.leads.offset })).then(function (r) {
      if (r.status === 401) return;
      setStatus($('leads-status'), dbStatusOf(r));
      var wrap = $('leads-table');
      if (r.status !== 200) { failBox(wrap, r); clear($('leads-pager')); return; }
      var d = r.body.data;
      var owner = state.role === 'owner';
      clear(wrap).appendChild(d.rows.length ? table(['Name', 'Contact', 'Platform', 'Stage', 'Consent', 'Created'], d.rows.map(function (l) {
        var stageCell;
        if (owner) {
          stageCell = el('select', { 'aria-label': 'Stage', onchange: function (e) { changeStage(l.id, e.target, l.stage); } },
            STAGES.map(function (s) { var o = el('option', { value: s, text: s }); if (s === l.stage) o.selected = true; return o; }));
        } else stageCell = text(l.stage);
        return [text(l.name), text(l.contact), text(l.platform_id), stageCell, fmtDate(l.consent_at), fmtDate(l.created_at)];
      })) : el('p', { class: 'muted', text: 'No leads match.' }));
      pager($('leads-pager'), { offset: state.leads.offset, count: d.rows.length, rows: d.rows.length }, d.total, limit, function (o) { state.leads.offset = o; loadLeads(); });
    });
  }

  function changeStage(id, select, previous) {
    select.disabled = true;
    api('/api/dashboard/lead-stage', { method: 'POST', body: { id: id, stage: select.value } }).then(function (r) {
      select.disabled = false;
      if (r.status !== 200) { select.value = previous; alertStatus(r); } else loadLeads();
    });
  }

  function alertStatus(r) {
    var msg = r.status === 403 ? 'Not allowed for this session.' : 'Change failed: ' + LABELS[dbStatusOf(r)];
    window.alert(msg);
  }

  $('leads-filter').addEventListener('submit', function (e) { e.preventDefault(); state.leads.offset = 0; loadLeads(); });

  // ---------- jobs / approvals ----------
  function loadJobs() {
    var form = $('jobs-filter');
    var limit = parseInt(form.elements.limit.value, 10) || 25;
    var q = 'limit=' + limit + '&offset=' + state.jobs.offset + (form.elements.state.value ? '&state=' + encodeURIComponent(form.elements.state.value) : '');
    api('/api/dashboard/jobs?' + q).then(function (r) {
      if (r.status === 401) return;
      setStatus($('jobs-status'), dbStatusOf(r));
      var wrap = $('jobs-table');
      if (r.status !== 200) { failBox(wrap, r); clear($('jobs-pager')); return; }
      var d = r.body.data;
      var owner = state.role === 'owner';
      clear(wrap).appendChild(d.rows.length ? table(['Job', 'Agent', 'State', 'Target', 'Attempts', 'Last error', 'Created', 'Actions'], d.rows.map(function (j) {
        var actions = el('div', { class: 'row-actions' });
        if (owner && j.state === 'awaiting_approval') {
          actions.appendChild(el('button', { class: 'btn btn--sm', type: 'button', onclick: function () { jobAction(j.id, 'approve'); } }, 'Approve'));
          actions.appendChild(el('button', { class: 'btn btn--ghost btn--sm', type: 'button', onclick: function () { jobAction(j.id, 'reject'); } }, 'Reject'));
        }
        if (owner && (j.state === 'queued' || j.state === 'awaiting_approval' || j.state === 'running')) {
          actions.appendChild(el('button', { class: 'btn btn--ghost btn--sm', type: 'button', onclick: function () { jobAction(j.id, 'cancel'); } }, 'Cancel'));
        }
        return [text(j.id), text(j.agent_id), text(j.state), text(j.target_platform),
          j.attempts === null ? '—' : j.attempts + (j.max_attempts !== null ? '/' + j.max_attempts : ''), text(j.last_error), fmtDate(j.created_at), actions];
      })) : el('p', { class: 'muted', text: 'No jobs in this state.' }));
      pager($('jobs-pager'), { offset: state.jobs.offset, count: d.rows.length, rows: d.rows.length }, d.total, limit, function (o) { state.jobs.offset = o; loadJobs(); });
    });
  }

  function jobAction(id, action) {
    var note = null;
    if (action !== 'cancel') {
      note = window.prompt((action === 'approve' ? 'Approve' : 'Reject') + ' job ' + id + '? Optional note:', '');
      if (note === null) return;
    } else if (!window.confirm('Cancel job ' + id + '?')) return;
    api('/api/dashboard/job-action', { method: 'POST', body: { job_id: id, action: action, note: note } }).then(function (r) {
      if (r.status !== 200) alertStatus(r);
      loadJobs();
    });
  }

  $('jobs-filter').addEventListener('submit', function (e) { e.preventDefault(); state.jobs.offset = 0; loadJobs(); });

  // ---------- audit ----------
  function loadAudit() {
    var limit = 50;
    api('/api/dashboard/audit?limit=' + limit + '&offset=' + state.audit.offset).then(function (r) {
      if (r.status === 401) return;
      setStatus($('audit-status'), dbStatusOf(r));
      var wrap = $('audit-table');
      if (r.status !== 200) { failBox(wrap, r); clear($('audit-pager')); return; }
      var d = r.body.data;
      clear(wrap).appendChild(d.rows.length ? table(['When', 'Actor', 'Action', 'Target', 'Detail'], d.rows.map(function (a) {
        return [fmtDate(a.at), text(a.actor), text(a.action), text(a.target), text(a.detail)];
      })) : el('p', { class: 'muted', text: 'No audit events.' }));
      pager($('audit-pager'), { offset: state.audit.offset, count: d.rows.length, rows: d.rows.length }, d.total, limit, function (o) { state.audit.offset = o; loadAudit(); });
    });
  }

  boot();
})();
