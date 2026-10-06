import { useCallback, useEffect, useRef, useState } from "react";
import FireCalendar from "./components/FireCalendar";
import GlobeMap from "./components/GlobeMap";
import Toolbar from "./components/Toolbar";
import { findOverlappingRegions } from "./utils/regions";
import { fetchRegions, fetchCalendarData, pickBestRegion } from "./api";

export default function App() {
  const [drawing, setDrawing] = useState(false);
  const [box, setBox] = useState(null);

  // Regions with a dataset, loaded from the backend (/api/countries)
  const [regions, setRegions] = useState([]);

  // null = no area yet, [] = no dataset for this area, otherwise daily totals
  const [calendarData, setCalendarData] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const calendarRef = useRef(null);
  const abortRef = useRef(null);

  // Load the available datasets once
  useEffect(() => {
    const controller = new AbortController();
    fetchRegions(controller.signal)
      .then(setRegions)
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.error(err);
          setError(`Could not load regions from the backend: ${err.message}`);
        }
      });
    return () => controller.abort();
  }, []);

  const handleBoxComplete = useCallback(
    async (newBox) => {
      setBox(newBox);
      setDrawing(false);
      setError(null);
      calendarRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

      abortRef.current?.abort();

      const touched = findOverlappingRegions(newBox, regions);
      if (touched.length === 0) {
        setLoading(false);
        setCalendarData([]); // no dataset for this area
        return;
      }

      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      try {
        const region = pickBestRegion(newBox, touched);
        const data = await fetchCalendarData(region, newBox, controller.signal);
        setCalendarData(data);
      } catch (err) {
        if (err.name === "AbortError") return;
        console.error(err);
        setError(`Failed to load fire data: ${err.message}`);
        setCalendarData(null);
      } finally {
        if (abortRef.current === controller) setLoading(false);
      }
    },
    [regions]
  );

  const handleClear = () => {
    abortRef.current?.abort();
    setBox(null);
    setCalendarData(null);
    setLoading(false);
    setError(null);
  };

  return (
    <div className="app">
      <Toolbar
        drawing={drawing}
        box={box}
        onToggleDrawing={() => setDrawing((d) => !d)}
        onClear={handleClear}
      />
      <GlobeMap
        drawing={drawing}
        box={box}
        regions={regions}
        onBoxChange={handleBoxComplete}
      />
      <section ref={calendarRef} className="calendar-section">
        <h2 className="calendar-section__title">Fire calendar</h2>
        {loading && <p>Loading fire data…</p>}
        {error && <p style={{ color: "crimson" }}>{error}</p>}
        {!loading && <FireCalendar data={calendarData} />}
      </section>
    </div>
  );
}