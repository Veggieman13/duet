package com.mgroenteman.overlaytranslate.capture

import android.graphics.Bitmap
import android.graphics.PixelFormat
import android.hardware.display.DisplayManager
import android.hardware.display.VirtualDisplay
import android.media.Image
import android.media.ImageReader
import android.media.projection.MediaProjection
import android.os.Handler
import android.os.HandlerThread
import android.util.Log
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume

/**
 * Wraps a [MediaProjection] and hands out single frames on demand.
 *
 * The projection session is created once (the user consents once) and stays alive
 * for as long as the overlay service runs; each translation just grabs the newest
 * frame off the [ImageReader]. Android 14+ will not let us re-use a consent token
 * across sessions, so tearing this down means asking the user again.
 */
class ScreenCapture(private val projection: MediaProjection) {

    private val thread = HandlerThread("screen-capture").apply { start() }
    private val handler = Handler(thread.looper)

    private var reader: ImageReader? = null
    private var virtualDisplay: VirtualDisplay? = null

    private var width = 0
    private var height = 0

    /** Set while a caller is waiting for the next frame to land. */
    @Volatile
    private var waiter: ((Image?) -> Unit)? = null

    private val onImageAvailable = ImageReader.OnImageAvailableListener { r ->
        val pending = waiter
        if (pending == null) {
            // Nobody is waiting — drop the frame so the reader never starves.
            runCatching { r.acquireLatestImage()?.close() }
            return@OnImageAvailableListener
        }
        waiter = null
        pending(runCatching { r.acquireLatestImage() }.getOrNull())
    }

    /** Creates (or resizes) the virtual display. Safe to call again after a rotation. */
    fun start(width: Int, height: Int, densityDpi: Int) {
        if (width == this.width && height == this.height && virtualDisplay != null) return
        release()

        this.width = width
        this.height = height

        val newReader = ImageReader.newInstance(width, height, PixelFormat.RGBA_8888, MAX_IMAGES)
        newReader.setOnImageAvailableListener(onImageAvailable, handler)
        reader = newReader

        virtualDisplay = projection.createVirtualDisplay(
            "overlay-translate",
            width,
            height,
            densityDpi,
            DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR,
            newReader.surface,
            null,
            handler
        )
    }

    /**
     * Returns the current screen contents, or null if no frame arrived in time.
     *
     * Callers must hide their own overlay windows first — the virtual display
     * mirrors everything, including our bubble.
     */
    suspend fun capture(timeoutMs: Long = 1_500L): Bitmap? {
        val currentReader = reader ?: return null

        // The act of hiding the overlay changed the screen, so a fresh frame is
        // usually already queued. Take it if so, otherwise wait for the next one.
        val image = currentReader.acquireLatestImage() ?: awaitImage(timeoutMs)
        return try {
            image?.let { toBitmap(it) }
        } catch (t: Throwable) {
            Log.w(TAG, "Failed to convert frame", t)
            null
        } finally {
            image?.close()
            drain()
        }
    }

    private suspend fun awaitImage(timeoutMs: Long): Image? =
        suspendCancellableCoroutine { continuation ->
            // Declared first so the waiter below can cancel it once a frame lands;
            // a stale timeout must never resume a later capture with null.
            val timeout = Runnable {
                if (waiter != null) {
                    waiter = null
                    if (continuation.isActive) continuation.resume(null)
                }
            }

            waiter = { image ->
                handler.removeCallbacks(timeout)
                if (continuation.isActive) continuation.resume(image)
            }
            handler.postDelayed(timeout, timeoutMs)

            continuation.invokeOnCancellation {
                waiter = null
                handler.removeCallbacks(timeout)
            }
        }

    private fun drain() {
        val currentReader = reader ?: return
        while (true) {
            val image = runCatching { currentReader.acquireLatestImage() }.getOrNull() ?: break
            image.close()
        }
    }

    /**
     * Copies an [Image] into a [Bitmap].
     *
     * The buffer rows are padded to a hardware-friendly stride, so the raw copy is
     * a few pixels wider than the screen and gets cropped back down.
     */
    private fun toBitmap(image: Image): Bitmap {
        val plane = image.planes[0]
        val pixelStride = plane.pixelStride
        val rowStride = plane.rowStride
        val rowPadding = rowStride - pixelStride * image.width
        val paddedWidth = image.width + rowPadding / pixelStride

        val padded = Bitmap.createBitmap(paddedWidth, image.height, Bitmap.Config.ARGB_8888)
        padded.copyPixelsFromBuffer(plane.buffer)

        if (paddedWidth == image.width) return padded

        val cropped = Bitmap.createBitmap(padded, 0, 0, image.width, image.height)
        padded.recycle()
        return cropped
    }

    private fun release() {
        virtualDisplay?.release()
        virtualDisplay = null
        reader?.setOnImageAvailableListener(null, null)
        reader?.close()
        reader = null
    }

    fun stop() {
        waiter = null
        release()
        thread.quitSafely()
    }

    private companion object {
        const val TAG = "ScreenCapture"

        /** Two buffers is enough to always have the latest frame without stalling. */
        const val MAX_IMAGES = 2
    }
}
