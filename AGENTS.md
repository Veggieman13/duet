# Duet — project brief for AI sessions

## Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

## What this is

Duet: a privacy-first period/cycle tracker for couples. React Native + Expo SDK 57,
TypeScript, expo-router. Owner is a beginner developer (explain things plainly);
the app is their first, built to learn and ship to both stores.

## Product decisions (settled — do not relitigate)

- **Partner sharing is free forever.** It's the differentiator; competitors (Flo) paywall it.
- **No user accounts, ever, by default.** Anonymous Supabase auth + QR/code pairing.
  Optional email backup may come later (Supabase supports linking email to anonymous users).
- **No ads, no analytics, no trackers.** The Play data-safety form declares only
  Health info + User IDs, collected, not shared, optional. Keep every change truthful to that.
- Tracker role logs; partner role is read-only. Either side can dissolve the pair
  (deletes server data, cascade).

## Architecture

- `src/lib/cycle.ts` — cycle math (episodes, predictions, phases)
- `src/lib/store.tsx` — context provider; local persistence + sync push/pull
- `src/lib/sharing.ts` + `db/schema.sql` — Supabase sync (RLS-guarded; see schema comments)
- `src/lib/storage.ts` / `.web.ts` — platform-split KV storage (SQLite native, localStorage web)
- Data stays on-device unless sharing is on; then full-snapshot sync per change (debounced)

## Status / infrastructure

- Google Play: closed test on Alpha track, com.mgroenteman.duet, v1.1.0 with sharing
- iOS: enrolled. App Store Connect record is **"Duet (c96d82)"** (App Apple ID 6799089427)
  — the suffix is EAS's uniquifier because plain "Duet" was taken; rename before public
  release. v1.1.0 build 1 delivered; wife tests via TestFlight.
- **ITMS-90863 on an iOS upload is not cosmetic — treat it as a launch crash.** v1.1.0 build 1
  died in dyld on every launch: `ExpoCamera.framework` referenced an `AnyModule._decorateObject`
  symbol that the bundled `ExpoModulesCore.framework` didn't export. Apple's Apple-silicon symbol
  check had flagged that exact symbol in the delivery email; the warning was the same defect
  caught statically. Cause was Expo patch skew (expo 57.0.4 / modules-core 57.0.3 with a
  57.0.3 camera, straddling the expo-modules-jsi split). Fix: keep every expo package on the
  same current 57.x patch line, and rebuild with `--clear-cache`.
- EAS project: jarkan/duet (profiles: preview=APK, production=AAB, remote versions)
- Supabase project: hohvrrtwnrvmrviapyus.supabase.co (anonymous sign-ins ON, schema applied)
- Web hosting: GitHub Pages from /docs — landing page, privacy.html, delete-data.html
- Store materials + launch post drafts: /store

## Conventions

- Verify with `npx tsc --noEmit` before committing; commit and push after each work unit.
- Theme: warm blush/plum palette in `src/constants/theme.ts` — no pure black/white.
- Copy tone: warm, plain language, never clinical; health disclaimers on medical-ish surfaces.
