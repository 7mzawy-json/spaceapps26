# Idea: a dashboard with tabs, built for real use

Author: AlanziM2. Status: idea, not yet agreed with the team. Written Fri Nov 13 as planning only (no project code).

## Goal

Realism and real-world use over looks. Each tab does one job that a researcher, engineer or student
would otherwise do by hand. It should still look good, but the numbers come first.

NASA's own description of the problem: the combustion data is "hard to find, harder to compare, and
harder yet to interpret". The tabs map onto that.

## The tabs

### 1. Ask

The visitor describes a problem in their own words. The AI works through NASA's test data and answers it.

- Example: "Which materials stopped burning below 18% oxygen, and under what airflow?"
- Output: a written answer, the table of tests it used, and a graph. Every row links to its PSI record.
- The AI may only use the records it is given. When the data does not cover the question, it says so.
- See `chat-first-design.md` for how the chat can also change the graphs and tables on the page.

### 2. Simulate

A simulator that aims for realism, not decoration. It shows the oxygen level and other values as
numbers with a legend, and still looks good.

What is realistic to build:

- A full fire simulation of the kind research labs run needs far more computing and time than a
  weekend and a browser allow. That is out of scope.
- A flame around a fuel droplet in microgravity is a sphere. That symmetry makes the standard
  textbook equations simple enough to compute live in the browser.

So the plan is a physics model of a spherical flame in freefall:

- Inputs: oxygen percentage, pressure, fuel.
- Display: the flame, and the oxygen concentration around it as a colour field with a numbered legend.
- Readouts: burn rate, flame size, time to burn out.
- Validation: next to each prediction, show what NASA measured in the droplet experiments (FLEX and
  related), and the difference between the two. This is what makes it trustworthy.

Limits to state on the page:

- Spherical flames only. For burning solids with airflow there is no simple model we can stand
  behind, so that case shows measured data only.
- The simple model will not capture everything, for example exactly when a flame goes out.
- The equations must be checked against a combustion textbook before building.

A second mode, if time allows: replay a real test and watch its measured values play out.

### 3. Compare

Pick two or more experiments, or two sets of conditions, and see them side by side in the same units:
fuel, oxygen range, pressure, airflow, what was measured, what was found.

### 4. Explore

The full table of every test, searchable and filterable, with a download button. The least glamorous
tab and probably the one a real researcher uses most. The atmosphere map from the current roadmap can
live here as one of its views.

## What all tabs depend on

One cleaned table of tests in a consistent format (`data/tests.json` in the roadmap). Every tab reads
from it, so it is the first thing to build on Saturday. If the per-test files from NASA turn out to be
thin, the tabs shrink to what the data supports. Nothing is invented.

## How this differs from the current roadmap

| Roadmap today | This idea |
|---|---|
| One page centred on the pressure and oxygen map | Four tabs, each with one job |
| Chat is a small side feature | Ask is a full tab |
| Flame visual is an illustration of a model's output | Simulate is a physics model checked against NASA measurements |
| Comparison is not a feature | Compare is a full tab |

This is a restructure, so the whole team needs to agree before the hackathon starts on Saturday at 09:30.

## Open questions

1. Does the team agree to the tab structure?
2. Which tabs are the minimum for the demo, and which wait?
3. Do NASA's droplet experiment files contain the measurements needed to validate the simulator?
4. Who checks the simulator's equations?
