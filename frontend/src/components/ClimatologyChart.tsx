import { useState, type PointerEvent } from "react"
import { dayToDate, formatNumber } from "../data/fireData"
import type { DailyRecord } from "../types"

type Props = {
  records: DailyRecord[]
}

const W = 780
const H = 270
const PAD = { top: 20, right: 20, bottom: 42, left: 58 }

export default function ClimatologyChart({ records }: Props) {
  const [hovered, setHovered] = useState<DailyRecord | null>(null)
  const maximum =
    Math.max(
      ...records.map((item) => item.count),
      ...records.map((item) => item.mean + item.stdDev * 2),
    ) * 1.08
  const x = (day: number) =>
    PAD.left + ((day - 1) / 364) * (W - PAD.left - PAD.right)
  const y = (value: number) =>
    PAD.top + (1 - value / maximum) * (H - PAD.top - PAD.bottom)
  const path = (accessor: (record: DailyRecord) => number) =>
    records
      .map(
        (record, index) =>
          `${
            index === 0 ? "M" : "L"
          }${x(record.day).toFixed(1)} ${y(accessor(record)).toFixed(1)}`,
      )
      .join(" ")
  const upper = records
    .map(
      (record) =>
        `${x(record.day).toFixed(1)} ${y(record.mean + record.stdDev * 2).toFixed(1)}`,
    )
    .join(" L")
  const lower = [...records]
    .reverse()
    .map(
      (record) =>
        `${x(record.day).toFixed(1)} ${y(Math.max(0, record.mean - record.stdDev * 2)).toFixed(1)}`,
    )
    .join(" L")
  const band = `M${upper} L${lower} Z`
  const months = [
    [1, "JAN"],
    [32, "FEB"],
    [60, "MAR"],
    [91, "APR"],
    [121, "MAY"],
    [152, "JUN"],
    [182, "JUL"],
    [213, "AUG"],
    [244, "SEP"],
    [274, "OCT"],
    [305, "NOV"],
    [335, "DEC"],
  ] as const

  const inspect = (event: PointerEvent<SVGSVGElement>) => {
    const box = event.currentTarget.getBoundingClientRect()
    const relative = ((event.clientX - box.left) / box.width) * W
    const day = Math.min(
      365,
      Math.max(
        1,
        Math.round(
          ((relative - PAD.left) / (W - PAD.left - PAD.right)) * 364 + 1,
        ),
      ),
    )
    setHovered(records[day - 1])
  }

  const activeYear = records[0]?.year ?? 2024

  return (
    <div className="chart-block">
      <div className="chart-title-row">
        <div>
          <span className="eyebrow">Climatology comparison</span>
          <h3>Daily footprint progression</h3>
        </div>
        <div className="chart-legend">
          <span>
            <i className="legend-band" /> 20Y normal ±2σ
          </span>
          <span>
            <i className="legend-line" /> {activeYear} observed
          </span>
        </div>
      </div>
      <div className="chart-wrap">
        <svg
          aria-label="Current daily fire detections compared with the historical normal envelope"
          onPointerLeave={() => setHovered(null)}
          onPointerMove={inspect}
          viewBox={`0 0 ${W} ${H}`}
        >
          <defs>
            <linearGradient id="baselineBand" x1="0" x2="0" y1="0" y2="1">
              <stop className="band-stop-one" offset="0" />
              <stop className="band-stop-two" offset="1" />
            </linearGradient>
            <filter id="lineGlow" x="-20%" y="-30%" width="140%" height="160%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {[0, 0.25, 0.5, 0.75, 1].map((tick) => (
            <g key={tick}>
              <line
                className="chart-grid"
                x1={PAD.left}
                x2={W - PAD.right}
                y1={y(maximum * tick)}
                y2={y(maximum * tick)}
              />
              <text
                className="chart-axis"
                x={PAD.left - 8}
                y={y(maximum * tick) + 3}
              >
                {formatNumber(maximum * tick)}
              </text>
            </g>
          ))}
          {months.map(([day, label]) => (
            <g key={label}>
              <line
                className="chart-month-tick"
                x1={x(day)}
                x2={x(day)}
                y1={H - PAD.bottom}
                y2={H - PAD.bottom + 6}
              />
              <text className="chart-month" x={x(day)} y={H - 12}>
                {label}
              </text>
            </g>
          ))}
          <path className="baseline-band" d={band} />
          <path className="mean-line" d={path((record) => record.mean)} />
          <path
            className="current-line"
            d={path((record) => record.count)}
            filter="url(#lineGlow)"
          />
          {hovered && (
            <g>
              <line
                className="hover-line"
                x1={x(hovered.day)}
                x2={x(hovered.day)}
                y1={PAD.top}
                y2={H - PAD.bottom}
              />
              <circle
                className="hover-point"
                cx={x(hovered.day)}
                cy={y(hovered.count)}
                r="4"
              />
            </g>
          )}
        </svg>
        {hovered && (
          <div
            className="chart-tooltip"
            style={{
              left: `${Math.min(78, Math.max(18, (hovered.day / 365) * 100))}%`,
            }}
          >
            <span>{dayToDate(hovered.day, hovered.year)} ({hovered.year}) · DOY {String(hovered.day).padStart(3, "0")}</span>
            <b>{formatNumber(hovered.count)} detections</b>
            <small>
              Baseline {formatNumber(hovered.mean)} (±{formatNumber(hovered.stdDev * 2)}) · z{" "}
              {hovered.zScore >= 0 ? "+" : ""}
              {hovered.zScore.toFixed(1)}σ
            </small>
          </div>
        )}
      </div>
    </div>
  )
}
