const { initializeApp, cert } = require('firebase-admin/app');
const { getDatabase } = require('firebase-admin/database');
const serviceAccount = require('../service-account.json');

initializeApp({
  credential: cert(serviceAccount),
  databaseURL: 'https://kompas-5f0b4-default-rtdb.asia-southeast1.firebasedatabase.app'
});

async function deleteGarbage() {
  try {
    console.log('Menghapus data sampah (smpn_3_pacet)...');
    const db = getDatabase();
    
    // Hapus dari tabel schools
    await db.ref('schools/smpn_3_pacet').remove();
    console.log('✅ Berhasil dihapus dari schools.');
    
    // Hapus dari tabel lain jika ada relasinya
    await db.ref('school_settings/smpn_3_pacet').remove();
    
    console.log('✅ Selesai bersih-bersih!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Gagal:', error.message);
    process.exit(1);
  }
}

deleteGarbage();
