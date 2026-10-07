"""
backend/services/analysis_service.py

High-performance fire climatology, anomaly analysis, and critical periods computation.
"""

from typing import Optional, List, Tuple
import numpy as np
import pandas as pd
import pyarrow.parquet as pq

from backend.core.config import STEP
from backend.services.country_service import get_country_dir, parse_bbox, get_country_metadata
from backend.models.schemas import (
    AnalysisResponse,
    DailyData,
    UnusualYear,
    SeasonItem,
    SeasonTrend,
    CriticalPeriod,
)


def compute_fire_analysis(
    country: str,
    bbox: Optional[str] = None,
    year_from: int = 2003,
    year_to: int = 2025,
) -> AnalysisResponse:
    """
    Computes fire activity calendar, heatmap matrix, baseline, z-score anomalies,
    season starts/peaks/ends, and critical periods for the given country or bounding box.
    """
    iso = country.upper().strip()
    cdir = get_country_dir(iso)
    parquet_path = cdir / "grid.parquet"
    meta = get_country_metadata(iso)

    parsed_box = parse_bbox(bbox)
    effective_box = list(parsed_box) if parsed_box else meta["bbox"]

    # Load Parquet data with pyarrow push-down filter if bbox is provided
    filters = None
    if parsed_box:
        b_min_lon, b_min_lat, b_max_lon, b_max_lat = parsed_box
        min_lat_idx = int(np.floor(b_min_lat / STEP))
        max_lat_idx = int(np.floor(b_max_lat / STEP))
        min_lon_idx = int(np.floor(b_min_lon / STEP))
        max_lon_idx = int(np.floor(b_max_lon / STEP))

        filters = [
            ("lat_idx", ">=", min_lat_idx),
            ("lat_idx", "<=", max_lat_idx),
            ("lon_idx", ">=", min_lon_idx),
            ("lon_idx", "<=", max_lon_idx),
        ]

    try:
        table = pq.read_table(parquet_path, filters=filters, columns=["date", "value"])
        df = table.to_pandas()
    except Exception:
        df = pd.DataFrame(columns=["date", "value"])

    notes = []
    if meta.get("k_source") == "pooled":
        notes.append("Cross-sensor calibration factor was pooled from regional baseline due to low fire count.")

    # Check if empty
    if df.empty or df["value"].sum() == 0:
        notes.append("No fire detections found in the selected area.")
        doy_list = list(range(1, 367))
        years_list = list(range(year_from, year_to + 1))
        empty_heatmap = [[None if d == 366 and (y % 4 != 0) else 0.0 for d in doy_list] for y in years_list]
        return AnalysisResponse(
            country=iso,
            bbox=effective_box,
            years=years_list,
            doy=doy_list,
            heatmap=empty_heatmap,
            baseline_mean=[0.0] * 366,
            baseline_std=[0.0] * 366,
            daily=DailyData(date=[], value=[], z=[], unusual=[]),
            unusual_by_year=[UnusualYear(year=y, days=0) for y in years_list],
            seasons=[SeasonItem(year=y, start=None, peak=None, end=None, total=0.0, source="harmonized") for y in years_list],
            season_trend=SeasonTrend(start_days_per_decade=None, length_days_per_decade=None),
            critical_periods=[],
            notes=notes,
        )

    # 1. Sum by date
    df["date"] = pd.to_datetime(df["date"])
    daily_grouped = df.groupby("date")["value"].sum()

    # 2. Reindex full date range for requested years
    start_dt = pd.Timestamp(f"{year_from}-01-01")
    end_dt = pd.Timestamp(f"{year_to}-12-31")
    full_idx = pd.date_range(start_dt, end_dt, freq="D")
    daily_series = daily_grouped.reindex(full_idx, fill_value=0.0)

    # 3. Display smoothing (7-day centered rolling mean) for Heatmap
    s7 = daily_series.rolling(7, center=True, min_periods=1).mean()

    years_list = list(range(year_from, year_to + 1))
    doy_list = list(range(1, 367))

    # Pivot / construct heatmap matrix (years x doy)
    df_s7 = pd.DataFrame({
        "year": s7.index.year,
        "doy": s7.index.dayofyear,
        "val": s7.values
    })
    
    # Pre-map (year, doy) -> val
    heat_dict = df_s7.set_index(["year", "doy"])["val"].to_dict()
    heatmap_matrix = []
    for y in years_list:
        is_leap = (y % 4 == 0 and y % 100 != 0) or (y % 400 == 0)
        row = []
        for d in doy_list:
            if d == 366 and not is_leap:
                row.append(None)
            else:
                val = heat_dict.get((y, d), 0.0)
                row.append(round(float(val), 2))
        heatmap_matrix.append(row)

    # 4. Baseline smoothing (15-day centered rolling mean)
    s15 = daily_series.rolling(15, center=True, min_periods=1).mean()
    df_s15 = pd.DataFrame({
        "date": s15.index,
        "year": s15.index.year,
        "doy": s15.index.dayofyear,
        "val": s15.values
    })

    # Groupby DOY across full years (2003 to 2025)
    baseline_stats = (
        df_s15[df_s15["year"] <= 2025]
        .groupby("doy")["val"]
        .agg(["mean", "std"])
        .reindex(doy_list)
        .fillna(0.0)
    )

    baseline_mean = [round(float(x), 2) for x in baseline_stats["mean"].values]
    baseline_std = [round(float(x), 2) for x in baseline_stats["std"].values]

    # Map doy to mean and std for z-score calculation
    mean_map = baseline_stats["mean"].to_dict()
    std_map = baseline_stats["std"].to_dict()

    # 5. Anomaly detection (z = (s15 - mean) / std)
    vals = df_s15["val"].values
    doys = df_s15["doy"].values

    z_list = []
    unusual_list = []
    for v, d in zip(vals, doys):
        m_val = mean_map.get(d, 0.0)
        s_val = std_map.get(d, 0.0)
        if s_val > 1e-4:
            z_score = round(float((v - m_val) / s_val), 2)
            z_list.append(z_score)
            unusual_list.append(z_score > 2.0)
        else:
            z_list.append(0.0)
            unusual_list.append(False)

    df_s15["z"] = z_list
    df_s15["unusual"] = unusual_list

    # Unusual counts by year
    unusual_counts = df_s15[df_s15["unusual"]].groupby("year").size().to_dict()
    unusual_by_year = [
        UnusualYear(year=y, days=int(unusual_counts.get(y, 0)))
        for y in years_list
    ]

    # 6. Seasons per year (start at 10% cumsum, end at 90%, peak at max of s15)
    seasons = []
    start_doys = []
    season_lengths = []

    for y in years_list:
        sub_raw = daily_series[daily_series.index.year == y]
        sub_s15 = s15[s15.index.year == y]
        yr_total = float(sub_raw.sum())

        source_label = "harmonized estimates" if y < 2012 else "measured"
        if y >= 2026:
            source_label = "provisional (NRT)"

        if yr_total < 20:
            seasons.append(SeasonItem(
                year=y, start=None, peak=None, end=None, total=round(yr_total, 2), source=source_label
            ))
            continue

        cum = sub_raw.cumsum() / yr_total
        start_dt_match = cum[cum >= 0.10].index.min()
        end_dt_match = cum[cum >= 0.90].index.min()
        peak_dt_match = sub_s15.idxmax()

        start_str = start_dt_match.strftime("%Y-%m-%d") if pd.notnull(start_dt_match) else None
        end_str = end_dt_match.strftime("%Y-%m-%d") if pd.notnull(end_dt_match) else None
        peak_str = peak_dt_match.strftime("%Y-%m-%d") if pd.notnull(peak_dt_match) else None

        if pd.notnull(start_dt_match) and pd.notnull(end_dt_match):
            s_doy = start_dt_match.dayofyear
            e_doy = end_dt_match.dayofyear
            start_doys.append((y, s_doy))
            season_lengths.append((y, e_doy - s_doy))

        seasons.append(SeasonItem(
            year=y,
            start=start_str,
            peak=peak_str,
            end=end_str,
            total=round(yr_total, 2),
            source=source_label
        ))

    # Season trend (linear slope in days per decade if at least 10 years available)
    start_trend = None
    len_trend = None
    if len(start_doys) >= 10:
        ys, s_days = zip(*start_doys)
        slope, _ = np.polyfit(ys, s_days, 1)
        start_trend = round(float(slope * 10), 2)  # days per decade

        ys_len, l_days = zip(*season_lengths)
        l_slope, _ = np.polyfit(ys_len, l_days, 1)
        len_trend = round(float(l_slope * 10), 2)  # days per decade

    season_trend = SeasonTrend(
        start_days_per_decade=start_trend,
        length_days_per_decade=len_trend
    )

    # 7. Critical periods (runs of >= 5 consecutive days where s15 >= 75th percentile of baseline_mean)
    threshold = float(np.percentile([m for m in baseline_mean if m > 0] or [0], 75))
    critical_periods = []

    above = s15 >= threshold
    run_start = None
    run_len = 0

    for dt, is_above in above.items():
        if is_above:
            if run_start is None:
                run_start = dt
            run_len += 1
        else:
            if run_start is not None and run_len >= 5:
                run_end = dt - pd.Timedelta(days=1)
                critical_periods.append(CriticalPeriod(
                    year=run_start.year,
                    from_date=run_start.strftime("%Y-%m-%d"),
                    to_date=run_end.strftime("%Y-%m-%d")
                ))
            run_start = None
            run_len = 0

    # Catch final run
    if run_start is not None and run_len >= 5:
        run_end = s15.index[-1]
        critical_periods.append(CriticalPeriod(
            year=run_start.year,
            from_date=run_start.strftime("%Y-%m-%d"),
            to_date=run_end.strftime("%Y-%m-%d")
        ))

    # Daily payload
    daily_payload = DailyData(
        date=[d.strftime("%Y-%m-%d") for d in daily_series.index],
        value=[round(float(v), 2) for v in daily_series.values],
        z=z_list,
        unusual=unusual_list
    )

    return AnalysisResponse(
        country=iso,
        bbox=effective_box,
        years=years_list,
        doy=doy_list,
        heatmap=heatmap_matrix,
        baseline_mean=baseline_mean,
        baseline_std=baseline_std,
        daily=daily_payload,
        unusual_by_year=unusual_by_year,
        seasons=seasons,
        season_trend=season_trend,
        critical_periods=critical_periods,
        notes=notes
    )
