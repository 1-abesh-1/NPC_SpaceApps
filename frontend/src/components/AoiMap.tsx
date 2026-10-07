import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent,
} from "react"
import { countries, dayToDate, intersectingCountries } from "../data/fireData"
import { worldRings } from "../data/worldRings"
import type { Bounds, CountryProfile, Horizon } from "../types"

type Props = {
  anomaly: number
  country: CountryProfile
  bounds: Bounds
  horizon: Horizon
  day: number
  year: number
  onCountry: (country: CountryProfile) => void
  onBounds: (bounds: Bounds, preset?: string, multiplier?: number) => void
  onDay: (day: number) => void
  onYear: (year: number) => void
  onHorizon: (horizon: Horizon) => void
}

type View = { x: number y: number scale: number }
type ResizeHandle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w"
type DragKind = "pan" | "box" | "resize" | "draw"

const W = 1200
const H = 640
const projectX = (longitude: number) => ((longitude + 180) / 360) * W
const projectY = (latitude: number) => ((90 - latitude) / 180) * H
const lonFromX = (x: number) => (x / W) * 360 - 180
const latFromY = (y: number) => 90 - (y / H) * 180
const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))
const land = worldRings

const viewForCountry = (profile: CountryProfile): View => {
  const centerX = projectX((profile.bounds.west + profile.bounds.east) / 2)
  const centerY = projectY((profile.bounds.north + profile.bounds.south) / 2)
  const spanX = Math.max(
    1,
    projectX(profile.bounds.east) - projectX(profile.bounds.west),
  )
  const spanY = Math.max(
    1,
    projectY(profile.bounds.south) - projectY(profile.bounds.north),
  )
  const scale = clamp(Math.min(W / (spanX * 3.1), H / (spanY * 2.25)), 1.8, 3.8)
  return {
    x: W / 2 - centerX * scale,
    y: H / 2 - centerY * scale,
    scale,
  }
}

export default function AoiMap({
  anomaly,
  country,
  bounds,
  horizon,
  day,
  year,
  onCountry,
  onBounds,
  onDay,
  onYear,
  onHorizon,
}: Props) {
  const groupRef = useRef<SVGGElement>(null)
  const boxRef = useRef<SVGRectElement>(null)
  const boxFillRef = useRef<SVGRectElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const playRef = useRef<number | null>(null)
  const lastCountryRef = useRef(country.id)
  const handleRefs = useRef<Array<SVGRectElement | null>>([])
  const dragRef = useRef<{
    kind: DragKind
    pointerX: number
    pointerY: number
    view: View
    rect?: { x: number y: number width: number height: number }
    handle?: ResizeHandle
  } | null>(null)
  const [view, setView] = useState<View>({ x: 0, y: 0, scale: 1 })
  const [playing, setPlaying] = useState(false)
  const [boxHovered, setBoxHovered] = useState(false)
  const [drawing, setDrawing] = useState(false)

  const box = useMemo(
    () => ({
      x: projectX(bounds.west),
      y: projectY(bounds.north),
      width: projectX(bounds.east) - projectX(bounds.west),
      height: projectY(bounds.south) - projectY(bounds.north),
    }),
    [bounds],
  )
  const included = useMemo(() => intersectingCountries(bounds), [bounds])
  const fireMarks = useMemo(
    () =>
      Array.from({ length: 28 }, (_, index) => {
        const timeSeed = year * 365 + day
        const xSeed = Math.sin((index + 1) * 12.9898 + timeSeed * 0.173) * 43758.5453
        const ySeed = Math.sin((index + 1) * 78.233 + timeSeed * 0.097) * 12345.6789
        const intensity =
          Math.sin((index + 1) * 4.127 + timeSeed * 0.041) * 0.5 + 0.5
        const anomalyBand = anomaly >= 2 ? 2 : anomaly >= 1 ? 1 : 0
        const localAnomaly =
          anomalyBand === 2
            ? intensity > 0.58
              ? 2
              : intensity > 0.25
                ? 1
                : 0
            : anomalyBand === 1 && intensity > 0.42
              ? 1
              : 0
        const xFraction = xSeed - Math.floor(xSeed)
        const yFraction = ySeed - Math.floor(ySeed)
        return {
          x: box.x + box.width * (0.08 + xFraction * 0.84),
          y: box.y + box.height * (0.08 + yFraction * 0.84),
          anomaly: localAnomaly,
          radius:
            Math.max(8, Math.min(box.width, box.height) * 0.11) *
            (0.72 + intensity * 0.72),
        }
      }),
    [anomaly, box, day, year],
  )

  const transformFor = (next: View) =>
    `translate(${next.x} ${next.y}) scale(${next.scale})`

  useEffect(() => {
    if (lastCountryRef.current === country.id) return
    lastCountryRef.current = country.id
    setView(viewForCountry(country))
  }, [country])

  useEffect(() => {
    if (!playing) return
    playRef.current = window.setInterval(() => {
      onDay(day >= 365 ? 1 : day + 1)
    }, 130)
    return () => {
      if (playRef.current) window.clearInterval(playRef.current)
    }
  }, [playing, day, onDay])

  const pointerInSvg = (event: ReactPointerEvent<SVGSVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return { x: 0, y: 0 }
    return {
      x: ((event.clientX - rect.left) / rect.width) * W,
      y: ((event.clientY - rect.top) / rect.height) * H,
    }
  }

  const rectAfterDrag = (
    kind: Exclude<DragKind, "pan">,
    initial: { x: number y: number width: number height: number },
    deltaX: number,
    deltaY: number,
    handle?: ResizeHandle,
  ) => {
    if (kind === "draw") {
      const endX = clamp(initial.x + deltaX, 0, W)
      const endY = clamp(initial.y + deltaY, 0, H)
      return {
        x: Math.min(initial.x, endX),
        y: Math.min(initial.y, endY),
        width: Math.max(4, Math.abs(endX - initial.x)),
        height: Math.max(4, Math.abs(endY - initial.y)),
      }
    }
    if (kind === "box") {
      return {
        ...initial,
        x: clamp(initial.x + deltaX, 0, W - initial.width),
        y: clamp(initial.y + deltaY, 0, H - initial.height),
      }
    }
    let left = initial.x
    let top = initial.y
    let right = initial.x + initial.width
    let bottom = initial.y + initial.height
    if (handle?.includes("w")) left = clamp(left + deltaX, 0, right - 8)
    if (handle?.includes("e")) right = clamp(right + deltaX, left + 8, W)
    if (handle?.includes("n")) top = clamp(top + deltaY, 0, bottom - 8)
    if (handle?.includes("s")) bottom = clamp(bottom + deltaY, top + 8, H)
    return { x: left, y: top, width: right - left, height: bottom - top }
  }

  const applyRect = (next: {
    x: number
    y: number
    width: number
    height: number
  }) => {
    for (const element of [boxRef.current, boxFillRef.current]) {
      element?.setAttribute("x", String(next.x))
      element?.setAttribute("y", String(next.y))
      element?.setAttribute("width", String(next.width))
      element?.setAttribute("height", String(next.height))
    }
    const points = [
      [next.x, next.y],
      [next.x + next.width / 2, next.y],
      [next.x + next.width, next.y],
      [next.x + next.width, next.y + next.height / 2],
      [next.x + next.width, next.y + next.height],
      [next.x + next.width / 2, next.y + next.height],
      [next.x, next.y + next.height],
      [next.x, next.y + next.height / 2],
    ]
    handleRefs.current.forEach((element, index) => {
      element?.setAttribute("x", String(points[index][0] - 1.5))
      element?.setAttribute("y", String(points[index][1] - 1.5))
    })
  }

  const onPointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    const point = pointerInSvg(event)
    const target = event.target as SVGElement
    const handle = target.dataset.resize as ResizeHandle | undefined
    const worldPoint = {
      x: clamp((point.x - view.x) / view.scale, 0, W),
      y: clamp((point.y - view.y) / view.scale, 0, H),
    }
    const kind = handle
      ? "resize"
      : target.dataset.aoi === "true"
        ? "box"
        : drawing
          ? "draw"
          : "pan"
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = {
      kind,
      pointerX: point.x,
      pointerY: point.y,
      view,
      rect:
        kind === "pan"
          ? undefined
          : kind === "draw"
            ? { x: worldPoint.x, y: worldPoint.y, width: 1, height: 1 }
            : box,
      handle,
    }
    if (groupRef.current) groupRef.current.style.transition = "none"
  }

  const onPointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    const drag = dragRef.current
    if (!drag) return
    const point = pointerInSvg(event)
    const deltaX = point.x - drag.pointerX
    const deltaY = point.y - drag.pointerY
    if (drag.kind === "pan") {
      groupRef.current?.setAttribute(
        "transform",
        transformFor({
          ...drag.view,
          x: drag.view.x + deltaX,
          y: drag.view.y + deltaY,
        }),
      )
      return
    }
    if (!drag.rect) return
    const localDeltaX = deltaX / view.scale
    const localDeltaY = deltaY / view.scale
    applyRect(
      rectAfterDrag(
        drag.kind,
        drag.rect,
        localDeltaX,
        localDeltaY,
        drag.handle,
      ),
    )
  }

  const onPointerUp = (event: ReactPointerEvent<SVGSVGElement>) => {
    const drag = dragRef.current
    if (!drag) return
    const point = pointerInSvg(event)
    const deltaX = point.x - drag.pointerX
    const deltaY = point.y - drag.pointerY
    if (drag.kind === "pan") {
      setView((current) => ({
        ...current,
        x: clamp(drag.view.x + deltaX, -W * 1.8, W * 1.8),
        y: clamp(drag.view.y + deltaY, -H * 1.8, H * 1.8),
      }))
    } else if (drag.rect) {
      const next = rectAfterDrag(
        drag.kind,
        drag.rect,
        deltaX / view.scale,
        deltaY / view.scale,
        drag.handle,
      )
      onBounds(
        {
          west: lonFromX(next.x),
          east: lonFromX(next.x + next.width),
          north: latFromY(next.y),
          south: latFromY(next.y + next.height),
        },
        "Custom area",
        1,
      )
      if (drag.kind === "draw") setDrawing(false)
    }
    dragRef.current = null
    if (groupRef.current) groupRef.current.style.transition = ""
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  const cancelDrag = () => {
    dragRef.current = null
    if (groupRef.current) {
      groupRef.current.style.transition = ""
      groupRef.current.setAttribute("transform", transformFor(view))
    }
  }

  const onWheel = (event: WheelEvent<SVGSVGElement>) => {
    event.preventDefault()
    cancelDrag()
    setView((current) => ({
      ...current,
      scale: clamp(current.scale * (event.deltaY > 0 ? 0.88 : 1.12), 0.65, 4),
    }))
  }

  const setZoom = (scale: number) =>
    setView((current) => ({ ...current, scale: clamp(scale, 0.65, 4) }))

  const selectCountry = (item: CountryProfile) => {
    lastCountryRef.current = item.id
    setView(viewForCountry(item))
    onCountry(item)
  }

  return (
    <section
      className="primary-map"
      aria-label="Global active fire map"
      data-drawing={drawing}
      data-zoomed={view.scale > 1.45}
    >
      <div className="map-dot-grid" />
      <svg
        onPointerCancel={cancelDrag}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onWheel={onWheel}
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
      >
        <defs>
          <radialGradient id="heat-neutral">
            <stop
              offset="0"
              stopColor="var(--strata-ink-soft)"
              stopOpacity="0.32"
            />
            <stop
              offset="0.58"
              stopColor="var(--strata-ink-soft)"
              stopOpacity="0.12"
            />
            <stop
              offset="1"
              stopColor="var(--strata-ink-soft)"
              stopOpacity="0"
            />
          </radialGradient>
          <radialGradient id="heat-elevated">
            <stop offset="0%" stopColor="#fff3d1" stopOpacity="1" />
            <stop offset="35%" stopColor="#ffb300" stopOpacity="0.9" />
            <stop offset="70%" stopColor="#ff5722" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#ff5722" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="heat-critical">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="25%" stopColor="#fff176" stopOpacity="0.95" />
            <stop offset="55%" stopColor="#ff3d00" stopOpacity="0.88" />
            <stop offset="85%" stopColor="#b71c1c" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#b71c1c" stopOpacity="0" />
          </radialGradient>
          <filter height="180%" id="heat-soften" width="180%" x="-40%" y="-40%">
            <feGaussianBlur stdDeviation="3.8" />
          </filter>
          <clipPath clipPathUnits="userSpaceOnUse" id="heat-clip">
            <rect height={box.height} width={box.width} x={box.x} y={box.y} />
          </clipPath>
        </defs>
        <g
          className="world-group"
          ref={groupRef}
          transform={transformFor(view)}
        >
          {land.map((points, index) => (
            <polygon className="world-land" key={index} points={points} />
          ))}
          <g
            className="heat-field"
            clipPath="url(#heat-clip)"
            filter="url(#heat-soften)"
          >
            {fireMarks.map((mark, index) => (
              <circle
                className={`heat-blob anomaly-${mark.anomaly}`}
                cx={mark.x}
                cy={mark.y}
                fill={`url(#${
                  mark.anomaly === 2
                    ? "heat-critical"
                    : mark.anomaly === 1
                      ? "heat-elevated"
                      : "heat-neutral"
                })`}
                key={`${year}-${day}-${index}`}
                r={mark.radius}
              />
            ))}
            {anomaly >= 2 && (
              <rect
                className="critical-heat-wash"
                height={box.height}
                width={box.width}
                x={box.x}
                y={box.y}
              />
            )}
          </g>
          <rect
            className="aoi-fill"
            data-anomaly={anomaly >= 2 ? "critical" : anomaly >= 1 ? "elevated" : "normal"}
            data-aoi="true"
            height={box.height}
            onMouseEnter={() => setBoxHovered(true)}
            onMouseLeave={() => setBoxHovered(false)}
            ref={boxFillRef}
            width={box.width}
            x={box.x}
            y={box.y}
          />
          <rect
            className="aoi-outline"
            data-anomaly={anomaly >= 2 ? "critical" : anomaly >= 1 ? "elevated" : "normal"}
            data-aoi="true"
            height={box.height}
            onMouseEnter={() => setBoxHovered(true)}
            onMouseLeave={() => setBoxHovered(false)}
            ref={boxRef}
            width={box.width}
            x={box.x}
            y={box.y}
          />
          {[
            ["nw", box.x, box.y],
            ["n", box.x + box.width / 2, box.y],
            ["ne", box.x + box.width, box.y],
            ["e", box.x + box.width, box.y + box.height / 2],
            ["se", box.x + box.width, box.y + box.height],
            ["s", box.x + box.width / 2, box.y + box.height],
            ["sw", box.x, box.y + box.height],
            ["w", box.x, box.y + box.height / 2],
          ].map(([handle, x, y], index) => (
            <rect
              className="aoi-handle"
              data-resize={handle}
              height="3"
              key={String(handle)}
              ref={(element) => {
                handleRefs.current[index] = element
              }}
              width="3"
              x={Number(x) - 1.5}
              y={Number(y) - 1.5}
            />
          ))}
          {countries.map((item) => {
            const longitude = (item.bounds.west + item.bounds.east) / 2
            const latitude = (item.bounds.north + item.bounds.south) / 2
            const pointX = projectX(longitude)
            const pointY = projectY(latitude)
            const active = item.id === country.id
            return (
              <g
                aria-label={`Zoom to ${item.name}`}
                className={`region-point ${active ? "active" : ""}`}
                key={item.id}
                onClick={(event) => {
                  event.stopPropagation()
                  selectCountry(item)
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault()
                    selectCountry(item)
                  }
                }}
                onPointerDown={(event) => event.stopPropagation()}
                role="button"
                tabIndex={0}
              >
                <circle className="point-hit" cx={pointX} cy={pointY} r="15" />
                <circle
                  className="point-core"
                  cx={pointX}
                  cy={pointY}
                  r={active ? 4 : 3}
                />
                <circle
                  className="point-ring"
                  cx={pointX}
                  cy={pointY}
                  r={active ? 10 : 7}
                />
                <text x={pointX + 13} y={pointY + 4}>
                  {item.code}
                </text>
              </g>
            )
          })}
        </g>
      </svg>

      <div className="aoi-tools strata-chrome">
        <span>Area tool</span>
        <button
          data-active={drawing}
          onClick={() => setDrawing((value) => !value)}
          type="button"
        >
          {drawing ? "Cancel drawing" : "Draw area"}
        </button>
        <button
          onClick={() => {
            const preset = country.presets[0]
            setDrawing(false)
            onBounds(preset.bounds, preset.name, preset.multiplier)
            setView(viewForCountry(country))
          }}
          type="button"
        >
          Fit {country.code}
        </button>
      </div>

      <div className="map-timebar strata-chrome">
        <div className="observation-date">
          <span>Observation date</span>
          <strong>
            {dayToDate(day, year)} {year} · DOY {String(day).padStart(3, "0")}
          </strong>
        </div>
        <div className="year-selector-pill">
          <label htmlFor="map-year-select" style={{ fontSize: "9px", textTransform: "uppercase", color: "var(--chip-color)", marginRight: "5px" }}>Year</label>
          <select
            id="map-year-select"
            value={year}
            onChange={(e) => onYear(Number(e.target.value))}
            style={{
              background: "#1c1c1c",
              color: "#fff",
              border: "1px solid var(--strata-line-strong)",
              borderRadius: "4px",
              padding: "3px 8px",
              fontWeight: 600,
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            {Array.from(
              {
                length:
                  (country.lastYear ?? 2026) -
                  (country.firstYear ?? 2003) +
                  1,
              },
              (_, i) => (country.lastYear ?? 2026) - i,
            ).map((y) => (
              <option key={y} value={y} style={{ background: "#111", color: "#fff" }}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <div className="compact-segment">
          {([5, 10, 23] as Horizon[]).map((value) => (
            <button
              data-active={horizon === value}
              key={value}
              onClick={() => onHorizon(value)}
              type="button"
            >
              {value === 23 ? "23y baseline" : `${value}y baseline`}
            </button>
          ))}
        </div>
        <div className="time-scrubber">
          <span style={{ width: `${(day / 365) * 100}%` }} />
          <input
            aria-label="Day of year"
            max="365"
            min="1"
            onChange={(event) => onDay(Number(event.target.value))}
            type="range"
            value={day}
          />
          {[
            [0, "Jan"],
            [16.4, "Mar"],
            [33.1, "May"],
            [49.9, "Jul"],
            [66.8, "Sep"],
            [83.6, "Nov"],
            [100, "Dec"],
          ].map(([position, label]) => (
            <i key={String(label)} style={{ left: `${position}%` }}>
              <b>{label}</b>
            </i>
          ))}
        </div>
        <button
          className="map-text-button"
          onClick={() => setPlaying((value) => !value)}
          type="button"
        >
          {playing ? "Pause" : "Play"}
        </button>
        <button
          className="map-text-button"
          onClick={() => onDay(258)}
          type="button"
        >
          Reset
        </button>
      </div>

      <div className="region-picker strata-chrome">
        <span>Region</span>
        {countries.map((item) => (
          <button
            data-active={item.id === country.id}
            key={item.id}
            onClick={() => selectCountry(item)}
            type="button"
          >
            {item.code}
          </button>
        ))}
      </div>

      <div className="zoom-control strata-chrome">
        <button
          aria-label="Zoom in"
          onClick={() => setZoom(view.scale + 0.35)}
          type="button"
        >
          +
        </button>
        <input
          aria-label="Map zoom"
          max="4"
          min="0.65"
          onChange={(event) => setZoom(Number(event.target.value))}
          step="0.05"
          type="range"
          value={view.scale}
        />
        <button
          aria-label="Zoom out"
          onClick={() => setZoom(view.scale - 0.35)}
          type="button"
        >
          −
        </button>
      </div>

      <button
        className="world-reset strata-chrome"
        onClick={() => setView({ x: 0, y: 0, scale: 1 })}
        type="button"
      >
        View world
      </button>

      <div
        className={`aoi-hover-card strata-chrome ${
          boxHovered ? "visible" : ""
        }`}
        data-anomaly={anomaly >= 2 ? "critical" : anomaly >= 1 ? "elevated" : "normal"}
      >
        <span>
          {included.length > 1
            ? `${included.map((item) => item.name).join(" + ")} / aggregate AOI`
            : `${included[0]?.name ?? country.name} / selected footprint`}
        </span>
        <strong>
          {anomaly >= 2
            ? `Critical Anomaly (+${anomaly.toFixed(1)}σ)`
            : anomaly >= 1
              ? `Elevated Fire (+${anomaly.toFixed(1)}σ)`
              : `Normal Baseline (${anomaly >= 0 ? "+" : ""}${anomaly.toFixed(1)}σ)`}
        </strong>
        <small>
          {year} · DOY {String(day).padStart(3, "0")} · {bounds.south.toFixed(1)}° to {bounds.north.toFixed(1)}°
        </small>
      </div>

      <div className="map-legend strata-chrome">
        <span>Low</span>
        <div>
          {[0, 1, 2, 3, 4, 5].map((level) => (
            <i className={`data-level-${level}`} key={level} />
          ))}
        </div>
        <span>High</span>
      </div>
    </section>
  )
}
