const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const serviceAccount = require('../service-account.json');

// Inisialisasi Firebase Admin dengan modular API (v10+)
initializeApp({
  credential: cert(serviceAccount)
});

const email = process.argv[2];

if (!email) {
  console.error("❌ Harap masukkan email! \nContoh penggunaan: node set-super-admin.js mikoewp1982@gmail.com");
  process.exit(1);
}

async function setSuperAdmin() {
  try {
    console.log(`Mencari pengguna dengan email: ${email} ...`);
    const auth = getAuth();
    const user = await auth.getUserByEmail(email);
    
    console.log(`Menambahkan status 'super_admin' ke UID: ${user.uid} ...`);
    await auth.setCustomUserClaims(user.uid, { role: 'super_admin' });
    
    console.log(`✅ BERHASIL! Akses Super Admin telah diberikan kepada: ${email}`);
    console.log(`Silakan logout dan login kembali di web agar status baru terdeteksi.`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Gagal:", error.message);
    if (error.code === 'auth/user-not-found') {
      console.log("Pastikan Anda sudah mendaftar (Sign Up) di web atau Firebase Console terlebih dahulu.");
    }
    process.exit(1);
  }
}

setSuperAdmin();
