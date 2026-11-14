/* GENERATED from lib/evidence.ts and lib/offline-answer.ts by esbuild (see lib/offline-browser.ts). Do not edit by hand. Written with an AI coding assistant (Claude Code); see docs/ai-usage-log.md. */
var FlashpointOffline = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // lib/offline-browser.ts
  var offline_browser_exports = {};
  __export(offline_browser_exports, {
    ANSWER_TESTS: () => ANSWER_TESTS,
    DEFAULT_PRESSURE_PSI: () => DEFAULT_PRESSURE_PSI,
    FACTS: () => FACTS,
    GRAVITY_G: () => GRAVITY_G,
    LIT_MIN_TESTS: () => LIT_MIN_TESTS,
    NEAR_DISTANCE: () => NEAR_DISTANCE,
    O2_SCALE: () => O2_SCALE,
    PRESETS: () => PRESETS,
    P_SCALE: () => P_SCALE,
    SEA_LEVEL_O2_PSI: () => SEA_LEVEL_O2_PSI,
    SI_TIMEOUT_MS: () => SI_TIMEOUT_MS,
    answerOffline: () => answerOffline,
    askWithFallback: () => askWithFallback,
    distance: () => distance,
    evidenceAt: () => evidenceAt,
    mappable: () => mappable,
    parseQuestion: () => parseQuestion,
    rate: () => rate,
    selfCheck: () => selfCheck
  });

  // lib/evidence.ts
  var O2_SCALE = 10;
  var P_SCALE = 2;
  var NEAR_DISTANCE = 1;
  var LIT_MIN_TESTS = 10;
  function distance(p, row) {
    if (row.o2_pct == null || row.pressure_psi == null) return Infinity;
    const dO2 = (p.o2_pct - row.o2_pct) / O2_SCALE;
    const dP = (p.pressure_psi - row.pressure_psi) / P_SCALE;
    return Math.sqrt(dO2 * dO2 + dP * dP);
  }
  function mappable(rows, opts = {}) {
    return rows.filter(
      (r) => r.o2_pct != null && r.pressure_psi != null && (opts.includeBurnerOxygen || r.oxygen_from !== "burner") && (!opts.fuelPhase || r.fuel_phase === opts.fuelPhase)
    );
  }
  function rate(nearCount) {
    if (nearCount >= LIT_MIN_TESTS) return "lit";
    if (nearCount >= 1) return "dim";
    return "dark";
  }
  function evidenceAt(rows, probe, opts = {}) {
    var _a;
    const k = (_a = opts.k) != null ? _a : 5;
    const scored = mappable(rows, opts).map((row) => ({ row, distance: distance(probe, row) })).sort((a, b) => a.distance - b.distance);
    const nearCount = scored.filter((n) => n.distance <= NEAR_DISTANCE).length;
    return { rating: rate(nearCount), nearCount, nearest: scored.slice(0, k) };
  }
  function selfCheck() {
    var _a;
    const base = {
      accession: "CHECK",
      fuel: null,
      fuel_phase: "gas",
      pressure_from: "test",
      flow_cm_s: null,
      gravity: "0g",
      outcome: "unknown",
      source: "selfCheck",
      oxygen_from: "chamber"
    };
    const rows = [
      { ...base, test_id: "a", o2_pct: 21, pressure_psi: 14.7 },
      { ...base, test_id: "b", o2_pct: 30, pressure_psi: 10.2 },
      { ...base, test_id: "c", o2_pct: 50, pressure_psi: 5 }
    ];
    const failures = [];
    const onTop = evidenceAt(rows, { o2_pct: 30, pressure_psi: 10.2 });
    if (((_a = onTop.nearest[0]) == null ? void 0 : _a.row.test_id) !== "b" || onTop.nearest[0].distance !== 0) {
      failures.push("a probe on top of row b should return b first at distance 0");
    }
    const far = evidenceAt(rows, { o2_pct: 95, pressure_psi: 60 });
    if (far.rating !== "dark") failures.push("a probe far from all rows should rate dark");
    return failures;
  }

  // lib/offline-answer.ts
  var PRESETS = {
    moon: { label: "Moon Base", o2_pct: 30, pressure_psi: 10.2, gravity: "moon" },
    iss: { label: "ISS", o2_pct: 21, pressure_psi: 14.7, gravity: "0g" },
    earth: { label: "Earth sea level", o2_pct: 21, pressure_psi: 14.7, gravity: "1g" },
    suit: { label: "spacesuit", o2_pct: 100, pressure_psi: 4.3, gravity: "0g" }
  };
  var SEA_LEVEL_O2_PSI = 3.07;
  var DEFAULT_PRESSURE_PSI = 14.7;
  var ANSWER_TESTS = 5;
  var GRAVITY_G = { "0g": 0, moon: 0.166, mars: 0.38, "1g": 1 };
  var SI_TIMEOUT_MS = 12e3;
  var GUIDE = "NASA, A Researcher's Guide to: Combustion Science (ISS Program, 2015)";
  var CHALLENGE = "NASA Space Apps 2026 challenge statement, Flame in Freefall";
  var GLENN = "NASA Glenn Research Center, Combustion Science page";
  var FACTS = {
    lowerLimitInMicrogravity: {
      text: "In microgravity with gentle airflow, some materials burn at lower oxygen levels than they do on Earth. The worst case is airflow near 10 cm/s, which is typical of spacecraft ventilation.",
      source: `${GUIDE}, p. 18 and 30`
    },
    groundTestNotConservative: {
      text: "Results from BASS on the ISS indicate that NASA's standard ground flammability test (NASA-STD-6001 Test 1) is not conservative for microgravity.",
      source: `${GUIDE}, p. 30`
    },
    easierIgnition: {
      text: "Materials ignite more easily in low gravity because less heat is carried away from the surface; the heat flux needed to ignite can be about half the normal-gravity value.",
      source: `${GUIDE}, p. 18 and 23`
    },
    upstreamSpread: {
      text: "At low airflow in microgravity, flames can spread upstream into the oncoming air, the opposite of what happens on Earth.",
      source: `${GUIDE}, p. 18 and 30`
    },
    localSuppressant: {
      text: "Spraying suppressant only at the flame may not put it out: the jet draws in fresh air and keeps the flame alive.",
      source: `${GUIDE}, p. 30`
    },
    inertGasMargin: {
      text: "FLEX found that flammability limits are lower in reduced gravity, so inert-gas suppressant standards written for Earth give less safety margin in space.",
      source: `${GUIDE}, p. 12 (FLEX, PSI-69)`
    },
    waterMist: {
      text: "Water-mist portable extinguishers began replacing the ISS carbon dioxide units in December 2015.",
      source: `${GUIDE}, p. 26`
    },
    smokeDetection: {
      text: "Smoke particles from fires in microgravity differ in size from those on Earth, so detectors tuned for Earth smoke look for the wrong signal. SAME and SAME-R measured smoke from spacecraft materials on the ISS.",
      source: `${GUIDE}, p. 26 and 34 (SAME, PSI-102; SAME-R, PSI-101)`
    },
    partialGravity: {
      text: "PSI holds no partial-gravity combustion data yet. Microgravity results and normal-gravity results bound what happens at Moon or Mars gravity. FM2 (Flammability of Materials on the Moon) is planned to burn materials at lunar gravity.",
      source: `${CHALLENGE}; ${GLENN}`
    },
    moonAtmosphere: {
      text: "The Moon Base and pressurized rovers are expected to use 30% oxygen or more at 10.2 psi or less, which makes materials much more flammable than in Earth's air.",
      source: CHALLENGE
    }
  };
  var FUEL_WORDS = [
    [/\b(fabric|cloth|cotton|sibal|textile|clothing|paper|plastic|pmma|acrylic|plexiglass|silicone|nomex|kapton|teflon|foam|wire insulation|insulation|wood|solid)s?\b/i, "solid"],
    [/\b(droplet|liquid|heptane|methanol|ethanol|alcohol|dodecane|decane|octane|isooctane|diesel|jet fuel|kerosene|gasoline|petrol)s?\b/i, "liquid"],
    [/\b(gas|gaseous|methane|ethane|ethylene|propane|butane|hydrogen)\b/i, "gas"]
  ];
  var TOPIC_WORDS = [
    [/\b(suppress\w*|extinguish\w*|put (it )?out|fire ?fight\w*|water ?mist|co2|carbon dioxide|halon|inert)\b/i, "suppression"],
    [/\b(detect\w*|smoke|alarm|sensor|aerosol|particle)\b/i, "detection"],
    [/\b(ignit\w*|spark|light(s|ed)? up|catch(es)? fire)\b/i, "ignition"],
    [/\b(spread\w*|propagat\w*|grow\w*)\b/i, "spread"],
    [/\b(burn\w*|flammab\w*|fire|flame\w*|combust\w*|react\w*|behav\w*|safe|danger\w*|risk\w*)\b/i, "flammability"]
  ];
  var PSI_PER = { psi: 1, psia: 1, atm: 14.696, bar: 14.504, kpa: 0.145038, mmhg: 0.019337, torr: 0.019337 };
  function parseQuestion(text) {
    var _a;
    const t = ` ${text.toLowerCase()} `;
    const q = { topics: [] };
    if (/\b(moon ?base|lunar base|pressuri[sz]ed rover|rover)\b/.test(t)) q.preset = "moon";
    else if (/\b(spacesuit|space suit|suit|eva|spacewalk)\b/.test(t)) q.preset = "suit";
    else if (/\b(iss|space station|station air)\b/.test(t)) q.preset = "iss";
    else if (/\b(sea level|earth air|normal air)\b/.test(t)) q.preset = "earth";
    const pct = (_a = t.match(/(\d+(?:\.\d+)?)\s*(?:%|percent)/)) != null ? _a : t.match(/\b(?:oxygen|o2)\s*(?:of|at|=|:|is)?\s*(\d+(?:\.\d+)?)\b(?!\s*(?:psi|atm|bar|kpa|mmhg|torr))/);
    if (pct) {
      const v = parseFloat(pct[1]);
      if (v > 0 && v <= 100) q.o2_pct = v;
    }
    const pres = t.match(/(\d+(?:\.\d+)?)\s*(psia|psi|atm|bar|kpa|mmhg|torr)\b/);
    if (pres) {
      const v = parseFloat(pres[1]) * PSI_PER[pres[2]];
      if (v > 0 && v <= 150) q.pressure_psi = Math.round(v * 100) / 100;
    }
    const flow = t.match(/(\d+(?:\.\d+)?)\s*(cm\/s|cm per second|centimet(?:er|re)s? per second)/);
    if (flow) q.flow_cm_s = parseFloat(flow[1]);
    for (const [re, phase] of FUEL_WORDS) {
      const m = t.match(re);
      if (m) {
        q.fuel_phase = phase;
        q.fuel_word = m[1];
        break;
      }
    }
    if (/\b(mars|martian)\b/.test(t)) q.gravity = "mars";
    else if (/\b(moon|lunar)\b/.test(t)) q.gravity = "moon";
    else if (/\b(earth|1 ?g|normal gravity|on the ground)\b/.test(t)) q.gravity = "1g";
    else if (/\b(microgravity|zero ?g|0 ?g|weightless\w*|free ?fall|orbit|iss|space station|spacecraft|in space)\b/.test(t)) q.gravity = "0g";
    else if (q.preset) q.gravity = PRESETS[q.preset].gravity;
    for (const [re, topic] of TOPIC_WORDS) if (re.test(t) && !q.topics.includes(topic)) q.topics.push(topic);
    return q;
  }
  var PAGE = (acc) => `https://psi.nasa.gov/physci/repo/data/investigations/${acc}`;
  function n1(x) {
    return (Math.round(x * 10) / 10).toString();
  }
  function describeOutcome(r) {
    if (r.ignited === false) return "did not ignite";
    if (r.outcome === "self_extinguished") return "went out on its own";
    if (r.outcome === "burned") {
      if (r.investigation === "FLEX") return "burned until the droplet was used up";
      if (r.investigation === "ACME CFI-G") return "kept burning until the gas flow was stopped";
      return "burned";
    }
    if (r.outcome === "suppressed") return "was put out";
    return "has no recorded outcome";
  }
  function describeFuel(r) {
    var _a;
    const fuel = ((_a = r.fuel) != null ? _a : "unnamed fuel").replace(/\s+/g, " ").trim();
    if (r.fuel_phase === "liquid") return `${fuel} droplet`;
    if (r.fuel_phase === "gas") return `${fuel} flame`;
    return fuel;
  }
  function describeTest(r, withConditions = true) {
    var _a, _b;
    const where = withConditions && r.o2_pct != null ? ` at ${n1(r.o2_pct)}% oxygen${r.pressure_psi != null ? ` and ${n1(r.pressure_psi)} psi` : ", pressure not recorded"}` : "";
    return `${(_a = r.investigation) != null ? _a : r.accession} test ${(_b = r.test_id) != null ? _b : "(no ID)"}: a ${describeFuel(r)}${where}, which ${describeOutcome(r)} [${r.accession}]`;
  }
  function countOutcomes(rows) {
    const c = { went: 0, burned: 0, none: 0, noIgnite: 0 };
    for (const r of rows) {
      if (r.ignited === false) c.noIgnite++;
      else if (r.outcome === "self_extinguished") c.went++;
      else if (r.outcome === "burned") c.burned++;
      else c.none++;
    }
    const parts = [];
    if (c.burned) parts.push(`${c.burned} kept burning`);
    if (c.went) parts.push(`${c.went} went out on ${c.went === 1 ? "its" : "their"} own`);
    if (c.noIgnite) parts.push(`${c.noIgnite} did not ignite`);
    if (c.none) parts.push(`${c.none} have no recorded outcome`);
    return parts.join(", ");
  }
  function flameFor(q, ev, near) {
    var _a, _b, _c;
    const key = (_a = q.gravity) != null ? _a : "0g";
    const g = GRAVITY_G[key];
    const gravity = { "0g": "space", moon: "moon", mars: "mars", "1g": "earth" }[key];
    const caption = (why) => `Illustration, not a physics simulation. ${why}`;
    if (!ev || !ev.nearest.length) {
      return { g, gravity, test: null, state: "uncertain", caption: caption("No oxygen and pressure to look up, so no NASA test is shown.") };
    }
    const sameFuel = q.fuel_phase ? near.find((r) => r.fuel_phase === q.fuel_phase) : void 0;
    const test = sameFuel != null ? sameFuel : ev.nearest[0].row;
    const name = `${(_b = test.investigation) != null ? _b : test.accession} test ${(_c = test.test_id) != null ? _c : ""}`.trim();
    if (ev.rating === "dark") {
      return { g, gravity, test, state: "uncertain", caption: caption(`No NASA test ran near this point. ${name} is the closest, shown faded.`) };
    }
    if (q.fuel_phase && !sameFuel) {
      return { g, gravity, test, state: "uncertain", caption: caption(`No ${q.fuel_phase}-fuel test ran near this point. ${name} burned a different fuel, shown faded.`) };
    }
    if (g > 0) {
      return { g, gravity, test, state: "burning", caption: caption(`${name}, with ${gravity} gravity added. NASA ran it at 0 g only, so with gravity the outcome is unknown and the flame is shown burning.`) };
    }
    const state = test.ignited === false ? "no-ignition" : test.outcome === "self_extinguished" ? "goes-out" : "burning";
    return { g, gravity, test, state, caption: caption(`${name}, the closest NASA test: it ${describeOutcome(test)}.`) };
  }
  var HELP = [
    "This offline mode answers from NASA's test data with fixed rules while the SI assistant is unavailable.",
    'Ask about a cabin atmosphere with an oxygen level and a pressure, a fuel type, or a gravity level. For example: "How does fabric burn at 30% oxygen and 10.2 psi on the Moon?", "What happens at 34% oxygen and 8 psi?", or "How do you put out a fire on the ISS?"'
  ];
  function answerOffline(question, rows, reason) {
    var _a;
    const q = parseQuestion(question);
    const assumptions = [];
    const citations = /* @__PURE__ */ new Map();
    const cite = (label, url) => citations.set(label, { label, url });
    const paragraphs = ["Offline answer: the SI assistant is unavailable, so this comes from fixed rules applied to NASA's test data."];
    let o2 = q.o2_pct;
    let p = q.pressure_psi;
    if (q.preset) {
      o2 != null ? o2 : o2 = PRESETS[q.preset].o2_pct;
      p != null ? p : p = PRESETS[q.preset].pressure_psi;
    }
    if (o2 != null && p == null) {
      p = DEFAULT_PRESSURE_PSI;
      assumptions.push(`no pressure was given, so ${DEFAULT_PRESSURE_PSI} psi (sea level) is assumed`);
    } else if (p != null && o2 == null) {
      o2 = Math.min(100, Math.round(SEA_LEVEL_O2_PSI / p * 1e3) / 10);
      assumptions.push(`no oxygen level was given, so ${n1(o2)}% is assumed, the level that gives the same oxygen to breathe as sea-level air`);
    }
    const probe = o2 != null && p != null ? { o2_pct: o2, pressure_psi: p } : null;
    const hasSubject = probe || q.fuel_phase || q.gravity || q.topics.some((t) => t !== "flammability");
    if (!hasSubject) {
      return { mode: "offline", reason, paragraphs: [paragraphs[0], ...HELP], query: q, probe: null, assumptions, evidence: null, citations: [], flame: flameFor(q, null, []) };
    }
    const read = [];
    if (probe) read.push(`${n1(probe.o2_pct)}% oxygen at ${n1(probe.pressure_psi)} psi${q.preset ? ` (${PRESETS[q.preset].label})` : ""}`);
    if (q.fuel_phase) read.push(!q.fuel_word || q.fuel_word === q.fuel_phase ? `${q.fuel_phase} fuel` : `${q.fuel_word} (${q.fuel_phase} fuel)`);
    if (q.gravity) read.push({ "0g": "microgravity", moon: "Moon gravity", mars: "Mars gravity", "1g": "Earth gravity" }[q.gravity]);
    if (q.flow_cm_s != null) read.push(`airflow ${n1(q.flow_cm_s)} cm/s`);
    if (read.length) paragraphs.push(`I read the question as: ${read.join(", ")}.${assumptions.length ? ` Assumed: ${assumptions.join("; ")}.` : ""}`);
    let evidence = null;
    let near = [];
    if (probe) {
      evidence = evidenceAt(rows, probe, { k: ANSWER_TESTS });
      near = evidenceAt(rows, probe, { k: Infinity }).nearest.filter((n) => n.distance <= NEAR_DISTANCE).map((n) => n.row);
      const range = `within about ${O2_SCALE * NEAR_DISTANCE} points of oxygen or ${P_SCALE * NEAR_DISTANCE} psi`;
      const ratingWords = { lit: "well covered", dim: "thinly covered", dark: "not covered" }[evidence.rating];
      paragraphs.push(`This point is ${ratingWords} by NASA's data: ${evidence.nearCount} microgravity test${evidence.nearCount === 1 ? "" : "s"} ran ${range} of it.`);
      const first = evidence.nearest[0];
      if (first) {
        paragraphs.push(`The closest match is ${describeTest(first.row)}.`);
        const rest = evidence.nearest.map((n) => n.row);
        paragraphs.push(`Of the ${rest.length} closest tests, ${countOutcomes(rest)}.`);
        if (near.length > rest.length) paragraphs.push(`Across all ${near.length} nearby tests, ${countOutcomes(near)}.`);
        for (const n of evidence.nearest) cite(`${(_a = n.row.investigation) != null ? _a : n.row.accession} (${n.row.accession})`, PAGE(n.row.accession));
      }
      if (evidence.rating === "dark") {
        paragraphs.push("Nothing in the data sits close to this point, so treat the closest match as a distant reference only. This gap is one of the places where NASA's evidence runs out.");
      }
      if (q.fuel_phase && !evidence.nearest.some((n) => n.row.fuel_phase === q.fuel_phase)) {
        const samePhase = mappable(rows, { fuelPhase: q.fuel_phase });
        if (samePhase.length) {
          const ev2 = evidenceAt(rows, probe, { k: 1, fuelPhase: q.fuel_phase });
          paragraphs.push(`None of those tests burned a ${q.fuel_phase} fuel. The closest ${q.fuel_phase}-fuel test with both oxygen and pressure is ${describeTest(ev2.nearest[0].row)}.`);
          cite(`${ev2.nearest[0].row.investigation} (${ev2.nearest[0].row.accession})`, PAGE(ev2.nearest[0].row.accession));
        } else {
          const withO2 = rows.filter((r) => r.fuel_phase === q.fuel_phase && r.o2_pct != null).sort((a, b) => Math.abs(a.o2_pct - probe.o2_pct) - Math.abs(b.o2_pct - probe.o2_pct));
          const best = withO2[0];
          paragraphs.push(`None of those tests burned a ${q.fuel_phase} material. NASA tested ${q.fuel_phase} materials only at cabin pressure, which their tables do not record${best ? `; the closest by oxygen is ${describeTest(best)}` : ""}. Solid cabin materials at this pressure are a gap in the data.`);
          if (best) cite(`${best.investigation} (${best.accession})`, PAGE(best.accession));
        }
      }
    } else if (q.fuel_phase) {
      const phaseRows = rows.filter((r) => r.fuel_phase === q.fuel_phase);
      const invs = Array.from(new Set(phaseRows.map((r) => `${r.investigation} (${r.accession})`)));
      const o2s = phaseRows.map((r) => r.o2_pct).filter((x) => x != null);
      const ps = phaseRows.map((r) => r.pressure_psi).filter((x) => x != null);
      paragraphs.push(`NASA's data has ${phaseRows.length} ${q.fuel_phase}-fuel tests, from ${invs.join(", ")}.` + (o2s.length ? ` Oxygen ranged from ${n1(Math.min(...o2s))}% to ${n1(Math.max(...o2s))}%.` : "") + (ps.length ? ` Pressure ranged from ${n1(Math.min(...ps))} to ${n1(Math.max(...ps))} psi.` : " Pressure was not recorded for them.") + " Give an oxygen level or pressure to compare a specific condition.");
      invs.forEach((label) => cite(label, PAGE(label.match(/PSI-\d+/)[0])));
    }
    if (q.flow_cm_s != null) {
      const flows = rows.filter((r) => r.flow_cm_s != null);
      paragraphs.push(`Airflow is recorded only for ${flows.length} SAFFIRE tests (${Array.from(new Set(flows.map((r) => n1(r.flow_cm_s)))).join(" and ")} cm/s), so it cannot narrow the match further.`);
    }
    const facts = [];
    if (q.gravity === "moon" || q.gravity === "mars") facts.push("partialGravity");
    if (q.preset === "moon" && !facts.includes("moonAtmosphere")) facts.push("moonAtmosphere");
    if (q.gravity === "1g") paragraphs.push("All tests in this dataset ran in microgravity, so they show how flames behave without buoyancy, not how they behave on Earth.");
    if (q.topics.includes("suppression")) facts.push("inertGasMargin", "localSuppressant", "waterMist");
    if (q.topics.includes("detection")) facts.push("smokeDetection");
    if (q.topics.includes("ignition")) facts.push("easierIgnition");
    if (q.topics.includes("spread")) facts.push("upstreamSpread");
    if (q.fuel_phase === "solid" || q.flow_cm_s != null || probe && probe.o2_pct > 21) facts.push("lowerLimitInMicrogravity", "groundTestNotConservative");
    for (const k of facts) {
      paragraphs.push(`${FACTS[k].text} (${FACTS[k].source})`);
      cite(FACTS[k].source);
    }
    paragraphs.push("This is a rule-based summary of the nearest NASA tests, not a prediction or a physics simulation.");
    return { mode: "offline", reason, paragraphs, query: q, probe, assumptions, evidence, citations: Array.from(citations.values()), flame: flameFor(q, evidence, near) };
  }
  async function askWithFallback(question, rows, opts = {}) {
    var _a, _b, _c;
    const endpoint = (_a = opts.endpoint) != null ? _a : "/api/chat";
    const timeoutMs = (_b = opts.timeoutMs) != null ? _b : SI_TIMEOUT_MS;
    const doFetch = (_c = opts.fetchImpl) != null ? _c : typeof fetch === "function" ? fetch : void 0;
    if (!doFetch) return answerOffline(question, rows, "no network access in this environment");
    if (typeof navigator !== "undefined" && navigator.onLine === false) return answerOffline(question, rows, "the browser is offline");
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await doFetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question }),
        signal: ctrl.signal
      });
      if (!res.ok) return answerOffline(question, rows, `the SI assistant replied with status ${res.status}`);
      return { mode: "si", data: await res.json() };
    } catch (err) {
      const aborted = (err == null ? void 0 : err.name) === "AbortError";
      return answerOffline(question, rows, aborted ? `no reply within ${timeoutMs / 1e3} seconds` : "the SI assistant could not be reached");
    } finally {
      clearTimeout(timer);
    }
  }
  return __toCommonJS(offline_browser_exports);
})();
