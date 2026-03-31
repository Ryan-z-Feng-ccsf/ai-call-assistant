// lib/constants.ts — shared across pages

export const SCENARIOS = [
  { value: "General Professional Call",        icon: "📞", label: "General Professional Call" },
  { value: "Software Engineering Job Interview", icon: "💻", label: "Software Engineering Interview" },
  { value: "Customer Support Dispute",          icon: "🛒", label: "Customer Support Dispute" },
  { value: "Doctor Appointment",                icon: "🏥", label: "Doctor Appointment" },
  { value: "Bank or Credit Card",               icon: "🏦", label: "Bank or Credit Card" },
  { value: "Landlord or Utilities",             icon: "🏠", label: "Landlord or Utilities" },
  { value: "Ordering Food at a Restaurant",     icon: "🍽️", label: "Ordering Food" },
];

export const LANGUAGES = [
  { value: "English",                  code: "us", label: "English" },
  { value: "Chinese (中文)",           code: "cn", label: "中文" },
  { value: "Spanish (Español)",        code: "es", label: "Español" },
  { value: "French (Français)",        code: "fr", label: "Français" },
  { value: "Japanese (日本語)",        code: "jp", label: "日本語" },
  { value: "Korean (한국어)",          code: "kr", label: "한국어" },
  { value: "Portuguese (Português)",   code: "br", label: "Português" },
  { value: "Arabic (العربية)",         code: "sa", label: "العربية" },
  { value: "Hindi (हिन्दी)",           code: "in", label: "हिन्दी" },
  { value: "German (Deutsch)",         code: "de", label: "Deutsch" },
  { value: "Vietnamese (Tiếng Việt)",  code: "vn", label: "Tiếng Việt" },
  { value: "Italian (Italiano)",       code: "it", label: "Italiano" },
  { value: "Russian (Русский)",        code: "ru", label: "Русский" },
  { value: "Dutch (Nederlands)",       code: "nl", label: "Nederlands" },
];

export const DEEPGRAM_LANG_CODES: Record<string, string> = {
  "English":              "en-US",
  "Chinese (中文)":       "zh-CN",
  "Spanish (Español)":    "es",
  "French (Français)":    "fr",
  "Japanese (日本語)":    "ja",
  "Korean (한국어)":      "ko",
  "Portuguese (Português)": "pt",
  "Arabic (العربية)":     "ar",
  "Hindi (हिन्दी)":       "hi",
  "German (Deutsch)":     "de",
  "Vietnamese (Tiếng Việt)": "vi",
  "Italian (Italiano)":   "it",
  "Russian (Русский)":    "ru",
  "Dutch (Nederlands)":   "nl",
};

/** Format a UTC date string from backend to local time */
export function formatLocalDate(utcStr: string): string {
  return new Date(utcStr.replace(" ", "T") + "Z").toLocaleString("en-US", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
}