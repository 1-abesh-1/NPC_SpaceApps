import { useMemo, useState } from "react"
import { formatNumber, longDayToDate, severityNames } from "../data/fireData"
import type { DailyRecord, Horizon } from "../types"

type Props = {
  rows: DailyRecord[][]
  horizon: Horizon
}

const colors = [
  "var(--data-0)",
  "var(--data-1)",
  "var(--data-2)",
  "var(--data-3)",
  "var(--data-4)",
]

export default function HistoricalCalendar({ rows, horizon }: Props) {
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
          const gradient = row
            .map(
              (record, index) =>
                `${colors[record.severity]} ${(index / 364) * 100}%`,
            )
            .join(",")
          return (
            <button
              className="calendar-line"
              key={row[0].year}
              onClick={() => {
                const strongest = row.reduce((best, record) =>
                  record.zScore > best.zScore ? record : best,
                )
                setSelected(strongest)
              }}
              style={{ background: `linear-gradient(90deg, ${gradient})` }}
              type="button"
            >
              <span>{row[0].year}</span>
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
