import { useMemo, useState } from "react"
import { formatNumber, longDayToDate, severityNames } from "../data/fireData"
import type { DailyRecord, Horizon } from "../types"

type Props = {
  rows: DailyRecord[][]
  horizon: Horizon
  selectedYear?: number
  onSelectYear?: (year: number, day?: number) => void
}

const colors = [
  "var(--data-0)",
  "var(--data-1)",
  "var(--data-2)",
  "var(--data-3)",
  "var(--data-4)",
]

export default function HistoricalCalendar({
  rows,
  horizon,
  selectedYear,
  onSelectYear,
}: Props) {
  const [selected, setSelected] = useState<DailyRecord | null>(null)
  const reversed = useMemo(() => [...rows].reverse(), [rows])

  return (
    <section className="data-section calendar-section">
      <div className="section-title-row">
        <div>
          <span className="section-kicker">Historical record</span>
          <h2>Burning calendar</h2>
        </div>
        <div className="micro-segment">
          <button data-active="true" type="button">
            Daily
          </button>
          <button type="button">{horizon}y</button>
        </div>
      </div>
      <div className="calendar-months">
        {"JFMAMJJASOND".split("").map((month, index) => (
          <span key={`${month}-${index}`}>{month}</span>
        ))}
      </div>
      <div className="compact-calendar">
        {reversed.map((row) => {
          const yr = row[0].year
          const isSelected = yr === selectedYear
          const gradient = row
            .map(
              (record, index) =>
                `${colors[record.severity]} ${(index / 364) * 100}%`,
            )
            .join(",")
          return (
            <button
              className={`calendar-line ${isSelected ? "selected-year-row" : ""}`}
              data-selected={isSelected}
              key={yr}
              onClick={() => {
                const strongest = row.reduce((best, record) =>
                  record.zScore > best.zScore ? record : best,
                )
                setSelected(strongest)
                onSelectYear?.(yr, strongest.day)
              }}
              style={{
                background: `linear-gradient(90deg, ${gradient})`,
                outline: isSelected ? "2px solid #ef4444" : undefined,
                boxShadow: isSelected ? "0 0 8px rgba(239, 68, 68, 0.6)" : undefined,
              }}
              type="button"
            >
              <span>{yr}</span>
            </button>
          )
        })}
      </div>
      <div className="calendar-inspector">
        {selected ? (
          <>
            <span>{longDayToDate(selected.day, selected.year)}</span>
            <strong>{formatNumber(selected.count)}</strong>
            <small>
              {severityNames[selected.severity]} ·{" "}
              {selected.zScore >= 0 ? "+" : ""}
              {selected.zScore.toFixed(1)}σ
            </small>
          </>
        ) : (
          <small>Select a year to inspect its strongest anomaly</small>
        )}
      </div>
    </section>
  )
}
