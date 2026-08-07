/**
 * Country and currency reference data. ISO codes only — display names are
 * localized at render time via Intl.DisplayNames, so nothing here needs
 * translating.
 */

export const COUNTRIES: string[] = [
  "US", "CA", "GB", "IE", "AU", "NZ",
  "DE", "FR", "ES", "PT", "IT", "NL", "BE", "AT", "CH", "LU",
  "SE", "NO", "DK", "FI", "IS",
  "PL", "CZ", "SK", "HU", "RO", "BG", "GR", "HR", "SI", "RS", "UA", "LT", "LV", "EE",
  "MX", "BR", "AR", "CL", "CO", "PE", "UY", "CR", "PA", "DO",
  "AE", "SA", "QA", "KW", "BH", "OM", "IL", "TR", "EG", "MA", "TN", "JO",
  "ZA", "NG", "KE", "GH",
  "IN", "PK", "BD", "LK", "NP",
  "SG", "MY", "TH", "VN", "PH", "ID", "HK", "TW", "JP", "KR", "CN",
  "KZ", "UZ", "KG", "GE", "AM", "AZ",
];

export const COUNTRY_CURRENCY: Record<string, string> = {
  US: "USD", CA: "CAD", GB: "GBP", IE: "EUR", AU: "AUD", NZ: "NZD",
  DE: "EUR", FR: "EUR", ES: "EUR", PT: "EUR", IT: "EUR", NL: "EUR",
  BE: "EUR", AT: "EUR", CH: "CHF", LU: "EUR",
  SE: "SEK", NO: "NOK", DK: "DKK", FI: "EUR", IS: "ISK",
  PL: "PLN", CZ: "CZK", SK: "EUR", HU: "HUF", RO: "RON", BG: "BGN",
  GR: "EUR", HR: "EUR", SI: "EUR", RS: "RSD", UA: "UAH",
  LT: "EUR", LV: "EUR", EE: "EUR",
  MX: "MXN", BR: "BRL", AR: "ARS", CL: "CLP", CO: "COP", PE: "PEN",
  UY: "UYU", CR: "CRC", PA: "USD", DO: "DOP",
  AE: "AED", SA: "SAR", QA: "QAR", KW: "KWD", BH: "BHD", OM: "OMR",
  IL: "ILS", TR: "TRY", EG: "EGP", MA: "MAD", TN: "TND", JO: "JOD",
  ZA: "ZAR", NG: "NGN", KE: "KES", GH: "GHS",
  IN: "INR", PK: "PKR", BD: "BDT", LK: "LKR", NP: "NPR",
  SG: "SGD", MY: "MYR", TH: "THB", VN: "VND", PH: "PHP", ID: "IDR",
  HK: "HKD", TW: "TWD", JP: "JPY", KR: "KRW", CN: "CNY",
  KZ: "KZT", UZ: "UZS", KG: "KGS", GE: "GEL", AM: "AMD", AZ: "AZN",
};

export const CURRENCIES: string[] = Array.from(
  new Set(Object.values(COUNTRY_CURRENCY)),
).sort();

export const LANGUAGES: { code: string; label: string }[] = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "pt", label: "Português" },
  { code: "it", label: "Italiano" },
  { code: "nl", label: "Nederlands" },
  { code: "pl", label: "Polski" },
  { code: "ro", label: "Română" },
  { code: "tr", label: "Türkçe" },
  { code: "ar", label: "العربية" },
  { code: "ru", label: "Русский" },
  { code: "hi", label: "हिन्दी" },
  { code: "zh", label: "中文" },
  { code: "ja", label: "日本語" },
  { code: "ko", label: "한국어" },
];

export const TRADES: string[] = [
  "Roofing",
  "Plumbing",
  "HVAC",
  "Electrical",
  "Landscaping",
  "Cleaning",
  "Pest control",
  "Painting",
  "Fencing",
  "Pool service",
  "Pressure washing",
  "General contractor",
  "Auto repair",
  "Salon / barbershop",
  "Dental / clinic",
  "Legal",
  "Restaurant",
  "Other",
];

export function countryName(code: string, uiLocale = "en"): string {
  try {
    return (
      new Intl.DisplayNames([uiLocale], { type: "region" }).of(code) ?? code
    );
  } catch {
    return code;
  }
}

export function currencyName(code: string, uiLocale = "en"): string {
  try {
    const n = new Intl.DisplayNames([uiLocale], { type: "currency" }).of(code);
    return n ? `${code} — ${n}` : code;
  } catch {
    return code;
  }
}
