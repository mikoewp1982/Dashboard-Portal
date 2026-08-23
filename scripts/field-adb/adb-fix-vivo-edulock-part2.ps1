$ErrorActionPreference = "Continue"
$adb = "C:\Users\mikoe\AppData\Local\Android\Sdk\platform-tools\adb.exe"
$edulock = "com.sekolah.edulock"
$gas = "com.satupintu.mobile.siswa"
# Service NAME BENAR dari manifest dan file kt
$accessibilityService = "$edulock/com.sekolah.edulock.AntiUninstallService"
$adminReceiver = "$edulock/com.sekolah.edulock.DeviceAdminReceiver"

Write-Host -ForegroundColor Cyan "====== VIVO ADB FIX PART 2 (after naming fix) ======"
Write-Host -ForegroundColor Gray "Device:"
& $adb devices

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$auditDir = "D:\Dashboard Portal\Apk Release\Pegangan Build APK\Audit-ADB"
New-Item -ItemType Directory -Force -Path $auditDir | Out-Null
$log = @()
function s($n, $label, $cmd, $failOk=$false) {
  Write-Host -ForegroundColor Yellow "`n[$n] $label"
  Write-Host -ForegroundColor DarkGray "   > adb $cmd"
  $o = & $adb ($cmd -split " ") 2>&1
  $msg = ($o -join "`n").Trim()
  if ($msg) { Write-Host -ForegroundColor Gray "   $msg" }
  $script:log += "[$n] $label`n> adb $cmd`n$msg`n"
  if ($LASTEXITCODE -eq 0) { Write-Host -ForegroundColor Green "   OK" }
  elseif ($failOk) { Write-Host -ForegroundColor DarkYellow "   DONE (non-fatal)" }
  else { Write-Host -ForegroundColor DarkRed "   Warning (exit=$LASTEXITCODE — bisa diabaikan jika sudah diset manual)" }
  Start-Sleep -Milliseconds 400
}

$sPrefix = "shell"

# -- ACCESSIBILITY FORCE ENABLE (NAMA SERVICE BENAR) --
s 13 "FORCE set Secure Settings: enable Accessibility EduLock (AntiUninstallService)" "$sPrefix settings put secure enabled_accessibility_services $accessibilityService"
s 14 "Aksesbilitas Global = 1" "$sPrefix settings put secure accessibility_enabled 1"

# -- BATTERY BYPASS (deviceidle whitelist) --
s 15 "Whitelist Battery Idle (Bypass optimasi) - EduLock" "$sPrefix dumpsys deviceidle whitelist +$edulock" $true
s 16 "Whitelist Battery Idle (Bypass optimasi) - GAS Siswa" "$sPrefix dumpsys deviceidle whitelist +$gas" $true

# -- USAGE STATS + NOTIFICATION LISTENER --
s 17 "Allow Usage Stats (Akses Penggunaan) - EduLock" "$sPrefix appops set $edulock GET_USAGE_STATS allow"
s 18 "Allow Usage Stats - GAS" "$sPrefix appops set $gas GET_USAGE_STATS allow"
s 19 "Allow Notification Listener - EduLock" "$sPrefix cmd notification allow_listener $edulock" $true

# -- DEVICE ADMIN AKTIFKAN via DPM (jika belum) --
s 20 "List Active Admin (cek EduLock sudah aktif belum)" "$sPrefix dpm list-active-admins --user 0" $true
s 21 "SET Active Admin DeviceAdminReceiver (jika belum)" "$sPrefix dpm set-active-admin --user 0 $adminReceiver" $true

# -- START SETUP ACTIVITY di HP (munculkan UI Setup untuk user tekan MULAI) --
s 22 "Buka SetupActivity EduLock di HP" "$sPrefix am start -n $edulock/.SetupActivity"

# -- FINAL VERIFY --
Write-Host -ForegroundColor Cyan "`n`n======== FINAL VERIFY ========"
$s1 = (& $adb shell settings get secure enabled_accessibility_services).Trim()
$s2 = (& $adb shell settings get secure accessibility_enabled).Trim()
$s3 = (& $adb shell settings get global enabled_notification_listeners).Trim()
Write-Host "   enabled_accessibility_services = [$s1]"
Write-Host "   accessibility_enabled         = [$s2]"
Write-Host "   notification_listeners        = [$s3]"
Write-Host "   active admins: "
(& $adb shell dpm list-active-admins --user 0) | ForEach-Object { Write-Host "     $_" }
Write-Host "   EduLock overlay: "
(& $adb shell dumpsys package $edulock | Select-String "SYSTEM_ALERT_WINDOW" -SimpleMatch) | Select-Object -First 3 | ForEach-Object { Write-Host "     $_" }

$logFile = Join-Path $auditDir "vivo-audit-part2-$timestamp.log"
@(
  "== VIVO FIX PART 2 ADB LOG ==",
  "Accessibility Service target: $accessibilityService",
  "Admin target: $adminReceiver",
  "Timestamp: $timestamp",
  "",
  $log,
  "== FINAL VERIFY ==",
  "enabled_accessibility_services=$s1",
  "accessibility_enabled=$s2",
  "notification_listeners=$s3",
  "active_admins:",
  ((& $adb shell dpm list-active-admins --user 0) -join "`n")
) | Out-File -FilePath $logFile -Encoding utf8

Write-Host -ForegroundColor Cyan "`n✅ Audit Part 2 disimpan: $logFile"
Write-Host -ForegroundColor Yellow "`n👉 DI HP SEKARANG: Harusnya layar SetupActivity EduLock TERBUKA."
Write-Host -ForegroundColor Green "   1. Berikan semua izin yang diminta (6 izin)."
Write-Host -ForegroundColor Green "   2. TEKAN TOMBOL HIJAU [MULAI APLIKASI]."
Write-Host -ForegroundColor Green "   3. Setelah sukses, TUTUP EduLock, BUKA APK GAS SISWA, LIHAT BADGE 5 = HIJAU SEMUA."
