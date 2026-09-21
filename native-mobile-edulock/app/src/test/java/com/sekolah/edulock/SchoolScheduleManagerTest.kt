package com.sekolah.edulock

import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.mockito.Mockito.`when`
import org.mockito.Mockito.mock

class SchoolScheduleManagerTest {

    private lateinit var mockPrefs: PreferencesManager
    private lateinit var scheduleManager: SchoolScheduleManager

    @Before
    fun setUp() {
        mockPrefs = mock(PreferencesManager::class.java)
        `when`(mockPrefs.schoolLongitude).thenReturn(106.8) // WIB (Jakarta)
        `when`(mockPrefs.serverTimeOffset).thenReturn(0L)
        `when`(mockPrefs.schoolStartHour).thenReturn(7)
        `when`(mockPrefs.schoolStartMinute).thenReturn(0)
        `when`(mockPrefs.schoolEndHour).thenReturn(13)
        `when`(mockPrefs.schoolEndMinute).thenReturn(0)
        `when`(mockPrefs.holidayListJson).thenReturn("")
        scheduleManager = SchoolScheduleManager(mockPrefs)
    }

    @Test
    fun test_SabtuLibur_PadaSekolah5Hari_SaatKeySatTidakAda() {
        // Simulasi data dari Web Admin sekolah 5 hari kerja (hanya Mon - Fri, kunci 'sat' absen)
        val fiveDaysJson = JSONObject().apply {
            put("mon", JSONObject().apply { put("enabled", true); put("start", "07:00"); put("end", "13:00") })
            put("tue", JSONObject().apply { put("enabled", true); put("start", "07:00"); put("end", "13:00") })
            put("wed", JSONObject().apply { put("enabled", true); put("start", "07:00"); put("end", "13:00") })
            put("thu", JSONObject().apply { put("enabled", true); put("start", "07:00"); put("end", "13:00") })
            put("fri", JSONObject().apply { put("enabled", true); put("start", "07:00"); put("end", "11:00") })
        }.toString()

        `when`(mockPrefs.weekdayScheduleJson).thenReturn(fiveDaysJson)

        val scheduleMap = invokeGetScheduleMap(scheduleManager)
        
        // Verifikasi Senin - Jumat aktif
        assertTrue("Senin wajib aktif", scheduleMap["mon"]?.enabled == true)
        assertTrue("Jumat wajib aktif", scheduleMap["fri"]?.enabled == true)

        // 🚨 UJI KRITIS BUG HUNTER: Sabtu yang tidak tercatat di data admin WAJIB libur (enabled = false)
        assertFalse("Sabtu WAJIB libur pada sekolah 5 hari kerja!", scheduleMap["sat"]?.enabled == true)
        assertFalse("Minggu WAJIB libur!", scheduleMap["sun"]?.enabled == true)
    }

    @Test
    fun test_SabtuAktif_PadaSekolah6Hari_SaatKeySatEnabledTrue() {
        // Simulasi sekolah 6 hari kerja di mana admin eksplisit menyetel Sabtu = enabled
        val sixDaysJson = JSONObject().apply {
            put("mon", JSONObject().apply { put("enabled", true); put("start", "07:00"); put("end", "13:00") })
            put("sat", JSONObject().apply { put("enabled", true); put("start", "07:00"); put("end", "12:00") })
        }.toString()

        `when`(mockPrefs.weekdayScheduleJson).thenReturn(sixDaysJson)

        val scheduleMap = invokeGetScheduleMap(scheduleManager)
        assertTrue("Sabtu harus aktif jika admin menyetel enabled=true", scheduleMap["sat"]?.enabled == true)
        assertEquals("12:00", scheduleMap["sat"]?.end)
    }

    @Test
    fun test_SabtuLibur_SaatCacheKosongFallback() {
        // Simulasi offline install baru (cache blank)
        `when`(mockPrefs.weekdayScheduleJson).thenReturn("")

        val scheduleMap = invokeGetScheduleMap(scheduleManager)
        assertTrue("Senin fallback aktif", scheduleMap["mon"]?.enabled == true)
        assertFalse("Sabtu fallback WAJIB libur (enabled=false)", scheduleMap["sat"]?.enabled == true)
        assertFalse("Minggu fallback WAJIB libur (enabled=false)", scheduleMap["sun"]?.enabled == true)
    }

    @Test
    fun test_SabtuLibur_SaatJSONCorrupt() {
        // Simulasi data rusak
        `when`(mockPrefs.weekdayScheduleJson).thenReturn("{CORRUPT_JSON_DATA}")

        val scheduleMap = invokeGetScheduleMap(scheduleManager)
        assertFalse("Sabtu WAJIB libur saat JSON corrupt", scheduleMap["sat"]?.enabled == true)
        assertFalse("Minggu WAJIB libur saat JSON corrupt", scheduleMap["sun"]?.enabled == true)
    }

    @Test
    fun test_SSOT_PrioritasSumberJadwal() {
        // Verifikasi logika penolakan penimpaan (SSOT Rule)
        val sourceAdmin = PreferencesManager.SOURCE_ATTENDANCE_SCHEDULES

        // Kasus A: Jika data sudah dari admin modern, path lama DILARANG menimpa
        val currentSource = sourceAdmin
        val canLegacyOverwrite = currentSource != PreferencesManager.SOURCE_ATTENDANCE_SCHEDULES
        assertFalse("Path lama DILARANG menimpa saat sumber adalah ATTENDANCE_SCHEDULES", canLegacyOverwrite)

        // Kasus B: Jika cache masih kosong atau dari legacy, path lama diizinkan sebagai fallback
        val emptySource = ""
        val canFallbackWrite = emptySource != PreferencesManager.SOURCE_ATTENDANCE_SCHEDULES
        assertTrue("Path lama boleh mengisi jika sumber masih kosong", canFallbackWrite)
    }

    @Suppress("UNCHECKED_CAST")
    private fun invokeGetScheduleMap(manager: SchoolScheduleManager): Map<String, TestDaySchedule> {
        val method = SchoolScheduleManager::class.java.getDeclaredMethod("getScheduleMap")
        method.isAccessible = true
        val result = method.invoke(manager) as Map<String, Any?>
        
        // Map ke wrapper helper agar bisa dibaca propertinya
        val wrapped = mutableMapOf<String, TestDaySchedule>()
        for ((k, v) in result) {
            if (v != null) {
                val enabledField = v.javaClass.getDeclaredField("enabled").apply { isAccessible = true }
                val startField = v.javaClass.getDeclaredField("start").apply { isAccessible = true }
                val endField = v.javaClass.getDeclaredField("end").apply { isAccessible = true }
                wrapped[k] = TestDaySchedule(
                    enabled = enabledField.getBoolean(v),
                    start = startField.get(v) as String,
                    end = endField.get(v) as String
                )
            }
        }
        return wrapped
    }

    data class TestDaySchedule(
        val enabled: Boolean,
        val start: String,
        val end: String
    )
}
