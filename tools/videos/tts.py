"""Narration for the learners page videos, recorded once.

  python tts.py                     dry run: what would be sent, how many characters, how many are left (free call)
  python tts.py --draft --only 1-2  free stand-in voice (Windows), for timing scenes before recording
  python tts.py --spend             record every video that has no MP3 yet (ElevenLabs, costs characters)
  python tts.py --spend --redo 1-2  record 1-2 again even though it exists (costs characters)

One ElevenLabs request per video, "with timestamps", so the sentence times and captions come from that one recording.
Recordings are committed to git (narration/), so nobody pays for them twice. The key is read from .env.local and
never printed. AI-assisted (Claude Code); see docs/ai-usage-log.md.
"""
import argparse
import base64
import hashlib
import json
import os
import subprocess
import sys
import tempfile
import urllib.error
import urllib.request
import wave
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
SCRIPTS = HERE / "scripts"
NARRATION = HERE / "narration"
DRAFT = HERE / "narration-draft"
API = "https://api.elevenlabs.io"
VOICE_ID = "onwK4e9ZLuTAKqWW03F9"   # Daniel, ElevenLabs premade voice, picked by the user
VOICE_NAME = "Daniel (ElevenLabs)"
MODEL = "eleven_multilingual_v2"
FORMAT = "mp3_44100_128"
DRAFT_GAP = 0.35                    # seconds of silence between stand-in sentences


def load_scripts(only=None):
    s = [json.loads(p.read_text(encoding="utf-8")) for p in sorted(SCRIPTS.glob("*.json"))]
    return [x for x in s if not only or x["id"] in only]


def text_of(script):
    return " ".join(x["say"] for x in script["sentences"])


def script_hash(script):
    return hashlib.sha256(text_of(script).encode("utf-8")).hexdigest()


def sentence_times(alignment, says):
    """Start and end time of each sentence, from ElevenLabs' per-character timestamps of the joined text."""
    text = " ".join(says)
    chars = "".join(alignment["characters"])
    if chars != text:
        raise ValueError("the recording's characters do not match the script text")
    st, en, out, o = alignment["character_start_times_seconds"], alignment["character_end_times_seconds"], [], 0
    for s in says:
        out.append((float(st[o]), float(en[o + len(s) - 1])))
        o += len(s) + 1
    return out


def estimated_times(alignment, says):
    """Fallback when the recording's characters differ from the script: place each sentence by its share of the text."""
    st, en = alignment["character_start_times_seconds"], alignment["character_end_times_seconds"]
    n, total, out, o = len(st), len(" ".join(says)), [], 0
    for s in says:
        a = min(n - 1, round(o / total * n))
        b = min(n - 1, max(a, round((o + len(s)) / total * n) - 1))
        out.append((float(st[a]), float(en[b])))
        o += len(s) + 1
    return out


def plan(scripts, out_dir, redo):
    rows = []
    for s in scripts:
        mp3, tim = out_dir / f"{s['id']}.mp3", out_dir / f"{s['id']}.timing.json"
        action = "record"
        if s["id"] not in redo and mp3.exists():
            old = json.loads(tim.read_text(encoding="utf-8")).get("script_hash") if tim.exists() else None
            action = "skip_exists" if old == script_hash(s) else "skip_changed"
        rows.append({"id": s["id"], "chars": len(text_of(s)), "action": action})
    return rows


def _timing(script, starts_ends, voice, extra=None):
    sents = [{"beat": x["beat"], "show": x["show"], "start": round(a, 3), "end": round(b, 3)}
             for x, (a, b) in zip(script["sentences"], starts_ends)]
    t = {"id": script["id"], "voice": voice, "script_hash": script_hash(script),
         "duration": round(sents[-1]["end"], 3), "sentences": sents}
    if extra:
        t.update(extra)
    return t


def _write_atomic(path, data):
    tmp = path.with_name(path.name + ".part")
    tmp.write_bytes(data)
    os.replace(tmp, path)


def record(scripts, out_dir, post, remaining, redo, log=sys.stdout):
    """Record every planned video with one request each. Refuses before any request if the allowance is too small."""
    out_dir.mkdir(parents=True, exist_ok=True)
    rows = plan(scripts, out_dir, redo)
    for r in rows:
        if r["action"] == "skip_changed":
            print(f"{r['id']}: SKIPPED. Its script changed after it was recorded. To pay for a new recording, "
                  f"run again with --redo {r['id']}.", file=log)
        elif r["action"] == "skip_exists":
            print(f"{r['id']}: already recorded, skipped.", file=log)
    todo = [r for r in rows if r["action"] == "record"]
    need = sum(r["chars"] for r in todo)
    if need > remaining:
        print(f"Refusing: {need:,} characters needed, {remaining:,} left this month. Nothing was sent.", file=log)
        raise SystemExit(2)
    by_id = {s["id"]: s for s in scripts}
    for r in todo:
        s = by_id[r["id"]]
        try:
            res = post(text_of(s))
            audio = base64.b64decode(res["audio_base64"])
        except Exception as e:  # noqa: BLE001  any failure stops the run; finished videos stay
            print(f"{r['id']}: request failed ({e}). Stopped. Videos already saved are kept.", file=log)
            raise SystemExit(3)
        says = [x["say"] for x in s["sentences"]]
        try:
            times = sentence_times(res["alignment"], says)
        except ValueError:
            # The recording is paid for, so it is always kept. Sentence times are then estimated by position.
            times = estimated_times(res["alignment"], says)
            print(f"{r['id']}: timestamps did not match the text exactly; sentence times estimated by position.",
                  file=log)
        timing = _timing(s, times, VOICE_ID, {"voice_name": VOICE_NAME, "model": MODEL, "format": FORMAT,
                                              "alignment": res["alignment"]})
        _write_atomic(out_dir / f"{s['id']}.mp3", audio)
        _write_atomic(out_dir / f"{s['id']}.timing.json", json.dumps(timing, indent=1).encode("utf-8"))
        print(f"{r['id']}: recorded, {r['chars']:,} characters, {timing['duration']:.1f} s.", file=log)
    return len(todo)


# ---- ElevenLabs (the only network calls) ----
def read_key(path=ROOT / ".env.local"):
    if not path.exists():
        return None
    for line in path.read_text(encoding="utf-8").splitlines():
        if line.strip().startswith("ELEVENLABS_API_KEY="):
            return line.split("=", 1)[1].strip().strip("\"'") or None
    return None


def _call(req):
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"HTTP {e.code}: {e.read()[:200].decode('utf-8', 'replace')}") from None


def remaining_chars(key):
    s = _call(urllib.request.Request(API + "/v1/user/subscription", headers={"xi-api-key": key}))
    return int(s["character_limit"]) - int(s["character_count"])


def make_post(key):
    def post(text):
        body = json.dumps({"text": text, "model_id": MODEL}).encode("utf-8")
        url = f"{API}/v1/text-to-speech/{VOICE_ID}/with-timestamps?output_format={FORMAT}"
        return _call(urllib.request.Request(url, data=body, method="POST",
                                            headers={"xi-api-key": key, "Content-Type": "application/json"}))
    return post


# ---- Free stand-in voice (Windows System.Speech) ----
def draft(script, out_dir=DRAFT):
    """Speak each sentence with the Windows voice, join with short pauses, write WAV and timing. Costs nothing."""
    out_dir.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        lines = Path(tmp) / "lines.json"
        lines.write_text(json.dumps([x["say"] for x in script["sentences"]]), encoding="utf-8")
        ps = ("Add-Type -AssemblyName System.Speech; $s = New-Object System.Speech.Synthesis.SpeechSynthesizer; "
              "try { $s.SelectVoice('Microsoft David Desktop') } catch {}; "
              f"$l = Get-Content -Raw -Encoding UTF8 '{lines}' | ConvertFrom-Json; $i = 0; "
              f"foreach ($t in $l) {{ $s.SetOutputToWaveFile((Join-Path '{tmp}' ('s' + $i + '.wav'))); $s.Speak($t); $i++ }}; "
              "$s.SetOutputToNull()")
        subprocess.run(["powershell", "-NoProfile", "-NonInteractive", "-Command", ps], check=True)
        frames, params, t, spans = [], None, 0.0, []
        for i in range(len(script["sentences"])):
            with wave.open(str(Path(tmp) / f"s{i}.wav")) as w:
                params = params or w.getparams()
                data = w.readframes(w.getnframes())
                d = w.getnframes() / w.getframerate()
            spans.append((t, t + d))
            frames.append(data)
            gap = int(DRAFT_GAP * params.framerate) * params.sampwidth * params.nchannels
            frames.append(b"\0" * gap)
            t += d + DRAFT_GAP
        with wave.open(str(out_dir / f"{script['id']}.wav"), "wb") as w:
            w.setparams(params)
            w.writeframes(b"".join(frames))
    timing = _timing(script, spans, "windows-david-standin")
    (out_dir / f"{script['id']}.timing.json").write_text(json.dumps(timing, indent=1), encoding="utf-8")
    return timing


def main(argv=None, key=None, get_remaining=remaining_chars, out_dir=NARRATION, post=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--draft", action="store_true", help="free Windows stand-in voice")
    ap.add_argument("--spend", action="store_true", help="really record with ElevenLabs (costs characters)")
    ap.add_argument("--redo", default="", help="comma-separated ids to record again")
    ap.add_argument("--only", default="", help="comma-separated ids")
    a = ap.parse_args(argv)
    only = {x for x in a.only.split(",") if x}
    redo = {x for x in a.redo.split(",") if x}
    scripts = load_scripts(only)
    if a.draft:
        for s in scripts:
            t = draft(s)
            print(f"{s['id']}: stand-in written, {t['duration']:.1f} s (narration-draft/, not committed).")
        return 0
    key = key or read_key()
    if not key:
        print("No ELEVENLABS_API_KEY in .env.local.")
        return 1
    left = get_remaining(key)
    rows = plan(scripts, out_dir, redo)
    need = sum(r["chars"] for r in rows if r["action"] == "record")
    print(f"{'video':<6} {'characters':>10}  action")
    for r in rows:
        print(f"{r['id']:<6} {r['chars']:>10,}  {r['action']}")
    print(f"To record: {need:,} characters. Left this month: {left:,}.")
    if not a.spend:
        print("Dry run: nothing was sent. Add --spend to record.")
        return 0
    record(scripts, out_dir, post or make_post(key), left, redo)
    return 0


if __name__ == "__main__":
    sys.exit(main())
