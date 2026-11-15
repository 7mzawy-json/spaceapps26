# BrayTech Pyrotechnics: NASA Space Apps 2026

Challenge: **Flame in Freefall: SI-Powered Fire Safety Insights from Microgravity Combustion Data**.
Challenge spec, resources, submission rules and judging criteria live in `docs/challenge/`. Read them before
proposing anything. `README.md` describes what was built. The original build plan (`ROADMAP.md`) is in git history.

## Hard deadlines (local time)

| When | What |
|---|---|
| Sat Nov 14, 09:30 | Sprint I: kickoff and ideation |
| Sat Nov 14, 13:00 and 16:00 | Mentor rounds I and II |
| Sat Nov 14, 17:30 | Sprint II: build, test, pivot |
| Sun Nov 15, 09:30 | Sprint III: polish and pitch prep |
| Sun Nov 15, 13:00 | Mentor round III |
| Sun Nov 15, 15:30 | **Project submission. Nothing lands after this.** |
| Sun Nov 15, 16:00 | Local judging |

## Team

Three people with equal responsibility and no team lead. Decisions are made by the whole team.
Each lane owns its folders: Data (`scripts/`, `data/`, `lib/`), Interface (`site/`, `public/`, `api/`), Story (`docs/`, the pitch and the submission text).
An agent edits only the files of the lane it is working for. Personal folders are drafts and stay off `main`.

## Working conditions

- One teammate's agents run on a Windows 11 desktop (Ryzen 7 9700X, Radeon RX 7700 XT, 32 GB RAM) that the
  human drives remotely from an old MacBook. Nobody is at the keyboard.
- The GPU is AMD: no CUDA. Do not pick CUDA-only libraries. Heavy GPU work goes to a cloud machine.
- Never start anything that needs a click on the desktop (GUI installers, browser logins, UAC prompts).
  If a step needs one, stop and say so.
- The demo must run from a public URL, not from this PC. Judges will not wait for a home desktop.

## Rules for agents

- Commands for the human on the Windows desktop: PowerShell 5.1 syntax (no `&&`, no `||`). Other teammates use their
  own laptops (at least one is macOS); there, use that laptop's shell.
- Never write the em dash character, or an en dash or double hyphen standing in for one.
- Smallest thing that works. No new dependency when the standard library or an installed one does it.
- Commit after every working step with a plain message, so any step can be rolled back.
- If a step fails twice, stop and report what you tried. Do not improvise a different design.
- Never commit secrets. Keys go in `.env.local`, which is gitignored. `.env.example` lists the names with no values.
- AI-generated code and data say so in text and metadata (submission rule, see `docs/challenge/submission-and-awards.md` (archived)).
- Every phase adds a line to `docs/ai-usage-log.md`, and every new library, image or dataset goes in its References list.
