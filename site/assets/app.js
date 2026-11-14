/* Flashpoint site script: the Analysis page (the map as Simple mode, investigations and test data as Advanced mode),
   the assistant panel, and navigation. The Sim page loads sim.html in a frame. AI-assisted (Claude Code). */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (id) { return document.getElementById(id); };
  var clamp = function (x, a, b) { return Math.min(b, Math.max(a, x)); };
  var NS = 'http://www.w3.org/2000/svg';
  function el(tag, attrs, parent) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
  function tween(from, to, ms, step, done) {
    if (reduce) { step(to); if (done) done(); return; }
    var t0 = performance.now();
    (function f(now) { var k = clamp((now - t0) / ms, 0, 1), e = 1 - Math.pow(1 - k, 3); step(from + (to - from) * e); if (k < 1) requestAnimationFrame(f); else if (done) done(); })(t0);
  }
  var SEA_PPO2 = 3.07;   // psi, from the roadmap: o2 fraction times pressure at sea level

  /* ---------- Shared map: pressure (x) against oxygen (y) ---------- */
  function makeMap(svg, opts) {
    // A small map (a phone, or the side panel) gets its own proportions so the text stays readable.
    var narrow = window.innerWidth <= 860 || (svg.getBoundingClientRect().width || 680) < 520;
    var W = narrow ? 440 : 680, H = narrow ? 460 : 420, L = narrow ? 46 : 56, R = 18, T = 32, B = narrow ? 52 : 44;
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H); svg.classList.toggle('narrow', narrow);
    var x = function (p) { return L + p / 16 * (W - L - R); };
    var y = function (o) { return H - B - (o - 10) / 90 * (H - T - B); };
    var plot = el('g', { 'class': 'plot' }, svg);
    el('rect', { 'class': 'bg', x: L, y: T, width: W - L - R, height: H - T - B }, plot);
    for (var p = 0; p <= 16; p += narrow ? 4 : 2) { el('line', { 'class': 'gridl', x1: x(p), x2: x(p), y1: T, y2: H - B }, plot); var t = el('text', { x: x(p), y: H - B + 18, 'text-anchor': 'middle' }, svg); t.textContent = p; }
    for (var o = narrow ? 20 : 10; o <= 100; o += narrow ? 20 : 10) { el('line', { 'class': 'gridl', x1: L, x2: W - R, y1: y(o), y2: y(o) }, plot); var t2 = el('text', { x: L - 8, y: y(o) + 4, 'text-anchor': 'end' }, svg); t2.textContent = o; }
    el('path', { 'class': 'axis', d: 'M' + L + ' ' + T + 'V' + (H - B) + 'H' + (W - R) }, svg);
    var xl = el('text', { x: W - R, y: H - 6, 'text-anchor': 'end' }, svg); xl.textContent = 'Total pressure (psi)';
    var yl = el('text', { x: 10, y: 12 }, svg); yl.textContent = 'Oxygen (%)';
    var dotsG = el('g', { 'class': 'tdots' }, plot);
    function dots(rows) {
      while (dotsG.firstChild) dotsG.removeChild(dotsG.firstChild);
      // Drawn in three passes so the rarer, more telling marks sit on top: not recorded, went out, kept burning.
      var kind = function (r) { return r.ignited === false || r.outcome === 'self_extinguished' ? 'x' : r.outcome === 'burned' ? 'b' : 'u'; };
      [['u', 2.4], ['x', 3.6], ['b', 4]].forEach(function (k) {
        rows.forEach(function (r) { if (kind(r) === k[0]) el('circle', { 'class': 'tdot ' + k[0], cx: x(r.pressure_psi), cy: y(r.o2_pct), r: k[1] }, dotsG); });
      });
    }
    var d = '';
    for (var pp = SEA_PPO2; pp <= 16.001; pp += 0.1) d += (d ? 'L' : 'M') + x(pp).toFixed(1) + ' ' + y(SEA_PPO2 / pp * 100).toFixed(1);
    el('path', { 'class': 'curve', d: d }, plot);
    var cl = el('text', { 'class': 'curvelbl', x: x(5.4) + 10, y: y(SEA_PPO2 / 5.4 * 100) - 4 }, plot); cl.textContent = 'Same oxygen as sea level';
    [['ISS', 14.7, 21, 'c'], ['Moon Base', 10.2, 30, 'c'], ['Spacesuit', 4.3, 100, 'r']].forEach(function (h) {
      var g = el('g', { 'class': 'hab' }, plot);
      if (h[3] === 'c') el('circle', { cx: x(h[1]), cy: y(h[2]), r: 6 }, g); else el('rect', { x: x(h[1]) - 6, y: y(h[2]) - 6, width: 12, height: 12 }, g);
      var tt = el('text', h[3] === 'r' ? { x: x(h[1]) + 13, y: y(h[2]) + 4 } : { x: x(h[1]) + 10, y: y(h[2]) - 11 }, g); tt.textContent = h[0];
    });
    var probe = el('g', { 'class': 'probe' }, svg);
    var hx = el('line', { x1: L }, probe), vx = el('line', { y2: H - B }, probe);
    el('circle', { 'class': 'ring', r: 15 }, probe); el('circle', { 'class': 'dot', r: 4 }, probe);
    var state = { p: 10.2, o: 30 };
    function set(p, o) {
      state.p = clamp(p, 1, 16); state.o = clamp(o, 10, 100);
      var px = x(state.p), py = y(state.o);
      probe.querySelectorAll('circle').forEach(function (c) { c.setAttribute('cx', px); c.setAttribute('cy', py); });
      hx.setAttribute('x2', px); hx.setAttribute('y1', py); hx.setAttribute('y2', py);
      vx.setAttribute('x1', px); vx.setAttribute('x2', px); vx.setAttribute('y1', py);
      if (opts.onMove) opts.onMove(state.p, state.o);
    }
    function moveTo(p, o, ms) { var p0 = state.p, o0 = state.o; tween(0, 1, ms || 700, function (k) { set(p0 + (p - p0) * k, o0 + (o - o0) * k); }); }
    if (opts.drag) {
      var drag = false;
      function toData(e) { var pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(svg.getScreenCTM().inverse()); return { p: (pt.x - L) / (W - L - R) * 16, o: 10 + (H - B - pt.y) / (H - T - B) * 90 }; }
      svg.addEventListener('pointerdown', function (e) { drag = true; svg.setPointerCapture(e.pointerId); var d0 = toData(e); set(d0.p, d0.o); });
      svg.addEventListener('pointermove', function (e) { if (drag) { var d1 = toData(e); set(d1.p, d1.o); } });
      ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (name) { svg.addEventListener(name, function () { drag = false; }); });
      svg.setAttribute('tabindex', '0');
      svg.addEventListener('keydown', function (e) {
        var k = { ArrowLeft: [-0.2, 0], ArrowRight: [0.2, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }[e.key];
        if (k) { e.preventDefault(); set(state.p + k[0], state.o + k[1]); }
      });
    }
    set(state.p, state.o);
    return { set: set, moveTo: moveTo, state: state, root: svg.parentNode, dots: dots };
  }

  function segInit(seg, onPick) {
    seg.querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () { seg.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); onPick(b); });
    });
  }
  function segSet(seg, attr, val) { seg.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', x.getAttribute(attr) === String(val)); }); }

  /* ---------- NASA test rows (data/tests.web.json) and the offline answer engine (public/offline) ---------- */
  var ROWS = null;
  var OFF = window.FlashpointOffline || null;
  var CHAT_ENDPOINT = null;   // Explicit local rule-based mode; do not request a nonexistent endpoint.
  function loadRows(done) {
    var urls = ['../data/tests.web.json'];
    (function next(i) {
      if (i >= urls.length) { done(null); return; }
      fetch(urls[i]).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(done, function () { next(i + 1); });
    })(0);
  }
  var OUTCOME_TXT = { self_extinguished: 'Went out by itself', burned: 'Kept burning', unknown: 'Not recorded', suppressed: 'Put out' };
  function outcomeText(r) { return r.ignited === false ? 'Did not ignite' : (OUTCOME_TXT[r.outcome] || r.outcome); }
  function td(tr, text, href) {
    var c = document.createElement('td');
    if (href) { var a = document.createElement('a'); a.href = href; a.target = '_blank'; a.rel = 'noopener'; a.textContent = text; c.appendChild(a); }
    else c.textContent = text;
    tr.appendChild(c);
  }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var PSI_PAGE = 'https://psi.nasa.gov/physci/repo/data/investigations/';
  var evPending = null, lastEv = null, lastCover = null, lastRank = null;
  var RATE = { lit: '10+ nearby', dim: '1 to 9 nearby', dark: 'None nearby' };
  // Coverage is rated for each kind of fuel on its own: a point can be well tested with gas flames and untested with cabin materials.
  var KINDS = [['gas', 'Gas flames'], ['liquid', 'Fuel droplets'], ['solid', 'Solid materials']];
  // What each investigation is for, in the challenge statement's own terms (prevention, detection, suppression).
  var ROLE = {
    'PSI-25': 'Prevent: how solid materials burn', 'PSI-26': 'Prevent: how solid materials burn',
    'PSI-98': 'Prevent: large-scale material fires', 'PSI-99': 'Prevent: large-scale material fires', 'PSI-100': 'Prevent: large-scale material fires',
    'PSI-69': 'Suppress: droplets in diluted oxygen', 'PSI-39': 'Flame science: fuel droplets',
    'PSI-159': 'Flame science: gas flames', 'PSI-10': 'Flame science: gas flames'
  };
  function nearText() { return 'normalized distance 1: sqrt((oxygen difference / 10)^2 + (pressure difference / 2)^2) <= 1'; }
  function nTests(n) { return n + (n === 1 ? ' test' : ' tests'); }
  function solidSummary() {
    if (solidSummary.v) return solidSummary.v;
    var s = ROWS.filter(function (r) { return r.fuel_phase === 'solid'; }), o = s.filter(function (r) { return r.o2_pct != null; }).map(function (r) { return r.o2_pct; });
    return (solidSummary.v = { n: s.length, withP: s.filter(function (r) { return r.pressure_psi != null; }).length, lo: Math.min.apply(null, o), hi: Math.max.apply(null, o) });
  }
  function coverAt(p, o) {
    var s = solidSummary();
    return KINDS.map(function (k) {
      var ev = OFF.evidenceAt(ROWS, { o2_pct: o, pressure_psi: p }, { k: 1, fuelPhase: k[0] }), text = nTests(ev.nearCount) + ' near this point.';
      if (k[0] === 'solid' && !s.withP) text = 'None of the ' + s.n + ' solid-material tests can be placed: NASA\'s tables give them no pressure. Their oxygen ran from ' +
        s.lo.toFixed(1) + ' to ' + s.hi.toFixed(1) + '%' + (o > s.hi ? ', and this point is above all of them.' : '.');
      return { kind: k[0], label: k[1], rating: ev.rating, n: ev.nearCount, text: text };
    });
  }
  // Rank the investigations for a point: most tests near it first, then the closest test. No pressure in the table: cannot be placed.
  function rankAt(p, o) {
    var by = {}, placed = [], unplaced = [];
    ROWS.forEach(function (r) { (by[r.accession] = by[r.accession] || []).push(r); });
    Object.keys(by).forEach(function (acc) {
      var rows = by[acc], ev = OFF.evidenceAt(rows, { o2_pct: o, pressure_psi: p }, { k: 1 }), n = ev.nearest[0];
      var o2 = rows.filter(function (r) { return r.o2_pct != null; }).map(function (r) { return r.o2_pct; });
      (n ? placed : unplaced).push({ acc: acc, name: rows[0].investigation, role: ROLE[acc] || '', total: rows.length, near: ev.nearCount, closest: n || null,
        o2: o2.length ? [Math.min.apply(null, o2), Math.max.apply(null, o2)] : null });
    });
    placed.sort(function (a, b) { return b.near - a.near || a.closest.distance - b.closest.distance; });
    unplaced.sort(function (a, b) { return b.total - a.total; });
    return { placed: placed, unplaced: unplaced };
  }
  function drawRank(rank, o) {
    var tb = $('homeRank'); tb.textContent = '';
    rank.placed.concat(rank.unplaced).forEach(function (it, i) {
      var tr = document.createElement('tr'), c = it.closest && it.closest.row;
      td(tr, c ? String(i + 1) : 'Not ranked'); td(tr, it.name + ' (' + it.acc + ')', PSI_PAGE + it.acc); td(tr, it.role);
      td(tr, c ? it.near + ' of ' + it.total : 'Cannot be placed: no pressure in NASA\'s table');
      td(tr, c ? c.test_id + ': ' + c.o2_pct.toFixed(1) + '% oxygen, ' + c.pressure_psi.toFixed(1) + ' psi, ' + outcomeText(c).toLowerCase()
        : it.o2 ? nTests(it.total) + ', oxygen ' + it.o2[0].toFixed(1) + (it.o2[1] > it.o2[0] ? ' to ' + it.o2[1].toFixed(1) : '') + '%' + (o > it.o2[1] ? ' (this point is above that)' : '') : nTests(it.total) + ', oxygen not recorded');
      var last = document.createElement('td'), b = document.createElement('button'); b.className = 'linkbtn'; b.type = 'button'; b.textContent = 'See its tests';
      b.addEventListener('click', function () { showTestsOf(it.acc); }); last.appendChild(b); tr.appendChild(last);
      if (!c) tr.className = 'unplaced';
      tb.appendChild(tr);
    });
  }
  function updateEvidence(p, o) {
    if (!ROWS || !OFF) return;
    evPending = [p, o];
    if (updateEvidence.raf) return;
    updateEvidence.raf = requestAnimationFrame(function () {
      updateEvidence.raf = 0;
      var p = evPending[0], o = evPending[1];
      var ev = OFF.evidenceAt(ROWS, { o2_pct: o, pressure_psi: p }, { k: 5 });
      lastEv = ev; lastCover = coverAt(p, o); lastRank = rankAt(p, o);
      var box = $('homeCover'); box.textContent = '';
      lastCover.forEach(function (c) {
        var row = document.createElement('div'); row.className = 'cov';
        row.innerHTML = '<b>' + c.label + '</b><span class="rate ' + c.rating + '">' + (c.kind === 'solid' && !solidSummary().withP ? 'Not placeable' : RATE[c.rating]) + '</span><p>' + esc(c.text) + '</p>';
        box.appendChild(row);
      });
      $('homeRateNote').textContent = 'A nearby row has ' + nearText() + '. Counts include only chamber oxygen; inverse flames are left out.';
      drawRank(lastRank, o);
      var tb = $('homeNear'); tb.classList.remove('skel'); tb.textContent = '';
      ev.nearest.forEach(function (n) {
        var r = n.row, tr = document.createElement('tr');
        td(tr, r.accession, PSI_PAGE + r.accession);
        td(tr, (r.investigation || '') + ' ' + (r.test_id || ''));
        td(tr, (r.fuel || '').replace(/\s+/g, ' ') + (r.fuel_phase === 'liquid' ? ' droplet' : ''));
        td(tr, r.o2_pct.toFixed(1)); td(tr, r.pressure_psi.toFixed(1)); td(tr, outcomeText(r));
        tb.appendChild(tr);
      });
    });
  }

  /* Evidence brief: one printable page for the point on the map. Built from the rows and fixed rules; no AI writes it. */
  var briefFrom = null;
  function li(ul, html) { var x = document.createElement('li'); x.innerHTML = html; ul.appendChild(x); }
  function openBrief(print) {
    if (!ROWS || !OFF || !lastEv) return;
    var p = home.state.p, o = home.state.o, pp = o / 100 * p, s = solidSummary();
    // Snapshot this exact point, including when opened before the next animation frame.
    var ev = OFF.evidenceAt(ROWS, { o2_pct: o, pressure_psi: p }, { k: 5 });
    lastCover = coverAt(p, o); lastRank = rankAt(p, o);
    var b = $('briefBody'); b.textContent = '';
    b.innerHTML = '<span class="kind">Evidence brief</span><h2 id="briefTitle">' + o.toFixed(1) + '% oxygen at ' + p.toFixed(1) + ' psi</h2>' +
      '<p class="lead">Oxygen partial pressure ' + pp.toFixed(2) + ' psi, ' + (pp / SEA_PPO2).toFixed(2) + ' times sea level. Every NASA test used here ran in microgravity.</p>' +
      '<dl class="facts"><div><dt>Oxygen</dt><dd>' + o.toFixed(1) + '%</dd></div><div><dt>Pressure</dt><dd>' + p.toFixed(1) + ' psi</dd></div><div><dt>Oxygen partial pressure</dt><dd>' + pp.toFixed(2) + ' psi</dd></div><div><dt>Compared with sea level</dt><dd>' + (pp / SEA_PPO2).toFixed(2) + '&times;</dd></div></dl>' +
      '<h3>Evidence here, by what burned</h3>' +
      lastCover.map(function (c) { return '<p><span class="rate ' + c.rating + '">' + (c.kind === 'solid' && !solidSummary().withP ? 'Not placeable' : RATE[c.rating]) + '</span> <b>' + c.label + ':</b> ' + esc(c.text) + '</p>'; }).join('') +
      '<p class="src">' + esc($('homeRateNote').textContent) + '</p>' +
      '<h3>Investigations ranked for this point</h3><ol>' +
      lastRank.placed.map(function (r) { return '<li><b>' + esc(r.name) + '</b> (' + r.acc + '): ' + r.near + ' of its ' + nTests(r.total) + ' sit near this point. ' + esc(r.role) + '.</li>'; }).join('') + '</ol>' +
      '<p>Cannot be placed, because NASA\'s tables give no pressure: ' + lastRank.unplaced.map(function (r) { return esc(r.name); }).join(', ') + '.</p>' +
      '<h3>Nearest NASA tests</h3>';
    var t = document.createElement('table'); t.innerHTML = '<thead><tr><th>Accession</th><th>Test</th><th>Fuel</th><th>O2 %</th><th>psi</th><th>Outcome</th></tr></thead>';
    var tb = document.createElement('tbody'); t.appendChild(tb);
    ev.nearest.forEach(function (n) { var r = n.row, tr = document.createElement('tr');
      td(tr, r.accession, PSI_PAGE + r.accession); td(tr, (r.investigation || '') + ' ' + (r.test_id || ''));
      td(tr, (r.fuel || '').replace(/\s+/g, ' ')); td(tr, r.o2_pct.toFixed(1)); td(tr, r.pressure_psi.toFixed(1)); td(tr, outcomeText(r)); tb.appendChild(tr); });
    var tw = document.createElement('div'); tw.className = 'tablewrap'; tw.appendChild(t); b.appendChild(tw);
    var h = document.createElement('h3'); h.textContent = 'What NASA\'s tests do not cover here'; b.appendChild(h);
    var gaps = document.createElement('ul'); b.appendChild(gaps);
    li(gaps, 'Cabin materials: the ' + s.n + ' solid-material tests (BASS, BASS-II, SAFFIRE) have no pressure in NASA\'s tables, and their oxygen went no higher than ' + s.hi.toFixed(1) + '%.' + (o > s.hi ? ' <b>This point is above that.</b>' : ''));
    li(gaps, 'Gravity: every test ran in microgravity. PSI has no partial-gravity tests yet, so the Moon and Mars are bounded by microgravity and Earth results.');
    if (ev.rating === 'dark') li(gaps, 'No microgravity test of any fuel ' + nearText() + ' of this point.');
    li(gaps, 'Inverse gas flames (oxygen from the burner, not the air around the flame) are left out of these counts.');
    h = document.createElement('h3'); h.textContent = 'NASA work that would close the gap (not in PSI yet)'; b.appendChild(h);
    var next = document.createElement('ul'); b.appendChild(next);
    li(next, '<b>FM2, Flammability of Materials on the Moon:</b> burning materials at lunar gravity, the first combustion experiment on another planetary body.');
    li(next, '<b>SoFIE, Solid Fuel Ignition and Extinction:</b> tests whether NASA\'s ground flammability test for flight materials is conservative enough in low gravity.');
    li(next, '<b>FLARE, Flammability Limits At Reduced-g Experiment:</b> a way to estimate microgravity flammability limits from ground tests (JAXA, NASA, ESA, CNES, DLR).');
    var src = document.createElement('p'); src.className = 'src';
    src.textContent = 'Flashpoint, team BrayTech Pyrotechnics. Built ' + new Date().toISOString().slice(0, 10) + ' from data/tests.web.json (NASA Physical Science Informatics) with the rating rule in lib/evidence.ts. Upcoming experiments from NASA Glenn Research Center. AI-assisted templates; numbers computed from NASA rows. Coverage is not a safety certification.';
    b.appendChild(src);
    briefFrom = document.activeElement; $('brief').hidden = false; $('briefClose').focus();
    if (print) setTimeout(printBrief, 50);
  }
  function closeBrief() { $('brief').hidden = true; if (briefFrom) briefFrom.focus(); }
  function printBrief() { document.body.classList.add('printing'); window.print(); }
  window.addEventListener('afterprint', function () { document.body.classList.remove('printing'); });
  $('briefOpen').addEventListener('click', function () { openBrief(false); });
  $('briefPdf').addEventListener('click', function () { openBrief(true); });
  $('briefPrint').addEventListener('click', printBrief);
  $('briefClose').addEventListener('click', closeBrief);
  $('brief').addEventListener('click', function (e) { if (e.target === this) closeBrief(); });

  /* ---------- Map ---------- */
  var home = makeMap($('homeSvg'), { drag: true, onMove: function (p, o) {
    var pp = o / 100 * p;
    $('hO2').innerHTML = o.toFixed(1) + '<small>%</small>';
    $('hP').innerHTML = p.toFixed(1) + '<small>psi</small>';
    $('hPP').innerHTML = pp.toFixed(2) + '<small>psi</small>';
    $('hSea').innerHTML = (pp / SEA_PPO2).toFixed(2) + '<small>&times;</small>';
    updateEvidence(p, o);
  } });
  $('homePresets').querySelectorAll('button').forEach(function (b) { b.addEventListener('click', function () { home.moveTo(+b.dataset.p, +b.dataset.o); }); });
  // Two ways to carry the point elsewhere: the same tests in Advanced mode, and the same air in the Sim.
  $('homeAround').addEventListener('click', function () {
    if (!OFF || !DATA.length) return;
    var o = home.state.o, p = home.state.p, dO = OFF.O2_SCALE * OFF.NEAR_DISTANCE, dP = OFF.P_SCALE * OFF.NEAR_DISTANCE;
    FS = freshFilters(); FS.o2min = +(o - dO).toFixed(1); FS.o2max = +(o + dO).toFixed(1); FS.pmin = +Math.max(0, p - dP).toFixed(1); FS.pmax = +(p + dP).toFixed(1);
    syncFilters(); refresh(); showMode('advanced'); showResView('data'); $('page-analysis').scrollTop = 0;
  });
  $('homeBurn').addEventListener('click', function () {
    simPoint(home.state.o, home.state.p, true);
    window.history.pushState({}, '', '#sim'); open('sim', null);
  });

  /* ---------- Assistant: one chat for every page. It answers from the SI chat or the offline engine, and moves the point on the map. ---------- */
  var moves = [], chat = $('chat'), chatFrom = null;
  function movePoint(o, p, label) {
    moves.push({ o: home.state.o, p: home.state.p, label: label });
    home.moveTo(p, o, 800); simPoint(o, p);
  }
  function undo() {
    var h = moves.pop(); if (!h) return 'There is nothing to undo.';
    home.moveTo(h.p, h.o, 700); simPoint(h.o, h.p);
    return 'Undone: ' + h.label.charAt(0).toLowerCase() + h.label.slice(1) + '.';
  }
  function interpret(text) {
    var t = text.toLowerCase(), next = {}, said = [];
    if (/\bundo\b/.test(t)) return { reply: undo() };
    if (/\breset\b/.test(t)) { next = { o: 21, p: 14.7 }; said.push('Reset to ISS air'); }
    if (/moon\s*base|lunar\s*base|rover/.test(t)) { next.o = 30; next.p = 10.2; said.push('Moved to the Moon Base atmosphere (30% oxygen, 10.2 psi)'); }
    else if (/\biss\b|space station/.test(t)) { next.o = 21; next.p = 14.7; said.push('Moved to the ISS atmosphere (21% oxygen, 14.7 psi)'); }
    else if (/space\s*suit|\bsuit\b|\beva\b/.test(t)) { next.o = 100; next.p = 4.3; said.push('Moved to the spacesuit atmosphere (100% oxygen, 4.3 psi)'); }
    // Numbers come from the offline engine's parser (units, "30% oxygen and 10.2 psi"); the simple patterns are the backup if it did not load.
    var q = OFF ? OFF.parseQuestion(text) : null;
    var mo = q ? (q.o2_pct != null ? [0, q.o2_pct] : null) : (t.match(/(?:oxygen|o2)\D{0,12}(\d+(?:\.\d+)?)/) || t.match(/(\d+(?:\.\d+)?)\s*%/));
    if (mo) { next.o = clamp(+mo[1], 10, 100); said.push('Set oxygen to ' + next.o + '%'); }
    var mp = q ? (q.pressure_psi != null ? [0, q.pressure_psi] : null) : (t.match(/(\d+(?:\.\d+)?)\s*psi/) || t.match(/pressure\D{0,12}(\d+(?:\.\d+)?)/));
    if (mp) { next.p = clamp(+mp[1], 1, 16); said.push('Set pressure to ' + next.p + ' psi'); }
    if (!said.length) return { reply: 'I can move the point on the map (oxygen and pressure, or the ISS, the Moon Base or a spacesuit) and answer from NASA\'s test data.' };
    var o = next.o !== undefined ? next.o : home.state.o, p = next.p !== undefined ? next.p : home.state.p, pp = o / 100 * p, label = said.join('; ');
    movePoint(o, p, label);
    var extra = ' Oxygen partial pressure is now ' + pp.toFixed(2) + ' psi, ' + (pp / SEA_PPO2).toFixed(2) + ' times sea level.';
    if (q && q.gravity && q.gravity !== '0g') extra += ' Every NASA test in the data ran in microgravity, so there is no test at another gravity level. The Sim shows what gravity would change.';
    return { reply: label + '.' + extra, did: label };
  }
  function addMsg(cls, text, did, why) {
    var m = document.createElement('div'); m.className = 'msg ' + cls; m.textContent = text;
    if (did) { var s = document.createElement('span'); s.className = 'did'; s.textContent = 'Moved the point on the map'; m.appendChild(s); }
    if (why) { var w = document.createElement('span'); w.className = 'why'; w.textContent = why; m.appendChild(w); }
    $('msgs').appendChild(m); $('msgs').scrollTop = $('msgs').scrollHeight; return m;
  }
  function send(text) {
    text = text.trim(); if (!text) return;
    addMsg('user', text);
    var typing = document.createElement('div'); typing.className = 'typing'; typing.innerHTML = '<i></i><i></i><i></i>';
    $('msgs').appendChild(typing); $('msgs').scrollTop = $('msgs').scrollHeight;
    var r = interpret(text);
    // Undo and reset only move the point; everything else also gets an answer from NASA's data.
    if (/\b(undo|reset)\b/i.test(text) || !ROWS || !OFF) {
      setTimeout(function () { typing.remove(); addMsg('bot', r.reply, r.did); }, reduce ? 0 : 650);
      return;
    }
    (CHAT_ENDPOINT ? OFF.askWithFallback(text, ROWS, { endpoint: CHAT_ENDPOINT, timeoutMs: 8000 }) : Promise.resolve(OFF.answerOffline(text, ROWS))).then(function (ans) {
      typing.remove();
      if (ans.mode === 'si') { var d = ans.data || {}; addMsg('bot', String(d.answer || d.text || JSON.stringify(d)), r.did); return; }
      var did = r.did;
      // If the point did not move yet, move it to the point the answer looked at (within the map's range).
      if (!did && ans.probe) {
        var no = clamp(+ans.probe.o2_pct.toFixed(1), 10, 100), np = clamp(+ans.probe.pressure_psi.toFixed(1), 1, 16);
        did = 'Moved to the point in the answer (' + no + '% oxygen, ' + np + ' psi)';
        movePoint(no, np, did);
      }
      // The panel's header already says answers are offline, so the engine's own opening line about it is left out here.
      var paras = ans.paragraphs.filter(function (t, i) { return !(i === 0 && /^Offline answer/i.test(t)); });
      // The engine counts every fuel together. Say what burned in those tests, so "well covered" is not read as "cabin materials were tested".
      if (ans.probe) paras.push('By what burned: ' + coverAt(ans.probe.pressure_psi, ans.probe.o2_pct).map(function (c) {
        return c.label.toLowerCase() + ', ' + RATE[c.rating].toLowerCase() + (c.kind === 'solid' ? ' (NASA\'s solid-material tests record no pressure, so none can be placed)' : c.n ? ' (' + nTests(c.n) + ')' : '');
      }).join('; ') + '.');
      var body = (r.did ? r.reply + '\n\n' : '') + paras.join('\n\n');
      var msg = addMsg('bot', body, did, 'Rule-based answer. Coverage is not a safety rating.');
      var sources = document.createElement('div'); sources.className = 'answer-sources';
      (ans.citations || []).filter(function(c) { return c.url; }).forEach(function(c) {
        var a = document.createElement('a'); a.href = c.url; a.target = '_blank'; a.rel = 'noopener'; a.textContent = c.label; sources.appendChild(a);
      }); msg.appendChild(sources);
    });
  }
  function openChat() { if (chat.hidden) { chatFrom = document.activeElement; chat.hidden = false; } $('ask').focus(); }
  function closeChat() { chat.hidden = true; if (chatFrom && chatFrom.focus) chatFrom.focus(); }
  addMsg('bot', 'Hi. Ask about a cabin atmosphere (oxygen, pressure, fuel), or tell me where to move the point on the map. The SI assistant is not connected yet, so I answer from NASA\'s test data with fixed rules.');
  $('compose').addEventListener('submit', function (e) { e.preventDefault(); send($('ask').value); $('ask').value = ''; });
  $('starters').querySelectorAll('.chip').forEach(function (c) { c.addEventListener('click', function () { send(c.textContent); }); });
  document.querySelectorAll('[data-ask]').forEach(function (b) { b.addEventListener('click', function () { if (chat.hidden) openChat(); else closeChat(); }); });
  $('chatClose').addEventListener('click', closeChat);
  // The box on the dashboard: open the Analysis page (where the point moves), open the panel, and ask.
  $('homeAsk').addEventListener('submit', function (e) {
    e.preventDefault();
    var v = $('homeAskIn').value; $('homeAskIn').value = '';
    if (!document.querySelector('.page.open')) { window.history.pushState({}, '', '#analysis'); open('analysis', null); }
    openChat(); send(v);
  });

  /* ---------- Resources: the 24 PSI combustion records ---------- */
  // Accession, name and platform from the PSI catalogue (docs/challenge/resources.md).
  // Test counts are rows in data/tests.web.json. Fuel only where we have checked it; '' means not checked yet.
  var CAT = [
    ['PSI-10', 'ACME Flame Design', 'ISS', 'gas', 327], ['PSI-20', 'ACME BRE', 'ISS', 'gas', 0],
    ['PSI-21', 'ACME CLD Flame', 'ISS', 'gas', 0], ['PSI-22', 'ACME E-FIELD Flames', 'ISS', 'gas', 0],
    ['PSI-23', 'ACME s-Flame', 'ISS', 'gas', 0], ['PSI-159', 'ACME CFI-G', 'ISS', 'gas', 333],
    ['PSI-25', 'BASS-II', 'ISS', 'solid', 129], ['PSI-26', 'BASS', 'ISS', 'solid', 121],
    ['PSI-39', 'CFI', 'ISS', 'liquid', 79], ['PSI-47', 'DAFT / DAFT-2', 'ISS', 'aerosol', 0],
    ['PSI-68', 'FLEX-2', 'ISS', 'liquid', 0], ['PSI-69', 'FLEX', 'ISS', 'liquid', 274],
    ['PSI-98', 'SAFFIRE-I', 'ISS', 'solid', 2], ['PSI-99', 'SAFFIRE-II', 'Cygnus spacecraft', 'solid', 9],
    ['PSI-100', 'SAFFIRE-III', 'ISS', 'solid', 2], ['PSI-101', 'SAME-R', 'ISS', 'aerosol', 0],
    ['PSI-102', 'SAME', 'ISS', 'aerosol', 0], ['PSI-106', 'SLICE', 'ISS', 'gas', 0],
    ['PSI-107', 'SPICE', 'ISS', 'gas', 0], ['PSI-60', 'Computational and Experimental Analysis of SPICE Data Sets', 'Ground', '', 0],
    ['PSI-62', 'Concurrent Flame Spread Modeling using Flamelet Generated Manifolds', 'Ground', '', 0],
    ['PSI-115', 'Utilization of the SAME Data', 'Not applicable', '', 0],
    ['PSI-117', 'Effect of External Thermo-Convective Perturbation on Cool Flame Dynamics', 'Ground', '', 0],
    ['PSI-142', 'Quantitative Studies of Cool Flame Transitions', 'Not applicable', '', 0]
  ];
  var PH = { gas: 'Gas', liquid: 'Liquid', solid: 'Solid', aerosol: 'Smoke or dust' };
  var catPhase = 'all', catPlat = 'all', catSort = { i: 0, dir: 0 };   // dir 0 keeps the catalogue order
  function platGroup(p) { return p === 'ISS' ? 'iss' : p === 'Cygnus spacecraft' ? 'cygnus' : 'ground'; }
  function drawCat() {
    var q = $('catSearch').value.trim().toLowerCase(), tb = document.querySelector('#catTable tbody');
    tb.innerHTML = '';
    var list = CAT.filter(function (r) {
      return (catPhase === 'all' || r[3] === catPhase) && (catPlat === 'all' || platGroup(r[2]) === catPlat) && (!$('catHas').checked || r[4] > 0) &&
        (!q || (r[0] + ' ' + r[1] + ' ' + r[2] + ' ' + (PH[r[3]] || '')).toLowerCase().indexOf(q) >= 0);
    });
    if (catSort.dir) list.sort(function (a, b) {
      var x = a[catSort.i], y = b[catSort.i];
      if (catSort.i === 0) { x = +x.slice(4); y = +y.slice(4); }
      return (x < y ? -1 : x > y ? 1 : 0) * catSort.dir;
    });
    $('catCount').textContent = 'Showing ' + list.length + ' of ' + CAT.length + ' records.';
    list.forEach(function (r, i) {
        var tr = document.createElement('tr'); tr.tabIndex = 0;
        tr.innerHTML = '<td>' + r[0] + '</td><td>' + r[1] + '</td><td>' + r[2] + '</td><td>' + (r[3] ? '<span class="phase">' + PH[r[3]] + '</span>' : '') + '</td><td class="rows num">' + (r[4] || 'none') + '</td>';
        tr.style.animation = reduce ? 'none' : 'pop 350ms ' + (i * 25) + 'ms var(--ease) backwards';
        function pick() { tb.querySelectorAll('tr').forEach(function (x) { x.removeAttribute('aria-selected'); }); tr.setAttribute('aria-selected', 'true'); showDetail(r); }
        tr.addEventListener('click', pick); tr.addEventListener('keydown', function (e) { if (e.key === 'Enter') pick(); });
        tb.appendChild(tr);
      });
  }
  // What an investigation's rows cover (ranges and counts from data/tests.web.json), or why it has none (tests.meta.json).
  var META = null;
  fetch('../data/tests.meta.json').then(function (r) { return r.ok ? r.json() : null; }).then(function (m) { META = m; }, function () {});
  function range(list) { if (!list.length) return null; var lo = Math.min.apply(null, list), hi = Math.max.apply(null, list); return lo === hi ? fmt(lo) : fmt(lo) + ' to ' + fmt(hi); }
  function coverage(acc) {
    var rows = DATA.filter(function (d) { return d.r.accession === acc; }).map(function (d) { return d.r; });
    if (!rows.length) {
      var why = null;
      if (META && META.excluded) Object.keys(META.excluded).forEach(function (k) { if (k.split(/,\s*/).indexOf(acc) >= 0) why = META.excluded[k]; });
      return '<p class="note">No test rows we can use' + (why ? ': ' + esc(why.replace(/^[^:]*:\s*/, '')) : '') + '.</p>';
    }
    var o2c = rows.filter(function (r) { return r.o2_pct != null && r.oxygen_from === 'chamber'; }).map(function (r) { return r.o2_pct; });
    var o2b = rows.filter(function (r) { return r.o2_pct != null && r.oxygen_from === 'burner'; }).map(function (r) { return r.o2_pct; });
    var ps = rows.filter(function (r) { return r.pressure_psi != null; }).map(function (r) { return r.pressure_psi; });
    var cnt = function (f) { var n = {}; rows.forEach(function (r) { var k = f(r); n[k] = (n[k] || 0) + 1; }); var k = Object.keys(n).sort(function (a, b) { return n[b] - n[a]; }); return k.slice(0, 5).map(function (x) { return esc(x) + ' ' + n[x]; }).join(', ') + (k.length > 5 ? ', and ' + (k.length - 5) + ' more' : ''); };
    return '<dl><dt>Oxygen in the chamber</dt><dd>' + (range(o2c) ? range(o2c) + '%' : 'not recorded') + '</dd>' + (o2b.length ? '<dt>Oxygen in the burner</dt><dd>' + range(o2b) + '%</dd>' : '') +
      '<dt>Pressure</dt><dd>' + (range(ps) ? range(ps) + ' psi' : 'not recorded') + '</dd><dt>Fuels</dt><dd>' + cnt(function (r) { return fuelName(r); }) + '</dd>' +
      '<dt>Outcomes</dt><dd>' + cnt(outcomeText) + '</dd></dl>';
  }
  function showDetail(r) {
    var d = $('catDetail');
    d.innerHTML = '<h3>Selected</h3><h4>' + r[1] + '</h4><dl><dt>Accession</dt><dd>' + r[0] + '</dd><dt>Platform</dt><dd>' + r[2] + '</dd><dt>Fuel</dt><dd>' + (r[3] ? PH[r[3]] : 'not checked yet') + '</dd><dt>Tests in our data</dt><dd>' + (r[4] || 'none usable') + '</dd></dl>' +
      coverage(r[0]) +
      '<div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-top:1rem">' +
      (r[4] ? '<button class="btn" id="catTests">See its ' + r[4] + ' tests and graphs</button>' : '') +
      '<a class="btn ghost" style="text-decoration:none" target="_blank" rel="noopener" href="https://psi.nasa.gov/physci/repo/data/investigations/' + r[0] + '">Open on PSI</a></div>';
    if (r[4]) $('catTests').addEventListener('click', function () { showTestsOf(r[0]); });
    d.animate && !reduce && d.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 300, easing: 'ease-out' });
  }
  $('catSearch').addEventListener('input', drawCat);
  $('catHas').addEventListener('change', drawCat);
  $('catPhase').querySelectorAll('.chip').forEach(function (c) { c.addEventListener('click', function () {
    $('catPhase').querySelectorAll('.chip').forEach(function (x) { x.setAttribute('aria-pressed', x === c); }); catPhase = c.dataset.ph; drawCat(); }); });
  $('catPlat').querySelectorAll('.chip').forEach(function (c) { c.addEventListener('click', function () {
    $('catPlat').querySelectorAll('.chip').forEach(function (x) { x.setAttribute('aria-pressed', x === c); }); catPlat = c.dataset.pl; drawCat(); }); });
  document.querySelectorAll('#catTable th.sort').forEach(function (th) {
    function go() {
      var i = +th.dataset.i; catSort = { i: i, dir: catSort.i === i && catSort.dir === 1 ? -1 : 1 };
      document.querySelectorAll('#catTable th.sort').forEach(function (x) { x.removeAttribute('aria-sort'); });
      th.setAttribute('aria-sort', catSort.dir === 1 ? 'ascending' : 'descending'); drawCat();
    }
    th.addEventListener('click', go); th.addEventListener('keydown', function (e) { if (e.key === 'Enter') go(); });
  });
  drawCat();
  function showResView(v) {
    segSet($('resView'), 'data-v', v);
    $('resCat').hidden = v !== 'cat'; $('resData').hidden = v !== 'data';
  }
  segInit($('resView'), function (b) { showResView(b.dataset.v); });
  // Simple mode is the map and its answer for one point; Advanced mode is every investigation and every test row.
  function showMode(m) { segSet($('anMode'), 'data-m', m); $('anSimple').hidden = m !== 'simple'; $('anAdvanced').hidden = m !== 'advanced'; }
  segInit($('anMode'), function (b) { showMode(b.dataset.m); });

  /* ---------- Resources, test data view: filters, a graph builder and a readable table ---------- */
  // Every value is read from data/tests.web.json. The only computed column is oxygen partial pressure, and it says so.
  // Chart colours: three hues checked for colour-blind separation, plus grey for "not recorded". Marks also differ by shape.
  var NR = 'Not recorded', SINGLE = '#2a78d6', GREY = '#9aa6b8';
  var PHASE_TXT = { gas: 'Gas', liquid: 'Liquid', solid: 'Solid' };
  var FLAME_TXT = { normal: 'Normal gas flame', inverse: 'Inverse gas flame', droplet: 'Droplet', 'solid sample': 'Solid sample' };
  var O2FROM_TXT = { chamber: 'Chamber air', burner: 'Burner stream' };
  var FIELDS = {
    o2:      { label: 'Oxygen (%)', miss: 'with no oxygen in NASA\'s table', num: true, say: function (s) { return s + '% oxygen'; } },
    psi:     { label: 'Total pressure (psi)', miss: 'with no pressure in NASA\'s table', num: true, say: function (s) { return s + ' psi'; } },
    ppo2:    { label: 'Oxygen partial pressure (psi, computed)', miss: 'where it cannot be computed (no chamber oxygen or no pressure in NASA\'s table)', num: true, say: function (s) { return s + ' psi of oxygen'; } },
    flow:    { label: 'Airflow (cm/s)', miss: 'with no airflow in NASA\'s table', num: true, say: function (s) { return s + ' cm/s airflow'; } },
    inv:     { label: 'Investigation', cats: [] },
    phase:   { label: 'Fuel type', cats: ['Gas', 'Liquid', 'Solid'] },
    flame:   { label: 'Flame type', cats: ['Normal gas flame', 'Inverse gas flame', 'Droplet', 'Solid sample'] },
    outcome: { label: 'Outcome', cats: ['Kept burning', 'Went out by itself', 'Did not ignite', NR] },
    o2from:  { label: 'Oxygen figure is for', cats: ['Chamber air', 'Burner stream', NR] },
    fuel:    { label: 'Fuel (12 most tested)', cats: [] }
  };
  var NUMS = ['o2', 'psi', 'ppo2', 'flow'], GROUPS = ['inv', 'phase', 'flame', 'outcome', 'o2from', 'fuel'];
  var CBY = {
    outcome: { 'Kept burning': '#eb6834', 'Went out by itself': '#2a78d6', 'Did not ignite': '#1baf7a' },
    phase: { Gas: '#2a78d6', Liquid: '#eb6834', Solid: '#1baf7a' },
    o2from: { 'Chamber air': '#2a78d6', 'Burner stream': '#eb6834' }
  };
  var DATA = [], CUR = [], FS = null, GR = { x: 'psi', y: 'o2', c: 'outcome' }, picked = null, tSort = { k: null, dir: 1 }, tPage = 0, tOpen = null;
  var PAGE = 25;
  function fuelName(r) { return r.fuel ? r.fuel.replace(/\s+/g, ' ').trim() : NR; }
  function fmt(v) { return String(+(+v).toFixed(Math.abs(v) >= 100 ? 0 : 2)); }
  function big(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function tests(n) { return big(n) + (n === 1 ? ' test' : ' tests'); }
  function sayVal(k, v) { return FIELDS[k].num ? FIELDS[k].say(fmt(v)) : v; }
  function freshFilters() { return { q: '', inv: {}, phase: {}, flame: {}, outcome: {}, o2from: {}, o2min: null, o2max: null, pmin: null, pmax: null, both: false }; }
  function anyOn(o) { for (var k in o) if (o[k]) return true; return false; }
  var FACETS = ['inv', 'phase', 'flame', 'outcome', 'o2from'];
  function matches(d) {
    var v = d.v;
    for (var i = 0; i < FACETS.length; i++) { var s = FS[FACETS[i]]; if (anyOn(s) && !s[v[FACETS[i]]]) return false; }
    if (FS.o2min != null && !(v.o2 != null && v.o2 >= FS.o2min)) return false;
    if (FS.o2max != null && !(v.o2 != null && v.o2 <= FS.o2max)) return false;
    if (FS.pmin != null && !(v.psi != null && v.psi >= FS.pmin)) return false;
    if (FS.pmax != null && !(v.psi != null && v.psi <= FS.pmax)) return false;
    if (FS.both && (v.o2 == null || v.psi == null)) return false;
    if (FS.q && d.text.indexOf(FS.q) < 0) return false;
    return true;
  }

  /* scales */
  function niceStep(span, n) { var raw = span / n, p = Math.pow(10, Math.floor(Math.log(raw) / Math.LN10)), f = raw / p; return (f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10) * p; }
  function numScale(lo, hi, a, b, n, whole) {
    if (lo === hi) { lo -= 1; hi += 1; }
    var st = niceStep(hi - lo, n); if (whole && st < 1) st = 1;
    lo = Math.floor(lo / st + 1e-9) * st; hi = Math.ceil(hi / st - 1e-9) * st;
    var t = []; for (var v = lo; v <= hi + st / 2; v += st) t.push(+v.toFixed(6));
    return { lo: lo, hi: hi, ticks: t, px: function (x) { return a + (x - lo) / (hi - lo) * (b - a); } };
  }
  function extent(list, k) { var lo = Infinity, hi = -Infinity; list.forEach(function (d) { var x = d.v[k]; if (x < lo) lo = x; if (x > hi) hi = x; }); return [lo, hi]; }
  function presentCats(k, list) { var seen = {}; list.forEach(function (d) { seen[d.v[k]] = 1; }); return FIELDS[k].cats.filter(function (c) { return seen[c]; }); }
  function cut(s, n) { return s.length > n ? s.slice(0, n - 1) + '…' : s; }
  function pearson(list, a, b) {
    var n = list.length, ma = 0, mb = 0, saa = 0, sbb = 0, sab = 0;
    list.forEach(function (d) { ma += d.v[a]; mb += d.v[b]; }); ma /= n; mb /= n;
    list.forEach(function (d) { var x = d.v[a] - ma, y = d.v[b] - mb; saa += x * x; sbb += y * y; sab += x * y; });
    return saa && sbb ? sab / Math.sqrt(saa * sbb) : null;
  }
  function shade(t) { var a = [205, 226, 251], b = [16, 66, 129]; return 'rgb(' + a.map(function (x, i) { return Math.round(x + (b[i] - x) * t); }).join(',') + ')'; }
  function r1(x) { return Math.round(x * 10) / 10; }
  // A mark whose shape follows its group, so identity never rests on colour alone: circle, square, triangle, diamond.
  function shapeMark(parent, i, cx, cy, r, colour) {
    var a = { 'class': 'mark', fill: colour };
    cx = r1(cx); cy = r1(cy);
    if (i === 1) { a.x = r1(cx - r * .89); a.y = r1(cy - r * .89); a.width = a.height = r1(r * 1.78); return el('rect', a, parent); }
    if (i === 2) { a.d = 'M' + cx + ' ' + r1(cy - r * 1.25) + 'L' + r1(cx + r * 1.15) + ' ' + r1(cy + r * .85) + 'H' + r1(cx - r * 1.15) + 'Z'; return el('path', a, parent); }
    if (i === 3) { a.d = 'M' + cx + ' ' + r1(cy - r * 1.3) + 'L' + r1(cx + r * 1.3) + ' ' + cy + 'L' + cx + ' ' + r1(cy + r * 1.3) + 'L' + r1(cx - r * 1.3) + ' ' + cy + 'Z'; return el('path', a, parent); }
    a.cx = cx; a.cy = cy; a.r = r1(r); return el('circle', a, parent);
  }

  /* One renderer for every pairing: number against number (points), number alone (spread), group alone (bars),
     group against number (strips with a median line), group against group (a grid of counts). */
  function drawChart(svg, list, xk, yk, ck, o) {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    var c = !!o.compact, mini = !!o.mini, W = o.w, H = o.h, fx = FIELDS[xk], fy = yk === 'count' ? null : FIELDS[yk];
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    var pal = CBY[ck] || null, ccats = pal ? FIELDS[ck].cats : ['all'];
    function ckey(d) { return pal ? d.v[ck] : 'all'; }
    function colour(k) { return pal ? (pal[k] || GREY) : SINGLE; }
    var use = [], info = { n: 0, missX: 0, missY: 0, form: '', marks: [], legend: {}, r: null, refs: false };
    list.forEach(function (d) { if (d.v[xk] == null) info.missX++; else if (fy && d.v[yk] == null) info.missY++; else use.push(d); });
    info.n = use.length;
    use.forEach(function (d) { var k = ckey(d); info.legend[k] = (info.legend[k] || 0) + 1; });
    var xc = fx.num ? null : presentCats(xk, list), yc = fy && !fy.num ? presentCats(yk, list) : null;
    var slant = xc && (xc.length > 4 || (c && xc.length > 3));
    var L = yc ? (c ? 116 : 150) : (c ? 38 : 54), R = 14, T = c ? 24 : 28, B = slant ? (c ? 78 : 98) : (c ? 36 : 46);
    var x0 = L, x1 = W - R, y0 = H - B, y1 = T, fs = c ? 10 : 11;
    el('rect', { 'class': 'bg', x: x0, y: y1, width: x1 - x0, height: y0 - y1 }, svg);
    var yl = el('text', { 'class': 'ttl', x: 2, y: 13 }, svg); yl.textContent = fy ? fy.label : 'Number of tests';
    var xl = el('text', { 'class': 'ttl', x: x1, y: H - 5, 'text-anchor': 'end' }, svg); xl.textContent = fx.label;
    if (!use.length) {
      var none = el('text', { x: (x0 + x1) / 2, y: (y0 + y1) / 2, 'text-anchor': 'middle' }, svg);
      none.textContent = fy ? 'No test here records both values.' : 'No test here records this value.';
      return info;
    }
    function axisX(s, grid) { s.ticks.forEach(function (t) {
      var px = r1(s.px(t)); if (grid) el('line', { 'class': 'gridl', x1: px, x2: px, y1: y1, y2: y0 }, svg);
      var tx = el('text', { x: px, y: y0 + (c ? 13 : 16), 'text-anchor': 'middle', 'font-size': fs }, svg); tx.textContent = fmt(t); }); }
    function axisY(s) { s.ticks.forEach(function (t) {
      var py = r1(s.px(t)); el('line', { 'class': 'gridl', x1: x0, x2: x1, y1: py, y2: py }, svg);
      var tx = el('text', { x: x0 - 7, y: py + 4, 'text-anchor': 'end', 'font-size': fs }, svg); tx.textContent = fmt(t); }); }
    function catX(cats) { var bw = (x1 - x0) / cats.length; cats.forEach(function (cat, i) {
      var px = r1(x0 + (i + .5) * bw), a = slant ? { x: px, y: y0 + 13, 'text-anchor': 'end', transform: 'rotate(-35 ' + px + ' ' + (y0 + 13) + ')' } : { x: px, y: y0 + (c ? 13 : 16), 'text-anchor': 'middle' };
      a['font-size'] = fs; var tx = el('text', a, svg); tx.textContent = cut(cat, slant ? (c ? 15 : 19) : 24); }); return bw; }
    function catY(cats) { var bh = (y0 - y1) / cats.length; cats.forEach(function (cat, i) {
      var tx = el('text', { x: x0 - 8, y: r1(y1 + (i + .5) * bh + 4), 'text-anchor': 'end', 'font-size': fs }, svg); tx.textContent = cut(cat, c ? 19 : 25); }); return bh; }
    function frame() { el('path', { 'class': 'axis', d: 'M' + x0 + ' ' + y1 + 'V' + y0 + 'H' + x1 }, svg); }
    // a column the whole height of the plot (or a grid cell) that answers to hover, focus and click
    function hit(x, y, w, h, title, lines, rows, label) {
      if (mini) return;
      var h1 = el('rect', { 'class': 'hit', x: r1(x), y: r1(y), width: r1(w), height: r1(h), tabindex: 0 }, svg);
      h1.addEventListener('pointermove', function (e) { showTip(e.clientX, e.clientY, title, lines); });
      h1.addEventListener('pointerleave', hideTip);
      h1.addEventListener('focus', function () { var b = h1.getBoundingClientRect(); showTip(b.left + b.width / 2, b.top + 20, title, lines); });
      h1.addEventListener('blur', hideTip);
      h1.addEventListener('click', function () { pickRows(rows, label); });
      h1.addEventListener('keydown', function (e) { if (e.key === 'Enter') pickRows(rows, label); });
    }
    function splitLines(rows) {
      if (!pal) return [];
      var n = {}; rows.forEach(function (d) { n[ckey(d)] = (n[ckey(d)] || 0) + 1; });
      return ccats.filter(function (k) { return n[k]; }).map(function (k) { return k + ': ' + big(n[k]); });
    }
    // stacked columns, used for the spread of a number and for the count in each group
    function columns(slots, slotW, barW) {
      var max = 0; slots.forEach(function (s) { max = Math.max(max, s.rows.length); });
      var sy = numScale(0, max, y0, y1, c ? 3 : 5, true); axisY(sy);
      slots.forEach(function (s) {
        var base = 0; s.rows.forEach(function (d) { var k = ckey(d); s.n[k] = (s.n[k] || 0) + 1; });
        ccats.forEach(function (k) {
          var n = s.n[k] || 0; if (!n) return;
          var ya = sy.px(base), yb = sy.px(base + n);
          el('rect', { x: r1(s.cx - barW / 2), y: r1(yb), width: r1(barW), height: r1(Math.max(ya - yb - 1, .6)), fill: colour(k) }, svg); base += n;
        });
        if (s.total && s.rows.length) { var tt = el('text', { 'class': 'ttl', x: r1(s.cx), y: r1(sy.px(s.rows.length) - 5), 'text-anchor': 'middle', 'font-size': fs }, svg); tt.textContent = big(s.rows.length); }
        if (s.rows.length) hit(s.cx - slotW / 2, y1, slotW, y0 - y1, s.label + ': ' + tests(s.rows.length), splitLines(s.rows), s.rows, s.label);
      });
    }

    if (fx.num && fy && fy.num) {
      info.form = 'points';
      var ex = extent(use, xk), ey = extent(use, yk);
      var sx = numScale(ex[0], ex[1], x0, x1, c ? 4 : 7), sy = numScale(ey[0], ey[1], y0, y1, c ? 4 : 6);
      axisX(sx, true); axisY(sy);
      if (o.refs && ((xk === 'psi' && yk === 'o2') || (xk === 'o2' && yk === 'psi'))) {
        // Reference only, from the challenge statement: the sea-level oxygen curve and the planned habitats.
        var flip = xk === 'o2', sp = flip ? sy : sx, so = flip ? sx : sy, dd = '', q0;
        var at = function (p, oo) { return flip ? [so.px(oo), sp.px(p)] : [sp.px(p), so.px(oo)]; };
        for (var p = sp.lo; p <= sp.hi + 1e-9; p += (sp.hi - sp.lo) / 160) { var oo = SEA_PPO2 / p * 100; if (p > 0 && oo >= so.lo && oo <= so.hi) { q0 = at(p, oo); dd += (dd ? 'L' : 'M') + r1(q0[0]) + ' ' + r1(q0[1]); } }
        if (dd) { el('path', { 'class': 'ref', d: dd }, svg); info.refs = true; }
        info.habs = [['ISS', 14.7, 21], ['Moon Base', 10.2, 30], ['Spacesuit', 4.3, 100]].filter(function (h) { return h[1] >= sp.lo && h[1] <= sp.hi && h[2] >= so.lo && h[2] <= so.hi; })
          .map(function (h) { var q = at(h[1], h[2]); return [h[0], q[0], q[1]]; });
      }
      var gs = {}, order = [];
      use.forEach(function (d) { var k = d.v[xk] + '|' + d.v[yk] + '|' + ckey(d); if (!gs[k]) { gs[k] = { x: d.v[xk], y: d.v[yk], c: ckey(d), rows: [] }; order.push(gs[k]); } gs[k].rows.push(d); });
      // Not recorded is drawn first so it never hides a known outcome. Groups at the same spot sit side by side.
      var spots = {};
      order.forEach(function (g) { var k = g.x + '|' + g.y; (spots[k] = spots[k] || []).push(g); });
      for (var sk in spots) { spots[sk].sort(function (a, b) { return ccats.indexOf(a.c) - ccats.indexOf(b.c); }).forEach(function (g, i, all) { g.dx = (i - (all.length - 1) / 2) * (c ? 5 : 8); }); }
      order.sort(function (a, b) { return (colour(b.c) === GREY) - (colour(a.c) === GREY) || b.rows.length - a.rows.length; });
      order.forEach(function (g) {
        var r = Math.min(c ? 6 : 11, (c ? 2.2 : 3.2) + (c ? .9 : 1.5) * Math.sqrt(g.rows.length - 1));
        var m = { cx: sx.px(g.x) + g.dx, cy: sy.px(g.y), r: r, rows: g.rows, c: g.c, label: sayVal(xk, g.x) + ', ' + sayVal(yk, g.y) };
        shapeMark(svg, mini ? 0 : Math.max(0, ccats.indexOf(g.c)), m.cx, m.cy, r, colour(g.c)); info.marks.push(m);
      });
      (info.habs || []).forEach(function (h) {
        var g = el('g', { 'class': 'hab' }, svg); el('circle', { cx: r1(h[1]), cy: r1(h[2]), r: 5 }, g);
        var tx = el('text', { x: r1(h[1] + 9), y: r1(h[2] < y1 + 18 ? h[2] + 15 : h[2] - 8), 'font-size': fs }, g); tx.textContent = h[0];
      });
      info.r = use.length > 2 ? pearson(use, xk, yk) : null;
    } else if (fx.num && !fy) {
      info.form = 'spread';
      var e1 = extent(use, xk), st = niceStep((e1[1] - e1[0]) || 1, c ? 10 : 20), b0 = Math.floor(e1[0] / st + 1e-9) * st;
      var nb = Math.max(1, Math.floor((e1[1] - b0) / st + 1e-9) + 1), sxb = numScale(b0, b0 + nb * st, x0, x1, c ? 4 : 7), slots = [];
      axisX(sxb, false);
      for (var i = 0; i < nb; i++) slots.push({ cx: (sxb.px(b0 + i * st) + sxb.px(b0 + (i + 1) * st)) / 2, rows: [], n: {}, label: fmt(b0 + i * st) + ' to ' + fx.say(fmt(b0 + (i + 1) * st)) });
      use.forEach(function (d) { slots[Math.min(nb - 1, Math.floor((d.v[xk] - b0) / st + 1e-9))].rows.push(d); });
      var bwid = sxb.px(b0 + st) - sxb.px(b0); columns(slots, bwid, Math.max(bwid - 2, 1));
    } else if (!fx.num && !fy) {
      info.form = 'bars';
      var bw = catX(xc), slots2 = xc.map(function (cat, i) { return { cx: x0 + (i + .5) * bw, rows: [], n: {}, label: cat, total: true }; });
      use.forEach(function (d) { slots2[xc.indexOf(d.v[xk])].rows.push(d); });
      columns(slots2, bw, Math.min(bw * .68, 64));
    } else if (fx.num !== (fy && fy.num)) {
      info.form = 'strips';
      var up = !fx.num, catK = up ? xk : yk, numK = up ? yk : xk, cats = up ? xc : yc, en = extent(use, numK);
      var sn = up ? numScale(en[0], en[1], y0, y1, c ? 4 : 6) : numScale(en[0], en[1], x0, x1, c ? 4 : 7);
      var band = up ? (axisY(sn), catX(cats)) : (axisX(sn, true), catY(cats));
      var g2 = {}, ord2 = [], byCat = {};
      use.forEach(function (d) {
        var k = d.v[catK] + '|' + d.v[numK] + '|' + ckey(d);
        if (!g2[k]) { g2[k] = { cat: d.v[catK], val: d.v[numK], c: ckey(d), rows: [] }; ord2.push(g2[k]); } g2[k].rows.push(d);
        (byCat[d.v[catK]] = byCat[d.v[catK]] || []).push(d.v[numK]);
      });
      ord2.forEach(function (g, gi) {
        var across = (up ? x0 : y1) + (cats.indexOf(g.cat) + .5) * band + (((gi * .618034) % 1) - .5) * band * .6, along = sn.px(g.val);
        var r = Math.min(c ? 5 : 9, (c ? 2 : 3) + (c ? .7 : 1.2) * Math.sqrt(g.rows.length - 1));
        var m = { cx: up ? across : along, cy: up ? along : across, r: r, rows: g.rows, c: g.c, label: g.cat + ', ' + sayVal(numK, g.val) };
        shapeMark(svg, mini ? 0 : Math.max(0, ccats.indexOf(g.c)), m.cx, m.cy, r, colour(g.c)); info.marks.push(m);
      });
      cats.forEach(function (cat, i) {
        var vs = byCat[cat]; if (!vs) return; vs.sort(function (a, b) { return a - b; });
        var med = vs.length % 2 ? vs[(vs.length - 1) / 2] : (vs[vs.length / 2 - 1] + vs[vs.length / 2]) / 2, mid = (up ? x0 : y1) + (i + .5) * band, half = band * .36, at2 = r1(sn.px(med));
        el('line', up ? { 'class': 'med', x1: r1(mid - half), x2: r1(mid + half), y1: at2, y2: at2 } : { 'class': 'med', y1: r1(mid - half), y2: r1(mid + half), x1: at2, x2: at2 }, svg);
      });
    } else {
      info.form = 'grid';
      var cw = catX(xc), ch = catY(yc), cells = {}, max2 = 0;
      use.forEach(function (d) { var k = xc.indexOf(d.v[xk]) + '|' + yc.indexOf(d.v[yk]); (cells[k] = cells[k] || []).push(d); });
      for (var k2 in cells) max2 = Math.max(max2, cells[k2].length);
      xc.forEach(function (a, xi) { yc.forEach(function (b, yi) {
        var rows = cells[xi + '|' + yi]; if (!rows) return;
        var t = rows.length / max2, cx = x0 + xi * cw, cy = y1 + yi * ch;
        if (pal) {
          // With a colour chosen, each cell holds a bar: its length is the number of tests, its colours split that number.
          el('rect', { 'class': 'cellbox', x: r1(cx + 1), y: r1(cy + 1), width: r1(cw - 2), height: r1(ch - 2) }, svg);
          var pad = Math.min(8, cw * .08), full = cw - 2 * pad, bh = Math.max(5, Math.min(ch * .34, c ? 12 : 20)), by = cy + ch / 2, off = 0, n2 = {};
          rows.forEach(function (d) { n2[ckey(d)] = (n2[ckey(d)] || 0) + 1; });
          ccats.forEach(function (k) { var n = n2[k] || 0; if (!n) return; var w = full * n / max2; el('rect', { x: r1(cx + pad + off), y: r1(by), width: r1(Math.max(w - 1, .8)), height: r1(bh), fill: colour(k) }, svg); off += w; });
          var tn = el('text', { 'class': 'cellnum', x: r1(cx + pad), y: r1(by - 5), style: 'fill:var(--ink)' }, svg); tn.textContent = big(rows.length);
        } else {
          el('rect', { x: r1(cx + 1), y: r1(cy + 1), width: r1(cw - 2), height: r1(ch - 2), fill: shade(t) }, svg);
          var tx = el('text', { 'class': 'cellnum', x: r1(cx + cw / 2), y: r1(cy + ch / 2 + 4), 'text-anchor': 'middle', style: 'fill:' + (t > .45 ? '#fff' : '#0d1b2e') }, svg); tx.textContent = big(rows.length);
        }
        hit(cx, cy, cw, ch, tests(rows.length), [a, b].concat(splitLines(rows)), rows, a + ', ' + b);
      }); });
    }
    frame();
    return info;
  }

  /* tooltip */
  var tipEl = $('tip');
  function showTip(x, y, title, lines) {
    tipEl.textContent = '';
    var s = document.createElement('strong'); s.textContent = title; tipEl.appendChild(s);
    lines.forEach(function (t) { var sp = document.createElement('span'); sp.textContent = t; tipEl.appendChild(sp); });
    tipEl.classList.add('show');
    var w = tipEl.offsetWidth, h = tipEl.offsetHeight, left = Math.min(x + 14, window.innerWidth - w - 8), top = y + 18;
    if (top + h > window.innerHeight - 8) top = y - h - 12;
    tipEl.style.transform = 'translate(' + Math.max(8, left) + 'px,' + Math.max(8, top) + 'px)';
  }
  function hideTip() { tipEl.classList.remove('show'); }
  function rowLine(d) { return d.r.investigation + ' ' + d.r.test_id + ', ' + d.fuel; }

  /* the main graph */
  var gSvg = $('gSvg'), gInfo = null, gHover = null, gRing = null;
  function nearest(e) {
    if (!gInfo || !gInfo.marks.length) return null;
    var b = gSvg.getBoundingClientRect(), vb = gSvg.viewBox.baseVal, k = vb.width / b.width;
    var px = (e.clientX - b.left) * k, py = (e.clientY - b.top) * k, best = null, bd = 24 * k;
    gInfo.marks.forEach(function (m) { var d = Math.sqrt((m.cx - px) * (m.cx - px) + (m.cy - py) * (m.cy - py)) - m.r; if (d < bd) { bd = d; best = m; } });
    return best;
  }
  gSvg.addEventListener('pointermove', function (e) {
    var m = nearest(e); gHover = m;
    if (!m) { if (gInfo && gInfo.marks.length) hideTip(); if (gRing) gRing.setAttribute('visibility', 'hidden'); return; }
    if (!gRing || gRing.parentNode !== gSvg) gRing = el('circle', { 'class': 'ring' }, gSvg);
    gRing.setAttribute('cx', r1(m.cx)); gRing.setAttribute('cy', r1(m.cy)); gRing.setAttribute('r', r1(m.r + 3.5)); gRing.setAttribute('visibility', 'visible');
    var lines = [tests(m.rows.length) + (m.c !== 'all' ? ', ' + m.c.toLowerCase() : '')];
    m.rows.slice(0, 3).forEach(function (d) { lines.push(rowLine(d)); });
    lines.push(m.rows.length > 3 ? 'and ' + (m.rows.length - 3) + ' more. Click to list them in the table.' : 'Click to list in the table.');
    showTip(e.clientX, e.clientY, m.label, lines);
  });
  gSvg.addEventListener('pointerleave', function () { gHover = null; hideTip(); if (gRing) gRing.setAttribute('visibility', 'hidden'); });
  gSvg.addEventListener('click', function (e) { var m = nearest(e); if (m) pickRows(m.rows, m.label); });

  function legendItem(box, k, n, colour, i, points) {
    var s = document.createElement('span'), sv = document.createElementNS(NS, 'svg'); sv.setAttribute('viewBox', '0 0 13 13');
    if (points) shapeMark(sv, i, 6.5, 6.5, 4.4, colour); else el('rect', { x: 1.5, y: 1.5, width: 10, height: 10, fill: colour }, sv);
    var b = document.createElement('b'); b.textContent = k;
    s.appendChild(sv); s.appendChild(b); s.appendChild(document.createTextNode(big(n))); box.appendChild(s);
  }
  function setNotes(lines) { var ul = $('gNote'); ul.textContent = ''; lines.forEach(function (t) { var li = document.createElement('li'); li.textContent = t; ul.appendChild(li); }); }
  function graphSize() { return window.innerWidth < 620 ? { w: 400, h: 370, compact: true, refs: true } : { w: 720, h: 440, refs: true }; }
  function drawGraph() {
    var xk = GR.x, yk = GR.y, ck = GR.c, fx = FIELDS[xk], fy = yk === 'count' ? null : FIELDS[yk];
    var info = gInfo = drawChart(gSvg, CUR, xk, yk, ck, graphSize()); gRing = null;
    $('gTitle').textContent = (fy ? fy.label + ' against ' + fx.label : (fx.num ? 'How ' + fx.label + ' is spread' : 'Tests in each group: ' + fx.label)) + ', ' + tests(info.n);
    gSvg.setAttribute('aria-label', $('gTitle').textContent + '. The same tests are listed in the table below.');
    var lg = $('gLegend'); lg.textContent = '';
    var points = info.form === 'points' || info.form === 'strips';
    if (CBY[ck]) FIELDS[ck].cats.forEach(function (k, i) { if (info.legend[k]) legendItem(lg, k, info.legend[k], CBY[ck][k] || GREY, i, points); });
    if (info.refs) { var s = document.createElement('span'), ln = document.createElement('i'); s.appendChild(ln); s.appendChild(document.createTextNode('Same oxygen as sea level (reference)')); lg.appendChild(s); }
    var n = [];
    var left = info.missX + info.missY;
    n.push('Plotted: ' + tests(info.n) + ' of the ' + big(CUR.length) + ' that match the filters.');
    if (left) {
      var why = [];
      if (info.missX) why.push(big(info.missX) + ' ' + fx.miss);
      if (info.missY) why.push(big(info.missY) + ' ' + fy.miss);
      n.push('Left out, never filled in: ' + why.join(' and ') + '.');
    }
    if (xk === 'o2' || yk === 'o2') {
      var burner = 0; CUR.forEach(function (d) { if (d.v.o2from === 'Burner stream' && d.v[xk] != null && (!fy || d.v[yk] != null)) burner++; });
      if (burner) n.push(big(burner) + ' of the plotted tests are inverse flames: their oxygen figure is the gas fed through the burner, not the air around the flame.');
    }
    if (xk === 'ppo2' || yk === 'ppo2') n.push('Oxygen partial pressure is computed here as oxygen fraction times total pressure, only where the oxygen figure is the chamber air.');
    if (info.form === 'points') {
      n.push('A bigger mark means more tests at exactly the same conditions.');
      if (info.r != null) n.push('Correlation between the two columns (Pearson r, computed here from the plotted tests): ' + info.r.toFixed(2) + '. It describes which conditions NASA chose to test, not a law of physics.');
    }
    if (info.form === 'strips') n.push('Marks are spread sideways only so they do not hide each other. The dark line is each group\'s median, computed here.');
    if (info.form === 'grid') n.push(CBY[ck] ? 'Each cell is the number of tests with both values. The bar\'s length is that number, and its colours split it by the Colour by column.' : 'Each cell is the number of tests with both values; a darker cell means more tests. Pick a Colour by column to split each cell.');
    if (info.refs) n.push('The dashed curve (oxygen fraction times pressure = 3.07 psi) and the habitat points come from the challenge statement, not from the tests.');
    if (info.n) n.push('Hover or click a mark to list its tests in the table.');
    setNotes(n);
    $('gSwap').disabled = yk === 'count';
    $('gPresets').querySelectorAll('[data-x]').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.x === xk && b.dataset.y === yk && b.dataset.c === ck); });
  }

  /* relationships: the Across column against every other column */
  function drawMinis() {
    var box = $('minis'), xk = GR.x; box.textContent = '';
    $('relLead').textContent = 'The column on the Across axis, ' + FIELDS[xk].label + ', against every other column, for the tests that match the filters. Click one to open it in the graph builder. Change Across to compare a different column.';
    ['count'].concat(NUMS, GROUPS.slice(0, 5)).forEach(function (yk) {
      if (yk === xk) return;
      var b = document.createElement('button'); b.className = 'mini'; b.type = 'button'; b.setAttribute('aria-pressed', yk === GR.y);
      var st = document.createElement('strong'), sm = document.createElement('small'), sv = document.createElementNS(NS, 'svg');
      st.textContent = yk === 'count' ? 'Number of tests' : FIELDS[yk].label;
      b.appendChild(st); b.appendChild(sm); b.appendChild(sv);
      var info = drawChart(sv, CUR, xk, yk, GR.c, { w: 360, h: 236, compact: true, mini: true });
      sm.textContent = info.n ? tests(info.n) + (yk === 'count' ? ' record it' : ' record both') : !CUR.length ? 'No tests match the filters' : 'No test records both: a gap in the data';
      sv.setAttribute('role', 'img'); sv.setAttribute('aria-label', st.textContent + ' against ' + FIELDS[xk].label + ', ' + sm.textContent);
      b.addEventListener('click', function () { setGraph(xk, yk, GR.c); $('graphPanel').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); });
      box.appendChild(b);
    });
  }
  function setGraph(x, y, c) {
    GR = { x: x, y: y, c: c }; $('gX').value = x; $('gY').value = y; $('gC').value = c;
    clearPick(); drawGraph(); drawMinis(); drawTable();
  }

  /* summary numbers */
  function drawStats() {
    var box = $('stats'), both = 0, o = [Infinity, -Infinity], p = [Infinity, -Infinity]; box.textContent = '';
    CUR.forEach(function (d) {
      var v = d.v; if (v.o2 != null && v.psi != null) both++;
      if (v.o2 != null) { o[0] = Math.min(o[0], v.o2); o[1] = Math.max(o[1], v.o2); }
      if (v.psi != null) { p[0] = Math.min(p[0], v.psi); p[1] = Math.max(p[1], v.psi); }
    });
    [['Tests that match', big(CUR.length), 'of ' + big(DATA.length)], ['With oxygen and pressure', big(both), ''],
     ['Oxygen range', o[0] === Infinity ? NR.toLowerCase() : fmt(o[0]) + ' to ' + fmt(o[1]), o[0] === Infinity ? '' : '%'],
     ['Pressure range', p[0] === Infinity ? NR.toLowerCase() : fmt(p[0]) + ' to ' + fmt(p[1]), p[0] === Infinity ? '' : 'psi']].forEach(function (s) {
      var w = document.createElement('div'), dt = document.createElement('dt'), dd = document.createElement('dd'), sm = document.createElement('small');
      dt.textContent = s[0]; dd.className = 'num'; dd.textContent = s[1]; sm.textContent = s[2]; dd.appendChild(sm);
      if (s[1] === NR.toLowerCase()) dd.style.fontSize = '1rem';
      w.appendChild(dt); w.appendChild(dd); box.appendChild(w);
    });
    $('fCount').textContent = big(CUR.length);
    $('fOf').textContent = 'of ' + big(DATA.length) + ' tests match';
  }

  /* the table of tests */
  var TCOLS = [
    { k: 'test', label: 'Test', get: function (d) { return d.r.test_id; } },
    { k: 'inv', label: 'Investigation', get: function (d) { return d.v.inv; } },
    { k: 'fuel', label: 'Fuel', get: function (d) { return d.fuel; } },
    { k: 'flame', label: 'Flame', get: function (d) { return d.v.flame; } },
    { k: 'o2', label: 'Oxygen %', num: true, get: function (d) { return d.v.o2; } },
    { k: 'psi', label: 'Pressure psi', num: true, get: function (d) { return d.v.psi; } },
    { k: 'outcome', label: 'Outcome', get: function (d) { return d.v.outcome; } }
  ];
  function cell(tr, text, cls) {
    var c = document.createElement('td'); if (cls) c.className = cls;
    if (text == null || text === NR) { var s = document.createElement('span'); s.className = 'nr'; s.textContent = 'not recorded'; c.appendChild(s); }
    else c.textContent = text;
    tr.appendChild(c); return c;
  }
  function moreRow(d) {
    var r = d.r, tr = document.createElement('tr'), c = document.createElement('td'), dl = document.createElement('dl'); tr.className = 'more'; c.colSpan = TCOLS.length;
    function item(k, v, href) {
      var dt = document.createElement('dt'), dd = document.createElement('dd'); dt.textContent = k;
      if (href) { var a = document.createElement('a'); a.href = href; a.target = '_blank'; a.rel = 'noopener'; a.textContent = v; dd.appendChild(a); } else dd.textContent = v;
      dl.appendChild(dt); dl.appendChild(dd);
    }
    item('Investigation', r.investigation + ' (' + r.accession + '), open on PSI', 'https://psi.nasa.gov/physci/repo/data/investigations/' + r.accession);
    item('NASA file', r.source + ', line ' + r.source_line);
    item('Fuel', d.fuel + ' (' + d.v.phase.toLowerCase() + ', ' + d.v.flame.toLowerCase() + ')');
    item('Oxygen', r.o2_pct == null ? 'not recorded' : fmt(r.o2_pct) + '%, the ' + (r.oxygen_from === 'burner' ? 'gas fed through the burner (inverse flame), not the air around it' : 'air in the chamber'));
    item('Total pressure', r.pressure_psi == null ? 'not recorded' : fmt(r.pressure_psi) + ' psi');
    item('Oxygen partial pressure', d.v.ppo2 == null ? 'not computed (needs chamber oxygen and pressure)' : fmt(d.v.ppo2) + ' psi, computed here, ' + (d.v.ppo2 / SEA_PPO2).toFixed(2) + ' times sea level');
    item('Airflow', r.flow_cm_s == null ? 'not recorded' : fmt(r.flow_cm_s) + ' cm/s');
    item('Gravity', r.gravity === '0g' ? 'microgravity (0 g)' : String(r.gravity));
    item('Ignited', r.ignited == null ? 'not recorded' : r.ignited ? 'yes' : 'no');
    item('Outcome', d.v.outcome === NR ? 'not recorded' : d.v.outcome);
    c.appendChild(dl); tr.appendChild(c); return tr;
  }
  function drawTable() {
    var list = (picked ? picked.rows : CUR).slice(), tb = document.querySelector('#testTable tbody'); tb.textContent = '';
    if (tSort.k) {
      var col = TCOLS.filter(function (c) { return c.k === tSort.k; })[0];
      list.sort(function (a, b) {
        var x = col.get(a), y = col.get(b), nx = x == null || x === NR, ny = y == null || y === NR;
        if (nx || ny) return nx - ny;   // missing values last, whichever way the column is sorted
        return (col.num ? x - y : String(x).localeCompare(String(y), undefined, { numeric: true })) * tSort.dir;
      });
    }
    var pages = Math.max(1, Math.ceil(list.length / PAGE)); tPage = clamp(tPage, 0, pages - 1);
    list.slice(tPage * PAGE, tPage * PAGE + PAGE).forEach(function (d) {
      var tr = document.createElement('tr'); tr.className = 'trow'; tr.tabIndex = 0; tr.setAttribute('aria-expanded', 'false');
      cell(tr, d.r.test_id); cell(tr, d.v.inv); cell(tr, cut(d.fuel, 34)).title = d.fuel; cell(tr, d.v.flame);
      cell(tr, d.v.o2 == null ? null : d.v.o2.toFixed(1), 'n'); cell(tr, d.v.psi == null ? null : d.v.psi.toFixed(1), 'n');
      var oc = cell(tr, d.v.outcome);
      if (d.v.outcome !== NR) { var dot = document.createElement('i'); dot.className = 'odot'; dot.style.background = CBY.outcome[d.v.outcome] || GREY; oc.insertBefore(dot, oc.firstChild); }
      function toggle() {
        var was = tr.getAttribute('aria-expanded') === 'true';
        tb.querySelectorAll('tr.more').forEach(function (x) { x.remove(); });
        tb.querySelectorAll('tr.trow').forEach(function (x) { x.setAttribute('aria-expanded', 'false'); });
        if (!was) { tr.setAttribute('aria-expanded', 'true'); tr.parentNode.insertBefore(moreRow(d), tr.nextSibling); }
      }
      tr.addEventListener('click', toggle); tr.addEventListener('keydown', function (e) { if (e.key === 'Enter') toggle(); });
      tb.appendChild(tr);
    });
    if (!list.length) { var tr0 = document.createElement('tr'), c0 = document.createElement('td'); c0.colSpan = TCOLS.length; c0.textContent = 'No test matches these filters.'; tr0.appendChild(c0); tb.appendChild(tr0); }
    $('tInfo').textContent = list.length ? 'Rows ' + big(tPage * PAGE + 1) + ' to ' + big(Math.min(list.length, tPage * PAGE + PAGE)) + ' of ' + big(list.length) : '';
    $('tPrev').disabled = tPage === 0; $('tNext').disabled = tPage >= pages - 1;
    var bn = $('tPick'); bn.textContent = ''; bn.classList.toggle('show', !!picked);
    if (picked) {
      bn.appendChild(document.createTextNode('Showing only the ' + tests(picked.rows.length) + ' in the mark you clicked (' + picked.label + '). '));
      var back = document.createElement('button'); back.className = 'linkbtn'; back.type = 'button'; back.textContent = 'Show all ' + big(CUR.length) + ' matching tests';
      back.addEventListener('click', function () { clearPick(); drawTable(); }); bn.appendChild(back);
    }
  }
  function clearPick() { picked = null; tPage = 0; $('gPick').hidden = true; }
  function pickRows(rows, label) {
    picked = { rows: rows, label: label }; tPage = 0; drawTable();
    var gp = $('gPick'); gp.hidden = false; gp.textContent = '';
    gp.appendChild(document.createTextNode('Picked: ' + label + ', ' + tests(rows.length) + '. '));
    var go = document.createElement('button'); go.className = 'linkbtn'; go.type = 'button'; go.textContent = 'Read them in the table';
    go.addEventListener('click', function () { $('tablePanel').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); }); gp.appendChild(go);
  }

  /* filters */
  var refreshQueued = 0;
  function refresh() {
    if (refreshQueued) return;
    refreshQueued = requestAnimationFrame(function () {
      refreshQueued = 0; CUR = DATA.filter(matches); clearPick();
      drawStats(); drawGraph(); drawMinis(); drawTable();
    });
  }
  function syncFilters() {
    FACETS.forEach(function (k) { $('f-' + k).querySelectorAll('.chip').forEach(function (b) { b.setAttribute('aria-pressed', !!FS[k][b.dataset.v]); }); });
    $('fSearch').value = FS.q; $('fBoth').checked = FS.both;
    [['fO2min', 'o2min'], ['fO2max', 'o2max'], ['fPmin', 'pmin'], ['fPmax', 'pmax']].forEach(function (p) { $(p[0]).value = FS[p[1]] == null ? '' : FS[p[1]]; });
  }
  function showTestsOf(accession) {
    var name = null; DATA.some(function (d) { if (d.r.accession === accession) { name = d.v.inv; return true; } return false; });
    if (!name) return;
    FS = freshFilters(); FS.inv[name] = true; syncFilters(); refresh(); showMode('advanced'); showResView('data');
    $('page-analysis').scrollTop = 0;
  }
  function dataInit(rows) {
    var fuels = {}, invs = {};
    DATA = rows.map(function (r) {
      var f = fuelName(r); fuels[f] = (fuels[f] || 0) + 1; invs[r.investigation || NR] = (invs[r.investigation || NR] || 0) + 1;
      return { r: r, fuel: f, text: [r.accession, r.investigation, r.test_id, f, r.source].join(' ').toLowerCase(), v: {
        o2: r.o2_pct, psi: r.pressure_psi,
        ppo2: r.o2_pct != null && r.pressure_psi != null && r.oxygen_from === 'chamber' ? +(r.o2_pct / 100 * r.pressure_psi).toFixed(2) : null,
        flow: r.flow_cm_s, inv: r.investigation || NR, phase: PHASE_TXT[r.fuel_phase] || NR, flame: FLAME_TXT[r.flame_type] || NR,
        outcome: outcomeText(r), o2from: O2FROM_TXT[r.oxygen_from] || NR, fuel: f } };
    });
    function byCount(o) { return Object.keys(o).sort(function (a, b) { return o[b] - o[a] || a.localeCompare(b); }); }
    FIELDS.inv.cats = byCount(invs);
    var top = byCount(fuels).filter(function (f) { return f !== NR; }).slice(0, 12), isTop = {}; top.forEach(function (f) { isTop[f] = 1; });
    FIELDS.fuel.cats = top.concat(['Other fuels']);
    DATA.forEach(function (d) { if (!isTop[d.fuel]) d.v.fuel = 'Other fuels'; });
    // any value the lists above do not expect still gets a place, after the known ones
    GROUPS.forEach(function (k) { DATA.forEach(function (d) { if (FIELDS[k].cats.indexOf(d.v[k]) < 0) FIELDS[k].cats.push(d.v[k]); }); });

    FS = freshFilters();
    FACETS.forEach(function (k) {
      var box = $('f-' + k), n = {}; DATA.forEach(function (d) { n[d.v[k]] = (n[d.v[k]] || 0) + 1; });
      FIELDS[k].cats.forEach(function (cat) {
        if (!n[cat]) return;
        var b = document.createElement('button'), sm = document.createElement('small'); b.className = 'chip'; b.type = 'button'; b.dataset.v = cat; b.setAttribute('aria-pressed', 'false');
        b.textContent = cat; sm.textContent = big(n[cat]); b.appendChild(sm);
        b.addEventListener('click', function () { FS[k][cat] = !FS[k][cat]; b.setAttribute('aria-pressed', !!FS[k][cat]); refresh(); });
        box.appendChild(b);
      });
    });
    $('fSearch').addEventListener('input', function () { FS.q = this.value.trim().toLowerCase(); refresh(); });
    [['fO2min', 'o2min'], ['fO2max', 'o2max'], ['fPmin', 'pmin'], ['fPmax', 'pmax']].forEach(function (p) {
      $(p[0]).addEventListener('input', function () { FS[p[1]] = this.value === '' || isNaN(+this.value) ? null : +this.value; refresh(); });
    });
    $('fBoth').addEventListener('change', function () { FS.both = this.checked; refresh(); });
    $('fReset').addEventListener('click', function () { FS = freshFilters(); syncFilters(); refresh(); });

    function options(sel, withCount) {
      sel.textContent = '';
      if (withCount) { var o0 = document.createElement('option'); o0.value = 'count'; o0.textContent = 'Number of tests'; sel.appendChild(o0); }
      [['Measured values', NUMS], ['Groups', GROUPS]].forEach(function (g) {
        var og = document.createElement('optgroup'); og.label = g[0];
        g[1].forEach(function (k) { var o = document.createElement('option'); o.value = k; o.textContent = FIELDS[k].label; og.appendChild(o); });
        sel.appendChild(og);
      });
    }
    options($('gX'), false); options($('gY'), true);
    [['none', 'One colour'], ['outcome', 'Outcome'], ['phase', 'Fuel type'], ['o2from', 'Oxygen figure is for']].forEach(function (c) {
      var o = document.createElement('option'); o.value = c[0]; o.textContent = c[1]; $('gC').appendChild(o); });
    ['gX', 'gY', 'gC'].forEach(function (id) { $(id).addEventListener('change', function () { setGraph($('gX').value, $('gY').value, $('gC').value); }); });
    $('gPresets').querySelectorAll('[data-x]').forEach(function (b) { b.addEventListener('click', function () { setGraph(b.dataset.x, b.dataset.y, b.dataset.c); }); });
    $('gSwap').addEventListener('click', function () { if (GR.y !== 'count') setGraph(GR.y, GR.x, GR.c); });

    var hr = document.querySelector('#testTable thead tr');
    TCOLS.forEach(function (col) {
      var th = document.createElement('th'); th.className = 'sort' + (col.num ? ' n' : ''); th.tabIndex = 0; th.textContent = col.label;
      function go() {
        tSort = { k: col.k, dir: tSort.k === col.k && tSort.dir === 1 ? -1 : 1 }; tPage = 0;
        hr.querySelectorAll('th').forEach(function (x) { x.removeAttribute('aria-sort'); });
        th.setAttribute('aria-sort', tSort.dir === 1 ? 'ascending' : 'descending'); drawTable();
      }
      th.addEventListener('click', go); th.addEventListener('keydown', function (e) { if (e.key === 'Enter') go(); });
      hr.appendChild(th);
    });
    $('tPrev').addEventListener('click', function () { tPage--; drawTable(); });
    $('tNext').addEventListener('click', function () { tPage++; drawTable(); });
    // Download what the table shows (the filtered tests, or the picked mark) with each row's source in NASA's files.
    $('tCsv').addEventListener('click', function () {
      var cols = ['accession', 'investigation', 'test_id', 'fuel', 'fuel_phase', 'flame_type', 'o2_pct', 'oxygen_from', 'pressure_psi', 'flow_cm_s', 'gravity', 'outcome', 'ignited', 'source', 'source_line'];
      var cellOf = function (v) { v = v == null ? '' : String(v); return /[",\r\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
      var lines = [cols.concat('psi_page').join(',')].concat((picked ? picked.rows : CUR).map(function (d) {
        return cols.map(function (c) { return cellOf(d.r[c]); }).concat(PSI_PAGE + d.r.accession).join(',');
      }));
      var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([lines.join('\r\n')], { type: 'text/csv' }));
      a.download = 'flashpoint-nasa-tests.csv'; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    });
    if (window.innerWidth <= 860) $('filtBox').open = false;
    var wasNarrow = window.innerWidth < 620;
    window.addEventListener('resize', function () { var nw = window.innerWidth < 620; if (nw !== wasNarrow) { wasNarrow = nw; drawGraph(); } });
    $('gX').value = GR.x; $('gY').value = GR.y; $('gC').value = GR.c;
    refresh();
  }

  /* ---------- Sim: the flame lab (sim.html) in a frame. It loads the first time the page opens. ---------- */
  var simFrame = $('simFrame');
  function simPost(msg) { try { if (simFrame.contentWindow) simFrame.contentWindow.postMessage(msg, location.origin); } catch (e) { /* frame not ready */ } }
  function startSim() { if (!simFrame.getAttribute('src')) simFrame.setAttribute('src', 'sim.html?embed'); simPost({ type: 'fp-active', active: true }); }
  function stopSim() { simPost({ type: 'fp-active', active: false }); }
  var simWant = null;
  function simPoint(o, p, go) {
    if (!go && !$('page-sim').classList.contains('open')) return;
    simWant = { type: 'fp-point', o2: o, psi: p }; simPost(simWant);
  }
  window.addEventListener('message', function (e) {
    var d = e.data || {};
    if (e.source !== simFrame.contentWindow || e.origin !== location.origin) return;
    if (d.type === 'fp-height' && d.h > 0) simFrame.style.height = Math.ceil(d.h) + 'px';
    if (d.type === 'fp-ready') { simPost({ type: 'fp-active', active: $('page-sim').classList.contains('open') }); simPost({ type: 'fp-theme', dark: document.documentElement.dataset.theme === 'dark' }); if (simWant) simPost(simWant); }
  });

  document.querySelectorAll('.page').forEach(function (pg) { var f = $('siteFoot').cloneNode(true); f.removeAttribute('id'); pg.appendChild(f); });

  /* ---------- Load the data once, then fill every page ---------- */
  loadRows(function (rows) {
    if (rows) dataInit(rows);
    else setNotes(['Could not load data/tests.web.json. Open the site through a web server started in the repo root.']);
    if (!rows || !OFF) {
      var msg = !OFF ? 'The offline engine (public/offline/offline-answer.js) did not load.' : 'Could not load data/tests.web.json. Open the site through a web server started in the repo root.';
      $('homeCover').textContent = msg; $('homeDotsNote').textContent = msg;
      return;
    }
    ROWS = rows;
    var onMap = rows.filter(function (r) { return r.o2_pct != null && r.pressure_psi != null && r.oxygen_from !== 'burner' && r.pressure_psi <= 16; });
    home.dots(onMap);
    var note = $('homeDotsNote'); note.textContent = 'Each dot is a NASA microgravity test with chamber oxygen at 16 psi or less (' + onMap.length + ' tests):';
    [['b', 4, 'kept burning'], ['x', 3.6, 'went out or did not ignite'], ['u', 2.4, 'not recorded']].forEach(function (k) {
      var g = document.createElementNS(NS, 'svg'); g.setAttribute('class', 'lg'); g.setAttribute('viewBox', '0 0 12 12'); g.setAttribute('aria-hidden', 'true');
      el('circle', { 'class': 'tdot ' + k[0], cx: 6, cy: 6, r: k[1] }, g);
      note.appendChild(g); note.appendChild(document.createTextNode(k[2]));
    });
    note.appendChild(document.createTextNode('. Source: NASA PSI. The curve and habitat points use the values in the challenge statement.'));
    updateEvidence(home.state.p, home.state.o); window.FlashpointRows = rows; document.dispatchEvent(new CustomEvent('fp-data', { detail: rows }));
  });

  /* ---------- Navigation: a card opens its page; the other cards shrink into the bar ---------- */
  var openCard = null, bar = $('bar');
  function cardOf(n) { return document.querySelector('.card[data-page="' + n + '"]'); }
  function show(page) {
    var name = page.id.slice(5);
    document.querySelectorAll('.page.open').forEach(function (p) { if (p !== page) p.classList.remove('open'); });
    stopSim();
    page.classList.add('open'); document.querySelector('main').inert = true; document.querySelectorAll('.page').forEach(function (p) { p.inert = p !== page; }); page.scrollTop = 0; document.body.classList.add('in-page');
    bar.querySelectorAll('.tab').forEach(function (t) { if (t.dataset.page === name) t.setAttribute('aria-current', 'page'); else t.removeAttribute('aria-current'); });
    page.querySelector('h1').focus({ preventScroll: true });
    if (name === 'sim') startSim();
  }
  var ALIAS = { home: 'analysis', resources: 'analysis', si: 'analysis' };
  function open(name, card) {
    if (name === 'resources') showMode('advanced');
    if (name === 'si') openChat();
    name = ALIAS[name] || name;
    var page = $('page-' + name); if (!page) return;
    openCard = card || cardOf(name);
    show(page);
  }
  function close() {
    var page = document.querySelector('.page.open'); if (!page) return;
    var card = openCard; document.querySelector('main').inert = false; page.inert = true; stopSim(); document.body.classList.remove('in-page');
    page.classList.remove('open'); if (card) card.focus();
  }
  function toDashboard() { if (location.hash) window.history.pushState({}, '', location.pathname + location.search); close(); }
  document.querySelectorAll('.card[data-page], .bar .tab[data-page]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      if (location.hash.slice(1) === a.dataset.page && document.querySelector('.page.open')) return;
      window.history.pushState({}, '', '#' + a.dataset.page);
      open(a.dataset.page, a.classList.contains('card') ? a : null);
    });
  });
  $('barHome').addEventListener('click', function (e) { e.preventDefault(); toDashboard(); });
  window.addEventListener('popstate', function () { var n = location.hash.slice(1); if (n) open(n, document.querySelector('.page.open') ? null : cardOf(n)); else close(); });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (!$('brief').hidden) { closeBrief(); return; }
    if (!chat.hidden && chat.contains(document.activeElement)) { closeChat(); return; }
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) return;
    if (document.querySelector('.page.open')) toDashboard();
  });
  document.querySelectorAll('.page').forEach(function (p) { p.inert = true; });
  window.Flashpoint = {
    go: function (name) { if (location.hash !== '#' + name) history.pushState({}, '', '#' + name); open(name, null); },
    probe: function (p, o) { home.set(p, o); },
    brief: function () { openBrief(false); },
    mapFuel: function (fuel) { if (!ROWS) return; var a = ROWS.filter(function (r) { return r.o2_pct != null && r.pressure_psi != null && r.oxygen_from !== 'burner' && r.pressure_psi <= 16 && (!fuel || r.fuel_phase === fuel); }); home.dots(a); return a.length; }
  };
  if (location.hash) open(location.hash.slice(1), null);

  /* ---------- Theme: light unless the visitor picked dark; the choice is remembered on this device ---------- */
  function setTheme(dark) {
    if (dark) document.documentElement.dataset.theme = 'dark'; else delete document.documentElement.dataset.theme;
    document.querySelectorAll('.theme').forEach(function (b) { b.innerHTML = (dark ? 'Light' : 'Dark') + '<span class="long">&nbsp;mode</span>'; });
    try { localStorage.setItem('fp-theme', dark ? 'dark' : 'light'); } catch (e) { /* private window: the choice lasts for this visit only */ }
    simPost({ type: 'fp-theme', dark: dark });
  }
  document.querySelectorAll('.theme').forEach(function (b) { b.addEventListener('click', function () { setTheme(document.documentElement.dataset.theme !== 'dark'); }); });
  setTheme(document.documentElement.dataset.theme === 'dark');
})();

