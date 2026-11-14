# ROADMAP: Flashpoint

> **Read this first (Sat Nov 14, afternoon).** This is the plan written before the hackathon, and the build went a
> different way. The site is plain HTML, CSS and JavaScript in `site/` (no Next.js, no three.js view, no scroll story),
> with two pages (Analysis and Sim) and one assistant panel. `README.md` and `site/README.md` describe what exists.
> Where this file and the site disagree, the site wins; do not build from the "Fixed decisions", "File layout" or
> "Design rules" sections without checking with the team. `docs/mockup/` and `data/tests.sample.json` are deleted.

Draft 4 of 2026-11-14, before kickoff. All three NASA guides are now read: the Resources tab
(`docs/challenge/resources.md`), the Project Submission Guide (`docs/challenge/submission-and-awards.md`) and the
Judging and Awards Guide (`docs/challenge/judging.md`). Background: `docs/challenge/flame-in-freefall.md` and
`docs/challenge/research-notes.md`. Read all five before starting any phase.

**Live URL:** https://flashpoint-taupe.vercel.app

There is no team lead. The three members share responsibility, and decisions are made by the whole team.

## Decide at kickoff (Sat 09:30, before any code)

1. **Lane owners.** Put a name in each row of "Team and lanes". A person may work across lanes, but each lane needs
   one name so every folder has someone who answers for it.
2. **Chat as a main feature?** Proposal in `alanzim/chat-first-design.md`. If yes, Phase 6 moves earlier and chat
   leaves the top of the cut list.
3. **Tabs (Ask, Simulate, Compare, Explore)?** Proposal in `alanzim/tabs-dashboard-idea.md`. If yes, the page
   structure in Phase 4 and the Design rules change.
4. **Where the idea came from.** The SI rules say AI must not be used to come up with how to solve the challenge.
   Write the team's own account of how the Flashpoint idea was chosen in `docs/ai-usage-log.md`.
5. **Demo format:** 30-second video or up to 7 slides. Ask the Local Lead how the 16:00 local pitch works.

Record each answer in this file and remove the item.

## What we are building

**Flashpoint: an atmosphere trade-off map for space habitats.**

The problem: choosing a cabin atmosphere is a trade. Lower pressure makes spacewalks easier but forces
a higher oxygen percentage to keep the crew breathing, and higher oxygen makes materials more flammable.
The fire evidence for that trade is scattered across NASA's PSI database. Flashpoint puts it on the one
chart atmosphere designers already think in, and shows where the evidence runs out.

Other teams will summarize what NASA knows. We show where NASA's knowledge ends, relative to where
astronauts are about to live.

1. **The map (home screen).** X axis: total pressure (psi). Y axis: oxygen (%).
   - Each microgravity test is a small glowing flame at the conditions it ran at, coloured by outcome.
   - The sea-level-equivalent oxygen curve is drawn from physics: `o2_fraction * pressure = 3.07 psi`.
     ISS (21%, 14.7 psi) and Moon Base (30%, 10.2 psi) both sit on it, which is a built-in sanity check.
   - Habitat markers: ISS, Moon Base / rover, spacesuit, Earth. A draggable probe marks "my design".
   - Dark areas, far from any flame, are called out in words. The gap is the finding.
   - Gravity control: microgravity and normal gravity are data layers. Lunar and Martian gravity show
     "no data in PSI, bounded by the two layers", exactly as the challenge statement says.
2. **Probe panel** (updates as the probe moves):
   - Evidence count and a lit / dim / dark rating for that point.
   - Flame visual and the predictor's burn likelihood.
   - "Life of a fire" strip: prevent, detect, suppress, with the strongest investigation for each stage.
3. **Evidence brief.** One page for the probe point: what is known, what is not, the nearest tests, and
   an experiment that would close the gap using hardware that already exists (CIR/ACME, MDCA, MSG duct).
   Precomputed for the four presets, generated live for any other point. Export through the browser's print.
4. **Ask Flashpoint.** A small chat box grounded in the catalogue, citing PSI accessions. Side feature.

## Fixed decisions (do not reopen)

| Topic | Decision |
|---|---|
| Team | Three humans plus AI agents, split into three lanes (see "Team and lanes"). Inside a lane, one agent works at a time and phases stay in order. |
| Stack | Next.js (App Router, TypeScript, Tailwind) on Vercel. The map is hand-written SVG, no chart library. |
| Data prep | One-off Python scripts in `scripts/`, run with `uv run`. Output is JSON committed to `data/`. |
| Design | Final UI follows the "Design rules" section below. The mockup shows layout and behaviour only, not the final look. |
| 3D view | A second view of the same data (pressure, oxygen, airflow) built with three.js. The 2D SVG map stays the default and is built first. |
| Storage | JSON files in the repo. No database, no vector store. |
| Evidence rating | A plain distance function in TypeScript with named constants. No AI call. Explainable. |
| AI at build time | Claude extracts structured fields and writes summaries and preset briefs once. Human-checked. |
| AI at runtime | Custom-point briefs and chat only. The map must work fully with the API switched off. |
| Honesty | Every number on screen traces to a PSI accession. Missing values are `null`, never guessed. The predictor and flame visual carry an "illustrative" label. |
| Secrets | `ANTHROPIC_API_KEY` lives in `.env.local` and in Vercel env vars. Never in git. |

## File layout

```
app/page.tsx                      the map + probe panel (home)
app/investigations/[id]/page.tsx  one investigation
app/api/brief/route.ts            evidence brief for a custom point
app/api/chat/route.ts             chat endpoint
components/                       AtmosphereMap, AtmosphereVolume (3D), ProbePanel, FireLifeStrip, FlameCanvas, Brief, Chat
lib/evidence.ts                   nearest tests, rating, pillar picks + self-check
lib/predict.ts                    applies data/model.json
data/tests.sample.json            ten made-up rows for the Interface lane, deleted at the 12:30 gate
data/investigations.json          raw PSI snapshot (combustion only)
data/enriched.json                AI-extracted fields + summaries, human-checked
data/tests.json                   test-level rows, full record with NASA provenance (keep for checking)
data/tests.web.json               slim copy the website loads: same values, flagged rows left out
data/briefs.json                  precomputed briefs for the four presets
data/model.json                   fitted coefficients
scripts/fetch_psi.py  scripts/enrich.py  scripts/fit_model.py
docs/ai-usage-log.md              running log of AI use and the References list (required for submission)
README.md  .env.example           repo front page; names of the env vars (no values)
site/                             the website as static files (see site/README.md); index.html at the root forwards to it
```

`data/tests.json` row: `accession`, `test_id`, `fuel`, `fuel_phase`, `o2_pct`, `pressure_psi`,
`pressure_from` ("test" or "investigation"), `flow_cm_s`, `gravity` ("0g" or "1g"),
`outcome` ("burned", "self_extinguished", "suppressed", "unknown"), `source` (file name or URL).

## Team and lanes

Three people, three lanes. A lane owns its folders, and nobody edits another lane's files without
asking first. That one rule is what keeps three people from spending Sunday on merge conflicts.
The lane assignments below are a default. Swap names once skills are known, but keep the folder split.

| Lane | Owner | Owns | Phases |
|---|---|---|---|
| Data | (name at kickoff) | `scripts/`, `data/`, `lib/` | 0, 1, 2, 3, 5 (predictor and briefs) |
| Interface | (name at kickoff) | `app/`, `components/`, styles | 4, 6, 7 (flame visual from 5) |
| Story | (name at kickoff) | `docs/`, the About page text, pitch and submission | 8, plus the checks below |

Personal working folders (for example `alanzim/`) hold drafts and proposals. They are not deployed and belong to no lane.

- **The contract between Data and Interface** is the `data/tests.json` row shape in "File layout".
  It is frozen. Interface builds against `data/tests.sample.json` (ten made-up rows, every one marked
  `"source": "SAMPLE"`) until real rows land at the 12:30 gate, then deletes the sample file.
  A sample row must never reach the deployed site.
- **Story lane, from the first hour:** keep `docs/ai-usage-log.md`, read all of `data/enriched.json`
  and fix errors by hand (the "human-checked" step), collect NASA images with credits, take the
  questions to each mentor round, and click through the live site every two hours as a first-time user.
  On Sunday: demo script, slides or video, submission text.
- **AI labelling (submission rule):** AI-generated code and data must say so in text and metadata (a
  header line in generated files, a `generated_by` note in AI-written JSON, and the About page). Any
  AI-generated image or video needs a visible watermark. Generated content may never contain NASA logos.
- **Git:** one branch per lane (`data`, `ui`, `story`). Merge into `main` whenever a step works, at
  least every two hours. Pull `main` before starting a step. Only `main` deploys to the public URL;
  Vercel gives every branch its own preview link.
- **Sync points:** 12:30 (data gate), 15:00 (after mentor round I), 17:30, 21:30 on Saturday; 09:30 and
  12:00 (feature freeze) on Sunday. Five minutes each: what is merged, what is blocked, what gets cut.
- The times in the phases below were written for one person working in sequence. With lanes, Phase 4
  starts at 10:15 on Saturday alongside Phases 1 to 3 instead of waiting for them. Use the time this
  frees for polish, never for new features. The cut order still applies.

## Which agent does what

Default: Sonnet 5.5 at medium effort. Switch up only for the rows marked high.

| Work | Model | Effort |
|---|---|---|
| Data: Phase 2 (NASA files into `tests.json`) | Fable 5.2 | high |
| Data: Phase 5 (predictor and brief prompts) | Fable 5.2 | high |
| Data: Phases 0, 1, 3 | Sonnet 5.5 | medium |
| Interface: design foundations, hero, the map | Opus 5.5 or Fable 5.2 | high |
| Interface: everything else | Sonnet 5.5 | medium |
| Story: log, credits, checking summaries | Sonnet 5.5 | medium |
| Story: Phase 8 (pitch and submission text) | Fable 5.2 | high |

- Do not use xhigh or max effort: waiting costs more than it gains in an 18-hour event. Go from
  medium to high only after a step fails once.
- Usage limits are shared if an account is shared. Check the usage page before a long strong-model run.
- Haiku 5.5 is for quick questions only, never for project code. Codex can take any Sonnet row.
- Claude Code skills to invoke where available: **`taste-skill:gpt-tasteskill` before writing any UI
  (required by the human)**, `dataviz` before the map, `claude-api` before any script or route that
  calls Claude, `code-review` before the feature freeze, `humanizer:humanizer` on submission text.
  Agents without these skills follow the "Design rules" section below and carry on.
- Every phase ends with: run the done-check, commit, push, add one line to `docs/ai-usage-log.md`.

## Design rules

The human wants the final product to look far better than the mockup. These rules condense the
required design skill for agents that cannot load it. Where the skill and this section disagree,
this section wins, because the skill is written for marketing pages and Flashpoint is a working tool.

- **Page order:** floating navigation pill, then a hero, then the instrument (map and probe panel),
  then a short scroll story, then a footer with one strong call to action ("Open the brief").
- **Hero:** one headline of at most 2 lines in a very wide container (`max-w-6xl`), font size
  `clamp(3rem, 5vw, 5.5rem)`, two high-contrast buttons, a full-bleed NASA flame image behind a dark
  radial wash. No badges, pill tags or statistics in the hero.
- **Type:** Geist, Satoshi, Cabinet Grotesk or Outfit for everything. Never Inter. A monospace face
  only for numeric readouts.
- **Instrument layout:** the map and probe cards form one grid with `grid-auto-flow: dense`. Check the
  column and row spans add up so no cell is empty at any breakpoint. Three to five cards, not more.
- **Spacing:** large vertical gaps between page sections (`py-32 md:py-48`). Inside the instrument, stay compact.
- **Motion:** GSAP with ScrollTrigger. Cards and buttons react on hover. The scroll story pins a title
  while the map travels ISS, Moon Base, into the dark. All of it sits behind a
  `prefers-reduced-motion` check and falls back to the static end state.
- **Background:** deep radial blurs and a subtle grain, never a flat colour.
- **Images:** real NASA imagery of the experiments (public domain, credited on the About page).
  Do not use placeholder stock photo services.
- **Banned:** emojis anywhere, labels like "SECTION 01", low-contrast button text, horizontal page
  scroll (wrap the page in `<main class="overflow-x-hidden w-full">`).
- Before writing UI code, write a short design plan in the commit message or PR body: fonts chosen,
  grid spans, which two motion patterns are used.

## Friday Nov 13: preparation only

NASA's rule: no work on the challenge before the hackathon. No project code and no data ingestion today.

Status on Sat 08:30. Anything still open moves to the first ten minutes of kickoff.

- [x] Resources tab and both guides crawled into `docs/challenge/`, YouTube video watched and noted.
- [x] Roadmap updated for the guides (demo limits, AI labelling, deadlines, judging criteria).
- [ ] Anthropic API key with a small credit balance, kept out of chat and git. Put it in `.env.local` (see `.env.example`).
- [ ] Vercel access confirmed from the machine that will deploy (list teams). `uv`, `node`, `gh` run there.
- [ ] Remote Control and Chrome Remote Desktop tested from the venue network.
- [ ] Every member: GitHub access accepted, on the team page at spaceappschallenge.org for the same Local Event
      (required for Global Judging), read this file and `AGENTS.md`, `git` and `node` run on their laptop.
- [ ] Lane owners named (see "Decide at kickoff").

## Saturday Nov 14

### Phase 0: skeleton online (09:30 to 10:15)
1. Scaffold Next.js. `create-next-app .` refuses this folder because `AGENTS.md`, `ROADMAP.md` and others count as
   conflicts, so scaffold into a subfolder and move it up, keeping our `README.md` and appending to our `.gitignore`.
   PowerShell 5.1 (on macOS or Linux, do the same with `mv` and `cat >>`):
   ```
   npx create-next-app@latest scaffold --ts --tailwind --app --eslint --use-npm --yes
   Get-ChildItem scaffold -Force | Where-Object { $_.Name -notin @('.git', 'README.md', '.gitignore') } | Move-Item -Destination .
   Get-Content scaffold\.gitignore | Add-Content .gitignore
   Remove-Item scaffold -Recurse -Force
   ```
   Then `npm run dev` must show the starter page before going on.
2. Replace the home page with the project name and one sentence.
3. Create the Vercel project from the GitHub repo and deploy.

**Done when:** the public Vercel URL shows the page. Write the URL at the top of this file.

### Phase 1: catalogue snapshot (10:15 to 11:00)
1. `scripts/fetch_psi.py`: request the search endpoint in the research notes with `size=100`, then again
   with `from=100` (`page=` is ignored), until all 133 records are read. `q=` does not filter, so keep
   `Research Area == "Combustion Science"`, write `data/investigations.json`.
2. Print a table of accession, acronym and title.

**Done when:** the file has 24 records (the count seen on Nov 14, see `docs/challenge/resources.md`) and
includes BASS, BASS-II, SAFFIRE-I to III, SAME, SAME-R, FLEX, FLEX-2, CFI, ACME BRE and ACME CFI-G.
If the endpoint fails, stop and report. Do not scrape HTML.

### Phase 2: test-level data (11:00 to 12:30) [strong model]
This phase decides how good the map looks. Spend the full slot.
1. For BASS-II, BASS, SAFFIRE-I to III, ACME BRE, FLEX or CFI: open the investigation page, list its
   files, download only small tabular or text files (under 50 MB each) into `data/raw/` (gitignored).
2. Write `docs/data-inventory.md`: per investigation, what files exist, the format, and which of
   O2 %, pressure, flow speed and outcome can be read per test.
3. Build `data/tests.json` in the row format above. Fill `pressure_psi` from the test record when
   present, otherwise from the investigation's stated chamber or cabin pressure with
   `pressure_from: "investigation"`. If neither states it, leave it `null` and the row is not plotted.

**Decision gate at 12:30.**
- 60 or more plottable rows from 3 or more investigations: flames on the map, predictor goes ahead.
- Fewer: each investigation is drawn as a shaded region from its ranges in `enriched.json`, the
  predictor is dropped, and the flame visual is driven by the evidence rating. Never invent a row.

### Phase 3: AI enrichment (12:30 to 13:00, finish after the mentor round if needed)
1. `scripts/enrich.py`: for each investigation, send its PSI fields to Claude and ask for JSON:
   fuel, fuel phase, geometry, O2 range, pressure range, flow range, gravity levels, measurement types,
   fire-safety pillar (prevention, detection, suppression), hardware family, a 2-sentence plain summary,
   one sentence on Earth applications. Any field not stated in the source is `null`.
2. Write `data/enriched.json`. Human reads all of it once and fixes errors by hand.

**Done when:** every investigation has a record and no numeric range appears that is absent from its source text.

**13:00 Mentor round I.** Show the live URL, the mockup and the data inventory. Ask: is the
pressure-oxygen framing how atmosphere designers really think, and which fire question matters most to them?

### Phase 4: the map (15:00 to 17:30, mentor round II at 16:00)
0. Apply the Design rules first: fonts, colour tokens, background, navigation pill and the instrument
   grid. Every later component is built on these, so do not skip this to save time.
1. `AtmosphereMap`: SVG. Axes 0 to 16 psi and 10 to 100% O2. Draw the 3.07 psi curve. Plot `tests.json`
   rows as glowing dots coloured by outcome, filtered by the gravity control. Plot the habitat markers
   using only values from the challenge statement (spacesuit 100% at 4.3 psi, Moon Base and rover 30%
   at 10.2 psi, Earth and ISS 21% at 14.7 psi).
2. Probe: click or drag anywhere on the map. Preset buttons move it. Keyboard arrows move it too.
3. `lib/evidence.ts`: distance = `sqrt((dO2 / O2_SCALE)^2 + (dP / P_SCALE)^2)` with `O2_SCALE = 10` and
   `P_SCALE = 2` as named constants to tune against real data. Rating: lit, dim or dark by count of
   tests within distance 1. Returns the nearest 5 tests. Self-check with three synthetic rows: a probe
   on top of a row returns that row first at distance 0, and a probe far from all rows rates dark.
4. `ProbePanel`: rating in words, evidence count, nearest tests with PSI links.
5. `FireLifeStrip`: for prevent, detect and suppress, the investigation from `enriched.json` whose
   tested ranges sit closest to the probe, with one line on why.
6. Investigation detail page from `enriched.json`.

**Done when:** on the deployed site, dragging the probe changes the rating and nearest tests, the
gravity control changes the plotted flames, and the self-check passes.

### Phase 5: flame, predictor, brief (17:30 to 20:30) [strong model]
1. `FlameCanvas`: 2D canvas. Gravity sets shape and steadiness (steady blue sphere at 0 g, flickering
   yellow teardrop at 1 g), oxygen sets size and brightness, low likelihood fades it to extinction.
   Caption: "Visualization of the model output, not a physics simulation."
2. `scripts/fit_model.py` (only if the gate passed): logistic regression on `tests.json`
   (O2 %, pressure, flow when present). Write coefficients, row count and held-out accuracy to
   `data/model.json`. `lib/predict.ts` applies them. The UI shows likelihood, row count, accuracy and
   "Illustrative model fitted on N tests from <investigations>."
3. `app/api/brief/route.ts`: input is the probe point plus the nearest tests and pillar picks from
   `lib/evidence.ts`. Claude writes four short sections: known, unknown, nearest evidence, suggested
   experiment on existing hardware. It may cite only the records it was given.
4. Run the same prompt offline for the four presets and save `data/briefs.json`. Presets never call the API.
5. `Brief` component with a print stylesheet, so "Export" is the browser's print to PDF.

**Done when:** the Moon Base preset shows a visibly different flame from ISS, its brief opens instantly
with citations, and a custom point produces a brief in under 15 seconds.

### Phase 6: Ask Flashpoint (20:30 to 21:30)
1. `app/api/chat/route.ts`: system prompt holds `enriched.json` and the rule "answer only from this
   catalogue, cite accessions like [PSI-25], say when the catalogue does not cover the question."
2. On both API routes: cap output length, cap requests per visitor, reject oversized input. The URL is
   public and the key costs money.
3. `Chat` component, collapsed by default, with three starter questions.

**Done when:** "What do we know about fabric flammability at 30% oxygen?" returns a cited answer, and
an off-topic question is declined.

**Stop at 22:00.** Commit, push, sleep.

## Sunday Nov 15

### Phase 7: 3D view and polish (09:30 to 12:00)
1. **3D view (09:30 to 11:00).** Only if at least half the rows in `tests.json` have `flow_cm_s`.
   Otherwise skip to step 2 and spend the time on the hero and scroll story.
   - `AtmosphereVolume` with `three`, `@react-three/fiber` and `@react-three/drei`. Load it with
     `next/dynamic` and `ssr: false` so it never slows or breaks the 2D page.
   - Same data, same colours. X is pressure, Y is oxygen, Z is airflow speed. Flames are glowing
     points. The breathing curve becomes a translucent curtain along Z. Habitat markers and the probe
     appear as vertical lines, since a habitat spans a range of airflow.
   - A "2D / 3D" toggle above the map. Entering 3D starts from the top-down 2D framing and tilts the
     camera, so the viewer sees the flat map lift into a volume. Orbit controls after that.
   - The probe is still moved on the 2D map. In 3D an airflow slider sets its height. No 3D dragging.
   - Done when: the toggle works on the deployed site, the points match the 2D map from the top-down
     angle, and the 2D map still works on a phone with the 3D code not loaded.
2. Hero, scroll story and footer per the Design rules.
3. About page: data source, method, limits, the distance constants, image credits, and the AI usage statement.
4. Loading, empty and error states. The 2D map must be usable at phone width.
5. Run a code review and fix only real bugs.

**Feature freeze at 12:00.** After this, bug fixes and text only.

### Phase 8: pitch and submission (12:00 to 15:00) [strong model]
Rules: `docs/challenge/submission-and-awards.md`. Exceeding a demo limit removes us from Global Judging.
1. Submission demo: **a video of 30 seconds or less, or at most 7 slides** including title and intro. English
   (or English subtitles). Story: start at ISS (well lit), drag to the Moon Base (dimmer), keep going along
   the curve into the dark, end on the suggested experiment. Slides must name the team, every member and the challenge.
2. Host it on YouTube or Google Drive with a public link. Test it in a private window.
3. Local judging pitch: ask the Local Lead for its format and length; it may differ from the submission demo.
4. **13:00 Mentor round III:** full dry run. Apply only the top two pieces of feedback.
5. Make the GitHub repo public. Fill in every project page field: name, summary, demo link, final project
   link (Vercel URL and repo), detailed description, SI use, NASA data, other references (every library,
   image and dataset).
6. **Submit by 15:00.** The global form stays open until Sun 23:59, but our Local Event's schedule puts
   submission at 15:30 and judging at 16:00, so 15:30 is the deadline we work to. The form will be slow.
   Before pressing submit, check the eligibility list in `docs/challenge/judging.md`.

## If we fall behind

Cut in this order, top first. Never cut the map and probe panel.

1. Chat.
2. Live briefs for custom points (keep the four precomputed ones).
3. 3D view.
4. Scroll story (keep the hero and the instrument).
5. Fitted predictor (flame visual runs off the evidence rating, clearly labelled).
6. Investigation detail pages (link straight to PSI).

Checkpoints: map live with real data by Sat 17:30. If it is not, skip the predictor in Phase 5.
Anything unfinished at Sun 12:00 is cut, not finished.
