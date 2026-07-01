#!/usr/bin/env node
/**
 * Validate Origin language content under src/content/languages/**.
 *
 * Usage:  node .claude/skills/spanish-content/scripts/validate-content.mjs [langSlug]
 *
 * Enforces the rules in the spanish-content skill: valid JSON, no BOM, no
 * typographic dashes, required fields, valid module `kind`, non-placeholder
 * modules have every `es` filled, no duplicate words within a module, chapters
 * reference real modules, and personalize structure. Exits non-zero on errors.
 */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '../../../..');
const root = join(repoRoot, 'src', 'content', 'languages');

const onlyLang = process.argv[2];
const errors = [];
const warnings = [];
const rel = (p) => p.replace(repoRoot + '\\', '').replace(repoRoot + '/', '').replace(/\\/g, '/');
const err = (p, m) => errors.push(`${rel(p)}: ${m}`);
const warn = (p, m) => warnings.push(`${rel(p)}: ${m}`);

const VALID_KINDS = ['standard', 'personalized', 'placeholder'];
const VALID_FORMATS = ['lesson', 'conversation'];
const VALID_Q_TYPES = ['multiple-choice', 'true-false', 'who-said-it', 'ordering'];
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

/** Recursively flag typographic dashes in any string value. */
function checkDashes(path, value) {
  if (typeof value === 'string') {
    if (DASHES.test(value)) err(path, `typographic dash in "${value}" - use ASCII '-'`);
  } else if (Array.isArray(value)) {
    value.forEach((v) => checkDashes(path, v));
  } else if (value && typeof value === 'object') {
    Object.values(value).forEach((v) => checkDashes(path, v));
  }
}

/** Same normalization as srs.vocabId - the identity of a word. */
function vocabId(es) {
  return String(es)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function validateVocab(path, kind) {
  const data = loadJson(path);
  if (data === undefined) return;
  checkDashes(path, data);
  if (!Array.isArray(data)) {
    err(path, 'vocabulary.json must be an array');
    return;
  }
  const seen = new Map();
  data.forEach((item, i) => {
    const at = `item ${i}`;
    if (!item || typeof item !== 'object') return err(path, `${at}: not an object`);
    if (!item.en || !String(item.en).trim()) err(path, `${at}: missing "en"`);
    const es = String(item.es ?? '').trim();
    if (!es) {
      if (kind !== 'placeholder') err(path, `${at} (${item.en}): empty "es" in a non-placeholder module`);
      return; // placeholder blanks are expected
    }
    if (!item.category) warn(path, `${at} (${item.en}): no "category" - hurts smart distractors`);
    const id = vocabId(es);
    if (seen.has(id)) err(path, `${at}: duplicate word "${es}" (also item ${seen.get(id)})`);
    else seen.set(id, i);
  });
  // Only nudge fully-authored standard modules: personalized sets are base +
  // learner picks (count varies), and placeholders aren't taught yet.
  if (kind === 'standard' && data.length && data.length % 3 !== 0) {
    warn(path, `${data.length} words - not a multiple of 3, the last batch will be small`);
  }
}

function validateLesson(path) {
  const data = loadJson(path);
  if (data === undefined) return;
  checkDashes(path, data);
  if (typeof data.context !== 'string' || !data.context.trim()) warn(path, 'missing "context"');
  if (typeof data.explanation !== 'string' || !data.explanation.trim()) warn(path, 'missing "explanation"');
  for (const ex of data.examples ?? []) {
    if (!ex.es || !ex.en) err(path, 'an example is missing "es" or "en"');
  }
}

function validatePersonalize(path) {
  const data = loadJson(path);
  if (data === undefined) return;
  checkDashes(path, data);
  if (!data.prompt) err(path, 'personalize.json missing "prompt"');
  if (!Array.isArray(data.groups) || data.groups.length === 0) {
    err(path, 'personalize.json needs a non-empty "groups" array');
    return;
  }
  for (const g of data.groups) {
    if (!g.category || !g.label) err(path, `group missing "category"/"label"`);
    if (!Array.isArray(g.options) || g.options.length === 0) err(path, `group "${g.label}" has no options`);
    for (const o of g.options ?? []) if (!o.en) err(path, `an option in "${g.label}" is missing "en"`);
  }
}

function validateComprehensionQuestion(path, q, i) {
  const at = `question ${i}`;
  if (!q || typeof q !== 'object') return err(path, `${at}: not an object`);
  if (!VALID_Q_TYPES.includes(q.type))
    return err(path, `${at}: type "${q.type}" must be one of ${VALID_Q_TYPES.join(', ')}`);
  if (q.type === 'multiple-choice') {
    if (!q.prompt) err(path, `${at}: missing "prompt"`);
    if (!Array.isArray(q.options) || q.options.length < 2) err(path, `${at}: needs >= 2 "options"`);
    if (typeof q.answer !== 'number' || q.answer < 0 || q.answer >= (q.options?.length ?? 0))
      err(path, `${at}: "answer" must index into "options"`);
  } else if (q.type === 'true-false') {
    if (!q.prompt) err(path, `${at}: missing "prompt"`);
    if (typeof q.answer !== 'boolean') err(path, `${at}: "answer" must be true/false`);
  } else if (q.type === 'who-said-it') {
    if (!q.quote) err(path, `${at}: missing "quote"`);
    if (!Array.isArray(q.options) || q.options.length < 2) err(path, `${at}: needs >= 2 "options"`);
    if (typeof q.answer !== 'number' || q.answer < 0 || q.answer >= (q.options?.length ?? 0))
      err(path, `${at}: "answer" must index into "options"`);
  } else if (q.type === 'ordering') {
    if (!q.prompt) err(path, `${at}: missing "prompt"`);
    if (!Array.isArray(q.items) || q.items.length < 2) err(path, `${at}: needs >= 2 "items"`);
  }
}

function validateConversation(path, kind) {
  const data = loadJson(path);
  if (data === undefined) return;
  checkDashes(path, data);
  const placeholder = kind === 'placeholder';

  if (!Array.isArray(data.speakers) || data.speakers.length < 2) {
    if (!placeholder) err(path, 'conversation needs at least 2 "speakers"');
  }
  const ids = new Set();
  for (const s of data.speakers ?? []) {
    if (!s.id) err(path, 'a speaker is missing "id"');
    else ids.add(s.id);
    if (!placeholder && !s.name) err(path, `speaker "${s.id}" is missing "name"`);
    if (s.side && s.side !== 'left' && s.side !== 'right')
      err(path, `speaker "${s.id}" side must be "left" or "right"`);
  }

  const messages = data.messages ?? [];
  if (!Array.isArray(messages)) return err(path, '"messages" must be an array');
  if (!placeholder && messages.length === 0) err(path, 'conversation has no "messages"');
  messages.forEach((m, i) => {
    const at = `message ${i}`;
    if (!m.es || !String(m.es).trim()) err(path, `${at}: missing "es"`);
    if (!m.en || !String(m.en).trim()) err(path, `${at}: missing "en" translation`);
    if (m.speaker && ids.size && !ids.has(m.speaker))
      err(path, `${at}: speaker "${m.speaker}" is not a declared speaker id`);
    for (const w of m.words ?? [])
      if (!w.es || !w.en) err(path, `${at}: a word gloss is missing "es"/"en"`);
  });

  const questions = data.questions ?? [];
  if (!placeholder) {
    if (questions.length < 3 || questions.length > 5)
      warn(path, `${questions.length} comprehension questions - aim for 3 to 5`);
  }
  questions.forEach((q, i) => validateComprehensionQuestion(path, q, i));
}

function validateModule(moduleDir) {
  const slug = basename(moduleDir);
  const mPath = join(moduleDir, 'module.json');
  const meta = loadJson(mPath);
  if (meta === undefined) {
    err(moduleDir, 'missing module.json');
    return { slug, kind: undefined };
  }
  checkDashes(mPath, meta);
  for (const f of ['slug', 'title', 'summary']) if (!meta[f]) err(mPath, `missing "${f}"`);
  if (meta.slug && meta.slug !== slug) err(mPath, `slug "${meta.slug}" != folder "${slug}"`);
  if (!VALID_KINDS.includes(meta.kind)) err(mPath, `kind "${meta.kind}" must be one of ${VALID_KINDS.join(', ')}`);
  if (meta.format !== undefined && !VALID_FORMATS.includes(meta.format))
    err(mPath, `format "${meta.format}" must be one of ${VALID_FORMATS.join(', ')}`);

  const isConversation = meta.format === 'conversation';
  const convPath = join(moduleDir, 'conversation.json');

  if (isConversation) {
    // A conversation module reinforces known words; it teaches no new vocab, so
    // it needs conversation.json instead of vocabulary.json.
    if (existsSync(convPath)) validateConversation(convPath, meta.kind);
    else err(moduleDir, 'conversation module without conversation.json');
  } else {
    if (existsSync(convPath))
      err(convPath, 'conversation.json present but module.json format is not "conversation"');
    if (existsSync(join(moduleDir, 'vocabulary.json'))) validateVocab(join(moduleDir, 'vocabulary.json'), meta.kind);
    else if (meta.kind !== 'placeholder') warn(moduleDir, 'no vocabulary.json');
  }

  if (existsSync(join(moduleDir, 'lesson.json'))) validateLesson(join(moduleDir, 'lesson.json'));
  if (existsSync(join(moduleDir, 'personalize.json'))) validatePersonalize(join(moduleDir, 'personalize.json'));
  else if (meta.kind === 'personalized') warn(moduleDir, 'personalized module without personalize.json');

  return { slug, kind: meta.kind };
}

function validateLanguage(langDir) {
  const langPath = join(langDir, 'language.json');
  const lang = loadJson(langPath);
  if (lang === undefined) {
    err(langDir, 'missing language.json');
    return;
  }
  checkDashes(langPath, lang);
  for (const f of ['code', 'name', 'nativeName']) if (!lang[f]) err(langPath, `missing "${f}"`);

  // Modules live one chapter folder deep: chapters/<chapter>/<slug>/.
  const chaptersRoot = join(langDir, 'chapters');
  const found = new Set();
  for (const chapter of dirs(chaptersRoot))
    for (const d of dirs(join(chaptersRoot, chapter)))
      found.add(validateModule(join(chaptersRoot, chapter, d)).slug);

  for (const chapter of lang.chapters ?? []) {
    if (chapter.available && (!chapter.modules || chapter.modules.length === 0))
      warn(langPath, `chapter "${chapter.slug}" is available but lists no modules`);
    for (const m of chapter.modules ?? [])
      if (!found.has(m)) err(langPath, `chapter "${chapter.slug}" references missing module "${m}"`);
  }
}

if (!existsSync(root)) {
  console.error(`No content directory at ${rel(root)}`);
  process.exit(2);
}
const langs = dirs(root).filter((l) => !onlyLang || l === onlyLang);
langs.forEach((l) => validateLanguage(join(root, l)));

for (const w of warnings) console.log(`  warn  ${w}`);
for (const e of errors) console.error(`  ERROR ${e}`);
console.log(
  `\nValidated ${langs.length} language(s): ${errors.length} error(s), ${warnings.length} warning(s).`,
);
process.exit(errors.length ? 1 : 0);
