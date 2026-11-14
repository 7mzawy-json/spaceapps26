# Learners page videos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Six narrated, geometric-style MP4 videos (about 60 s each) for the Flame science lessons on the learners page, with the ElevenLabs narration recorded exactly once.

**Architecture:** Each video is an HTML/SVG scene driven by a small timeline (`engine.js`) whose beats are keyed to sentence start times. `tts.py` records one ElevenLabs "with timestamps" request per video (guarded so credits are spent once) or makes a free Windows-voice stand-in. `render.py` seeks the scene frame by frame in headless Chromium and pipes the frames plus narration into ffmpeg.

**Tech Stack:** Python 3.13 (stdlib, `unittest`), `playwright` (Chromium), `imageio-ffmpeg` (bundled ffmpeg), plain JS and SVG, Windows System.Speech for the stand-in voice.

**Spec:** `alanzim/learn/videos-design.md`

## Global Constraints

- Everything lives in `alanzim/learn/` (drafts, not deployed). No file outside it changes except `docs/ai-usage-log.md` (Task 7) and the already-made `.env.example`.
- Never write the em dash or en dash character, in code, scripts, captions or commit messages.
- Watermark on every frame, bottom-right: `AI-assisted animation and voice · Flashpoint`.
- No NASA logos or insignia in any frame.
- Voice: ElevenLabs premade `Daniel`, id `onwK4e9ZLuTAKqWW03F9`; model `eleven_multilingual_v2`; output `mp3_44100_128`.
- Endpoint: `POST https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/with-timestamps?output_format=mp3_44100_128`, header `xi-api-key`, body `{"text", "model_id"}`. Response: `audio_base64`, `alignment.characters`, `alignment.character_start_times_seconds`, `alignment.character_end_times_seconds`.
- Key read from `.env.local` (`ELEVENLABS_API_KEY`). Never printed, logged or written anywhere else.
- Video: 1920 x 1080, 30 fps, H.264 + AAC, under 8 MB each.
- Spoken text says units in full ("pounds per square inch"); shown text and captions say `psi`.
- Numbers that must still match `data/tests.web.json` before rendering: 1,276 rows; 660 gas, 353 liquid, 263 solid; 33 rows in the Moon Base box (8 to 12.5 psi, 24 to 40% oxygen, `oxygen_from` not `burner`), all PSI-69 liquid; PSI-69 below 15% oxygen: 28 rows, 27 `self_extinguished`; PSI-69 30 to 50%: 24 rows, 2 `self_extinguished`, 4 `burned`, 18 `unknown`.
- Scripts are the approved text in the spec, copied exactly. Changing one after recording costs credits.
- Commit after every working task. Do not push without asking the user.

## Review Focus

1. **A script edited after its recording.** Expect: `tts.py --spend` skips it with a warning and spends nothing. Test in Task 2 (`test_changed_script_is_skipped_not_rerecorded`).
2. **An API failure mid-run (401, 429, quota exceeded, network).** Expect: the run stops, already saved videos stay, no partial MP3 or timing file is left for the failed one. Test in Task 2 (`test_failed_request_leaves_no_partial_files`).
3. **Not enough credits left for the planned requests.** Expect: refuse before the first request. Test in Task 2 (`test_refuses_when_quota_too_small`).
4. **Rendering a video with no narration yet.** Expect: `render.py` stops with a message naming the missing file and the command that makes the stand-in. Test in Task 4 (`test_missing_narration_is_a_clear_error`).
5. **Fonts not loaded when the first frame is captured.** Expect: the renderer waits for `document.fonts.ready` before frame 0. Test in Task 3 (`test_seek_waits_for_fonts`).

---

### Task 1: Tools, scripts as data, and the number check

**Files:**
- Create: `alanzim/learn/videos/scripts/1-1.json` ... `1-6.json`
- Create: `alanzim/learn/videos/facts.py`
- Create: `alanzim/learn/videos/requirements.txt` (`playwright`, `imageio-ffmpeg`, pinned to the versions installed)
- Create: `alanzim/learn/videos/.gitignore` (`narration-draft/`, `frames/`)
- Test: `alanzim/learn/videos/tests/test_scripts.py`

**Interfaces:**
- Produces: script JSON shape `{"id": "1-2", "title": str, "poster": str (optional beat name), "sentences": [{"say": str, "show": str, "beat": str}]}`. `show` equals `say` except units (`pounds per square inch` becomes `psi`).
- Produces: `facts.check(rows: list[dict]) -> list[str]` returns mismatch messages (empty means all Global Constraints numbers hold).
- Produces: `facts.load_rows() -> list[dict]` reads `data/tests.web.json` relative to the repo root.

- [ ] **Step 1: Install tools.** `python -m pip install playwright imageio-ffmpeg`, then `python -m playwright install chromium`. Expected: both import; `imageio_ffmpeg.get_ffmpeg_exe()` returns a path.
- [ ] **Step 2: Write the failing tests** in `test_scripts.py`:
  - `test_six_scripts_match_spec`: six files; sentence counts 10, 11, 10, 10, 10, 10 for 1-1 to 1-6; joined `say` text of all six totals 5,124 characters.
  - `test_no_dashes`: no U+2013 or U+2014 in any `say` or `show`.
  - `test_show_uses_psi`: no `show` contains "pounds per square inch"; every `say` that has it maps to a `show` with `psi`.
  - `test_every_sentence_has_a_beat`: non-empty `beat`, unique within a script.
  - `test_facts_hold`: `facts.check(facts.load_rows()) == []`.
  - `test_facts_catch_a_change`: dropping one row makes `facts.check` return a message mentioning `1,276`.
- [ ] **Step 3: Run** `python -m unittest discover -s alanzim/learn/videos/tests -v`. Expected: FAIL (files missing).
- [ ] **Step 4: Create the six script files** from the spec's "Scripts" section, text exact, beats named for what the picture does (for 1-2: `teardrop`, `gravity`, `rises`, `formula`, `remove_g`, `station`, `sphere`, `smother`, `scale`, `count`, `between`). Implement `facts.py`.
- [ ] **Step 5: Run the tests.** Expected: all PASS.
- [ ] **Step 6: Commit** `alanzim/learn/videos` with message "Learn videos: scripts as data and the number check".

### Task 2: Narration with a credit guard (`tts.py`)

**Files:**
- Create: `alanzim/learn/videos/tts.py`
- Test: `alanzim/learn/videos/tests/test_tts.py`

**Interfaces:**
- Consumes: script JSON (Task 1).
- Produces: `narration/<id>.mp3` and `narration/<id>.timing.json`, or the stand-in `narration-draft/<id>.wav` and `narration-draft/<id>.timing.json`. Timing shape: `{"id", "voice", "script_hash", "duration", "sentences": [{"beat", "show", "start", "end"}]}` (seconds, float).
- Produces: `script_hash(script: dict) -> str` (sha256 of the joined `say` text).
- Produces: `sentence_times(alignment: dict, says: list[str]) -> list[tuple[float, float]]`. The request text is the `say` sentences joined with one space; sentence k spans its character offsets in that text.
- Produces: `plan(scripts: list[dict], out_dir: Path, redo: set[str]) -> list[dict]`, each `{"id", "chars", "action": "record" | "skip_exists" | "skip_changed"}`.
- Produces: CLI `python tts.py [--draft] [--spend] [--redo 1-2,1-3] [--only 1-2]`. Without `--spend` and `--draft`, prints the plan, total characters and remaining allowance (from `GET /v1/user/subscription`), sends nothing else.

- [ ] **Step 1: Write the failing tests** (no network; the HTTP call is one function `post_tts(text) -> dict` that tests replace):
  - `test_sentence_times_from_alignment`: synthetic alignment for "Ab. Cd." gives `[(t0, t2), (t4, t6)]` from the per-character times.
  - `test_plan_records_new_and_skips_existing`: with `1-1.mp3` present, `plan` marks 1-1 `skip_exists`, the rest `record`.
  - `test_changed_script_is_skipped_not_rerecorded`: existing timing with a different `script_hash` gives `skip_changed`; `post_tts` is never called; output names the `--redo` flag.
  - `test_redo_records_named_video`: `redo={"1-2"}` turns 1-2 into `record`.
  - `test_refuses_when_quota_too_small`: remaining 1,000, planned 5,124: exits non-zero before any `post_tts` call.
  - `test_failed_request_leaves_no_partial_files`: `post_tts` raises on the second video: the first video's files exist, the second's do not (write to a temp name, rename on success).
  - `test_key_never_printed`: captured stdout and stderr of a dry run do not contain the key.
- [ ] **Step 2: Run** `python -m unittest alanzim/learn/videos/tests/test_tts.py -v`. Expected: FAIL.
- [ ] **Step 3: Implement `tts.py`.** Use `urllib.request` (no new dependency). `--draft` uses PowerShell `System.Speech.Synthesis.SpeechSynthesizer` writing one WAV per sentence (`SetOutputToWaveFile`), measures each with `wave`, joins them with 0.35 s of silence into `narration-draft/<id>.wav`, and writes timing from the measured lengths.
- [ ] **Step 4: Run the tests.** Expected: all PASS.
- [ ] **Step 5: Free checks.** `python alanzim/learn/videos/tts.py` (dry run). Expected: six `record` rows, 5,124 characters, remaining 10,000. Then `python alanzim/learn/videos/tts.py --draft --only 1-2`. Expected: `narration-draft/1-2.wav` about 60 s and its timing file.
- [ ] **Step 6: Commit** "Learn videos: narration with a credit guard".

### Task 3: Timeline engine and the pilot scene (1.2)

**Files:**
- Create: `alanzim/learn/videos/scenes/engine.js`
- Create: `alanzim/learn/videos/scenes/1-2.html`
- Test: `alanzim/learn/videos/tests/test_engine.py` (drives headless Chromium through playwright)

**Interfaces:**
- Consumes: timing JSON (Task 2), passed as `?timing=<relative path>`; falls back to `narration/<id>.timing.json`, then `narration-draft/<id>.timing.json`.
- Produces, on `window`: `ready: Promise<{duration: number}>` (resolves after timing is loaded and `document.fonts.ready`); `seek(t: number): void` (draws exactly the frame at `t`, no wall clock); `play()` for live preview with the audio.
- Produces: `beat(name) -> {start, end}` and tween helpers `ease`, `lerp`, `at(start, dur, fn)` inside `engine.js` for every scene.
- Look, from the spec: background `#05173a` with a soft radial glow and faint stars; flame `#FC3D21` and amber; oxygen in the site blue; Geist and Geist Mono; watermark text from Global Constraints.

- [ ] **Step 1: Write the failing tests:**
  - `test_seek_is_deterministic`: `seek(12.3)` twice gives identical screenshots.
  - `test_seek_waits_for_fonts`: `await ready` resolves only after `document.fonts.status == "loaded"`.
  - `test_watermark_on_every_frame`: at t = 0, the middle and the end, the watermark element is visible and its text matches exactly.
  - `test_beats_follow_timing`: with a timing file where `sphere` starts at 20.0, the flame path at `seek(19.9)` differs from `seek(22.0)`, and at `seek(22.0)` its bounding box is round (width within 10% of height).
- [ ] **Step 2: Run them.** Expected: FAIL.
- [ ] **Step 3: Implement `engine.js` and `1-2.html`**, one beat per sentence as listed in the spec's table row for 1.2: teardrop flame with rising hot-gas circles and inflowing cool-air circles; the formula `F = (ρair − ρhot) × g` assembling (use the minus sign U+2212, not a dash); gravity removed, arrows fade, flame relaxes into a blue sphere; oxygen drifting in; a gravity scale 0, Moon 0.166, Mars 0.378, Earth 1; the count "1,276 tests, all at 0 g". Show the `show` text of the current sentence in a caption bar only in preview (`?preview`), never in rendered frames.
- [ ] **Step 4: Run the tests.** Expected: all PASS.
- [ ] **Step 5: Look at it.** Serve the repo root and open `/alanzim/learn/videos/scenes/1-2.html?preview` in the browser pane; screenshot at each beat start; fix anything that overlaps, clips or reads poorly at 1920 x 1080 and at the page's display size.
- [ ] **Step 6: Commit** "Learn videos: timeline engine and the 1.2 pilot scene".

### Task 4: Renderer (`render.py`)

**Files:**
- Create: `alanzim/learn/videos/render.py`
- Test: `alanzim/learn/videos/tests/test_render.py`

**Interfaces:**
- Consumes: scenes (Task 3), timing and audio (Task 2), `facts.check` (Task 1).
- Produces: `out/<id>.mp4`, `out/<id>.vtt`, `out/<id>.jpg` (poster at the start of the beat named in the script's `"poster"` field, default the middle).
- Produces: `vtt(timing: dict) -> str` (WebVTT, one cue per sentence, `show` text, `HH:MM:SS.mmm`).
- Produces: CLI `python render.py <id> [--draft]`. Without `--draft` it requires `narration/<id>.mp3`.

- [ ] **Step 1: Write the failing tests:**
  - `test_vtt_cues`: two sentences at (0.0, 1.5) and (1.85, 3.2) give two cues with those times and `show` text.
  - `test_missing_narration_is_a_clear_error`: no MP3 and no `--draft`: exits non-zero; message names `narration/1-2.mp3` and `tts.py --draft --only 1-2`.
  - `test_stops_when_facts_change`: with `facts.check` returning a message, no frame is rendered and the message is printed.
  - `test_short_render`: a 2-second test scene renders to an MP4 that `imageio_ffmpeg.count_frames_and_secs` reports as 60 frames at about 2.0 s, with an audio stream.
- [ ] **Step 2: Run them.** Expected: FAIL.
- [ ] **Step 3: Implement `render.py`:** start a local `http.server` on the repo root in a thread; open the scene at 1920 x 1080 with `deviceScaleFactor` 1; `await ready`; for each frame `seek(i / 30)` and `page.screenshot(type="jpeg", quality=92)`, written to ffmpeg's stdin (`-f image2pipe`); audio from the WAV or MP3; `-c:v libx264 -pix_fmt yuv420p -crf 23 -c:a aac -b:a 128k -movflags +faststart -shortest`. If the result is over 8 MB, re-encode once with `-crf 27`.
- [ ] **Step 4: Run the tests.** Expected: all PASS.
- [ ] **Step 5: Render the pilot with the stand-in.** `python alanzim/learn/videos/render.py 1-2 --draft`. Expected: `out/1-2.mp4` about 60 s, under 8 MB. Watch it in the browser pane.
- [ ] **Step 6: Commit** "Learn videos: renderer" (the `out/` draft MP4 is not committed until it has the real voice).

### Task 5: CHECKPOINT. The user approves the pilot, then the narration is recorded once

- [ ] **Step 1:** Show the user the stand-in pilot. Apply changes to pictures and timing. If the user changes any script text, update the spec and the script file first.
- [ ] **Step 2:** Dry run `python alanzim/learn/videos/tts.py`. Show the user the plan: six videos, the character total, the remaining allowance.
- [ ] **Step 3:** Only after the user says yes in chat: `python alanzim/learn/videos/tts.py --spend`. Expected: six MP3s and six timing files in `narration/`; remaining allowance drops by about 5,124.
- [ ] **Step 4:** Listen to 1-2 in the browser pane. Re-render `python alanzim/learn/videos/render.py 1-2`. Check the beats still land on their sentences.
- [ ] **Step 5: Commit** `narration/` and `out/1-2.*` with "Learn videos: Daniel narration (recorded once) and the 1.2 video".

### Task 6: The other five scenes

**Files:**
- Create: `alanzim/learn/videos/scenes/1-1.html`, `1-3.html`, `1-4.html`, `1-5.html`, `1-6.html`

**Interfaces:**
- Consumes: `engine.js` (Task 3), real timing (Task 5), `render.py` (Task 4).

- [ ] **Step 1:** For each scene, add its case to `test_engine.py`: `test_<id>_watermark_and_beats` (watermark on first, middle, last frame; every beat in the script exists in the scene).
- [ ] **Step 2:** Run. Expected: FAIL for the missing scenes.
- [ ] **Step 3:** Build each scene from its row in the spec's beats table. Numbers shown on screen are the Global Constraints values. 1.6's FLEX bars use the exact counts and carry the line "FLEX also changed fuel and pressure".
- [ ] **Step 4:** Run the tests, then render each: `python alanzim/learn/videos/render.py <id>`. Expected: five MP4s about 57 to 62 s, under 8 MB each. Watch each one in the browser pane.
- [ ] **Step 5: Commit** "Learn videos: scenes and videos 1.1, 1.3 to 1.6".

### Task 7: On the learners page, and the log

**Files:**
- Modify: `alanzim/learn/index.html` (each lesson 1.1 to 1.6: a "Watch (1 min)" block above THE IDEA)
- Modify: `docs/ai-usage-log.md` (one Log row; References rows for ElevenLabs voice "Daniel", Playwright, FFmpeg via imageio-ffmpeg)

- [ ] **Step 1:** Add `<video controls preload="none" poster="videos/out/<id>.jpg">` with `<source src="videos/out/<id>.mp4" type="video/mp4">` and `<track kind="captions" srclang="en" label="English" src="videos/out/<id>.vtt" default>`, plus one line under it: "Narrated by an AI voice (ElevenLabs). Animation AI-assisted."
- [ ] **Step 2: Check in the browser pane:** each video plays with sound and captions in light and dark mode; no sideways scroll at 375 px; no console errors.
- [ ] **Step 3:** Log row: who (AlanziM2), tool and model (Claude Code; ElevenLabs `eleven_multilingual_v2`, voice Daniel), what the AI did (scripts drafted from the lessons, scenes, narration), what a human checked (scripts approved, voice picked, videos watched). References rows with licences: ElevenLabs free plan (attribution), Playwright (Apache 2.0), FFmpeg (LGPL/GPL, via imageio-ffmpeg, BSD 2-Clause).
- [ ] **Step 4: Commit** "Learners page: the six lesson videos".
