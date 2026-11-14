# Design master (draft)

**Status: a proposal for the team's master look and feel. Not deployed, and not final until the team agrees.**
It is AlanziM2's `temp/dashboard-draft/` with the look and feel reworked. The pages, their contents and their scripts
are the draft's; only what is listed under "What changed" is different. `temp/dashboard-draft/` itself is untouched.
Built with Claude Code (AI-assisted, see `docs/ai-usage-log.md`).

Open it the same way as the draft: start a web server in the repo root (`python -m http.server 8765`, or `python3` on
macOS) and open http://localhost:8765/temp/design-master/

## Decisions behind it

An audit of the draft found eight problems; 7mzawy-json then chose the direction for each open question.

| Question | Decision |
|---|---|
| Theme | Light by default, with a dark mode switch. The choice is remembered on the device. |
| Navigation | The home page is the four cards only. Opening a card shows its page, and the other cards shrink into a slim bar at the top for jumping between pages. |
| Typeface | Geist for text, Geist Mono for every number. |
| Polish | Data colours kept apart from interface colours; a legibility pass on the map; one type scale and 44px controls; fewer repeated motifs. |

## The rules

**Colour.** Every colour is a token at the top of the stylesheet, with a light and a dark value. Components never use a
raw colour (the flame illustration on the Sim card is the one exception: a flame is flame-coloured in both themes).

| Token | Light | Dark | Used for |
|---|---|---|---|
| `--bg`, `--surface`, `--well` | `#f3f5f9`, `#ffffff`, `#f5f7fb` | `#070d1c`, `#0e172b`, `#131f38` | page, cards and panels, inset areas such as the plot |
| `--ink`, `--muted` | `#0d1b2e`, `#536074` | `#e9eef8`, `#9dadc8` | text, secondary text |
| `--line`, `--line-strong` | `#d9e0eb`, `#8492a8` | `#25334f`, `#5d6f92` | hairlines, control borders |
| `--brand`, `--brand-fill`, `--brand-soft` | `#0B3D91` (NASA blue), same, `#e8eefa` | `#9dbcff`, `#2a62d6`, `#172849` | links and titles, filled buttons and pressed states, selected rows |
| `--accent`, `--accent-mark`, `--accent-soft` | `#C8291A`, `#FC3D21` (NASA red), `#fff1ed` | `#ff8068`, `#FC3D21`, `#33161a` | red text, red marks, red tints |
| `--d-burn`, `--d-out`, `--d-none` | `#B45309`, `#0F766E`, `#6B7789` | `#F5A524`, `#2DD4BF`, `#8a97ad` | test outcomes on the map, nothing else |

- **Blue is the interface.** Titles, links, buttons, sliders, pressed states.
- **Red is rare and means one thing:** the probe, and missing evidence ("No data", "No tests", the gravity warning).
  The small red rule on each card is the only decorative red.
- **Test outcomes have their own colours and shapes:** kept burning is a filled amber circle, went out or did not ignite
  is a teal ring, not recorded is a small grey dot. Shape and colour together, so colour is never the only signal.
- **The evidence rating is neutral:** "Well tested" (solid), "Thin" (outlined), "No tests" (red). The words replace
  "Lit / Dim / Dark", which on a fire site read as "the fire lit".
- All text pairs pass 4.5:1 contrast and all marks pass 3:1, in both themes (checked by calculation).

**Type.** Six sizes: 12, 14, 16, 20, 24 pixels and two fluid heading sizes. Nothing is smaller than 12 pixels.
There are two helper styles: a small uppercase label, and a quiet hint. Numbers, readouts, accession codes and axis
ticks are always Geist Mono so they line up.

**Shape.** The one-rounded-corner shape (square everywhere except the bottom left) is the signature of cards and panels
only. Buttons, chips, inputs and inset areas use a plain 8 pixel radius.

**Controls.** Every button, chip, tab, select, input and slider is at least 44 pixels tall.

**Motion.** Three speeds: 150 ms for presses, 300 ms for hovers, 480 ms for page changes. Opening a card: it grows into
the page while the other three shrink into their tabs. Everything is switched off under "reduce motion".

**Pages.** A compact header (label, title, one line, the page's own line drawing) instead of a tall blue band. The Sim
page's header sits on the chamber colour, so the flame page reads as a different room.

**Map.** The plot picks its proportions from its container, so a phone or a side panel gets larger text and fewer
ticks. Labels have a halo and fixed offsets so they do not collide. The "no data" box on the home card shows without
hover, so it is visible on phones.

## What changed in the page itself

- The first card is named **Map** (it was "Home", which clashes with a bar whose logo goes home). Its page was already
  titled "Atmosphere map".
- The "Dashboard" back buttons are gone; the Flashpoint mark in the bar, the browser's back button and Esc do that job.
- Map drawing code: sizes, label positions, dot shapes and the legend. Navigation code: the bar, the shrink animation,
  the theme switch. No data logic, no chat logic and no simulation logic was touched.

## For the team to settle

- **This conflicts with "Design rules" in `ROADMAP.md`** (dark page, hero image, GSAP scroll story, floating navigation
  pill). The roadmap needs updating if the team adopts this, or this needs changing if it does not.
- The offline answers (`lib/offline-answer.ts`) may still say "lit", "dim" or "dark" in their text. That is the Data
  lane's file and was not changed.
- `temp/flame-sim/` still has its own dark look and Inter; it should take these tokens when it moves into the site.
- Tested in headless Chromium at desktop and phone width, light and dark. Not yet tried on a real phone, in Safari or
  with a screen reader.

## Credits

Geist and Geist Mono (Vercel, SIL Open Font License) from Google Fonts. Colours follow NASA's palette; no NASA logo or
insignia is used.
