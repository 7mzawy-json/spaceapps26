// FALLBACK, NOT THE MAIN SYSTEM. Rule-based answers for when the SI assistant is unavailable (API down, slow, out of credit).
// No network and no AI at runtime: it reads conditions out of the question with fixed patterns, finds the
// nearest NASA tests with lib/evidence.ts, and fills fixed sentence templates. Every number it states comes
// from data/tests.web.json or from a NASA document named in FACTS.
// Written with an AI coding assistant (Claude Code); see docs/ai-usage-log.md.

import { evidenceAt, mappable, NEAR_DISTANCE, O2_SCALE, P_SCALE, type Evidence, type Probe, type TestRow } from "./evidence";

// ---------- Fixed references ----------

// Habitat atmospheres, only values given in the challenge statement.
export const PRESETS = {
  moon: { label: "Moon Base", o2_pct: 30, pressure_psi: 10.2, gravity: "moon" as const },
  iss: { label: "ISS", o2_pct: 21, pressure_psi: 14.7, gravity: "0g" as const },
  earth: { label: "Earth sea level", o2_pct: 21, pressure_psi: 14.7, gravity: "1g" as const },
  suit: { label: "spacesuit", o2_pct: 100, pressure_psi: 4.3, gravity: "0g" as const },
};
export type PresetKey = keyof typeof PRESETS;

// Oxygen partial pressure of sea-level air (21% of 14.7 psi). Used to fill a missing oxygen value.
export const SEA_LEVEL_O2_PSI = 3.07;
// Pressure assumed when the question gives oxygen but no pressure.
export const DEFAULT_PRESSURE_PSI = 14.7;
// How many nearby tests an answer describes.
export const ANSWER_TESTS = 5;
// Gravity values of the flame simulation's buttons (temp/flame-sim/ (archived)), in Earth gravities.
export const GRAVITY_G = { "0g": 0, moon: 0.166, mars: 0.38, "1g": 1 } as const;
// Assume the SI chat is down after this long with no reply.
export const SI_TIMEOUT_MS = 12000;

const GUIDE = "NASA, A Researcher's Guide to: Combustion Science (ISS Program, 2015)";
const CHALLENGE = "NASA Space Apps 2026 challenge statement, Flame in Freefall";
const GLENN = "NASA Glenn Research Center, Combustion Science page";

// Fixed NASA findings the offline mode may quote. Text paraphrases the cited page; keep them in sync with
// docs/challenge/resources.md (archived).
export const FACTS = {
  lowerLimitInMicrogravity: {
    text: "In microgravity with gentle airflow, some materials burn at lower oxygen levels than they do on Earth. The worst case is airflow near 10 cm/s, which is typical of spacecraft ventilation.",
    source: `${GUIDE}, p. 18 and 30`,
  },
  groundTestNotConservative: {
    text: "Results from BASS on the ISS indicate that NASA's standard ground flammability test (NASA-STD-6001 Test 1) is not conservative for microgravity.",
    source: `${GUIDE}, p. 31`,
  },
  easierIgnition: {
    text: "Materials ignite more easily in low gravity because less heat is carried away from the surface; the heat flux needed to ignite can be about half the normal-gravity value.",
    source: `${GUIDE}, p. 18 and 23`,
  },
  upstreamSpread: {
    text: "At low airflow in microgravity, flames can spread upstream into the oncoming air, the opposite of what happens on Earth.",
    source: `${GUIDE}, p. 18 and 30`,
  },
  localSuppressant: {
    text: "Spraying suppressant only at the flame may not put it out: the jet draws in fresh air and keeps the flame alive.",
    source: `${GUIDE}, p. 31`,
  },
  inertGasMargin: {
    text: "FLEX found that flammability limits are lower in reduced gravity, so inert-gas suppressant standards written for Earth give less safety margin in space.",
    source: `${GUIDE}, p. 12 (FLEX, PSI-69)`,
  },
  waterMist: {
    text: "Water-mist portable extinguishers began replacing the ISS carbon dioxide units in December 2015.",
    source: `${GUIDE}, p. 26`,
  },
  smokeDetection: {
    text: "Smoke particles from fires in microgravity differ in size from those on Earth, so detectors tuned for Earth smoke look for the wrong signal. SAME and SAME-R measured smoke from spacecraft materials on the ISS.",
    source: `${GUIDE}, p. 26 and 34 (SAME, PSI-102; SAME-R, PSI-101)`,
  },
  partialGravity: {
    text: "PSI holds no partial-gravity combustion data yet. NASA's challenge statement says microgravity and normal-gravity results could bound what happens at Moon or Mars gravity. FM2 (Flammability of Materials on the Moon) is planned to burn materials at lunar gravity.",
    source: `${CHALLENGE}; ${GLENN}`,
  },
  moonAtmosphere: {
    text: "The Moon Base and pressurized rovers are expected to use 30% oxygen or more at 10.2 psi or less, which makes materials much more flammable than in Earth's air.",
    source: CHALLENGE,
  },
} as const;
export type FactKey = keyof typeof FACTS;

// ---------- Reading the question ----------

export type Gravity = "0g" | "moon" | "mars" | "1g";
export type Topic = "flammability" | "suppression" | "detection" | "ignition" | "spread";

export interface Query {
  o2_pct?: number;
  pressure_psi?: number;
  flow_cm_s?: number;
  fuel_phase?: "gas" | "liquid" | "solid";
  fuel_word?: string;
  gravity?: Gravity;
  preset?: PresetKey;
  topics: Topic[];
}

const FUEL_WORDS: [RegExp, "gas" | "liquid" | "solid"][] = [
  [/\b(fabric|cloth|cotton|sibal|textile|clothing|paper|plastic|pmma|acrylic|plexiglass|silicone|nomex|kapton|teflon|foam|wire insulation|insulation|wood|solid)s?\b/i, "solid"],
  [/\b(droplet|liquid|heptane|methanol|ethanol|alcohol|dodecane|decane|octane|isooctane|diesel|jet fuel|kerosene|gasoline|petrol)s?\b/i, "liquid"],
  [/\b(gas|gaseous|methane|ethane|ethylene|propane|butane|hydrogen)\b/i, "gas"],
];

const TOPIC_WORDS: [RegExp, Topic][] = [
  [/\b(suppress\w*|extinguish\w*|put (it )?out|fire ?fight\w*|water ?mist|co2|carbon dioxide|halon|inert)\b/i, "suppression"],
  [/\b(detect\w*|smoke|alarm|sensor|aerosol|particle)\b/i, "detection"],
  [/\b(ignit\w*|spark|light(s|ed)? up|catch(es)? fire)\b/i, "ignition"],
  [/\b(spread\w*|propagat\w*|grow\w*)\b/i, "spread"],
  [/\b(burn\w*|flammab\w*|fire|flame\w*|combust\w*|react\w*|behav\w*|safe|danger\w*|risk\w*)\b/i, "flammability"],
];

const PSI_PER = { psi: 1, psia: 1, atm: 14.696, bar: 14.504, kpa: 0.145038, mmhg: 0.019337, torr: 0.019337 } as const;

export function parseQuestion(text: string): Query {
  const t = ` ${text.toLowerCase()} `;
  const q: Query = { topics: [] };

  if (/\b(moon ?base|lunar base|pressuri[sz]ed rover|rover)\b/.test(t)) q.preset = "moon";
  else if (/\b(spacesuit|space suit|suit|eva|spacewalk)\b/.test(t)) q.preset = "suit";
  else if (/\b(iss|space station|station air)\b/.test(t)) q.preset = "iss";
  else if (/\b(sea level|earth air|normal air)\b/.test(t)) q.preset = "earth";

  const pct = t.match(/(\d+(?:\.\d+)?)\s*(?:%|percent)/) ?? t.match(/\b(?:oxygen|o2)\s*(?:of|at|=|:|is)?\s*(\d+(?:\.\d+)?)\b(?!\s*(?:psi|atm|bar|kpa|mmhg|torr))/);
  if (pct) {
    const v = parseFloat(pct[1]);
    if (v > 0 && v <= 100) q.o2_pct = v;
  }
  const pres = t.match(/(\d+(?:\.\d+)?)\s*(psia|psi|atm|bar|kpa|mmhg|torr)\b/);
  if (pres) {
    const v = parseFloat(pres[1]) * PSI_PER[pres[2] as keyof typeof PSI_PER];
    if (v > 0 && v <= 150) q.pressure_psi = Math.round(v * 100) / 100;
  }
  const flow = t.match(/(\d+(?:\.\d+)?)\s*(cm\/s|cm per second|centimet(?:er|re)s? per second)/);
  if (flow) q.flow_cm_s = parseFloat(flow[1]);

  for (const [re, phase] of FUEL_WORDS) {
    const m = t.match(re);
    if (m) { q.fuel_phase = phase; q.fuel_word = m[1]; break; }
  }

  if (/\b(mars|martian)\b/.test(t)) q.gravity = "mars";
  else if (/\b(moon|lunar)\b/.test(t)) q.gravity = "moon";
  else if (/\b(earth|1 ?g|normal gravity|on the ground)\b/.test(t)) q.gravity = "1g";
  else if (/\b(microgravity|zero ?g|0 ?g|weightless\w*|free ?fall|orbit|iss|space station|spacecraft|in space)\b/.test(t)) q.gravity = "0g";
  else if (q.preset) q.gravity = PRESETS[q.preset].gravity;

  for (const [re, topic] of TOPIC_WORDS) if (re.test(t) && !q.topics.includes(topic)) q.topics.push(topic);
  return q;
}

// ---------- Building the answer ----------

export type FlameState = "burning" | "goes-out" | "no-ignition" | "uncertain";

// What the flame should show for this answer: the NASA test to load and the gravity to set. Works with the
// WebGL simulation (temp/flame-sim/ (archived): pick `test`, press the gravity button `g`) and with the CSS backup
// (public/flames/flame-fallback.js: flame.set({ row: test, g, state })). Illustration, not a simulation.
export interface FlameHint {
  g: number;
  gravity: "space" | "moon" | "mars" | "earth";
  test: TestRow | null;
  state: FlameState;
  caption: string;
}

export interface Citation {
  label: string;
  url?: string;
}

export interface OfflineAnswer {
  mode: "offline";
  reason?: string;
  paragraphs: string[];
  query: Query;
  probe: Probe | null;
  assumptions: string[];
  evidence: Evidence | null;
  citations: Citation[];
  flame: FlameHint;
}

const PAGE = (acc: string) => `https://psi.nasa.gov/physci/repo/data/investigations/${acc}`;

function n1(x: number): string {
  return (Math.round(x * 10) / 10).toString();
}

function describeOutcome(r: TestRow): string {
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

function describeFuel(r: TestRow): string {
  const fuel = (r.fuel ?? "unnamed fuel").replace(/\s+/g, " ").trim();
  if (r.fuel_phase === "liquid") return `${fuel} droplet`;
  if (r.fuel_phase === "gas") return `${fuel} flame`;
  return fuel;
}

function describeTest(r: TestRow, withConditions = true): string {
  const where = withConditions && r.o2_pct != null
    ? ` at ${n1(r.o2_pct)}% oxygen${r.pressure_psi != null ? ` and ${n1(r.pressure_psi)} psi` : ", pressure not recorded"}`
    : "";
  return `${r.investigation ?? r.accession} test ${r.test_id ?? "(no ID)"}: a ${describeFuel(r)}${where}, which ${describeOutcome(r)} [${r.accession}]`;
}

function countOutcomes(rows: TestRow[]): string {
  const c = { went: 0, burned: 0, none: 0, noIgnite: 0 };
  for (const r of rows) {
    if (r.ignited === false) c.noIgnite++;
    else if (r.outcome === "self_extinguished") c.went++;
    else if (r.outcome === "burned") c.burned++;
    else c.none++;
  }
  const parts: string[] = [];
  if (c.burned) parts.push(`${c.burned} kept burning`);
  if (c.went) parts.push(`${c.went} went out on ${c.went === 1 ? "its" : "their"} own`);
  if (c.noIgnite) parts.push(`${c.noIgnite} did not ignite`);
  if (c.none) parts.push(`${c.none} have no recorded outcome`);
  return parts.join(", ");
}

function flameFor(q: Query, ev: Evidence | null, near: TestRow[]): FlameHint {
  const key = q.gravity ?? "0g";
  const g = GRAVITY_G[key];
  const gravity = ({ "0g": "space", moon: "moon", mars: "mars", "1g": "earth" } as const)[key];
  const caption = (why: string) => `Illustration, not a physics simulation. ${why}`;
  if (!ev || !ev.nearest.length) {
    return { g, gravity, test: null, state: "uncertain", caption: caption("No oxygen and pressure to look up, so no NASA test is shown.") };
  }
  // Prefer the closest nearby test of the fuel type asked about; otherwise the closest test of any fuel.
  const sameFuel = q.fuel_phase ? near.find((r) => r.fuel_phase === q.fuel_phase) : undefined;
  const test = sameFuel ?? ev.nearest[0].row;
  const name = `${test.investigation ?? test.accession} test ${test.test_id ?? ""}`.trim();
  if (ev.rating === "dark") {
    return { g, gravity, test, state: "uncertain", caption: caption(`No NASA test ran near this point. ${name} is the closest, shown faded.`) };
  }
  if (q.fuel_phase && !sameFuel) {
    return { g, gravity, test, state: "uncertain", caption: caption(`No ${q.fuel_phase}-fuel test ran near this point. ${name} burned a different fuel, shown faded.`) };
  }
  // Same rule as the simulation: only NASA's recorded outcome switches the flame off, and only at 0 g.
  if (g > 0) {
    return { g, gravity, test, state: "burning", caption: caption(`${name}, with ${gravity} gravity added. NASA ran it at 0 g only, so with gravity the outcome is unknown and the flame is shown burning.`) };
  }
  const state: FlameState = test.ignited === false ? "no-ignition" : test.outcome === "self_extinguished" ? "goes-out" : "burning";
  return { g, gravity, test, state, caption: caption(`${name}, the closest NASA test: it ${describeOutcome(test)}.`) };
}

const HELP = [
  "This rule-based fallback answers from NASA's test data with fixed rules while the SI assistant is unavailable. It is not the main system.",
  "Ask about a cabin atmosphere with an oxygen level and a pressure, a fuel type, or a gravity level. For example: \"How does fabric burn at 30% oxygen and 10.2 psi on the Moon?\", \"What happens at 34% oxygen and 8 psi?\", or \"How do you put out a fire on the ISS?\"",
];

export function answerOffline(question: string, rows: TestRow[], reason?: string): OfflineAnswer {
  const q = parseQuestion(question);
  const assumptions: string[] = [];
  const citations = new Map<string, Citation>();
  const cite = (label: string, url?: string) => citations.set(label, { label, url });
  const paragraphs: string[] = ["Fallback answer: the SI assistant is unavailable, so this rule-based fallback answers from NASA's test data."];

  // Work out the point to look at.
  let o2 = q.o2_pct;
  let p = q.pressure_psi;
  if (q.preset) {
    o2 ??= PRESETS[q.preset].o2_pct;
    p ??= PRESETS[q.preset].pressure_psi;
  }
  if (o2 != null && p == null) {
    p = DEFAULT_PRESSURE_PSI;
    assumptions.push(`no pressure was given, so ${DEFAULT_PRESSURE_PSI} psi (sea level) is assumed`);
  } else if (p != null && o2 == null) {
    o2 = Math.min(100, Math.round((SEA_LEVEL_O2_PSI / p) * 1000) / 10);
    assumptions.push(`no oxygen level was given, so ${n1(o2)}% is assumed, the level that gives the same oxygen to breathe as sea-level air`);
  }
  const probe: Probe | null = o2 != null && p != null ? { o2_pct: o2, pressure_psi: p } : null;

  const hasSubject = probe || q.fuel_phase || q.gravity || q.topics.some((t) => t !== "flammability");
  if (!hasSubject) {
    return { mode: "offline", reason, paragraphs: [paragraphs[0], ...HELP], query: q, probe: null, assumptions, evidence: null, citations: [], flame: flameFor(q, null, []) };
  }

  // Say how the question was read, so a wrong reading is easy to spot.
  const read: string[] = [];
  if (probe) read.push(`${n1(probe.o2_pct)}% oxygen at ${n1(probe.pressure_psi)} psi${q.preset ? ` (${PRESETS[q.preset].label})` : ""}`);
  if (q.fuel_phase) read.push(!q.fuel_word || q.fuel_word === q.fuel_phase ? `${q.fuel_phase} fuel` : `${q.fuel_word} (${q.fuel_phase} fuel)`);
  if (q.gravity) read.push({ "0g": "microgravity", moon: "Moon gravity", mars: "Mars gravity", "1g": "Earth gravity" }[q.gravity]);
  if (q.flow_cm_s != null) read.push(`airflow ${n1(q.flow_cm_s)} cm/s`);
  if (read.length) paragraphs.push(`I read the question as: ${read.join(", ")}.${assumptions.length ? ` Assumed: ${assumptions.join("; ")}.` : ""}`);

  let evidence: Evidence | null = null;
  let near: TestRow[] = [];
  if (probe) {
    evidence = evidenceAt(rows, probe, { k: ANSWER_TESTS });
    near = evidenceAt(rows, probe, { k: Infinity }).nearest.filter((n) => n.distance <= NEAR_DISTANCE).map((n) => n.row);
    const range = `within normalized distance ${NEAR_DISTANCE} (oxygen difference divided by ${O2_SCALE}, pressure difference divided by ${P_SCALE}, combined in quadrature)`;
    const ratingWords = { lit: "represented by nearby tests", dim: "represented by a few nearby tests", dark: "not represented by nearby tests" }[evidence.rating];
    paragraphs.push(`Across fuel types, this point is ${ratingWords}: ${evidence.nearCount} microgravity test${evidence.nearCount === 1 ? "" : "s"} ran ${range} of it.`);
    const first = evidence.nearest[0];
    if (first) {
      paragraphs.push(`The closest match is ${describeTest(first.row)}.`);
      const rest = evidence.nearest.map((n) => n.row);
      paragraphs.push(`Of the ${rest.length} closest tests, ${countOutcomes(rest)}.`);
      if (near.length > rest.length) paragraphs.push(`Across all ${near.length} nearby tests, ${countOutcomes(near)}.`);
      for (const n of evidence.nearest) cite(`${n.row.investigation ?? n.row.accession} (${n.row.accession})`, PAGE(n.row.accession));
    }
    if (evidence.rating === "dark") {
      paragraphs.push("Nothing in the data sits close to this point, so treat the closest match as a distant reference only. This gap is one of the places where NASA's evidence runs out.");
    }

    // The fuel asked about may not be among the nearest tests.
    if (q.fuel_phase && !evidence.nearest.some((n) => n.row.fuel_phase === q.fuel_phase)) {
      const samePhase = mappable(rows, { fuelPhase: q.fuel_phase });
      if (samePhase.length) {
        const ev2 = evidenceAt(rows, probe, { k: 1, fuelPhase: q.fuel_phase });
        paragraphs.push(`None of those tests burned a ${q.fuel_phase} fuel. The closest ${q.fuel_phase}-fuel test with both oxygen and pressure is ${describeTest(ev2.nearest[0].row)}.`);
        cite(`${ev2.nearest[0].row.investigation} (${ev2.nearest[0].row.accession})`, PAGE(ev2.nearest[0].row.accession));
      } else {
        const withO2 = rows.filter((r) => r.fuel_phase === q.fuel_phase && r.o2_pct != null)
          .sort((a, b) => Math.abs((a.o2_pct as number) - probe.o2_pct) - Math.abs((b.o2_pct as number) - probe.o2_pct));
        const best = withO2[0];
        paragraphs.push(`None of those tests burned a ${q.fuel_phase} material. The ${q.fuel_phase}-material tables do not record pressure${best ? `; the closest by oxygen is ${describeTest(best)}` : ""}. Solid cabin materials at this pressure are a gap in the data.`);
        if (best) cite(`${best.investigation} (${best.accession})`, PAGE(best.accession));
      }
    }
  } else if (q.fuel_phase) {
    const phaseRows = rows.filter((r) => r.fuel_phase === q.fuel_phase);
    const invs = Array.from(new Set(phaseRows.map((r) => `${r.investigation} (${r.accession})`)));
    const o2s = phaseRows.map((r) => r.o2_pct).filter((x): x is number => x != null);
    const ps = phaseRows.map((r) => r.pressure_psi).filter((x): x is number => x != null);
    paragraphs.push(`NASA's data has ${phaseRows.length} ${q.fuel_phase}-fuel tests, from ${invs.join(", ")}.` +
      (o2s.length ? ` Oxygen ranged from ${n1(Math.min(...o2s))}% to ${n1(Math.max(...o2s))}%.` : "") +
      (ps.length ? ` Pressure ranged from ${n1(Math.min(...ps))} to ${n1(Math.max(...ps))} psi.` : " Pressure was not recorded for them.") +
      " Give an oxygen level or pressure to compare a specific condition.");
    invs.forEach((label) => cite(label, PAGE(label.match(/PSI-\d+/)![0])));
  }

  // Airflow: only SAFFIRE records it.
  if (q.flow_cm_s != null) {
    const flows = rows.filter((r) => r.flow_cm_s != null);
    paragraphs.push(`Airflow is recorded only for ${flows.length} SAFFIRE tests (${Array.from(new Set(flows.map((r) => n1(r.flow_cm_s as number)))).join(" and ")} cm/s), so it cannot narrow the match further.`);
  }

  // Fixed findings that apply.
  const facts: FactKey[] = [];
  if (q.gravity === "moon" || q.gravity === "mars") facts.push("partialGravity");
  if (q.preset === "moon" && !facts.includes("moonAtmosphere")) facts.push("moonAtmosphere");
  if (q.gravity === "1g") paragraphs.push("All tests in this dataset ran in microgravity, so they show how flames behave without buoyancy, not how they behave on Earth.");
  if (q.topics.includes("suppression")) facts.push("inertGasMargin", "localSuppressant", "waterMist");
  if (q.topics.includes("detection")) facts.push("smokeDetection");
  if (q.topics.includes("ignition")) facts.push("easierIgnition");
  if (q.topics.includes("spread")) facts.push("upstreamSpread");
  if (q.fuel_phase === "solid" || q.flow_cm_s != null || (probe && probe.o2_pct > 21)) facts.push("lowerLimitInMicrogravity", "groundTestNotConservative");
  for (const k of facts) {
    paragraphs.push(`${FACTS[k].text} (${FACTS[k].source})`);
    cite(FACTS[k].source);
  }

  paragraphs.push("This is a rule-based summary of the nearest NASA tests, not a prediction or a physics simulation.");
  return { mode: "offline", reason, paragraphs, query: q, probe, assumptions, evidence, citations: Array.from(citations.values()), flame: flameFor(q, evidence, near) };
}

// ---------- Ask the SI chat, fall back to rules ----------

export type SiAnswer = { mode: "si"; data: unknown };

// Tries the SI chat endpoint. On a network error, a non-OK reply or no reply within the timeout,
// returns the offline answer instead, with the reason. The page never waits longer than timeoutMs.
export async function askWithFallback(
  question: string,
  rows: TestRow[],
  opts: { endpoint?: string; timeoutMs?: number; fetchImpl?: typeof fetch } = {},
): Promise<SiAnswer | OfflineAnswer> {
  const endpoint = opts.endpoint ?? "/api/chat";
  const timeoutMs = opts.timeoutMs ?? SI_TIMEOUT_MS;
  const doFetch = opts.fetchImpl ?? (typeof fetch === "function" ? fetch : undefined);
  if (!doFetch) return answerOffline(question, rows, "no network access in this environment");
  if (typeof navigator !== "undefined" && navigator.onLine === false) return answerOffline(question, rows, "the browser is offline");
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await doFetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ question }),
      signal: ctrl.signal,
    });
    if (!res.ok) return answerOffline(question, rows, `the SI assistant replied with status ${res.status}`);
    return { mode: "si", data: await res.json() };
  } catch (err) {
    const aborted = (err as { name?: string })?.name === "AbortError";
    return answerOffline(question, rows, aborted ? `no reply within ${timeoutMs / 1000} seconds` : "the SI assistant could not be reached");
  } finally {
    clearTimeout(timer);
  }
}
