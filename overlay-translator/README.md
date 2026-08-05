# Overlay Translate

A floating-bubble translation overlay for Android. Tap the bubble over any app and it
takes one screenshot, reads the text on it, translates it, and paints the translation
back over the words it found. Built for Hebrew → English, but it does nine other
languages too.

Everything runs on the phone. After the one-time model download, no text and no
screenshot ever leaves the device — the app has no server, no analytics, and no
account.

> **Note:** this is a standalone Android project that happens to live in this repo. It
> shares nothing with the Duet app — no code, no dependencies, no build. Move it to its
> own repository whenever you like; the folder is self-contained.

## How it works

```
tap bubble
  → hide our own overlay windows (they'd end up in the screenshot)
  → grab one frame from a MediaProjection virtual display
  → Tesseract OCR reads the frame → text + a bounding box per line
  → drop lines that are low-confidence, too short, or not in the source script
  → ML Kit translates the surviving lines on-device
  → draw each translation over the box its original came from
```

### Why two different engines

ML Kit is Google's on-device ML library and it would be the obvious single choice, but
**its text recognizer cannot read Hebrew.** It supports Latin, Chinese, Devanagari,
Japanese and Korean script, and nothing else. So:

| Job | Library | Why |
| --- | --- | --- |
| Reading text off the screen | Tesseract 5 (`tesseract4android`) | Has a real Hebrew model. Fully offline. |
| Translating that text | ML Kit Translate | Hebrew *is* supported here, and its models are small and offline. |

Tesseract language data is downloaded on first run from the official `tessdata_fast`
repository (about 1–2 MB per language). ML Kit downloads its own models (~30 MB per
language) through Google Play services.

## Building it

There is no APK in this repo — you build one. The project is a standard Gradle Android
build, so the easy path is Android Studio:

1. Open Android Studio → **Open** → pick the `overlay-translator` folder.
2. Let it sync. It will fetch the Android SDK bits and the dependencies itself.
3. Plug in your phone with USB debugging on, and hit **Run**.

From the command line, with `ANDROID_HOME` pointed at an SDK that has API 35:

```bash
cd overlay-translator
./gradlew assembleDebug
# app/build/outputs/apk/debug/app-debug.apk
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

Build setup: AGP 8.7.3, Gradle 8.9, Kotlin 2.0.21, `compileSdk`/`targetSdk` 35,
`minSdk` 26 (Android 8.0).

## First run

The app's one screen is a checklist:

1. **Languages** — pick what to read (Hebrew) and what to show (English).
2. **Offline data** — tap *Download / check data*. Needs a connection once, and once only.
3. **Permissions** — *Draw over other apps*, and notifications (Android requires a
   notification while screen capture is running).
4. **Start bubble.** Android asks permission to capture the screen; accept it.

Then: **tap** the bubble to translate what's on screen, **drag** it to move it,
**hold** it to stop. Tap anywhere on a translation to dismiss it.

## Things worth knowing

- **Android asks for screen-capture permission every time you start the bubble.** That
  is a platform rule since Android 14 — a capture consent cannot be saved or re-used.
  Once you've accepted, the same session covers every tap of the bubble until you stop.
- **Some apps come out black.** Banking apps and anything else that sets `FLAG_SECURE`
  are excluded from screen capture by the system. Nothing can be done about that from
  inside an app.
- **OCR is not magic.** Small text, low contrast, and text over photos all read badly.
  Bumping the phone's font size or zooming in usually fixes a stubborn screen.
- **"Freeze the screen"** (on by default) keeps the captured screenshot behind the
  translation, so a chat that keeps scrolling can't slide out from under the boxes.
  Turn it off if you'd rather see the live screen behind the translations.
- **Rotating the phone** clears the current translation, since the boxes were positioned
  for the old screen size.
- **The already-existing alternative:** Google Translate's "Tap to translate" does a
  similar thing for copied text, and Lens translates through the camera. This app exists
  because neither of those gives you a one-tap, in-place overlay of the app you're
  actually looking at.

## Privacy

- Two network calls exist in the whole app, both during setup: the Tesseract language
  file from GitHub, and ML Kit's model download via Play services.
- No analytics, no crash reporting, no ad SDK, no account.
- Screenshots live in memory only. They are never written to disk and are recycled as
  soon as the translation is dismissed.
- The only stored data is your settings (languages, freeze toggle, bubble position) in
  SharedPreferences.

## Layout

```
app/src/main/java/com/mgroenteman/overlaytranslate/
  MainActivity.kt              setup checklist screen
  OverlayService.kt            foreground service: bubble, orchestration, windows
  Language.kt                  language table (Tesseract code + ML Kit tag + script check)
  Prefs.kt                     settings
  capture/ScreenCapture.kt     MediaProjection → single frames on demand
  ocr/TessdataManager.kt       downloads and stores traineddata
  ocr/OcrEngine.kt             Tesseract wrapper, returns lines + boxes
  translate/TranslationEngine.kt  ML Kit wrapper, batch translation
  ui/TranslationOverlayView.kt full-screen result layer
```

## Build verification status

The Kotlin sources were type-checked against the real Android 15 framework classes and
compile clean with no warnings. They have **not** been compiled into an APK or run on a
device — the environment this was written in has no Android SDK access. Expect to fix
the usual first-run papercuts (a Gradle plugin version Android Studio wants to bump, an
emulator quirk) rather than anything structural.
