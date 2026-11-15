# Flashpoint site

## Accuracy pass (Sat Nov 14, night)

The dataset was rebuilt from a fresh download of NASA's 11 PSI tables and matches the earlier build row for row. The build now also keeps columns that were being dropped: the other gases in the chamber (FLEX and CFI), the burn time, NASA's own words for how a test ended, and the microgravity and 1 g burn lengths that SAFFIRE-II lists side by side. Four SAFFIRE-II silicone rows whose burn time NASA gives as "Insignificant" now read as went out instead of not recorded. `python scripts/check_data.py` re-derives every value from the raw cells.

What changed on the site because of it:

- Analysis says how many of the nearby tests ran in oxygen and nitrogen and how many had carbon dioxide or helium added. At the Moon Base point that is 21 and 47 of 68. Research tools has a filter, a table column, a graph colour and CSV columns for the same thing, and burn time can be graphed.
- The flame lab's heat against oxygen follows the adiabatic flame temperatures in NASA's CFI-G and Flame Design tables between 20% and 40% oxygen (one constant, within 1% of the temperature rise over 64 rows). Spreading of heat, motion and gases follows 1 / pressure down to the bottom of the slider; it used to stop changing below about 12 psi. The page lists what the model leaves out.
- Lesson 1.5 no longer suggests that lower pressure feeds a flame more oxygen: the gas is thinner by the same factor that diffusion is faster. Lesson 1.2 shows NASA's SAFFIRE-II burn lengths at both gravity levels.
- The landing page states four findings counted from the rows and maps the challenge's three objectives to the part of the site that answers each.

The assistant is AI first (decided Sun Nov 15): the page calls the SI assistant at `/api/chat`, and the rule-based engine is the **fallback, not the main system**. Until the team's AI endpoint is deployed, every answer comes from the fallback and is labelled as a fallback answer.

## Earlier on Sat Nov 14, evening

The Codex refinement was merged into the main site on Sat Nov 14, keeping the original headline and the original lesson videos (the synthesized soundtrack was left out because no human had listened to it). The site includes interactive science lessons, a theme-aware gravity/ventilation study and revised plain-language copy. The Learn page opens an Experiment view by default, with separate Watch lesson and Explanation tabs. Videos release resources when hidden and restore the playhead when reopened.

The flame lab now opens with a four-step demonstration: read one NASA record, add gravity at the same atmosphere, add ventilation, then illustrate a recorded extinction. Pin a model image for comparison, inspect Oxygen or Gas flow, and copy a setup link. The NASA source card preserves original conditions and outcomes while modified settings remain explicitly illustrative. Method details and less-used controls are collapsed. Analysis neighborhood drill-down and CSV export use the same metric as the evidence count.

For local review use `python scripts/preview.py` from the repo root. The standard-library server supports the byte ranges required for reliable video seeking. Open `http://127.0.0.1:8766/site/`.

Validation: 99 flame-lab checks, 141 learning/media checks and 50 application checks passed in installed Chrome, plus the existing offline-engine checks. Detailed scope and limitations are in `docs/flame-lab-refinement.md` and `docs/learning-refinement.md`. Earlier project notes follow.

The website itself: plain HTML, CSS and JavaScript, no build step. Everything runs in the visitor's browser, including
the flame simulation (WebGL 2, with a CSS backup flame). Open to change by the team like everything else in the repo.

## Earlier implementation (before Codex refinement)

Two pages and one assistant, after a redundancy pass agreed with 7mzawy-json (their notes, then an audit):

- **Analysis** replaces Map and Resources. **Simple** mode is the map and its answer for one point. **Advanced** mode is
  the catalogue of investigations and every test row (filters, graphs, table).
- **Sim** is unchanged in what it simulates, with its extras switched off (below).
- **The assistant** is one chat panel, opened with "Ask" from any page or from the box on the dashboard. It moves the
  point on the map. The SI Assist page, with its own sliders, gravity and fuel buttons and small map, is gone.

What changed, and why:

| Change | Why |
|---|---|
| Evidence is rated for gas flames, fuel droplets and solid materials separately | The single rating called the Moon Base point "Well tested". All 68 nearby tests are fuel droplets; no gas flame and no solid material was tested there |
| "Investigations ranked for this point" replaces the Prevent, Detect and Suppress boxes | The challenge asks for ranking. The boxes repeated the solid-material and FLEX facts the new rows carry, and the Detect box never changed with the point |
| Gravity buttons removed from the map | Every test ran in microgravity, so three of four options only said "No tests". One sentence under the map says it once |
| "Download these tests (CSV)" in Advanced | The challenge asks for data extraction; there was no export. Each row keeps its source file, line and PSI page |
| "See the tests around it" and "Burn this air in the Sim" | The point is now carried between the map, the test data and the Sim instead of being set again on each page |
| Free graph builder folded behind "Build your own graph" | The four named graphs answer real questions; the 440 free combinations mostly do not |
| Sim extras hidden: airflow, live measurements, heat and flow views, the 0 to 2 g slider (Ignite and Clear were hidden too, then restored at 7mzawy-json's request) | None of NASA's placeable tests records airflow, and numbers from an illustrative model read as measurements. They carry the class `cut` in `sim.html`; remove the class to bring one back |

Old links still work: `#home` opens Analysis, `#resources` opens Advanced mode, `#si` opens the assistant.

## The calm layer (Sun Nov 15)

`assets/calm.js` and `assets/calm.css` change the order and emphasis of the page without changing its content or data.
Add `?calm=0` to the address to see the page without them; removing their two lines in `index.html` undoes them.

- **Landing:** the SI assistant sits beside the headline: a question box, three starter questions, and the answer shown in
  place with its cited tests and sources. It has no assistant of its own. It sends the question through the chat panel's
  form and shows the reply that panel receives, so there is one assistant and one conversation. "See it on the map" opens
  Analysis with the chat beside it. The question box that was at the bottom of the page is hidden, since it repeats this.
- **Below it:** the three ways in, the four gaps (first sentence each, the rest behind "More"), and four folded rows: the
  small maps, the gravity illustration, the challenge answers, and where the numbers come from.
- **Analysis:** "What NASA tested near this air" is a full-width row above the map. The "Go to" row is hidden because the
  journey steps repeat it. One primary action shows; the other three are behind "More you can do with this point".
- **Known cost:** the browser checks in `scripts/` click some controls that are now inside folded rows. Run them with
  `?calm=0`, or update them to open the row first.
- An evidence meter (a pressure slider with a live count of nearby tests) stood in the hero for one commit, `fb977be`,
  and was replaced by the assistant at 7mzawy-json's request. It is in the git history if wanted.

## The SI assistant (Sun Nov 15)

The chat panel is answered by an AI model through `/api/chat` (`api/chat.js`, a Vercel serverless function).

- **Model:** Google Gemini, `gemini-3.5-flash-lite`, set in code at the top of `api/chat.js`. Flash-Lite was chosen because
  it has the largest free daily allowance. The list falls back to other models if one is missing or out of quota.
- **Key:** `GEMINI_API_KEY`, set in Vercel for Production only. It is not in the repo, and preview deployments have no key.
- **Grounding:** the page sends the question with the evidence it has already counted near the air in question. The model
  must answer from that and from a fixed block of notes, each tied to the challenge statement or a NASA page.
- **Citations:** the model returns test ids and note numbers. The route keeps only test ids that were in the evidence and
  turns note numbers into their real sources. The page links the tests to NASA PSI and rings them on the map.
- **Moving the map:** a question that means a different air moves the point there and is asked once more with that evidence.
- **If it fails** (no key, quota used up, timeout): the rule-based answer takes over and is labelled as the fallback.
- **Limits:** only this site may call the route; questions are capped at 500 characters; 12 questions a minute per visitor.
- **Privacy:** questions are sent to Google. The panel says so.

Checked on the live site with about 40 questions: atmospheres (ISS, Moon Base, rover, spacesuit, custom), safety
questions (it declines to call an air safe), gravity, history, and an attempt to make it ignore its rules.
It is a small model: it can still word something loosely, which is why every answer says to check the cited records.

## Where each part came from

| Part | Source | What changed when it moved here |
|---|---|---|
| Look, dashboard, bar, light and dark mode, Map page, SI Assist page | `temp/design-master/` | Nothing in the pages. Two style fixes (below). |
| Resources page (investigations, test data, graph builder, relationships, tests table) | `temp/dashboard-draft/` | Its colours now come from the design master tokens, so it works in dark mode. The script is unchanged. |
| Sim page | `alanzim/flame-lab/` | Now `sim.html`, in a frame on the Sim page. Fonts, colours and panels follow the site; the simulation code is unchanged. |

The three source folders are left as they were.

Two fixes made while joining them:

- The card-to-bar animation used the class `ghost`, which also matched every `btn ghost` button ("Save as PDF", "Undo
  last change", "Open on PSI") and pinned them in place, unclickable. The animation's class is now `morph`.
- The logo style (`.mark`) is limited to the header and the bar, because the Resources charts also use `mark` for their dots.

Fixes after a teammate's review (Sat Nov 14, afternoon):

- **Sim, empty space under the flame.** In `sim.html` the live measurements moved from the bottom row to under the
  chamber, and the two columns now stretch to the same height. NASA's record table takes the full width below.
- **Box sizes.** Map, SI Assist and Resources all use the same split (a wide box of 8 columns, a side column of 4), and
  the side column's last box grows so both columns end level. On the Map the evidence brief moved under the probe and
  the nearest tests take the full width. The chat takes the height of the controls beside it and scrolls inside.
- **Map legend.** The three legend marks were stretched to the full width of the panel by the rule for the map itself.
  They are 12 px again.
- **Map gravity.** Every test in the data ran in microgravity. Picking Moon, Mars or Earth now says so on the map, sets
  the evidence rating to "No tests", and labels the nearest tests as microgravity tests. Nothing is estimated.
- **SI Assist fuel and gravity.** The fuel buttons now filter the marks on the small map, and gravity shows the same
  message as on the Map. Solid fuels show no marks, with the reason: NASA's tables give those tests no pressure.
- **Resources, Colour by.** The grid of two groups (for example outcome by fuel type) ignored the colour. Each cell
  now holds a bar split by the chosen colour column.

Finishing pass (Sat Nov 14, evening): nothing on the site is a placeholder any more.

- **Evidence brief.** "Open the brief" and "Save as PDF" on the Map now work. The brief is one printable page for the
  probe's point: the reading, the evidence rating, the five nearest tests, what NASA's tests do not cover there, and the
  upcoming NASA experiments (FM2, SoFIE, FLARE) that would close the gap. It is built from the rows and fixed rules; no
  AI writes it. Printing shows only the brief.
- **Prevent, detect, suppress.** Each box now says something real about the point: the oxygen range of NASA's solid
  material tests (and whether the point is above it), what SAME and SAME-R measured, and the nearest FLEX test.
- **Resources, Selected.** Picking an investigation shows what its tests cover (oxygen and pressure ranges, fuels,
  outcomes) or, when it has none, the reason from `data/tests.meta.json`. The Credits panel lists the real credits.
- **One footer** on the dashboard and at the end of every page. The flame lab's own footer is hidden inside the site.
- **SI Assist.** Offline answers no longer repeat that they are offline, and the note under them no longer shows an HTTP code.
- **Small fixes.** A favicon; Esc no longer leaves the page while you type in a box; wide tables scroll inside their box
  on phones instead of the whole page; the relationship charts say "No tests match the filters" instead of calling an
  empty filter a gap in the data; comments in the code no longer describe the drafts.

Flame lab changes after a teammate's review (Sat Nov 14, later):

- **Replay.** A NASA test now plays once and then stays as NASA recorded it (for example FLEX test 59 goes out and
  stays out). Tick "Replay in a loop" for the old behaviour, or press Ignite to watch it once more.
- **No more relighting loop.** When the model could not hold a flame that NASA recorded as burning, the page used to
  clear the chamber and light it again, over and over. Now the model's igniter stays on and the status line says so.
- **The 0 g picture.** Painted after NASA's photographs of microgravity flames: a thin blue shell at the flame's edge
  and a warm glow inside it. Only the colours changed. The shape and size are still the model's, and the tints are an
  illustration, not a measurement.
- **Close-up.** The 0 g flame is small in the chamber, so the view zooms in on the fuel source (button "Close-up").
  With gravity or airflow the whole chamber is shown. Display only: the model is untouched.
- The CSS backup flame (`public/flames/`) still replays in a loop; it was not changed.

## Learn page (Sat Nov 14, night)

`learn.html` teaches why flames behave differently off Earth and how to read the site. Every number it shows is counted in
the browser from `../data/tests.web.json`, and the evidence formula is the site's own (`../public/offline/offline-answer.js`).
Each flame-science lesson opens with a narrated video. The videos are built outside the site, in `alanzim/learn/videos/`
(scripts, scenes, the recorded narration and the renderer; see `videos-design.md` there), and only the finished files
are copied here. The narration was recorded once with ElevenLabs; do not regenerate it (credits). AI use is logged in
`docs/ai-usage-log.md`; every video frame carries a small AI badge (NASA rule for AI-generated video).

## Investigation cards (Sun Nov 15, morning)

Analysis, Research tools, Investigations now opens on **cards**, one per PSI combustion record (24), grouped by the
hardware the tests ran on. Each card has NASA's objectives (word for word), a one-line summary written with AI from them,
a small pressure and oxygen map of where its tests ran, how many sit near the ISS and Moon Base air (the map's evidence
rule), an outcome bar and what changed between its tests. A findings strip at the top counts the main gaps from the
rows. Compare puts up to three side by side. The table is still there behind Cards / Table, and its test counts now come
from the rows. The cards are map-first: the nine investigations with rows share one scale, and a dashed ring on each map marks the Moon Base "near" zone, so the gap shows without reading. The fifteen without rows are compact tiles. The landing page shows the same nine maps as a strip ("Where NASA tested"). Data: `data/investigations.json` (built by `scripts/build_investigations.py`, checked by
`scripts/check_investigations.py`). Proposal and what differs: `docs/investigation-summaries.md`.

## Files

```
index.html          the landing page, guided Analysis, research tools and embedded flame lab
sim.html            the flame lab; index.html loads it with ?embed (header hidden), and it also works on its own
learn.html          the learners page: six interactive flame-science lessons and five site guides,
                    a formula sheet and a glossary; opened from the dashboard's Learn card and the bar
videos/            the six lesson videos (MP4, captions, posters), made by alanzim/learn/videos/render.py
assets/tokens.css   every colour, size and radius, light and dark (shared by both pages)
assets/site.css     styles for index.html
assets/app.js       script for index.html
assets/flame-lab.js the guided lab, source context, comparisons and setup links
assets/flame-lab.css presentation and responsive lab styles
```

It also reads, from outside this folder: `../data/tests.web.json` (NASA test rows), `../public/offline/offline-answer.js`
(the offline answers for SI Assist) and `../public/flames/` (the backup flame for sim.html).

## Run it

Start a web server in the **repo root** (the pages read `../data/`), then open `/site/`:

- macOS: `python3 scripts/preview.py`
- Windows (PowerShell): `python scripts/preview.py`

then http://127.0.0.1:8766/site/

## Deploy

Deploy the repo root as static files. The root `index.html` forwards visitors to `site/`.

- **Vercel:** `vercel.json` sets the output folder to the repo root. Without it Vercel would serve only `public/`, because a
  folder with that name is its default. `.vercelignore` keeps drafts, plans, personal folders, build scripts and the full
  source data off the public site. Checked on the live deployment (Sat Nov 14): the site and its data load, and the
  drafts, plans and scripts return "not found".
- **Any other static host:** upload `index.html`, `site/`, `public/`, `data/tests.web.json`, `data/tests.meta.json` and
  `docs/ai-usage-log.md`, keeping the folders as they are.
 The SI chat expects an endpoint at
`/api/chat` (the SI assistant, main system). Until it exists, the rule-based fallback answers every question, each answer
is labelled as a fallback answer, and the browser console shows a failed request to `/api/chat` (expected).

## Checked (Sat Nov 14, evening, scripted in the Claude desktop browser, Chromium)

No script errors on any page; the only console errors are the expected failed requests to `/api/chat`.

- **Navigation:** every card and every bar tab opens its page; the logo, Esc and the browser's back button return; Esc in
  a text box does nothing; a direct link such as `/site/#resources` opens that page; the root forwards to `/site/`.
- **Map:** the three presets, clicking and dragging on the map, arrow keys, all four gravity levels (rating "No tests"
  and the banner away from microgravity), the brief (open, Esc closes only the brief, print).
- **SI Assist:** the five starter questions, typed numbers, a research question, an off-topic question, an empty message
  (ignored), the sliders, gravity, the fuel buttons (marks on the small map follow), Undo from the chat and the button.
- **Resources:** search, fuel and platform filters, "only records with test rows", sorting every column, the Selected
  summary for records with and without rows, "See its tests". Test data: every filter, search, ranges, "both values",
  Clear; all 440 graph pairings (10 across, 11 up, 4 colours) with all tests, with 2 tests and with none; quick picks,
  Swap, the relationship charts, tooltips, table sorting, paging and opening a row.
- **Sim:** all four experiments, first and last test, the four gravity buttons and the slider, airflow, oxygen and
  pressure by hand ("Your experiment" appears), the four views and their legends, Ignite, Clear, Pause, the probe, the
  live measurements, NASA's record table, dark mode; `sim.html` on its own, and `sim.html?css` (backup flame).
- **Phone width (375 px):** no sideways scrolling on the dashboard, any page, or the brief.

Not checked: Safari, Firefox, a real phone, a screen reader, a printer (printing was triggered, not printed).
Known limit: the Map picks its proportions when it is first drawn, so turning a phone sideways keeps the phone layout
until the page is reloaded.
