import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import fs from 'fs';

const serviceAccount = JSON.parse(fs.readFileSync('./service-account.json', 'utf8'));

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
    databaseURL: 'https://kompas-5f0b4-default-rtdb.asia-southeast1.firebasedatabase.app'
  });
}

const db = getDatabase();

async function check() {
  const snap1 = await db.ref('active_devices/smpn3_pacet').once('value');
  const d1 = snap1.val() || {};
  for (const [k, v] of Object.entries(d1)) {
    if (v.name?.toLowerCase().includes('nilasari')) {
      console.log('=== PUTRI EKA NILASARI DEVICE ===');
      console.log('Device ID:', k);
      console.log(JSON.stringify(v, null, 2));
    }
  }
}

check().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
