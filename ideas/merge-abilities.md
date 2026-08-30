# Elemental abilities on a merge-2 board

Builds on `ideas/merge-collector.md` and `ideas/creature-sources.md`. This doc solves one
problem: **merge games are slow and contemplative; you want the tempo of a match-3.**

---

## 1. Name the tension first

The two genres treat the board as opposite things:

- **In match-3, your pieces are ammunition.** They exist to be destroyed. Gravity refills
  the board, cascades chain, and every explosion is pure profit. Destruction *is* progress.
- **In merge, your pieces are assets.** You spent energy on every one of them. The board is
  a workspace, not a battlefield, and the real enemy is clutter, not difficulty.

This is why you can't bolt match-3 power-ups onto a merge board. A rocket that clears a row
is a *reward* in Candy Crush and a *robbery* in a merge game — it just destroyed nine things
you paid for. Any ability that removes your stuff has to give back more than it took, or it
feels like a punishment with a nice animation.

The design rule that follows: **abilities must operate on the merge economy, not against it.**

## 2. The right analogue for a cascade

Match-3's speed comes from cascades — one match causes a collapse, which causes another
match, unprompted. The board does work while you watch.

The merge-2 equivalent isn't explosions. It's this:

> A merge triggers an ability → the ability moves, copies, or upgrades something → that
> creates a new adjacent pair → **which merges automatically** → which triggers *its*
> ability → and onward.

The board resolving itself in a chain reaction is exactly the feeling you're after, and it's
native to merging rather than imported. Get this one loop right and the game is fast.

## 3. Eight elements, eight verbs

Each family gets **one** signature verb, and each verb fixes a different real friction in
merge gameplay. That constraint is what stops the ability list turning to mush.

| Family | Apex | Verb | What it does | Friction it fixes |
|---|---|---|---|---|
| **Ember** | Phoenix | *Ignite* | Burns nearby low-tier clutter, returns energy plus one item a tier higher | Board clutter |
| **Tide** | Kraken | *Surge* | Pulls matching creatures across the board together and auto-merges them | Dragging tedium — **the main cascade driver** |
| **Hollow** | Kitsune | *Mimic* | Becomes a wildcard, or copies an adjacent creature | "I need one more of these" |
| **Stone** | Behemoth | *Compact* | Shoves the board to one side, freeing a clean block; at high tier, permanently adds a row | Space |
| **Gale** | Roc | *Sweep* | Sorts a region so matching items land adjacent; instantly recharges the nest | Sorting, generator cooldown |
| **Rime** | Yeti | *Shatter* | **Reverse-merge** — splits one creature back into two of the tier below | Needing a specific mid-tier item |
| **Verdant** | Qilin | *Bloom* | Spawns free base creatures without spending energy | Energy scarcity |
| **Umbra** | Baku | *Devour* | Eats a creature and returns its full value as energy and coins | Dead-end items |

Two worth pointing at. **Surge** is the engine of the whole system — it's the one that
reliably starts chain reactions, so it should be the second family the player unlocks, right
after they understand basic merging. And **Shatter** is unusual enough to be a signature:
almost no merge game lets you go *backwards*, and it turns a stuck board into a puzzle that
has an answer.

## 4. Power scales with tier — your explicit ask

Merging at tier N fires that family's verb at strength N. Nothing before tier 4, so the early
game stays clean and teaches plain merging first.

| Tier | Ability strength |
|---|---|
| 1–3 | None — learn to merge |
| 4 | Single adjacent target |
| 5 | Radius 1 (up to 4 targets) |
| 6 | Full row or column |
| 7 | Radius 2, and can trigger one follow-on merge |
| 8 | Board region, chains freely |
| 9 | Board-wide, **manually aimed** |
| 10 | Board-wide, guaranteed cascade, full-screen moment |

This curve does the work you asked for: a tier-4 merge is a small helpful pop, a tier-8 merge
visibly rearranges the board, a tier-10 merge is an event you'd screenshot. Progression makes
the game **faster**, not just bigger — the opposite of most merge games, where the late game
gets slower and grindier.

## 5. Auto-fire, not menus

Decide this early, because it determines the feel:

- **Tiers 4–8 fire automatically on merge.** No targeting, no confirmation, no menu. The
  player merges and things happen. Every prompt you add is a full stop in a game that should
  read like a run-on sentence.
- **Tiers 9–10 are aimed.** The player drags to place the effect. At that power it earns a
  deliberate beat, and the pause makes it feel important rather than tedious.

Cost model: the ability *is* the reward for reaching the tier. No charges, no cooldown, no
resource. An ability currency would stack a second economy on top of energy and slow the
whole thing down again.

## 6. The chain meter — the actual speed mechanic

This is the highest-value idea in this document.

Merge games have no time pressure at all, which is why they feel slow even when a lot is
happening. Add an **optional** combo window:

```
after any merge, a 2.5s window opens
each merge inside the window extends it and raises the multiplier
  chain 1-2    1.0x
  chain 3-4    1.5x
  chain 5-7    2.0x
  chain 8+     3.0x  (cap)
auto-merges from ability cascades COUNT toward the chain
```

**Critical balance rule: the multiplier applies to coins and XP only, never to item tiers.**
Chains must never manufacture progression, or fast fingers break the economy overnight.

That gives you match-3 tempo without match-3 pressure. A player who wants to sit and think
loses only a bonus; a player who wants to go fast has something to be good at. And because
cascades feed the chain, a big tier-8 merge can carry you to 3x on its own — the game
rewarding you for having built something strong.

## 7. Two UX changes worth as much as any ability

1. **Tap-to-merge.** If two matching creatures are already adjacent, tapping either merges
   them. Dragging every single pair is the biggest hidden tax in every merge game on the
   store, and removing it roughly doubles actions per minute.
2. **Hold to bulk-merge.** Press and hold a creature to merge every matching pair of that
   tier at once. Clears low-tier sludge in one gesture.

Neither is a new mechanic. Both make the game feel twice as fast.

## 8. Branching evolution — and a callback to your first idea

Pokémon-style collection wants branches, not just lines. Eevee is the most beloved thing in
that franchise for a reason.

Put a fork at tier 6 and decide it by **where on the board the merge happens.** Habitat tiles
occupy parts of the grid: merge two tier-5 Embers on a volcanic tile and you get the Radiant
branch; on a frozen tile, the Ashen branch. Same creatures, different outcome.

Note what that does — it makes *where you merge* a real decision. That's the thing you asked
for in your very first message, "making decisions where to play", arriving in the merge game
rather than the busker one. It also doubles your album without doubling your chains, since a
branch only needs distinct art for tiers 6–10.

## 8a. Playtest finding — agency, 30 Aug

First play of the prototype: tap-to-merge landed well. The cascade "felt more like the board
playing itself, but it also gives a rush and motivation to get that again."

That's a mistuning of authorship, not of magnitude — so the fix keeps the payoff and moves the
trigger back into the player's hands. Automation isn't what costs agency; **target selection
is.** Factory and incremental games are entirely the board playing itself and people love them,
because the player built the machine. Surge was reaching board-wide and rearranging pieces the
player wasn't thinking about, and its label appeared at the top of the screen, far from the
cause.

Four changes, none of which shrink the reward:

1. **Locality.** Surge acts only inside a radius that grows with tier — 2 cells at tier 5, the
   whole board at tier 9. The cascade becomes a visible consequence of *where* you merged, and
   board-wide spectacle is reserved for the apex, where it should be rare.
2. **Telegraph.** Targets light up gold for ~260ms before they move. Predictable is plannable,
   and plannable is authored.
3. **Tidiness pays.** Surge takes the *closest* pairs first, so an organised board cascades and
   a scattered one visibly fizzles. Board arrangement becomes a skill the ability rewards.
4. **Chain credit.** Only player merges climb the multiplier. Cascade merges pay coins and
   extend the window but never raise it — so a big cascade hands the player *time to keep
   playing* rather than playing for them.

Ability floor also moved from tier 4 to tier 5 and the cascade cap from 12 to 8: firing on
nearly every mid-tier merge made it ambient rather than an event. Feedback labels now float from
the source tile instead of the top of the screen.

The general principle worth keeping: **let the player author the cascade, then let them watch it
run.** Rarity and locality restore agency more cheaply than taking the fireworks away.

### Follow-up: no dead ends

The first pass at "tidiness pays" printed **"Surge fizzled"** when no pair was in range. Play
test response was "what is surge fizzled?" — which is the worst of the three possible readings.
The concern had been whether a fizzle would read as the player's mistake or as the game being
stingy; in fact it read as neither, because it wasn't legible at all. A negative message the
player can't decode teaches nothing, and it can land on the player's very first tier-5 merge —
the exact moment the ability should be selling itself.

Rule adopted: **an ability never does nothing.** Surge now always advances the board, and the
message names the actual situation so the rule can be learned:

- No pair in range → drags the nearest creature to you (*Gathered ×1*), setting up your next merge
- Pairs in range but no space to pull → refunds energy (*No room to pull +1*)
- Nothing in range at all → refunds energy (*Nothing in range +2*)

The reward gradient is now small-to-huge rather than nothing-to-huge, which keeps the incentive
to organise the board without ever punishing a merge the player worked for.

## 9. Where this can break

- **Infinite cascades.** Cap auto-merges at ~12 per triggered chain, then stop and hand
  control back. Without a cap, one Surge solves the whole board.
- **Abilities outpacing energy.** Bloom and Devour both generate resources. Track energy
  produced by abilities against energy spent; if abilities net positive, the energy gate
  stops meaning anything and sessions never end.
- **Cascades hiding the game.** If the board constantly resolves itself the player stops
  feeling responsible for outcomes. Cascades should *finish* what the player started, never
  start things on their own.
- **Ability spam at low tiers.** Starting at tier 4 rather than tier 1 matters — early boards
  are dense with low tiers and would be a permanent firework display.

## 10. What to build first

For the M0 board spike, build in this order and stop at each step to check the feel:

1. Merge-2 with tap-to-merge, one chain, no abilities
2. The chain meter — it works with zero abilities, as pure merge speed
3. **Surge only**, tiers 4–8: the cascade driver, alone
4. Ignite and Bloom — one destructive, one generative — to prove abilities can pull in
   opposite directions without breaking the economy
5. Everything else

If steps 1–3 aren't fun, the remaining five elements won't save it. Three abilities is enough
to know whether the system works.

Explicitly **not** in v1: pairwise elemental reactions (Ember + Gale = firestorm, and so on).
Eight elements is 28 pairs to design, balance and animate. Ship the eight clean verbs, then
add reactions later as a "resonance" system once you know which pairs players actually make.
