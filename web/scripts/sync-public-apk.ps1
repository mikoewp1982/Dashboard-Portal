param(
    [ValidateSet("all", "gas", "edulock", "ortu")]
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
$finalV2Dir = Join-Path $repoRoot "..\Apk Release\Final_V2"
$finalV2GasDir = Join-Path $finalV2Dir "GAS"
$publicApkDir = Join-Path $repoRoot "public\apk"
$manifestPath = Join-Path $publicApkDir "apk-manifest.json"

$targets = @(
    @{
        Key = "edulock"
        ExpectedPackageName = "com.sekolah.edulock"
        MinimumVersionCode = 80
        ResolveSource = {
            $candidates = @(
                (Join-Path $finalV2Dir "EduLock_V2-1.3.60-86.apk"),
                (Join-Path $finalV2Dir "EduLock_V2-studentRelease.apk"),
                (Join-Path $finalDir "EduLock-studentRelease.apk")
            )
            foreach ($c in $candidates) {
                if (Test-Path $c) { return $c }
            }
            throw "File sumber EduLock tidak ditemukan di Final_V2 atau Final"
        }
        VersionedName = "EduLock_V2-1.3.60-86.apk"
        AliasNames = @("EduLock_V2-studentRelease.apk", "EduLock-studentRelease.apk")
        ObsoletePatterns = @("EduLock*.apk")
    },
    @{
        Key = "gas"
        ExpectedPackageName = "com.satupintu.mobile.siswa"
        MinimumVersionCode = 23090
        ResolveSource = {
            $candidates = @(
                (Join-Path $finalV2GasDir "GAS-Siswa-1.0.128-siswa-23125-DZUHUR-TIMEWINDOW-FIX-release.apk"),
                (Join-Path $finalV2GasDir "GAS-Siswa-1.0.128-siswa-23125.apk"),
                (Join-Path $finalV2GasDir "GAS-Siswa-release.apk"),
                (Join-Path $finalDir "GAS-Siswa-release.apk")
            )
            foreach ($c in $candidates) {
                if (Test-Path $c) { return $c }
            }
            throw "File sumber GAS Siswa tidak ditemukan di Final_V2\GAS atau Final"
        }
        VersionedName = "GAS-Siswa-1.0.128-siswa-23125.apk"
        AliasNames = @("GAS-Siswa-release.apk")
        ObsoletePatterns = @("GAS-Siswa*.apk")
    },
    @{
        Key = "ortu"
        ExpectedPackageName = "com.satupintu.mobile.ortu"
        MinimumVersionCode = 1000
        ResolveSource = {
            $candidates = @(
                (Join-Path $repoRoot "..\Apk Release\Orang Tua\GAS-OrangTua-1.0.2-ortu-1002.apk"),
                (Join-Path $repoRoot "..\Apk Release\Orang Tua\GAS-OrangTua-release.apk")
            )
            foreach ($c in $candidates) {
                if (Test-Path $c) { return $c }
            }
            throw "File sumber GAS Orang Tua tidak ditemukan di Apk Release\Orang Tua"
        }
        VersionedName = "GAS-OrangTua-1.0.2-ortu-1002.apk"
        AliasNames = @("GAS-OrangTua-release.apk")
        ObsoletePatterns = @("GAS-OrangTua*.apk", "GAS-OrangTua*.sha256")
    }
)

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
    $sourcePath = & $target.ResolveSource
    $sourceInfo = Get-Item $sourcePath
    $sourceHash = (Get-FileHash -Algorithm SHA256 $sourcePath).Hash
    $sourceMeta = Get-ApkMetadata -ApkPath $sourcePath

    if ($target.ExpectedPackageName -and $sourceMeta.packageName -ne $target.ExpectedPackageName) {
        throw "Package $($target.Key) tidak sesuai. Ditemukan '$($sourceMeta.packageName)', seharusnya '$($target.ExpectedPackageName)'."
    }

    if ($target.MinimumVersionCode -and $sourceMeta.versionCode -lt $target.MinimumVersionCode) {
        throw "versionCode $($target.Key) terlalu rendah ($($sourceMeta.versionCode)). Minimal $($target.MinimumVersionCode)."
    }

    $sourceSignerDigest = Get-ApkSignerDigest -ApkPath $sourcePath

    # Bersihkan file obsolete agar folder public/apk tetap slim sesuai PANDUAN_DEPLOY_WEB.md
    if ($target.ObsoletePatterns) {
        Get-ChildItem -Path $publicApkDir -File -ErrorAction SilentlyContinue | ForEach-Object {
            $file = $_
            $isObsolete = $false
            foreach ($pattern in $target.ObsoletePatterns) {
                if ($file.Name -like $pattern -and $file.Name -ne $target.VersionedName -and $target.AliasNames -notcontains $file.Name) {
                    $isObsolete = $true
                    break
                }
            }
            if ($isObsolete) {
                Write-Host "  Menghapus arsip lama: $($file.Name)" -ForegroundColor DarkGray
                $manifestFiles.Remove($file.Name)
                Remove-Item -Path $file.FullName -Force -ErrorAction SilentlyContinue
            }
        }
    }

    # Salin file versioned
    $versionedDest = Join-Path $publicApkDir $target.VersionedName
    Copy-Item -Path $sourcePath -Destination $versionedDest -Force
    $versionedInfo = Get-Item $versionedDest
    $versionedHash = (Get-FileHash -Algorithm SHA256 $versionedDest).Hash

    $manifestFiles[$target.VersionedName] = @{
        sha256 = $versionedHash
        sizeBytes = $versionedInfo.Length
        sizeMB = [math]::Round($versionedInfo.Length / 1MB, 2)
        lastModified = $sourceInfo.LastWriteTime.ToString("s")
        packageName = $sourceMeta.packageName
        versionCode = $sourceMeta.versionCode
        versionName = $sourceMeta.versionName
    }
    if ($sourceSignerDigest) {
        $manifestFiles[$target.VersionedName].signerSha256 = $sourceSignerDigest
    }

    # Salin alias-alias
    foreach ($alias in $target.AliasNames) {
        $aliasDest = Join-Path $publicApkDir $alias
        Copy-Item -Path $sourcePath -Destination $aliasDest -Force
        $aliasInfo = Get-Item $aliasDest
        $aliasHash = (Get-FileHash -Algorithm SHA256 $aliasDest).Hash

        $manifestFiles[$alias] = @{
            sha256 = $aliasHash
            sizeBytes = $aliasInfo.Length
            sizeMB = [math]::Round($aliasInfo.Length / 1MB, 2)
            lastModified = $sourceInfo.LastWriteTime.ToString("s")
            packageName = $sourceMeta.packageName
            versionCode = $sourceMeta.versionCode
            versionName = $sourceMeta.versionName
        }
        if ($sourceSignerDigest) {
            $manifestFiles[$alias].signerSha256 = $sourceSignerDigest
        }
    }

    Write-Host ""
    Write-Host "APK $($target.Key) berhasil disinkronkan:" -ForegroundColor Cyan
    Write-Host "  Sumber     : $sourcePath"
    Write-Host "  Versioned  : $($target.VersionedName)"
    Write-Host "  Alias      : $($target.AliasNames -join ', ')"
    Write-Host "  Ukuran     : $([math]::Round($versionedInfo.Length / 1MB, 2)) MB"
    Write-Host "  Modified   : $($sourceInfo.LastWriteTime)"
    Write-Host "  SHA256     : $versionedHash"
    Write-Host "  Package    : $($sourceMeta.packageName)"
    Write-Host "  Version    : $($sourceMeta.versionName) ($($sourceMeta.versionCode))"
}

$manifest = @{
    updatedAt = (Get-Date).ToString("s")
    files = $manifestFiles
}

$manifestJson = $manifest | ConvertTo-Json -Depth 6
$manifestJson | Set-Content -Path $manifestPath -Encoding UTF8

# Mirror ke src agar halaman tutorial tidak perlu readFileSync dari public/
# (readFileSync public menyebabkan App Hosting standalone hanya menyalin partial public/).
$srcManifestPath = Join-Path $repoRoot "src\data\apk-manifest.json"
$srcManifestDir = Split-Path -Parent $srcManifestPath
if (-not (Test-Path -LiteralPath $srcManifestDir)) {
    New-Item -ItemType Directory -Path $srcManifestDir -Force | Out-Null
}
$manifestJson | Set-Content -Path $srcManifestPath -Encoding UTF8

Write-Host ""
Write-Host "Langkah berikutnya:" -ForegroundColor Yellow
Write-Host "1. Cek git diff/status untuk file APK di web/public/apk dan src/data/apk-manifest.json"
Write-Host "2. Stage file APK yang berubah"
Write-Host "3. Commit dan push ke main agar App Hosting merollout versi terbaru"
