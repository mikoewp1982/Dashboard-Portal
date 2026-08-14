<#
.SYNOPSIS
  FILE PAKEM — Deploy APK EduLock / GAS siswa versi baru ke web publik + Final folder + sync manifest
  TUNGGAL (public/apk/apk-manifest.json) AGAR HALAMAN TUTORIAL DOWNLOAD TIDAK PERNAH KESASAR LAGI.

.DESCRIPTION
  SOP 10 LANGKAH OTOMATIS — JALANKAN INI SETIAP KALI SELESAI assembleXXXRelease APK BARU.
  Sebelum fix permanent getApkDownloadHref.ts (2026-08-06), ada DUA lokasi apk-manifest.json
  yang harus di-sync manual → sering kesasar salah satu. SEKARANG SUDAH SATU SUMBER BENAR:
    SUMBER MANIFEST TUNGGAL = web/public/apk/apk-manifest.json
  getApkDownloadHref.ts baca LANGSUNG dari file ini via fs.readFileSync, halaman /gas/install
  & /edulock/install prerender dari manifest ini SAAT npm run build berjalan.
  Jadi script ini cukup update manifest INI SAJA → build web → nama file download versi TERBARU
  100% muncul di URL tutorial — tidak akan pernah kesasar lagi.

  File ini = "file pakem" yang diminta. Untuk menjalankan:
    opsi 1 (auto isi parameter untuk GAS / EduLock yang sudah kita pakai):
      cd D:\Dashboard Portal\web\scripts ; .\Ship-Apk-Baru.ps1 -Preset EduLock -SourceApk "D:\Dashboard Portal\native-mobile-edulock\app\build\outputs\apk\student\release\EduLock-studentRelease.apk" -VersionName "1.3.6" -VersionCode 32
      cd D:\Dashboard Portal\web\scripts ; .\Ship-Apk-Baru.ps1 -Preset GasSiswa -SourceApk "D:\Dashboard Portal\native-mobile-gas\app\build\outputs\apk\siswa\release\app-siswa-release.apk" -VersionName "1.0.39-siswa" -VersionCode 23036
    opsi 2 (manual semua parameter / preset custom):
      cd D:\Dashboard Portal\web\scripts ; .\Ship-Apk-Baru.ps1 -SourceApk <path> -TargetFileName GAS-Siswa-release.apk -VersionName 1.0.XX-siswa -VersionCode 230XX -PackageName com.satupintu.mobile.siswa

.NOTES
  Setelah script ini exit 0, SELALU jalankan LANGKAH MANUAL BERIKUTNYA (jangan lupa):
    1) cd D:\Dashboard Portal\web ; npm run build          ← build ulang static pages tutorial
    2) QA cek local: buka /gas/install & /edulock/install → pastikan versi & nama file cocok
    3) Update 3 catatan pegangan (BUILD_LOG / CHANGELOG / CHECKLIST_PERUBAHAN_APK_TERKINI)
    4) git add . ; git commit -m "feat(apk): ship ..." ; git push origin main
#>

[CmdletBinding(DefaultParameterSetName="Preset")]
param(
  [Parameter(Mandatory=$true, ParameterSetName="Preset")]
  [ValidateSet("EduLock","GasSiswa")]
  [string]$Preset,

  [Parameter(Mandatory=$true, ParameterSetName="Preset")]
  [Parameter(Mandatory=$true, ParameterSetName="Manual")]
  [string]$SourceApk,

  [Parameter(Mandatory=$true, ParameterSetName="Preset")]
  [Parameter(Mandatory=$true, ParameterSetName="Manual")]
  [string]$VersionName,

  [Parameter(Mandatory=$true, ParameterSetName="Preset")]
  [Parameter(Mandatory=$true, ParameterSetName="Manual")]
  [int]$VersionCode,

  [Parameter(Mandatory=$true, ParameterSetName="Manual")]
  [string]$TargetFileName,

  [Parameter(Mandatory=$true, ParameterSetName="Manual")]
  [string]$PackageName
)

$ErrorActionPreference = "Stop"

function Write-Step($msg)  { Write-Host "`n==> STEP: $msg" -ForegroundColor Cyan }
function Write-OK($msg)    { Write-Host "    [OK] $msg" -ForegroundColor Green }
function Write-Warn($msg)  { Write-Host "    [WARN] $msg" -ForegroundColor Yellow }
function Write-Fail($msg)  { Write-Host "    [FAIL] $msg" -ForegroundColor Red ; exit 1 }

# ---- Resolve preset ----
if ($PSCmdlet.ParameterSetName -eq "Preset") {
  switch ($Preset) {
    "EduLock" {
      $TargetFileName = "EduLock-studentRelease.apk"
      $PackageName    = "com.sekolah.edulock"
    }
    "GasSiswa" {
      $TargetFileName = "GAS-Siswa-release.apk"
      $PackageName    = "com.satupintu.mobile.siswa"
    }
  }
  Write-Host "`n=== Preset dipilih: $Preset (TargetFileName=$TargetFileName, PackageName=$PackageName) ===" -ForegroundColor Magenta
}

# ---- Lokasi folder (relative ke ROOT repo D:\Dashboard Portal) ----
$ROOT           = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)   # scripts dir -> web -> ROOT
$WEB_APK_DIR    = Join-Path $ROOT "web\public\apk"
$FINAL_DIR      = Join-Path $ROOT "Apk Release\Final"
$MANIFEST_PATH  = Join-Path $WEB_APK_DIR "apk-manifest.json"

# ====== VALIDASI AWAL ======
Write-Step "Validasi awal input + file"

if (-not (Test-Path $SourceApk)) { Write-Fail "Source APK TIDAK DITEMUKAN: $SourceApk" }
$srcItem = Get-Item $SourceApk
if ($srcItem.Extension -ne ".apk") { Write-Fail "SourceApk bukan file .apk: $SourceApk" }

if (-not (Test-Path $WEB_APK_DIR))   { Write-Fail "Folder web/public/apk TIDAK ADA: $WEB_APK_DIR" }
if (-not (Test-Path $FINAL_DIR))     { Write-Fail "Folder Apk Release/Final TIDAK ADA: $FINAL_DIR" }
if (-not (Test-Path $MANIFEST_PATH)) { Write-Fail "apk-manifest.json TIDAK ADA: $MANIFEST_PATH" }

if ($TargetFileName -notmatch '\.apk$') { Write-Fail "TargetFileName harus berakhiran .apk" }
if ([string]::IsNullOrWhiteSpace($VersionName)) { Write-Fail "VersionName kosong" }
if ($VersionCode -le 0) { Write-Fail "VersionCode harus > 0" }

Write-OK "Input valid. Source APK: $($srcItem.FullName) ($($srcItem.Length) bytes)"

# ====== HITUNG SHA256 + SIZE ======
Write-Step "Hitung SHA256 & size APK source"
$shaObj   = Get-FileHash -Algorithm SHA256 -Path $srcItem.FullName
$sha256   = $shaObj.Hash.ToUpperInvariant()
$sizeB    = $srcItem.Length
$sizeMB   = [math]::Round($sizeB / 1MB, 2)
$lastMod  = $srcItem.LastWriteTimeUtc.ToString("yyyy-MM-ddTHH:mm:ss")
Write-OK "SHA256      = $sha256"
Write-OK "Size Bytes  = $sizeB  (~ $sizeMB MB)"
Write-OK "LastModified= $lastMod (UTC source)"

# ====== SIAPKAN NAMA ARSIP VERSIONED ======
if ($Preset -eq "EduLock")         { $archivePrefix = "EduLock" }
elseif ($Preset -eq "GasSiswa")    { $archivePrefix = "GAS-Siswa" }
else                               { $archivePrefix = [System.IO.Path]::GetFileNameWithoutExtension($TargetFileName) }
$archiveName = "$archivePrefix-$VersionName-$VersionCode.apk"

# ====== COPY 1: web/public/apk/<TargetFileName> ======
Write-Step "Copy 1/4 -> web/public/apk/$TargetFileName"
$webDest = Join-Path $WEB_APK_DIR $TargetFileName
Copy-Item -Path $srcItem.FullName -Destination $webDest -Force
$verify = Get-Item $webDest
if ($verify.Length -ne $sizeB) { Write-Fail "Copy ke web gagal (size mismatch $($verify.Length) vs expected $sizeB)" }
Write-OK "Tersimpan: $webDest"

# ====== COPY 2: web/public/apk/<archive versioned filename> ======
Write-Step "Copy 2/4 -> web/public/apk/<versioned filename>"
$webVersionedDest = Join-Path $WEB_APK_DIR $archiveName
Copy-Item -Path $srcItem.FullName -Destination $webVersionedDest -Force
$verifyVersioned = Get-Item $webVersionedDest
if ($verifyVersioned.Length -ne $sizeB) { Write-Fail "Copy ke web versioned gagal (size mismatch $($verifyVersioned.Length) vs expected $sizeB)" }
Write-OK "Tersimpan: $webVersionedDest"

# ====== COPY 3: Apk Release/Final/<TargetFileName> (default install manual) ======
Write-Step "Copy 3/4 -> Apk Release/Final/<default filename>"
$finalDefault = Join-Path $FINAL_DIR $TargetFileName
Copy-Item -Path $srcItem.FullName -Destination $finalDefault -Force
$v2 = Get-Item $finalDefault
if ($v2.Length -ne $sizeB) { Write-Fail "Copy Final default gagal (size mismatch)" }
Write-OK "Tersimpan: $finalDefault"

# ====== COPY 4: Apk Release/Final/<prefix>-<VersionName>-<VersionCode>.apk (arsip history) ======
Write-Step "Copy 4/4 -> Apk Release/Final/<versioned archive filename>"
$finalArchive = Join-Path $FINAL_DIR $archiveName
Copy-Item -Path $srcItem.FullName -Destination $finalArchive -Force
$v3 = Get-Item $finalArchive
if ($v3.Length -ne $sizeB) { Write-Fail "Copy Final arsip gagal (size mismatch)" }
Write-OK "Tersimpan: $finalArchive (arsip prefix = $archivePrefix)"

# ====== UPDATE MANIFEST TUNGGAL: web/public/apk/apk-manifest.json ======
Write-Step "Update SUMBER MANIFEST TUNGGAL: web/public/apk/apk-manifest.json"
# Baca paksa via .NET File byte-level: hindari bug Encoding BOM PowerShell 5.
# Kita TIDAK pakai Get-Content -Encoding UTF8 karena behavior BOM-nya tidak konsisten.
[byte[]]$manBytes = [System.IO.File]::ReadAllBytes($MANIFEST_PATH)
$manHasBom = $manBytes.Length -ge 3 -and $manBytes[0] -eq 239 -and $manBytes[1] -eq 187 -and $manBytes[2] -eq 191
if ($manHasBom) {
  $manBytesNoBom = New-Object byte[] ($manBytes.Length - 3)
  [Array]::Copy($manBytes, 3, $manBytesNoBom, 0, $manBytesNoBom.Length)
  $manifestRaw = [System.Text.Encoding]::UTF8.GetString($manBytesNoBom)
} else {
  $manifestRaw = [System.Text.Encoding]::UTF8.GetString($manBytes)
}
# Safety: trim juga BOM level string (0xFEFF) jika masih ada sisa.
if ($manifestRaw.StartsWith([char]0xFEFF)) {
  $manifestRaw = $manifestRaw.TrimStart([char]0xFEFF)
}
try {
  $manifest = $manifestRaw | ConvertFrom-Json
} catch {
  Write-Fail "Gagal parse apk-manifest.json JSON: $_"
}

# — Isi updatedAt global dengan saat ini (UTC agar konsisten) —
$manifest.updatedAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss")

# — Tambahkan / overwrite entry files.TargetFileName + archive versioned filename —
if (-not ($manifest | Get-Member -Name "files" -MemberType Properties)) {
  $manifest | Add-Member -NotePropertyName "files" -NotePropertyValue ([pscustomobject]@{}) -Force
}
$entry = [pscustomobject]@{
  lastModified = $lastMod
  packageName  = $PackageName
  sizeMB       = $sizeMB
  sha256       = $sha256
  versionName  = $VersionName
  versionCode  = $VersionCode
  sizeBytes    = $sizeB
}
# Untuk GAS ada tambahan signerSha256 yang fixed (hardcode sesuai penandatanganan kita bersama)
if ($Preset -eq "GasSiswa" -or $PackageName -eq "com.satupintu.mobile.siswa") {
  $entry | Add-Member -NotePropertyName "signerSha256" `
                      -NotePropertyValue "64738955225d36c64990ebadfba9f2aad03e17739522630466621f0a1eb31f63" -Force
}
$manifest.files | Add-Member -NotePropertyName $TargetFileName -NotePropertyValue $entry -Force

$archiveEntry = [pscustomobject]@{
  lastModified = $lastMod
  packageName  = $PackageName
  sizeMB       = $sizeMB
  sha256       = $sha256
  versionName  = $VersionName
  versionCode  = $VersionCode
  sizeBytes    = $sizeB
}
if ($Preset -eq "GasSiswa" -or $PackageName -eq "com.satupintu.mobile.siswa") {
  $archiveEntry | Add-Member -NotePropertyName "signerSha256" `
                             -NotePropertyValue "64738955225d36c64990ebadfba9f2aad03e17739522630466621f0a1eb31f63" -Force
}
$manifest.files | Add-Member -NotePropertyName $archiveName -NotePropertyValue $archiveEntry -Force

# — Tulis kembali JSON dengan indent 4 (PAKSA UTF-8 TANPA BOM / NO BOM via .NET API) —
# PowerShell 5 Set-Content -Encoding UTF8 SELALU menambah BOM → bikin JSON.parse Node.js FAIL.
# Jadi HARUS pakai System.IO.File.WriteAllText + UTF8Encoding(false) agar TIDAK ADA BOM.
$jsonOut = $manifest | ConvertTo-Json -Depth 10
$utf8NoBom = [System.Text.UTF8Encoding]::new($false)
[System.IO.File]::WriteAllText($MANIFEST_PATH, $jsonOut, $utf8NoBom)
Write-OK "Manifest diupdate. updatedAt=$($manifest.updatedAt), entry=$TargetFileName + $archiveName (UTF-8 NO BOM - aman untuk Node.js JSON.parse)"

# ====== VERIFIKASI AKHIR: semua SHA256 di 4 lokasi file + 2 entry manifest SAMA ======
Write-Step "Verifikasi akhir SHA256 di 4 file copy + 2 entry manifest cocok"
$hashWeb    = (Get-FileHash -Algorithm SHA256 $webDest).Hash.ToUpperInvariant()
$hashWebVer = (Get-FileHash -Algorithm SHA256 $webVersionedDest).Hash.ToUpperInvariant()
$hashFinal1 = (Get-FileHash -Algorithm SHA256 $finalDefault).Hash.ToUpperInvariant()
$hashFinal2 = (Get-FileHash -Algorithm SHA256 $finalArchive).Hash.ToUpperInvariant()
$hashManifestEntry = ($manifest.files | Select-Object -ExpandProperty $TargetFileName).sha256
$hashManifestArchive = ($manifest.files | Select-Object -ExpandProperty $archiveName).sha256

if ($hashWeb -ne $sha256)    { Write-Fail "SHA web/public/apk tidak cocok: $hashWeb vs source $sha256" }
if ($hashWebVer -ne $sha256) { Write-Fail "SHA web/public/apk versioned tidak cocok: $hashWebVer vs source $sha256" }
if ($hashFinal1 -ne $sha256) { Write-Fail "SHA Final default tidak cocok" }
if ($hashFinal2 -ne $sha256) { Write-Fail "SHA Final arsip tidak cocok" }
if ($hashManifestEntry -ne $sha256) { Write-Fail "SHA di manifest entry tidak cocok: $hashManifestEntry vs source $sha256" }
if ($hashManifestArchive -ne $sha256) { Write-Fail "SHA di manifest archive tidak cocok: $hashManifestArchive vs source $sha256" }
Write-OK "SHA256 SAMA di semua 4 file copy + 2 manifest entry. URL tutorial akan mengambil file versi terbaru ✅"

# ====== RINGKASAN OUTPUT ======
Write-Host ""
Write-Host "============================================================" -ForegroundColor DarkGreen
Write-Host " 🎉 FILE PAKEM SHIP APK SELESAI - SEMUA LANGKAH OTOMATIS OK    " -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor DarkGreen
Write-Host ""
Write-Host "  Preset       : $Preset (Manual parameter mode jika kosong)"
Write-Host "  Package      : $PackageName"
Write-Host "  VersionName  : $VersionName"
Write-Host "  VersionCode  : $VersionCode"
Write-Host "  SHA256       : $sha256"
Write-Host "  Size         : $sizeB bytes, ${sizeMB} MB"
Write-Host ""
Write-Host "  Artefak tersimpan di 4 lokasi + manifest:"
Write-Host "   [1] $webDest"
Write-Host "   [2] $webVersionedDest - file versi terbaru untuk URL tutorial siswa"
Write-Host "   [3] $finalDefault  - default filename install manual"
Write-Host "   [4] $finalArchive - arsip history"
Write-Host "   [5] $MANIFEST_PATH  - SUMBER MANIFEST TUNGGAL (src/data/apk-manifest.json duplicate dihapus permanen)"
Write-Host ""
Write-Host "----------------------------------------------------------------" -ForegroundColor Yellow
Write-Host "  !  4 LANGKAH MANUAL BERIKUTNYA - JANGAN DILEWATI:              " -ForegroundColor Yellow
Write-Host "----------------------------------------------------------------" -ForegroundColor Yellow
Write-Host "   [1] Build web ulang - static prerender halaman tutorial:"
Write-Host "       cd D:\Dashboard Portal\web ; npm run build"
Write-Host "   [2] QA cek build lokal: buka .next/server/app/gas/install.html dan edulock/install - cari nomor versi, pastikan TEPAT = ${VersionName}-${VersionCode}"
Write-Host "   [3] Update 3 catatan pegangan SOP:"
Write-Host "         - Apk Release/Pegangan Build APK/GAS/BUILD_LOG.md  - jika GAS"
Write-Host "         - Apk Release/Pegangan Build APK/Edulock/BUILD_LOG.md - jika EduLock"
Write-Host "         - Apk Release/Pegangan Build APK/CHECKLIST_PERUBAHAN_APK_TERKINI.md"
Write-Host "   [4] Deploy live: git add . ; git commit -m `"feat(apk): ship ${TargetFileName} ${VersionName} (${VersionCode})`" ; git push origin main"
Write-Host "============================================================"
exit 0
