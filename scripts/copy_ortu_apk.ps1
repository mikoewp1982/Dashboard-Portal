$src = "D:\Dashboard Portal\native-mobile-gas\app\build\outputs\apk\ortu\release\app-ortu-release.apk"
$destVersioned = "D:\Dashboard Portal\Apk Release\Orang Tua\GAS-OrangTua-1.0.2-ortu-1002.apk"
$destAlias = "D:\Dashboard Portal\Apk Release\Orang Tua\GAS-OrangTua-release.apk"
$destWebVersioned = "D:\Dashboard Portal\web\public\apk\GAS-OrangTua-1.0.2-ortu-1002.apk"
$destWebAlias = "D:\Dashboard Portal\web\public\apk\GAS-OrangTua-release.apk"

if (-not (Test-Path $src)) {
    Write-Error "Source APK not found at $src"
    exit 1
}

Copy-Item -Path $src -Destination $destVersioned -Force
Copy-Item -Path $src -Destination $destAlias -Force
Copy-Item -Path $src -Destination $destWebVersioned -Force
Copy-Item -Path $src -Destination $destWebAlias -Force

$hash = (Get-FileHash -Path $destVersioned -Algorithm SHA256).Hash.ToLower()
$size = (Get-Item -Path $destVersioned).Length

$shaVersioned = "D:\Dashboard Portal\Apk Release\Orang Tua\GAS-OrangTua-1.0.2-ortu-1002.apk.sha256"
$shaAlias = "D:\Dashboard Portal\Apk Release\Orang Tua\GAS-OrangTua-release.apk.sha256"
Set-Content -Path $shaVersioned -Value $hash
Set-Content -Path $shaAlias -Value $hash

Write-Output "APK_HASH=$hash"
Write-Output "APK_SIZE=$size"
Write-Output "COPIED TO VERSIONED & ALIAS IN Apk Release/Orang Tua & web/public/apk"
