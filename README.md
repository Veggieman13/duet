# Cycle Tracker

A private period and ovulation tracker. All data stays on the device — no accounts,
no servers, no tracking. Partner sharing is planned for v2.

Built with Expo (React Native), targeting both the App Store and Google Play.

## Features (v1)

- **Today** — cycle day, current phase, next-period countdown, fertile window
- **Calendar** — logged periods, predicted periods, fertile window, ovulation
- **Logging** — flow level, symptoms, notes per day
- **Tips** — wellness tips by cycle phase, with the current phase highlighted
- **Settings** — cycle defaults, privacy info, delete-all-data

Predictions start from onboarding answers and automatically switch to averages
of logged cycles as data accumulates (`src/lib/cycle.ts`).

## Run it

```sh
npm install

# On your phone: install the "Expo Go" app, then
npx expo start
# and scan the QR code (phone and computer must be on the same Wi-Fi)

# In a browser
npm run web
```

## Project layout

- `src/app/` — screens (Expo Router file-based routing)
- `src/lib/` — data model, cycle math, storage, tips content
- `src/components/` — calendar grid, chips, steppers, themed primitives

## Checks

```sh
npx tsc --noEmit   # typecheck
npm run lint       # lint
```
