export type ThemeId = "ember" | "flir" | "paper"
export type Horizon = 5 | 10 | 23
export type Severity = 0 | 1 | 2 | 3 | 4

export type Bounds = {
  north: number
  south: number
  east: number
  west: number
}

export type Preset = {
  name: string
  bounds: Bounds
  multiplier: number
}

export type CountryProfile = {
  id: string
  name: string
  code: string
  bounds: Bounds
  presets: Preset[]
  seasonPeak: number
  seasonWidth: number
  intensity: number
  currentAnomaly: number
  correlation: number
  calibration: number
  firstYear?: number
  lastYear?: number
}

export type DailyRecord = {
  year: number
  day: number
  count: number
  mean: number
  stdDev: number
  zScore: number
  severity: Severity
  criticalRun: boolean
}

export type DashboardData = {
  rows: DailyRecord[][]
  current: DailyRecord[]
  metricDay: DailyRecord
}
