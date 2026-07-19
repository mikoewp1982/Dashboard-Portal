package com.satupintu.mobile.ui.screens

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.airbnb.lottie.compose.*
import com.satupintu.mobile.R
import com.satupintu.mobile.data.model.PetAchievement
import com.satupintu.mobile.data.model.PetQuest
import com.satupintu.mobile.data.model.VirtualPet
import com.satupintu.mobile.data.model.isDeadByRule
import com.satupintu.mobile.data.model.lowestVitalScore
import com.satupintu.mobile.ui.viewmodel.StudentActionCard
import com.satupintu.mobile.ui.viewmodel.StudentCriteriaCard
import com.satupintu.mobile.ui.viewmodel.VirtualPetViewModel
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlin.math.roundToInt

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun VirtualPetScreen(
    studentId: String,
    schoolId: String = "",
    onBack: () -> Unit,
    onOpenLiteracy: () -> Unit,
    onOpenAttendance: () -> Unit,
    onOpenPrayer: () -> Unit,
    onOpenSevenHabits: () -> Unit,
    onOpenLibrary: () -> Unit,
    viewModel: VirtualPetViewModel = viewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }
    val scope = rememberCoroutineScope()
    var showAttendancePrayerDialog by remember { mutableStateOf(false) }

    LaunchedEffect(studentId, schoolId) {
        viewModel.loadPet(studentId, schoolId)
    }

    LaunchedEffect(uiState.message) {
        uiState.message?.let {
            snackbarHostState.showSnackbar(it, duration = SnackbarDuration.Short)
            viewModel.clearMessage()
        }
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        topBar = {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(
                        Brush.horizontalGradient(
                            listOf(
                                Color(0xFF0F2A43),
                                Color(0xFF0F7BFF)
                            )
                        )
                    )
            ) {
                TopAppBar(
                    title = { Text("Sahabat Belajar") },
                    navigationIcon = {
                        IconButton(onClick = onBack) {
                            Icon(Icons.Default.ArrowBack, contentDescription = "Kembali")
                        }
                    },
                    actions = {
                        if (uiState.pet != null) {
                            CoinDisplay(coins = uiState.pet!!.coins)
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = Color.Transparent,
                        titleContentColor = Color.White,
                        navigationIconContentColor = Color.White,
                        actionIconContentColor = Color.White
                    )
                )
            }
        }
    ) { padding ->
        val pageBackground = remember {
            Brush.verticalGradient(
                colors = listOf(
                    Color(0xFF12D6C6),
                    Color(0xFF0F7BFF),
                    Color(0xFF0F2A43)
                )
            )
        }
        Box(
            modifier = Modifier
                .padding(padding)
                .fillMaxSize()
                .background(pageBackground)
        ) {
            if (uiState.isLoading && uiState.pet == null) {
                CircularProgressIndicator(modifier = Modifier.align(Alignment.Center), color = Color.White)
            } else if (uiState.error != null && uiState.pet == null) {
                Text(
                    text = uiState.error!!,
                    color = Color(0xFFFFB4A9),
                    modifier = Modifier.align(Alignment.Center)
                )
            } else if (uiState.pet != null) {
                CompositionLocalProvider(LocalContentColor provides Color.White) {
                    val navigateAfterHint: (() -> Unit) -> Unit = { onNavigate ->
                        scope.launch {
                            delay(350)
                            onNavigate()
                        }
                    }
                    PetContent(
                        pet = uiState.pet!!,
                        achievements = uiState.achievements,
                        criteriaCards = uiState.criteriaCards,
                        actionCards = uiState.actionCards,
                        leaderboard = uiState.leaderboard,
                        onFeed = {
                            viewModel.feedPet(uiState.pet!!)
                            navigateAfterHint(onOpenLibrary)
                        },
                        onPlay = {
                            viewModel.playWithPet(uiState.pet!!)
                            navigateAfterHint(onOpenSevenHabits)
                        },
                        onSleep = {
                            viewModel.sleepPet(uiState.pet!!)
                            navigateAfterHint(onOpenLiteracy)
                        },
                        onStroke = {
                            viewModel.strokePet(uiState.pet!!)
                            showAttendancePrayerDialog = true
                        }
                    )
                }
            }
        }

        if (showAttendancePrayerDialog) {
            AlertDialog(
                onDismissRequest = { showAttendancePrayerDialog = false },
                title = { Text("Pilih Menu Kehadiran") },
                text = {
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text(
                            "Kebahagiaan pet mengikuti absensi sekolah, sedangkan kesehatan pet mengikuti presensi sholat."
                        )
                        Button(
                            onClick = {
                                showAttendancePrayerDialog = false
                                onOpenAttendance()
                            },
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text("Buka Absensi")
                        }
                        OutlinedButton(
                            onClick = {
                                showAttendancePrayerDialog = false
                                onOpenPrayer()
                            },
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text("Buka Presensi Sholat")
                        }
                    }
                },
                confirmButton = {},
                dismissButton = {
                    TextButton(onClick = { showAttendancePrayerDialog = false }) {
                        Text("Tutup")
                    }
                }
            )
        }
    }
}

@Composable
fun CoinDisplay(coins: Int) {
    Surface(
        shape = RoundedCornerShape(16.dp),
        color = Color(0xFFFFD700), // Gold
        modifier = Modifier.padding(end = 16.dp)
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = Icons.Default.Star,
                contentDescription = "Coins",
                tint = Color.White,
                modifier = Modifier.size(16.dp)
            )
            Spacer(modifier = Modifier.width(4.dp))
            Text(
                text = "$coins",
                fontWeight = FontWeight.Bold,
                color = Color.White
            )
        }
    }
}

@Composable
fun PetContent(
    pet: VirtualPet,
    achievements: List<PetAchievement>,
    criteriaCards: List<StudentCriteriaCard>,
    actionCards: List<StudentActionCard>,
    leaderboard: List<VirtualPet>,
    onFeed: () -> Unit,
    onPlay: () -> Unit,
    onSleep: () -> Unit,
    onStroke: () -> Unit
) {
    var selectedTab by remember { mutableStateOf(0) }
    val tabs = listOf("Status", "Pencapaian", "Peringkat")

    Column(modifier = Modifier.fillMaxSize()) {
        // Pet Avatar & Main Stats Area
        PetHeader(pet)

        // Tabs
        ScrollableTabRow(
            selectedTabIndex = selectedTab,
            edgePadding = 0.dp,
            containerColor = Color.Transparent,
            contentColor = Color.White,
            indicator = { tabPositions ->
                val currentTab = tabPositions[selectedTab]
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .wrapContentSize(Alignment.BottomStart)
                ) {
                    Box(
                        modifier = Modifier
                            .offset(x = currentTab.left)
                            .width(currentTab.width)
                            .height(3.dp)
                            .background(Color.White, RoundedCornerShape(999.dp))
                    )
                }
            }
        ) {
            tabs.forEachIndexed { index, title ->
                Tab(
                    selected = selectedTab == index,
                    onClick = { selectedTab = index },
                    selectedContentColor = Color.White,
                    unselectedContentColor = Color.White.copy(alpha = 0.7f),
                    text = { Text(title) }
                )
            }
        }

        // Tab Content
        Box(modifier = Modifier.weight(1f)) {
            when (selectedTab) {
                0 -> StatusTab(pet, actionCards, onFeed, onPlay, onSleep, onStroke)
                1 -> AchievementsTab(criteriaCards, achievements)
                2 -> LeaderboardTab(leaderboard, pet.id)
            }
        }
    }
}

@Composable
fun PetHeader(pet: VirtualPet) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color(0xFF0B1F33).copy(alpha = 0.22f))
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Level Bar
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(
                text = "Level ${pet.level}",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )
            Column(modifier = Modifier.weight(1f).padding(horizontal = 12.dp)) {
                val progress = pet.experiencePoints.toFloat() / (pet.level * 100f)
                LinearProgressIndicator(
                    progress = { progress },
                    modifier = Modifier.fillMaxWidth().height(8.dp).clip(RoundedCornerShape(4.dp)),
                )
                Text(
                    text = "${pet.experiencePoints}/${pet.level * 100} XP",
                    style = MaterialTheme.typography.bodySmall,
                    modifier = Modifier.align(Alignment.End)
                )
            }
        }

        Spacer(modifier = Modifier.height(4.dp))

        // Stats and avatar are separated vertically so progress bars never cover the pet.
        Column(
            modifier = Modifier.fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 4.dp)
            ) {
                PetStatusBar(
                    Icons.Default.ShoppingCart,
                    "Kenyang",
                    (100 - pet.hunger).coerceIn(0, 100),
                    Color(0xFF22C55E)
                )
                PetStatusBar(Icons.Default.Face, "Kebahagiaan", pet.happiness, Color(0xFFFF5A8A))
                PetStatusBar(Icons.Default.ThumbUp, "Energi", pet.energy, Color(0xFFFFC94A))
                PetStatusBar(Icons.Default.Favorite, "Kesehatan", pet.health, Color(0xFF38BDF8))
            }

            Spacer(modifier = Modifier.height(10.dp))

            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(170.dp),
                contentAlignment = Alignment.Center
            ) {
                PetVisuals(pet = pet)
            }

            Text(
                text = pet.petName,
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.Bold,
                color = Color.White,
                modifier = Modifier.padding(top = 4.dp)
            )
        }
    }
}

@Composable
fun StatusTab(
    pet: VirtualPet,
    actionCards: List<StudentActionCard>,
    onFeed: () -> Unit,
    onPlay: () -> Unit,
    onSleep: () -> Unit,
    onStroke: () -> Unit
) {
    val petState = remember(pet.status, pet.hunger, pet.happiness, pet.energy, pet.health, pet.manualReviveUntil) {
        determinePetState(pet)
    }

    val badgeLabel = when (petState) {
        PetState.Dead -> "MATI"
        PetState.Sekarat -> "SEKARAT"
        PetState.Sick -> "SAKIT"
        PetState.Healthy -> "SEHAT"
        PetState.Sleeping -> "TIDUR"
        PetState.Eating -> "MAKAN"
    }

    val badgeColor = when (petState) {
        PetState.Dead -> Color.Black
        PetState.Sekarat -> Color(0xFFB91C1C)
        PetState.Sick -> Color(0xFFF97316)
        PetState.Healthy -> Color(0xFF16A34A)
        PetState.Sleeping -> Color(0xFF6366F1)
        PetState.Eating -> Color(0xFF0891B2)
    }

    val motivationTitle = when (petState) {
        PetState.Sick -> "Pet Mulai Lemah"
        PetState.Sekarat -> "Alarm Merah Pet Aktif"
        PetState.Dead -> "Pet Tidak Bisa Melanjutkan"
        PetState.Healthy -> "Pet Dalam Kondisi Prima"
        PetState.Sleeping -> "Pet Sedang Beristirahat"
        PetState.Eating -> "Pet Sedang Mengisi Energi"
    }

    val motivationMessage = when (petState) {
        PetState.Sick -> "Jangan tunda target harian. Naikkan aktivitas inti supaya pet kembali stabil."
        PetState.Sekarat -> "Bahaya. Jika target hari ini tetap diabaikan, pet bisa masuk fase mati."
        PetState.Dead -> "Pet sudah tumbang dan perlu bantuan admin atau wali kelas untuk dipulihkan."
        PetState.Healthy -> "Pertahankan ritme belajar dan kebiasaan baik agar pet tetap tumbuh."
        PetState.Sleeping -> "Mode ini belum aktif penuh. Jaga aktivitas harian agar pet tetap aman."
        PetState.Eating -> "Mode ini belum aktif penuh. Pastikan target bacaan tetap tercapai."
    }

    val motivationAccent = when (petState) {
        PetState.Sick -> Color(0xFFF97316)
        PetState.Sekarat -> Color(0xFFEF4444)
        PetState.Dead -> Color(0xFF111827)
        PetState.Healthy -> Color(0xFF16A34A)
        PetState.Sleeping -> Color(0xFF6366F1)
        PetState.Eating -> Color(0xFF0891B2)
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Status Badge
        Surface(
            color = badgeColor,
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier.padding(bottom = 8.dp)
        ) {
            Text(
                text = badgeLabel,
                color = Color.White,
                style = MaterialTheme.typography.labelMedium,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp)
            )
        }

        Spacer(modifier = Modifier.height(10.dp))

        StatusMotivationCard(
            title = motivationTitle,
            message = motivationMessage,
            accentColor = motivationAccent,
            icon = when (petState) {
                PetState.Sick -> Icons.Default.MonitorHeart
                PetState.Sekarat -> Icons.Default.Campaign
                PetState.Dead -> Icons.Default.HeartBroken
                PetState.Healthy -> Icons.Default.EmojiEmotions
                PetState.Sleeping -> Icons.Default.Bedtime
                PetState.Eating -> Icons.Default.Restaurant
            }
        )

        Spacer(modifier = Modifier.height(24.dp))

        // Action Buttons or Dead Message
        val isDead = petState == PetState.Dead

        if (isDead) {
            Card(
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer),
                modifier = Modifier.fillMaxWidth().padding(horizontal = 8.dp)
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Icon(
                        imageVector = Icons.Default.Info,
                        contentDescription = "Dead",
                        tint = MaterialTheme.colorScheme.onErrorContainer,
                        modifier = Modifier.size(32.dp)
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Sahabat Belajarmu Telah Mati",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onErrorContainer
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "Hubungi Admin atau Guru Wali Kelas untuk memulihkan (Revive) pet kamu.",
                        style = MaterialTheme.typography.bodyMedium,
                        textAlign = TextAlign.Center,
                        color = MaterialTheme.colorScheme.onErrorContainer
                    )
                }
            }
        } else {
            if (petState == PetState.Sekarat) {
                CriticalWarningCard(actionCards = actionCards)
                Spacer(modifier = Modifier.height(16.dp))
            }

            val clickHandler: (StudentActionCard) -> Unit = { card ->
                when (card.key) {
                    "literacy_task" -> onSleep()
                    "attendance" -> onStroke()
                    "habits" -> onPlay()
                    "library" -> onFeed()
                    else -> onSleep()
                }
            }

            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(
                    text = "Status Aktivitas Hari Ini",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )

                val sortedCards = remember(actionCards) {
                    val order = listOf("literacy_task", "attendance", "habits", "library")
                    actionCards.sortedWith(compareBy { card -> order.indexOf(card.key).let { if (it == -1) Int.MAX_VALUE else it } })
                }

                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    sortedCards.chunked(2).forEach { rowItems ->
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            rowItems.forEach { card ->
                                Box(modifier = Modifier.weight(1f)) {
                                    ActionStatusCard(
                                        card = card,
                                        onClick = { clickHandler(card) }
                                    )
                                }
                            }
                            if (rowItems.size == 1) {
                                Spacer(modifier = Modifier.weight(1f))
                            }
                        }
                    }
                }
            }
        }
        
        Spacer(modifier = Modifier.height(24.dp))
        TipsCard()
    }
}

@Composable
private fun StatusMotivationCard(
    title: String,
    message: String,
    accentColor: Color,
    icon: ImageVector
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = Color(0xCC08111F)),
        border = androidx.compose.foundation.BorderStroke(1.dp, accentColor.copy(alpha = 0.6f))
    ) {
        Row(
            modifier = Modifier.padding(14.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(accentColor.copy(alpha = 0.18f))
                    .border(1.dp, accentColor.copy(alpha = 0.55f), RoundedCornerShape(12.dp)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = accentColor
                )
            }
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.ExtraBold,
                    color = Color.White
                )
                Text(
                    text = message,
                    style = MaterialTheme.typography.bodySmall,
                    color = Color.White.copy(alpha = 0.86f)
                )
            }
        }
    }
}

@Composable
private fun CriticalWarningCard(
    actionCards: List<StudentActionCard>
) {
    val weakestCards = remember(actionCards) {
        actionCards
            .sortedBy { it.progress.coerceIn(0, 100) }
            .take(2)
            .filter { it.progress < 60 }
    }

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = Color(0xCC450A0A)),
        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFFCA5A5))
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.WarningAmber,
                    contentDescription = null,
                    tint = Color(0xFFFCA5A5),
                    modifier = Modifier.size(28.dp)
                )
                Column {
                    Text(
                        text = "Pet Dalam Kondisi Sekarat",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.ExtraBold,
                        color = Color.White
                    )
                    Text(
                        text = "Segera tuntaskan target hari ini agar pet tidak masuk fase mati.",
                        style = MaterialTheme.typography.bodySmall,
                        color = Color.White.copy(alpha = 0.88f)
                    )
                }
            }

            if (weakestCards.isNotEmpty()) {
                Text(
                    text = "Prioritas penyelamatan: ${weakestCards.joinToString(", ") { it.title }}",
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFFFECACA)
                )
                weakestCards.forEach { card ->
                    Text(
                        text = "- ${card.title}: ${card.status}",
                        style = MaterialTheme.typography.bodySmall,
                        color = Color.White.copy(alpha = 0.88f)
                    )
                }
            }
        }
    }
}

@Composable
private fun ActionStatusCard(
    card: StudentActionCard,
    onClick: () -> Unit
) {
    val accent = when (card.key) {
        "literacy_task" -> Color(0xFFFF5A8A)
        "attendance" -> Color(0xFFFFC94A)
        "habits" -> Color(0xFF38BDF8)
        "library" -> Color(0xFF22C55E)
        else -> Color(0xFF94A3B8)
    }

    val icon = when (card.key) {
        "literacy_task" -> Icons.Default.MenuBook
        "attendance" -> Icons.Default.FactCheck
        "habits" -> Icons.Default.Bolt
        "library" -> Icons.Default.LocalLibrary
        else -> Icons.Default.Info
    }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .heightIn(min = 108.dp)
            .clickable(onClick = onClick),
        colors = CardDefaults.cardColors(containerColor = Color(0xCC08111F)),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(34.dp)
                            .clip(RoundedCornerShape(12.dp))
                            .background(accent.copy(alpha = 0.22f))
                            .border(1.dp, accent.copy(alpha = 0.55f), RoundedCornerShape(12.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = icon,
                            contentDescription = null,
                            tint = accent,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                    Spacer(modifier = Modifier.width(10.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = card.title,
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.Bold,
                            color = Color.White,
                            maxLines = 1
                        )
                        Text(
                            text = card.subtitle,
                            style = MaterialTheme.typography.labelSmall,
                            color = Color.White.copy(alpha = 0.72f),
                            maxLines = 1
                        )
                    }
                }
                Icon(
                    imageVector = Icons.Default.ChevronRight,
                    contentDescription = null,
                    tint = Color.White.copy(alpha = 0.75f)
                )
            }

            LinearProgressIndicator(
                progress = { card.progress.coerceIn(0, 100) / 100f },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(8.dp)
                    .clip(RoundedCornerShape(999.dp)),
                color = accent,
                trackColor = Color(0xFF132238)
            )

            Text(
                text = card.status,
                style = MaterialTheme.typography.bodySmall,
                color = Color.White.copy(alpha = 0.84f),
                maxLines = 2
            )
        }
    }
}

@Composable
fun PetStatusBar(
    icon: ImageVector,
    label: String,
    value: Int,
    color: Color,
    valueText: String = "$value%"
) {
    val clampedValue = value.coerceIn(0, 100)
    val containerColor = Color(0xCC08111F)
    val trackColor = Color(0xFF132238)
    val labelColor = Color(0xFFF8FAFC)
    val valueColor = Color(0xFFFFFFFF)

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp)
            .clip(RoundedCornerShape(14.dp))
            .background(containerColor)
            .border(width = 1.dp, color = color.copy(alpha = 0.55f), shape = RoundedCornerShape(14.dp))
            .padding(horizontal = 10.dp, vertical = 8.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(icon, contentDescription = null, tint = color, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                    text = label,
                    style = MaterialTheme.typography.labelMedium,
                    fontWeight = FontWeight.Bold,
                    color = labelColor
                )
            }
            Text(
                text = valueText,
                style = MaterialTheme.typography.labelMedium,
                fontWeight = FontWeight.ExtraBold,
                color = valueColor
            )
        }
        Spacer(modifier = Modifier.height(6.dp))
        LinearProgressIndicator(
            progress = { clampedValue / 100f },
            modifier = Modifier
                .fillMaxWidth()
                .height(8.dp)
                .clip(RoundedCornerShape(4.dp)),
            color = color,
            trackColor = trackColor
        )
    }
}

@Composable
fun StatItem(icon: ImageVector, label: String, value: Int, color: Color) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Icon(icon, contentDescription = null, tint = color, modifier = Modifier.size(24.dp))
        Spacer(modifier = Modifier.height(4.dp))
        Text(text = "$value%", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
        Text(text = label, style = MaterialTheme.typography.bodySmall)
    }
}

@Composable
fun ActionButton(label: String, icon: ImageVector, color: Color, effect: String, onClick: () -> Unit) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Button(
            onClick = onClick,
            colors = ButtonDefaults.buttonColors(containerColor = color),
            shape = CircleShape,
            contentPadding = PaddingValues(0.dp),
            modifier = Modifier.size(56.dp)
        ) {
            Icon(icon, contentDescription = label, tint = Color.White)
        }
        Spacer(modifier = Modifier.height(4.dp))
        Text(text = label, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Bold)
        Text(text = effect, style = MaterialTheme.typography.labelSmall, color = Color.Gray)
    }
}

@Composable
fun TipsCard() {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = "Tips Sahabat Belajar:",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary
            )
            Spacer(modifier = Modifier.height(8.dp))
            InfoBox(
                icon = Icons.Default.Info,
                title = "Cara Merawat Pet:",
                content = """
                    - Kenyang: Baca buku di E-Perpus (>1 jam)
                    - Kebahagiaan: Absensi Datang & Pulang Tepat Waktu
                    - Energi: Lakukan kebiasaan 7 KAIH
                    - Kesehatan: Lakukan Presensi Sholat
                    - Literasi: Mendukung progres belajar pet
                """.trimIndent(),
                backgroundColor = Color(0xFF2196F3).copy(alpha = 0.2f),
                borderColor = Color(0xFF2196F3),
                iconColor = Color(0xFF2196F3)
            )
            Spacer(modifier = Modifier.height(16.dp))
            InfoBox(
                icon = Icons.Default.Star,
                title = "Pro Tip:",
                content = "Konsistensi adalah kunci! Lakukan semua aktivitas di atas setiap hari agar pet kamu selalu sehat dan mencapai level maksimal.",
                backgroundColor = Color(0xFFFFC107).copy(alpha = 0.2f),
                borderColor = Color(0xFFFFC107),
                iconColor = Color(0xFFFFC107)
            )
        }
    }
}

@Composable
fun InfoBox(icon: ImageVector, title: String, content: String, backgroundColor: Color, borderColor: Color, iconColor: Color) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(backgroundColor, RoundedCornerShape(8.dp))
            .border(1.dp, borderColor, RoundedCornerShape(8.dp))
            .padding(12.dp)
    ) {
        Icon(icon, contentDescription = null, tint = iconColor, modifier = Modifier.size(24.dp))
        Spacer(modifier = Modifier.width(12.dp))
        Column {
            Text(text = title, fontWeight = FontWeight.Bold, color = iconColor)
            Text(text = content, style = MaterialTheme.typography.bodySmall)
        }
    }
}

// --- STATE MACHINE PATTERN (Game Engine Logic) ---
// Pola ini meniru cara kerja game engine seperti Unity/Godot
// Setiap kondisi Pet dipisahkan menjadi "State" yang jelas.

sealed class PetState {
    object Dead : PetState()
    object Sekarat : PetState()
    object Sick : PetState()
    object Healthy : PetState()
    object Sleeping : PetState() // Persiapan untuk fitur masa depan
    object Eating : PetState()   // Persiapan untuk fitur masa depan
}

fun determinePetState(pet: VirtualPet): PetState {
    val lowestVital = pet.lowestVitalScore()

    return when {
        pet.isDeadByRule() -> PetState.Dead
        lowestVital < 30 -> PetState.Sekarat
        lowestVital < 60 -> PetState.Sick
        // Nanti bisa ditambahkan logika: if (isSleeping) PetState.Sleeping
        else -> PetState.Healthy
    }
}

@Composable
fun PetVisuals(
    pet: VirtualPet // Pass full object to determine state
) {
    val currentState = remember(pet.status, pet.hunger, pet.happiness, pet.energy, pet.health, pet.manualReviveUntil) {
        determinePetState(pet)
    }

    val (animRes, animSpeed) = when (currentState) {
        is PetState.Sekarat -> Pair(R.raw.pet_sekarat, 0.75f)
        is PetState.Sick -> Pair(R.raw.pet_sakit, 0.85f)
        is PetState.Healthy -> Pair(R.raw.cute_cat, 1.0f)
        is PetState.Sleeping -> Pair(R.raw.cute_cat, 0.0f)
        is PetState.Eating -> Pair(R.raw.cute_cat, 1.0f)
        is PetState.Dead -> Pair(R.raw.pet_mati, 1.0f)
    }

    val composition by rememberLottieComposition(LottieCompositionSpec.RawRes(animRes))
    val animatable = rememberLottieAnimatable()

    LaunchedEffect(composition, currentState, animSpeed) {
        val c = composition ?: return@LaunchedEffect
        animatable.animate(
            composition = c,
            iterations = LottieConstants.IterateForever,
            speed = animSpeed
        )
    }

    val density = LocalDensity.current
    val infiniteTransition = rememberInfiniteTransition(label = "pet-effects")
    val pulseFast by infiniteTransition.animateFloat(
        initialValue = 0.65f,
        targetValue = 1.0f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 520, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulse-fast"
    )
    val pulseSlow by infiniteTransition.animateFloat(
        initialValue = 0.85f,
        targetValue = 1.0f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 1200, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulse-slow"
    )
    val shakeUnit by infiniteTransition.animateFloat(
        initialValue = -1f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 70, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "shake"
    )

    val baseScale = when (currentState) {
        is PetState.Dead -> 1.0f
        is PetState.Sekarat -> 0.96f + (pulseFast * 0.03f)
        is PetState.Sick -> 0.985f + (pulseSlow * 0.01f)
        else -> 1.0f
    }

    val shakeAmplitudePx = with(density) {
        when (currentState) {
            is PetState.Sekarat -> 8.dp.toPx()
            is PetState.Sick -> 2.dp.toPx()
            else -> 0.dp.toPx()
        }
    }
    val shakeOffset = (shakeUnit * shakeAmplitudePx).roundToInt()

    Box(contentAlignment = Alignment.Center, modifier = Modifier.fillMaxSize()) {
        if (composition == null) {
            CircularProgressIndicator()
        } else {
            LottieAnimation(
                composition = composition,
                progress = { animatable.progress },
                modifier = Modifier
                    .fillMaxSize()
                    .offset { IntOffset(shakeOffset, 0) }
                    .scale(baseScale)
            )

            when (currentState) {
                is PetState.Healthy -> {
                    Box(
                        modifier = Modifier
                            .matchParentSize()
                            .background(Color(0xFF0F7BFF).copy(alpha = 0.06f))
                    )
                }
                is PetState.Sick -> {
                    Box(
                        modifier = Modifier
                            .matchParentSize()
                            .background(Color(0xFFF97316).copy(alpha = 0.10f))
                            .border(
                                width = 1.dp,
                                color = Color(0xFFF97316).copy(alpha = 0.22f),
                                shape = RoundedCornerShape(18.dp)
                            )
                    )
                }
                is PetState.Sekarat -> {
                    Box(
                        modifier = Modifier
                            .matchParentSize()
                            .background(Color(0xFFEF4444).copy(alpha = 0.10f + (pulseFast * 0.10f)))
                            .border(
                                width = 2.dp,
                                color = Color(0xFFEF4444).copy(alpha = 0.45f + (pulseFast * 0.25f)),
                                shape = RoundedCornerShape(18.dp)
                            )
                    )
                }
                is PetState.Dead -> {
                    Box(
                        modifier = Modifier
                            .matchParentSize()
                            .background(Color.Black.copy(alpha = 0.18f))
                    )
                }
                else -> Unit
            }
        }
    }
}



@Composable
fun QuestsTab(
    quests: List<PetQuest>,
    onClaim: (PetQuest) -> Unit,
    onDebugProgress: (PetQuest) -> Unit
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        items(quests) { quest ->
            QuestItem(quest, onClaim, onDebugProgress)
        }
    }
}

@Composable
fun QuestItem(
    quest: PetQuest,
    onClaim: (PetQuest) -> Unit,
    onDebugProgress: (PetQuest) -> Unit
) {
    Card(
        colors = CardDefaults.cardColors(
            containerColor = if (quest.completed) MaterialTheme.colorScheme.surfaceVariant.copy(alpha=0.5f) else MaterialTheme.colorScheme.surfaceVariant
        ),
        modifier = Modifier
            .fillMaxWidth()
            .alpha(if (quest.completed) 0.6f else 1f)
            .clickable { onDebugProgress(quest) }
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(quest.title, fontWeight = FontWeight.Bold)
                    Text(quest.description, style = MaterialTheme.typography.bodySmall)
                }
                if (quest.completed) {
                    Icon(Icons.Default.Check, "Selesai", tint = Color.Green)
                } else {
                    Surface(
                        color = MaterialTheme.colorScheme.primaryContainer,
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text(
                            "${quest.reward} XP",
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                            style = MaterialTheme.typography.labelSmall
                        )
                    }
                }
            }
            Spacer(modifier = Modifier.height(12.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                LinearProgressIndicator(
                    progress = { quest.progress.toFloat() / quest.target.toFloat() },
                    modifier = Modifier.weight(1f).height(8.dp).clip(RoundedCornerShape(4.dp))
                )
                Spacer(modifier = Modifier.width(12.dp))
                Text("${quest.progress}/${quest.target}")
            }
            if (!quest.completed && quest.progress >= quest.target) {
                Spacer(modifier = Modifier.height(12.dp))
                Button(
                    onClick = { onClaim(quest) },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("Klaim Hadiah")
                }
            }
        }
    }
}

@Composable
fun AchievementsTab(
    criteriaCards: List<StudentCriteriaCard>,
    achievements: List<PetAchievement>
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Text(
                    text = "4 Kriteria Siswa Hari Ini",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
                Text(
                    text = "Semua kartu ini membaca aktivitas nyata siswa hari ini, bukan angka hiasan.",
                    style = MaterialTheme.typography.bodySmall,
                    color = Color.White.copy(alpha = 0.78f)
                )
            }
        }

        item {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                criteriaCards.chunked(2).forEach { rowItems ->
                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        rowItems.forEach { criteria ->
                            StudentCriteriaItem(
                                criteria = criteria,
                                modifier = Modifier.weight(1f)
                            )
                        }
                        if (rowItems.size == 1) {
                            Spacer(modifier = Modifier.weight(1f))
                        }
                    }
                }
            }
        }

        item {
            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Text(
                    text = "Lencana Pencapaian",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
                Text(
                    text = "Lencana akan terbuka otomatis saat kriteria aktivitasnya terpenuhi.",
                    style = MaterialTheme.typography.bodySmall,
                    color = Color.White.copy(alpha = 0.78f)
                )
            }
        }

        item {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                achievements.chunked(3).forEach { rowItems ->
                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        rowItems.forEach { achievement ->
                            AchievementItem(
                                achievement = achievement,
                                modifier = Modifier.weight(1f)
                            )
                        }
                        repeat(3 - rowItems.size) {
                            Spacer(modifier = Modifier.weight(1f))
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun StudentCriteriaItem(
    criteria: StudentCriteriaCard,
    modifier: Modifier = Modifier
) {
    val accentColor = when (criteria.key) {
        "literacy" -> Color(0xFF22C55E)
        "attendance" -> Color(0xFFFFC94A)
        "habits" -> Color(0xFF60A5FA)
        "prayer" -> Color(0xFFFF5A8A)
        else -> Color(0xFFE2E8F0)
    }
    val cardColor = Color(0xCC08111F)

    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(containerColor = cardColor),
        border = androidx.compose.foundation.BorderStroke(
            width = 1.dp,
            color = accentColor.copy(alpha = if (criteria.isAchieved) 0.9f else 0.45f)
        )
    ) {
        Column(
            modifier = Modifier.padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = criteria.title,
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                    Text(
                        text = criteria.subtitle,
                        style = MaterialTheme.typography.bodySmall,
                        color = Color.White.copy(alpha = 0.74f)
                    )
                }
                Surface(
                    color = if (criteria.isAchieved) accentColor else Color.White.copy(alpha = 0.1f),
                    shape = RoundedCornerShape(999.dp)
                ) {
                    Text(
                        text = if (criteria.isAchieved) "Tercapai" else "Proses",
                        color = if (criteria.isAchieved) Color(0xFF08111F) else Color.White,
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp)
                    )
                }
            }

            LinearProgressIndicator(
                progress = { criteria.progress.coerceIn(0, 100) / 100f },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(8.dp)
                    .clip(RoundedCornerShape(999.dp)),
                color = accentColor,
                trackColor = Color.White.copy(alpha = 0.12f)
            )

            Text(
                text = criteria.status,
                style = MaterialTheme.typography.bodySmall,
                color = Color.White.copy(alpha = 0.88f)
            )
        }
    }
}

@Composable
fun AchievementItem(
    achievement: PetAchievement,
    modifier: Modifier = Modifier
) {
    Card(
        colors = CardDefaults.cardColors(
            containerColor = if (achievement.unlocked) Color(0xCC0F766E) else Color(0xCC08111F)
        ),
        border = androidx.compose.foundation.BorderStroke(
            width = 1.dp,
            color = if (achievement.unlocked) Color(0xFF5EEAD4) else Color.White.copy(alpha = 0.12f)
        ),
        modifier = modifier.aspectRatio(1f)
    ) {
        Column(
            modifier = Modifier.padding(8.dp).fillMaxSize(),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Icon(
                imageVector = achievementIcon(achievement.icon, achievement.unlocked),
                contentDescription = null,
                tint = if (achievement.unlocked) Color(0xFFF8FAFC) else Color(0xFF94A3B8),
                modifier = Modifier.size(32.dp)
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = achievement.title,
                style = MaterialTheme.typography.labelMedium,
                fontWeight = FontWeight.Bold,
                textAlign = TextAlign.Center,
                color = Color.White
            )
            Text(
                text = achievement.description,
                style = MaterialTheme.typography.labelSmall,
                textAlign = TextAlign.Center,
                minLines = 2,
                maxLines = 3,
                color = Color.White.copy(alpha = 0.78f)
            )
        }
    }
}

private fun achievementIcon(icon: String, unlocked: Boolean): ImageVector {
    if (!unlocked) return Icons.Default.Lock
    return when (icon) {
        "menu_book" -> Icons.Default.MenuBook
        "fact_check" -> Icons.Default.FactCheck
        "bolt" -> Icons.Default.Bolt
        "favorite" -> Icons.Default.Favorite
        else -> Icons.Default.Star
    }
}

@Composable
fun LeaderboardTab(leaderboard: List<VirtualPet>, currentPetId: String) {
    val containerColor = Color(0xCC08111F)
    val trackColor = Color(0xFF132238)
    val borderColor = Color.White.copy(alpha = 0.10f)

    val currentIndex = remember(leaderboard, currentPetId) {
        leaderboard.indexOfFirst { it.id == currentPetId }
    }
    val currentRank = if (currentIndex >= 0) currentIndex + 1 else null
    val currentPet = if (currentIndex >= 0) leaderboard.getOrNull(currentIndex) else null

    LazyColumn(
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        item {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text(
                    text = "Peringkat",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )

                if (currentRank != null && currentPet != null) {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = containerColor),
                        shape = RoundedCornerShape(16.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(12.dp),
                            verticalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = "Peringkat Kamu",
                                        style = MaterialTheme.typography.labelMedium,
                                        fontWeight = FontWeight.Bold,
                                        color = Color.White.copy(alpha = 0.78f)
                                    )
                                    Text(
                                        text = currentPet.petName.ifBlank { "Saya" },
                                        style = MaterialTheme.typography.titleSmall,
                                        fontWeight = FontWeight.Bold,
                                        color = Color.White,
                                        maxLines = 1
                                    )
                                }
                                Surface(
                                    color = Color(0xFF0F7BFF).copy(alpha = 0.22f),
                                    shape = RoundedCornerShape(999.dp),
                                    modifier = Modifier.border(1.dp, Color(0xFF0F7BFF).copy(alpha = 0.55f), RoundedCornerShape(999.dp))
                                ) {
                                    Text(
                                        text = "#$currentRank",
                                        style = MaterialTheme.typography.labelLarge,
                                        fontWeight = FontWeight.ExtraBold,
                                        color = Color.White,
                                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                                    )
                                }
                            }

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                LeaderboardMetricChip("Level", "${currentPet.level}")
                                LeaderboardMetricChip("XP", "${currentPet.experiencePoints}")
                                LeaderboardMetricChip("Coins", "${currentPet.coins}")
                            }

                            LinearProgressIndicator(
                                progress = { (currentPet.experiencePoints.toFloat() / (currentPet.level * 100f)).coerceIn(0f, 1f) },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(8.dp)
                                    .clip(RoundedCornerShape(999.dp)),
                                color = Color(0xFF22C55E),
                                trackColor = trackColor
                            )
                        }
                    }
                }
            }
        }

        if (leaderboard.isEmpty()) {
            item {
                Box(modifier = Modifier.fillMaxWidth().padding(32.dp), contentAlignment = Alignment.Center) {
                    Text(
                        "Belum ada data peringkat.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = Color.White.copy(alpha = 0.85f)
                    )
                }
            }
        } else {
            itemsIndexed(items = leaderboard, key = { _, item -> item.id }) { index, item ->
                val rank = index + 1
                val isCurrentUser = item.id == currentPetId
                val rankAccent = when (rank) {
                    1 -> Color(0xFFFFD700)
                    2 -> Color(0xFFC0C0C0)
                    3 -> Color(0xFFCD7F32)
                    else -> Color(0xFF0F7BFF)
                }

                Card(
                    colors = CardDefaults.cardColors(containerColor = containerColor),
                    shape = RoundedCornerShape(16.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .border(
                            width = if (isCurrentUser) 1.dp else 1.dp,
                            color = if (isCurrentUser) Color(0xFF0F7BFF).copy(alpha = 0.70f) else borderColor,
                            shape = RoundedCornerShape(16.dp)
                        )
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(36.dp)
                                .clip(CircleShape)
                                .background(rankAccent.copy(alpha = 0.18f))
                                .border(1.dp, rankAccent.copy(alpha = 0.55f), CircleShape),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "#$rank",
                                style = MaterialTheme.typography.labelLarge,
                                fontWeight = FontWeight.ExtraBold,
                                color = Color.White
                            )
                        }

                        Spacer(modifier = Modifier.width(12.dp))

                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = item.petName.ifBlank { "Siswa" },
                                style = MaterialTheme.typography.bodyLarge,
                                fontWeight = FontWeight.Bold,
                                color = Color.White,
                                maxLines = 1
                            )
                            Text(
                                text = "Level ${item.level} • ${item.experiencePoints} XP • ${item.coins} Coins",
                                style = MaterialTheme.typography.bodySmall,
                                color = Color.White.copy(alpha = 0.72f)
                            )
                        }

                        if (rank <= 3) {
                            Icon(
                                imageVector = Icons.Default.EmojiEvents,
                                contentDescription = null,
                                tint = rankAccent,
                                modifier = Modifier.size(22.dp)
                            )
                        } else if (isCurrentUser) {
                            Icon(
                                imageVector = Icons.Default.Person,
                                contentDescription = null,
                                tint = Color(0xFF0F7BFF),
                                modifier = Modifier.size(22.dp)
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun LeaderboardMetricChip(
    label: String,
    value: String
) {
    Surface(
        color = Color(0xFF132238),
        shape = RoundedCornerShape(999.dp),
        modifier = Modifier.border(1.dp, Color.White.copy(alpha = 0.10f), RoundedCornerShape(999.dp))
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Text(
                text = label,
                style = MaterialTheme.typography.labelSmall,
                fontWeight = FontWeight.Bold,
                color = Color.White.copy(alpha = 0.70f)
            )
            Text(
                text = value,
                style = MaterialTheme.typography.labelSmall,
                fontWeight = FontWeight.ExtraBold,
                color = Color.White
            )
        }
    }
}
