/* Investigation cards: one card per PSI combustion investigation (24), grouped by hardware, with a small pressure and
   oxygen map of where its tests ran, an outcome bar and what changed between its tests. Compare puts up to three side by side.
   Written with an AI coding assistant (Claude Code). Proposal: docs/investigation-summaries.md.
   Data: data/investigations.json (NASA fields, team tags, AI-written one-line summaries) and data/tests.web.json (every
   count, range, dot and bar below is computed here from the rows; nothing is typed in). */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var NS = 'http://www.w3.org/2000/svg';
  var SEA = 3.07;                                   // psi of oxygen at sea level, as on the main map
  var HAB = { iss: [14.7, 21], moon: [10.2, 30] };  // challenge statement values
  var OFF = window.FlashpointOffline || {};
  var O2S = OFF.O2_SCALE || 10, PS = OFF.P_SCALE || 2, NEAR = OFF.NEAR_DISTANCE || 1;   // the site's evidence rule
  var INV = null, META = null, ROWS = null, stage = 'all', onlyRows = false, picked = [];

  function el(tag, attrs, parent) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function fmt(v) { return String(+(+v).toFixed(Math.abs(v) >= 100 ? 0 : 1)); }
  function range(a, unit) { if (!a.length) return null; var lo = Math.min.apply(null, a), hi = Math.max.apply(null, a); return (lo === hi ? fmt(lo) : fmt(lo) + ' to ' + fmt(hi)) + unit; }
  function plural(n, w) { return n.toLocaleString('en') + ' ' + w + (n === 1 ? '' : 's'); }
  function uniq(a) { var s = {}; a.forEach(function (x) { s[x] = 1; }); return Object.keys(s); }
  function near(r, h) { if (r.o2_pct == null || r.pressure_psi == null || r.oxygen_from !== 'chamber') return false;
    var a = (r.o2_pct - h[1]) / O2S, b = (r.pressure_psi - h[0]) / PS; return Math.sqrt(a * a + b * b) <= NEAR; }
  function outcomeKey(r) { return r.ignited === false ? 'none' : r.outcome === 'burned' ? 'burn' : r.outcome === 'self_extinguished' ? 'out' : r.outcome === 'suppressed' ? 'out' : 'nr'; }
  var OUT = [['burn', 'Kept burning'], ['out', 'Went out'], ['none', 'Did not ignite'], ['nr', 'Not recorded']];

  /* ---------- what one investigation's rows say ---------- */
  function facts(acc) {
    var rows = ROWS.filter(function (r) { return r.accession === acc; });
    var f = { rows: rows, n: rows.length, out: { burn: 0, out: 0, none: 0, nr: 0 } };
    rows.forEach(function (r) { f.out[outcomeKey(r)]++; });
    f.chamber = rows.filter(function (r) { return r.o2_pct != null && r.oxygen_from === 'chamber'; });
    f.burner = rows.filter(function (r) { return r.o2_pct != null && r.oxygen_from === 'burner'; });
    f.withP = rows.filter(function (r) { return r.pressure_psi != null; });
    f.plotted = f.chamber.filter(function (r) { return r.pressure_psi != null && r.pressure_psi <= 16; });
    f.above16 = f.chamber.filter(function (r) { return r.pressure_psi != null && r.pressure_psi > 16; });
    f.noP = f.chamber.filter(function (r) { return r.pressure_psi == null; });
    f.nearMoon = rows.filter(function (r) { return near(r, HAB.moon); }).length;
    f.nearIss = rows.filter(function (r) { return near(r, HAB.iss); }).length;
    var ch = [];
    var o2 = uniq(f.chamber.map(function (r) { return r.o2_pct; })), ps = uniq(f.withP.map(function (r) { return r.pressure_psi; }));
    if (o2.length > 1) ch.push('Oxygen ' + range(f.chamber.map(function (r) { return r.o2_pct; }), '%'));
    if (f.burner.length) ch.push('Burner oxygen ' + range(f.burner.map(function (r) { return r.o2_pct; }), '%'));
    if (ps.length > 1) ch.push('Pressure ' + range(f.withP.map(function (r) { return r.pressure_psi; }), ' psi'));
    if (rows.some(function (r) { return r.co2_pct > 0; })) ch.push('Carbon dioxide added');
    if (rows.some(function (r) { return r.he_pct > 0; })) ch.push('Helium added');
    var fuels = uniq(rows.map(function (r) { return (r.fuel || '').replace(/\s+/g, ' ').trim().toLowerCase(); }).filter(Boolean));
    if (fuels.length > 1) ch.push(fuels.length + ' fuels or samples');
    var ft = uniq(rows.map(function (r) { return r.flame_type; }));
    if (ft.indexOf('normal') >= 0 && ft.indexOf('inverse') >= 0) ch.push('Normal and inverse flames');
    var flow = uniq(rows.filter(function (r) { return r.flow_cm_s != null; }).map(function (r) { return r.flow_cm_s; })).map(Number).sort(function (a, b) { return a - b; });
    if (flow.length) ch.push('Airflow ' + (flow.length <= 3 ? flow.map(fmt).join(' or ') : fmt(flow[0]) + ' to ' + fmt(flow[flow.length - 1])) + ' cm/s');
    var g = rows.filter(function (r) { return r.ug_burn_length || r.g1_burn_length; }).length;
    if (g) ch.push('Burn length at 0 g and 1 g (' + g + ')');
    var bt = rows.filter(function (r) { return r.burn_time_s != null; }).length;
    if (bt) ch.push('Burn time recorded (' + bt + ')');
    f.changed = ch;
    return f;
  }
  function reasonFor(acc) {
    var why = null;
    if (META && META.excluded) Object.keys(META.excluded).forEach(function (k) { if (k.split(/,\s*/).indexOf(acc) >= 0) why = META.excluded[k]; });
    return why ? why.replace(/^[^:]*:\s*/, '') : 'NASA\'s catalogue lists no per-test table for it';
  }

  /* ---------- the small map: same axes, curve and habitats as the main map ---------- */
  function miniMap(f, label) {
    var W = 300, H = 196, L = 30, R = 34, T = 18, B = 24, X1 = W - R;
    var x = function (p) { return L + p / 16 * (X1 - L); }, y = function (o) { return H - B - (o - 10) / 90 * (H - T - B); };
    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, 'class': 'inv-map', role: 'img' });
    el('rect', { 'class': 'bg', x: L, y: T, width: X1 - L, height: H - T - B }, svg);
    [4, 8, 12].forEach(function (p) { el('line', { 'class': 'gl', x1: x(p), x2: x(p), y1: T, y2: H - B }, svg); });
    [40, 70].forEach(function (o) { el('line', { 'class': 'gl', x1: L, x2: X1, y1: y(o), y2: y(o) }, svg); });
    var d = ''; for (var pp = SEA; pp <= 16.001; pp += 0.2) d += (d ? 'L' : 'M') + x(pp).toFixed(1) + ' ' + y(SEA / pp * 100).toFixed(1);
    el('path', { 'class': 'curve', d: d }, svg);
    [[0, 'psi 0'], [8, '8'], [16, '16']].forEach(function (t) { var tx = el('text', { x: x(t[0]), y: H - 8, 'text-anchor': t[0] ? 'middle' : 'start' }, svg); tx.textContent = t[1]; });
    [[10, '10%'], [100, '100']].forEach(function (t) { var tx = el('text', { x: L - 4, y: y(t[0]) + 3, 'text-anchor': 'end' }, svg); tx.textContent = t[1]; });
    // the "pressure not recorded" strip on the right: tests with oxygen but no pressure, never drawn at a guessed pressure
    el('rect', { 'class': 'strip', x: X1 + 8, y: T, width: 18, height: H - T - B }, svg);
    var st = el('text', { 'class': 'striplbl', x: X1 + 17, y: T - 6, 'text-anchor': 'middle' }, svg); st.textContent = 'no psi';
    var marks = el('g', {}, svg);
    var kind = function (r) { var k = outcomeKey(r); return k === 'burn' ? 'b' : k === 'nr' ? 'u' : 'x'; };
    [['u', 2], ['x', 2.8], ['b', 3.1]].forEach(function (k) {
      f.plotted.forEach(function (r) { if (kind(r) === k[0]) el('circle', { 'class': 'dot ' + k[0], cx: x(r.pressure_psi).toFixed(1), cy: y(r.o2_pct).toFixed(1), r: k[1] }, marks); });
      f.noP.forEach(function (r) { if (kind(r) === k[0]) el('line', { 'class': 'tick ' + k[0], x1: X1 + 10, x2: X1 + 24, y1: y(r.o2_pct).toFixed(1), y2: y(r.o2_pct).toFixed(1) }, marks); });
    });
    [['ISS', HAB.iss], ['Moon Base', HAB.moon]].forEach(function (h) {
      el('circle', { 'class': 'hab' + (h[0] === 'Moon Base' ? ' moon' : ''), cx: x(h[1][0]), cy: y(h[1][1]), r: 4 }, svg);
      var t = el('text', { 'class': 'hablbl', x: x(h[1][0]) - 6, y: y(h[1][1]) - 7, 'text-anchor': 'end' }, svg); t.textContent = h[0];
    });
    svg.setAttribute('aria-label', label);
    return svg;
  }
  function outBar(f) {
    var wrap = document.createElement('div'); wrap.className = 'inv-out';
    var bar = document.createElement('div'); bar.className = 'inv-bar'; bar.setAttribute('aria-hidden', 'true');
    OUT.forEach(function (o) { if (!f.out[o[0]]) return; var s = document.createElement('span'); s.className = 'seg ' + o[0]; s.style.flexGrow = f.out[o[0]]; bar.appendChild(s); });
    var key = document.createElement('p'); key.className = 'inv-key';
    key.innerHTML = OUT.filter(function (o) { return f.out[o[0]]; }).map(function (o) { return '<span><i class="sw ' + o[0] + '"></i>' + o[1] + ' <b>' + f.out[o[0]] + '</b></span>'; }).join('');
    wrap.appendChild(bar); wrap.appendChild(key);
    return wrap;
  }
  var ICON = {
    gas: '<path d="M12 3v8M8 21h8M10 11h4v10h-4z"/><path d="M12 3c-2 2-2 4 0 5 2-1 2-3 0-5z"/>',
    droplet: '<path d="M12 3c3 4 6 7 6 11a6 6 0 0 1-12 0c0-4 3-7 6-11z"/>',
    solid: '<rect x="4" y="6" width="16" height="12" rx="1"/><path d="M4 10h16M4 14h16"/>',
    smoke: '<path d="M6 16c-2 0-3-2-2-3 0-2 2-3 4-2 0-3 4-4 6-2 2-1 5 0 5 3 2 0 3 2 2 3"/><circle cx="8" cy="20" r="1"/><circle cx="14" cy="20" r="1"/>',
    dust: '<circle cx="7" cy="8" r="1.5"/><circle cx="15" cy="7" r="1"/><circle cx="11" cy="13" r="1.5"/><circle cx="17" cy="15" r="1.5"/><circle cx="7" cy="17" r="1"/>',
    analysis: '<path d="M4 20V4M4 20h16"/><path d="M7 15l4-4 3 3 5-6"/>'
  };
  var FORM = { gas: 'Gas flames', droplet: 'Fuel droplets', solid: 'Solid samples', smoke: 'Smoke from heated materials', dust: 'Test dust', analysis: 'Analysis of flight data' };
  function icon(form) { return '<svg class="inv-icon" viewBox="0 0 24 24" aria-hidden="true">' + (ICON[form] || '') + '</svg>'; }

  /* ---------- one card ---------- */
  function card(e) {
    var f = facts(e.accession), a = document.createElement('article');
    a.className = 'inv-card' + (f.n ? '' : ' empty'); a.dataset.acc = e.accession; a.dataset.stage = e.stage;
    var head = '<div class="inv-top"><span class="inv-stage ' + e.stage + '">' + esc(INV.stages[e.stage]) + '</span><span class="inv-acc">' + esc(e.accession) + '</span></div>' +
      '<h4>' + esc(e.short_name) + '</h4>' +
      '<p class="inv-form">' + icon(e.fuel_form) + esc(FORM[e.fuel_form] || e.fuel_form) + '</p>' +
      '<p class="inv-sum">' + esc(e.summary) + '</p>' +
      '<details class="inv-nasa"><summary>NASA\'s own objectives</summary><p>' + esc(e.objectives || 'Not given in the catalogue.') + '</p>' +
      (e.measured ? '<p><b>Measured:</b> ' + esc(e.measured) + '</p>' : '') + (e.earth ? '<p><b>On Earth:</b> ' + esc(e.earth) + '</p>' : '') +
      '<p class="inv-ai">Summary, "Measured" and "On Earth" written with AI from this NASA text; the objectives are NASA\'s own words.</p></details>';
    a.innerHTML = head;
    if (f.n) {
      var lbl = e.short_name + ': ' + plural(f.plotted.length, 'test') + ' on the map' + (f.noP.length ? ', ' + f.noP.length + ' with oxygen but no pressure' : '') + '.';
      var hasO2 = f.chamber.length || f.burner.length;
      if (hasO2) a.appendChild(miniMap(f, lbl));
      else { var nb = document.createElement('p'); nb.className = 'inv-why'; nb.textContent = 'NASA\'s table for these tests records no oxygen and no pressure, so they cannot be drawn on the map.'; a.appendChild(nb); }
      var notes = [];
      notes.push(plural(f.n, 'test') + ' in NASA\'s tables');
      if (f.above16.length) notes.push(f.above16.length + ' above 16 psi, off this map');
      if (f.burner.length) notes.push(f.burner.length + ' inverse flames not drawn (oxygen in the burner, not the air)');
      if (f.noP.length) notes.push(f.noP.length + ' with oxygen but no pressure, on the right strip');
      var p = document.createElement('p'); p.className = 'inv-mapnote'; p.textContent = notes.join('. ') + '.'; a.appendChild(p);
      var nm = document.createElement('p'); nm.className = 'inv-near' + (f.nearMoon ? '' : ' none');
      // A test with no pressure cannot be near anything: say so instead of reporting "no tests" as if it had been checked.
      if (!f.withP.length) nm.innerHTML = '<b>Cannot be placed</b> near the ISS or Moon Base air: NASA\'s table gives these tests no pressure.';
      else nm.innerHTML = 'Near the Moon Base air: <b>' + (f.nearMoon ? plural(f.nearMoon, 'test') : 'no tests') + '</b>. Near ISS air: <b>' + (f.nearIss ? plural(f.nearIss, 'test') : 'no tests') + '</b>.';
      a.appendChild(nm);
      a.appendChild(outBar(f));
      if (f.changed.length) { var c = document.createElement('div'); c.className = 'inv-chips'; c.innerHTML = '<span class="lbl">What changed between tests</span>' + f.changed.map(function (t) { return '<span class="inv-chip">' + esc(t) + '</span>'; }).join(''); a.appendChild(c); }
    } else {
      var w = document.createElement('p'); w.className = 'inv-why'; w.textContent = 'No per-test rows we can use: ' + reasonFor(e.accession) + '.'; a.appendChild(w);
    }
    var act = document.createElement('div'); act.className = 'inv-act';
    act.innerHTML = (f.n ? '<button class="btn sm" type="button" data-tests>See its ' + f.n + ' tests</button>' : '') +
      '<a class="btn ghost sm" href="' + esc(e.psi_url) + '" target="_blank" rel="noopener">NASA PSI page</a>' +
      '<label class="check inv-cmp"><input type="checkbox" data-cmp> Compare</label>';
    a.appendChild(act);
    var t = act.querySelector('[data-tests]'); if (t) t.addEventListener('click', function () { if (window.FlashpointShowTests) window.FlashpointShowTests(e.accession); });
    var cb = act.querySelector('[data-cmp]'); cb.checked = picked.indexOf(e.accession) >= 0;
    cb.addEventListener('change', function () { toggle(e.accession, cb.checked); });
    return a;
  }

  /* ---------- the cards view ---------- */
  function draw() {
    var box = $('invCards'); if (!box || !INV || !ROWS) return;
    box.textContent = '';
    var list = INV.investigations.filter(function (e) {
      if (stage !== 'all' && e.stage !== stage) return false;
      if (onlyRows && !ROWS.some(function (r) { return r.accession === e.accession; })) return false;
      return true;
    });
    Object.keys(INV.families).forEach(function (fam) {
      var group = list.filter(function (e) { return e.hardware_family === fam; }); if (!group.length) return;
      var sec = document.createElement('section'); sec.className = 'inv-group';
      sec.innerHTML = '<h3>' + esc(INV.families[fam]) + ' <span>' + plural(group.length, 'investigation') + '</span></h3>';
      var grid = document.createElement('div'); grid.className = 'inv-grid';
      group.forEach(function (e) { grid.appendChild(card(e)); });
      sec.appendChild(grid); box.appendChild(sec);
    });
    $('invCount').textContent = 'Showing ' + plural(list.length, 'investigation') + ' of ' + INV.investigations.length + '.';
  }
  function findings() {
    var all = INV.investigations, withRows = all.filter(function (e) { return ROWS.some(function (r) { return r.accession === e.accession; }); });
    var moon = withRows.map(function (e) { return [e.short_name, facts(e.accession).nearMoon, e.fuel_form]; }).filter(function (x) { return x[1]; });
    var noOutcome = withRows.filter(function (e) { var f = facts(e.accession); return f.out.nr === f.n; }).map(function (e) { return e.short_name; });
    var solid = ROWS.filter(function (r) { return r.fuel_phase === 'solid'; });
    var lines = [
      '<b>' + withRows.length + ' of ' + all.length + '</b> investigations have per-test rows in NASA\'s tables (' + ROWS.length.toLocaleString('en') + ' tests). The other ' + (all.length - withRows.length) + ' are shown with the reason.',
      moon.length ? 'Tests near the Moon Base air (' + HAB.moon[1] + '% oxygen, ' + HAB.moon[0] + ' psi) come from <b>' + moon.map(function (m) { return m[0] + ' (' + m[1] + ')'; }).join(', ') + '</b>' + (moon.every(function (m) { return m[2] === 'droplet'; }) ? ', all burning fuel droplets, not cabin materials.' : '.') : 'No investigation has tests near the Moon Base air.',
      'None of the <b>' + solid.length + '</b> solid-material tests (the cabin materials) has a pressure in NASA\'s tables, so none can be placed near any habitat.',
      noOutcome.length ? '<b>' + noOutcome.join(', ') + '</b> record no outcome for any test, so whether those flames kept burning is not known from the tables.' : ''
    ].filter(Boolean);
    $('invFindings').innerHTML = '<span class="lbl">What the cards show</span><ul>' + lines.map(function (l) { return '<li>' + l + '</li>'; }).join('') + '</ul><p class="note">Counted in your browser from data/tests.web.json. "Near" uses the same rule as the map: within ' + (O2S * NEAR) + ' points of oxygen or ' + (PS * NEAR) + ' psi, chamber oxygen only.</p>';
  }

  /* ---------- compare up to three ---------- */
  function toggle(acc, on) {
    picked = picked.filter(function (x) { return x !== acc; });
    if (on) picked.push(acc);
    if (picked.length > 3) { var drop = picked.shift(); document.querySelectorAll('.inv-card[data-acc="' + drop + '"] [data-cmp]').forEach(function (c) { c.checked = false; }); }
    var bar = $('invCmpBar'); bar.hidden = !picked.length;
    $('invCmpTxt').textContent = picked.length === 1 ? '1 picked. Pick one or two more to compare.' : picked.length + ' picked: ' + picked.map(function (a) { return byAcc(a).short_name; }).join(', ') + '.';
    $('invCmpGo').disabled = picked.length < 2;
  }
  function byAcc(a) { for (var i = 0; i < INV.investigations.length; i++) if (INV.investigations[i].accession === a) return INV.investigations[i]; return null; }
  function openCompare() {
    var cols = picked.map(byAcc), fs = cols.map(function (e) { return facts(e.accession); });
    var rows = [
      ['Stage', function (e) { return INV.stages[e.stage]; }], ['Hardware', function (e) { return INV.families[e.hardware_family]; }],
      ['Fuel', function (e) { return FORM[e.fuel_form]; }], ['Tests in NASA\'s tables', function (e, f) { return f.n || 'none we can use'; }],
      ['Oxygen in the chamber', function (e, f) { return range(f.chamber.map(function (r) { return r.o2_pct; }), '%') || 'not recorded'; }],
      ['Pressure', function (e, f) { return range(f.withP.map(function (r) { return r.pressure_psi; }), ' psi') || 'not recorded'; }],
      ['Near the Moon Base air', function (e, f) { return !f.n ? '-' : !f.withP.length ? 'cannot be placed (no pressure in NASA\'s table)' : (f.nearMoon || 'none'); }],
      ['Outcomes', function (e, f) { return f.n ? OUT.filter(function (o) { return f.out[o[0]]; }).map(function (o) { return o[1] + ' ' + f.out[o[0]]; }).join(', ') : '-'; }],
      ['What changed', function (e, f) { return f.changed.join(', ') || '-'; }],
      ['Measured', function (e) { return e.measured || 'not stated'; }]
    ];
    var b = $('invCmpBody'); b.textContent = '';
    var grid = document.createElement('div'); grid.className = 'inv-cmp-grid'; grid.style.setProperty('--n', cols.length);
    cols.forEach(function (e, i) {
      var c = document.createElement('div'); c.className = 'inv-cmp-col';
      c.innerHTML = '<span class="inv-stage ' + e.stage + '">' + esc(INV.stages[e.stage]) + '</span><h4>' + esc(e.short_name) + ' <small>' + esc(e.accession) + '</small></h4><p class="inv-sum">' + esc(e.summary) + '</p>';
      if (fs[i].n) { c.appendChild(miniMap(fs[i], e.short_name + ' tests')); c.appendChild(outBar(fs[i])); }
      else { var w = document.createElement('p'); w.className = 'inv-why'; w.textContent = 'No per-test rows we can use: ' + reasonFor(e.accession) + '.'; c.appendChild(w); }
      var dl = document.createElement('dl');
      rows.forEach(function (r) { dl.innerHTML += '<dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1](e, fs[i])) + '</dd>'; });
      c.appendChild(dl); grid.appendChild(c);
    });
    b.appendChild(grid);
    var n = document.createElement('p'); n.className = 'note'; n.textContent = 'Maps share one scale: total pressure 0 to 16 psi across, oxygen 10 to 100% up. Summaries are AI-written from NASA\'s objectives; every number is counted from NASA\'s rows.'; b.appendChild(n);
    cmpFrom = document.activeElement; $('invCmp').hidden = false; $('invCmpClose').focus();
  }
  var cmpFrom = null;
  function closeCompare() { $('invCmp').hidden = true; if (cmpFrom && cmpFrom.focus) cmpFrom.focus(); }

  /* ---------- the Cards / Table switch and the filters ---------- */
  function showView(v) {
    document.querySelectorAll('#invView button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.iv === v); });
    $('invCardsView').hidden = v !== 'cards'; $('invTableView').hidden = v !== 'table';
  }
  function init() {
    if (!$('invCards')) return;
    document.querySelectorAll('#invView button').forEach(function (b) { b.addEventListener('click', function () { showView(b.dataset.iv); }); });
    document.querySelectorAll('#invStage .chip').forEach(function (c) { c.addEventListener('click', function () {
      document.querySelectorAll('#invStage .chip').forEach(function (x) { x.setAttribute('aria-pressed', x === c); }); stage = c.dataset.st; draw(); }); });
    $('invOnly').addEventListener('change', function () { onlyRows = this.checked; draw(); });
    $('invCmpGo').addEventListener('click', openCompare);
    $('invCmpClear').addEventListener('click', function () { picked = []; document.querySelectorAll('[data-cmp]').forEach(function (c) { c.checked = false; }); toggle('', false); });
    $('invCmpClose').addEventListener('click', closeCompare);
    $('invCmp').addEventListener('click', function (e) { if (e.target === this) closeCompare(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !$('invCmp').hidden) { e.stopImmediatePropagation(); closeCompare(); } }, true);
    document.querySelectorAll('[data-open-cards]').forEach(function (b) { b.addEventListener('click', function () { if (window.FlashpointOpenCards) window.FlashpointOpenCards(); showView('cards'); }); });
    Promise.all([
      fetch('../data/investigations.json').then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }),
      fetch('../data/tests.meta.json').then(function (r) { return r.ok ? r.json() : null; }, function () { return null; })
    ]).then(function (res) {
      INV = res[0]; META = res[1];
      if (ROWS) { findings(); draw(); }
    }, function () { $('invCards').innerHTML = '<p class="note">Could not load data/investigations.json. Open the site through a web server started in the repo root.</p>'; });
    function rowsReady(rows) { ROWS = rows; if (INV) { findings(); draw(); } }
    document.addEventListener('fp-data', function (e) { rowsReady(e.detail); });
    if (window.FlashpointRows) rowsReady(window.FlashpointRows);
  }
  init();
})();
