/**
 * The learner's own details (name, where they're from, age), collected once in
 * an onboarding step and woven into the lessons so examples talk about *them*
 * ("Me llamo Preben. Soy de Noruega.") instead of a generic stand-in.
 *
 * Flat by design so it maps onto the `origin_language_spanish_profile` row (see
 * `docs/language-supabase-schema.md`) without reshaping. Stored as part of the
 * LanguageProfile in localStorage.
 */

export interface Learner {
  /** First name, used in `Me llamo ___`. */
  name?: string;
  /** Home city, optional - used in `Soy de ___` when given. */
  city?: string;
  /** Country in English, e.g. `Norway` (display + the {country} token). */
  country?: string;
  /** Country in Spanish, e.g. `Noruega` (the {country_es} token). Derived from
   * `country` via COUNTRY_ES when known, else the typed value. */
  countryEs?: string;
  /** Age in years, used in `Tengo ___ anos`. */
  age?: number;
}

/**
 * English -> Spanish country names for the places a tourist is most likely to
 * come from. Accent-free to match the rest of the Spanish content set. Keys are
 * lowercased for lookup. Unknown countries fall back to the typed value.
 */
export const COUNTRY_ES: Record<string, string> = {
  norway: 'Noruega',
  sweden: 'Suecia',
  denmark: 'Dinamarca',
  finland: 'Finlandia',
  iceland: 'Islandia',
  england: 'Inglaterra',
  scotland: 'Escocia',
  wales: 'Gales',
  ireland: 'Irlanda',
  'united kingdom': 'Reino Unido',
  uk: 'Reino Unido',
  'united states': 'Estados Unidos',
  usa: 'Estados Unidos',
  'the netherlands': 'Paises Bajos',
  netherlands: 'Paises Bajos',
  holland: 'Paises Bajos',
  germany: 'Alemania',
  france: 'Francia',
  spain: 'Espana',
  italy: 'Italia',
  portugal: 'Portugal',
  belgium: 'Belgica',
  switzerland: 'Suiza',
  austria: 'Austria',
  poland: 'Polonia',
  czechia: 'Chequia',
  'czech republic': 'Chequia',
  russia: 'Rusia',
  ukraine: 'Ucrania',
  greece: 'Grecia',
  turkey: 'Turquia',
  canada: 'Canada',
  mexico: 'Mexico',
  brazil: 'Brasil',
  argentina: 'Argentina',
  chile: 'Chile',
  colombia: 'Colombia',
  peru: 'Peru',
  china: 'China',
  japan: 'Japon',
  india: 'India',
  australia: 'Australia',
  'new zealand': 'Nueva Zelanda',
  'south africa': 'Sudafrica',
  egypt: 'Egipto',
  morocco: 'Marruecos',
};

/** Countries offered in the onboarding picker (datalist), display form. */
export const COUNTRY_SUGGESTIONS: string[] = [
  'Norway', 'Sweden', 'Denmark', 'Finland', 'Iceland',
  'England', 'Scotland', 'Ireland', 'United Kingdom', 'United States',
  'Canada', 'Germany', 'France', 'Spain', 'Italy', 'Portugal',
  'Netherlands', 'Belgium', 'Switzerland', 'Austria', 'Poland',
  'Greece', 'Mexico', 'Brazil', 'Argentina', 'Australia',
];

/** Best-effort Spanish name for a typed (English) country; falls back to input. */
export function spanishCountry(countryEn: string | undefined): string | undefined {
  const trimmed = countryEn?.trim();
  if (!trimmed) return undefined;
  return COUNTRY_ES[trimmed.toLowerCase()] ?? trimmed;
}

// Sensible neutral defaults so a lesson still reads if it is somehow opened
// before onboarding - mirrors the originally authored sample sentences.
const FALLBACK = { name: 'Ana', city: '', country: 'Norway', countryEs: 'Noruega', age: '30' };

/**
 * Replace personalization tokens in any lesson string with the learner's
 * details. Tokens: {name} {city} {country} (English) {country_es} (Spanish)
 * {age}. Case-insensitive. Safe to call on text with no tokens.
 */
export function personalizeText(text: string, learner?: Learner): string {
  if (!text) return text;
  const name = learner?.name?.trim() || FALLBACK.name;
  const country = learner?.country?.trim() || FALLBACK.country;
  const countryEs = learner?.countryEs?.trim() || spanishCountry(learner?.country) || FALLBACK.countryEs;
  const city = learner?.city?.trim() || country;
  const age = learner?.age != null ? String(learner.age) : FALLBACK.age;
  return text
    .replace(/\{name\}/gi, name)
    .replace(/\{country_es\}/gi, countryEs)
    .replace(/\{country\}/gi, country)
    .replace(/\{city\}/gi, city)
    .replace(/\{age\}/gi, age);
}
