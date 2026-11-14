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
