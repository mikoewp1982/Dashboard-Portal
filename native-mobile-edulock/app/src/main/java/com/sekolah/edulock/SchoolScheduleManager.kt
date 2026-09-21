package com.sekolah.edulock

import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale
import java.util.TimeZone

class SchoolScheduleManager(private val prefs: PreferencesManager) {

    private data class DaySchedule(
        val enabled: Boolean,
        val start: String,
        val end: String
    )

    private var lastScheduleJson: String? = null
    private var scheduleCache: Map<String, DaySchedule> = emptyMap()

    private var lastHolidayJson: String? = null
    private var holidayCache: Map<String, String> = emptyMap()

    /**
     * Menentukan zona waktu sekolah berdasarkan koordinat bujur sekolah (Indonesia):
     * - Bujur < 114.0  -> WIB (Asia/Jakarta, GMT+7)
     * - Bujur 114..125 -> WITA (Asia/Makassar, GMT+8)
     * - Bujur > 125.0  -> WIT (Asia/Jayapura, GMT+9)
     * Default: Asia/Jakarta (WIB)
     */
    fun resolveSchoolTimeZone(): TimeZone {
        val lon = prefs.schoolLongitude
        return when {
            lon in 114.0..125.0 -> TimeZone.getTimeZone("Asia/Makassar")
            lon > 125.0 -> TimeZone.getTimeZone("Asia/Jayapura")
            else -> TimeZone.getTimeZone("Asia/Jakarta")
        }
    }

    /**
     * Mengambil Calendar yang terikat pada zona waktu sekolah dan waktu server Firebase (anti-tamper jam lokal).
     */
    fun getSchoolCalendar(): Calendar {
        val tz = resolveSchoolTimeZone()
        val cal = Calendar.getInstance(tz)
        val accurateTime = System.currentTimeMillis() + prefs.serverTimeOffset
        cal.timeInMillis = accurateTime
        return cal
    }

    private fun getTodayDateKey(): String {
        return try {
            val tz = resolveSchoolTimeZone()
            val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.US).apply {
                timeZone = tz
            }
            val accurateTime = System.currentTimeMillis() + prefs.serverTimeOffset
            sdf.format(accurateTime)
        } catch (_: Exception) {
            ""
        }
    }

    fun getTodayWeekdayKey(): String {
        val calendar = getSchoolCalendar()
        return when (calendar.get(Calendar.DAY_OF_WEEK)) {
            Calendar.MONDAY -> "mon"
            Calendar.TUESDAY -> "tue"
            Calendar.WEDNESDAY -> "wed"
            Calendar.THURSDAY -> "thu"
            Calendar.FRIDAY -> "fri"
            Calendar.SATURDAY -> "sat"
            Calendar.SUNDAY -> "sun"
            else -> "mon"
        }
    }

    private fun parseMinutes(hhmm: String): Int? {
        val normalized = hhmm.trim().replace('.', ':').replace(',', ':')
        val parts = normalized.split(":")
        val h = parts.getOrNull(0)?.toIntOrNull() ?: return null
        val m = parts.getOrNull(1)?.toIntOrNull() ?: return null
        if (h !in 0..23) return null
        if (m !in 0..59) return null
        return h * 60 + m
    }

    private fun getScheduleMap(): Map<String, DaySchedule> {
        val raw = prefs.weekdayScheduleJson
        if (raw == lastScheduleJson && scheduleCache.isNotEmpty()) return scheduleCache
        lastScheduleJson = raw

        val legacyStart = String.format(Locale.getDefault(), "%02d:%02d", prefs.schoolStartHour, prefs.schoolStartMinute)
            .takeIf { it != "00:00" } ?: "06:35"
        val legacyEnd = String.format(Locale.getDefault(), "%02d:%02d", prefs.schoolEndHour, prefs.schoolEndMinute)
            .takeIf { it != "00:00" } ?: "13:00"

        val fallbackMap = mapOf(
            "mon" to DaySchedule(true, legacyStart, legacyEnd),
            "tue" to DaySchedule(true, legacyStart, legacyEnd),
            "wed" to DaySchedule(true, legacyStart, legacyEnd),
            "thu" to DaySchedule(true, legacyStart, legacyEnd),
            "fri" to DaySchedule(true, legacyStart, "10:50"),
            "sat" to DaySchedule(false, "00:00", "14:00"),
            "sun" to DaySchedule(false, "00:00", "14:00")
        )

        if (raw.isBlank()) {
            scheduleCache = fallbackMap
            return scheduleCache
        }

        return try {
            val root = JSONObject(raw)
            val keys = listOf("mon", "tue", "wed", "thu", "fri", "sat", "sun")
            val map = mutableMapOf<String, DaySchedule>()
            for (k in keys) {
                val obj = root.optJSONObject(k) ?: continue
                map[k] = DaySchedule(
                    enabled = obj.optBoolean("enabled", k != "sun" && k != "sat"),
                    start = obj.optString("start", legacyStart),
                    end = obj.optString("end", if (k == "fri") "10:50" else if (k == "sat") "11:40" else legacyEnd)
                )
            }
            if (map.isEmpty()) {
                scheduleCache = fallbackMap
            } else {
                // Lengkapi hari yang belum tercatat dengan fallback standar
                for ((day, fallbackSchedule) in fallbackMap) {
                    if (!map.containsKey(day)) {
                        map[day] = fallbackSchedule
                    }
                }
                scheduleCache = map.toMap()
            }
            scheduleCache
        } catch (_: Exception) {
            scheduleCache = fallbackMap
            scheduleCache
        }
    }

    private fun getHolidayMap(): Map<String, String> {
        val raw = prefs.holidayListJson
        if (raw == lastHolidayJson && holidayCache.isNotEmpty()) return holidayCache
        lastHolidayJson = raw

        if (raw.isBlank()) {
            holidayCache = emptyMap()
            return holidayCache
        }

        return try {
            val root = JSONObject(raw)
            val it = root.keys()
            val map = mutableMapOf<String, String>()
            while (it.hasNext()) {
                val date = it.next()
                val note = root.optString(date, "")
                if (date.isNotBlank()) {
                    map[date] = note
                }
            }
            holidayCache = map.toMap()
            holidayCache
        } catch (_: Exception) {
            holidayCache = emptyMap()
            holidayCache
        }
    }

    fun isHolidayToday(): Boolean {
        val date = getTodayDateKey()
        if (date.isBlank()) return false
        return getHolidayMap().containsKey(date)
    }

    fun getHolidayNoteToday(): String {
        val date = getTodayDateKey()
        if (date.isBlank()) return ""
        return getHolidayMap()[date] ?: ""
    }

    fun isEffectiveSchoolDayToday(): Boolean {
        if (isHolidayToday()) return false
        val dayKey = getTodayWeekdayKey()
        val schedule = getScheduleMap()[dayKey]
        val defaultEnabled = dayKey != "sun" && dayKey != "sat"
        return schedule?.enabled ?: defaultEnabled
    }

    fun isSchoolTime(): Boolean {
        if (isHolidayToday()) return false

        val dayKey = getTodayWeekdayKey()
        val schedule = getScheduleMap()[dayKey] ?: return false
        if (!schedule.enabled) return false

        val calendar = getSchoolCalendar()
        val hour = calendar.get(Calendar.HOUR_OF_DAY)
        val minute = calendar.get(Calendar.MINUTE)

        val currentMinutes = hour * 60 + minute

        val startMinutes = parseMinutes(schedule.start) ?: (prefs.schoolStartHour * 60 + prefs.schoolStartMinute)
        val endMinutes = parseMinutes(schedule.end) ?: (prefs.schoolEndHour * 60 + prefs.schoolEndMinute)
        if (startMinutes == endMinutes) return true
        return if (startMinutes < endMinutes) currentMinutes in startMinutes..endMinutes else currentMinutes >= startMinutes || currentMinutes <= endMinutes
    }

    fun isAfterSchoolHours(): Boolean {
        if (isHolidayToday()) return false

        val calendar = getSchoolCalendar()
        val hour = calendar.get(Calendar.HOUR_OF_DAY)
        val minute = calendar.get(Calendar.MINUTE)

        val currentMinutes = hour * 60 + minute
        val dayKey = getTodayWeekdayKey()
        val schedule = getScheduleMap()[dayKey]
        if (schedule != null && !schedule.enabled) return false

        val endMinutes = schedule?.end?.let { parseMinutes(it) } ?: (prefs.schoolEndHour * 60 + prefs.schoolEndMinute)
        val startMinutes = schedule?.start?.let { parseMinutes(it) } ?: (prefs.schoolStartHour * 60 + prefs.schoolStartMinute)
        if (startMinutes == endMinutes) return false
        return if (startMinutes < endMinutes) {
            currentMinutes > endMinutes
        } else {
            currentMinutes > endMinutes && currentMinutes < startMinutes
        }
    }

    fun getSchoolEndTimeString(): String {
        val dayKey = getTodayWeekdayKey()
        val schedule = getScheduleMap()[dayKey]
        val time = schedule?.end
        if (!time.isNullOrBlank()) return time
        return String.format(Locale.getDefault(), "%02d:%02d", prefs.schoolEndHour, prefs.schoolEndMinute)
    }

    fun getSchoolStartTimeString(): String {
        val dayKey = getTodayWeekdayKey()
        val schedule = getScheduleMap()[dayKey]
        val time = schedule?.start
        if (!time.isNullOrBlank()) return time
        return String.format(Locale.getDefault(), "%02d:%02d", prefs.schoolStartHour, prefs.schoolStartMinute)
    }
}
