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
    // 1. The SI assistant, where the eye lands first: ask a question and read the answer without leaving the page.
    var lead = el('aside', 'calm-lead', '<p class="eyebrow"><i></i> ASK THE SI ASSISTANT</p>' +
      '<p class="calm-prompt">Ask NASA\'s fire tests a question.</p>' +
      '<form class="calm-ask" id="calmAsk"><input id="calmAskIn" autocomplete="off" maxlength="500" placeholder="What was tested for a Moon Base?" aria-label="Your question for the SI assistant">' +
      '<button class="btn" type="submit" id="calmAskGo">Ask</button></form>' +
      '<div class="calm-chips" id="calmChips"><button type="button" class="chip">What was tested for a Moon Base?</button>' +
      '<button type="button" class="chip">Is spacesuit air tested?</button><button type="button" class="chip">Why are flames round in space?</button></div>' +
      '<div class="calm-answer" id="calmAnswer" aria-live="polite"><p class="calm-leadtext">It answers from NASA\'s test rows near the air you ask about, names the tests it used, and moves the map there. ' +
      'Answers are AI-generated (Google Gemini), and your question is sent to Google.</p></div>' +
      '<button class="btn ghost" type="button" id="calmSeeMap" hidden>See it on the map <span aria-hidden="true">&rarr;</span></button>');
    lead.setAttribute('aria-label', 'Ask the SI assistant');
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
    ask.classList.add('calm-hide');   // the same question box now sits beside the headline

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

    // The card has no assistant of its own. It sends the question through the chat panel's own form and shows the reply
    // that panel receives, so there is one assistant, one set of rules and one conversation.
    var msgs = $('msgs'), chatBox = $('ask'), chatForm = $('compose'), out = $('calmAnswer'), seeMap = $('calmSeeMap'), waiting = null;
    function busy(on) { $('calmAskIn').disabled = on; $('calmAskGo').disabled = on; $('calmChips').querySelectorAll('.chip').forEach(function (c) { c.disabled = on; }); }
    function askHero(q) {
      q = q.trim(); if (!q || waiting != null || !msgs || !chatBox || !chatForm) return;
      waiting = msgs.querySelectorAll('.msg.bot').length; busy(true); seeMap.hidden = true;
      out.textContent = '';
      var asked = el('p', 'calm-q'); asked.textContent = q;
      var wait = el('p', 'calm-wait'); wait.textContent = 'Reading NASA\'s test rows near that air.';
      out.append(asked, wait);
      chatBox.value = q;
      if (chatForm.requestSubmit) chatForm.requestSubmit(); else chatForm.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }
    if (msgs) new MutationObserver(function () {
      if (waiting == null) return;
      var bots = msgs.querySelectorAll('.msg.bot');
      if (bots.length <= waiting) return;
      waiting = null; busy(false);
      var reply = bots[bots.length - 1].cloneNode(true); reply.className = 'calm-reply';
      var wait = out.querySelector('.calm-wait'); if (wait) wait.remove();
      out.appendChild(reply); seeMap.hidden = false;
    }).observe(msgs, { childList: true });
    $('calmAsk').addEventListener('submit', function (e) { e.preventDefault(); var box = $('calmAskIn'), q = box.value; box.value = ''; askHero(q); });
    $('calmChips').querySelectorAll('.chip').forEach(function (c) { c.addEventListener('click', function () { askHero(c.textContent); }); });
    seeMap.addEventListener('click', function () {
      var nav = main.querySelector('.home-nav a[data-go="analysis"]'), open = document.querySelector('.bar [data-ask]'), chat = $('chat');
      if (nav) nav.click();
      if (open && chat && chat.hidden) open.click();   // carry the conversation on beside the map
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
