const { initializeApp, cert } = require('firebase-admin/app');
const { getDatabase } = require('firebase-admin/database');
const fs = require('fs');
const path = require('path');
const serviceAccount = require('../service-account.json');

initializeApp({
  credential: cert(serviceAccount),
  databaseURL: 'https://kompas-5f0b4-default-rtdb.asia-southeast1.firebasedatabase.app'
});

async function deployRules() {
  try {
    console.log('Membaca file database.rules.json...');
    const rulesPath = path.join(__dirname, '..', 'database.rules.json');
    const rulesSource = fs.readFileSync(rulesPath, 'utf8');

    console.log('Mengirim aturan (rules) ke Firebase Realtime Database...');
    const db = getDatabase();
    await db.setRules(rulesSource);

    console.log('✅ BERHASIL! Aturan database (Security Rules) telah di-deploy.');
    process.exit(0);
  } catch (error) {
    console.error('❌ GAGAL deploy rules:', error.message);
    process.exit(1);
  }
}

deployRules();
