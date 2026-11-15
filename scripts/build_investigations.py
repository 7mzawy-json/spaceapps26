"""Build data/investigations.json: one entry per PSI combustion investigation (24), for the investigation cards.

Written with an AI coding assistant (Claude Code); see docs/ai-usage-log.md. Standard library only.

Usage:
    python scripts/fetch_psi.py                # once: NASA's catalogue into data/raw/psi_catalogue.json
    python scripts/build_investigations.py     # this file: writes data/investigations.json

Where each field comes from:
- NASA, copied:   accession, acronym, title, platform, hardware, start, end, objectives, psi_url
- Team, from the challenge statement and NASA's hardware field (not AI):  short_name, stage, hardware_family, fuel_form
- AI-written from NASA's own Objectives / Approach / Earth benefits text, to be read by a person before submission:
  summary, measured, earth
The test counts, ranges and outcomes on the cards are NOT stored here: the site computes them from
data/tests.web.json, so they always match the rows.
"""
import datetime
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, "data", "raw", "psi_catalogue.json")
OUT = os.path.join(ROOT, "data", "investigations.json")
PAGE = "https://psi.nasa.gov/physci/repo/data/investigations/{}"

# Hardware families, as the challenge statement groups them ("Potential Considerations", Hardware).
FAMILIES = {
    "acme": "Combustion Integrated Rack, ACME gas-flame kit",
    "mdca": "Combustion Integrated Rack, droplet apparatus (MDCA)",
    "msg": "Microgravity Science Glovebox, SPICE flow duct",
    "saffire": "SAFFIRE large-sample burns in a Cygnus cargo ship",
    "smoke": "Smoke and dust instruments",
    "ground": "Ground and analysis studies (reuse flight data)",
}
# Fire-safety stage, from the challenge statement: prevention (BASS, BASS-II, SAFFIRE; BRE "a study of materials
# flammability"), detection (SAME, SAME-R; DAFT shares SAME's instrument), suppression (FLEX). Everything else is
# flame science. The team should confirm these tags.
STAGES = {"prevent": "Prevent", "detect": "Detect", "suppress": "Suppress", "basics": "Flame science"}  # "Flame science" matches the ranking on the Analysis page

# accession: (short_name, stage, hardware_family, fuel_form)
TEAM = {
    "PSI-10": ("ACME Flame Design", "basics", "acme", "gas"),
    "PSI-20": ("ACME BRE", "prevent", "acme", "gas"),
    "PSI-21": ("ACME CLD Flame", "basics", "acme", "gas"),
    "PSI-22": ("ACME E-FIELD Flames", "basics", "acme", "gas"),
    "PSI-23": ("ACME s-Flame", "basics", "acme", "gas"),
    "PSI-159": ("ACME CFI-G", "basics", "acme", "gas"),
    "PSI-69": ("FLEX", "suppress", "mdca", "droplet"),
    "PSI-68": ("FLEX-2", "basics", "mdca", "droplet"),
    "PSI-39": ("CFI", "basics", "mdca", "droplet"),
    "PSI-26": ("BASS", "prevent", "msg", "solid"),
    "PSI-25": ("BASS-II", "prevent", "msg", "solid"),
    "PSI-107": ("SPICE", "basics", "msg", "gas"),
    "PSI-106": ("SLICE", "basics", "msg", "gas"),
    "PSI-98": ("SAFFIRE-I", "prevent", "saffire", "solid"),
    "PSI-99": ("SAFFIRE-II", "prevent", "saffire", "solid"),
    "PSI-100": ("SAFFIRE-III", "prevent", "saffire", "solid"),
    "PSI-102": ("SAME", "detect", "smoke", "smoke"),
    "PSI-101": ("SAME-R", "detect", "smoke", "smoke"),
    "PSI-47": ("DAFT / DAFT-2", "detect", "smoke", "dust"),
    "PSI-60": ("SPICE soot analysis", "basics", "ground", "analysis"),
    "PSI-62": ("BASS flame-spread modelling", "prevent", "ground", "analysis"),
    "PSI-115": ("SAME smoke modelling", "detect", "ground", "analysis"),
    "PSI-117": ("FLEX cool-flame modelling", "basics", "ground", "analysis"),
    "PSI-142": ("Cool flame transitions", "basics", "ground", "analysis"),
}

# AI-written (Claude Code) from NASA's Objectives, Approach and Earth benefits text in the PSI catalogue.
# Only facts stated in that text; numbers appear only where NASA's text gives them. A person must read these.
# accession: (summary, measured or None, earth or None)
AI = {
    "PSI-10": ("Burned ethylene and methane in spherical flames, both normal and inverse, to find when they start to soot and when they go out as flow, dilution and pressure change.",
               "Cameras, radiometers, photomultiplier tubes and thermocouples.",
               "Cleaner, more efficient burners, including designs for future power plants."),
    "PSI-20": ("Used porous gas burners that imitate burning solids to find how materials burn in still microgravity air, including NASA's candidate crew atmospheres of 14.7 psi at 21%, 10.2 psi at 26.5% and 8.2 psi at 34% oxygen.",
               None,
               "Spacecraft fire safety: steady burning was seen even with no airflow, though stopping ventilation is a standard step in fighting a fire in space."),
    "PSI-21": ("Studied weak, diluted methane and ethylene coflow flames, measuring shape, lift-off, temperature, soot and extinction as test data for computer models.",
               "Flame shape, lift-off height, gas and soot temperatures, soot luminosity and soot volume fraction.",
               "Better models of the diffusion flames found in most practical combustion devices."),
    "PSI-22": ("Applied electric fields to gas flames to see how the field changes a flame, its soot and its stability. The challenge notes this as a way to mimic partial gravity.",
               "Electric field voltage and the flame's ion current.",
               "Electric fields may help control flames and reduce harmful emissions."),
    "PSI-23": ("Measured how spherical gas flames of hydrogen-methane and ethylene mixtures develop, pulse and go out, to test computer models of flame chemistry.",
               "Spectrally resolved images, flame and burner temperatures, radiative flux, flow rates, temperatures and pressures.",
               "Better understanding of the diffusion flames used in engines and burners."),
    "PSI-25": ("Burned realistic solid samples (rods, slabs, films and fabric) in a small wind tunnel at low airflow and reduced oxygen, to study ignition, spread and extinction and compare with NASA's ground flammability test (NASA-STD-6001 Test 1).",
               None,
               "Helps engineers choose the safest materials and improve firefighting on future missions."),
    "PSI-26": ("Burned cotton-fiberglass fabric, Nomex and Ultem in controlled airflow to compare flight flammability with NASA's ground test, and tested an inert gas extinguishing agent like the one used on the ISS.",
               None,
               "Material selection that accounts for low gravity, not only for 1 g behaviour."),
    "PSI-39": ("Burned droplets of n-dodecane and dodecane blends at 0.25 to 5 atm, some with helium added, to study cool flames, soot and extinction.",
               None,
               "Understanding cool flames helps design new fuels and cleaner, high-efficiency engines."),
    "PSI-47": ("Checked that a modified particle counter (TSI P-Trak) works in microgravity, so the SAME smoke experiment could trust it. It measured test dust, not fire.",
               "Particle counts from the TSI P-Trak, compared with a DustTrak.",
               "More reliable and sensitive smoke detection for the ISS and future spacecraft."),
    "PSI-60": ("Ground study that analysed over 1,600 SPICE flame images with soot models, to explain why flames form different amounts of soot in microgravity and on Earth.",
               "Soot temperature and soot volume fraction, derived from SPICE camera images.",
               "Better soot and flame models for spacecraft and for terrestrial combustion."),
    "PSI-62": ("Ground study that built computer models of flame spread over solids and checked them against BASS and BASS-II, aiming to predict flammability limits for spacecraft materials.",
               None,
               "Tools to screen new materials for flammability, for safer spacecraft."),
    "PSI-68": ("Extended FLEX to two-component fuels and droplet arrays, with pressure from 0.5 to 3 atm and varied oxygen, to study fuel mixing, soot and extinction.",
               None,
               "Cleaner, more efficient liquid-fuel combustion for transport."),
    "PSI-69": ("Burned methanol and heptane droplets to map flammability limits in microgravity and to measure how well gaseous suppressants such as carbon dioxide and helium put flames out.",
               "Droplet burning rates, flame extinction, radiation, soot and temperature.",
               "Better fire safety rules for crews, and insight into suppressants used on Earth."),
    "PSI-98": ("Burned a large cotton-fiberglass fabric sample, about 0.94 m by 0.4 m, inside an empty Cygnus cargo ship to see how fast a large fire grows in low gravity and how its limits compare with NASA's ground screening test.",
               "Oxygen, carbon dioxide, heat, pressure and flame growth, with two video cameras.",
               "A way to study a realistic spacecraft fire that is too risky to light near a crew."),
    "PSI-99": ("Burned several smaller samples, including fabric, silicone and acrylic (PMMA), in a Cygnus cargo ship to study flame growth and low-gravity flammability limits.",
               "Oxygen, carbon dioxide, heat, pressure and flame growth, with two video cameras.",
               "A way to study a realistic spacecraft fire that is too risky to light near a crew."),
    "PSI-100": ("Repeated the large fabric burn in a Cygnus cargo ship at a faster airflow, 30 cm/s instead of 20, with the flame spreading with or against the flow.",
               "Flame images from two cameras, and thermocouples.",
               "A way to study a realistic spacecraft fire that is too risky to light near a crew."),
    "PSI-101": ("Reflight of SAME with a new fire-retardant foam sample and hotter heating, measuring the size of smoke particles in low gravity.",
               "Smoke particle sizes, with the SAME hardware and a new instrument (M-pass).",
               "Data for an advanced fire detector for long missions."),
    "PSI-102": ("Heated spacecraft materials and measured the size of the smoke particles they gave off in low gravity, to judge whether smoke detectors would see microgravity smoke.",
               "Two smoke detectors, thermophoretic smoke samplers and video cameras.",
               "Data for an advanced fire detector for long missions."),
    "PSI-106": ("Studied gas jet flames in a fan-driven flow duct to find when they lift off the burner, and how diluting the fuel with nitrogen changes soot and stability.",
               "Still images from a high-resolution camera, with flow rate and temperature sensors.",
               "Better flame models for efficient, low-emission combustion and fire safety."),
    "PSI-107": ("Found the smoke point of gas jet flames (methane, ethylene, propane and propylene) at different coflow speeds and burner sizes.",
               "Flame images and luminous flame length.",
               "Better understanding of soot, for safer spacecraft and better flame models."),
    "PSI-115": ("Ground study that simulated how smoke particles grow from a heated sample like SAME's, in Earth gravity and in microgravity.",
               None,
               "Better smoke detectors, from knowing how gravity changes smoke."),
    "PSI-117": ("Ground study that used FLEX flight data to build a 3-D model of droplet cool flames and test how heating and drift change whether they survive.",
               None,
               "Low-temperature combustion insight relevant to engine knock and efficiency."),
    "PSI-142": ("Ground study that used FLEX data with new simulations and lab flames to map when cool flames form and when they go out.",
               None,
               "Understanding of warm and cool flames in turbulent and microgravity combustion."),
    "PSI-159": ("Burned propane, butane and other gases in normal and inverse spherical flames to find when cool flames form. The challenge notes these as the highest-oxygen microgravity tests, up to 85% oxygen in the burner stream.",
               "Cameras, radiometers, photomultiplier tubes and thermocouples.",
               "Insight for future high-efficiency, low-emission engines."),
}


def text(v):
    return re.sub(r"\s+", " ", str(v or "")).strip() or None


def hardware(v):
    items = v if isinstance(v, list) else [v]
    names = [text(x.get("Name") if isinstance(x, dict) else x) for x in items if x]
    return "; ".join(n for n in names if n) or None


def main():
    if not os.path.exists(RAW):
        sys.exit("data/raw/psi_catalogue.json is missing: run python scripts/fetch_psi.py first")
    cat = json.load(open(RAW, encoding="utf-8"))
    recs = {r["Accession"]: r for r in cat["combustion"]}
    assert set(recs) == set(TEAM) == set(AI), "accessions in the catalogue, TEAM and AI must match"
    out = []
    for acc, r in recs.items():
        short, stage, fam, form = TEAM[acc]
        summary, measured, earth = AI[acc]
        out.append({
            "accession": acc, "short_name": short, "acronym": r.get("Acronym") or None, "title": text(r.get("Title")),
            "platform": text(r.get("Flight Platform")), "hardware": hardware(r.get("Experiment Hardware")),
            "start": text(r.get("Investigation Start Date")), "end": text(r.get("Investigation End Date")),
            "psi_url": PAGE.format(acc),
            "stage": stage, "hardware_family": fam, "fuel_form": form,
            "summary": summary, "measured": measured, "earth": earth,
            "objectives": text(r.get("Objectives")),
        })
    order = list(FAMILIES)
    out.sort(key=lambda e: (order.index(e["hardware_family"]), list(TEAM).index(e["accession"])))
    doc = {
        "what": "One entry per combustion investigation in NASA's Physical Science Informatics (PSI) catalogue.",
        "source": cat["source"],
        "built_at": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "generated_by": {
            "nasa": "accession, acronym, title, platform, hardware, start, end, objectives and psi_url are copied from NASA's catalogue.",
            "team": "short_name, stage, hardware_family and fuel_form are set by the team from the challenge statement and NASA's hardware field (scripts/build_investigations.py).",
            "ai": "summary, measured and earth were written by an AI assistant (Claude Code) from NASA's own Objectives, Approach and Earth benefits text. They state only what that text says.",
            "human_checked": False,
        },
        "families": FAMILIES,
        "stages": STAGES,
        "investigations": out,
    }
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(doc, f, ensure_ascii=False, indent=1)
        f.write("\n")
    print(f"{len(out)} investigations written to {os.path.relpath(OUT, ROOT)}")


if __name__ == "__main__":
    main()
