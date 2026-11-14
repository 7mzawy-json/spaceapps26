"""Task 4: the renderer. AI-assisted (Claude Code)."""
import contextlib
import io
import json
import subprocess
import sys
import tempfile
import unittest
import wave
from pathlib import Path

HERE = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(HERE))
import imageio_ffmpeg  # noqa: E402
import render  # noqa: E402

TIMING = {"id": "x", "voice": "test", "script_hash": "h", "duration": 3.2, "sentences": [
    {"beat": "a", "show": "First line, 10.2 psi.", "start": 0.0, "end": 1.5},
    {"beat": "b", "show": "Second line.", "start": 1.85, "end": 3.2}]}


def run_main(argv, **kw):
    out, err = io.StringIO(), io.StringIO()
    with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
        code = render.main(argv, **kw)
    return code, out.getvalue() + err.getvalue()


class Captions(unittest.TestCase):
    def test_vtt_cues(self):
        v = render.vtt(TIMING)
        self.assertTrue(v.startswith("WEBVTT\n\n"))
        self.assertIn("00:00:00.000 --> 00:00:01.500\nFirst line, 10.2 psi.\n", v)
        self.assertIn("00:00:01.850 --> 00:00:03.200\nSecond line.\n", v)


class Guards(unittest.TestCase):
    def test_missing_narration_is_a_clear_error(self):
        with tempfile.TemporaryDirectory() as d:
            code, msg = run_main(["1-2"], narration_dir=Path(d), draft_dir=Path(d), check=lambda: [])
        self.assertNotEqual(code, 0)
        self.assertIn("narration/1-2.mp3", msg)
        self.assertIn("tts.py --draft --only 1-2", msg)

    def test_stops_when_facts_change(self):
        calls = []
        code, msg = run_main(["1-2", "--draft"], check=lambda: ["test rows: scripts say 1,276, data now gives 1,275"],
                             renderer=lambda *a, **k: calls.append(a))
        self.assertNotEqual(code, 0)
        self.assertIn("1,275", msg)
        self.assertEqual(calls, [])


class ShortRender(unittest.TestCase):
    def test_short_render(self):
        frames = HERE / "frames"
        frames.mkdir(exist_ok=True)
        tim = frames / "test-short.timing.json"
        tim.write_text(json.dumps({"id": "short", "voice": "t", "script_hash": "t", "duration": 2.0,
                                   "sentences": [{"beat": "a", "show": "a", "start": 0, "end": 2.0}]}))
        with tempfile.TemporaryDirectory() as d:
            wav = Path(d) / "s.wav"
            with wave.open(str(wav), "wb") as w:
                w.setnchannels(1); w.setsampwidth(2); w.setframerate(22050); w.writeframes(b"\0\0" * 22050 * 2)
            out = Path(d) / "short.mp4"
            render.render("alanzim/learn/videos/tests/fixtures/short.html?timing=../../frames/test-short.timing.json",
                          wav, out, seconds=2.0)
            n, secs = imageio_ffmpeg.count_frames_and_secs(str(out))
            info = subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), "-hide_banner", "-i", str(out)],
                                  capture_output=True, text=True).stderr
        self.assertEqual(n, 60)
        self.assertAlmostEqual(secs, 2.0, delta=0.1)
        self.assertIn("Audio:", info)
        self.assertIn("1920x1080", info)
        self.assertIn("yuv420p", info)
        self.assertNotIn("yuvj420p", info)   # full-range colour looks washed out in Safari and QuickTime


if __name__ == "__main__":
    unittest.main()
