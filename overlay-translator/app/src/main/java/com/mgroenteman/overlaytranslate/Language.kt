package com.mgroenteman.overlaytranslate

/**
 * A language the app can work with.
 *
 * Two different codes are needed because two different engines are involved:
 *  - [tessCode] is the Tesseract traineddata name, used when *reading* the screen.
 *  - [mlKitCode] is the BCP-47 tag ML Kit uses when *translating*.
 */
enum class Language(
    val displayName: String,
    val tessCode: String,
    val mlKitCode: String,
    val isRtl: Boolean,
    /** Unicode ranges that text in this language should contain at least one of. */
    private val scriptRanges: List<CharRange>
) {
    // Hebrew block, plus the Hebrew presentation forms some fonts render with.
    HEBREW("Hebrew", "heb", "he", true, listOf('֐'..'׿', 'יִ'..'ﭏ')),
    ARABIC("Arabic", "ara", "ar", true, listOf('؀'..'ۿ', 'ݐ'..'ݿ')),
    RUSSIAN("Russian", "rus", "ru", false, listOf('Ѐ'..'ӿ')),
    GREEK("Greek", "ell", "el", false, listOf('Ͱ'..'Ͽ')),
    ENGLISH("English", "eng", "en", false, listOf('A'..'Z', 'a'..'z')),
    FRENCH("French", "fra", "fr", false, listOf('A'..'Z', 'a'..'z')),
    GERMAN("German", "deu", "de", false, listOf('A'..'Z', 'a'..'z')),
    SPANISH("Spanish", "spa", "es", false, listOf('A'..'Z', 'a'..'z')),
    ITALIAN("Italian", "ita", "it", false, listOf('A'..'Z', 'a'..'z')),
    DUTCH("Dutch", "nld", "nl", false, listOf('A'..'Z', 'a'..'z'));

    /**
     * True when [text] actually contains characters from this language's script.
     *
     * OCR on a screenshot always produces some junk — icon edges read as "|.,"
     * and English UI labels get picked up too. Requiring a real character of the
     * source script throws most of that away before we spend time translating it.
     */
    fun looksLikeThisScript(text: String): Boolean =
        text.any { ch -> scriptRanges.any { ch in it } }

    companion object {
        fun fromName(name: String?): Language? = entries.firstOrNull { it.name == name }
    }
}
