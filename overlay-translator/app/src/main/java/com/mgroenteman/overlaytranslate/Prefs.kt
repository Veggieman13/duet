package com.mgroenteman.overlaytranslate

import android.content.Context

/** Small typed wrapper around SharedPreferences. Everything here stays on the device. */
class Prefs(context: Context) {

    private val prefs = context.applicationContext
        .getSharedPreferences("overlay_translate", Context.MODE_PRIVATE)

    var sourceLanguage: Language
        get() = Language.fromName(prefs.getString(KEY_SOURCE, null)) ?: Language.HEBREW
        set(value) = prefs.edit().putString(KEY_SOURCE, value.name).apply()

    var targetLanguage: Language
        get() = Language.fromName(prefs.getString(KEY_TARGET, null)) ?: Language.ENGLISH
        set(value) = prefs.edit().putString(KEY_TARGET, value.name).apply()

    /** Show the captured screenshot behind the translation so it can't scroll away. */
    var freezeScreen: Boolean
        get() = prefs.getBoolean(KEY_FREEZE, true)
        set(value) = prefs.edit().putBoolean(KEY_FREEZE, value).apply()

    /** Discard OCR lines the engine is less sure about than this (0-100). */
    var minConfidence: Int
        get() = prefs.getInt(KEY_MIN_CONFIDENCE, 55)
        set(value) = prefs.edit().putInt(KEY_MIN_CONFIDENCE, value).apply()

    /** Last position of the floating bubble, so it stays where it was put. */
    var bubbleX: Int
        get() = prefs.getInt(KEY_BUBBLE_X, 0)
        set(value) = prefs.edit().putInt(KEY_BUBBLE_X, value).apply()

    var bubbleY: Int
        get() = prefs.getInt(KEY_BUBBLE_Y, 300)
        set(value) = prefs.edit().putInt(KEY_BUBBLE_Y, value).apply()

    private companion object {
        const val KEY_SOURCE = "source_language"
        const val KEY_TARGET = "target_language"
        const val KEY_FREEZE = "freeze_screen"
        const val KEY_MIN_CONFIDENCE = "min_confidence"
        const val KEY_BUBBLE_X = "bubble_x"
        const val KEY_BUBBLE_Y = "bubble_y"
    }
}
