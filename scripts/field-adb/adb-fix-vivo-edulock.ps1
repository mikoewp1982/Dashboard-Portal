$ErrorActionPreference = "Stop"
$adb = "C:\Users\mikoe\AppData\Local\Android\Sdk\platform-tools\adb.exe"
$edulock = "com.sekolah.edulock"
$gas = "com.satupintu.mobile.siswa"
$accessibilityService = "$edulock/$edulock.EduLockAccessibilityService"
$adminReceiver = "$edulock/$edulock.DeviceAdminReceiver"
$auditDir = "D:\Dashboard Portal\Apk Release\Pegangan Build APK\Audit-ADB"
New-Item -ItemType Directory -Force -Path $auditDir | Out-Null
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$auditFile = Join-Path $auditDir "vivo-audit-$timestamp.log"
$out = @()
function step($num, $label, $cmd) {
  $script:out += "`n==================== STEP $num : $label ===================="
  $script:out += "> adb $cmd"
  $o = & $adb $cmd.Split("") 2>&1
  $script:out += ($o -join "`n")
  Write-Host -ForegroundColor Yellow "`n[$num] $label" -NoNewline
  Write-Host -ForegroundColor Gray "   -> $cmd"
  if ($LASTEXITCODE -eq 0) { Write-Host -ForegroundColor Green "   SUCCESS" }
  else { Write-Host -ForegroundColor Red "   EXIT=$LASTEXITCODE (bisa diabaikan kalau permission memang sudah di set)" }
  Start-Sleep -Milliseconds 600
}
Write-Host -ForegroundColor Cyan "`n# Cek ADB connection..."
Write-Host -ForegroundColor Gray (& $adb devices)

Write-Host -ForegroundColor Cyan "`n========[ START VIVO BYPASS 9 PERINTAH ========="

step 1 "Kill-server restart" "start-server"
step 2 "GRANT Overlay (Tampilkan di atas apl lain = SYSTEM_ALERT_WINDOW)" "shell pm grant $edulock android.permission.SYSTEM_ALERT_WINDOW"
step 3 "GRANT Write Settings (Ubah pengaturan sistem = WRITE_SETTINGS)" "shell pm grant $edulock android.permission.WRITE_SECURE_SETTINGS"
step 4 "FORCE Accessibility ENABLE via Secure Settings" "shell settings put secure enabled_accessibility_services $accessibilityService"
step 5 "ACCESSIBILITY_ENABLED=1 (Global)" "shell settings put secure accessibility_enabled 1"
step 6 "BYPASS Battery Optimizations" "shell dumpsys deviceidle whitelist +$edulock"
step 7 "SET Component Active (EduLockAccessibilityService)" "shell am startservice -n $accessibilityService"
step 8 "GRANT Usage Access (Akses Penggunaan)" "shell appops set $edulock android:get_usage_stats allow"
step 9 "GRANT Notifications Listener (Akses Notifikasi)" "shell cmd notification allow_listener $edulock"
step 10 "GRANT Overlay untuk GAS juga (jika terinstall)" "shell pm grant $gas android.permission.SYSTEM_ALERT_WINDOW"
step 11 "RESTART kedua app" "shell am force-stop $edulock"
step 12 "Dump final audit accessibility state" "shell dumpsys accessibility"

Write-Host -ForegroundColor Cyan "`n========[ FINAL VERIFICATION ============"

Write-Host -ForegroundColor Gray "`n[VERIFY] Accessibility enabled services:"
$s = (& $adb shell settings get secure enabled_accessibility_services)
Write-Host "   enabled_accessibility_services = $s"
$a = (& $adb shell settings get secure accessibility_enabled)
Write-Host "   accessibility_enabled            = $a"

Write-Host -ForegroundColor Gray "`n[VERIFY] PM permissions EDULOCK:"
(& $adb shell dumpsys package $edulock | Select-String -Pattern "permission\.SYSTEM_ALERT_WINDOW|permission\.WRITE_SECURE|permission\.BIND_ACCESSIBILITY|grantResult" -SimpleMatch) | Select-Object -First 8

Write-Host -ForegroundColor Gray "`n[VERIFY] DeviceAdmin Active Admin list:"
(& $adb shell dpm list-active-admins) | Select-Object -First 10

$out += "`n`n======== FINAL VERIFICATION ========"
$out += "enabled_accessibility_services = $s"
$out += "accessibility_enabled         = $a"
$out += "dumpsys active admins: $(& $adb shell dpm list-active-admins)"
$out | Out-File -FilePath $auditFile -Encoding utf8
Write-Host -ForegroundColor Cyan "`n✅ Audit log disimpan ke: $auditFile"
Write-Host -ForegroundColor Yellow "`n👉 SEKARANG DI HP: CABUT USB, REBOOT HP 1X, BUKA EDULOCK -> TEKAN [MULAI APLIKASI]."
Write-Host -ForegroundColor Green "   Setelah itu BUKA APK GAS SISWA -> 5 BADGE SEHARUSNYA SUDAH HIJAU SEMUA."
