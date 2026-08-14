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
const TARGET_NISN_INPUT = "0149360146";
const TARGET_NISN_NUM = 149360146;

async function main() {
  console.log("🔍 [1] Mencari sekolah dengan NPSN:", TARGET_NPSN);
  
  const schoolsRef = db.ref("schools");
  const allSchoolsSnap = await schoolsRef.once("value");
  const allSchools = allSchoolsSnap.val() || {};
  
  const matchedSchools = [];
  for (const [sid, s] of Object.entries(allSchools)) {
    const npsnField = String(s?.npsn ?? "").trim();
    if (
      sid === TARGET_NPSN ||
      npsnField === TARGET_NPSN ||
      npsnField === String(TARGET_NPSN)
    ) {
      matchedSchools.push({
        schoolId: sid,
        keySchoolId: sid,
        npsnField: s?.npsn,
        schoolName: s?.schoolName || s?.name || "",
      });
    }
  }
  
  console.log("✅ Sekolah ditemukan:", matchedSchools.length);
  matchedSchools.forEach((s, i) => console.log(`   [${i+1}] schoolId=${s.schoolId} npsnField=${JSON.stringify(s.npsnField)} name=${s.schoolName}`));
  
  if (matchedSchools.length === 0) {
    console.log("❌ TIDAK ADA SEKOLAH DENGAN NPSN INI — akar masalah lookup");
    process.exit(0);
  }
  
  const schoolId = matchedSchools[0].schoolId;
  console.log("\n🔍 [2] Query students gas/schools/" + schoolId + "/students");
  
  const studentsRef = db.ref(`gas/schools/${schoolId}/students`);
  const studentsSnap = await studentsRef.once("value");
  const students = studentsSnap.val() || {};
  
  const arr = Object.entries(students);
  console.log(`✅ Total siswa di DB sekolah ini: ${arr.length}`);
  
  // Cari siswa target
  const candidates = [];
  arr.forEach(([key, s]) => {
    const nisnRaw = s?.nisn;
    const nisnStr = String(nisnRaw ?? "");
    const id = s?.id || key;
    const name = s?.name || s?.nama || "";
    
    const matchExact = nisnStr === TARGET_NISN_INPUT;
    const matchNoZero = nisnStr.replace(/^0+/, "") === String(TARGET_NISN_NUM);
    const matchNum = typeof nisnRaw === "number" && nisnRaw === TARGET_NISN_NUM;
    const matchKey = key === TARGET_NISN_INPUT || key === String(TARGET_NISN_NUM);
    const matchName = /ABBI|ABRI|MUHAMMAD.*A/i.test(name);
    
    if (matchExact || matchNoZero || matchNum || matchKey || matchName) {
      candidates.push({
        pushKey: key,
        name,
        nisn: nisnRaw,
        nisnType: typeof nisnRaw,
        class: s?.class || s?.className || s?.kelas || "",
        id,
        matchExact, matchNoZero, matchNum, matchKey, matchName,
      });
    }
  });
  
  console.log(`\n✅ Kandidat siswa yang cocok (match NISN atau nama): ${candidates.length}`);
  candidates.forEach((c, i) => {
    console.log(
      `   [${i+1}] pushKey=[${c.pushKey}] nama=${c.nama} NISN=${JSON.stringify(c.nisn)} (${c.nisnType}) kelas=${c.class}`
    );
    console.log(`       matchExact=${c.matchExact} matchNoZero=${c.matchNoZero} matchNum=${c.matchNum} matchKey=${c.matchKey} matchName=${c.matchName}`);
  });
  
  if (candidates.length === 0) {
    console.log("\n⚠️  TIDAK ADA KANDIDAT — sample 5 siswa pertama:");
    arr.slice(0, 5).forEach(([key, s], i) => {
      console.log(
        `   [${i+1}] pushKey=[${key}] nisn=${JSON.stringify(s?.nisn)} (${typeof s?.nisn}) nama=${s?.name || s?.nama} kelas=${s?.class || s?.className}`
      );
    });
  }
  
  console.log("\n🔚 Selesai.");
  process.exit(0);
}

main().catch((e) => {
  console.error("ERROR:", e);
  process.exit(1);
});
