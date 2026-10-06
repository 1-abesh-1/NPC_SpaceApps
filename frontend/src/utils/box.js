import { MIN_BOX_SIZE_DEG } from "../config";

// A "box" is { minLat, maxLat, minLng, maxLng }.
// This is the area of interest (AOI) the rest of the app will filter data with.

export function makeBox(a, b) {
  return {
    minLat: Math.min(a.lat, b.lat),
    maxLat: Math.max(a.lat, b.lat),
    minLng: Math.min(a.lng, b.lng),
    maxLng: Math.max(a.lng, b.lng),
  };
}

export function isTooSmall(box) {
  return (
    box.maxLat - box.minLat < MIN_BOX_SIZE_DEG ||
    box.maxLng - box.minLng < MIN_BOX_SIZE_DEG
  );
}

// Converts a box to the GeoJSON shape that react-globe.gl draws.
export function boxToPolygon(box) {
  const { minLat, maxLat, minLng, maxLng } = box;

  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;

  // Radius based on the smaller dimension
  const radiusLat = Math.min(
    (maxLat - minLat) / 2,
    (maxLng - minLng) / 2
  );

  const points = 64;
  const coordinates = [];

  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * 2 * Math.PI;

    const lat = centerLat + radiusLat * Math.sin(angle);
    const lng =
      centerLng +
      (radiusLat * Math.cos(angle)) /
        Math.cos((centerLat * Math.PI) / 180);

    coordinates.push([lng, lat]);
  }

  return {
    geometry: {
      type: "Polygon",
      coordinates: [coordinates],
    },
  };
}
export function formatBox(box) {
  const f = (n) => n.toFixed(2);
  return `lat ${f(box.minLat)} to ${f(box.maxLat)}, lon ${f(box.minLng)} to ${f(box.maxLng)}`;
}

// Center point of a box, e.g. for a map label.
export function boxCenter(box) {
  return {
    lat: (box.minLat + box.maxLat) / 2,
    lng: (box.minLng + box.maxLng) / 2,
  };
}

// "west,south,east,north" - the area format the NASA FIRMS API expects.
export function boxToAreaString(box) {
  return `${box.minLng},${box.minLat},${box.maxLng},${box.maxLat}`;
}

// True if two boxes share any area.
export function boxesOverlap(a, b) {
  return (
    a.minLat <= b.maxLat && a.maxLat >= b.minLat &&
    a.minLng <= b.maxLng && a.maxLng >= b.minLng
  );
}