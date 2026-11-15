"""Fetch NASA's PSI investigation catalogue and keep the combustion records (ROADMAP.md (archived), Phase 1).

Written with an AI coding assistant (Claude Code); see docs/ai-usage-log.md. Standard library only.

Usage:
    python scripts/fetch_psi.py        # writes data/raw/psi_catalogue.json (every field, as NASA serves it)

The catalogue is one public JSON endpoint (no login). `q=` does not filter and `page=` is ignored, so the script reads
two pages with `from=` and keeps Research Area == "Combustion Science". scripts/build_investigations.py turns the
result into data/investigations.json.
"""
import json
import os
import sys
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "data", "raw", "psi_catalogue.json")
URL = "https://psi.nasa.gov/geode-py/ws/repo/search?q=&data_source=psi&data_type=investigation&size=100"


def main():
    hits, total = [], None
    while total is None or len(hits) < total:
        url = URL + (f"&from={len(hits)}" if hits else "")
        with urllib.request.urlopen(url, timeout=60) as r:
            page = json.load(r)["hits"]
        total = page["total"]
        if not page["hits"]:
            break
        hits += page["hits"]
    records = [h["_source"] for h in hits]
    comb = [r for r in records if r.get("Research Area") == "Combustion Science"]
    if len(comb) != 24:
        sys.exit(f"expected 24 combustion records, found {len(comb)} of {len(records)}: stop and check the endpoint")
    comb.sort(key=lambda r: int(r["Accession"].split("-")[1]))
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump({"source": URL, "total_records": len(records), "combustion": comb}, f, ensure_ascii=False, indent=1)
    for r in comb:
        print(f"{r['Accession']:8} {r.get('Acronym') or '(none)':22} {r['Title'][:70]}")
    print(f"{len(comb)} combustion records of {len(records)} written to {os.path.relpath(OUT, ROOT)}")


if __name__ == "__main__":
    main()
