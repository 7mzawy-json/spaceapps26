# Flashpoint site

The website itself: plain HTML, CSS and JavaScript, no build step. Everything runs in the visitor's browser, including
the flame simulation (WebGL 2, with a CSS backup flame). Open to change by the team like everything else in the repo.

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

## Files

```
index.html          the dashboard and the Map, SI Assist, Resources and Sim pages
sim.html            the flame lab; index.html loads it with ?embed (header hidden), and it also works on its own
assets/tokens.css   every colour, size and radius, light and dark (shared by both pages)
assets/site.css     styles for index.html
assets/app.js       script for index.html
```

It also reads, from outside this folder: `../data/tests.web.json` (NASA test rows), `../public/offline/offline-answer.js`
(the offline answers for SI Assist) and `../public/flames/` (the backup flame for sim.html).

## Run it

Start a web server in the **repo root** (the pages read `../data/`), then open `/site/`:

- macOS: `python3 -m http.server 8765`
- Windows (PowerShell): `python -m http.server 8765`

then http://localhost:8765/site/

## Deploy

Deploy the repo root as static files. The root `index.html` forwards visitors to `site/`. This works on Vercel, Azure
Static Web Apps or the GoDaddy/Porkbun hosting from the Space Apps global offers. The SI chat expects an endpoint at
`/api/chat`; until one exists, every question is answered by the offline rule-based mode, and the browser console shows
a failed request to `/api/chat` (expected).

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
