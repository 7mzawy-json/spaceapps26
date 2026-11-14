"""Independent check of data/tests.json and data/tests.web.json against NASA's own cells.

Written with an AI coding assistant (Claude Code). It does not import build_tests.py: every value is derived a second
time from the raw NASA cells that tests.json keeps beside each row, so a mistake in the build would show up here.

    python scripts/check_data.py                 # checks the committed data files
    python scripts/check_data.py --against-nasa  # also re-downloads the tables from NASA PSI and compares every row

Standard library only. Exits with status 1 if any check fails.
"""
import json
import os
import re
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
full = json.load(open(os.path.join(ROOT, "data", "tests.json"), encoding="utf-8"))
web = json.load(open(os.path.join(ROOT, "data", "tests.web.json"), encoding="utf-8"))
failed = []


def check(name, ok, detail=""):
    print(("PASS " if ok else "FAIL ") + name + ("" if ok else "  " + str(detail)[:300]))
    if not ok:
        failed.append(name)


def num(cell):
    m = re.fullmatch(r"~?\s*(-?\d*\.?\d+)\s*(?:atm|bar|psi|mmHg|cm/s|s)?", (cell or "").strip())
    return float(m.group(1)) if m else None


def close(a, b, tol=0.006):
    return (a is None and b is None) or (a is not None and b is not None and abs(a - b) <= tol)


def cell(row, start):
    """The raw NASA cell whose column name starts with the given text."""
    for k, v in row["raw"].items():
        if k.startswith(start):
            return v
    return None


kept = [r for r in full if r["exclude_reason"] is None]
check("web file holds every kept row, in order", len(web) == len(kept) and all(
    w["source"] == r["source"] and w["source_line"] == r["source_line"] for w, r in zip(web, kept)))
check("web values equal the full record", all(all(w[k] == r[k] for k in w) for w, r in zip(web, kept)))
check("left-out rows are only exact repeats and log entries", all(
    ("exact repeat" in r["exclude_reason"]) or ("not a burn test" in r["exclude_reason"]) for r in full if r["exclude_reason"]))

bad = []
for r in full:
    inv, raw = r["investigation"], r["raw"]
    if inv == "FLEX":
        o2, n2, co2, he = (num(cell(r, c)) for c in ("O initial", "N initial", "CO initial", "He initial"))
        mm = num(cell(r, "Ambient pressure"))
        want_p = None if not mm else mm * 0.019337
        end = (raw.get("Test end") or "").lower()
        want_out = {"extinction": "self_extinguished", "completion": "burned"}.get(end, "unknown")
        ok = (close(r["o2_pct"], None if o2 is None else o2 * 100) and close(r["n2_pct"], None if n2 is None else n2 * 100)
              and close(r["co2_pct"], None if co2 is None else co2 * 100) and close(r["he_pct"], None if he is None else he * 100)
              and close(r["pressure_psi"], want_p) and r["outcome"] == want_out
              and close(r["burn_time_s"], num(cell(r, "Burn time")), 1e-9) and r["oxygen_from"] in ("chamber", None)
              and bool(r["burn_time_approx"]) == (cell(r, "Burn time") or "").strip().startswith("~"))
    elif inv == "ACME CFI-G":
        x, bar = num(cell(r, "XO2")), num(cell(r, "approx p"))
        hot, end = (cell(r, "Hot ignition") or "").lower(), (cell(r, "Self") or "").upper()
        ign = True if hot in ("yes", "flash") else False if hot == "no" else None
        want_out = "self_extinguished" if ign and end == "SE" else "burned" if ign and end == "FT" else "unknown"
        ok = (close(r["o2_pct"], None if x is None else x * 100) and close(r["pressure_psi"], None if bar is None else bar * 14.504)
              and r["ignited"] == ign and r["outcome"] == want_out and close(r["burn_time_s"], num(cell(r, "burn time")), 1e-9)
              and r["oxygen_from"] == (None if x is None else "burner" if r["flame_type"] == "inverse" else "chamber"))
    elif inv == "ACME Flame Design":
        x, atm = num(cell(r, "XO2")), num(cell(r, "pmean"))
        ok = (close(r["o2_pct"], None if x is None else x * 100) and close(r["pressure_psi"], None if atm is None else atm * 14.696)
              and r["outcome"] == "unknown")
    elif inv == "CFI":
        x, p = num(raw.get("Oxygen")), num(raw.get("Pressure"))
        unit = re.search(r"(atm|bar|psi)", raw.get("Pressure") or "")
        f = {"bar": 14.504, "psi": 1}.get(unit.group(1) if unit else "", 14.696)
        ok = (close(r["o2_pct"], None if x is None else x * 100) and close(r["pressure_psi"], None if p is None else p * f)
              and close(r["n2_pct"], None if num(raw.get("Nitrogen")) is None else num(raw.get("Nitrogen")) * 100)
              and close(r["he_pct"], None if num(raw.get("Helium")) is None else num(raw.get("Helium")) * 100))
    elif inv == "BASS-II":
        ok = close(r["o2_pct"], num(cell(r, "Calibrated  initial O2"))) and r["pressure_psi"] is None
    elif inv == "BASS":
        ok = r["o2_pct"] is None and r["pressure_psi"] is None and r["outcome"] == "unknown"
    else:  # SAFFIRE
        burn = (cell(r, "Burn Time") or "").strip()
        secs = num(burn) if re.fullmatch(r"\d*\.?\d+\s*s?", burn) else None
        want_out = "burned" if secs is not None else "self_extinguished" if burn.lower() == "insignificant" else "unknown"
        ok = (close(r["o2_pct"], num(cell(r, "Percent O2"))) and close(r["flow_cm_s"], num(cell(r, "Air Flow")))
              and r["pressure_psi"] is None and r["outcome"] == want_out and close(r["burn_time_s"], secs, 1e-9))
    if r["gravity"] != "0g":
        ok = False
    if not ok:
        bad.append((inv, r["test_id"], r["source_line"]))
check("every row matches its raw NASA cells (oxygen, pressure, other gases, outcome, burn time)", not bad, bad[:8])

by = {}
for r in web:
    by[r["investigation"]] = by.get(r["investigation"], 0) + 1
check("row counts by investigation", by == {"ACME CFI-G": 333, "ACME Flame Design": 327, "FLEX": 274, "CFI": 79, "BASS-II": 129,
                                            "BASS": 121, "SAFFIRE-I": 2, "SAFFIRE-II": 9, "SAFFIRE-III": 2}, by)
solid = [r for r in web if r["fuel_phase"] == "solid"]
check("no solid-material row has a pressure, so none is placed on the map", all(r["pressure_psi"] is None for r in solid))
check("inverse flames carry burner oxygen and nothing else does", all(
    (r["oxygen_from"] == "burner") == (r["flame_type"] == "inverse" and r["o2_pct"] is not None) for r in web))

if "--against-nasa" in sys.argv:
    # Rebuild from a fresh download in a temporary folder and compare with the committed files, row by row.
    code = (
        "import importlib.util, json, os, sys\n"
        "root, tmp = sys.argv[1], sys.argv[2]\n"
        "spec = importlib.util.spec_from_file_location('b', os.path.join(root, 'scripts', 'build_tests.py'))\n"
        "m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)\n"
        "m.RAW = os.path.join(tmp, 'raw'); m.OUT = os.path.join(tmp, 't.json'); m.WEB = os.path.join(tmp, 'w.json'); m.META = os.path.join(tmp, 'm.json')\n"
        "m.download(m.INCLUDED); sys.argv = ['x']; m.main()\n"
    )
    with tempfile.TemporaryDirectory() as tmp:
        run = subprocess.run([sys.executable, "-c", code, ROOT, tmp], capture_output=True, text=True)
        if run.returncode:
            check("fresh download from NASA PSI", False, run.stderr[-300:])
        else:
            check("committed tests.json equals a fresh download from NASA PSI", json.load(open(os.path.join(tmp, "t.json"), encoding="utf-8")) == full)
            check("committed tests.web.json equals a fresh download from NASA PSI", json.load(open(os.path.join(tmp, "w.json"), encoding="utf-8")) == web)

print(("ALL DATA CHECKS PASSED" if not failed else str(len(failed)) + " DATA CHECKS FAILED"))
sys.exit(1 if failed else 0)
