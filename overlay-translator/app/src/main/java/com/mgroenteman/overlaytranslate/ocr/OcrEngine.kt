package com.mgroenteman.overlaytranslate.ocr

import android.graphics.Bitmap
import android.graphics.Rect
import android.util.Log
import androidx.annotation.WorkerThread
import cz.adaptech.tesseract4android.TessBaseAPI
import com.mgroenteman.overlaytranslate.Language
import java.io.File

/**
 * Reads text off a screenshot with Tesseract.
 *
 * ML Kit's text recognizer only handles Latin, Chinese, Devanagari, Japanese and
 * Korean script, so it cannot read Hebrew at all — hence Tesseract, which has a
 * proper Hebrew model and runs entirely on-device.
 *
 * Not thread safe: call [recognize] from a single background thread.
 */
class OcrEngine(private val dataParentDir: File) {

    private var tess: TessBaseAPI? = null
    private var loadedLanguage: String? = null

    @WorkerThread
    fun recognize(bitmap: Bitmap, language: Language, minConfidence: Int): List<OcrLine> {
        val api = engineFor(language) ?: return emptyList()

        api.setImage(bitmap)

        // Screens are not documents: text sits in scattered buttons and labels rather
        // than paragraphs, so sparse mode beats the default page-layout analysis.
        api.setPageSegMode(TessBaseAPI.PageSegMode.PSM_SPARSE_TEXT)

        return try {
            // Forces recognition; the iterator is only valid afterwards.
            api.getUTF8Text()
            collectLines(api, language, minConfidence)
        } catch (t: Throwable) {
            Log.w(TAG, "OCR failed", t)
            emptyList()
        } finally {
            api.clear()
        }
    }

    private fun collectLines(
        api: TessBaseAPI,
        language: Language,
        minConfidence: Int
    ): List<OcrLine> {
        val iterator = api.getResultIterator() ?: return emptyList()
        val level = TessBaseAPI.PageIteratorLevel.RIL_TEXTLINE
        val lines = mutableListOf<OcrLine>()

        try {
            iterator.begin()
            do {
                val raw = iterator.getUTF8Text(level) ?: continue
                val text = raw.trim()
                if (text.isEmpty()) continue

                val confidence = iterator.confidence(level)
                if (confidence < minConfidence) continue

                // A single stray character is nearly always an icon misread.
                if (text.length < 2) continue
                if (!language.looksLikeThisScript(text)) continue

                val bounds: Rect = iterator.getBoundingRect(level) ?: continue
                if (bounds.width() < MIN_BOX_PX || bounds.height() < MIN_BOX_PX) continue

                lines += OcrLine(text, bounds, confidence)
            } while (iterator.next(level))
        } catch (t: Throwable) {
            Log.w(TAG, "Result iteration failed", t)
        } finally {
            runCatching { iterator.delete() }
        }

        return lines
    }

    private fun engineFor(language: Language): TessBaseAPI? {
        val existing = tess
        if (existing != null && loadedLanguage == language.tessCode) return existing

        existing?.recycle()
        tess = null
        loadedLanguage = null

        val api = TessBaseAPI()
        // Tesseract wants the *parent* of the tessdata folder, with a trailing slash.
        val ok = try {
            api.init(dataParentDir.absolutePath + File.separator, language.tessCode)
        } catch (t: Throwable) {
            Log.w(TAG, "Tesseract init threw", t)
            false
        }

        if (!ok) {
            runCatching { api.recycle() }
            return null
        }

        tess = api
        loadedLanguage = language.tessCode
        return api
    }

    fun release() {
        runCatching { tess?.recycle() }
        tess = null
        loadedLanguage = null
    }

    private companion object {
        const val TAG = "OcrEngine"

        /** Boxes smaller than this are noise, not readable text. */
        const val MIN_BOX_PX = 8
    }
}
