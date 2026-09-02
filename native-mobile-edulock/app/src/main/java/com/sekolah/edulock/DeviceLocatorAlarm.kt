package com.sekolah.edulock

import android.content.Context
import android.media.AudioAttributes
import android.media.AudioManager
import android.media.MediaPlayer
import android.media.RingtoneManager
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.PowerManager
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager

object DeviceLocatorAlarm {
    private val handler = Handler(Looper.getMainLooper())
    private var mediaPlayer: MediaPlayer? = null
    private var stopRunnable: Runnable? = null
    private var appContext: Context? = null
    private var originalAlarmVolume: Int? = null
    private var originalMusicVolume: Int? = null
    private var usedStream: Int = AudioManager.STREAM_ALARM
    private var wakeLock: PowerManager.WakeLock? = null
    private var onFinished: (() -> Unit)? = null
    private var onStartedWithFallback: ((Boolean, Boolean) -> Unit)? = null
    private var vibrator: Vibrator? = null
    private var vibrationStopRunnable: Runnable? = null

    fun start(
        context: Context,
        durationMs: Long,
        onFinished: (() -> Unit)? = null,
        onStartedWithFallback: ((usedMusicStreamFallback: Boolean, usedVibrationFallback: Boolean) -> Unit)? = null
    ) {
        stopInternal(notifyFinished = false)

        val appContext = context.applicationContext
        this.appContext = appContext
        this.onFinished = onFinished
        this.onStartedWithFallback = onStartedWithFallback

        val coercedDuration = durationMs.coerceIn(15_000L, 120_000L)

        val audioManager = appContext.getSystemService(Context.AUDIO_SERVICE) as? AudioManager
        originalAlarmVolume = runCatching {
            audioManager?.getStreamVolume(AudioManager.STREAM_ALARM)
        }.getOrNull()
        originalMusicVolume = runCatching {
            audioManager?.getStreamVolume(AudioManager.STREAM_MUSIC)
        }.getOrNull()

        val uri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
            ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
            ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE)
            ?: throw IllegalStateException("Suara alarm sistem tidak tersedia")

        runCatching {
            val am = appContext.getSystemService(Context.AUDIO_SERVICE) as? AudioManager
            if (am != null) {
                val maxAlarm = am.getStreamMaxVolume(AudioManager.STREAM_ALARM)
                if (maxAlarm > 0) {
                    am.setStreamVolume(AudioManager.STREAM_ALARM, maxAlarm, AudioManager.FLAG_SHOW_UI)
                    am.adjustStreamVolume(AudioManager.STREAM_ALARM, AudioManager.ADJUST_RAISE, AudioManager.FLAG_SHOW_UI)
                    am.adjustStreamVolume(AudioManager.STREAM_ALARM, AudioManager.ADJUST_RAISE, AudioManager.FLAG_SHOW_UI)
                }
            }
        }

        var usedFallbackToMusic = false
        var usedFallbackToVibration = false

        val primaryPlayer = runCatching {
            MediaPlayer().apply {
                setAudioAttributes(
                    AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_ALARM)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .build()
                )
                setDataSource(appContext, uri)
                isLooping = true
                prepare()
                start()
            }
        }.getOrNull()

        if (primaryPlayer != null) {
            val playedVolume = runCatching {
                audioManager?.getStreamVolume(AudioManager.STREAM_ALARM) ?: 0
            }.getOrDefault(0)
            val maxAlarm = runCatching {
                audioManager?.getStreamMaxVolume(AudioManager.STREAM_ALARM) ?: 0
            }.getOrDefault(0)
            if (playedVolume <= 0 || (maxAlarm > 0 && playedVolume <= maxAlarm / 2)) {
                runCatching { primaryPlayer.stop() }
                runCatching { primaryPlayer.release() }
            } else {
                mediaPlayer = primaryPlayer
                usedStream = AudioManager.STREAM_ALARM
            }
        }

        if (mediaPlayer == null) {
            val fallbackPlayer = runCatching {
                runCatching {
                    val am = appContext.getSystemService(Context.AUDIO_SERVICE) as? AudioManager
                    if (am != null) {
                        val maxMusic = am.getStreamMaxVolume(AudioManager.STREAM_MUSIC)
                        if (maxMusic > 0) {
                            am.setStreamVolume(AudioManager.STREAM_MUSIC, maxMusic, AudioManager.FLAG_SHOW_UI)
                            am.adjustStreamVolume(AudioManager.STREAM_MUSIC, AudioManager.ADJUST_RAISE, AudioManager.FLAG_SHOW_UI)
                            am.adjustStreamVolume(AudioManager.STREAM_MUSIC, AudioManager.ADJUST_RAISE, AudioManager.FLAG_SHOW_UI)
                        }
                    }
                }
                MediaPlayer().apply {
                    setAudioAttributes(
                        AudioAttributes.Builder()
                            .setUsage(AudioAttributes.USAGE_MEDIA)
                            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                            .build()
                    )
                    setDataSource(appContext, uri)
                    isLooping = true
                    prepare()
                    start()
                }
            }.getOrNull()

            if (fallbackPlayer != null) {
                val playedMusicVolume = runCatching {
                    audioManager?.getStreamVolume(AudioManager.STREAM_MUSIC) ?: 0
                }.getOrDefault(0)
                val maxMusic = runCatching {
                    audioManager?.getStreamMaxVolume(AudioManager.STREAM_MUSIC) ?: 0
                }.getOrDefault(0)
                if (playedMusicVolume <= 0 || (maxMusic > 0 && playedMusicVolume <= maxMusic / 2)) {
                    runCatching { fallbackPlayer.stop() }
                    runCatching { fallbackPlayer.release() }
                } else {
                    mediaPlayer = fallbackPlayer
                    usedStream = AudioManager.STREAM_MUSIC
                    usedFallbackToMusic = true
                }
            }
        }

        if (mediaPlayer == null) {
            val vb = resolveVibrator(appContext)
            if (vb != null) {
                startVibration(vb, coercedDuration)
                usedFallbackToVibration = true
                vibrator = vb
            }
        } else {
            val vb = resolveVibrator(appContext)
            if (vb != null) {
                startVibration(vb, coercedDuration)
                vibrator = vb
            }
        }

        val powerManager = appContext.getSystemService(Context.POWER_SERVICE) as? PowerManager
        wakeLock = powerManager
            ?.newWakeLock(
                PowerManager.PARTIAL_WAKE_LOCK,
                "EduLock:FindDeviceAlarm"
            )
            ?.apply { acquire(coercedDuration + 5_000L) }

        stopRunnable = Runnable { stopInternal(notifyFinished = true) }.also {
            handler.postDelayed(it, coercedDuration)
        }

        onStartedWithFallback?.invoke(usedFallbackToMusic, usedFallbackToVibration)
    }

    fun stop() {
        stopInternal(notifyFinished = false)
    }

    fun isRunning(): Boolean {
        return mediaPlayer?.isPlaying == true || vibrator != null
    }

    private fun resolveVibrator(context: Context): Vibrator? {
        return runCatching {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val vm = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
                vm?.defaultVibrator
            } else {
                @Suppress("DEPRECATION")
                context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
            }?.takeIf { it.hasVibrator() }
        }.getOrNull()
    }

    private fun startVibration(vb: Vibrator, durationMs: Long) {
        runCatching {
            val pattern = longArrayOf(0, 600, 250, 600, 250, 600, 350, 500, 350, 500)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val effect = VibrationEffect.createWaveform(pattern, 0)
                vb.vibrate(effect)
            } else {
                @Suppress("DEPRECATION")
                vb.vibrate(pattern, 0)
            }
            vibrationStopRunnable = Runnable {
                runCatching { vb.cancel() }
            }.also {
                handler.postDelayed(it, durationMs)
            }
        }
    }

    private fun stopVibration() {
        vibrationStopRunnable?.let { handler.removeCallbacks(it) }
        vibrationStopRunnable = null
        runCatching { vibrator?.cancel() }
        vibrator = null
    }

    private fun stopInternal(notifyFinished: Boolean) {
        stopRunnable?.let { handler.removeCallbacks(it) }
        stopRunnable = null

        mediaPlayer?.let { player ->
            runCatching {
                if (player.isPlaying) {
                    player.stop()
                }
            }
            runCatching { player.release() }
        }
        mediaPlayer = null

        stopVibration()

        val context = appContext
        val volumeAlarmToRestore = originalAlarmVolume
        val volumeMusicToRestore = originalMusicVolume
        if (context != null) {
            val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as? AudioManager
            if (audioManager != null) {
                if (volumeAlarmToRestore != null) {
                    runCatching {
                        audioManager.setStreamVolume(AudioManager.STREAM_ALARM, volumeAlarmToRestore, 0)
                    }
                }
                if (volumeMusicToRestore != null) {
                    runCatching {
                        audioManager.setStreamVolume(AudioManager.STREAM_MUSIC, volumeMusicToRestore, 0)
                    }
                }
            }
        }
        originalAlarmVolume = null
        originalMusicVolume = null
        appContext = null

        val callback = onFinished
        onFinished = null
        onStartedWithFallback = null

        wakeLock?.let { lock ->
            if (lock.isHeld) {
                runCatching { lock.release() }
            }
        }
        wakeLock = null

        if (notifyFinished) {
            callback?.invoke()
        }
    }
}
