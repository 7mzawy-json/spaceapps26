# Challenge Resources tab (read 2026-11-14)

Source: the Resources tab of https://www.spaceappschallenge.org/2026/challenges/flame-in-freefall/
The tab lists exactly the ten links below (list given by the team; the page itself does not load from the agent's
cloud session). Each entry: what it is, then the facts we can use. Quotes are verbatim.

## 1. PSI database search (the data)

https://psi.nasa.gov/physci/repo/search?q=combustion&data_source=psi&data_type=investigation

- JSON behind it: `https://psi.nasa.gov/geode-py/ws/repo/search?q=combustion&data_source=psi&data_type=investigation&size=100`
- **`q=combustion` does not filter.** It returns all 133 investigations. Filter on `Research Area == "Combustion Science"`.
- **Pagination is `from=100`** for the second page. `page=2` and `start=100` are ignored (they return page 1 again).
- Record fields: Accession, Acronym, Approach, Data Source Type, Experiment Hardware, Flight Platform, Funding Source,
  Hypothesis, Investigation Start/End Date, Keywords, Monitoring Center, Objectives, Person, Project Type,
  Proposal Title, Public Release Date, Publication Author List, Publication Title, Related Investigations,
  Research Area, Research Impacts/Earth Benefits, Sponsoring Agency, SubResearch Area, Thumbnail, Title.
- **24 Combustion Science records** (20 flight, 4 analysis or ground studies):

| Accession | Acronym | Platform |
|---|---|---|
| PSI-10 | ACME/Flame Design | ISS |
| PSI-20 | ACME BRE | ISS |
| PSI-21 | ACME CLD Flame | ISS |
| PSI-22 | ACME E-FIELD Flames | ISS |
| PSI-23 | ACME s-Flame | ISS |
| PSI-159 | ACME CFI-G | ISS |
| PSI-25 | BASS-II | ISS |
| PSI-26 | BASS | ISS |
| PSI-39 | CFI | ISS |
| PSI-47 | DAFT / DAFT-2 | ISS |
| PSI-68 | FLEX-2 | ISS |
| PSI-69 | FLEX | ISS |
| PSI-98 | SAFFIRE-I | ISS |
| PSI-99 | SAFFIRE-II | Cygnus spacecraft |
| PSI-100 | SAFFIRE-III | ISS |
| PSI-101 | SAME-R | ISS |
| PSI-102 | SAME | ISS |
| PSI-106 | SLICE | ISS |
| PSI-107 | SPICE | ISS |
| PSI-60 | (none) Computational and Experimental Analysis of SPICE Data Sets | ground |
| PSI-62 | (none) Concurrent Flame Spread Modeling using Flamelet Generated Manifolds | ground |
| PSI-115 | (none) Utilization of the SAME Data for Advanced ... | not applicable |
| PSI-117 | (none) Effect of External Thermo-Convective Perturbation on Cool Flame Dynamics | ground |
| PSI-142 | (none) Quantitative Studies of Cool Flame Transitions at Radiation / Stretch ... | not applicable |

Only the catalogue listing was read. No test-level files were opened or downloaded.

## 2. Glenn Research Center: Combustion Science

https://www.nasa.gov/glenn/glenn-expertise-space-exploration/physical-sciences-program/combustion-science/

- Why gravity matters: flame about 2,300 K against about 300 K ambient gives "an eight-fold density change over the
  scale of a centimeter". That buoyant flow makes flames lift, point up and flicker.
- **Current experiments (not in PSI yet), useful for the "what comes next" part of a brief:**
  - **FM2, Flammability of Materials on the Moon:** "the first-ever combustion experiment to be performed on another
    planetary body", burning materials at 1/6 g. Image on the page: SIBAL fabric (cotton-fiberglass) burning in air
    in simulated lunar gravity (drop tower centrifuge).
  - **SoFIE, Solid Fuel Ignition and Extinction:** NASA-STD-6001 sets a 1-g flame propagation test for flight
    materials "which some researchers believe is not conservative in low-g".
  - **FLARE, Flammability Limits At Reduced-g Experiment:** a method to estimate microgravity flammability limits
    from ground data. JAXA, NASA, ESA, CNES, DLR.
- Archived: ACME, BASS, DAFT, FLEX, Saffire, SAME, SLICE, SPICE (one-line descriptions only).
- Hardware: Combustion Integrated Rack (CIR), 100-liter chamber, in Destiny, launched Nov 2008 on STS-126,
  "the only rack on ISS dedicated to combustion". MDCA is the droplet insert used in the CIR.

## 3. YouTube video

https://www.youtube.com/watch?v=W1oXykoz9zg

Watched by AlanziM2 on Nov 14. Notes from memory, not a transcript.

- Explains why microgravity combustion matters and how a flame behaves differently on Earth and in space.
- Main point: without gravity there are fewer variables (no buoyant flow), so flames are simpler to study and the
  experiments can be more efficient. This matches the Glenn page above and the spherical-flame argument in
  `alanzim/tabs-dashboard-idea.md`.
- A speaker, Mr Stocker, says there are many surprises ahead from this research (paraphrased). Possibly Dennis
  Stocker of NASA Glenn, a co-author of the Researcher's Guide (item 4). Check the exact words and his role in the
  video before quoting him in the pitch.

## 4. A Researcher's Guide to: Combustion Science (ISS Researcher's Guide, Oct 2015)

https://www.nasa.gov/missions/station/a-researchers-guide-to-combustion-science/
PDF (56 pages): https://www.nasa.gov/wp-content/uploads/2016/05/np-2015-10-034-jsc_combustion_in_reduced_gravity-iss-mini-book-011116-508.pdf
Authors: Gokoglu, Dietrich, Stocker, Ferkul, Olson, Hicks (NASA Glenn / USRA).

The most useful resource for us. Key findings, with page numbers of the PDF:

- **Airflow is the hidden third axis (p. 18, 30).** "In the low-flow conditions of microgravity or partial gravity,
  some materials are flammable at lower oxygen concentrations than in normal gravity." The flammability boundary
  against flow speed has a minimum: "the characteristic gas velocity of the minimum in the curve is on the order of
  10 cm/s ... this is the velocity typical of that of spacecraft ventilation systems."
- **Spacecraft ventilation range is 0 to 30 cm/s (p. 20).**
- **NASA's ground test may not be safe enough (p. 30).** "Recent results from the BASS experiment currently running
  on the ISS indicate that NASA-STD-6001 Test 1 is not conservative, and materials can burn at lower oxygen levels
  in microgravity than on Earth."
- **Local suppression can fail (p. 30).** "local application of suppressant is not adequate for flame
  extinguishment. The local jet entrains air and sustains the flame even when the ambient airflow is turned off."
- **Flames spread upstream in low flow (p. 18, 30)**, the opposite of normal gravity.
- **Ignition is easier (p. 18, 23):** less natural convective cooling; the critical heat flux for ignition "in
  microgravity can be as short as half the value measured in normal gravity".
- **Suppressant margins (p. 12), FLEX:** "the flammability limit is lower in reduced gravity. The implication is that
  terrestrial standards for inert gas suppressants in low gravity do not offer the same margin of safety as in
  normal gravity." FLEX burned heptane and methanol droplets in O2/N2 diluted with N2, CO2, He or Xe.
- **BASS hypothesis (p. 21):** "materials in microgravity, with adequate ventilation, burn as well if not better than
  the same material in normal gravity with other conditions being identical (pressure, oxygen concentration,
  temperature, etc.)."
- **Space Exploration Atmospheres (SEA)** with reduced pressure and elevated oxygen are named as a test goal
  (p. 20, 24, 38), and "there exists no testing methodology specifically designed to determine the fire hazard of
  materials under those conditions" (p. 24).
- **Detection (p. 26, 34):** smoke particle sizes differ in microgravity, so terrestrial detectors "would be 'looking'
  for something different than they should". DAFT measured background aerosol on ISS; SAME measured smoke
  particle sizes from spacecraft materials.
- **Water mist (p. 26):** Mist experiment on STS-107 (2003). Water-mist portable extinguishers started replacing
  the ISS CO2 units in December 2015.

## 5. Apollo 1 (NASA Safety and Mission Assurance)

https://sma.nasa.gov/sma-disciplines/accllp/apollo-1

- Jan 27, 1967, launch pad test, "cabin pressurized with 100% oxygen". A flash fire; the crew died of "asphyxia from
  carbon monoxide and other toxic gases"; "Their burns were likely survivable."
- No ignition source found; evidence of arcing in wiring near the environmental control system. "Because of the pure
  oxygen atmosphere, the fire spread quickly", pressure rose and the cabin ruptured. The three-piece hatch took
  90 seconds to open under ideal conditions.
- Lessons: a hatch that opens in three seconds, "severely restricted and controlled the number of combustible
  materials", fire-resistant spacesuit materials.
- Source error to avoid copying: one paragraph names "Robert Chaffee"; the astronaut was Roger Chaffee.

## 6. Apollo 13 (NASA Safety and Mission Assurance)

https://sma.nasa.gov/sma-disciplines/accllp/apollo-13

- April 1970, oxygen tank 2 exploded on day three. Cause: heater voltage raised from 28 to 65 V DC without
  upgrading the thermostatic switches; during a pad test the heaters reached about 1000 F and degraded the Teflon
  insulation inside the oxygen tank.
- Apollo 1 wiring insulation upgrades are credited with preventing arcing when the cold, wet command module was
  powered back up.
- Lessons: third oxygen tank in a separate bay, upgraded thermostats, stirring fans removed, wiring sheathed in
  stainless steel.
- Source error to avoid copying: the page swaps two roles. Swigert was Command Module Pilot and Haise was Lunar
  Module Pilot.

## 7. 25 Years Ago: Fire Aboard Space Station Mir

https://www.nasa.gov/history/25-years-ago-fire-aboard-space-station-mir/

- Feb 24, 1997, six crew aboard (handover period). A solid fuel oxygen generator (SFOG, lithium perchlorate canister)
  burst into flames after more than 2,500 uneventful uses on Mir.
- The flame lasted several minutes, blocked access to one of the two Soyuz escape vehicles and filled the modules
  with smoke. Life support cleared the smoke over several hours.
- Lessons: new crew emergency training, ground support procedures, canister preparation. ISS now has dissimilar
  redundant oxygen generation (Elektron units, US Oxygen Generation System, SFOG as backup).

## 8 to 10. NASA Spinoff (Earth applications)

- https://spinoff.nasa.gov/node/9582 **Fireman's Air Tanks.** With NASA JSC, Scott Aviation built a 20 lb backpack
  with 30 minutes of air, 13 lb lighter than conventional tanks, 4,500 psi, aluminum liner wrapped in glass fiber.
- https://spinoff.nasa.gov/node/9407 **Fire Detector.** The Brunswick Incipient Fire Detector from the Space Shuttle
  tells combustion particles from dust, so fewer false alarms, and signals "before appearance of flame and smoke".
- https://spinoff.nasa.gov/node/9918 **New Technology for the Fire Attire.** Project FIRES (NASA with FEMA's US Fire
  Administration, managed by Marshall) used fire-resistant, heat-protective spacesuit and spacecraft materials in
  firefighter gear, field-tested by fourteen fire departments.

## What this means for Flashpoint

- The three historical fires map to the three pillars and to oxygen: Apollo 1 (100% O2 atmosphere, materials,
  prevention), Apollo 13 (oxygen system ignition), Mir (oxygen generator fire, smoke, suppression and detection).
- The researcher's guide backs our core claim with NASA's own words: ground tests are not conservative, flow
  matters, and no test method exists for exploration atmospheres. Cite p. 24 and p. 30 in the pitch.
- Airflow (0 to 30 cm/s, worst case near 10 cm/s) supports keeping `flow_cm_s` in `tests.json` and the 3D view.
- FM2, SoFIE and FLARE are the honest answer to "how would the gap close": name them in briefs as upcoming work,
  but they are not in PSI and have no data on the map.
- Spinoffs give the Earth-applications line (detection, air tanks, protective gear).
