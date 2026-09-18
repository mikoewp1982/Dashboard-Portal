# Antigravity Rules: Anti-Regresi Fitur Stabil (Frozen Core)

1. Jangan pernah memodifikasi file sakral yang terdaftar di `FITUR_STABIL_JANGAN_DISENTUH.md`.
2. Selalu patuhi logika `isDeadByRule` dengan operator `||` di `web/src/lib/guru/petStatus.ts`.
3. Sebelum commit, selalu jalankan verifikasi `node ./scripts/verify-critical-rules.mjs` di dalam folder `web/`.
4. Jangan pernah commit file yang tidak relevan dengan perintah user saat ini.
