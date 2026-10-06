// Helpers for the REAL data (daily_grid CSV from the backend teammate).
// Rows look like: { date, cell_lat, cell_lon, region, count_harmonized }

// Keep only the rows inside the box.
export function filterRowsByBox(rows, box) {
  return rows.filter((row) => {
    const lat = Number(row.cell_lat);
    const lng = Number(row.cell_lon);
    return lat >= box.minLat && lat <= box.maxLat && lng >= box.minLng && lng <= box.maxLng;
  });
}

// Add up all cells per day -> [{ date, value }], the format FireCalendar needs.
export function dailyTotals(rows, valueKey = "count_harmonized") {
  const totals = new Map();
  for (const row of rows) {
    totals.set(row.date, (totals.get(row.date) ?? 0) + Number(row[valueKey]));
  }
  return [...totals]
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));
}
