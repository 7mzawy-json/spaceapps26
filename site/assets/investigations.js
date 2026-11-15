/* Investigation cards: every PSI combustion investigation (24). The nine with test rows get a map-first card on one shared
   scale, so the empty Moon Base zone shows across the row; the fifteen without rows get compact tiles with the reason.
   The landing page shows the same small maps as a strip. Compare puts up to three side by side.
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
  var INV = null, META = null, ROWS = null, stage = 'all', onlyRows = false, picked = [], uid = 0;

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
  var FAMSHORT = { acme: 'CIR, ACME gas flames', mdca: 'CIR, droplet apparatus', msg: 'Glovebox flow duct', saffire: 'SAFFIRE in Cygnus', smoke: 'Smoke and dust', ground: 'Ground study' };

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

  /* ---------- the small map: same axes, curve and habitats as the main map, plus the Moon Base "near" zone ---------- */
  function miniMap(f, label, compact) {
    var W = 320, H = compact ? 200 : 214, L = 30, R = 34, T = 20, B = 24, X1 = W - R;
    var x = function (p) { return L + p / 16 * (X1 - L); }, y = function (o) { return H - B - (o - 10) / 90 * (H - T - B); };
    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, 'class': 'inv-map' + (compact ? ' compact' : ''), role: 'img' });
    var id = 'invclip' + (++uid);
    el('rect', { 'class': 'bg', x: L, y: T, width: X1 - L, height: H - T - B, rx: 4 }, svg);
    [4, 8, 12].forEach(function (p) { el('line', { 'class': 'gl', x1: x(p), x2: x(p), y1: T, y2: H - B }, svg); });
    [40, 70].forEach(function (o) { el('line', { 'class': 'gl', x1: L, x2: X1, y1: y(o), y2: y(o) }, svg); });
    // The Moon Base "near" zone: within O2S * NEAR points of oxygen and PS * NEAR psi, the same rule as the main map.
    var zone = el('ellipse', { 'class': 'zone' + (f.nearMoon ? ' lit' : ''), cx: x(HAB.moon[0]), cy: y(HAB.moon[1]),
      rx: x(HAB.moon[0] + PS * NEAR) - x(HAB.moon[0]), ry: y(HAB.moon[1]) - y(HAB.moon[1] + O2S * NEAR) }, svg);
    var d = ''; for (var pp = SEA; pp <= 16.001; pp += 0.2) d += (d ? 'L' : 'M') + x(pp).toFixed(1) + ' ' + y(SEA / pp * 100).toFixed(1);
    el('path', { 'class': 'curve', d: d }, svg);
    [[0, '0'], [8, '8'], [16, '16 psi']].forEach(function (t) { var tx = el('text', { x: x(t[0]), y: H - 8, 'text-anchor': t[0] === 16 ? 'end' : 'middle' }, svg); tx.textContent = t[1]; });
    [[10, '10%'], [100, '100']].forEach(function (t) { var tx = el('text', { x: L - 4, y: y(t[0]) + 3, 'text-anchor': 'end' }, svg); tx.textContent = t[1]; });
    // The "pressure not recorded" strip on the right: tests with oxygen but no pressure, never drawn at a guessed pressure.
    el('rect', { 'class': 'strip', x: X1 + 8, y: T, width: 18, height: H - T - B, rx: 3 }, svg);
    var st = el('text', { 'class': 'striplbl', x: X1 + 17, y: T - 6, 'text-anchor': 'middle' }, svg); st.textContent = 'no psi';
    var marks = el('g', { 'clip-path': 'url(#' + id + ')' }, svg);
    var cp = el('clipPath', { id: id }, svg); el('rect', { x: 0, y: 0, width: W, height: H }, cp);
    var kind = function (r) { var k = outcomeKey(r); return k === 'burn' ? 'b' : k === 'nr' ? 'u' : 'x'; };
    [['u', 2.4], ['x', 3.1], ['b', 3.5]].forEach(function (k) {
      f.plotted.forEach(function (r) { if (kind(r) === k[0]) el('circle', { 'class': 'dot ' + k[0], cx: x(r.pressure_psi).toFixed(1), cy: y(r.o2_pct).toFixed(1), r: k[1] }, marks); });
      f.noP.forEach(function (r) { if (kind(r) === k[0]) el('line', { 'class': 'tick ' + k[0], x1: X1 + 10, x2: X1 + 24, y1: y(r.o2_pct).toFixed(1), y2: y(r.o2_pct).toFixed(1) }, marks); });
    });
    [['ISS', HAB.iss], ['Moon Base', HAB.moon]].forEach(function (h) {
      el('circle', { 'class': 'hab' + (h[0] === 'Moon Base' ? ' moon' : ''), cx: x(h[1][0]), cy: y(h[1][1]), r: 4.5 }, svg);
      var t = el('text', { 'class': 'hablbl', x: x(h[1][0]) + (h[0] === 'ISS' ? 0 : -9), y: y(h[1][1]) + (h[0] === 'ISS' ? 16 : -9), 'text-anchor': h[0] === 'ISS' ? 'middle' : 'end' }, svg); t.textContent = h[0];
    });
    svg.setAttribute('aria-label', label);
    return svg;
  }
  function noMap(text) {
    var d = document.createElement('div'); d.className = 'inv-nomap';
    d.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20V4M4 20h16"/><path d="M8 8l8 8M16 8l-8 8"/></svg><span>' + esc(text) + '</span>';
    return d;
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
  function mapLabel(e, f) { return e.short_name + ': ' + plural(f.plotted.length, 'test') + ' on the map, ' + f.nearMoon + ' near the Moon Base air' + (f.noP.length ? ', ' + f.noP.length + ' with oxygen but no pressure' : '') + '.'; }

  /* ---------- a map-first card, for an investigation with test rows ---------- */
  function card(e) {
    var f = facts(e.accession), a = document.createElement('article');
    a.className = 'inv-card st-' + e.stage; a.dataset.acc = e.accession; a.dataset.stage = e.stage;
    var hasO2 = f.chamber.length || f.burner.length;
    a.appendChild(hasO2 ? miniMap(f, mapLabel(e, f)) : noMap('NASA\'s table for these tests records no oxygen and no pressure, so they cannot be drawn.'));
    var body = document.createElement('div'); body.className = 'inv-body';
    var big = !f.withP.length ? '<div class="inv-big unplaced"><b>Unplaced</b><span>no pressure in NASA\'s table</span></div>'
      : '<div class="inv-big' + (f.nearMoon ? ' lit' : ' gap') + '"><b>' + f.nearMoon + '</b><span>' + (f.nearMoon === 1 ? 'test' : 'tests') + ' near the Moon Base air</span></div>';
    body.innerHTML = '<div class="inv-top"><span class="inv-stage ' + e.stage + '">' + esc(INV.stages[e.stage]) + '</span><span class="inv-fam">' + icon(e.fuel_form) + esc(FAMSHORT[e.hardware_family]) + '</span></div>' +
      '<h4>' + esc(e.short_name) + ' <small>' + esc(e.accession) + '</small></h4>' +
      '<div class="inv-stats">' + big + '<div class="inv-big small"><b>' + f.n.toLocaleString('en') + '</b><span>tests in all</span></div>' +
      (f.withP.length ? '<div class="inv-big small"><b>' + f.nearIss + '</b><span>near ISS air</span></div>' : '') + '</div>';
    body.appendChild(outBar(f));
    var sum = document.createElement('p'); sum.className = 'inv-sum'; sum.textContent = e.summary; body.appendChild(sum);
    var notes = [];
    if (f.above16.length) notes.push(f.above16.length + ' above 16 psi, off the map');
    if (f.burner.length) notes.push(f.burner.length + ' inverse flames not drawn (oxygen in the burner, not the air)');
    if (f.noP.length) notes.push(f.noP.length + ' with oxygen but no pressure, on the right strip');
    var det = document.createElement('details'); det.className = 'inv-nasa';
    det.innerHTML = '<summary>Details</summary>' +
      (notes.length ? '<p class="inv-mapnote">' + esc(notes.join('. ')) + '.</p>' : '') +
      (f.changed.length ? '<div class="inv-chips"><span class="lbl">What changed between tests</span>' + f.changed.map(function (t) { return '<span class="inv-chip">' + esc(t) + '</span>'; }).join('') + '</div>' : '') +
      '<p><b>NASA\'s objectives:</b> ' + esc(e.objectives || 'Not given in the catalogue.') + '</p>' +
      (e.measured ? '<p><b>Measured:</b> ' + esc(e.measured) + '</p>' : '') + (e.earth ? '<p><b>On Earth:</b> ' + esc(e.earth) + '</p>' : '') +
      '<p class="inv-ai">The one-line summary, "Measured" and "On Earth" were written with AI from NASA\'s text; the objectives are NASA\'s own words.</p>';
    body.appendChild(det);
    var act = document.createElement('div'); act.className = 'inv-act';
    act.innerHTML = '<button class="btn sm" type="button" data-tests>See its tests</button><a class="btn ghost sm" href="' + esc(e.psi_url) + '" target="_blank" rel="noopener">NASA PSI</a>' +
      '<label class="check inv-cmp"><input type="checkbox" data-cmp> Compare</label>';
    body.appendChild(act);
    a.appendChild(body);
    act.querySelector('[data-tests]').addEventListener('click', function () { if (window.FlashpointShowTests) window.FlashpointShowTests(e.accession); });
    var cb = act.querySelector('[data-cmp]'); cb.checked = picked.indexOf(e.accession) >= 0;
    cb.addEventListener('change', function () { toggle(e.accession, cb.checked); });
    return a;
  }
  /* ---------- a compact tile, for an investigation without test rows ---------- */
  function tile(e) {
    var t = document.createElement('article'); t.className = 'inv-tile st-' + e.stage; t.dataset.acc = e.accession; t.dataset.stage = e.stage;
    var why = reasonFor(e.accession);
    t.innerHTML = '<div class="inv-top"><span class="inv-stage ' + e.stage + '">' + esc(INV.stages[e.stage]) + '</span><span class="inv-acc">' + esc(e.accession) + '</span></div>' +
      '<h5>' + icon(e.fuel_form) + esc(e.short_name) + '</h5><p class="inv-sum">' + esc(e.summary) + '</p>' +
      '<p class="inv-why">No per-test rows: ' + esc(why) + '.</p>' +
      '<div class="inv-act"><a class="linkbtn" href="' + esc(e.psi_url) + '" target="_blank" rel="noopener">NASA PSI page</a><label class="check inv-cmp"><input type="checkbox" data-cmp> Compare</label></div>';
    var cb = t.querySelector('[data-cmp]'); cb.checked = picked.indexOf(e.accession) >= 0;
    cb.addEventListener('change', function () { toggle(e.accession, cb.checked); });
    return t;
  }

  /* ---------- the cards view ---------- */
  function order(list) { var fam = Object.keys(INV.families); return list.slice().sort(function (a, b) { return fam.indexOf(a.hardware_family) - fam.indexOf(b.hardware_family); }); }
  function hasRows(e) { return ROWS.some(function (r) { return r.accession === e.accession; }); }
  function draw() {
    var box = $('invCards'); if (!box || !INV || !ROWS) return;
    box.textContent = '';
    var list = order(INV.investigations.filter(function (e) { return stage === 'all' || e.stage === stage; }));
    var data = list.filter(hasRows), rest = list.filter(function (e) { return !hasRows(e); });
    if (data.length) {
      var h = document.createElement('h3'); h.className = 'inv-h'; h.innerHTML = 'With test rows in NASA\'s tables <span>' + plural(data.length, 'investigation') + ', every map on the same scale</span>'; box.appendChild(h);
      var grid = document.createElement('div'); grid.className = 'inv-grid'; data.forEach(function (e) { grid.appendChild(card(e)); }); box.appendChild(grid);
    }
    if (rest.length && !onlyRows) {
      var h2 = document.createElement('h3'); h2.className = 'inv-h'; h2.innerHTML = 'Without per-test rows <span>' + plural(rest.length, 'investigation') + ', with the reason</span>'; box.appendChild(h2);
      var tg = document.createElement('div'); tg.className = 'inv-tiles'; rest.forEach(function (e) { tg.appendChild(tile(e)); }); box.appendChild(tg);
    }
    $('invCount').textContent = 'Showing ' + plural(data.length + (onlyRows ? 0 : rest.length), 'investigation') + ' of ' + INV.investigations.length + '.';
  }
  function stats() {
    var all = INV.investigations, withRows = all.filter(hasRows);
    var moon = withRows.map(function (e) { return [e.short_name, facts(e.accession).nearMoon, e.fuel_form]; }).filter(function (x) { return x[1]; });
    var moonN = moon.reduce(function (s, m) { return s + m[1]; }, 0);
    var solid = ROWS.filter(function (r) { return r.fuel_phase === 'solid'; }), solidP = solid.filter(function (r) { return r.pressure_psi != null; }).length;
    var noOutcome = withRows.filter(function (e) { var f = facts(e.accession); return f.out.nr === f.n; });
    return { all: all, withRows: withRows, moon: moon, moonN: moonN, solid: solid, solidP: solidP, noOutcome: noOutcome,
      moonAllDroplets: moon.every(function (m) { return m[2] === 'droplet'; }) };
  }
  function findings() {
    var s = stats();
    var tiles = [
      ['', '<b>' + s.withRows.length + '</b><small>of ' + s.all.length + '</small>', 'investigations have per-test rows (' + ROWS.length.toLocaleString('en') + ' tests). The other ' + (s.all.length - s.withRows.length) + ' are tiles below, with the reason.'],
      [s.moonAllDroplets ? 'gap' : '', '<b>' + s.moonN + '</b>', 'tests near the Moon Base air (30% oxygen, 10.2 psi): ' + s.moon.map(function (m) { return m[0] + ' ' + m[1]; }).join(', ') + (s.moonAllDroplets ? '. All are fuel droplets, none a cabin material.' : '.')],
      ['gap', '<b>' + s.solidP + '</b><small>of ' + s.solid.length + '</small>', 'solid-material tests have a pressure in NASA\'s tables, so no cabin material can be placed near any habitat.'],
      ['', '<b>' + s.noOutcome.length + '</b>', 'investigations record no outcome for any test: ' + s.noOutcome.map(function (e) { return e.short_name; }).join(', ') + '.']
    ];
    $('invFindings').innerHTML = '<div class="inv-statgrid">' + tiles.map(function (t) { return '<div class="inv-stat ' + t[0] + '"><p class="num">' + t[1] + '</p><p>' + esc(t[2]).replace(/&lt;b&gt;|&lt;\/b&gt;/g, '') + '</p></div>'; }).join('') + '</div>' +
      '<p class="note">Counted in your browser from data/tests.web.json. "Near" uses the same rule as the map: within ' + (O2S * NEAR) + ' points of oxygen or ' + (PS * NEAR) + ' psi, chamber oxygen only. On each map, the ring around the Moon Base point is that zone.</p>';
  }
  /* ---------- the landing-page strip: the same small maps, one per investigation with test rows ---------- */
  function strip() {
    var box = $('invStrip'); if (!box) return;
    var s = stats(), list = order(s.withRows);
    var names = s.moon.map(function (m) { return m[0]; });
    $('invStripTitle').textContent = s.withRows.length + ' investigations with test rows. ' + (names.length ? 'Only ' + names.join(' and ') + ' reach the Moon Base air.' : 'None reaches the Moon Base air.');
    box.textContent = '';
    list.forEach(function (e) {
      var f = facts(e.accession), fig = document.createElement('figure'); fig.className = 'inv-strip-item st-' + e.stage;
      fig.appendChild((f.chamber.length || f.burner.length) ? miniMap(f, mapLabel(e, f), true) : noMap('No oxygen or pressure recorded'));
      var cap = document.createElement('figcaption');
      cap.innerHTML = '<b>' + esc(e.short_name) + '</b><span>' + (f.withP.length ? (f.nearMoon ? f.nearMoon + ' near Moon Base' : 'none near Moon Base') : 'no pressure: unplaced') + '</span>';
      if (!f.withP.length || !f.nearMoon) cap.className = 'gap';
      fig.appendChild(cap); box.appendChild(fig);
    });
  }

  /* ---------- compare up to three ---------- */
  function toggle(acc, on) {
    picked = picked.filter(function (x) { return x !== acc && x; });
    if (on && acc) picked.push(acc);
    if (picked.length > 3) { var drop = picked.shift(); document.querySelectorAll('[data-acc="' + drop + '"] [data-cmp]').forEach(function (c) { c.checked = false; }); }
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
      var c = document.createElement('div'); c.className = 'inv-cmp-col st-' + e.stage;
      c.innerHTML = '<span class="inv-stage ' + e.stage + '">' + esc(INV.stages[e.stage]) + '</span><h4>' + esc(e.short_name) + ' <small>' + esc(e.accession) + '</small></h4><p class="inv-sum">' + esc(e.summary) + '</p>';
      if (fs[i].n && (fs[i].chamber.length || fs[i].burner.length)) { c.appendChild(miniMap(fs[i], mapLabel(e, fs[i]))); c.appendChild(outBar(fs[i])); }
      else if (fs[i].n) { c.appendChild(noMap('No oxygen or pressure recorded')); c.appendChild(outBar(fs[i])); }
      else { var w = document.createElement('p'); w.className = 'inv-why'; w.textContent = 'No per-test rows we can use: ' + reasonFor(e.accession) + '.'; c.appendChild(w); }
      var dl = document.createElement('dl');
      rows.forEach(function (r) { dl.innerHTML += '<dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1](e, fs[i])) + '</dd>'; });
      c.appendChild(dl); grid.appendChild(c);
    });
    b.appendChild(grid);
    var n = document.createElement('p'); n.className = 'note'; n.textContent = 'Maps share one scale: total pressure 0 to 16 psi across, oxygen 10 to 100% up; the ring is the Moon Base "near" zone. Summaries are AI-written from NASA\'s objectives; every number is counted from NASA\'s rows.'; b.appendChild(n);
    cmpFrom = document.activeElement; $('invCmp').hidden = false; $('invCmpClose').focus();
  }
  var cmpFrom = null;
  function closeCompare() { $('invCmp').hidden = true; if (cmpFrom && cmpFrom.focus) cmpFrom.focus(); }

  /* ---------- the Cards / Table switch, the filters and the ways in ---------- */
  function showView(v) {
    document.querySelectorAll('#invView button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.iv === v); });
    $('invCardsView').hidden = v !== 'cards'; $('invTableView').hidden = v !== 'table';
  }
  function openCards() {
    var page = $('page-analysis');
    if (page && !page.classList.contains('open')) { var c = document.querySelector('.card[data-page="analysis"]'); if (c) c.click(); setTimeout(function () { if (window.FlashpointOpenCards) window.FlashpointOpenCards(); showView('cards'); }, 650); return; }
    if (window.FlashpointOpenCards) window.FlashpointOpenCards(); showView('cards');
  }
  function render() { if (INV && ROWS) { findings(); draw(); strip(); } }
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
    document.querySelectorAll('[data-open-cards]').forEach(function (b) { b.addEventListener('click', openCards); });
    Promise.all([
      fetch('../data/investigations.json').then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }),
      fetch('../data/tests.meta.json').then(function (r) { return r.ok ? r.json() : null; }, function () { return null; })
    ]).then(function (res) { INV = res[0]; META = res[1]; render(); },
      function () { $('invCards').innerHTML = '<p class="note">Could not load data/investigations.json. Open the site through a web server started in the repo root.</p>'; });
    document.addEventListener('fp-data', function (e) { ROWS = e.detail; render(); });
    if (window.FlashpointRows) { ROWS = window.FlashpointRows; render(); }
  }
  init();
})();
