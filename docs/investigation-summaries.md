# Proposal: summarize the investigations as cards with a small map each

Status: **built** on Sun Nov 15 morning (Analysis, Research tools, Investigations, Cards). Written and built with Claude Code
(AI-assisted, see `docs/ai-usage-log.md`). Open to change by the team like everything else. What was built and what
differs from this proposal is listed at the end, under "As built".

## The problem

The challenge asks for a dashboard that "summarizes, ranks, and interprets" the investigations, and lists what to show
for each: objectives, fuels, test conditions such as oxygen and airflow, how tests within one investigation differed,
sensors, and similarities and differences between investigations, including hardware.

Today the site shows investigations as a sortable table (Analysis, Research tools, Investigations) with a "Selected"
panel of figures, plus the ranking for the chosen point in Explore. It answers "how many rows", but there is no picture,
no plain sentence on what each study asked, and fuels show as raw formulas ("C2H4 307, C3H8 20"). The roadmap's
Phase 3 file with per-investigation summaries (`data/enriched.json`) was never built.

## The idea in one line

One card per investigation, each with a small copy of the main pressure and oxygen map showing where its tests ran,
grouped in rows by the hardware they used. Seen together, the cards show the gap without reading anything.

## What a card shows (top to bottom)

1. **Name and accession, and a fire-safety tag**, using the challenge statement's own grouping:
   Prevent (BASS, BASS-II, SAFFIRE-I to III, ACME BRE, which the statement calls a materials flammability study),
   Detect (SAME, SAME-R, and DAFT, which shares an instrument with SAME), Suppress (FLEX),
   Combustion basics (the other ACME experiments, CFI, FLEX-2, SLICE, SPICE). The team should confirm the tags.
2. **One plain sentence on what it asked**, paraphrased from NASA's own Objectives text in the PSI catalogue.
3. **A fuel icon** (droplet, gas jet, solid sheet, smoke or dust) and **a hardware chip** (below).
4. **The small map**: same axes, sea-level oxygen curve and ISS and Moon Base markers as the main map, with this
   investigation's tests as dots. What it shows with today's data:
   - FLEX is the only investigation with tests near the Moon Base (33 tests at 8 to 12.5 psi and 24 to 40% oxygen,
     chamber oxygen only).
   - ACME CFI-G and Flame Design cover wide ranges (oxygen up to 85%, 6 to 48 psi) but miss the Moon Base box once
     inverse flames are set aside.
   - BASS-II and SAFFIRE have oxygen (13.6 to 22.2%) but no pressure in NASA's tables: draw them as a band along a
     "pressure not recorded" strip at the edge of the map, never as dots at a guessed pressure.
   - SAME, SAME-R and the others without flame tests: a plain "no flame tests" state with the reason.
5. **An outcome bar** split into kept burning, went out, did not ignite, and not recorded. Showing "not recorded" is
   part of the finding: Flame Design (327 tests), CFI (79) and BASS-II (129) record no outcome at all. Counts today:
   ACME CFI-G 88 burned, 183 went out, 62 did not ignite; FLEX 27 burned, 186 went out, 61 not recorded;
   SAFFIRE-II 5 burned, 4 went out.
6. **"What changed between tests" chips**, worked out in the browser from the rows: oxygen, pressure, added carbon
   dioxide or helium (FLEX and CFI), fuel (BASS-II has 51 different samples), airflow (SAFFIRE, 20 or 30 cm/s), and a
   gravity comparison (SAFFIRE-II lists burn lengths at 0 g and 1 g).

## Layout

- **Rows by hardware family**, as the challenge lists them. Tests on the same hardware are the most comparable, so
  this layout answers "similarities and differences":
  - Combustion Integrated Rack with the ACME kit: Flame Design, CFI-G, BRE, CLD Flame, E-FIELD Flames, s-Flame.
  - Combustion Integrated Rack with the droplet apparatus (MDCA): FLEX, FLEX-2, CFI.
  - Microgravity Science Glovebox with the SPICE flow duct: BASS, BASS-II, SPICE, SLICE.
  - SAFFIRE large-sample burns: SAFFIRE-I, II, III.
  - Smoke and dust instruments: SAME, SAME-R, DAFT.
  - Ground and analysis studies: PSI-60, 62, 115, 117, 142.
- Investigations with no usable per-test rows (15 of 24) get a small grey card or chip with the reason from
  `data/tests.meta.json`, so the list stays complete without the empty ones taking space.
- Keep the current table behind a **Cards / Table** switch, for sorting and searching.
- **Compare**: tick two or three cards to see them side by side, maps on the same scale.
- **Landing page**: the row of small maps works as the hero graphic ("Nine investigations with test rows, one
  near the Moon Base").

## Data it needs

Almost everything is computed in the browser from `data/tests.web.json`: the dots, the outcome bar, the chips, the
counts. Only one small new file is needed:

`data/investigations.json`, one entry per PSI record (24):
`accession`, `short_name`, `stage` (prevent, detect, suppress, basics), `hardware_family`, `fuel_form`,
`summary` (one sentence), `measured` (what the sensors recorded, if stated), `psi_url`, `generated_by`.

- Source: the PSI catalogue endpoint already used for the data
  (`https://psi.nasa.gov/geode-py/ws/repo/search?q=&data_source=psi&data_type=investigation&size=100`, then
  `&from=100`): fields Objectives, Experiment Hardware, Keywords.
- `summary` and `measured` would be AI-written from NASA's text, so the file marks them as AI-generated
  (submission rule) and a person on the team reads all 24 before submission. Hardware family and stage come from the
  challenge statement, not from AI.

## Effort

- `data/investigations.json` from the catalogue, plus a human read: about 40 minutes.
- Cards, small maps (reusing the site's map scales) and outcome bars: 60 to 90 minutes.
- Chips and Compare: about 30 minutes each.
- Checks (the existing scripted browser checks, plus phone width and dark mode): about 20 minutes.

If time runs short, drop Compare first, then the chips. The small maps and outcome bars carry most of the value.

## Open questions for the team

1. Confirm the fire-safety tags, especially for the ACME experiments and FLEX-2.
2. Cards as the default view, or keep the table first?
3. Use the strip of small maps on the landing page?

## As built (Sun Nov 15)

- **Data:** `scripts/fetch_psi.py` reads NASA's catalogue (all 24 combustion records); `scripts/build_investigations.py`
  writes `data/investigations.json`. NASA's objectives are copied word for word; `summary`, `measured` and `earth` are
  AI-written from NASA's text and the file says so (`generated_by`, `human_checked: false`). **A person on the team still
  needs to read all 24 summaries** and then set `human_checked` to true in the build script's output.
- **Check:** `scripts/check_investigations.py` (11 checks, all pass), including that every number in the AI-written
  text appears in NASA's own text for that investigation.
- **Cards** (`site/assets/investigations.js`, `investigations.css`): everything listed above, plus a findings strip at the
  top counted from the rows. Cards are the default; the old table is behind Cards / Table, and its test counts are now
  recounted from the rows instead of typed in.
- **Differences from the proposal:**
  - "Near the Moon Base" uses the site's existing evidence rule (within 10 points of oxygen or 2 psi, chamber oxygen
    only), not the 8 to 12.5 psi box, so the cards and the map agree. With that rule FLEX has 64 tests near the Moon
    Base air and CFI has 4.
  - Tests whose tables give no pressure say "cannot be placed" instead of "no tests near", because nothing was checked.
  - The "Combustion basics" tag is called "Flame science", the name the ranking on the Analysis page already used.
  - The landing-page strip of small maps (open question 3) was not built.
- **Open for the team:** confirm the stage tags (question 1 above) and read the 24 summaries.

