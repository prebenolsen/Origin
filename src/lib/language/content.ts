/**
 * Language content registry.
 *
 * Auto-discovers every language under `src/content/languages/<lang>/` at build
 * time, mirroring the history content registry. Modules live one chapter folder
 * deep - `chapters/<chapter>/<slug>/` - so a chapter's content stays grouped. To
 * add a module, drop a folder with a `module.json` (and optional
 * lesson/vocabulary/personalize) into a chapter - no code changes required. The
 * leaf `<slug>` is the module's identity (keep it unique across chapters).
 */
import type {
  Conversation,
  Language,
  Lesson,
  Module,
  ModuleBundle,
  Personalize,
  Sentence,
  VocabItem,
} from '../../types/language';

type GlobMap = Record<string, unknown>;

const languageFiles = import.meta.glob('../../content/languages/*/language.json', {
  eager: true,
  import: 'default',
}) as GlobMap;
const moduleFiles = import.meta.glob(
  '../../content/languages/*/chapters/*/*/module.json',
  { eager: true, import: 'default' },
) as GlobMap;
const lessonFiles = import.meta.glob(
  '../../content/languages/*/chapters/*/*/lesson.json',
  { eager: true, import: 'default' },
) as GlobMap;
const vocabFiles = import.meta.glob(
  '../../content/languages/*/chapters/*/*/vocabulary.json',
  { eager: true, import: 'default' },
) as GlobMap;
const personalizeFiles = import.meta.glob(
  '../../content/languages/*/chapters/*/*/personalize.json',
  { eager: true, import: 'default' },
) as GlobMap;
const sentenceFiles = import.meta.glob(
  '../../content/languages/*/chapters/*/*/sentences.json',
  { eager: true, import: 'default' },
) as GlobMap;
const conversationFiles = import.meta.glob(
  '../../content/languages/*/chapters/*/*/conversation.json',
  { eager: true, import: 'default' },
) as GlobMap;

/** `.../content/languages/spanish/language.json` -> `spanish`. */
function langOf(key: string): string | null {
  const after = key.split('/content/languages/')[1];
  if (!after) return null;
  return after.split('/')[0] ?? null;
}

/**
 * `.../chapters/visiting-spain/greetings/module.json`
 *   -> `{ lang, chapter, module }`.
 * The leaf slug stays the module's identity; `chapter` is the folder that
 * groups it (used only to detect cross-chapter slug collisions).
 */
function moduleOf(key: string): { lang: string; chapter: string; module: string } | null {
  const after = key.split('/content/languages/')[1];
  if (!after) return null;
  const parts = after.split('/');
  // [lang, "chapters", chapter, moduleSlug, file.json]
  if (parts.length < 5 || parts[1] !== 'chapters') return null;
  return { lang: parts[0], chapter: parts[2], module: parts[3] };
}

function indexLanguages(): Map<string, Language> {
  const map = new Map<string, Language>();
  for (const key of Object.keys(languageFiles)) {
    const lang = langOf(key);
    if (lang) map.set(lang, languageFiles[key] as Language);
  }
  return map;
}

function indexByModule<T>(files: GlobMap): Map<string, T> {
  const map = new Map<string, T>();
  const chapterOfKey = new Map<string, string>();
  for (const key of Object.keys(files)) {
    const parts = moduleOf(key);
    if (!parts) continue;
    const id = `${parts.lang}/${parts.module}`;
    const prevChapter = chapterOfKey.get(id);
    if (prevChapter && prevChapter !== parts.chapter && import.meta.env?.DEV) {
      // Leaf slug is the identity, so two chapters can't share one. Give a
      // second module a distinct slug (e.g. `restaurant-social`) instead.
      console.warn(
        `[language content] duplicate module slug "${parts.module}" in ` +
          `chapters "${prevChapter}" and "${parts.chapter}" - one will shadow the other.`,
      );
    }
    chapterOfKey.set(id, parts.chapter);
    map.set(id, files[key] as T);
  }
  return map;
}

const LANGUAGES = indexLanguages();
const MODULES = indexByModule<Module>(moduleFiles);
const LESSONS = indexByModule<Lesson>(lessonFiles);
const VOCAB = indexByModule<VocabItem[]>(vocabFiles);
const PERSONALIZE = indexByModule<Personalize>(personalizeFiles);
const SENTENCES = indexByModule<Sentence[]>(sentenceFiles);
const CONVERSATIONS = indexByModule<Conversation>(conversationFiles);

export function allLanguages(): { slug: string; language: Language }[] {
  return [...LANGUAGES.entries()].map(([slug, language]) => ({ slug, language }));
}

export function getLanguage(langSlug: string): Language | undefined {
  return LANGUAGES.get(langSlug);
}

export function getChapter(langSlug: string, chapterSlug: string) {
  return getLanguage(langSlug)?.chapters.find((c) => c.slug === chapterSlug);
}

/** Build the assembled bundle for a single module, or undefined. */
export function getModuleBundle(
  langSlug: string,
  moduleSlug: string,
): ModuleBundle | undefined {
  const path = `${langSlug}/${moduleSlug}`;
  const module = MODULES.get(path);
  if (!module) return undefined;
  return {
    path,
    langCode: langSlug,
    module,
    lesson: LESSONS.get(path),
    vocabulary: VOCAB.get(path) ?? [],
    personalize: PERSONALIZE.get(path),
    sentences: SENTENCES.get(path),
    conversation: CONVERSATIONS.get(path),
  };
}

/** Whether a module is authored and enterable (not a placeholder). */
export function isEnterable(bundle: ModuleBundle | undefined): boolean {
  return !!bundle && bundle.module.kind !== 'placeholder';
}

/**
 * Whether a module is a Conversation module (chat + comprehension) rather than
 * the default word-teaching lesson. Drives which experience/route to open.
 */
export function isConversation(bundle: ModuleBundle | undefined): boolean {
  return !!bundle && bundle.module.format === 'conversation';
}

/** Every module bundle for a language, in no particular order. */
export function listModules(langSlug: string): ModuleBundle[] {
  const out: ModuleBundle[] = [];
  for (const key of MODULES.keys()) {
    if (!key.startsWith(`${langSlug}/`)) continue;
    const slug = key.slice(langSlug.length + 1);
    const bundle = getModuleBundle(langSlug, slug);
    if (bundle) out.push(bundle);
  }
  return out;
}
