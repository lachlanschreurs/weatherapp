// ─── Google Ads Conversion Tracking ────────────────────────────────────────
//
// PASTE YOUR VALUES HERE:
export const GOOGLE_ADS_CONVERSION_ID    = 'AW-18083468482';
export const GOOGLE_ADS_CONVERSION_LABEL = 'K8PUCMSP_JwcEMKp765D';
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
    value: 1.0,
    currency: 'AUD',
  });

  sessionStorage.setItem(FIRED_KEY, '1');
}

export function clearConversionFlag(): void {
  sessionStorage.removeItem(FIRED_KEY);
}
