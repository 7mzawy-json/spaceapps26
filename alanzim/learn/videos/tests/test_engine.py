"""Task 3: the timeline engine and the 1.2 pilot scene, in headless Chromium. AI-assisted (Claude Code)."""
import json
import sys
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))
from browser import serve  # noqa: E402
from playwright.sync_api import sync_playwright  # noqa: E402

WATERMARK = "AI-assisted animation and voice · Flashpoint"
FRAMES = HERE / "frames"


def synthetic_timing(script_id, starts, step=1.8):
    """A timing file whose sentence k starts at starts[k]; written to frames/ (gitignored) for the tests."""
    s = json.loads((HERE / "scripts" / f"{script_id}.json").read_text(encoding="utf-8"))
    sents = [{"beat": x["beat"], "show": x["show"], "start": a, "end": a + step} for x, a in zip(s["sentences"], starts)]
    t = {"id": script_id, "voice": "test", "script_hash": "test", "duration": starts[-1] + step + 1, "sentences": sents}
    FRAMES.mkdir(exist_ok=True)
    p = FRAMES / f"test-{script_id}.timing.json"
    p.write_text(json.dumps(t), encoding="utf-8")
    return f"../frames/{p.name}"


class Scene:
    """Shared checks for every scene. Concrete classes set ID and STARTS and also derive from TestCase."""

    @classmethod
    def setUpClass(cls):
        cls.srv, base = serve()
        cls.pw = sync_playwright().start()
        cls.browser = cls.pw.chromium.launch()
        cls.page = cls.browser.new_page(viewport={"width": 1920, "height": 1080})
        timing = synthetic_timing(cls.ID, cls.STARTS)
        cls.page.goto(f"{base}/alanzim/learn/videos/scenes/{cls.ID}.html?timing={timing}")
        cls.duration = cls.page.evaluate("ready.then(r => r.duration)")

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.pw.stop()
        cls.srv.shutdown()

    def shot(self, t):
        self.page.evaluate(f"seek({t})")
        return self.page.screenshot()

    def test_seek_is_deterministic(self):
        self.assertEqual(self.shot(12.3), self.shot(12.3))
        self.shot(30.0)
        self.assertEqual(self.shot(12.3), self.shot(12.3))

    def test_seek_waits_for_fonts(self):
        self.assertEqual(self.page.evaluate("ready.then(() => document.fonts.status)"), "loaded")
        self.assertTrue(self.page.evaluate("document.fonts.check('600 40px Geist')"))

    def test_watermark_on_every_frame(self):
        for t in (0, self.duration / 2, self.duration - 0.05):
            self.page.evaluate(f"seek({t})")
            wm = self.page.locator("#wm")
            self.assertTrue(wm.is_visible(), t)
            self.assertEqual(wm.text_content(), WATERMARK)
            self.assertGreaterEqual(float(wm.evaluate("e => getComputedStyle(e).opacity")), 0.6)
        self.assertFalse(self.page.locator("#cap").is_visible())

    def test_every_beat_is_used(self):
        beats = [x["beat"] for x in json.loads((HERE / "scripts" / f"{self.ID}.json").read_text())["sentences"]]
        used = self.page.evaluate("E.used")
        self.assertEqual(sorted(set(beats) - set(used)), [])


class Pilot(Scene, unittest.TestCase):
    ID = "1-2"
    STARTS = [0, 2, 4, 8, 12, 16, 20, 26, 30, 34, 40]

    def test_beats_follow_timing(self):
        self.page.evaluate("seek(19.9)")
        before = self.page.locator("#flame").get_attribute("d")
        self.page.evaluate("seek(22.0)")
        after = self.page.locator("#flame").get_attribute("d")
        self.assertNotEqual(before, after)
        box = self.page.locator("#flame").bounding_box()
        self.assertLess(abs(box["width"] - box["height"]) / box["height"], 0.10, box)


if __name__ == "__main__":
    unittest.main()
