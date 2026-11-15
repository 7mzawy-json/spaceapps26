/*
  CSS backup flame: builds the markup for flames.css and sets it from a NASA test row, using the same rules
  as the WebGL simulation in temp/flame-sim/index.html (archived) (flameParams and lit). Plain script, no build step.
  Written with an AI coding assistant (Claude Code); see docs/ai-usage-log.md.

  const flame = FlameFallback.mount(document.getElementById('box'));   // box gets a square flame
  flame.set({ row, g: 0 });                                           // a row from data/tests.web.json
  flame.set({ o2: 30, psi: 10.2, g: 0.166, jet: false });             // or a manual setting
  flame.set({ row, g: 0, state: 'uncertain' });                       // offline answer with too little evidence
  flame.pause(true);
*/
(function () {
  'use strict';
  var clamp = function (x, a, b) { return Math.min(b, Math.max(a, x)); };

  // Same inputs and the same direction of every effect as flameParams() in the simulation.
  // heat: more oxygen burns hotter, brighter and shorter. soft: lower pressure gives a wider, softer flame.
  function params(o2, psi) {
    var ox = clamp((o2 - 10) / 75, 0, 1);
    var atm = clamp(psi / 14.696, 0.3, 5);
    var diff = Math.min(0.24, 0.07 / atm);            // the simulation's diffusion, 0.014 to 0.24
    return { heat: ox, soft: clamp((diff - 0.014) / (0.24 - 0.014), 0, 1) };
  }

  function gravityName(g) {
    if (!(g > 0)) return 'space';
    if (g < 0.25) return 'moon';
    if (g < 0.7) return 'mars';
    return 'earth';
  }

  // Same as lit() and status() in the simulation: only NASA's recorded outcome switches the flame off,
  // and only at 0 g, where the test was run. With gravity added the outcome is unknown and it is shown burning.
  function stateFor(row, g) {
    if (!row || g > 0) return 'burning';
    if (row.ignited === false) return 'no-ignition';
    if (row.outcome === 'self_extinguished') return 'goes-out';
    return 'burning';
  }

  var PARTS = ['glow', 'outer', 'inner', 'core', 'base'];

  function mount(container) {
    var el = document.createElement('div');
    el.className = 'ff-flame';
    el.setAttribute('data-fill', '');
    el.setAttribute('role', 'img');
    var body = document.createElement('div'); body.className = 'ff-body';
    var motion = document.createElement('div'); motion.className = 'ff-motion';
    PARTS.forEach(function (p) { var s = document.createElement('span'); s.className = 'ff-' + p; motion.appendChild(s); });
    body.appendChild(motion);
    el.appendChild(body);
    ['fuel', 'spark', 'smoke'].forEach(function (p) { var s = document.createElement('span'); s.className = 'ff-' + p; el.appendChild(s); });
    container.appendChild(el);

    var last = '';
    return {
      el: el,
      set: function (o) {
        var row = o.row || null;
        var o2 = row ? row.o2_pct : o.o2, psi = row ? row.pressure_psi : o.psi;
        var g = o.g || 0;
        var jet = o.jet != null ? !!o.jet : !!(row && row.accession === 'PSI-159');
        var p = params(o2 == null ? 21 : o2, psi == null ? 14.7 : psi);
        var state = o.state || stateFor(row, g);
        var gname = gravityName(g);
        el.style.setProperty('--ff-heat', p.heat.toFixed(3));
        el.style.setProperty('--ff-soft', p.soft.toFixed(3));
        el.setAttribute('data-gravity', gname);
        el.setAttribute('data-source', jet ? 'jet' : 'droplet');
        el.setAttribute('data-state', state);
        el.setAttribute('aria-label', 'Backup flame: ' + gname + ' gravity, ' + state.replace('-', ' ') +
          (row ? ', NASA test ' + row.test_id : ', manual setting'));
        // A new test restarts the outcome cycle, as the simulation does when a test is picked.
        var key = (row ? row.source + ':' + row.source_line : 'manual') + '|' + state + '|' + gname;
        if (key !== last) {
          last = key;
          var parts = el.querySelectorAll('.ff-body, .ff-spark, .ff-smoke');
          for (var i = 0; i < parts.length; i++) { parts[i].style.animation = 'none'; void parts[i].offsetWidth; parts[i].style.animation = ''; }
        }
        return { state: state, gravity: gname };
      },
      pause: function (on) { el.classList.toggle('ff-paused', !!on); },
      remove: function () { el.remove(); },
    };
  }

  window.FlameFallback = { mount: mount, params: params, stateFor: stateFor, gravityName: gravityName };
})();
