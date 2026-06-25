/**
 * Content registry.
 *
 * Auto-discovers every module under `src/content/<category>/<subcategory>/
 * <module>/` at build time. To add a module, drop in a folder with a
 * `module.json` (and optional story/timeline/quiz/flashcards) — no code
 * changes required.
 */
import type {
  CategoryGroup,
  Flashcard,
  ModuleBundle,
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

function categoryName(slug: string): string {
  return CATEGORY_DISPLAY[slug] ?? humanize(slug);
}

function buildBundles(): Map<string, ModuleBundle> {
  const bundles = new Map<string, ModuleBundle>();
  for (const key of Object.keys(metaFiles)) {
    const parts = parseKey(key);
    if (!parts) continue;
    const path = `${parts.cat}/${parts.sub}/${parts.mod}`;
    const meta = metaFiles[key] as ModuleMeta;
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

/** Total number of discovered modules (used in the Home hero). */
export function moduleCount(): number {
  return REGISTRY.size;
}
