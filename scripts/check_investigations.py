"""Check data/investigations.json against NASA's catalogue, the test rows and the site's table.

Written with an AI coding assistant (Claude Code). Standard library only. Exits with status 1 if any check fails.

    python scripts/check_investigations.py

Uses data/raw/psi_catalogue.json when it exists (run scripts/fetch_psi.py first) to check that every number in the
AI-written text appears in NASA's own text for that investigation. Without it, that check is skipped and says so.
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
inv = json.load(open(os.path.join(ROOT, "data", "investigations.json"), encoding="utf-8"))
web = json.load(open(os.path.join(ROOT, "data", "tests.web.json"), encoding="utf-8"))
app = open(os.path.join(ROOT, "site", "assets", "app.js"), encoding="utf-8").read()
raw_path = os.path.join(ROOT, "data", "raw", "psi_catalogue.json")
failed = []


def check(name, ok, detail=""):
    print(("PASS " if ok else "FAIL ") + name + ("" if ok else "  " + str(detail)[:400]))
    if not ok:
        failed.append(name)


E = inv["investigations"]
accs = [e["accession"] for e in E]
check("24 investigations, no repeats", len(E) == 24 and len(set(accs)) == 24, accs)
check("every stage is a known stage", all(e["stage"] in inv["stages"] for e in E), [e["stage"] for e in E])
check("every hardware family is a known family", all(e["hardware_family"] in inv["families"] for e in E))
check("every entry has a summary and a PSI link", all(e["summary"] and e["psi_url"].endswith(e["accession"]) for e in E))
check("AI-written fields are declared in generated_by", "ai" in inv["generated_by"] and "human_checked" in inv["generated_by"])

# the table in app.js lists the same 24 records as the cards
cat = re.findall(r"\['(PSI-\d+)'", app[app.index("var CAT = ["):app.index("];", app.index("var CAT = ["))])
check("site table and cards list the same investigations", sorted(cat) == sorted(accs), sorted(set(cat) ^ set(accs)))

# every test row belongs to a known investigation, and the card's fuel form agrees with the rows
row_accs = sorted({r["accession"] for r in web})
check("every test row's accession has a card", set(row_accs) <= set(accs), set(row_accs) - set(accs))
PHASE = {"gas": "gas", "droplet": "liquid", "solid": "solid"}
bad = []
for e in E:
    phases = {r["fuel_phase"] for r in web if r["accession"] == e["accession"]}
    if phases and phases != {PHASE.get(e["fuel_form"])}:
        bad.append((e["accession"], e["fuel_form"], sorted(phases)))
check("fuel form on each card matches its rows' fuel phase", not bad, bad)

# numbers in AI-written text must appear in NASA's own text for that investigation (or the challenge statement)
CHALLENGE = open(os.path.join(ROOT, "docs", "challenge", "flame-in-freefall.md"), encoding="utf-8").read()
ALLOW = {"PSI-159": {"85"}, "PSI-25": {"6001", "1"}, "PSI-26": {"6001", "1"}, "PSI-117": {"3"}}   # 85% from the challenge statement; NASA-STD-6001 Test 1; "3-D"
if os.path.exists(raw_path):
    raw = {r["Accession"]: r for r in json.load(open(raw_path, encoding="utf-8"))["combustion"]}
    missing = []
    for e in E:
        r = raw[e["accession"]]
        src = " ".join(str(r.get(k) or "") for k in ("Objectives", "Approach", "Research Impacts/Earth Benefits", "Hypothesis"))
        src = src.replace(",", "")
        for field in ("summary", "measured", "earth"):
            for n in re.findall(r"\d+(?:\.\d+)?", (e.get(field) or "").replace(",", "")):
                if n in ALLOW.get(e["accession"], set()):
                    continue
                if not re.search(r"(?<![\d.])" + re.escape(n) + r"(?![\d])", src):
                    missing.append((e["accession"], field, n))
    check("every number in the AI-written text appears in NASA's text", not missing, missing)
    check("ALLOW list items are real (85% oxygen in the challenge statement)", "85%" in CHALLENGE or "85 %" in CHALLENGE)
    check("copied NASA objectives match the catalogue", all(
        re.sub(r"\s+", " ", raw[e["accession"]].get("Objectives") or "").strip() == (e["objectives"] or "") for e in E))
else:
    print("SKIP numbers in AI-written text: data/raw/psi_catalogue.json is missing (run python scripts/fetch_psi.py)")

print()
print(f"{len(failed)} failed" if failed else "All checks passed")
sys.exit(1 if failed else 0)
