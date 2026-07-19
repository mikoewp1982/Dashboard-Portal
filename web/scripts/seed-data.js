const { initializeApp, cert } = require('firebase-admin/app');
const { getDatabase } = require('firebase-admin/database');
const serviceAccount = require('../service-account.json');

// Initialize Firebase Admin
initializeApp({
  credential: cert(serviceAccount),
  databaseURL: "https://dashboard-portal-179f7-default-rtdb.asia-southeast1.firebasedatabase.app"
});

const rtdb = getDatabase();

async function seedData() {
  try {
    console.log("Memulai Data Seeding...");

    // 1. Seed Schools
    const schoolsData = {
      "SCH-001": {
        schoolId: "SCH-001",
        schoolName: "SMA Negeri 1 Jakarta",
        npsn: "12345678",
        isActive: true,
        region: "Jakarta",
        createdAt: Date.now()
      },
      "SCH-002": {
        schoolId: "SCH-002",
        schoolName: "SMA Negeri 2 Bandung",
        npsn: "87654321",
        isActive: true,
        region: "Jawa Barat",
        createdAt: Date.now()
      },
      "SCH-003": {
        schoolId: "SCH-003",
        schoolName: "SMK Negeri 1 Surabaya",
        npsn: "11223344",
        isActive: false,
        region: "Jawa Timur",
        createdAt: Date.now()
      }
    };
    await rtdb.ref("schools").set(schoolsData);
    console.log("✅ Data Schools berhasil dimuat.");

    // 2. Seed Sync Jobs
    const syncJobsData = {
      "JOB-1": {
        id: "JOB-1",
        schoolId: "SCH-001",
        type: "SYNC_STUDENTS",
        status: "QUEUED",
        createdAt: Date.now()
      },
      "JOB-2": {
        id: "JOB-2",
        schoolId: "SCH-002",
        type: "SYNC_TEACHERS",
        status: "QUEUED",
        createdAt: Date.now()
      },
      "JOB-3": {
        id: "JOB-3",
        schoolId: "SCH-001",
        type: "SYNC_ATTENDANCE",
        status: "COMPLETED",
        createdAt: Date.now() - 86400000
      }
    };
    await rtdb.ref("gas/sync_jobs").set(syncJobsData);
    console.log("✅ Data Sync Jobs berhasil dimuat.");

    // 3. Seed Support Requests
    const supportRequestsData = {
      "REQ-1": {
        id: "REQ-1",
        schoolId: "SCH-002",
        issue: "Akses Lentera Digital tidak berfungsi",
        status: "OPEN",
        createdAt: Date.now()
      },
      "REQ-2": {
        id: "REQ-2",
        schoolId: "SCH-003",
        issue: "Permintaan reset password massal",
        status: "OPEN",
        createdAt: Date.now() - 3600000
      }
    };
    await rtdb.ref("gas/support_requests").set(supportRequestsData);
    console.log("✅ Data Support Requests berhasil dimuat.");

    // 4. Seed Principals
    const principalsData = {
      "kepsek_jkt1": {
        username: "kepsek_jkt1",
        name: "Budi Santoso",
        schoolId: "SCH-001",
        schoolName: "SMA Negeri 1 Jakarta",
        isActive: true,
        updatedAt: Date.now()
      }
    };
    await rtdb.ref("principals").set(principalsData);
    console.log("✅ Data Principals berhasil dimuat.");
    
    console.log("🎉 Seeding Selesai!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Gagal seeding data:", error);
    process.exit(1);
  }
}

seedData();
