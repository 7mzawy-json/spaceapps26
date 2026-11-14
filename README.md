# Flashpoint

For the local preview, run `python scripts/preview.py`, then open `http://127.0.0.1:8766/site/`. This server supports media byte ranges so video seeking works.

Start with **Start the guided analysis** for the evidence presentation. Use **Research tools** for the complete catalogue, filters, graphs and CSV export. Learn opens one chapter at a time with six interactive experiments and separate Watch/Explanation views. The flame lab has its own four-step demonstration: one NASA record, gravity, ventilation and a recorded extinction. Pin a model frame to compare one changed variable, or copy a setup link. The source card keeps NASA's actual conditions and outcome separate from the live illustration.

Data check: `python scripts/check_data.py` derives every test value a second time from the raw NASA cells kept in `data/tests.json` and compares it with what the site loads. Add `--against-nasa` to download the tables from NASA PSI again and compare every row. It uses the standard library only.

Validation: `python scripts/check_experience.py` runs the local Chrome browser checks; `node scripts/check_offline_native.mjs` runs the existing evidence/answer checks with Node 24 and no installation. Browser checks use the already installed Playwright and pypdf tools. Details: `docs/codex-refinement.md`.

The learning/media audit is `python scripts/check_learning.py` (141 passing checks). The application audit has 50 passing checks. Scientific limits and media validation are described in `docs/learning-refinement.md`.

The flame-lab audit is `python scripts/check_flame_lab.py` (99 passing checks), including source provenance, comparisons, custom settings, fallback, reduced motion and delayed first-load transfers. See `docs/flame-lab-refinement.md` for scope and verification.

Fire evidence for the places astronauts will live. Built for the NASA Space Apps Challenge 2026, challenge
**Flame in Freefall** (Nov 14 to 15, 2026), by team BrayTech Pyrotechnics.

Choosing a cabin atmosphere is a trade. Lower pressure makes spacewalks easier but needs more oxygen to keep the crew
breathing, and more oxygen makes materials burn more readily. Flashpoint lets you pick an atmosphere (oxygen and
pressure) and shows what NASA's microgravity fire tests say about it, by what burned, and what is missing.

**Live site:** https://flashpoint-space.vercel.app (Vercel, deploys on every push to `main`).

## What it does

- **Analysis, Simple mode:** a map of pressure against oxygen with every placeable NASA test, and the habitats (ISS,
  Moon Base, spacesuit). For the point you pick: evidence rated separately for gas flames, fuel droplets and solid
  materials, the investigations ranked for that point, the nearest tests, and a printable one-page evidence brief.
- **Analysis, Advanced mode:** the 24 combustion investigations in NASA's PSI catalogue and all 1,276 test rows, with
  filters, graphs, a table, and a CSV download of whatever is filtered (each row keeps its source file and line).
- **Flame lab:** one NASA reference record alongside an illustrative fluid model. Compare gravity and ventilation, inspect oxygen and flow, and replay a recorded outcome. The model is not calibrated to predict a new test.
- **Assistant:** one chat panel on every page. Until the SI chat is connected it answers from the test data with fixed
  rules, and says so.

## Run it

Start a web server in the repo root, then open `/site/`:

- Windows (PowerShell): `python scripts/preview.py`
- macOS: `python3 scripts/preview.py`

then http://127.0.0.1:8766/site/ . Details, and what has been checked, are in [site/README.md](site/README.md).

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
