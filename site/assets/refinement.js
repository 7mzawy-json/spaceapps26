/* AI-assisted by OpenAI Codex. Guided presentation and progressive disclosure; no fabricated NASA data. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var fp = window.Flashpoint, rows = null, step = 0, custom = false;
  if (!fp) return;
  var journey = [
    { title:'Start with the air we know.', text:'The ISS uses an Earth-like atmosphere: 21% oxygen at 14.7 psi. Start here, then ask what happens when a habitat uses less pressure and more oxygen.', p:14.7, o:21, next:'Next: Moon Base' },
    { title:'Similar oxygen pressure. Different evidence.', text:'At 30% oxygen and 10.2 psi, the dry oxygen partial pressure is almost the same as at sea level. But the nearby tests burn droplets, not cabin fabrics and plastics. That distinction is the finding.', p:10.2, o:30, next:'Next: spacesuit' },
    { title:'Beyond the edge of the tested conditions.', text:'NASA\'s challenge gives a spacesuit atmosphere of 100% oxygen at 4.3 psi. Look at the distance to the test cloud. A nearest row is not necessarily a relevant experiment.', p:4.3, o:100, next:'Next: the research gap' },
    { title:'The gap becomes the next experiment.', text:'Return to the Moon Base. We need material tests at the relevant oxygen, pressure and gravity. Read the evidence brief for the sources, limits and NASA work aimed at closing that gap.', p:10.2, o:30, next:'Read the evidence brief' }
  ];
  function setStep(i) {
    step = i; custom = false; var s = journey[i];
    $('journeyCount').textContent = 'GUIDED JOURNEY / ' + (i+1) + ' OF 4';
    $('journeyTitle').textContent = s.title; $('journeyText').textContent = s.text;
    $('journeyPrev').disabled = i === 0;
    $('journeyNext').textContent = s.next + (i < 3 ? ' \u2192' : '');
    $('journeyTrack').querySelectorAll('button').forEach(function (b) { if (+b.dataset.step === i) b.setAttribute('aria-current','step'); else b.removeAttribute('aria-current'); });
    fp.probe(s.p,s.o); syncProbe();
  }
  function syncProbe() {
    var o = parseFloat($('hO2').textContent), p = parseFloat($('hP').textContent);
    if (document.activeElement !== $('probeO')) $('probeO').value = o;
    if (document.activeElement !== $('probeP')) $('probeP').value = p;
    $('homePresets').querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', Math.abs(+b.dataset.o-o)<.05 && Math.abs(+b.dataset.p-p)<.05); });
  }
  new MutationObserver(syncProbe).observe($('hO2'),{childList:true,subtree:true});
  function freeExplore() {
    custom = true;
    $('journeyCount').textContent = 'FREE EXPLORATION';
    $('journeyTitle').textContent = 'Your atmosphere. The same honest questions.';
    $('journeyText').textContent = 'Move the point, enter exact values or choose a preset. Compare the fuels separately. A count of nearby tests describes evidence coverage, never safety.';
    $('journeyNext').textContent = 'Resume the journey \u2192';
    $('journeyTrack').querySelectorAll('button').forEach(function (b) { b.removeAttribute('aria-current'); });
  }
  $('homeSvg').addEventListener('pointerdown',freeExplore);
  $('homeSvg').addEventListener('keydown',function (e) { if (e.key.indexOf('Arrow')===0) freeExplore(); });
  $('homePresets').addEventListener('click',freeExplore);
  ['probeO','probeP'].forEach(function (id) { $(id).addEventListener('change',function () {
    if (!this.checkValidity() || !this.value) { this.reportValidity(); syncProbe(); return; }
    freeExplore(); fp.probe(+$('probeP').value,+$('probeO').value); syncProbe();
  }); });
  $('journeyPrev').addEventListener('click',function () { setStep(Math.max(0,step-1)); });
  $('journeyNext').addEventListener('click',function () { if (custom) setStep(step); else if (step===3) fp.brief(); else setStep(step+1); });
  $('journeyRestart').addEventListener('click',function () { setStep(0); });
  $('journeyTrack').querySelectorAll('button').forEach(function (b) { b.addEventListener('click',function () { setStep(+b.dataset.step); }); });
  $('startJourney').addEventListener('click',function () { fp.go('analysis'); document.querySelector('#anMode [data-m="simple"]').click(); setStep(0); });
  document.querySelectorAll('[data-go]').forEach(function (a) { a.addEventListener('click',function (e) { e.preventDefault(); fp.go(a.dataset.go); }); });
  document.querySelectorAll('[data-hero-g]').forEach(function (b) { b.addEventListener('click',function () {
    document.querySelector('.hero-chamber').dataset.gravity=b.dataset.heroG;
    document.querySelectorAll('[data-hero-g]').forEach(function (v) { v.setAttribute('aria-pressed',v===b); });
    var earth=b.dataset.heroG==='earth';
    $('heroFlameTitle').textContent=earth?'Hot gas rises. Fresh air moves in.':'No rising hot gas. A different kind of fire.';
    $('heroFlameNote').textContent=earth?'Buoyancy stretches a flame upward and supplies fresh oxygen. This is the familiar teardrop.':'Without buoyancy, oxygen diffuses toward the flame. In still air, a flame can form a blue sphere.';
  }); });
  $('mapFuels').querySelectorAll('button').forEach(function (b) { b.addEventListener('click',function () {
    $('mapFuels').querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed',x===b); });
    var n=fp.mapFuel(b.dataset.fuel), empty=$('mapEmpty'); empty.hidden=!!n;
    var count=$('mapFilterCount'); if(!count) { count=document.createElement('p');count.id='mapFilterCount';count.className='map-filter-count';count.setAttribute('aria-live','polite');$('mapFuels').after(count); }
    count.textContent=(n===undefined?'Loading':n.toLocaleString('en-US'))+' placeable rows shown. Fuel buttons filter the map; coverage compares all fuels.';
    empty.textContent=b.dataset.fuel==='solid'?'These material tests cannot be plotted: their NASA tables omit pressure. Missing coordinates do not mean the materials cannot burn.':'No placeable tests for this fuel in the map range.';
  }); });
  document.addEventListener('fp-data',function (e) { rows=e.detail; $('missionRows').textContent=rows.length.toLocaleString('en-US'); });
  // Modal focus containment and restoration complement the original Escape handler.
  var modal=$('brief');
  new MutationObserver(function () {
    var visible=!modal.hidden;
    document.querySelector('main').inert=visible || !!document.querySelector('.page.open');
    document.querySelectorAll('.page').forEach(function (p) { p.inert=visible || !p.classList.contains('open'); });
    $('bar').inert=visible; $('chat').inert=visible;
    if (visible) document.body.style.overflow='hidden';
    else document.body.style.overflow='';
  }).observe(modal,{attributes:true,attributeFilter:['hidden']});
  document.addEventListener('keydown',function (e) {
    if (modal.hidden || e.key!=='Tab') return;
    var a=Array.from(modal.querySelectorAll('a[href],button:not([disabled])')).filter(function (x) { return x.getClientRects().length; }), first=a[0],last=a[a.length-1];
    if (e.shiftKey && document.activeElement===first) { e.preventDefault();last.focus(); }
    else if (!e.shiftKey && document.activeElement===last) { e.preventDefault();first.focus(); }
  });
  setStep(0);
})();
