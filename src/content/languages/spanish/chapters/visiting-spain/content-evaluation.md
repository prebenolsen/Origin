# Content evaluation - "Visiting Spain"

*An honest pedagogical review of the `visiting-spain` goal, written from the
perspective of someone teaching survival Spanish to absolute beginners. Reviewed
against the 13 published scenarios and the `spanish-content` authoring rules.*

> **Status: revised after implementation (v5.6.0, 2026-06-30).** The original
> review proposed 8 fixes; all 8 have now been actioned (one was adjusted to the
> learner's stated needs). The "What should be fixed" section below is kept as an
> **implementation log** - struck-through items are done - so the history of the
> course's decisions stays readable. A short **Still open** section at the end
> lists what remains.

---

## Verdict in one line

This is a **genuinely good beginner course** - tightly scoped, ordered by real
trip-usefulness, and personalized where it counts. The bones were always right;
the recent pass fixed the accuracy and consistency details (the `ñ` problem, the
missing "please", inconsistent price question, thin number coverage), so it now
holds up as the thing a real traveller can lean on.

---

## What it gets right (keep doing this)

1. **The "Spanish you actually need" framing is the correct one.** Every scenario
   maps to a moment a traveller will physically be in (a counter, a taxi, a menu,
   a lost junction). Beginners abandon courses that teach colours and animals
   before "where is the toilet". This course leads with `donde esta el baño` and
   flags it as "the single most-asked-for place". That instinct is excellent.

2. **Batching of 3 is respected and the *first* words are the most useful.**
   Greetings opens `hola / adios / gracias` - the three highest-value words in the
   language for a tourist - before the time-of-day greetings. Numbers leads with
   the *question* (`cuanto cuesta?`) before the digits, with a lovely line in the
   lesson: "Master this trio and you can settle up anywhere before you even know
   the numbers." That is exactly how a beginner should be taught to survive a till.

3. **Personalization (supermarket, shopping) is the standout feature.** Asking
   "what do you actually buy / wear?" and teaching *only* the picked words is
   better pedagogy than any fixed list. A vegetarian never has to drill `pollo`;
   someone who lives in jeans never learns `falda`. This respects the learner's
   time and is the course's biggest differentiator.

4. **Lessons teach the literal, not just the gloss.** `de nada` -> "of nothing",
   `me llamo` -> "I call myself", `tengo ... años` -> "I have ... years",
   `me gusta` -> "it pleases me". Showing the literal is how you stop a beginner
   from treating a phrase as a magic spell and start letting them recombine words.
   More of this, please.

5. **Notes carry the cultural load instead of the word list.** "buenas tardes -
   from about midday onward", "necesito vs quiero - quiero is a touch more
   direct, soften with por favor". This is the kind of thing a good teacher says
   out loud, and it lives in the right place (the item `note`, not the shared
   `explanation`). The same channel now also carries pronunciation hints (see #8).

---

## Implementation log (was: "What should be fixed")

### 1. ~~`ñ` is being dropped, and that is a real error - not an accent~~ - DONE

`ñ` is now restored everywhere it had been dropped, and the acute accents stay
stripped as the rule intends:

| Was | Now |
|---|---|
| `Espana` | `España` (introductions) |
| `espanol` | `español` (introductions) |
| `manana` | `mañana` (days-time) |
| `pequeno` | `pequeño` (shopping) |
| `bano` | `baño` (directions, basic-needs) |
| `contrasena` | `contraseña` (basic-needs) |

The `año`/`ano` trap is closed. *Note:* the underlying authoring rule in the
`spanish-content` skill still says "store without accents" - it would be worth
tightening that text to "strip á é í ó ú, but never strip `ñ`" so the regression
can't return. (Listed under **Still open**.)

### 2. ~~"Please" is promised but never taught~~ - DONE

`por favor` is now its own vocabulary item in greetings, in the courtesy batch with
`de nada` / `perdon`. Greetings is 12 words -> a clean `4 x 3` batching. Verified
in-app: the context screen reads "12 words in 4 small batches".

### 3. ~~The price question is taught two different ways~~ - DONE

Standardized on **`cuanto cuesta`** (the more transferable form). `numbers` and
`supermarket` were switched from `cuanto es`; a note on the numbers item flags that
`cuanto es?` is an equally good alternative for a total. One form per meaning now.

### 4. ~~Numbers skips 6-9 (and the structure that makes Spanish numbers easy)~~ - DONE (with a caveat)

`seis / siete / ocho / nueve` added, plus `treinta` and `cuarenta`, and an example
sentence shows the combining pattern: "Son treinta y cinco euros." Numbers is now
18 words in 6 batches. **Caveat:** the *teen* forms (`dieciseis`, `veintidos`...)
are still not taught as words - the example demonstrates the `tens + y + units`
pattern but a learner can't yet produce 11-19. Acceptable for a trip; noted under
**Still open**.

### 5. ~~`basic-needs` is sequenced too late and overlaps earlier scenarios~~ - DONE

Moved from position 11 to right after `questions` (now position 5). Its core words
(`necesito`, `quiero`, `agua`, `baño`, `wifi`, `contraseña`) are introduced *before*
the scenarios that reuse them, so it reads as a foundation, not a recap.

### 6. ~~`supermarket`'s base list is thin and entirely duplicative~~ - DONE

Trimmed from 5 duplicative phrases to 3 genuinely useful ones: `donde estan`,
`cuanto cuesta`, `eso es todo`. The products still come from `personalize.json`,
which is where the real content belongs.

### 7. ~~Gendered adjectives are taught without a gender note~~ - DONE (resolved differently)

The original suggestion was to teach both forms. The learner is male, and the app
assumes a single gender, so the decision was to **keep the masculine forms and not
teach the feminine** - `vegetariano` and `estoy perdido` now carry the note
"Masculine form (said by a man)". If the app later supports a learner-gender
setting, this is the place to branch the forms.

### 8. ~~No pronunciation support anywhere~~ - DONE (no engine change needed)

This turned out **not** to need an engine feature: the `VocabItem.note` field is
documented to carry pronunciation, and the teach card renders it. Light respelling
hints were added for the sounds a beginner can't guess - `ll` (`me llamo` ->
"may YAH-mo", `bocadillo`), `j` (`jueves` -> "HWEH-bes"), the Castilian `z`/`ce`/`ci`
*th* (`gracias` -> "GRA-thyas", `cinco` -> "THEEN-ko", `cerveza`, `estacion`), and
`ñ` (`baño` -> "BAH-nyo"). A dedicated `pronunciation`/`say` field with its own
styling would be a nice future upgrade, but the gap is closed for now.

---

## Smaller notes

- ~~**Greetings has 11 items.**~~ Resolved by #2 - now 12, batched `4 x 3`.
- ~~**`quiero` = "I would like"** without the "literally I want" caveat in cafe and
  restaurant.~~ Done - both now carry the note, matching basic-needs.
- ~~**Missing lessons.** `cafe`, `restaurant` and `shopping` have no `lesson.json`.~~
  Done - all three now have a short context + explanation lesson (e.g. cafe explains
  you can order at the bar and pay on leaving; restaurant explains the bill only
  comes when you ask).
- **`buenas noches` is glossed "good evening".** Left as-is: the existing note
  hedges it well ("evening and night; also goodnight") and no example uses it as a
  7pm arrival greeting. Fine.

---

## Still open (recommended, not blocking)

1. **Tighten the authoring rule.** Update the `spanish-content` skill's
   `content-rules` text to say "strip acute accents, but never strip `ñ`", so the
   `ñ`-drop regression can't quietly return. (The validator could even flag a bare
   `n` in a known `ñ`-word, but that's gold-plating.)
2. **Teen numbers.** If number coverage is ever revisited, add `once`-`quince` and
   the `dieciseis`-`diecinueve` / `veintiuno`-`veintinueve` forms - the one gap
   between "can read a price tag" and "can say any number".
3. **A dedicated pronunciation field.** Pronunciation now rides in `note`; a
   first-class `say` field (distinct styling, maybe a speaker affordance later)
   would scale better as the course grows. Engine-side, low priority.
4. **Learner-gender setting.** Fix #7 hard-codes masculine. A profile toggle would
   let the same content serve everyone and unlock `perdida` / `vegetariana` cleanly.

---

## Where this leaves the course

All eight original issues are resolved; the four open items above are enhancements,
not corrections. Visiting Spain is now accurate, internally consistent, and honestly
the strongest single goal in the app - a solid template for the Phase 2 "Meeting
People" scenarios that build on it.
