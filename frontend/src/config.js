// All tweakable settings live here so components stay clean.

export const TEXTURES = {
  globe: "https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg",
  bump: "https://unpkg.com/three-globe/example/img/earth-topology.png",
  background: "https://unpkg.com/three-globe/example/img/night-sky.png",
};

export const INITIAL_VIEW = { lat: 10, lng: 20, altitude: 2.2 };

// The box the user draws.
export const BOX_STYLE = {
  fill: "rgba(255, 60, 40, 0.35)",
  stroke: "#ff3c28",
  altitude: 0.012,
};

export const BORDER_STYLE = {
  color: "rgba(255, 255, 255, 0.6)",
  width: 0.12,
  altitude: 0.003,
};

export const MIN_BOX_SIZE_DEG = 0.5;

export const ESTIMATE_BEFORE_YEAR = 2012;

export const REGION_STYLE = {
  border: "rgba(60, 220, 120, 0.95)",
  label: "#3cdc78",
  width: 0.25,
  borderRadius: 50,
};

// Country names (orange = no dataset).
export const LABEL_STYLE = {
  color: "rgba(255, 150, 40, 0.95)",
  size: 0.6,               // text size in degrees
  regionSize: 0.9,         // green region names are a bit bigger
  dotRadius: 0.15,
  showBelowAltitude: 1.2,  // orange country names appear when zoomed in closer than this
};