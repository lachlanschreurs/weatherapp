# FarmCast Colour & Threshold Specification

Master reference for all colour logic, threshold rules, labels, formulas, and recommendation text used across the FarmCast platform. Intended for mobile app developers to ensure pixel-perfect parity with the web application.

**Generated**: 2026-04-25
**Platform Version**: FarmCast Web (React + Tailwind CSS + Supabase Edge Functions)

---

## Table of Contents

1. [Design System Foundations](#1-design-system-foundations)
2. [Wind Speed](#2-wind-speed)
3. [Delta T (Spray Conditions)](#3-delta-t-spray-conditions)
4. [Spray Window](#4-spray-window)
5. [Rain / Precipitation](#5-rain--precipitation)
6. [Temperature (High/Low)](#6-temperature-highlow)
7. [Frost Risk](#7-frost-risk)
8. [UV Index](#8-uv-index)
9. [Humidity](#9-humidity)
10. [ETo (Evapotranspiration)](#10-eto-evapotranspiration)
11. [GDD (Growing Degree Days)](#11-gdd-growing-degree-days)
12. [Soil Temperature](#12-soil-temperature)
13. [Soil Moisture](#13-soil-moisture)
14. [Battery Level (Probe)](#14-battery-level-probe)
15. [Farm Recommendations - Planting](#15-farm-recommendations---planting)
16. [Farm Recommendations - Irrigation](#16-farm-recommendations---irrigation)
17. [Farm Recommendations - Actionable](#17-farm-recommendations---actionable)
18. [Weather Alerts](#18-weather-alerts)
19. [Rain Radar](#19-rain-radar)
20. [Weather Background Gradients](#20-weather-background-gradients)
21. [Weather Icon Colours](#21-weather-icon-colours)
22. [Farm Summary Status System](#22-farm-summary-status-system)
23. [Notification System](#23-notification-system)
24. [Forecast Confidence](#24-forecast-confidence)
25. [Email Report Colours](#25-email-report-colours)
26. [Agronomy Database (WHP)](#26-agronomy-database-whp)
27. [Field Notes](#27-field-notes)
28. [Inconsistencies & Notes](#28-inconsistencies--notes)
29. [Master Summary Table](#29-master-summary-table)

---

## 1. Design System Foundations

### Base Theme (Dark Mode)

| Element | Tailwind Class | HEX |
|---------|---------------|-----|
| Page background | `bg-slate-900` | #0f172a |
| Card background | `bg-slate-800` | #1e293b |
| Card border (default) | `border-slate-700/60` | #334155 at 60% |
| Primary text | `text-white` | #ffffff |
| Secondary text | `text-slate-200` | #e2e8f0 |
| Tertiary text | `text-slate-400` | #94a3b8 |
| Muted text | `text-slate-500` | #64748b |
| Primary accent (green) | `text-green-400` / `bg-green-500` | #4ade80 / #22c55e |
| Informational (blue) | `text-blue-400` | #60a5fa |
| Historical data label | `text-blue-400` | #60a5fa |

### Spacing System
- Base unit: 8px
- Tailwind scale: `p-2` = 8px, `p-4` = 16px, `p-6` = 24px, etc.

### Status Colour Palette

| Status | Text | Icon | Badge BG | Badge Border |
|--------|------|------|----------|--------------|
| Good / Safe / Excellent | `text-green-300` #86efac | `text-green-400` #4ade80 | `bg-green-500/20` | `border-green-500/40` |
| Okay / Moderate / Caution | `text-amber-300` #fcd34d | `text-amber-400` #fbbf24 | `bg-amber-500/20` | `border-amber-500/40` |
| Poor / Warning / Risk | `text-red-300` #fca5a5 | `text-red-400` #f87171 | `bg-red-500/20` | `border-red-500/40` |
| Info | `text-sky-300` #7dd3fc | `text-sky-400` #38bdf8 | `bg-sky-500/20` | `border-sky-500/25` |
| Neutral / None | `text-slate-400` #94a3b8 | `text-slate-500` #64748b | `bg-slate-700/40` | `border-slate-600/40` |

---

## 2. Wind Speed

### Thresholds & Labels

| Range (km/h) | Label | Rating |
|--------------|-------|--------|
| < 15 | CALM | Good |
| 15 - 25 | MODERATE | Moderate |
| > 25 | HIGH | Poor |

### Web UI Colours (Tailwind)

| Range | Text | Icon | Card Border | Badge |
|-------|------|------|-------------|-------|
| < 15 | `text-green-400` | `text-green-400` | `border-slate-700/60` | `bg-green-500/20 text-green-300 border-green-500/40` |
| 15-25 | `text-yellow-400` | `text-yellow-400` | `border-yellow-500/40` | `bg-yellow-500/20 text-yellow-300 border-yellow-500/40` |
| > 25 | `text-red-400` | `text-red-400` | `border-red-500/40` | `bg-red-500/20 text-red-300 border-red-500/40` |

### Email Colours (HEX)

| Range | Colour | Background |
|-------|--------|------------|
| <= 15 | #059669 | #d1fae5 |
| 15-25 | #f59e0b | #fef3c7 |
| > 25 | #dc2626 | #fee2e2 |

### Additional Wind Thresholds

| Condition | Threshold | Effect |
|-----------|-----------|--------|
| Wind gust alert | > 50 km/h | Active alert: `text-red-300`, animated `bg-red-400` dot |
| Strong winds summary | > 25 km/h | Farm summary: amber warning status |
| Wind easing detection | Current > 20 AND afternoon < current * 0.75 | Farm summary: green ok status |
| Dangerous gust (recommendations) | > 40 km/h | Risk status in ActionableRecommendations |
| Moderate gust (recommendations) | 25-40 km/h | Caution status in ActionableRecommendations |

### Formula
- API returns wind_speed in m/s
- Conversion: `windSpeedKmh = wind_speed * 3.6`
- Wind gusts: `windGustKmh = wind_gust * 3.6`

### Files
- `src/App.tsx` lines 761-765 (getWindColor function)
- `src/App.tsx` lines 1130-1138 (wind card)
- `src/utils/deltaT.ts` lines 90-129 (getSprayCondition)
- `supabase/functions/send-daily-forecast/index.ts` lines 420-425

---

## 3. Delta T (Spray Conditions)

### Formula (Stull's Wet-Bulb Approximation)

```
wetBulb = tempC * atan(0.151977 * sqrt(humidity + 8.313659))
        + atan(tempC + humidity)
        - atan(humidity - 1.676331)
        + 0.00391838 * pow(humidity, 1.5) * atan(0.023101 * humidity)
        - 4.686035

deltaT = max(0, tempC - wetBulb)
```

### Thresholds, Labels & Colours

| Range (C) | Rating | Reason | Web Text | Web BG | HEX Colour | HEX BG |
|-----------|--------|--------|----------|--------|-------------|--------|
| < 2 | Poor | Temperature inversion -- avoid spraying | `text-red-700` | `bg-red-100` | #dc2626 | #fee2e2 |
| 2 - 4 | Okay | Monitor conditions before spraying | `text-amber-700` | `bg-amber-100` | #f59e0b | #fef3c7 |
| 4 - 6 | Excellent | Ideal for spraying | `text-green-700` | `bg-green-100` | #059669 | #d1fae5 |
| 6 - 8 | Okay | Monitor conditions -- rising evaporation | `text-amber-700` | `bg-amber-100` | #f59e0b | #fef3c7 |
| > 8 | Poor | Too dry -- avoid spraying | `text-red-700` | `bg-red-100` | #dc2626 | #fee2e2 |

### Card Styling (Dark Theme)

| Rating | Border | Background | Badge | Value Colour | Icon Colour |
|--------|--------|------------|-------|--------------|-------------|
| Excellent | `border-green-500/40` | `bg-green-500/10` | `bg-green-500/20 text-green-300 border-green-500/40` | `text-green-400` | `text-green-400` |
| Okay | `border-amber-500/40` | `bg-amber-500/10` | `bg-amber-500/20 text-amber-300 border-amber-500/40` | `text-amber-400` | `text-amber-400` |
| Poor | `border-red-500/40` | `bg-red-500/10` | `bg-red-500/20 text-red-300 border-red-500/40` | `text-red-400` | `text-red-400` |

### Graph Line Colours (HEX for SVG/Canvas)

| DeltaT Value | Line Colour |
|-------------|-------------|
| < 2 | #ef4444 |
| 2 - 4 | #f59e0b |
| 4 - 6 | #22c55e |
| 6 - 8 | #f59e0b |
| > 8 | #ef4444 |

### Special Effects
- Excellent rating: CSS glow effect class `farmcast-deltat-glow`
- Excellent rating: Badge has `animate-pulse` class
- Excellent alert: `bg-green-400` dot with `farmcast-pulse-green`

### Files
- `src/utils/deltaT.ts` (all functions)
- `src/App.tsx` lines 1163-1174 (card)
- `src/components/HourlyForecast.tsx` lines 332, 560 (graph dots)
- `supabase/functions/send-daily-forecast/index.ts` lines 412-418

---

## 4. Spray Window

### Criteria for Spray Suitability

| Parameter | Ideal (Good) | Acceptable | Poor |
|-----------|-------------|------------|------|
| Wind Speed | 3-15 km/h | 15-20 km/h | > 25 km/h or < 3 km/h |
| Rainfall (actual) | 0 mm | 0 mm | > 0.5 mm |
| Rain Probability | <= 30% | 30-40% | > 40% |
| Delta T | 4-6 C | 2-8 C | < 2 or > 8 C |
| Temperature | 10-28 C | 10-30 C | Outside range |

### Card Colours (Web UI)

| Rating | Background | Border | Glow Class | Pulse Dot | Label | Time Text |
|--------|------------|--------|------------|-----------|-------|-----------|
| Good | `bg-green-950/70` | `border-green-500/40` | `farmcast-spray-glow-good` | `bg-green-400` | `text-green-400` | `text-green-200` |
| Moderate | `bg-yellow-950/70` | `border-yellow-500/40` | `farmcast-spray-glow-moderate` | `bg-yellow-400` | `text-yellow-400` | `text-yellow-200` |
| None | `bg-red-950/70` | `border-red-500/40` | -- | -- | `text-red-400` | `text-red-200` |

### 5-Day Forecast Spray Badges

| Rating | Background | Border | Text |
|--------|------------|--------|------|
| Good | `bg-green-900/50` | `border-green-600/30` | `text-green-300` |
| Moderate | `bg-yellow-900/50` | `border-yellow-600/30` | `text-yellow-300` |
| None | `bg-red-950/50` | `border-red-800/30` | `text-red-400` |

### Spray Advice Messages (src/utils/sprayAdvice.ts)

| Condition | Message | Colour | BG |
|-----------|---------|--------|-----|
| Currently raining | "Currently raining -- delay spraying" | `text-red-800` | `bg-red-100` |
| Wind > 25 km/h | "Wind too strong -- spraying not recommended" | `text-red-800` | `bg-red-100` |
| Rain tonight | "Rain expected tonight -- delay spraying" | `text-amber-700` | `bg-amber-50` |
| Rain within 12h | "Rain expected soon -- delay spraying" | `text-amber-700` | `bg-amber-50` |
| Good window now | "Good conditions now -- spray window until {time}" | `text-green-700` | `bg-green-50` |
| Future window | "Best spraying window: {start}--{end}" | `text-green-700` | `bg-green-50` |
| Moderate wind (15-25) | "Moderate wind -- spray with caution" | `text-amber-700` | `bg-amber-50` |
| No windows | "No ideal spray windows in next 24 hours" | `text-red-800` | `bg-red-100` |

### Email Spray Window Icons

| Condition | Icon | Colour |
|-----------|------|--------|
| Ideal window | check mark | #16a34a |
| Good window | check | #4ade80 |
| Marginal | warning triangle | #f59e0b |
| No window | X | #dc2626 |

### Files
- `src/utils/sprayWindow.ts` (findBestSprayWindow)
- `src/utils/sprayAdvice.ts` (getSprayAdvice)
- `src/utils/deltaT.ts` lines 90-129 (getSprayCondition)
- `src/App.tsx` lines 1032-1065 (spray window card)
- `src/App.tsx` lines 1444-1455 (5-day spray)
- `src/components/ExtendedForecast.tsx` lines 56, 147-160
- `supabase/functions/send-daily-forecast/index.ts` lines 427-489

---

## 5. Rain / Precipitation

### Rain Chance Thresholds (Dashboard Card)

| Range (%) | Label | Text Colour | Icon Colour | Card Border | Badge |
|-----------|-------|-------------|-------------|-------------|-------|
| < 40 | LOW | `text-slate-300` | `text-slate-500` | `border-slate-700/60` | `bg-slate-700/40 text-slate-400 border-slate-600/40` |
| 40 - 70 | POSSIBLE | `text-sky-400` | `text-sky-400` | `border-sky-500/30` | `bg-sky-500/20 text-sky-300 border-sky-500/30` |
| > 70 | LIKELY | `text-blue-400` | `text-blue-400` | `border-blue-500/40` | `bg-blue-500/20 text-blue-300 border-blue-500/40` |

### 5-Day Forecast Rain Colours

| Range (%) | Colour |
|-----------|--------|
| > 70 | `text-blue-400` |
| 40 - 70 | `text-sky-400` |
| < 40 | `text-slate-400` |

### Active Alert Threshold
- Rain chance > 70%: Alert dot `bg-blue-400`, text `text-blue-300`
- Message: "Heavy rain likely -- {expected_mm} expected"

### Rainfall Effect on Spray Conditions
- Actual rainfall > 0.5 mm: Spray rating = Poor
- Rain probability > 0.3: Used for spray advice calculations
- Rain probability > 0.4: Effective rainfall set to max(actual, 1) in spray window calc

### Files
- `src/App.tsx` lines 1148-1160 (rain card)
- `src/App.tsx` lines 1080-1084 (rain alert)
- `src/App.tsx` line 1432 (5-day rain colours)

---

## 6. Temperature (High/Low)

### Display Colours

| Metric | Colour | HEX |
|--------|--------|-----|
| Current temperature | `text-white` | #ffffff |
| High temperature | `text-red-400` | #f87171 |
| Low temperature | `text-blue-400` | #60a5fa |
| Feels like | `text-white` | #ffffff |
| Unit label | `text-slate-400` | #94a3b8 |

### Email Colours

| Metric | HEX |
|--------|-----|
| High temperature | #fca5a5 |
| Low temperature | #93c5fd |

### Graph Colours (HourlyForecast & WeatherForecastGraph)

| Element | Colour | HEX |
|---------|--------|-----|
| Temperature line (hourly SVG) | -- | #f59e0b |
| Temperature bar (24h) | gradient | `from-orange-500 to-orange-400` |
| Temperature bar hover | gradient | `from-orange-600 to-orange-500` |
| High temp bar (5-day) | -- | `bg-orange-500` |
| Low temp bar (5-day) | -- | `bg-orange-300` |
| NOW indicator | -- | `bg-red-600` |

### Temperature has no standalone threshold-based colouring on the dashboard cards (always static red/blue for high/low). Threshold-based logic exists only in weather alerts (see Section 18).

### Unit Conversion
```
convertTemp(tempC, units):
  if units.temp === 'F': return tempC * 9/5 + 32
  return tempC
```

### Files
- `src/App.tsx` lines 919-936 (hero card)
- `src/utils/units.ts` (conversion)
- `src/components/HourlyForecast.tsx` line 478
- `src/components/WeatherForecastGraph.tsx` lines 113, 360, 368

---

## 7. Frost Risk

### Thresholds (Minimum Temperature)

| Min Temp (C) | Level | Used In |
|-------------|-------|---------|
| <= 0 | Hard Frost Alert | weatherAlerts (warning severity) |
| 0 - 2 | Frost Alert | weatherAlerts (warning severity) |
| <= 2 | Frost Risk | App.tsx frostRisk flag |
| 2 - 4 | Near-Frost Warning | weatherAlerts (caution severity) |
| <= 4 | Frost Warning | App.tsx frostWarning flag |
| 4 - 6 (+ morning < 6) | Cold Morning | weatherAlerts (caution severity) |

### Alert Banner Styling

| Level | Background | Border | Icon | Title Text | Message Text |
|-------|------------|--------|------|------------|-------------|
| Frost Risk (<=2) | `bg-blue-950/80` | `border-blue-400/50` | `text-blue-300 animate-pulse` | `text-blue-200` "FROST RISK" | "Protect sensitive crops immediately." |
| Frost Warning (<=4) | `bg-blue-950/50` | `border-blue-500/30` | `text-blue-400` | `text-blue-300` "FROST WARNING" | "Monitor crops overnight." |

### Frost Indicator Card

| Level | Background | Border | Icon | Text |
|-------|------------|--------|------|------|
| Frost Risk | `bg-blue-950/80` | `border-blue-400/50` | `text-blue-300` | `text-blue-200` "Min {temp} -- frost risk. Protect crops." |
| Frost Warning | `bg-blue-950/60` | `border-blue-500/30` | `text-blue-400` | `text-blue-300` "Min {temp} -- monitor overnight." |
| No Frost | `bg-slate-900/50` | `border-slate-700/40` | `text-slate-500` | `text-slate-500` "Min {temp} -- no frost risk tonight." |

### Active Alert
- Threshold: frostWarning (min temp <= 4C)
- Dot: `bg-blue-300`
- Text: `text-blue-200`
- Message: "Frost risk -- min {temp} overnight"

### Files
- `src/App.tsx` lines 756-757 (threshold flags)
- `src/App.tsx` lines 889-902 (alert banner)
- `src/App.tsx` lines 1086-1090 (active alert)
- `src/App.tsx` lines 1108-1122 (frost indicator card)
- `src/utils/weatherAlerts.ts` lines 206-246

---

## 8. UV Index

### Thresholds & Labels

| Range | Label | Tailwind Colour | HEX |
|-------|-------|-----------------|-----|
| 0 - 2 | Low | `text-green-400` | #4ade80 |
| 3 - 5 | Moderate | `text-yellow-400` | #facc15 |
| 6 - 7 | High | `text-orange-400` | #fb923c |
| 8 - 10 | Very High | `text-red-400` | #f87171 |
| 11+ | Extreme | `text-red-600` | #dc2626 |

### Actionable Recommendations UV Thresholds

| Range | Status | Label |
|-------|--------|-------|
| >= 11 | risk | "Extreme UV -- full protection required" |
| 6 - 10 | caution | "Very High/High UV" |
| 3 - 5 | good | "Some sun protection advised" |
| < 3 | good | "Low UV risk" |

### Display
- Shown in hero card mini-stat row
- Format: "{rounded_index} {label}"
- Text colour matches threshold above

### Files
- `src/App.tsx` lines 740-747 (getUVLevel function)
- `src/App.tsx` lines 938-940 (display)
- `src/components/ActionableRecommendations.tsx` lines 193-202

---

## 9. Humidity

### Display (No threshold-based colouring)

| Element | Colour |
|---------|--------|
| Card icon | `text-cyan-400` #22d3ee |
| Card value | `text-cyan-400` #22d3ee |
| Card badge | `bg-slate-700/40 text-slate-400 border-slate-600/40` (static) |
| 5-day forecast | `text-slate-300` (static) |

### Dew Point Formula
```
dewPointC = tempC - ((100 - humidity) / 5)
```

### Humidity Used in Other Calculations
- Delta T formula (core input)
- Irrigation: humidity < 40% triggers higher irrigation
- Planting score: 40-70% humidity adds +1 to score
- Disease pressure: humidity > 75% is a trigger condition
- Livestock heat stress: humidity > 70% combined with temp > 28C

### Files
- `src/App.tsx` lines 1177-1189 (humidity card)

---

## 10. ETo (Evapotranspiration)

### Formula (Hargreaves-Samani Simplified)
```
eto = (0.0023 * (tempC + 17.8) * sqrt(abs(highTemp - lowTemp)) * (uvIndex * 2.5 + 5)) / 24
```
Result in mm/day, displayed to 1 decimal place.

### Display (No threshold-based colouring)

| Element | Colour |
|---------|--------|
| Card icon | `text-emerald-400` #34d399 |
| Card value | `text-emerald-400` #34d399 |
| Card badge | `bg-emerald-900/30 text-emerald-300 border-emerald-500/30` (static) |

### Email ETo Thresholds (send-daily-forecast)

| Condition | Effect |
|-----------|--------|
| temp > 25 AND humidity < 60 | Flagged as high evapotranspiration, triggers irrigation recommendation |

### Notes
- ETo does NOT have threshold-based colour changes on the dashboard
- ETo is used as an input for irrigation recommendations in email reports
- The web UI shows a static emerald colour regardless of value

### Files
- `src/App.tsx` lines 1192-1205 (ETo card)
- `supabase/functions/send-daily-forecast/index.ts` lines 1418-1440

---

## 11. GDD (Growing Degree Days)

### Formula
```
gdd = max(0, ((highTemp + lowTemp) / 2) - baseTemp)
baseTemp = 10 (degrees C)
```

### Display (No threshold-based colouring)

| Element | Colour |
|---------|--------|
| Value text | `text-green-300` #86efac |
| Sparkline | Uses green sparkline component |

### Notes
- GDD does NOT have threshold-based colour changes
- Displayed as a mini-stat in the hero card with a sparkline showing trend
- Base temperature of 10C is hardcoded (standard agronomic base)

### Files
- `src/App.tsx` lines 1012-1024 (GDD display)

---

## 12. Soil Temperature

### Web Dashboard Display

| Source | Colour | Opacity | Label |
|--------|--------|---------|-------|
| Live probe | `text-amber-300` #fcd34d | 100% | "live probe" in `text-green-400` |
| Estimated | `text-amber-300/70` #fcd34d at 70% | 70% | "estimated" or "connect probe" |

### Estimation Formula
```
soilTempC = tempC - 3 + (rainfall > 0 ? -1 : 0)
```

### Email Report Thresholds (send-daily-forecast)

| Range (C) | Label | HEX Colour |
|-----------|-------|------------|
| < 10 | Cold | #3b82f6 |
| 10 - 15 | Cool | #10b981 |
| 15 - 25 | Optimal | #059669 |
| 25 - 30 | Warm | #f59e0b |
| > 30 | Hot | #dc2626 |

### Email Soil Temperature Estimation
```
soilTempEst = Math.round((maxTemp * 0.6 + minTemp * 0.4) * 0.85)
```

### Notes
- Web dashboard uses static amber colour (no threshold colouring)
- Email reports use threshold-based colouring (5-tier system)
- Probe data always overrides estimated values when available
- Two different estimation formulas exist: web (simple) vs email (weighted)

### Files
- `src/App.tsx` lines 950-972 (soil temp display)
- `supabase/functions/send-daily-forecast/index.ts` lines 671-683

---

## 13. Soil Moisture

### Web Dashboard Display (Estimated)

| Source | Colour | Label |
|--------|--------|-------|
| Live probe | `text-cyan-300` #67e8f9 | "live probe" in `text-green-400` |
| Estimated | `text-cyan-300/70` at 70% opacity | "estimated" or "connect probe" |

### Estimation Formula (App.tsx)
```
moisturePct = min(100, max(0, 40 + (rainChance * 0.4) - (tempC - 15) * 0.8))
```

### Probe Data Thresholds (ProbeDataCard.tsx)

| Range (%) | Label | Background | Border | Text | Accent |
|-----------|-------|------------|--------|------|--------|
| null | Unknown | `bg-slate-800/60` | `border-slate-700/50` | `text-slate-400` | `text-slate-400` |
| < 15 | Very Dry | `bg-red-900/30` | `border-red-700/40` | `text-red-300` | `text-red-400` |
| 15 - 25 | Dry | `bg-yellow-900/30` | `border-yellow-700/40` | `text-yellow-300` | `text-yellow-400` |
| 25 - 40 | Ideal | `bg-green-900/30` | `border-green-700/40` | `text-green-300` | `text-green-400` |
| 40 - 55 | Moist | `bg-blue-900/30` | `border-blue-700/40` | `text-blue-300` | `text-blue-400` |
| > 55 | Saturated | `bg-cyan-900/30` | `border-cyan-700/40` | `text-cyan-300` | `text-cyan-400` |

### Email Report Thresholds (send-daily-forecast)

| Range (%) | Label | Icon | HEX Colour | HEX Background |
|-----------|-------|------|------------|----------------|
| < 15 | Very Dry | red circle | #dc2626 | #fee2e2 |
| 15 - 25 | Dry | yellow circle | #f59e0b | #fef3c7 |
| 25 - 40 | Ideal | green circle | #059669 | #d1fae5 |
| 40 - 55 | Moist | blue circle | #3b82f6 | #dbeafe |
| > 55 | Saturated | droplet | #6366f1 | #e0e7ff |

### Weekly Probe Report Thresholds (send-weekly-probe-report)

| Range (%) | Label | HEX Colour |
|-----------|-------|------------|
| < 30 | Very Dry - Irrigation Recommended | #D32F2F |
| 30 - 40 | Dry - Monitor Closely | #F57C00 |
| 40 - 60 | Optimal Moisture Range | #2E7D32 |
| 60 - 70 | Moist - Good Conditions | #1565C0 |
| > 70 | Very Wet - Check Drainage | #0277BD |

### INCONSISTENCY NOTE
Three different threshold scales exist for soil moisture:
1. **ProbeDataCard** (web): 15/25/40/55 breakpoints
2. **Daily Email**: 15/25/40/55 breakpoints (matches web)
3. **Weekly Probe Report**: 30/40/60/70 breakpoints (DIFFERENT)

The weekly probe report uses wider "optimal" range (40-60%) and different breakpoints. This should be unified.

### Files
- `src/App.tsx` lines 973-1011 (estimated moisture)
- `src/components/ProbeDataCard.tsx` lines 132-141 (getMoistureStatus)
- `supabase/functions/send-daily-forecast/index.ts` lines 657-669
- `supabase/functions/send-weekly-probe-report/index.ts` lines 316-330

---

## 14. Battery Level (Probe)

### Thresholds

| Range (mV) | Label | Background | Border | Text | Status Colour |
|-----------|-------|------------|--------|------|---------------|
| null | Unknown | `bg-slate-800/60` | `border-slate-700/50` | `text-slate-400` | `text-slate-400` |
| >= 3000 | Healthy | `bg-green-900/30` | `border-green-700/40` | `text-green-300` | `text-green-400` |
| 2500 - 3000 | Monitor | `bg-yellow-900/30` | `border-yellow-700/40` | `text-yellow-300` | `text-yellow-400` |
| < 2500 | Replace | `bg-red-900/30` | `border-red-700/40` | `text-red-300` | `text-red-400` |

### Files
- `src/components/ProbeDataCard.tsx` lines 143-150 (getBatteryStatus)

---

## 15. Farm Recommendations - Planting

### Scoring System (farmingRecommendations.ts)

| Factor | Condition | Score |
|--------|-----------|-------|
| Temperature | 15-28 C | +3 |
| Temperature | 10-32 C (not ideal) | +1 |
| Rainfall | < 2mm | +2 |
| Rainfall | 2-5mm | +1 |
| Next day weather | < 10mm rain | +2 |
| Wind | < 20 km/h | +1 |
| Humidity | 40-70% | +1 |

### Rating Thresholds

| Score | Rating |
|-------|--------|
| >= 7 | Excellent |
| >= 5 | Good |
| >= 3 | Fair |
| < 3 | (not explicitly rated) |

### Planting Day Card Colours (App.tsx)

| Rating | Background | Border | Badge |
|--------|------------|--------|-------|
| Excellent | `bg-green-950/60` | `border-green-600/30` | `bg-green-600` white text |
| Good | `bg-emerald-950/60` | `border-emerald-600/30` | `bg-emerald-600` white text |
| Fair | `bg-lime-950/60` | `border-lime-600/30` | `bg-lime-600` white text |

### Email Planting Thresholds (send-daily-forecast)

| Rating | Icon | HEX Colour | Conditions |
|--------|------|------------|------------|
| Avoid | X | #dc2626 | Rain >10mm OR chance >70%, wind >30, temp >38 OR <2 |
| Excellent | check | #16a34a | Temp 20-28, min 8-32, rain <5mm, wind <20 |
| Good | check | #4ade80 | Temp 15-32, min 5-28, rain <8mm, wind <25 |
| Marginal | warning | #f59e0b | Everything else |

### Files
- `src/utils/farmingRecommendations.ts` lines 26-90
- `src/App.tsx` lines 1502-1512 (card colours)
- `supabase/functions/send-daily-forecast/index.ts` lines 828-847

---

## 16. Farm Recommendations - Irrigation

### Web Thresholds (farmingRecommendations.ts)

| Condition | Level | Recommendation |
|-----------|-------|---------------|
| Rain >= 10mm | None | "Heavy rain expected - no irrigation needed" |
| Rain 5-10mm | Low | "Moderate rain expected - minimal irrigation if needed" |
| Rain 2-5mm | Medium | "Light rain expected - reduce to 2-3 mm if needed" |
| No rain + (temp >28 OR humidity <40%) | High | "Recommended: 6-8 mm irrigation tonight" |
| No rain + temp 25-28 | Medium | "Recommended: 4-6 mm irrigation tonight" |
| No rain + temp <25 | Low | "Recommended: 2-4 mm if soil appears dry" |

### Irrigation Card Colours (App.tsx)

| Level | Background | Border | Badge Colour |
|-------|------------|--------|--------------|
| High | `bg-red-950/60` | `border-red-600/30` | `bg-red-600` |
| Medium | `bg-yellow-950/60` | `border-yellow-600/30` | `bg-yellow-600` |
| Low | `bg-blue-950/60` | `border-blue-600/30` | `bg-blue-600` |
| None | `bg-slate-800/60` | `border-slate-600/30` | `bg-slate-600` |

### Email Irrigation Thresholds (send-daily-forecast)

| Condition | Advice | Badge HEX |
|-----------|--------|-----------|
| Rain >=10mm OR chance >=70% | Skip irrigation | #475569 |
| Rain 5-10mm OR chance 50-70% | Reduce 5-10mm | #d97706 |
| Max temp >= 35 C | Irrigate 25-35mm | #dc2626 |
| Max 28-35 + min >=15 | Irrigate 15-20mm | #1d4ed8 |
| Max 20-28 C | Consider 10-15mm | #d97706 |
| Otherwise | Optional 5-10mm | #475569 |

### Farm Summary Irrigation Status

| Condition | Label | Status |
|-----------|-------|--------|
| Rain >= 10mm | "{rain} rain -- skip irrigation" | ok (green) |
| Rain 3-10mm | "Light irrigation only" | info (sky) |
| Rain < 3mm | "Irrigation may be needed" | info (sky) |

### Files
- `src/utils/farmingRecommendations.ts` lines 92-134
- `src/App.tsx` lines 1538-1554 (card colours)
- `src/App.tsx` lines 1255-1261 (farm summary)
- `supabase/functions/send-daily-forecast/index.ts` lines 809-826

---

## 17. Farm Recommendations - Actionable

### Category Thresholds (ActionableRecommendations.tsx)

#### Spray Operations

| Condition | Status | Label |
|-----------|--------|-------|
| Gust > 40 km/h | risk | "Dangerous wind gusts" |
| Gust 25-40 km/h | caution | "Moderate gusts" |
| Rain > 70% AND >= 10mm | risk | "Heavy rain expected" |
| Rain > 70% OR >= 15mm | risk | "Rain likely" |
| Delta T = Excellent | good | "Ideal spray conditions" |
| Otherwise | caution | "Check conditions" |

#### Irrigation

| Condition | Status | Label |
|-----------|--------|-------|
| Rain forecast >= 20mm | good | "Hold off irrigation" |
| Rain forecast 5-20mm | caution | "Minimal irrigation" |
| Temp > 28 C | caution | "Irrigate in the evening" |
| Otherwise | good | "Normal schedule" |

#### Livestock

| Condition | Status | Label |
|-----------|--------|-------|
| Heavy rain forecast | caution | "Move to shelter" |
| Apparent temp > 32 OR (>28 AND humidity >70%) | caution | "Heat stress risk" |
| Otherwise | good | "Normal conditions" |

#### Cropping

| Condition | Status | Label |
|-----------|--------|-------|
| Heavy rain + dangerous gust | risk | "Severe weather" |
| Heavy rain only | caution | "Prepare for rain" |
| Dangerous or moderate gust | caution | "Wind damage risk" |
| Otherwise | good | "Normal conditions" |

### Status Colours

| Status | Dot | Border | Background | Label Text | Icon |
|--------|-----|--------|------------|------------|------|
| good | `bg-green-400` | `border-green-500/20` | `bg-green-500/5` | `text-green-300` | `text-green-400` |
| caution | `bg-amber-400` | `border-amber-500/20` | `bg-amber-500/5` | `text-amber-200` | `text-amber-400` |
| risk | `bg-red-400` | `border-red-500/20` | `bg-red-500/5` | `text-red-200` | `text-red-400` |

### Header Badge

| State | Colour | Text |
|-------|--------|------|
| Has risk items | `text-red-400 border-red-500/30` | "Action Required" |
| Has caution (no risk) | `text-amber-400 border-amber-500/30` | "Caution Advised" |
| All clear | `text-green-400 border-green-500/30` | "All Clear" |

### Files
- `src/components/ActionableRecommendations.tsx` lines 60-296

---

## 18. Weather Alerts

### Alert Severity System

| Severity | Purpose |
|----------|---------|
| warning | Urgent, critical conditions requiring action |
| caution | Moderate conditions, monitor closely |
| info | Informational, conditions detected |
| safe | All clear, favorable conditions |

### Alert Trigger Thresholds (weatherAlerts.ts)

#### Rain Alerts

| Condition | Alert Title | Severity |
|-----------|-------------|----------|
| Next 30 min with pop > 0.5 | "Rain Starting Soon" | warning |
| Total 24h rain > 40mm | "Heavy Rain Alert" | warning |
| Total 24h rain 10-40mm | "Rain Alert" | caution |
| Total 24h rain 0-10mm | "Light Rain Possible" | info |
| No actual rain but pop > 0.6 | "Rain Possible" | info |

#### Wind Alerts

| Condition | Alert Title | Severity |
|-----------|-------------|----------|
| > 25 km/h | "Strong Wind Alert" | warning |
| 15-25 km/h | "Moderate Wind" | caution |

#### Temperature Alerts

| Condition | Alert Title | Severity |
|-----------|-------------|----------|
| Min temp <= 0 C | "Hard Frost Alert" | warning |
| Min temp 0-2 C | "Frost Alert" | warning |
| Min temp 2-4 C | "Near-Frost Warning" | caution |
| Min temp 4-6 C + morning < 6 | "Cold Morning" | caution |
| Max temp > 33 C | "Heat Wave Alert" | warning |
| Max temp 30-33 C | "Heat Alert" | caution |

#### Special Alerts

| Condition | Alert Title | Severity |
|-----------|-------------|----------|
| Hail detected | Hail alert | warning |
| Storm/Thunder detected | Storm alert | warning |
| Avg temp 14-26 + humidity >75% for 3+ days | "High Disease Pressure Alert" | warning |
| 7+ days with min temp >= 15 C | "Sheep Graziers Alert" | caution |
| Wind >= 15 + rain | Wind + rain combo | warning |
| 3+ hours: wind 3-15, no rain, temp 10-28 | "Best Spray Window" | info |
| No alerts | "Conditions Favorable" | safe |

### Alert Banner Colours (AlertBanner.tsx)

| Severity | Background | Border | Left Border | Title Text | Message Text |
|----------|------------|--------|-------------|------------|-------------|
| safe | `bg-green-100` | `border-green-400` | `border-l-green-700` | `text-green-900` | `text-green-700` |
| info | `bg-blue-100` | `border-blue-400` | `border-l-blue-700` | `text-blue-900` | `text-blue-700` |
| caution | `bg-yellow-100` | `border-yellow-400` | `border-l-yellow-700` | `text-yellow-900` | `text-yellow-700` |
| warning | `bg-red-100` | `border-red-400` | `border-l-red-700` | `text-red-900` | `text-red-700` |

### Alert Button Colour (AlertBanner.tsx)

| Condition | Button Colour |
|-----------|--------------|
| Has warnings | `bg-red-600 hover:bg-red-700` |
| Has cautions | `bg-yellow-600 hover:bg-yellow-700` |
| Default | `bg-green-600 hover:bg-green-700` |

### Notification Center Alert Colours (NotificationCenter.tsx)

| Severity | Background | Border | Icon | Title | Message |
|----------|------------|--------|------|-------|---------|
| safe | `bg-green-950/40` | `border-green-500/40` | `text-green-400` | `text-green-300` | `text-green-80` |
| info | `bg-blue-950/40` | `border-blue-500/40` | `text-blue-400` | `text-blue-300` | `text-blue-80` |
| caution | `bg-yellow-950/40` | `border-yellow-500/40` | `text-yellow-400` | `text-yellow-300` | `text-yellow-80` |
| warning | `bg-red-950/40` | `border-red-500/40` | `text-red-400` | `text-red-300` | `text-red-80` |

### Files
- `src/utils/weatherAlerts.ts` (all alert logic)
- `src/components/AlertBanner.tsx` lines 48-102
- `src/components/NotificationCenter.tsx` lines 115-138

---

## 19. Rain Radar

### Rain Intensity Legend

| Label | HEX Colour |
|-------|------------|
| Light | #5CE1E6 (cyan) |
| Moderate | #1CF51C (bright green) |
| Heavy | #FFFF00 (yellow) |
| Very Heavy | #FF8C00 (orange) |

### Location Marker
- Colour: #ef4444 (red)
- Size: 20px circle
- Border: white

### Radar Layer
- Latest frame opacity: 0.6
- Non-current frames: 0

### Files
- `src/components/RainRadar.tsx` lines 97, 109-116, 263-281

---

## 20. Weather Background Gradients

### Tailwind Gradient Classes by Condition

| Condition | Night | Day |
|-----------|-------|-----|
| Thunder/Storm | `from-gray-900 via-slate-800 to-gray-950` | `from-gray-800 via-slate-700 to-gray-900` |
| Rain/Shower/Drizzle | `from-slate-800 via-gray-700 to-slate-900` | `from-slate-600 via-gray-500 to-slate-600` |
| Mist/Fog/Haze | `from-gray-700 via-slate-600 to-gray-800` | `from-gray-400 via-slate-300 to-gray-400` |
| Cloud/Overcast | `from-slate-700 via-gray-600 to-slate-800` | `from-gray-400 via-gray-300 to-gray-500` |
| Clear (Night) | `from-blue-950 via-indigo-900 to-slate-900` | -- |
| Clear (Day) | -- | `from-amber-300 via-yellow-200 to-sky-400` |

### Text Colours by Condition

| Condition | Colour |
|-----------|--------|
| Night, Thunder, Storm, Rain | `text-white` |
| Mist/Fog (night) | `text-white` |
| Mist/Fog (day) | `text-gray-800` |
| All other day conditions | `text-gray-800` |

### Files
- `src/utils/weatherEffects.ts` lines 9-55

---

## 21. Weather Icon Colours

| Condition | Tailwind Colour |
|-----------|----------------|
| Thunder/Storm | `text-yellow-400` |
| Rain/Shower | `text-blue-400` |
| Drizzle | `text-blue-300` |
| Cloud/Overcast | `text-slate-300` |
| Clear/Sun | `text-amber-400` |

### Files
- `src/App.tsx` lines 463-479

---

## 22. Farm Summary Status System

### Three Status Types

| Status | Text | Icon | Box Background | Box Border |
|--------|------|------|---------------|------------|
| ok | `text-green-300` | `text-green-400` | `bg-green-500/20` | `border-green-500/25` |
| warn | `text-amber-300` | `text-amber-400` | `bg-amber-500/20` | `border-amber-500/25` |
| info | `text-sky-300` | `text-sky-400` | `bg-sky-500/20` | `border-sky-500/25` |

### Summary Items & Their Logic

| Item | Condition | Status | Label |
|------|-----------|--------|-------|
| Spray | Window after noon | ok | "Spray after {time}" |
| Spray | Window exists | ok | "Spray window {start}-{end}" |
| Spray | No window | warn | "No spray window today" |
| Irrigation | Rain >= 10mm | ok | "{rain} rain -- skip irrigation" |
| Irrigation | Rain 3-10mm | info | "Light irrigation only" |
| Irrigation | Rain < 3mm | info | "Irrigation may be needed" |
| Tonight | Rain >= 5mm | warn | "Heavy rain tonight ({rain})" |
| Tonight | 60% chance rain | info | "Rain possible tonight" |
| Tonight | Dry | ok | "Dry evening forecast" |
| Wind | Current >20 AND afternoon easing | ok | "Wind easing late afternoon" |
| Wind | Current > 25 | warn | "Strong winds" |

### Files
- `src/App.tsx` lines 1247-1297

---

## 23. Notification System

### Bell Icon Colours

| Condition | Colour |
|-----------|--------|
| Has warnings | `text-red-400` |
| Has cautions | `text-yellow-400` |
| Has unread/alerts | `text-blue-400` |
| Default | `text-slate-400` |

### Badge Colours

| Condition | Colour |
|-----------|--------|
| Has warnings | `bg-red-500` |
| Has cautions | `bg-yellow-500` |
| Has unread/alerts | `bg-blue-500` |

### Notification Type Borders

| Type | Border |
|------|--------|
| Alert | `border-red-500/60` |
| Update | `border-blue-500/60` |
| Default | `border-slate-600/60` |

### Files
- `src/components/NotificationCenter.tsx` lines 149-166

---

## 24. Forecast Confidence

### Thresholds

| Rain Chance | Label | Dot Colour | Text Colour |
|-------------|-------|------------|-------------|
| > 60% | High | `bg-green-400` | `text-green-300` |
| 30 - 60% | Moderate | `bg-amber-400` | `text-amber-300` |
| < 30% | High (default) | `bg-green-400` | `text-green-300` |

### Files
- `src/App.tsx` lines 1333-1335

---

## 25. Email Report Colours

### Daily Forecast Email (send-daily-forecast)

| Element | HEX |
|---------|-----|
| Body background | #1e293b |
| Header gradient start | #0f172a |
| Header gradient end | #1e293b |
| Card background | #0f172a |
| Logo gradient | #16a34a to #15803d |
| Brand accent | #4ade80 |
| Stat values | #f1f5f9 |
| High temp value | #fca5a5 |
| Low temp value | #93c5fd |
| Rain value | #7dd3fc |
| Wind value | #86efac |
| Rain card border | #1d4ed8 |
| Rain card text | #60a5fa |
| Forecast table header BG | #0f172a |
| Forecast table header text | #4ade80 |
| Table row (odd) | #1e293b |
| Table row (even) | #172033 |
| Footer background | #0a0f1a |

### Weekly Probe Report Email (send-weekly-probe-report)

| Element | HEX |
|---------|-----|
| Header gradient | #166534 to #14532d |
| Container background | #f9fafb |
| Card background | white |
| Probe section left border | #059669 |
| Moisture bar fill | matches moisture tier colour |
| Moisture bar background | #e5e7eb |
| AI analysis box gradient | #dbeafe to #bfdbfe |
| AI analysis border | #2563eb |
| AI analysis title | #1e40af |
| Tip box background | #ecfdf5 |
| Tip box border | #a7f3d0 |
| Tip box text | #065f46 |
| Footer background | #1f2937 |
| Footer text | #9ca3af |
| Links | #60a5fa |
| Change arrow (increase) | #1565C0 |
| Change arrow (decrease) | #D32F2F |
| Change arrow (flat) | #6b7280 |

### Welcome Email (send-welcome-email)

| Element | HEX |
|---------|-----|
| Body gradient | #e0f2fe to #f0fdf4 |
| Container background | white |
| Header gradient | #059669 to #047857 |
| Feature box gradient | #f0fdf4 to #dcfce7 |
| Feature box border | #059669 |
| Subscription box gradient | #dbeafe to #bfdbfe |
| Subscription box border | #2563eb |
| Location box gradient | #fef3c7 to #fde68a |
| Location box border | #f59e0b |
| CTA button gradient | #059669 to #047857 |
| Footer gradient | #f3f4f6 to #e5e7eb |
| Footer link colour | #059669 |

### Files
- `supabase/functions/send-daily-forecast/index.ts`
- `supabase/functions/send-weekly-probe-report/index.ts`
- `supabase/functions/send-welcome-email/index.ts`

---

## 26. Agronomy Database (WHP)

### WHP Day Colours (ChemicalCard.tsx)

| Days | Tailwind Colour | Meaning |
|------|-----------------|---------|
| 0 / Nil | `text-green-400` | No withholding period |
| 1 - 7 | `text-amber-300` | Short WHP |
| 8 - 14 | `text-amber-400` | Medium WHP |
| > 14 | `text-orange-400` | Long WHP |

### Registration Status

| Status | Display | Colour |
|--------|---------|--------|
| Registered | WHP days shown | See day colours above |
| Not Registered | "N/R" badge | `text-red-400 bg-red-500/20 border-red-500/30` |

### Files
- `src/components/agronomy/ChemicalCard.tsx`

---

## 27. Field Notes

### Activity Type Colours

| Type | Icon Colour | Icon |
|------|-------------|------|
| Spray Event | `text-blue-300` | Wind |
| Fertiliser | `text-green-300` | Droplets |
| Planting | `text-emerald-300` | Sprout |
| Chemical/Pest | `text-amber-300` | Flask |
| Observation | `text-slate-300` | Clipboard |

### Selected State

| State | Border | Background | Text | Icon |
|-------|--------|------------|------|------|
| Selected | `border-green-500/50` | `bg-green-500/10` | `text-green-200` | `text-green-400` |
| Unselected | `border-slate-600/40` | `bg-slate-800/50` | `text-slate-400` | inherits type colour |

### Files
- `src/components/FieldNotes.tsx` lines 20-24, 109-112

---

## 28. Inconsistencies & Notes

### 1. Soil Moisture Threshold Mismatch
- **Web (ProbeDataCard) + Daily Email**: 15 / 25 / 40 / 55 breakpoints
- **Weekly Probe Report**: 30 / 40 / 60 / 70 breakpoints
- **Recommendation**: Unify to the 15/25/40/55 scale used in web + daily email

### 2. Soil Moisture Colour Mismatch
- **Web ProbeDataCard "Saturated"**: `text-cyan-300` / cyan theme
- **Daily Email "Saturated"**: #6366f1 (indigo/purple -- violates no-purple rule)
- **Recommendation**: Change email saturated colour to cyan (#06b6d4) to match web

### 3. Soil Temperature Estimation Formula Inconsistency
- **Web (App.tsx)**: `soilTemp = airTemp - 3 + (rainfall > 0 ? -1 : 0)`
- **Email (send-daily-forecast)**: `soilTemp = round((maxTemp * 0.6 + minTemp * 0.4) * 0.85)`
- **Recommendation**: Use the email formula everywhere (more accurate weighted approach)

### 4. Delta T Function Colours vs Card Colours
- **getDeltaTCondition()** returns light-theme colours: `text-red-700`, `bg-red-100`
- **getDeltaTCardColors()** returns dark-theme colours: `border-red-500/40`, `bg-red-500/10`
- These are intentionally different (light vs dark theme contexts) but could confuse mobile devs
- **Recommendation**: Document clearly which function is for which context

### 5. Spray Condition Wind Threshold Consistency
All spray-related utilities consistently use 15 and 25 km/h thresholds (good).

### 6. Hardcoded vs Centralised Thresholds
- **Centralised**: Delta T thresholds (in `deltaT.ts`), spray conditions (in `deltaT.ts`), weather alerts (in `weatherAlerts.ts`), farming recommendations (in `farmingRecommendations.ts`)
- **Hardcoded inline**: UV thresholds (in App.tsx), wind colour thresholds (in App.tsx), rain chance thresholds (in App.tsx), frost thresholds (in App.tsx), all email thresholds (duplicated in edge functions)
- **Recommendation**: Extract UV, wind, rain, and frost thresholds into shared utility files

### 7. Email Functions Duplicate Logic
- `send-daily-forecast` re-implements Delta T, spray condition, moisture, and soil temp logic that already exists in utility files. This is unavoidable because edge functions cannot import from `src/utils/`, but the thresholds should be kept in sync manually.

### 8. ETo and GDD Have No Threshold Colouring
- Both metrics display with static colours (emerald-400 for ETo, green-300 for GDD)
- No good/warning/poor thresholds exist for these metrics
- Consider adding threshold-based colouring for mobile (e.g., ETo > 6mm/day = high evaporation warning)

### 9. Humidity Has No Standalone Thresholds
- Humidity is displayed with static cyan-400 colour
- It is used as input for other calculations (Delta T, irrigation, disease pressure) but has no direct threshold display
- Consider adding thresholds for mobile (e.g., < 30% = Very Dry, 30-50% = Low, 50-75% = Normal, > 75% = High)

### 10. Forecast Confidence Logic
- Low rain chance (< 30%) maps to "High" confidence, which is counterintuitive but correct (clear skies are high confidence forecasts)

---

## 29. Master Summary Table

| # | Metric | Thresholds | Green | Amber/Yellow | Red | Blue/Cyan | Static Colour | Formula | Files |
|---|--------|-----------|-------|-------------|-----|-----------|--------------|---------|-------|
| 1 | Wind Speed | <15 / 15-25 / >25 km/h | CALM | MODERATE | HIGH | -- | -- | speed * 3.6 | App.tsx, deltaT.ts |
| 2 | Delta T | <2 / 2-4 / 4-6 / 6-8 / >8 C | Excellent (4-6) | Okay (2-4, 6-8) | Poor (<2, >8) | -- | -- | Stull wet-bulb | deltaT.ts |
| 3 | Spray Window | Good/Moderate/None | Good | Moderate | None | -- | -- | composite | sprayWindow.ts |
| 4 | Rain Chance | <40 / 40-70 / >70 % | -- | -- | -- | LIKELY (>70) / POSSIBLE (40-70) | LOW (<40) slate | -- | App.tsx |
| 5 | High Temp | none | -- | -- | -- | -- | text-red-400 | convertTemp() | App.tsx |
| 6 | Low Temp | none | -- | -- | -- | -- | text-blue-400 | convertTemp() | App.tsx |
| 7 | Frost Risk | <=0 / 0-2 / 2-4 / 4-6 C | -- | Near-Frost (2-4) | Hard Frost (<=0), Frost (0-2) | blue theme | -- | min temp check | App.tsx, weatherAlerts.ts |
| 8 | UV Index | 0-2 / 3-5 / 6-7 / 8-10 / 11+ | Low (0-2) | Moderate (3-5) | Very High (8-10), Extreme (11+) | -- | -- | from API | App.tsx |
| 9 | Humidity | none (standalone) | -- | -- | -- | -- | text-cyan-400 | from API | App.tsx |
| 10 | ETo | none | -- | -- | -- | -- | text-emerald-400 | Hargreaves | App.tsx |
| 11 | GDD | none | -- | -- | -- | -- | text-green-300 | (high+low)/2 - 10 | App.tsx |
| 12 | Soil Temp | <10/10-15/15-25/25-30/>30 (email only) | Optimal (15-25) | Warm (25-30) | Hot (>30) | Cold (<10), Cool (10-15) | text-amber-300 (web) | airTemp-3 (web) | App.tsx, daily email |
| 13 | Soil Moisture | <15/15-25/25-40/40-55/>55 (probe) | Ideal (25-40) | Dry (15-25) | Very Dry (<15) | Moist/Saturated | text-cyan-300 (est.) | est. formula | ProbeDataCard, emails |
| 14 | Battery | <2500/2500-3000/>=3000 mV | Healthy | Monitor | Replace | -- | -- | from probe | ProbeDataCard |
| 15 | Planting Score | <3/3-5/5-7/>=7 | Excellent/Good | Fair | -- | -- | -- | scoring system | farmingRec.ts |
| 16 | Irrigation | None/Low/Medium/High | -- | Medium (yellow) | High (red) | Low (blue) | None (slate) | rule-based | farmingRec.ts |
| 17 | Disease Pressure | 3+ days humid 14-26C | -- | -- | warning alert | -- | -- | 3-day rolling | weatherAlerts.ts |
| 18 | Heat | >33 / 30-33 C | -- | Heat (30-33) | Heat Wave (>33) | -- | -- | max temp | weatherAlerts.ts |
| 19 | Rain Intensity (Radar) | Light/Mod/Heavy/Very Heavy | Mod #1CF51C | Heavy #FFFF00 | -- | Light #5CE1E6 | V.Heavy #FF8C00 | from radar API | RainRadar.tsx |
| 20 | WHP Days | 0/1-7/8-14/>14 | Nil (0d) | Short/Medium | -- | -- | Long orange-400 | from DB | ChemicalCard.tsx |
| 21 | Forecast Confidence | <30/30-60/>60 % rain | High (<30, >60) | Moderate (30-60) | -- | -- | -- | rain chance | App.tsx |

---

*End of specification. For questions or clarification, reference the file paths and line numbers listed in each section.*
