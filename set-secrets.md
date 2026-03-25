# Setting Up Edge Function Secrets

The OpenWeather API key needs to be added as a Supabase secret.

## Required Secret

Add this secret to your Supabase project:

```
OPENWEATHER_API_KEY=205a644e0f57ecf98260a957076e46db
```

## How to Add Secrets

### Option 1: Supabase Dashboard
1. Go to https://supabase.com/dashboard/project/excsmfzvsetoazvklowt/settings/functions
2. Click on "Edge Functions" → "Manage secrets"
3. Add the secret name: `OPENWEATHER_API_KEY`
4. Add the value: `205a644e0f57ecf98260a957076e46db`
5. Click "Save"

### Option 2: Supabase CLI
If you have the Supabase CLI installed and logged in:

```bash
supabase secrets set OPENWEATHER_API_KEY=205a644e0f57ecf98260a957076e46db
```

After adding the secret, the weather edge function will be able to access it.
