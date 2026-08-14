const { initializeApp, cert } = require("firebase-admin/app");
const { getDatabase } = require("firebase-admin/database");
const serviceAccount = require("./service-account.json");

const app = initializeApp({
  credential: cert(serviceAccount),
  databaseURL: "https://kompas-5f0b4-default-rtdb.asia-southeast1.firebasedatabase.app"
});

const db = getDatabase(app);

async function clearBinding() {
  console.log("Menghapus binding untuk NISN 123456 secara global...");
  
  const nisn = "123456";
  const updates = {};
  
  // 1. Bersihkan di root students
  updates[`master_students/${nisn}/deviceId`] = null;
  updates[`master_students/${nisn}/device`] = null;
  updates[`students/${nisn}/device_uuid`] = null;
  updates[`students/${nisn}/device`] = null;
  updates[`students/${nisn}/deviceId`] = null;

  // 2. Bersihkan di seluruh schools
  const schoolsSnap = await db.ref("gas/schools").once("value");
  const schools = schoolsSnap.val() || {};
  
  for (const schoolId of Object.keys(schools)) {
    const students = schools[schoolId].students || {};
    for (const [studentId, data] of Object.entries(students)) {
      if (data.nisn === nisn) {
        updates[`gas/schools/${schoolId}/students/${studentId}/deviceId`] = null;
        updates[`gas/schools/${schoolId}/students/${studentId}/device`] = null;
        updates[`gas/schools/${schoolId}/students/${studentId}/device_uuid`] = null;
      }
    }
  }

  // 3. Bersihkan legacy schools structure
  const legacySchoolsSnap = await db.ref("schools").once("value");
  const legacySchools = legacySchoolsSnap.val() || {};
  for (const schoolId of Object.keys(legacySchools)) {
    const students = legacySchools[schoolId].students || {};
    for (const [studentId, data] of Object.entries(students)) {
      if (data.nisn === nisn) {
        updates[`schools/${schoolId}/students/${studentId}/deviceId`] = null;
        updates[`schools/${schoolId}/students/${studentId}/device`] = null;
        updates[`schools/${schoolId}/students/${studentId}/device_uuid`] = null;
      }
    }
  }

  await db.ref().update(updates);
  console.log("Berhasil menghapus binding untuk NISN 123456 di semua node!");
  process.exit(0);
}

clearBinding().catch(console.error);
