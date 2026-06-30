# Spanish - Plan Going Forward

*Originally written as the tutor's recommendation after the learner finished
[Visiting Spain](../visiting-spain/overview.md) and
[Meeting People](../meeting-people/overview.md). Updated to record what has since been
built and what comes next.*

> **Status (v6.0.x)** - The grammar bridge is now live. The **Unlock Spanish** section
> exists, the **word-bank sentence builder** is implemented end to end, and the first
> scenario (*From Chunks to Sentences*) is fully authored and playable. Scenarios 2-7 are
> scaffolded as placeholders and are the next authoring job.

---

# Part A - Where the learner is (the original rationale)

The first two sections built a strong communication base. The learner can greet people,
introduce themselves, say where they are from and live, talk about work, family, and
hobbies, express likes and dislikes, order food, buy things, ask questions, navigate Spain,
and ask for help. They have met the core beginner verbs repeatedly (soy, estoy, tengo, vivo,
trabajo, hablo, quiero, necesito, me gusta, prefiero) and seen agreement patterns (el/la,
un/una, español/española, encantado/encantada, pequeño/pequeña).

**The limitation:** almost all of that lives as memorized chunks. The learner can say
"Me llamo Carlos" but cannot yet automatically create "Me llamo Carlos y soy de Noruega."
They know the words but not how to connect them. The next wall is not vocabulary - it is
sentence construction.

**What the learner was missing** (and what this section teaches):

1. How words fit together - subject + verb + information.
2. Gender and agreement - why "el cafe bueno" but "la comida buena".
3. The two "to be" verbs - ser (identity/origin) vs estar (state/location).
4. Talking about other people - moving beyond "I" (yo / tú / él / ella).
5. Connecting ideas - y, pero, porque, también, muy - the tiny words that turn isolated
   answers into conversation.

The decision was: **do not** add Business Spanish, Living in Spain, or more travel
vocabulary yet. Those pile more words onto a foundation that cannot combine them. Build the
structure first.

---

# Part B - What is now in place

## The section

- **Goal `building-sentences` ("Unlock Spanish")** is live and selectable on the Spanish
  home, sitting after Visiting Spain and Meeting People. Business Spanish and Living in Spain
  remain locked until this section is finished.
- Promise to the learner: *"You already know enough words. Now learn how to create your own
  Spanish."* The section moves them from memorizing Spanish to creating it.

## The new exercise: word-bank sentence builder

A Duolingo-style `build-sentence` question is fully implemented:

- **Engine** (`src/lib/language/testGen.ts`): the `build-sentence` question kind, plus
  `buildSentenceQuestion` / `buildSentenceQuiz` (split the Spanish into tokens, shuffle with
  distractors into a bank) and `checkBuildSentence` (accent/case-forgiving grading).
- **Content shape** (`sentences.json`): `{ en, es, distractors? }[]`. Tokens are derived by
  splitting `es` on spaces; `distractors` add wrong tiles (wrong gender, wrong ending). A new
  `Sentence` type and registry discovery in `src/lib/language/content.ts`.
- **UI** (`src/components/language/VocabTest.tsx`): large mobile tiles, tap to place / tap to
  remove, no dragging. Answer row under the prompt, word bank moved down just above a
  bottom-pinned **Check** button.
- **Learning behavior** (refined in v6.0.1):
  - A **correct** build just says "Correct" (no redundant answer echo).
  - A **wrong** build does **not** reveal the answer and does **not** advance. The learner
    stays on the sentence ("Not quite - try again") and keeps editing.
  - A **"Help me"** button appears after the first wrong check. First press trims the answer
    back to its longest correct prefix; once the placed tiles are a correct prefix, each press
    auto-places the next correct word, shown **green** (the learner didn't place it).
  - The SRS result is recorded from the **first** attempt, so retries/help don't inflate the
    score. A correct build credits every known word in it as in-context (level-3) recall, so
    the grammar drill still feeds spaced repetition.
- **Lesson flow** (`LessonExperience.tsx`): a `sentences` phase runs after the full review,
  fed by `sentences.json`. A scenario can be **sentence-only** (no `vocabulary.json`), in
  which case the lesson skips teaching and goes straight to building.

## Authored content

| # | Slug | Title | Status |
|---|---|---|---|
| 1 | `from-chunks-to-sentences` | From Chunks to Sentences | **DONE** (sentence-only, 6 drills) |
| 2 | `el-la-gender` | El & La - Words Have a Gender | **DONE** (6 articles + 6 nouns, 6 drills) |
| 3 | `joining-ideas` | Connect Your Thoughts | **DONE** (6 connectors, 6 drills) |
| 4 | `ser-vs-estar` | The Two "To Be" Verbs | **DONE** (6 verb forms, 6 drills) |
| 5 | `people-and-actions` | I Do, You Do, They Do | **DONE** (4 pronouns + 5 verb forms, 6 drills) |
| 6 | `describing-things` | Making Descriptions | **DONE** (6 adjectives, 6 drills) |
| 7 | `make-a-sentence` | Say Anything | **DONE** (sentence-only, 8 capstone drills) |

Scenario 1 is the opener: no new vocabulary, just the realization that Spanish is built from
pieces the learner already owns (e.g. "me llamo Ana" + "soy de Madrid" -> "me llamo Ana y soy
de Madrid").

---

# Part C - Going forward

**The Unlock Spanish section is complete.** All 7 scenarios are authored, validated, and
playable (see the table in Part B). They share one `standard`-scenario pattern: a small ordered
`vocabulary.json` (a handful of structural words, articles + already-known nouns, or the
everyday forms of one concept), a short `lesson.json` that teaches the opening batch only, and
a `sentences.json` whose distractors are the meaningful wrong choice (wrong gender/number, the
wrong connector, the wrong "to be", the wrong person, wrong agreement) so each build tests the
point. Scenarios 1 and 7 are sentence-only (no new vocabulary).

The next move is no longer inside this section - it is the **top-level roadmap change** in
[`../../plan-going-forward.md`](../../plan-going-forward.md): drop Business Spanish and Living
in Spain as niche domains, and continue building general communicative ability instead
(Everyday Conversations -> Talking About the Past -> Talking About the Future -> Describing the
World -> Storytelling), with a new **Test Random Competence** review mode that mixes vocabulary,
phrase recall and sentence building. See that file for the rationale and full sequence.

## The original sequence (all DONE)

- **3. Connect Your Thoughts (`joining-ideas`)** - teach y, pero, porque, también, muy, un
  poco. Highest immediate payoff: turns "Me gusta el cafe" into "Me gusta el cafe pero no me
  gusta el te." Mostly sentence builds joining two known clauses.
- **4. The Two "To Be" Verbs (`ser-vs-estar`)** - taught through contrast, not rules: ser de
  Espana / soy profesor / es una ciudad vs estoy bien / estoy aqui / esta cerca. Distractors
  should swap ser<->estar so the build tests the choice.
- **5. I Do, You Do, They Do (`people-and-actions`)** - minimum useful present tense: yo / tú
  / él-ella for hablar, trabajar, vivir. Builds like "ella trabaja en Madrid".
- **6. Making Descriptions (`describing-things`)** - adjective placement + agreement
  (bueno/buena, grande, pequeño, bonito, caro). Builds like "un cafe bueno" / "una comida
  buena" with agreement distractors.
- **7. Say Anything (`make-a-sentence`)** - capstone, no new vocabulary. Sentence-only (like
  scenario 1), drawing on everything: "I am from Norway but I live in Spain", "I like coffee
  because it is good", "My family is big".

## Possible engine enhancements (optional, not blocking)

The `sentences.json` data can power more than the current builder. Worth considering once the
section is authored:

- **Listening** - play the Spanish audio, learner builds what they hear.
- **Speaking / production** - hide the bank and have them type or say the sentence.
- **A dedicated review mode** for sentence builds, so the grammar patterns come back over time
  the way individual words do.

## After Unlock Spanish

This section is now done, so the question is what comes next. The original plan was to open the
two locked goals (Business Spanish, Living in Spain). That has been **superseded** by the
top-level [`../../plan-going-forward.md`](../../plan-going-forward.md): those niche domains are
de-prioritized (and may be removed) in favour of continuing to build general communicative
ability first. Living in Spain and Business Spanish move to the very end of the roadmap, after
the new general-progression goals. Treat that file as the source of truth going forward.
