"""
pipeline/country_pipeline.py

Extracts NASA FIRMS active fire records for a specific country,
cleans, dedupes to 1 km footprints, aggregates onto a 0.25-deg daily grid,
calibrates MODIS and VIIRS (calculating k), harmonizes into a 23-year series,
and outputs:
  - data/processed/countries/{ISO}/grid.parquet
  - data/processed/countries/{ISO}/meta.json
  - data/processed/countries/{ISO}/monthly_overlap.csv
  - updates data/processed/countries.json
"""

import os
import json
import zipfile
from pathlib import Path
import numpy as np
import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq

ROOT = Path(__file__).resolve().parent.parent
DOWNLOADS_DIR = ROOT / "downloads"
RAW_DIR = ROOT / "data" / "raw"
PROCESSED_DIR = ROOT / "data" / "processed"
COUNTRIES_DIR = PROCESSED_DIR / "countries"
REGISTRY_PATH = PROCESSED_DIR / "countries.json"

STEP = 0.25  # 0.25 degree grid cells (~25 km)
START_DATE = pd.Timestamp("2003-01-01")
SWITCH_DATE = pd.Timestamp("2012-02-01")
OVERLAP_START = pd.Timestamp("2012-02-01")
OVERLAP_END = pd.Timestamp("2025-12-31")

DEFAULT_POOLED_K = 0.478

# Map ISO3 to Country File Names (in FIRMS zips) and display names
COUNTRY_CONFIG = {
    "ARG": {"file": "Argentina", "name": "Argentina"},
    "CHL": {"file": "Chile", "name": "Chile"},
    "URY": {"file": "Uruguay", "name": "Uruguay"},
    "PRY": {"file": "Paraguay", "name": "Paraguay"},
    "AUS": {"file": "Australia", "name": "Australia"},
    "BRA": {"file": "Brazil", "name": "Brazil"},
    "USA": {"file": "United_States", "name": "United States"},
    "CAN": {"file": "Canada", "name": "Canada"},
    "GRC": {"file": "Greece", "name": "Greece"},
    "PRT": {"file": "Portugal", "name": "Portugal"},
}
COUNTRY_MAP = {k: v["name"] for k, v in COUNTRY_CONFIG.items()}


def clean_modis(df: pd.DataFrame) -> pd.DataFrame:
    """Keep MODIS detections with confidence >= 30."""
    df = df.copy()
    if "confidence" in df.columns:
        df["confidence"] = pd.to_numeric(df["confidence"], errors="coerce").fillna(0)
        df = df[df["confidence"] >= 30]
    df["acq_date"] = pd.to_datetime(df["acq_date"])
    return df[["acq_date", "latitude", "longitude"]].copy()


def clean_viirs(df: pd.DataFrame) -> pd.DataFrame:
    """Keep VIIRS detections with nominal ('n') or high ('h') confidence."""
    df = df.copy()
    if "confidence" in df.columns:
        conf = df["confidence"].astype(str).str.lower().str.strip().str[0]
        df = df[conf.isin(["n", "h"])]
    df["acq_date"] = pd.to_datetime(df["acq_date"])
    return df[["acq_date", "latitude", "longitude"]].copy()


def dedupe_footprints(df: pd.DataFrame) -> pd.DataFrame:
    """Snap detections to 0.01 deg (~1 km) and deduplicate per (date, square)."""
    df = df.copy()
    df["k_lat"] = np.floor(df["latitude"] / 0.01)
    df["k_lon"] = np.floor(df["longitude"] / 0.01)
    return df.drop_duplicates(subset=["acq_date", "k_lat", "k_lon"]).drop(columns=["k_lat", "k_lon"])


def to_grid(df: pd.DataFrame) -> pd.DataFrame:
    """Group footprints into 0.25-deg cells per day."""
    if df.empty:
        return pd.DataFrame(columns=["acq_date", "lat_idx", "lon_idx", "n"])
    
    df = df.assign(
        lat_idx=np.floor(df["latitude"] / STEP).astype("int16"),
        lon_idx=np.floor(df["longitude"] / STEP).astype("int16"),
    )
    return (
        df.groupby(["acq_date", "lat_idx", "lon_idx"], as_index=False)
        .size()
        .rename(columns={"size": "n"})
    )


def read_from_zips(sensor: str, country_name: str, years: range) -> pd.DataFrame:
    """Extract and combine country CSV from yearly FIRMS zips in downloads/."""
    parts = []
    cols = ["latitude", "longitude", "acq_date", "confidence"]
    
    for year in years:
        if sensor == "modis":
            zip_name = f"modis_{year}_all_countries.zip"
            expected_csv = f"modis_{year}_{country_name}.csv".lower()
        else:
            zip_name = f"viirs-snpp_{year}_all_countries.zip"
            expected_csv = f"viirs-snpp_{year}_{country_name}.csv".lower()
            
        zip_path = DOWNLOADS_DIR / zip_name
        if not zip_path.exists() or zip_path.stat().st_size < 1_000_000:
            continue
            
        try:
            with zipfile.ZipFile(zip_path) as z:
                match = None
                for member in z.namelist():
                    if os.path.basename(member).lower() == expected_csv:
                        match = member
                        break
                if match:
                    with z.open(match) as f:
                        sub = pd.read_csv(f, usecols=cols, low_memory=False)
                        parts.append(sub)
        except Exception as e:
            print(f"  Warning reading {zip_name}: {e}")
            
    if not parts:
        return pd.DataFrame(columns=cols)
    return pd.concat(parts, ignore_index=True)


def load_country_data(iso: str, country_name: str):
    """
    Load raw MODIS and VIIRS records.
    Prioritizes existing raw CSVs in data/raw if available,
    otherwise reads from downloads zips.
    """
    modis_raw = None
    viirs_raw = None
    
    # Check if raw files exist in data/raw or downloads/ (e.g. Argentina custom export)
    # Check for fire_archive_M-C61 and fire_archive_SV-C2
    modis_csvs = list(RAW_DIR.glob("*M-C61*.csv")) or list(DOWNLOADS_DIR.glob("*M-C61*.csv"))
    viirs_csvs = list(RAW_DIR.glob("*SV-C2*.csv")) or list(DOWNLOADS_DIR.glob("*SV-C2*.csv"))
    
    if iso == "ARG" and modis_csvs and viirs_csvs:
        print("  Using local Argentina standalone CSV files...")
        cols = ["latitude", "longitude", "acq_date", "confidence"]
        # MODIS
        m_parts = [pd.read_csv(p, usecols=cols, low_memory=False) for p in set(modis_csvs)]
        modis_raw = pd.concat(m_parts, ignore_index=True)
        # VIIRS
        v_parts = [pd.read_csv(p, usecols=cols, low_memory=False) for p in set(viirs_csvs)]
        viirs_raw = pd.concat(v_parts, ignore_index=True)
    else:
        print(f"  Reading yearly zips for {country_name}...")
        modis_raw = read_from_zips("modis", country_name, range(2003, 2026))
        viirs_raw = read_from_zips("viirs", country_name, range(2012, 2026))

    return modis_raw, viirs_raw


def compute_metrics(gm: pd.DataFrame, gv: pd.DataFrame):
    """
    Calibrate MODIS vs VIIRS over the overlap period (2012-02 to 2025-12).
    Computes k, correlation r, median gaps (monthly, weekly, daily), and quiet/busy ratios.
    """
    # Monthly aggregates
    m_overlap = gm[(gm["acq_date"] >= OVERLAP_START) & (gm["acq_date"] <= OVERLAP_END)].copy()
    v_overlap = gv[(gv["acq_date"] >= OVERLAP_START) & (gv["acq_date"] <= OVERLAP_END)].copy()

    m_monthly = m_overlap.groupby(m_overlap["acq_date"].dt.to_period("M"))["n"].sum()
    v_monthly = v_overlap.groupby(v_overlap["acq_date"].dt.to_period("M"))["n"].sum()

    both = pd.concat([m_monthly, v_monthly], axis=1, keys=["modis", "viirs"]).dropna()

    total_viirs_overlap = both["viirs"].sum() if not both.empty else 0

    if total_viirs_overlap < 500:
        k = DEFAULT_POOLED_K
        k_source = "pooled"
        r = 0.0
        gaps = {"daily": None, "weekly": None, "monthly": None}
        quiet_ratio = None
        busy_ratio = None
        both["viirs_scaled"] = both["viirs"] * k if not both.empty else 0
    else:
        k = float(both["modis"].sum() / both["viirs"].sum())
        k_source = "measured"
        r = float(both["modis"].corr(both["viirs"]))
        both["viirs_scaled"] = both["viirs"] * k
        
        # Monthly gap
        m_active = both[both["modis"] > 0]
        monthly_gap = float(((m_active["viirs_scaled"] - m_active["modis"]).abs() / m_active["modis"]).median())

        # Daily gap & Weekly gap
        d_m = m_overlap.groupby("acq_date")["n"].sum().asfreq("D", fill_value=0)
        d_v = v_overlap.groupby("acq_date")["n"].sum().asfreq("D", fill_value=0)
        d_df = pd.DataFrame({"modis": d_m, "viirs": d_v}).fillna(0)
        d_df["viirs_scaled"] = d_df["viirs"] * k

        d_active = d_df[d_df["modis"] > 0]
        daily_gap = float(((d_active["viirs_scaled"] - d_active["modis"]).abs() / d_active["modis"]).median()) if not d_active.empty else 0.0

        w_df = d_df.resample("W").sum()
        w_active = w_df[w_df["modis"] > 0]
        weekly_gap = float(((w_active["viirs_scaled"] - w_active["modis"]).abs() / w_active["modis"]).median()) if not w_active.empty else 0.0

        gaps = {
            "daily": round(daily_gap, 3),
            "weekly": round(weekly_gap, 3),
            "monthly": round(monthly_gap, 3),
        }

        # Quiet / busy ratio
        both["ratio"] = both["viirs"] / both["modis"].replace(0, np.nan)
        valid_ratios = both["ratio"].dropna()
        q25 = both["modis"].quantile(0.25)
        q75 = both["modis"].quantile(0.75)
        
        quiet_months = both[both["modis"] <= q25]["ratio"].dropna()
        busy_months = both[both["modis"] >= q75]["ratio"].dropna()
        
        quiet_ratio = round(float(quiet_months.median()), 2) if not quiet_months.empty else round(float(valid_ratios.median()), 2)
        busy_ratio = round(float(busy_months.median()), 2) if not busy_months.empty else round(float(valid_ratios.median()), 2)

    return round(k, 3), k_source, round(r, 3), gaps, quiet_ratio, busy_ratio, both


def harmonize_grid(gm: pd.DataFrame, gv: pd.DataFrame, k: float) -> pd.DataFrame:
    """Harmonize MODIS (< 2012-02-01) and VIIRS (>= 2012-02-01) scaled by k."""
    mod_part = gm[(gm["acq_date"] >= START_DATE) & (gm["acq_date"] < SWITCH_DATE)].copy()
    mod_part["value"] = mod_part["n"].astype("float32")

    vii_part = gv[gv["acq_date"] >= SWITCH_DATE].copy()
    vii_part["value"] = (vii_part["n"] * k).astype("float32")

    combined = pd.concat([mod_part[["acq_date", "lat_idx", "lon_idx", "value"]],
                          vii_part[["acq_date", "lat_idx", "lon_idx", "value"]]],
                         ignore_index=True)

    # Ensure no duplicate cells on the same day
    harmonized = (
        combined.groupby(["acq_date", "lat_idx", "lon_idx"], as_index=False)["value"]
        .sum()
    )

    harmonized = harmonized.sort_values(["lat_idx", "lon_idx", "acq_date"]).reset_index(drop=True)
    harmonized = harmonized.rename(columns={"acq_date": "date"})
    return harmonized


def process_country(iso: str, country_file: str = None, country_name: str = None):
    """Run full extraction, calibration, harmonization, and persistence for one country."""
    if not country_file or not country_name:
        cfg = COUNTRY_CONFIG.get(iso, {"file": iso, "name": iso})
        country_file = cfg["file"]
        country_name = cfg["name"]
    print(f"\n==================================================")
    print(f"Processing {country_name} ({iso})...")
    print(f"==================================================")

    # 1. Load Raw
    modis_raw, viirs_raw = load_country_data(iso, country_file)
    n_mod_raw = len(modis_raw)
    n_vii_raw = len(viirs_raw)
    print(f"  Raw detections: MODIS = {n_mod_raw:,}, VIIRS = {n_vii_raw:,}")

    if n_mod_raw == 0 and n_vii_raw == 0:
        print(f"  No data found for {iso}. Skipping.")
        return False

    # 2. Clean
    modis_clean = clean_modis(modis_raw)
    viirs_clean = clean_viirs(viirs_raw)
    print(f"  After confidence filter: MODIS = {len(modis_clean):,}, VIIRS = {len(viirs_clean):,}")

    # 3. Deduplicate to 1 km footprints
    modis_fp = dedupe_footprints(modis_clean)
    viirs_fp = dedupe_footprints(viirs_clean)
    print(f"  After 1 km footprint dedupe: MODIS = {len(modis_fp):,}, VIIRS = {len(viirs_fp):,}")

    # 4. Aggregate to 0.25 deg grid
    gm = to_grid(modis_fp)
    gv = to_grid(viirs_fp)

    # 5. Calibration
    k, k_source, r, gaps, quiet_ratio, busy_ratio, both_monthly = compute_metrics(gm, gv)
    print(f"  Calibration factor k: {k} (source: {k_source}), correlation r: {r}")
    print(f"  Gaps: {gaps}")

    # 6. Harmonize
    grid = harmonize_grid(gm, gv, k)
    total_footprints = int(round(grid["value"].sum()))
    print(f"  Harmonized grid rows: {len(grid):,}, total harmonized footprints: {total_footprints:,}")

    # Bounding Box [min_lon, min_lat, max_lon, max_lat]
    min_lat = float(grid["lat_idx"].min() * STEP)
    max_lat = float((grid["lat_idx"].max() + 1) * STEP)
    min_lon = float(grid["lon_idx"].min() * STEP)
    max_lon = float((grid["lon_idx"].max() + 1) * STEP)
    bbox = [round(min_lon, 3), round(min_lat, 3), round(max_lon, 3), round(max_lat, 3)]

    # 7. Write outputs
    out_dir = COUNTRIES_DIR / iso
    out_dir.mkdir(parents=True, exist_ok=True)

    # (a) grid.parquet
    grid_parquet_path = out_dir / "grid.parquet"
    # Format date as date32
    grid_table = pa.Table.from_pandas(grid)
    pq.write_table(
        grid_table,
        grid_parquet_path,
        compression="zstd",
        row_group_size=200_000
    )
    pq_size_mb = round(grid_parquet_path.stat().st_size / 1e6, 2)
    print(f"  Saved {grid_parquet_path.name}: {pq_size_mb} MB")

    # (b) monthly_overlap.csv
    monthly_csv_path = out_dir / "monthly_overlap.csv"
    overlap_df = both_monthly.reset_index()
    overlap_df.columns = ["month", "modis", "viirs", "viirs_scaled"] + [c for c in overlap_df.columns[4:]]
    overlap_df[["month", "modis", "viirs", "viirs_scaled"]].to_csv(monthly_csv_path, index=False)
    print(f"  Saved {monthly_csv_path.name}")

    # (c) meta.json
    first_year = int(grid["date"].dt.year.min())
    last_year = int(grid["date"].dt.year.max())
    meta = {
        "iso": iso,
        "name": country_name,
        "bbox": bbox,
        "k": k,
        "k_source": k_source,
        "r": r,
        "gaps": gaps,
        "quiet_ratio": quiet_ratio,
        "busy_ratio": busy_ratio,
        "first_year": first_year,
        "last_year": last_year,
        "total_footprints": total_footprints,
        "status": "ready"
    }
    meta_path = out_dir / "meta.json"
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)
    print(f"  Saved {meta_path.name}")

    # (d) update countries.json registry
    update_registry(meta)
    print(f"  Registry updated ({REGISTRY_PATH.name})")

    # Yearly totals summary for verification
    yearly = grid.groupby(grid["date"].dt.year)["value"].sum().round(0).astype(int)
    print("\n  Yearly Harmonized Footprints:")
    for yr, val in yearly.items():
        print(f"    {yr}: {val:,}")

    return True


def update_registry(meta: dict):
    """Add or update country entry in countries.json."""
    entries = []
    if REGISTRY_PATH.exists():
        try:
            with open(REGISTRY_PATH, "r", encoding="utf-8") as f:
                entries = json.load(f)
        except Exception:
            entries = []

    # Update existing or append
    entries = [e for e in entries if e.get("iso") != meta["iso"]]
    entries.append(meta)
    entries.sort(key=lambda x: x["name"])

    with open(REGISTRY_PATH, "w", encoding="utf-8") as f:
        json.dump(entries, f, indent=2)


if __name__ == "__main__":
    import sys
    iso_code = sys.argv[1].upper() if len(sys.argv) > 1 else "ARG"
    process_country(iso_code)
