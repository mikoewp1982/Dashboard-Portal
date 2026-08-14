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
const TARGET_NISN_LONG = 149360146;

async function main() {
  console.log("🔍 SIMULASI LANGKAH LANGKAH EduLock lookupStudent (NPSN=" + TARGET_NPSN + ", NISN=" + TARGET_NISN + ")");
  console.log("=".repeat(90));

  // ========= LANGKAH A: resolveSchoolByNpsn =========
  console.log("\n[LANGKAH A] resolveSchoolByNpsn(\"" + TARGET_NPSN + "\")");
  
  // A1: directSchoolRef = schools/<npsn>
  const direct = await db.ref(`schools/${TARGET_NPSN}`).once("value");
  console.log(`   A1. schools/${TARGET_NPSN} → exists=${direct.exists()}`);
  
  if (direct.exists()) {
    console.log(`       ✓ Sekolah langsung ketemu: key=${direct.key}`);
  } else {
    console.log(`       ✗ Tidak ada → lanjut A2.`);
    // A2: schools.orderByChild("npsn").equalTo(<string npsn>)
    const byString = await db.ref("schools").orderByChild("npsn").equalTo(TARGET_NPSN).once("value");
    console.log(`   A2. orderByChild("npsn").equalTo("${TARGET_NPSN}" string) → exists=${byString.exists()} count=${byString.numChildren()}`);
    if (byString.exists()) {
      const first = byString.children[Symbol.iterator]().next().value;
      console.log(`       ✓ children.first() → key=[${first.key}] name=[${first.val().schoolName || first.val().name}]`);
      
      // ========= LANGKAH B: findStudentByNisn =========
      const schoolId = first.key;
      const studentsRef = db.ref(`gas/schools/${schoolId}/students`);
      
      console.log(`\n[LANGKAH B] findStudentByNisn di gas/schools/${schoolId}/students (jumlah: ${(await studentsRef.once("value")).numChildren()})`);
      
      // B1: orderByChild("nisn").equalTo(<string nisn>)
      const b1 = await studentsRef.orderByChild("nisn").equalTo(TARGET_NISN).once("value");
      console.log(`   B1. orderByChild("nisn").equalTo("${TARGET_NISN}" string) → exists=${b1.exists()} count=${b1.numChildren()}`);
      if (b1.exists()) {
        const stu = b1.children[Symbol.iterator]().next().value;
        console.log(`       ✓ KETEMU. pushKey=${stu.key}`);
        console.log(`         nama: name=${JSON.stringify(stu.val().name)} / nama=${JSON.stringify(stu.val().nama)}`);
        console.log(`         nisn  = ${JSON.stringify(stu.val().nisn)} (type=${typeof stu.val().nisn})`);
      } else {
        console.log(`       ✗ TIDAK ADA → lanjut B2 (numeric match).`);
        // B2: orderByChild("nisn").equalTo(<numeric>)
        const b2 = await studentsRef.orderByChild("nisn").equalTo(TARGET_NISN_LONG).once("value");
        console.log(`   B2. orderByChild("nisn").equalTo(${TARGET_NISN_LONG} number) → exists=${b2.exists()} count=${b2.numChildren()}`);
        if (b2.exists()) {
          const stu = b2.children[Symbol.iterator]().next().value;
          console.log(`       ✓ KETEMU numeric. pushKey=${stu.key} nisn=${JSON.stringify(stu.val().nisn)}`);
        } else {
          console.log(`       ✗ TIDAK ADA → lanjut B3 findByKey.`);
          // B3: studentsRef.child(<nisn>)
          const b3 = await studentsRef.child(TARGET_NISN).once("value");
          console.log(`   B3. studentsRef.child("${TARGET_NISN}") → exists=${b3.exists()}`);
          if (!b3.exists()) {
            const b3b = await studentsRef.child(String(TARGET_NISN_LONG)).once("value");
            console.log(`   B3b. studentsRef.child("${TARGET_NISN_LONG}") → exists=${b3b.exists()}`);
          }
        }
      }
      
      // ========= LANGKAH C: CEK INDEX (field nisn ADA di semua record?) =========
      console.log(`\n[LANGKAH C] AUDIT: Berapa banyak siswa yang TIDAK punya field 'nisn' atau TIDAK PUNYA NILAI?`);
      const allSnap = await studentsRef.once("value");
      const all = allSnap.val() || {};
      let missing = 0;
      let empty = 0;
      let noLeadingZero = 0;
      Object.entries(all).forEach(([key, row]) => {
        if (!("nisn" in row)) missing++;
        else if (!row.nisn || String(row.nisn).trim() === "") empty++;
        else if (String(row.nisn).match(/^\d{9}$/)) noLeadingZero++; // NISN 9 digit = tanpa leading 0
      });
      console.log(`   Total siswa = ${Object.keys(all).length}`);
      console.log(`   - TIDAK ADA field 'nisn' → ${missing}`);
      console.log(`   - Field 'nisn' KOSONG → ${empty}`);
      console.log(`   - NISN 9 DIGIT (leading zero hilang) → ${noLeadingZero}`);
      console.log(`   - SISWA TARGET: nisn ada di record? ${Object.values(all).some(r => String(r?.nisn ?? "") === TARGET_NISN) ? "✅ ADA" : "❌ TIDAK ADA"}`);
      
      // CETAK ISI RECORD TARGET LENGKAP
      const targetRecord = Object.entries(all).find(([_, r]) => String(r?.nisn ?? "") === TARGET_NISN);
      if (targetRecord) {
        console.log(`\n[LANGKAH D] ISI LENGKAP RECORD SISWA TARGET:`);
        console.log(JSON.stringify(targetRecord[1], null, 3));
      }
    }
  }

  process.exit(0);
}

main().catch((e) => { console.error("ERROR:", e); process.exit(1); });
