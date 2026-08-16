package com.satupintu.mobile

import androidx.multidex.MultiDexApplication

/**
 * Ensures secondary dexes are installed before any Activity runs.
 * Required for minSdk 23 devices when the app exceeds a single dex.
 */
class GasApp : MultiDexApplication()
