# Learning refinement

AI-assisted by OpenAI Codex. Scope: the isolated Codex checkout, requested by the user after reviewing the first refinement.

The learning page needs experiments that explain a relationship, rather than illustrations with controls attached. Each science lesson will open with an activity, with separate Watch and Explanation views. The narration remains the team's original recording. The copy uses Analysis consistently and explains what a displayed number actually describes.

## Activities

| Lesson | What the visitor does | What it teaches | Evidence boundary |
|---|---|---|---|
| Fuel, oxygen and heat | Interrupt each supply and restore it | A flame requires all three | A binary concept model, no ignition threshold |
| Gravity and flow | Change gravity and turn a ventilation fan on | Buoyancy and forced flow are different sources of motion | Shapes and particles illustrate direction, not NASA measurements |
| Oxygen partial pressure | Match a reference at a different total pressure | Oxygen percent and partial pressure are different quantities | Dry gas calculation, no physiological suitability assessment |
| Dilution | Keep six oxygen molecules, vary the nitrogen around them | Dilution changes how much inert gas accompanies each oxygen molecule | Binary oxygen/nitrogen mixture; no temperature prediction |
| Diffusion | Run the same particle spread at two pressures and compare | At fixed temperature/composition, diffusion increases as pressure falls | Relative diffusion model, no physical time or length scale |
| Recorded outcomes | Inspect actual FLEX rows, filter fuel and pressure, reveal an outcome | An observed outcome belongs to one recorded test, not every atmosphere with that oxygen level | Missing outcomes remain missing; no extrapolation to solids |

## Presentation

Keep the dark visual identity, but use theme tokens for both the landing gravity study and lesson diagrams. Animation must teach motion: inward diffusion, rising flow or transport by a fan. Provide pause and reduced-motion behavior. Activities work with keyboard controls and pointer input; no drag-only task. Record exploration progress locally and label it as explored, not mastered.

## Soundtrack

Compose an original, instrumental ambient score in Python using the standard library. Mix it quietly under the existing narration, with fades and narration-driven ducking. Copy each MP4's video stream without re-encoding it. Keep clean narration in the existing source folders and provide direct links to clean narration recordings. Use the installed imageio-ffmpeg tool, already referenced in the project.

## Scientific review

NASA's Combustion Science page and the existing Researcher's Guide were reread for the motion and ventilation explanations. Remove unqualified claims that equal dry oxygen partial pressure establishes breathing suitability. Replace claims that partial-gravity results must fall between Earth and microgravity outcomes with the narrower statement that this collection has no partial-gravity tests.

## Validation plan

Exercise every activity at endpoints, reset, pause, keyboard controls, lesson history, light/dark themes, reduced motion and phone/tablet/desktop sizes. Compare displayed FLEX records with source rows. Decode the six mixed files, verify video stream identity and duration, test actual video/audio playback and seeking, and check soundtrack peaks and speech/music levels. Rerun the existing application and offline-engine regressions. Keep results in `.qa/` and record remaining limits here.

## Final implementation and checks

All six activities are implemented in `site/assets/learning-labs.js`. Experiment, Watch lesson and Explanation are separate keyboard-accessible views. Exploration progress is stored on the device, with a clear action. The FLEX activity reveals actual source outcomes and compares two tests at 14% oxygen that recorded different outcomes with different fuels. Every test retains its filename and line.

The landing study and the gravity lesson share `studies.js`: directional transport paths, continuous gravity changes, ventilation and pause. Both use the active theme. The homepage uses Analysis and directly explains that 263 solid-material rows omit pressure. Text was reviewed with the Humanizer skill. NASA records were unchanged.

The six MP4s contain an original ambient score with fades and speech-driven ducking. Compressed video-stream hashes match the original files exactly. Durations and captions are unchanged. Mix mean levels range from -22.8 to -23.4 dBFS and peaks from -4.7 to -6.0 dBFS. Source voice files are preserved as `site/videos/*.voice.m4a`. No voice was regenerated and no third-party music was used.

An optional synchronized narration-only switch failed twice during sequential media tests. Work on that switch was stopped and reported, and it was removed. The stable player uses native controls and direct links to clean narration recordings. Native seeking also exposed the old local server's lack of byte-range support. The new standard-library preview server supports media byte ranges. Hidden videos release their requests and decoder resources, and restore their saved playheads when Watch is reopened.

- 146 learning/browser checks passed, including all activity calculations, real-record comparisons, six-video playback and seeking, source release and playhead restoration, history, keyboard tabs and persistent progress.
- 50 application/browser checks passed, including Analysis, CSV export, assistant citations, the flame lab and fallback, the one-page brief and navigation.
- The existing offline-engine checks passed. JavaScript syntax, Python compilation and Git whitespace checks passed.
- All six activities were captured and inspected in light and dark themes at 375, 768 and 1440 pixels. Reduced motion starts the flow study paused and supports an explicit opt-in to animation.

Evidence is in `.qa/learning/`, `.qa/audio/` and `.qa/results.json`. Tests use the installed Chrome browser and block Google Fonts to exercise local font fallbacks. Safari, Firefox, actual touch hardware and listening tests by a human remain unverified. Automated audio checks establish valid decoding, preserved timing and unclipped output, not a subjective listening assessment. Nothing was deployed or pushed; the parent checkout is unchanged.
