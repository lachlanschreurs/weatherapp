// ─── Google Ads Conversion Tracking ────────────────────────────────────────
//
// PASTE YOUR VALUES HERE:
export const GOOGLE_ADS_CONVERSION_ID    = 'AW-18083468482';       // <-- your Conversion ID
export const GOOGLE_ADS_CONVERSION_LABEL = 'OE7gCOTUQzweEMKp765D'; // <-- your Conversion Label
//
// ─────────────────────────────────────────────────────────────────────────────

const FIRED_KEY = 'farmcast_ads_conversion_fired';

export function fireSubscriptionConversion(): void {
  if (typeof window === 'undefined') return;

  if (sessionStorage.getItem(FIRED_KEY)) return;

  const gtag = (window as any).gtag;
  if (typeof gtag !== 'function') return;

  gtag('event', 'conversion', {
    send_to: `${GOOGLE_ADS_CONVERSION_ID}/${GOOGLE_ADS_CONVERSION_LABEL}`,
  });

  sessionStorage.setItem(FIRED_KEY, '1');
}

export function clearConversionFlag(): void {
  sessionStorage.removeItem(FIRED_KEY);
}
