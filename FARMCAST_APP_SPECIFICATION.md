# FarmCast Mobile App Technical Specification

## Executive Summary

FarmCast is a weather intelligence platform specifically designed for farmers, providing spray condition analysis, AI-powered farming advice, and premium subscription features. This document provides complete technical specifications for replicating all functionality in a native mobile application.

---

## 1. CORE FEATURES OVERVIEW

### 1.1 Weather Intelligence
- Real-time weather data with farming-specific metrics
- 7-day extended forecast
- Hourly forecast (24 hours)
- Rain radar visualization
- Delta-T calculations for spray conditions
- UV index and solar radiation
- Soil temperature and moisture indicators

### 1.2 Spray Window Calculator
- Real-time spray condition analysis
- Color-coded recommendations (Excellent/Good/Fair/Poor/Unsuitable)
- Multi-factor analysis: temperature, wind speed, humidity, rain probability
- Time-based spray window suggestions
- Chemical application safety guidelines

### 1.3 Farmer Joe AI Assistant
- GPT-4 powered conversational AI
- Pest identification via photo upload
- Weather-aware farming recommendations
- Chemical and treatment suggestions
- Unlimited questions for premium users, 3 free for guests

### 1.4 Email Subscription System
- Daily weather forecast emails (7 AM local time)
- Location-based personalized forecasts
- Automatic trial period (1 month)
- Premium subscription integration

### 1.5 Location Management
- Search locations worldwide
- Save favorite locations
- GPS auto-location
- Multiple saved locations per user

### 1.6 User Authentication
- Email/password authentication via Supabase
- Guest mode (limited features)
- Session management across devices
- Profile management

### 1.7 Premium Subscription
- Stripe payment integration
- $5.99/month subscription
- 1-month free trial
- Features: Unlimited AI questions, daily email forecasts, priority support

---

## 2. TECHNICAL ARCHITECTURE

### 2.1 Backend Infrastructure

**Database: Supabase (PostgreSQL)**
- User authentication and profiles
- Subscription management
- Chat history storage
- Saved locations
- Email preferences

**Edge Functions (Serverless)**
- Weather data aggregation
- Farmer Joe AI processing
- Stripe webhook handling
- Email delivery (Resend API)
- Automated cron jobs

**Third-Party APIs**
1. **OpenWeather API** - Weather data
2. **OpenAI API** - GPT-4 for Farmer Joe
3. **Stripe API** - Payment processing
4. **Resend API** - Transactional emails

### 2.2 Frontend Stack (Web Version)
- React 18 + TypeScript
- Vite build tool
- Tailwind CSS for styling
- Lucide React for icons

### 2.3 Mobile App Recommendations

**Recommended Stack:**
- **iOS**: Swift + SwiftUI
- **Android**: Kotlin + Jetpack Compose
- **Cross-Platform Option**: React Native or Flutter

**Architecture Pattern:**
- MVVM (Model-View-ViewModel)
- Repository pattern for data layer
- Dependency injection

---

## 3. DETAILED FEATURE SPECIFICATIONS

### 3.1 Weather Data Structure

**Current Weather Object:**
```json
{
  "temp": 72,
  "feels_like": 70,
  "humidity": 65,
  "wind_speed": 8.5,
  "wind_deg": 180,
  "wind_gust": 12.3,
  "pressure": 1013,
  "uvi": 6.2,
  "clouds": 40,
  "visibility": 10000,
  "dew_point": 58,
  "weather": [{
    "main": "Clouds",
    "description": "scattered clouds",
    "icon": "02d"
  }],
  "rain": {
    "1h": 0
  },
  "dt": 1234567890
}
```

**Hourly Forecast (24 entries):**
```json
{
  "dt": 1234567890,
  "temp": 72,
  "feels_like": 70,
  "humidity": 65,
  "wind_speed": 8.5,
  "wind_deg": 180,
  "pop": 0.2,
  "weather": [{
    "main": "Clear",
    "description": "clear sky",
    "icon": "01d"
  }]
}
```

**Daily Forecast (7 days):**
```json
{
  "dt": 1234567890,
  "temp": {
    "min": 55,
    "max": 78,
    "day": 72,
    "night": 58
  },
  "humidity": 65,
  "wind_speed": 8.5,
  "wind_deg": 180,
  "pop": 0.3,
  "weather": [{
    "main": "Clear",
    "description": "clear sky",
    "icon": "01d"
  }],
  "uvi": 6.2
}
```

### 3.2 Spray Condition Algorithm

**Input Parameters:**
- Temperature (°F)
- Wind Speed (mph)
- Humidity (%)
- Rain Probability (%)

**Condition Ratings:**

```javascript
// Temperature Check
function checkTemperature(temp) {
  if (temp < 40 || temp > 90) return 'UNSUITABLE';
  if (temp < 50 || temp > 85) return 'POOR';
  if (temp < 55 || temp > 80) return 'FAIR';
  if (temp >= 60 && temp <= 75) return 'EXCELLENT';
  return 'GOOD';
}

// Wind Speed Check
function checkWindSpeed(speed) {
  if (speed > 15) return 'UNSUITABLE';
  if (speed > 10) return 'POOR';
  if (speed > 7) return 'FAIR';
  if (speed >= 3 && speed <= 5) return 'EXCELLENT';
  return 'GOOD';
}

// Humidity Check
function checkHumidity(humidity) {
  if (humidity < 30 || humidity > 90) return 'POOR';
  if (humidity < 40 || humidity > 80) return 'FAIR';
  if (humidity >= 50 && humidity <= 70) return 'EXCELLENT';
  return 'GOOD';
}

// Rain Probability Check
function checkRainProbability(pop) {
  if (pop > 50) return 'UNSUITABLE';
  if (pop > 30) return 'POOR';
  if (pop > 15) return 'FAIR';
  if (pop <= 5) return 'EXCELLENT';
  return 'GOOD';
}

// Overall Rating (use worst rating)
function calculateOverallRating(temp, wind, humidity, rain) {
  const ratings = {
    'UNSUITABLE': 0,
    'POOR': 1,
    'FAIR': 2,
    'GOOD': 3,
    'EXCELLENT': 4
  };

  const scores = [
    ratings[checkTemperature(temp)],
    ratings[checkWindSpeed(wind)],
    ratings[checkHumidity(humidity)],
    ratings[checkRainProbability(rain)]
  ];

  const worstScore = Math.min(...scores);
  return Object.keys(ratings).find(key => ratings[key] === worstScore);
}
```

**Color Coding:**
- Excellent: Green (#22c55e)
- Good: Light Green (#86efac)
- Fair: Yellow (#fbbf24)
- Poor: Orange (#f97316)
- Unsuitable: Red (#ef4444)

### 3.3 Delta-T Calculation

**Formula:**
```javascript
function calculateDeltaT(tempC, humidity) {
  const tempK = tempC + 273.15;
  const es = 6.112 * Math.exp((17.67 * tempC) / (tempC + 243.5));
  const ea = (humidity / 100) * es;
  const dewPointC = (243.5 * Math.log(ea / 6.112)) / (17.67 - Math.log(ea / 6.112));
  const deltaT = tempC - dewPointC;
  return deltaT;
}

function getDeltaTRating(deltaT) {
  if (deltaT < 2 || deltaT > 10) return 'Poor';
  if (deltaT >= 2 && deltaT <= 8) return 'Good';
  return 'Fair';
}
```

### 3.4 Farmer Joe AI Integration

**API Endpoint:** `POST /functions/v1/farmer-joe`

**Request Format:**
```json
{
  "message": "What are the best spray conditions today?",
  "image": "data:image/jpeg;base64,/9j/4AAQ...", // optional
  "weatherContext": {
    "location": "Lincoln, Nebraska",
    "currentWeather": { /* weather object */ },
    "forecast": { /* forecast object */ }
  },
  "chatHistory": [
    {
      "role": "user",
      "content": "Previous question"
    },
    {
      "role": "assistant",
      "content": "Previous answer"
    }
  ]
}
```

**Response Format:**
```json
{
  "response": "Based on current conditions in Lincoln...",
  "userMessageId": "uuid-123",
  "messageId": "uuid-456"
}
```

**Implementation Requirements:**
- OpenAI GPT-4o for image analysis
- GPT-3.5-turbo for text-only
- Context window: Last 20 messages
- Max tokens: 500 (text), 1000 (with image)
- Temperature: 0.7
- Guest users: 3 questions max
- Premium users: Unlimited

**System Prompt:**
```
You are Farmer Joe, a friendly and knowledgeable AI assistant with a warm, folksy personality. While you have extensive expertise in agriculture and farming, you can help with absolutely anything the user asks about.

Your farming expertise includes:
- Weather conditions and their impact on farming
- Best times for planting, spraying, and harvesting
- Farm event planning based on weather forecasts
- Pest and disease identification from photos
- Chemical and treatment recommendations for pests and diseases
- General farming tips and best practices

You have access to real-time weather data and forecasts when available. Be conversational, helpful, and friendly.
```

### 3.5 Database Schema

**Users/Profiles Table:**
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  full_name TEXT,
  phone_number TEXT,
  subscription_tier TEXT DEFAULT 'free',
  trial_end_date TIMESTAMPTZ DEFAULT (now() + INTERVAL '1 month'),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Saved Locations:**
```sql
CREATE TABLE favorite_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  city TEXT,
  state TEXT,
  country TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Chat Messages:**
```sql
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Email Subscriptions:**
```sql
CREATE TABLE email_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  frequency TEXT DEFAULT 'daily',
  preferred_time TIME DEFAULT '07:00:00',
  location_id UUID REFERENCES favorite_locations(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 3.6 Email System

**Welcome Email (Triggered on Signup):**
- Sent immediately upon account creation
- Template includes: Welcome message, feature overview, trial info

**Daily Forecast Email (Cron Job - 7 AM Daily):**
- Recipients: All active email subscribers
- Content:
  - Current weather
  - Today's spray conditions
  - 3-day forecast summary
  - Farming tips based on weather
  - Link to full forecast

**Email Service:** Resend API

**Cron Configuration:**
```sql
-- Daily forecast at 7 AM
SELECT cron.schedule(
  'send-daily-forecast',
  '0 7 * * *', -- 7 AM every day
  $$
  SELECT net.http_post(
    url := 'https://[project-id].supabase.co/functions/v1/send-daily-forecast',
    headers := jsonb_build_object('Authorization', 'Bearer [anon-key]'),
    body := jsonb_build_object()
  ) AS request_id;
  $$
);
```

### 3.7 Payment & Subscription Flow

**Stripe Integration:**

1. **Create Checkout Session:**
   - Endpoint: `POST /functions/v1/create-checkout-session`
   - Price: $5.99/month
   - Trial: 1 month free
   - Success URL: Return to app with session_id
   - Cancel URL: Return to app

2. **Webhook Handling:**
   - Endpoint: `POST /functions/v1/stripe-webhook`
   - Events:
     - `checkout.session.completed` - Activate subscription
     - `customer.subscription.updated` - Update status
     - `customer.subscription.deleted` - Cancel subscription
     - `invoice.payment_succeeded` - Confirm payment
     - `invoice.payment_failed` - Handle failure

3. **Subscription States:**
   - `free` - No subscription, trial may be active
   - `trial` - In trial period (1 month)
   - `premium` - Paid subscription active
   - `past_due` - Payment failed
   - `canceled` - Subscription ended

**Mobile App Payment Handling:**
- Use Stripe SDK for native mobile payments
- Alternative: Use in-app purchases (Apple/Google) and sync with backend
- Store subscription state in user profile
- Check subscription status before accessing premium features

### 3.8 Location Search & GPS

**Search API:**
- OpenWeather Geocoding API
- Endpoint: `http://api.openweathermap.org/geo/1.0/direct`
- Parameters: `q={city name},{state},{country}&limit=5`

**Response:**
```json
[
  {
    "name": "Lincoln",
    "lat": 40.8136,
    "lon": -96.7026,
    "country": "US",
    "state": "Nebraska"
  }
]
```

**GPS Location:**
- Request device location permission
- Use native GPS APIs (CoreLocation/FusedLocationProvider)
- Reverse geocode coordinates to city/state
- Cache location for offline access

### 3.9 Rain Radar

**Implementation Options:**

**Option 1: RainViewer API (Free)**
- Endpoint: `https://api.rainviewer.com/public/weather-maps.json`
- Returns: Radar tile URLs
- Display: Overlay on map (Mapbox/Google Maps)

**Option 2: OpenWeather Radar**
- Endpoint: `https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png`
- Parameters: Zoom level, tile coordinates
- Requires OpenWeather API key

**Mobile Implementation:**
- Use native map views (MapKit/Google Maps)
- Layer radar tiles on top
- Add time slider for animation
- Auto-refresh every 10 minutes

---

## 4. MOBILE APP SPECIFIC IMPLEMENTATIONS

### 4.1 Push Notifications

**Notification Types:**
1. **Severe Weather Alerts**
   - Trigger: High wind, extreme temp, heavy rain
   - Priority: High
   - Action: Open app to weather details

2. **Spray Window Alerts**
   - Trigger: Excellent spray conditions detected
   - Timing: Send 30 min before optimal window
   - Action: Show spray calculator

3. **Daily Forecast**
   - Trigger: 7 AM daily
   - Content: Summary of day's weather
   - Action: Open forecast view

**Implementation:**
- iOS: APNs (Apple Push Notification service)
- Android: FCM (Firebase Cloud Messaging)
- Store device tokens in database
- Send from backend via Supabase Edge Function

### 4.2 Offline Mode

**Cacheable Data:**
- Last fetched weather data (6 hour expiry)
- User profile and preferences
- Saved locations
- Recent chat history (last 50 messages)

**Sync Strategy:**
- Background fetch for weather updates
- Queue offline actions (save location, send message)
- Sync when connection restored
- Show "offline" indicator

### 4.3 Widgets

**iOS Widget (SwiftUI):**
- Small: Current temp + spray condition
- Medium: Current + 3-hour forecast + spray rating
- Large: Full day forecast + spray windows

**Android Widget:**
- 2x2: Current conditions
- 4x2: Hourly forecast
- 4x4: Full forecast + spray calculator

**Update Frequency:** Every 30 minutes (background fetch)

### 4.4 UI/UX Guidelines

**Color Palette:**
- Primary: Green (#22c55e)
- Secondary: Dark Green (#15803d)
- Background: White (#ffffff)
- Surface: Light Gray (#f3f4f6)
- Text: Dark Gray (#1f2937)
- Accent: Blue (#3b82f6)

**Typography:**
- Headers: System Bold (SF Pro/Roboto)
- Body: System Regular
- Numbers: Tabular/Monospace for weather data

**Key Screens:**
1. **Home/Dashboard**
   - Current weather card
   - Spray condition indicator
   - Quick actions (AI chat, radar)
   - Location selector

2. **Forecast**
   - Hourly timeline (horizontal scroll)
   - Daily cards (vertical list)
   - Graph view toggle

3. **Spray Calculator**
   - Big condition indicator
   - Individual factor breakdown
   - Best time suggestion
   - Safety guidelines

4. **Farmer Joe Chat**
   - Message bubbles
   - Image upload button
   - Camera integration
   - History saved

5. **Profile/Settings**
   - Account info
   - Subscription management
   - Saved locations
   - Email preferences
   - Notifications settings

6. **Rain Radar**
   - Full-screen map
   - Play/pause animation
   - Time slider
   - Legend

### 4.5 Permissions Required

**iOS:**
- Location (When In Use)
- Location (Always) - for background weather
- Camera - for pest photos
- Photo Library - for uploading images
- Notifications - for alerts

**Android:**
- ACCESS_FINE_LOCATION
- ACCESS_COARSE_LOCATION
- ACCESS_BACKGROUND_LOCATION
- CAMERA
- READ_EXTERNAL_STORAGE
- POST_NOTIFICATIONS (Android 13+)

---

## 5. API ENDPOINTS REFERENCE

### 5.1 Weather Data

**Endpoint:** `GET /weather?lat={lat}&lon={lon}`
- Returns: Current + hourly + daily forecast
- Cache: 10 minutes
- Error handling: Fallback to cached data

### 5.2 Farmer Joe

**Endpoint:** `POST /functions/v1/farmer-joe`
- Auth: Bearer token (optional for guests)
- Rate limit: 3/day for guests, unlimited for premium
- Request: See section 3.4
- Response: AI-generated text

### 5.3 Stripe Checkout

**Endpoint:** `POST /functions/v1/create-checkout-session`
- Auth: Required
- Returns: `{ url: "https://checkout.stripe.com/..." }`

### 5.4 User Profile

**Endpoint:** `GET /rest/v1/profiles?id=eq.{user_id}`
- Auth: Required
- Returns: User profile object

**Endpoint:** `PATCH /rest/v1/profiles?id=eq.{user_id}`
- Auth: Required
- Body: Profile updates
- Returns: Updated profile

### 5.5 Locations

**Endpoint:** `GET /rest/v1/favorite_locations?user_id=eq.{user_id}`
- Auth: Required
- Returns: Array of saved locations

**Endpoint:** `POST /rest/v1/favorite_locations`
- Auth: Required
- Body: Location object
- Returns: Created location

**Endpoint:** `DELETE /rest/v1/favorite_locations?id=eq.{location_id}`
- Auth: Required
- Returns: 204 No Content

### 5.6 Email Subscriptions

**Endpoint:** `GET /rest/v1/email_subscriptions?user_id=eq.{user_id}`
- Auth: Required
- Returns: Subscription settings

**Endpoint:** `PATCH /rest/v1/email_subscriptions?user_id=eq.{user_id}`
- Auth: Required
- Body: `{ is_active: true/false, preferred_time: "07:00:00" }`
- Returns: Updated settings

---

## 6. AUTHENTICATION FLOW

### 6.1 Sign Up

```javascript
// Request
POST /auth/v1/signup
{
  "email": "user@example.com",
  "password": "securePassword123"
}

// Response
{
  "access_token": "eyJhbGc...",
  "refresh_token": "xyz...",
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}

// Automatic Triggers:
// 1. Profile created with 1-month trial
// 2. Welcome email sent
// 3. Default email subscription created
```

### 6.2 Sign In

```javascript
POST /auth/v1/token?grant_type=password
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

### 6.3 Session Management

- Access token expires: 1 hour
- Refresh token expires: 30 days
- Auto-refresh before expiry
- Store tokens in secure storage (Keychain/Keystore)

### 6.4 Guest Mode

- No authentication required
- Limited features:
  - View weather (full access)
  - 3 AI questions max
  - No saved locations
  - No email subscriptions
- Prompt to sign up after 3 AI questions

---

## 7. ANALYTICS & TRACKING

**Events to Track:**

**User Events:**
- Sign up / Sign in
- Subscription started / canceled
- Trial ended
- Profile updated

**Feature Usage:**
- Weather view (location, frequency)
- Spray calculator opened
- AI chat message sent
- Image uploaded to AI
- Rain radar viewed
- Location saved/changed

**Performance:**
- API response times
- App crashes
- Network errors
- Cache hit/miss rate

**Recommended Tools:**
- Amplitude / Mixpanel for analytics
- Sentry for error tracking
- Firebase Performance Monitoring

---

## 8. TESTING REQUIREMENTS

### 8.1 Unit Tests
- Weather calculations (Delta-T, spray conditions)
- Date/time formatting
- Data parsing and validation
- User state management

### 8.2 Integration Tests
- API calls and responses
- Database operations
- Authentication flow
- Payment processing

### 8.3 UI Tests
- Screen navigation
- Form validation
- Image upload
- Chat functionality

### 8.4 Test Scenarios

**Weather:**
- Test with various locations
- Edge cases (extreme temps, high wind)
- Offline mode behavior
- Data refresh timing

**Spray Calculator:**
- All condition combinations
- Boundary values (exactly 10mph, etc.)
- Time-based windows

**Farmer Joe:**
- Text-only questions
- Image upload and analysis
- Guest limit enforcement
- Chat history persistence

**Payments:**
- Successful subscription
- Failed payment
- Subscription cancellation
- Trial expiration

---

## 9. DEPLOYMENT & CONFIGURATION

### 9.1 Environment Variables

```
# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... # Backend only

# OpenWeather
OPENWEATHER_API_KEY=xxxxx

# OpenAI
OPENAI_API_KEY=sk-xxxxx

# Stripe
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
STRIPE_SECRET_KEY=sk_live_xxxxx # Backend only
STRIPE_WEBHOOK_SECRET=whsec_xxxxx # Backend only
STRIPE_PRICE_ID=price_xxxxx

# Resend (Email)
RESEND_API_KEY=re_xxxxx

# App Config
APP_ENV=production
API_TIMEOUT=30000
```

### 9.2 App Store Requirements

**iOS App Store:**
- Privacy policy URL
- Terms of service URL
- Support email
- Screenshots (all device sizes)
- App preview video
- Age rating: 4+
- Category: Weather
- Subscription details in metadata

**Google Play Store:**
- Privacy policy URL
- Content rating questionnaire
- Screenshots (phone + tablet)
- Feature graphic
- Category: Weather
- In-app purchase declarations

### 9.3 Backend Infrastructure

**Supabase Project:**
- Postgres database (included)
- Authentication (included)
- Edge Functions (included)
- Realtime (optional)
- Storage (not currently used)

**Monitoring:**
- Supabase Dashboard for logs
- Stripe Dashboard for payments
- Email delivery monitoring (Resend)
- API usage tracking (OpenWeather/OpenAI)

---

## 10. FUTURE ENHANCEMENTS

**Potential Features:**
1. Soil moisture sensor integration
2. Crop-specific advice and tracking
3. Field mapping and zone management
4. Multi-language support
5. Social features (share conditions with neighbors)
6. Historical weather data and trends
7. Custom alert thresholds
8. Integration with farm management software
9. Satellite imagery
10. Pest outbreak predictions

---

## 11. SUPPORT & MAINTENANCE

**Customer Support:**
- In-app help center
- Email support: support@farmcast.app
- FAQ section
- Video tutorials

**App Updates:**
- Weather API changes
- OS version compatibility
- New features and improvements
- Bug fixes and performance optimization

**Monitoring:**
- Daily API health checks
- Subscription status monitoring
- Error rate tracking
- User feedback collection

---

## APPENDIX A: Sample Code Snippets

### A.1 Weather API Call (Swift)

```swift
func fetchWeather(lat: Double, lon: Double) async throws -> WeatherData {
    let url = URL(string: "https://api.openweathermap.org/data/2.5/onecall")!
    var components = URLComponents(url: url, resolvingAgainstBaseURL: true)!
    components.queryItems = [
        URLQueryItem(name: "lat", value: String(lat)),
        URLQueryItem(name: "lon", value: String(lon)),
        URLQueryItem(name: "appid", value: apiKey),
        URLQueryItem(name: "units", value: "imperial"),
        URLQueryItem(name: "exclude", value: "minutely")
    ]

    let (data, _) = try await URLSession.shared.data(from: components.url!)
    return try JSONDecoder().decode(WeatherData.self, from: data)
}
```

### A.2 Spray Condition Calculator (Kotlin)

```kotlin
enum class SprayCondition {
    EXCELLENT, GOOD, FAIR, POOR, UNSUITABLE
}

fun calculateSprayCondition(
    temp: Double,
    windSpeed: Double,
    humidity: Int,
    rainProb: Int
): SprayCondition {
    val conditions = listOf(
        checkTemperature(temp),
        checkWindSpeed(windSpeed),
        checkHumidity(humidity),
        checkRainProbability(rainProb)
    )

    return conditions.minByOrNull { it.ordinal } ?: SprayCondition.UNSUITABLE
}

private fun checkTemperature(temp: Double): SprayCondition = when {
    temp < 40 || temp > 90 -> SprayCondition.UNSUITABLE
    temp < 50 || temp > 85 -> SprayCondition.POOR
    temp < 55 || temp > 80 -> SprayCondition.FAIR
    temp in 60.0..75.0 -> SprayCondition.EXCELLENT
    else -> SprayCondition.GOOD
}
```

### A.3 Farmer Joe Chat (React Native)

```javascript
const sendMessage = async (message, image) => {
  try {
    const session = await supabase.auth.getSession();

    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/farmer-joe`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ANON_KEY}`
        },
        body: JSON.stringify({
          message,
          image,
          weatherContext: currentWeather,
          chatHistory: messages
        })
      }
    );

    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error('Chat error:', error);
    throw error;
  }
};
```

---

## APPENDIX B: API Rate Limits & Costs

**OpenWeather API:**
- Free tier: 1,000 calls/day
- One Call 3.0: $0.0015 per call
- Estimated cost: ~$45/month per 1000 users

**OpenAI API:**
- GPT-3.5-turbo: $0.002 per 1K tokens
- GPT-4o: $0.03 per 1K tokens (with vision)
- Estimated cost: ~$0.05 per conversation

**Stripe:**
- 2.9% + $0.30 per transaction
- No monthly fees
- Subscription billing included

**Resend API:**
- Free tier: 100 emails/day
- Growth: $20/month for 50,000 emails

**Total Monthly Cost Estimate:**
- 1,000 users: ~$100-150/month
- 10,000 users: ~$800-1,200/month

---

## CONCLUSION

This specification provides all technical details needed to replicate FarmCast functionality in a native mobile app. The system is designed to be scalable, maintainable, and user-friendly with a focus on providing real farming value through weather intelligence and AI-powered advice.

For questions or clarification, contact the development team.

**Document Version:** 1.0
**Last Updated:** April 2, 2026
**Authors:** FarmCast Development Team
