"""
backend/core/config.py

Global configurations, directory paths, and spatial constants.
"""

from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
PROCESSED_DIR = ROOT / "data" / "processed"
COUNTRIES_DIR = PROCESSED_DIR / "countries"
REGISTRY_PATH = PROCESSED_DIR / "countries.json"

STEP = 0.25  # 0.25 degree spatial grid step (~25 km)
DEFAULT_START_YEAR = 2003
DEFAULT_END_YEAR = 2025
