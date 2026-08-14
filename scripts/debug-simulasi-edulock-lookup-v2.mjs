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

function firstChild(snap) {
  const val = snap.val();
  if (!val) return null;
  const keys = Object.keys(val);
  if (!keys.length) return null;
  return { key: keys[0], value: val[keys[0]] };
}

async function main() {
  console.log("🔍 SIMULASI EduLock lookupStudent");
  console.log("=".repeat(80));

  // LANGKAH A
  console.log("\n[LANGKAH A] resolveSchoolByNpsn");
  const direct = await db.ref(`schools/${TARGET_NPSN}`).once("value");
  console.log(`   A1. schools/${TARGET_NPSN} = ${direct.exists() ? "✅" : "❌"}`);

  let schoolId = null;
  let schoolVal = null;

  if (direct.exists()) {
    schoolId = direct.key;
    schoolVal = direct.val();
  } else {
    const byString = await db.ref("schools").orderByChild("npsn").equalTo(TARGET_NPSN).once("value");
    console.log(`   A2. orderByChild(npsn).equalTo(STRING "${TARGET_NPSN}") = ${byString.exists() ? "✅ count=" + byString.numChildren() : "❌"}`);
    if (byString.exists()) {
      const f = firstChild(byString);
      if (f) {
        schoolId = f.key;
        schoolVal = f.value;
        console.log(`       → children.first = schoolId=[${schoolId}] name=[${schoolVal?.schoolName || schoolVal?.name}]`);
      }
    } else {
      const numNpsn = Number(TARGET_NPSN);
      const byNum = await db.ref("schools").orderByChild("npsn").equalTo(numNpsn).once("value");
      console.log(`   A3. orderByChild(npsn).equalTo(NUMBER ${numNpsn}) = ${byNum.exists() ? "✅ count=" + byNum.numChildren() : "❌"}`);
      if (byNum.exists()) {
        const f = firstChild(byNum);
        if (f) {
          schoolId = f.key;
          schoolVal = f.value;
        }
      }
    }
  }

  if (!schoolId) {
    console.log("\n❌ SEKOLAH TIDAK DITEMUKAN. Root cause.");
    process.exit(0);
  }

  // LANGKAH B
  const studentsRef = db.ref(`gas/schools/${schoolId}/students`);
  const totalSnap = await studentsRef.once("value");
  const totalStudents = totalSnap.numChildren();
  console.log(`\n[LANGKAH B] findStudentByNisn di gas/schools/${schoolId}/students (jumlah=${totalStudents})`);

  // B1: String match
  const b1 = await studentsRef.orderByChild("nisn").equalTo(TARGET_NISN).once("value");
  console.log(`   B1. orderByChild(nisn).equalTo(STRING "${TARGET_NISN}") = ${b1.exists() ? "✅ count=" + b1.numChildren() : "❌"}`);

  if (b1.exists()) {
    const f = firstChild(b1);
    if (f) {
      console.log(`       ✓ pushKey=[${f.key}]`);
      console.log(`         nisn  = ${JSON.stringify(f.value.nisn)} (${typeof f.value.nisn})`);
      console.log(`         name  = ${JSON.stringify(f.value.name)}`);
      console.log(`         nama  = ${JSON.stringify(f.value.nama)}`);
      console.log(`         class = ${JSON.stringify(f.value.class)}`);
    }
  } else {
    // B2: numeric
    const b2 = await studentsRef.orderByChild("nisn").equalTo(TARGET_NISN_LONG).once("value");
    console.log(`   B2. orderByChild(nisn).equalTo(NUMBER ${TARGET_NISN_LONG}) = ${b2.exists() ? "✅ count=" + b2.numChildren() : "❌"}`);
    if (b2.exists()) {
      const f = firstChild(b2);
      if (f) console.log(`       ✓ pushKey=[${f.key}] nisn=${JSON.stringify(f.value.nisn)} (${typeof f.value.nisn})`);
    } else {
      // B3: by key
      const b3 = await studentsRef.child(TARGET_NISN).once("value");
      console.log(`   B3. studentsRef.child("${TARGET_NISN}") = ${b3.exists() ? "✅" : "❌"}`);
      if (!b3.exists()) {
        const b3b = await studentsRef.child(String(TARGET_NISN_LONG)).once("value");
        console.log(`   B3b. studentsRef.child("${TARGET_NISN_LONG}") = ${b3b.exists() ? "✅" : "❌"}`);
      }
    }
  }

  // AUDIT: Buktikan NISN BENAR ADA (manual loop)
  console.log(`\n[LANGKAH C] AUDIT MANUAL (bypass orderByChild, scan semua ${totalStudents} siswa):`);
  const all = totalSnap.val() || {};
  let foundNisnMatch = false;
  let missingNisnField = 0;
  let emptyNisn = 0;
  Object.entries(all).forEach(([k, r]) => {
    const nisnStr = String(r?.nisn ?? "");
    if (!(r && "nisn" in r)) missingNisnField++;
    else if (nisnStr === "") emptyNisn++;
    if (nisnStr === TARGET_NISN) {
      foundNisnMatch = true;
      console.log(`   ✓ DITEMUKAN SECARA MANUAL.`);
      console.log(`     pushKey=[${k}]`);
      console.log(`     nisn  = ${JSON.stringify(r.nisn)} (${typeof r.nisn})`);
      console.log(`     name  = ${JSON.stringify(r.name)} / nama=${JSON.stringify(r.nama)}`);
      console.log(`     class = ${JSON.stringify(r.class)} / className=${JSON.stringify(r.className)}`);
      console.log(`     username = ${JSON.stringify(r.username)}`);
      console.log(`     id = ${JSON.stringify(r.id)}`);
      // Cetak SEMUA keys yang ada di record
      console.log(`     SELURUH FIELD: [${Object.keys(r).sort().join(", ")}]`);
    }
  });
  if (!foundNisnMatch) console.log(`   ❌ NISN ${TARGET_NISN} TIDAK ADA SAMA SEKALI DI RTDB.`);
  console.log(`   Statistik: ${missingNisnField} siswa TIDAK PUNYA field nisn. ${emptyNisn} siswa nisn KOSONG.`);

  console.log("\n" + "=".repeat(80));
  if (b1.exists() && foundNisnMatch) {
    console.log("✅ DATA DI RTDB BENAR dan query orderByChild JUGA BENAR.");
    console.log("   → Root cause kemungkinan ada di APLIKASI EDULOCK (RULES / anonymous auth / koneksi / dll).");
  } else if (!b1.exists() && foundNisnMatch) {
    console.log("⚠️  DATA ADA DI RTDB (manual scan) TAPI orderByChild GAGAL MENEMUKAN.");
    console.log("   → Root cause = INDEX RULES HILANG: `.indexOn: \"nisn\"` di gas/schools/*/students TIDAK ADA.");
    console.log("   → Di Admin SDK bisa scan manual, tapi di Client SDK (anon) orderByChild mengembalikan NOL jika indexOn tidak didefinisikan + RULES ketat.");
  } else {
    console.log("❌ NISN TIDAK ADA SAMA SEKALI DI RTDB.");
  }
  process.exit(0);
}

main().catch((e) => { console.error("ERROR:", e); process.exit(1); });
