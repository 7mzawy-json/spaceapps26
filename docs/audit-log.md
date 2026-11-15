# Audit log

Written by the auditor agent. Other agents: read the open findings, fix the ones in your lane, and say in your commit
message which finding you fixed (for example "Fixes A-012"). The auditor re-checks and closes them.

## Summary

Last run: 2026-11-15 09:12 Asia/Kuwait, at commit 40bbc8c. Open: 5 (1 critical, 1 high). Fixed since last run: 0.

## Findings

### A-001: AI narration is not acknowledged in the lesson media metadata

- **Severity:** Critical
- **Area:** Submission rules
- **Where:** `site/videos/1-1.mp4` through `site/videos/1-6.mp4`; `docs/challenge/submission-and-awards.md:55`
- **Evidence:** For each of the six files, `ffprobe -v quiet -show_entries format_tags:stream_tags -of json <file>` reports only container brands and encoder, plus stream language `und`, handler names, vendor ID and video encoder. No tag acknowledges AI-generated audio. The AI usage log identifies the narration as ElevenLabs voice Daniel. The submission guide requires audio acknowledgement in descriptive text and metadata.
- **Why it matters:** The descriptive credit does not satisfy the separate metadata requirement for generated narration. This is a submission-rule gap.
- **Suggested fix:** Add an explicit AI-narration credit to the container metadata of all six MP4 files without re-recording or re-encoding their audio. Verify the resulting tags with ffprobe.
- **Owner:** Interface (site/, public/)
- **Confidence:** Certain
- **Status:** Open

### A-002: The deployed SI assistant endpoint returns 404

- **Severity:** High
- **Area:** Challenge fit
- **Where:** `site/assets/app.js:91`; https://flashpoint-space.vercel.app/api/chat
- **Evidence:** A same-origin browser POST to `/api/chat`, with JSON content type and message `What do NASA tests show at 30% oxygen and 10.2 psi?`, returned 404. The client sets `CHAT_ENDPOINT = '/api/chat'`. `site/README.md` documents that the endpoint is still pending and all answers use the fallback.
- **Why it matters:** The challenge calls for an SI-powered dashboard. The fallback works and is labelled, but judges cannot use the intended SI system. This affects Relevance and Validity. This is an acknowledged implementation gap, recorded here for tracking, not an allegation that fallback answers are disguised as AI.
- **Suggested fix:** Deploy and test the intended endpoint before judging, or have the team explicitly accept and disclose the reduced scope. Keep the labelled fallback.
- **Owner:** Team decision
- **Confidence:** Certain
- **Status:** Open

### A-003: The concept-origin disclosure is still a placeholder

- **Severity:** Medium
- **Area:** Submission rules
- **Where:** `docs/ai-usage-log.md:7`
- **Evidence:** The section asks the team to explain who chose the concept and AI's role in planning, then contains only `> (to be written by the team)` at line 13. The preceding text says this should be written before Sunday.
- **Why it matters:** The team's own compliance record is unfinished on submission day. The rule prohibits using SI to originate the solution idea. The placeholder does not establish a violation, but leaves the requested account unavailable.
- **Suggested fix:** Have the humans write a factual account of the concept's origin and AI's actual role. Do not have an agent invent the history.
- **Owner:** Team decision
- **Confidence:** Certain
- **Status:** Open

### A-004: Internal refinement notes are publicly served

- **Severity:** Medium
- **Area:** Publishing
- **Where:** `.vercelignore:1`; `docs/codex-refinement.md:1`; `docs/learning-refinement.md:1`; `docs/flame-lab-refinement.md:1`
- **Evidence:** Live GET requests to `/docs/codex-refinement.md`, `/docs/learning-refinement.md` and `/docs/flame-lab-refinement.md` each returned HTTP 200 with the document text. Their opening paragraphs describe an isolated Codex checkout and internal review work. `.vercelignore` says only the site, its data and the AI usage log should go online, but excludes selected docs rather than these notes. `/site/README.md` also returns 200.
- **Why it matters:** Internal implementation and review notes are published despite the documented deployment boundary. Old review context can confuse readers. No secret was found in these documents.
- **Suggested fix:** Decide which referenced verification reports should be public. Exclude internal notes and the site README if they are not intended public deliverables; update the deployment comment and any public links accordingly.
- **Owner:** Team decision
- **Confidence:** Certain
- **Status:** Open

### A-005: Required onboarding notes still authorize invented solid-test pressures

- **Severity:** Medium
- **Area:** Repo rules
- **Where:** `docs/data-inventory.md:49`; `data/tests.meta.json` field_notes.pressure_from
- **Evidence:** The inventory says solid rows can be plotted with `pressure_from: "investigation"` and cabin pressure `about 14.7 psi`. The current metadata says no investigation text states cabin pressure for BASS, BASS-II or SAFFIRE, so those values are null and the rows are not plotted. The auditor brief explicitly requires reading this inventory before judging.
- **Why it matters:** This is actionable stale guidance in a required onboarding document. Following it would invent missing coordinates and undermine Data truth and Validity. The current dataset correctly keeps them null.
- **Suggested fix:** Mark that recommendation as superseded and point to the current metadata rule. State that pressure stays null unless a cited source supplies it.
- **Owner:** Story (docs/, page text)
- **Confidence:** Certain
- **Status:** Open

## Run evidence and limits

First run. No earlier audit log existed, so there were no findings to close. Findings are ordered by submission priority.

- Read the required onboarding files in order. Reviewed the build parser, raw and web records, evidence logic, page code, metadata, references and deployment exclusions.
- `python scripts/check_data.py`: all seven checks passed. `python scripts/check_data.py --against-nasa`: both committed datasets also equalled a fresh NASA download.
- Traced source line 2 in FLEX, CFI, CFI-G Normal and Flame Design Normal through raw cells and web values. Examples: FLEX 20CAL08 has 757.7 mmHg, converted to 14.65 psi; CFI 1206 has 1 atm, converted to 14.7 psi; CFI-G 21088A1 has 0.9443956 bar, converted to 13.7 psi; Flame Design 19115A1 has 1.01796816 atm, converted to 14.96 psi. Conversions and two-decimal rounding agree with the parser.
- Recounted 1,276 web rows, 263 solid rows and 68 Moon Base neighbours, all droplets. Reviewed the eight exact-repeat CFI exclusions and one BASS maintenance entry. Solid pressures remain null; inverse burner oxygen is excluded from cabin evidence.
- `node scripts/check_offline_native.mjs`: all offline checks passed. This is the repository's native runner for the offline assertions; the TypeScript command was not run separately.
- Application browser suite: 50/50 passed. Google Chrome was absent, so browser launch was adapted in memory to `/usr/bin/chromium`; repository scripts were not edited. Test artifacts are ignored under `.qa/`.
- Opened the live site in Chromium at 375 pixels: no horizontal overflow and no page script errors on landing. This environment's browser rejected its certificate chain, so this smoke check used `ignore_https_errors`; that is an environment limitation, not a finding about the site's certificate. Live HTTP probes separately confirmed the endpoint and publishing findings.
- All local HTML src/href file references resolve. Reviewed focus styles, reduced-motion rules and the six English caption tracks. Browser suites cover additional keyboard, layout and interaction checks.
- Searched reachable Git history: 641 objects considered, no matches for common AWS access-key, GitHub-token, OpenAI-style key or private-key patterns. This is a limited pattern scan, not a guarantee that history contains no secrets or personal information.
- Reviewed science labels and cited explanations, including model provenance, altered gravity and missing material-pressure limits. No additional proven scientific error was established. This is not independent validation of the fluid model.
- Reviewed References against visible runtime fonts, fluid-code credits, NASA datasets and build tools. No additional proven omission was established. No NASA insignia was identified in reviewed page markup. An exhaustive copyright or frame-by-frame image audit was not performed.
- No new verified redundancy defect or human-facing dash violation was found in the reviewed active site files. Historical lane ownership could not be established reliably from commit authors alone.
- The actual Space Apps submission, human permissions and registrations, final demo duration, human concept history, Safari, Firefox, physical phones, screen-reader output, exhaustive contrast ratios and every external link were not independently checked. They require evidence or environments beyond this run.

- `check_learning.py`: all 141 checks passed with the same Chromium substitution. `check_flame_lab.py` passed through all 24 width/theme/demo layout cases, then timed out waiting for readiness when reopening with reduced motion. Later checks were not reached. An isolated reduced-motion retry also exceeded the 10-second readiness wait, but subsequent diagnostics showed `ready: true`, the expected opening title and no script errors. This establishes a timeout in this environment, not a proven functional defect; the full 99-check pass is not claimed.
- Live hashes for `site/assets/app.js`, `data/tests.web.json` and `site/videos/1-1.mp4` matched the audited checkout.
