# Proposal: make the chat one of the main features

Author: AlanziM2. Status: idea, not agreed with the team. Written Fri Nov 13 as planning only (no project code).

## The idea in one line

The visitor types a question in plain words, and the page answers by changing itself: the map moves,
the graphs update, and a table of the relevant NASA tests appears, next to a short written answer.

Today's roadmap treats the chat ("Ask Flashpoint") as a collapsed side feature that only returns text
and is the first thing cut. This proposal raises it to one of the main features, equal to the map and
the probe panel, and lets it control them. It does not replace them: the map is still the core picture,
and a visitor can use either the chat or the manual controls to get the same result.

## Example

Visitor types: "There is 30% oxygen at 10 psi in Moon gravity. Can paper burn?"

The page then does all of this at once:

1. Moves the probe on the map to 30% oxygen, 10 psi.
2. Sets the gravity control to Moon, which shows the microgravity and Earth layers as the two bounds.
3. Highlights the flames (tests) closest to that point and dims the rest.
4. Shows a table of those tests: investigation, fuel, oxygen, pressure, airflow, gravity, outcome, PSI link.
5. Writes a short answer that cites the PSI records, and says plainly what is not covered
   (for example: no test used paper, no test ran at Moon gravity).

## What the chat can control

| Action | What changes on the page |
|---|---|
| Move the probe | The map marker, the evidence rating, the nearest tests |
| Set gravity | Which data layers are drawn |
| Filter the flames | By fuel, investigation, outcome, or fire-safety stage (prevent, detect, suppress) |
| Highlight investigations | Chosen studies glow, the rest dim |
| Show a table | Test rows or investigation rows, with the columns that fit the question |
| Show a comparison | Two or more investigations side by side (fuel, hardware, ranges tested, measurements) |
| Change the graph | Switch the view, for example the 2D map, the 3D view, or a simple chart of outcome against oxygen |
| Open the brief | The one-page evidence brief for the current point |

## Tables and views the chat can bring up

- **Nearest tests** to a point: the evidence behind an answer.
- **Investigation comparison**: how two studies differ and what they share.
- **Coverage gaps**: conditions with few or no tests near them.
- **Hardware view**: which experiments ran on which equipment (CIR, MDCA, MSG).
- **Fire-safety stage view**: the best studies for prevent, detect and suppress.

## How it works

The AI does not draw anything and does not produce numbers. It only does two things:

1. Picks actions from a fixed list (the table above), with their settings. For example:
   move probe to 30% and 10 psi, set gravity to Moon, show the nearest-tests table.
2. Writes the short text answer, using only the records it was given.

The page's own code then carries out the actions. Every number in a table or on a graph comes
straight from `data/tests.json` and `data/enriched.json`, never from the AI. This keeps the roadmap's
honesty rule: every number traces to a PSI record, and missing values stay empty.

Model providers call this "tool use" or "function calling". It works with Claude or with an OpenAI model.

## Page layout this implies

- A question box that is always visible next to the map (not collapsed), with three or four starter
  questions as buttons. The map keeps its place as the largest element.
- The map and graphs react to each question.
- A results area that holds the answer text and whichever table was asked for.
- Each answer shows what it changed (for example "Moved probe, set gravity to Moon"), with an undo.

## What stays the same

- The map, the probe, the gravity control and the cards still work by hand, with no AI.
  If the API is down, slow, or out of credit, the site is still a complete tool.
- The pressure against oxygen map stays the core picture.
- The data row format agreed between lanes does not change.

## Where this disagrees with the current roadmap

| Roadmap today | This proposal |
|---|---|
| Chat is a side feature, collapsed by default | Chat is one of the main features, always visible beside the map |
| Chat returns text only | Chat returns text plus actions that change the page |
| Chat is first on the cut list | Chat is a main feature, so it moves down the cut list and needs build time earlier (not Saturday 20:30) |
| AI at runtime is for briefs and chat only | Same, but the chat becomes a second way to drive the page, next to the manual controls |

These are changes to decisions marked "do not reopen", so the team lead has to agree before any of
this goes into the lane folders.

## Risks

- **Demo depends on a live API.** Mitigation: the manual controls always work, and the starter
  questions can have saved answers so they respond instantly even offline.
- **Wrong or invented answers.** Mitigation: the AI only picks actions and words; numbers come from
  the data files. It must cite PSI records and say when the catalogue does not cover the question.
- **Build time.** Mitigation: start with three actions (move probe, set gravity, show nearest-tests
  table) and add the rest only if time allows.
- **Cost and abuse.** A public page with a paid key needs limits on answer length and requests per visitor.

## Open questions

1. Does the team lead accept raising the chat to a main feature?
2. Which model and provider (the roadmap says Claude)?
3. Which actions make the first version, and which wait?
4. Should every answer be undoable in one click?
