import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const spanishRoot = path.join(repoRoot, 'src', 'content', 'languages', 'spanish');
const languagePath = path.join(spanishRoot, 'language.json');
const wordsTaughtPath = path.join(spanishRoot, 'words-taught.md');

const language = JSON.parse(fs.readFileSync(languagePath, 'utf8'));

const lines = ['# Spanish Words Taught (English)', ''];
const seen = new Set();
let cumulative = 0;

for (let i = 0; i < language.chapters.length; i += 1) {
  const chapter = language.chapters[i];
  const chapterWords = [];
  const inChapter = new Set();

  for (const moduleSlug of chapter.modules) {
    const moduleDir = path.join(spanishRoot, 'chapters', chapter.slug, moduleSlug);

    const vocabularyPath = path.join(moduleDir, 'vocabulary.json');
    if (fs.existsSync(vocabularyPath)) {
      const vocabulary = JSON.parse(fs.readFileSync(vocabularyPath, 'utf8'));
      for (const item of vocabulary) {
        const en = String(item.en ?? '').trim();
        if (!en) continue;
        const key = en.toLowerCase();
        if (seen.has(key) || inChapter.has(key)) continue;
        inChapter.add(key);
        chapterWords.push(en);
      }
    }

    const personalizePath = path.join(moduleDir, 'personalize.json');
    if (fs.existsSync(personalizePath)) {
      const personalize = JSON.parse(fs.readFileSync(personalizePath, 'utf8'));
      for (const group of personalize.groups ?? []) {
        for (const option of group.options ?? []) {
          const en = String(option.en ?? '').trim();
          if (!en) continue;
          const key = en.toLowerCase();
          if (seen.has(key) || inChapter.has(key)) continue;
          inChapter.add(key);
          chapterWords.push(en);
        }
      }
    }
  }

  for (const word of chapterWords) {
    seen.add(word.toLowerCase());
  }

  cumulative += chapterWords.length;

  lines.push(`## Chapter ${i + 1}: ${chapter.title}`);
  lines.push(`Total new word entries: ${chapterWords.length}`);
  if (i > 0) {
    lines.push(`Total new words so far: ${cumulative}`);
  }
  lines.push('List of words taught in this chapter:');
  for (const word of chapterWords) {
    lines.push(`- ${word}`);
  }
  lines.push('');
}

fs.writeFileSync(wordsTaughtPath, `${lines.join('\n')}\n`, 'utf8');

console.log('Spanish words-taught synced.');
console.log(`Chapters: ${language.chapters.length}`);
console.log(`Cumulative unique words: ${cumulative}`);
