import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Globe from "react-globe.gl";
import ViewSliders from "./ViewSliders";
import { useBoxDrawing } from "../hooks/useBoxDrawing";
import { useElementSize } from "../hooks/useElementSize";
import { boxToPolygon } from "../utils/box";
import { COUNTRY_BORDERS, COUNTRY_LABELS } from "../utils/countries";
import { buildBorders, buildLabels } from "../utils/regions";
import { BORDER_STYLE, BOX_STYLE, INITIAL_VIEW, LABEL_STYLE, TEXTURES } from "../config";


// Static layer data and accessors live outside the component so
// react-globe.gl doesn't rebuild layers on every render.
// Anything that depends on `regions` is built INSIDE the component.

const getPathColor = (d) => d.color ?? BORDER_STYLE.color;
const getPathStroke = (d) => d.stroke ?? BORDER_STYLE.width;
const getLabelColor = (d) => d.color;
const getLabelSize = (d) => d.size;
const getBoxFill = () => BOX_STYLE.fill;
const getBoxSide = () => "rgba(0, 0, 0, 0)";
const getBoxStroke = () => BOX_STYLE.stroke;

// Props:
//   drawing      - true while the user is allowed to draw
//   box          - the selected box { minLat, maxLat, minLng, maxLng } (or null)
//   regions      - regions with a dataset (from the backend)
//   onBoxChange  - called with the new box when the user finishes drawing
export default function GlobeMap({ drawing, box, regions, onBoxChange }) {
  const globeRef = useRef(null);
  const rendererRef = useRef(null);
  const [containerRef, { width, height }] = useElementSize();
  const [ready, setReady] = useState(false);
  const [view, setView] = useState(INITIAL_VIEW);

  // ---- Layers that depend on the backend regions ----
  const regionBorders = useMemo(() => buildBorders(regions), [regions]);
  const regionLabels = useMemo(() => buildLabels(regions), [regions]);
const regionPoints = useMemo(
  () =>
    regions.map((region) => ({
      lat: region.lat,
      lng: region.lng,
      name: region.name,
    })),
  [regions]
);
  // Borders: white country lines + green region outlines.
  const borderPaths = useMemo(
    () => [...COUNTRY_BORDERS, ...regionBorders],
    [regionBorders]
  );

  // Labels: green region names (always) + orange country names (only when zoomed in).
  // Countries that are already a green region (e.g. Argentina) are skipped.
  const allLabels = useMemo(() => {
    const regionNames = new Set(regions.map((r) => r.name));
    const countryLabelsOrange = COUNTRY_LABELS
      .filter((country) => !regionNames.has(country.name))
      .map((country) => ({ ...country, color: LABEL_STYLE.color, size: LABEL_STYLE.size }));
    return [...regionLabels, ...countryLabelsOrange];
  }, [regions, regionLabels]);

  const draftBox = useBoxDrawing({
    globeRef,
    containerRef,
    enabled: drawing && ready,
    onBoxComplete: onBoxChange,
  });

  const visibleBox = draftBox ?? box;
  const boxPolygons = useMemo(
    () => (visibleBox ? [boxToPolygon(visibleBox)] : []),
    [visibleBox]
  );

  const handleReady = useCallback(() => {
    rendererRef.current = globeRef.current.renderer();
    globeRef.current.pointOfView(INITIAL_VIEW);
    setReady(true);
  }, []);

  // Free the WebGL context when the component is removed.
  useEffect(() => {
    return () => {
      rendererRef.current?.dispose();
      rendererRef.current?.forceContextLoss();
    };
  }, []);

  const handleSlider = (change) => {
    const next = { ...view, ...change };
    setView(next);
    globeRef.current.pointOfView(next, 0);
  };

  const zoomedIn = view.altitude < LABEL_STYLE.showBelowAltitude;

  return (
    <div
      ref={containerRef}
      className={`globe-map ${drawing ? "globe-map--drawing" : ""}`}
    >
      {width > 0 && (
        <Globe
          ref={globeRef}
          width={width}
          height={height}
          globeImageUrl={TEXTURES.globe}
          bumpImageUrl={TEXTURES.bump}
          backgroundImageUrl={TEXTURES.background}
          onGlobeReady={handleReady}
          onZoom={setView}
          /* borders: white = country, green = region with data */
          pathsData={borderPaths}
          pathPoints="points"
          pathColor={getPathColor}
          pathStroke={getPathStroke}
          pathPointAlt={BORDER_STYLE.altitude}
          pathTransitionDuration={0}
          /* names: green = region with data, orange = other countries */
          labelsData={zoomedIn ? allLabels : regionLabels}
          labelText="name"
          labelSize={getLabelSize}
          labelDotRadius={LABEL_STYLE.dotRadius}
          labelColor={getLabelColor}
          labelResolution={2}

          pointsData={regionPoints}
pointLat="lat"
pointLng="lng"
pointColor={() => REGION_STYLE.label}
pointRadius={0.35}
pointAltitude={0.01}
pointsMerge={false}
          /* the user's box */
        polygonsData={boxPolygons}
polygonGeoJsonGeometry="geometry"
polygonCapColor={getBoxFill}
polygonSideColor={getBoxSide}
polygonStrokeColor={getBoxStroke}
polygonAltitude={BOX_STYLE.altitude}
        />
      )}
    </div>
  );
}