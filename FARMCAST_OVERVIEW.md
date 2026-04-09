# FarmCast — Product & Business Overview

**Weather Intelligence for Modern Farming**

---

## What Is FarmCast?

FarmCast is an agricultural weather intelligence platform that gives farmers the right information, at the right time, to make better decisions in the field. Unlike generic weather apps, FarmCast is built specifically for farming — translating raw weather data into clear, actionable guidance on when to spray, plant, irrigate, and more.

The platform combines real-time weather forecasting, AI-powered advice, soil moisture monitoring, and automated email alerts into a single, easy-to-use product designed for farmers of all scales.

---

## The Problem We Solve

Farmers lose significant time and money every season due to poor timing decisions — spraying in the wrong conditions causes chemical drift and wasted product, planting in unfavourable soil leads to poor germination, and missing ideal weather windows reduces yield.

Existing weather apps are built for the general public. They don't speak the language of agriculture. FarmCast does.

---

## Core Features

### Real-Time Spray Condition Calculator
The flagship feature. FarmCast analyses four key variables — temperature, wind speed, humidity, and rainfall probability — and returns a clear, colour-coded spray rating: Excellent, Good, Fair, Poor, or Unsuitable. It also calculates Delta-T (the difference between air temperature and dew point), which is the industry-standard measure for safe pesticide application.

Farmers can see their best spray window for the day at a glance, with hour-by-hour breakdowns.

### 7-Day Agricultural Forecast
A full week of weather data presented through a farming lens — not just temperatures and rain, but what those conditions mean for spray days, planting suitability, and irrigation needs. An interactive forecast graph allows users to visualise trends across temperature, humidity, wind, and rainfall probability.

### Farmer Joe — AI Farming Assistant
Farmer Joe is FarmCast's built-in AI assistant, powered by OpenAI's GPT-4o. Farmers can ask anything — pest identification from a photo, advice on a disease outbreak, chemical recommendations, or general farming Q&A. Farmer Joe has access to the user's real-time local weather data, making its responses context-aware and immediately relevant.

Key capabilities:
- **Photo-based pest and disease identification** — upload a photo, get an ID and treatment plan
- **Weather-aware recommendations** — advice accounts for current and forecast conditions
- **Chemical and treatment suggestions** tailored to the situation
- **Unlimited questions** for premium subscribers

### Live Rain Radar
An interactive, animated rain radar map powered by RainViewer, allowing farmers to track incoming rainfall in real time — directly within the app.

### Daily Forecast Emails
Premium subscribers receive a personalised daily weather email at 7 AM, tailored to their saved farm location. Each email includes:
- Current conditions and today's spray rating
- Best spray window for the day
- Delta-T analysis
- 5-day forecast summary
- Planting and irrigation recommendations
- Soil probe data and AI-generated soil health analysis (where probes are connected)

### Soil Moisture Probe Integration
FarmCast connects to leading soil moisture monitoring systems, pulling live sensor data directly into the platform. Supported providers include:

- FieldClimate
- John Deere Operations Center
- CropX
- Sentek
- AquaCheck
- Wildeye

Users can also import historical data via CSV or automated email forwarding. Probe data feeds into daily emails and weekly soil health reports, with AI interpretation from Farmer Joe.

### Weekly Soil Health Reports
Users with connected moisture probes receive a weekly AI-generated soil health report, covering 7-day temperature and moisture trends at multiple soil depths, with plain-English recommendations on irrigation and soil management.

### Weather Alerts & Notification Centre
FarmCast monitors conditions continuously and sends in-app alerts for frost risk, hail warnings, storm events, heat waves, and disease pressure windows. Users are notified with severity-rated alerts (Warning, Caution, Info) so they can act before conditions deteriorate.

### Saved Locations & GPS
Farmers can save multiple farm locations and switch between them instantly. GPS auto-location is supported for convenience on the go.

---

## Subscription Model

FarmCast operates on a freemium model with a generous trial period to drive adoption.

| Tier | Price | Features |
|---|---|---|
| Free / Guest | No cost | Full weather data, spray calculator, 3 AI questions |
| Premium | $5.99/month | Unlimited AI, daily emails, probe integration, weekly reports, extended forecast, priority support |
| Trial | 1 month free | Full premium access, automatically applied on signup |

Payments are processed securely via Stripe with monthly recurring billing. Users can cancel at any time.

---

## Technology Platform

FarmCast is a fully cloud-based web application, accessible on any device — desktop, tablet, or mobile browser — with no download required. A native mobile app is planned for iOS and Android.

**Built on:**
- React + TypeScript front end (Vite)
- Supabase backend (PostgreSQL database, authentication, serverless functions)
- OpenWeather API for weather data
- OpenAI GPT-4o for AI features
- Stripe for subscription billing
- Resend for transactional email delivery
- RainViewer for radar visualisation

The architecture is designed to scale — the same infrastructure that serves 100 users can serve 100,000.

**Estimated infrastructure cost at scale:**
- 1,000 users: ~$100–150/month
- 10,000 users: ~$800–1,200/month

This gives FarmCast strong unit economics, with subscription revenue comfortably covering operational costs at relatively low user volumes.

---

## Target Market

**Primary audience:** Grain, horticultural, and mixed farming operations across Australia and internationally. Any operation that applies chemical sprays, manages irrigation, or makes time-sensitive decisions based on weather is a potential user.

**Secondary audience:** Agronomists and farm consultants who advise multiple properties — FarmCast's multi-location support and AI tools make it a valuable professional tool.

**Geographic focus:** Initially Australia, with international scalability built in from day one (global geocoding, metric and imperial unit support, timezone-aware emails).

The global precision agriculture market is valued at over USD $10 billion and growing at approximately 12% per year, driven by demand for data-driven farm management tools.

---

## Competitive Advantages

**1. Built specifically for farmers.** FarmCast doesn't adapt a consumer weather app — it's built from the ground up for agricultural decision-making.

**2. Spray condition intelligence.** The spray calculator and Delta-T analysis are features most farmers currently calculate manually or don't use at all. FarmCast makes this instant and automatic.

**3. AI that understands farming context.** Farmer Joe knows the user's local weather when answering questions — making it significantly more useful than a general-purpose chatbot.

**4. Probe integration.** Connecting soil sensor data with weather forecasting and AI interpretation is a differentiated capability with high switching costs once adopted.

**5. Automated email intelligence.** A daily personalised farming brief delivered to the inbox is a high-value, sticky feature that keeps users engaged even when they're not actively in the app.

**6. Low cost to entry.** Free access to core features reduces friction for farmer adoption — a demographic known for being practical and value-focused.

---

## Partnership Opportunities

FarmCast is well-positioned to partner with organisations across the agricultural supply chain.

**Agrochemical companies** — Integration of product-specific spray guidelines, branded advice within the AI assistant, co-marketing to shared customer bases.

**Irrigation and equipment suppliers** — FarmCast's irrigation recommendations and probe integrations create natural alignment with hardware providers (pumps, sensors, controllers).

**Soil moisture probe manufacturers** — FarmCast already supports multiple probe brands. Formal partnerships could include white-labelling, co-development, or bundled subscriptions with hardware purchases.

**Farm management software providers** — Data sharing integrations with platforms like Agworld, AgriWebb, or FMIS providers to embed FarmCast weather intelligence into existing farm management workflows.

**Agricultural lenders and insurers** — Weather data and spray records could support risk assessment and compliance documentation for insurers and financial institutions serving the farming sector.

**Fertiliser and seed companies** — Planting condition data and AI-powered agronomy advice create engagement opportunities for crop input suppliers at the point of decision-making.

**Telecommunications providers** — Rural connectivity is a shared challenge. Co-marketing or bundled offers with telcos serving agricultural regions could accelerate user acquisition.

**Grain marketing and commodity platforms** — Integration with trading platforms to combine weather risk data with price decision tools.

---

## Current Status

FarmCast is a fully functional, production-ready platform. Core features are live and operational:

- Weather intelligence and spray condition analysis
- AI assistant (Farmer Joe) with photo analysis
- Daily email forecast system
- Soil moisture probe integration (6 providers)
- Subscription billing and user management
- Admin dashboard for user and system management
- Full authentication and user account system

The platform is actively in use and ready for commercial scale-up.

---

## Roadmap

- Native iOS and Android mobile apps (push notifications, home screen widgets, offline mode)
- Crop-specific advice and tracking (paddock-level management)
- Field mapping and zone management
- Historical weather data and seasonal trend analysis
- Custom alert thresholds per farm
- Multi-language support
- Integration with farm management software platforms
- Satellite imagery and NDVI overlays
- Pest and disease outbreak prediction models

---

## Contact

For partnership enquiries, investor discussions, or product demonstrations, please reach out to the FarmCast team.

**support@farmcast.app**

---

*FarmCast — Smarter decisions, every season.*
