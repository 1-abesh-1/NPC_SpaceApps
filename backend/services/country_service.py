"""
backend/services/country_service.py

Services for loading country registry, metadata, and spatial bounding boxes.
"""

import json
from pathlib import Path
from typing import List, Optional, Tuple, Dict, Any
from fastapi import HTTPException

from backend.core.config import COUNTRIES_DIR, REGISTRY_PATH


def get_country_dir(iso: str) -> Path:
    """Resolve and validate the directory for a given country code."""
    iso_clean = iso.upper().strip()
    cdir = COUNTRIES_DIR / iso_clean
    if not cdir.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Country '{iso_clean}' not found in registry. Please verify /api/countries."
        )
    return cdir


def parse_bbox(bbox_str: Optional[str]) -> Optional[Tuple[float, float, float, float]]:
    """Parse 'minLon,minLat,maxLon,maxLat' string into float tuple."""
    if not bbox_str:
        return None
    try:
        parts = [float(x.strip()) for x in bbox_str.split(",")]
        if len(parts) != 4:
            return None
        min_lon, min_lat, max_lon, max_lat = parts
        return (min_lon, min_lat, max_lon, max_lat)
    except Exception:
        return None


def get_country_metadata(iso: str) -> Dict[str, Any]:
    """Load metadata dictionary for the specified country."""
    cdir = get_country_dir(iso)
    meta_path = cdir / "meta.json"
    if not meta_path.exists():
        raise HTTPException(status_code=404, detail="Country metadata not found.")
    with open(meta_path, "r", encoding="utf-8") as f:
        return json.load(f)


def get_all_countries_registry() -> List[Dict[str, Any]]:
    """Return list of all registered country profiles from countries.json."""
    if not REGISTRY_PATH.exists():
        return []
    with open(REGISTRY_PATH, "r", encoding="utf-8") as f:
        return json.load(f)
