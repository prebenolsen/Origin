/**
 * Geography Challenge — data model and answer scoring.
 *
 * A "board" is one playable map: a continent (where the learner names the
 * countries) or the world oceans/seas. Each board lists its regions with a
 * canonical display name plus accepted answer aliases. Country regions are tied
 * to the Natural Earth polygons by their numeric ISO id (see `countryShapes.ts`);
 * sea regions carry their own lat/lng so they render as markers.
 *
 * This module is intentionally light (no map geometry) so the board picker can
 * load it without pulling in the ~108 KB country topology.
 */

export type BoardKind = 'countries' | 'seas';

export interface Region {
  /** Numeric ISO id for countries (matches the topojson geometry id); a slug for seas. */
  id: string;
  /** Canonical, full display name — the "right answer". */
  name: string;
  /** Extra accepted spellings / common names (already lowercased). */
  aliases?: string[];
  /** Only for seas: marker position in degrees. Countries derive this from geometry. */
  lat?: number;
  lng?: number;
}

export interface Board {
  key: string;
  name: string;
  kind: BoardKind;
  /** Short one-liner shown on the picker. */
  blurb: string;
  /** Geographic frame `[west, south, east, north]` in degrees. */
  focus: [number, number, number, number];
  regions: Region[];
}

/**
 * Countries that are commonly hard to tap at default zoom.
 * Used by the geography "small country assist" button as first-priority targets.
 */
export const SMALL_COUNTRY_IDS = new Set<string>([
  '020', // Andorra
  '438', // Liechtenstein
  '470', // Malta
  '492', // Monaco
  '674', // San Marino
  '056', // Belgium
  '442', // Luxembourg
  '040', // Austria
  '051', // Armenia
  '031', // Azerbaijan
  '048', // Bahrain
  '196', // Cyprus
  '376', // Israel
  '422', // Lebanon
  '702', // Singapore
  '634', // Qatar
  '784', // UAE
  '262', // Djibouti
  '174', // Comoros
  '132', // Cabo Verde
  '226', // Equatorial Guinea
  '678', // Sao Tome and Principe
  '690', // Seychelles
  '480', // Mauritius
  '748', // Eswatini
  '426', // Lesotho
  '659', // Saint Kitts and Nevis
  '662', // Saint Lucia
  '670', // Saint Vincent and the Grenadines
  '212', // Dominica
  '028', // Antigua and Barbuda
  '052', // Barbados
  '308', // Grenada
  '388', // Jamaica
  '044', // Bahamas
  '780', // Trinidad and Tobago
  '090', // Solomon Islands
  '242', // Fiji
  '296', // Kiribati
  '584', // Marshall Islands
  '583', // Micronesia
  '520', // Nauru
  '585', // Palau
  '882', // Samoa
  '776', // Tonga
  '798', // Tuvalu
  '548', // Vanuatu
]);

const EUROPE: Region[] = [
  { id: '008', name: 'Albania' },
  { id: '020', name: 'Andorra' },
  { id: '040', name: 'Austria' },
  { id: '112', name: 'Belarus' },
  { id: '056', name: 'Belgium' },
  { id: '070', name: 'Bosnia and Herzegovina', aliases: ['bosnia', 'bosnia and herz'] },
  { id: '100', name: 'Bulgaria' },
  { id: '191', name: 'Croatia' },
  { id: '196', name: 'Cyprus' },
  { id: '203', name: 'Czechia', aliases: ['czech republic'] },
  { id: '208', name: 'Denmark' },
  { id: '233', name: 'Estonia' },
  { id: '246', name: 'Finland' },
  { id: '250', name: 'France' },
  { id: '276', name: 'Germany' },
  { id: '300', name: 'Greece' },
  { id: '348', name: 'Hungary' },
  { id: '352', name: 'Iceland' },
  { id: '372', name: 'Ireland' },
  { id: '380', name: 'Italy' },
  { id: '428', name: 'Latvia' },
  { id: '438', name: 'Liechtenstein' },
  { id: '440', name: 'Lithuania' },
  { id: '442', name: 'Luxembourg' },
  { id: '470', name: 'Malta' },
  { id: '492', name: 'Monaco' },
  { id: '807', name: 'North Macedonia', aliases: ['macedonia'] },
  { id: '498', name: 'Moldova' },
  { id: '499', name: 'Montenegro' },
  { id: '528', name: 'Netherlands', aliases: ['holland', 'the netherlands'] },
  { id: '578', name: 'Norway' },
  { id: '616', name: 'Poland' },
  { id: '620', name: 'Portugal' },
  { id: '642', name: 'Romania' },
  { id: '643', name: 'Russia', aliases: ['russian federation'] },
  { id: '688', name: 'Serbia' },
  { id: '674', name: 'San Marino' },
  { id: '703', name: 'Slovakia' },
  { id: '705', name: 'Slovenia' },
  { id: '724', name: 'Spain' },
  { id: '752', name: 'Sweden' },
  { id: '756', name: 'Switzerland' },
  { id: '804', name: 'Ukraine' },
  { id: '826', name: 'United Kingdom', aliases: ['uk', 'britain', 'great britain', 'england'] },
];

const ASIA: Region[] = [
  { id: '004', name: 'Afghanistan' },
  { id: '051', name: 'Armenia' },
  { id: '031', name: 'Azerbaijan' },
  { id: '048', name: 'Bahrain' },
  { id: '050', name: 'Bangladesh' },
  { id: '064', name: 'Bhutan' },
  { id: '096', name: 'Brunei' },
  { id: '116', name: 'Cambodia' },
  { id: '156', name: 'China' },
  { id: '268', name: 'Georgia' },
  { id: '356', name: 'India' },
  { id: '360', name: 'Indonesia' },
  { id: '364', name: 'Iran' },
  { id: '368', name: 'Iraq' },
  { id: '376', name: 'Israel' },
  { id: '392', name: 'Japan' },
  { id: '400', name: 'Jordan' },
  { id: '398', name: 'Kazakhstan' },
  { id: '414', name: 'Kuwait' },
  { id: '417', name: 'Kyrgyzstan' },
  { id: '418', name: 'Laos' },
  { id: '422', name: 'Lebanon' },
  { id: '458', name: 'Malaysia' },
  { id: '462', name: 'Maldives' },
  { id: '496', name: 'Mongolia' },
  { id: '104', name: 'Myanmar', aliases: ['burma'] },
  { id: '524', name: 'Nepal' },
  { id: '408', name: 'North Korea' },
  { id: '512', name: 'Oman' },
  { id: '586', name: 'Pakistan' },
  { id: '608', name: 'Philippines' },
  { id: '634', name: 'Qatar' },
  { id: '682', name: 'Saudi Arabia' },
  { id: '702', name: 'Singapore' },
  { id: '410', name: 'South Korea' },
  { id: '144', name: 'Sri Lanka' },
  { id: '760', name: 'Syria' },
  { id: '762', name: 'Tajikistan' },
  { id: '764', name: 'Thailand' },
  { id: '626', name: 'Timor-Leste', aliases: ['east timor'] },
  { id: '792', name: 'Turkey', aliases: ['turkiye', 'türkiye'] },
  { id: '795', name: 'Turkmenistan' },
  { id: '784', name: 'United Arab Emirates', aliases: ['uae', 'emirates'] },
  { id: '860', name: 'Uzbekistan' },
  { id: '704', name: 'Vietnam' },
  { id: '887', name: 'Yemen' },
];

const AFRICA: Region[] = [
  { id: '012', name: 'Algeria' },
  { id: '024', name: 'Angola' },
  { id: '204', name: 'Benin' },
  { id: '072', name: 'Botswana' },
  { id: '854', name: 'Burkina Faso' },
  { id: '108', name: 'Burundi' },
  { id: '132', name: 'Cabo Verde', aliases: ['cape verde'] },
  { id: '120', name: 'Cameroon' },
  { id: '140', name: 'Central African Republic', aliases: ['car', 'central african rep'] },
  { id: '148', name: 'Chad' },
  { id: '174', name: 'Comoros' },
  { id: '178', name: 'Republic of the Congo', aliases: ['congo', 'congo brazzaville'] },
  { id: '384', name: 'Ivory Coast', aliases: ["cote d'ivoire", "côte d'ivoire"] },
  {
    id: '180',
    name: 'Democratic Republic of the Congo',
    aliases: ['dr congo', 'drc', 'congo kinshasa', 'democratic republic of congo', 'dem rep congo'],
  },
  { id: '262', name: 'Djibouti' },
  { id: '818', name: 'Egypt' },
  { id: '226', name: 'Equatorial Guinea' },
  { id: '232', name: 'Eritrea' },
  { id: '748', name: 'Eswatini', aliases: ['swaziland'] },
  { id: '231', name: 'Ethiopia' },
  { id: '266', name: 'Gabon' },
  { id: '270', name: 'Gambia', aliases: ['the gambia'] },
  { id: '288', name: 'Ghana' },
  { id: '324', name: 'Guinea' },
  { id: '624', name: 'Guinea-Bissau' },
  { id: '404', name: 'Kenya' },
  { id: '426', name: 'Lesotho' },
  { id: '430', name: 'Liberia' },
  { id: '434', name: 'Libya' },
  { id: '450', name: 'Madagascar' },
  { id: '454', name: 'Malawi' },
  { id: '466', name: 'Mali' },
  { id: '478', name: 'Mauritania' },
  { id: '480', name: 'Mauritius' },
  { id: '504', name: 'Morocco' },
  { id: '508', name: 'Mozambique' },
  { id: '516', name: 'Namibia' },
  { id: '562', name: 'Niger' },
  { id: '566', name: 'Nigeria' },
  { id: '646', name: 'Rwanda' },
  { id: '678', name: 'Sao Tome and Principe', aliases: ['sao tome', 'sao tome & principe'] },
  { id: '686', name: 'Senegal' },
  { id: '690', name: 'Seychelles' },
  { id: '694', name: 'Sierra Leone' },
  { id: '706', name: 'Somalia' },
  { id: '710', name: 'South Africa' },
  { id: '728', name: 'South Sudan' },
  { id: '729', name: 'Sudan' },
  { id: '834', name: 'Tanzania' },
  { id: '768', name: 'Togo' },
  { id: '788', name: 'Tunisia' },
  { id: '800', name: 'Uganda' },
  { id: '894', name: 'Zambia' },
  { id: '716', name: 'Zimbabwe' },
];

const NORTH_AMERICA: Region[] = [
  { id: '028', name: 'Antigua and Barbuda', aliases: ['antigua'] },
  { id: '044', name: 'Bahamas', aliases: ['the bahamas'] },
  { id: '052', name: 'Barbados' },
  { id: '084', name: 'Belize' },
  { id: '124', name: 'Canada' },
  { id: '188', name: 'Costa Rica' },
  { id: '192', name: 'Cuba' },
  { id: '214', name: 'Dominican Republic' },
  { id: '212', name: 'Dominica' },
  { id: '222', name: 'El Salvador' },
  { id: '308', name: 'Grenada' },
  { id: '320', name: 'Guatemala' },
  { id: '332', name: 'Haiti' },
  { id: '340', name: 'Honduras' },
  { id: '388', name: 'Jamaica' },
  { id: '484', name: 'Mexico' },
  { id: '558', name: 'Nicaragua' },
  { id: '591', name: 'Panama' },
  { id: '659', name: 'Saint Kitts and Nevis', aliases: ['saint kitts', 'st kitts and nevis'] },
  { id: '662', name: 'Saint Lucia', aliases: ['st lucia'] },
  {
    id: '670',
    name: 'Saint Vincent and the Grenadines',
    aliases: ['st vincent and the grenadines', 'saint vincent'],
  },
  { id: '780', name: 'Trinidad and Tobago', aliases: ['trinidad'] },
  { id: '840', name: 'United States', aliases: ['usa', 'united states of america', 'america', 'us'] },
];

const SOUTH_AMERICA: Region[] = [
  { id: '032', name: 'Argentina' },
  { id: '068', name: 'Bolivia' },
  { id: '076', name: 'Brazil' },
  { id: '152', name: 'Chile' },
  { id: '170', name: 'Colombia' },
  { id: '218', name: 'Ecuador' },
  { id: '328', name: 'Guyana' },
  { id: '600', name: 'Paraguay' },
  { id: '604', name: 'Peru' },
  { id: '740', name: 'Suriname' },
  { id: '858', name: 'Uruguay' },
  { id: '862', name: 'Venezuela' },
];

const OCEANIA: Region[] = [
  { id: '036', name: 'Australia' },
  { id: '242', name: 'Fiji' },
  { id: '296', name: 'Kiribati' },
  { id: '584', name: 'Marshall Islands' },
  { id: '583', name: 'Micronesia', aliases: ['federated states of micronesia'] },
  { id: '520', name: 'Nauru' },
  { id: '554', name: 'New Zealand' },
  { id: '585', name: 'Palau' },
  { id: '598', name: 'Papua New Guinea' },
  { id: '882', name: 'Samoa' },
  { id: '090', name: 'Solomon Islands' },
  { id: '776', name: 'Tonga' },
  { id: '798', name: 'Tuvalu' },
  { id: '548', name: 'Vanuatu' },
];

const SEAS: Region[] = [
  { id: 'pacific', name: 'Pacific Ocean', lat: 0, lng: -140 },
  { id: 'atlantic', name: 'Atlantic Ocean', lat: 5, lng: -35 },
  { id: 'indian', name: 'Indian Ocean', lat: -25, lng: 78 },
  { id: 'southern', name: 'Southern Ocean', aliases: ['antarctic ocean'], lat: -58, lng: 25 },
  { id: 'arctic', name: 'Arctic Ocean', lat: 74, lng: 0 },
  { id: 'mediterranean', name: 'Mediterranean Sea', aliases: ['mediterranean'], lat: 35, lng: 17 },
  { id: 'caribbean', name: 'Caribbean Sea', aliases: ['caribbean'], lat: 14, lng: -75 },
  { id: 'gulf-mexico', name: 'Gulf of Mexico', lat: 25, lng: -90 },
  { id: 'caspian', name: 'Caspian Sea', aliases: ['caspian'], lat: 41, lng: 51 },
  { id: 'black', name: 'Black Sea', lat: 43, lng: 34 },
  { id: 'red', name: 'Red Sea', lat: 20, lng: 38 },
  { id: 'north-sea', name: 'North Sea', lat: 56, lng: 3 },
  { id: 'baltic', name: 'Baltic Sea', aliases: ['baltic'], lat: 58, lng: 20 },
  { id: 'arabian', name: 'Arabian Sea', lat: 14, lng: 64 },
  { id: 'bengal', name: 'Bay of Bengal', lat: 14, lng: 90 },
  { id: 'south-china', name: 'South China Sea', lat: 13, lng: 115 },
  { id: 'japan', name: 'Sea of Japan', aliases: ['east sea'], lat: 40, lng: 135 },
  { id: 'coral', name: 'Coral Sea', lat: -16, lng: 153 },
];

export const BOARDS: Board[] = [
  { key: 'europe', name: 'Europe', kind: 'countries', blurb: '44 countries', focus: [-25, 34, 45, 71], regions: EUROPE },
  { key: 'asia', name: 'Asia', kind: 'countries', blurb: '46 countries', focus: [25, -11, 147, 78], regions: ASIA },
  { key: 'africa', name: 'Africa', kind: 'countries', blurb: '54 countries', focus: [-19, -36, 52, 38], regions: AFRICA },
  {
    key: 'north-america',
    name: 'North America',
    kind: 'countries',
    blurb: '23 countries',
    focus: [-128, 6, -59, 62],
    regions: NORTH_AMERICA,
  },
  {
    key: 'south-america',
    name: 'South America',
    kind: 'countries',
    blurb: '12 countries',
    focus: [-82, -56, -34, 13],
    regions: SOUTH_AMERICA,
  },
  {
    key: 'oceania',
    name: 'Oceania',
    kind: 'countries',
    blurb: '14 countries',
    focus: [110, -48, 180, 20],
    regions: OCEANIA,
  },
  {
    key: 'seas',
    name: 'Oceans & Seas',
    kind: 'seas',
    blurb: '18 waters of the world',
    focus: [-165, -60, 178, 80],
    regions: SEAS,
  },
];

export function getBoard(key: string): Board | undefined {
  return BOARDS.find((b) => b.key === key);
}

/* ------------------------------- scoring -------------------------------- */

/** Lowercase, strip accents/punctuation, collapse spaces, drop a leading "the". */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/^the\s+/, '');
}

/** Classic Levenshtein edit distance between two strings. */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(cur[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    prev = cur;
  }
  return prev[b.length];
}

/** Normalized similarity in 0..1 (1 = identical) for one candidate pair. */
function similarity(a: string, b: string): number {
  const max = Math.max(a.length, b.length);
  if (max === 0) return 1;
  return 1 - levenshtein(a, b) / max;
}

export interface ScoreResult {
  /** Best similarity across the canonical name and all aliases. */
  score: number;
  /** Whether the answer should count as correct. */
  correct: boolean;
}

/** The fraction of correctness required to accept a typed answer. */
export const ACCEPT_THRESHOLD = 0.8;

/**
 * Score a typed guess against a region. We take the best match across the
 * canonical name and every alias, and accept it when the learner is at least
 * ~80% right — with a one-edit grace so a single typo on a short name still
 * counts.
 */
export function scoreAnswer(guess: string, region: Region): ScoreResult {
  const g = normalize(guess);
  if (!g) return { score: 0, correct: false };
  const candidates = [region.name, ...(region.aliases ?? [])].map(normalize);
  let best = 0;
  let minDist = Infinity;
  for (const c of candidates) {
    best = Math.max(best, similarity(g, c));
    minDist = Math.min(minDist, levenshtein(g, c));
  }
  const correct = best >= ACCEPT_THRESHOLD || minDist <= 1;
  return { score: best, correct };
}

/* ----------------------------- alternatives ----------------------------- */

/** Great-circle-ish distance proxy on the lat/lng plane (good enough for ranking). */
function degDist(a: [number, number], b: [number, number]): number {
  const dLng = (a[0] - b[0]) * Math.cos(((a[1] + b[1]) / 2) * (Math.PI / 180));
  const dLat = a[1] - b[1];
  return Math.hypot(dLng, dLat);
}

/**
 * Build a 4-option multiple choice: the correct answer plus the three
 * geographically nearest other regions on the board, shuffled. `centroidOf`
 * supplies each region's [lng, lat] (from geometry for countries, from the
 * marker for seas).
 */
export function buildAlternatives(
  board: Board,
  target: Region,
  centroidOf: (r: Region) => [number, number] | null,
): string[] {
  const here = centroidOf(target);
  const others = board.regions.filter((r) => r.id !== target.id);
  let picks: Region[];
  if (here) {
    picks = others
      .map((r) => ({ r, c: centroidOf(r) }))
      .filter((o): o is { r: Region; c: [number, number] } => o.c !== null)
      .sort((a, b) => degDist(here, a.c) - degDist(here, b.c))
      .slice(0, 3)
      .map((o) => o.r);
  } else {
    picks = [...others].sort(() => Math.random() - 0.5).slice(0, 3);
  }
  const names = [target.name, ...picks.map((r) => r.name)];
  // Fisher–Yates shuffle so the correct answer isn't always first.
  for (let i = names.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [names[i], names[j]] = [names[j], names[i]];
  }
  return names;
}
