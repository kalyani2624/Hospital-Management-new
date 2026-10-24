/* Govt Hospital Hub - shared frontend logic. No build step. Works from file:// via CORS. */
(function () {
  'use strict';
  var API = (window.HUB_API_BASE || 'http://localhost:8086/api').replace(/\/$/, '');
  window.HUB_API_BASE = API;

  var ROLES = ['SuperAdmin', 'HospitalAdmin', 'Doctor', 'Receptionist'];
  var ROLE_HOME = { SuperAdmin: 'index.html', HospitalAdmin: 'index.html', Doctor: 'appointments.html', Receptionist: 'patients.html' };

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }

  function getRole() { return localStorage.getItem('hub.role') || 'SuperAdmin'; }
  function setRole(r) { localStorage.setItem('hub.role', r); renderRole(); }
  function getHospitalScope() { return localStorage.getItem('hub.hospitalScope') || 'all'; }

  function renderRole() {
    var role = getRole();
    $all('[data-role-badge]').forEach(function (el) { el.textContent = 'Role: ' + role; });
    $all('[data-role-select]').forEach(function (el) { el.value = role; });
    var banner = $('[data-scope-banner]');
    if (banner) {
      if (role === 'SuperAdmin') {
        banner.innerHTML = 'You are viewing <strong>All Hospitals (ministry view)</strong>. Scope switcher enabled.';
      } else {
        var hid = localStorage.getItem('hub.myHospitalId') || '1';
        var hname = localStorage.getItem('hub.myHospitalName') || ('Hospital #' + hid);
        banner.innerHTML = 'You are viewing <strong>' + esc(hname) + '</strong>. Locked to assigned hospitalId=' + esc(hid) + ' for role ' + esc(role) + '.';
      }
    }
    // Receptionist/Doctor guard hints
    $all('[data-requires]').forEach(function (el) {
      var need = (el.getAttribute('data-requires') || '').split(' ');
      el.disabled = need.indexOf(role) < 0 && need[0] !== 'all';
      el.title = el.disabled ? ('Requires role: ' + need.join(', ') + '. Current: ' + role) : '';
    });
  }

  function toast(msg, kind) {
    var region = $('#toast-region');
    if (!region) { region = document.createElement('div'); region.id = 'toast-region'; region.className = 'toast-region'; region.setAttribute('aria-live', 'polite'); document.body.appendChild(region); }
    var t = document.createElement('div');
    t.className = 'toast'; t.textContent = msg;
    if (kind === 'error') t.style.background = '#991B1B';
    if (kind === 'success') t.style.background = '#065F46';
    region.appendChild(t);
    setTimeout(function () { t.remove(); }, 5000);
  }

  function showError(boxSel, message, recovery) {
    var box = typeof boxSel === 'string' ? $(boxSel) : boxSel;
    if (!box) { toast(message, 'error'); return; }
    box.innerHTML = '<strong>What happened:</strong> ' + esc(message) +
      (recovery ? '<br><span>' + recovery + '</span>' : '') +
      ' <br><button class="btn btn-outline" data-retry style="margin-top:8px;min-height:44px">Retry</button> ' +
      '<a class="btn btn-ghost" href="index.html">Back to Central Command</a>';
    box.hidden = false;
  }

  function api(path, opts) {
    opts = opts || {};
    var headers = { 'Content-Type': 'application/json' };
    return fetch(API + path, {
      method: opts.method || 'GET',
      headers: headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined
    }).then(function (res) {
      if (!res.ok) {
        return res.text().then(function (txt) {
          var msg = txt;
          try { var j = JSON.parse(txt); msg = j.message || j.error || txt; } catch (e) { /* plain */ }
          var err = new Error(msg || ('HTTP ' + res.status));
          err.status = res.status; err.body = txt;
          throw err;
        });
      }
      if (res.status === 204) return null;
      var ct = res.headers.get('content-type') || '';
      return ct.indexOf('application/json') >= 0 ? res.json() : res.text();
    }).catch(function (e) {
      if (e instanceof TypeError) throw new Error('Cannot reach backend at ' + API + '. Start it: .\\mvnw.cmd spring-boot:run (port 8086).');
      throw e;
    });
  }

  function loadLight(total, occupied) {
    total = Number(total) || 0; occupied = Number(occupied) || 0;
    var pct = total > 0 ? Math.round((occupied / total) * 100) : 0;
    var cls = pct >= 100 ? 'red' : (pct > 80 ? 'amber' : 'green');
    var label = pct >= 100 ? 'Full' : (pct > 80 ? 'Tight' : 'Available');
    var bar = pct >= 100 ? 'full' : (pct > 80 ? 'tight' : '');
    return { pct: pct, cls: cls, label: label, bar: bar };
  }

  function loadLightHTML(total, occupied) {
    var l = loadLight(total, occupied);
    return '<span class="load-light"><span class="load-dot ' + l.cls + '" aria-hidden="true"></span>' +
      esc(l.label) + ' ' + l.pct + '%</span>';
  }

  function occupancyBarHTML(total, occupied) {
    var l = loadLight(total, occupied);
    return '<div class="occupancy-bar ' + l.bar + '" role="img" aria-label="Occupancy ' + l.pct + ' percent, ' + l.label + '">' +
      '<span style="width:' + l.pct + '%"></span></div><small>' + occupied + '/' + total + ' (' + l.pct + '%)</small>';
  }

  function initCommandBar() {
    var input = $('#centralId-search');
    if (!input) return;
    // slash focuses search
    document.addEventListener('keydown', function (e) {
      if (e.key === '/' && document.activeElement !== input && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) { e.preventDefault(); input.focus(); }
    });
    // recent
    function recents() { try { return JSON.parse(localStorage.getItem('hub.recentCentralIds') || '[]'); } catch (e) { return []; } }
    function renderRecents() {
      var box = $('#recent-searches'); if (!box) return;
      var r = recents();
      box.innerHTML = r.length ? r.map(function (id) { return '<button class="btn" data-recent="' + esc(id) + '" style="min-height:44px">' + esc(id) + '</button>'; }).join('') : '<span class="hint">No recent searches. Try MH-2026-004213.</span>';
      $all('[data-recent]', box).forEach(function (b) { b.addEventListener('click', function () { go(b.getAttribute('data-recent')); }); });
    }
    function go(centralId) {
      centralId = (centralId || '').trim();
      if (!centralId) { toast('Type a centralId first, e.g. MH-2026-004213', 'error'); input.focus(); return; }
      var r = [centralId].concat(recents().filter(function (x) { return x !== centralId; })).slice(0, 5);
      localStorage.setItem('hub.recentCentralIds', JSON.stringify(r));
      window.location.href = 'patients.html?centralId=' + encodeURIComponent(centralId);
    }
    var goBtn = $('#centralId-go');
    if (goBtn) goBtn.addEventListener('click', function () { go(input.value); });
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') go(input.value); });
    renderRecents();
    // ticker
    refreshTicker();
    setInterval(function () { if (!document.hidden && window.__tickerLive !== false) refreshTicker(); }, 60000);
    var liveBtn = $('#ticker-live');
    if (liveBtn) liveBtn.addEventListener('click', function () {
      window.__tickerLive = window.__tickerLive === false ? true : false;
      liveBtn.textContent = window.__tickerLive === false ? 'Paused — Resume live' : 'Live — Pause';
      liveBtn.setAttribute('aria-pressed', String(window.__tickerLive !== false));
    });
  }

  function refreshTicker() {
    var occ = $('#ticker-occupancy'), ref = $('#ticker-referrals');
    api('/central/census').then(function (c) {
      var total = Number(c.totalBeds) || 0, occB = Number(c.occupiedBeds) || 0;
      var pct = total ? Math.round(occB / total * 100) : 0;
      if (occ) occ.textContent = 'Occupancy ' + pct + '% (' + occB + '/' + total + ')';
      return api('/referrals');
    }).then(function (refs) {
      var pending = Array.isArray(refs) ? refs.filter(function (r) { return (r.status || 'PENDING') === 'PENDING'; }).length : 0;
      if (ref) ref.textContent = 'Pending Referrals ' + pending;
      var badge = $('#nav-ref-count'); if (badge) { badge.textContent = pending; badge.hidden = pending === 0; }
      var live = $('#ticker-updated'); if (live) live.textContent = 'Updated ' + new Date().toLocaleTimeString();
    }).catch(function () { /* ticker is best-effort */ });
  }

  function initChrome() {
    // role select
    $all('[data-role-select]').forEach(function (sel) {
      ROLES.forEach(function (r) { var o = document.createElement('option'); o.value = r; o.textContent = r; sel.appendChild(o); });
      sel.value = getRole();
      sel.addEventListener('change', function () {
        setRole(sel.value);
        toast('Role switched to ' + sel.value + '. Landing: ' + ROLE_HOME[sel.value]);
      });
    });
    // hospital scope select (SuperAdmin)
    var scope = $('#hospital-scope');
    if (scope) {
      api('/hospitals').then(function (list) {
        scope.innerHTML = '<option value="all">All Hospitals</option>' + (list || []).map(function (h) {
          return '<option value="' + h.id + '">' + esc(h.name) + ' — ' + esc(h.city || '') + '</option>';
        }).join('');
        scope.value = getHospitalScope();
        scope.addEventListener('change', function () {
          localStorage.setItem('hub.hospitalScope', scope.value);
          var opt = scope.options[scope.selectedIndex];
          if (scope.value !== 'all') { localStorage.setItem('hub.myHospitalId', scope.value); localStorage.setItem('hub.myHospitalName', opt.text); }
          renderRole(); refreshTicker();
        });
      }).catch(function () { /* offline */ });
    }
    renderRole();
    initCommandBar();
    // copy buttons
    document.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('[data-copy]') : null;
      if (!b) return;
      var v = b.getAttribute('data-copy');
      if (navigator.clipboard) navigator.clipboard.writeText(v).then(function () { toast('Copied: ' + v, 'success'); });
      else { var i = document.createElement('input'); i.value = v; document.body.appendChild(i); i.select(); document.execCommand('copy'); i.remove(); toast('Copied: ' + v, 'success'); }
    });
  }

  function skeletonHTML(rows) {
    var h = '';
    for (var i = 0; i < (rows || 3); i++) h += '<div class="skeleton" style="height:22px;margin:8px 0"></div>';
    return h;
  }

  /* Backend serialises JPA relations as NESTED objects (no flat FK ids):
     doctor.hospital.id, patient.registeredHospital.id,
     appointment.doctor.id, referral.fromHospital.id, ... */
  function fk(o, flatKey, nestedKey) {
    if (o == null) return undefined;
    if (o[flatKey] != null) return o[flatKey];
    var n = o[nestedKey];
    return (n && n.id != null) ? n.id : undefined;
  }
  function hospitalId(o) { return fk(o, 'hospitalId', 'hospital') != null ? fk(o, 'hospitalId', 'hospital') : fk(o, 'hospitalId', 'registeredHospital'); }
  function patientId(o) { return fk(o, 'patientId', 'patient'); }
  function doctorId(o) { return fk(o, 'doctorId', 'doctor'); }
  function fromHospitalId(o) { return fk(o, 'fromHospitalId', 'fromHospital'); }
  function toHospitalId(o) { return fk(o, 'toHospitalId', 'toHospital'); }

  function downloadCSV(filename, rows) {
    if (!rows.length) { toast('Nothing to export', 'error'); return; }
    var keys = Object.keys(rows[0]);
    var csv = keys.join(',') + '\n' + rows.map(function (r) {
      return keys.map(function (k) { var v = r[k]; if (v != null && typeof v === 'object') v = JSON.stringify(v); return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"'; }).join(',');
    }).join('\n');
    var blob = new Blob([csv], { type: 'text/csv' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
    toast('Exported ' + filename + ' by ' + getRole() + ' at ' + new Date().toLocaleString(), 'success');
  }

  window.Hub = { api: api, esc: esc, toast: toast, showError: showError, loadLight: loadLight, loadLightHTML: loadLightHTML, occupancyBarHTML: occupancyBarHTML, getRole: getRole, setRole: setRole, getHospitalScope: getHospitalScope, skeletonHTML: skeletonHTML, downloadCSV: downloadCSV, initChrome: initChrome, refreshTicker: refreshTicker, fk: fk, hospitalId: hospitalId, patientId: patientId, doctorId: doctorId, fromHospitalId: fromHospitalId, toHospitalId: toHospitalId };
  document.addEventListener('DOMContentLoaded', initChrome);
})();
