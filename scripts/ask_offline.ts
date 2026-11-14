// Ask the offline (rule-based) answer engine one question from the command line.
// Run: npx tsx scripts/ask_offline.ts "How does fabric burn at 30% oxygen on the Moon?"
// Written with an AI coding assistant (Claude Code); see docs/ai-usage-log.md.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { TestRow } from "../lib/evidence";
import { answerOffline } from "../lib/offline-answer";

const question = process.argv.slice(2).join(" ").trim() || "What happens at 34% oxygen and 8 psi?";
const rows: TestRow[] = JSON.parse(readFileSync(join(__dirname, "..", "data", "tests.web.json"), "utf8"));
const a = answerOffline(question, rows);

console.log(`\nQ: ${question}\n`);
for (const p of a.paragraphs) console.log(`- ${p}\n`);
console.log(`Flame: gravity=${a.flame.gravity} state=${a.flame.state} scale=${a.flame.scale}`);
console.log(`       ${a.flame.caption}`);
if (a.citations.length) console.log(`\nSources:\n${a.citations.map((c) => `  ${c.label}${c.url ? ` ${c.url}` : ""}`).join("\n")}`);
