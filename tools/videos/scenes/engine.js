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

  /* Background with depth: a glow, three soft drifting light clouds, and stars that drift slower than the camera. */
  function background(svg) {
    var d = E.el('defs', {}, svg);
    var g = E.el('radialGradient', { id: 'bgGlow', cx: '50%', cy: '45%', r: '70%' }, d);
    E.el('stop', { offset: '0', 'stop-color': '#0d2a66' }, g);
    E.el('stop', { offset: '1', 'stop-color': E.C.bg }, g);
    E.el('rect', { width: E.W, height: E.H, fill: 'url(#bgGlow)' }, svg);
    // Soft light clouds drawn with radial gradients (a blur filter looked the same but made 60 fps rendering ten times slower).
    var clouds = E.el('g', {}, svg);
    var cl = [[420, 300, 480, '#1b4fb0', .35, .05], [1500, 760, 560, '#2a3f8f', .3, .04], [1100, 200, 360, '#3a2a7a', .22, .06]].map(function (c, k) {
      var gr = E.el('radialGradient', { id: 'cloud' + k }, d);
      E.el('stop', { offset: 0, 'stop-color': c[3], 'stop-opacity': c[4] }, gr);
      E.el('stop', { offset: .55, 'stop-color': c[3], 'stop-opacity': c[4] * .45 }, gr);
      E.el('stop', { offset: 1, 'stop-color': c[3], 'stop-opacity': 0 }, gr);
      return { e: E.el('circle', { cx: c[0], cy: c[1], r: c[2], fill: 'url(#cloud' + k + ')' }, clouds), x: c[0], y: c[1], w: c[5] };
    });
    var stars = E.el('g', {}, svg), r = E.rand(7), list = [];
    for (var i = 0; i < 150; i++) list.push(E.el('circle', { cx: r() * E.W, cy: r() * E.H, r: .6 + r() * 1.6, fill: '#cfe0ff', opacity: .2 + r() * .4 }, stars));
    return function (t) {
      cl.forEach(function (c, k) { E.set(c.e, { cx: (c.x + 120 * Math.sin(t * c.w + k * 2)).toFixed(1), cy: (c.y + 80 * Math.cos(t * c.w * .8 + k)).toFixed(1) }); });
      E.set(stars, { transform: 'translate(' + (-6 * Math.sin(t * .05)).toFixed(2) + ' ' + (-4 * Math.cos(t * .04)).toFixed(2) + ')' });
      for (var i = 0; i < list.length; i += 3) list[i].setAttribute('opacity', (.25 + .2 * Math.sin(t * 1.3 + i)).toFixed(3));
    };
  }

  /* A slow, continuous camera drift over the whole scene, so nothing is ever completely still. */
  function camera(t) {
    var s = 1.015 + .01 * Math.sin(t * .07), dx = 10 * Math.sin(t * .11), dy = 7 * Math.cos(t * .09);
    return 'translate(' + (960 + dx).toFixed(2) + ' ' + (540 + dy).toFixed(2) + ') scale(' + s.toFixed(4) + ') translate(-960 -540)';
  }

  /* Smooth entrances and exits. reveal: fade and rise into place, then fade and lift away. Use on nodes that
     have no transform of their own (labels, panels, groups positioned by their children). */
  E.ease.quint = function (k) { return 1 - Math.pow(1 - k, 5); };
  E.ease.inCubic = function (k) { return k * k * k; };
  E.reveal = function (node, t, a, b, fade) {
    fade = fade || .7;
    var pin = E.at(t, a, fade, E.ease.quint), pout = b === undefined ? 0 : E.at(t, b, fade * .8, E.ease.inCubic);
    E.set(node, { opacity: (pin * (1 - pout)).toFixed(3), transform: 'translate(0 ' + ((1 - pin) * 26 - pout * 18).toFixed(2) + ')' });
    return pin * (1 - pout);
  };

  /* ---------- shared drawing helpers for the scenes ---------- */
  E.font = function (size, weight, mono) { return { 'font-family': mono ? 'Geist Mono' : 'Geist', 'font-size': size, 'font-weight': weight || 400 }; };
  E.label = function (str, x, y, size, fill, extra, parent) {
    var a = E.font(size, extra && extra.weight, extra && extra.mono); a.x = x; a.y = y; a.fill = fill || E.C.ink;
    if (extra && extra.anchor) a['text-anchor'] = extra.anchor;
    return E.text(str, a, parent);
  };
  /* Lesson number and title, top left. Returns the group; scenes fade it to 35% after the opening. */
  E.chapter = function (parent, num, title) {
    var g = E.el('g', {}, parent);
    E.label(num, 96, 118, 34, E.C.red, { mono: true }, g);
    E.label(title, 178, 118, 40, E.C.ink, { weight: 600 }, g);
    return g;
  };
  /* Flame gradients: warm (with gravity) and cool (0 g, blue shell). Call once per scene. */
  E.flameDefs = function (parent) {
    var defs = E.el('defs', {}, parent), C = E.C;
    function radial(id, stops, cy) {
      var g = E.el('radialGradient', { id: id, cx: '50%', cy: cy || '50%', r: '60%' }, defs);
      stops.forEach(function (s) { E.el('stop', { offset: s[0], 'stop-color': s[1], 'stop-opacity': s[2] === undefined ? 1 : s[2] }, g); });
    }
    radial('warm', [[0, C.cream], [.35, C.amber], [.8, C.red, .9], [1, C.red, 0]], '72%');
    radial('cool', [[0, '#ff9a3c', .55], [.55, '#ff9a3c', .18], [.8, C.blue, .95], [1, C.blue, 0]]);
    radial('haloWarm', [[0, C.amber, .5], [1, C.amber, 0]]);
    radial('haloCool', [[0, C.blue, .45], [1, C.blue, 0]]);
    return defs;
  };
  /* Flame outline: k = 0 a circle (0 g), k = 1 a teardrop stretched upward by buoyancy. wob bends the tip. */
  E.flameShape = function (k, R, cx, cy, wob) {
    var d = '';
    for (var i = 0; i <= 90; i++) {
      var a = i / 90 * 2 * Math.PI, s = Math.sin(a), up = Math.max(0, s);
      var x = cx + R * Math.cos(a) * (1 - .58 * k * up * up) + (wob || 0) * up * up * up;
      var y = cy - R * s * (s > 0 ? 1 + 2.5 * k * up : 1 - .35 * k);
      d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
    }
    return d + 'Z';
  };
  /* A two-atom molecule (O2, N2) as two touching circles. Move it with E.place. */
  E.mol = function (parent, fill, r) {
    r = r || 11; var g = E.el('g', {}, parent);
    E.el('circle', { cx: -r * .82, cy: 0, r: r, fill: fill }, g); E.el('circle', { cx: r * .82, cy: 0, r: r, fill: fill }, g);
    return g;
  };
  E.place = function (g, x, y, rot, scale, opacity) {
    E.set(g, { transform: 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') rotate(' + (rot || 0).toFixed(1) + ') scale(' + (scale === undefined ? 1 : scale) + ')',
      opacity: opacity === undefined ? 1 : opacity });
  };

  /* Register a scene. build(E, svg) creates its shapes and returns draw(t).
     opts.rows: also load NASA's test rows (data/tests.web.json) into E.rows before building. */
  E.scene = function (id, build, opts) {
    window.ready = loadTiming(id).then(function (timing) {
      E.timing = timing;
      if (opts && opts.rows) return fetch('../../../data/tests.web.json').then(function (r) { return r.json(); }).then(function (rows) { E.rows = rows; });
    }).then(function () {
      return Promise.all([document.fonts.load('400 40px Geist'), document.fonts.load('600 40px Geist'), document.fonts.load('500 40px "Geist Mono"')]);
    }).then(function () { return document.fonts.ready; }).then(function () {
      var svg = document.getElementById('stage');
      var bg = background(svg);
      var cam = E.el('g', { id: 'cam' }, svg);
      var layer = E.el('g', {}, cam);
      var draw = build(E, layer);
      // Vignette: darker corners for depth. Above the scene, below the badge.
      var vg = E.el('radialGradient', { id: 'vig', cx: '50%', cy: '50%', r: '75%' }, svg.querySelector('defs'));
      E.el('stop', { offset: '.6', 'stop-color': '#000814', 'stop-opacity': 0 }, vg);
      E.el('stop', { offset: '1', 'stop-color': '#000814', 'stop-opacity': .55 }, vg);
      E.el('rect', { width: E.W, height: E.H, fill: 'url(#vig)', 'pointer-events': 'none' }, svg);
      // NASA rule: AI-generated video carries a visible watermark. Kept small: an "AI" badge in the corner.
      var wm = E.el('g', { id: 'wm' }, svg);
      E.el('rect', { x: E.W - 92, y: E.H - 66, width: 56, height: 32, rx: 10, fill: 'none', stroke: '#ffffff', 'stroke-width': 2 }, wm);
      E.text('AI', { x: E.W - 64, y: E.H - 43, 'text-anchor': 'middle', 'font-family': 'Geist Mono', 'font-size': 18, fill: '#ffffff' }, wm);
      wm.style.opacity = '.5';
      var cap = document.getElementById('cap');
      window.seek = function (t) {
        bg(t); cam.setAttribute('transform', camera(t)); draw(t);
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
