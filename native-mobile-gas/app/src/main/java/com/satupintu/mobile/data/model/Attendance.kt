package com.satupintu.mobile.data.model

data class Attendance(
    val id: String = "",
    val studentId: String = "",
    val schoolId: String = "",
    val date: Long = 0,
    val status: String = "ABSENT",
    val checkInTime: String = "",
    val checkOutTime: String? = null,
    val checkInMethod: String = "MANUAL",
    val notes: String? = null,
    val proofDocument: String? = null,
    val recordedBy: String? = null,
    val verificationStatus: String = "APPROVED",
    val verifiedBy: String? = null,
    val verifiedAt: Long? = null,
    val proposedBy: String? = null,
    val proposedAt: Long? = null,
    val proposedStatus: String? = null,
    val latitude: Double? = null,
    val longitude: Double? = null,
    val locationAccuracyMeters: Float? = null,
    val locationProvider: String? = null,
    val isMockLocation: Boolean = false,
    val deviceTimeTrusted: Boolean = true,
    /** Alias identitas agar guru/web bisa join meski studentId pakai push-key. */
    val nisn: String = "",
    val username: String = "",
    val studentName: String = "",
    val className: String = "",
    val isEarlyCheckout: Boolean = false
)

enum class AttendanceStatus {
    PRESENT, ABSENT, LATE, SICK, PERMIT
}
