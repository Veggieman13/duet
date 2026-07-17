# Duet — launch post drafts

Personalize before posting: add your own voice, real numbers, and current
screenshots. Post from your own accounts; answer every comment in the first
few hours — the discussion is the marketing.

---

## Reddit — r/SideProject (also adaptable for r/indiehackers)

**Title:** I couldn't code 6 months ago. Yesterday my period-tracker-for-couples
went live — built because my wife's cycle affects both of us.

**Body:**

My wife once said something that stuck with me: her period tracker treats her
like she's single. She logs everything, and I — the person who lives with her,
plans around her energy, and buys the chocolate — see none of it unless she
remembers to tell me.

So I built Duet: a period tracker where sharing with your partner is the whole
point. She tracks on her iPhone, I follow on my Android. Pairing is one QR code
scan. And the sharing is free — the big apps paywall exactly this feature.

The other thing we cared about: privacy. Duet has no accounts at all. No email,
no password, nothing. Data stays on her phone unless she chooses to share, and
then it's stored under a random ID that isn't linked to anyone. We can't leak
what we don't have.

Stack for the curious: React Native + Expo, Supabase (anonymous auth + RLS),
built almost entirely with an AI pair programmer while I learned as I went.

Happy to answer anything about the build, the store review gauntlet, or what
it's like shipping your first app with your wife as product manager. 😄

[link]

---

## Hacker News — Show HN

**Title:** Show HN: Duet – a period tracker for couples, with no accounts at all

**Body:**

My wife's period tracker treats partners as an afterthought, so we built one
where partner sharing is the core feature — and free (the incumbents paywall it).

Technically interesting bits:

- Zero accounts: each device gets an anonymous Supabase identity; couples pair
  by QR code. The server stores cycle data under random UUIDs with row-level
  security — there is no email, name, or identifier to leak.
- One React Native codebase, iPhone + Android, syncing across the two.
- Partner devices are read-only by RLS policy, and either side can dissolve the
  pair, which cascades deletion of all shared data.

First app I've ever shipped — six months ago I couldn't program. Honest
feedback welcome, especially on the privacy model.

[link]

---

## Product Hunt

**Name:** Duet
**Tagline:** The private period tracker built for two
**First comment (maker story):**

Hi PH! 👋 Duet started with a complaint from my wife: why does her period
tracker pretend her partner doesn't exist?

Duet is a period & cycle tracker where the partner is a first-class citizen:
she tracks, I see her cycle, phase and a heads-up on my own phone (she's
iPhone, I'm Android — works fine). Pairing = scanning one QR code.

What makes it different:
💞 Partner sharing is FREE — the category leaders charge for it
🔒 No accounts — no email, no password, no data linked to any identity
📵 No ads, no analytics, no trackers — ever
🌙 Predictions that learn her real rhythm, plus tips for both of us

Would love your feedback — especially from couples!

---

## Press pitch (femtech / privacy newsletters & blogs)

Subject: A period tracker that can't leak your data — because it has no accounts

Hi [name],

After the last few years of period-tracker privacy scandals, my wife and I
built the opposite: Duet, a cycle tracker with no accounts whatsoever. No
email, no sign-up — data stays on-device, and the optional partner-sharing
feature stores cycle data under an anonymous random ID with nothing linking it
to a person.

The twist: it's built for couples. Partners see the cycle on their own phone —
a feature the big trackers paywall, free in Duet.

It's live on [stores] — happy to share more or a demo. [link]

---

## Channel checklist (launch week)

- [ ] Landing page linked everywhere: https://veggieman13.github.io/duet/
- [ ] Reddit r/SideProject post (Tue–Thu morning US time works best)
- [ ] Show HN (weekday morning US time; stay online to reply)
- [ ] Product Hunt launch (Tue/Wed; prepare gallery images from screenshots)
- [ ] 8–10 press pitch emails to femtech/privacy writers
- [ ] Ask happy testers for a Play Store rating on day one (ratings carry ASO)
- [ ] r/androidapps "what's new" style post
