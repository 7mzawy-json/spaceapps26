# AI usage log

Required for submission: the project page has a "Use of Super Intelligence (SI)" field, and AI-generated code and data
must say so. This page states how team BrayTech Pyrotechnics used AI tools.

## How we worked

The team chose the challenge, the problem Flashpoint solves, the data rules, the features, the look and every trade-off.
We used AI coding tools the way a team uses fast assistants: we told them what to build and how, they wrote the code,
and a team member reviewed each change and kept it, sent it back with corrections, or threw it away. Many drafts were
rejected along the way (a large "0" headline, an evidence meter, four of five logo options, a synthesized soundtrack).

Two rules held throughout. No test value was typed by an AI: every number on the site is copied or unit-converted by
code from NASA's PSI tables, and a check script derives each value a second time. Anything an AI wrote as content is
labelled: the assistant's answers, the AI badge on the lesson videos, and the investigation summaries in
`data/investigations.json` (marked `human_checked` until the team has read all 24).

## Where the idea came from (team to write, in its own words)

The idea was chosen after deciding on the flame in free fall challenge. We looked at the data and thought "What utility can this data provide to experts and learners?" So we came up with the idea of Flashpoint. Flashpoint is meant to help experts make better informed decisions related to flammability in microgravity environments and what air mixture is required on a moon base for example, it also helps to onboard learners on how flame behaves in conditions outside of Earth.   

## Log

| Phase | The team's decisions and direction | What the AI tools did | Tools |
|---|---|---|---|
| Planning, Thu Nov 12 to Sat Nov 14 | Chose the challenge, read the guides, set the build plan, the lanes and the working rules | Turned the challenge pages into notes; typed up the roadmap from the team's plan | Claude Code |
| Data, Sat Nov 14 | AlanziM2 set the rules: no created values, keep "unknown" outcomes, flag repeated rows instead of deleting them, keep the full file | Wrote the scripts that download NASA's 11 PSI tables, build `data/tests.json` and check every value against the raw cells | Claude Code |
| Flame lab, Sat Nov 14 | 7mzawy-json proposed a flame driven by NASA's test rows and picked the reference look; AlanziM2 directed the oxygen field and the guided comparisons; a teammate supplied the NASA photo the 0 g flame is painted after | Wrote the WebGL fluid simulation and its controls to those specs. It is an illustration, not a calibrated model | Claude Code, OpenAI Codex |
| Site design, Sat Nov 14 | AlanziM2 sketched the layout and picked the style references; 7mzawy-json chose the theme, typeface, navigation and fixes; the team sketched the logo and picked the trace | Built the pages, tokens and themes from those choices; traced the logo sketch as SVG | Claude Code |
| Analysis and investigation cards, Sat Nov 14 to Sun Nov 15 | The team decided what a visitor needs: coverage by fuel type, ranked investigations, CSV download, cards with small maps, Compare; 7mzawy-json cut what served no purpose | Built the views; drafted the 24 investigation summaries from NASA's text (labelled, see above) | Claude Code |
| Learn page and videos, Sat Nov 14 to Sun Nov 15 | AlanziM2 wrote the lesson notes, approved all six scripts, chose the narrator voice, approved the pilot and reviewed each lesson | Drafted the lessons and scripts, drew the animations, and voiced the narration once. Every video frame carries an "AI" badge | Claude Code, OpenAI Codex, ElevenLabs |
| SI assistant, Sun Nov 15 | 7mzawy-json chose the feature, the free model tier and the rules it follows (answer only from NASA's evidence, cite tests, never call an atmosphere safe, label any inference); the team stress-tested it with 95 live questions and decided each fix | Wrote the `/api/chat` route and the checks that drop any answer whose numbers disagree with the evidence. At run time Gemini writes the answers, which are labelled AI-generated | Claude Code; Google Gemini at run time |
| Page flow, Sun Nov 15 | 7mzawy-json found the page asked too much of a first-time visitor, set the order of importance, and put the assistant on the first screen | Reordered and folded the sections to that order | Claude Code |
| Review and cleanup, Sun Nov 15 | The team set up an independent AI reviewer, chose which of its findings to fix, and decided what to archive before submission | Logged findings in `docs/audit-log.md`; applied the fixes the team chose; moved drafts to the `archive/before-cleanup` branch | ChatGPT (OpenAI Codex), Claude Code |
| Pitch deck, Sun Nov 15 | The team set the story (humans migrate; to settle beyond Earth we must breathe, and breathing depends on oxygen pressure; a Moon Base adds gravity that no test covers), gave the member names, and AlanziM2 corrected the gravity slide: every test in the data ran in microgravity | Wrote the 7 slides and speaker notes in `docs/pitch/Flashpoint-pitch.pptx`, drew the three graphics (each marked AI-generated on the slide), took the screenshots of the live site, and built the PowerPoint file with its click animations | Claude Code (Claude Fable 5.2); python-pptx; Playwright |

## References (every library, image and dataset)

The project page's References field must list all external resources, including open source code, text and images.
The original-work checkbox at submission confirms this list is complete. Add each item when it enters the project.

| Item | Type | Source or URL | License or credit |
|---|---|---|---|
| NASA Physical Science Informatics (PSI) database | dataset | https://psi.nasa.gov/ | NASA open data |
| Adiabatic flame temperatures (Tad column) of PSI-159 CFI-G and PSI-10 Flame Design | NASA table values, used to fit the flame lab's heat curve | https://psi.nasa.gov/physci/repo/data/investigations/PSI-159 and PSI-10 | NASA open data; fit and rows named in `site/sim.html` (heatFactor) |
| A Researcher's Guide to Combustion Science | NASA reference for lesson explanations | https://www.nasa.gov/wp-content/uploads/2016/05/np-2015-10-034-jsc_combustion_in_reduced_gravity-iss-mini-book-011116-508.pdf | NASA ISS Program, 2015; linked in lessons |
| NASA Glenn Combustion Science | NASA reference for lesson explanations | https://www.nasa.gov/glenn/glenn-expertise-space-exploration/physical-sciences-program/combustion-science/ | NASA; linked in lessons |
| Stable Fluids (Jos Stam, 1999) | method | SIGGRAPH 1999 conference proceedings | paper, credited in `site/sim.html` |
| WebGL-Fluid-Simulation (Pavel Dobryakov) | open source code, used as reference for the vorticity step | https://github.com/PavelDoGreat/WebGL-Fluid-Simulation | MIT |
| Site code, flame lab, lessons and illustrations | original code and illustrations, written with AI coding tools under the team's direction | `site/`, `api/`, `scripts/` | AI-assisted (Claude Code, OpenAI Codex); illustrations labelled as illustrations |
| Inter, JetBrains Mono | fonts (Google Fonts) | https://fonts.google.com/ | SIL Open Font License |
| Geist, Geist Mono (Vercel) | fonts (Google Fonts) | https://fonts.google.com/specimen/Geist | SIL Open Font License |
| ElevenLabs text to speech, premade voice "Daniel" | AI-generated narration (learners page videos) | https://elevenlabs.io/ | free plan, credit to ElevenLabs required |
| Google Gemini API (model gemini-3.5-flash-lite) | AI service, answers questions in the assistant panel | https://ai.google.dev/ | Google API terms; free tier |
| Playwright for Python (Microsoft) | open source code, renders video frames (build time only) | https://playwright.dev/python/ | Apache 2.0 |
| FFmpeg, via imageio-ffmpeg | open source code, encodes the videos (build time only) | https://ffmpeg.org/ , https://github.com/imageio/imageio-ffmpeg | FFmpeg: LGPL/GPL; imageio-ffmpeg: BSD 2-Clause |
| pypdf | test-only library, verifies the printed brief's page count | https://pypi.org/project/pypdf/ | Installed verification tool; no browser/runtime dependency |
| python-pptx | open source code, writes the pitch deck file (build time only) | https://python-pptx.readthedocs.io/ | MIT |
