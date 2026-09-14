package com.satupintu.mobile.ui.screens.parent

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.Toast
import androidx.compose.animation.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.satupintu.mobile.R
import com.satupintu.mobile.data.model.Attendance
import com.satupintu.mobile.data.model.DisciplineRecord
import com.satupintu.mobile.ui.viewmodel.DailyAttendanceSummary
import com.satupintu.mobile.ui.viewmodel.LinkedChild
import com.satupintu.mobile.ui.viewmodel.ParentDashboardViewModel
import com.satupintu.mobile.util.formatAttendanceTime
import java.text.SimpleDateFormat
import java.util.*

private object ParentPalette {
    val GradientStart = Color(0xFF0D1B2A)
    val GradientMid = Color(0xFF1B263B)
    val GradientEnd = Color(0xFF23395B)

    val CardBg = Color(0xFF1E2D42).copy(alpha = 0.85f)
    val CardBorder = Color(0xFF415A77).copy(alpha = 0.5f)
    val CardBgLight = Color(0xFF283B56).copy(alpha = 0.6f)

    val AccentCyan = Color(0xFF00E5FF)
    val AccentBlue = Color(0xFF38B6FF)
    val AccentGreen = Color(0xFF00E676)
    val AccentOrange = Color(0xFFFF9100)
    val AccentRed = Color(0xFFFF5252)
    val AccentPurple = Color(0xFFB388FF)
    val AccentYellow = Color(0xFFFFD600)

    val TextPrimary = Color(0xFFFFFFFF)
    val TextSecondary = Color(0xFFB0C4DE)
    val TextMuted = Color(0xFF778DA9)
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ParentDashboardScreen(
    onNavigate: (String) -> Unit = {},
    onLogout: () -> Unit,
    viewModel: ParentDashboardViewModel = viewModel()
) {
    val context = LocalContext.current
    val state by viewModel.uiState.collectAsState()
    var selectedTab by remember { mutableStateOf(0) }
    var showChildSwitcherDialog by remember { mutableStateOf(false) }
    var showAddChildDialog by remember { mutableStateOf(false) }
    var showLogoutConfirm by remember { mutableStateOf(false) }

    val activeChild = state.activeChild

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    colors = listOf(
                        ParentPalette.GradientStart,
                        ParentPalette.GradientMid,
                        ParentPalette.GradientEnd
                    )
                )
            )
    ) {
        Scaffold(
            containerColor = Color.Transparent,
            topBar = {
                Surface(
                    color = Color(0xFF0D1B2A).copy(alpha = 0.92f),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .statusBarsPadding()
                            .padding(horizontal = 16.dp, vertical = 12.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            // Brand / School Header
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier.weight(1f)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(42.dp)
                                        .clip(CircleShape)
                                        .background(
                                            Brush.linearGradient(
                                                listOf(ParentPalette.AccentCyan, ParentPalette.AccentBlue)
                                            )
                                        ),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Person,
                                        contentDescription = "Ortu",
                                        tint = Color(0xFF0D1B2A),
                                        modifier = Modifier.size(24.dp)
                                    )
                                }
                                Spacer(modifier = Modifier.width(10.dp))
                                Column {
                                    Text(
                                        text = "GAS Orang Tua",
                                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                                        color = ParentPalette.TextPrimary
                                    )
                                    Text(
                                        text = activeChild?.schoolName?.ifBlank { "Portal Wali Murid" } ?: "Portal Wali Murid",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = ParentPalette.AccentCyan,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                }
                            }

                            // Logout Button
                            IconButton(
                                onClick = { showLogoutConfirm = true },
                                modifier = Modifier
                                    .size(38.dp)
                                    .clip(CircleShape)
                                    .background(Color.White.copy(alpha = 0.1f))
                            ) {
                                Icon(
                                    imageVector = Icons.Default.ExitToApp,
                                    contentDescription = "Keluar",
                                    tint = ParentPalette.AccentRed,
                                    modifier = Modifier.size(20.dp)
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(10.dp))

                        // Child Switcher Pill
                        Surface(
                            shape = RoundedCornerShape(14.dp),
                            color = ParentPalette.CardBg,
                            border = androidx.compose.foundation.BorderStroke(1.dp, ParentPalette.CardBorder),
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { showChildSwitcherDialog = true }
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 14.dp, vertical = 10.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Person,
                                        contentDescription = "Anak",
                                        tint = ParentPalette.AccentCyan,
                                        modifier = Modifier.size(20.dp)
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Column {
                                        Text(
                                            text = activeChild?.name ?: "Pilih Data Anak",
                                            style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold),
                                            color = ParentPalette.TextPrimary,
                                            maxLines = 1,
                                            overflow = TextOverflow.Ellipsis
                                        )
                                        Text(
                                            text = "Kelas: ${activeChild?.className?.ifBlank { "-" }} • NISN: ${activeChild?.nisn ?: "-"}",
                                            style = MaterialTheme.typography.labelSmall,
                                            color = ParentPalette.TextSecondary
                                        )
                                    }
                                }
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text(
                                        text = "Ganti",
                                        style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                                        color = ParentPalette.AccentCyan
                                    )
                                    Icon(
                                        imageVector = Icons.Default.ArrowDropDown,
                                        contentDescription = "Pilih",
                                        tint = ParentPalette.AccentCyan
                                    )
                                }
                            }
                        }
                    }
                }
            }
        ) { paddingValues ->
            if (state.isLoading) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator(color = ParentPalette.AccentCyan)
                }
            } else {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues)
                        .verticalScroll(rememberScrollState())
                        .padding(horizontal = 16.dp, vertical = 8.dp)
                ) {
                    val cal = remember { Calendar.getInstance() }
                    val isSunday = cal.get(Calendar.DAY_OF_WEEK) == Calendar.SUNDAY
                    val isHoliday = state.isTodayHoliday || isSunday
                    val holidayDesc = state.holidayDescription ?: if (isSunday) "Hari Minggu (Libur Akhir Pekan)" else null

                    // Today's Hero Attendance Card
                    TodayAttendanceHeroCard(
                        attendance = state.todayAttendance,
                        isTodayHoliday = isHoliday,
                        holidayDescription = holidayDesc,
                        schoolStartHour = state.childActivity.schoolStartHour,
                        schoolEndHour = state.childActivity.schoolEndHour
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    // Tab Navigation
                    ParentNavigationTabs(
                        selectedTab = selectedTab,
                        onTabSelected = { selectedTab = it }
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    // Tab Content
                    when (selectedTab) {
                        0 -> TodayOverviewTab(
                            state = state,
                            onNavigateToActivity = { selectedTab = 1 }
                        )
                        1 -> ChildActivityMonitorTab(
                            state = state,
                            child = activeChild
                        )
                        2 -> MonthlyRecapTab(state = state)
                        3 -> PrayerAndHabitsTab(state = state)
                        4 -> DisciplineTab(state = state)
                    }

                    Spacer(modifier = Modifier.height(24.dp))
                }
            }
        }

        // Dialog Switcher Anak
        if (showChildSwitcherDialog) {
            ChildSwitcherDialog(
                children = state.linkedChildren,
                activeChild = activeChild,
                onSelectChild = {
                    viewModel.switchActiveChild(it)
                    showChildSwitcherDialog = false
                },
                onAddNewChild = {
                    showChildSwitcherDialog = false
                    showAddChildDialog = true
                },
                onDismiss = { showChildSwitcherDialog = false }
            )
        }

        // Dialog Tambah Anak
        if (showAddChildDialog) {
            AddChildDialog(
                defaultNpsn = activeChild?.schoolId ?: "",
                onSubmit = { npsn, nisn ->
                    viewModel.addLinkedChild(npsn, nisn) { success, msg ->
                        Toast.makeText(context, msg, Toast.LENGTH_SHORT).show()
                        if (success) {
                            showAddChildDialog = false
                        }
                    }
                },
                onDismiss = { showAddChildDialog = false }
            )
        }

        // Logout Confirmation Dialog
        if (showLogoutConfirm) {
            AlertDialog(
                onDismissRequest = { showLogoutConfirm = false },
                title = { Text("Konfirmasi Keluar") },
                text = { Text("Apakah Anda yakin ingin keluar dari akun GAS Orang Tua?") },
                confirmButton = {
                    TextButton(
                        onClick = {
                            showLogoutConfirm = false
                            onLogout()
                        }
                    ) {
                        Text("Keluar", color = ParentPalette.AccentRed, fontWeight = FontWeight.Bold)
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showLogoutConfirm = false }) {
                        Text("Batal")
                    }
                }
            )
        }
    }
}

@Composable
private fun TodayAttendanceHeroCard(
    attendance: Attendance?,
    isTodayHoliday: Boolean = false,
    holidayDescription: String? = null,
    schoolStartHour: String = "07:00",
    schoolEndHour: String = "14:00"
) {
    val status = attendance?.status?.uppercase() ?: "NONE"
    val (statusLabel, statusColor, statusBg, statusIcon) = when {
        status in listOf("PRESENT", "HADIR") -> Quad("HADIR TEPAT WAKTU", ParentPalette.AccentGreen, ParentPalette.AccentGreen.copy(alpha = 0.15f), Icons.Default.CheckCircle)
        status in listOf("LATE", "TERLAMBAT") -> Quad("TERLAMBAT", ParentPalette.AccentYellow, ParentPalette.AccentYellow.copy(alpha = 0.15f), Icons.Default.Info)
        status in listOf("SICK", "SAKIT") -> Quad("SAKIT", ParentPalette.AccentOrange, ParentPalette.AccentOrange.copy(alpha = 0.15f), Icons.Default.Info)
        status in listOf("PERMIT", "IZIN") -> Quad("IZIN", ParentPalette.AccentBlue, ParentPalette.AccentBlue.copy(alpha = 0.15f), Icons.Default.Info)
        status in listOf("ABSENT", "ALPA") -> Quad("TIDAK HADIR (ALPA)", ParentPalette.AccentRed, ParentPalette.AccentRed.copy(alpha = 0.15f), Icons.Default.Close)
        isTodayHoliday -> Quad("HARI INI LIBUR", ParentPalette.AccentCyan, ParentPalette.AccentCyan.copy(alpha = 0.15f), Icons.Default.Info)
        else -> Quad("BELUM PRESENSI", ParentPalette.TextMuted, ParentPalette.CardBgLight, Icons.Default.Info)
    }

    val formattedIn = formatAttendanceTime(attendance?.checkInTime)
    val formattedOut = formatAttendanceTime(attendance?.checkOutTime)

    val inDisplay = when {
        isTodayHoliday && attendance == null -> "Libur"
        formattedIn.isNotBlank() -> "$formattedIn WIB"
        else -> "--:--"
    }

    val outDisplay = when {
        isTodayHoliday && attendance == null -> "Libur"
        formattedOut.isNotBlank() -> "$formattedOut WIB"
        else -> "--:--"
    }

    Card(
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = ParentPalette.CardBg),
        border = BorderStroke(1.dp, ParentPalette.CardBorder),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(18.dp)) {
            // Status Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(10.dp)
                            .clip(CircleShape)
                            .background(statusColor)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "Status Kehadiran Hari Ini",
                        style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                        color = ParentPalette.TextPrimary
                    )
                }

                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = statusBg
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = statusIcon,
                            contentDescription = null,
                            tint = statusColor,
                            modifier = Modifier.size(14.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = statusLabel,
                            style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                            color = statusColor
                        )
                    }
                }
            }

            if (isTodayHoliday && holidayDescription != null) {
                Spacer(modifier = Modifier.height(8.dp))
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = ParentPalette.AccentCyan.copy(alpha = 0.1f),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            Icons.Default.Info,
                            contentDescription = null,
                            tint = ParentPalette.AccentCyan,
                            modifier = Modifier.size(14.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = holidayDescription,
                            style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.Medium),
                            color = ParentPalette.AccentCyan
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // Time Details Row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                // Check In
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = ParentPalette.CardBgLight,
                    modifier = Modifier.weight(1f)
                ) {
                    Column(
                        modifier = Modifier.padding(10.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = "Jam Masuk",
                            style = MaterialTheme.typography.labelSmall,
                            color = ParentPalette.TextMuted
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = inDisplay,
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                            color = if (formattedIn.isBlank() && !(isTodayHoliday && attendance == null)) ParentPalette.TextMuted else ParentPalette.TextPrimary
                        )
                        if (!isTodayHoliday && schoolStartHour.isNotBlank() && !schoolStartHour.equals("Libur", ignoreCase = true)) {
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                text = "Jadwal: $schoolStartHour WIB",
                                style = MaterialTheme.typography.labelSmall.copy(fontSize = 10.sp),
                                color = ParentPalette.TextSecondary
                            )
                        }
                    }
                }

                // Check Out
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = ParentPalette.CardBgLight,
                    modifier = Modifier.weight(1f)
                ) {
                    Column(
                        modifier = Modifier.padding(10.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = "Jam Pulang",
                            style = MaterialTheme.typography.labelSmall,
                            color = ParentPalette.TextMuted
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = outDisplay,
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                            color = if (formattedOut.isBlank() && !(isTodayHoliday && attendance == null)) ParentPalette.TextMuted else ParentPalette.AccentGreen
                        )
                        if (!isTodayHoliday && schoolEndHour.isNotBlank() && !schoolEndHour.equals("Libur", ignoreCase = true)) {
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                text = "Jadwal: $schoolEndHour WIB",
                                style = MaterialTheme.typography.labelSmall.copy(fontSize = 10.sp),
                                color = ParentPalette.TextSecondary
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ParentNavigationTabs(
    selectedTab: Int,
    onTabSelected: (Int) -> Unit
) {
    val tabs = listOf(
        Triple("Hari Ini", Icons.Default.Home, 0),
        Triple("Pantau Aktivitas", Icons.Default.LocationOn, 1),
        Triple("Rekap", Icons.Default.DateRange, 2),
        Triple("Ibadah & 7 KAIH", Icons.Default.Star, 3),
        Triple("Disiplin", Icons.Default.Lock, 4)
    )

    ScrollableTabRow(
        selectedTabIndex = selectedTab,
        containerColor = Color.Transparent,
        contentColor = ParentPalette.AccentCyan,
        edgePadding = 0.dp,
        divider = {}
    ) {
        tabs.forEach { (title, icon, index) ->
            val isSelected = selectedTab == index
            Tab(
                selected = isSelected,
                onClick = { onTabSelected(index) },
                text = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = icon,
                            contentDescription = null,
                            modifier = Modifier.size(16.dp),
                            tint = if (isSelected) ParentPalette.AccentCyan else ParentPalette.TextMuted
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = title,
                            style = MaterialTheme.typography.labelMedium.copy(
                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
                            ),
                            color = if (isSelected) ParentPalette.AccentCyan else ParentPalette.TextMuted
                        )
                    }
                }
            )
        }
    }
}

// ==================== TAB 0: HARI INI ====================
@Composable
private fun TodayOverviewTab(
    state: com.satupintu.mobile.ui.viewmodel.ParentDashboardUiState,
    onNavigateToActivity: () -> Unit = {}
) {
    Column(modifier = Modifier.fillMaxWidth()) {
        // Radar Kepulangan & Telemetri Banner
        ChildActivityRadarBanner(
            activity = state.childActivity,
            onViewDetails = onNavigateToActivity
        )

        Spacer(modifier = Modifier.height(14.dp))

        // Quick Stat Row (Sholat + 7 KAIH)
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            // Sholat Dzuhur Today Card
            Card(
                modifier = Modifier.weight(1f),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = ParentPalette.CardBg),
                border = androidx.compose.foundation.BorderStroke(1.dp, ParentPalette.CardBorder)
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Icon(
                            imageVector = Icons.Default.Star,
                            contentDescription = null,
                            tint = ParentPalette.AccentCyan,
                            modifier = Modifier.size(22.dp)
                        )
                        Surface(
                            shape = RoundedCornerShape(8.dp),
                            color = if (state.todayPrayerStatus.contains("Sudah", ignoreCase = true))
                                ParentPalette.AccentGreen.copy(alpha = 0.2f)
                            else
                                Color.White.copy(alpha = 0.1f)
                        ) {
                            Text(
                                text = state.todayPrayerStatus,
                                style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                                color = if (state.todayPrayerStatus.contains("Sudah", ignoreCase = true))
                                    ParentPalette.AccentGreen
                                else
                                    ParentPalette.AccentOrange,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                            )
                        }
                    }
                    Spacer(modifier = Modifier.height(10.dp))
                    Text(
                        text = state.childActivity.prayerTitle.ifBlank { "Sholat Berjamaah" },
                        style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
                        color = ParentPalette.TextPrimary
                    )
                    Text(
                        text = if (state.childActivity.prayerDzuhurHour.isNotBlank() && !state.childActivity.prayerDzuhurHour.equals("Libur", ignoreCase = true)) "Jadwal: ${state.childActivity.prayerDzuhurHour}" else "Dzuhur / Dhuha di sekolah",
                        style = MaterialTheme.typography.labelSmall,
                        color = ParentPalette.TextMuted
                    )
                }
            }

            // 7 KAIH Card
            Card(
                modifier = Modifier.weight(1f),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = ParentPalette.CardBg),
                border = androidx.compose.foundation.BorderStroke(1.dp, ParentPalette.CardBorder)
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Icon(
                            imageVector = Icons.Default.Star,
                            contentDescription = null,
                            tint = ParentPalette.AccentYellow,
                            modifier = Modifier.size(22.dp)
                        )
                        Text(
                            text = "${state.todayHabitsCount}/7 Selesai",
                            style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                            color = ParentPalette.AccentYellow
                        )
                    }
                    Spacer(modifier = Modifier.height(10.dp))
                    Text(
                        text = "Progres 7 KAIH",
                        style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
                        color = ParentPalette.TextPrimary
                    )
                    Text(
                        text = "7 Kebiasaan Anak Hebat",
                        style = MaterialTheme.typography.labelSmall,
                        color = ParentPalette.TextMuted
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Info Sekolah & Siswa Card
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = ParentPalette.CardBg),
            border = androidx.compose.foundation.BorderStroke(1.dp, ParentPalette.CardBorder)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "Informasi Ananda",
                    style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                    color = ParentPalette.AccentCyan
                )
                Spacer(modifier = Modifier.height(10.dp))
                InfoRow(label = "Nama Lengkap", value = state.activeChild?.name ?: "-")
                InfoRow(label = "Kelas", value = state.activeChild?.className ?: "-")
                InfoRow(label = "NISN", value = state.activeChild?.nisn ?: "-")
                InfoRow(label = "Sekolah", value = state.activeChild?.schoolName ?: "-")
                InfoRow(label = "Poin Pelanggaran", value = "${state.totalDisciplinePoints} Poin")
            }
        }
    }
}

// ==================== BANNER RADAR KEPULANGAN DI TAB 0 ====================
@Composable
private fun ChildActivityRadarBanner(
    activity: com.satupintu.mobile.ui.viewmodel.ChildActivityState,
    onViewDetails: () -> Unit
) {
    val status = activity.returnStatus
    val (themeColor, bgGradient) = when (status) {
        com.satupintu.mobile.ui.viewmodel.ChildReturnStatus.SAFE_AT_SCHOOL ->
            ParentPalette.AccentGreen to listOf(ParentPalette.AccentGreen.copy(alpha = 0.35f), ParentPalette.CardBg)
        com.satupintu.mobile.ui.viewmodel.ChildReturnStatus.ALREADY_CHECKED_OUT ->
            ParentPalette.AccentCyan to listOf(ParentPalette.AccentCyan.copy(alpha = 0.35f), ParentPalette.CardBg)
        com.satupintu.mobile.ui.viewmodel.ChildReturnStatus.OVERDUE_IN_SCHOOL ->
            ParentPalette.AccentYellow to listOf(ParentPalette.AccentYellow.copy(alpha = 0.35f), ParentPalette.CardBg)
        com.satupintu.mobile.ui.viewmodel.ChildReturnStatus.OVERDUE_OUTSIDE_UNVERIFIED ->
            ParentPalette.AccentRed to listOf(ParentPalette.AccentRed.copy(alpha = 0.35f), ParentPalette.CardBg)
        else ->
            ParentPalette.AccentBlue to listOf(ParentPalette.AccentBlue.copy(alpha = 0.35f), ParentPalette.CardBg)
    }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(18.dp))
            .clickable { onViewDetails() },
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = Color.Transparent),
        border = androidx.compose.foundation.BorderStroke(1.dp, themeColor.copy(alpha = 0.6f))
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(Brush.horizontalGradient(bgGradient))
                .padding(16.dp)
        ) {
            Column {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.weight(1f)
                    ) {
                        Surface(
                            shape = CircleShape,
                            color = themeColor.copy(alpha = 0.2f),
                            modifier = Modifier.size(36.dp)
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Icon(
                                    imageVector = Icons.Default.LocationOn,
                                    contentDescription = null,
                                    tint = themeColor,
                                    modifier = Modifier.size(20.dp)
                                )
                            }
                        }
                        Spacer(modifier = Modifier.width(10.dp))
                        Column {
                            Text(
                                text = "Radar Kepulangan & HP",
                                style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                                color = themeColor
                            )
                            Text(
                                text = activity.returnStatusTitle,
                                style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
                                color = ParentPalette.TextPrimary,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                        }
                    }
                    Icon(
                        imageVector = Icons.Default.ArrowForward,
                        contentDescription = "Detail",
                        tint = themeColor,
                        modifier = Modifier.size(18.dp)
                    )
                }

                Spacer(modifier = Modifier.height(10.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    val cal = remember { Calendar.getInstance() }
                    val isSunday = cal.get(Calendar.DAY_OF_WEEK) == Calendar.SUNDAY
                    val isHoliday = isSunday || activity.schoolEndHour.equals("Libur", ignoreCase = true) || activity.returnStatusTitle.contains("Libur", ignoreCase = true)
                    val pulangText = if (isHoliday) "Hari Ini Libur" else "Jam Pulang: ${activity.schoolEndHour} WIB"

                    Text(
                        text = "$pulangText • Baterai: ${activity.batteryLevel?.let { "$it%" } ?: "--"}",
                        style = MaterialTheme.typography.labelSmall,
                        color = ParentPalette.TextSecondary
                    )
                    Text(
                        text = "Buka Peta →",
                        style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                        color = themeColor
                    )
                }
            }
        }
    }
}

// ==================== TAB 1: PANTAU AKTIVITAS ANAK ====================
@Composable
private fun ChildActivityMonitorTab(
    state: com.satupintu.mobile.ui.viewmodel.ParentDashboardUiState,
    child: LinkedChild?
) {
    val context = LocalContext.current
    val activity = state.childActivity
    val childName = child?.name ?: "Ananda"

    Column(
        modifier = Modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        val cal = remember { Calendar.getInstance() }
        val isSunday = cal.get(Calendar.DAY_OF_WEEK) == Calendar.SUNDAY
        val isHoliday = state.isTodayHoliday || isSunday
        val holidayDesc = state.holidayDescription ?: if (isSunday) "Hari Minggu (Libur Akhir Pekan)" else null

        // 1. Hero Radar Kepulangan Status Card
        ActivityReturnHeroCard(
            activity = activity,
            childName = childName,
            isTodayHoliday = isHoliday
        )

        // 2. Telemetri Kondisi HP Anak (Baterai, Sinyal, GPS, OEM Hardware)
        DeviceTelemetryCard(activity = activity)

        // 3. Lokasi Terkini & Integrasi Google Maps
        LocationMapCard(
            activity = activity,
            childName = childName,
            onOpenMaps = { lat, lng ->
                val label = Uri.encode("Lokasi $childName")
                val gmmIntentUri = Uri.parse("geo:$lat,$lng?q=$lat,$lng($label)")
                val mapIntent = Intent(Intent.ACTION_VIEW, gmmIntentUri).apply {
                    setPackage("com.google.android.apps.maps")
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                try {
                    context.startActivity(mapIntent)
                } catch (_: Exception) {
                    try {
                        val webMapIntent = Intent(
                            Intent.ACTION_VIEW,
                            Uri.parse("https://www.google.com/maps/search/?api=1&query=$lat,$lng")
                        ).apply {
                            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                        }
                        context.startActivity(webMapIntent)
                    } catch (e: Exception) {
                        Toast.makeText(context, "Tidak dapat membuka aplikasi peta", Toast.LENGTH_SHORT).show()
                    }
                }
            }
        )

        // 4. Aksi Cepat / Kontak Darurat
        EmergencyContactCard(
            activity = activity,
            onCallHomeroomTeacher = { rawPhone ->
                val phone = rawPhone.trim()
                if (phone.isNotBlank()) {
                    try {
                        val cleanPhone = phone.replace("[^0-9+]".toRegex(), "")
                        val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:$cleanPhone")).apply {
                            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                        }
                        context.startActivity(intent)
                    } catch (e: Exception) {
                        Toast.makeText(context, "Gagal membuka panggilan telepon", Toast.LENGTH_SHORT).show()
                    }
                } else {
                    val teacherInfo = if (activity.homeroomTeacherName.isNotBlank()) " untuk ${activity.homeroomTeacherName}" else ""
                    Toast.makeText(context, "Nomor HP Wali Kelas$teacherInfo belum terdaftar di halaman admin.", Toast.LENGTH_SHORT).show()
                }
            }
        )

        // 5. Timeline Alur Aktivitas Hari Ini
        TodayMovementTimelineCard(
            activity = activity,
            attendance = state.todayAttendance,
            prayerStatus = state.todayPrayerStatus,
            isTodayHoliday = isHoliday,
            holidayDescription = holidayDesc
        )
    }
}

@Composable
private fun ActivityReturnHeroCard(
    activity: com.satupintu.mobile.ui.viewmodel.ChildActivityState,
    childName: String,
    isTodayHoliday: Boolean = false
) {
    val status = activity.returnStatus
    val (statusColor, statusBgGradient, statusIcon) = when (status) {
        com.satupintu.mobile.ui.viewmodel.ChildReturnStatus.SAFE_AT_SCHOOL ->
            Triple(
                ParentPalette.AccentGreen,
                listOf(ParentPalette.AccentGreen.copy(alpha = 0.35f), ParentPalette.CardBg),
                Icons.Default.CheckCircle
            )
        com.satupintu.mobile.ui.viewmodel.ChildReturnStatus.ALREADY_CHECKED_OUT ->
            Triple(
                ParentPalette.AccentCyan,
                listOf(ParentPalette.AccentCyan.copy(alpha = 0.35f), ParentPalette.CardBg),
                Icons.Default.Home
            )
        com.satupintu.mobile.ui.viewmodel.ChildReturnStatus.OVERDUE_IN_SCHOOL ->
            Triple(
                ParentPalette.AccentYellow,
                listOf(ParentPalette.AccentYellow.copy(alpha = 0.35f), ParentPalette.CardBg),
                Icons.Default.Info
            )
        com.satupintu.mobile.ui.viewmodel.ChildReturnStatus.OVERDUE_OUTSIDE_UNVERIFIED ->
            Triple(
                ParentPalette.AccentRed,
                listOf(ParentPalette.AccentRed.copy(alpha = 0.35f), ParentPalette.CardBg),
                Icons.Default.Warning
            )
        else ->
            Triple(
                ParentPalette.AccentBlue,
                listOf(ParentPalette.AccentBlue.copy(alpha = 0.35f), ParentPalette.CardBg),
                Icons.Default.Info
            )
    }

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = Color.Transparent),
        border = androidx.compose.foundation.BorderStroke(1.5.dp, statusColor.copy(alpha = 0.7f))
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(Brush.verticalGradient(statusBgGradient))
                .padding(18.dp)
        ) {
            Column {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Surface(
                        shape = CircleShape,
                        color = statusColor.copy(alpha = 0.25f),
                        modifier = Modifier.size(44.dp)
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(
                                imageVector = statusIcon,
                                contentDescription = null,
                                tint = statusColor,
                                modifier = Modifier.size(24.dp)
                            )
                        }
                    }
                    Spacer(modifier = Modifier.width(12.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "STATUS KEPULANGAN ANANDA",
                            style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold, letterSpacing = 1.sp),
                            color = statusColor
                        )
                        Text(
                            text = activity.returnStatusTitle,
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                            color = ParentPalette.TextPrimary
                        )
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))
                Text(
                    text = activity.returnStatusDesc,
                    style = MaterialTheme.typography.bodyMedium,
                    color = ParentPalette.TextSecondary,
                    lineHeight = 20.sp
                )

                Spacer(modifier = Modifier.height(16.dp))
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(1.dp)
                        .background(ParentPalette.CardBorder.copy(alpha = 0.4f))
                )
                Spacer(modifier = Modifier.height(14.dp))

                // Metric Comparison Grid
                val isHoliday = isTodayHoliday || activity.schoolEndHour.equals("Libur", ignoreCase = true) || (activity.returnStatus == com.satupintu.mobile.ui.viewmodel.ChildReturnStatus.NOT_IN_SCHOOL_TODAY && activity.returnStatusTitle.contains("Libur", ignoreCase = true))

                val jadwalMasukVal = when {
                    isHoliday || activity.schoolStartHour.equals("Libur", ignoreCase = true) -> "Libur"
                    else -> "${activity.schoolStartHour.ifBlank { "07:00" }} WIB"
                }
                val jadwalMasukColor = ParentPalette.AccentCyan

                val formattedCheckIn = formatAttendanceTime(activity.checkInTime)
                val tapMasukVal = when {
                    formattedCheckIn.isNotBlank() -> "$formattedCheckIn WIB"
                    isHoliday -> "Libur"
                    else -> "--:--"
                }
                val tapMasukColor = when {
                    formattedCheckIn.isNotBlank() -> ParentPalette.AccentGreen
                    isHoliday -> ParentPalette.AccentCyan
                    else -> ParentPalette.TextMuted
                }

                val jadwalPulangVal = when {
                    isHoliday || activity.schoolEndHour.equals("Libur", ignoreCase = true) -> "Libur"
                    else -> "${activity.schoolEndHour.ifBlank { "14:00" }} WIB"
                }
                val jadwalPulangColor = ParentPalette.AccentCyan

                val formattedCheckOut = formatAttendanceTime(activity.checkOutTime)
                val tapPulangVal = when {
                    formattedCheckOut.isNotBlank() -> "$formattedCheckOut WIB"
                    isHoliday -> "Libur"
                    else -> "Belum Tap"
                }
                val tapPulangColor = when {
                    formattedCheckOut.isNotBlank() -> ParentPalette.AccentGreen
                    isHoliday -> ParentPalette.AccentCyan
                    else -> ParentPalette.AccentOrange
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    MetricBox(
                        label = "Jadwal Masuk",
                        value = jadwalMasukVal,
                        color = jadwalMasukColor,
                        modifier = Modifier.weight(1f)
                    )
                    MetricBox(
                        label = "Tap Masuk",
                        value = tapMasukVal,
                        color = tapMasukColor,
                        modifier = Modifier.weight(1f)
                    )
                    MetricBox(
                        label = "Jadwal Pulang",
                        value = jadwalPulangVal,
                        color = jadwalPulangColor,
                        modifier = Modifier.weight(1f)
                    )
                    MetricBox(
                        label = "Tap Pulang",
                        value = tapPulangVal,
                        color = tapPulangColor,
                        modifier = Modifier.weight(1f)
                    )
                }
            }
        }
    }
}

@Composable
private fun MetricBox(
    label: String,
    value: String,
    color: Color,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier.padding(horizontal = 4.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall,
            color = ParentPalette.TextMuted,
            textAlign = TextAlign.Center
        )
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = value,
            style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
            color = color,
            textAlign = TextAlign.Center,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis
        )
    }
}

@Composable
private fun DeviceTelemetryCard(activity: com.satupintu.mobile.ui.viewmodel.ChildActivityState) {
    val battery = activity.batteryLevel
    val batteryColor = when {
        battery == null -> ParentPalette.TextMuted
        battery > 30 -> ParentPalette.AccentGreen
        battery in 15..30 -> ParentPalette.AccentYellow
        else -> ParentPalette.AccentRed
    }

    val deviceName = remember(activity.brandOEM, activity.modelOEM) {
        val oem = listOf(activity.brandOEM, activity.modelOEM).filter { it.isNotBlank() }.joinToString(" ")
        if (oem.isNotBlank()) oem else "Perangkat Siswa"
    }

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = ParentPalette.CardBg),
        border = androidx.compose.foundation.BorderStroke(1.dp, ParentPalette.CardBorder)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.Phone,
                        contentDescription = null,
                        tint = ParentPalette.AccentCyan,
                        modifier = Modifier.size(20.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Column {
                        Text(
                            text = "Kondisi HP Ananda",
                            style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                            color = ParentPalette.TextPrimary
                        )
                        Text(
                            text = deviceName,
                            style = MaterialTheme.typography.labelSmall,
                            color = ParentPalette.TextSecondary
                        )
                    }
                }
                Surface(
                    shape = RoundedCornerShape(6.dp),
                    color = if (activity.isOnline) ParentPalette.AccentGreen.copy(alpha = 0.2f) else ParentPalette.AccentRed.copy(alpha = 0.2f)
                ) {
                    Text(
                        text = if (activity.isOnline) "ONLINE" else "OFFLINE",
                        style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                        color = if (activity.isOnline) ParentPalette.AccentGreen else ParentPalette.AccentRed,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // Battery Progress
            Column {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.Star,
                            contentDescription = null,
                            tint = batteryColor,
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "Daya Baterai HP",
                            style = MaterialTheme.typography.bodySmall,
                            color = ParentPalette.TextSecondary
                        )
                    }
                    Text(
                        text = battery?.let { "$it%" } ?: "Tidak Diketahui",
                        style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
                        color = batteryColor
                    )
                }
                Spacer(modifier = Modifier.height(8.dp))
                val clampedProgress = ((battery ?: 0) / 100f).coerceIn(0f, 1f)
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(8.dp)
                        .clip(RoundedCornerShape(4.dp))
                        .background(Color.White.copy(alpha = 0.15f))
                ) {
                    if (clampedProgress > 0.01f) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth(clampedProgress.coerceIn(0.01f, 1f))
                                .fillMaxHeight()
                                .background(batteryColor)
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(14.dp))
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(1.dp)
                    .background(ParentPalette.CardBorder.copy(alpha = 0.3f))
            )
            Spacer(modifier = Modifier.height(14.dp))

            // Details Row: GPS & Zona
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                // GPS Status Box
                Surface(
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(12.dp),
                    color = ParentPalette.CardBgLight
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.LocationOn,
                                contentDescription = null,
                                tint = if (activity.isGpsActive) ParentPalette.AccentGreen else ParentPalette.AccentRed,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "Sinyal GPS",
                                style = MaterialTheme.typography.labelSmall,
                                color = ParentPalette.TextMuted
                            )
                        }
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = if (activity.isGpsActive) "GPS Aktif" else "GPS Mati",
                            style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                            color = if (activity.isGpsActive) ParentPalette.AccentGreen else ParentPalette.AccentRed
                        )
                    }
                }

                // Zona Sekolah Box
                Surface(
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(12.dp),
                    color = ParentPalette.CardBgLight
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.Place,
                                contentDescription = null,
                                tint = if (activity.isInsideSchoolZone == true) ParentPalette.AccentGreen else ParentPalette.AccentOrange,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "Zona Sekolah",
                                style = MaterialTheme.typography.labelSmall,
                                color = ParentPalette.TextMuted
                            )
                        }
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = when (activity.isInsideSchoolZone) {
                                true -> "Di Dalam Sekolah"
                                false -> "Luar Zona"
                                null -> "Mencari Status..."
                            },
                            style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                            color = if (activity.isInsideSchoolZone == true) ParentPalette.AccentGreen else ParentPalette.AccentOrange,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                }
            }

            if (activity.lastSeenAt > 0) {
                Spacer(modifier = Modifier.height(10.dp))
                val timeStr = remember(activity.lastSeenAt) {
                    val millis = if (activity.lastSeenAt < 10000000000L) activity.lastSeenAt * 1000L else activity.lastSeenAt
                    runCatching {
                        SimpleDateFormat("HH:mm:ss WIB", Locale.getDefault()).format(Date(millis))
                    }.getOrDefault("-")
                }
                Text(
                    text = "Sinkronisasi Terakhir: $timeStr",
                    style = MaterialTheme.typography.labelSmall,
                    color = ParentPalette.TextMuted
                )
            }
        }
    }
}

@Composable
private fun LocationMapCard(
    activity: com.satupintu.mobile.ui.viewmodel.ChildActivityState,
    childName: String,
    onOpenMaps: (Double, Double) -> Unit
) {
    val hasValidCoords = activity.latitude != 0.0 && activity.longitude != 0.0

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = ParentPalette.CardBg),
        border = androidx.compose.foundation.BorderStroke(1.dp, ParentPalette.CardBorder)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.fillMaxWidth()
            ) {
                Icon(
                    imageVector = Icons.Default.LocationOn,
                    contentDescription = null,
                    tint = ParentPalette.AccentCyan,
                    modifier = Modifier.size(20.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "Lokasi Terkini & Navigasi Peta",
                    style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                    color = ParentPalette.TextPrimary
                )
            }

            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "Koordinat posisi live HP ananda dikirim berkala oleh background service EduLock.",
                style = MaterialTheme.typography.labelSmall,
                color = ParentPalette.TextMuted
            )

            Spacer(modifier = Modifier.height(14.dp))

            if (hasValidCoords) {
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = ParentPalette.CardBgLight,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column {
                            Text(
                                text = "Titik Koordinat GPS",
                                style = MaterialTheme.typography.labelSmall,
                                color = ParentPalette.TextMuted
                            )
                            val latLngDisplay = remember(activity.latitude, activity.longitude) {
                                runCatching {
                                    "${String.format(Locale.US, "%.5f", activity.latitude)}, ${String.format(Locale.US, "%.5f", activity.longitude)}"
                                }.getOrDefault("-")
                            }
                            Text(
                                text = latLngDisplay,
                                style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold),
                                color = ParentPalette.TextPrimary
                            )
                        }
                        Surface(
                            shape = CircleShape,
                            color = ParentPalette.AccentCyan.copy(alpha = 0.2f),
                            modifier = Modifier.size(32.dp)
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Icon(
                                    imageVector = Icons.Default.LocationOn,
                                    contentDescription = null,
                                    tint = ParentPalette.AccentCyan,
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                // Tombol Buka di Google Maps
                Button(
                    onClick = { onOpenMaps(activity.latitude, activity.longitude) },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp),
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = ParentPalette.AccentCyan)
                ) {
                    Icon(
                        imageVector = Icons.Default.Send,
                        contentDescription = null,
                        tint = ParentPalette.GradientStart,
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "Buka di Google Maps 🗺️",
                        style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.Bold),
                        color = ParentPalette.GradientStart
                    )
                }
            } else {
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = Color.White.copy(alpha = 0.05f),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(14.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.Place,
                            contentDescription = null,
                            tint = ParentPalette.AccentYellow,
                            modifier = Modifier.size(24.dp)
                        )
                        Spacer(modifier = Modifier.width(12.dp))
                        Text(
                            text = "Posisi GPS akan terupdate otomatis begitu HP ananda mengaktifkan lokasi & koneksi internet.",
                            style = MaterialTheme.typography.bodySmall,
                            color = ParentPalette.TextSecondary
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun EmergencyContactCard(
    activity: com.satupintu.mobile.ui.viewmodel.ChildActivityState,
    onCallHomeroomTeacher: (String) -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = ParentPalette.CardBg),
        border = androidx.compose.foundation.BorderStroke(1.dp, ParentPalette.CardBorder)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = "Aksi Cepat & Kontak",
                style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                color = ParentPalette.TextPrimary
            )
            Spacer(modifier = Modifier.height(12.dp))

            // Hubungi Wali Kelas (Hanya satu tombol sesuai instruksi)
            Button(
                onClick = { onCallHomeroomTeacher(activity.homeroomTeacherPhone) },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(46.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = ParentPalette.CardBgLight),
                border = androidx.compose.foundation.BorderStroke(1.dp, ParentPalette.AccentGreen.copy(alpha = 0.6f))
            ) {
                Icon(
                    imageVector = Icons.Default.Phone,
                    contentDescription = null,
                    tint = ParentPalette.AccentGreen,
                    modifier = Modifier.size(18.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                val buttonTitle = if (activity.homeroomTeacherName.isNotBlank()) {
                    "Hubungi Wali Kelas (${activity.homeroomTeacherName})"
                } else {
                    "Hubungi Wali Kelas"
                }
                Text(
                    text = buttonTitle,
                    style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.Bold),
                    color = ParentPalette.AccentGreen,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
        }
    }
}

@Composable
private fun TodayMovementTimelineCard(
    activity: com.satupintu.mobile.ui.viewmodel.ChildActivityState,
    attendance: Attendance?,
    prayerStatus: String,
    isTodayHoliday: Boolean = false,
    holidayDescription: String? = null
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = ParentPalette.CardBg),
        border = androidx.compose.foundation.BorderStroke(1.dp, ParentPalette.CardBorder)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = "Alur Aktivitas Hari Ini",
                style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                color = ParentPalette.TextPrimary
            )
            Spacer(modifier = Modifier.height(14.dp))

            if (isTodayHoliday && attendance == null) {
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = ParentPalette.AccentCyan.copy(alpha = 0.12f),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(14.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.Info,
                            contentDescription = null,
                            tint = ParentPalette.AccentCyan,
                            modifier = Modifier.size(24.dp)
                        )
                        Spacer(modifier = Modifier.width(12.dp))
                        Column {
                            Text(
                                text = "Hari Ini Libur",
                                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                                color = ParentPalette.AccentCyan
                            )
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                text = holidayDescription ?: "Tidak ada jadwal aktivitas & presensi sekolah hari ini.",
                                style = MaterialTheme.typography.bodySmall,
                                color = ParentPalette.TextSecondary
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                TimelineItemRow(
                    time = "Libur",
                    title = "Hari Ini Libur",
                    desc = holidayDescription ?: "Tidak ada jadwal kegiatan belajar mengajar hari ini.",
                    isDone = true,
                    dotColor = ParentPalette.AccentCyan,
                    isLast = true
                )
            } else {
                val startHour = activity.schoolStartHour.ifBlank { "07:00" }
                val dzuhurHour = activity.prayerDzuhurHour.ifBlank { "12:00" }
                val endHour = activity.schoolEndHour.ifBlank { "14:00" }

                val formattedIn = formatAttendanceTime(attendance?.checkInTime)
                val formattedOut = formatAttendanceTime(attendance?.checkOutTime)
                val hasCheckIn = formattedIn.isNotBlank()
                val hasCheckOut = formattedOut.isNotBlank()

                TimelineItemRow(
                    time = if (hasCheckIn) "$formattedIn WIB" else "$startHour WIB",
                    title = "Presensi Masuk Sekolah",
                    desc = if (hasCheckIn) "Tercatat hadir di sekolah ($formattedIn WIB)" else "Jadwal masuk: $startHour WIB (Belum tap masuk)",
                    isDone = hasCheckIn,
                    dotColor = ParentPalette.AccentGreen,
                    isLast = false
                )

                val prayerTimeDisplay = if (dzuhurHour.equals("Libur", ignoreCase = true)) "Libur" else if (dzuhurHour.contains("WIB", ignoreCase = true)) dzuhurHour else "$dzuhurHour WIB"
                val prayerTitleDisplay = activity.prayerTitle.ifBlank { "Sholat Dzuhur Berjamaah" }

                TimelineItemRow(
                    time = prayerTimeDisplay,
                    title = prayerTitleDisplay,
                    desc = prayerStatus.ifBlank { "Belum Sholat" },
                    isDone = prayerStatus.contains("Sudah", ignoreCase = true),
                    dotColor = ParentPalette.AccentCyan,
                    isLast = false
                )

                TimelineItemRow(
                    time = "$endHour WIB",
                    title = "Jadwal Resmi Kepulangan",
                    desc = "Jam bubar sekolah sesuai jadwal",
                    isDone = hasCheckOut || activity.returnStatus == com.satupintu.mobile.ui.viewmodel.ChildReturnStatus.ALREADY_CHECKED_OUT,
                    dotColor = ParentPalette.AccentYellow,
                    isLast = false
                )

                TimelineItemRow(
                    time = if (hasCheckOut) "$formattedOut WIB" else "$endHour WIB",
                    title = "Presensi Pulang di Gerbang",
                    desc = if (hasCheckOut)
                        "Tap kepulangan berhasil ($formattedOut WIB)"
                    else
                        "Belum melakukan tap pulang",
                    isDone = hasCheckOut,
                    dotColor = if (hasCheckOut) ParentPalette.AccentGreen else ParentPalette.AccentOrange,
                    isLast = true
                )
            }
        }
    }
}

@Composable
private fun TimelineItemRow(
    time: String,
    title: String,
    desc: String,
    isDone: Boolean,
    dotColor: Color,
    isLast: Boolean
) {
    Row(modifier = Modifier.fillMaxWidth()) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.width(30.dp)
        ) {
            Surface(
                shape = CircleShape,
                color = if (isDone) dotColor else ParentPalette.TextMuted.copy(alpha = 0.3f),
                modifier = Modifier.size(12.dp)
            ) {}
            if (!isLast) {
                Box(
                    modifier = Modifier
                        .width(2.dp)
                        .height(40.dp)
                        .background(ParentPalette.CardBorder.copy(alpha = 0.5f))
                )
            }
        }
        Spacer(modifier = Modifier.width(10.dp))
        Column(modifier = Modifier.weight(1f).padding(bottom = if (isLast) 0.dp else 14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
                    color = if (isDone) ParentPalette.TextPrimary else ParentPalette.TextMuted
                )
                Text(
                    text = time,
                    style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.SemiBold),
                    color = if (isDone) dotColor else ParentPalette.TextMuted
                )
            }
            Spacer(modifier = Modifier.height(2.dp))
            Text(
                text = desc,
                style = MaterialTheme.typography.bodySmall,
                color = ParentPalette.TextSecondary
            )
        }
    }
}

// ==================== TAB 1: REKAP BULANAN ====================
@Composable
private fun MonthlyRecapTab(state: com.satupintu.mobile.ui.viewmodel.ParentDashboardUiState) {
    val summary = state.monthlySummary

    Column(modifier = Modifier.fillMaxWidth()) {
        // Summary Counts (H, S, I, A)
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            StatBadge(label = "Hadir", count = summary?.totalH ?: 0, color = ParentPalette.AccentGreen, modifier = Modifier.weight(1f))
            StatBadge(label = "Sakit", count = summary?.totalS ?: 0, color = ParentPalette.AccentOrange, modifier = Modifier.weight(1f))
            StatBadge(label = "Izin", count = summary?.totalI ?: 0, color = ParentPalette.AccentBlue, modifier = Modifier.weight(1f))
            StatBadge(label = "Alpa", count = summary?.totalA ?: 0, color = ParentPalette.AccentRed, modifier = Modifier.weight(1f))
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Monthly Attendance Grid
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = ParentPalette.CardBg),
            border = BorderStroke(1.dp, ParentPalette.CardBorder)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Kalender Kehadiran Bulan Ini",
                        style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                        color = ParentPalette.TextPrimary
                    )
                    Text(
                        text = remember {
                            val sdf = SimpleDateFormat("MMMM yyyy", Locale("id", "ID"))
                            sdf.format(Date())
                        },
                        style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.SemiBold),
                        color = ParentPalette.AccentCyan
                    )
                }
                Spacer(modifier = Modifier.height(14.dp))

                if (summary?.summaries.isNullOrEmpty()) {
                    Text(
                        text = "Belum ada catatan kehadiran bulan ini.",
                        style = MaterialTheme.typography.bodySmall,
                        color = ParentPalette.TextMuted
                    )
                } else {
                    // Day headers: Sen, Sel, Rab, Kam, Jum, Sab, Min
                    val dayHeaders = listOf("Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min")
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 8.dp),
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        dayHeaders.forEach { header ->
                            Text(
                                text = header,
                                style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold, fontSize = 11.sp),
                                color = ParentPalette.TextMuted,
                                textAlign = TextAlign.Center,
                                modifier = Modifier.weight(1f)
                            )
                        }
                    }

                    // Calculate lead blanks to align Day 1 with its day of the week
                    val leadBlanks = remember {
                        val firstDayCal = Calendar.getInstance().apply {
                            set(Calendar.DAY_OF_MONTH, 1)
                        }
                        val dow = firstDayCal.get(Calendar.DAY_OF_WEEK)
                        if (dow == Calendar.SUNDAY) 6 else (dow - Calendar.MONDAY)
                    }

                    val displayCells = mutableListOf<DailyAttendanceSummary?>()
                    repeat(leadBlanks) { displayCells.add(null) }
                    displayCells.addAll(summary?.summaries.orEmpty())

                    val chunked = displayCells.chunked(7)
                    chunked.forEach { weekRow ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 3.dp),
                            horizontalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            for (col in 0 until 7) {
                                val day = weekRow.getOrNull(col)
                                if (day != null) {
                                    val (bg, textCol) = when (day.status) {
                                        "H" -> ParentPalette.AccentGreen.copy(alpha = 0.25f) to ParentPalette.AccentGreen
                                        "S" -> ParentPalette.AccentOrange.copy(alpha = 0.25f) to ParentPalette.AccentOrange
                                        "I" -> ParentPalette.AccentBlue.copy(alpha = 0.25f) to ParentPalette.AccentBlue
                                        "A" -> ParentPalette.AccentRed.copy(alpha = 0.25f) to ParentPalette.AccentRed
                                        else -> Color.White.copy(alpha = 0.05f) to ParentPalette.TextMuted
                                    }

                                    Surface(
                                        shape = RoundedCornerShape(8.dp),
                                        color = bg,
                                        border = if (day.status == "A") BorderStroke(1.dp, ParentPalette.AccentRed.copy(alpha = 0.5f)) else null,
                                        modifier = Modifier
                                            .weight(1f)
                                            .height(44.dp)
                                    ) {
                                        Column(
                                            modifier = Modifier.fillMaxSize(),
                                            horizontalAlignment = Alignment.CenterHorizontally,
                                            verticalArrangement = Arrangement.Center
                                        ) {
                                            Text(
                                                text = day.day.toString(),
                                                style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                                                color = ParentPalette.TextPrimary
                                            )
                                            Text(
                                                text = day.status,
                                                style = MaterialTheme.typography.labelSmall.copy(fontSize = 10.sp, fontWeight = FontWeight.ExtraBold),
                                                color = textCol
                                            )
                                        }
                                    }
                                } else {
                                    Spacer(modifier = Modifier.weight(1f))
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(1.dp)
                            .background(ParentPalette.CardBorder.copy(alpha = 0.4f))
                    )
                    Spacer(modifier = Modifier.height(10.dp))

                    // Legend
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceAround
                    ) {
                        LegendItem(code = "H", label = "Hadir", color = ParentPalette.AccentGreen)
                        LegendItem(code = "S", label = "Sakit", color = ParentPalette.AccentOrange)
                        LegendItem(code = "I", label = "Izin", color = ParentPalette.AccentBlue)
                        LegendItem(code = "A", label = "Alpa", color = ParentPalette.AccentRed)
                        LegendItem(code = "-", label = "Libur", color = ParentPalette.TextMuted)
                    }
                }
            }
        }
    }
}

@Composable
private fun LegendItem(code: String, label: String, color: Color) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Surface(
            shape = RoundedCornerShape(4.dp),
            color = color.copy(alpha = 0.25f),
            modifier = Modifier.size(16.dp)
        ) {
            Box(contentAlignment = Alignment.Center) {
                Text(
                    text = code,
                    style = MaterialTheme.typography.labelSmall.copy(fontSize = 9.sp, fontWeight = FontWeight.Bold),
                    color = color
                )
            }
        }
        Spacer(modifier = Modifier.width(4.dp))
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall.copy(fontSize = 10.sp),
            color = ParentPalette.TextSecondary
        )
    }
}

// ==================== TAB 2: IBADAH & 7 KAIH ====================
@Composable
private fun PrayerAndHabitsTab(state: com.satupintu.mobile.ui.viewmodel.ParentDashboardUiState) {
    Column(modifier = Modifier.fillMaxWidth()) {
        // 7 Habits Checklist
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = ParentPalette.CardBg),
            border = androidx.compose.foundation.BorderStroke(1.dp, ParentPalette.CardBorder)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = "7 Kebiasaan Anak Indonesia Hebat",
                        style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                        color = ParentPalette.AccentYellow
                    )
                    Text(
                        text = "${state.todayHabitsCount}/7",
                        style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                        color = ParentPalette.AccentYellow
                    )
                }

                Spacer(modifier = Modifier.height(12.dp))

                state.todayHabitsList.forEach { habit ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 5.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = if (habit.isDone) Icons.Default.CheckCircle else Icons.Default.Close,
                            contentDescription = null,
                            tint = if (habit.isDone) ParentPalette.AccentGreen else ParentPalette.TextMuted,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(10.dp))
                        Text(
                            text = habit.habitName,
                            style = MaterialTheme.typography.bodyMedium,
                            color = if (habit.isDone) ParentPalette.TextPrimary else ParentPalette.TextMuted
                        )
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Prayer History Card (Live & Realtime)
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(18.dp),
            colors = CardDefaults.cardColors(containerColor = ParentPalette.CardBg),
            border = androidx.compose.foundation.BorderStroke(1.dp, ParentPalette.CardBorder)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(8.dp)
                                .background(ParentPalette.AccentCyan, CircleShape)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Riwayat Sholat Berjamaah",
                            style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                            color = ParentPalette.TextPrimary
                        )
                    }

                    // Live Realtime indicator badge
                    Surface(
                        shape = RoundedCornerShape(20.dp),
                        color = ParentPalette.AccentGreen.copy(alpha = 0.15f),
                        border = androidx.compose.foundation.BorderStroke(1.dp, ParentPalette.AccentGreen.copy(alpha = 0.35f))
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(6.dp)
                                    .background(ParentPalette.AccentGreen, CircleShape)
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = "Realtime",
                                style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold, fontSize = 10.sp),
                                color = ParentPalette.AccentGreen
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                if (state.prayerHistory.isEmpty()) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 16.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "Belum ada catatan riwayat sholat.",
                            style = MaterialTheme.typography.bodySmall,
                            color = ParentPalette.TextMuted
                        )
                    }
                } else {
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        state.prayerHistory.take(7).forEach { log ->
                            val isPrayed = log.status.contains("Sudah", ignoreCase = true) ||
                                log.status.equals("PRAY", ignoreCase = true) ||
                                log.status.equals("HADIR", ignoreCase = true)
                            val isPermit = log.status.contains("Izin", ignoreCase = true) ||
                                log.status.contains("Halangan", ignoreCase = true) ||
                                log.status.contains("Sakit", ignoreCase = true)

                            val badgeBg = when {
                                isPrayed -> ParentPalette.AccentGreen.copy(alpha = 0.15f)
                                isPermit -> ParentPalette.AccentBlue.copy(alpha = 0.15f)
                                else -> ParentPalette.AccentRed.copy(alpha = 0.15f)
                            }
                            val badgeBorder = when {
                                isPrayed -> ParentPalette.AccentGreen.copy(alpha = 0.4f)
                                isPermit -> ParentPalette.AccentBlue.copy(alpha = 0.4f)
                                else -> ParentPalette.AccentRed.copy(alpha = 0.4f)
                            }
                            val badgeTextColor = when {
                                isPrayed -> ParentPalette.AccentGreen
                                isPermit -> ParentPalette.AccentBlue
                                else -> ParentPalette.AccentRed
                            }
                            val statusLabel = when {
                                isPrayed -> "Sudah Sholat"
                                isPermit -> log.status
                                else -> "Tidak Sholat"
                            }

                            Surface(
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(12.dp),
                                color = ParentPalette.CardBgLight.copy(alpha = 0.7f),
                                border = androidx.compose.foundation.BorderStroke(1.dp, ParentPalette.CardBorder.copy(alpha = 0.35f))
                            ) {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(horizontal = 12.dp, vertical = 10.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        modifier = Modifier.weight(1f)
                                    ) {
                                        Box(
                                            modifier = Modifier
                                                .size(36.dp)
                                                .background(
                                                    if (isPrayed) ParentPalette.AccentGreen.copy(alpha = 0.15f) else ParentPalette.CardBorder.copy(alpha = 0.3f),
                                                    CircleShape
                                                ),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Icon(
                                                imageVector = if (isPrayed) Icons.Default.CheckCircle else Icons.Default.Info,
                                                contentDescription = null,
                                                tint = if (isPrayed) ParentPalette.AccentGreen else ParentPalette.TextSecondary,
                                                modifier = Modifier.size(18.dp)
                                            )
                                        }

                                        Spacer(modifier = Modifier.width(10.dp))

                                        Column {
                                            Text(
                                                text = "Sholat ${log.prayerType}",
                                                style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
                                                color = ParentPalette.TextPrimary
                                            )
                                            Spacer(modifier = Modifier.height(2.dp))
                                            Text(
                                                text = log.formattedDate.ifBlank { log.dateStr },
                                                style = MaterialTheme.typography.labelSmall,
                                                color = ParentPalette.TextSecondary
                                            )
                                        }
                                    }

                                    Spacer(modifier = Modifier.width(8.dp))

                                    Surface(
                                        shape = RoundedCornerShape(8.dp),
                                        color = badgeBg,
                                        border = androidx.compose.foundation.BorderStroke(1.dp, badgeBorder)
                                    ) {
                                        Row(
                                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            if (isPrayed) {
                                                Icon(
                                                    imageVector = Icons.Default.Check,
                                                    contentDescription = null,
                                                    tint = ParentPalette.AccentGreen,
                                                    modifier = Modifier.size(12.dp)
                                                )
                                                Spacer(modifier = Modifier.width(4.dp))
                                            }
                                            Text(
                                                text = statusLabel,
                                                style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                                                color = badgeTextColor
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

// ==================== TAB 3: DISIPLIN ====================
@Composable
private fun DisciplineTab(state: com.satupintu.mobile.ui.viewmodel.ParentDashboardUiState) {
    Column(modifier = Modifier.fillMaxWidth()) {
        // Point Banner
        Surface(
            shape = RoundedCornerShape(16.dp),
            color = if (state.totalDisciplinePoints > 0)
                ParentPalette.AccentRed.copy(alpha = 0.2f)
            else
                ParentPalette.AccentGreen.copy(alpha = 0.2f),
            border = androidx.compose.foundation.BorderStroke(
                1.dp,
                if (state.totalDisciplinePoints > 0) ParentPalette.AccentRed.copy(alpha = 0.4f) else ParentPalette.AccentGreen.copy(alpha = 0.4f)
            ),
            modifier = Modifier.fillMaxWidth()
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = if (state.totalDisciplinePoints > 0) Icons.Default.Warning else Icons.Default.CheckCircle,
                    contentDescription = null,
                    tint = if (state.totalDisciplinePoints > 0) ParentPalette.AccentRed else ParentPalette.AccentGreen,
                    modifier = Modifier.size(32.dp)
                )
                Spacer(modifier = Modifier.width(12.dp))
                Column {
                    Text(
                        text = "Total Poin Pembinaan: ${state.totalDisciplinePoints}",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                        color = ParentPalette.TextPrimary
                    )
                    Text(
                        text = if (state.totalDisciplinePoints == 0)
                            "Alhamdulillah, ananda tidak memiliki catatan pelanggaran."
                        else
                            "Mohon berikan arahan dan motivasi positif kepada ananda di rumah.",
                        style = MaterialTheme.typography.bodySmall,
                        color = ParentPalette.TextSecondary
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Records List
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = ParentPalette.CardBg),
            border = androidx.compose.foundation.BorderStroke(1.dp, ParentPalette.CardBorder)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "Riwayat Catatan Kedisiplinan",
                    style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                    color = ParentPalette.TextPrimary
                )

                Spacer(modifier = Modifier.height(10.dp))

                if (state.disciplineRecords.isEmpty()) {
                    Text(
                        text = "Tidak ada catatan pelanggaran yang tercatat.",
                        style = MaterialTheme.typography.bodySmall,
                        color = ParentPalette.TextMuted,
                        modifier = Modifier.padding(vertical = 8.dp)
                    )
                } else {
                    val sdf = remember { SimpleDateFormat("dd MMM yyyy", Locale("id", "ID")) }
                    state.disciplineRecords.forEach { rec ->
                        Surface(
                            shape = RoundedCornerShape(12.dp),
                            color = ParentPalette.CardBgLight,
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 4.dp)
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(12.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = rec.ruleNameSnapshot.ifBlank { "Pelanggaran Tata Tertib" },
                                        style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold),
                                        color = ParentPalette.TextPrimary
                                    )
                                    if (rec.description?.isNotBlank() == true) {
                                        Text(
                                            text = rec.description,
                                            style = MaterialTheme.typography.bodySmall,
                                            color = ParentPalette.TextSecondary
                                        )
                                    }
                                    Text(
                                        text = sdf.format(Date(rec.date)),
                                        style = MaterialTheme.typography.labelSmall,
                                        color = ParentPalette.TextMuted
                                    )
                                }

                                Surface(
                                    shape = RoundedCornerShape(8.dp),
                                    color = ParentPalette.AccentRed.copy(alpha = 0.2f)
                                ) {
                                    Text(
                                        text = "+${rec.points} Poin",
                                        style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                                        color = ParentPalette.AccentRed,
                                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

// ==================== HELPER COMPONENTS ====================

@Composable
private fun StatBadge(
    label: String,
    count: Int,
    color: Color,
    modifier: Modifier = Modifier
) {
    Surface(
        shape = RoundedCornerShape(12.dp),
        color = color.copy(alpha = 0.15f),
        border = androidx.compose.foundation.BorderStroke(1.dp, color.copy(alpha = 0.35f)),
        modifier = modifier
    ) {
        Column(
            modifier = Modifier.padding(vertical = 10.dp, horizontal = 4.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = count.toString(),
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                color = color
            )
            Text(
                text = label,
                style = MaterialTheme.typography.labelSmall,
                color = ParentPalette.TextPrimary
            )
        }
    }
}

@Composable
private fun InfoRow(label: String, value: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 3.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(text = label, style = MaterialTheme.typography.bodySmall, color = ParentPalette.TextMuted)
        Text(text = value, style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.SemiBold), color = ParentPalette.TextPrimary)
    }
}

@Composable
private fun ChildSwitcherDialog(
    children: List<LinkedChild>,
    activeChild: LinkedChild?,
    onSelectChild: (LinkedChild) -> Unit,
    onAddNewChild: () -> Unit,
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Pilih Anak Yang Dipantau") },
        text = {
            Column(modifier = Modifier.fillMaxWidth()) {
                children.forEach { child ->
                    val isSelected = child.studentId == activeChild?.studentId || child.nisn == activeChild?.nisn
                    Surface(
                        shape = RoundedCornerShape(10.dp),
                        color = if (isSelected) MaterialTheme.colorScheme.primaryContainer else Color.Transparent,
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onSelectChild(child) }
                            .padding(vertical = 4.dp)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(10.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                imageVector = if (isSelected) Icons.Default.CheckCircle else Icons.Default.Person,
                                contentDescription = null,
                                tint = if (isSelected) MaterialTheme.colorScheme.primary else Color.Gray
                            )
                            Spacer(modifier = Modifier.width(10.dp))
                            Column {
                                Text(
                                    text = child.name,
                                    style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold)
                                )
                                Text(
                                    text = "Kelas: ${child.className} • ${child.schoolName}",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = Color.Gray
                                )
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                OutlinedButton(
                    onClick = onAddNewChild,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Icon(imageVector = Icons.Default.Add, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Hubungkan Anak Lain")
                }
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text("Tutup")
            }
        }
    )
}

@Composable
private fun AddChildDialog(
    defaultNpsn: String,
    onSubmit: (String, String) -> Unit,
    onDismiss: () -> Unit
) {
    var npsn by remember { mutableStateOf(defaultNpsn) }
    var nisn by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Hubungkan Data Anak") },
        text = {
            Column(modifier = Modifier.fillMaxWidth()) {
                Text(
                    text = "Masukkan NPSN / ID Sekolah dan NISN anak Anda untuk menghubungkan akun.",
                    style = MaterialTheme.typography.bodySmall,
                    color = Color.Gray
                )
                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = npsn,
                    onValueChange = { npsn = it },
                    label = { Text("NPSN / Kode Sekolah") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(8.dp))

                OutlinedTextField(
                    value = nisn,
                    onValueChange = { nisn = it },
                    label = { Text("NISN Siswa (Anak)") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            Button(
                onClick = { onSubmit(npsn, nisn) },
                enabled = npsn.isNotBlank() && nisn.isNotBlank()
            ) {
                Text("Hubungkan")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Batal")
            }
        }
    )
}

private data class Quad<A, B, C, D>(
    val first: A,
    val second: B,
    val third: C,
    val fourth: D
)
