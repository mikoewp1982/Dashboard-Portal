import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccountPath = join(__dirname, "..", "service-account.json");
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf-8"));

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
    databaseURL: "https://kompas-5f0b4-default-rtdb.asia-southeast1.firebasedatabase.app",
  });
}

const db = getDatabase();

const TARGET_NPSN = "20555784";
const TARGET_NISN = "0149360146";

async function main() {
  console.log("🔍 Verifikasi DUPLICATE TENANT NPSN:", TARGET_NPSN);

  const schoolsRef = db.ref("schools");
  const snap = await schoolsRef.orderByChild("npsn").equalTo(TARGET_NPSN).once("value");
  const val = snap.val() || {};
  const arr = Object.entries(val);
  console.log(`\n[orderByChild(npsn)=${TARGET_NPSN}] mengembalikan ${arr.length} school:`);
  arr.forEach(([sid, s], i) => {
    console.log(`   urutan ke-${i + 1}: schoolId=[${sid}] name=[${s?.schoolName || s?.name}]`);
  });

  // Loop cek students di tiap school
  for (const [sid, s] of arr) {
    console.log(`\n── School: [${sid}] ──`);
    const studentsSnap = await db.ref(`gas/schools/${sid}/students`).once("value");
    const students = studentsSnap.val() || {};
    const studentArr = Object.entries(students);
    console.log(`   Total students: ${studentArr.length}`);

    const target = studentArr.find(([_, row]) => {
      const nisn = String(row?.nisn ?? "").trim();
      return nisn === TARGET_NISN || row?.id === TARGET_NISN;
    });
    if (target) {
      const [pushKey, row] = target;
      console.log(`   ✅ SISWA DITEMUKAN:`);
      console.log(`      - pushKey     = [${pushKey}]`);
      console.log(`      - nisn        = ${JSON.stringify(row.nisn)} (typeof=${typeof row.nisn})`);
      console.log(`      - nama/name   = name:${JSON.stringify(row.name)} / nama:${JSON.stringify(row.nama)}`);
      console.log(`      - kelas/class = class:${JSON.stringify(row.class)} / className:${JSON.stringify(row.className)} / kelas:${JSON.stringify(row.kelas)}`);
      console.log(`      - username    = ${JSON.stringify(row.username)}`);
      console.log(`      - id          = ${JSON.stringify(row.id)}`);
    } else {
      console.log(`   ❌ SISWA DENGAN NISN ${TARGET_NISN} TIDAK ADA DI SCHOOL INI.`);
      if (studentArr.length > 0) {
        const sample = studentArr[0];
        console.log(`      (sample: pushKey=[${sample[0]}] nisn=${JSON.stringify(sample[1].nisn)} nama=${JSON.stringify(sample[1].nama || sample[1].name)})`);
      }
    }
  }

  console.log("\n── Kesimpulan Sementara ──");
  console.log("EduLock resolveSchoolByNpsn menggunakan `snapshot.children.first()` (urutan ke-1).");
  console.log("Jika school urutan pertama TIDAK PUNYA siswa NISN target → lookup FAIL.");

  process.exit(0);
}

main().catch((e) => { console.error("ERROR:", e); process.exit(1); });
