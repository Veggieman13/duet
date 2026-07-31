# One-button tap game — brainstorm & plan

Status: **design only, nothing built yet.** This doc exists to pick a direction before
writing code. Nothing here is committed to product-wise; argue with any of it.

---

## 1. What you actually described

> "Mostly tapping on the same spot and the game will progress. It's mainly about making
> decisions where to play and what to do, but still mainly pressing the button and you'll
> see what happens."

There are two separate things in that sentence, and they're worth keeping separate in your
head, because they fail for different reasons:

- **The tap** — one thumb, one spot, no aiming, no timing. This has to *feel* good within
  the first three seconds or nothing else matters. It's an animation and haptics problem,
  not a game design problem.
- **The decisions** — where to go, what to do, what to buy next. This is the actual game.
  It's what makes someone open the app tomorrow.

A game that nails the tap and has no decisions is a fidget toy (fun for 90 seconds).
A game with good decisions and a mushy tap is a spreadsheet. You need both, and they get
built separately.

## 2. The one question that picks the genre

**What does a single tap mean?** Three answers, and they lead to completely different games:

| Tap means | Genre | Example | Fits your description? |
|---|---|---|---|
| "Earn a bit more" | Idle / incremental | Cookie Clicker, AdVenture Capitalist | Yes — strongest fit |
| "Advance to the next thing" | Narrative / life sim | BitLife, Reigns | Yes — "you'll see what happens" |
| "Hit it at the right moment" | Skill / timing | Flappy Bird, rhythm games | No — you said *see* what happens, not *react* |

Skill games are out. You're choosing between **accumulate** and **advance**, and they can
be blended: tap to accumulate during a run, and the run itself advances a story.

---

## 3. Five concepts

### A. Busker — street musician sim ⭐ recommended

You're a street musician. Pick a **pitch** (subway platform, park bench, market square,
festival gate), pick a **set** (which songs you'll play), then tap to play. A crowd
gathers while you keep playing and drifts off when you stop. Coins land in the hat.

- *"Where to play"* is literal — it's the core decision every single run.
- Modifiers write themselves: time of day, weather, weekday vs weekend, a busy commuter
  crowd that pays little but is huge, a slow café crowd that pays a lot per person,
  security moving you along, a rival busker taking your spot.
- Meta progression: better instrument, new strings, an amp, a loop pedal (= offline
  earnings), learn new songs, unlock districts, then new cities.
- Art is cheap: silhouettes, simple shapes, your existing warm palette. No character rigs.
- It's a **thematic sibling to Duet** — music, two-person warmth, same visual language.
  That's a real asset when you're building a small portfolio of apps under one name.

### B. Market stall / coffee cart tycoon

Identical skeleton to Busker: pick a location for the day, pick a menu, tap to serve
customers, upgrade the cart. Swap crowd for queue, songs for menu items.

Mechanically the same game. Choose it over Busker only if you find food more fun to draw
than music. Slightly more crowded genre (idle restaurant games are everywhere).

### C. Tap to live a life

Tap the big button and a year passes. Events appear ("you got into art school", "your
landlord raised the rent"), most just happen, some fork into a two-option choice. Stats
drift. Eventually you die and get a summary card to screenshot.

- Purest version of "press the button and see what happens".
- **The catch: it's a writing project, not a coding project.** You'd need 200–400 written
  events before it stops repeating, and the whole appeal is the writing being funny or
  poignant. The code is a weekend. The content is months.
- Great fit *if* you actually enjoy writing. Bad fit if you want to be programming.

### D. Dig site / expedition

Choose a site (with a rumour attached: "locals say there's a temple"), choose your kit,
tap to dig. Layers reveal, artefacts pop, some are junk, some are museum pieces. Collection
screen is the reward. Sell finds to fund the next expedition.

- Collection-driven dopamine is very strong and very sticky.
- Needs one distinct illustration per artefact — that's the hidden art cost. 60 artefacts
  is 60 drawings. Doable with a flat icon style; still the biggest cost in the list.

### E. Straight incremental with a theme

Cookie Clicker with your own skin. Tap for currency, buy generators, buy multipliers,
prestige, repeat. No location choice — the only decision is what to buy next.

- Easiest to build by a wide margin. Well-documented math. Genuinely satisfying loop.
- But: the most crowded category on both stores, and it drops the part of your idea you
  seemed most interested in (*where* to play).

### Side by side

| | Decision depth | Content cost | Art cost | Build effort | Sticky? |
|---|---|---|---|---|---|
| A. Busker | High | Low (numbers) | Low | Medium | High |
| B. Cart | High | Low | Medium | Medium | High |
| C. Life | Medium | **Very high** (prose) | Very low | Low | Medium |
| D. Dig | Medium | Medium | **High** | Medium | Very high |
| E. Incremental | Low | Low | Low | **Low** | Medium |

---

## 4. Recommendation: build Busker

Reasons, in order:

1. It's the literal version of what you described — "where to play" is the whole game.
2. Its content is **generated by math, not written by hand.** A new spot is five numbers
   and a name. Compare to concept C, where a new hour of gameplay is 40 written events.
   For a solo beginner developer, this is the difference between shipping and stalling.
3. It reuses everything you learned on Duet: same stack, same palette, same warm tone.
4. There's a real MVP that's finishable in a couple of weeks of evenings, and the MVP is
   still a game (not a demo).

### The loop, concretely

**A run** (60–90 seconds):

1. Pick a **spot**. Each has: base foot traffic, generosity multiplier, unlock cost, and a
   risk (chance of being moved along early).
2. Pick a **set** — 1 to 3 songs you know. Each song shapes the run: a crowd-pleaser
   spikes early and fades, a slow ballad builds gradually to a higher ceiling.
3. **Tap to play.** Each tap adds *performance energy*. Energy builds crowd size; crowd
   size decays if you stop tapping. Coins drop at a rate of `crowd × generosity × song`.
   This is the key trick: **tapping matters continuously without ever being a timing
   test.** Tap faster → bigger crowd → more coins. Stop → crowd wanders off.
4. **Interruptions** — one or two per run, each a single-tap choice:
   - "A kid starts dancing." → *Play to them* (+40% for 10s, small fan gain) / *Keep going*
   - "Someone requests a song you half-know." → *Try it* (risk: crowd halves, or doubles)
   - "Security is walking over." → *Pack up now* (keep everything) / *One more song* (risk
     losing the run's takings)
5. **Run ends.** Coins, new fans, and a one-line story beat ("A woman recorded you and
   posted it. 12 new fans.").

**Between runs** (the meta — this is what makes it a game rather than a toy):

- Spend coins: instrument upgrades (tap value), amp (crowd cap), a busking licence
  (removes security risk at a spot), a loop pedal (**offline earnings** — the pedal plays
  while the app is closed).
- Spend fans: learn new songs, unlock new districts.
- Unlock spots and then whole cities.
- **Prestige = "go on tour."** Reset your local gear and spots, keep a permanent
  multiplier and open a new city with better base rates. This is the thing that turns
  ~4 hours of content into ~20.

### Rough math to start from

Don't invent these from scratch; these are the standard incremental-game curves:

```
upgrade cost:   cost(n)    = base * 1.12^n          // 1.07 = generous, 1.15 = grindy
coins per sec:  cps        = crowd * generosity * songMult * gearMult
crowd:          crowd(t+1) = crowd + tapEnergy * spotTraffic - crowd * 0.04   // decay
tap energy:     per tap    = tapPower (upgradeable), decays over ~0.8s
offline:        min(elapsed, capHours) * cps * 0.25  // idle is always worse than playing
prestige gain:  sqrt(totalCoinsEarned / 1e6)         // rounded down, min 1
```

Targets to design against: **first coin within 2 seconds** of opening the app for the
first time. **First upgrade purchasable within 45 seconds.** First session ends naturally
around 5 minutes. A reason to come back tomorrow (offline earnings + one thing you were
40 coins short of).

---

## 5. MVP — what v0.1 actually contains

Ruthlessly cut. Ship this, then add.

**In:**
- One city, three spots (subway / park / market square)
- Four songs
- Six upgrades (three tap power, three crowd)
- The run loop with coins, crowd, and one interruption type
- Save/restore + offline earnings
- Haptics on tap, numbers floating up, a counter that eases

**Out of v0.1** (deliberately):
- Sound and music (ironic for a busking game — it's the single biggest time sink; add in
  v0.2 once the loop is proven)
- Prestige / touring
- Fans as a second currency (use coins for everything at first)
- Achievements, leaderboards, cloud save, accounts
- Any monetization at all

**Kill criterion:** build the tap and the number *first*, in isolation, before anything
else. If pressing it 30 times isn't satisfying with just a scale-pop, a haptic tick, and a
rising number, the concept is wrong and no amount of meta progression saves it. That's a
two-evening spike and it's worth doing before you commit.

---

## 6. Technical plan

### Where it lives

**A new Expo project, not a folder inside Duet.** Separate repo, separate bundle ID,
separate store listing. Shared code isn't worth the coupling at this size — copy the four
files you want.

Same stack as Duet so everything you've learned transfers: Expo SDK 57, TypeScript,
expo-router, React Native 0.86.

### No game engine

You do not need Unity, Godot, or a canvas library for this. It's views and numbers.
Reanimated 4 (already at 4.5.0 in Duet) handles every animation here on the UI thread.
Staying in React Native means one skillset across both apps.

### The one thing that must be architected correctly: the tap loop

Naive version — `setState` on every tap — will re-render your whole tree 8 times a second
and feel like mush. Instead:

- Keep live game state (coins, crowd, energy) in a **`useRef` object**, mutated directly
  by the tap handler. Taps never trigger a React render.
- Run a **tick at ~10Hz** (`setInterval`) that applies decay/income to the ref and pushes
  one state update for the displayed numbers. UI updates 10× a second; that's plenty.
- Drive the tap animation (scale pop, floating "+12") with **Reanimated shared values** so
  it runs on the UI thread and never waits on JS.
- Simulate elapsed time from timestamps, never from tick counts — a backgrounded app
  doesn't tick, and you want the maths to be correct regardless.

### Everything else

| Need | Approach |
|---|---|
| Save | JSON blob, same expo-sqlite KV pattern as Duet's `src/lib/storage.ts` |
| Save timing | Debounce ~2s, plus a forced save on `AppState` → `background` |
| Offline earnings | Store `lastSeenAt`; on resume compute elapsed, cap it, show a "while you were away" card |
| Big numbers | Plain JS `number` is fine well past 1e15; write a `formatShort()` for K/M/B/T early and never think about it again |
| Haptics | `expo-haptics`, light impact on tap, medium on upgrade |
| Audio (v0.2) | `expo-audio` (SDK 57's replacement for expo-av) |
| Balance tuning | Put every constant in one `src/game/balance.ts`. You will edit it a hundred times. |

Resolve exact versions with `npx expo install expo-haptics` rather than hand-writing them,
and read the v57 docs for each package before using it — the SDK moved a lot recently.

### Steal from Duet

`src/constants/theme.ts` (the blush/plum palette works beautifully for a warm street
scene), `themed-text.tsx` / `themed-view.tsx`, the `storage.ts` / `storage.web.ts` split,
and your `eas.json` profile setup.

### Sketch of the file layout

```
src/
  app/
    index.tsx           # the busking screen — the tap
    map.tsx             # choose your spot
    shop.tsx            # upgrades
  game/
    balance.ts          # every tunable number, in one place
    engine.ts           # pure functions: tick(state, dt), tap(state), buy(state, id)
    content.ts          # spots, songs, upgrades as data
    save.ts             # serialize / restore / offline catch-up
  components/
    tap-target.tsx      # the button + juice
    coin-burst.tsx
```

Keep `engine.ts` **pure** — no React, no storage, just `(state, input) => state`. It makes
the maths testable and stops game logic leaking into components.

---

## 7. Making the tap feel good (the actual make-or-break)

In rough order of impact per hour of work:

1. **Haptic tick on every tap** — the single highest-value line of code in the project.
2. **Scale pop**: 1.0 → 0.94 → 1.0 in ~120ms, spring, not linear.
3. **Floating "+12"** that rises and fades over ~600ms, with a few degrees of random drift
   so a fast tapper sees a fan of numbers rather than a single stuttering one.
4. **Counter easing** — never snap the total; count up to it over ~250ms.
5. **Coins arcing** from the tap point to the counter.
6. Crowd figures fading in as the crowd number crosses thresholds.
7. Colour temperature shift as the run heats up.

## 8. Store and business

- **Data safety form becomes trivial.** If the game is fully offline with no accounts and
  no analytics, you declare *no data collected* — much simpler than Duet's form. Keep it
  that way for v1; it's a genuine selling point and it's less work.
- Play still requires a **privacy policy URL** even for offline apps. Add one more page
  under `/docs` on the existing GitHub Pages site and reuse the domain.
- New Play Console listing, new bundle ID (e.g. `com.mgroenteman.busker`), content rating
  will come out Everyone. Same closed-test → open-test path you already walked with Duet,
  which means the process cost is near zero this time.
- iOS waits on the same Apple enrolment Duet is waiting on.

**Monetization, ranked for your situation:**

1. **Free, no ads, no IAP** for v1. You're learning and building a name; a game with no
   ads is genuinely rare and reviewers notice. Zero extra work, zero policy risk.
2. A single **"tip jar" IAP** later (~£2, cosmetic hat, no gameplay effect). Honest,
   on-brand, one product to configure.
3. Rewarded ads ("double your offline earnings"). This is where the money is in idle
   games — but it means AdMob, a dev build, a rewritten data-safety form, and a consent
   flow (GDPR/UMP). Not for v1.
4. Paid up front. Don't — nobody buys unknown £2 tap games sight unseen.

**Names to consider:** Busker, Hat Trick, Spare Change, Street Corner, Pitch, Buskerville.
Check Play search for each before falling in love with one. Whatever you pick, the store
listing should lead with the fantasy ("play for the city, fill your hat") not the mechanic
("an idle tap game").

---

## 9. Milestones

| | What | Feels like | Rough size |
|---|---|---|---|
| **M0** | Bare tap: button, number, haptic, pop, floating +N. Nothing else. | "I want to keep pressing this" | 2 evenings |
| **M1** | One spot, crowd mechanic, run timer, run summary | A real 90-second run | ~4 evenings |
| **M2** | Save, offline earnings, shop with 6 upgrades | A game you reopen tomorrow | ~4 evenings |
| **M3** | 3 spots, 4 songs, interruptions, balance pass | Actual decisions to make | ~5 evenings |
| **M4** | Icon, splash, screenshots, listing, closed test | On a phone that isn't yours | ~3 evenings |

Then v0.2: sound, prestige/touring, more cities.

**Gate after M0.** If the tap isn't fun on its own, stop and pick a different concept
rather than building a meta layer on top of a dead core.

---

## 10. What I need from you

1. **Concept** — Busker, or one of the others? (Recommendation: Busker.)
2. **Scope check** — happy with "no sound, no prestige, no monetization" in v0.1?
3. **Repo** — new repo for the game, or a `game/` folder in this one for now? (Recommend
   new repo, but a folder is fine while it's a spike.)

Say the word and I'll build M0 — just the tap, the number, and the feel — so you can hold
it in your hand before committing to the rest.
