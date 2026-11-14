"""Render a learners page video: scene frames plus narration into MP4, with WebVTT captions and a poster image.

  python render.py 1-2 --draft   with the free stand-in voice (narration-draft/)
  python render.py 1-2           with the recorded narration (narration/1-2.mp3)

Each frame is drawn by the scene's seek(t) in headless Chromium and streamed into ffmpeg (from imageio-ffmpeg).
Stops before rendering if a number the scripts use no longer matches data/tests.web.json.
AI-assisted (Claude Code); see docs/ai-usage-log.md.
"""
import argparse
import json
import math
import subprocess
import sys
from pathlib import Path

import imageio_ffmpeg

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE / "tests"))
from browser import ROOT, serve  # noqa: E402

NARRATION = HERE / "narration"
DRAFT = HERE / "narration-draft"
OUT = HERE / "out"
FPS = 60          # smoother motion; render time and file size roughly double
SIZE = (1920, 1080)
TAIL = 0.6          # seconds held after the last word
MAX_BYTES = 8 * 1024 * 1024


def _ts(s):
    ms = round(s * 1000)
    return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d}.{ms % 1000:03d}"


def vtt(timing):
    cues = [f"{i}\n{_ts(s['start'])} --> {_ts(s['end'])}\n{s['show']}\n" for i, s in enumerate(timing["sentences"], 1)]
    return "WEBVTT\n\n" + "\n".join(cues)


def sources(vid, draft, narration_dir=NARRATION, draft_dir=DRAFT):
    """(timing path, audio path) for a video, or a SystemExit naming the missing file and how to make it."""
    d = draft_dir if draft else narration_dir
    tim, audio = d / f"{vid}.timing.json", d / f"{vid}.{'wav' if draft else 'mp3'}"
    if not (tim.exists() and audio.exists()):
        name = f"narration-draft/{vid}.wav" if draft else f"narration/{vid}.mp3"
        print(f"Missing {name} (and its timing file). For the free stand-in run: python tts.py --draft --only {vid}"
              + ("" if draft else f". The real narration comes from: python tts.py --spend --only {vid}"), file=sys.stderr)
        raise SystemExit(2)
    return tim, audio


def render(page, audio, out, seconds, fps=FPS, poster=None):
    """Render `page` (a path under the repo root, with its query) for `seconds` with `audio` into `out` (MP4).
    poster: optional (time, jpg path) for a still frame."""
    from playwright.sync_api import sync_playwright
    out.parent.mkdir(parents=True, exist_ok=True)
    n = math.ceil(seconds * fps)
    ff = [imageio_ffmpeg.get_ffmpeg_exe(), "-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", str(fps),
          "-c:v", "mjpeg", "-i", "-", "-i", str(audio), "-map", "0:v", "-map", "1:a", "-c:v", "libx264",
          # JPEG frames are full range; convert to the standard (TV) range so every player shows the same colours
          "-vf", "scale=in_range=pc:out_range=tv:out_color_matrix=bt709,format=yuv420p",
          "-color_range", "tv", "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-crf", "23", "-preset", "medium", "-c:a", "aac", "-b:a", "128k", "-af", "apad", "-shortest",
          "-movflags", "+faststart", str(out)]
    srv, base = serve(ROOT)
    try:
        with sync_playwright() as pw:
            b = pw.chromium.launch()
            p = b.new_page(viewport={"width": SIZE[0], "height": SIZE[1]}, device_scale_factor=1)
            p.goto(f"{base}/{page}")
            p.evaluate("ready")
            proc = subprocess.Popen(ff, stdin=subprocess.PIPE)
            try:
                for i in range(n):
                    p.evaluate(f"seek({i / fps})")
                    proc.stdin.write(p.screenshot(type="jpeg", quality=92))
                    if i % (fps * 5) == 0:
                        print(f"  frame {i}/{n}", flush=True)
            finally:
                proc.stdin.close()
                if proc.wait() != 0:
                    raise RuntimeError("ffmpeg failed")
            if poster:
                p.evaluate(f"seek({poster[0]})")
                poster[1].write_bytes(p.screenshot(type="jpeg", quality=85))
            b.close()
    finally:
        srv.shutdown()
        srv.server_close()
    if out.stat().st_size > MAX_BYTES:
        smaller = out.with_name(out.stem + ".small.mp4")
        subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), "-y", "-loglevel", "error", "-i", str(out), "-c:v", "libx264",
                        "-pix_fmt", "yuv420p", "-crf", "27", "-c:a", "copy", "-movflags", "+faststart", str(smaller)], check=True)
        smaller.replace(out)
    return out


def _facts_check():
    import facts
    return facts.check(facts.load_rows())


def main(argv=None, narration_dir=NARRATION, draft_dir=DRAFT, out_dir=OUT, check=_facts_check, renderer=render):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("id")
    ap.add_argument("--draft", action="store_true", help="use the free stand-in narration")
    a = ap.parse_args(argv)
    try:
        msgs = check()
        if msgs:
            print("Not rendering: a number in the scripts no longer matches the data.\n  " + "\n  ".join(msgs), file=sys.stderr)
            return 3
        tim, audio = sources(a.id, a.draft, narration_dir, draft_dir)
    except SystemExit as e:
        return e.code
    timing = json.loads(tim.read_text(encoding="utf-8"))
    script = json.loads((HERE / "scripts" / f"{a.id}.json").read_text(encoding="utf-8"))
    pb = next((s for s in timing["sentences"] if s["beat"] == script.get("poster")), None)
    poster_t = (pb["start"] + min(2.5, pb["end"] - pb["start"])) if pb else timing["duration"] / 2
    rel = tim.relative_to(HERE).as_posix()
    out_dir.mkdir(parents=True, exist_ok=True)
    mp4 = out_dir / f"{a.id}.mp4"
    print(f"Rendering {a.id} ({'stand-in voice' if a.draft else timing.get('voice_name', 'narration')}), "
          f"{timing['duration'] + TAIL:.1f} s at {FPS} fps")
    renderer(f"alanzim/learn/videos/scenes/{a.id}.html?timing=../{rel}", audio, mp4, timing["duration"] + TAIL,
             poster=(poster_t, out_dir / f"{a.id}.jpg"))
    (out_dir / f"{a.id}.vtt").write_text(vtt(timing), encoding="utf-8")
    print(f"Wrote {mp4.relative_to(HERE)} ({mp4.stat().st_size / 1e6:.1f} MB), {a.id}.vtt, {a.id}.jpg")
    return 0


if __name__ == "__main__":
    sys.exit(main())
