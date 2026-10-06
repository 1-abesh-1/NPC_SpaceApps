const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
async function getJson(path, signal) {
  const res = await fetch(`${API_BASE}${path}`, { signal });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} on ${path} :: ${text}`);
  }
  return res.json();
}

// Backend country -> the region shape your GlobeMap already uses
function countryToRegion(c) {
  const [minLng, minLat, maxLng, maxLat] = c.bbox; // backend order: minLon,minLat,maxLon,maxLat
  return {
    id: c.iso,
    iso: c.iso,
    name: c.name,
    minLat,
    maxLat,
    minLng,
    maxLng,
    firstYear: c.first_year,
    lastYear: c.last_year,
  };
}

export async function fetchRegions(signal) {
  const countries = await getJson("/api/countries", signal);
  return countries.map(countryToRegion);
}

// box = { minLat, maxLat, minLng, maxLng } (what your globe draws)
// region = the region the box belongs to (for the ISO code and year limits)
export async function fetchCalendarData(region, box, signal) {
  // Clip the drawn box to the country so the backend never gets a box outside its data
  const minLng = Math.max(box.minLng, region.minLng);
  const maxLng = Math.min(box.maxLng, region.maxLng);
  const minLat = Math.max(box.minLat, region.minLat);
  const maxLat = Math.min(box.maxLat, region.maxLat);

  const yearFrom = Math.max(2003, region.firstYear);
  const yearTo = Math.min(2025, region.lastYear);

  const params = new URLSearchParams({
    country: region.iso,
    bbox: [minLng, minLat, maxLng, maxLat].join(","),
    year_from: yearFrom,
    year_to: yearTo,
  });

  const data = await getJson(`/api/analysis?${params}`, signal);

  // Zip parallel arrays -> [{ date, value }]
  const { date, value } = data.daily;
  return date.map((d, i) => ({ date: d, value: value[i] }));
}

// If the box touches several countries, pick the one with the biggest overlap
export function pickBestRegion(box, touchedRegions) {
  const area = (r) => {
    const w = Math.min(box.maxLng, r.maxLng) - Math.max(box.minLng, r.minLng);
    const h = Math.min(box.maxLat, r.maxLat) - Math.max(box.minLat, r.minLat);
    return Math.max(0, w) * Math.max(0, h);
  };
  return touchedRegions.reduce((best, r) => (area(r) > area(best) ? r : best));
}