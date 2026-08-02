param(
    [ValidateSet("all", "gas", "edulock")]
    [string]$App = "all"
)

$ErrorActionPreference = "Stop"

function Get-AndroidBuildToolPath {
    param(
        [Parameter(Mandatory = $true)]
        [string]$ToolName
    )

    $sdkRoot = Join-Path $env:LOCALAPPDATA "Android\Sdk\build-tools"
    if (-not (Test-Path $sdkRoot)) {
        throw "Android build-tools tidak ditemukan: $sdkRoot"
    }

    $candidates = Get-ChildItem -Path $sdkRoot -Directory |
        Sort-Object Name -Descending |
        ForEach-Object { Join-Path $_.FullName $ToolName } |
        Where-Object { Test-Path $_ }

    if (-not $candidates) {
        throw "Tool Android tidak ditemukan: $ToolName"
    }

    return $candidates[0]
}

function Get-ApkMetadata {
    param(
        [Parameter(Mandatory = $true)]
        [string]$ApkPath
    )

    $aaptPath = Get-AndroidBuildToolPath -ToolName "aapt.exe"
    $badging = & $aaptPath dump badging $ApkPath
    $packageLine = $badging | Select-String "package: name='([^']+)' versionCode='([^']+)' versionName='([^']+)'"

    if (-not $packageLine) {
        throw "Gagal membaca metadata APK: $ApkPath"
    }

    return @{
        packageName = $packageLine.Matches[0].Groups[1].Value
        versionCode = [int]$packageLine.Matches[0].Groups[2].Value
        versionName = $packageLine.Matches[0].Groups[3].Value
    }
}

function Get-ApkSignerDigest {
    param(
        [Parameter(Mandatory = $true)]
        [string]$ApkPath
    )

    $apksignerPath = Get-AndroidBuildToolPath -ToolName "apksigner.bat"
    $stdoutPath = [System.IO.Path]::GetTempFileName()
    $stderrPath = [System.IO.Path]::GetTempFileName()

    try {
        $process = Start-Process `
            -FilePath $apksignerPath `
            -ArgumentList @("verify", "--print-certs", "`"$ApkPath`"") `
            -RedirectStandardOutput $stdoutPath `
            -RedirectStandardError $stderrPath `
            -NoNewWindow `
            -PassThru `
            -Wait

        $signerOutput = @()
        if (Test-Path $stdoutPath) {
            $signerOutput += Get-Content -Path $stdoutPath
        }
        if (Test-Path $stderrPath) {
            $signerOutput += Get-Content -Path $stderrPath
        }

        $digestLine = $signerOutput | Select-String "Signer #1 certificate SHA-256 digest:\s*([0-9a-fA-F]+)"

        if ($process.ExitCode -ne 0 -and -not $digestLine) {
            throw "Gagal membaca signature APK: $ApkPath"
        }

        if (-not $digestLine) {
            return $null
        }

        return $digestLine.Matches[0].Groups[1].Value.ToLowerInvariant()
    }
    finally {
        Remove-Item -Path $stdoutPath, $stderrPath -Force -ErrorAction SilentlyContinue
    }
}

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
        ExpectedPackageName = "com.satupintu.mobile.siswa"
        MinimumVersionCode = 23004
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

    $sourceInfo = Get-Item $sourcePath
    $sourceHash = (Get-FileHash -Algorithm SHA256 $sourcePath).Hash
    $sourceMeta = $null
    $destinationMeta = $null
    $sourceSignerDigest = $null
    $destinationSignerDigest = $null
    $destinationHash = $null

    if ($target.Key -eq "gas") {
        $sourceMeta = Get-ApkMetadata -ApkPath $sourcePath
        if ($sourceMeta.packageName -ne $target.ExpectedPackageName) {
            throw "Package GAS siswa tidak sesuai. Ditemukan '$($sourceMeta.packageName)', seharusnya '$($target.ExpectedPackageName)'."
        }

        if ($sourceMeta.versionCode -lt $target.MinimumVersionCode) {
            throw "versionCode GAS siswa terlalu rendah ($($sourceMeta.versionCode)). Minimal yang diizinkan sekarang adalah $($target.MinimumVersionCode) agar update siswa tidak tertolak."
        }

        $sourceSignerDigest = Get-ApkSignerDigest -ApkPath $sourcePath
    }

    if (Test-Path $destinationPath) {
        $destinationHash = (Get-FileHash -Algorithm SHA256 $destinationPath).Hash

        if ($target.Key -eq "gas") {
            $destinationMeta = Get-ApkMetadata -ApkPath $destinationPath
            $destinationSignerDigest = Get-ApkSignerDigest -ApkPath $destinationPath

            if ($sourceMeta.versionCode -lt $destinationMeta.versionCode) {
                throw "versionCode GAS siswa turun dari $($destinationMeta.versionCode) ke $($sourceMeta.versionCode). Sinkronisasi dibatalkan."
            }

            if ($sourceMeta.versionCode -eq $destinationMeta.versionCode -and $sourceHash -ne $destinationHash) {
                throw "versionCode GAS siswa tetap $($sourceMeta.versionCode) tetapi isi APK berbeda. Naikkan versionCode dulu sebelum sinkronisasi."
            }

            if ($sourceSignerDigest -and $destinationSignerDigest -and $sourceSignerDigest -ne $destinationSignerDigest) {
                throw "Signature APK GAS siswa berbeda dari file publik sebelumnya. Sinkronisasi dibatalkan."
            }
        }
    }

    Copy-Item -Path $sourcePath -Destination $destinationPath -Force

    $destinationInfo = Get-Item $destinationPath
    $hash = (Get-FileHash -Algorithm SHA256 $destinationPath).Hash

    $manifestFiles[$target.FileName] = @{
        sha256 = $hash
        sizeBytes = $destinationInfo.Length
        sizeMB = [math]::Round($destinationInfo.Length / 1MB, 2)
        lastModified = $sourceInfo.LastWriteTime.ToString("s")
    }

    if ($sourceMeta) {
        $manifestFiles[$target.FileName].packageName = $sourceMeta.packageName
        $manifestFiles[$target.FileName].versionCode = $sourceMeta.versionCode
        $manifestFiles[$target.FileName].versionName = $sourceMeta.versionName
    }

    if ($sourceSignerDigest) {
        $manifestFiles[$target.FileName].signerSha256 = $sourceSignerDigest
    }

    Write-Host ""
    Write-Host "APK berhasil disinkronkan:" -ForegroundColor Cyan
    Write-Host "  App        : $($target.Key)"
    Write-Host "  Sumber     : $sourcePath"
    Write-Host "  Tujuan     : $destinationPath"
    Write-Host "  Ukuran     : $([math]::Round($destinationInfo.Length / 1MB, 2)) MB"
    Write-Host "  Modified   : $($sourceInfo.LastWriteTime)"
    Write-Host "  SHA256     : $hash"
    if ($sourceMeta) {
        Write-Host "  Package    : $($sourceMeta.packageName)"
        Write-Host "  Version    : $($sourceMeta.versionName) ($($sourceMeta.versionCode))"
    }
    if ($sourceSignerDigest) {
        Write-Host "  Signer     : $sourceSignerDigest"
    }
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
