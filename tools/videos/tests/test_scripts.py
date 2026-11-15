"""Task 1: the six approved scripts, stored as data, and the check that their numbers still match NASA's rows.
AI-assisted (Claude Code)."""
import json
import sys
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(HERE))

IDS = ["1-1", "1-2", "1-3", "1-4", "1-5", "1-6"]
COUNTS = {"1-1": 10, "1-2": 11, "1-3": 10, "1-4": 10, "1-5": 10, "1-6": 10}


def load(i):
    return json.loads((HERE / "scripts" / f"{i}.json").read_text(encoding="utf-8"))


class Scripts(unittest.TestCase):
    def test_six_scripts_match_spec(self):
        total = 0
        for i in IDS:
            s = load(i)
            self.assertEqual(s["id"], i)
            self.assertEqual(len(s["sentences"]), COUNTS[i], i)
            total += len(" ".join(x["say"] for x in s["sentences"]))
        self.assertEqual(total, 5124)

    def test_no_dashes(self):
        for i in IDS:
            for x in load(i)["sentences"]:
                for t in (x["say"], x["show"]):
                    self.assertNotIn("–", t, i)
                    self.assertNotIn("—", t, i)

    def test_show_uses_psi(self):
        for i in IDS:
            for x in load(i)["sentences"]:
                self.assertNotIn("pounds per square inch", x["show"], i)
                if "pounds per square inch" in x["say"]:
                    self.assertIn("psi", x["show"], i)
                    self.assertEqual(x["show"], x["say"].replace("pounds per square inch", "psi"))
                else:
                    self.assertEqual(x["show"], x["say"], i)

    def test_every_sentence_has_a_beat(self):
        for i in IDS:
            beats = [x["beat"] for x in load(i)["sentences"]]
            self.assertTrue(all(beats), i)
            self.assertEqual(len(beats), len(set(beats)), i)


class Facts(unittest.TestCase):
    def test_facts_hold(self):
        import facts
        self.assertEqual(facts.check(facts.load_rows()), [])

    def test_facts_catch_a_change(self):
        import facts
        rows = facts.load_rows()[1:]
        msgs = facts.check(rows)
        self.assertTrue(any("1,276" in m for m in msgs), msgs)


if __name__ == "__main__":
    unittest.main()
