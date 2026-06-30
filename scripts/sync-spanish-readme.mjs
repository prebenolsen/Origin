import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const spanishRoot = path.join(repoRoot, 'src', 'content', 'languages', 'spanish');
const languagePath = path.join(spanishRoot, 'language.json');
const readmePath = path.join(spanishRoot, 'README.md');
const scenariosRoot = path.join(spanishRoot, 'scenarios');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function replaceOrThrow(text, pattern, replacement, label) {
  if (!pattern.test(text)) {
    throw new Error(`Could not update section: ${label}`);
  }
  return text.replace(pattern, replacement);
}

const language = readJson(languagePath);
const goals = language.goals ?? [];
const goalCount = goals.length;
const scenarioCount = goals.reduce((sum, goal) => sum + (goal.scenarios?.length ?? 0), 0);

const goalLines = goals
  .map((goal, index) => `${index + 1}. ${goal.title} (${goal.scenarios.length} scenarios)`)
  .join('\n');

const scenarioDirs = [];
for (const goalSlug of fs.readdirSync(scenariosRoot)) {
  const goalDir = path.join(scenariosRoot, goalSlug);
  if (!fs.statSync(goalDir).isDirectory()) continue;
  for (const scenarioSlug of fs.readdirSync(goalDir)) {
    const scenarioDir = path.join(goalDir, scenarioSlug);
    if (fs.statSync(scenarioDir).isDirectory()) {
      scenarioDirs.push(scenarioDir);
    }
  }
}

let vocabFiles = 0;
let sentFiles = 0;
let personalizeFiles = 0;
let totalVocabEntries = 0;
const uniqueSpanish = new Set();
const vocabularyCategories = new Set();

for (const dir of scenarioDirs) {
  const vocabularyPath = path.join(dir, 'vocabulary.json');
  const sentencesPath = path.join(dir, 'sentences.json');
  const personalizePath = path.join(dir, 'personalize.json');

  if (fs.existsSync(vocabularyPath)) {
    vocabFiles += 1;
    const vocabulary = readJson(vocabularyPath);
    totalVocabEntries += vocabulary.length;

    for (const item of vocabulary) {
      const es = String(item.es ?? '').trim().toLowerCase();
      if (es) uniqueSpanish.add(es);
      const category = String(item.category ?? '').trim();
      if (category) vocabularyCategories.add(category);
    }
  }

  if (fs.existsSync(sentencesPath)) sentFiles += 1;
  if (fs.existsSync(personalizePath)) personalizeFiles += 1;
}

let readme = fs.readFileSync(readmePath, 'utf8');
const hasCrLf = readme.includes('\r\n');
readme = readme.replace(/\r\n/g, '\n');

readme = replaceOrThrow(
  readme,
  /The Spanish path currently has \d+ goals \(all available\) and \d+ authored scenarios total\./,
  `The Spanish path currently has ${goalCount} goals (all available) and ${scenarioCount} authored scenarios total.`,
  'goal/scenario headline'
);

readme = replaceOrThrow(
  readme,
  /1\.[\s\S]*?\n\nTogether, these goals cover/,
  `${goalLines}\n\nTogether, these goals cover`,
  'goal list'
);

readme = replaceOrThrow(
  readme,
  /- Modules\/goals:.*\n(?:- Modules\/goals:.*\n)?- Sections\/scenarios:.*\n- Vocabulary categories:.*\n/,
  `- Modules/goals: the ${goalCount} goals listed above\n- Sections/scenarios: ${scenarioCount} scenario folders (each with \`scenario.json\` and \`lesson.json\`, plus vocabulary and optional sentence/personalization files)\n- Vocabulary categories: ${vocabularyCategories.size} authored category labels in \`vocabulary.json\` files (examples include question, phrase, numbers, routine, place, time, greetings, family, food, navigation, colors, connectors, and verb-focused groups)\n`,
  'coverage bullets'
);

readme = replaceOrThrow(
  readme,
  /- \d+ \`vocabulary\.json\` files/,
  `- ${vocabFiles} \`vocabulary.json\` files`,
  'vocabulary file count'
);

readme = replaceOrThrow(
  readme,
  /- \d+ \`sentences\.json\` files/,
  `- ${sentFiles} \`sentences.json\` files`,
  'sentences file count'
);

readme = replaceOrThrow(
  readme,
  /- \d+ \`personalize\.json\` files/,
  `- ${personalizeFiles} \`personalize.json\` files`,
  'personalize file count'
);

readme = replaceOrThrow(
  readme,
  /- \d+ total vocabulary entries/,
  `- ${totalVocabEntries} total vocabulary entries`,
  'total vocabulary entries'
);

readme = replaceOrThrow(
  readme,
  /- \d+ unique Spanish vocabulary items/,
  `- ${uniqueSpanish.size} unique Spanish vocabulary items`,
  'unique vocabulary items'
);

readme = replaceOrThrow(
  readme,
  /The practical headline number for component scope is \d+ unique taught Spanish items so far\./,
  `The practical headline number for component scope is ${uniqueSpanish.size} unique taught Spanish items so far.`,
  'headline unique total'
);

if (!readme.includes('Run `npm run sync:spanish-readme`')) {
  readme = replaceOrThrow(
    readme,
    /5\. Summary wording if new capability or review behavior was added/,
    '5. Summary wording if new capability or review behavior was added\n6. Run `npm run sync:spanish-readme` after content edits to refresh counts automatically',
    'maintenance command hint'
  );
}

if (hasCrLf) {
  readme = readme.replace(/\n/g, '\r\n');
}
fs.writeFileSync(readmePath, readme, 'utf8');

console.log('Spanish README synced.');
console.log(`Goals: ${goalCount}, Scenarios: ${scenarioCount}`);
console.log(`Files: vocab=${vocabFiles}, sentences=${sentFiles}, personalize=${personalizeFiles}`);
console.log(`Vocabulary: total=${totalVocabEntries}, unique=${uniqueSpanish.size}, categories=${vocabularyCategories.size}`);
