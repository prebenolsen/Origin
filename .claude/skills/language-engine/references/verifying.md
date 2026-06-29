# Verifying engine changes

There are no automated unit tests for the engine yet, so verify behaviour directly. Two
cheap, reliable ways:

## 1. Type + build

```bash
npm run typecheck
npm run build
```

## 2. Exercise the real modules in the dev server

The Vite dev server serves the TS modules, so you can import and call them from the preview
console (or the preview_eval tool) to assert behaviour without clicking through the UI.

```js
// reset, then drive the SRS directly
const srs = await import('/src/lib/language/srs.ts');
const L = 'spanish';
Object.keys(localStorage).filter(k => k.startsWith('origin:lang')).forEach(k => localStorage.removeItem(k));

srs.introduce(L, { es: 'hola', en: 'hello', category: 'greetings' }, 'spanish/greetings');

// a correct GUESS (recognition) must not reach "strong"
srs.recordReview(L, 'hola', true, 1);
srs.recordReview(L, 'hola', true, 1);
srs.recordReview(L, 'hola', true, 1);
console.assert(srs.masteryOf(srs.getState(L, 'hola')) === 'learning', 'L1 streak should stay learning');

// ramping to production should reach "strong"
['gracias'].forEach(es => srs.introduce(L, { es, en: 'thank you', category: 'courtesy' }, 'spanish/greetings'));
[1,2,3,4].forEach(lvl => srs.recordReview(L, 'gracias', true, lvl));
console.assert(srs.masteryOf(srs.getState(L, 'gracias')) === 'strong', 'ramped word should be strong');
```

Adaptive order:

```js
const srs = await import('/src/lib/language/srs.ts');
const ordered = srs.orderAdaptive(srs.getAll('spanish'), 10).map(s => s.id);
// expect: weak/failed ids first, mastered ids last, NOT introduction order
```

## 3. Content validity

After any change that also touches content, run the content validator:

```bash
node .claude/skills/spanish-content/scripts/validate-content.mjs
```

## Checklist

- [ ] `vocabId` unchanged (or a migration is written).
- [ ] `recordReview` callers pass the question `level`.
- [ ] `masteryOf` still gates `strong` on `maxCorrectLevel >= 3`.
- [ ] Reviews go through `orderAdaptive` (not authored order).
- [ ] Distractors still same-category / spelling-similar.
- [ ] localStorage keys + `origin:lang` event unchanged; Supabase schema doc still matches.
- [ ] `npm run typecheck` and `npm run build` pass.
