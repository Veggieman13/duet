package com.mgroenteman.overlaytranslate.ui

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Rect
import android.graphics.RectF
import android.text.Layout
import android.text.StaticLayout
import android.text.TextPaint
import android.text.TextUtils
import android.util.TypedValue
import android.view.KeyEvent
import android.view.MotionEvent
import android.view.View

/**
 * The full-screen layer that shows the translation.
 *
 * It draws the captured screenshot (so the result cannot scroll out from under
 * the translation) and paints each translated line back over the spot its
 * original was found in. A tap anywhere, or Back, dismisses it.
 */
class TranslationOverlayView(context: Context) : View(context) {

    /** One translated line, positioned in screenshot pixel coordinates. */
    data class Block(val bounds: Rect, val text: String)

    var onDismiss: (() -> Unit)? = null

    private var screenshot: Bitmap? = null
    private var showScreenshot: Boolean = true
    private var blocks: List<Block> = emptyList()

    private var rendered: List<RenderBlock> = emptyList()
    private var needsLayout = true

    private val boxPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = BOX_FILL }
    private val borderPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
        color = BOX_BORDER
        strokeWidth = dp(1.5f)
    }
    private val scrimPaint = Paint().apply { color = SCRIM }
    private val hintBackgroundPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = HINT_FILL }
    private val hintTextPaint = TextPaint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.WHITE
        textSize = sp(13f)
        textAlign = Paint.Align.CENTER
    }
    private val textPaint = TextPaint(Paint.ANTI_ALIAS_FLAG).apply { color = TEXT_COLOR }

    private val padding = dp(4f)
    private val corner = dp(6f)

    private var hintText: String = ""

    init {
        isFocusableInTouchMode = true
        setBackgroundColor(Color.TRANSPARENT)
    }

    fun setContent(
        screenshot: Bitmap?,
        showScreenshot: Boolean,
        blocks: List<Block>,
        hint: String
    ) {
        this.screenshot = screenshot
        this.showScreenshot = showScreenshot
        this.blocks = blocks
        this.hintText = hint
        needsLayout = true
        invalidate()
    }

    override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
        super.onSizeChanged(w, h, oldw, oldh)
        needsLayout = true
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)

        val bitmap = screenshot
        if (showScreenshot && bitmap != null && !bitmap.isRecycled) {
            canvas.drawBitmap(bitmap, null, RectF(0f, 0f, width.toFloat(), height.toFloat()), null)
            canvas.drawRect(0f, 0f, width.toFloat(), height.toFloat(), scrimPaint)
        }

        if (needsLayout) {
            rendered = buildRenderBlocks()
            needsLayout = false
        }

        for (block in rendered) {
            canvas.drawRoundRect(block.rect, corner, corner, boxPaint)
            canvas.drawRoundRect(block.rect, corner, corner, borderPaint)

            canvas.save()
            canvas.translate(block.rect.left + padding, block.rect.top + padding)
            block.layout.draw(canvas)
            canvas.restore()
        }

        drawHint(canvas)
    }

    private fun drawHint(canvas: Canvas) {
        if (hintText.isEmpty()) return

        val textWidth = hintTextPaint.measureText(hintText)
        val pillWidth = textWidth + dp(28f)
        val pillHeight = dp(34f)
        val left = (width - pillWidth) / 2f
        val top = height - pillHeight - dp(48f)
        val pill = RectF(left, top, left + pillWidth, top + pillHeight)

        canvas.drawRoundRect(pill, pillHeight / 2f, pillHeight / 2f, hintBackgroundPaint)

        val baseline = pill.centerY() - (hintTextPaint.descent() + hintTextPaint.ascent()) / 2f
        canvas.drawText(hintText, pill.centerX(), baseline, hintTextPaint)
    }

    /**
     * Turns each OCR box into a drawable box with text laid out to fit.
     *
     * The screenshot is captured at the display's real pixel size and this view
     * covers the whole display, so the two normally match one-to-one; the scale
     * factors are here for the cases where they don't (rotation mid-capture).
     */
    private fun buildRenderBlocks(): List<RenderBlock> {
        val bitmap = screenshot ?: return emptyList()
        if (width == 0 || height == 0 || bitmap.width == 0 || bitmap.height == 0) return emptyList()

        val scaleX = width.toFloat() / bitmap.width
        val scaleY = height.toFloat() / bitmap.height

        return blocks.mapNotNull { block ->
            val rect = RectF(
                block.bounds.left * scaleX,
                block.bounds.top * scaleY,
                block.bounds.right * scaleX,
                block.bounds.bottom * scaleY
            )

            // Give every box a little breathing room; translated English is often
            // wider than the Hebrew it replaces.
            rect.inset(-dp(2f), -dp(2f))
            rect.left = rect.left.coerceAtLeast(0f)
            rect.top = rect.top.coerceAtLeast(0f)
            rect.right = rect.right.coerceAtMost(width.toFloat())

            val innerWidth = (rect.width() - padding * 2).toInt()
            if (innerWidth <= 0) return@mapNotNull null

            val layout = fitText(block.text, innerWidth, rect.height() - padding * 2)

            // If the text genuinely needs more room, grow the box downwards rather
            // than clipping the translation.
            val needed = layout.height + padding * 2
            if (needed > rect.height()) {
                rect.bottom = (rect.top + needed).coerceAtMost(height.toFloat())
            }

            RenderBlock(rect, layout)
        }
    }

    /** Picks the largest readable text size whose layout still fits the box. */
    private fun fitText(text: String, widthPx: Int, maxHeight: Float): StaticLayout {
        var best: StaticLayout? = null
        val minSize = sp(MIN_TEXT_SP)
        // Start from roughly the height of the original line, capped so a tall box
        // (a heading, say) doesn't start at an absurd size and iterate forever.
        var size = (maxHeight * 0.8f).coerceIn(minSize, sp(MAX_TEXT_SP))

        while (size >= minSize) {
            val paint = TextPaint(textPaint).apply { textSize = size }
            val layout = buildLayout(text, paint, widthPx)
            if (layout.height <= maxHeight || size <= minSize) {
                best = layout
                break
            }
            size -= sp(1f)
        }

        return best ?: buildLayout(text, TextPaint(textPaint).apply { textSize = minSize }, widthPx)
    }

    private fun buildLayout(text: String, paint: TextPaint, widthPx: Int): StaticLayout =
        StaticLayout.Builder.obtain(text, 0, text.length, paint, widthPx)
            .setAlignment(Layout.Alignment.ALIGN_NORMAL)
            .setLineSpacing(0f, 1f)
            .setIncludePad(false)
            .setEllipsize(TextUtils.TruncateAt.END)
            .setMaxLines(MAX_LINES)
            .build()

    @SuppressLint("ClickableViewAccessibility")
    override fun onTouchEvent(event: MotionEvent): Boolean {
        if (event.action == MotionEvent.ACTION_UP) {
            performClick()
            onDismiss?.invoke()
        }
        return true
    }

    override fun performClick(): Boolean {
        super.performClick()
        return true
    }

    override fun dispatchKeyEvent(event: KeyEvent): Boolean {
        if (event.keyCode == KeyEvent.KEYCODE_BACK && event.action == KeyEvent.ACTION_UP) {
            onDismiss?.invoke()
            return true
        }
        return super.dispatchKeyEvent(event)
    }

    private fun dp(value: Float): Float = TypedValue.applyDimension(
        TypedValue.COMPLEX_UNIT_DIP, value, resources.displayMetrics
    )

    private fun sp(value: Float): Float = TypedValue.applyDimension(
        TypedValue.COMPLEX_UNIT_SP, value, resources.displayMetrics
    )

    private data class RenderBlock(val rect: RectF, val layout: StaticLayout)

    private companion object {
        const val BOX_FILL = 0xFFFDFBFF.toInt()
        const val BOX_BORDER = 0xFF6C5CE0.toInt()
        const val TEXT_COLOR = 0xFF12101A.toInt()
        const val SCRIM = 0x99000000.toInt()
        const val HINT_FILL = 0xCC1B1826.toInt()

        const val MIN_TEXT_SP = 9f
        const val MAX_TEXT_SP = 22f
        const val MAX_LINES = 4
    }
}
