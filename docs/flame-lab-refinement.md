# Flame lab refinement

AI-assisted by OpenAI Codex. Requested by the user for the isolated Codex clone.

## Design

Keep Geist/Geist Mono, the current navy/orange palette and light theme. One live WebGL chamber avoids running two expensive solvers. A pinned canvas image provides a static comparison using the same full-chamber camera. The chamber and short control column form a 7/5 desktop split, stacking on phones. Keep numeric model telemetry behind explicit inspection. Use short opacity changes for guided steps; the model's own motion supplies the main animation, with pause and reduced-motion support.

The primary demonstration has four steps: inspect one actual recorded test, add gravity without changing its atmosphere, add ventilation at zero gravity, then illustrate a recorded self-extinction outcome. Every step explains what changed and what NASA actually recorded. Time in the replay is illustrative, not a measured test duration.

## Audit and scope

- The default test has an unknown outcome, a poor starting point for a presentation.
- Long readouts push the gravity and pressure controls below the chamber.
- Pointer stirring changes the model but does not invalidate the recorded-conditions label.
- A modified atmosphere loses the selected fuel context, while every fuel uses the same hand-tuned coefficients.
- Reset/clear/ignite have overlapping meanings; CSS fallback replay timing diverges from the main clock.
- Camera zoom changes with gravity, so a visual comparison must use a common camera.
- Airflow and flow arrows are hidden, despite their value in explaining microgravity combustion.
- Analysis exports a rectangular neighborhood while its evidence count uses an ellipse.

No new dependency, dataset or external image. Source rows, lesson narration and soundtrack remain unchanged. Work stays local in Codex.

## Verification plan

Verify all four demo steps, the chosen record and its source, each changed variable, exact restoration, pinning, shared setup links, replay/extinction/pause, stirring, optional inspection, WebGL and forced fallback. Inspect phone/tablet/desktop layouts and themes. Verify the Analysis neighborhood export agrees with the displayed count. Rerun learning/media, application and offline-engine suites, then inspect final screenshots.

## Implementation

The lab opens with FLEX test N01H202: 21% oxygen, 14.75 psi, heptane, recorded as kept burning, from `PSI-69_Experimental table_FLEX.csv`, line 208. Its four-step demonstration adds gravity at the same atmosphere, adds ventilation at zero gravity, then selects an actual recorded extinction. The NASA reference card stays separate from live settings. Model time, colours, shape and transport fields are explicitly illustrative. Shared reaction coefficients do not create fuel-specific predictions.

Pinning captures the rendered chamber and its arrow overlay with a common full-chamber camera. A frozen reference uses no second solver. Layer names, original settings and changed settings accompany the comparison. Setup links restore numeric settings and source identity while preserving custom-condition provenance. They do not promise to reproduce a stirred fluid field.

Ventilation and optional gas stirring reveal transport, while Oxygen and Gas flow views explain their own scales. Stirring invalidates the undisturbed-record label. An accessible gas-pulse button provides the same kind of interaction without dragging. Phone controls sit beside the live view. Optional inspection, atmosphere controls and method details are collapsed to keep the main demonstration readable.

The audit also corrected slider handlers that rounded the untouched source variable, fallback replay/pause behavior, paused reduced-motion rendering, delayed first-visit atmosphere transfer, and stale view explanations. Analysis drill-down now uses exactly the same elliptical neighborhood as the evidence count and CSV export. Learn has a functioning skip link and an updated lab guide. The local preview logs errors by default so lengthy audits cannot fill its process output buffer; `--verbose` restores request logging.

## Final checks

- `python scripts/check_flame_lab.py`: 99 passing checks. These cover provenance, all four demo steps, exact values, shared links, comparison camera and captured arrows, replay, custom conditions, unknown outcomes, keyboard gas pulse, stirring, both rendering paths, reduced motion, missing data and deliberately delayed first-visit transfer.
- `python scripts/check_learning.py`: 146 passing checks, including six-video decoding, playback, seeking and playhead restoration.
- `python scripts/check_experience.py`: 50 passing application checks, including navigation, map inputs, filtered CSVs, the printed brief, iframe theme/activity and atmosphere transfer.
- `node scripts/check_offline_native.mjs`: existing evidence and offline-answer checks passed. JavaScript syntax, Python compilation and Git whitespace checks passed.

Screenshots were inspected at 375, 768 and 1440 pixels in light and dark themes. Test artifacts are local in `.qa/flame-lab/`, `.qa/learning/` and `.qa/`. Chrome was exercised with software WebGL; Safari, Firefox and physical touch devices remain unverified. The fluid model is still illustrative, with hand-tuned coefficients and no calibrated size, time or fan-speed scale. NASA rows, videos and recorded narration were unchanged in this phase. No runtime dependency, external image or dataset was added. All work is local in the isolated Codex clone; nothing was pushed or deployed.
