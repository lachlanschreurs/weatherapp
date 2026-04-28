import { X, Info, ChevronDown, ChevronUp, Wifi, BookOpen, HelpCircle, Droplets, Wind, Activity, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

// --- Explainer content for "How is this calculated?" popups ---

export interface ExplainerContent {
  title: string;
  summary: string;
  dataUsed: string[];
  variables: string[];
  assumptions: string[];
  localVariation: string;
  example?: string;
  confidence?: string;
}

export const explainers: Record<string, ExplainerContent> = {
  irrigation: {
    title: 'Irrigation Recommendation',
    summary: 'This recommendation combines forecast temperature, expected rainfall, rain probability, humidity, wind conditions, and available soil moisture data from connected probes.',
    dataUsed: [
      'Forecast maximum and minimum temperature',
      'Expected rainfall amount and probability',
      'Current and forecast humidity',
      'Wind speed and evapotranspiration (ETo)',
      'Live soil moisture (if probe connected)',
    ],
    variables: [
      'Rainfall above 10mm cancels irrigation need',
      'High temperatures (above 28C) increase irrigation urgency',
      'Low humidity (below 40%) increases evaporation losses',
      'Wind speed affects spray drift and evaporation rates',
    ],
    assumptions: [
      'Assumes a general broadacre cropping system',
      'Does not account for specific crop water requirements',
      'Default soil water holding capacity is used without probe data',
      'Irrigation efficiency is assumed at a standard rate',
    ],
    localVariation: 'Soil type, crop rooting depth, irrigation system efficiency, and field slope can all change final on-farm requirements. Sandy soils drain faster and need more frequent lighter applications; clay soils retain moisture longer.',
    example: 'FarmCast may suggest 5mm, but heavier soils may require less depending on retention. Sandy soils in the same conditions might need 8mm applied more frequently.',
  },
  sprayWindow: {
    title: 'Spray Window',
    summary: 'Spray windows are calculated by evaluating wind speed, rainfall probability, Delta T, and temperature across each forecast hour to find the best continuous period for safe and effective spraying.',
    dataUsed: [
      'Hourly wind speed and gusts',
      'Hourly rainfall probability and actual rain',
      'Delta T (dry-bulb minus wet-bulb temperature)',
      'Air temperature',
    ],
    variables: [
      'Wind between 3-15 km/h is ideal (reduces drift while maintaining coverage)',
      'Delta T between 2-8 is acceptable, 4-6 is excellent',
      'No rain or high rain probability during the window',
      'Temperature between 10-30C for chemical efficacy',
    ],
    assumptions: [
      'Based on general agricultural spray guidelines',
      'Does not account for specific chemical label requirements',
      'Assumes ground-level application (not aerial)',
      'Local terrain effects on wind are not modelled',
    ],
    localVariation: 'Hilltops, valleys, and coastal areas can experience very different wind patterns to forecast models. Always check local conditions before spraying. Some chemicals have stricter wind and temperature limits than the general guidelines used here.',
    example: 'A "Good" window from 6:00 AM to 10:00 AM means conditions are forecast to be within safe spray parameters. Always verify at the paddock before starting.',
  },
  deltaT: {
    title: 'Delta T',
    summary: 'Delta T is the difference between the air (dry-bulb) temperature and the wet-bulb temperature. It indicates how quickly spray droplets will evaporate, which directly affects spray coverage and drift risk.',
    dataUsed: [
      'Current air temperature (dry-bulb)',
      'Current relative humidity',
      'Calculated using Stull\'s wet-bulb approximation formula',
    ],
    variables: [
      'Below 2: Temperature inversion likely, droplets hang in the air and drift',
      '2-4: Marginal, monitor closely before spraying',
      '4-6: Ideal spraying conditions, good droplet life',
      '6-8: Rising evaporation, smaller droplets evaporate before reaching target',
      'Above 8: Too dry, significant product loss through evaporation',
    ],
    assumptions: [
      'Uses standard atmospheric pressure assumptions',
      'Humidity and temperature measured at weather station height',
      'Microclimate at paddock level may differ from station reading',
    ],
    localVariation: 'Paddock-level conditions can differ from weather station data. Sheltered valleys may have inversions when nearby hills do not. Irrigated fields and dams can raise local humidity, changing Delta T readings.',
    example: 'A Delta T of 5.2 is rated "Excellent" meaning spray droplets will have good life and minimal drift. Conditions below 2 often occur in early morning temperature inversions.',
  },
  planting: {
    title: 'Planting Conditions',
    summary: 'Planting suitability is scored using temperature, rainfall, wind speed, humidity, and the following day\'s forecast. A composite score rates each day as Excellent, Good, or Fair.',
    dataUsed: [
      'Maximum and minimum temperature',
      'Expected rainfall amount',
      'Wind speed',
      'Humidity percentage',
      'Next-day weather outlook',
    ],
    variables: [
      'Temperature 15-28C scores highest (ideal germination range)',
      'Less than 2mm rainfall scores highest (dry enough to work soil)',
      'Wind below 20 km/h supports accurate seeding',
      'Humidity 40-70% indicates good soil moisture conditions',
      'Dry next-day forecast means seedbed won\'t be disturbed',
    ],
    assumptions: [
      'Based on general broadacre planting conditions',
      'Does not account for specific crop germination requirements',
      'Soil workability depends on recent rainfall history not modelled',
      'Soil temperature is estimated from air temperature',
    ],
    localVariation: 'Different crops have different optimal planting windows. Root crops tolerate cooler soils than summer cereals. Clay soils need longer drying time after rain before they are workable.',
  },
  diseaseRisk: {
    title: 'Disease Pressure Alert',
    summary: 'Disease alerts are triggered when weather conditions favour fungal and bacterial pathogens over multiple consecutive days. The combination of moderate warmth and high moisture creates ideal conditions for disease establishment.',
    dataUsed: [
      'Average daily temperature over recent days',
      'Relative humidity levels',
      'Rainfall amounts and duration',
      'Number of consecutive "damp" days',
    ],
    variables: [
      'Temperature between 14-26C: optimal range for most crop pathogens',
      'Humidity above 75%: leaf wetness supports spore germination',
      'Rainfall: extends wet period on plant surfaces',
      'Three or more consecutive qualifying days triggers alert',
    ],
    assumptions: [
      'Uses general crop pathogen thresholds, not specific diseases',
      'Leaf wetness is estimated from humidity, not directly measured',
      'Does not account for crop variety resistance',
      'Fungicide residual protection is not considered',
    ],
    localVariation: 'Disease pressure varies enormously by crop, variety, growth stage, and paddock history. Low-lying paddocks with poor air movement are at higher risk. Recently sprayed crops have residual protection not accounted for here.',
    example: 'Three days of 20C average with 80% humidity would trigger an alert. Crops in active growth stages during these conditions are most vulnerable.',
  },
  soilMoisture: {
    title: 'Soil Moisture',
    summary: 'Without a connected probe, soil moisture is estimated using rainfall probability, air temperature, and general seasonal patterns. With a connected probe, live readings from your paddock replace the estimate entirely.',
    dataUsed: [
      'Rainfall probability from forecast',
      'Current air temperature',
      'Live soil moisture sensor readings (if probe connected)',
    ],
    variables: [
      'Higher rainfall probability increases estimated moisture',
      'Higher temperatures reduce estimated moisture through evaporation',
      'Probe readings provide actual volumetric water content',
    ],
    assumptions: [
      'Estimated values assume a medium-textured loam soil',
      'Does not account for recent irrigation events',
      'Drainage and runoff are not modelled in estimates',
      'Probe readings are taken at sensor depth only',
    ],
    localVariation: 'Soil moisture varies dramatically by soil type, depth, slope position, and management history. Sandy soils drain quickly; heavy clays retain moisture longer. A connected probe provides far more accurate data than estimates.',
    example: 'An estimated 35% may be accurate for a loam but could be 20% on a sand or 50% on a clay in identical weather conditions. Connect a probe for reliable readings.',
  },
  forecastConfidence: {
    title: 'Forecast Confidence',
    summary: 'Confidence reflects how certain the weather model is about upcoming conditions. Clear, stable weather patterns produce high confidence. Unstable patterns with rain and wind shifts reduce confidence.',
    dataUsed: [
      'Rainfall probability distribution across hours',
      'Consistency of wind direction and speed',
      'Model agreement on precipitation timing',
    ],
    variables: [
      'Clear skies and stable pressure: high confidence',
      'Moderate rain probability (30-60%): reduced confidence',
      'Multiple weather systems interacting: lower confidence',
    ],
    assumptions: [
      'Based on OpenWeather model output',
      'Confidence naturally decreases with forecast distance',
      'Does not incorporate multiple model ensembles',
    ],
    localVariation: 'Coastal, mountain, and inland areas can have very different forecast accuracy. Localised storms and sea breezes are harder for models to predict than broad weather systems.',
  },
};

// --- ExplainerModal component ---

interface ExplainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  explainerKey: string;
}

export function ExplainerModal({ isOpen, onClose, explainerKey }: ExplainerModalProps) {
  const content = explainers[explainerKey];
  if (!isOpen || !content) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border border-slate-600/60 bg-slate-900 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 bg-slate-900 border-b border-slate-700/50 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-green-600/20 border border-green-500/30 flex items-center justify-center">
              <HelpCircle className="w-4 h-4 text-green-400" />
            </div>
            <h2 className="text-base font-bold text-white">{content.title}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          <p className="text-sm text-slate-300 leading-relaxed">{content.summary}</p>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-green-400 mb-2">Data Used</h3>
            <ul className="space-y-1.5">
              {content.dataUsed.map((item, i) => (
                <li key={i} className="text-sm text-slate-400 flex items-start gap-2">
                  <span className="text-green-500 mt-1 flex-shrink-0">-</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-sky-400 mb-2">Key Variables</h3>
            <ul className="space-y-1.5">
              {content.variables.map((item, i) => (
                <li key={i} className="text-sm text-slate-400 flex items-start gap-2">
                  <span className="text-sky-500 mt-1 flex-shrink-0">-</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">Assumptions</h3>
            <ul className="space-y-1.5">
              {content.assumptions.map((item, i) => (
                <li key={i} className="text-sm text-slate-400 flex items-start gap-2">
                  <span className="text-amber-500 mt-1 flex-shrink-0">-</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl bg-slate-800/60 border border-slate-700/40 p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">Why Results May Vary</h3>
            <p className="text-sm text-slate-400 leading-relaxed">{content.localVariation}</p>
          </div>

          {content.example && (
            <div className="rounded-xl bg-green-950/30 border border-green-600/20 p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-green-400 mb-2">Example</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{content.example}</p>
            </div>
          )}

          <div className="rounded-xl bg-amber-950/20 border border-amber-600/20 p-4">
            <p className="text-xs text-amber-300/80 leading-relaxed">
              FarmCast is a guide, not a replacement for local farm knowledge. Final decisions should always consider your specific soil, crop, equipment, and paddock conditions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Info button used next to headings ---

interface InfoButtonProps {
  onClick: () => void;
  label?: string;
}

export function InfoButton({ onClick, label = 'How is this calculated?' }: InfoButtonProps) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-green-400 transition-colors group"
      title={label}
    >
      <Info className="w-3.5 h-3.5 group-hover:text-green-400 transition-colors" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

// --- Trust disclaimer shown under recommendations ---

export function TrustDisclaimer() {
  return (
    <p className="text-xs text-slate-600 leading-relaxed mt-3 px-1">
      FarmCast combines forecast models, environmental data and available sensor inputs to provide practical farm guidance. Final decisions should always consider local conditions.
    </p>
  );
}

// --- Understanding FarmCast section with expandable fact sheets ---

interface FactSheetItem {
  title: string;
  icon: React.ReactNode;
  content: string[];
}

const factSheets: FactSheetItem[] = [
  {
    title: 'How irrigation recommendations work',
    icon: <Droplets className="w-4 h-4" />,
    content: [
      'FarmCast looks at the forecast temperature, expected rainfall, humidity, and wind to estimate how much water your crops will lose each day through evapotranspiration.',
      'If rain is forecast (10mm or more), irrigation is skipped. If temperatures are high and humidity is low, FarmCast increases the irrigation suggestion.',
      'When a soil moisture probe is connected, FarmCast uses live readings instead of estimates for a much more accurate picture of actual paddock conditions.',
      'The recommendation is a starting point. Your soil type, crop stage, irrigation system efficiency, and field layout all affect the real requirement. Sandy soils need more frequent, lighter applications. Heavy clays hold moisture longer.',
    ],
  },
  {
    title: 'How spray conditions are calculated',
    icon: <Wind className="w-4 h-4" />,
    content: [
      'FarmCast evaluates wind speed, wind gusts, rainfall probability, and Delta T across every forecast hour to find continuous windows where conditions are suitable for spraying.',
      'Ideal conditions are wind between 3-15 km/h (enough to carry spray but not cause drift), no rain expected, and Delta T between 4-6 degrees.',
      'Wind above 25 km/h or active rainfall makes spraying unsuitable. Wind between 15-25 km/h is rated as moderate — you may spray with appropriate nozzle selection and caution.',
      'Always check your specific chemical label requirements. Some products have stricter conditions than the general guidelines used here.',
    ],
  },
  {
    title: 'How Delta T is used',
    icon: <Activity className="w-4 h-4" />,
    content: [
      'Delta T measures the difference between the dry-bulb temperature and the wet-bulb temperature. It tells you how fast spray droplets will evaporate.',
      'A low Delta T (below 2) usually means a temperature inversion. Spray droplets hang in the air instead of settling, causing drift to non-target areas.',
      'A high Delta T (above 8) means the air is very dry. Small spray droplets evaporate before reaching the plant, reducing product efficacy.',
      'The sweet spot is 4-6 degrees. FarmCast calculates this in real time from temperature and humidity, and highlights it clearly so you can plan spray operations with confidence.',
    ],
  },
  {
    title: 'How disease alerts are generated',
    icon: <AlertTriangle className="w-4 h-4" />,
    content: [
      'Most crop diseases thrive in warm, humid conditions. FarmCast monitors for stretches of days where the average temperature is 14-26 degrees C and humidity stays above 75%.',
      'When three or more consecutive days meet these conditions, a disease pressure alert is triggered. This is a general indicator — specific diseases have different optimal ranges.',
      'The alert does not mean your crop is infected. It means weather conditions favour pathogen development and you should consider scouting or preventative fungicide applications.',
      'Paddock history, crop variety resistance, and previous spray programs all affect actual disease risk. FarmCast provides the weather signal; your local knowledge provides the context.',
    ],
  },
  {
    title: 'How forecast confidence works',
    icon: <BookOpen className="w-4 h-4" />,
    content: [
      'Weather forecast accuracy depends on how stable the atmosphere is. Clear, high-pressure systems are very predictable. Fronts, troughs, and unstable air masses are harder to forecast precisely.',
      'FarmCast rates confidence based on the rainfall probability pattern. When the model is confident in dry weather, confidence is high. Mixed signals reduce confidence.',
      'Confidence naturally decreases the further ahead you look. Today and tomorrow are usually reliable. Beyond 3 days, use forecasts as general guidance.',
      'Days 9-30 in the extended forecast use historical climate averages for your location, not real-time models. They show what is typical for the time of year, not a prediction.',
    ],
  },
  {
    title: 'How soil moisture integrations work',
    icon: <Wifi className="w-4 h-4" />,
    content: [
      'Without a connected probe, FarmCast estimates soil moisture using rainfall forecasts and air temperature. This gives a rough guide but cannot account for your specific soil type or drainage.',
      'When you connect a moisture probe through FieldClimate or a compatible provider, FarmCast replaces estimates with live readings from your actual paddock.',
      'Live probe data makes irrigation recommendations significantly more accurate because it measures real conditions at root depth, not weather-based guesses.',
      'If you are managing irrigation on valuable crops, connecting a probe is the single biggest improvement you can make to FarmCast accuracy.',
    ],
  },
];

export function UnderstandingFarmCast() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="rounded-2xl border border-slate-700/60 bg-slate-900/70 backdrop-blur-sm shadow-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-700/50 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-green-600/20 border border-green-500/30 flex items-center justify-center">
          <BookOpen className="w-4 h-4 text-green-400" />
        </div>
        <div>
          <h2 className="text-base font-bold text-white">Understanding FarmCast</h2>
          <p className="text-xs text-slate-500 mt-0.5">Learn how recommendations are generated</p>
        </div>
      </div>
      <div className="divide-y divide-slate-700/40">
        {factSheets.map((sheet, index) => (
          <div key={index}>
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-800/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="text-green-400 flex-shrink-0">{sheet.icon}</div>
                <span className="text-sm font-semibold text-slate-200 text-left">{sheet.title}</span>
              </div>
              {openIndex === index
                ? <ChevronUp className="w-4 h-4 text-slate-500 flex-shrink-0" />
                : <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0" />}
            </button>
            {openIndex === index && (
              <div className="px-6 pb-5 space-y-3">
                {sheet.content.map((paragraph, i) => (
                  <p key={i} className="text-sm text-slate-400 leading-relaxed pl-7">{paragraph}</p>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Connect Your Farm Sensors page/modal ---

const connectionSteps = [
  {
    step: 1,
    title: 'Find your provider',
    description: 'Identify the company that supplied your weather station or soil moisture probe. Common providers include FieldClimate (Pessl Instruments), Metos, and Davis Instruments.',
  },
  {
    step: 2,
    title: 'Request API access',
    description: 'Contact your provider and ask for API access credentials. You will need a Station ID and an API Key (sometimes called a token or secret). Use the email template below if you are unsure what to ask for.',
  },
  {
    step: 3,
    title: 'Enter credentials in FarmCast',
    description: 'Open the Probe Connection section in FarmCast, select your provider, and enter the Station ID and API Key. FarmCast will verify the connection and start pulling live data.',
  },
  {
    step: 4,
    title: 'Verify data is flowing',
    description: 'Once connected, you will see live soil moisture, soil temperature, and rainfall readings in your dashboard. Estimated values will be replaced with actual readings.',
  },
];

const emailTemplate = `Hi,

I would like API access details for my weather station / soil moisture probe so I can connect it to FarmCast for real-time monitoring.

Please provide:
- Station ID
- API Key (or access token)
- Any required connection details or documentation

My station is located at: [YOUR LOCATION]
Station model: [YOUR MODEL IF KNOWN]

Thank you.`;

interface ConnectSensorsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ConnectSensorsModal({ isOpen, onClose }: ConnectSensorsModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(emailTemplate).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-slate-600/60 bg-slate-900 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 bg-slate-900 border-b border-slate-700/50 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-green-600/20 border border-green-500/30 flex items-center justify-center">
              <Wifi className="w-4 h-4 text-green-400" />
            </div>
            <h2 className="text-base font-bold text-white">Connect Your Farm Sensors</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-white mb-2">What is an API?</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              An API (Application Programming Interface) is simply a way for FarmCast to talk to your weather station or soil probe automatically. Instead of you reading a screen and typing numbers in, FarmCast connects directly and pulls live data every hour. You set it up once and it runs in the background.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-bold text-white mb-2">Why connect a probe?</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                'Replace estimated soil moisture with real measurements',
                'Get accurate soil temperature at root depth',
                'Improve irrigation recommendations significantly',
                'Track rainfall at your actual paddock, not the nearest town',
              ].map((benefit, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-slate-400">
                  <span className="text-green-500 mt-0.5 flex-shrink-0">+</span>
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-white mb-2">Compatible Providers</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { name: 'FieldClimate', note: 'Pessl Instruments' },
                { name: 'Metos', note: 'iMETOS stations' },
                { name: 'Other providers', note: 'Contact us to check' },
              ].map((provider, i) => (
                <div key={i} className="rounded-xl bg-slate-800/60 border border-slate-700/40 p-3 text-center">
                  <div className="text-sm font-bold text-white">{provider.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{provider.note}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-white mb-3">Step-by-step setup</h3>
            <div className="space-y-3">
              {connectionSteps.map((step) => (
                <div key={step.step} className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-green-600/20 border border-green-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-green-400">{step.step}</span>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-200">{step.title}</div>
                    <p className="text-sm text-slate-400 mt-0.5 leading-relaxed">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-white mb-2">Email template for your provider</h3>
            <p className="text-xs text-slate-500 mb-3">Copy this and send it to your weather station or probe supplier.</p>
            <div className="rounded-xl bg-slate-800/60 border border-slate-700/40 p-4 relative">
              <pre className="text-sm text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">{emailTemplate}</pre>
              <button
                onClick={handleCopy}
                className="absolute top-3 right-3 text-xs font-bold px-3 py-1.5 rounded-lg bg-green-600/20 text-green-400 border border-green-500/30 hover:bg-green-600/30 transition-colors"
              >
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="rounded-xl bg-amber-950/20 border border-amber-600/20 p-4">
            <p className="text-xs text-amber-300/80 leading-relaxed">
              Need help connecting? Contact us at <a href="mailto:support@farmcastweather.com" className="text-amber-400 underline hover:text-amber-300 transition-colors">support@farmcastweather.com</a> and we can walk you through the process for your specific station.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
