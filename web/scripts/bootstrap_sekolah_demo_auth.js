const { initializeApp, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getDatabase } = require("firebase-admin/database");
const serviceAccount = require("../service-account.json");

const app = initializeApp({
  credential: cert(serviceAccount),
  databaseURL: "https://kompas-5f0b4-default-rtdb.asia-southeast1.firebasedatabase.app"
});

const auth = getAuth(app);
const db = getDatabase(app);

async function bootstrapAuth() {
  const email = "99999999@edulock.local";
  const password = "admin123";
  const schoolId = "sekolah_demo";
  const npsn = "99999999";
  const schoolName = "SEKOLAH DEMO & SANDBOX (LAB UJI COBA)";

  console.log(`Menyiapkan akun Firebase Auth untuk ${email}...`);

  let userRecord;
  try {
    userRecord = await auth.getUserByEmail(email);
    console.log(`Akun ${email} sudah ada (UID: ${userRecord.uid}), mengupdate password dan claims...`);
    await auth.updateUser(userRecord.uid, {
      password: password,
      emailVerified: true
    });
  } catch (err) {
    if (err.code === "auth/user-not-found") {
      console.log(`Membuat akun baru ${email}...`);
      userRecord = await auth.createUser({
        email: email,
        password: password,
        emailVerified: true,
        displayName: "Admin Sekolah Demo"
      });
    } else {
      throw err;
    }
  }

  // Set custom claims
  await auth.setCustomUserClaims(userRecord.uid, {
    role: "admin",
    schoolId: schoolId,
    npsn: npsn,
    schoolName: schoolName,
    mustChangePassword: false
  });

  // Pastikan profile admin terdaftar di RTDB admin_profiles jika diperlukan
  await db.ref(`admin_profiles/${userRecord.uid}`).set({
    email: email,
    schoolId: schoolId,
    npsn: npsn,
    schoolName: schoolName,
    role: "admin",
    createdAt: Date.now(),
    updatedAt: Date.now()
  });

  console.log("=== AKUN ADMIN SEKOLAH DEMO BERHASIL DISIAPKAN ===");
  console.log("Username (NPSN) : 99999999");
  console.log("Password        : admin123");
  console.log("Email Sistem    : 99999999@edulock.local");
  console.log("Role            : admin");
  console.log("School ID       : sekolah_demo");
  process.exit(0);
}

bootstrapAuth().catch(err => {
  console.error("Gagal bootstrap auth:", err);
  process.exit(1);
});
