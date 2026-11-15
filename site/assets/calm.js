/* Flashpoint "calm" layer. AI-assisted (Claude Code).
   It changes no content and no data: it only reorders the page, puts the answer first, and folds secondary material
   away until asked for. Everything it moves is still written by the page's own scripts, found by id or class.
   Add ?calm=0 to the address to see the page without it. Remove the two lines that load calm.css and calm.js to undo. */
(function () {
  'use strict';
  var off = /[?&]calm=0/.test(location.search);
  var $ = function (id) { return document.getElementById(id); };
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html) e.innerHTML = html; return e; }

  if (off) return;

  var main = $('mainContent'), simple = $('anSimple');
  if (!main || !simple) return;
  document.documentElement.classList.add('calm');

  // A row that stays closed until asked for. The section inside it is the page's own, moved here untouched.
  function fold(title, hint, node) {
    var d = el('details', 'calm-fold'), s = el('summary', '', '<div><b></b><span></span></div>');
    s.firstChild.firstChild.textContent = title; s.firstChild.lastChild.textContent = hint;
    var body = el('div', 'calm-fold-body'); body.appendChild(node); d.append(s, body);
    return d;
  }

  /* ---------- Landing: headline finding, then where to go, then the four gaps, then everything else on request ---------- */
  var hero = main.querySelector('.mission-hero'), chamber = hero && hero.querySelector('.hero-chamber');
  var cards = main.querySelector('section.cards'), cardsIntro = cards && cards.previousElementSibling;
  var findings = main.querySelector('.findings'), strip = main.querySelector('.inv-strip-sec'), asked = main.querySelector('.asked');
  var ribbon = main.querySelector('.evidence-ribbon'), ask = main.querySelector('.closing-question');
  if (hero && chamber && cards && findings && strip && asked && ribbon && ask) {
    // 1. The evidence meter, where the eye lands first: lower the cabin pressure and watch the nearby tests thin out.
    var lead = el('aside', 'calm-lead', '<p class="eyebrow"><i></i> THE EVIDENCE METER</p>' +
      '<p class="calm-prompt">Lower the cabin pressure. Watch the evidence thin out.</p>' +
      '<div class="calm-meter"><p class="calm-big"><output id="calmCount" for="calmSlide">...</output><span>NASA fire tests near this air</span></p>' +
      '<svg id="calmMap" viewBox="0 0 300 170" role="img" aria-label="Small map of pressure against oxygen. The ring is the air chosen with the slider, and the bright dots are the tests near it."></svg></div>' +
      '<div class="calm-slide"><span id="calmAir">14.7 psi, 21% oxygen</span>' +
      '<input id="calmSlide" type="range" min="4.3" max="14.7" step="0.1" value="14.7" aria-label="Cabin pressure, from a spacesuit up to the ISS"></div>' +
      '<div class="calm-stops"><button type="button" data-p="4.3">Spacesuit</button><button type="button" data-p="10.2">Moon Base</button><button type="button" data-p="14.7">ISS</button></div>' +
      '<p class="calm-leadtext" id="calmLeadText">Loading NASA tests.</p>' +
      '<button class="btn ghost" type="button" id="calmSeeMap">See this air on the map <span aria-hidden="true">&rarr;</span></button>');
    lead.setAttribute('aria-label', 'The evidence meter');
    hero.insertBefore(lead, chamber);

    // 2. One order for the page. The rest waits behind four plain rows.
    var more = el('section', 'calm-more', '<p class="eyebrow">GO DEEPER</p>');
    more.setAttribute('aria-label', 'More about the evidence');
    more.append(
      fold('Where NASA tested', 'One small map for each investigation', strip),
      fold('Why gravity changes a flame', 'An animated illustration', chamber),
      fold('How this answers the challenge', 'NASA\'s three asks, and where each one is on the site', asked),
      fold('Where the numbers come from', 'Every value traces to a NASA file and line', ribbon));
    hero.after(cardsIntro, cards, findings, more, ask);

    // 3. Each gap: its first sentence shows, the rest is one tap away. The page's own paragraph stays the source.
    findings.querySelectorAll('.finding-grid article p[id]').forEach(function (p) {
      var short = el('p', 'calm-short'), rest = el('details', 'calm-rest', '<summary>More</summary><p></p>');
      p.classList.add('calm-hide'); p.after(short, rest);
      function sync() {
        var h = p.innerHTML, i = h.indexOf('. ');
        if (i < 0 || /^Loading/.test(p.textContent)) { short.innerHTML = h; rest.hidden = true; return; }
        short.innerHTML = h.slice(0, i + 1); rest.lastChild.innerHTML = h.slice(i + 2); rest.hidden = false;
      }
      new MutationObserver(sync).observe(p, { childList: true, characterData: true, subtree: true }); sync();
    });

    // The meter. Every number is counted here from NASA's rows with the site's own "near" rule; nothing is typed in.
    // The slider follows straight lines between the three atmospheres in the challenge statement.
    var OFF = window.FlashpointOffline, STOPS = [[4.3, 100, 'Spacesuit'], [10.2, 30, 'Moon Base'], [14.7, 21, 'ISS']];
    function oxygenAt(p) {
      var a = p <= 10.2 ? STOPS[0] : STOPS[1], b = p <= 10.2 ? STOPS[1] : STOPS[2];
      return a[1] + (b[1] - a[1]) * (p - a[0]) / (b[0] - a[0]);
    }
    var slide = $('calmSlide'), run = 0, touched = false, reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function fail() { $('calmLeadText').textContent = 'The test data did not load, so the meter cannot count.'; slide.disabled = true; $('calmCount').textContent = ''; }
    if (!OFF) fail();
    else fetch('../data/tests.web.json').then(function (r) { return r.json(); }).then(function (rows) {
      var NS = 'http://www.w3.org/2000/svg', svg = $('calmMap'), W = 300, H = 170, M = 10;
      var X = function (psi) { return M + psi / 16 * (W - 2 * M); }, Y = function (o2) { return H - M - (o2 - 10) / 90 * (H - 2 * M); };
      function draw(tag, attrs, text) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (text) e.textContent = text; svg.appendChild(e); return e; }
      // The rows that can be placed: oxygen and pressure recorded, and the oxygen is the chamber's (the rule the Analysis map uses).
      var placed = rows.filter(function (r) { return r.o2_pct != null && r.pressure_psi != null && r.oxygen_from !== 'burner'; });
      var solid = rows.filter(function (r) { return r.fuel_phase === 'solid'; }), noSolidP = solid.every(function (r) { return r.pressure_psi == null; });
      draw('polyline', { 'class': 'calm-path', points: STOPS.map(function (st) { return X(st[0]) + ',' + Y(st[1]); }).join(' ') });
      var dots = placed.map(function (r) { return r.pressure_psi <= 16 ? draw('circle', { cx: X(r.pressure_psi), cy: Y(r.o2_pct), r: 2.4 }) : null; });
      var ring = draw('ellipse', { 'class': 'calm-ring', rx: OFF.P_SCALE * OFF.NEAR_DISTANCE / 16 * (W - 2 * M), ry: OFF.O2_SCALE * OFF.NEAR_DISTANCE / 90 * (H - 2 * M) });
      STOPS.forEach(function (st) { draw('text', { x: X(st[0]) + (st[2] === 'ISS' ? -6 : 8), y: Y(st[1]) + (st[2] === 'Spacesuit' ? 12 : -8), 'text-anchor': st[2] === 'ISS' ? 'end' : 'start' }, st[2]); });
      function set(p) {
        var o = oxygenAt(p), n = { gas: 0, liquid: 0 }, total = 0;
        placed.forEach(function (r, i) {
          var near = Math.sqrt(Math.pow((r.o2_pct - o) / OFF.O2_SCALE, 2) + Math.pow((r.pressure_psi - p) / OFF.P_SCALE, 2)) <= OFF.NEAR_DISTANCE;
          if (dots[i]) dots[i].setAttribute('class', near ? 'on' : '');
          if (near) { total++; n[r.fuel_phase] = (n[r.fuel_phase] || 0) + 1; }
        });
        ring.setAttribute('cx', X(p)); ring.setAttribute('cy', Y(o));
        var air = p.toFixed(1) + ' psi, ' + o.toFixed(0) + '% oxygen';
        $('calmCount').textContent = total; $('calmAir').textContent = air; slide.setAttribute('aria-valuetext', air + ', ' + total + ' tests near');
        lead.classList.toggle('none', total === 0);
        $('calmLeadText').innerHTML = '<b>' + n.gas + '</b> gas flames and <b>' + n.liquid + '</b> fuel droplets. ' +
          (noSolidP ? 'Cabin materials: none can be placed anywhere, because all <b>' + solid.length + '</b> solid-material tests record no pressure.' : '');
        return total;
      }
      function go(p) { slide.value = p; set(+slide.value); }
      function glide(to, ms) {
        var from = +slide.value, t0 = performance.now(), me = ++run;
        if (reduce) { go(to); return; }
        (function step(now) { var k = Math.min(1, (now - t0) / ms), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; go(from + (to - from) * e); if (k < 1 && me === run) requestAnimationFrame(step); })(t0);
      }
      slide.addEventListener('input', function () { touched = true; run++; set(+slide.value); });
      lead.querySelectorAll('.calm-stops button').forEach(function (b) { b.addEventListener('click', function () { touched = true; glide(+b.dataset.p, 700); }); });
      // Self-check: the meter's count at the ISS must equal the count the Analysis page shows there.
      console.assert(set(14.7) === OFF.evidenceAt(rows, { o2_pct: 21, pressure_psi: 14.7 }, { k: 1 }).nearCount, 'evidence meter disagrees with the Analysis count');
      // Show the idea once, unless the visitor has already taken the slider or asked for less motion.
      if (!reduce) setTimeout(function () { if (!touched && !document.querySelector('.page.open')) glide(10.2, 2600); }, 1400);
    }).catch(fail);

    $('calmSeeMap').addEventListener('click', function () {
      var p = +slide.value, o = oxygenAt(p), nav = main.querySelector('.home-nav a[data-go="analysis"]');
      if (nav) nav.click();
      [['probeO', o.toFixed(1)], ['probeP', p.toFixed(1)]].forEach(function (kv) {
        var box = $(kv[0]); if (!box) return;
        box.value = kv[1]; box.dispatchEvent(new Event('input', { bubbles: true })); box.dispatchEvent(new Event('change', { bubbles: true }));
      });
    });
  }

  /* ---------- Analysis: the answer for the chosen air comes first; duplicates and extras step back ---------- */
  var cover = $('homeCover'), journey = simple.querySelector('.journey'), mapPanel = $('homeMap');
  if (cover && mapPanel && $('hO2') && $('hP')) {
    // 1. The evidence by fuel is the answer, so it gets its own full-width row above the map.
    var oldHead = cover.previousElementSibling, method = simple.querySelector('details.method');
    var verdict = el('section', 'panel s12 calm-verdict', '<div class="calm-vhead"><h2>What NASA tested near this air</h2><p id="calmPoint"></p></div>');
    verdict.appendChild(cover); if (method) verdict.appendChild(method);
    if (oldHead && oldHead.tagName === 'H3') oldHead.classList.add('calm-hide');
    if (journey) journey.after(verdict); else simple.prepend(verdict);
    var point = function () { $('calmPoint').textContent = parseFloat($('hO2').textContent).toFixed(1) + '% oxygen at ' + parseFloat($('hP').textContent).toFixed(1) + ' psi'; };
    new MutationObserver(point).observe($('hO2'), { childList: true, characterData: true, subtree: true });
    new MutationObserver(point).observe($('hP'), { childList: true, characterData: true, subtree: true }); point();

    // 2. "Go to" repeats the journey's own ISS, Moon Base and Spacesuit steps.
    var presets = $('homePresets');
    if (journey && presets && presets.parentNode.classList.contains('toolbar')) presets.parentNode.classList.add('calm-hide');

    // 3. One clear next step; the other three wait behind it.
    var acts = simple.querySelector('.acts');
    if (acts && $('briefOpen')) {
      var extra = el('details', 'calm-acts', '<summary>More you can do with this point</summary><div class="acts"></div>');
      ['briefPdf', 'homeAround', 'homeBurn'].forEach(function (id) { if ($(id)) extra.lastChild.appendChild($(id)); });
      var after = acts.nextElementSibling; acts.after(extra);
      if (after && after.classList.contains('note')) after.classList.add('calm-hide');
    }
  }
})();
