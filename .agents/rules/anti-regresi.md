# Aturan Anti-Regresi Mutlak (Frozen Core Protection)

Sebelum melakukan modifikasi kode atau build:
1. Baca panduan resmi di `FITUR_STABIL_JANGAN_DISENTUH.md`.
2. Dilarang keras mengedit logika sakral:
   - **Virtual Pet Death/Revive**: `web/src/lib/guru/petStatus.ts` WAJIB mempertahankan `return isMarkedDead || health <= 0 || lowest <= 0;`. Dilarang mengganti operator `||` menjadi `&&`.
   - **Tombol Revive**: Tombol `Hidupkan` di `GasPetRiskTab.tsx` wajib selalu ada untuk kondisi Mati dan Sekarat.
   - **EduLock di Rumah**: Fail-open 100% bebas gangguan. GPS mati di rumah tidak boleh memicu overlay "Aktifkan GPS" ataupun mengunci HP.
   - **Overlay Pet Mati di EduLock**: Hanya aktif di luar jam sekolah / di rumah. Tombol "Saya Mengerti" wajib bisa di-klik untuk membuka akses sementara (debounce 2 detik).
   - **Transisi EduLock ke GAS**: 0 frame launcher home terlihat, 0 prompt PIN/pola, dan anti-kickback.
   - **Anti-Uninstall**: Berjalan 24/7/365 mandiri tanpa terikat jam sekolah atau geofence.
   - **FCM TTL**: Master switch wajib 24 jam (86400s), Find device wajib 5 menit (300s).
   - **Aksesibilitas Android 13+**: Alur 2-langkah (Info Aplikasi -> Titik 3 -> Aksesibilitas) di EduLock dan Web install page wajib dipertahankan.
3. Selalu periksa `git diff --stat` sebelum commit: jangan pernah men-stage file di luar scope permintaan user.
4. Jalankan `node ./scripts/verify-critical-rules.mjs` di dalam folder `web/` sebelum build.
