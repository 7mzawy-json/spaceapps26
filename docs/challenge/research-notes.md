# Research notes (2026-11-12)

Everything here was checked by hand on Nov 12. Re-verify endpoints before relying on them.

## Rules that shape the plan

- "SI" (Super Intelligence) is simply the 2026 official wording for AI. The challenge wants an AI-powered dashboard.
- **Teams are not allowed to begin working on the challenge before the hackathon (Nov 14 to 15).**
  Reading the statement and planning is preparation. Writing project code or ingesting data is not, so none of that happens before Sat 09:30.
- The submission must include a description of how AI tools were used. Keep a running log from the first hour.
- Teams: max 6 members. Submission happens on the team's project page on spaceappschallenge.org.
- Published Nov 13: challenge Resources tab, Project Submission Guide, Judging and Awards Guide.
  Past years judged on Impact, Creativity, Validity, Relevance, Presentation. Confirm against the 2026 guide.

Source: https://www.spaceappschallenge.org/resources/participant-faqs/

## Where the data lives

- Portal: https://psi.nasa.gov/physci/repo/search?q=&data_source=psi&data_type=investigation
- The portal is a JavaScript app backed by a public JSON endpoint that needs no login:
  `https://psi.nasa.gov/geode-py/ws/repo/search?q=&data_source=psi&data_type=investigation&size=100`
  (133 investigations in total across all disciplines; page through with a second request.)
- Each record carries: Accession (PSI-nn), Acronym, Title, Research Area, SubResearch Area, Objectives,
  Hypothesis, Approach, Experiment Hardware, Flight Platform, Keywords, Person, Publication Title,
  Publication Author List, Related Investigations, Research Impacts/Earth Benefits, start and end dates, Thumbnail.
- Combustion Science is about 25 to 30 of the 133. Seen so far: ACME BRE (PSI-20), ACME CLD Flame (21),
  ACME E-FIELD Flames (22), BASS-II (25), BASS (26), CFI (39), DAFT / DAFT-2 (47), SAFFIRE-I/II/III (98, 99, 100),
  SAME-R (101), SAME (102), SLICE (106), SPICE (107), ACME CFI-G (159), plus several ground-based studies.
- Per-investigation pages: `https://psi.nasa.gov/physci/repo/data/investigations/PSI-<n>`.
  The actual test data (per-test oxygen, flow speed, videos, spreadsheets) sits in downloadable files there.
  Size, format and download method are NOT yet checked. PSI has a separate process for large downloads.
- Dead ends: the AWS bucket `nasa-psi` holds only DSI, OASIS and pk4 (no combustion).
  The OSDR API at osdr.nasa.gov covers biology only.
- Reference docs: Complete PSI Database Guide (PDF) linked from https://science.nasa.gov/biological-physical/data/

## What this means for the build

- The catalogue is small (tens of investigations, not thousands) and text-rich. A full metadata snapshot is one
  HTTP request and fits in a JSON file in the repo. No database is needed for it.
- The hard, differentiating part is test-level data: turning each investigation's files into comparable rows
  (fuel, geometry, O2 %, pressure, flow speed, outcome). That is what the "predictive modeling" objective asks for.
- The story NASA is hinting at: Moon Base atmosphere of roughly 30%+ O2 at 10.2 psi or less, no partial-gravity
  data in PSI, so microgravity and normal-gravity results must bound the answer.
