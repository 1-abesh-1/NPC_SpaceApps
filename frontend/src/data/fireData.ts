import type {
  Bounds,
  CountryProfile,
  DailyRecord,
  DashboardData,
  Horizon,
  Severity,
} from "../types"

export const countries: CountryProfile[] = [
  {
    id: "argentina",
    name: "Argentina",
    code: "ARG",
    bounds: { north: -21.8, south: -55.1, west: -73.6, east: -53.6 },
    presets: [
      {
        name: "Overview",
        bounds: { north: -31.4, south: -45.5, west: -68.5, east: -58.7 },
        multiplier: 1.0,
      },
      {
        name: "Pampas & Córdoba",
        bounds: { north: -31.5, south: -38.5, west: -66.5, east: -61.5 },
        multiplier: 1.35,
      },
      {
        name: "Gran Chaco",
        bounds: { north: -25.5, south: -32.0, west: -65.5, east: -59.5 },
        multiplier: 1.28,
      },
      {
        name: "Patagonia",
        bounds: { north: -39.0, south: -50.0, west: -72.0, east: -65.0 },
        multiplier: 0.62,
      },
    ],
    seasonPeak: 261,
    seasonWidth: 43,
    intensity: 1280,
    currentAnomaly: 3.2,
    correlation: 0.99,
    calibration: 2.41,
    firstYear: 2003,
    lastYear: 2026,
  },
  {
    id: "australia",
    name: "Australia",
    code: "AUS",
    bounds: { north: -10, south: -44, west: 112, east: 154 },
    presets: [
      {
        name: "Overview",
        bounds: { north: -15.0, south: -39.0, west: 118.0, east: 148.0 },
        multiplier: 1.0,
      },
      {
        name: "Northern Savanna",
        bounds: { north: -11.0, south: -21.0, west: 123.0, east: 142.0 },
        multiplier: 1.35,
      },
      {
        name: "Southeast Forests",
        bounds: { north: -31.0, south: -39.0, west: 144.0, east: 151.0 },
        multiplier: 1.52,
      },
      {
        name: "Western Rangelands",
        bounds: { north: -20.0, south: -32.0, west: 116.0, east: 129.0 },
        multiplier: 0.86,
      },
    ],
    seasonPeak: 18,
    seasonWidth: 51,
    intensity: 1540,
    currentAnomaly: 2.7,
    correlation: 0.98,
    calibration: 2.57,
    firstYear: 2003,
    lastYear: 2024,
  },
  {
    id: "brazil",
    name: "Brazil",
    code: "BRA",
    bounds: { north: 5.3, south: -33.8, west: -73.9, east: -34.8 },
    presets: [
      {
        name: "Overview",
        bounds: { north: -7.5, south: -21.0, west: -63.0, east: -45.7 },
        multiplier: 1.0,
      },
      {
        name: "Amazon Arc",
        bounds: { north: -5.0, south: -13.0, west: -65.0, east: -50.0 },
        multiplier: 1.37,
      },
      {
        name: "Pantanal",
        bounds: { north: -15.0, south: -21.5, west: -59.5, east: -54.5 },
        multiplier: 1.66,
      },
      {
        name: "Cerrado",
        bounds: { north: -8.0, south: -18.0, west: -55.0, east: -43.0 },
        multiplier: 1.15,
      },
    ],
    seasonPeak: 247,
    seasonWidth: 48,
    intensity: 1980,
    currentAnomaly: 3.7,
    correlation: 0.99,
    calibration: 2.38,
    firstYear: 2003,
    lastYear: 2024,
  },
  {
    id: "chile",
    name: "Chile",
    code: "CHL",
    bounds: { north: -17.5, south: -55.9, west: -75.7, east: -66.4 },
    presets: [
      {
        name: "Overview",
        bounds: { north: -30.0, south: -43.4, west: -74.5, east: -67.6 },
        multiplier: 1.0,
      },
      {
        name: "Central Chile",
        bounds: { north: -32.0, south: -37.5, west: -73.0, east: -69.8 },
        multiplier: 1.38,
      },
      {
        name: "Araucanía",
        bounds: { north: -37.5, south: -40.5, west: -73.5, east: -71.0 },
        multiplier: 1.19,
      },
      {
        name: "Patagonia Sur",
        bounds: { north: -42.0, south: -52.0, west: -75.0, east: -70.0 },
        multiplier: 0.58,
      },
    ],
    seasonPeak: 29,
    seasonWidth: 36,
    intensity: 710,
    currentAnomaly: 2.4,
    correlation: 0.98,
    calibration: 2.44,
    firstYear: 2003,
    lastYear: 2024,
  },
  {
    id: "paraguay",
    name: "Paraguay",
    code: "PRY",
    bounds: { north: -19.3, south: -27.6, west: -62.7, east: -54.2 },
    presets: [
      {
        name: "Overview",
        bounds: { north: -19.9, south: -27.0, west: -62.0, east: -54.9 },
        multiplier: 1.0,
      },
      {
        name: "Dry Chaco",
        bounds: { north: -20.0, south: -24.5, west: -62.0, east: -58.8 },
        multiplier: 1.44,
      },
      {
        name: "Atlantic Forest",
        bounds: { north: -23.8, south: -27.0, west: -56.5, east: -54.5 },
        multiplier: 0.91,
      },
      {
        name: "Pilcomayo",
        bounds: { north: -22.0, south: -25.5, west: -61.0, east: -58.8 },
        multiplier: 1.12,
      },
    ],
    seasonPeak: 250,
    seasonWidth: 42,
    intensity: 890,
    currentAnomaly: 3.1,
    correlation: 0.99,
    calibration: 2.36,
    firstYear: 2003,
    lastYear: 2024,
  },
  {
    id: "uruguay",
    name: "Uruguay",
    code: "URY",
    bounds: { north: -30, south: -35.1, west: -58.5, east: -53.1 },
    presets: [
      {
        name: "Overview",
        bounds: { north: -30.2, south: -34.9, west: -58.2, east: -53.4 },
        multiplier: 1.0,
      },
      {
        name: "Northern Grasslands",
        bounds: { north: -30.5, south: -32.8, west: -57.5, east: -54.8 },
        multiplier: 1.18,
      },
      {
        name: "Coastal Plain",
        bounds: { north: -32.5, south: -34.8, west: -55.3, east: -53.3 },
        multiplier: 0.72,
      },
      {
        name: "Río Negro",
        bounds: { north: -31.5, south: -33.5, west: -57.8, east: -55.5 },
        multiplier: 1.04,
      },
    ],
    seasonPeak: 35,
    seasonWidth: 39,
    intensity: 430,
    currentAnomaly: 2.1,
    correlation: 0.97,
    calibration: 2.48,
    firstYear: 2003,
    lastYear: 2024,
  },
  {
    id: "usa",
    name: "United States",
    code: "USA",
    bounds: { north: 49.4, south: 24.5, west: -125.0, east: -66.9 },
    presets: [
      {
        name: "Overview",
        bounds: { north: 45.0, south: 28.9, west: -115.0, east: -76.9 },
        multiplier: 1.0,
      },
      {
        name: "California & West",
        bounds: { north: 42.0, south: 32.5, west: -124.5, east: -114.1 },
        multiplier: 1.45,
      },
      {
        name: "Pacific Northwest",
        bounds: { north: 48.5, south: 42.0, west: -124.8, east: -116.5 },
        multiplier: 1.32,
      },
      {
        name: "Southern Plains / Texas",
        bounds: { north: 36.5, south: 25.8, west: -106.6, east: -93.5 },
        multiplier: 1.18,
      },
      {
        name: "Southeast Pinelands",
        bounds: { north: 36.0, south: 25.0, west: -91.0, east: -75.5 },
        multiplier: 1.1,
      },
    ],
    seasonPeak: 235,
    seasonWidth: 46,
    intensity: 1850,
    currentAnomaly: 2.5,
    correlation: 0.961,
    calibration: 0.393,
    firstYear: 2003,
    lastYear: 2024,
  },
  {
    id: "canada",
    name: "Canada",
    code: "CAN",
    bounds: { north: 69.0, south: 42.0, west: -141.0, east: -52.6 },
    presets: [
      {
        name: "Overview",
        bounds: { north: 65.0, south: 46.0, west: -125.0, east: -68.6 },
        multiplier: 1.0,
      },
      {
        name: "Western Boreal",
        bounds: { north: 60.0, south: 49.0, west: -139.0, east: -110.0 },
        multiplier: 1.55,
      },
      {
        name: "Central Boreal",
        bounds: { north: 60.0, south: 49.0, west: -110.0, east: -95.0 },
        multiplier: 1.35,
      },
      {
        name: "Eastern Boreal",
        bounds: { north: 55.0, south: 46.0, west: -85.0, east: -65.0 },
        multiplier: 1.62,
      },
    ],
    seasonPeak: 188,
    seasonWidth: 42,
    intensity: 2400,
    currentAnomaly: 3.8,
    correlation: 0.982,
    calibration: 0.377,
    firstYear: 2003,
    lastYear: 2024,
  },
  {
    id: "greece",
    name: "Greece",
    code: "GRC",
    bounds: { north: 41.8, south: 34.8, west: 19.4, east: 28.3 },
    presets: [
      {
        name: "Overview",
        bounds: { north: 41.5, south: 35.1, west: 20.0, east: 27.7 },
        multiplier: 1.0,
      },
      {
        name: "Attica & Central Greece",
        bounds: { north: 39.2, south: 37.5, west: 21.5, east: 24.5 },
        multiplier: 1.42,
      },
      {
        name: "Peloponnese",
        bounds: { north: 38.4, south: 36.4, west: 21.1, east: 23.3 },
        multiplier: 1.68,
      },
      {
        name: "Evia & Aegean",
        bounds: { north: 39.1, south: 37.8, west: 23.0, east: 25.5 },
        multiplier: 1.5,
      },
    ],
    seasonPeak: 228,
    seasonWidth: 32,
    intensity: 620,
    currentAnomaly: 2.8,
    correlation: 0.925,
    calibration: 0.337,
    firstYear: 2003,
    lastYear: 2024,
  },
  {
    id: "portugal",
    name: "Portugal",
    code: "PRT",
    bounds: { north: 42.2, south: 36.9, west: -9.6, east: -6.1 },
    presets: [
      {
        name: "Overview",
        bounds: { north: 42.1, south: 37.0, west: -9.5, east: -6.2 },
        multiplier: 1.0,
      },
      {
        name: "Centro / Pinhal Interior",
        bounds: { north: 40.5, south: 39.5, west: -8.8, east: -7.5 },
        multiplier: 1.65,
      },
      {
        name: "Norte / Serra da Estrela",
        bounds: { north: 42.0, south: 40.4, west: -8.9, east: -6.5 },
        multiplier: 1.48,
      },
      {
        name: "Alentejo & Algarve",
        bounds: { north: 39.5, south: 37.0, west: -9.0, east: -7.4 },
        multiplier: 1.12,
      },
    ],
    seasonPeak: 226,
    seasonWidth: 34,
    intensity: 780,
    currentAnomaly: 3.4,
    correlation: 0.984,
    calibration: 0.613,
    firstYear: 2003,
    lastYear: 2024,
  },
]

const wrapDistance = (day: number, peak: number) => {
  const difference = Math.abs(day - peak)
  return Math.min(difference, 365 - difference)
}

const gaussian = (distance: number, width: number) =>
  Math.exp(-0.5 * Math.pow(distance / width, 2))

const seededVariation = (year: number, day: number, seed: number) =>
  Math.sin(day * 0.171 + year * 0.73 + seed) * 0.1 +
  Math.sin(day * 0.047 + year * 1.31) * 0.07

export const severityFor = (count: number, max: number, z: number): Severity => {
  if (z >= 4 || count > max * 1.6) return 4
  if (z >= 2.7 || count > max * 1.08) return 3
  if (z >= 1.2 || count > max * 0.62) return 2
  if (count > max * 0.2) return 1
  return 0
}

const historicalAnomaly = (
  profile: CountryProfile,
  year: number,
  day: number,
) => {
  const nearPeak =
    wrapDistance(day, profile.seasonPeak) < profile.seasonWidth * 0.48
  if (!nearPeak) return 0
  if (profile.id === "australia" && (year === 2019 || year === 2020)) return 1.4
  if ((profile.id === "brazil" || profile.id === "paraguay") && year === 2020)
    return 1.65
  if (profile.id === "chile" && year === 2017) return 1.1
  if (year === 2012 || year === 2023) return 0.48
  return 0
}

export const areaKm2 = (bounds: Bounds) => {
  const radius = 6371
  const lat1 = (bounds.south * Math.PI) / 180
  const lat2 = (bounds.north * Math.PI) / 180
  const deltaLon = ((bounds.east - bounds.west) * Math.PI) / 180
  return Math.abs(
    radius * radius * deltaLon * (Math.sin(lat2) - Math.sin(lat1)),
  )
}

export const generateDashboardData = (
  profile: CountryProfile,
  bounds: Bounds,
  multiplier: number,
): DashboardData => {
  const areaRatio = Math.min(
    1,
    Math.max(0.09, areaKm2(bounds) / areaKm2(profile.bounds)),
  )
  const scale = Math.pow(areaRatio, 0.72) * multiplier
  const rows: DailyRecord[][] = []

  for (let year = 2003; year <= 2026; year += 1) {
    const row: DailyRecord[] = []
    const yearDrift = 0.84 + (year - 2003) * 0.009
    for (let day = 1; day <= 365; day += 1) {
      const distance = wrapDistance(day, profile.seasonPeak)
      const season = gaussian(distance, profile.seasonWidth)
      const shoulder = gaussian(
        wrapDistance(day, profile.seasonPeak + 78),
        profile.seasonWidth * 1.45,
      )
      const mean = Math.max(
        8,
        profile.intensity * scale * (0.055 + season * 0.62 + shoulder * 0.12),
      )
      const stdDev = Math.max(10, mean * (0.2 + 0.04 * Math.sin(day * 0.031)))
      const historical = historicalAnomaly(profile, year, day)
      const currentPulse =
        year === 2026
          ? profile.currentAnomaly *
            gaussian(
              wrapDistance(day, profile.seasonPeak),
              profile.seasonWidth * 0.27,
            ) *
            0.2
          : 0
      const variation = seededVariation(year, day, profile.name.length)
      const count = Math.max(
        0,
        Math.round(
          mean * yearDrift * (1 + variation + historical + currentPulse),
        ),
      )
      const zScore = (count - mean) / stdDev
      row.push({
        year,
        day,
        count,
        mean: Math.round(mean),
        stdDev: Math.round(stdDev),
        zScore,
        severity: severityFor(count, profile.intensity * scale, zScore),
        criticalRun: false,
      })
    }

    for (let index = 0; index < row.length; index += 1) {
      const window = row.slice(
        Math.max(0, index - 2),
        Math.min(row.length, index + 3),
      )
      row[index].criticalRun =
        window.filter((record) => record.zScore > 2).length >= 3
    }
    rows.push(row)
  }

  const current = rows[rows.length - 1]
  const metricDay = current.reduce((best, record) =>
    record.zScore > best.zScore ? record : best,
  )
  return { rows, current, metricDay }
}

export const intersectingCountries = (bounds: Bounds) =>
  countries.filter(
    (profile) =>
      bounds.west < profile.bounds.east &&
      bounds.east > profile.bounds.west &&
      bounds.south < profile.bounds.north &&
      bounds.north > profile.bounds.south,
  )

const intersection = (first: Bounds, second: Bounds): Bounds => ({
  north: Math.min(first.north, second.north),
  south: Math.max(first.south, second.south),
  east: Math.min(first.east, second.east),
  west: Math.max(first.west, second.west),
})

export const generateAreaDashboardData = (
  activeProfile: CountryProfile,
  bounds: Bounds,
  multiplier: number,
): DashboardData => {
  const included = intersectingCountries(bounds)
  if (included.length <= 1) {
    const profile = included[0] ?? activeProfile
    return generateDashboardData(
      profile,
      included.length ? intersection(bounds, profile.bounds) : bounds,
      profile.id === activeProfile.id ? multiplier : 1,
    )
  }

  const sources = included.map((profile) =>
    generateDashboardData(
      profile,
      intersection(bounds, profile.bounds),
      profile.id === activeProfile.id ? multiplier : 1,
    ),
  )
  const rows = sources[0].rows.map((row, rowIndex) =>
    row.map((record, dayIndex) => {
      const records = sources.map((source) => source.rows[rowIndex][dayIndex])
      const count = records.reduce((sum, item) => sum + item.count, 0)
      const mean = records.reduce((sum, item) => sum + item.mean, 0)
      const stdDev = Math.sqrt(
        records.reduce((sum, item) => sum + item.stdDev * item.stdDev, 0),
      )
      const zScore = stdDev ? (count - mean) / stdDev : 0
      return {
        ...record,
        count,
        mean,
        stdDev,
        zScore,
        severity: Math.max(...records.map((item) => item.severity)) as Severity,
        criticalRun: records.some((item) => item.criticalRun),
      }
    }),
  )
  const current = rows[rows.length - 1]
  const metricDay = current.reduce((best, record) =>
    record.zScore > best.zScore ? record : best,
  )
  return { rows, current, metricDay }
}

export const rowsForHorizon = (data: DashboardData, horizon: Horizon) => {
  if (horizon === 5) return data.rows.filter((row) => row[0].year >= 2022)
  if (horizon === 10) return data.rows.filter((row) => row[0].year >= 2017)
  return data.rows
}

export const dayToDate = (day: number, year = 2026) => {
  const date = new Date(Date.UTC(year, 0, day))
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date)
}

export const longDayToDate = (day: number, year: number) => {
  const date = new Date(Date.UTC(year, 0, day))
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date)
}

export const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value)

export const severityNames = ["Quiet", "Elevated", "High", "Severe", "Extreme"]
