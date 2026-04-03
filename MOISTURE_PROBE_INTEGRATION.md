# Moisture Probe Integration System

## Overview

FarmCast now includes a comprehensive moisture probe integration system that allows users to connect their soil moisture probes (FieldClimate and other providers) to get real-time soil data alongside weather forecasts.

## Features

- **Secure Backend Integration**: All API credentials stored server-side, never exposed to frontend
- **Multiple Provider Support**: Built with adapter pattern to support different probe manufacturers
- **Automatic Sync**: Scheduled syncing every 30 minutes via cron job
- **Manual Refresh**: On-demand data sync with refresh button
- **Smart Data Normalization**: Intelligent sensor mapping and auto-detection
- **Real-time Updates**: Live data displayed on dashboard with WebSocket updates
- **Per-User Connections**: Each user can connect their own probes with their credentials
- **Error Handling**: Comprehensive logging and user-friendly error messages
- **Raw Data Debug View**: View raw API responses for troubleshooting sensor mappings

## Architecture

### Database Schema

#### `probe_connections` Table
Stores user probe connection details:
- `id`: Unique identifier
- `user_id`: Reference to auth.users
- `provider`: Probe provider (e.g., 'fieldclimate')
- `api_key`: Provider API key (server-side only)
- `api_secret`: Provider API secret (server-side only)
- `station_id`: Station/device identifier
- `device_id`: Optional device identifier
- `sensor_mapping`: JSON object for custom sensor mapping
- `is_active`: Connection status
- `last_sync_at`: Last successful sync timestamp
- `last_error`: Last error message (if any)
- `created_at`, `updated_at`: Timestamps

#### `probe_readings_latest` Table
Stores the most recent reading for each probe:
- `id`: Unique identifier
- `user_id`: Reference to auth.users
- `connection_id`: Reference to probe_connections
- `provider`: Provider name
- `station_id`: Station identifier
- `device_id`: Optional device identifier
- `moisture_percent`: Soil moisture percentage
- `soil_temp_c`: Soil temperature in Celsius
- `rainfall_mm`: Rainfall in millimeters
- `battery_level`: Battery level percentage
- `raw_payload`: Complete JSON response from API
- `measured_at`: When the data was measured
- `synced_at`: When the data was synced to database

### Backend Components

#### Edge Function: `sync-probe-data`
Location: `/supabase/functions/sync-probe-data/index.ts`

**Purpose**: Securely fetch and normalize probe data from provider APIs

**Endpoints**:
- `GET /sync-probe-data` - Sync all active connections for authenticated user
- `GET /sync-probe-data?connection_id=<id>` - Sync specific connection
- `GET /sync-probe-data?sync_all=true` - Sync all connections (cron job)

**Features**:
- Provider adapter pattern for extensibility
- FieldClimate API integration
- Intelligent sensor data normalization
- Auto-detection of moisture, temperature, rainfall sensors
- Custom sensor mapping support
- Error handling per connection
- Comprehensive logging

**Provider Adapters**:
- **FieldClimate**: Currently implemented
- **Future providers**: Easy to add using adapter pattern

### Frontend Components

#### `ProbeConnectionManager`
Location: `/src/components/ProbeConnectionManager.tsx`

**Purpose**: Manage probe connections and credentials

**Features**:
- Add new probe connections with form validation
- Test connection before saving
- Edit existing connections
- Delete connections
- View all connected probes
- See connection status and last sync time
- View error messages
- Manual sync button per connection
- Sync all connections button
- Raw API response viewer for debugging
- Secure credential entry with show/hide toggle

**Fields**:
- Provider selection (currently FieldClimate)
- Station ID (required)
- API Key (required, hidden by default)
- API Secret (required, hidden by default)
- Device ID (optional)
- Sensor Mapping (optional JSON)

#### `ProbeDataCard`
Location: `/src/components/ProbeDataCard.tsx`

**Purpose**: Display current probe readings on dashboard

**Features**:
- Live soil moisture percentage with color coding
- Soil temperature in Celsius and Fahrenheit
- Rainfall measurement
- Battery level indicator
- Last updated timestamp
- Manual refresh button
- Real-time updates via Supabase subscriptions
- Empty state with setup call-to-action

**Moisture Level Indicators**:
- Very Dry: < 20% (red)
- Dry: 20-40% (orange)
- Moderate: 40-60% (yellow)
- Moist: 60-80% (blue)
- Very Moist: > 80% (blue)

### Scheduled Sync

A cron job runs every 30 minutes to automatically sync all active probe connections:

```sql
-- Runs at: */30 * * * * (every 30 minutes)
SELECT cron.schedule(
  'probe-data-sync-job',
  '*/30 * * * *',
  $$ ... $$
);
```

## Setup Guide

### For FieldClimate Users

1. **Get Your API Credentials**:
   - Log in to your FieldClimate account
   - Navigate to Settings → API Access
   - Generate or copy your API Key and API Secret
   - Note your Station ID (found in your station list)

2. **Connect Your Probe in FarmCast**:
   - Sign in to FarmCast
   - Scroll to the "Moisture Probe Connections" section
   - Click "Add Probe"
   - Fill in the form:
     - **Provider**: Select "FieldClimate"
     - **Station ID**: Your station ID (e.g., "12345678")
     - **API Key**: Your FieldClimate API key
     - **API Secret**: Your FieldClimate API secret
     - **Device ID**: Leave empty (not required for FieldClimate)
     - **Sensor Mapping**: Leave empty to use auto-detection

3. **Test Connection**:
   - Click "Add Probe"
   - The system will test the connection immediately
   - If successful, you'll see your probe data appear
   - If failed, check your credentials and station ID

4. **View Your Data**:
   - The dashboard will show your latest readings
   - Data auto-refreshes every 30 minutes
   - Click refresh icon to sync manually

### Custom Sensor Mapping

If auto-detection doesn't work correctly, you can specify custom sensor mappings:

```json
{
  "moisture": "sm_1",
  "soil_temp": "st_1",
  "rainfall": "rain_1",
  "battery": "battery"
}
```

**To find your sensor codes**:
1. Connect your probe without sensor mapping
2. Click the "Settings" icon on your connection
3. View the raw API response
4. Find your sensor codes in the JSON
5. Update your connection with the correct mapping

### Example Raw Response Structure (FieldClimate)

```json
{
  "date_time": "2026-04-03T10:30:00Z",
  "data": {
    "sm_1": {
      "name": "Soil Moisture 1",
      "values": [
        { "value": 45.2, "time": "2026-04-03T10:30:00Z" }
      ]
    },
    "st_1": {
      "name": "Soil Temperature 1",
      "values": [
        { "value": 18.5, "time": "2026-04-03T10:30:00Z" }
      ]
    }
  }
}
```

## Security Features

1. **Server-Side Credentials**: API keys and secrets never sent to frontend
2. **Row Level Security**: Users can only access their own connections and readings
3. **Encrypted Storage**: Sensitive data stored securely in Supabase
4. **Authentication Required**: All endpoints require valid user session
5. **No Credential Exposure**: Safe functions return data without secrets

## Error Handling

The system handles errors at multiple levels:

### Connection Errors
- Invalid credentials → User-friendly message displayed
- Invalid station ID → Clear error with troubleshooting tips
- Network failures → Retry with exponential backoff
- API rate limits → Logged with next sync time

### Data Parsing Errors
- Missing sensors → Graceful degradation (shows N/A)
- Invalid data format → Logged with raw payload for debugging
- Empty responses → Clear message to user

### Logging
All errors are logged with:
- Timestamp
- Connection ID
- Error type
- Error message
- Raw API response (if applicable)

## Troubleshooting

### No Data Showing

**Check**:
1. Verify your API credentials are correct
2. Confirm your station ID matches your FieldClimate account
3. Check that your probe is online and sending data
4. View raw API response to see what data is being returned
5. Check last_error field in connection

### Wrong Data Values

**Solutions**:
1. Use the raw data viewer to inspect the API response
2. Add custom sensor mapping with correct sensor codes
3. Verify sensor names in your FieldClimate dashboard
4. Check that sensors are properly configured

### Sync Not Working

**Check**:
1. Connection is marked as active
2. No error message in last_error field
3. Cron job is running (check Supabase logs)
4. Try manual sync to test
5. Verify API credentials haven't expired

## Adding New Providers

The system is built to easily support additional probe providers:

### Step 1: Add Provider to Adapter

```typescript
// In sync-probe-data/index.ts

static async fetchYourProviderData(connection: ProbeConnection): Promise<any> {
  // Implement API call to your provider
  const response = await fetch('your-api-url', {
    headers: {
      'Authorization': 'your-auth-method',
    },
  });
  return await response.json();
}

static normalizeYourProviderData(
  rawData: any,
  sensorMapping: Record<string, string>
): NormalizedReading {
  // Parse and normalize your provider's data format
  return {
    moisture_percent: ...,
    soil_temp_c: ...,
    rainfall_mm: ...,
    battery_level: ...,
    measured_at: ...,
    raw_payload: rawData,
  };
}
```

### Step 2: Update Provider Switch

```typescript
static async fetchData(connection: ProbeConnection): Promise<any> {
  const provider = connection.provider.toLowerCase();

  if (provider === 'fieldclimate') {
    return await this.fetchFieldClimateData(connection);
  } else if (provider === 'yourprovider') {
    return await this.fetchYourProviderData(connection);
  }

  throw new Error(`Unsupported provider: ${connection.provider}`);
}
```

### Step 3: Add Provider to UI

```typescript
// In ProbeConnectionManager.tsx
<option value="yourprovider">Your Provider Name</option>
```

## API Reference

### Sync Probe Data

**Endpoint**: `POST /functions/v1/sync-probe-data`

**Authentication**: Required (Bearer token)

**Query Parameters**:
- `connection_id` (optional): Sync specific connection
- `sync_all` (optional): Sync all connections (service role)

**Response**:
```json
{
  "success": true,
  "results": [
    {
      "connection_id": "uuid",
      "station_id": "12345678",
      "success": true
    }
  ],
  "readings": [
    {
      "id": "uuid",
      "moisture_percent": 45.2,
      "soil_temp_c": 18.5,
      "rainfall_mm": 2.3,
      "battery_level": 85,
      "measured_at": "2026-04-03T10:30:00Z"
    }
  ]
}
```

## Future Enhancements

Potential improvements for future versions:

1. **Historical Data**: Store and chart historical readings
2. **Alerts**: Notifications when moisture drops below threshold
3. **Multi-Depth Sensors**: Support for multiple soil depths
4. **Irrigation Integration**: Connect to irrigation systems
5. **Comparison Charts**: Compare multiple probes
6. **Export Data**: Download readings as CSV
7. **Mobile App**: Native mobile apps with push notifications
8. **Smart Recommendations**: AI-powered irrigation scheduling

## Support

For issues or questions:
1. Check raw API response for debugging
2. Verify credentials and station ID
3. Review error messages in connection status
4. Check Supabase function logs
5. Contact support with connection ID and error details

## Credits

Built for FarmCast by integrating with:
- FieldClimate API (Metos Weather Stations)
- Supabase Edge Functions
- PostgreSQL with pg_cron
