$adb = "C:\Users\mikoe\AppData\Local\Android\Sdk\platform-tools\adb.exe"
$f = "$env:TEMP\EduLockPrefs.xml"
$grace = [DateTimeOffset]::Now.ToUnixTimeMilliseconds() + 900000

# Pull file dari device
& $adb exec-out "run-as com.sekolah.edulock cat /data/data/com.sekolah.edulock/shared_prefs/EduLockPrefs.xml" > $f

# Edit di PC
$content = Get-Content $f -Raw
$content = $content -replace 'name="settings_grace_until" value="\d+"', "name=`"settings_grace_until`" value=`"$grace`""
$content = $content -replace 'name="is_settings_open" value="false"', 'name="is_settings_open" value="true"'
Set-Content $f $content -NoNewline

# Force stop agar prefs di-reload, lalu push kembali
& $adb shell "am force-stop com.sekolah.edulock"
Start-Sleep -Seconds 1
Get-Content $f | & $adb exec-out "run-as com.sekolah.edulock sh -c 'cat > /data/data/com.sekolah.edulock/shared_prefs/EduLockPrefs.xml'"

# Verifikasi
& $adb shell "run-as com.sekolah.edulock grep -E 'settings_grace_until|is_settings_open' /data/data/com.sekolah.edulock/shared_prefs/EduLockPrefs.xml"