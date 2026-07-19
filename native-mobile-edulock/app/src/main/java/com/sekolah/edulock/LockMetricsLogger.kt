package com.sekolah.edulock

import android.util.Log
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap

class LockMetricsLogger {
    private val traces = ConcurrentHashMap<String, Long>()

    fun startTrace(origin: String, blockedPackage: String? = null): String {
        val traceId = UUID.randomUUID().toString()
        val now = System.currentTimeMillis()
        traces[traceId] = now
        Log.d(TAG, "trace=$traceId event_received=$now origin=$origin package=${blockedPackage.orEmpty()}")
        return traceId
    }

    fun markDecisionEmitted(traceId: String, decision: LockDecision) {
        Log.d(
            TAG,
            "trace=$traceId decision_emitted=${System.currentTimeMillis()} state=${decision.state} reason=${decision.reason} package=${decision.blockedPackage.orEmpty()}"
        )
    }

    fun markOverlayShown(traceId: String, message: String) {
        Log.d(TAG, "trace=$traceId overlay_shown=${System.currentTimeMillis()} message=$message")
    }

    fun markAppRelaunched(traceId: String, packageName: String) {
        Log.d(TAG, "trace=$traceId app_relaunched=${System.currentTimeMillis()} package=$packageName")
    }

    fun markLockTaskConfirmed(traceId: String, success: Boolean) {
        Log.d(TAG, "trace=$traceId locktask_confirmed=${System.currentTimeMillis()} success=$success")
    }

    fun finishTrace(traceId: String) {
        val startedAt = traces.remove(traceId) ?: return
        val duration = System.currentTimeMillis() - startedAt
        Log.d(TAG, "trace=$traceId trace_finished duration_ms=$duration")
    }

    companion object {
        private const val TAG = "LockMetrics"
    }
}
