const { initializeApp, cert } = require("firebase-admin/app");
const { getDatabase } = require("firebase-admin/database");
const serviceAccount = require("./service-account.json");

const app = initializeApp({
  credential: cert(serviceAccount),
  databaseURL: "https://kompas-5f0b4-default-rtdb.asia-southeast1.firebasedatabase.app"
});

const db = getDatabase(app);

async function unlockAll() {
  console.log("Mencari semua sekolah untuk memberikan kode uninstall '123456'...");
  
  const schoolsSnapshot = await db.ref("schools").once("value");
  const schools = schoolsSnapshot.val() || {};
  
  const updates = {};
  const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 jam
  
  for (const schoolId of Object.keys(schools)) {
    updates[`schools/${schoolId}/uninstallAccess`] = {
      code: "123456",
      expiresAt: expiresAt,
      createdByUid: "system-recovery",
      updatedAt: Date.now()
    };
  }
  
  updates[`schools//uninstallAccess`] = {
    code: "123456",
    expiresAt: expiresAt,
    createdByUid: "system-recovery",
    updatedAt: Date.now()
  };

  await db.ref().update(updates);
  console.log("Berhasil! Gunakan kode '123456' di HP untuk melakukan uninstall.");
  process.exit(0);
}

unlockAll().catch(console.error);
