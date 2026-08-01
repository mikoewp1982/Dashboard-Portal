param(
    [ValidateSet("all", "gas", "edulock")]
    [string]$App = "all"
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$finalDir = Join-Path $repoRoot "..\Apk Release\Final"
$publicApkDir = Join-Path $repoRoot "public\apk"
$manifestPath = Join-Path $publicApkDir "apk-manifest.json"

$targets = @(
    @{
        Key = "edulock"
        FileName = "EduLock-studentRelease.apk"
    },
    @{
        Key = "gas"
        FileName = "GAS-Siswa-release.apk"
    }
)

if (-not (Test-Path $finalDir)) {
    throw "Folder sumber tidak ditemukan: $finalDir"
}

if (-not (Test-Path $publicApkDir)) {
    throw "Folder tujuan tidak ditemukan: $publicApkDir"
}

$selectedTargets = if ($App -eq "all") {
    $targets
} else {
    $targets | Where-Object { $_.Key -eq $App }
}

$manifestFiles = @{}
if (Test-Path $manifestPath) {
    try {
        $existingManifest = Get-Content -Path $manifestPath -Raw | ConvertFrom-Json
        if ($existingManifest -and $existingManifest.files) {
            foreach ($prop in $existingManifest.files.PSObject.Properties) {
                $manifestFiles[$prop.Name] = $prop.Value
            }
        }
    }
    catch {
    }
}

foreach ($target in $selectedTargets) {
    $sourcePath = Join-Path $finalDir $target.FileName
    $destinationPath = Join-Path $publicApkDir $target.FileName

    if (-not (Test-Path $sourcePath)) {
        throw "File sumber tidak ditemukan: $sourcePath"
    }

    Copy-Item -Path $sourcePath -Destination $destinationPath -Force

    $sourceInfo = Get-Item $sourcePath
    $destinationInfo = Get-Item $destinationPath
    $hash = (Get-FileHash -Algorithm SHA256 $destinationPath).Hash

    $manifestFiles[$target.FileName] = @{
        sha256 = $hash
        sizeBytes = $destinationInfo.Length
        sizeMB = [math]::Round($destinationInfo.Length / 1MB, 2)
        lastModified = $sourceInfo.LastWriteTime.ToString("s")
    }

    Write-Host ""
    Write-Host "APK berhasil disinkronkan:" -ForegroundColor Cyan
    Write-Host "  App        : $($target.Key)"
    Write-Host "  Sumber     : $sourcePath"
    Write-Host "  Tujuan     : $destinationPath"
    Write-Host "  Ukuran     : $([math]::Round($destinationInfo.Length / 1MB, 2)) MB"
    Write-Host "  Modified   : $($sourceInfo.LastWriteTime)"
    Write-Host "  SHA256     : $hash"
}

$manifest = @{
    updatedAt = (Get-Date).ToString("s")
    files = $manifestFiles
}

$manifest | ConvertTo-Json -Depth 6 | Set-Content -Path $manifestPath -Encoding UTF8

Write-Host ""
Write-Host "Langkah berikutnya:" -ForegroundColor Yellow
Write-Host "1. Cek git diff/status untuk file APK di web/public/apk"
Write-Host "2. Stage file APK yang berubah"
Write-Host "3. Commit dan push ke main agar App Hosting merollout versi terbaru"
