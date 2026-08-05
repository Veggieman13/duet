plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
}

android {
    namespace = "com.mgroenteman.overlaytranslate"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.mgroenteman.overlaytranslate"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0"

        // Tesseract ships native code for these ABIs; every modern phone is arm64.
        ndk {
            abiFilters += listOf("arm64-v8a", "armeabi-v7a")
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    buildFeatures {
        viewBinding = true
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.appcompat)
    implementation(libs.androidx.constraintlayout)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.material)
    implementation(libs.kotlinx.coroutines.android)
    implementation(libs.kotlinx.coroutines.play.services)

    // On-device translation (includes Hebrew). Downloads its model once, then works offline.
    implementation(libs.mlkit.translate)

    // On-device OCR. Used instead of ML Kit because ML Kit's text recognizer
    // cannot read Hebrew script.
    implementation(libs.tesseract4android)
}
