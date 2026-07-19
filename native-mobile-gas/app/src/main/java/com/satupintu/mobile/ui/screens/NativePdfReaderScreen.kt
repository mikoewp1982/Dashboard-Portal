package com.satupintu.mobile.ui.screens

import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Color as AndroidColor
import android.graphics.pdf.PdfRenderer
import android.net.Uri
import android.os.ParcelFileDescriptor
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.produceState
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.BufferedInputStream
import java.io.File
import java.io.FileOutputStream
import java.net.HttpURLConnection
import java.net.URL

private data class PdfRenderSession(
    val file: File,
    val descriptor: ParcelFileDescriptor,
    val renderer: PdfRenderer,
    val pageCount: Int
) {
    fun close() {
        runCatching { renderer.close() }
        runCatching { descriptor.close() }
    }
}

private val ReaderBackgroundBrush = Brush.verticalGradient(
    colors = listOf(
        androidx.compose.ui.graphics.Color(0xFFF5F7FB),
        androidx.compose.ui.graphics.Color(0xFFEAF1FF)
    )
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NativePdfReaderScreen(
    url: String,
    title: String,
    onBack: () -> Unit
) {
    val context = LocalContext.current
    var session by remember(url) { mutableStateOf<PdfRenderSession?>(null) }
    var isLoading by remember(url) { mutableStateOf(true) }
    var errorMessage by remember(url) { mutableStateOf<String?>(null) }
    var currentPage by remember(url) { mutableIntStateOf(0) }
    var reloadKey by remember(url) { mutableIntStateOf(0) }
    val scrollState = rememberScrollState()
    val latestSession = rememberUpdatedState(session)

    DisposableEffect(url) {
        onDispose {
            latestSession.value?.close()
        }
    }

    LaunchedEffect(url, reloadKey) {
        session?.close()
        session = null
        currentPage = 0
        isLoading = true
        errorMessage = null

        val result = runCatching {
            withContext(Dispatchers.IO) {
                openPdfSession(context.cacheDir, url)
            }
        }

        result.onSuccess {
            session = it
            isLoading = false
        }.onFailure { throwable ->
            errorMessage = throwable.message ?: "Gagal memuat buku digital."
            isLoading = false
        }
    }

    LaunchedEffect(currentPage) {
        scrollState.scrollTo(0)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = title,
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            maxLines = 1
                        )
                        val totalPages = session?.pageCount ?: 0
                        if (totalPages > 0) {
                            Text(
                                text = "Halaman ${currentPage + 1} dari $totalPages",
                                style = MaterialTheme.typography.labelSmall
                            )
                        }
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Kembali")
                    }
                },
                actions = {
                    IconButton(onClick = { reloadKey += 1 }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Muat ulang")
                    }
                }
            )
        },
        bottomBar = {
            val totalPages = session?.pageCount ?: 0
            if (!isLoading && errorMessage == null && totalPages > 0) {
                Surface(
                    shadowElevation = 6.dp,
                    tonalElevation = 2.dp
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .navigationBarsPadding()
                            .padding(horizontal = 16.dp, vertical = 12.dp)
                            .padding(bottom = 8.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        OutlinedButton(
                            onClick = { currentPage -= 1 },
                            enabled = currentPage > 0
                        ) {
                            Text("Sebelumnya")
                        }
                        Text(
                            text = "${currentPage + 1} / $totalPages",
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.SemiBold
                        )
                        Button(
                            onClick = { currentPage += 1 },
                            enabled = currentPage < totalPages - 1
                        ) {
                            Text("Berikutnya")
                        }
                    }
                }
            }
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(ReaderBackgroundBrush)
                .padding(paddingValues)
        ) {
            when {
                isLoading -> {
                    Column(
                        modifier = Modifier
                            .align(Alignment.Center)
                            .padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        CircularProgressIndicator()
                        Text(
                            text = "Menyiapkan buku untuk dibaca...",
                            modifier = Modifier.padding(top = 16.dp),
                            textAlign = TextAlign.Center
                        )
                    }
                }

                errorMessage != null -> {
                    ReaderErrorState(
                        message = errorMessage ?: "Gagal memuat buku digital.",
                        onRetry = { reloadKey += 1 },
                        onOpenOriginal = {
                            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                            context.startActivity(intent)
                        }
                    )
                }

                session != null -> {
                    BoxWithConstraints(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(16.dp)
                    ) {
                        val totalPages = session?.pageCount ?: 0
                        val targetWidthPx = constraints.maxWidth.coerceAtLeast(1)
                        val swipeThresholdPx = with(LocalDensity.current) { 72.dp.toPx() }
                        var horizontalDragOffset by remember(currentPage, totalPages) {
                            mutableFloatStateOf(0f)
                        }
                        val renderedPage by produceState<Bitmap?>(
                            initialValue = null,
                            key1 = session,
                            key2 = currentPage,
                            key3 = targetWidthPx
                        ) {
                            val activeSession = session
                            value = if (activeSession == null) {
                                null
                            } else {
                                withContext(Dispatchers.IO) {
                                    renderPdfPage(
                                        renderer = activeSession.renderer,
                                        pageIndex = currentPage,
                                        targetWidthPx = targetWidthPx
                                    )
                                }
                            }
                        }

                        if (renderedPage == null) {
                            CircularProgressIndicator(modifier = Modifier.align(Alignment.Center))
                        } else {
                            Card(
                                modifier = Modifier
                                    .fillMaxSize()
                                    .pointerInput(currentPage, totalPages) {
                                        detectHorizontalDragGestures(
                                            onHorizontalDrag = { change, dragAmount ->
                                                horizontalDragOffset += dragAmount
                                                change.consume()
                                            },
                                            onDragEnd = {
                                                when {
                                                    horizontalDragOffset <= -swipeThresholdPx && currentPage < totalPages - 1 -> {
                                                        currentPage += 1
                                                    }

                                                    horizontalDragOffset >= swipeThresholdPx && currentPage > 0 -> {
                                                        currentPage -= 1
                                                    }
                                                }
                                                horizontalDragOffset = 0f
                                            },
                                            onDragCancel = {
                                                horizontalDragOffset = 0f
                                            }
                                        )
                                    },
                                shape = RoundedCornerShape(20.dp),
                                colors = CardDefaults.cardColors(
                                    containerColor = androidx.compose.ui.graphics.Color.White
                                ),
                                elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .fillMaxSize()
                                        .verticalScroll(scrollState)
                                        .padding(12.dp),
                                    contentAlignment = Alignment.TopCenter
                                ) {
                                    Image(
                                        bitmap = renderedPage!!.asImageBitmap(),
                                        contentDescription = title,
                                        modifier = Modifier.fillMaxWidth()
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

@Composable
private fun ReaderErrorState(
    message: String,
    onRetry: () -> Unit,
    onOpenOriginal: () -> Unit
) {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(24.dp),
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = androidx.compose.ui.graphics.Color.White)
        ) {
            Column(
                modifier = Modifier.padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "Buku belum bisa dibuka secara native",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    textAlign = TextAlign.Center
                )
                Text(
                    text = message,
                    modifier = Modifier.padding(top = 12.dp),
                    textAlign = TextAlign.Center,
                    lineHeight = 20.sp
                )
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 20.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    OutlinedButton(
                        onClick = onOpenOriginal
                    ) {
                        Text("Buka Link Asli")
                    }
                    Button(
                        onClick = onRetry
                    ) {
                        Text("Coba Lagi")
                    }
                }
            }
        }
    }
}

private fun openPdfSession(cacheDir: File, sourceUrl: String): PdfRenderSession {
    val pdfFile = downloadPdfToCache(cacheDir, sourceUrl)
    val descriptor = ParcelFileDescriptor.open(pdfFile, ParcelFileDescriptor.MODE_READ_ONLY)
    val renderer = PdfRenderer(descriptor)
    return PdfRenderSession(
        file = pdfFile,
        descriptor = descriptor,
        renderer = renderer,
        pageCount = renderer.pageCount
    )
}

private fun downloadPdfToCache(cacheDir: File, sourceUrl: String): File {
    val readerDir = File(cacheDir, "lentera_reader").apply { mkdirs() }
    val targetFile = File(readerDir, "book_${sourceUrl.hashCode()}.pdf")
    if (targetFile.exists() && targetFile.length() > 0) {
        return targetFile
    }

    val candidates = buildDownloadCandidates(sourceUrl)
    var lastError: String? = null

    for (candidate in candidates) {
        val tempFile = File(readerDir, "tmp_${System.nanoTime()}.pdf")
        try {
            if (downloadCandidate(candidate, tempFile)) {
                if (targetFile.exists()) {
                    targetFile.delete()
                }
                if (!tempFile.renameTo(targetFile)) {
                    tempFile.copyTo(targetFile, overwrite = true)
                    tempFile.delete()
                }
                if (targetFile.length() > 0) {
                    return targetFile
                }
            }
        } catch (error: Exception) {
            lastError = error.message
        } finally {
            if (tempFile.exists()) {
                tempFile.delete()
            }
        }
    }

    throw IllegalStateException(lastError ?: "File PDF tidak bisa diunduh dari sumber buku.")
}

private fun buildDownloadCandidates(sourceUrl: String): List<String> {
    val cleaned = sourceUrl.trim()
    val normalized = cleaned
        .replace("/preview", "/view")
        .replace("/edit", "/view")

    val candidates = linkedSetOf(normalized)
    val fileId = extractDriveFileId(normalized)
    if (fileId != null) {
        candidates += "https://drive.usercontent.google.com/download?id=$fileId&export=download&confirm=t"
        candidates += "https://drive.google.com/uc?export=download&id=$fileId&confirm=t"
        candidates += "https://drive.google.com/uc?id=$fileId&export=download"
    }
    return candidates.toList()
}

private fun extractDriveFileId(url: String): String? {
    val fileMatch = Regex("/file/d/([a-zA-Z0-9_-]+)").find(url)
    if (fileMatch != null) {
        return fileMatch.groupValues[1]
    }

    return runCatching {
        Uri.parse(url).getQueryParameter("id")
    }.getOrNull()?.takeIf { it.isNotBlank() }
}

private fun downloadCandidate(url: String, outputFile: File): Boolean {
    val connection = URL(url).openConnection() as HttpURLConnection
    return try {
        connection.instanceFollowRedirects = true
        connection.connectTimeout = 15_000
        connection.readTimeout = 30_000
        connection.setRequestProperty("User-Agent", "Mozilla/5.0")
        connection.setRequestProperty("Accept", "application/pdf,*/*")
        connection.connect()

        val responseCode = connection.responseCode
        if (responseCode !in 200..299) {
            return false
        }

        BufferedInputStream(connection.inputStream).use { input ->
            input.mark(16)
            val header = ByteArray(5)
            val read = input.read(header)
            input.reset()

            val headerText = if (read > 0) {
                String(header, 0, read)
            } else {
                ""
            }
            val contentType = connection.contentType.orEmpty().lowercase()
            val looksLikePdf = contentType.contains("pdf") || headerText.startsWith("%PDF")
            if (!looksLikePdf) {
                return false
            }

            FileOutputStream(outputFile).use { output ->
                input.copyTo(output)
            }
        }

        outputFile.exists() && outputFile.length() > 0
    } finally {
        connection.disconnect()
    }
}

private fun renderPdfPage(
    renderer: PdfRenderer,
    pageIndex: Int,
    targetWidthPx: Int
): Bitmap {
    renderer.openPage(pageIndex).use { page ->
        val safeWidth = targetWidthPx.coerceAtLeast(1)
        val pageRatio = page.height.toFloat() / page.width.toFloat()
        val targetHeight = (safeWidth * pageRatio).toInt().coerceAtLeast(1)
        return Bitmap.createBitmap(safeWidth, targetHeight, Bitmap.Config.ARGB_8888).also { bitmap ->
            bitmap.eraseColor(AndroidColor.WHITE)
            page.render(bitmap, null, null, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY)
        }
    }
}
