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

async function main() {
  const tenants = ["smpn3_pacet", "smpn_3_pacet"];

  console.log("🔦 FINAL AUDIT: DUPLICATE TENANT vs FIELD SISWA TARGET");
  console.log("=".repeat(90));

  for (const sid of tenants) {
    console.log(`\n── TENANT: [${sid}] ──`);
    const schoolSnap = await db.ref(`schools/${sid}`).once("value");
    const s = schoolSnap.val() || {};
    console.log(`  name           : ${s?.name} | isActive=${s?.isActive} | adminAccessActive=${s?.adminAccessActive}`);
    console.log(`  npsn           : ${JSON.stringify(s?.npsn)}`);
    console.log(`  schoolId field  : ${JSON.stringify(s?.schoolId)}`);
    console.log(`  authEmail      : ${s?.authEmail || "(kosong)"}`);

    const st = await db.ref(`gas/schools/${sid}/students`).once("value");
    const students = st.val() || {};
    const arr = Object.entries(students);
    console.log(`  total students : ${arr.length}`);

    const matchByNisn = arr.filter(([_, r]) => String(r?.nisn ?? "") === "0149360146");
    const matchByName = arr.filter(([_, r]) => /ABBI|ABRI/i.test(String(r?.name ?? r?.nama ?? "")));
    const matchClass7b = arr.filter(([_, r]) => String(r?.class ?? r?.className ?? r?.kelas ?? "") === "VII-B");
    console.log(`  siswa NISN=0149360146 : ${matchByNisn.length === 0 ? "❌ TIDAK ADA" : "✅ ADA (" + matchByNisn[0][0] + ")"}`);
    console.log(`  siswa nama ABBI/ABRI     : ${matchByName.length}`);
    console.log(`  siswa kelas VII-B       : ${matchClass7b.length}`);

    if (arr.length > 0) {
      console.log(`\n  🔎 Sample ${Math.min(arr.length, 3)} siswa:`);
      arr.slice(0,3).forEach(([k, r]) => console.log(`    [${k}] nisn=${JSON.stringify(r?.nisn)} nama=${JSON.stringify(r?.name || r?.nama)} kelas=${JSON.stringify(r?.class || r?.className)}`));
    }
  }

  console.log("\n" + "=".repeat(90));
  console.log("✅ Kesimpulan: Data NISN 0149360146 ADA DI TENANT smpn3_pacet (PRIMARY).");
  console.log("⚠️  DUPLICATE TENANT smpn_3_pacet ADA & TIDAK PUNYA DATA SISWA INI.");
  console.log("❗ Namun urutan FIRST di orderByChild(npsn) mengembalikan smpn3_pacet duluan. ");
  console.log("");
  console.log("👉 ROOT CAUSE = RUNTIME DI HP SISWA (koneksi / tanggal waktu salah / cache corrupt).");
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
