# History sorting:
- Within each subcategory, sort by the first number in the period (e.g. 1453-1600s is 1453).

## Maps
# Israel-Palestine
- Use maps for helping the user understand

# Maps changed on interactive map - text is coded into country not just floating
- Is this needed elsewhere?

# Go through all "Maps" and "fix". 
- Is water land? Is land water? Are colors used differently across the modules?

# Some modules have too many things on the map. 
 - For each module, ensure all the countries (or cities if needed) are mapped, but remove events if too many.

 # Allow the user always to zoom further out to see the entire world if they want to, to know exactly where they are.


# Interactive maps
- First letter and 4-options -- More needed? Other types of hints? Famouns companies, celebrities, known for?
- The user should be allowed to zoom out as much as tehy want, and see the world - so they know where exactly they are. 
Geography progress stats:

countries learned
regions completed
accuracy %
weak countries
learning streak
next recommended challenge

# Menu tab:
Home
Explore
Geography
Profile/Progress

Why:

Home = "what should I do now?"
Explore = "what exists?"
Geography = a distinct game/practice mode
Profile = motivation/progress/stats

# Language component? 
- Spanish
- Lives in "Language" under "Learn/Explore". 

## IMPORTANT: 
- Russian Ukraine conflict is Ollama generated. 

# Ask AI to generate step by step for Ollama to create content


# Some modules have a natural next step, this should be suggested at the end of a story, and the user can do "Test me" or "Go to Abolition in the United States"

# Sørg for at følgende er fikset:
I'll start by examining the existing language skills to understand their structure, then look at the content/engine architecture so the new skills fit the same model.

I'll read both existing skills and explore their supporting files to match the structure.

Now let me read the language reference/asset files and explore the module side (engine + content) so the new skills are accurate.

Now let me look at the module engine code and an example content module to ground the new skills accurately.

Let me examine a complete example module and the content-instructions doc to capture authoring patterns accurately.

Let me find a fully-authored module and read the content-instructions doc plus the engine flow files.

Let me read a real authored module's files and the engine flow (ModuleExperience + progress).

Let me check the ModuleExperience flow and the content.md / book-instructions docs to round out the engine + content picture.

I have a thorough picture now. Let me read the existing engine reference files to match their format and depth.

Everything checks out. I'll create two skills that mirror the language pair: **`module-engine`** (the history/science/politics/psychology learning engine) and **`module-content`** (authoring that content, with templates + a validator).

Now I'll write the **module-engine** skill:

Now the **module-content** skill — SKILL.md first:

Now the asset templates:

Now the validator script — the key deliverable. Modeled on the language validator but for module content:

Now let me run the validator against the real content to confirm it works and doesn't false-positive on authored modules:

Lots of errors come from placeholder scaffolds. Let me check what those files actually contain:

Placeholder scaffolds use a single object (not array) for their content files — intentionally unfinished and hidden by the engine. The validator should skip a placeholder's other files entirely. Let me fix that:

Down to 3 errors — and they're real content bugs the validator correctly caught, not false positives. Let me confirm:

Confirmed — that's a genuine pre-existing content bug: **russia-and-ukraine** is published (real title) but its `timeline/quiz/flashcards` are still `PLACEHOLDER` single-object stubs. The validator caught it correctly; that's exactly its job. It's outside the scope of "create the skills," so I'll flag it rather than fix it here.

Let me confirm the final structure of both new skills:

I've created two new skills that mirror the language pair, covering the **module** learning component (history, science, politics, psychology, countries, philosophy, arts).

## What I built

**`module-engine`** — for working safely on the engine code (mirrors `language-engine`)
- [SKILL.md](.claude/skills/module-engine/SKILL.md): module map of `src/lib/content.ts`, `progress.ts`, `geo.ts`, and `src/components/module/**`, plus 9 invariants (folder-driven discovery, path identity, `PLACEHOLDER` hiding, data-derived geo/schematic map dispatch, lazy `GeoMap`, 8:5 map box, append-only progress, history-only `period`).
- [references/invariants.md](.claude/skills/module-engine/references/invariants.md): the long-form "what must hold and why" for discovery, search, map dispatch, projection, stage flow, and progress.
- [references/stages.md](.claude/skills/module-engine/references/stages.md): the five-stage flow + books, the geo-vs-schematic split, and a dev-server verification recipe.

**`module-content`** — for authoring/fixing the JSON (mirrors `spanish-content`)
- [SKILL.md](.claude/skills/module-content/SKILL.md): folder layout, the rules that matter (transform-don't-summarize, one-idea cards, data-driven map mode, history-only `period`, randomized quiz answers, encoding), the **publish-a-PLACEHOLDER** path, new-module checklist, and book decks.
- [references/content-rules.md](.claude/skills/module-content/references/content-rules.md): copy-paste shapes for every file + hard rules + how the engine consumes them.
- [assets/](.claude/skills/module-content/assets): templates for geo `module.json`, schematic `module.json`, story, timeline, quiz, flashcards, and book decks.
- [scripts/validate-content.mjs](.claude/skills/module-content/scripts/validate-content.mjs): a validator (excludes `languages/`, which has its own).

## Validator results on your real content

```
Validated 7 categories: 37 published modules, 116 placeholders hidden, 3 errors, 305 warnings.
```

- The **3 errors** are one genuine pre-existing bug: `the-modern-world/global-conflicts/russia-and-ukraine` is published but its `timeline/quiz/flashcards` are still `PLACEHOLDER` single-object stubs (not arrays). Worth fixing.
- The **305 warnings** are mostly typographic en-dashes (`–`/`—`) in authored text — advisory per your CLAUDE.md "prefer ASCII `-`" rule (warnings don't fail the build), plus a couple of "all multiple-choice answers are the same index" nudges and one non-history `period`.

## Notes / decisions
- I made typographic dashes a **warning, not an error** (unlike the language validator), because your authored modules legitimately use en-dashes in date ranges like `"509 BCE – 27 BCE"`.
- The validator skips a `PLACEHOLDER` module's body files entirely, since those ship as intentional non-array stubs.
- I did **not** bump `version.js`/changelog — these are Claude Code dev-tooling files under `.claude/`, not shipped app code or content (consistent with how the existing language skills were added). Say the word if you'd like a version entry anyway.

Want me to fix the russia-and-ukraine module (it has real story content but stub timeline/quiz/flashcards), or auto-convert the en-dashes to ASCII across content?