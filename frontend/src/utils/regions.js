import { LABEL_STYLE, REGION_STYLE } from "../config";
import { boxCenter, boxesOverlap } from "./box";

// Green outline of each region, drawn on the globe as a line path.
export const buildBorders = (regions) =>
  regions.map((r) => ({
    name: r.name,
    color: REGION_STYLE.border,
    stroke: REGION_STYLE.width,
    points: [
      [r.minLat, r.minLng],
      [r.minLat, r.maxLng],
      [r.maxLat, r.maxLng],
      [r.maxLat, r.minLng],
      [r.minLat, r.minLng],
    ],
  }));

// Green name label at the center of each region.
export const buildLabels = (regions) =>
  regions.map((r) => ({
    name: r.name,
    ...boxCenter(r),
    color: REGION_STYLE.label,
    size: LABEL_STYLE.regionSize,
  }));

// Which regions does the drawn box touch? Empty array = no dataset here.
export const findOverlappingRegions = (box, regions) =>
  regions.filter((region) => boxesOverlap(box, region));