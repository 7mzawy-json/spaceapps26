"""The NASA numbers the video scripts speak or show, recounted from data/tests.web.json.
render.py runs check() before rendering and stops if a number no longer matches the data.
AI-assisted (Claude Code)."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
DATA = ROOT / "data" / "tests.web.json"


def load_rows():
    return json.loads(DATA.read_text(encoding="utf-8"))


def _count(rows, pred):
    return sum(1 for r in rows if pred(r))


def check(rows):
    """Return one message per number that no longer matches. An empty list means every number holds."""
    msgs = []

    def want(label, got, expected):
        if got != expected:
            msgs.append(f"{label}: scripts say {expected:,}, data now gives {got:,}")

    want("test rows", len(rows), 1276)
    for phase, n in (("gas", 660), ("liquid", 353), ("solid", 263)):
        want(f"{phase} rows", _count(rows, lambda r: r.get("fuel_phase") == phase), n)

    moon = [r for r in rows if r.get("o2_pct") is not None and r.get("pressure_psi") is not None
            and 8 <= r["pressure_psi"] <= 12.5 and 24 <= r["o2_pct"] <= 40 and r.get("oxygen_from") != "burner"]
    want("Moon Base range rows", len(moon), 33)
    want("Moon Base range rows that are FLEX droplets",
         _count(moon, lambda r: r.get("accession") == "PSI-69" and r.get("fuel_phase") == "liquid"), 33)

    flex = [r for r in rows if r.get("accession") == "PSI-69" and r.get("o2_pct") is not None]
    low = [r for r in flex if r["o2_pct"] < 15]
    high = [r for r in flex if 30 <= r["o2_pct"] < 50]
    want("FLEX rows below 15% oxygen", len(low), 28)
    want("FLEX rows below 15% that went out", _count(low, lambda r: r.get("outcome") == "self_extinguished"), 27)
    want("FLEX rows 30 to 50% oxygen", len(high), 24)
    for outcome, n in (("self_extinguished", 2), ("burned", 4), ("unknown", 18)):
        want(f"FLEX rows 30 to 50% with outcome {outcome}", _count(high, lambda r: r.get("outcome") == outcome), n)
    return msgs


if __name__ == "__main__":
    m = check(load_rows())
    print("\n".join(m) if m else "All script numbers match data/tests.web.json.")
