#!/usr/bin/env node
/**
 * Validate Origin module content under src/content/<category>/** (everything
 * EXCEPT src/content/languages, which has its own validator in the
 * spanish-content skill).
 *
 * Usage:  node .claude/skills/module-content/scripts/validate-content.mjs [categorySlug]
 *
 * Enforces the rules in the module-content skill: valid JSON, no BOM, ASCII
 * dashes (warn), required module.json fields, a sane context block, map
 * consistency (all-geo vs schematic, connection ids resolve), `period` is
 * history-only, per-type quiz correctness, story/flashcard/book shapes, and it
 * flags PLACEHOLDER modules as hidden. Exits non-zero on errors (warnings don't
 * fail).
 */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '../../../..');
const root = join(repoRoot, 'src', 'content');

const onlyCat = process.argv[2];
const errors = [];
const warnings = [];
let placeholders = 0;
let modules = 0;

const rel = (p) => p.replace(repoRoot + '\\', '').replace(repoRoot + '/', '').replace(/\\/g, '/');
const err = (p, m) => errors.push(`${rel(p)}: ${m}`);
const warn = (p, m) => warnings.push(`${rel(p)}: ${m}`);

const VALID_CONTEXT_TYPES = ['map', 'image', 'schematic'];
const VALID_QUIZ_TYPES = ['multiple-choice', 'true-false', 'ordering', 'matching'];
const DASHES = /[‒–—―−]/; // figure/en/em/horizontal-bar/minus

function dirs(p) {
  if (!existsSync(p)) return [];
  return readdirSync(p).filter((n) => statSync(join(p, n)).isDirectory());
}

/** Parse JSON, recording BOM and parse errors. Returns value or undefined. */
function loadJson(path) {
  if (!existsSync(path)) return undefined;
  let raw = readFileSync(path, 'utf8');
  if (raw.charCodeAt(0) === 0xfeff) {
    err(path, 'file has a UTF-8 BOM (must be UTF-8 without BOM)');
    raw = raw.slice(1);
  }
  try {
    return JSON.parse(raw);
  } catch (e) {
    err(path, `invalid JSON - ${e.message}`);
    return undefined;
  }
}

/** Recursively warn on typographic dashes (ASCII '-' is preferred, but a date
 *  range in `period` is a legitimate editorial exception, so this only warns). */
function checkDashes(path, value) {
  if (typeof value === 'string') {
    if (DASHES.test(value)) warn(path, `typographic dash in "${value}" - prefer ASCII '-'`);
  } else if (Array.isArray(value)) {
    value.forEach((v) => checkDashes(path, v));
  } else if (value && typeof value === 'object') {
    Object.values(value).forEach((v) => checkDashes(path, v));
  }
}

const isStr = (v) => typeof v === 'string' && v.trim().length > 0;
const isPlaceholder = (meta) =>
  String(meta?.title ?? '').trimStart().toUpperCase().startsWith('PLACEHOLDER');

function validateMap(path, map, isHistory) {
  if (!map || typeof map !== 'object') return err(path, 'context.map must be an object');
  const markers = map.markers;
  if (!Array.isArray(markers) || markers.length === 0)
    return err(path, 'context.map needs a non-empty "markers" array');

  const ids = new Set();
  let geoCount = 0;
  markers.forEach((m, i) => {
    const at = `marker ${i}`;
    if (!isStr(m?.id)) err(path, `${at}: missing "id"`);
    else {
      if (ids.has(m.id)) err(path, `${at}: duplicate id "${m.id}"`);
      ids.add(m.id);
    }
    if (!isStr(m?.label)) err(path, `${at} (${m?.id ?? '?'}): missing "label"`);
    const hasGeo = typeof m?.lat === 'number' && typeof m?.lng === 'number';
    const hasXY = typeof m?.x === 'number' && typeof m?.y === 'number';
    if (hasGeo) {
      geoCount++;
      if (m.lat < -90 || m.lat > 90) err(path, `${at}: lat ${m.lat} out of range [-90,90]`);
      if (m.lng < -180 || m.lng > 180) err(path, `${at}: lng ${m.lng} out of range [-180,180]`);
    } else if (!hasXY) {
      err(path, `${at} (${m?.id ?? '?'}): needs either lat+lng (geo) or x+y (schematic)`);
    }
  });

  // The engine renders a real map ONLY when EVERY marker has lat+lng; a mixed
  // set silently falls back to schematic and drops the geo markers' positions.
  if (geoCount > 0 && geoCount < markers.length)
    err(
      path,
      `mixed map markers: ${geoCount}/${markers.length} have lat+lng. Make ALL geo or ALL schematic (x/y).`,
    );

  for (const c of map.connections ?? []) {
    if (!ids.has(c?.from)) err(path, `connection "from" -> unknown marker id "${c?.from}"`);
    if (!ids.has(c?.to)) err(path, `connection "to" -> unknown marker id "${c?.to}"`);
  }
  if (markers.length > 8)
    warn(path, `${markers.length} markers - keep it ~3-6 so labels don't tangle`);
}

/** Returns true if the module is a hidden PLACEHOLDER scaffold (skip its files). */
function validateModuleMeta(path, isHistory) {
  const meta = loadJson(path);
  if (meta === undefined) {
    err(dirname(path), 'missing or invalid module.json');
    return false;
  }
  checkDashes(path, meta);

  if (isPlaceholder(meta)) {
    placeholders++;
    return true; // scaffold: intentionally unfinished, hidden by the engine
  }
  modules++;

  for (const f of ['title', 'summary']) if (!isStr(meta[f])) err(path, `missing "${f}"`);
  if (!isHistory && meta.period !== undefined)
    warn(path, '"period" is history-only - non-history modules should use context.when');

  const ctx = meta.context;
  if (!ctx || typeof ctx !== 'object') return err(path, 'missing "context" object');
  if (!VALID_CONTEXT_TYPES.includes(ctx.type))
    err(path, `context.type "${ctx.type}" must be one of ${VALID_CONTEXT_TYPES.join(', ')}`);
  if (!isStr(ctx.description)) warn(path, 'context has no "description"');

  if (ctx.type === 'image') {
    if (!isStr(ctx.image)) warn(path, 'context.type "image" but no "image" filename');
  } else if (ctx.map) {
    validateMap(path, ctx.map, isHistory);
  } else {
    warn(path, `context.type "${ctx.type}" but no "map" data`);
  }
  return false;
}

function validateStory(path) {
  const data = loadJson(path);
  if (data === undefined) return;
  checkDashes(path, data);
  if (!Array.isArray(data)) return err(path, 'story.json must be an array');
  data.forEach((c, i) => {
    if (!isStr(c?.title)) err(path, `card ${i}: missing "title"`);
    if (!isStr(c?.content)) err(path, `card ${i}: missing "content"`);
    if (isStr(c?.content) && c.content.length > 700)
      warn(path, `card ${i}: content is long (${c.content.length} chars) - one idea, ~10-30s read`);
  });
}

function validateTimeline(path) {
  const data = loadJson(path);
  if (data === undefined) return;
  checkDashes(path, data);
  if (!Array.isArray(data)) return err(path, 'timeline.json must be an array');
  data.forEach((e, i) => {
    if (!isStr(e?.year)) err(path, `event ${i}: missing "year"`);
    if (!isStr(e?.title)) err(path, `event ${i}: missing "title"`);
  });
}

function validateQuiz(path) {
  const data = loadJson(path);
  if (data === undefined) return;
  checkDashes(path, data);
  if (!Array.isArray(data)) return err(path, 'quiz.json must be an array');

  const mcAnswers = [];
  data.forEach((q, i) => {
    const at = `question ${i}`;
    if (!isStr(q?.question)) err(path, `${at}: missing "question"`);
    if (!VALID_QUIZ_TYPES.includes(q?.type))
      return err(path, `${at}: type "${q?.type}" must be one of ${VALID_QUIZ_TYPES.join(', ')}`);
    if (!isStr(q?.explanation)) warn(path, `${at}: no "explanation"`);

    if (q.type === 'multiple-choice') {
      if (!Array.isArray(q.options) || q.options.length < 2)
        err(path, `${at}: needs >=2 "options"`);
      else if (typeof q.answer !== 'number' || q.answer < 0 || q.answer >= q.options.length)
        err(path, `${at}: "answer" ${q.answer} out of options range`);
      else mcAnswers.push(q.answer);
    } else if (q.type === 'true-false') {
      if (typeof q.answer !== 'boolean') err(path, `${at}: "answer" must be true/false`);
    } else if (q.type === 'ordering') {
      if (!Array.isArray(q.items) || q.items.length < 2) err(path, `${at}: needs >=2 "items"`);
      else if (q.correctOrder !== undefined) {
        const n = q.items.length;
        const ok =
          Array.isArray(q.correctOrder) &&
          q.correctOrder.length === n &&
          [...q.correctOrder].sort((a, b) => a - b).every((v, k) => v === k);
        if (!ok) err(path, `${at}: "correctOrder" must be a permutation of 0..${n - 1}`);
      }
    } else if (q.type === 'matching') {
      if (!Array.isArray(q.pairs) || q.pairs.length < 2) err(path, `${at}: needs >=2 "pairs"`);
      else
        q.pairs.forEach((p, k) => {
          if (!isStr(p?.left) || !isStr(p?.right)) err(path, `${at} pair ${k}: needs "left" + "right"`);
        });
    }
  });

  // The brief insists the correct multiple-choice index be randomized; all-same
  // is the classic tell of un-shuffled answers.
  if (mcAnswers.length >= 3 && new Set(mcAnswers).size === 1)
    warn(path, `all ${mcAnswers.length} multiple-choice answers are index ${mcAnswers[0]} - randomize them`);
}

function validateFlashcards(path) {
  const data = loadJson(path);
  if (data === undefined) return;
  checkDashes(path, data);
  if (!Array.isArray(data)) return err(path, 'flashcards.json must be an array');
  data.forEach((c, i) => {
    if (!isStr(c?.front)) err(path, `card ${i}: missing "front"`);
    if (!isStr(c?.back)) err(path, `card ${i}: missing "back"`);
  });
}

function validateBook(path) {
  const data = loadJson(path);
  if (data === undefined) return;
  checkDashes(path, data);
  if (!Array.isArray(data)) return err(path, `${basename(path)} must be an array`);
  data.forEach((c, i) => {
    if (!isStr(c?.title)) err(path, `${basename(path)} card ${i}: missing "title"`);
    if (!isStr(c?.content)) err(path, `${basename(path)} card ${i}: missing "content"`);
  });
}

function validateModule(modDir, isHistory) {
  const modulePath = join(modDir, 'module.json');
  if (!existsSync(modulePath)) {
    // Not every folder is a module leaf; only flag a leaf that has content but
    // no module.json.
    const hasContent = ['story', 'timeline', 'quiz', 'flashcards'].some((f) =>
      existsSync(join(modDir, `${f}.json`)),
    );
    if (hasContent) err(modDir, 'has content files but no module.json');
    return;
  }
  // Placeholder scaffolds ship with stub (non-array) content files on purpose;
  // they're hidden by the engine, so don't validate their bodies.
  if (validateModuleMeta(modulePath, isHistory)) return;
  if (existsSync(join(modDir, 'story.json'))) validateStory(join(modDir, 'story.json'));
  if (existsSync(join(modDir, 'timeline.json'))) validateTimeline(join(modDir, 'timeline.json'));
  if (existsSync(join(modDir, 'quiz.json'))) validateQuiz(join(modDir, 'quiz.json'));
  if (existsSync(join(modDir, 'flashcards.json'))) validateFlashcards(join(modDir, 'flashcards.json'));
  for (const f of readdirSync(modDir))
    if (/^book-.*\.json$/i.test(f)) validateBook(join(modDir, f));
}

if (!existsSync(root)) {
  console.error(`No content directory at ${rel(root)}`);
  process.exit(2);
}

// src/content/<category>/<subcategory>/<module>/, skipping the languages domain.
const cats = dirs(root).filter((c) => c !== 'languages' && (!onlyCat || c === onlyCat));
for (const cat of cats) {
  const isHistory = cat === 'history';
  for (const sub of dirs(join(root, cat)))
    for (const mod of dirs(join(root, cat, sub)))
      validateModule(join(root, cat, sub, mod), isHistory);
}

for (const w of warnings) console.log(`  warn  ${w}`);
for (const e of errors) console.error(`  ERROR ${e}`);
console.log(
  `\nValidated ${cats.length} category(ies): ${modules} published module(s), ` +
    `${placeholders} placeholder(s) hidden, ${errors.length} error(s), ${warnings.length} warning(s).`,
);
process.exit(errors.length ? 1 : 0);
