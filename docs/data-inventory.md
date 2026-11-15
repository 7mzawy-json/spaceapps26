# Data inventory (explored 2026-11-14, 08:30)

Checked by hand from the public PSI endpoints. No login needed. Nothing here is project code; the files were read
in a scratch folder and are not in the repo. Re-run the download before trusting a number.

## How to get the per-test tables

1. Investigation record with its file lists: `https://psi.nasa.gov/geode-py/ws/repo/investigations/PSI-<n>`
   (JSON; file lists sit under keys such as `added`, `experimentalTable`, `images`).
2. The key list is **`experimentalTable`**: one small CSV per experiment, one row per test. Raw data folders are
   terabytes of video and logs; ignore them.
3. Download: `GET https://psi.nasa.gov/geode-py/ws/studies/PSI-<n>/download?file=<file_name>&redirect=false`
   returns a short-lived signed S3 link as text. Fetch that link. `file_name` is the record's `file_name` field,
   URL-encoded.
4. All 22 tables together are under 0.3 MB.

## What each table holds

| Accession | Experiment | Tests | Fuel | O2 per test | Pressure per test | Flow (cm/s) | Outcome per test |
|---|---|---|---|---|---|---|---|
| PSI-159 | ACME CFI-G | 333 (179 normal, 154 inverse) | gas (ethane, propane, butane) | 12 to 85% | 7.2 to 48 psi | no | `Hot ignition` yes/no/flash, `Self-ext or flow term` SE/FT |
| PSI-10 | ACME Flame Design | 327 (296 with pressure) | gas (ethylene, propane) | 20 to 85% | 6.3 to 44 psi | no | none |
| PSI-69 | FLEX | 274 | droplet (methanol, heptane) | 12 to 34% | 10.2 to 45 psi (mmHg in file) | no | `Test end`: Extinction, Disruption, Completion |
| PSI-39 | CFI | 87 | droplet (dodecane blends) | 17 or 21% | 0.5 to 5 atm | no | none |
| PSI-25 | BASS-II | 129 | solid (SIBAL fabric, PMMA, rods) | 13.6 to 22.2% | not stated (cabin) | fan display, not cm/s | none (final O2 and CO only) |
| PSI-26 | BASS | 122 | solid | not stated | not stated | no | none |
| PSI-98, 99, 100 | SAFFIRE-I, II, III | 2 + 15 + 2 | solid (SIBAL, silicone, others) | about 21.5% | not stated (Cygnus cabin) | 20 to 30 | burn time, burn length |
| PSI-101, 102 | SAME-R, SAME | 109 + 8 | smoke from solids | no | no | 5 to 8 | smoke aging and particle data |
| PSI-107 | SPICE | 469 | gas jet soot | air only | no | 36 (air rate) | none |
| PSI-20, 21, 22, 23 | ACME BRE, CLD, E-FIELD, s-Flame | 18 to 32 each | gas | per test day, several values in one cell | about 1 atm | no | flames ignited count |
| PSI-68 | FLEX-2 | 8 | droplet | ranges only | ranges only | 0.1 to 5 | none |
| PSI-47, 142 | DAFT, cool flame summary | 2, 8 | n/a | no | no | no | none |

Pressure conversions used: 1 atm = 14.696 psi, 1 bar = 14.504 psi, 1 mmHg = 0.019337 psi.

## Against the 12:30 gate

- **989 plottable rows** (O2 and pressure both per test) from **4 investigations** (CFI-G, Flame Design, FLEX, CFI).
  225 distinct conditions. The gate (60 rows from 3 investigations) passes.
- 315 rows lie within 0.6 psi of the sea-level oxygen curve (`o2_fraction * pressure = 3.07 psi`).
- 39 rows fall in the Moon Base box (8 to 12.5 psi, 24 to 40% O2): 33 FLEX, 6 CFI-G.

## What this means

- **The finding.** Every test that varies pressure burns a gas or a droplet. The solid materials that burn in a cabin
  (BASS, BASS-II, SAFFIRE) have no pressure in NASA's tables, and their oxygen went no higher than 22%. NASA has low-pressure,
  high-oxygen flame data, but none for cabin materials at Moon Base conditions. Add `fuel_phase` (gas, droplet,
  solid) as a map toggle so this shows at a glance.
- **Solid rows:** superseded (Nov 15). This line once suggested plotting them at an assumed cabin pressure of about
  14.7 psi. Do not: no investigation text states their pressure, so `pressure_psi` stays null and they are not
  plotted (see `field_notes.pressure_from` in `data/tests.meta.json`). Pressure stays null unless a cited source gives it.
- **3D view gate will likely fail.** The pressure-varying tests ran in quiescent chambers with no flow figure, so
  far fewer than half the rows have `flow_cm_s`. Leave `flow_cm_s` null there; do not assume 0.
- **Outcome is weaker than it looks.** These fuels were chosen to burn. CFI-G ignited versus failed to ignite
  (61 failures) is the best flammability signal. The predictor must say it describes these fuels, not cabin materials.
- **Messy cells to handle:** `~ 21.5`, `21.5 - 21.7`, `RAMPED`, units inside cells (`1 atm`, `20 cm/s`), several O2
  values in one cell (ACME BRE), mixed case (`Yes`, `yes`). Parse to numbers or `null`; never guess.
