package com.mgroenteman.overlaytranslate.translate

import android.util.Log
import com.google.mlkit.common.model.DownloadConditions
import com.google.mlkit.nl.translate.Translation
import com.google.mlkit.nl.translate.Translator
import com.google.mlkit.nl.translate.TranslatorOptions
import com.mgroenteman.overlaytranslate.Language
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.tasks.await

/**
 * On-device translation via ML Kit.
 *
 * Each language pair needs a model (~30 MB per language) downloaded once; after
 * that everything runs locally and no text ever leaves the phone.
 */
class TranslationEngine {

    private var translator: Translator? = null
    private var loadedPair: String? = null

    private fun clientFor(source: Language, target: Language): Translator {
        val pair = "${source.mlKitCode}-${target.mlKitCode}"
        translator?.let { if (loadedPair == pair) return it }

        translator?.close()
        val options = TranslatorOptions.Builder()
            .setSourceLanguage(source.mlKitCode)
            .setTargetLanguage(target.mlKitCode)
            .build()

        return Translation.getClient(options).also {
            translator = it
            loadedPair = pair
        }
    }

    /**
     * Downloads the models for this pair if they are missing.
     *
     * @return null on success, or a message to show the user.
     */
    suspend fun ensureModels(
        source: Language,
        target: Language,
        requireWifi: Boolean = false
    ): String? = try {
        val conditions = DownloadConditions.Builder()
            .apply { if (requireWifi) requireWifi() }
            .build()
        clientFor(source, target).downloadModelIfNeeded(conditions).await()
        null
    } catch (t: Throwable) {
        Log.w(TAG, "Model download failed", t)
        "Could not download the translation model: ${t.message ?: "no connection"}"
    }

    /**
     * Translates every line, keeping the order of the input.
     *
     * A line that fails to translate comes back as the original text rather than
     * failing the whole batch — a partly translated screen still beats none.
     */
    suspend fun translate(lines: List<String>, source: Language, target: Language): List<String> {
        if (lines.isEmpty()) return emptyList()
        val client = clientFor(source, target)

        return coroutineScope {
            lines.map { line ->
                async {
                    try {
                        client.translate(line).await()
                    } catch (t: Throwable) {
                        Log.w(TAG, "Translation failed for a line", t)
                        line
                    }
                }
            }.awaitAll()
        }
    }

    fun release() {
        translator?.close()
        translator = null
        loadedPair = null
    }

    private companion object {
        const val TAG = "TranslationEngine"
    }
}
