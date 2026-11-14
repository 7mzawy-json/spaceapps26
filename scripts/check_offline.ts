// Checks lib/evidence.ts and lib/offline-answer.ts against data/tests.web.json and prints sample answers.
// Run: npx tsx scripts/check_offline.ts   (exit code 1 if a check fails)
// Written with an AI coding assistant (Claude Code); see docs/ai-usage-log.md.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { selfCheck, type TestRow } from "../lib/evidence";
import { answerOffline, askWithFallback, parseQuestion } from "../lib/offline-answer";

const rows: TestRow[] = JSON.parse(readFileSync(join(__dirname, "..", "data", "tests.web.json"), "utf8"));
const failures: string[] = [...selfCheck()];
const expect = (ok: boolean, msg: string) => { if (!ok) failures.push(msg); };

// Parsing
const q1 = parseQuestion("How does fabric burn at 30% oxygen and 10.2 psi on the Moon?");
expect(q1.o2_pct === 30 && q1.pressure_psi === 10.2 && q1.fuel_phase === "solid" && q1.gravity === "moon", "parse: fabric, 30%, 10.2 psi, Moon");
const q2 = parseQuestion("what about 70 kPa with O2 at 34");
expect(q2.pressure_psi === 10.15 && q2.o2_pct === 34, "parse: kPa conversion and 'O2 at 34'");
const q3 = parseQuestion("Is the Moon Base air dangerous?");
expect(q3.preset === "moon" && q3.gravity === "moon", "parse: Moon Base preset");
const q4 = parseQuestion("1 atm, methanol droplet, microgravity");
expect(Math.abs((q4.pressure_psi ?? 0) - 14.7) < 0.01 && q4.fuel_phase === "liquid" && q4.gravity === "0g", "parse: atm, liquid, 0g");

// Answers never invent numbers: every test they cite must exist in the data.
const ids = new Set(rows.map((r) => `${r.accession} ${r.test_id}`));
const questions = [
  "How does fabric burn at 30% oxygen and 10.2 psi on the Moon?",
  "What happens at 34% oxygen and 8 psi?",
  "Is the Moon Base atmosphere dangerous?",
  "How do you put out a fire on the ISS?",
  "Tell me about solid fuels",
  "What would happen at 90% oxygen and 60 psi?",
  "hello",
];
for (const question of questions) {
  const a = answerOffline(question, rows, "check script");
  for (const n of a.evidence?.nearest ?? []) expect(ids.has(`${n.row.accession} ${n.row.test_id}`), `cited test exists: ${n.row.test_id}`);
  expect(a.paragraphs.length >= 2, `answer has text: ${question}`);
  const f = a.flame;
  if (f.test) expect(ids.has(`${f.test.accession} ${f.test.test_id}`), `flame test exists: ${f.test.test_id}`);
  console.log(`\nQ: ${question}\n   flame: g=${f.g} (${f.gravity}) state=${f.state} test=${f.test ? `${f.test.investigation} ${f.test.test_id}` : "none"}\n          ${f.caption}`);
  for (const p of a.paragraphs) console.log(`   - ${p}`);
}

async function checkFallback() {
// Flame hints follow the simulation's rules.
const moonFabric = answerOffline("How does fabric burn at 30% oxygen and 10.2 psi on the Moon?", rows).flame;
expect(moonFabric.g === 0.166 && moonFabric.state === "uncertain", "flame: fabric on the Moon is uncertain (no solid tests nearby), g = 0.166");
const moonAir = answerOffline("30% oxygen at 10.2 psi on the Moon", rows).flame;
expect(moonAir.g === 0.166 && moonAir.state === "burning", "flame: gravity added shows burning, as in the simulation");
const iss = answerOffline("21% oxygen at 14.7 psi in microgravity", rows).flame;
const issWant = iss.test?.ignited === false ? "no-ignition" : iss.test?.outcome === "self_extinguished" ? "goes-out" : "burning";
expect(iss.g === 0 && iss.state === issWant, "flame: at 0 g the state is the closest test's own NASA record");
expect(answerOffline("90% oxygen and 60 psi", rows).flame.state === "uncertain", "flame: a point with no nearby tests is uncertain");

// Fallback: a failing or slow endpoint must give the offline answer, quickly.
const down = await askWithFallback("30% oxygen at 10 psi", rows, { fetchImpl: async () => { throw new TypeError("fetch failed"); } });
expect(down.mode === "offline", "fallback on network error");
const err500 = await askWithFallback("30% oxygen at 10 psi", rows, { fetchImpl: async () => new Response("x", { status: 500 }) });
expect(err500.mode === "offline", "fallback on HTTP 500");
const t0 = Date.now();
const slow = await askWithFallback("30% oxygen at 10 psi", rows, {
  timeoutMs: 300,
  fetchImpl: (_u, init) => new Promise((_res, rej) => init?.signal?.addEventListener("abort", () => rej(Object.assign(new Error("aborted"), { name: "AbortError" })))),
});
expect(slow.mode === "offline" && Date.now() - t0 < 1000, "fallback on timeout within the limit");
console.log(`\nFallback reasons: ${[down, err500, slow].map((a) => (a.mode === "offline" ? a.reason : "si")).join(" | ")}`);
}

checkFallback().then(() => {

if (failures.length) {
  console.error(`\nFAILED (${failures.length}):\n - ${failures.join("\n - ")}`);
  process.exit(1);
}
console.log("\nAll offline checks passed.");
});
