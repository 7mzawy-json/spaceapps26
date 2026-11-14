# Dashboard draft (temporary)

**Status: rough draft, nothing here is final.** Everything in this folder is open to change by anyone on the team:
edit it, replace it, or delete it. It is here so we have something concrete to react to, not a decision.

- `index.html`: a clickable mockup. Open it in a browser. No build step, no data, not deployed.
- Started by AlanziM2 from a paper sketch on Sat Nov 14, built with Claude Code (AI-assisted, see
  `docs/ai-usage-log.md`).
- `temp/` sits outside the lane folders on purpose. Nothing here goes into `app/` or `components/` until the team agrees.

## Rough design choices in this draft

Each line below is a suggestion to discuss, not an agreed rule.

| Area | What the draft tries | Open to change |
|---|---|---|
| Structure | The home screen is a dashboard of four cards instead of a top navigation bar: **Home** (the atmosphere map), **SI Assist** (ask the data), **Resources** (the NASA investigations), **Sim** (droplet flame). | Which cards, their names, their order, and whether the map should be the first screen instead |
| Hover | Each card plays a short animation hinting at what it does: the oxygen curve draws itself, a question types out, a line scans the catalogue, the flame grows and ripples. | Which animations, their speed, and what phones (no hover) should show |
| Click | The card grows to fill the screen and becomes its page. Back button, browser back or Esc shrinks it back. | Whether to keep this or use a plain fade |
| Look | Very minimal: near-black background, hairline borders, sharp corners, no shadows or gradients, a faint grid as the only decoration. | Everything |
| Colour | Three colours: near-black, white at four opacities for hierarchy, and orange `#E85D35` as the single accent. Follows the system light or dark setting. | Palette, accent, whether light mode is needed |
| Type | Inter for text (thin headlines), JetBrains Mono for numbers. | Fonts and weights |
| Pages | Each page is a title, one line, and outlined boxes saying what would go there. Placeholders only. | All page contents |

## Where it came from

- Layout: AlanziM2's sketch (four cards, hover animation, smooth transition to each page).
- Look: a mix of two style references AlanziM2 tried. A CAD blueprint style came first and felt like too much, so the
  draft moved to a minimal "barely-there" style and kept the animations.

## Things this draft does not settle

- It conflicts with the "Design rules" section and the page order in `ROADMAP.md`, and it overlaps the two proposals in
  `alanzim/`. The team decides which direction to take.
- Numbers on the cards (habitat markers, the sea-level oxygen curve, PSI accessions) come from the challenge text and
  the PSI catalogue. There is no test data in it.
