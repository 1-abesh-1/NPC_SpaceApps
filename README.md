# FireCalendar Backend & Data Pipeline

**NASA Space Apps Challenge 2026**

FireCalendar is a web application that harmonizes over 23 years of NASA FIRMS satellite active-fire records (MODIS Terra/Aqua 2000–2026 and VIIRS S-NPP 2012–2026) into an interactive burning activity calendar, climatological baseline, and early-warning anomaly detection system.

---

## 1. Scientific Methodology

1. **Confidence Filtering**:
   - MODIS C6.1: Confidence $\ge 30$.
   - VIIRS S-NPP: Nominal (`'n'`) or High (`'h'`) confidence.
2. **1 km Footprint Deduplication**:
   - Snaps fire detections to $0.01^\circ$ (~1 km) cells per day (`k_lat = floor(lat/0.01)`, `k_lon = floor(lon/0.01)`).
   - Eliminates pixel-size distortion between MODIS (~1 km) and VIIRS (375 m).
3. **Spatial Grid Aggregation**:
   - Aggregates daily footprints onto a $0.25^\circ$ (~25 km) grid for fast regional bounding box queries.
4. **Cross-Sensor Calibration ($k$)**:
   - Over the multi-year overlap period (Feb 2012 to Dec 2025), computes:
     $$k = \frac{\sum \text{MODIS Monthly}}{\sum \text{VIIRS Monthly}}$$
   - Typical $k \approx 0.41 - 0.49$, with monthly correlation $r > 0.97$.
5. **Harmonized Continuous Time Series (2003–2026)**:
   - Prior to Feb 1, 2012: MODIS measured footprint counts.
   - Feb 1, 2012 onwards: VIIRS footprint counts scaled by $k$.
   - Year 2003 marks the first full year with both Terra and Aqua operational.
6. **Climatological Baseline & Anomaly Detection**:
   - 7-day centered rolling mean for heatmap display.
   - 15-day centered rolling mean for baseline.
   - Baseline: Day-of-Year (DOY 1–366) mean and standard deviation across 2003–2025.
   - Unusual days flagged when $z = \frac{\text{value}_{15} - \text{mean}_{\text{doy}}}{\text{std}_{\text{doy}}} > 2.0$.
7. **Season Metrics & Critical Periods**:
   - Fire season start (10% cumulative activity), peak (maximum 15-day smoothed), and end (90% cumulative activity).
   - Critical fire periods: Runs of $\ge 5$ consecutive days at or above the 75th percentile of the baseline curve.

---

## 2. API Endpoints for React Frontend

Base URL (local): `http://localhost:8000`

### `GET /api/health`
Health check endpoint.
```json
{
  "status": "ok",
  "app": "FireCalendar Backend"
}
```

### `GET /api/countries`
Returns registry of all processed countries with bounding boxes and calibration metadata.
```json
[
  {
    "iso": "ARG",
    "name": "Argentina",
    "bbox": [-73.25, -55.0, -53.5, -21.75],
    "k": 0.479,
    "k_source": "measured",
    "r": 0.99,
    "first_year": 2003,
    "last_year": 2026,
    "total_footprints": 1427342
  }
]
```

### `GET /api/trust?country={ISO3}`
Provides calibration evidence, correlation $r$, median error gaps (daily, weekly, monthly), and monthly overlap data for the trust chart.

### `GET /api/analysis?country={ISO3}&bbox={minLon,minLat,maxLon,maxLat}&year_from=2003&year_to=2025`
Computes and returns the complete analysis payload:
- `heatmap`: $(23 \times 366)$ matrix (7-day smoothed)
- `baseline_mean` & `baseline_std`: 366-day baseline curve
- `daily`: Continuous daily timeseries with $z$-scores and `unusual` flags
- `unusual_by_year`: Count of flagged days per year (e.g. 2020 record fire season)
- `seasons`: Start, peak, end, and total per year
- `season_trend`: Days per decade trend
- `critical_periods`: List of multi-day acute fire periods
- `notes`: Relevant caveats (e.g. empty box note, provisional data note)

---

## 3. How to Run Locally

### Activate Environment & Start Server
```bash
# In Git Bash:
source venv/Scripts/activate

# In Command Prompt:
venv\Scripts\activate

# Start FastAPI backend on port 8000
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

Interactive Swagger documentation is available at: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 4. Processing Additional Countries

To extract and harmonize any other country from the downloaded yearly FIRMS zips:
```bash
python pipeline/country_pipeline.py {ISO3}
```
Currently processed and ready:
- `ARG`: Argentina
- `AUS`: Australia
- `BRA`: Brazil
- `CHL`: Chile
- `PRY`: Paraguay
- `URY`: Uruguay

---

## 5. Scientific Limitations & Transparency

- $k$ is estimated per country from monthly totals; it is a statistical calibration factor, not an exact physical sensor transformation.
- Satellite fire detections represent active 1 km burning footprints, not total burn scar area (burned area).
- Single day detections can be affected by cloud cover, smoke plumes, or satellite overpass timing; smoothed metrics (7-day and 15-day) provide the primary robust signal.
- Recent months (2026) are Near-Real-Time (NRT) and provisional.
- **Data Credit**: NASA FIRMS (Fire Information for Resource Management System).
