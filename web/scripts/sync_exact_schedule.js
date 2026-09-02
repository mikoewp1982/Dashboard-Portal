const { initializeApp, cert } = require("firebase-admin/app");
const { getDatabase } = require("firebase-admin/database");
const serviceAccount = require("../service-account.json");

const app = initializeApp({
  credential: cert(serviceAccount),
  databaseURL: "https://kompas-5f0b4-default-rtdb.asia-southeast1.firebasedatabase.app"
});

const db = getDatabase(app);

async function syncExactSchedule() {
  console.log("Menyinkronkan jadwal EduLock dengan pengaturan Presensi di Web...");

  // Jadwal persis seperti di web:
  // Senin - Kamis : 07:00 - 13:30
  // Jumat         : 07:00 - 11:00
  // Sabtu         : 07:00 - 12:00
  // Minggu        : Tutup (false)
  const weekdays = {
    mon: { enabled: true, start: "07:00", end: "13:30" },
    tue: { enabled: true, start: "07:00", end: "13:30" },
    wed: { enabled: true, start: "07:00", end: "13:30" },
    thu: { enabled: true, start: "07:00", end: "13:30" },
    fri: { enabled: true, start: "07:00", end: "11:00" },
    sat: { enabled: true, start: "07:00", end: "12:00" },
    sun: { enabled: false, start: "00:00", end: "00:00" }
  };

  await db.ref("schools/sekolah_demo/schedule/weekdays").set(weekdays);
  console.log("Berhasil menyinkronkan jadwal weekdays ke 'schools/sekolah_demo/schedule/weekdays'!");
  process.exit(0);
}

syncExactSchedule().catch(err => {
  console.error(err);
  process.exit(1);
});
