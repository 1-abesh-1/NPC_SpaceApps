import { feature } from "topojson-client";
import worldData from "world-atlas/countries-110m.json";

// Country borders as line paths for react-globe.gl: [{ name, points: [[lat, lng], ...] }]

function geometryToRings(geometry) {
  if (geometry.type === "Polygon") return geometry.coordinates;
  if (geometry.type === "MultiPolygon") return geometry.coordinates.flat();
  return [];
}

const countries = feature(worldData, worldData.objects.countries).features;

export const COUNTRY_BORDERS = countries.flatMap((country) =>
  geometryToRings(country.geometry).map((ring) => ({
    name: country.properties.name,
    points: ring.map(([lng, lat]) => [lat, lng]),
  }))
);

// One label position per country: the center of its largest landmass.
function labelPosition(geometry) {
  const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  const largest = polygons
    .map((polygon) => polygon[0])
    .reduce((a, b) => (b.length > a.length ? b : a));
  const lngs = largest.map(([lng]) => lng);
  const lats = largest.map(([, lat]) => lat);
  return {
    lat: (Math.min(...lats) + Math.max(...lats)) / 2,
    lng: (Math.min(...lngs) + Math.max(...lngs)) / 2,
  };
}

export const COUNTRY_LABELS = countries.map((country) => ({
  name: country.properties.name,
  ...labelPosition(country.geometry),
}));