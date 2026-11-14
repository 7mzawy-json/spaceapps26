# Flame sim prototype (temporary)

**Status: draft for the team to try. Nothing here is final, and nothing here is deployed.** It could become the
"Sim" card in `temp/dashboard-draft/`, or be dropped. Built with Claude Code (AI-assisted, see `docs/ai-usage-log.md`).
The idea came from a teammate, who wanted a flame like https://www.runcell.dev/tool/fire-simulation that follows our data.

## What it does

Pick a test from `data/tests.json`. The flame is set up from that one row:

| From the row | Sets | Kind |
|---|---|---|
| `o2_pct` | how fast the fuel burns and how hot the flame is | illustration (direction is right, amount is not a prediction) |
| `pressure_psi` | how fast gases spread: low pressure gives a thicker, softer flame | illustration |
| `fuel_phase`, `accession` | flame shape at the source: droplet or porous sphere (round), ACME CFI-G (gas jet) | from the experiment's hardware |
| `outcome`, `ignited` | whether the flame holds, goes out by itself, or never lights | NASA's own record |
| gravity buttons (not in the data: every test ran at 0 g) | buoyancy, the force that makes hot gas rise | real physics |

Rows with no oxygen or no pressure (BASS, BASS-II, SAFFIRE) are left out, because the page never fills in a value.
When you add gravity or move the oxygen and pressure sliders by hand, the page says the setting is not a NASA test.

## How to open it

The page reads `data/tests.json`, so it needs a web server (opening the file directly will not load the data).
From the repo root:

- Windows (PowerShell): `python -m http.server 8765`
- macOS: `python3 -m http.server 8765`

Then open http://localhost:8765/temp/flame-sim/

## How it works

One file, no libraries, no build step. A small fluid simulation runs on the graphics card (WebGL 2) on a 256 by 256
grid: fuel leaves the source, burns, heats the gas, and the gas moves. Gravity adds one term (hot gas rises).
The function `flameParams` near the top of the script is the whole link between a test's numbers and the flame;
change the numbers there to retune it.

## Credits

- Method: Jos Stam, "Stable Fluids" (1999).
- The vorticity step follows Pavel Dobryakov's WebGL-Fluid-Simulation (MIT licence),
  https://github.com/PavelDoGreat/WebGL-Fluid-Simulation. No code was copied from runcell.dev.

## Not settled

- Whether the team wants this at all, and where it goes.
- Solid fuels (the cabin materials) cannot be shown: NASA's tables give them no pressure.
- Tested only in headless Chromium so far, not yet on a phone or in Safari.
