# Flashpoint

Fire evidence for the places astronauts will live. Built for the NASA Space Apps Challenge 2026, challenge
**Flame in Freefall** (Nov 14 to 15, 2026), by team BrayTech Pyrotechnics.

Choosing a cabin atmosphere is a trade. Lower pressure makes spacewalks easier but needs more oxygen to keep the crew
breathing, and more oxygen makes materials burn more readily. Flashpoint lets you pick an atmosphere (oxygen and
pressure) and shows what NASA's microgravity fire tests say about it: what burned, what went out, and what has never
been tested.

**Live site:** https://flashpoint-space.vercel.app

## What it does

- **Analysis:** a map of pressure against oxygen with every placeable NASA test and the habitats (ISS, Moon Base,
  spacesuit). For the point you pick: evidence rated separately for gas flames, fuel droplets and solid materials, the
  nearest tests, the investigations ranked for that point, and a printable one-page evidence brief. Research tools add
  the 24 combustion investigations as cards, all 1,276 test rows, filters, graphs and a CSV download (every row keeps
  its NASA source file and line).
- **Flame lab:** one NASA reference record beside an illustrative fluid model. Change gravity and ventilation, inspect
  oxygen and flow, and replay a recorded outcome. The model is an illustration and is not calibrated to predict a test.
- **Learn:** six flame-science lessons, each with an interactive experiment, a narrated video and an explanation, plus
  five guides to the site and a formula sheet.
- **SI assistant:** a chat panel on every page. It sends the question and the evidence the page has counted to an AI
  model (Google Gemini, `api/chat.js`) and checks every answer against that evidence before showing it. If the model is
  unavailable, a rule-based answer from the same data takes over and is labelled as a fallback.

## Data

All data comes from NASA's Physical Science Informatics database (https://psi.nasa.gov/). Every number shown traces to
a PSI accession, a source file and a line. Missing values stay empty and are never guessed.

- `scripts/build_tests.py` downloads NASA's per-test tables and writes `data/tests.json` (every row with its raw cells)
  and `data/tests.web.json` (the slim file the site reads).
- `scripts/check_data.py` derives every value a second time from the raw cells and compares it with what the site
  loads. Add `--against-nasa` to download the tables again and compare every row.
- `scripts/build_investigations.py` and `scripts/check_investigations.py` build and check the investigation cards
  (`data/investigations.json`); the AI-written summaries are marked as such in the file.
- Sources and known gaps: [docs/data-inventory.md](docs/data-inventory.md). Fact checks and fixes:
  [docs/audit-log.md](docs/audit-log.md).

## Use of AI

AI tools were used to write code, text, the lesson videos' narration and the investigation summaries. How the team directed
and reviewed that work is logged in [docs/ai-usage-log.md](docs/ai-usage-log.md). AI-written text and data say so on
the page and in the files.

## Run it locally

Start the preview server in the repo root, then open http://127.0.0.1:8766/site/ :

- Windows (PowerShell): `python scripts/preview.py`
- macOS: `python3 scripts/preview.py`

The assistant needs `GEMINI_API_KEY` (see `.env.example`); without it the rule-based fallback answers.

Checks: `python scripts/check_data.py`, `python scripts/check_investigations.py` and
`node scripts/check_offline_native.mjs`. Browser checks (need Playwright): `scripts/check_experience.py`,
`scripts/check_learning.py` and `scripts/check_flame_lab.py`.

## Where things are

| Path | What |
|---|---|
| `site/` | The website: plain HTML, CSS and JavaScript, no build step. Details in [site/README.md](site/README.md) |
| `api/chat.js` | The SI assistant (a Vercel serverless function) |
| `data/` | The NASA test rows, their metadata and the investigation cards |
| `scripts/` | Data build and check scripts, the browser checks and the local preview server |
| `lib/`, `public/offline/` | The evidence rating and the rule-based answers: the assistant's **fallback, not the main system** (TypeScript source and the browser build) |
| `public/flames/` | The backup CSS flame for browsers without WebGL 2 |
| `tools/videos/` | How the six Learn videos were made: scripts, scenes, the recorded AI narration and the renderer |
| `docs/` | The AI usage log, data inventory, audit log and investigation-card notes |

The original build plan, earlier drafts, design notes and working reports are on the `archive/before-cleanup` branch. Files marked "(archived)"
in comments live there.
