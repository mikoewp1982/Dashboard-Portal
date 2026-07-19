@echo off
echo ============================================
echo  MEMBERSIHKAN CACHE DAN RESTART SERVER
echo ============================================
echo.

echo [1] Menghentikan semua proses Node.js...
taskkill /F /IM node.exe /T 2>nul
echo     Selesai.
echo.

echo [2] Menghapus folder cache .next...
if exist ".next" (
    rmdir /s /q ".next"
    echo     Cache .next berhasil dihapus!
) else (
    echo     Folder .next tidak ditemukan, skip.
)
echo.

echo [3] Menjalankan ulang server Next.js...
echo     Server sedang dimulai... tunggu sebentar.
echo.
start "Next.js Dev Server" cmd /k "npm run dev"

echo ============================================
echo  SELESAI! Browser akan siap dalam ~30 detik
echo  Buka: http://localhost:3000
echo ============================================
echo.
pause
