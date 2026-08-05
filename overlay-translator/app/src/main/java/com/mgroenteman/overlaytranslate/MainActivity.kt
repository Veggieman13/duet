package com.mgroenteman.overlaytranslate

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.media.projection.MediaProjectionManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.view.View
import android.widget.AdapterView
import android.widget.ArrayAdapter
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import com.google.android.material.snackbar.Snackbar
import com.mgroenteman.overlaytranslate.databinding.ActivityMainBinding
import com.mgroenteman.overlaytranslate.ocr.TessdataManager
import com.mgroenteman.overlaytranslate.translate.TranslationEngine
import kotlinx.coroutines.launch

/**
 * Setup screen: grant the two permissions, download the offline models, start the bubble.
 */
class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private lateinit var prefs: Prefs
    private lateinit var tessdata: TessdataManager
    private val translation = TranslationEngine()

    private var downloading = false

    private val languages = Language.entries

    private val projectionLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        val data = result.data
        if (result.resultCode == RESULT_OK && data != null) {
            OverlayService.start(this, result.resultCode, data)
            // Get out of the way so the bubble is usable straight away.
            moveTaskToBack(true)
        } else {
            snack(getString(R.string.error_capture_denied))
        }
        refresh()
    }

    private val notificationLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { refresh() }

    private val settingsLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { refresh() }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        prefs = Prefs(this)
        tessdata = TessdataManager(this)

        setUpLanguagePickers()

        binding.freezeSwitch.isChecked = prefs.freezeScreen
        binding.freezeSwitch.setOnCheckedChangeListener { _, checked ->
            prefs.freezeScreen = checked
        }

        binding.overlayPermissionButton.setOnClickListener {
            settingsLauncher.launch(
                Intent(
                    Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:$packageName")
                )
            )
        }

        binding.notificationPermissionButton.setOnClickListener {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                notificationLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
            }
        }

        binding.downloadButton.setOnClickListener { downloadModels() }
        binding.startButton.setOnClickListener { startOverlay() }
        binding.stopButton.setOnClickListener {
            OverlayService.stop(this)
            binding.root.postDelayed({ refresh() }, 300)
        }
    }

    override fun onResume() {
        super.onResume()
        refresh()
    }

    override fun onDestroy() {
        translation.release()
        super.onDestroy()
    }

    private fun setUpLanguagePickers() {
        val names = languages.map { it.displayName }
        val adapter = ArrayAdapter(this, android.R.layout.simple_spinner_item, names).apply {
            setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
        }

        binding.sourceSpinner.adapter = adapter
        binding.targetSpinner.adapter = adapter
        binding.sourceSpinner.setSelection(languages.indexOf(prefs.sourceLanguage))
        binding.targetSpinner.setSelection(languages.indexOf(prefs.targetLanguage))

        binding.sourceSpinner.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
            override fun onItemSelected(p: AdapterView<*>?, v: View?, position: Int, id: Long) {
                if (languages[position] != prefs.sourceLanguage) {
                    prefs.sourceLanguage = languages[position]
                    refresh()
                }
            }

            override fun onNothingSelected(parent: AdapterView<*>?) = Unit
        }

        binding.targetSpinner.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
            override fun onItemSelected(p: AdapterView<*>?, v: View?, position: Int, id: Long) {
                if (languages[position] != prefs.targetLanguage) {
                    prefs.targetLanguage = languages[position]
                    refresh()
                }
            }

            override fun onNothingSelected(parent: AdapterView<*>?) = Unit
        }
    }

    private fun downloadModels() {
        if (downloading) return
        val source = prefs.sourceLanguage
        val target = prefs.targetLanguage

        if (source == target) {
            snack(getString(R.string.error_same_language))
            return
        }

        downloading = true
        binding.downloadButton.isEnabled = false
        binding.downloadProgress.visibility = View.VISIBLE

        lifecycleScope.launch {
            binding.downloadStatus.text = getString(R.string.download_ocr, source.displayName)

            // The progress callback arrives on the download thread, so bounce it
            // back to the main thread before touching the label.
            val ocrError = tessdata.install(source) { percent ->
                runOnUiThread {
                    binding.downloadStatus.text =
                        getString(R.string.download_ocr_progress, source.displayName, percent)
                }
            }

            if (ocrError != null) {
                finishDownload(ocrError)
                return@launch
            }

            binding.downloadStatus.text = getString(R.string.download_translation)
            val translationError = translation.ensureModels(source, target)

            finishDownload(translationError ?: getString(R.string.download_done))
        }
    }

    private fun finishDownload(message: String) {
        downloading = false
        binding.downloadProgress.visibility = View.GONE
        binding.downloadButton.isEnabled = true
        binding.downloadStatus.text = message
        refresh()
    }

    private fun startOverlay() {
        if (!Settings.canDrawOverlays(this)) {
            snack(getString(R.string.error_no_overlay_permission))
            return
        }
        if (!tessdata.isInstalled(prefs.sourceLanguage)) {
            snack(getString(R.string.error_missing_language_data, prefs.sourceLanguage.displayName))
            return
        }

        val manager = getSystemService(Context.MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
        projectionLauncher.launch(manager.createScreenCaptureIntent())
    }

    /** Re-reads every bit of state and redraws the checklist. */
    private fun refresh() {
        val canOverlay = Settings.canDrawOverlays(this)
        binding.overlayPermissionStatus.text = statusLine(
            canOverlay,
            R.string.status_overlay_granted,
            R.string.status_overlay_missing
        )
        binding.overlayPermissionButton.isEnabled = !canOverlay

        val needsNotificationPermission =
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
                ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) !=
                PackageManager.PERMISSION_GRANTED

        binding.notificationPermissionStatus.text = statusLine(
            !needsNotificationPermission,
            R.string.status_notifications_granted,
            R.string.status_notifications_missing
        )
        binding.notificationPermissionButton.isEnabled = needsNotificationPermission

        val hasOcrData = tessdata.isInstalled(prefs.sourceLanguage)
        if (!downloading) {
            binding.downloadStatus.text = if (hasOcrData) {
                getString(R.string.status_ocr_ready, prefs.sourceLanguage.displayName)
            } else {
                getString(R.string.status_ocr_missing, prefs.sourceLanguage.displayName)
            }
        }

        val running = OverlayService.isRunning
        binding.startButton.isEnabled = canOverlay && hasOcrData && !running
        binding.stopButton.isEnabled = running
        binding.runningStatus.text = getString(
            if (running) R.string.status_running else R.string.status_not_running
        )
    }

    private fun statusLine(ok: Boolean, granted: Int, missing: Int): String =
        if (ok) "✓ ${getString(granted)}" else "• ${getString(missing)}"

    private fun snack(message: String) {
        Snackbar.make(binding.root, message, Snackbar.LENGTH_LONG).show()
    }
}
