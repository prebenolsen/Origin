/**
 * Origin content data model.
 *
 * These types describe the JSON files that live under
 * `src/content/<category>/<subcategory>/<module>/`. They are the contract
 * between the (separately authored) educational content and the learning
 * engine. Keep them backward compatible — adding optional fields is safe.
 */

/* ----------------------------- module.json ----------------------------- */

export interface ModuleMeta {
  /** Display title of the module, e.g. "Transatlantic Slave Trade". */
  title: string;
  /** Human-readable time span, e.g. "1500s–1800s" or "1861–1865". */
  period?: string;
  /** Category slug (usually matches the folder). Optional / informational. */
  category?: string;
  /** Subcategory slug (usually matches the folder). Optional / informational. */
  subcategory?: string;
  /** One-sentence hook shown on the module card and intro. */
  summary?: string;
  /** Optional accent override (hex) for theming a module. */
  accent?: string;
  /** The context-introduction layer (where / who / when / what). */
  context: ContextIntro;
}

/** The "Context Introduction" shown before the story begins. */
export interface ContextIntro {
  /**
   * `map`       — render the stylized context map (markers + connections).
   * `image`     — render a provided image (`image`) with the explanation.
   * `schematic` — same as map; kept as an alias for non-geographic overviews.
   */
  type: 'map' | 'image' | 'schematic';
  /** Optional short headline above the explanation. */
  headline?: string;
  /** The explanation paragraph (kept short). */
  description: string;
  /** Optional "when" label, e.g. "1500s – 1800s". */
  when?: string;
  /** Optional image filename (used when `type === 'image'`). */
  image?: string;
  /** Map data used when `type` is `map` or `schematic`. */
  map?: ContextMapData;
}

export interface ContextMapData {
  /**
   * Backdrop style for the stylized map.
   * `world` and `region` differ only cosmetically.
   */
  backdrop?: 'world' | 'region';
  /**
   * Optional explicit geographic frame for `geo` maps, as
   * `[west, south, east, north]` in degrees. When omitted, the map auto-frames
   * to fit all markers with padding. Ignored by schematic maps.
   */
  focus?: [number, number, number, number];
  markers: ContextMarker[];
  connections?: ContextConnection[];
}

export interface ContextMarker {
  id: string;
  label: string;
  /**
   * Real-world coordinates in degrees. When BOTH `lat` and `lng` are present
   * on every marker, the map renders as a real `geo` map (actual coastlines,
   * correct projection). Prefer these for any geographic topic.
   */
  lat?: number;
  lng?: number;
  /**
   * Schematic position as percentages of the map box (0–100). Used as a
   * fallback for non-geographic / concept maps when `lat`/`lng` are absent.
   * Optional so geographic markers don't need to specify them.
   */
  x?: number;
  y?: number;
  /** `primary` markers are emphasized. */
  role?: 'primary' | 'secondary';
}

export interface ContextConnection {
  from: string; // marker id
  to: string; // marker id
  label?: string;
}

/* ------------------------------ story.json ------------------------------ */

export interface StoryCard {
  id: number | string;
  /** Year / period this card sits at — drives the persistent timeline. */
  timeline?: string;
  title: string;
  /** Body text. One idea per card; ~10–30s to read. */
  content: string;
  /** Curiosity hook leading into the next card. */
  next?: string;
  /** Optional visual: an image filename or a built-in illustration key. */
  visual?: string;
}

/* ---------------------------- book-*.json ----------------------------- */

export interface BookCard {
  id: number | string;
  timeline?: string;
  title: string;
  content: string;
  concept?: string;
  next?: string;
}

export interface ModuleBook {
  /** File-based identifier, e.g. `book-atomic-habits`. */
  id: string;
  /** Humanized title from the filename, e.g. `Atomic Habits`. */
  title: string;
  cards: BookCard[];
}

/* ----------------------------- timeline.json ---------------------------- */

export interface TimelineEvent {
  year: string;
  title: string;
}

/* ------------------------------- quiz.json ------------------------------ */

export type QuizQuestion =
  | MultipleChoiceQuestion
  | TrueFalseQuestion
  | OrderingQuestion
  | MatchingQuestion;

interface QuizBase {
  id?: number | string;
  question: string;
  /** Shown after answering. */
  explanation?: string;
}

export interface MultipleChoiceQuestion extends QuizBase {
  type: 'multiple-choice';
  options: string[];
  /** Index of the correct option. */
  answer: number;
}

export interface TrueFalseQuestion extends QuizBase {
  type: 'true-false';
  answer: boolean;
}

export interface OrderingQuestion extends QuizBase {
  type: 'ordering';
  /** Items presented to the learner (in any order). */
  items: string[];
  /**
   * The correct sequence as indices into `items`.
   * If omitted, `items` is assumed to already be in the correct order.
   */
  correctOrder?: number[];
}

export interface MatchingQuestion extends QuizBase {
  type: 'matching';
  pairs: { left: string; right: string }[];
}

/* ---------------------------- flashcards.json --------------------------- */

export interface Flashcard {
  id: number | string;
  front: string;
  back: string;
}

/* --------------------- assembled, in-app representation ------------------ */

/** Everything the app needs to run a single module. */
export interface ModuleBundle {
  /** `category/subcategory/module` slug path — the module's unique key. */
  path: string;
  categorySlug: string;
  subcategorySlug: string;
  slug: string;
  /** Humanized display names. */
  categoryName: string;
  subcategoryName: string;
  meta: ModuleMeta;
  story: StoryCard[];
  timeline: TimelineEvent[];
  quiz: QuizQuestion[];
  flashcards: Flashcard[];
  books: ModuleBook[];
}

/** Grouping used by the Home screen. */
export interface CategoryGroup {
  slug: string;
  name: string;
  subcategories: SubcategoryGroup[];
  /** Number of book JSON files discovered in this category. */
  bookCount: number;
}

export interface SubcategoryGroup {
  slug: string;
  name: string;
  modules: ModuleBundle[];
}
