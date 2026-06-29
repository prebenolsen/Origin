/**
 * Language content registry.
 *
 * Auto-discovers every language under `src/content/languages/<lang>/` at build
 * time, mirroring the history content registry. To add a scenario, drop a
 * folder with a `scenario.json` (and optional lesson/vocabulary/personalize) -
 * no code changes required.
 */
import type {
  Language,
  Lesson,
  Personalize,
  Scenario,
  ScenarioBundle,
  VocabItem,
} from '../../types/language';

type GlobMap = Record<string, unknown>;

const languageFiles = import.meta.glob('../../content/languages/*/language.json', {
  eager: true,
  import: 'default',
}) as GlobMap;
const scenarioFiles = import.meta.glob(
  '../../content/languages/*/scenarios/*/scenario.json',
  { eager: true, import: 'default' },
) as GlobMap;
const lessonFiles = import.meta.glob(
  '../../content/languages/*/scenarios/*/lesson.json',
  { eager: true, import: 'default' },
) as GlobMap;
const vocabFiles = import.meta.glob(
  '../../content/languages/*/scenarios/*/vocabulary.json',
  { eager: true, import: 'default' },
) as GlobMap;
const personalizeFiles = import.meta.glob(
  '../../content/languages/*/scenarios/*/personalize.json',
  { eager: true, import: 'default' },
) as GlobMap;

/** `.../content/languages/spanish/language.json` -> `spanish`. */
function langOf(key: string): string | null {
  const after = key.split('/content/languages/')[1];
  if (!after) return null;
  return after.split('/')[0] ?? null;
}

/** `.../scenarios/greetings/scenario.json` -> `{ lang, scenario }`. */
function scenarioOf(key: string): { lang: string; scenario: string } | null {
  const after = key.split('/content/languages/')[1];
  if (!after) return null;
  const parts = after.split('/');
  // [lang, "scenarios", scenarioSlug, file.json]
  if (parts.length < 4 || parts[1] !== 'scenarios') return null;
  return { lang: parts[0], scenario: parts[2] };
}

function indexLanguages(): Map<string, Language> {
  const map = new Map<string, Language>();
  for (const key of Object.keys(languageFiles)) {
    const lang = langOf(key);
    if (lang) map.set(lang, languageFiles[key] as Language);
  }
  return map;
}

function indexByScenario<T>(files: GlobMap): Map<string, T> {
  const map = new Map<string, T>();
  for (const key of Object.keys(files)) {
    const parts = scenarioOf(key);
    if (parts) map.set(`${parts.lang}/${parts.scenario}`, files[key] as T);
  }
  return map;
}

const LANGUAGES = indexLanguages();
const SCENARIOS = indexByScenario<Scenario>(scenarioFiles);
const LESSONS = indexByScenario<Lesson>(lessonFiles);
const VOCAB = indexByScenario<VocabItem[]>(vocabFiles);
const PERSONALIZE = indexByScenario<Personalize>(personalizeFiles);

export function allLanguages(): { slug: string; language: Language }[] {
  return [...LANGUAGES.entries()].map(([slug, language]) => ({ slug, language }));
}

export function getLanguage(langSlug: string): Language | undefined {
  return LANGUAGES.get(langSlug);
}

export function getGoal(langSlug: string, goalSlug: string) {
  return getLanguage(langSlug)?.goals.find((g) => g.slug === goalSlug);
}

/** Build the assembled bundle for a single scenario, or undefined. */
export function getScenarioBundle(
  langSlug: string,
  scenarioSlug: string,
): ScenarioBundle | undefined {
  const path = `${langSlug}/${scenarioSlug}`;
  const scenario = SCENARIOS.get(path);
  if (!scenario) return undefined;
  return {
    path,
    langCode: langSlug,
    scenario,
    lesson: LESSONS.get(path),
    vocabulary: VOCAB.get(path) ?? [],
    personalize: PERSONALIZE.get(path),
  };
}

/** Whether a scenario is authored and enterable (not a placeholder). */
export function isEnterable(bundle: ScenarioBundle | undefined): boolean {
  return !!bundle && bundle.scenario.kind !== 'placeholder';
}

/** Every scenario bundle for a language, in no particular order. */
export function listScenarios(langSlug: string): ScenarioBundle[] {
  const out: ScenarioBundle[] = [];
  for (const key of SCENARIOS.keys()) {
    if (!key.startsWith(`${langSlug}/`)) continue;
    const slug = key.slice(langSlug.length + 1);
    const bundle = getScenarioBundle(langSlug, slug);
    if (bundle) out.push(bundle);
  }
  return out;
}
