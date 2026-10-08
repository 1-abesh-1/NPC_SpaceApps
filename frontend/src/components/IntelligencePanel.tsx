import { useEffect, useMemo, useRef, useState } from "react"
import { countries, dayToDate, formatNumber } from "../data/fireData"
import type { CountryProfile, DashboardData } from "../types"
import ClimatologyChart from "./ClimatologyChart"

type Props = {
  country: CountryProfile
  data: DashboardData
  onCountry: (country: CountryProfile) => void
  onPreset: (index: number) => void
  onIntegrity: () => void
}

const easeOutCubic = (value: number) => 1 - Math.pow(1 - value, 3)

function useAnimatedNumber(value: number) {
  const [display, setDisplay] = useState(value)
  const previous = useRef(value)

  useEffect(() => {
    const start = performance.now()
    const from = previous.current
    let frame = 0
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / 650)
      setDisplay(from + (value - from) * easeOutCubic(progress))
      if (progress < 1) frame = requestAnimationFrame(tick)
      else previous.current = value
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value])

  return display
}

function ArcGauge({
  label,
  value,
  max,
  suffix,
}: {
  label: string
  value: number
  max: number
  suffix?: string
}) {
  const angle = -225 + (Math.min(value, max) / max) * 270
  const radians = (angle * Math.PI) / 180
  const x = 44 + Math.cos(radians) * 29
  const y = 44 + Math.sin(radians) * 29
  return (
    <div className="arc-metric">
      <span>{label}</span>
      <svg viewBox="0 0 88 88">
        <circle className="arc-track" cx="44" cy="44" r="31" />
        {Array.from({ length: 19 }, (_, index) => {
          const tickAngle = (-225 + index * 15) * (Math.PI / 180)
          return (
            <line
              className="arc-tick"
              key={index}
              x1={44 + Math.cos(tickAngle) * 34}
              x2={44 + Math.cos(tickAngle) * 37}
              y1={44 + Math.sin(tickAngle) * 34}
              y2={44 + Math.sin(tickAngle) * 37}
            />
          )
        })}
        <line className="arc-needle" x1="44" x2={x} y1="44" y2={y} />
        <circle className="arc-center" cx="44" cy="44" r="2.3" />
      </svg>
      <strong>
        {formatNumber(value)}
        {suffix}
      </strong>
    </div>
  )
}

export default function IntelligencePanel({
  country,
  data,
  onCountry,
  onPreset,
  onIntegrity,
}: Props) {
  const active = data.metricDay
  const anomalyLevel = active.zScore >= 2 ? 2 : active.zScore >= 1 ? 1 : 0
  const anomalyLabel =
    anomalyLevel === 2
      ? "Critical anomaly"
      : anomalyLevel === 1
        ? "Elevated activity"
        : "Within baseline"
  const animatedCount = useAnimatedNumber(active.count)
  const anomalyDays = data.current.filter((item) => item.zScore > 2).length
  const percentage = Math.round(
    ((active.count - active.mean) / active.mean) * 100,
  )
  const seasonStart =
    ((country.seasonPeak - country.seasonWidth * 1.35 + 364) % 365) + 1
  const seasonEnd =
    ((country.seasonPeak + country.seasonWidth * 1.35 - 1) % 365) + 1

  const forecast = useMemo(
    () =>
      [0, 14, 28, 42, 56, 70, 84].map((offset) => {
        const record = data.current[(active.day + offset - 1) % 365]
        return {
          label: dayToDate(record.day).split(" ")[0],
          value: Math.max(0, Math.min(1, record.count / (active.count * 1.05))),
          severity: record.severity,
        }
      }),
    [active, data.current],
  )

  return (
    <div className="left-panel-content">
      <section className="data-section entity-section">
        <div className="entity-picker-row">
          <label>
            <span className="section-kicker">Active observation area</span>
            <select
              onChange={(event) => {
                const next = countries.find(
                  (item) => item.id === event.target.value,
                )
                if (next) onCountry(next)
              }}
              value={country.id}
            >
              {countries.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <span className="taxonomy-badge">{country.code} / LAND AREA</span>
        </div>

        {/* High-Visibility Early Warning Banner */}
        <div className={`early-warning-banner anomaly-${anomalyLevel}`}>
          <div className="warning-banner-icon">
            {anomalyLevel === 2 ? "🚨" : anomalyLevel === 1 ? "⚠️" : "🟢"}
          </div>
          <div className="warning-banner-content">
            <div className="warning-banner-title">
              {anomalyLevel === 2
                ? "CRITICAL FIRE ANOMALY ACTIVE"
                : anomalyLevel === 1
                  ? "ELEVATED FIRE ACTIVITY DETECTED"
                  : "NORMAL SEASONAL BASELINE"}
            </div>
            <div className="warning-banner-desc">
              {anomalyLevel === 2
                ? `Observations are ${active.zScore >= 0 ? "+" : ""}${active.zScore.toFixed(1)}σ above 20-year baseline — extreme wildfire emergency!`
                : anomalyLevel === 1
                  ? `Activity is ${active.zScore >= 0 ? "+" : ""}${active.zScore.toFixed(1)}σ above normal seasonal expectations.`
                  : `Fire count is within historical 20-year baseline bounds (${active.zScore >= 0 ? "+" : ""}${active.zScore.toFixed(1)}σ).`}
            </div>
          </div>
        </div>

        <div className="hero-kpi">
          <strong>{formatNumber(animatedCount)}</strong>
          <span>harmonized daily detections</span>
        </div>
        <div className="status-line">
          <span className={`status-badge anomaly-${anomalyLevel}`}>
            <i />
            {anomalyLabel}
          </span>
          <p>
            <b>
              {active.zScore >= 0 ? "+" : ""}
              {active.zScore.toFixed(1)}σ
            </b>{" "}
            {anomalyLevel === 0
              ? "within the 20-year seasonal baseline"
              : "above the 20-year seasonal baseline"}
          </p>
        </div>
        <div className="preset-list">
          {country.presets.map((preset, index) => (
            <button
              key={preset.name}
              onClick={() => onPreset(index)}
              type="button"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </section>

      <section className="data-section">
        <div className="section-title-row">
          <div>
            <span className="section-kicker">Current conditions</span>
            <h2>Metric breakdown</h2>
          </div>
          <button
            aria-label="About sensor calibration"
            className="info-button"
            onClick={onIntegrity}
            title="View MODIS and VIIRS calibration"
            type="button"
          >
            i
          </button>
        </div>
        <div className="arc-grid">
          <ArcGauge
            label="ACTIVITY"
            max={Math.max(active.count * 1.15, 1)}
            value={active.count}
          />
          <ArcGauge label="ANOMALY" max={5} suffix="σ" value={active.zScore} />
          <ArcGauge label="DAYS" max={90} value={anomalyDays} />
        </div>
      </section>

      <section className="data-section">
        <div className="section-title-row">
          <div>
            <span className="section-kicker">Seven-period outlook</span>
            <h2>Seasonal progression</h2>
          </div>
          <div className="micro-segment">
            <button data-active="true" type="button">
              Index
            </button>
            <button type="button">Count</button>
          </div>
        </div>
        <div className="forecast-grid">
          {forecast.map((item, index) => (
            <div key={`${item.label}-${index}`}>
              <span>{item.label}</span>
              <svg viewBox="0 0 20 20">
                <circle
                  className={`forecast-ring level-${item.severity}`}
                  cx="10"
                  cy="10"
                  r="7"
                />
                <circle
                  className={`forecast-dot level-${item.severity}`}
                  cx="10"
                  cy="10"
                  r={1.5 + item.value * 4.2}
                />
              </svg>
            </div>
          ))}
        </div>
      </section>

      <section className="data-section chart-section">
        <div className="section-title-row">
          <div>
            <span className="section-kicker">Daily footprint count</span>
            <h2>Climatology comparison</h2>
          </div>
          <span className="plain-meta">Mean ±2σ</span>
        </div>
        <ClimatologyChart records={data.current} />
      </section>

      <section className="data-section season-section">
        <div className="section-title-row">
          <div>
            <span className="section-kicker">Phenology</span>
            <h2>Fire season window</h2>
          </div>
          <span className="plain-meta">
            Peak {dayToDate(country.seasonPeak)}
          </span>
        </div>
        <div className="season-track">
          <div>
            <span style={{ left: "18%", width: "58%" }} />
            <i style={{ left: "54%" }} />
          </div>
          <footer>
            <span>{dayToDate(seasonStart)} / START</span>
            <span>{dayToDate(seasonEnd)} / END</span>
          </footer>
        </div>
        <p className="section-note">
          The selected region’s critical period spans approximately{" "}
          {Math.round(country.seasonWidth * 2.7)} days. Values are illustrative
          and not an operational alert.
        </p>
      </section>

      <footer className="left-footer">
        <span>FireCalendar, 2026</span>
        <span>NASA FIRMS / DEMONSTRATION</span>
      </footer>
    </div>
  )
}
