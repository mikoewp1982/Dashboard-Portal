package com.sekolah.edulock

import android.content.Context
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.os.Build
import android.provider.Settings

class OfflineMonitor(private val context: Context, private val prefsManager: PreferencesManager) {

    // Threshold offline 2 menit dalam milidetik (Fail-Safe Lockdown)
    private val OFFLINE_THRESHOLD_MS = 2 * 60 * 1000L
    // Warning di menit ke-1 (60 detik)
    private val WARNING_THRESHOLD_MS = 1 * 60 * 1000L

    // Pelacak status koneksi Firebase (diupdate oleh MonitoringService)
    @Volatile
    var isFirebaseConnected: Boolean = false

    // Timestamp terakhir Firebase terhubung
    @Volatile
    var lastFirebaseConnectedAt: Long = 0L

    fun checkInternetAndTrack(onWarningTriggered: (Long) -> Unit, onLockdownTriggered: () -> Unit) {
        // Gunakan isRealInternetAvailable() yang memeriksa validasi jaringan + Firebase
        if (isRealInternetAvailable()) {
            // Jika online, reset timestamp dan akumulasi
            prefsManager.lastOnlineTimestamp = System.currentTimeMillis()
            prefsManager.offlineDurationAccumulated = 0
        } else {
            // Jika offline, hitung durasi
            val lastOnline = prefsManager.lastOnlineTimestamp
            val currentTime = System.currentTimeMillis()
            val currentOfflineDuration = currentTime - lastOnline
            
            // Cek apakah sudah melebihi batas waktu
            if (currentOfflineDuration > OFFLINE_THRESHOLD_MS) {
                onLockdownTriggered()
            } else if (currentOfflineDuration > WARNING_THRESHOLD_MS) {
                // Hitung sisa waktu dalam detik
                val remainingMs = OFFLINE_THRESHOLD_MS - currentOfflineDuration
                onWarningTriggered(remainingMs)
            }
        }
    }

    fun getOfflineDuration(): Long {
        if (isRealInternetAvailable()) return 0
        return System.currentTimeMillis() - prefsManager.lastOnlineTimestamp
    }

    /**
     * Memeriksa apakah perangkat sedang dalam Mode Pesawat (Airplane Mode).
     */
    fun isAirplaneModeActive(): Boolean {
        return try {
            Settings.Global.getInt(context.contentResolver, Settings.Global.AIRPLANE_MODE_ON, 0) != 0
        } catch (_: Exception) {
            false
        }
    }

    /**
     * Cek dasar: apakah ada koneksi jaringan aktif (transport layer).
     * Ini BUKAN jaminan internet benar-benar tersedia (kuota medsos saja bisa lolos).
     */
    fun isInternetAvailable(): Boolean {
        // Jika Mode Pesawat aktif, anggap internet tidak tersedia
        if (isAirplaneModeActive()) {
            return false
        }

        val connectivityManager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val network = connectivityManager.activeNetwork ?: return false
            val activeNetwork = connectivityManager.getNetworkCapabilities(network) ?: return false
            return when {
                activeNetwork.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) -> true
                activeNetwork.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) -> true
                activeNetwork.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET) -> true
                else -> false
            }
        } else {
            val networkInfo = connectivityManager.activeNetworkInfo ?: return false
            return networkInfo.isConnected
        }
    }

    /**
     * Cek mendalam: apakah internet BENAR-BENAR tersedia ke server publik?
     * Menggunakan NET_CAPABILITY_VALIDATED (Android menguji apakah jaringan bisa
     * menghubungi server Google) DAN status koneksi Firebase.
     *
     * Ini menutup celah kuota medsos (TikTok/IG saja) yang membuat
     * isInternetAvailable() mengembalikan true padahal EduLock tidak bisa
     * berkomunikasi dengan server sekolah.
     */
    fun isRealInternetAvailable(): Boolean {
        if (isAirplaneModeActive()) return false

        val connectivityManager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val network = connectivityManager.activeNetwork ?: return false
            val caps = connectivityManager.getNetworkCapabilities(network) ?: return false

            // Syarat 1: Harus ada transport (WiFi / Seluler / Ethernet)
            val hasTransport = caps.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) ||
                caps.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) ||
                caps.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET)
            if (!hasTransport) return false

            // Syarat 2: NET_CAPABILITY_VALIDATED — Android sudah membuktikan
            // bahwa jaringan ini bisa mencapai internet publik (bukan hanya kuota medsos).
            // Tersedia di Android M+ (API 23+).
            val isValidated = caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED)

            // Syarat 3: Konfirmasi dari Firebase .info/connected
            // Jika Firebase pernah terhubung dalam 3 menit terakhir, anggap valid.
            val now = System.currentTimeMillis()
            val firebaseRecentlyConnected = isFirebaseConnected ||
                (lastFirebaseConnectedAt > 0 && now - lastFirebaseConnectedAt < 3 * 60 * 1000L)

            // Jika jaringan tervalidasi ATAU Firebase baru-baru ini terhubung → internet nyata.
            // Jika keduanya gagal → kuota palsu / walled-garden.
            return isValidated || firebaseRecentlyConnected
        } else {
            val networkInfo = connectivityManager.activeNetworkInfo ?: return false
            return networkInfo.isConnected
        }
    }
}