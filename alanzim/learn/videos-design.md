# Learners page videos: design

Draft, Sat Nov 14 (evening). Owner: AlanziM2. The video sources live in `alanzim/learn/videos/` (not deployed); the
finished videos are written to `site/videos/` and play on the learners page, `site/learn.html` (moved there on Nov 14, night).

## Intent

Each of the six Flame science lessons on the learners page (`alanzim/learn/index.html`) gets a short narrated video
that explains the lesson's idea before the learner plays with the interactive part. The videos teach; the interactive
parts let the learner check what they were told.

Tone: calm, scientific narration. Look: flat geometric animation in the spirit of science explainer channels such as
Kurzgesagt (bold shapes, clean gradients, smooth motion on a dark space background). All drawings are original; nothing
is copied from any channel (no characters, birds, logos or frames).

## Goals

- Six videos, one per lesson 1.1 to 1.6, about 60 seconds each (roughly 140 to 160 spoken words).
- Narrated by a neural AI voice that sounds natural.
- Each video shows the lesson's formula and, where the lesson has one, the same NASA number the lesson counts from the data.
- Real MP4 files: they play on the learners page and can also go on YouTube or into the 30-second submission demo.
- Captions for every video (WebVTT), made from the script.

## Non-goals

- No background music (licensing and time). Can be added later.
- No video for Track 2 (Using Flashpoint) for now.
- No live rendering in the visitor's browser: the page plays finished MP4s.

## Anti-goals (a failure even if it plays)

- A number in a video that does not match the lesson or NASA's data.
- An illustration presented as a measurement. Physics pictures carry the same "illustration" wording the lesson uses.
- Missing the AI watermark (submission rule, `docs/challenge/submission-and-awards.md`).

## Constraints

- NASA rule: AI-generated video needs a **visible watermark**. Every frame carries a small "AI" badge in the bottom-right corner
  (the user chose a small badge over the longer line; the full disclosure is in `docs/ai-usage-log.md`). No AI note under the videos on the page.
- No NASA logos or insignia in any frame.
- AGENTS.md: no em dash or en dash anywhere, including scripts and captions. AI use logged in `docs/ai-usage-log.md`,
  and the voice service and every tool listed in its References.
- The API key lives in `.env.local` (gitignored), never in git.
- Deadline: feature freeze Sun Nov 15, 12:00. Pilot first, then the other five.
- The machine has Python 3.13 only (no ffmpeg, no Node). Build tools must install with pip and need no clicks.

## Approaches considered

| Approach | Trade-off | Verdict |
|---|---|---|
| **HTML and SVG scenes, rendered frame by frame to MP4 in a headless browser** | Fast to iterate (each scene previews live in the browser pane), crisp shapes, same fonts and colours as the site. Needs `playwright` (with its Chromium) and `imageio-ffmpeg` as build-only tools | **Chosen** (AI's call: the user asked for the outcome, not the method) |
| Manim (Python maths animation library) | Made for geometric science animation, but heavier install (needs ffmpeg and more), slower to restyle to the site's look | Dropped |
| Animations played live on the page with an audio track, no MP4 | No installs, but not a real video: cannot be uploaded or reused in the demo | Dropped |

Voice, chosen by the user: **neural AI voice** (over a teammate recording it). Service: see "Open for the user".

## How it works

```
alanzim/learn/videos/
  scripts/1-1.json ... 1-6.json   narration split into sentences, each with the scene beat it drives
  scenes/1-1.html ... 1-6.html    the animation, one HTML page per video, driven by a timeline
  scenes/engine.js                shared timeline: tweens, easing, seek(t), watermark, caption bar
  tts.py                          one audio clip per sentence from the voice service, cached by text
  render.py                       steps each scene frame by frame, joins frames and audio into MP4
  out/1-1.mp4, 1-1.vtt, 1-1.jpg   the video, its captions, its poster frame
```

1. **Script.** Each video's narration is a list of sentences. Each sentence names the scene beat it goes with
   (for example "sphere forms", "gravity on", "formula appears").
2. **Voice.** `tts.py` sends each sentence to the voice service once and saves the audio. Clips are cached by their text,
   so editing one sentence only re-records that sentence. The clips are joined with short pauses, and their lengths give
   the exact start time of every sentence.
3. **Scene.** Each scene is an HTML page with SVG shapes animated by a small timeline (`engine.js`). Beats start at their
   sentence's start time, so the picture always matches the words. The page has a `seek(t)` function that draws the exact
   frame for time `t`, which makes rendering deterministic.
4. **Render.** `render.py` opens the scene in headless Chromium at 1920 x 1080, calls `seek(t)` for every frame at 30 fps,
   takes a screenshot, and streams the frames into ffmpeg (from `imageio-ffmpeg`) together with the narration.
   Output: H.264 MP4 with AAC audio, target under 8 MB per video, plus captions and a poster image.
5. **Page.** Each lesson on the learners page gets a "Watch (1 min)" video at the top, with captions on and the poster
   frame shown before play. The interactive part stays below it.

## Look

- Background: deep navy (the site's `--chamber`, #05173a) with a soft radial glow and faint star dots.
- Colours: the site's blue for interface and oxygen, NASA red-orange (#FC3D21) and warm amber for flames, teal for
  "went out", grey for nitrogen. Same meanings as on the site.
- Shapes: flat circles, rounded rectangles, simple molecules (two joined circles), thick rounded strokes, gentle long shadows.
- Motion: ease-out entrances, small overshoot on pops, nothing faster than 250 ms. Formulas type in or assemble piece by piece.
- Text: Geist for labels, Geist Mono for formulas and numbers (the site's fonts).
- Watermark: bottom-right, a small "AI" badge at half opacity, always visible.
- Motion (refined after the user's review): 60 fps, a slow camera drift, drifting background light and a vignette, labels that rise
  in and lift away, and in 1.2 the flame gliding onto the gravity scale. Narration unchanged.

## The six videos (beats)

| Video | Beats |
|---|---|
| 1.1 What a flame needs | Triangle of fuel, oxygen and heat assembles; each side removed in turn puts the flame out; fuel and oxygen meet in a thin glowing zone (diffusion flame); propane equation builds; the three fuel kinds with NASA's counts (660 gas, 353 droplet, 263 solid tests) |
| 1.2 Gravity and the shape of fire (pilot) | Candle on Earth: hot gas (light circles) rises, cool air (dense circles) flows in, teardrop forms; formula F = (rho air minus rho hot) x g; set g to 0, arrows vanish, flame relaxes into a blue sphere; Moon and Mars on a gravity scale between 0 and 1 g; "every one of NASA's 1,276 tests ran at 0 g" |
| 1.3 Oxygen percent vs oxygen pressure | A box of molecules; percent as a share of the crowd; partial pressure as the push of the oxygen alone; the ISS, Moon Base and suit boxes, each with its pO2; the sea-level curve drawn on the map |
| 1.4 Why more oxygen burns hotter | One oxygen molecule with its 3.76 nitrogen companions soaking up heat; swap to the Moon Base (2.33) and the suit (0); flame grows hotter; helium and CO2 as diluents |
| 1.5 Low pressure and mixing | Molecules spaced further apart, fewer collisions, faster spread; D proportional to 1/P; spread ring grows; Moon Base pressure; "33 NASA tests in the Moon Base range, all droplets" |
| 1.6 How flames go out | Heat in vs heat out as two bars; flame shrinks when losses win; flammability limit; FLEX bars by oxygen band, with the caution that FLEX changed other things too |

## Narration is recorded once (user's requirement: limited credits)

The ElevenLabs free plan gives 10,000 characters a month (0 used on Nov 14). The six scripts below total **5,124
characters**, so one full redo still fits, but the aim is to record each video exactly once.

- **Scripts are approved before any audio is made.** A recorded script cannot be edited without paying again.
- **Voice is picked from ElevenLabs' free preview clips**, not from paid test recordings.
- **One request per video** (six in total), using the text-to-speech "with timestamps" call. It returns the audio and the
  time of every character, so sentence timings and captions come from the same single recording. Model:
  `eleven_multilingual_v2`, output MP3 at 44.1 kHz, 128 kbps.
- **Saved and committed:** `alanzim/learn/videos/narration/1-2.mp3` plus `1-2.timing.json` (the timestamps and a hash of
  the script text). They are committed to git, so no teammate ever regenerates them.
- **`tts.py` guards the credits:**
  - it does nothing without the flag `--spend`; without it, it only prints what it would send, the character count, and the
    remaining allowance (a free call);
  - it skips any video whose MP3 already exists;
  - if a script changed after its recording, it warns and still skips, unless the video is named with `--redo 1-2`.
- **Until the recording is made**, scenes are timed against a stand-in track from the Windows voice (free, offline), kept in
  `narration-draft/` and never committed. Swapping in the real MP3 re-times the scene from its timestamps.
- **Spoken and shown text can differ.** Units are spoken in full ("pounds per square inch") so the voice reads them right;
  captions and on-screen labels show "psi".

## Scripts (for approval before recording)

Counted from `data/tests.web.json` on Nov 14: 1,276 rows; 660 gas, 353 droplet, 263 solid; 33 in the Moon Base range,
all FLEX droplets; FLEX below 15% oxygen: 27 of 28 went out; 30 to 50%: 2 went out, 4 kept burning, 18 not recorded.

### 1.1 What a flame needs (143 words, about 57 s)
1. Every fire, from a candle to a spacecraft emergency, needs three things at once: fuel, oxygen, and heat.
2. Take any one of them away, and the fire goes out.
3. That simple triangle is the basis of fire safety: prevent, detect, and suppress.
4. Most fires in a cabin are diffusion flames.
5. Fuel and oxygen start apart, and they only burn where they meet, in a thin glowing layer.
6. Every fuel uses a fixed amount of oxygen. One molecule of propane needs five molecules of oxygen to burn completely.
7. If the oxygen near the flame runs low, the burning slows down.
8. NASA has tested three kinds of fuel in microgravity: gases, liquid droplets, and solids.
9. This database holds 660 gas flame tests, 353 droplet tests, and 263 tests of solid materials.
10. Solids matter most, because a spacecraft is full of them: fabric, plastic, and wiring.

### 1.2 Gravity and the shape of fire (pilot; 156 words, about 62 s)
1. On Earth, a flame has a shape we all know: a flickering teardrop.
2. That shape comes from gravity.
3. Gas heated by the flame is lighter than the air around it, so it rises, and cooler air rushes in underneath.
4. The push on that hot gas is the difference in density, times gravity.
5. Now take gravity away.
6. On the space station, nothing is lighter or heavier. Hot gas stays where it is.
7. Oxygen can only reach the flame by slowly drifting in, so the flame becomes a small, steady, dim blue sphere.
8. Without fresh air arriving, a flame in orbit can even smother itself.
9. The Moon and Mars sit in between, at one sixth and about three eighths of Earth's gravity.
10. Every one of NASA's 1,276 fire tests in this database ran in microgravity. Nobody has measured a fire at Moon gravity yet.
11. So for a Moon Base, the honest answer lies somewhere between space and Earth.

### 1.3 Oxygen percent vs oxygen pressure (155 words, about 62 s)
1. Two numbers describe the oxygen in a cabin, and they mean very different things.
2. The first is oxygen percent: what share of the gas molecules are oxygen. It controls how easily things burn.
3. The second is oxygen partial pressure: how hard the oxygen alone pushes. It controls whether you can breathe.
4. To find it, multiply the oxygen share by the total pressure.
5. At sea level, that is about twenty one percent of 14.7 pounds per square inch, or 3.07.
6. Astronauts heading out on spacewalks are helped by a lower cabin pressure.
7. But lower the pressure, and you must raise the oxygen percent to keep breathing the same.
8. A planned Moon Base at 10.2 pounds per square inch needs about thirty percent oxygen.
9. Its crew would breathe just as they do on Earth, but the air around them would be far more flammable.
10. That trade, easier spacewalks against greater fire risk, is exactly what Flashpoint maps.

### 1.4 Why more oxygen burns hotter (155 words, about 62 s)
1. Nitrogen does not burn, but it still plays a big part in every fire.
2. In Earth's air, every oxygen molecule comes with almost four molecules of nitrogen.
3. A flame has to heat all of that nitrogen too. It acts like a sponge, soaking up heat.
4. Raise the oxygen percent, and there is less nitrogen to share the heat.
5. In a Moon Base atmosphere of thirty percent oxygen, each oxygen molecule brings only about two and a third nitrogen molecules.
6. In a spacesuit, filled with pure oxygen, there is none at all.
7. With less nitrogen to warm, the flame burns hotter, spreads faster, and is harder to put out.
8. This is why the same breathing does not mean the same fire risk.
9. It also explains how some extinguishers work. Carbon dioxide or helium dilutes the oxygen and carries heat away from the flame.
10. NASA's FLEX experiment tested exactly that, on burning droplets aboard the space station.

### 1.5 Low pressure and mixing (143 words, about 57 s)
1. Pressure changes how fast gases mix.
2. At lower pressure, gas molecules are further apart, so they collide less often and spread out faster.
3. Halve the pressure, and gases spread about twice as fast.
4. On Earth, rising hot air does most of the mixing, so this barely matters.
5. In microgravity, spreading is the only way oxygen reaches a flame, so it matters a great deal.
6. At low pressure, oxygen arrives from further away. The flame grows larger, and dimmer.
7. A Moon Base would run at about 10.2 pounds per square inch, well below the space station's 14.7.
8. So the evidence that counts comes from tests at the right pressure, not only the right oxygen percent.
9. NASA's database holds 33 microgravity tests in the Moon Base range.
10. All of them burned fuel droplets. None tested a gas flame or a cabin material in that atmosphere.

### 1.6 How flames go out (154 words, about 62 s)
1. A flame survives only while it makes heat faster than it loses it.
2. Lower the oxygen, and the flame makes less heat.
3. At some point the losses win, and the flame goes out on its own.
4. The oxygen level where that happens is called the flammability limit. For choosing cabin materials, it may be the most useful number there is.
5. NASA's FLEX experiment burned hundreds of fuel droplets at different oxygen levels.
6. Below fifteen percent oxygen, twenty seven of twenty eight droplet flames went out on their own.
7. Between thirty and fifty percent, only two of twenty four did. Four kept burning, and the rest were not recorded.
8. FLEX changed other things too, like the fuel and the pressure, so this is a pattern, not a controlled test of oxygen alone.
9. But the direction is clear.
10. More oxygen means flames that are harder to stop: the fire risk side of every high oxygen habitat.

## Open for the user

- **Voice service: decided.** ElevenLabs, free plan. The key is in `.env.local` (`ELEVENLABS_API_KEY`). The free plan asks
  for credit to ElevenLabs, which goes in the References list.
- **Narrator voice: decided.** Daniel ("Steady Broadcaster", British, premade voice `onwK4e9ZLuTAKqWW03F9`), picked by
  the user from the free previews, for all six videos.
- **Scripts: approved** by the user as written above (Sat Nov 14, evening). Order of work: pilot 1.2 built and checked
  with the stand-in voice, then all six recorded in one run, then the other five scenes.

## Left to the builder (AI's calls, open to change)

- Exact colours of each shape within the palette above, scene layout, timing of pauses (default 0.35 s between sentences).
- Video resolution 1920 x 1080 at 30 fps; poster frame taken at the moment the lesson's key picture is complete.
- Caption styling on the page (the browser's own captions, with a dark background).
- File sizes: lower the bitrate if a video exceeds 8 MB.
- Numbers spoken or shown (1,276 tests; 660, 353 and 263; 33 in the Moon Base range) were counted from
  `data/tests.web.json` on Nov 14. `render.py` recounts them before rendering and stops if one no longer matches.
- ElevenLabs: use its built-in (premade) voices, which the free plan can call from the API.
