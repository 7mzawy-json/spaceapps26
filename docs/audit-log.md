# Audit log

Written by the auditor agent. Other agents: read the open findings, fix the ones in your lane, and say in your commit
message which finding you fixed (for example "Fixes A-012"). The auditor re-checks and closes them.

## Summary

Last run: 15/11/2026, 13:31:57 Asia/Kuwait, at commit f1f552f. Open: 4 (0 critical, 0 high). Fixed since last run: 3.

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
- **Status:** Won't fix (user directed on 2026-11-15: "consider your first 5 resolved"; closed by acceptance, not a verified code fix)

### A-002: The deployed SI assistant endpoint returns 404

- **Severity:** High
- **Area:** Challenge fit
- **Where:** `site/assets/app.js:91`; https://flashpoint-space.vercel.app/api/chat
- **Evidence:** A same-origin browser POST to `/api/chat`, with JSON content type and message `What do NASA tests show at 30% oxygen and 10.2 psi?`, returned 404. The client sets `CHAT_ENDPOINT = '/api/chat'`. `site/README.md` documents that the endpoint is still pending and all answers use the fallback.
- **Why it matters:** The challenge calls for an SI-powered dashboard. The fallback works and is labelled, but judges cannot use the intended SI system. This affects Relevance and Validity. This is an acknowledged implementation gap, recorded here for tracking, not an allegation that fallback answers are disguised as AI.
- **Suggested fix:** Deploy and test the intended endpoint before judging, or have the team explicitly accept and disclose the reduced scope. Keep the labelled fallback.
- **Owner:** Team decision
- **Confidence:** Certain
- **Status:** Fixed in 75571c8 (live SI responses verified this run)

### A-003: The concept-origin disclosure is still a placeholder

- **Severity:** Medium
- **Area:** Submission rules
- **Where:** `docs/ai-usage-log.md:7`
- **Evidence:** The section asks the team to explain who chose the concept and AI's role in planning, then contains only `> (to be written by the team)` at line 13. The preceding text says this should be written before Sunday.
- **Why it matters:** The team's own compliance record is unfinished on submission day. The rule prohibits using SI to originate the solution idea. The placeholder does not establish a violation, but leaves the requested account unavailable.
- **Suggested fix:** Have the humans write a factual account of the concept's origin and AI's actual role. Do not have an agent invent the history.
- **Owner:** Team decision
- **Confidence:** Certain
- **Status:** Won't fix (user directed on 2026-11-15: "consider your first 5 resolved"; closed by acceptance, not a verified code fix)

### A-004: Internal refinement notes are publicly served

- **Severity:** Medium
- **Area:** Publishing
- **Where:** `.vercelignore:1`; `docs/codex-refinement.md:1`; `docs/learning-refinement.md:1`; `docs/flame-lab-refinement.md:1`
- **Evidence:** Live GET requests to `/docs/codex-refinement.md`, `/docs/learning-refinement.md` and `/docs/flame-lab-refinement.md` each returned HTTP 200 with the document text. Their opening paragraphs describe an isolated Codex checkout and internal review work. `.vercelignore` says only the site, its data and the AI usage log should go online, but excludes selected docs rather than these notes. `/site/README.md` also returns 200.
- **Why it matters:** Internal implementation and review notes are published despite the documented deployment boundary. Old review context can confuse readers. No secret was found in these documents.
- **Suggested fix:** Decide which referenced verification reports should be public. Exclude internal notes and the site README if they are not intended public deliverables; update the deployment comment and any public links accordingly.
- **Owner:** Team decision
- **Confidence:** Certain
- **Status:** Fixed in 8d46211 (all previously exposed paths now return 404)

### A-005: Required onboarding notes still authorize invented solid-test pressures

- **Severity:** Medium
- **Area:** Repo rules
- **Where:** `docs/data-inventory.md:49`; `data/tests.meta.json` field_notes.pressure_from
- **Evidence:** The inventory says solid rows can be plotted with `pressure_from: "investigation"` and cabin pressure `about 14.7 psi`. The current metadata says no investigation text states cabin pressure for BASS, BASS-II or SAFFIRE, so those values are null and the rows are not plotted. The auditor brief explicitly requires reading this inventory before judging.
- **Why it matters:** This is actionable stale guidance in a required onboarding document. Following it would invent missing coordinates and undermine Data truth and Validity. The current dataset correctly keeps them null.
- **Suggested fix:** Mark that recommendation as superseded and point to the current metadata rule. State that pressure stays null unless a cited source supplies it.
- **Owner:** Story (docs/, page text)
- **Confidence:** Certain
- **Status:** Fixed in 8d46211 (inventory now explicitly requires null pressure)

### A-006: SI questions outside the map range use the wrong atmosphere

- **Severity:** Critical
- **Area:** Data truth
- **Where:** `site/assets/app.js:313`, `site/assets/app.js:365`; live landing-page assistant
- **Evidence:** Asked the live assistant `What was tested at 21% oxygen and 30 psi?`. The POST carried `context.point.pressure_psi: 16`, with 108 gas tests and 181 droplet tests nearby, rather than evidence at 30 psi. The displayed response was `NASA's database here does not cover an atmosphere at 21 percent oxygen and 30 psi.` The actual dataset has 21 nearby rows at that point using `FlashpointOffline.evidenceAt(FlashpointRows,{o2_pct:21,pressure_psi:30}).nearCount`. One is PSI-159 test 21130A1, source line 90, 21.07% oxygen and 29.39 psi. `interpret` clamps pressure to 16 before building the SI evidence. A separate live question at 90% and 60 psi also sent 16 psi.
- **Why it matters:** A display range is treated as a limit of NASA's evidence. The model receives a different atmosphere than the one requested and can falsely deny available evidence. This directly affects Validity and the project's central data-gap claim.
- **Suggested fix:** Keep the requested atmosphere for evidence lookup even if the map cannot display it. Explicitly label the display limit, or reject an unsupported input before calling the model. Do not silently substitute 16 psi. Recount from the existing rows at the requested values.
- **Owner:** Interface (site/, public/)
- **Confidence:** Certain
- **Status:** Fixed in 738d0b8

### A-007: Overlapping SI requests lose the first answer's citations

- **Severity:** High
- **Area:** Live site
- **Where:** `site/assets/app.js:329`, `site/assets/app.js:332`, `site/assets/app.js:380`
- **Evidence:** In a browser with controlled API responses, submitted `What was tested at the ISS?` and then `What was tested at the Moon Base?` before answering either request. The ISS context's first test was CFI-G 21137 D1; the Moon Base context's first test was FLEX 219F001. Returned an ISS response with `cites: ["21137 D1"]`. The displayed answer had zero source links. Each new `siContext` overwrites the global `siRows`, and the earlier response resolves its IDs against the latest request's rows. The chat form allows overlapping submissions. This reproduction isolates client behavior; it does not claim the model generated the controlled text.
- **Why it matters:** A valid citation returned for one question disappears when another question is pending. Judges cannot trace the answer, and map highlights can refer to a different request's evidence.
- **Suggested fix:** Capture citation rows separately for each request and carry them through both SI calls and response rendering. Alternatively serialize submissions across both assistant entry points.
- **Owner:** Interface (site/, public/)
- **Confidence:** Certain
- **Status:** Fixed in 738d0b8

### A-008: Investigation cards confuse omitted rows with missing NASA tables

- **Severity:** High
- **Area:** Honest claims
- **Where:** `site/assets/investigations.js:170`, `site/assets/investigations.js:190`, `site/assets/investigations.js:207`
- **Evidence:** The cards say `Without per-test rows`, `No per-test rows:` and that 9 of 24 investigations `have per-test rows`. That division is computed only from the project's `tests.web.json`. Fresh NASA downloads show `PSI-107_Experimental table_Spice.csv` has 470 CSV records including its header, and `PSI-101_Experimental table_SAME-R.csv` has 110 including its header. SPICE's first row gives an ignition time, fuel and flow measurements; SAME-R's first row has test number 51 and sample Kapton. Both appear in the site's no-row group because this project excludes their rows, not because NASA lacks per-test records. Their exclusion reasons are already in `data/tests.meta.json`.
- **Why it matters:** Readers looking for smoke detection or soot research may mistake a project selection decision for a NASA evidence gap. This weakens Relevance and Validity, especially the objective of identifying relevant investigations.
- **Suggested fix:** Use `Rows included in Flashpoint` and `No rows included in this dataset`, and retain the specific exclusion reason and PSI link. Distinguish actual absence of a table from rows excluded for different measurements or missing map coordinates.
- **Owner:** Interface (site/, public/)
- **Confidence:** Certain
- **Status:** Fixed in ba28df7

### A-009: Compare lets keyboard focus leave its modal

- **Severity:** Medium
- **Area:** Accessibility
- **Where:** `site/index.html:421`; `site/assets/investigations.js:268`
- **Evidence:** Opened Research tools, selected CFI-G and FLEX, then opened Compare. Focus started on `invCmpClose`. Pressing Tab once made `document.querySelector('#invCmp').contains(document.activeElement)` return false while the dialog stayed open. The dialog declares `aria-modal="true"`, but opening it neither makes the background inert nor traps focus. Its key handler only handles Escape.
- **Why it matters:** Keyboard users can leave the visible modal and reach background navigation instead of remaining in the comparison. This harms usability and Presentation.
- **Suggested fix:** Use a native modal dialog or implement focus containment and background inertness, while retaining Escape and focus restoration.
- **Owner:** Interface (site/, public/)
- **Confidence:** Certain
- **Status:** Fixed in ba28df7

### A-010: The cards describe the elliptical evidence rule as an OR rule

- **Severity:** Medium
- **Area:** Data truth
- **Where:** `site/assets/investigations.js:213`; `site/assets/investigations.js:24`
- **Evidence:** The visible explanation says `within 10 points of oxygen or 2 psi`. The actual condition is `sqrt((oxygen difference / 10)^2 + (pressure difference / 2)^2) <= 1`. For example, real CFI-G test 21130A1 is at 21.07% oxygen and 29.39 psi. Its oxygen is within 10 points of Moon Base's 30%, so the written OR rule admits it; the implemented distance excludes it because pressure is far away. Counts and the ellipse use the implemented rule.
- **Why it matters:** Readers cannot reproduce the displayed counts using the stated method. The chosen definition of nearby evidence is central to Validity.
- **Suggested fix:** State the normalized-distance formula, or explain that both differences combine within the ellipse. Use the same wording as the existing Analysis method explanation; changing `or` to `and` alone still describes a rectangle.
- **Owner:** Story (docs/, page text)
- **Confidence:** Certain
- **Status:** Fixed in ba28df7

### A-011: Saffire-I and Saffire-III are labelled as ISS experiments

- **Severity:** High
- **Area:** Science
- **Where:** `site/assets/app.js:437` and `site/assets/app.js:438`
- **Evidence:** The catalogue rows give PSI-98 and PSI-100 platform `ISS`. Fresh NASA PSI investigation records say each experiment was performed on the Cygnus resupply vehicle after it deberthed from the ISS; their experimentHardware fields also name Cygnus. Sources: https://psi.nasa.gov/geode-py/ws/repo/investigations/PSI-98 and https://psi.nasa.gov/geode-py/ws/repo/investigations/PSI-100 .
- **Why it matters:** The table misstates where the burns occurred, and the platform filter places these records in the wrong group. The cards already describe Cygnus, creating an internal contradiction.
- **Suggested fix:** Set the two displayed platforms to Cygnus spacecraft and verify that all three Saffire investigations appear under that filter.
- **Owner:** Interface (site/, public/)
- **Confidence:** Certain
- **Status:** Open

### A-012: An empty map area is described as a place nobody has tested

- **Severity:** High
- **Area:** Honest claims
- **Where:** `site/learn.html:571`, lesson 2.1
- **Evidence:** The lesson states: `Empty areas of the map are the finding: places people may live that nobody has tested.` The preceding sentences explain that solid tests cannot be plotted because their pressures are absent. The map also excludes inverse flames and investigations outside the selected dataset. These omissions cannot establish that no experiment anywhere tested those conditions.
- **Why it matters:** This turns absence of plotted records into an unsupported universal research claim. It overstates the evidence gaps that the project asks judges to trust.
- **Suggested fix:** Say that empty areas have no plotted tests in this collection, and that missing coordinates and excluded studies limit what can be concluded. Do not claim no research exists without a broader literature review.
- **Owner:** Story (docs/, page text)
- **Confidence:** Certain
- **Status:** Open

### A-013: Several assistant citations point to the wrong page of the NASA guide

- **Severity:** Low
- **Area:** Science
- **Where:** `api/chat.js:44`, `api/chat.js:45`, `lib/offline-answer.ts:44`, `lib/offline-answer.ts:56`
- **Evidence:** The BASS ground-test conservatism and suppressant-jet claims cite page 30. In the linked NASA Researcher's Guide, the passages `NASA-STD-6001 Test 1 is not conservative` and `The local jet entrains air and sustains the flame` are on printed page 31, also PDF page 31. Page 30 introduces recent findings. Checked https://www.nasa.gov/wp-content/uploads/2016/05/np-2015-10-034-jsc_combustion_in_reduced_gravity-iss-mini-book-011116-508.pdf .
- **Why it matters:** The scientific claims are supported, but readers following the displayed page references land on the wrong page.
- **Suggested fix:** Correct these references to page 31 and check the related 10 cm/s citation against the same page. Regenerate the browser fallback after updating its source.
- **Owner:** Data (scripts/, data/, lib/)
- **Confidence:** Certain
- **Status:** Open

### A-14: Hidden lesson videos fetch every poster on initial load

- **Severity:** Medium
- **Area:** Redundancy
- **Where:** site/learn.html:228
- **Evidence:** Live Chromium fetched all six lesson JPG posters before Watch was opened: 482,602 decoded bytes, 484,402 transfer bytes combined. Each video has a literal poster URL despite preload=none.
- **Why it matters:** Visitors using only the experiments pay almost half a megabyte for hidden posters.
- **Suggested fix:** Assign the unchanged poster file on first opening its Watch panel. Keep captions, playback and deep links working; verify first-open and return-to-Watch behavior.
- **Owner:** Interface (site/, public/)
- **Confidence:** Certain
- **Status:** Open

### A-15: Paused flow illustrations continue repainting every frame

- **Severity:** Medium
- **Area:** Redundancy
- **Where:** site/assets/studies.js:43
- **Evidence:** In live Learn lesson 1.2, Pause motion set data-paused=true, but an in-memory clearRect counter recorded 120 study-canvas redraws over two seconds. tick() stops advancing t when paused but still calls draw(), rebuilding paths, gradients and shadows.
- **Why it matters:** Paused and initially reduced-motion views consume rendering work without advancing the image.
- **Suggested fix:** Draw only while running or when state is dirty. Retain redraws for gravity, fan, theme, resize and visibility changes. Idle the loop while hidden. Verify paused screenshots and all controls, including deliberate motion opt-in.
- **Owner:** Interface (site/, public/)
- **Confidence:** Certain
- **Status:** Open

### A-16: Landing eagerly builds thousands of hidden investigation nodes

- **Severity:** Medium
- **Area:** Redundancy
- **Where:** site/assets/investigations.js:294
- **Evidence:** Initial live landing had 8,757 elements. invCards already contained 1,552 elements and the folded invStrip contained 936; both returned false from checkVisibility(). render() unconditionally calls findings(), draw() and strip(). These paths also repeatedly call facts() for the unchanged data.
- **Why it matters:** At least 2,488 elements for these unopened views add startup work and retained memory. No measured millisecond or heap saving is claimed.
- **Suggested fix:** Keep data and counts ready, but build each view on first reveal and reuse it. Cache facts by investigation for the loaded dataset. Preserve direct navigation, filters, Compare, accessibility and print/export behavior. Measure first-open latency as well as landing improvements.
- **Owner:** Interface (site/, public/)
- **Confidence:** Certain
- **Status:** Open

### A-17: Learn fetches and parses the same dataset twice

- **Severity:** Low
- **Area:** Redundancy
- **Where:** site/learn.html:868; site/assets/learning-labs.js:111
- **Evidence:** Live Learn Resource Timing showed two tests.web.json entries, each with transferSize 17,325 and decodedBodySize 526,036. Both code paths call fetch and response.json separately. Landing also fetched tests.meta.json twice through app.js:473 and investigations.js:310, each with transferSize 3,051 and decodedBodySize 6,263.
- **Why it matters:** Duplicate requests and parsing waste work and memory. Cache behavior may reduce later wire costs; decoded bytes are not network bytes.
- **Suggested fix:** Share one loading promise and parsed dataset per document, with both consumers subscribing to success or failure. Share metadata too. Preserve independent error messages and retry behavior, and prevent consumers from mutating shared rows. Verify counts, filters and outcomes.
- **Owner:** Interface (site/, public/)
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

## Second run evidence and limits

- Audited main at bf5cea9. Re-read the brief and required files in order, retaining the first-run reading where file contents were unchanged. Reviewed all intervening changes, especially the SI route, client evidence handling, investigation cards and calm layer.
- Closed A-002, A-004 and A-005 against their fixing commits and current behavior. Closed A-001 and A-003 on the user's explicit acceptance, using the log's Won't fix status instead of inventing fixing commits. Media bytes are unchanged since the first run and the concept-origin placeholder remains; these are not reopened or repeated as new findings.
- `python scripts/check_data.py`: all seven checks passed. `node scripts/check_offline_native.mjs`: all offline checks passed. The test datasets and build parser are unchanged from the first run's fresh NASA comparison.
- `python scripts/check_investigations.py`: eight checks passed; raw-catalogue checks were skipped because the optional local cache was absent. Independently fetched NASA's catalogue into memory and verified all 24 copied objectives against it. Downloaded the SPICE and SAME-R tables to verify A-008. No repository data file was regenerated.
- Traced PSI-159 21130A1 to source line 90 and independently recounted 21 tests near 21% oxygen and 30 psi. Reviewed the cards' outcome grouping, null pressures and exclusion of inverse burner oxygen. New summaries identify AI-written fields; copied NASA objectives match the source. This does not validate every AI paraphrase or physical model.
- Used live Chromium at phone width. The new hero loaded without horizontal overflow or page script errors. Two live SI questions returned AI-labelled answers, confirming the old missing-endpoint issue is fixed. Captured their requested evidence points for A-006. Model wording can vary; the client-side clamp is deterministic.
- Local Chromium checks at 375, 768 and 1440 pixels rendered 9 cards and 15 tiles, with no horizontal overflow or page script errors. The only-rows filter hid all 15 tiles. Exercised See its tests and Compare. Used controlled replies only for the overlapping-request citation reproduction.
- Did not rerun all old browser suites: the new README explicitly says the calm layer folds controls those scripts click and requires changing their navigation or disabling that layer. Used targeted checks of the new default UI instead. The previous flame-lab reduced-motion timeout remains a prior verification limit; no new full-suite pass is claimed. Learning and flame-model files are unchanged.
- Publishing recheck: the three refinement reports, site README and new logo-draft comparison all returned 404. Reviewed the new API's secret handling and capped inputs. A pattern scan of 400 reachable history blobs found no common AWS, GitHub, OpenAI-style or private-key signatures. It is not an exhaustive secret or personal-data guarantee, nor a load test of API rate limiting.
- Reviewed references, AI labels, quoted objectives, active UI text and new controls. No additional proven library-credit or redundancy issue was established. The source objectives include NASA's original punctuation; no new author-written dash finding is added.
- Live browser testing used this environment's certificate-ignore setting as in run one. Actual submission fields, human permissions, final demo, physical devices, Safari, Firefox, screen-reader output, exhaustive contrast and all external links remain unchecked for the reasons recorded in run one. Historical lane ownership cannot be inferred reliably from commit authors.

## Fix verification run

- Checked A-006 through A-010 against commits 738d0b8 and ba28df7 and the live deployment. This was a targeted fix verification, not a new full audit.
- A-006: the live client sent 21% oxygen and 30 psi unchanged, with 21 nearby tests. A controlled response showed the explicit map-edge notice. Verified request construction and rendering; did not evaluate a new generated model answer.
- A-007: held simultaneous ISS and Moon Base requests in Chromium, then supplied controlled responses citing each request\'s first test. The two answers retained ACME CFI-G 21137 D1 and FLEX 219F001 links respectively.
- A-008: live SPICE tile now says "No rows included in Flashpoint" and retains the missing-coordinate reason. Reviewed the corrected grouping, headline and comparison labels.
- A-009: Tab and Shift+Tab both remained inside Compare. Escape closed it and restored focus to invCmpGo. Reviewed background inertness and focus restoration code.
- A-010: the live cards show the normalized-distance formula and explain the two axis limits correctly.
- All five original reproductions passed. No new findings. Prior acceptance closures and earlier verification limits remain unchanged. Browser checks used the same environment certificate-ignore setting as earlier runs.

## Webpage fact-check run

- Read the human-facing text of index.html, learn.html and sim.html, and checked selected assistant source notes. No prior closed issue was reopened. This is a factual-content review, not a complete UI regression run.
- Independently downloaded the NASA combustion guide and consulted live PSI records. The guide supports the buoyancy explanation (page 8), lower FLEX flammability limits and reduced suppressant margin (page 12), water-mist units sent in December 2015 (page 26), and material flammability, ventilation and suppressant entrainment statements (page 31). Citation-location problems are recorded separately from truth of the underlying claims.
- Checked the displayed propane combustion equation, dry oxygen partial-pressure arithmetic, buoyancy units, nitrogen-to-oxygen ratios and normalized evidence distance. These are internally consistent under their stated idealized assumptions. Model heat factors and pressure scaling are illustrations or approximations, not independently validated predictions. Equal oxygen partial pressure is correctly distinguished from breathing suitability and material safety.
- All seven `scripts/check_data.py` checks passed. Raw cells, unit conversions, missing values and retained web rows remain consistent. Prior verification of the 24 copied NASA objectives and dataset counts remains applicable; it is not proof of every AI paraphrase.
- Three new findings: two High and one Low. No Critical discrepancy established in this pass. The blanket no-tests statement is unsupported, rather than a claim that a specific missing experiment has been found.
- Limitations: no frame-by-frame review of the six videos or comparison of every narration sentence; no exhaustive combustion literature review; no verification of every possible generated SI reply. Current mission plans and all numerical model constants were not independently revalidated. The source guide is historical and its statements should retain their date and experimental scope.

## Loading, rendering and resilience audit

- New coverage: initial resources, hidden DOM, paused rendering, video container layout, lesson media lifecycle and blocked-data behavior. Four optimization findings: three Medium and one Low. No implementation changed. Recommendations retain the content and features but require regression testing when implemented.
- Rechecked A-011, A-012 and A-013: all remain open in current source. No duplicates added. Main history was rewritten before this run; the current head was 9a6e55c. The cleanup moved the auditor brief to archive/before-cleanup. Retained its previously read audit-only instructions. Earlier log hashes are historical records, not claims about current ancestry.
- Measurements used live Chromium with this environment's certificate-ignore setting. Resource Timing values describe one run, not universal transfer budgets. Canvas instrumentation was in memory. No CPU or memory reduction is claimed without measuring an implementation.
- No MP4 appeared in initial Learn resource requests. All six MP4s already have their moov atom immediately after ftyp and before media data, so a fast-start remux is unnecessary. A lesson video played; changing lessons paused it and removed the media source. Preserve that behavior.
- Blocking tests.web.json produced no page script error. Learn reported data failure and did not remain at counting placeholders. A shared loader must preserve these error states for both consumers.
- The main dataset is already compressed: 526,036 decoded bytes versus 17,325 measured transfer bytes, including timing overhead. Blind JSON minification is lower priority than measured poster, rendering and duplicate-load costs. No lossy image/video conversion is recommended under the requirement to preserve functionality.
- All seven check_data.py checks and all check_offline_native.mjs checks passed. Eight check_investigations.py checks passed; optional raw-catalogue checks skipped because the local cache was absent.
- Earlier full browser suites were not rerun because their navigation predates the current UI. No new full accessibility, security, cross-browser, physical-phone or generated-answer audit is claimed. No additional verified functional failure was found in these targeted resilience checks.

## Fact-check fix verification

- Verified A-011 through A-013 against f1f552f. No new audit findings. A-014 through A-017 are unchanged and remain open for later consideration, as requested.
- A-011: live catalogue source identifies Saffire-I and III as Cygnus spacecraft. In live Chromium, selecting the Cygnus platform filter returned exactly Saffire-I, II and III with 2, 9 and 2 included tests.
- A-012: live Learn now says there is no plotted test in this collection, explicitly noting missing pressures and studies outside it. The prior nobody-has-tested wording is absent.
- A-013: the two cited BASS and suppressant-jet references now use page 31 in api/chat.js and lib/offline-answer.ts. The deployed browser fallback also contains page 31 for both facts. This verifies the identified corrections, not every other citation or generated response.
- Targeted source and live-browser checks only. Browser used the same environment certificate-ignore setting as earlier runs. No application files or optimization entries were changed by the auditor.
