# FarmCast Deployment Guide - Full Backend Version

## Architecture

This version uses:
- **Supabase Edge Functions** to proxy OpenWeather API calls (keeps API key secure)
- **Supabase Database** for user authentication and probe API storage
- **Frontend** deployed as static site to Netlify

## Features

### Available to All Users
- Current weather conditions
- 5-day forecast
- Spray condition analysis
- Planting day recommendations
- Irrigation schedule
- Rain radar
- **30-day extended forecast** (predictive)

### Available to Signed-In Users
- Moisture probe API configuration
- Save probe API endpoints and keys
- View and manage multiple probe sources

## Setup Steps

### 1. Configure Supabase Secret

**IMPORTANT:** You need to add the OpenWeather API key as a Supabase secret:

1. Go to https://supabase.com/dashboard/project/excsmfzvsetoazvklowt/settings/functions
2. Click "Edge Functions" → "Manage secrets"
3. Add secret:
   - Name: `OPENWEATHER_API_KEY`
   - Value: `205a644e0f57ecf98260a957076e46db`
4. Click "Save"

### 2. Deploy Edge Functions

The weather edge function is already deployed:
- `weather` - Proxies OpenWeather API calls

Other existing functions:
- `moisture-probe` - Handles probe data
- `poll-probe-apis` - Polls external probe APIs
- `geocode` - Location search
- `ai-weather-explanation` - AI-powered explanations
- `make-admin` - Admin management

### 3. Build the Frontend

```bash
npm install
npm run build
```

### 4. Deploy to Netlify

#### Option A: Drag and Drop (Easiest)
1. Go to https://app.netlify.com/drop
2. Drag and drop the entire `dist/` folder
3. Done!

#### Option B: Netlify CLI
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

### 5. Configure Environment Variables

Set these in your `.env` file (already configured):

```
VITE_SUPABASE_URL=https://excsmfzvsetoazvklowt.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4Y3NtZnp2c2V0b2F6dmtsb3d0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NjIzNTcsImV4cCI6MjA5MDAzODM1N30.G-HJq_1OehnWc_LnSc1iW5cVxKSxaM8qASiSAiOigLQ
```

**Note:** These environment variables are baked into the build during `npm run build`. They don't need to be set in Netlify.

## Database Schema

The following tables are created:
- `profiles` - User profiles with trial/subscription info
- `saved_locations` - User's saved weather locations
- `probe_apis` - User's probe API configurations
- `probe_data` - Historical probe readings

All tables have Row Level Security (RLS) enabled.

## How It Works

1. **Frontend** (Netlify) → Makes request to Supabase Edge Function
2. **Edge Function** (Supabase) → Calls OpenWeather API with secure key
3. **Response** → Returns weather data to frontend
4. **Probe APIs** → Users configure their own probe endpoints, backend polls them

This architecture:
- Keeps API keys secure (never exposed to client)
- Scales automatically with Supabase Edge Functions
- No backend server to manage
- Static frontend deploys anywhere

## Updating the Site

1. Make your changes
2. Run `npm run build`
3. Redeploy the `dist/` folder to Netlify

## Edge Function Updates

If you modify edge functions:

```bash
# Deploy using the mcp__supabase__deploy_edge_function tool
# or manually if you have Supabase CLI:
supabase functions deploy weather
```

That's it!
