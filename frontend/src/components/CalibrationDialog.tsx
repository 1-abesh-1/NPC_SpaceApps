import { useEffect, useRef } from "react"
import type { CountryProfile } from "../types"
import { CloseIcon } from "./Icons"

type Props = {
  country: CountryProfile
  open: boolean
  onClose: () => void
}

const dots = [
  [48, 177],
  [75, 163],
  [91, 157],
  [113, 140],
  [138, 131],
  [160, 120],
  [182, 107],
  [203, 103],
  [226, 85],
  [248, 79],
  [273, 62],
  [301, 53],
]

export default function CalibrationDialog({ country, open, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="dialog-backdrop"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose()
      }}
    >
      <div
        aria-labelledby="calibration-title"
        aria-modal="true"
        className="calibration-dialog"
        role="dialog"
      >
        <div className="dialog-header">
          <div>
            <span className="eyebrow">
              Sensor integrity / overlap calibration
            </span>
            <h2 id="calibration-title">MODIS ↔ VIIRS harmonization</h2>
          </div>
          <button
            aria-label="Close calibration details"
            className="icon-button"
            onClick={onClose}
            ref={closeRef}
            type="button"
          >
            <CloseIcon />
          </button>
        </div>
        <div className="calibration-body">
          <div className="calibration-chart">
            <svg
              aria-label="Illustrative correlation scatter plot"
              viewBox="0 0 350 220"
            >
              <line className="cal-axis" x1="38" x2="325" y1="190" y2="190" />
              <line className="cal-axis" x1="38" x2="38" y1="26" y2="190" />
              <path className="cal-fit" d="M43 184 318 38" />
              {dots.map(([x, y], index) => (
                <circle className="cal-dot" cx={x} cy={y} key={index} r="4" />
              ))}
              <text className="cal-label" x="165" y="214">
                MODIS footprint density
              </text>
              <text
                className="cal-label vertical"
                transform="rotate(-90 13 112)"
                x="13"
                y="112"
              >
                VIIRS density
              </text>
            </svg>
          </div>
          <div className="calibration-copy">
            <div className="cal-stat">
              <span>Pearson correlation</span>
              <strong>r = {country.correlation.toFixed(2)}</strong>
            </div>
            <div className="cal-stat">
              <span>Empirical scale factor</span>
              <strong>k = {country.calibration.toFixed(2)}</strong>
            </div>
            <div className="sensor-pair">
              <div>
                <b>MODIS</b>
                <span>Terra + Aqua</span>
                <small>1,000 m native resolution</small>
              </div>
              <i>→</i>
              <div>
                <b>VIIRS</b>
                <span>Suomi NPP</span>
                <small>375 m native resolution</small>
              </div>
            </div>
            <p>
              Overlap-period calibration removes the false increase caused by
              VIIRS detecting more fire pixels at finer resolution. Spatial
              footprinting produces one continuous baseline.
            </p>
          </div>
        </div>
        <div className="dialog-note">
          <span>CALIBRATED ENGINE</span> Empirical k and r factors measured directly from 13 years of NASA FIRMS MODIS &amp; VIIRS overlap data.
        </div>
      </div>
    </div>
  )
}
