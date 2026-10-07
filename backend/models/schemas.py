"""
backend/models/schemas.py

Pydantic schemas and response models matching the frontend TypeScript contract.
"""

from typing import List, Optional
from pydantic import BaseModel


class CountryInfo(BaseModel):
    iso: str
    name: str
    bbox: List[float]
    k: float
    k_source: str
    r: float
    first_year: int
    last_year: int
    total_footprints: int


class DailyData(BaseModel):
    date: List[str]
    value: List[float]
    z: List[Optional[float]]
    unusual: List[bool]


class UnusualYear(BaseModel):
    year: int
    days: int


class SeasonItem(BaseModel):
    year: int
    start: Optional[str]
    peak: Optional[str]
    end: Optional[str]
    total: float
    source: str


class SeasonTrend(BaseModel):
    start_days_per_decade: Optional[float]
    length_days_per_decade: Optional[float]


class CriticalPeriod(BaseModel):
    year: int
    from_date: str
    to_date: str


class AnalysisResponse(BaseModel):
    country: str
    bbox: List[float]
    years: List[int]
    doy: List[int]
    heatmap: List[List[Optional[float]]]
    baseline_mean: List[float]
    baseline_std: List[float]
    daily: DailyData
    unusual_by_year: List[UnusualYear]
    seasons: List[SeasonItem]
    season_trend: SeasonTrend
    critical_periods: List[CriticalPeriod]
    notes: List[str]


class MonthlyOverlapItem(BaseModel):
    month: str
    modis: float
    viirs_scaled: float


class GapsInfo(BaseModel):
    daily: Optional[float]
    weekly: Optional[float]
    monthly: Optional[float]


class TrustResponse(BaseModel):
    country: str
    k: float
    k_source: str
    r: float
    gaps: GapsInfo
    quiet_ratio: Optional[float]
    busy_ratio: Optional[float]
    monthly: List[MonthlyOverlapItem]
