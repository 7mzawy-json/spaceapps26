# Dashboard draft (temporary)

**Status: rough draft, nothing here is final.** Everything in this folder is open to change by anyone on the team:
edit it, replace it, or delete it. It is here so we have something concrete to react to, not a decision.

- `index.html`: a clickable mockup. No build step, not deployed. It loads `data/tests.web.json`, so open it through a local server (see "Wired to the team's failsafes" below).
- Started by AlanziM2 from a paper sketch on Sat Nov 14, built with Claude Code (AI-assisted, see
  `docs/ai-usage-log.md`). Earlier styles (blueprint, ultra-minimal, tilted 2.5D cards) were tried and dropped.
- `temp/` sits outside the lane folders on purpose. Nothing here goes into `app/` or `components/` until the team agrees.

## Rough design choices in this draft

Each line below is a suggestion to discuss, not an agreed rule.

| Area | What the draft tries | Open to change |
|---|---|---|
| Structure | The home screen is the sketch: a dashboard of four cards, **Home**, **SI Assist**, **Resources**, **Sim**, instead of a top navigation bar. | Which cards, names, order |
| Colour | NASA's palette: NASA blue `#0B3D91`, NASA red `#FC3D21` (a darker `#C8291A` where text must be readable), white and light grey. Colours only: no NASA logo or insignia, which the submission rules forbid in generated content. | Palette, how much red |
| Cards | Flat white cards with a thin border on light grey, NASA blue titles, a short red rule on the top edge, and a tinted area for each card's small animation. On hover the card lifts a little, the border turns blue and the red rule lengthens. | Everything |
| Corners | Square top-left, top-right and bottom-right; rounded bottom-left. Used on cards, panels, buttons. | Shape, radius |
| Type | Inter (sans-serif) everywhere. | Font |
| Background | Plain light grey. No grid. | Colour |
| Motion | Each card plays a short hint on hover (curve draws, chat moves a slider, catalogue scan, flame turns from sphere to candle). Clicking grows the card into its page. | Which animations, speed |

## What each page holds

Each page has its own layout and a label for what you do there.

| Page | Label | What is on it |
|---|---|---|
| Home | Explore | Draggable map of pressure against oxygen, with presets (ISS, Moon Base, spacesuit) and a gravity switch. Probe readout (oxygen, pressure, oxygen partial pressure, compared with sea level, all computed). Empty slots for the evidence rating, the five nearest tests, the evidence brief, and prevent / detect / suppress. |
| SI Assist | Ask | A chat window plus the controls it moves (oxygen, pressure, gravity, fuel type, a small map) and a list of what it changed, with undo. **The replies are scripted**: it understands simple requests such as "take me to the Moon Base" or "set oxygen to 40% at 8 psi". No AI is connected. |
| Resources | Read | Two views. **Investigations**: the 24 PSI combustion records with search, fuel and platform filters, a "with test rows" switch and sortable columns; a side panel for the selected record with a link to its PSI page and a button that opens its tests. **Test data and graphs**: every row of `data/tests.web.json` with filters, a graph builder, a relationships panel and a table (see "Resources: test data and graphs" below). |
| Sim | Experiment | Laid out around the team's prototype in `temp/flame-sim/`: chamber, experiment and test pickers, NASA's record for the test, gravity (Space, Moon, Mars, Earth), oxygen and pressure by hand, and the three notes on what is real physics, what is NASA data and what is illustration. The flame shown here is a simple stand-in animation, labelled as such, until the prototype is dropped in. |

## Numbers on the page

- Habitat points, the sea-level oxygen curve (oxygen fraction times pressure = 3.07 psi) and the 0.17 g / 0.38 g values
  come from the challenge statement and the roadmap.
- Test counts on Resources come from `data/tests.web.json`. Fuel types are filled only where we checked them; blank
  means not checked.
- Nothing else is data: tables of tests, ratings and briefs are empty slots, never invented rows.

## Things this draft does not settle

- It conflicts with the "Design rules" section and the page order in `ROADMAP.md`, and it overlaps the two proposals in
  `alanzim/`. The team decides which direction to take.
- Whether the map should be the first screen instead of the dashboard.
- How the chat should work for real (see `alanzim/chat-first-design.md`).

## Wired to the team's failsafes (Sat Nov 14, afternoon)

The draft now loads `data/tests.web.json` and the failsafes from `public/`, so it needs a local server started in the
repo root (`python -m http.server 8765`, then http://localhost:8765/temp/dashboard-draft/).

- **Explore**: test dots on the map, the evidence rating and the five nearest tests come from `lib/evidence.ts`
  (browser build in `public/offline/offline-answer.js`).
- **Ask**: every question first tries the SI chat at `/api/chat`; until that exists, or whenever it fails or takes
  longer than 8 seconds, the answer comes from the offline rule-based mode (`lib/offline-answer.ts`), labelled as such.
  Oxygen, pressure and gravity in a question are read by the same parser, which fixes "30% oxygen and 10.2 psi" being
  read as 10.2% oxygen.
- **Sim**: the stand-in canvas is replaced by the CSS backup flame (`public/flames/`), set from real test rows with the
  same rules as `temp/flame-sim/`, which it links to.

## Resources: test data and graphs (Sat Nov 14, afternoon)

Open Resources and switch the view to **Test data and graphs**. Everything on it is read from `data/tests.web.json`
in the browser; there is no library and no build step.

- **Filters** (left): search, investigation, fuel type, flame type, outcome, what the oxygen figure describes
  (chamber air or the burner stream of an inverse flame), an oxygen range, a pressure range, and "only tests with both
  oxygen and pressure". Nothing picked in a group means all values. The filters drive the graph, the relationships
  panel and the table together.
- **Graph builder**: pick the column for Across (X), the column for Up (Y) and a colour. The chart type follows the
  pairing: two measured values give points (oxygen against pressure, with the sea-level oxygen curve and the habitat
  points as reference), one measured value against "Number of tests" gives its spread, a group against "Number of
  tests" gives bars, a group against a measured value gives strips with a median line, and two groups give a grid of
  counts. Hover a mark for its tests; click it to list them in the table.
- **Relationships**: the Across column against every other column as small charts. A pairing no test records (for
  example pressure against airflow) says so instead of showing an empty chart. Click one to open it in the builder.
- **Tests table**: sortable, 25 rows a page, and each row opens to its NASA file and line, the PSI link and every
  field. Missing values read "not recorded".

Honesty notes for this view:

- Nothing is filled in. Each graph says how many matching tests it leaves out and why (no oxygen or no pressure in
  NASA's table).
- Two things are computed in the browser and labelled as computed: oxygen partial pressure (oxygen fraction times
  total pressure, only where the oxygen figure is chamber air) and the Pearson correlation shown under a points graph.
  The medians in the strip charts are also computed.
- Inverse flames report the oxygen in the burner stream, not the air around the flame. Graphs with an oxygen axis say
  how many of those they include, and the filter "Oxygen figure is for" can leave them out.
- Chart colours are three hues checked for colour-blind separation (blue `#2a78d6`, orange `#eb6834`, green
  `#1baf7a`) plus grey for "not recorded"; marks also differ by shape. Investigation is not offered as a colour
  because nine colours cannot be told apart; use it as an axis or a filter.
- Checked in headless Chromium at desktop and phone widths only.
