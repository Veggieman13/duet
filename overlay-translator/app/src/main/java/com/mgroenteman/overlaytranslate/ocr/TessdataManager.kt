package com.mgroenteman.overlaytranslate.ocr

import android.content.Context
import android.util.Log
import com.mgroenteman.overlaytranslate.Language
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.net.HttpURLConnection
import java.net.URI

/**
 * Downloads and stores Tesseract language data.
 *
 * Tesseract needs a `<code>.traineddata` file per language, sitting in a folder
 * called `tessdata`. The files are a few MB each, so they are fetched once from
 * the official tessdata_fast repository and then used offline forever.
 */
class TessdataManager(context: Context) {

    /** The folder passed to Tesseract — it appends "tessdata" itself. */
    val dataParentDir: File = File(context.filesDir, "tesseract")

    private val tessdataDir: File = File(dataParentDir, "tessdata")

    fun isInstalled(language: Language): Boolean =
        fileFor(language).let { it.exists() && it.length() > MIN_VALID_BYTES }

    private fun fileFor(language: Language) = File(tessdataDir, "${language.tessCode}.traineddata")

    /**
     * Ensures the data for [language] is on disk.
     *
     * [onProgress] receives 0..100 and is called on a background thread — hop to the
     * main thread yourself before touching any views with it.
     *
     * @return null on success, or a human-readable error to show the user.
     */
    suspend fun install(
        language: Language,
        onProgress: (Int) -> Unit = {}
    ): String? = withContext(Dispatchers.IO) {
        if (isInstalled(language)) return@withContext null

        if (!tessdataDir.exists() && !tessdataDir.mkdirs()) {
            return@withContext "Could not create the folder for the language data."
        }

        val target = fileFor(language)
        val temp = File(tessdataDir, "${language.tessCode}.download")
        temp.delete()

        var connection: HttpURLConnection? = null
        try {
            val url = URI(BASE_URL + "${language.tessCode}.traineddata").toURL()
            connection = (url.openConnection() as HttpURLConnection).apply {
                connectTimeout = 20_000
                readTimeout = 30_000
                instanceFollowRedirects = true
            }

            if (connection.responseCode != HttpURLConnection.HTTP_OK) {
                return@withContext "Download failed (HTTP ${connection.responseCode})."
            }

            val total = connection.contentLength.toLong()
            var written = 0L

            connection.inputStream.use { input ->
                temp.outputStream().use { output ->
                    val buffer = ByteArray(64 * 1024)
                    while (true) {
                        val read = input.read(buffer)
                        if (read <= 0) break
                        output.write(buffer, 0, read)
                        written += read
                        if (total > 0) onProgress(((written * 100) / total).toInt().coerceIn(0, 100))
                    }
                }
            }

            if (written < MIN_VALID_BYTES) {
                temp.delete()
                return@withContext "The downloaded language file looks incomplete."
            }

            // Rename only once the file is whole, so a killed download can't leave
            // a half-written file that Tesseract would choke on.
            if (!temp.renameTo(target)) {
                temp.delete()
                return@withContext "Could not save the language data."
            }

            onProgress(100)
            null
        } catch (t: Throwable) {
            Log.w(TAG, "traineddata download failed", t)
            temp.delete()
            "Could not download the ${language.displayName} data: ${t.message ?: "no connection"}"
        } finally {
            connection?.disconnect()
        }
    }

    private companion object {
        const val TAG = "TessdataManager"
        const val BASE_URL = "https://raw.githubusercontent.com/tesseract-ocr/tessdata_fast/main/"

        /** Every real traineddata file is far larger than this; smaller means truncated. */
        const val MIN_VALID_BYTES = 100_000L
    }
}
