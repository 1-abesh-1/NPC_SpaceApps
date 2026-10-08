# FireCalendar Frontend Redesign Plan

## Objective

Transform the blank React/Vite scaffold into a polished, responsive, interactive FireCalendar dashboard for the NASA Space Apps Challenge 2026. The first release will be a self-contained demonstration driven by deterministic local data rather than external APIs, while preserving clear seams for future NASA FIRMS integration.

## Confirmed Product Decisions

- Deliver an **interactive demo with local, scientifically plausible data**.
- Build the AOI experience as a **custom SVG mission map**, avoiding tile-service keys and map-library dependencies.
- Support **desktop, tablet, and mobile layouts**, with the 1440px mission-control view as the primary composition.
- Use the three requested themes: **Ember Dark** (default), **Thermal FLIR**, and **Clean Paper**.
- Use **2003–2025 as the 23 complete historical years**, plus a separate **2026 provisional NRT row**. This resolves the brief’s conflicting year ranges while preserving both the “Full 23Y Record” claim and a current-year row.
- Use an original compact mission badge labeled **NASA FIRMS** rather than depending on an unavailable external image asset; retain text attribution without implying that the interface is an official NASA product.
- Add no chart, map, icon, or state-management dependency. Use React, Tailwind v4, CSS, and accessible inline SVGs.

## Experience and Visual Direction

### Overall composition

- Full-width application canvas with a minimum desktop target of 1440px and no arbitrary max-width that wastes screen area.
- Obsidian page background, subtle topographic/grid texture, crisp 1px slate borders, restrained glow, and dense but legible information hierarchy.
- Space Grotesk for display/UI labels and JetBrains Mono for telemetry, coordinates, dates, and numeric values, loaded through a Google Fonts CSS import at the top of `src/index.css`.
- Original inline SVG icons using the project’s stroke conventions; no emoji. The critical banner uses an alert icon rather than the alarm emoji shown in the prompt.
- Motion is short and functional: panel entrance, alert pulse, selection transitions, chart reveal, and tooltip fades. All nonessential animation is disabled under `prefers-reduced-motion`.

### Desktop layout

1. Sticky 64px command bar with mission identity on the left, country/time controls in the center, and integrity/theme controls on the right.
2. Main split section at approximately 55/45 with a 520px content height:
   - AOI mission map on the left.
   - Alert, four metrics, and climatology chart on the right.
3. Full-width historical activity matrix below, with a section header, legend, sticky labels, and horizontally scrollable daily cells.

### Responsive behavior

- **Large desktop (>=1280px):** exact split-panel layout and four-card 2x2 metric grid.
- **Tablet (768–1279px):** command bar wraps into two rows; map and intelligence panels stack; metrics remain 2x2; calendar keeps horizontal scrolling.
- **Mobile (<768px):** condensed identity row and scrollable control rows; map height reduces to roughly 380px; metrics become one or two columns based on available width; chart remains horizontally readable; the heatmap uses a sticky year column and touch/click detail inspector instead of hover-only behavior.

## Data Model and Demo Logic

Create typed local domain models for:

- `ThemeId`: `ember`, `flir`, `paper`.
- `Horizon`: `5`, `10`, `23`.
- Country profiles for Argentina, Australia, Brazil, Chile, Paraguay, and Uruguay.
- Country-specific map viewport, default AOI, biome presets, seasonal center/width, intensity scale, anomaly year/day window, and calibration coefficient.
- Daily records containing date, year, day-of-year, harmonized count, baseline mean, standard deviation, z-score, severity, and sensor status.
- AOI bounds containing north/south/east/west and calculated area.

Generate deterministic daily series from simple seeded functions rather than random values so the UI is stable across reloads:

- A country-specific seasonal Gaussian-like baseline plus a smaller secondary seasonal component.
- Fixed low-amplitude deterministic variation for visual texture.
- Deliberate historical anomaly windows, including recognizable example periods such as Australia 2019/2020 and Pantanal 2020.
- A 2026 current-year curve with an active anomaly spike that can exceed the baseline envelope.
- Severity thresholds derived from normalized intensity and z-score.
- Pre-2012 rows labeled `MODIS Harmonized`; 2012–2025 treated as the harmonized historical record; 2026 labeled `Provisional NRT`.

Derived selectors will calculate from the active country, horizon, and AOI:

- Active daily hotspots and percentage versus expected.
- Historical baseline mean and standard deviation.
- Count of anomaly days with `z > 2`.
- Season start, peak, and end dates.
- Alert state and current sigma value.
- Heatmap rows for the selected horizon: 2022–2026 for 5Y, 2017–2026 for 10Y, and 2003–2026 for the full historical view (23 complete years plus current provisional NRT).

AOI changes apply a deterministic area ratio and biome multiplier to the displayed metrics and curves. This makes drawing and presets visibly meaningful without claiming backend spatial analysis.

## Component and File Structure

### `src/App.tsx`

- Own top-level state for country, horizon, theme, AOI, selected map preset, calibration modal state, and currently inspected heatmap/chart datum.
- Set `data-theme` on the app root and persist the theme in `localStorage`, falling back to Ember Dark.
- Compose the command bar, main dashboard, and historical matrix.
- Derive the active dashboard view from typed demo data and memoized selectors.

### `src/components/CommandBar.tsx`

- Mission badge, title, and subtitle.
- Labeled searchable-style native country select with country code.
- Accessible segmented time-horizon control using buttons and `aria-pressed`.
- Sensor integrity button showing `r = 0.99` (country-specific value may vary by hundredths).
- Compact three-option theme switcher; on narrow screens this becomes a horizontally scrollable control row.

### `src/components/AoiMap.tsx`

- Responsive SVG world/South America mission map with graticules, simplified land silhouettes, highlighted selected country/region, major reference labels, and map telemetry.
- Project configured geographic AOI bounds into SVG coordinates using a documented equirectangular projection helper.
- Toolbar actions: Draw Box, Select Full Country, and biome preset chips.
- Draw interaction:
  - Toggle enters crosshair mode.
  - Pointer drag creates a bounded AOI rectangle.
  - Four corner handles resize the selection.
  - Existing selection can be repositioned by dragging its body.
  - Pointer capture keeps dragging stable outside the immediate handle.
  - Bounds are clamped to the map viewport and minimum dimensions prevent accidental zero-area selections.
- Selection visuals use a 1.5px ember border, translucent fill, subtle outer glow, and a live coordinate/area badge.
- Area is estimated from latitude/longitude bounds using a spherical rectangle calculation and formatted in km².
- Country and preset changes update viewport, AOI, active chip, and dashboard calculations.
- Keyboard fallback: presets and full-country selection remain fully operable even though freehand box drawing is pointer-oriented.

### `src/components/IntelligencePanel.tsx`

- Alert banner with critical and normal visual variants, status icon, live text, and restrained pulse dot.
- Four compact metric cards with clear labels, mono numerals, change/status annotations, and relevant inline SVG icons.
- Metric values and alert state animate only through subtle CSS transitions; avoid slot-machine counters.

### `src/components/ClimatologyChart.tsx`

- Custom responsive SVG chart using calculated scales.
- Render baseline mean ±2 standard deviations as a blue/cyan area band.
- Render historical mean as a fine reference line and 2026 progression as a bright thermal line with a glow only near anomalous segments.
- Month ticks across the x-axis and compact numeric ticks/gridlines on the y-axis.
- Current-day marker and labeled peak annotation.
- Pointer/touch inspection with nearest-day snapping, vertical crosshair, point marker, and tooltip containing date, observed count, expected range, and z-score.
- Use an invisible overlay rectangle for reliable interaction and expose a concise accessible chart summary.

### `src/components/CalibrationDialog.tsx`

- Opened by the Sensor Integrity badge.
- Accessible modal/dialog with focusable close control, backdrop click, and Escape handling.
- Explain the MODIS/VIIRS overlap calibration in concise language.
- Show an SVG overlap scatter/fit view, the empirical `k` value, correlation, overlap period, resolution labels, and a short note that demo values are illustrative.
- Restore focus to the trigger on close.

### `src/components/HistoricalCalendar.tsx`

- Header, explanatory subtitle, active horizon summary, and continuous severity legend.
- Month header aligned to daily columns.
- Rows rendered as 365 compact rounded cells using CSS grid; leap-day source data is normalized to day-of-year 1–365 for visual consistency.
- Sticky year/sensor label column inside a horizontal scroll container.
- Pre-2012 and provisional status tags.
- Critical runs get a subtle top/bottom outline across contiguous `z > 2` cells, not a visually noisy border on every tile.
- Hover, focus, and tap inspection displays date, detections, z-score, severity, sensor state, and whether the day belongs to a prolonged critical run.
- Cells are keyboard focusable at a practical interval: each row is a focusable grid row with arrow-key day navigation managed through a single roving tab stop, avoiding hundreds of tab stops.
- Include a compact “selected day” detail panel on touch/mobile so information never depends on hover.

### `src/components/Icons.tsx`

- Small set of consistent inline SVG icons for alert, flame/activity, baseline, calendar, season, crosshair, globe, chevron, close, and palette.
- Decorative icons use `aria-hidden`; controls retain visible labels or accessible names.

### `src/data/fireData.ts`

- Typed country profile configuration.
- Deterministic generator and anomaly definitions.
- Date/day/month formatting helpers.
- Severity, baseline, z-score, metric, and heatmap-row selectors.
- Keep all demo constants centralized so a later API adapter can replace generation without rewriting visual components.

### `src/types.ts`

- Shared theme, country, AOI, daily record, severity, sensor status, and metric types.

### `src/index.css`

- Keep CSS imports first: Tailwind import plus Google Fonts import.
- Define semantic CSS custom properties per theme: background, panel, elevated panel, border, text, muted text, grid, baseline, fire levels, danger, focus, shadow, and map colors.
- Add base typography, selection, scrollbar, focus-visible, tooltip, glow, grid-texture, and reduced-motion rules.
- Use theme variables from Tailwind arbitrary values/classes so components do not duplicate palette logic.

### `.figma/make/site.json`

- Replace the generic description with FireCalendar metadata and enable the existing bypass-link behavior for keyboard accessibility.
- Keep robots indexing disabled unless the user separately requests deployment/indexing changes.

## Interaction Details and State Flow

1. Initial load uses Argentina, Full 23Y Record, Ember Dark, and the Gran Chaco AOI.
2. Changing country swaps the country profile, map viewport, available presets, default AOI, generated data, alert copy, metrics, chart, and matrix.
3. Changing horizon filters historical rows and recalculates historical summary values from the selected period.
4. Choosing a map preset updates bounds and applies its local intensity multiplier.
5. Drawing/resizing/moving the AOI updates its coordinate badge immediately and recomputes scaled dashboard values after each pointer movement.
6. Theme selection updates all surfaces, maps, charts, heatmap cells, focus styles, and tooltips; choice persists across reloads.
7. Integrity badge opens the calibration dialog without navigating away.
8. Chart and matrix inspection are ephemeral local states and do not alter the selected AOI or horizon.

## Scientific and Content Guardrails

- Label the experience as a **demonstration** and state that generated values are illustrative, not operational fire alerts.
- Use the terms “detections,” “harmonized footprint,” “baseline,” and “z-score” consistently.
- Explain `z > 2` in plain language where first used.
- Do not present local generated values as fetched NASA measurements.
- Preserve the core scientific story: VIIRS has finer native resolution; harmonization prevents the 2012 sensor transition from appearing as a false trend.

## Accessibility

- Semantic header, main, sections, headings, buttons, select, dialog, and grid labeling.
- Visible labels for all controls; color is never the only status signal.
- WCAG-conscious contrast in all three themes, including subdued labels in Clean Paper.
- Strong theme-aware focus rings.
- Pointer and keyboard access to presets, timeframe, themes, modal, chart summary, and heatmap inspection.
- `aria-live="polite"` for updated AOI telemetry and alert status, without announcing every pointer pixel change excessively.
- Reduced-motion support and no flashing effects.

## Implementation Sequence

1. Invoke the `make/use-design-system` skill before UI implementation, then establish domain types, theme tokens, typography, and generated local data.
2. Build the application shell and responsive command bar.
3. Implement the SVG AOI map, geographic projection helpers, presets, and pointer interactions.
4. Implement alert/metric cards and the custom climatology SVG chart.
5. Implement the historical matrix, severity/run logic, and accessible inspection behavior.
6. Add the sensor calibration dialog and theme persistence.
7. Refine responsive layouts, motion, focus states, copy, and theme-specific chart/map contrast.
8. Update site metadata.

## Verification Strategy

Because this is a broad UI implementation, run the repository’s prescribed build after implementation:

- `npm run build` (or the package-manager-equivalent invocation only if the environment already establishes it), verifying TypeScript, JSX, and Vite bundling.
- `npm run format -- --check` only if the installed `oxfmt` script supports check mode; otherwise run the project’s `npm run format` and inspect that it only touches intended files.

Manual preview checks against the already-running server:

- Verify default 1440px composition and no clipped panels.
- Exercise all six countries, all three horizons, and all three themes.
- Draw, resize, move, and reset AOIs; confirm telemetry and metrics update.
- Open/close the integrity dialog by mouse and keyboard.
- Inspect chart points and heatmap days by pointer, keyboard, and touch-sized viewport.
- Confirm full 2003–2026 matrix filtering and correct MODIS/Provisional labels.
- Check tablet and mobile stacking, sticky heatmap labels, horizontal scrolling, and control wrapping.
- Confirm Clean Paper contrast, reduced-motion behavior, visible focus states, and no emoji or missing external assets.

## Out of Scope for This Release

- Live NASA FIRMS API calls, authentication, backend storage, real harmonization processing, or operational alerting.
- True GIS polygon intersection, tile rendering, geocoding, or arbitrary country search beyond configured profiles.
- Export/download, user accounts, saved AOIs, notifications, or URL-deep-linked state.
- Exact official NASA brand asset reproduction when no approved source asset is supplied.
