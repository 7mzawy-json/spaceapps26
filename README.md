# Flashpoint

An atmosphere trade-off map for space habitats, built for the NASA Space Apps Challenge 2026,
challenge **Flame in Freefall** (Nov 14 to 15, 2026), by team BrayTech Pyrotechnics.

Choosing a cabin atmosphere is a trade. Lower pressure makes spacewalks easier but needs more oxygen to keep the crew
breathing, and more oxygen makes materials burn more readily. Flashpoint plots NASA's microgravity fire tests from
the Physical Science Informatics (PSI) database on a pressure and oxygen map, marks where habitats like the ISS and a
Moon Base sit, and shows where the evidence runs out.

**Live site:** not deployed yet.

## Status

Planning only until the hackathon opens on Sat Nov 14, 09:30. The plan is in [ROADMAP.md](ROADMAP.md) and the
rules for AI agents working in this repo are in [AGENTS.md](AGENTS.md).

## Data

All data comes from NASA's PSI database (https://psi.nasa.gov/). Every number shown traces to a PSI accession.
Missing values are left empty, never guessed. `data/tests.sample.json` holds ten made-up rows, each marked
`"source": "SAMPLE"`, used only while the real data is prepared. It is deleted before the site goes live.

## Use of AI

AI tools were used in this project. What they did and what people checked is logged in
[docs/ai-usage-log.md](docs/ai-usage-log.md).

## Run locally

Instructions arrive with the first code on Sat Nov 14.
