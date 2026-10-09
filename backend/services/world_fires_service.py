"""
backend/services/world_fires_service.py

High-performance server-side retrieval, parsing, ranking, and dual-layer caching
(in-memory LRU + on-disk gzip) for NASA FIRMS worldwide satellite active fires.

Benefits:
  1. Datacenter bandwidth: downloads multi-megabyte global CSVs in ~1-2 seconds.
  2. Compact payloads: filters top N fires by FRP and returns ~150-200 KB gzip JSON
     instead of 15-30 MB raw CSV to client browsers.
  3. Immutable historical cache: past dates never change, making subsequent visits
     and neighbour prefetching sub-millisecond instant.
"""

import os
import gzip
import json
import heapq
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, Optional

import requests

from backend.core.config import ROOT

logger = logging.getLogger(__name__)

CACHE_DIR = ROOT / "data" / "cache" / "world_fires"
CACHE_DIR.mkdir(parents=True, exist_ok=True)

# In-memory LRU-style cache for fast hot-date retrieval (up to 128 dates)
_MEM_CACHE: Dict[str, Dict[str, Any]] = {}
MAX_MEM_CACHE = 128

DEFAULT_FIRMS_KEY = "3190f953a2198c880c77c74397f9c6ce"


def get_firms_key() -> str:
    """Retrieves FIRMS key from environment or default fallback."""
    return os.getenv("FIRMS_KEY") or os.getenv("VITE_FIRMS_KEY") or DEFAULT_FIRMS_KEY


def resolve_firms_source(date_str: str, sensor_override: Optional[str] = None) -> str:
    """
    Determines correct NASA FIRMS sensor and processing archive (NRT vs SP).
    - VIIRS_SNPP starts in 2012; MODIS covers 2003-2011.
    - NRT = last ~60 days, SP = standard processing archive.
    """
    try:
        d = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        d = datetime.now(timezone.utc).date()

    now = datetime.now(timezone.utc).date()
    age_days = (now - d).days

    sensor = sensor_override or ("MODIS" if d.year < 2012 else "VIIRS_SNPP")
    archive = "NRT" if age_days < 60 else "SP"
    return f"{sensor}_{archive}"


def fetch_and_cache_world_fires(
    date_str: str,
    limit: int = 10000,
    bbox: Optional[str] = None,
    sensor_override: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Retrieves worldwide or bbox fire detections for a given ISO date.
    Checks memory cache -> disk gzip cache -> NASA FIRMS API.
    Ranks points by FRP (Fire Radiative Power) and keeps top `limit` entries.
    """
    source = resolve_firms_source(date_str, sensor_override)
    area_target = bbox if bbox else "world"
    cache_slug = area_target.replace(",", "_")
    cache_key = f"{source}_{date_str}_{cache_slug}_{limit}"
    disk_file = CACHE_DIR / f"{cache_key}.json.gz"

    # 1. Check in-memory cache
    if cache_key in _MEM_CACHE:
        cached = _MEM_CACHE[cache_key].copy()
        cached["cached"] = True
        return cached

    # 2. Check on-disk gzip cache
    if disk_file.exists():
        try:
            with gzip.open(disk_file, "rt", encoding="utf-8") as f:
                data = json.load(f)
            # Promote to memory cache
            if len(_MEM_CACHE) >= MAX_MEM_CACHE:
                _MEM_CACHE.pop(next(iter(_MEM_CACHE)))
            _MEM_CACHE[cache_key] = data
            data_copy = data.copy()
            data_copy["cached"] = True
            return data_copy
        except Exception as e:
            logger.warning(f"Error reading disk cache {disk_file}: {e}")

    # 3. Fetch from NASA FIRMS API
    key = get_firms_key()
    url = f"https://firms.modaps.eosdis.nasa.gov/api/area/csv/{key}/{source}/{area_target}/1/{date_str}"
    logger.info(f"Fetching FIRMS fire data from upstream: {url}")

    try:
        resp = requests.get(url, stream=True, timeout=45)
    except requests.RequestException as e:
        logger.error(f"NASA FIRMS connection error for {date_str}: {e}")
        return {
            "date": date_str,
            "source": source,
            "total": 0,
            "count": 0,
            "cached": False,
            "points": [],
            "error": f"Upstream connection failed: {str(e)}",
        }

    if not resp.ok:
        text_snippet = resp.text[:200] if resp.text else ""
        logger.warning(f"NASA FIRMS returned HTTP {resp.status_code}: {text_snippet}")
        return {
            "date": date_str,
            "source": source,
            "total": 0,
            "count": 0,
            "cached": False,
            "points": [],
            "error": f"NASA FIRMS HTTP {resp.status_code}: {text_snippet}",
        }

    lines = resp.iter_lines(decode_unicode=True)
    try:
        header = next(lines)
    except StopIteration:
        return {
            "date": date_str,
            "source": source,
            "total": 0,
            "count": 0,
            "cached": False,
            "points": [],
        }

    cols = [c.strip() for c in header.split(",")]
    try:
        i_lat = cols.index("latitude")
        i_lng = cols.index("longitude")
        i_frp = cols.index("frp")
    except ValueError as e:
        # FIRMS sometimes returns an error string in the first line
        return {
            "date": date_str,
            "source": source,
            "total": 0,
            "count": 0,
            "cached": False,
            "points": [],
            "error": f"Invalid FIRMS header: {header[:120]}",
        }

    heap = []
    counter = 0
    total_detected = 0

    for line in lines:
        if not line:
            continue
        c = line.split(",")
        try:
            lat = float(c[i_lat])
            lng = float(c[i_lng])
            frp = float(c[i_frp]) if c[i_frp] else 0.0
        except (ValueError, IndexError):
            continue

        total_detected += 1
        counter += 1

        # Point tuple: {"lat": ..., "lng": ..., "frp": ...}
        point = {
            "lat": round(lat, 4),
            "lng": round(lng, 4),
            "frp": round(frp, 1),
        }

        if len(heap) < limit:
            heapq.heappush(heap, (frp, counter, point))
        elif frp > heap[0][0]:
            heapq.heapreplace(heap, (frp, counter, point))

    # Sort descending by FRP
    sorted_points = [item[2] for item in sorted(heap, key=lambda x: x[0], reverse=True)]

    result = {
        "date": date_str,
        "source": source,
        "total": total_detected,
        "count": len(sorted_points),
        "cached": False,
        "points": sorted_points,
    }

    # Save to disk cache (compressed)
    try:
        with gzip.open(disk_file, "wt", encoding="utf-8") as f:
            json.dump(result, f, separators=(",", ":"))
    except Exception as e:
        logger.warning(f"Failed to write disk cache {disk_file}: {e}")

    # Store in memory cache
    if len(_MEM_CACHE) >= MAX_MEM_CACHE:
        _MEM_CACHE.pop(next(iter(_MEM_CACHE)))
    _MEM_CACHE[cache_key] = result

    return result
