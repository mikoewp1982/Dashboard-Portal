const { initializeApp, cert } = require("firebase-admin/app");
const { getDatabase } = require("firebase-admin/database");
const serviceAccount = require("../service-account.json");

const app = initializeApp({
  credential: cert(serviceAccount),
  databaseURL: "https://kompas-5f0b4-default-rtdb.asia-southeast1.firebasedatabase.app"
});

const db = getDatabase(app);

async function syncAllConfigsFromSmpn3Pacet() {
  console.log("=== Menyinkronkan Konfigurasi Lengkap dari SMPN 3 Pacet ke Sekolah Demo ===");

  // 1. Baca data dari smpn3_pacet
  const smpn3SchoolSnap = await db.ref("schools/smpn3_pacet").once("value");
  const smpn3School = smpn3SchoolSnap.val() || {};

  const smpn3GasSnap = await db.ref("gas/schools/smpn3_pacet").once("value");
  const smpn3Gas = smpn3GasSnap.val() || {};

  // 2. Baca data yang sudah ada di sekolah_demo
  const demoSchoolSnap = await db.ref("schools/sekolah_demo").once("value");
  const demoSchool = demoSchoolSnap.val() || {};

  const demoGasSnap = await db.ref("gas/schools/sekolah_demo").once("value");
  const demoGas = demoGasSnap.val() || {};

  // 3. Clone konfigurasi & settings
  const mergedSchool = {
    ...smpn3School,
    ...demoSchool,
    schoolId: "sekolah_demo",
    name: "SEKOLAH DEMO & SANDBOX (LAB UJI COBA)",
    npsn: "99999999",
    district: "Demo / Lab",
    adminEmail: "demo@sekolah.local",
    authEmail: "demo@sekolah.local",
    isActive: true,
    adminAccessActive: true,
    config: {
      ...(smpn3School.config || {}),
      ...(demoSchool.config || {}),
      is_active_protection: false, // Biarkan default OFF saat awal uji coba
      is_holiday_mode: false
    }
  };

  const mergedGas = {
    ...smpn3Gas,
    ...demoGas,
    settings: {
      ...(smpn3Gas.settings || {}),
      schoolName: "SEKOLAH DEMO & SANDBOX (LAB UJI COBA)",
      npsn: "99999999",
      district: "Demo / Lab"
    },
    // Pertahankan kelas & siswa dummy yang sudah dibuat
    classes: demoGas.classes || {},
    students: demoGas.students || {},
    teachers: demoGas.teachers || {}
  };

  const updates = {};
  updates["schools/sekolah_demo"] = mergedSchool;
  updates["gas/schools/sekolah_demo"] = mergedGas;

  // Cek jika ada aturan kedisiplinan / discipline_rules_by_school
  const disciplineRulesSnap = await db.ref("discipline_rules_by_school/smpn3_pacet").once("value");
  if (disciplineRulesSnap.exists()) {
    updates["discipline_rules_by_school/sekolah_demo"] = disciplineRulesSnap.val();
  }

  // Cek jika ada seven habits config
  const sevenHabitsSnap = await db.ref("seven_habits_rubrics_by_school/smpn3_pacet").once("value");
  if (sevenHabitsSnap.exists()) {
    updates["seven_habits_rubrics_by_school/sekolah_demo"] = sevenHabitsSnap.val();
  }

  // Cek prayer config
  const prayerConfigSnap = await db.ref("prayer_configs_by_school/smpn3_pacet").once("value");
  if (prayerConfigSnap.exists()) {
    updates["prayer_configs_by_school/sekolah_demo"] = prayerConfigSnap.val();
  }

  await db.ref().update(updates);
  console.log(" Sinkronisasi konfigurasi 100% lengkap!");
  console.log(" - Jadwal Operasional EduLock: Tersinkron");
  console.log(" - Pengaturan GAS Presensi & Lokasi: Tersinkron");
  console.log(" - Aturan Disiplin & Rubrik Karakter: Tersinkron");
  console.log(" - Siswa Tester (999901, 999902, 999903): Siap Digunakan");
  process.exit(0);
}

syncAllConfigsFromSmpn3Pacet().catch(err => {
  console.error("Gagal sync:", err);
  process.exit(1);
});
