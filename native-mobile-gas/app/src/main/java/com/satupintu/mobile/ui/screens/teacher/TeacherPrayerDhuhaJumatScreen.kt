package com.satupintu.mobile.ui.screens.teacher

import android.app.DatePickerDialog
import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.collectAsState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.satupintu.mobile.ui.viewmodel.ManualPrayerSubmission
import com.satupintu.mobile.ui.viewmodel.TeacherPrayerItem
import com.satupintu.mobile.ui.viewmodel.TeacherPrayerV2ViewModel
import com.satupintu.mobile.ui.viewmodel.TeacherPrayerHistoryRow
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

private val LenteraPageBrush = Brush.verticalGradient(
    colors = listOf(Color(0xFF12D6C6), Color(0xFF0F7BFF), Color(0xFF0F2A43))
)

private val LenteraHeaderBrush = Brush.horizontalGradient(
    colors = listOf(Color(0xFF0F2A43), Color(0xFF0F7BFF))
)

private val LenteraGlassCard = Color(0xFF0B1F33).copy(alpha = 0.22f)
private val LenteraGlassBorder = Color.White.copy(alpha = 0.18f)
private val LenteraTextSecondary = Color.White.copy(alpha = 0.78f)
private val PrayerTableDividerColor = Color.White.copy(alpha = 0.24f)

private const val STATUS_PRAY = "Sudah Presensi"
private const val STATUS_NOT_YET = "Belum Presensi"
private const val STATUS_NOT_PRAY = "Tidak Sholat"
private const val STATUS_PERMIT = "Izin"
private const val STATUS_HALANGAN = "Halangan"
private val TABLE_NO_WIDTH = 44.dp
private val TABLE_STATUS_SECTION_WIDTH = 176.dp
private val TABLE_ROW_HEIGHT = 48.dp

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TeacherPrayerDhuhaJumatScreen(
    teacherNuptk: String,
    schoolId: String,
    onBack: () -> Unit,
    viewModel: TeacherPrayerV2ViewModel = viewModel()
) {
    val context = LocalContext.current
    val todayFormatter = remember { SimpleDateFormat("EEEE, dd MMMM yyyy", Locale("id", "ID")) }
    val dateTimeFormatter = remember { SimpleDateFormat("dd MMM yyyy HH:mm", Locale("id", "ID")) }
    val teacher by viewModel.teacher.collectAsState()
    val prayerItems by viewModel.prayerItems.collectAsState()
    val historyRows by viewModel.historyRows.collectAsState()
    val selectedDate by viewModel.selectedDate.collectAsState()
    val selectedPrayerType by viewModel.selectedPrayerType.collectAsState()
    val searchQuery by viewModel.searchQuery.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val isSubmitting by viewModel.isSubmitting.collectAsState()
    val manualSelections = remember { mutableStateMapOf<String, String>() }
    var selectedTabIndex by remember { mutableIntStateOf(0) }
    val tabs = listOf("Monitoring Harian", "Riwayat")
    val dateCalendar = Calendar.getInstance().apply { timeInMillis = selectedDate }
    val datePickerDialog = remember(selectedDate) {
        DatePickerDialog(
            context,
            { _, year, month, dayOfMonth ->
                val newCalendar = Calendar.getInstance().apply {
                    set(Calendar.YEAR, year)
                    set(Calendar.MONTH, month)
                    set(Calendar.DAY_OF_MONTH, dayOfMonth)
                }
                viewModel.setSelectedDate(newCalendar.timeInMillis)
            },
            dateCalendar.get(Calendar.YEAR),
            dateCalendar.get(Calendar.MONTH),
            dateCalendar.get(Calendar.DAY_OF_MONTH)
        )
    }

    LaunchedEffect(teacherNuptk) {
        if (teacherNuptk.isNotBlank()) {
            viewModel.setTeacherNuptk(teacherNuptk, schoolId)
        }
    }

    LaunchedEffect(prayerItems, selectedPrayerType) {
        val validIds = prayerItems
            .filter { it.status == STATUS_NOT_YET }
            .map { teacherPrayerIdentityKey(it.student) }
            .toSet()
        val invalidIds = manualSelections.keys.filter { it !in validIds }
        invalidIds.forEach { manualSelections.remove(it) }
    }

    val prayerTypeLabel = if (selectedPrayerType == "JUMAT") "Jum'at" else "Dhuha"
    val topTitle = "Presensi $prayerTypeLabel"
    val isJumatBlocked = selectedPrayerType == "JUMAT" && prayerItems.isNotEmpty() && prayerItems.all { it.status == "Tidak dijadwalkan" }

    Scaffold(
        containerColor = Color.Transparent,
        topBar = {
            Box(modifier = Modifier.fillMaxWidth().background(LenteraHeaderBrush)) {
                TopAppBar(
                    title = {
                        Column {
                            Text(topTitle, fontWeight = FontWeight.Bold)
                            Text(
                                "Wali Kelas ${teacher?.homeroomClass ?: "..."}",
                                style = MaterialTheme.typography.labelSmall,
                                color = Color.White.copy(alpha = 0.8f)
                            )
                        }
                    },
                    navigationIcon = {
                        IconButton(onClick = onBack) {
                            Icon(Icons.Default.ArrowBack, contentDescription = "Kembali")
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = Color.Transparent,
                        titleContentColor = Color.White,
                        navigationIconContentColor = Color.White
                    )
                )
            }
        }
    ) { padding ->
        Box(
            modifier = Modifier.fillMaxSize().background(LenteraPageBrush).padding(padding)
        ) {
            Column(modifier = Modifier.fillMaxSize()) {
                TabRow(
                    selectedTabIndex = selectedTabIndex,
                    containerColor = Color.Transparent,
                    contentColor = Color.White
                ) {
                    tabs.forEachIndexed { index, title ->
                        Tab(
                            selected = selectedTabIndex == index,
                            onClick = { selectedTabIndex = index },
                            selectedContentColor = Color.White,
                            unselectedContentColor = Color.White.copy(alpha = 0.7f),
                            text = { Text(title) }
                        )
                    }
                }

                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = { viewModel.onSearchQueryChanged(it) },
                    modifier = Modifier.fillMaxWidth().padding(16.dp),
                    placeholder = { Text("Cari nama atau NISN...", color = LenteraTextSecondary) },
                    leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = Color.White) },
                    singleLine = true,
                    shape = RoundedCornerShape(16.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = Color.White.copy(alpha = 0.42f),
                        unfocusedBorderColor = LenteraGlassBorder,
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White,
                        cursorColor = Color.White
                    )
                )

                PrayerTypeSelector(
                    selectedPrayerType = selectedPrayerType,
                    onSelect = { viewModel.setPrayerType(it) }
                )

                if (isLoading) {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(color = Color.White)
                    }
                } else {
                    if (selectedTabIndex == 0) {
                        DailyPrayerContent(
                            prayerItems = prayerItems,
                            selectedDateLabel = todayFormatter.format(Date(selectedDate)),
                            statsPrayCount = countEffectiveStatuses(prayerItems, manualSelections.toMap(), STATUS_PRAY),
                            statsNotPrayCount = countEffectiveStatuses(prayerItems, manualSelections.toMap(), STATUS_NOT_PRAY),
                            statsPermitCount = countEffectiveStatuses(prayerItems, manualSelections.toMap(), STATUS_PERMIT),
                            statsHalanganCount = countEffectiveStatuses(prayerItems, manualSelections.toMap(), STATUS_HALANGAN),
                            manualSelections = manualSelections.toMap(),
                            isSubmitting = isSubmitting,
                            onDateClick = { datePickerDialog.show() },
                            isJumatBlocked = isJumatBlocked,
                            onSubmitManual = {
                                val selectedItems = prayerItems.mapNotNull { item ->
                                    val status = manualSelections[teacherPrayerIdentityKey(item.student)]
                                        ?: return@mapNotNull null
                                    ManualPrayerSubmission(
                                        item = item,
                                        status = when (status) {
                                            STATUS_PRAY -> "PRAY"
                                            STATUS_NOT_PRAY -> "NOT_PRAY"
                                            STATUS_PERMIT -> "PERMIT"
                                            STATUS_HALANGAN -> "HALANGAN"
                                            else -> return@mapNotNull null
                                        }
                                    )
                                }
                                viewModel.submitManualPrayer(selectedItems, selectedDate, selectedPrayerType) { result ->
                                    Toast.makeText(context, result.message, Toast.LENGTH_LONG).show()
                                    if (result.success) manualSelections.clear()
                                }
                            },
                            onStatusSelected = { item, status ->
                                val studentKey = teacherPrayerIdentityKey(item.student)
                                val currentStatus = manualSelections[studentKey]
                                if (currentStatus == status) {
                                    manualSelections.remove(studentKey)
                                } else {
                                    manualSelections[studentKey] = status
                                }
                            }
                        )
                    } else {
                        Box(modifier = Modifier.weight(1f)) {
                            HistoryContent(
                                rows = historyRows,
                                formatter = dateTimeFormatter
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun PrayerTypeSelector(
    selectedPrayerType: String,
    onSelect: (String) -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp),
        horizontalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        val isDhuha = selectedPrayerType == "DHUHA"
        val isJumat = selectedPrayerType == "JUMAT"
        OutlinedButton(
            onClick = { onSelect("DHUHA") },
            modifier = Modifier.weight(1f),
            colors = ButtonDefaults.outlinedButtonColors(
                containerColor = if (isDhuha) Color.White.copy(alpha = 0.16f) else Color.Transparent,
                contentColor = Color.White
            ),
            border = androidx.compose.foundation.BorderStroke(1.dp, Color.White.copy(alpha = 0.28f))
        ) {
            Text("Dhuha")
        }
        OutlinedButton(
            onClick = { onSelect("JUMAT") },
            modifier = Modifier.weight(1f),
            colors = ButtonDefaults.outlinedButtonColors(
                containerColor = if (isJumat) Color.White.copy(alpha = 0.16f) else Color.Transparent,
                contentColor = Color.White
            ),
            border = androidx.compose.foundation.BorderStroke(1.dp, Color.White.copy(alpha = 0.28f))
        ) {
            Text("Jum'at")
        }
    }
    Spacer(modifier = Modifier.height(12.dp))
}

@Composable
private fun DailyPrayerContent(
    prayerItems: List<TeacherPrayerItem>,
    selectedDateLabel: String,
    statsPrayCount: Int,
    statsNotPrayCount: Int,
    statsPermitCount: Int,
    statsHalanganCount: Int,
    manualSelections: Map<String, String>,
    isSubmitting: Boolean,
    isJumatBlocked: Boolean,
    onDateClick: () -> Unit,
    onSubmitManual: () -> Unit,
    onStatusSelected: (TeacherPrayerItem, String) -> Unit
) {
    Column(modifier = Modifier.fillMaxSize()) {
        Card(
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
            colors = CardDefaults.cardColors(containerColor = LenteraGlassCard),
            border = androidx.compose.foundation.BorderStroke(1.dp, LenteraGlassBorder),
            shape = RoundedCornerShape(18.dp)
        ) {
            Column(modifier = Modifier.padding(14.dp)) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onDateClick() },
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Default.DateRange, contentDescription = null, tint = Color.White)
                    Spacer(modifier = Modifier.width(10.dp))
                    Text(
                        text = selectedDateLabel,
                        color = Color.White,
                        fontWeight = FontWeight.SemiBold,
                        modifier = Modifier.weight(1f),
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }

                if (isJumatBlocked) {
                    Spacer(modifier = Modifier.height(10.dp))
                    Text(
                        text = "Kelas belum terjadwal Sholat Jum'at pada tanggal ini.",
                        color = Color(0xFFFFC107),
                        style = MaterialTheme.typography.bodySmall
                    )
                }

                Spacer(modifier = Modifier.height(12.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    StatPill("Sudah", statsPrayCount)
                    StatPill("Tidak", statsNotPrayCount)
                    StatPill("Izin", statsPermitCount)
                    StatPill("Halangan", statsHalanganCount)
                }
                Spacer(modifier = Modifier.height(14.dp))
                Button(
                    onClick = onSubmitManual,
                    enabled = manualSelections.isNotEmpty() && !isSubmitting,
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Color(0xFF22C55E),
                        contentColor = Color.White,
                        disabledContainerColor = Color.White.copy(alpha = 0.12f),
                        disabledContentColor = Color.White.copy(alpha = 0.7f)
                    ),
                    shape = RoundedCornerShape(14.dp)
                ) {
                    if (isSubmitting) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(18.dp),
                            color = Color.White,
                            strokeWidth = 2.dp
                        )
                        Spacer(modifier = Modifier.width(10.dp))
                        Text("Menyimpan...")
                    } else {
                        Text("Simpan Manual (${manualSelections.size})")
                    }
                }
            }
        }

        Box(modifier = Modifier.weight(1f)) {
            PrayerTable(
                items = prayerItems,
                manualSelections = manualSelections,
                onStatusSelected = onStatusSelected
            )
        }
    }
}

@Composable
private fun StatPill(label: String, value: Int) {
    Surface(
        shape = RoundedCornerShape(999.dp),
        color = Color.White.copy(alpha = 0.10f),
        border = androidx.compose.foundation.BorderStroke(1.dp, Color.White.copy(alpha = 0.18f))
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(label, color = Color.White.copy(alpha = 0.8f), fontSize = 12.sp)
            Spacer(modifier = Modifier.width(8.dp))
            Surface(shape = CircleShape, color = Color.White.copy(alpha = 0.18f)) {
                Text(
                    value.toString(),
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp),
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    fontSize = 12.sp
                )
            }
        }
    }
}

@Composable
private fun PrayerTable(
    items: List<TeacherPrayerItem>,
    manualSelections: Map<String, String>,
    onStatusSelected: (TeacherPrayerItem, String) -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp),
        colors = CardDefaults.cardColors(containerColor = LenteraGlassCard),
        border = androidx.compose.foundation.BorderStroke(1.dp, LenteraGlassBorder),
        shape = RoundedCornerShape(18.dp)
    ) {
        Column(modifier = Modifier.fillMaxSize()) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color.White.copy(alpha = 0.10f))
                    .padding(horizontal = 12.dp, vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("No", color = Color.White, modifier = Modifier.width(TABLE_NO_WIDTH), fontWeight = FontWeight.Bold)
                Text(
                    "Nama",
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.weight(1f)
                )
                Text(
                    "Status",
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.width(TABLE_STATUS_SECTION_WIDTH),
                    textAlign = TextAlign.Center
                )
            }
            Box(modifier = Modifier.fillMaxWidth().height(1.dp).background(PrayerTableDividerColor))

            LazyColumn(modifier = Modifier.fillMaxSize()) {
                itemsIndexed(items) { index, item ->
                    val selectionKey = teacherPrayerIdentityKey(item.student)
                    val currentSelection = manualSelections[selectionKey]
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(TABLE_ROW_HEIGHT)
                            .padding(horizontal = 12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = (index + 1).toString(),
                            color = Color.White.copy(alpha = 0.9f),
                            modifier = Modifier.width(TABLE_NO_WIDTH),
                            fontSize = 13.sp
                        )
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = item.student.name,
                                color = Color.White,
                                maxLines = 2,
                                overflow = TextOverflow.Ellipsis,
                                fontSize = 13.sp,
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                        StatusSelector(
                            item = item,
                            selected = currentSelection,
                            onSelect = { status -> onStatusSelected(item, status) }
                        )
                    }
                    Box(modifier = Modifier.fillMaxWidth().height(1.dp).background(PrayerTableDividerColor))
                }
            }
        }
    }
}

@Composable
private fun StatusSelector(
    item: TeacherPrayerItem,
    selected: String?,
    onSelect: (String) -> Unit
) {
    val enabled = item.canSelect
    Row(
        modifier = Modifier.width(TABLE_STATUS_SECTION_WIDTH),
        horizontalArrangement = Arrangement.spacedBy(6.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        val options = listOf(STATUS_PRAY, STATUS_NOT_PRAY, STATUS_PERMIT, STATUS_HALANGAN)
        options.forEach { opt ->
            val picked = selected == opt
            val background = if (picked) Color.White.copy(alpha = 0.22f) else Color.Transparent
            val border = if (picked) Color.White.copy(alpha = 0.34f) else Color.White.copy(alpha = 0.18f)
            Box(
                modifier = Modifier
                    .weight(1f)
                    .height(30.dp)
                    .background(background, RoundedCornerShape(10.dp))
                    .border(1.dp, border, RoundedCornerShape(10.dp))
                    .clickable(enabled = enabled) { onSelect(opt) },
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = when (opt) {
                        STATUS_PRAY -> "S"
                        STATUS_NOT_PRAY -> "TS"
                        STATUS_PERMIT -> "I"
                        else -> "H"
                    },
                    color = if (enabled) Color.White else Color.White.copy(alpha = 0.45f),
                    fontWeight = if (picked) FontWeight.Bold else FontWeight.Medium,
                    fontSize = 12.sp
                )
            }
        }
    }
}

@Composable
private fun HistoryContent(
    rows: List<TeacherPrayerHistoryRow>,
    formatter: SimpleDateFormat
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp),
        colors = CardDefaults.cardColors(containerColor = LenteraGlassCard),
        border = androidx.compose.foundation.BorderStroke(1.dp, LenteraGlassBorder),
        shape = RoundedCornerShape(18.dp)
    ) {
        if (rows.isEmpty()) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text("Belum ada riwayat.", color = Color.White.copy(alpha = 0.85f))
            }
        } else {
            LazyColumn(modifier = Modifier.fillMaxSize().padding(12.dp)) {
                items(rows) { row ->
                    val dateLabel = if (row.date > 0) formatter.format(Date(row.date)) else "-"
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = row.studentName,
                                color = Color.White,
                                fontWeight = FontWeight.SemiBold,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                            Text(
                                text = "${row.studentNisn} • $dateLabel",
                                color = Color.White.copy(alpha = 0.68f),
                                fontSize = 12.sp,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                        }
                        Text(
                            text = row.statusLabel,
                            color = Color.White,
                            fontWeight = FontWeight.Medium,
                            fontSize = 12.sp
                        )
                    }
                    Box(modifier = Modifier.fillMaxWidth().height(1.dp).background(PrayerTableDividerColor))
                }
            }
        }
    }
}

private fun countEffectiveStatuses(
    items: List<TeacherPrayerItem>,
    manualSelections: Map<String, String>,
    target: String
): Int {
    return items.count { item ->
        val key = teacherPrayerIdentityKey(item.student)
        val manual = manualSelections[key]
        val effective = manual ?: item.status
        effective == target
    }
}

private fun teacherPrayerIdentityKey(student: com.satupintu.mobile.data.model.Student): String {
    return listOf(student.recordId, student.nisn, student.id, student.username)
        .map { it.trim() }
        .firstOrNull { it.isNotBlank() }
        .orEmpty()
}
