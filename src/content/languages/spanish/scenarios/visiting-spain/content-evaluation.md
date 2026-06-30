# Content evaluation - "Visiting Spain"

*An honest pedagogical review of the `visiting-spain` goal, written from the
perspective of someone teaching survival Spanish to absolute beginners. Reviewed
against the 13 published scenarios and the `spanish-content` authoring rules.*

---

## Verdict in one line

This is a **genuinely good beginner course** - tightly scoped, ordered by real
trip-usefulness, and personalized where it counts. The bones are right. The flaws
are almost all *details of accuracy and consistency* rather than design mistakes,
and a couple of them (the `ñ` problem, the missing "please") are worth fixing
before this is the thing a real traveller leans on.

---

## What it gets right (keep doing this)

1. **The "Spanish you actually need" framing is the correct one.** Every scenario
   maps to a moment a traveller will physically be in (a counter, a taxi, a menu,
   a lost junction). Beginners abandon courses that teach colours and animals
   before "where is the toilet". This course leads with `donde esta el bano` and
   flags it as "the single most-asked-for place". That instinct is excellent.

2. **Batching of 3 is respected and the *first* words are the most useful.**
   Greetings opens `hola / adios / gracias` - the three highest-value words in the
   language for a tourist - before the time-of-day greetings. Numbers leads with
   the *question* (`cuanto es?`) before the digits, with a lovely line in the
   lesson: "Master this trio and you can settle up anywhere before you even know
   the numbers." That is exactly how a beginner should be taught to survive a till.

3. **Personalization (supermarket, shopping) is the standout feature.** Asking
   "what do you actually buy / wear?" and teaching *only* the picked words is
   better pedagogy than any fixed list. A vegetarian never has to drill `pollo`;
   someone who lives in jeans never learns `falda`. This respects the learner's
   time and is the course's biggest differentiator.

4. **Lessons teach the literal, not just the gloss.** `de nada` -> "of nothing",
   `me llamo` -> "I call myself", `tengo ... años` -> "I have ... years". Showing
   the literal is how you stop a beginner from treating a phrase as a magic spell
   and start letting them recombine words. More of this, please.

5. **Notes carry the cultural load instead of the word list.** "buenas tardes -
   from about midday onward", "necesito vs quiero - quiero is a touch more
   direct, soften with por favor". This is the kind of thing a good teacher says
   out loud, and it lives in the right place (the item `note`, not the shared
   `explanation`).

---

## What should be fixed (in rough priority order)

### 1. `ñ` is being dropped, and that is a real error - not an accent

The repo rule is "store Spanish **without accents**". Correct - and `adios`,
`cafe`, `estacion` are fine. **But `ñ` is a separate letter of the Spanish
alphabet, not an accented `n`.** Dropping it changes the word. The content is also
*internally inconsistent* about it:

| Written as | Should be | Where |
|---|---|---|
| `años` (kept) | `años` ✓ | introductions |
| `Espana` | `España` | introductions ("estoy de visita en Espana") |
| `espanol` | `español` | introductions |
| `manana` | `mañana` | days-time ("tomorrow") |
| `pequeno` | `pequeño` | shopping ("mas pequeno") |
| `bano` | `baño` | directions, basic-needs |
| `contrasena` | `contraseña` | basic-needs |

The same file (introductions) keeps `años` but writes `Espana` and `espanol`. The
canonical cautionary example is here too: **`año` (year) without the tilde is
`ano` (anus).** A beginner who learns `Tengo 36 anos` is saying something
memorably wrong. **Recommendation: keep `ñ` everywhere**, and tighten the
authoring rule to say "strip accents (á é í ó ú), but never strip `ñ`".

### 2. "Please" is promised but never taught

The greetings scenario summary says it covers "hello, goodbye, **please** and
thank you", but `por favor` is **not a vocabulary item in greetings** - or
anywhere as a standalone word. It only appears buried inside `mas despacio por
favor` (help) and in a couple of notes. `por favor` is arguably the single most
important courtesy phrase for a traveller. **Add it to greetings** (it fits the
courtesy batch with `de nada` / `perdon`).

### 3. The price question is taught two different ways

"How much is it" appears as **`cuanto es`** (numbers, supermarket) and as
**`cuanto cuesta`** (questions, shopping, taxi) - same English gloss, two Spanish
forms, across five scenarios. Both are correct, but a beginner reviewing
flashcards will be marked wrong for recalling the "other" right answer, and it
reads as an inconsistency rather than a teaching point. **Pick one as the default**
(`cuanto cuesta` is the more transferable - it works for a single item *and* with a
noun: `cuanto cuesta esto`) and, if you keep both, add a note explaining they're
interchangeable.

### 4. Numbers skips 6-9 (and the structure that makes Spanish numbers easy)

The list is `1 2 3 4 5 10 20 50 100`. A traveller cannot say a `7,40` price, a
table for 6, or "platform 8". More importantly, the lesson never shows the
*pattern* (`dieciseis`, `veintidos`, `treinta y cinco`) that turns 30 words into
the ability to say any number to 100. I understand the minimalist intent, but
**add 6-9** at minimum, and consider a short second batch of tens
(`treinta / cuarenta / sesenta / ...`) with one example sentence showing
`treinta y cinco`. That is the highest-leverage 10 minutes of number-learning.

### 5. `basic-needs` is sequenced too late and overlaps earlier scenarios

It sits at position 11, but its words (`necesito`, `quiero`, `el bano`, `agua`)
are some of the most fundamental in the whole course and already appear in
directions (`bano`), cafe (`agua`) and several places (`quiero`). As placed, it
feels like a redundant recap. **Either move it much earlier** (right after
questions, as the "ask for anything" toolkit) **or** re-cut it to carry only its
*unique* high-value items (`necesito`, `wifi`, `contraseña`) and lean on it as the
wifi/connectivity scenario.

### 6. `supermarket`'s base list is thin and entirely duplicative

The base `vocabulary.json` is 5 navigation phrases (`donde esta`, `donde estan`,
`quiero`, `cuanto es`, `eso es todo`) - all already taught elsewhere, and 5
doesn't divide into batches of 3. The real content lives in `personalize.json`
(which is great). That's fine by design, but consider trimming the base to the
*one* phrase that's actually new in this context and letting the personalized
products carry the lesson, so the learner isn't drilled on three duplicates before
reaching the part that matters.

### 7. Gendered adjectives are taught without a gender note

`estoy perdido` (help) and `vegetariano` (restaurant) are given in the masculine
only, with no note that a woman says `perdida` / `vegetariana`. One short note per
word ("a woman says *perdida*") avoids teaching half the learners to misgender
themselves on day one.

### 8. No pronunciation support anywhere

There is no phonetic hint for the sounds a true beginner cannot guess from
spelling: `j` (`jueves`), `ll` (`lleveme`, `me llamo`), `z`/`ce`/`ci` (the
Castilian *th* in `cerveza`, `gracias`, `cinco`), and `ñ` itself. The `literal`
field is used well; a parallel light-touch `say` / pronunciation hint (even
respelling like *"yamo"*, *"ther-VAY-tha"*) would close the biggest gap between
"can read the card" and "the barman understood me". This is partly an *engine*
feature request, not just content - flag it for the language-engine.

---

## Smaller notes

- **`buenas noches` is glossed "good evening".** In Spain it leans toward
  goodnight / late night; `buenas tardes` covers most of the "evening" a tourist
  experiences until quite late. The existing note hedges this well; just make sure
  the example sentences don't use it as an arrival greeting at 7pm.
- **Greetings has 11 items** -> batches of `3+3+3+2`. Not wrong, and `si/no` is a
  fine closing pair, but adding `por favor` (fix #2) would also make it 12 and tidy
  the batching to `4x3`.
- **`quiero` = "I would like"** is a forgivable simplification, but it literally
  means "I want". The basic-needs note already flags this nicely; the cafe and
  restaurant items reuse the gloss "I would like" without that caveat. Consistency
  would help.
- **Missing lessons.** `cafe`, `restaurant` and `shopping` have no `lesson.json`.
  That's allowed, but these are exactly the scenarios where a one-paragraph "how
  ordering works in a Spanish bar" (you'll often stand at the bar; `la cuenta`
  comes only when you ask) would add a lot for little cost.

---

## If I could change only three things

1. **Keep `ñ` everywhere** (correctness - this is the one that produces actually
   wrong Spanish).
2. **Teach `por favor`** as its own word in greetings (you promised it; it's the
   most-used courtesy phrase).
3. **Add 6-9 to numbers** and one example of the `treinta y cinco` pattern (the
   single biggest unlock for real prices).

Everything else is polish on an already well-designed course.
