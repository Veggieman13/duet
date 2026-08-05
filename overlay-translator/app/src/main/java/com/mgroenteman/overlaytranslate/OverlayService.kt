package com.mgroenteman.overlaytranslate

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.content.res.Configuration
import android.graphics.Bitmap
import android.graphics.PixelFormat
import android.hardware.display.DisplayManager
import android.media.projection.MediaProjection
import android.media.projection.MediaProjectionManager
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.provider.Settings
import android.util.DisplayMetrics
import android.util.Log
import android.view.Display
import android.view.Gravity
import android.view.LayoutInflater
import android.view.MotionEvent
import android.view.View
import android.view.ViewConfiguration
import android.view.WindowManager
import android.widget.Toast
import androidx.core.app.NotificationCompat
import com.mgroenteman.overlaytranslate.capture.ScreenCapture
import com.mgroenteman.overlaytranslate.ocr.OcrEngine
import com.mgroenteman.overlaytranslate.ocr.TessdataManager
import com.mgroenteman.overlaytranslate.translate.TranslationEngine
import com.mgroenteman.overlaytranslate.ui.TranslationOverlayView
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.asCoroutineDispatcher
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.util.concurrent.Executors
import kotlin.math.abs

/**
 * Keeps the floating bubble on screen and runs capture → OCR → translate → draw.
 *
 * This has to be a foreground service: from Android 14 on, screen capture is only
 * allowed from a service declared with the `mediaProjection` type.
 */
class OverlayService : Service() {

    private lateinit var windowManager: WindowManager
    private lateinit var prefs: Prefs

    private val handler = Handler(Looper.getMainLooper())
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)

    /** Tesseract is not safe to use from several threads, so it gets its own. */
    private val ocrExecutor = Executors.newSingleThreadExecutor { r ->
        Thread(r, "ocr").apply { priority = Thread.NORM_PRIORITY }
    }
    private val ocrDispatcher = ocrExecutor.asCoroutineDispatcher()

    private var projection: MediaProjection? = null
    private var capture: ScreenCapture? = null

    private lateinit var tessdata: TessdataManager
    private lateinit var ocr: OcrEngine
    private val translation = TranslationEngine()

    private var bubbleView: View? = null
    private var bubbleParams: WindowManager.LayoutParams? = null
    private var overlayView: TranslationOverlayView? = null
    private var lastScreenshot: Bitmap? = null

    private var busy = false

    private val projectionCallback = object : MediaProjection.Callback() {
        override fun onStop() {
            // The user stopped screen sharing from the system UI.
            Log.i(TAG, "Media projection stopped by the system")
            stopEverything()
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager
        prefs = Prefs(this)
        tessdata = TessdataManager(this)
        ocr = OcrEngine(tessdata.dataParentDir)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_STOP -> {
                stopEverything()
                return START_NOT_STICKY
            }

            ACTION_START -> {
                // Must be in the foreground *before* asking for the projection.
                startForegroundNotification()
                if (!startProjection(intent)) {
                    stopEverything()
                    return START_NOT_STICKY
                }
                showBubble()
                isRunning = true
            }
        }
        // Never restart on our own: the projection consent cannot be re-used.
        return START_NOT_STICKY
    }

    private fun startProjection(intent: Intent): Boolean {
        if (projection != null) return true

        if (!Settings.canDrawOverlays(this)) {
            toast(getString(R.string.error_no_overlay_permission))
            return false
        }

        val resultCode = intent.getIntExtra(EXTRA_RESULT_CODE, 0)
        val data: Intent? = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            intent.getParcelableExtra(EXTRA_RESULT_DATA, Intent::class.java)
        } else {
            @Suppress("DEPRECATION")
            intent.getParcelableExtra(EXTRA_RESULT_DATA)
        }
        if (data == null) return false

        val manager = getSystemService(Context.MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
        val newProjection = try {
            manager.getMediaProjection(resultCode, data)
        } catch (t: Throwable) {
            Log.w(TAG, "Could not start media projection", t)
            null
        } ?: return false

        // Required from Android 14 on, and it must happen before createVirtualDisplay.
        newProjection.registerCallback(projectionCallback, handler)
        projection = newProjection

        val size = displaySize()
        capture = ScreenCapture(newProjection).apply {
            start(size.first, size.second, resources.displayMetrics.densityDpi)
        }
        return true
    }

    // region bubble

    private fun showBubble() {
        if (bubbleView != null) return

        val view = LayoutInflater.from(this).inflate(R.layout.overlay_bubble, null)
        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.START
            x = prefs.bubbleX
            y = prefs.bubbleY
        }

        attachDragBehaviour(view, params)

        windowManager.addView(view, params)
        bubbleView = view
        bubbleParams = params
    }

    /** Drag to move, tap to translate, long-press to stop. */
    private fun attachDragBehaviour(view: View, params: WindowManager.LayoutParams) {
        val touchSlop = ViewConfiguration.get(this).scaledTouchSlop
        var startX = 0
        var startY = 0
        var touchX = 0f
        var touchY = 0f
        var dragging = false
        var longPressed = false

        val longPress = Runnable {
            longPressed = true
            view.performHapticFeedback(android.view.HapticFeedbackConstants.LONG_PRESS)
            stopEverything()
        }

        view.setOnTouchListener { _, event ->
            when (event.action) {
                MotionEvent.ACTION_DOWN -> {
                    startX = params.x
                    startY = params.y
                    touchX = event.rawX
                    touchY = event.rawY
                    dragging = false
                    longPressed = false
                    handler.postDelayed(longPress, LONG_PRESS_MS)
                    true
                }

                MotionEvent.ACTION_MOVE -> {
                    val dx = event.rawX - touchX
                    val dy = event.rawY - touchY
                    if (!dragging && (abs(dx) > touchSlop || abs(dy) > touchSlop)) {
                        dragging = true
                        handler.removeCallbacks(longPress)
                    }
                    if (dragging) {
                        params.x = startX + dx.toInt()
                        params.y = startY + dy.toInt()
                        runCatching { windowManager.updateViewLayout(view, params) }
                    }
                    true
                }

                MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
                    handler.removeCallbacks(longPress)
                    if (dragging) {
                        prefs.bubbleX = params.x
                        prefs.bubbleY = params.y
                    } else if (!longPressed && event.action == MotionEvent.ACTION_UP) {
                        view.performClick()
                        translateScreen()
                    }
                    true
                }

                else -> false
            }
        }
    }

    private fun setBubbleBusy(isBusy: Boolean) {
        val view = bubbleView ?: return
        view.findViewById<View>(R.id.bubble_icon)?.visibility =
            if (isBusy) View.INVISIBLE else View.VISIBLE
        view.findViewById<View>(R.id.bubble_progress)?.visibility =
            if (isBusy) View.VISIBLE else View.GONE
    }

    // endregion

    // region the actual work

    private fun translateScreen() {
        if (busy) return
        val screenCapture = capture ?: return
        val source = prefs.sourceLanguage
        val target = prefs.targetLanguage

        if (!tessdata.isInstalled(source)) {
            toast(getString(R.string.error_missing_language_data, source.displayName))
            return
        }

        busy = true
        scope.launch {
            try {
                dismissOverlay()

                // Our own bubble is on the screen we are about to photograph.
                bubbleView?.visibility = View.GONE
                delay(HIDE_SETTLE_MS)

                val bitmap = screenCapture.capture()

                bubbleView?.visibility = View.VISIBLE
                setBubbleBusy(true)

                if (bitmap == null) {
                    toast(getString(R.string.error_capture_failed))
                    return@launch
                }

                val lines = withContext(ocrDispatcher) {
                    ocr.recognize(bitmap, source, prefs.minConfidence)
                }

                if (lines.isEmpty()) {
                    bitmap.recycle()
                    toast(getString(R.string.error_no_text_found, source.displayName))
                    return@launch
                }

                val translated = translation.translate(lines.map { it.text }, source, target)
                val blocks = lines.mapIndexed { index, line ->
                    TranslationOverlayView.Block(
                        bounds = line.bounds,
                        text = translated.getOrElse(index) { line.text }
                    )
                }

                showOverlay(bitmap, blocks)
            } catch (t: Throwable) {
                Log.w(TAG, "Translation run failed", t)
                toast(getString(R.string.error_generic))
            } finally {
                setBubbleBusy(false)
                busy = false
            }
        }
    }

    private fun showOverlay(screenshot: Bitmap, blocks: List<TranslationOverlayView.Block>) {
        dismissOverlay()

        val view = TranslationOverlayView(this).apply {
            setContent(
                screenshot = screenshot,
                showScreenshot = prefs.freezeScreen,
                blocks = blocks,
                hint = getString(R.string.overlay_dismiss_hint, blocks.size)
            )
            onDismiss = { dismissOverlay() }
        }

        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
            WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or
                WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS or
                WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.START
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                layoutInDisplayCutoutMode =
                    WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_ALWAYS
            }
        }

        windowManager.addView(view, params)
        view.requestFocus()

        overlayView = view
        lastScreenshot = screenshot

        // Re-add the bubble so it sits above the translation and stays reachable.
        val bubble = bubbleView
        val bubbleLayout = bubbleParams
        if (bubble != null && bubbleLayout != null) {
            runCatching { windowManager.removeView(bubble) }
            runCatching { windowManager.addView(bubble, bubbleLayout) }
        }
    }

    private fun dismissOverlay() {
        overlayView?.let { runCatching { windowManager.removeView(it) } }
        overlayView = null
        lastScreenshot?.let { if (!it.isRecycled) it.recycle() }
        lastScreenshot = null
    }

    // endregion

    override fun onConfigurationChanged(newConfig: Configuration) {
        super.onConfigurationChanged(newConfig)
        // A rotation changes the display size, which invalidates both the virtual
        // display and any translation currently pinned to old coordinates.
        dismissOverlay()
        val size = displaySize()
        capture?.start(size.first, size.second, resources.displayMetrics.densityDpi)
    }

    /**
     * Real display size in pixels, including the status and navigation bars.
     *
     * Deliberately goes through DisplayManager rather than WindowManager metrics:
     * a Service has no window of its own, so the window-metrics APIs are not
     * meaningful here.
     */
    private fun displaySize(): Pair<Int, Int> {
        val displayManager = getSystemService(Context.DISPLAY_SERVICE) as DisplayManager
        val display = displayManager.getDisplay(Display.DEFAULT_DISPLAY)
        val metrics = DisplayMetrics()
        @Suppress("DEPRECATION")
        display.getRealMetrics(metrics)
        return metrics.widthPixels to metrics.heightPixels
    }

    private fun startForegroundNotification() {
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if (manager.getNotificationChannel(CHANNEL_ID) == null) {
            manager.createNotificationChannel(
                NotificationChannel(
                    CHANNEL_ID,
                    getString(R.string.notification_channel_name),
                    NotificationManager.IMPORTANCE_LOW
                ).apply { description = getString(R.string.notification_channel_description) }
            )
        }

        val stopIntent = PendingIntent.getService(
            this,
            0,
            Intent(this, OverlayService::class.java).setAction(ACTION_STOP),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )
        val openIntent = PendingIntent.getActivity(
            this,
            0,
            Intent(this, MainActivity::class.java)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        val notification: Notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_translate)
            .setContentTitle(getString(R.string.notification_title))
            .setContentText(getString(R.string.notification_text))
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setContentIntent(openIntent)
            .addAction(0, getString(R.string.action_stop), stopIntent)
            .build()

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(
                NOTIFICATION_ID,
                notification,
                ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION
            )
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }
    }

    private fun stopEverything() {
        isRunning = false
        dismissOverlay()
        bubbleView?.let { runCatching { windowManager.removeView(it) } }
        bubbleView = null
        bubbleParams = null
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    override fun onDestroy() {
        isRunning = false
        handler.removeCallbacksAndMessages(null)
        dismissOverlay()
        bubbleView?.let { runCatching { windowManager.removeView(it) } }
        bubbleView = null

        capture?.stop()
        capture = null
        projection?.unregisterCallback(projectionCallback)
        projection?.stop()
        projection = null

        scope.cancel()
        ocrExecutor.execute { ocr.release() }
        ocrExecutor.shutdown()
        translation.release()

        super.onDestroy()
    }

    private fun toast(message: String) {
        Toast.makeText(this, message, Toast.LENGTH_SHORT).show()
    }

    companion object {
        private const val TAG = "OverlayService"

        const val ACTION_START = "com.mgroenteman.overlaytranslate.START"
        const val ACTION_STOP = "com.mgroenteman.overlaytranslate.STOP"
        const val EXTRA_RESULT_CODE = "result_code"
        const val EXTRA_RESULT_DATA = "result_data"

        private const val CHANNEL_ID = "overlay_translate"
        private const val NOTIFICATION_ID = 42

        /** Time for the compositor to push a frame without our bubble in it. */
        private const val HIDE_SETTLE_MS = 250L
        private const val LONG_PRESS_MS = 600L

        /** Read by the launcher screen to show whether the overlay is up. */
        @Volatile
        var isRunning: Boolean = false

        fun start(context: Context, resultCode: Int, data: Intent) {
            val intent = Intent(context, OverlayService::class.java)
                .setAction(ACTION_START)
                .putExtra(EXTRA_RESULT_CODE, resultCode)
                .putExtra(EXTRA_RESULT_DATA, data)
            context.startForegroundService(intent)
        }

        fun stop(context: Context) {
            context.startService(
                Intent(context, OverlayService::class.java).setAction(ACTION_STOP)
            )
        }
    }
}
