"""Build data/tests.json from NASA PSI per-test tables.

Written with an AI coding assistant (Claude Code) and reviewed by the team; see docs/ai-usage-log.md.
The data itself is NASA's: every row in the output names the PSI file, line and raw cells it came from.

Usage (standard library only):
    python scripts/build_tests.py --download   # fetch the PSI tables into data/raw/psi/, then build
    python scripts/build_tests.py              # build from tables already in data/raw/psi/

Output:
    data/tests.json       list of rows in the shape frozen in ROADMAP.md, plus provenance fields
    data/tests.meta.json  where the data came from, how it was converted, what was left out and why
"""
import argparse
import csv
import datetime
import io
import json
import os
import re
import sys
import urllib.parse
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, "data", "raw", "psi")
OUT = os.path.join(ROOT, "data", "tests.json")
META = os.path.join(ROOT, "data", "tests.meta.json")

API = "https://psi.nasa.gov/geode-py/ws"
PAGE = "https://psi.nasa.gov/physci/repo/data/investigations/{acc}"

ATM_PSI = 14.696
BAR_PSI = 14.504
MMHG_PSI = 0.019337

# Investigations whose tables hold one row per burning test. Others are listed in EXCLUDED with the reason.
INCLUDED = {
    "PSI-159": "ACME CFI-G",
    "PSI-10": "ACME Flame Design",
    "PSI-69": "FLEX",
    "PSI-39": "CFI",
    "PSI-25": "BASS-II",
    "PSI-26": "BASS",
    "PSI-98": "SAFFIRE-I",
    "PSI-99": "SAFFIRE-II",
    "PSI-100": "SAFFIRE-III",
}
EXCLUDED = {
    "PSI-20": "ACME BRE: one row per test day, several oxygen values in one cell, no per-test pressure",
    "PSI-21": "ACME CLD Flame: one row per test day, fuel concentration ranges only",
    "PSI-22": "ACME E-FIELD Flames: one row per test day, no oxygen or pressure",
    "PSI-23": "ACME s-Flame: one row per test day, atmosphere as text (~21% O2)",
    "PSI-68": "FLEX-2: one row per fuel with ranges of oxygen and pressure, not per test",
    "PSI-101": "SAME-R: smoke measurement, nothing burned in a flame test",
    "PSI-102": "SAME: smoke measurement, nothing burned in a flame test",
    "PSI-47": "DAFT: dust measurement",
    "PSI-106": "SLICE: test date and fuel only",
    "PSI-107": "SPICE: soot of gas jets in air; the table gives no oxygen or pressure",
    "PSI-142": "Cool flame study: list of figures in publications, not tests",
    "PSI-60, PSI-62, PSI-115, PSI-117": "analysis or ground studies with no per-test table",
}


def download(accessions):
    os.makedirs(RAW, exist_ok=True)
    for acc in accessions:
        with urllib.request.urlopen(f"{API}/repo/investigations/{acc}", timeout=60) as r:
            record = json.load(r)
        for item in find_tables(record):
            name = item["file_name"]
            q = urllib.parse.quote(name)
            with urllib.request.urlopen(f"{API}/studies/{acc}/download?file={q}&redirect=false", timeout=60) as r:
                signed = r.read().decode().strip()
            with urllib.request.urlopen(signed, timeout=60) as r:
                data = r.read()
            with open(os.path.join(RAW, name), "wb") as f:
                f.write(data)
            print("downloaded", name, len(data), "bytes")


def find_tables(o):
    if isinstance(o, dict):
        for k, v in o.items():
            if k == "experimentalTable":
                for it in v if isinstance(v, list) else [v]:
                    if isinstance(it, dict) and it.get("file_name"):
                        yield it
            else:
                yield from find_tables(v)
    elif isinstance(o, list):
        for x in o:
            yield from find_tables(x)


def read_table(pattern):
    names = [n for n in sorted(os.listdir(RAW)) if re.fullmatch(pattern, n)]
    if len(names) != 1:
        sys.exit(f"expected one file matching {pattern!r} in {RAW}, found {names}. Run with --download.")
    name = names[0]
    raw = open(os.path.join(RAW, name), "rb").read()
    for enc in ("utf-8-sig", "cp1252"):
        try:
            text = raw.decode(enc)
            break
        except UnicodeDecodeError:
            pass
    reader = csv.reader(io.StringIO(text))
    header = [h.strip() for h in next(reader)]
    rows = []
    for cells in reader:
        if not any(c.strip() for c in cells):
            continue
        rows.append((reader.line_num, dict(zip(header, [c.strip() for c in cells]))))
    return name, header, rows


def col(header, prefix):
    """Find a column by the start of its header (some PSI headers are long or carry odd spacing)."""
    for h in header:
        if h.startswith(prefix):
            return h
    sys.exit(f"no column starting {prefix!r} in {header}")


def number(s):
    """A plain number, optionally marked approximate with '~'. Ranges, words and blanks give None."""
    if s is None:
        return None
    m = re.fullmatch(r"~?\s*(-?\d*\.?\d+)\s*(?:atm|bar|psi|mmHg|cm/s)?", s.strip())
    return float(m.group(1)) if m else None


def r2(x):
    return None if x is None else round(x, 2)


rows_out = []


def emit(acc, name, line, cells, used, *, test_id, fuel, fuel_phase, o2_pct, oxygen_from, pressure_psi,
         flow_cm_s, outcome, flame_type, ignited=None):
    if pressure_psi is not None and pressure_psi <= 0:
        pressure_psi = None  # a burning test cannot run in vacuum: a 0 in the table means not recorded
    rows_out.append({
        # Shape frozen in ROADMAP.md ("File layout")
        "accession": acc,
        "test_id": test_id or None,
        "fuel": fuel or None,
        "fuel_phase": fuel_phase,
        "o2_pct": r2(o2_pct),
        "pressure_psi": r2(pressure_psi),
        "pressure_from": "test" if pressure_psi is not None else None,
        "flow_cm_s": r2(flow_cm_s),
        "gravity": "0g",
        "outcome": outcome,
        "source": name,
        # Added context
        "investigation": INCLUDED[acc],
        "flame_type": flame_type,
        "oxygen_from": oxygen_from if o2_pct is not None else None,
        "ignited": ignited,
        "source_url": PAGE.format(acc=acc),
        "source_line": line,
        "raw": {c: cells.get(c, "") for c in used},
    })


def cfi_g():
    for kind in ("Normal", "Inverse"):
        name, h, rows = read_table(rf"PSI-159_Experimental table_CFI-G_{kind} Flames\.csv")
        o2c = col(h, "XO2 before test") if kind == "Normal" else col(h, "XO2")
        endc = col(h, "Self-ext") if kind == "Normal" else col(h, "Self -ext")
        pc, ign = col(h, "approx p (bar)"), col(h, "Hot ignition")
        for line, c in rows:
            hot = c[ign].lower()
            ignited = True if hot in ("yes", "flash") else False if hot == "no" else None
            end = c[endc].upper()
            outcome = ("self_extinguished" if ignited and end == "SE" else
                       "burned" if ignited and end == "FT" else "unknown")
            frac, p = number(c[o2c]), number(c[pc])
            emit("PSI-159", name, line, c, ["Test", "Fuel", o2c, pc, ign, endc, col(h, "Comments")],
                 test_id=c["Test"], fuel=c["Fuel"], fuel_phase="gas",
                 o2_pct=None if frac is None else frac * 100,
                 oxygen_from="chamber" if kind == "Normal" else "burner",
                 pressure_psi=None if p is None else p * BAR_PSI, flow_cm_s=None, outcome=outcome,
                 flame_type=kind.lower(), ignited=ignited)


def flame_design():
    for kind in ("Normal", "Inverse"):
        name, h, rows = read_table(rf"PSI-10_Experimental table_Flame Design_{kind} Flame\.csv")
        o2c = col(h, "XO2 (init)") if kind == "Normal" else col(h, "XO2")
        pc = col(h, "pmean (atm)")
        for line, c in rows:
            frac, p = number(c[o2c]), number(c[pc])
            fuel = c.get("Fuel") if kind == "Normal" else "C2H4"
            emit("PSI-10", name, line, c, [x for x in ["Test", "Fuel", o2c, pc] if x in c],
                 test_id=c["Test"], fuel=fuel, fuel_phase="gas",
                 o2_pct=None if frac is None else frac * 100,
                 oxygen_from="chamber" if kind == "Normal" else "burner",
                 pressure_psi=None if p is None else p * ATM_PSI, flow_cm_s=None, outcome="unknown",
                 flame_type=kind.lower())


def flex():
    name, h, rows = read_table(r"PSI-69_Experimental table_FLEX\.csv")
    o2c, pc, hec = col(h, "O initial"), col(h, "Ambient pressure"), col(h, "He initial")
    ends = {"extinction": "self_extinguished", "completion": "burned"}
    for line, c in rows:
        frac, p = number(c[o2c]), number(c[pc])
        emit("PSI-69", name, line, c, ["FLEX Test #", "FLEX Identifier", "Fuel", o2c, pc, hec, "Test end"],
             test_id=c["FLEX Identifier"], fuel=c["Fuel"], fuel_phase="liquid",
             o2_pct=None if frac is None else frac * 100, oxygen_from="chamber",
             pressure_psi=None if p is None else p * MMHG_PSI, flow_cm_s=None,
             outcome=ends.get(c["Test end"].lower(), "unknown"), flame_type="droplet")


def cfi():
    name, h, rows = read_table(r"PSI-39_Experimental table_CFI\.csv")
    for line, c in rows:
        frac, p = number(c["Oxygen"]), number(c["Pressure"])
        unit = re.search(r"(atm|bar|psi)", c["Pressure"])
        factor = BAR_PSI if unit and unit.group(1) == "bar" else 1 if unit and unit.group(1) == "psi" else ATM_PSI
        emit("PSI-39", name, line, c, ["Flex Number", "Fuel", "Oxygen", "Pressure", "Helium"],
             test_id=c["Flex Number"], fuel=c["Fuel"], fuel_phase="liquid",
             o2_pct=None if frac is None else frac * 100, oxygen_from="chamber",
             pressure_psi=None if p is None else p * factor, flow_cm_s=None, outcome="unknown",
             flame_type="droplet")


def bass_ii():
    name, h, rows = read_table(r"PSI-25_Experimental table_BASS-II\.csv")
    o2c = col(h, "Calibrated  initial O2")
    for line, c in rows:
        emit("PSI-25", name, line, c, ["Test #", "Fuel Sample Material", o2c, "Fan display"],
             test_id=c["Test #"], fuel=c["Fuel Sample Material"], fuel_phase="solid",
             o2_pct=number(c[o2c]), oxygen_from="chamber", pressure_psi=None, flow_cm_s=None,
             outcome="unknown", flame_type="solid sample")


def bass():
    name, h, rows = read_table(r"PSI-26_Experimental table_BASS\.csv")
    for line, c in rows:
        emit("PSI-26", name, line, c, ["As Run Test #", "Test #", "Fuel Sample Material"],
             test_id=c["As Run Test #"], fuel=c["Fuel Sample Material"], fuel_phase="solid",
             o2_pct=None, oxygen_from=None, pressure_psi=None, flow_cm_s=None, outcome="unknown",
             flame_type="solid sample")


def saffire():
    for acc, pattern in (("PSI-98", r"PSI-98_.*SAFFIRE-1\.csv"), ("PSI-99", r"PSI-99_.*SAFFIRE-2\.csv"),
                         ("PSI-100", r"PSI-100_.*SAFFIRE-3\.csv")):
        name, h, rows = read_table(pattern)
        flowc = col(h, "Air Flow")
        o2c = next((x for x in h if x.startswith("Percent O2")), None)
        burnc = next((x for x in h if x.startswith("Burn Time")), None)
        for line, c in rows:
            sid = c[col(h, "Sample Number")]
            if "/" in sid or sid.lower().startswith("note"):
                continue  # flow-visualisation runs and footnotes, not burn tests
            burn = c.get(burnc, "") if burnc else ""
            burned = re.fullmatch(r"\d+(\.\d+)?\s*s?", burn) is not None
            used = [x for x in [col(h, "Sample Number"), "Material", flowc, o2c, burnc] if x]
            emit(acc, name, line, c, used, test_id=sid, fuel=c["Material"], fuel_phase="solid",
                 o2_pct=number(c[o2c]) if o2c else None, oxygen_from="chamber", pressure_psi=None,
                 flow_cm_s=number(c[flowc]), outcome="burned" if burned else "unknown",
                 flame_type="solid sample")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--download", action="store_true", help="fetch the PSI tables first")
    args = ap.parse_args()
    if args.download:
        download(INCLUDED)
    for build in (cfi_g, flame_design, flex, cfi, bass_ii, bass, saffire):
        build()

    plottable = [r for r in rows_out if r["o2_pct"] is not None and r["pressure_psi"] is not None]
    meta = {
        "what": "Per-test rows from NASA Physical Science Informatics (PSI) combustion investigations, one row per test.",
        "source": "NASA Physical Science Informatics, https://psi.nasa.gov/ (NASA open data). Each row names its file "
                  "(source), its line in that file (source_line), the investigation page (source_url) and the raw cells used (raw).",
        "retrieved": "2026-11-14",
        "how_to_reproduce": "python scripts/build_tests.py --download",
        "download_method": [
            f"GET {API}/repo/investigations/PSI-<n> lists files; the per-test tables are under 'experimentalTable'.",
            f"GET {API}/studies/PSI-<n>/download?file=<file_name>&redirect=false returns a short-lived link to the CSV.",
        ],
        "generated_by": "scripts/build_tests.py, written with an AI coding assistant (Claude Code). Values are copied "
                        "or unit-converted from NASA's tables by code; no value was typed or estimated by AI.",
        "built_at": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "conversions": {"atm_to_psi": ATM_PSI, "bar_to_psi": BAR_PSI, "mmHg_to_psi": MMHG_PSI,
                        "oxygen": "mole fractions multiplied by 100 to give o2_pct"},
        "field_notes": {
            "pressure_from": "'test' when the table gives pressure for the test; null when no pressure is stated. "
                             "No investigation text states a cabin pressure for BASS, BASS-II or SAFFIRE, so those rows "
                             "have pressure_psi null and are not plotted.",
            "oxygen_from": "'chamber' is the surrounding atmosphere. 'burner' is the oxygen stream of an inverse flame "
                           "(fuel fills the chamber), which is not a cabin atmosphere: keep these off the cabin map or mark them.",
            "outcome": "CFI-G: ignited and SE gives self_extinguished, ignited and FT (flow terminated) gives burned, "
                       "no ignition gives unknown with ignited=false. FLEX: Extinction gives self_extinguished, Completion "
                       "gives burned, Disruption gives unknown. SAFFIRE: a burn time in seconds gives burned. "
                       "All other rows: unknown (the table records no outcome).",
            "pressure_psi": "A pressure of 0 in a table (FLEX test C11M201 lists 0 mmHg) is read as not recorded and gives null.",
            "o2_pct": "Ranges such as '21.5 - 21.7' or '22.1 to 22.0' give null; approximate values such as '~ 21.5' are kept.",
            "gravity": "All tests ran in microgravity (ISS or the Cygnus spacecraft).",
            "flow_cm_s": "Given only by SAFFIRE. BASS-II records a fan display setting, not a speed, so flow is null.",
        },
        "included": INCLUDED,
        "excluded": EXCLUDED,
        "counts": {
            "rows": len(rows_out),
            "plottable_rows": len(plottable),
            "plottable_chamber_oxygen_rows": sum(1 for r in plottable if r["oxygen_from"] == "chamber"),
            "by_investigation": {v: sum(1 for r in rows_out if r["investigation"] == v) for v in INCLUDED.values()},
        },
    }
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(rows_out, f, ensure_ascii=False, indent=1)
        f.write("\n")
    with open(META, "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print(json.dumps(meta["counts"], indent=2))


if __name__ == "__main__":
    main()
