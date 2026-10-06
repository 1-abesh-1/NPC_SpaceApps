// Pale yellow (quiet) -> dark red (intense).
const STOPS = ["#ffffb2", "#fecc5c", "#fd8d3c", "#f03b20", "#bd0026"];

export const LEGEND_GRADIENT = `linear-gradient(to right, ${STOPS.join(", ")})`;
export const EMPTY_COLOR = "#262626"; // days with no data (before the record starts, or in the future)

const hexToRgb = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return [n >> 16, (n >> 8) & 255, n & 255];
};
const STOP_RGB = STOPS.map(hexToRgb);

export function colorForValue(value, max) {
  if (value == null) return EMPTY_COLOR;
  const position = Math.min(Math.max(value / max, 0), 1) * (STOP_RGB.length - 1);
  const i = Math.min(Math.floor(position), STOP_RGB.length - 2);
  const fraction = position - i;
  const [r, g, b] = STOP_RGB[i].map((c, k) =>
    Math.round(c + (STOP_RGB[i + 1][k] - c) * fraction)
  );
  return `rgb(${r}, ${g}, ${b})`;
}
