/* Flashpoint "calm" layer (preview). AI-assisted (Claude Code).
   It changes no content and no data: it only reorders the page, puts the answer first, and folds secondary material
   away until asked for. Everything it moves is still written by the page's own scripts, found by id or class.
   Add ?calm=0 to the address to see the page without it. Remove the two lines that load calm.css and calm.js to undo. */
(function () {
  'use strict';
  var off = /[?&]calm=0/.test(location.search);
  var $ = function (id) { return document.getElementById(id); };
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html) e.innerHTML = html; return e; }

  // Preview only: a switch between the calmer layout and the page as it is today. Delete this block when the layer is adopted.
  var sw = el('a', 'calm-switch');
  sw.href = location.pathname + (off ? '' : '?calm=0') + location.hash;
  sw.textContent = off ? 'Showing the current site. Switch to the calmer layout' : 'Preview: calmer layout. Switch to the current site';
  document.body.appendChild(sw);
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
    // 1. The most important thing the data says, where the eye lands first.
    var lead = el('aside', 'calm-lead', '<p class="eyebrow"><i></i> THE HEADLINE FINDING</p>' +
      '<p class="calm-big"><b id="calmZero">0</b><span>cabin-material tests NASA can place in Moon Base air</span></p>' +
      '<p class="calm-leadtext" id="calmLeadText">NASA expects about 30% oxygen at 10.2 psi in a Moon Base. See what its fire tests cover near that air.</p>' +
      '<button class="btn ghost" type="button" id="calmSeeMap">See it on the map <span aria-hidden="true">&rarr;</span></button>');
    lead.setAttribute('aria-label', 'The headline finding');
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

    // The headline numbers are counted from NASA's rows with the site's own rating rule, never typed in.
    var OFF = window.FlashpointOffline;
    if (OFF) fetch('../data/tests.web.json').then(function (r) { return r.json(); }).then(function (rows) {
      var at = { o2_pct: 30, pressure_psi: 10.2 };
      var near = function (k) { return OFF.evidenceAt(rows, at, { k: 1, fuelPhase: k }).nearCount; };
      var solid = rows.filter(function (r) { return r.fuel_phase === 'solid'; });
      var o2 = solid.filter(function (r) { return r.o2_pct != null; }).map(function (r) { return r.o2_pct; });
      var noP = solid.every(function (r) { return r.pressure_psi == null; });
      $('calmZero').textContent = near('solid');
      $('calmLeadText').innerHTML = 'NASA expects about 30% oxygen at 10.2 psi in a Moon Base. Near that air its tables hold <b>' + near('liquid') +
        '</b> fuel-droplet tests and <b>' + near('gas') + '</b> gas-flame tests.' +
        (noP && o2.length ? ' All <b>' + solid.length + '</b> solid-material tests record no pressure, and their oxygen tops out at <b>' + Math.max.apply(null, o2).toFixed(1) + '%</b>.' : '');
    }).catch(function () { /* the plain sentence above stays */ });

    $('calmSeeMap').addEventListener('click', function () {
      var go = main.querySelector('.home-nav a[data-go="analysis"]'), moon = document.querySelector('#journeyTrack [data-step="1"]');
      if (go) go.click();
      if (moon) moon.click();
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
