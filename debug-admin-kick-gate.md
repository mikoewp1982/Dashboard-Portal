# Debug Session: admin-kick-gate
- **Status**: [OPEN]
- **Issue**: Admin sekolah yang sudah dinonaktifkan oleh Super Admin masih bisa membuka beberapa halaman modul seperti Database, walau dashboard sudah menampilkan status layanan ditutup.
- **Debug Server**: http://127.0.0.1:7777/event
- **Log File**: .dbg/trae-debug-log-admin-kick-gate.ndjson

## Reproduction Steps
1. Login sebagai admin sekolah.
2. Dari Super Admin, nonaktifkan tenant sekolah tersebut.
3. Perhatikan dashboard admin berubah menjadi status layanan ditutup.
4. Coba buka menu modul seperti Database.
5. Bandingkan apakah sesi langsung di-kick atau masih bisa masuk sebagian.

## Hypotheses & Verification
| ID | Hypothesis | Likelihood | Effort | Evidence |
|----|------------|------------|--------|----------|
| A | Gate realtime hanya dipasang di layout/dashboard utama, tetapi tidak ikut hidup di layout halaman modul `/dashboard/*` | High | Low | Pending |
| B | Halaman Database memakai layout/provider berbeda sehingga listener tenant tidak terpasang saat pindah route | High | Low | Pending |
| C | Listener tenant memang aktif, tetapi `signOut` kalah balapan dengan navigasi client-side sehingga route modul sempat render penuh | Medium | Medium | Pending |
| D | Ada cache/store auth yang tetap dianggap valid oleh layout modul sampai ada redirect berikutnya | Medium | Medium | Pending |
| E | Status nonaktif hanya mengubah tampilan kartu dashboard, bukan benar-benar memicu guard di semua subtree admin | High | Low | Pending |

## Log Evidence
- Belum ada.

## Verification Conclusion
- Menunggu instrumentasi dan reproduksi pre-fix.

## Instrumentation Points
- `web/src/components/providers/AuthProvider.tsx`
  - auth user resolved
  - tenant listener attach
  - tenant snapshot received
  - tenant signOut branch hit
  - redirect guard evaluated
- `web/src/app/dashboard/database/page.tsx`
  - database page effect
- `web/src/components/database/MasterDataWorkspace.tsx`
  - database workspace effect
