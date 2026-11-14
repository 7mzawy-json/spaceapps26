# Flame lab (draft)

**Status: draft in a personal folder. Not deployed, not agreed with the team.** A refined copy of the team's
prototype in `temp/flame-sim/`, which is left untouched. Built with Claude Code (AI-assisted, see
`docs/ai-usage-log.md`). If the team likes it, it could replace the Sim page; if not, delete the folder.

## How to open it

The page reads `data/tests.web.json`, so it needs a web server. From the repo root:

- macOS: `python3 -m http.server 8765`
- Windows (PowerShell): `python -m http.server 8765`

Then open http://localhost:8765/alanzim/flame-lab/

Add `?css` to the address to see the backup flame used when a browser cannot run WebGL 2.

## What is new compared with `temp/flame-sim/`

| Area | Change |
|---|---|
| The model | Oxygen is carried as its own field. Fuel burns only where it meets oxygen, and each bit of fuel uses up a fixed share of it. The flame is cooler when the gas holds less oxygen, and it goes out by itself when it loses heat faster than it makes it. |
| The look | At 0 g the flame is a thin blue shell around the fuel, as in NASA's droplet experiments. With gravity it becomes a tall yellow flame with a blue base. The fuel source is drawn. |
| Views | Flame, Oxygen, Heat and Flow. The data views have a numbered legend. Oxygen is shown in percent, from 0 up to the test's own level. |
| Measurements | Updated ten times a second from the model: burning or out, height divided by width, flame width, lowest oxygen inside the flame, hottest point, steadiness, and a chart of the burning rate over 30 seconds. |
| Probe | Move the pointer over the chamber to read oxygen, heat and flow at that spot. |
| Controls | Gravity as any value from 0 to 2 g, cabin airflow, drag to blow on the flame, Ignite, Clear the chamber. |
| NASA's record | A table of how many real tests in the chosen experiment went out, kept burning or did not ignite, by oxygen level. |

## What is real, what is NASA data, what is simplified

- **From NASA's table:** oxygen, pressure, fuel and the outcome of each test. At 0 g with no airflow the flame follows
  NASA's record: it goes out when NASA says it went out. If the model flame dies while NASA says it burned, the page
  clears the chamber and lights it again.
- **Real physics, in direction:** fuel needs oxygen to burn; less oxygen gives a cooler flame; hot gas rises only with
  gravity; gases mix faster at low pressure; fuel leaves a droplet faster when gas moves past it.
- **Simplified:** the chamber is flat (two dimensions), every fuel burns with the same made-up strength, and sizes,
  speeds and heat are in the model's own units. The numbers in `K` near the top of the script were tuned by hand
  so that a flame in Earth air holds at 0 g, on the Moon, on Mars and on Earth. **No number was fitted to a NASA
  measurement.**

Any setting NASA did not test (gravity added, airflow, oxygen or pressure moved by hand) is labelled "Your experiment"
and the page says the real outcome is unknown.

## What was tried and removed

A button that lowered the oxygen until the model flame went out, to find a limit for each gravity. The answer
changed with how the search was run (lowering oxygen under a burning flame gave a different limit from lighting a
fresh flame), and one run put the Earth limit below the 0 g limit, the opposite of what NASA's Researcher's Guide
reports. A number like that would mislead, so the feature was taken out. Do not quote extinction limits from this model.

## What was checked

On Sat Nov 14, in the Claude desktop browser on an Apple M1 (WebGL 2):

- All four experiments load. Tests with each kind of NASA outcome (went out, kept burning, did not ignite, not recorded)
  show the matching status and flame.
- In Earth air the flame holds at 0 g (height divided by width about 1.0), Moon (about 1.6), Mars (about 2.4) and
  Earth (about 4.5).
- Strong airflow blows the flame out; gentle airflow makes it burn faster.
- The four views, the legend, the probe, blowing on the flame and the `?css` backup work.

Not checked: Safari, Firefox, phones, the light theme, and slow graphics cards.

## Credits

- Based on `temp/flame-sim/` by the team.
- Method: Jos Stam, "Stable Fluids" (1999). The vorticity step follows Pavel Dobryakov's WebGL-Fluid-Simulation
  (MIT licence), https://github.com/PavelDoGreat/WebGL-Fluid-Simulation.
- Data: NASA Physical Science Informatics, https://psi.nasa.gov/
