# FireCalendar app

Rotatable globe with country borders. The user draws a box; a calendar heatmap shows fire activity for it.

## Run
    npm install
    npm run dev

## The two components
1. GlobeMap (src/components/GlobeMap.jsx)
   - props: drawing, box, onBoxChange(box)
   - box = { minLat, maxLat, minLng, maxLng }  -> save it in state (App.jsx) and use it for API calls
   - utils/box.js: boxToAreaString(box) gives "west,south,east,north" for the FIRMS API; boxCenter(box)
2. FireCalendar (src/components/FireCalendar.jsx)
   - props: data = [{ date: "2020-01-15", value: 12 }, ...]  (null = no area yet, [] = no data)

## Connecting real data (replace sample data in App.jsx)
    const rows = filterRowsByBox(allRows, box);
    const calendarData = dailyTotals(rows);
Both helpers are in src/utils/fireData.js.

## Structure
- src/App.jsx                    holds `box` state, wires the two components
- src/config.js                  textures, colors, settings
- src/components/                GlobeMap, FireCalendar, Toolbar, ViewSliders
- src/hooks/                     useBoxDrawing, useElementSize
- src/utils/                     box, countries, calendarGrid, colorScale, fireData, sampleData (fake)

## Known limit
Boxes that cross the 180 degree longitude line are not handled.
