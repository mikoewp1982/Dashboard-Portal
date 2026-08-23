$adb = "C:\Users\mikoe\AppData\Local\Android\Sdk\platform-tools\adb.exe"
$e = "com.sekolah.edulock"
$g = "com.satupintu.mobile.siswa"
$svc = "$e/com.sekolah.edulock.AntiUninstallService"
$ts = Get-Date -Format "yyyyMMdd-HHmmss"
$logDir = "D:\Dashboard Portal\Apk Release\Pegangan Build APK\Audit-ADB"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$logFile = Join-Path $logDir "narzo-RMX3235-audit-$ts.log"
$all = @()
function step($n, $label, $cmd, $raw=$false) {
  $script:all += "`n================ STEP $n : $label ================"
  $script:all += "> adb $cmd"
  Write-Host -ForegroundColor Yellow "`n[$n] $label" -NoNewline
  Write-Host -ForegroundColor DarkGray "   > adb $cmd"
  if ($raw) {
    $o = (& $adb ($cmd -split " ") 2>&1) | Out-String
  } else {
    $o = (& $adb ($cmd -split " ") 2>&1) -join "`n"
  }
  $script:all += $o
  Write-Host -ForegroundColor Gray ($o -split "`n" | Select-Object -First 10 | ForEach-Object { "   $_" } )
  Write-Host ""
  Start-Sleep -Milliseconds 300
}

Write-Host -ForegroundColor Cyan "====== FINAL AUDIT NARZO RMX3235 ANDROID 11 ======"

step 1 "Info HP (model / build / id)" "shell getprop ro.product.model"
step 1b "" "shell getprop ro.build.display.id"
step 2 "EduLock App Ops Summary" "shell dumpsys appops get $e"
step 2b "GAS App Ops Summary" "shell dumpsys appops get $g"
step 3 "Verify Accessibility (read-back)" "shell settings get secure enabled_accessibility_services"
step 3b "" "shell settings get secure accessibility_enabled"
step 4 "Device Admin via dumpsys (Android 11 tidak punya list-active-admins di dpm CLI)" "shell dumpsys device_policy" -raw $true
step 5 "Battery Idle Whitelist (cek EduLock + GAS ada)" "shell dumpsys deviceidle whitelist"
step 6 "Permission SYSTEM_ALERT_WINDOW / OVERLAY (Tampil di atas apl lain) - EDULOCK" "shell dumpsys package $e | findstr /i SYSTEM_ALERT_WINDOW"
step 6b "" "shell dumpsys package $g | findstr /i SYSTEM_ALERT_WINDOW"
step 7 "Permission WRITE_SETTINGS + WRITE_SECURE_SETTINGS (Ubah Pengaturan) - EDULOCK" "shell dumpsys package $e | findstr /i WRITE_SETTINGS WRITE_SECURE"
step 8 "AppOps GET_USAGE_STATS (Akses Penggunaan) - EDULOCK" "shell appops get $e GET_USAGE_STATS"
step 8b "" "shell appops get $g GET_USAGE_STATS"
step 9 "LAUNCH EDULOCK via Monkey (buka app) agar SetupActivity dijalankan" "shell monkey -p $e -c android.intent.category.LAUNCHER 1"
step 10 "LIST RECENT ACTIVITY (terakhir dijalankan)" "shell dumpsys activity activities | findstr /i ResumedActivity" -raw $true

$all | Out-File -FilePath $logFile -Encoding utf8
Write-Host -ForegroundColor Cyan "✅ Final audit saved to: $logFile"
