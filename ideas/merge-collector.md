# Creature merge collector — brainstorm & plan

Follows on from `ideas/tap-game.md`. Different, bigger idea: take the engines behind
Coin Master / Monopoly GO and the merge games (Merge 2, Travel Town, Merge Dragons), and
build a creature-collector where **merging is evolution**.

Status: design only.

---

## 0. The IP question, dealt with once

You can't put a Pokémon game on the App Store or Google Play. Protected: the name
(and "Pocket Monsters"), every creature design and name, the Poké Ball shape, the type
symbols, the trade dress. Takedown is near-certain, and the account-level risk lands on
the **same Play Console that hosts Duet** — that's the part that actually matters.

Worth knowing: Nintendo and The Pokémon Company also assert **patents**, not just
copyright — they sued Pocketpair over Palworld in the Tokyo District Court in September
2024, largely around throw-a-ball-to-capture mechanics. Merging isn't anywhere near that
claim space, so the mechanic you're proposing is clear. Just don't build capture-by-throwing.

What is *not* protected, and what you can freely build: creature collecting, evolution
chains, elemental type matchups, a completion album, breeding, habitats. That's the whole
genre. Temtem, Palworld, Cassette Beasts, Coromon and a hundred others exist legally.

**So: original creatures, and everything below still works.** If you want a literal
Pokémon version on your own phone for fun, that's a personal project — it just never goes
near a store listing.

---

## 1. What actually powers the games you named

These get lumped together as "casual mobile hits" but they're built from different parts.
Worth separating what's portable to a solo developer from what isn't.

### Coin Master / Monopoly GO (they're the same game with different skins)

| Part | What it does | Portable to you? |
|---|---|---|
| Slot machine spin | Variable-ratio reward — the single most powerful retention mechanic in mobile | **Yes** |
| Energy (spins) with slow regen | Gates sessions, creates the return visit | **Yes** |
| Village build-out | Coin sink + visible progress + endless content ladder | **Yes** |
| Card sets with duplicates | The real retention engine; completing sets drives everything | **Yes** |
| Timed events / seasons | Where most revenue comes from | Partly — needs live ops |
| **Attack & raid other players** | The social hook and the revenge loop | **No** — needs servers + a player base |
| **Trading with friends** | Viral acquisition | **No** — needs accounts + social graph |
| Live-ops economy tuning | Teams of analysts adjusting daily | No |

The honest read: Coin Master's engine is *social PvP plus live events plus heavy monetization
operations*. You can't run that alone, and it directly contradicts your no-accounts stance.
But here's the useful part — **most of the raid dopamine survives against bots.** Players
raid a stranger's village they'll never see again; whether that village belongs to a real
person or a generated one is almost invisible in the moment. Monopoly GO already pads its
matchmaking heavily. So you build the raid as PvE and keep ~80% of the feeling with 0% of
the backend.

### Merge games (Merge 2, Travel Town, Merge Dragons)

| Part | What it does |
|---|---|
| Merge two/three identical → next tier | The core verb. Simple, tactile, endlessly repeatable |
| Tap-a-generator to spawn base items | **This is your "tap the same spot"** |
| Limited board space | The actual puzzle — clutter is the enemy, not difficulty |
| Orders/requests for specific tiers | Gives direction; stops the board being aimless |
| Energy gating the generator | Same session-shaping job as Coin Master's spins |

Merge is a good genre for a solo dev: no physics, no real-time, no networking, and the
"difficulty" emerges from space pressure rather than from designed levels.

---

## 2. Why evolution-as-merge is genuinely a good idea

This is the strongest thing in your message and it's worth naming.

Merge games have a permanent narrative problem: their chains are arbitrary. Nobody has an
emotional relationship with *small apple → medium apple → large apple → apple crate*. The
chain is a spreadsheet wearing a costume, and players tolerate it rather than enjoy it.

**An evolution line is a chain people already understand and already care about.** The
fantasy and the mechanic are the same shape — two of a thing become a better thing, and
"better" means a creature you actually want to look at. Merge games spend enormous effort
manufacturing the feeling that a tier-up matters. An evolution gets that for free.

That's the real insight here, and it's the reason I'd build this over the busker game.

---

## 3. The design

Working title: **Hatchery**. You run a sanctuary for creatures nobody else will take.

### Screens

1. **The Nest** — main screen, and your one tap spot. Tap it → an egg drops onto the board.
   Costs 1 energy. Eggs take three more taps to crack open, so the constant physical action
   of the game stays "tap the same place and see what comes out."
2. **The Board** — 7×8 grid. Drag two matching creatures together to evolve them. Space is
   the constraint; a cluttered board means you can't hatch.
3. **Requests** — visitors ask for specific creatures ("someone wants a tier-5 Emberkit").
   Pays coins, and gives you a reason to prefer one chain over another today.
4. **Habitats** — the "village". Spend coins building out biomes (Meadow → Hollow → Volcano
   → Reef → Aurora). Finishing a biome permanently unlocks a new creature family and a
   passive bonus. This is your endless ladder and your main coin sink.
5. **The Draw** — Coin Master's spin, reskinned as a wild encounter. Costs energy. Outcomes:
   coins, a mid-tier creature dropped straight onto the board, an expedition, a ward, or a
   card.
6. **The Album** — every family has a set of cards. Complete a set → big reward + a shiny
   variant. Duplicates convert to dust. Fully offline, and it's the thing that keeps people
   coming back for months.

### The raid, without a server

**Expeditions.** You travel to another sanctuary — procedurally generated, given a plausible
keeper name and a habitat built from your own progression tables — and choose one of four
places to search. Three pay out, one is empty. Same choice, same reveal, same "I got lucky"
feeling as a Coin Master raid.

**Wards** replace shields: a rival keeper occasionally raids *you* between sessions, and a
ward blocks it. You come back to "someone tried to take 400 coins — your ward held." This
generates the return-visit anxiety Coin Master runs on, entirely locally.

Do this well and it is very hard to tell from the player's seat. Add real asynchronous
players later if the game earns it.

### The merge chain = an evolution line

```
Tier 1   Egg
Tier 2   Hatchling
Tier 3   Juvenile        ← the recognisable three-stage evolution
Tier 4   Adult
Tier 5   Elder
Tier 6   Awakened        ← elemental variants, board-visible glow
Tier 7   Radiant
Tier 8   Ancient
Tier 9   Mythic
Tier 10  Apex            ← one per family; the album centrepiece
```

Ten tiers per family, six to eight families. The first five read as a normal evolution
line; the top five are the long-tail chase.

### The numbers that matter

```
merge-2 chain, tier N needs 2^(N-1) base items
  tier 5  =  16 eggs      routine
  tier 8  = 128 eggs      a week's play
  tier 10 = 512 eggs      a months-long goal
```

512 taps for one apex creature is correct and intentional — that's the whole mid-game — but
you must relieve it or it becomes a grind:

- the nest starts dropping tier 2 and 3 directly as your sanctuary levels up
- requests consume mid-tier creatures, so not everything has to climb
- the Draw drops tier 4–6 creatures outright
- merges above tier 6 are milestone moments with a full-screen reveal, not routine actions

Energy: cap 50, regen 1 per 2 minutes (full in ~100 minutes). Sessions land at 8–12 minutes,
two or three a day. That's the standard shape and it's standard because it works.

**Use merge-2, not merge-3.** Merge-3 (Travel Town, Merge Dragons) gives designers finer
economy control but clutters the board far faster, and clutter frustration is the number one
reason people quit merge games. Merge-2 also gives you the clean 2^n maths above, and it
maps to *two parents, one evolution*, which fits the fantasy.

---

## 4. The two real risks

### Art is the wall, not code

Ten tiers × eight families = **80 creature illustrations**, in one consistent style, each
readable at ~80px on a busy board. That is the project. The merge board itself is maybe four
evenings of work; the art is months, or money.

Options, honestly:

- **A flat geometric style you can personally execute.** Creatures built from simple shapes,
  strong silhouettes, limited palette. Constrained style is easier to keep consistent than a
  loose one — and consistency is what sells it, not detail.
- **Commission one family** (10 assets) to establish a style guide, then match it yourself.
- **Generate and hand-fix.** Style consistency across 80 assets is the hard part; expect to
  redraw a lot.

**The decisive experiment: produce ten assets in one style, tier 1 to 10, before writing any
game code.** If you can make ten that look like a family, you can make eighty. If you can't,
you've spent a weekend instead of three months, and you build the busker game instead.

### Store policy around the slot machine

A spin-to-win wheel inside a creature game that looks appealing to children is a genuine
policy hazard. If your art reads as child-directed, you land under Play's Families policy
and Apple's Kids category rules, which restrict ads, data, and simulated gambling. Also,
both stores require **disclosed odds** for any loot-box-style randomiser.

Practical route: make the randomiser an *encounter* rather than a *slot machine* — no reels,
no jackpot language, no casino sound design. Pitch the art slightly older (a naturalist's
field-journal look rather than bright toyetic). Target an Everyone rating without opting into
the child-directed programmes, and publish the drop odds in-app. This costs you nothing and
removes an entire category of review rejection.

---

## 5. Scope, honestly

This is **four to five times the busker game.** Drag-and-drop board state, save/restore of a
full grid, spawn logic, an economy across three currencies, an album, habitat build-out, plus
80 assets. It's the better product with a much higher ceiling. It's also the one that can
stall out.

### MVP (v0.1)

**In:** the nest tap, a 7×8 board, merge-2, **one** creature family of 10 tiers, energy,
coins, requests, save/restore, offline energy regen.

**Out:** the Draw, expeditions, wards, album, habitats, multiple families, sound, monetization.

That's still a real game — the merge loop plus requests carries it — and everything cut is
additive rather than structural.

### Milestones

| | What | Gate |
|---|---|---|
| **M-1** | Ten assets, tier 1→10, one family, one style | **Can you make a family? If not, stop here** |
| **M0** | Board: drag, snap, merge, spawn, one placeholder chain | Does merging feel good? |
| **M1** | Nest tap + energy + eggs + coins | A real 10-minute session |
| **M2** | Save, offline regen, requests | A game you reopen tomorrow |
| **M3** | The Draw + expeditions + wards | The Coin Master hook |
| **M4** | Album + a second family + habitats | Long-term reason to play |
| **M5** | Store: icon, screenshots, listing, closed test | On someone else's phone |

M-1 comes before any code. That ordering is the single most useful thing in this document.

---

## 6. Technical notes

Same stack as Duet (Expo SDK 57, RN 0.86, TypeScript, expo-router, Reanimated 4.5) in a
**new repo**. Still no game engine needed — a merge board is a grid of absolutely-positioned
views.

- **Board state**: a flat array of `{ id, chainId, tier, cell }`. Never store it as a 2D
  array; a flat list with a cell index is far easier to save, animate, and reason about.
- **Drag**: `react-native-gesture-handler` (already in Duet) + Reanimated shared values, with
  the drop target computed from position on the UI thread. Merge validation happens in JS on
  release only.
- **Game logic stays pure**: `merge(state, aId, bId) => state`, `tick(state, dt) => state`,
  no React and no storage inside it. This is what lets you tune the economy without breaking
  the UI.
- **Content as data**: chains, tiers, drop tables and costs in `src/game/content.ts`, every
  tunable in `src/game/balance.ts`. You'll edit balance hundreds of times.
- **Randomness must be seeded and saved**, or players will close and reopen the app to reroll
  a bad Draw. Store the RNG state in the save file.
- **Save**: the whole board as JSON via the same expo-sqlite KV pattern as Duet's
  `src/lib/storage.ts`; debounce 2s and force a save on `AppState → background`.
- Read the v57 docs for any new package before using it, and resolve versions with
  `npx expo install` rather than hand-writing them.

## 7. Money

Coin Master monetizes by selling spins into an artificial energy shortage, tuned by a live-ops
team against daily dashboards. You won't replicate that and shouldn't design as if you will.

For v1: **free, no ads, no IAP.** Ship it, see whether anyone plays, and keep the data-safety
form at "no data collected" like Duet. If it does find an audience, the natural first product
is an energy-cap upgrade or a cosmetic sanctuary theme as a one-time purchase — not a
consumable currency, which drags you into exactly the live-ops treadmill you can't staff.

---

## 8. Recommendation

Build this instead of the busker game — **conditional on M-1.** The evolution-as-merge idea
is stronger than anything in the previous doc, and the genre suits a solo developer far better
than a live-service raid game does. But the art is a real wall and it's better to hit it in a
weekend than in month three.

So: ten creatures, one family, one style, before any code. Then I'll build the board.

Open questions for you:

1. What kind of creatures? (elemental animals / constellation beasts / things made of
   natural materials / something odder)
2. Are you drawing, commissioning, or generating the art?
3. Comfortable with expeditions being PvE, at least until there's an audience?
