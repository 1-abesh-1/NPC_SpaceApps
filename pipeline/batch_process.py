"""
pipeline/batch_process.py

Batch extracts, calibrates, and harmonizes satellite records for 100+ countries
from yearly NASA FIRMS archives in downloads/ into data/processed/countries/{ISO}/
"""

import os
import sys
import time
import zipfile
from pathlib import Path
import pycountry

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from pipeline.country_pipeline import process_country, COUNTRIES_DIR, DOWNLOADS_DIR

MANUAL_MAP = {
    "United_States": ("USA", "United States"),
    "Russian_Federation": ("RUS", "Russia"),
    "Democratic_Republic_of_the_Congo": ("COD", "DR Congo"),
    "Republic_of_Congo": ("COG", "Republic of the Congo"),
    "Dem_Rep_Korea": ("PRK", "North Korea"),
    "Republic_of_Korea": ("KOR", "South Korea"),
    "Lao_PDR": ("LAO", "Laos"),
    "Cote_d_Ivoire": ("CIV", "Ivory Coast"),
    "Czech_Republic": ("CZE", "Czech Republic"),
    "Macedonia_Former_Yugoslav_Republic_of": ("MKD", "North Macedonia"),
    "The_Gambia": ("GMB", "Gambia"),
    "Timor-Leste": ("TLS", "Timor-Leste"),
    "Swaziland": ("SWZ", "Eswatini"),
    "Bolivia": ("BOL", "Bolivia"),
    "Venezuela": ("VEN", "Venezuela"),
    "Vietnam": ("VNM", "Vietnam"),
    "Iran": ("IRN", "Iran"),
    "Syria": ("SYR", "Syria"),
    "Tanzania": ("TZA", "Tanzania"),
    "Moldova": ("MDA", "Moldova"),
    "Kosovo": ("XKX", "Kosovo"),
    "Palestine": ("PSE", "Palestine"),
    "Taiwan": ("TWN", "Taiwan"),
    "Curacao": ("CUW", "Curacao"),
    "Saint_Helena": ("SHN", "Saint Helena"),
    "Heard_I_and_McDonald_Islands": ("HMD", "Heard and McDonald Islands"),
    "United_States_Minor_Outlying_Islands": ("UMI", "US Minor Outlying Islands"),
    "Cape_Verde": ("CPV", "Cabo Verde"),
    "Turkey": ("TUR", "Turkey"),
    "Brunei_Darussalam": ("BRN", "Brunei"),
}


def get_all_country_candidates():
    ref_zip = DOWNLOADS_DIR / "modis_2024_all_countries.zip"
    if not ref_zip.exists():
        raise FileNotFoundError(f"Missing {ref_zip}")

    candidates = []
    with zipfile.ZipFile(ref_zip) as z:
        for info in z.infolist():
            if not info.filename.endswith(".csv"):
                continue
            cfile = os.path.splitext(os.path.basename(info.filename))[0].replace("modis_2024_", "")
            clean = cfile.replace("_", " ")

            if cfile in MANUAL_MAP:
                iso, display = MANUAL_MAP[cfile]
            else:
                try:
                    match = pycountry.countries.search_fuzzy(clean)[0]
                    iso, display = match.alpha_3, match.name
                except Exception:
                    iso, display = cfile[:3].upper(), clean

            candidates.append({
                "iso": iso,
                "file": cfile,
                "name": display,
                "sample_size": info.file_size
            })

    # Sort by fire data sample size descending (prioritize significant wildfire nations)
    candidates.sort(key=lambda x: x["sample_size"], reverse=True)
    return candidates


def run_batch(target_total: int = 105):
    print("==================================================")
    print(f"BATCH SATELLITE PROCESSOR: Target >= {target_total} Countries")
    print("==================================================")

    candidates = get_all_country_candidates()
    print(f"Found {len(candidates)} total countries in FIRMS archives.")

    # Check already processed
    processed_now = 0
    skipped_existing = 0
    failed = 0

    to_process = []
    for c in candidates:
        iso = c["iso"]
        grid_p = COUNTRIES_DIR / iso / "grid.parquet"
        meta_p = COUNTRIES_DIR / iso / "meta.json"
        if grid_p.exists() and meta_p.exists() and grid_p.stat().st_size > 1000:
            skipped_existing += 1
        else:
            to_process.append(c)

    print(f"Already processed and ready: {skipped_existing}")
    needed = max(0, target_total - skipped_existing)
    print(f"Needed to reach target: {needed} more countries.")

    queue = to_process[:needed]
    print(f"Queued for processing: {len(queue)} countries.\n")

    t_start = time.time()
    for idx, c in enumerate(queue, 1):
        iso = c["iso"]
        cfile = c["file"]
        cname = c["name"]
        print(f"[{idx}/{len(queue)}] Starting {cname} ({iso})...")
        t0 = time.time()
        try:
            ok = process_country(iso, country_file=cfile, country_name=cname)
            if ok:
                processed_now += 1
                el = round(time.time() - t0, 2)
                print(f"--> Done {iso} in {el}s\n")
            else:
                failed += 1
        except Exception as e:
            print(f"--> FAILED {iso}: {e}\n")
            failed += 1

    total_ready = skipped_existing + processed_now
    total_time = round(time.time() - t_start, 2)
    print("==================================================")
    print("BATCH PROCESSING COMPLETE")
    print(f"Total countries now available: {total_ready}")
    print(f"Newly processed: {processed_now}, Failed: {failed}")
    print(f"Total runtime: {total_time}s ({round(total_time/60, 2)} minutes)")
    print("==================================================")


if __name__ == "__main__":
    count = int(sys.argv[1]) if len(sys.argv) > 1 else 105
    run_batch(count)
