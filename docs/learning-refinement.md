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

Compose an original, instrumental ambient score in Python using the standard library. Mix it quietly under the existing narration, with fades and narration-driven ducking. Copy each MP4's video stream without re-encoding it. Keep clean narration in the existing source folders. Export a narration-only audio option for visitors who turn music off. Use the installed imageio-ffmpeg tool, already referenced in the project.

## Scientific review

NASA's Combustion Science page and the existing Researcher's Guide were reread for the motion and ventilation explanations. Remove unqualified claims that equal dry oxygen partial pressure establishes breathing suitability. Replace claims that partial-gravity results must fall between Earth and microgravity outcomes with the narrower statement that this collection has no partial-gravity tests.

## Validation plan

Exercise every activity at endpoints, reset, pause, keyboard controls, lesson history, light/dark themes, reduced motion and phone/tablet/desktop sizes. Compare displayed FLEX records with source rows. Decode the six mixed files, verify video stream identity and duration, test actual video/audio playback and seeking, and check soundtrack peaks and speech/music levels. Rerun the existing application and offline-engine regressions. Keep results in `.qa/` and record remaining limits here.
