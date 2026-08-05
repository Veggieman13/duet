package com.mgroenteman.overlaytranslate.ocr

import android.graphics.Rect

/** One line of text found on screen, with its position in screenshot pixels. */
data class OcrLine(
    val text: String,
    val bounds: Rect,
    val confidence: Float
)
