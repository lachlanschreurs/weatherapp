# FarmCast - Complete Feature Documentation

## Executive Summary

FarmCast is a comprehensive agricultural weather intelligence platform designed for farmers, providing real-time weather data, spray condition analysis, soil monitoring, AI-powered farming advice, and subscription-based premium features.

---

## 1. CORE WEATHER FEATURES

### 1.1 Real-Time Weather Display
- **Current Weather Conditions:**
  - Temperature (Celsius)
  - Humidity percentage
  - Wind speed and direction (km/h with compass direction)
  - Wind gusts (when available)
  - Atmospheric pressure (hPa)
  - Current weather description (e.g., "Clear Sky", "Light Rain")
  - Weather icons based on conditions

- **Automatic Updates:**
  - Weather data refreshes automatically
  - Last updated timestamp displayed
  - Manual refresh button available

### 1.2 Location Management
- **Location Search:**
  - Search by city name
  - Autocomplete suggestions
  - Displays city, state, and country
  - Default location: Melbourne, Victoria, Australia
  - Coordinates stored: latitude and longitude

- **Location Data Storage:**
  - Selected location persists across sessions
  - Geodata used for weather API calls

### 1.3 Extended Weather Forecasts

#### Hourly Forecast
- **24-Hour Detailed Forecast:**
  - Temperature trends
  - Precipitation probability
  - Wind speed and gusts
  - Weather conditions for each hour
  - Visual timeline display

#### 7-Day Extended Forecast
- **Daily Weather Overview:**
  - Daily temperature range (min/max)
  - Weather conditions summary
  - Precipitation amounts
  - Wind information
  - Day-by-day cards with icons

### 1.4 Rain Radar
- **Interactive Rain Radar Map:**
  - Real-time precipitation overlay
  - Radar imagery for selected location
  - Visual representation of rain intensity
  - Coverage area display
  - Map integration showing location context

---

## 2. AGRICULTURAL INTELLIGENCE FEATURES

### 2.1 Delta-T Calculation
**Purpose:** Determines optimal spraying conditions based on temperature and humidity.

- **Real-Time Delta-T:**
  - Calculated from current temperature and humidity
  - Formula: `ΔT = Temperature - Dew Point`
  - Dew point calculated using August-Roche-Magnus approximation

- **Delta-T Conditions:**
  - **IDEAL (2-8°C):** Perfect spraying conditions, green indicator
  - **MARGINAL (8-10°C or 0-2°C):** Proceed with caution, yellow indicator
  - **POOR (>10°C or <0°C):** Not recommended for spraying, red indicator

- **Visual Indicators:**
  - Color-coded badges (green/yellow/red)
  - Gauge icon for quick recognition
  - Detailed explanations of conditions

### 2.2 Spray Window Analysis
**Purpose:** Identifies optimal time windows for chemical spraying.

- **48-Hour Spray Window Finder:**
  - Analyzes next 48 hours of forecast data
  - Identifies periods with ideal Delta-T (2-8°C)
  - Filters by wind conditions (< 20 km/h)
  - Excludes rainy periods

- **Best Spray Window Display:**
  - Start time and date
  - Duration in hours
  - Average temperature during window
  - Specific conditions (wind speed, Delta-T)
  - Clear "GO/NO-GO" indicators

### 2.3 Spray Condition Assessment
**Purpose:** Real-time evaluation of current spraying safety.

- **Multi-Factor Analysis:**
  - **Wind Speed Check:**
    - Ideal: < 15 km/h
    - Marginal: 15-20 km/h
    - Dangerous: > 20 km/h

  - **Rain Detection:**
    - Current precipitation check
    - Recent rain in past hour
    - Spray not recommended if raining

  - **Delta-T Integration:**
    - Combines with wind and rain data
    - Overall safety recommendation

- **Spray Advice Output:**
  - Clear GO/CAUTION/STOP recommendation
  - Reason for recommendation
  - Multiple condition checks displayed

### 2.4 Farming Recommendations

#### Planting Day Analysis (7-Day Forecast)
- **Ideal Planting Conditions:**
  - Temperature range: 10-30°C
  - Low wind speed (< 20 km/h)
  - Precipitation amount: 0-10mm
  - No extreme weather

- **Daily Suitability Score:**
  - Rated as "Excellent", "Good", "Fair", or "Poor"
  - Detailed reasons for each day's rating
  - 7-day forward planning capability

#### Irrigation Needs Analysis
- **Smart Irrigation Planning:**
  - Analyzes 7-day precipitation forecast
  - Calculates daily water deficit
  - Accounts for natural rainfall
  - Provides irrigation recommendations

- **Irrigation Metrics:**
  - Recommended irrigation amount (mm)
  - Natural rainfall expected
  - Total water needs per day
  - Priority level for irrigation (High/Medium/Low)

---

## 3. SOIL MONITORING & PROBE INTEGRATION

### 3.1 Probe API Management
**Purpose:** Integrate third-party soil monitoring devices.

- **Probe Configuration:**
  - Add unlimited probe APIs
  - Store API name and endpoint URL
  - Enable/disable probes individually
  - User-specific probe ownership via RLS

- **Database Schema:**
  - Table: `probe_apis`
  - Fields: `id`, `user_id`, `name`, `api_url`, `is_active`, `created_at`, `updated_at`
  - Row Level Security enforced

### 3.2 Probe Data Collection
- **Automated Data Fetching:**
  - Periodic polling of probe APIs
  - Data storage in `probe_data` table
  - Historical data tracking
  - Timestamp-based records

- **Probe Data Schema:**
  - Links to specific probe API
  - Stores JSON payload from probe
  - Timestamps for data collection
  - User ownership via RLS

### 3.3 Weekly Probe Reports
**Purpose:** Automated weekly soil condition reports sent via email.

- **Report Generation:**
  - Edge Function: `send-weekly-probe-report`
  - Runs weekly (scheduled via cron)
  - Aggregates probe data for past 7 days
  - Generates formatted email report

- **Report Content:**
  - All active probe readings
  - Weekly trends and changes
  - Soil moisture levels
  - Temperature data
  - Nutrient levels (if available)

- **Delivery:**
  - Sent to user's registered email
  - Only sent if probe report subscription is active
  - Automatic scheduling (Sunday midnight)

---

## 4. AI-POWERED FEATURES

### 4.1 Farmer Joe - AI Agricultural Advisor
**Purpose:** Conversational AI assistant for farming advice.

- **Technology:**
  - Powered by OpenAI GPT-4 Vision
  - Context-aware responses
  - Agricultural domain expertise
  - Image analysis capability

- **Features:**
  - Real-time chat interface
  - Weather-aware responses (integrates current weather data)
  - Location-specific advice
  - Crop recommendations
  - Pest and disease identification
  - Farming best practices

- **Image Analysis:**
  - Upload photos of crops, pests, diseases
  - AI visual recognition
  - Detailed analysis and recommendations
  - Storage of conversation history

- **Database Integration:**
  - Table: `farmer_joe_messages`
  - Stores full conversation history
  - Links messages to users
  - Supports text and image messages
  - User-specific chat history via RLS

- **Edge Function:**
  - Function: `farmer-joe`
  - Handles OpenAI API integration
  - Processes images and text
  - Returns AI-generated responses
  - Secure API key management

### 4.2 AI Context Integration
- **Automatic Context Provision:**
  - Current weather conditions
  - User's location
  - Time of day/season
  - Recent weather trends

- **Smart Recommendations:**
  - Weather-specific farming advice
  - Seasonal planting guidance
  - Risk assessments based on forecast
  - Timing recommendations for farm activities

---

## 5. NOTIFICATIONS SYSTEM

### 5.1 Notification Types

#### Weather Alerts
- **Automated Weather Alert Generation:**
  - Triggered by significant weather changes
  - Monitors: temperature drops, high winds, heavy rain, extreme heat
  - Creates notifications in database

- **Alert Thresholds:**
  - **Temperature Drop:** > 10°C decrease
  - **High Winds:** > 30 km/h
  - **Heavy Rain:** > 20mm expected
  - **Extreme Heat:** > 35°C
  - **Frost Warning:** < 2°C

#### Weather Update Notifications
- **Automatic on Weather Refresh:**
  - Sent when weather data updates
  - Summarizes current conditions
  - Highlights important changes
  - Info-level notifications

### 5.2 Notification Database Schema
- **Table:** `notifications`
- **Fields:**
  - `id` - Unique identifier
  - `user_id` - Recipient user
  - `title` - Notification headline
  - `message` - Detailed message
  - `type` - Category (weather_alert, spray_window, general, etc.)
  - `severity` - Level (info, warning, critical)
  - `read` - Read status (boolean)
  - `created_at` - Timestamp

### 5.3 Notification Center UI
- **User Interface:**
  - Bell icon with unread count badge
  - Dropdown notification list
  - Mark as read functionality
  - Visual severity indicators
  - Timestamp display
  - Type-based icons

- **Features:**
  - Real-time notification count
  - Filter by read/unread
  - Clear all notifications
  - Auto-refresh on new notifications

### 5.4 Notification Service Functions
- **Functions Available:**
  - `checkAndCreateWeatherAlerts()` - Analyzes weather and creates alerts
  - `createWeatherUpdateNotification()` - Creates update notifications
  - `getUserNotifications()` - Retrieves user's notifications
  - Database RLS ensures users only see their own notifications

---

## 6. EMAIL SUBSCRIPTION SYSTEM

### 6.1 Daily Weather Forecast Emails

#### Subscription Management
- **Database Table:** `email_subscriptions`
- **Fields:**
  - `user_id` - Subscriber
  - `subscription_type` - Type of email ('daily_forecast', 'probe_report')
  - `is_active` - Subscription status
  - `latitude`, `longitude` - Location for forecast
  - `created_at`, `updated_at` - Timestamps

- **Auto-Creation:**
  - Daily forecast subscription auto-created on user signup
  - 7-day free trial included
  - Defaults to user's current location
  - Database trigger handles auto-creation

#### Email Content
- **Sent Daily at 6:00 AM Local Time:**
  - Current weather conditions
  - Today's high/low temperatures
  - Precipitation forecast
  - Wind conditions
  - 7-day extended forecast
  - Spray condition recommendations
  - Delta-T analysis
  - Best spray windows for next 48 hours

#### Delivery System
- **Edge Function:** `send-daily-forecast`
- **Scheduling:** Cron job (daily at 6:00 AM)
- **Email Provider:** Resend API
- **Personalization:**
  - User's name
  - Location-specific data
  - Branded HTML email template

### 6.2 Weekly Probe Reports (See Section 3.3)

### 6.3 Welcome Email
- **Triggered on User Signup:**
  - Edge Function: `send-welcome-email`
  - Database trigger on `auth.users` insert
  - Sent automatically via Supabase trigger

- **Email Content:**
  - Welcome message
  - Overview of features
  - Getting started guide
  - Premium features teaser
  - Contact information

### 6.4 Email Subscription Controls
- **User Controls:**
  - Component: `EmailSubscriptions`
  - Toggle subscriptions on/off
  - Update location preferences
  - View subscription status
  - See trial period remaining

---

## 7. PREMIUM SUBSCRIPTION & PAYMENTS

### 7.1 Stripe Integration

#### Subscription Tiers
- **Free Tier:**
  - Basic weather forecasts
  - Limited Farmer Joe conversations
  - 7-day trial of email subscriptions

- **Premium Tier ($9.99/month):**
  - Unlimited Farmer Joe AI conversations
  - Daily weather forecast emails
  - Weekly probe reports
  - Priority support
  - Advanced analytics
  - Extended historical data

#### Payment Processing
- **Stripe Checkout:**
  - Edge Function: `create-checkout-session`
  - Secure payment processing
  - PCI compliance handled by Stripe
  - Automatic subscription management

- **Customer Portal:**
  - Edge Function: `create-customer-portal-session`
  - Manage subscription
  - Update payment methods
  - View billing history
  - Cancel subscription

#### Webhook Handling
- **Edge Function:** `stripe-webhook`
- **Events Handled:**
  - `checkout.session.completed` - New subscription
  - `customer.subscription.updated` - Subscription changes
  - `customer.subscription.deleted` - Cancellation
  - `invoice.payment_succeeded` - Successful payment
  - `invoice.payment_failed` - Failed payment

- **Database Updates:**
  - Table: `subscriptions`
  - Tracks subscription status
  - Links to Stripe customer ID
  - Records plan type and pricing
  - Timestamps for billing periods

### 7.2 Subscription Database Schema

#### Subscriptions Table
- **Fields:**
  - `id` - Unique identifier
  - `user_id` - Subscriber (references auth.users)
  - `stripe_customer_id` - Stripe customer reference
  - `stripe_subscription_id` - Stripe subscription reference
  - `status` - Current status (active, canceled, past_due)
  - `plan_id` - Subscription plan identifier
  - `current_period_start` - Billing period start
  - `current_period_end` - Billing period end
  - `cancel_at_period_end` - Cancellation flag
  - `created_at`, `updated_at` - Timestamps

#### Pricing Table
- **Table:** `subscription_pricing`
- **Fields:**
  - `id` - Plan identifier
  - `name` - Plan name (e.g., "Premium")
  - `description` - Plan features
  - `price` - Monthly price
  - `currency` - Currency code
  - `stripe_price_id` - Stripe price reference
  - `features` - JSON array of features
  - `is_active` - Availability status

### 7.3 Premium Feature Gates
- **Subscription Manager Component:**
  - Displays current subscription status
  - Shows features by tier
  - Provides upgrade/manage buttons
  - Handles Stripe redirects

- **Feature Access Control:**
  - Database queries check subscription status
  - UI elements conditionally rendered
  - Premium features disabled for free users
  - Upgrade prompts when accessing premium features

### 7.4 Premium Teaser
- **Component:** `PremiumTeaser`
- **Purpose:** Encourage upgrades
- **Display:**
  - Shown to free tier users
  - Highlights premium features
  - Call-to-action buttons
  - Feature comparison

---

## 8. USER AUTHENTICATION & SECURITY

### 8.1 Authentication System

#### Supabase Auth Integration
- **Email/Password Authentication:**
  - User registration
  - User login
  - Password reset
  - Email verification (disabled by default)

- **Auth Modal Component:**
  - Toggle between login/signup
  - Form validation
  - Error handling
  - Success notifications

#### Session Management
- **Supabase Session:**
  - JWT-based authentication
  - Automatic token refresh
  - Secure cookie storage
  - Session persistence

### 8.2 Single-Device Session Control
**Purpose:** Enforce one active login per account.

#### Session Tracking
- **Database Table:** `user_sessions`
- **Fields:**
  - `id` - Session identifier
  - `user_id` - Account owner
  - `session_token` - Supabase access token (unique)
  - `device_fingerprint` - Browser/device identifier
  - `ip_address` - Connection IP
  - `user_agent` - Browser string
  - `is_active` - Active status
  - `last_activity` - Activity timestamp
  - `created_at` - Session start
  - `expires_at` - Session expiration (7 days default)

#### Device Fingerprinting
- **Generated from:**
  - User agent string
  - Browser language
  - Screen color depth
  - Screen resolution
  - Timezone offset
  - Storage capabilities

- **Hashing Algorithm:**
  - Combines browser characteristics
  - Creates unique device identifier
  - Base-36 encoded hash

#### Session Enforcement
- **On User Login:**
  1. New session created in database
  2. Database trigger fires
  3. All other user sessions deactivated
  4. New session marked as active

- **Continuous Validation:**
  - Session checked every 30 seconds
  - Validates against database
  - Auto-logout if session inactive
  - Updates activity timestamp

- **Auto-Logout Process:**
  1. Session validity check fails
  2. Supabase auth signs out user
  3. UI state cleared
  4. Alert shown: "You have been logged out because you signed in on another device."

#### Session Cleanup
- **Automated Cleanup:**
  - Function: `cleanup_expired_sessions()`
  - Deactivates expired sessions
  - Deletes sessions >30 days past expiry
  - Prevents database bloat

### 8.3 Row Level Security (RLS)

#### RLS Policies Applied to All Tables:
- **Probe APIs:** Users can only access their own probe configurations
- **Probe Data:** Users can only view their own probe data
- **Notifications:** Users can only see their own notifications
- **Farmer Joe Messages:** Users can only access their own chat history
- **Email Subscriptions:** Users can only manage their own subscriptions
- **User Sessions:** Users can only view/modify their own sessions
- **Subscriptions:** Users can only view their own subscription data

#### Policy Types:
- **SELECT policies:** Read own data only
- **INSERT policies:** Create own records only
- **UPDATE policies:** Modify own records only
- **DELETE policies:** Remove own records only
- **Authenticated-only access:** All tables require login

### 8.4 User Roles & Permissions

#### Admin Role System
- **Database Table:** `user_roles`
- **Fields:**
  - `user_id` - User identifier
  - `role` - Role type ('admin', 'user')
  - `created_at` - Assignment timestamp

- **Admin Privileges:**
  - Access to Admin Dashboard
  - View all user statistics
  - Manage notifications system-wide
  - View subscription metrics
  - Access to system health data

#### Admin Check Function
- **Function:** `checkAdminStatus(userId)`
- **Queries:** `user_roles` table
- **Returns:** Boolean admin status
- **UI Integration:** Shows/hides admin features

---

## 9. ADMIN DASHBOARD

### 9.1 Admin Panel Features

#### User Statistics
- **Metrics Displayed:**
  - Total registered users
  - Active subscriptions count
  - New users this month
  - Premium conversion rate
  - User growth trends

#### Notification Management
- **Capabilities:**
  - View all system notifications
  - Filter by severity
  - Filter by type
  - Create system-wide announcements
  - Delete notifications
  - Mark notifications as read

#### Subscription Analytics
- **Data Shown:**
  - Active subscriptions
  - Canceled subscriptions
  - Revenue metrics
  - Churn rate
  - Popular subscription plans
  - Subscription status distribution

#### System Health
- **Monitoring:**
  - Database connection status
  - API response times
  - Error rates
  - Edge function execution logs
  - Email delivery success rate

### 9.2 Admin Dashboard Component
- **Component:** `AdminDashboard`
- **Access Control:** Admin role required
- **UI Features:**
  - Tabbed interface
  - Real-time data
  - Charts and graphs
  - Export capabilities
  - Search and filter tools

---

## 10. EDGE FUNCTIONS (Backend Services)

### 10.1 Weather Function
- **Function:** `weather`
- **Purpose:** Proxy for weather API calls
- **Input:** Location coordinates
- **Output:** Current weather + 7-day forecast
- **External API:** OpenWeatherMap
- **CORS:** Enabled for browser access

### 10.2 Farmer Joe Function
- **Function:** `farmer-joe`
- **Purpose:** AI chat integration
- **Technology:** OpenAI GPT-4 Vision API
- **Features:**
  - Text conversation
  - Image analysis
  - Context-aware responses
  - Weather data integration
- **Security:** API key stored in Supabase secrets

### 10.3 Email Functions

#### Send Welcome Email
- **Function:** `send-welcome-email`
- **Trigger:** User signup (database trigger)
- **Email Service:** Resend API
- **Template:** Welcome message + feature overview

#### Send Daily Forecast
- **Function:** `send-daily-forecast`
- **Schedule:** Daily at 6:00 AM (cron)
- **Recipients:** Active email subscribers
- **Content:** Personalized weather forecast

#### Send Weekly Probe Report
- **Function:** `send-weekly-probe-report`
- **Schedule:** Weekly on Sunday (cron)
- **Recipients:** Active probe report subscribers
- **Content:** 7-day probe data summary

### 10.4 Stripe Functions

#### Create Checkout Session
- **Function:** `create-checkout-session`
- **Purpose:** Initialize Stripe payment
- **Input:** Plan ID, user ID
- **Output:** Checkout URL
- **Process:** Creates Stripe checkout session

#### Create Customer Portal Session
- **Function:** `create-customer-portal-session`
- **Purpose:** Manage existing subscription
- **Input:** Stripe customer ID
- **Output:** Portal URL
- **Features:** Update payment, cancel subscription, view invoices

#### Stripe Webhook
- **Function:** `stripe-webhook`
- **Purpose:** Handle Stripe events
- **Security:** Webhook signature verification
- **Events:** Payment success/failure, subscription changes
- **Actions:** Update database, send emails

### 10.5 Edge Function Architecture
- **Runtime:** Deno
- **Deployment:** Supabase Edge Functions
- **Environment Variables:**
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `OPENAI_API_KEY`
  - `RESEND_API_KEY`
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`

- **CORS Configuration:**
  - All functions include CORS headers
  - OPTIONS request handling
  - Browser-compatible responses

---

## 11. DATABASE SCHEMA OVERVIEW

### 11.1 Tables Summary

#### Authentication
- `auth.users` - Supabase managed user accounts

#### User Management
- `user_roles` - Admin/user role assignments
- `user_sessions` - Device session tracking

#### Weather & Farming
- `probe_apis` - Soil monitoring device configurations
- `probe_data` - Historical probe readings
- `farmer_joe_messages` - AI chat conversation history

#### Notifications
- `notifications` - User notification records

#### Subscriptions
- `subscriptions` - Premium subscription records
- `subscription_pricing` - Available subscription plans
- `email_subscriptions` - Email notification preferences

### 11.2 Database Triggers

#### Auto-Create Email Subscription
- **Trigger:** On `auth.users` insert
- **Action:** Creates default daily forecast subscription
- **Trial Period:** 7 days

#### Deactivate Other Sessions
- **Trigger:** On `user_sessions` insert
- **Action:** Deactivates all other user sessions
- **Purpose:** Enforce single-device login

#### Send Welcome Email
- **Trigger:** On `auth.users` insert
- **Action:** Calls `send-welcome-email` edge function
- **Timing:** Immediate upon signup

### 11.3 Database Functions

#### Session Management
- `deactivate_other_sessions()` - Enforces single device
- `cleanup_expired_sessions()` - Removes old sessions
- `is_session_valid(token)` - Validates session

#### Subscription Helpers
- Functions to check subscription status
- Functions to calculate trial periods
- Functions to validate subscription access

---

## 12. FRONTEND ARCHITECTURE

### 12.1 Technology Stack
- **Framework:** React 18.3
- **Build Tool:** Vite 5.4
- **Language:** TypeScript
- **Styling:** Tailwind CSS 3.4
- **Icons:** Lucide React
- **Backend:** Supabase

### 12.2 Component Structure

#### Main Components
- `App.tsx` - Main application shell
- `AuthModal.tsx` - Login/signup interface
- `UserMenu.tsx` - User profile dropdown
- `AdminDashboard.tsx` - Admin control panel

#### Weather Components
- `LocationSearch.tsx` - Location picker
- `HourlyForecast.tsx` - 24-hour forecast
- `ExtendedForecast.tsx` - 7-day forecast
- `RainRadar.tsx` - Precipitation map
- `WeatherForecastGraph.tsx` - Visual charts

#### Feature Components
- `FarmerJoe.tsx` - AI chat interface
- `ProbeAPIManager.tsx` - Soil probe config
- `NotificationCenter.tsx` - Notification dropdown
- `SubscriptionManager.tsx` - Premium subscription UI
- `EmailSubscriptions.tsx` - Email preference controls
- `PremiumTeaser.tsx` - Upgrade prompts
- `AlertBanner.tsx` - System alerts display

### 12.3 Utility Files

#### Weather Utilities
- `deltaT.ts` - Delta-T calculations
- `sprayWindow.ts` - Optimal spray time finder
- `sprayAdvice.ts` - Spray condition analyzer
- `farmingRecommendations.ts` - Planting & irrigation analysis
- `weatherAlerts.ts` - Alert generation logic

#### System Utilities
- `sessionManager.ts` - Device session control
- `notificationService.ts` - Notification CRUD operations
- `supabase.ts` - Database client configuration

### 12.4 State Management
- React `useState` hooks for local state
- React `useEffect` hooks for side effects
- Supabase real-time subscriptions for auth state
- Local storage for user preferences

---

## 13. DEPLOYMENT & HOSTING

### 13.1 Frontend Hosting
- **Platform:** Netlify (recommended) or Vercel
- **Build Command:** `npm run build`
- **Output Directory:** `dist/`
- **Environment Variables Required:**
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

### 13.2 Backend Services
- **Platform:** Supabase
- **Services Used:**
  - PostgreSQL Database
  - Authentication
  - Edge Functions
  - Storage (for future features)

### 13.3 Domain Configuration
- Custom domain support
- SSL certificates (automatic)
- DNS configuration
- Redirects handled

### 13.4 Environment Variables

#### Frontend (.env)
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

#### Edge Functions (Supabase Secrets)
```
OPENAI_API_KEY=your_openai_key
RESEND_API_KEY=your_resend_key
STRIPE_SECRET_KEY=your_stripe_secret
STRIPE_WEBHOOK_SECRET=your_webhook_secret
OPENWEATHER_API_KEY=your_weather_api_key
```

---

## 14. SECURITY FEATURES SUMMARY

### 14.1 Data Security
- Row Level Security on all tables
- User data isolation
- Encrypted connections (SSL/TLS)
- Secure password hashing (Supabase Auth)
- JWT token authentication

### 14.2 API Security
- API keys stored in secure secrets
- CORS protection
- Rate limiting (Supabase built-in)
- Webhook signature verification (Stripe)
- Input validation and sanitization

### 14.3 Session Security
- Single-device enforcement
- Automatic session expiration
- Device fingerprinting
- Session activity tracking
- Secure token storage

### 14.4 Payment Security
- PCI compliance via Stripe
- No card data stored locally
- Secure webhook handling
- Customer data encryption

---

## 15. MONITORING & ANALYTICS

### 15.1 User Analytics
- User registration tracking
- Login frequency
- Feature usage metrics
- Subscription conversion rates
- Churn analysis

### 15.2 System Monitoring
- Edge function execution logs
- Database query performance
- API response times
- Error tracking
- Email delivery rates

### 15.3 Business Metrics
- Monthly Recurring Revenue (MRR)
- Active subscriber count
- Trial conversion rate
- Customer Lifetime Value (CLV)
- Feature adoption rates

---

## 16. FUTURE ENHANCEMENT OPPORTUNITIES

### 16.1 Potential Features
- Mobile app (iOS/Android)
- Push notifications
- Advanced weather models
- Historical weather data analysis
- Crop-specific recommendations
- Multi-farm management
- Team collaboration features
- Weather station integration
- Satellite imagery
- Pest prediction models

### 16.2 API Integrations
- Additional weather data providers
- Commodity price feeds
- Market data integration
- Government agricultural APIs
- Machinery IoT integration
- Drone imagery processing

### 16.3 AI Enhancements
- Computer vision for crop health
- Predictive yield modeling
- Automated anomaly detection
- Natural language query interface
- Voice assistant integration
- Multilingual support

---

## 17. SUPPORT & MAINTENANCE

### 17.1 Database Maintenance
- Regular backup schedule
- Migration version control
- Performance optimization
- Index maintenance
- Session cleanup automation

### 17.2 Code Maintenance
- TypeScript type safety
- ESLint code quality checks
- Component modularity
- Comprehensive error handling
- Logging and debugging

### 17.3 User Support
- In-app help documentation
- Email support system
- FAQ section (to be added)
- Video tutorials (to be added)
- Community forum (to be added)

---

## 18. TECHNICAL SPECIFICATIONS

### 18.1 Performance
- Lighthouse score optimization
- Code splitting
- Lazy loading
- Image optimization
- Caching strategies

### 18.2 Accessibility
- WCAG compliance considerations
- Keyboard navigation
- Screen reader support
- Color contrast ratios
- Semantic HTML

### 18.3 Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile responsive design
- Progressive Web App (PWA) ready
- Offline capability (partial)

### 18.4 API Rate Limits
- OpenWeatherMap: Based on plan
- OpenAI: Token-based billing
- Resend: Email sending limits
- Stripe: No hard limits
- Supabase: Based on plan

---

## APPENDIX A: API ENDPOINTS

### Weather API
- `GET /functions/v1/weather?lat={lat}&lon={lon}` - Fetch weather data

### Farmer Joe AI
- `POST /functions/v1/farmer-joe` - Send chat message
  - Body: `{ message, location, weather, imageBase64? }`

### Stripe Integration
- `POST /functions/v1/create-checkout-session` - Start subscription
  - Body: `{ priceId }`
- `POST /functions/v1/create-customer-portal-session` - Manage subscription
  - Body: `{ customerId }`
- `POST /functions/v1/stripe-webhook` - Webhook receiver

### Email Functions
- `POST /functions/v1/send-welcome-email` - Trigger welcome email
- `POST /functions/v1/send-daily-forecast` - Trigger daily forecast
- `POST /functions/v1/send-weekly-probe-report` - Trigger probe report

---

## APPENDIX B: DATABASE MIGRATIONS

Total migrations: 28 files
- Initial schema setup
- Probe API tables
- Notifications system
- User roles and permissions
- Email subscriptions
- Session management
- Farmer Joe chat
- Security fixes
- Performance optimizations

All migrations include:
- Detailed comments
- RLS policies
- Indexes for performance
- Foreign key constraints
- Default values
- Timestamp tracking

---

## APPENDIX C: THIRD-PARTY SERVICES

### Required Services:
1. **Supabase** - Database, Auth, Edge Functions
2. **OpenWeatherMap** - Weather data API
3. **OpenAI** - GPT-4 for Farmer Joe
4. **Resend** - Transactional emails
5. **Stripe** - Payment processing

### Optional Services:
- Analytics platform (Google Analytics, Mixpanel)
- Error tracking (Sentry)
- Customer support (Intercom, Zendesk)
- SMS notifications (Twilio)

---

## CONTACT & SUPPORT

For technical questions or feature requests, developers should reference:
- Database schema documentation
- Edge function source code
- Component prop definitions
- TypeScript type definitions
- Migration files for schema details

This documentation represents the complete feature set of FarmCast as of March 2026.
