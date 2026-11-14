/* Timeline engine for the learners page videos. AI-assisted (Claude Code); see docs/ai-usage-log.md.
   A scene is an SVG drawn as a pure function of time: seek(t) draws exactly the frame at t, with no clock, so the
   renderer can step through it frame by frame. Beats (one per narrated sentence) start at the sentence's time in the
   narration's timing file. ?preview adds play controls and captions; rendered frames never show them. */
(function () {
  'use strict';
  var P = new URLSearchParams(location.search);
  var NS = 'http://www.w3.org/2000/svg';
  var E = window.E = { W: 1920, H: 1080, used: [], preview: P.has('preview'), timing: null, audioUrl: null };

  E.C = { bg: '#05173a', ink: '#e9eef8', muted: '#9db0d6', blue: '#3d7bff', blueSoft: '#9dbcff', red: '#FC3D21',
    amber: '#ffb23e', cream: '#fff2c4', teal: '#2DD4BF', grey: '#8a97ad', panel: 'rgba(157,188,255,.07)', line: 'rgba(157,188,255,.28)' };
  E.clamp = function (x, a, b) { return Math.min(b === undefined ? 1 : b, Math.max(a || 0, x)); };
  E.lerp = function (a, b, k) { return a + (b - a) * k; };
  E.ease = {
    lin: function (k) { return k; },
    out: function (k) { return 1 - Math.pow(1 - k, 3); },
    inOut: function (k) { return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; },
    back: function (k) { var c = 1.5; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); }
  };
  /* Progress 0..1 of a tween that starts at `start` and lasts `dur` seconds. */
  E.at = function (t, start, dur, ease) { return (ease || E.ease.out)(E.clamp((t - start) / dur)); };
  /* Fade in at a, fade out at b (b optional). */
  E.window = function (t, a, b, fade) { fade = fade || .6; return E.at(t, a, fade) * (b === undefined ? 1 : 1 - E.at(t, b, fade)); };
  E.rand = function (seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var r = Math.imul(seed ^ seed >>> 15, 1 | seed); r = r + Math.imul(r ^ r >>> 7, 61 | r) ^ r; return ((r ^ r >>> 14) >>> 0) / 4294967296; }; };
  E.el = function (tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  };
  E.set = function (e, attrs) { for (var k in attrs) e.setAttribute(k, attrs[k]); return e; };
  E.text = function (str, attrs, parent) { var e = E.el('text', attrs, parent); e.textContent = str; return e; };
  /* Start time of a narrated sentence by its beat name. Every beat a scene asks for is recorded in E.used. */
  E.beat = function (name) {
    if (E.used.indexOf(name) < 0) E.used.push(name);
    for (var i = 0; i < E.timing.sentences.length; i++) if (E.timing.sentences[i].beat === name) return E.timing.sentences[i].start;
    throw new Error('No beat "' + name + '" in the timing file');
  };
  /* Integral of a 0..1 rate over time, for things that slow down smoothly (particles when gravity goes). */
  E.integ = function (rate, t0, t, steps) {
    if (t <= t0) return 0;
    steps = steps || 60; var h = (t - t0) / steps, s = 0;
    for (var i = 0; i < steps; i++) s += rate(t0 + (i + .5) * h) * h;
    return s;
  };

  function loadTiming(id) {
    var tries = [];
    if (P.get('timing')) tries.push([P.get('timing'), null]);
    tries.push(['../narration/' + id + '.timing.json', '../narration/' + id + '.mp3']);
    tries.push(['../narration-draft/' + id + '.timing.json', '../narration-draft/' + id + '.wav']);
    return tries.reduce(function (p, c) {
      return p.then(function (got) {
        if (got) return got;
        return fetch(c[0]).then(function (r) { return r.ok ? r.json().then(function (j) { E.audioUrl = c[1]; return j; }) : null; }).catch(function () { return null; });
      });
    }, Promise.resolve(null)).then(function (t) {
      if (!t) throw new Error('No timing for ' + id + '. Run: python tts.py --draft --only ' + id);
      return t;
    });
  }

  function background(svg) {
    var d = E.el('defs', {}, svg);
    var g = E.el('radialGradient', { id: 'bgGlow', cx: '50%', cy: '45%', r: '70%' }, d);
    E.el('stop', { offset: '0', 'stop-color': '#0d2a66' }, g);
    E.el('stop', { offset: '1', 'stop-color': E.C.bg }, g);
    E.el('rect', { width: E.W, height: E.H, fill: 'url(#bgGlow)' }, svg);
    var stars = E.el('g', {}, svg), r = E.rand(7), list = [];
    for (var i = 0; i < 150; i++) list.push(E.el('circle', { cx: r() * E.W, cy: r() * E.H, r: .6 + r() * 1.6, fill: '#cfe0ff', opacity: .2 + r() * .4 }, stars));
    return function (t) { for (var i = 0; i < list.length; i += 3) list[i].setAttribute('opacity', (.25 + .2 * Math.sin(t * 1.3 + i)).toFixed(3)); };
  }

  /* Register a scene. build(E, svg) creates its shapes and returns draw(t). */
  E.scene = function (id, build) {
    window.ready = loadTiming(id).then(function (timing) {
      E.timing = timing;
      return Promise.all([document.fonts.load('400 40px Geist'), document.fonts.load('600 40px Geist'), document.fonts.load('500 40px "Geist Mono"')]);
    }).then(function () { return document.fonts.ready; }).then(function () {
      var svg = document.getElementById('stage');
      var bg = background(svg);
      var layer = E.el('g', {}, svg);
      var draw = build(E, layer);
      var wm = E.text('AI-assisted animation and voice · Flashpoint', { id: 'wm', x: E.W - 40, y: E.H - 34, 'text-anchor': 'end',
        'font-family': 'Geist', 'font-size': 22, fill: '#ffffff', opacity: .72 }, svg);
      wm.style.opacity = '.72';
      var cap = document.getElementById('cap');
      window.seek = function (t) {
        bg(t); draw(t);
        if (E.preview) {
          var s = E.timing.sentences.filter(function (x) { return t >= x.start && t <= x.end + .3; })[0];
          cap.textContent = s ? s.show : '';
        }
      };
      if (E.preview) controls();
      window.seek(0);
      return { duration: E.timing.duration };
    });
  };

  function controls() {
    var cap = document.getElementById('cap'); cap.hidden = false;
    var bar = document.getElementById('ctl'); bar.hidden = false;
    var audio = E.audioUrl ? new Audio(E.audioUrl) : null, btn = bar.querySelector('button'), rng = bar.querySelector('input'), out = bar.querySelector('output');
    rng.max = E.timing.duration; rng.step = .01;
    var clock = 0, t0 = 0, playing = false;
    function now() { return audio ? audio.currentTime : clock + (performance.now() - t0) / 1000; }
    function tick() { if (!playing) return; var t = now(); if (t >= E.timing.duration) { pause(); return; } show(t); requestAnimationFrame(tick); }
    function show(t) { window.seek(t); rng.value = t; out.textContent = t.toFixed(1) + ' s'; }
    function play() { playing = true; btn.textContent = 'Pause'; if (audio) audio.play(); else t0 = performance.now(); tick(); }
    function pause() { playing = false; btn.textContent = 'Play'; if (audio) audio.pause(); else clock = now(); }
    btn.addEventListener('click', function () { playing ? pause() : play(); });
    rng.addEventListener('input', function () { var t = +rng.value; if (audio) audio.currentTime = t; else clock = t; show(t); });
    document.addEventListener('keydown', function (e) { if (e.code === 'Space') { e.preventDefault(); btn.click(); } });
  }
})();
