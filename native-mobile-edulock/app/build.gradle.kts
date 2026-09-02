import java.util.Properties

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("com.google.gms.google-services")
}

val keystoreProperties = Properties().apply {
    val keystoreFile = rootProject.file("keystore.properties")
    if (keystoreFile.exists()) {
        keystoreFile.inputStream().use(::load)
    }
}

android {
    namespace = "com.sekolah.edulock"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.sekolah.edulock"
        minSdk = 21
        targetSdk = 34
        versionCode = 54
        versionName = "1.3.28"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        
        // Default to V2 Hybrid functionality
        buildConfigField("boolean", "USE_MANUAL_LOCATION_POLLING", "true")
        buildConfigField("boolean", "USE_GEOFENCING", "true")
    }

    flavorDimensions += listOf("mode")
    productFlavors {
        create("student") {
            dimension = "mode"
            resValue("string", "app_name", "EduLock")
        }
        create("admin") {
            dimension = "mode"
            resValue("string", "app_name", "EduLock Admin")
        }
    }

    signingConfigs {
        create("release") {
            val storeFilePath = keystoreProperties.getProperty("storeFile")
            if (!storeFilePath.isNullOrBlank()) {
                storeFile = rootProject.file(storeFilePath)
                storePassword = keystoreProperties.getProperty("storePassword")
                keyAlias = keystoreProperties.getProperty("keyAlias")
                keyPassword = keystoreProperties.getProperty("keyPassword")
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            signingConfig = signingConfigs.getByName("release")
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        viewBinding = true
        buildConfig = true
        // PERBAIKAN: Pastikan dataBinding diset ke false untuk menghentikan error mutasi dependensi
        dataBinding = false
    }

    applicationVariants.all {
        val variant = this
        variant.outputs.all {
            val output = this as? com.android.build.gradle.internal.api.BaseVariantOutputImpl
            output?.outputFileName = "EduLock-${variant.name}.apk"
        }
    }
}

dependencies {
    // AndroidX & UI
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.appcompat:appcompat:1.6.1")
    implementation("androidx.constraintlayout:constraintlayout:2.1.4")
    implementation("com.google.android.material:material:1.11.0")
    implementation("androidx.cardview:cardview:1.0.0")

    // Location & Play Services
    implementation("com.google.android.gms:play-services-location:21.1.0")

    // Lifecycle (Ditingkatkan ke 2.7.0 agar stabil dengan Java 17)
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.7.0")
    implementation("androidx.lifecycle:lifecycle-viewmodel-ktx:2.7.0")

    // Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")

    // WorkManager
    implementation("androidx.work:work-runtime-ktx:2.9.0")

    // ZXing Barcode Scanner
    implementation("com.journeyapps:zxing-android-embedded:4.3.0")
    implementation("com.google.zxing:core:3.5.3") // Update tipis ke 3.5.3

    // Firebase (Pastikan BOM sesuai dengan Google Services Plugin 4.4.2 yang kita pasang tadi)
    implementation(platform("com.google.firebase:firebase-bom:32.7.2"))
    implementation("com.google.firebase:firebase-database-ktx")
    implementation("com.google.firebase:firebase-auth-ktx")
    implementation("com.google.firebase:firebase-messaging-ktx")

    // Testing
    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test.ext:junit:1.1.5")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.5.1")
}
