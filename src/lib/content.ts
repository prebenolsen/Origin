/**
 * Content registry.
 *
 * Auto-discovers every module under `src/content/<category>/<subcategory>/
 * <module>/` at build time. To add a module, drop in a folder with a
 * `module.json` (and optional story/timeline/quiz/flashcards) — no code
 * changes required.
 */
import type {
  BookCard,
  CategoryGroup,
  Flashcard,
  ModuleBundle,
  ModuleBook,
  ModuleMeta,
  QuizQuestion,
  StoryCard,
  SubcategoryGroup,
  TimelineEvent,
} from '../types/content';
import { humanize } from './text';

type GlobMap = Record<string, unknown>;

// Eagerly import the parsed JSON (default export) for each known file name.
const metaFiles = import.meta.glob('../content/**/module.json', {
  eager: true,
  import: 'default',
}) as GlobMap;
const storyFiles = import.meta.glob('../content/**/story.json', {
  eager: true,
  import: 'default',
}) as GlobMap;
const timelineFiles = import.meta.glob('../content/**/timeline.json', {
  eager: true,
  import: 'default',
}) as GlobMap;
const quizFiles = import.meta.glob('../content/**/quiz.json', {
  eager: true,
  import: 'default',
}) as GlobMap;
const flashcardFiles = import.meta.glob('../content/**/flashcards.json', {
  eager: true,
  import: 'default',
}) as GlobMap;
const bookFiles = import.meta.glob('../content/**/book-*.json', {
  eager: true,
  import: 'default',
}) as GlobMap;

/** Optional pretty names for categories (otherwise the slug is humanized). */
const CATEGORY_DISPLAY: Record<string, string> = {
  history: 'History',
  science: 'Science',
  philosophy: 'Philosophy',
  arts: 'Arts & Culture',
};

interface PathParts {
  cat: string;
  sub: string;
  mod: string;
}

function parseKey(key: string): PathParts | null {
  const after = key.split('/content/')[1];
  if (!after) return null;
  const parts = after.split('/');
  if (parts.length < 4) return null; // cat / sub / mod / file.json
  const [cat, sub, mod] = parts;
  return { cat, sub, mod };
}

function indexByPath<T>(files: GlobMap): Map<string, T> {
  const map = new Map<string, T>();
  for (const key of Object.keys(files)) {
    const parts = parseKey(key);
    if (parts) map.set(`${parts.cat}/${parts.sub}/${parts.mod}`, files[key] as T);
  }
  return map;
}

const storyByPath = indexByPath<StoryCard[]>(storyFiles);
const timelineByPath = indexByPath<TimelineEvent[]>(timelineFiles);
const quizByPath = indexByPath<QuizQuestion[]>(quizFiles);
const flashcardsByPath = indexByPath<Flashcard[]>(flashcardFiles);

function fileStem(key: string): string | null {
  const file = key.split('/').pop();
  if (!file) return null;
  return file.replace(/\.json$/i, '');
}

function booksByModulePath(files: GlobMap): Map<string, ModuleBook[]> {
  const map = new Map<string, ModuleBook[]>();
  for (const key of Object.keys(files)) {
    const parts = parseKey(key);
    if (!parts) continue;
    const path = `${parts.cat}/${parts.sub}/${parts.mod}`;
    const id = fileStem(key);
    if (!id) continue;
    const title = humanize(id.replace(/^book-/, ''));
    const cards = files[key] as BookCard[];
    const books = map.get(path) ?? [];
    books.push({ id, title, cards });
    map.set(path, books);
  }
  return map;
}

const booksByPath = booksByModulePath(bookFiles);

const bookCountByCategory = (() => {
  const counts = new Map<string, number>();
  for (const key of Object.keys(bookFiles)) {
    const parts = parseKey(key);
    if (!parts) continue;
    counts.set(parts.cat, (counts.get(parts.cat) ?? 0) + 1);
  }
  return counts;
})();

function categoryName(slug: string): string {
  return CATEGORY_DISPLAY[slug] ?? humanize(slug);
}

/**
 * Unfinished modules ship as scaffolding with a `PLACEHOLDER:`-prefixed title
 * (see the placeholder scaffolds in `docs/content.md`). They are excluded from
 * the registry so they never reach the user — not in listings, counts, or via a
 * direct URL. Authoring a module (replacing the placeholder title with a real
 * one) publishes it automatically; no code change is needed.
 */
function isPlaceholder(meta: ModuleMeta | undefined): boolean {
  return (meta?.title ?? '').trimStart().toUpperCase().startsWith('PLACEHOLDER');
}

function buildBundles(): Map<string, ModuleBundle> {
  const bundles = new Map<string, ModuleBundle>();
  for (const key of Object.keys(metaFiles)) {
    const parts = parseKey(key);
    if (!parts) continue;
    const meta = metaFiles[key] as ModuleMeta;
    if (isPlaceholder(meta)) continue; // hide unfinished placeholder modules
    const path = `${parts.cat}/${parts.sub}/${parts.mod}`;
    bundles.set(path, {
      path,
      categorySlug: parts.cat,
      subcategorySlug: parts.sub,
      slug: parts.mod,
      categoryName: categoryName(parts.cat),
      subcategoryName: humanize(parts.sub),
      meta,
      story: storyByPath.get(path) ?? [],
      timeline: timelineByPath.get(path) ?? [],
      quiz: quizByPath.get(path) ?? [],
      flashcards: flashcardsByPath.get(path) ?? [],
      books: booksByPath.get(path) ?? [],
    });
  }
  return bundles;
}

const REGISTRY = buildBundles();

/** Look up a single module by its `category/subcategory/module` path. */
export function getModule(
  cat: string,
  sub: string,
  mod: string,
): ModuleBundle | undefined {
  return REGISTRY.get(`${cat}/${sub}/${mod}`);
}

/** All modules, unsorted. */
export function allModules(): ModuleBundle[] {
  return [...REGISTRY.values()];
}

/**
 * Case-insensitive search across published modules. Every whitespace-separated
 * term must appear somewhere in a module's title, summary, category,
 * subcategory, or period. Results are ranked with title matches first, then
 * alphabetically. An empty query returns no results.
 */
export function searchModules(query: string): ModuleBundle[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const terms = q.split(/\s+/);

  const scored: { bundle: ModuleBundle; score: number }[] = [];
  for (const bundle of REGISTRY.values()) {
    const title = (bundle.meta.title ?? '').toLowerCase();
    const haystack = [
      title,
      bundle.meta.summary ?? '',
      bundle.categoryName,
      bundle.subcategoryName,
      bundle.meta.period ?? '',
    ]
      .join(' ')
      .toLowerCase();

    if (!terms.every((t) => haystack.includes(t))) continue;

    let score = 0;
    if (title.startsWith(q)) score += 100;
    else if (title.includes(q)) score += 40;
    for (const t of terms) if (title.includes(t)) score += 10;
    scored.push({ bundle, score });
  }

  scored.sort(
    (a, b) =>
      b.score - a.score ||
      (a.bundle.meta.title ?? '').localeCompare(b.bundle.meta.title ?? ''),
  );
  return scored.map((s) => s.bundle);
}

const byName = (a: { name?: string }, b: { name?: string }) =>
  (a.name ?? '').localeCompare(b.name ?? '');

/** Modules grouped into Category → Subcategory → Module for the Home screen. */
export function getCategoryGroups(): CategoryGroup[] {
  const categories = new Map<string, CategoryGroup>();

  for (const bundle of REGISTRY.values()) {
    let category = categories.get(bundle.categorySlug);
    if (!category) {
      category = {
        slug: bundle.categorySlug,
        name: bundle.categoryName,
        subcategories: [],
        bookCount: bookCountByCategory.get(bundle.categorySlug) ?? 0,
      };
      categories.set(bundle.categorySlug, category);
    }

    let subcategory = category.subcategories.find(
      (s) => s.slug === bundle.subcategorySlug,
    );
    if (!subcategory) {
      subcategory = {
        slug: bundle.subcategorySlug,
        name: bundle.subcategoryName,
        modules: [],
      } satisfies SubcategoryGroup;
      category.subcategories.push(subcategory);
    }

    subcategory.modules.push(bundle);
  }

  const groups = [...categories.values()];
  groups.sort(byName);
  for (const group of groups) {
    group.subcategories.sort(byName);
    for (const sub of group.subcategories) {
      sub.modules.sort((a, b) =>
        (a.meta.title ?? a.slug).localeCompare(b.meta.title ?? b.slug),
      );
    }
  }
  return groups;
}

/** A single category group (with its published modules) by slug, or undefined. */
export function getCategory(slug: string): CategoryGroup | undefined {
  return getCategoryGroups().find((group) => group.slug === slug);
}

/** Total number of discovered modules (used in the Home hero). */
export function moduleCount(): number {
  return REGISTRY.size;
}
