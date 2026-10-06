// Turns daily totals [{ date: "2020-01-15", value: 12 }, ...] into a years x day-of-year grid.

export const MAX_DAYS = 366;
const MS_PER_DAY = 86400000;

export const MONTH_STARTS = [
  ["Jan", 1], ["Feb", 32], ["Mar", 60], ["Apr", 91], ["May", 121], ["Jun", 152],
  ["Jul", 182], ["Aug", 213], ["Sep", 244], ["Oct", 274], ["Nov", 305], ["Dec", 335],
];

const isLeapYear = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
const daysInYear = (y) => (isLeapYear(y) ? 366 : 365);

function parseDate(dateString) {
  const [year, month, day] = dateString.slice(0, 10).split("-").map(Number);
  return { year, month, day };
}

function dayOfYear(dateString) {
  const { year, month, day } = parseDate(dateString);
  return (Date.UTC(year, month - 1, day) - Date.UTC(year, 0, 1)) / MS_PER_DAY + 1;
}

function isoDate(year, dayNumber) {
  return new Date(Date.UTC(year, 0, dayNumber)).toISOString().slice(0, 10);
}

export function formatDayOfYear(year, dayNumber) {
  return new Date(Date.UTC(year, 0, dayNumber)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function percentile(values, p) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor((sorted.length - 1) * p)];
}

// Returns { years: [2000, ...], rows: [[366 values or null], ...], maxValue }.
// Days with no row in the data count as 0 (no fire detected) between the first and last date.
// Days outside that range are null (no data).
export function buildCalendarGrid(dailyTotals) {
  const valueByDate = new Map();
  for (const { date, value } of dailyTotals) {
    const key = date.slice(0, 10);
    valueByDate.set(key, (valueByDate.get(key) ?? 0) + value);
  }

  const dates = [...valueByDate.keys()].sort();
  const first = dates[0];
  const last = dates[dates.length - 1];
  const firstYear = parseDate(first).year;
  const lastYear = parseDate(last).year;

  const years = [];
  const rows = [];
  const allValues = [];

  for (let year = firstYear; year <= lastYear; year++) {
    const startDay = year === firstYear ? dayOfYear(first) : 1;
    const endDay = year === lastYear ? dayOfYear(last) : daysInYear(year);
    const row = new Array(MAX_DAYS).fill(null);
    for (let day = startDay; day <= endDay; day++) {
      const value = valueByDate.get(isoDate(year, day)) ?? 0;
      row[day - 1] = value;
      allValues.push(value);
    }
    years.push(year);
    rows.push(row);
  }

  // Cap the color scale at the 98th percentile so one extreme day doesn't wash out the rest.
  const cap = percentile(allValues, 0.98) || Math.max(...allValues);
  return { years, rows, maxValue: Math.max(cap, 1) };
}
