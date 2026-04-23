# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run build          # Production build (always run before reporting a task done)
npm run typecheck      # TypeScript type checking without emitting
npm run lint           # ESLint
npm run dev            # Dev server (DO NOT start — handled automatically)
npm run mobile:sync    # Build web + sync to iOS/Android
```

## Stack

- **Frontend:** React 18 + TypeScript, Vite, Tailwind CSS, Lucide React
- **Backend:** Supabase (Auth, Postgres, Edge Functions running Deno)
- **Mobile:** Capacitor 8 (iOS + Android)
- **Payments:** Stripe subscriptions ($2.99/month)
- **External APIs:** OpenWeather 3.0 One Call (primary) / 2.5 fallback, Open-Meteo ERA5 climate API (no key needed)

## Architecture

### Single-page app — no router

`src/App.tsx` is the entire application. It manages 30+ state variables and renders all screens conditionally. There is no client-side routing. Modal overlays (auth, agronomy DB, Farmer Joe chat) are layered on top. The main content flow is: hero weather cards → metric cards → hourly/5-day forecast → probe data → rain radar → 30-day forecast → agronomy recommendations.

### Weather data flow

The frontend calls the Supabase edge function at `${VITE_SUPABASE_URL}/functions/v1/weather?lat=&lon=` with the anon key as Bearer token. The edge function (`supabase/functions/weather/index.ts`):

1. Fetches the OpenWeather API key from the `app_config` table (falls back to env vars)
2. In parallel, fetches OpenWeather One Call 3.0 (up to 8 real daily days) **and** Open-Meteo ERA5 climate normals (`EC_Earth3P_HR` model — this exact model name is required; wrong model names silently fail)
3. Returns a unified response: days 1–8 are `isReal: true` from OpenWeather; days 9–30 are `isReal: false, isHistorical: true` from ERA5 climate normals with a small sine jitter (`Math.sin(i * 2.7) * 0.8`) so days look varied

The ERA5 model returns genuinely varied historical averages (e.g., for Adelaide: temps 13–23°C, wind 6–32 km/h, actual rainfall events). Never replace this with guessed/extrapolated data from the last real forecast day — that produces flat, wrong values.

### Units system

`src/utils/units.ts` resolves regional units from country code (US → imperial, GB → hybrid, AU/default → metric). Units are stored in localStorage and passed as a `units` object to all child components. All numeric display goes through `convertTemp()`, `convertWind()`, `fmtWind()`, etc. — never hardcode °C or km/h in component renders.

### Subscription / trial gating

On user creation, a DB trigger sets `trial_end_date = now() + 30 days` on `profiles`. App checks: if `trial_end_date < now AND stripe_subscription_id IS NULL` → show paywall. `FarmerJoe` (AI chat) and the agronomy database are premium features. The `hasActiveSubscription` state in `App.tsx` controls access.

### Supabase patterns

- **Always use `mcp__supabase__apply_migration`** for DDL — never raw `execute_sql` for schema changes
- Every new table needs RLS enabled immediately; never use `USING (true)` policies
- Use `maybeSingle()` not `single()` when querying for zero-or-one rows
- The `app_config` table stores the OpenWeather API key; query it in edge functions before checking env vars
- 80+ migration files in `supabase/migrations/` — new migrations must be idempotent (`IF NOT EXISTS`, `DO $$ BEGIN ... END $$` blocks)

### Edge functions

- Deploy only via `mcp__supabase__deploy_edge_function` tool — never use Supabase CLI
- All edge functions wrap everything in try/catch, handle OPTIONS preflight, and include CORS headers on every response
- Import external packages with `npm:` prefix (e.g., `npm:@supabase/supabase-js@2.100.0`)
- Deno built-ins only — no `deno.land/x`, no `esm.sh`

### Mobile (Capacitor)

Platform-aware code lives in `src/utils/capacitor.ts`. Use `isNativePlatform()` before calling any Capacitor plugin. Geolocation, push notifications, haptics, status bar, and splash screen are all wired up. After any web changes that need to reach iOS/Android, run `npm run mobile:sync`.

### Design conventions

- Dark theme throughout: `bg-slate-900`, `bg-slate-800`, `text-slate-200/400`
- Green (`green-400/500/600`) is the primary accent — used for "good" states, CTAs, icons
- Blue (`blue-400`) for informational / historical data labels
- Red for alerts/poor conditions; yellow for warnings/moderate conditions
- 8px spacing system via Tailwind; responsive breakpoints: sm/md/lg/xl
- No purple or indigo — ever
