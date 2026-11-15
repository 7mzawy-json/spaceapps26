"""Task 2: narration is recorded once. No test touches the network: the request is a function the tests replace.
AI-assisted (Claude Code)."""
import contextlib
import io
import json
import sys
import tempfile
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(HERE))
import tts  # noqa: E402

ALL = [json.loads((HERE / "scripts" / f"1-{n}.json").read_text(encoding="utf-8")) for n in range(1, 7)]


def fake_alignment(text, step=0.05):
    """One character every `step` seconds, the shape ElevenLabs returns."""
    return {"characters": list(text),
            "character_start_times_seconds": [i * step for i in range(len(text))],
            "character_end_times_seconds": [(i + 1) * step for i in range(len(text))]}


def fake_post(calls):
    def post(text):
        calls.append(text)
        return {"audio_base64": "SUQzBAAAAAAA", "alignment": fake_alignment(text)}
    return post


class SentenceTimes(unittest.TestCase):
    def test_sentence_times_from_alignment(self):
        a = fake_alignment("Ab. Cd.", step=1.0)
        self.assertEqual(tts.sentence_times(a, ["Ab.", "Cd."]), [(0.0, 3.0), (4.0, 7.0)])

    def test_alignment_that_does_not_match_the_text_is_an_error(self):
        with self.assertRaises(ValueError):
            tts.sentence_times(fake_alignment("Ab. Xy."), ["Ab.", "Cd."])


class Plan(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.out = Path(self.tmp.name)

    def tearDown(self):
        self.tmp.cleanup()

    def test_plan_records_new_and_skips_existing(self):
        (self.out / "1-1.mp3").write_bytes(b"x")
        (self.out / "1-1.timing.json").write_text(json.dumps({"script_hash": tts.script_hash(ALL[0])}))
        p = {r["id"]: r["action"] for r in tts.plan(ALL, self.out, set())}
        self.assertEqual(p["1-1"], "skip_exists")
        self.assertTrue(all(p[i] == "record" for i in ["1-2", "1-3", "1-4", "1-5", "1-6"]))

    def test_changed_script_is_skipped_not_rerecorded(self):
        (self.out / "1-2.mp3").write_bytes(b"x")
        (self.out / "1-2.timing.json").write_text(json.dumps({"script_hash": "an older script"}))
        calls, log = [], io.StringIO()
        tts.record([ALL[1]], self.out, fake_post(calls), remaining=10000, redo=set(), log=log)
        self.assertEqual(calls, [])
        self.assertIn("--redo 1-2", log.getvalue())
        self.assertEqual((self.out / "1-2.mp3").read_bytes(), b"x")

    def test_redo_records_named_video(self):
        (self.out / "1-2.mp3").write_bytes(b"x")
        (self.out / "1-2.timing.json").write_text(json.dumps({"script_hash": "an older script"}))
        p = {r["id"]: r["action"] for r in tts.plan([ALL[1]], self.out, {"1-2"})}
        self.assertEqual(p["1-2"], "record")

    def test_refuses_when_quota_too_small(self):
        calls = []
        with self.assertRaises(SystemExit) as e:
            tts.record(ALL, self.out, fake_post(calls), remaining=1000, redo=set(), log=io.StringIO())
        self.assertNotEqual(e.exception.code, 0)
        self.assertEqual(calls, [])

    def test_record_writes_audio_and_timing(self):
        calls = []
        tts.record([ALL[1]], self.out, fake_post(calls), remaining=10000, redo=set(), log=io.StringIO())
        self.assertEqual(len(calls), 1)
        self.assertEqual(calls[0], " ".join(s["say"] for s in ALL[1]["sentences"]))
        t = json.loads((self.out / "1-2.timing.json").read_text())
        self.assertEqual(t["script_hash"], tts.script_hash(ALL[1]))
        self.assertEqual(t["voice"], tts.VOICE_ID)
        self.assertEqual([s["beat"] for s in t["sentences"]], [s["beat"] for s in ALL[1]["sentences"]])
        self.assertLess(t["sentences"][0]["end"], t["sentences"][1]["start"])
        self.assertTrue((self.out / "1-2.mp3").exists())

    def test_failed_request_leaves_no_partial_files(self):
        n = []

        def post(text):
            n.append(1)
            if len(n) == 2:
                raise RuntimeError("HTTP 429 quota exceeded")
            return {"audio_base64": "SUQzBAAAAAAA", "alignment": fake_alignment(text)}
        with self.assertRaises(SystemExit):
            tts.record(ALL[:2], self.out, post, remaining=10000, redo=set(), log=io.StringIO())
        self.assertTrue((self.out / "1-1.mp3").exists())
        self.assertTrue((self.out / "1-1.timing.json").exists())
        self.assertEqual(sorted(p.name for p in self.out.iterdir() if p.name.startswith("1-2")), [])

    def test_paid_recording_is_kept_even_if_timestamps_do_not_match(self):
        def post(text):
            return {"audio_base64": "SUQzBAAAAAAA", "alignment": fake_alignment(text.upper())}
        log = io.StringIO()
        tts.record([ALL[1]], self.out, post, remaining=10000, redo=set(), log=log)
        self.assertTrue((self.out / "1-2.mp3").exists())
        t = json.loads((self.out / "1-2.timing.json").read_text())
        self.assertEqual(len(t["sentences"]), 11)
        self.assertTrue(all(a["start"] < b["start"] for a, b in zip(t["sentences"], t["sentences"][1:])))
        self.assertIn("estimated", log.getvalue())

    def test_key_never_printed(self):
        key = "sk_test_DO_NOT_PRINT_123"
        out, err = io.StringIO(), io.StringIO()
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            tts.main([], key=key, get_remaining=lambda k: 10000, out_dir=self.out)
        self.assertNotIn(key, out.getvalue() + err.getvalue())
        self.assertIn("5,124", out.getvalue())


if __name__ == "__main__":
    unittest.main()
