const { initializeApp, cert } = require("firebase-admin/app");
const { getDatabase } = require("firebase-admin/database");
const serviceAccount = require("../service-account.json");

const app = initializeApp({
  credential: cert(serviceAccount),
  databaseURL: "https://kompas-5f0b4-default-rtdb.asia-southeast1.firebasedatabase.app"
});

const db = getDatabase(app);

async function seedSekolahDemo() {
  console.log("=== Memulai Injeksi 'sekolah_demo' (Sandbox / Lab Uji Coba) ===");
  const now = Date.now();

  const schoolData = {
    schoolId: "sekolah_demo",
    name: "SEKOLAH DEMO & SANDBOX (LAB UJI COBA)",
    npsn: "99999999",
    district: "Demo / Lab",
    isActive: true,
    adminAccessActive: true,
    adminEmail: "demo@sekolah.local",
    authEmail: "demo@sekolah.local",
    backupEmail: "",
    createdAt: now,
    updatedAt: now,
    config: {
      is_active_protection: false, // Default OFF (Mode Senyap saat awal)
      is_holiday_mode: false,
      latitude: -7.644089,
      longitude: 112.553264,
      radius: 500000, // 500 KM (Bebas lokasi/geofence)
      edulock_geofence: {
        latitude: -7.644089,
        longitude: 112.553264,
        radius: 500000,
        updatedAt: now
      }
    },
    schedule: {
      weekdays: {
        mon: { enabled: true, start: "00:00", end: "23:59" },
        tue: { enabled: true, start: "00:00", end: "23:59" },
        wed: { enabled: true, start: "00:00", end: "23:59" },
        thu: { enabled: true, start: "00:00", end: "23:59" },
        fri: { enabled: true, start: "00:00", end: "23:59" },
        sat: { enabled: true, start: "00:00", end: "23:59" },
        sun: { enabled: true, start: "00:00", end: "23:59" }
      }
    },
    uninstallAccess: {
      code: "123456",
      expiresAt: 253402300799000, // Permanen
      createdByUid: "system-demo",
      updatedAt: now
    }
  };

  const gasSchoolData = {
    settings: {
      schoolName: "SEKOLAH DEMO & SANDBOX (LAB UJI COBA)",
      npsn: "99999999",
      district: "Demo / Lab",
      latitude: -7.644089,
      longitude: 112.553264,
      radius: 500000,
      createdAt: now,
      updatedAt: now
    },
    classes: {
      "class_demo_7": {
        className: "Kelas 7-Demo",
        grade: "Kelas 7",
        npsn: "99999999",
        schoolId: "sekolah_demo",
        schoolName: "SEKOLAH DEMO & SANDBOX (LAB UJI COBA)",
        status: "Aktif",
        createdAt: now,
        updatedAt: now
      },
      "class_demo_8": {
        className: "Kelas 8-Demo",
        grade: "Kelas 8",
        npsn: "99999999",
        schoolId: "sekolah_demo",
        schoolName: "SEKOLAH DEMO & SANDBOX (LAB UJI COBA)",
        status: "Aktif",
        createdAt: now,
        updatedAt: now
      }
    },
    students: {
      "999901": {
        nisn: "999901",
        name: "TESTER SISWA DEMO",
        username: "TESTER SISWA DEMO",
        class: "Kelas 7-Demo",
        className: "Kelas 7-Demo",
        grade: "Kelas 7",
        gender: "L",
        religion: "ISLAM",
        npsn: "99999999",
        schoolId: "sekolah_demo",
        schoolName: "SEKOLAH DEMO & SANDBOX (LAB UJI COBA)",
        status: "Aktif",
        createdAt: now,
        updatedAt: now
      },
      "999902": {
        nisn: "999902",
        name: "TESTER SISWA 2",
        username: "TESTER SISWA 2",
        class: "Kelas 7-Demo",
        className: "Kelas 7-Demo",
        grade: "Kelas 7",
        gender: "P",
        religion: "ISLAM",
        npsn: "99999999",
        schoolId: "sekolah_demo",
        schoolName: "SEKOLAH DEMO & SANDBOX (LAB UJI COBA)",
        status: "Aktif",
        createdAt: now,
        updatedAt: now
      },
      "999903": {
        nisn: "999903",
        name: "TESTER SISWA 3",
        username: "TESTER SISWA 3",
        class: "Kelas 8-Demo",
        className: "Kelas 8-Demo",
        grade: "Kelas 8",
        gender: "L",
        religion: "ISLAM",
        npsn: "99999999",
        schoolId: "sekolah_demo",
        schoolName: "SEKOLAH DEMO & SANDBOX (LAB UJI COBA)",
        status: "Aktif",
        createdAt: now,
        updatedAt: now
      }
    },
    teachers: {
      "guru_demo_01": {
        nip: "1999999901",
        name: "GURU TESTER DEMO",
        role: "GURU",
        schoolId: "sekolah_demo",
        schoolName: "SEKOLAH DEMO & SANDBOX (LAB UJI COBA)",
        status: "Aktif",
        createdAt: now,
        updatedAt: now
      }
    }
  };

  const updates = {};
  updates["schools/sekolah_demo"] = schoolData;
  updates["gas/schools/sekolah_demo"] = gasSchoolData;

  await db.ref().update(updates);
  console.log(" Berhasil menyimpan 'schools/sekolah_demo' dan 'gas/schools/sekolah_demo'!");
  console.log(" Detail Entitas:");
  console.log("  - School ID : sekolah_demo");
  console.log("  - NPSN      : 99999999");
  console.log("  - Siswa 1   : NISN 999901 (TESTER SISWA DEMO)");
  console.log("  - Siswa 2   : NISN 999902 (TESTER SISWA 2)");
  console.log("  - Siswa 3   : NISN 999903 (TESTER SISWA 3)");
  console.log("  - Uninstall : 123456");
  console.log("  - Schedule  : 00:00 - 23:59 (Senin-Minggu)");
  console.log("  - Geofence  : 500 KM (Bebas lokasi)");
  
  process.exit(0);
}

seedSekolahDemo().catch(err => {
  console.error(" Gagal injeksi sekolah_demo:", err);
  process.exit(1);
});
