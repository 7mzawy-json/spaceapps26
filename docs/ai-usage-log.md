# AI usage log

Required for submission: the project page has a "Use of Super Intelligence (SI)" field, and AI-generated code and data
must say so in text and metadata (see `docs/challenge/submission-and-awards.md`). Add one line per phase or per
notable AI use. Keep it factual: tool, model, what it did, what a human checked.

## Where the idea came from (team to write, in its own words)

The SI rules say AI must not be used to come up with how to solve the challenge. Before Sunday, the team writes here
how the Flashpoint concept (the pressure and oxygen map with the evidence gaps) was chosen, by whom, and what role AI
played in planning, research and drafting the roadmap.

> (to be written by the team)

## Log

| When | Who | Tool and model | What the AI did | What a human checked |
|---|---|---|---|---|
| Thu Nov 12 to Sat Nov 14, before kickoff | team | Claude Code | Read the challenge page, Resources tab links, Project Submission Guide and Judging and Awards Guide into `docs/challenge/`; drafted `ROADMAP.md` and `AGENTS.md` from the team's plan | (team to fill in) |
| Sat Nov 14, 10:30 | team | Claude Code | Wrote `scripts/build_tests.py`, which downloads the PSI per-test tables and writes `data/tests.json` (1,285 rows, each with its source file, line and raw cells) and `data/tests.meta.json`. Values are copied or unit-converted by code, none typed by the AI | (team to fill in) |
| Sat Nov 14, 10:45 | AlanziM2 | Claude Code | Built the temporary clickable mockup in `temp/dashboard-draft/` from AlanziM2's paper sketch and two style references AlanziM2 chose | AlanziM2 reviewed it in the browser and asked for a less cluttered version |
| Sat Nov 14, 10:50 | AlanziM2 | Claude Code | Changed `scripts/build_tests.py` to flag 9 rows that are not separate tests (8 CFI rows NASA's file repeats word for word, 1 BASS 'SOOT Cleaning' log entry) with `exclude_reason`, and to write the slim `data/tests.web.json`. No value added, changed or deleted; 'unknown' outcomes kept | AlanziM2 set the rules (no created values, keep unknowns, keep the full file); a script compared every row with the previous `tests.json` |
| Sat Nov 14, 11:08 | 7mzawy-json | Claude Code (Claude Fable 5.2) | Wrote the flame simulation prototype in `temp/flame-sim/` (one HTML file, WebGL fluid solver, reads `data/tests.json`). The idea, and the reference flame it should resemble, came from 7mzawy-json | 7mzawy-json to review in the browser; the AI checked screenshots from a headless browser only |
| Sat Nov 14, 11:30 | team | Claude Code | Wrote offline failsafes on a side branch: `lib/evidence.ts` (nearest tests and rating, roadmap Phase 4 spec), `lib/offline-answer.ts` (rule-based answers with fixed templates and cited NASA facts when the SI chat is down), `scripts/check_offline.ts`, and CSS backup flames in `public/flames/`. No AI runs at runtime in these | (team to fill in) |
| Sat Nov 14, 12:30 | team | Claude Code | Reworked the failsafes on the side branch to match the flame sim: CSS flame now follows the sim's gravity levels, outcome timing and oxygen and pressure rules (`public/flames/flame-fallback.js`); the sim switches to it when WebGL 2 fails (`?css` forces it); offline answers name the NASA test and gravity to show | (team to fill in) |

## References (every library, image and dataset)

The project page's References field must list all external resources, including open source code, text and images.
The original-work checkbox at submission confirms this list is complete. Add each item when it enters the project.

| Item | Type | Source or URL | License or credit |
|---|---|---|---|
| NASA Physical Science Informatics (PSI) database | dataset | https://psi.nasa.gov/ | NASA open data |
| Stable Fluids (Jos Stam, 1999) | method | SIGGRAPH 1999 conference proceedings | paper, credited in `temp/flame-sim/` |
| WebGL-Fluid-Simulation (Pavel Dobryakov) | open source code, used as reference for the vorticity step | https://github.com/PavelDoGreat/WebGL-Fluid-Simulation | MIT |
| Inter, JetBrains Mono | fonts (Google Fonts) | https://fonts.google.com/ | SIL Open Font License |
