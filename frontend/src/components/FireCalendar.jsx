import { memo, useMemo, useState } from "react";
import { ESTIMATE_BEFORE_YEAR } from "../config";
import { MAX_DAYS, MONTH_STARTS, buildCalendarGrid, formatDayOfYear } from "../utils/calendarGrid";
import { EMPTY_COLOR, LEGEND_GRADIENT, colorForValue } from "../utils/colorScale";

// Component 2: the calendar heatmap (rows = years, columns = day of year).
// Props:
//   data - daily totals [{ date: "2020-01-15", value: 12 }, ...] for the selected area
//          null  -> no area selected yet
//          []    -> area selected but no fire data

const LAYOUT = { width: 1000, left: 44, right: 8, top: 22, cellHeight: 14 };
const CELL_WIDTH = (LAYOUT.width - LAYOUT.left - LAYOUT.right) / MAX_DAYS;

// Memoized so hovering (which updates state) does not redraw thousands of cells.
const Cells = memo(function Cells({ grid }) {
  return grid.years.map((year, row) => (
    <g key={year} opacity={year < ESTIMATE_BEFORE_YEAR ? 0.6 : 1}>
      {grid.rows[row].map((value, col) =>
        value === null ? null : (
          <rect
            key={col}
            x={LAYOUT.left + col * CELL_WIDTH}
            y={LAYOUT.top + row * LAYOUT.cellHeight}
            width={CELL_WIDTH + 0.15}
            height={LAYOUT.cellHeight - 1}
            fill={colorForValue(value, grid.maxValue)}
          />
        )
      )}
    </g>
  ));
});

export default function FireCalendar({ data }) {
  const [hover, setHover] = useState(null);
  const grid = useMemo(() => (data?.length ? buildCalendarGrid(data) : null), [data]);

  if (data == null) {
    return <p className="calendar__empty">Draw a box on the globe to see its fire calendar.</p>;
  }
  if (!grid) {
    return <p className="calendar__empty">No fire data for this area. Try another box.</p>;
  }

  const height = LAYOUT.top + grid.years.length * LAYOUT.cellHeight + 4;
  const gridWidth = LAYOUT.width - LAYOUT.left - LAYOUT.right;

  const handleMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const scale = LAYOUT.width / rect.width;
    const x = (event.clientX - rect.left) * scale - LAYOUT.left;
    const y = (event.clientY - rect.top) * scale - LAYOUT.top;
    const col = Math.floor(x / CELL_WIDTH);
    const row = Math.floor(y / LAYOUT.cellHeight);
    const value = grid.rows[row]?.[col];
    if (col < 0 || value == null) {
      setHover(null);
    } else {
      setHover({ year: grid.years[row], row, col, value });
    }
  };

  return (
    <div className="calendar">
      <svg
        className="calendar__svg"
        viewBox={`0 0 ${LAYOUT.width} ${height}`}
        onMouseMove={handleMove}
        onMouseLeave={() => setHover(null)}
        role="img"
        aria-label="Fire activity calendar by year and day of year"
      >
        <rect x={LAYOUT.left} y={LAYOUT.top} width={gridWidth}
          height={grid.years.length * LAYOUT.cellHeight} fill={EMPTY_COLOR} />

        {MONTH_STARTS.map(([name, day]) => (
          <text key={name} className="calendar__label"
            x={LAYOUT.left + (day - 1) * CELL_WIDTH} y={LAYOUT.top - 7}>
            {name}
          </text>
        ))}

        {grid.years.map((year, row) => (
          <text key={year} className="calendar__label" textAnchor="end"
            x={LAYOUT.left - 6} y={LAYOUT.top + row * LAYOUT.cellHeight + 10}>
            {year}{year < ESTIMATE_BEFORE_YEAR ? "*" : ""}
          </text>
        ))}

        <Cells grid={grid} />

        {hover && (
          <rect x={LAYOUT.left + hover.col * CELL_WIDTH - 1}
            y={LAYOUT.top + hover.row * LAYOUT.cellHeight - 1}
            width={CELL_WIDTH + 2} height={LAYOUT.cellHeight + 1}
            fill="none" stroke="#fff" strokeWidth="1.5" pointerEvents="none" />
        )}
      </svg>

      <p className="calendar__readout">
        {hover
          ? `${formatDayOfYear(hover.year, hover.col + 1)}, ${hover.year}: ${hover.value} fire detections`
          : "Hover over the calendar to read a day."}
      </p>

      <div className="legend">
        <span>Quiet</span>
        <div className="legend__bar" style={{ background: LEGEND_GRADIENT }} />
        <span>{Math.round(grid.maxValue)}+ detections per day</span>
      </div>
      <p className="calendar__note">
        * Years before {ESTIMATE_BEFORE_YEAR} are harmonized estimates, shown in a lighter shade.
      </p>
    </div>
  );
}
