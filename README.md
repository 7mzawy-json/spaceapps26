# Flashpoint

Fire evidence for the places astronauts will live. Built for the NASA Space Apps Challenge 2026, challenge
**Flame in Freefall** (Nov 14 to 15, 2026), by team BrayTech Pyrotechnics.

Choosing a cabin atmosphere is a trade. Lower pressure makes spacewalks easier but needs more oxygen to keep the crew
breathing, and more oxygen makes materials burn more readily. Flashpoint lets you pick an atmosphere (oxygen and
pressure) and shows what NASA's microgravity fire tests say about it, by what burned, and what is missing.

**Live site:** not deployed yet.

## What it does

- **Analysis, Simple mode:** a map of pressure against oxygen with every placeable NASA test, and the habitats (ISS,
  Moon Base, spacesuit). For the point you pick: evidence rated separately for gas flames, fuel droplets and solid
  materials, the investigations ranked for that point, the nearest tests, and a printable one-page evidence brief.
- **Analysis, Advanced mode:** the 24 combustion investigations in NASA's PSI catalogue and all 1,276 test rows, with
  filters, graphs, a table, and a CSV download of whatever is filtered (each row keeps its source file and line).
- **Sim:** a flame set up from one NASA test, then shown with gravity added. Gravity is real physics; the rest is
  labelled as illustration.
- **Assistant:** one chat panel on every page. Until the SI chat is connected it answers from the test data with fixed
  rules, and says so.

## Run it

Start a web server in the repo root, then open `/site/`:

- Windows (PowerShell): `python -m http.server 8765`
- macOS: `python3 -m http.server 8765`

then http://localhost:8765/site/ . Details, and what has been checked, are in [site/README.md](site/README.md).

## Where things are

| Path | What |
|---|---|
| `site/` | The website: plain HTML, CSS and JavaScript, no build step |
| `data/` | `tests.json` (every row with its raw cells), `tests.web.json` (the slim file the site reads), `tests.meta.json` |
| `scripts/build_tests.py` | Downloads NASA's per-test tables and builds the data files |
| `lib/`, `public/offline/` | The evidence rating and the offline answers (TypeScript source and the browser build) |
| `public/flames/` | The backup CSS flame for browsers without WebGL 2 |
| `docs/` | Challenge notes, the data inventory, and the AI usage log |
| `temp/`, `alanzim/` | Earlier drafts, kept for reference. Not deployed (see `.vercelignore`) |

`ROADMAP.md` is the plan written before the hackathon. Where it and the site disagree, the site is what we built.

## Data

All data comes from NASA's Physical Science Informatics database (https://psi.nasa.gov/). Every number shown traces to
a PSI accession, a source file and a line. Missing values are left empty, never guessed.

## Use of AI

AI tools were used in this project. What they did and what people checked is logged in
[docs/ai-usage-log.md](docs/ai-usage-log.md).
